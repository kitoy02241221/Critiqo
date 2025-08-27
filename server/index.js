// server.js
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const openid = require('openid');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fetchPkg = require('node-fetch');

const app = express();

// ====== Конфигурация ======
const PORT = process.env.PORT || 5000;
const ADMIN_STEAM_ID = process.env.ADMIN_STEAM_ID || "76561199838029880";
const BASE_URL = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const FRONTEND_ORIGIN = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').replace(/\/$/, '');
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !process.env.SESSION_SECRET) {
  console.error('❌ Missing required env: SUPABASE_URL / SUPABASE_SERVICE_KEY / SESSION_SECRET');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

if (typeof globalThis.fetch !== 'function') globalThis.fetch = fetchPkg;

if (NODE_ENV === 'production') app.set('trust proxy', 1);

// ====== CORS ======
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (origin === FRONTEND_ORIGIN) return cb(null, true);
    if (NODE_ENV !== 'production' && origin.startsWith('http://localhost')) return cb(null, true);
    return cb(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());

// ====== Сессии ======
const isProd = NODE_ENV === 'production';
app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
  }
}));

app.use(express.json());

// ====== Лог запросasdов ======   
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - authUid: ${req.session?.authUid || 'none'}`);
  next();
});

// ====== Steam OpenID ======
const relyingParty = new openid.RelyingParty(
  `${BASE_URL}/auth/steam/return`,
  null,
  true,
  false,
  []
);

// ====== Роуты ======

// Steam login
app.get('/auth/steam', (req, res) => {
  relyingParty.authenticate('https://steamcommunity.com/openid', false, (err, authUrl) => {
    if (err || !authUrl) return res.status(500).send('Steam авторизация недоступна.');
    res.redirect(authUrl);
  });
});

// Steam callback
app.get('/auth/steam/return', (req, res) => {
  relyingParty.verifyAssertion(req, async (err, result) => {
    if (err || !result?.authenticated) return res.redirect(`${BASE_URL}/?error=auth_failed`);

    const steamId = (result.claimedIdentifier || '').split('/').pop();
    if (!steamId) return res.redirect(`${BASE_URL}/?error=invalid_steamid`);

    try {
      const { data: users, error: fetchError } = await supabase
        .from('Users')
        .select('auth_uid, steam_id')
        .eq('steam_id', steamId)
        .limit(1);

      if (fetchError) throw fetchError;

      let authUid;
      if (users?.length) {
        authUid = users[0].auth_uid;
        await supabase.from('Users').update({ last_login: new Date().toISOString() }).eq('auth_uid', authUid);
      } else {
        const { data: newUser, error: insertError } = await supabase
          .from('Users')
          .insert({ steam_id: steamId, created_at: new Date().toISOString(), last_login: new Date().toISOString() })
          .select()
          .single();
        if (insertError) throw insertError;
        authUid = newUser.auth_uid;
      }

      req.session.authUid = authUid;
      req.session.steamId = steamId;

      req.session.save(saveErr => {
        if (saveErr) return res.redirect(`${BASE_URL}/?error=session_save_failed`);
        res.redirect(`${FRONTEND_ORIGIN}/?id=${steamId}`);
      });
    } catch (dbErr) {
      console.error(dbErr);
      res.redirect(`${BASE_URL}/?error=db_error`);
    }
  });
});

// ====== Проверка аутентификации ======
app.get('/check-auth', (req, res) => res.json({ authenticated: !!req.session.authUid }));
app.get('/take-session-auth_id', (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Не авторизован' });
  res.json({ authUid: req.session.authUid });
});

// ====== Работа с пользователем ======
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
  } catch {
    res.json({ isLoggedIn: false });
  }
});

// Логика increment / update / get для пользователей
const incField = (field) => async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Не авторизован' });
  try {
    const { data, error } = await supabase.from('Users').select(field).eq('auth_uid', req.session.authUid).single();
    if (error) throw error;
    const newValue = (data?.[field] ?? 0) + 1;
    const { error: updateError } = await supabase.from('Users').update({ [field]: newValue }).eq('auth_uid', req.session.authUid);
    if (updateError) throw updateError;
    res.json({ success: true, newValue });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
app.post('/increment-application', incField('complite_aplication'));
app.post('/increment-num-application', incField('numAplication'));
app.get('/num-application', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Не авторизован' });
  try {
    const { data } = await supabase.from('Users').select('numAplication').eq('auth_uid', req.session.authUid).single();
    res.json({ numAplication: data?.numAplication ?? 0 });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
app.get('/complite-aplication', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Не авторизован' });
  try {
    const { data } = await supabase.from('Users').select('complite_aplication').eq('auth_uid', req.session.authUid).single();
    res.json({ complite_aplication: data?.complite_aplication ?? 0 });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ====== Прочие апи ======
app.put('/update-name', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Не авторизован' });
  const { name } = req.body;
  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Неверное имя' });
  try {
    const { data, error } = await supabase.from('Users').update({ name }).eq('auth_uid', req.session.authUid).select().single();
    if (error) throw error;
    res.json({ success: true, name: data.name });
  } catch {
    res.status(500).json({ error: 'Не удалось обновить имя' });
  }
});

app.put('/update-profile-image', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Не авторизован' });
  const { imageUrl } = req.body;
  if (!imageUrl || typeof imageUrl !== 'string') return res.status(400).json({ error: 'Неверный URL' });
  try {
    const { data, error } = await supabase.from('Users').update({ profile_image: imageUrl }).eq('auth_uid', req.session.authUid).select().single();
    if (error) throw error;
    res.json({ success: true, profile_image: data.profile_image });
  } catch {
    res.status(500).json({ error: 'Не удалось обновить аватарку' });
  }
});

app.get('/take-name', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Не авторизован' });
  try {
    const { data } = await supabase.from('Users').select('name').eq('auth_uid', req.session.authUid).single();
    res.json({ name: data?.name ?? null });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/get-user', (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Не авторизован' });
  res.json({ user_auth_uid: req.session.authUid });
});

// OpenDota API
app.get('/match/:id/opendota', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Неверный match_id' });
  try {
    const response = await fetch(`https://api.opendota.com/api/matches/${id}`);
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('sid', { secure: isProd, httpOnly: true, sameSite: isProd ? 'none' : 'lax' });
    res.redirect(FRONTEND_ORIGIN);
  });
});

// Healthcheck
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// ====== Старт ======
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} (env: ${NODE_ENV})`);
});