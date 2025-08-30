// server.js
const path = require('path');
const express = require('express');
const session = require('express-session');
const openid = require('openid');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// === ENV ===
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
require('dotenv').config({ path: path.resolve(__dirname, envFile) });

// === Конфиг ===
const PORT = process.env.PORT || 5000;
const ADMIN_STEAM_ID = "76561199838029880";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const sessionSecret = process.env.SESSION_SECRET;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
const BASE_URL = process.env.BASE_URL;
const FRONTEND_PATH = process.env.FRONTEND_PATH;

if (!supabaseUrl || !supabaseKey || !sessionSecret || !BASE_URL || !FRONTEND_ORIGIN) {
  console.error('❌ Missing required config');
  process.exit(1);
}

// === Supabase client ===
const supabase = createClient(supabaseUrl, supabaseKey);

// === Express app ===
const app = express();
app.set('trust proxy', 1); // важно для secure cookies за прокси

const isProd = process.env.NODE_ENV === 'production';

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
    secure: isProd,
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

// === Лог запросов ===
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
    if (err || !authUrl) return res.status(500).send('Steam авторизация недоступна.');
    res.redirect(authUrl);
  });
});

app.get('/auth/steam/return', async (req, res) => {
  relyingParty.verifyAssertion(req, async (err, result) => {
    if (err || !result?.authenticated) return res.redirect(`${BASE_URL}/?error=auth_failed`);

    const steamId = result.claimedIdentifier.split('/').pop();
    if (!steamId) return res.redirect(`${BASE_URL}/?error=invalid_steamid`);

    try {
      // Проверяем пользователя в БД
      const { data: existingUsers } = await supabase
        .from('Users')
        .select('auth_uid')
        .eq('steam_id', steamId)
        .limit(1);

      let authUid;
      if (existingUsers?.length > 0) {
        authUid = existingUsers[0].auth_uid;
        await supabase.from('Users').update({ last_login: new Date().toISOString() }).eq('auth_uid', authUid);
      } else {
        const { data: newUser } = await supabase.from('Users')
          .insert({
            steam_id: steamId,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          }).select().single();
        authUid = newUser.auth_uid;
      }

      // Сохраняем сессию
      req.session.authUid = authUid;
      req.session.steamId = steamId;

      req.session.save(err => {
        if (err) return res.redirect(`${BASE_URL}/?error=session_save_failed`);
        res.redirect(`${FRONTEND_ORIGIN}${FRONTEND_PATH}`);
      });

    } catch (dbErr) {
      console.error(dbErr);
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
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/update-name', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Не авторизован' });
  const { name } = req.body;
  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Неверное имя' });
  try {
    const { data, error } = await supabase.from('Users').update({ name }).eq('auth_uid', req.session.authUid).select().single();
    if (error) throw error;
    res.json({ success: true, name: data.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось обновить имя' });
  }
});

// === Increment fields ===
const incrementField = (field) => async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Не авторизован' });
  try {
    const { data: userData } = await supabase.from('Users').select(field).eq('auth_uid', req.session.authUid).single();
    const current = userData?.[field] ?? 0;
    const newValue = current + 1;
    await supabase.from('Users').update({ [field]: newValue }).eq('auth_uid', req.session.authUid);
    res.json({ success: true, newValue });
  } catch (err) {
    console.error(err);
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
    const { data: user } = await supabase.from('Users').select('steam_id, created_at, last_login').eq('auth_uid', req.session.authUid).single();
    res.json({
      isLoggedIn: true,
      steamId: user.steam_id,
      isAdmin: user.steam_id === ADMIN_STEAM_ID,
      createdAt: user.created_at,
      lastLogin: user.last_login
    });
  } catch (err) {
    console.error(err);
    res.json({ isLoggedIn: false });
  }
});

// === Update profile image ===
app.put('/update-profile-image', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Не авторизован' });
  const { imageUrl } = req.body;
  if (!imageUrl || typeof imageUrl !== 'string') return res.status(400).json({ error: 'Неверный URL' });
  try {
    const { data } = await supabase.from('Users').update({ profile_image: imageUrl }).eq('auth_uid', req.session.authUid).select().single();
    res.json({ success: true, profile_image: data.profile_image });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось обновить аватарку' });
  }
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
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// === Misc routes ===
app.get('/get-user', (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ message: 'Не авторизован' });
  res.json({ user_auth_uid: req.session.authUid });
});

app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// === Logout ===
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('sid', { secure: isProd, httpOnly: true, sameSite: isProd ? 'none' : 'lax' });
    res.redirect(`${FRONTEND_ORIGIN}${FRONTEND_PATH}`);
  });
});

// === Start server ===
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));