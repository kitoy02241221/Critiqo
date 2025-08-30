// server.js

// === Локальная загрузка .env ===
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';

try {
  require('dotenv').config({ path: path.resolve(__dirname, envFile) });
  console.log(`📦 env загружен из ${envFile}`);
} catch {
  console.log(`⚠️ dotenv не найден (${envFile})`);
}

// === Зависимости ===
const express = require('express');
const session = require('express-session');
const openid = require('openid');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fetch = require('node-fetch'); // Для Node < 18

// === Локальная загрузка .env ===
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// === Конфиг из ENV ===
const PORT = process.env.PORT || 5000;
const ADMIN_STEAM_ID = "76561199838029880";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const sessionSecret = process.env.SESSION_SECRET;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
const BASE_URL = process.env.BASE_URL;
const FRONTEND_PATH = process.env.FRONTEND_PATH;

if (!supabaseUrl || !supabaseKey || !sessionSecret || !BASE_URL || !FRONTEND_ORIGIN) {
  console.error('❌ Missing required config: SUPABASE_URL, SUPABASE_KEY, SESSION_SECRET, BASE_URL, FRONTEND_ORIGIN');
  process.exit(1);
}

// === Supabase client ===
const supabase = createClient(supabaseUrl, supabaseKey);

// === Express app ===
const app = express();

// Render/прокси: чтобы secure cookies работали корректно
app.set('trust proxy', 1);

// === Логирование env без утечек секретов ===
console.log('ENV CHECK:');
console.log('SUPABASE_URL length:', supabaseUrl.length);
console.log('SUPABASE_KEY exists:', !!supabaseKey);
console.log('SESSION_SECRET exists:', !!sessionSecret);
console.log('BASE_URL:', BASE_URL);
console.log('FRONTEND_ORIGIN:', FRONTEND_ORIGIN);

// === CORS ===
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());

// === JSON парсер ===
app.use(express.json());

// === Сессии ===
app.use(session({
  name: 'sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // https только в продакшене
    httpOnly: true,
    sameSite: 'none', // для кросс-доменных куки
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 дней
  }
}));

