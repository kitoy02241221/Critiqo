require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const session = require('express-session');
const openid = require('openid');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fetch = require('node-fetch'); // убедись, что установлен

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_STEAM_ID = "76561199838029880";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.use(cors({
  origin: "http://localhost:3000", // можно заменить на продакшн URL
  credentials: true
}));

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, sameSite: 'lax' }
}));

app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url} | Session authUid: ${req.session.authUid}`);
  next();
});

// === Отдача фронтенда ===
const clientBuildPath = path.join(__dirname, '../client/build');
app.use(express.static(clientBuildPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// === Steam OpenID ===
const relyingParty = new openid.RelyingParty(
  'http://localhost:5000/auth/steam/return',
  null,
  true,
  false,
  []
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
    if (err || !result.authenticated) {
      console.error('Ошибка подтверждения Steam:', err);
      return res.redirect('http://localhost:3000/?error=auth_failed');
    }

    const steamId = result.claimedIdentifier.split('/').pop();

    try {
      const { data: existingUsers, error: fetchError } = await supabase
        .from('Users')
        .select('*')
        .eq('steam_id', steamId)
        .limit(1);

      if (fetchError) throw fetchError;

      let authUid;

      if (existingUsers.length > 0) {
        authUid = existingUsers[0].auth_uid;
        const { error: updateError } = await supabase
          .from('Users')
          .update({ last_login: new Date() })
          .eq('auth_uid', authUid);
        if (updateError) throw updateError;
        console.log(`🔄 Пользователь ${steamId} найден, обновлён last_login`);
      } else {
        const { data: newUser, error: insertError } = await supabase
          .from('Users')
          .insert([{ steam_id: steamId, created_at: new Date(), last_login: new Date() }])
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
          return res.redirect('http://localhost:3000/?error=session_save_failed');
        }
        res.redirect(`http://localhost:3000/?id=${steamId}`);
      });
    } catch (dbErr) {
      console.error("Ошибка работы с базой:", dbErr);
      res.redirect('http://localhost:3000/?error=db_error');
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

    res.json({ name: data.name || null });
  } catch (err) {
    console.error('Ошибка при получении имени:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/update-name', async (req, res) => {
  if (!req.session.authUid) return res.status(401).json({ error: 'Пользователь не авторизован' });

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

    const newValue = (userData.numAplication ?? 0) + 1;

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

    res.json({ numAplication: data.numAplication ?? 0 });
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
    res.json({ isLoggedIn: false });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect("http://localhost:3000"));
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

    const { error: updateError } = await supabase
      .from('Users')
      .update({ complite_aplication: userData.complite_aplication + 1 })
      .eq('auth_uid', req.session.authUid);
    if (updateError) throw updateError;

    res.json({ success: true, newValue: userData.complite_aplication + 1 });
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

    res.json({ complite_aplication: data.complite_aplication });
  } catch (err) {
    console.error('Ошибка:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/match/:id/opendota', async (req, res) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ error: 'Не передан match_id или неверный формат' });
  }

  try {
    const { data: localData, error: localError } = await supabase
      .from('AnalyzeAplication')
      .select('match')
      .eq('match', id)
      .single();

    if (localError && localError.code !== "PGRST116") {
      console.error("Ошибка Supabase:", localError);
      return res.status(500).json({ error: localError.message });
    }

    const response = await fetch(`https://api.opendota.com/api/matches/${id}`);
    if (!response.ok) {
      return res.status(500).json({ error: 'Ошибка при запросе к OpenDota' });
    }

    const rawData = await response.json();

    // Подготовка детализированных данных
    const matchData = {
      local: localData || null,
      match_id: rawData.match_id,
      duration: rawData.duration,
      start_time: rawData.start_time,
      radiant_win: rawData.radiant_win,
      radiant_score: rawData.radiant_score,
      dire_score: rawData.dire_score,
      players: rawData.players.map(player => ({
        account_id: player.account_id,
        player_slot: player.player_slot,
        hero_id: player.hero_id,
        is_radiant: player.isRadiant,
        // KDA и показатели на каждом моменте
        kills_log: player.kills_log || [],
        deaths_log: player.deaths_log || [],
        assists_log: player.assists_log || [],
        xp_t: player.xp_t || [],           // опыт на протяжении времени
        gold_t: player.gold_t || [],       // голда на протяжении времени
        lh_t: player.lh_t || [],           // ластхиты на протяжении времени
        dn_t: player.dn_t || [],           // денайты на протяжении времени
        items_log: player.purchase_log?.map(item => ({
          time: item.time,
          key: item.key,
          charges: item.charges
        })) || [],
        positions: player.obs_log?.map(o => ({ time: o.time, x: o.x, y: o.y })) || [],   // позиции игрока
        sen_log: player.sen_log?.map(s => ({ time: s.time, x: s.x, y: s.y })) || [],
        obs_left_log: player.obs_left_log?.map(o => ({ time: o.time, x: o.x, y: o.y })) || [],
        sen_left_log: player.sen_left_log?.map(s => ({ time: s.time, x: s.x, y: s.y })) || []
      })),
      objectives: rawData.objectives?.map(obj => ({
        type: obj.type,
        team: obj.team,
        time: obj.time,
        player_slot: obj.player_slot
      })) || []
    };

    res.json(matchData);

  } catch (err) {
    console.error("Серверная ошибка:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});


app.put('/update-profile-image', async (req, res) => {
  if (!req.session.authUid) {
    return res.status(401).json({ error: 'Пользователь не авторизован' });
  }

  const { imageUrl } = req.body;
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

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});