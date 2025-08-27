// server.js
// Если запускаешь локально — раскомментируй .env
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const openid = require('openid');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fetch = require('node-fetch'); // В Node 18+ есть глобальный fetch, но оставим для совместимости.

const app = express();

// === Конфиг из ENV ===
const PORT = process.env.PORT || 5000;
const ADMIN_STEAM_ID = "76561199838029880";
const BASE_URL = process.env.BASE_URL || 'https://critiqo-backend.up.railway.app';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://kitoy02241221.github.io';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !process.env.SESSION_SECRET) {
  console.error('❌ Missing required env: SUPABASE_URL / SUPABASE_SERVICE_KEY / SESSION_SECRET');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Railway/прокси: нужно, чтобы secure-cookies работали корректно
app.set('trust proxy', 1);

// === Логи ENV (без утечек значений) ===
console.log("ENV CHECK:");
console.log("SUPABASE_URL length:", process.env.SUPABASE_URL.length);
console.log("SUPABASE_SERVICE_KEY exists:", !!process.env.SUPABASE_SERVICE_KEY);
console.log("SESSION_SECRET exists:", !!process.env.SESSION_SECRET);
console.log("BASE_URL:", BASE_URL);
console.log("FRONTEND_ORIGIN:", FRONTEND_ORIGIN);

// === CORS (разрешаем кросс-доменные куки) ===
const corsOptions = {
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
// Явно отвечаем на preflight
app.options('*', cors(corsOptions));

app.use(express.json());

// === СЕССИЯ ===
// Важно: sameSite:'none' + secure:true + trust proxy выше
app.use(session({
  name: 'sid', // своё имя куки, чтобы отличать от дефолтного connect.sid
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,        // требуется HTTPS
    httpOnly: true,      // кука не доступна JS
    sameSite: 'none',    // чтобы кука ехала между доменами (github.io → railway.app)
    // domain: НЕ указываем — пусть будет хост Railway; так надёжнее.
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 дней
  }
}));