// === Лог запросов и сессий ===
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | authUid: ${req.session?.authUid || 'none'}`);
  next();
});

// === Steam OpenID ===
const relyingParty = new openid.RelyingParty(
  `${BASE_URL}/auth/steam/return`,
  null,
  true,
  false,
  []
);

app.get('/auth/steam', (req, res) => {
  relyingParty.authenticate('https://steamcommunity.com/openid', false, (err, authUrl) => {
    if (err || !authUrl) {
      console.error('Steam OpenID error:', err);
      return res.status(500).send('Steam авторизация недоступна.');
    }
    res.redirect(authUrl);
  });
});

app.get('/auth/steam/return', async (req, res) => {
  relyingParty.verifyAssertion(req, async (err, result) => {
    if (err || !result?.authenticated) {
      console.error('Steam verification failed:', err);
      return res.redirect(`${BASE_URL}/?error=auth_failed`);
    }

    const claimed = result.claimedIdentifier || '';
    const steamId = claimed.split('/').pop();
    if (!steamId) {
      console.error('Invalid Steam ID:', claimed);
      return res.redirect(`${BASE_URL}/?error=invalid_steamid`);
    }

    try {
      // Проверяем пользователя в БД
      const { data: existingUsers, error: fetchError } = await supabase
        .from('Users')
        .select('auth_uid, steam_id')
        .eq('steam_id', steamId)
        .limit(1);

      if (fetchError) throw fetchError;

      let authUid;
      if (existingUsers?.length > 0) {
        // Уже существует → обновляем last_login
        authUid = existingUsers[0].auth_uid;
        await supabase.from('Users')
          .update({ last_login: new Date().toISOString() })
          .eq('auth_uid', authUid);
      } else {
        // Новый пользователь → создаём
        const { data: newUser, error: insertError } = await supabase
          .from('Users')
          .insert([{
            steam_id: steamId,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          }])
          .select()
          .single();
        if (insertError) throw insertError;
        authUid = newUser.auth_uid;
      }

      // Сохраняем в сессию
      req.session.authUid = authUid;
      req.session.steamId = steamId;

      req.session.save(err => {
        if (err) {
          console.error('Session save error:', err);
          return res.redirect(`${BASE_URL}/?error=session_save_failed`);
        }
        // ✅ Всегда редиректим на главную страницу фронта
        res.redirect(`${FRONTEND_ORIGIN}${FRONTEND_PATH}`);
      });

    } catch (dbErr) {
      console.error('Database error:', dbErr);
      res.redirect(`${BASE_URL}/?error=db_error`);
    }
  });
});

// === Auth routes ===
app.get('/check-auth', (req, res) => {
  res.json({ authenticated: !!req.session.authUid });
});

app.get('/take-session-auth_id', (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Не авторизован' });
  res.json({ authUid: req.session.authUid });
});

// === User profile routes ===
app.get('/take-name', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Не авторизован' });
  try {
    const { data, error } = await supabase.from('Users').select('name').eq('auth_uid', req.session.authUid).single();
    if (error) throw error;
    res.json({ name: data?.name ?? null });
  } catch (err) {
    console.error('Get name error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/update-name', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Не авторизован' });
  const { name } = req.body;
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
    console.error('Update name error:', err);
    res.status(500).json({ error: 'Не удалось обновить имя' });
  }
});

// === Increment counters ===
const incrementField = (field) => async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Не авторизован' });

  try {
    const { data: userData } = await supabase.from('Users').select(field).eq('auth_uid', req.session.authUid).single();
    const current = userData?.[field] ?? 0;
    const newValue = current + 1;
    await supabase.from('Users').update({ [field]: newValue }).eq('auth_uid', req.session.authUid);
    res.json({ success: true, newValue });
  } catch (err) {
    console.error(`Ошибка при обновлении ${field}:`, err);
    res.status(500).json({ error: `Не удалось обновить ${field}` });
  }
};

app.post('/increment-num-application', incrementField('numAplication'));
app.get('/num-application', incrementField('numAplication'));

app.post('/increment-application', incrementField('complite_aplication'));
app.get('/complite-aplication', incrementField('complite_aplication'));

// === User info ===
app.get('/me', async (req, res) => {
  if (!req.session.authUid) return res.json({ isLoggedIn: false });

  try {
    const { data: user } = await supabase
      .from('Users')
      .select('auth_uid, steam_id, created_at, last_login')
      .eq('auth_uid', req.session.authUid)
      .single();

    if (!user) return res.json({ isLoggedIn: false });

    res.json({
      isLoggedIn: true,
      steamId: user.steam_id,
      isAdmin: user.steam_id === ADMIN_STEAM_ID,
      createdAt: user.created_at,
      lastLogin: user.last_login
    });
  } catch (err) {
    console.error('Error /me:', err);
    res.json({ isLoggedIn: false });
  }
});

// === Logout ===
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('sid', { secure: true, httpOnly: true, sameSite: 'none' });
    res.redirect(`${FRONTEND_ORIGIN}${FRONTEND_PATH}`);
  });
});

// === OpenDota proxy ===
app.get('/match/:id/opendota', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Не передан match_id' });

  try {
    const response = await fetch(`https://api.opendota.com/api/matches/${id}`);
    if (!response.ok) return res.status(502).json({ error: 'Ошибка OpenDota' });
    const rawData = await response.json();
    res.json(rawData);
  } catch (err) {
    console.error('OpenDota error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// === Update profile image ===
app.put('/update-profile-image', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Не авторизован' });
  const { imageUrl } = req.body;
  if (!imageUrl || typeof imageUrl !== 'string') return res.status(400).json({ error: 'Неверный URL' });

  try {
    const { data } = await supabase
      .from('Users')
      .update({ profile_image: imageUrl })
      .eq('auth_uid', req.session.authUid)
      .select()
      .single();

    res.json({ success: true, profile_image: data.profile_image });
  } catch (err) {
    console.error('Update profile image error:', err);
    res.status(500).json({ error: 'Не удалось обновить аватарку' });
  }
});

// === Misc routes ===
app.get('/get-user', (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ message: 'Не авторизован' });
  res.json({ user_auth_uid: req.session.authUid });
});

app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// === Start server ===
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});