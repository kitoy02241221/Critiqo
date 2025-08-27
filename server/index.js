// server.js
// Для локальной разработки: создайте .env и раскомментируйте строку ниже
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const openid = require('openid');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fetchPkg = require('node-fetch'); // fallback для Node < 18
const path = require('path');

const app = express();

// ====== Конфигурация ======
const PORT = process.env.PORT || 5000;
const ADMIN_STEAM_ID = process.env.ADMIN_STEAM_ID || "76561199838029880";
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000'; // используется только для редиректов/конфигурации внешней интеграции
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'; // по умолчанию локальный фронт
const NODE_ENV = process.env.NODE_ENV || 'development';

// Проверки обязательных env
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !process.env.SESSION_SECRET) {
  console.error('❌ Missing required env: SUPABASE_URL / SUPABASE_SERVICE_KEY / SESSION_SECRET');
  process.exit(1);
}

// Инициализация Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// В Node < 18 не всегда есть fetch глобально — устанавливаем fallback
if (typeof globalThis.fetch !== 'function') {
  globalThis.fetch = fetchPkg;
}

// ====== Proxy & trust proxy ======
// Если используешь Railway / Heroku / другой прокси — в продакшне ставим trust proxy = 1
if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ====== Лог (короткий, полезный) ======
console.log('ENV CHECK:');
console.log(' SUPABASE_URL length:', process.env.SUPABASE_URL?.length || 0);
console.log(' SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);
console.log(' SESSION_SECRET exists:', !!process.env.SESSION_SECRET);
console.log(' BASE_URL:', BASE_URL);
console.log(' FRONTEND_ORIGIN:', FRONTEND_ORIGIN);
console.log(' NODE_ENV:', NODE_ENV);

// ====== CORS ======
// В проде FRONTEND_ORIGIN обычно https://your-gh-pages.github.io
// В деве можно использовать локальный фронт (http://localhost:5173)
const corsOptions = {
  origin: (origin, cb) => {
    // Если запрос без origin (например curl или same-origin), разрешаем.
    if (!origin) return cb(null, true);
    // Разрешаем ровно указанный FRONTEND_ORIGIN
    if (origin === FRONTEND_ORIGIN) return cb(null, true);
    // В dev можно разрешить localhost:5173 если FRONTEND_ORIGIN это localhost
    if (NODE_ENV !== 'production' && origin.startsWith('http://localhost')) return cb(null, true);
    return cb(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// ====== Сессия ======
// Логика:
// - В проде: secure: true и sameSite: 'none' (требуется HTTPS + trust proxy)
// - В деве: secure: false и sameSite: 'lax' (чтобы работало на localhost)
const isProd = NODE_ENV === 'production';
const sessionCookie = {
  secure: isProd,                  // true в проде (HTTPS), false локально
  httpOnly: true,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 дней
  // domain: не указываем — пусть браузер сама определит
};

app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: sessionCookie
}));

// Небольшой middleware-лог
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - authUid: ${req.session?.authUid || 'none'}`);
  next();
});

// ====== Steam OpenID (RelyingParty) ======
// IMPORTANT: returnUrl должен быть публичным URL бэка (BASE_URL) + путь /auth/steam/return
// Это нормально — полный URL для Steam интеграции (не для express роутинга).
const relyingParty = new openid.RelyingParty(
  `${BASE_URL.replace(/\/$/, '')}/auth/steam/return`, // returnUrl
  null,
  true,
  false,
  []
);

// ====== Роуты ======

// 1) Запуск OpenID (редирект на Steam)
app.get('/auth/steam', (req, res) => {
  relyingParty.authenticate('https://steamcommunity.com/openid', false, (err, authUrl) => {
    if (err || !authUrl) {
      console.error('Ошибка Steam OpenID (authenticate):', err);
      return res.status(500).send('Steam авторизация недоступна.');
    }
    res.redirect(authUrl);
  });
});

// 2) Callback от Steam
app.get('/auth/steam/return', (req, res) => {
  relyingParty.verifyAssertion(req, async (err, result) => {
    if (err || !result?.authenticated) {
      console.error('Ошибка подтверждения Steam:', err);
      return res.redirect(`${BASE_URL.replace(/\/$/, '')}/?error=auth_failed`);
    }

    const claimed = result.claimedIdentifier || '';
    const steamId = claimed.split('/').pop();
    if (!steamId) {
      console.error('Не удалось извлечь steamId из claimedIdentifier:', claimed);
      return res.redirect(`${BASE_URL.replace(/\/$/, '')}/?error=invalid_steamid`);
    }

    try {
      // Проверяем и создаём пользователя в Supabase
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
        console.log(`User ${steamId} found; updated last_login`);
      } else {
        const { data: newUser, error: insertError } = await supabase
          .from('Users')
          .insert([{ steam_id: steamId, created_at: new Date().toISOString(), last_login: new Date().toISOString() }])
          .select()
          .single();
        if (insertError) throw insertError;
        authUid = newUser.auth_uid;
        console.log(`New user ${steamId} created`);
      }

      // Сохраняем в сессионную куку
      req.session.authUid = authUid;
      req.session.steamId = steamId;

      req.session.save(saveErr => {
        if (saveErr) {
          console.error('Ошибка сохранения сессии:', saveErr);
          return res.redirect(`${BASE_URL.replace(/\/$/, '')}/?error=session_save_failed`);
        }

        // Редиректим на фронтенд (рекомендуется использовать FRONTEND_ORIGIN)
        // Тут используем FRONTEND_ORIGIN, а не BASE_URL — чтобы фронт сразу получил id в query.
        const redirectTo = `${FRONTEND_ORIGIN.replace(/\/$/, '')}/?id=${steamId}`;
        return res.redirect(redirectTo);
      });
    } catch (dbErr) {
      console.error('Ошибка работы с базой:', dbErr);
      return res.redirect(`${BASE_URL.replace(/\/$/, '')}/?error=db_error`);
    }
  });
});

// === API проверки и юзера ===
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
    const { data, error } = await supabase.from('Users').select('name').eq('auth_uid', req.session.authUid).single();
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
    const { data, error } = await supabase.from('Users').update({ name }).eq('auth_uid', req.session.authUid).select().single();
    if (error) throw error;
    res.json({ success: true, name: data.name });
  } catch (err) {
    console.error('Ошибка при обновлении имени:', err);
    res.status(500).json({ error: 'Не удалось обновить имя' });
  }
});

app.post('/increment-num-application', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Пользователь не авторизован' });
  try {
    const { data: userData, error: fetchError } = await supabase.from('Users').select('numAplication').eq('auth_uid', req.session.authUid).single();
    if (fetchError) throw fetchError;
    const current = userData?.numAplication ?? 0;
    const newValue = current + 1;
    const { error: updateError } = await supabase.from('Users').update({ numAplication: newValue }).eq('auth_uid', req.session.authUid);
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
    const { data, error } = await supabase.from('Users').select('numAplication').eq('auth_uid', req.session.authUid).single();
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
    const { data: user, error } = await supabase.from('Users').select('auth_uid, steam_id, created_at, last_login').eq('auth_uid', req.session.authUid).single();
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
  req.session.destroy(() => {
    // очищаем cookie с теми же флагами, что и устанавливали
    res.clearCookie('sid', {
      secure: sessionCookie.secure,
      httpOnly: true,
      sameSite: sessionCookie.sameSite
    });
    // Редиректим на фронт
    res.redirect(FRONTEND_ORIGIN);
  });
});

app.post('/increment-application', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Пользователь не авторизован' });
  try {
    const { data: userData, error: fetchError } = await supabase.from('Users').select('complite_aplication').eq('auth_uid', req.session.authUid).single();
    if (fetchError) throw fetchError;
    const current = userData?.complite_aplication ?? 0;
    const newValue = current + 1;
    const { error: updateError } = await supabase.from('Users').update({ complite_aplication: newValue }).eq('auth_uid', req.session.authUid);
    if (updateError) throw updateError;
    res.json({ success: true, newValue });
  } catch (err) {
    console.error('Ошибка при обновлении complite_aplication:', err);
    res.status(500).json({ error: 'Не удалось обновить значение' });
  }
});

app.get('/complite-aplication', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Пользователь не авторизован' });
  try {
    const { data, error } = await supabase.from('Users').select('complite_aplication').eq('auth_uid', req.session.authUid).single();
    if (error) throw error;
    res.json({ complite_aplication: data?.complite_aplication ?? 0 });
  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/match/:id/opendota', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Не передан match_id или неверный формат' });
  try {
    const response = await fetch(`https://api.opendota.com/api/matches/${id}`);
    if (!response.ok) return res.status(502).json({ error: 'Ошибка при запросе к OpenDota' });
    const rawData = await response.json();
    res.json(rawData);
  } catch (err) {
    console.error('Серверная ошибка (opendota):', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/update-profile-image', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Пользователь не авторизован' });
  const { imageUrl } = req.body || {};
  if (!imageUrl || typeof imageUrl !== 'string') return res.status(400).json({ error: 'Неверный URL изображения' });
  try {
    const { data, error } = await supabase.from('Users').update({ profile_image: imageUrl }).eq('auth_uid', req.session.authUid).select().single();
    if (error) throw error;
    res.json({ success: true, profile_image: data.profile_image });
  } catch (err) {
    console.error('Ошибка при обновлении аватарки:', err);
    res.status(500).json({ error: 'Не удалось обновить аватарку' });
  }
});

app.get('/get-user', (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ message: 'Не авторизован' });
  res.json({ user_auth_uid: req.session.authUid });
});

// Healthcheck
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// Старт сервера
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} (env: ${NODE_ENV})`);
});