// Простой лог запросов и наличия сессии
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url} | authUid: ${req.session?.authUid || 'none'}`);
  next();
});

// === Steam OpenID ===
const relyingParty = new openid.RelyingParty(
  `${BASE_URL}/auth/steam/return`, // returnUrl
  null,   // realm (можно null)
  true,   // stateless
  false,  // strict mode
  []      // extensions
);

app.get('/auth/steam', (req, res) => {
  relyingParty.authenticate('https://steamcommunity.com/openid', false, (err, authUrl) => {
    if (err || !authUrl) {
      console.error('Ошибка Steam OpenID:', err);
      return res.status(500).send('Steam авторизация недоступна.');
    }
    res.redirect(authUrl);
  });
});

app.get('/auth/steam/return', async (req, res) => {
  relyingParty.verifyAssertion(req, async (err, result) => {
    if (err || !result?.authenticated) {
      console.error('Ошибка подтверждения Steam:', err);
      return res.redirect(`${BASE_URL}/?error=auth_failed`);
    }

    // Защита от странных ответов
    const claimed = result.claimedIdentifier || '';
    const steamId = claimed.split('/').pop();
    if (!steamId) {
      console.error('Не удалось извлечь steamId из claimedIdentifier:', claimed);
      return res.redirect(`${BASE_URL}/?error=invalid_steamid`);
    }

    try {
      const { data: existingUsers, error: fetchError } = await supabase
        .from('Users')
        .select('auth_uid, steam_id')
        .eq('steam_id', steamId)
        .limit(1);

      if (fetchError) throw fetchError;

      let authUid;

      if (existingUsers && existingUsers.length > 0) {
        authUid = existingUsers[0].auth_uid;
        const { error: updateError } = await supabase
          .from('Users')
          .update({ last_login: new Date().toISOString() })
          .eq('auth_uid', authUid);
        if (updateError) throw updateError;
        console.log(`🔄 Пользователь ${steamId} найден, обновлён last_login`);
      } else {
        const { data: newUser, error: insertError } = await supabase
          .from('Users')
          .insert([{ steam_id: steamId, created_at: new Date().toISOString(), last_login: new Date().toISOString() }])
          .select()
          .single();
        if (insertError) throw insertError;
        authUid = newUser.auth_uid;
        console.log(`✅ Новый пользователь ${steamId} создан`);
      }

      req.session.authUid = authUid;
      req.session.steamId = steamId;

      req.session.save(err => {
        if (err) {
          console.error("Ошибка сохранения сессии:", err);
          return res.redirect(`${BASE_URL}/?error=session_save_failed`);
        }
        // Можно редиректить на фронт, если хочешь, но ты используешь корень бэкенда
        res.redirect(`${BASE_URL}/?id=${steamId}`);
      });
    } catch (dbErr) {
      console.error("Ошибка работы с базой:", dbErr);
      res.redirect(`${BASE_URL}/?error=db_error`);
    }
  });
});

// === Авторизация и сессия ===
app.get('/check-auth', (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ authenticated: false });
  res.json({ authenticated: true });
});

app.get('/take-session-auth_id', (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Пользователь не авторизован' });
  res.json({ authUid: req.session.authUid });
});

app.get('/take-name', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Пользователь не авторизован' });

  try {
    const { data, error } = await supabase
      .from('Users')
      .select('name')
      .eq('auth_uid', req.session.authUid)
      .single();
    if (error) throw error;

    res.json({ name: data?.name ?? null });
  } catch (err) {
    console.error('Ошибка при получении имени:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/update-name', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Пользователь не авторизован' });

  const { name } = req.body || {};
  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Неверное имя' });

  try {
    const { data, error } = await supabase
      .from('Users')
      .update({ name })
      .eq('auth_uid', req.session.authUid)
      .select()
      .single();
    if (error) throw error;

    res.json({ success: true, name: data.name });
  } catch (err) {
    console.error('Ошибка при обновлении имени:', err);
    res.status(500).json({ error: 'Не удалось обновить имя' });
  }
});

// === Инкременты и получение данных пользователя ===
app.post('/increment-num-application', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Пользователь не авторизован' });

  try {
    const { data: userData, error: fetchError } = await supabase
      .from('Users')
      .select('numAplication')
      .eq('auth_uid', req.session.authUid)
      .single();
    if (fetchError) throw fetchError;

    const current = userData?.numAplication ?? 0;
    const newValue = current + 1;

    const { error: updateError } = await supabase
      .from('Users')
      .update({ numAplication: newValue })
      .eq('auth_uid', req.session.authUid);
    if (updateError) throw updateError;

    res.json({ success: true, newValue });
  } catch (err) {
    console.error('Ошибка при обновлении numAplication:', err);
    res.status(500).json({ error: 'Не удалось обновить значение' });
  }
});

app.get('/num-application', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Пользователь не авторизован' });

  try {
    const { data, error } = await supabase
      .from('Users')
      .select('numAplication')
      .eq('auth_uid', req.session.authUid)
      .single();
    if (error) throw error;

    res.json({ numAplication: data?.numAplication ?? 0 });
  } catch (err) {
    console.error('Ошибка при получении numAplication:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/me', async (req, res) => {
  if (!req.session.authUid) return res.json({ isLoggedIn: false });

  try {
    const { data: user, error } = await supabase
      .from('Users')
      .select('auth_uid, steam_id, created_at, last_login')
      .eq('auth_uid', req.session.authUid)
      .single();
    if (error || !user) return res.json({ isLoggedIn: false });

    res.json({
      isLoggedIn: true,
      steamId: user.steam_id,
      isAdmin: user.steam_id === ADMIN_STEAM_ID,
      createdAt: user.created_at,
      lastLogin: user.last_login
    });
  } catch (err) {
    console.error('Ошибка /me:', err);
    res.json({ isLoggedIn: false });
  }
});

app.get('/logout', (req, res) => {
  // Чистим сессию + куку с теми же флагами
  req.session.destroy(() => {
    res.clearCookie('sid', {
      secure: true,
      httpOnly: true,
      sameSite: 'none'
    });
    res.redirect(`${BASE_URL}/`);
  });
});

// Инкремент complite_aplication
app.post('/increment-application', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Пользователь не авторизован' });

  try {
    const { data: userData, error: fetchError } = await supabase
      .from('Users')
      .select('complite_aplication')
      .eq('auth_uid', req.session.authUid)
      .single();
    if (fetchError) throw fetchError;

    const current = userData?.complite_aplication ?? 0;
    const newValue = current + 1;

    const { error: updateError } = await supabase
      .from('Users')
      .update({ complite_aplication: newValue })
      .eq('auth_uid', req.session.authUid);
    if (updateError) throw updateError;

    res.json({ success: true, newValue });
  } catch (err) {
    console.error('Ошибка при обновлении complite_aplication:', err);
    res.status(500).json({ error: 'Не удалось обновить значение' });
  }
});

// Получение complite_aplication
app.get('/complite-aplication', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Пользователь не авторизован' });

  try {
    const { data, error } = await supabase
      .from('Users')
      .select('complite_aplication')
      .eq('auth_uid', req.session.authUid)
      .single();
    if (error) throw error;

    res.json({ complite_aplication: data?.complite_aplication ?? 0 });
  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Проксируем OpenDota (простой forward)
app.get('/match/:id/opendota', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Не передан match_id или неверный формат' });
  }

  try {
    const response = await fetch(`https://api.opendota.com/api/matches/${id}`);
    if (!response.ok) {
      return res.status(502).json({ error: 'Ошибка при запросе к OpenDota' });
    }
    const rawData = await response.json();
    res.json(rawData);
  } catch (err) {
    console.error("Серверная ошибка:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Обновление аватарки
app.put('/update-profile-image', async (req, res) => {
  if (!req.session.authUid) {
    return res.status(401).json({ error: 'Пользователь не авторизован' });
  }

  const { imageUrl } = req.body || {};
  if (!imageUrl || typeof imageUrl !== 'string') {
    return res.status(400).json({ error: 'Неверный URL изображения' });
  }

  try {
    const { data, error } = await supabase
      .from('Users')
      .update({ profile_image: imageUrl })
      .eq('auth_uid', req.session.authUid)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, profile_image: data.profile_image });
  } catch (err) {
    console.error('Ошибка при обновлении аватарки:', err);
    res.status(500).json({ error: 'Не удалось обновить аватарку' });
  }
});

app.get("/get-user", (req, res) => {
  if (!req.session.authUid) {
    return res.status(401).json({ message: "Не авторизован" });
  }
  res.json({ user_auth_uid: req.session.authUid });
});

// Healthcheck для Railway
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// === React build (если когда-то переедешь на один домен) ===
// const clientBuildPath = path.join(__dirname, '../client/build');
// app.use(express.static(clientBuildPath));
// app.get('*', (req, res) => {
//   res.sendFile(path.join(clientBuildPath, 'index.html'));
// });

// === Start server ===
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});