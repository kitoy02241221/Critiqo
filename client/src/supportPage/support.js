import { useEffect, useState } from 'react'
import './support.css'
import { supabase } from '../createSupabase/supabase';

function Support() {
  const API_BASE_URL = "https://critiqo-1.onrender.com";

  const [userUid, setUserUid] = useState('');
  const [aplication, setAplication] = useState('');
  const [mail, setMail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/take-session-auth_id`, { credentials: 'include' });
        if (!res.ok) throw new Error('Сессия не установлена');
        const authdata = await res.json();
        if (!authdata.authUid) throw new Error('Нет authUid в сессии');

        setUserUid(authdata.authUid);
      } catch (err) {
        console.error("❌ Ошибка при получении сессии:", err);
      }
    };

    fetchAuth();
  }, []);

  async function handleAplication() {
    if (!mail || !aplication) {
      alert("Заполните все поля!");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('SupportAplication')
      .insert([{
        mail: mail,
        user_uid: userUid,
        aplication: aplication,
      }]);

    setLoading(false);

    if (error) {
      console.error("❌ Ошибка при добавлении:", error);
      alert("Ошибка: " + error.message);
      return;
    }

    alert("✅ Обращение отправлено!");
    setAplication('');
    setMail('');
  }

  return (
    <div className="supportpage">
      <h1>Обращение в поддержку</h1>
      <div>
        <p>Заполните форму обращения в поддержку. По результату вашего обращения ответ придет на указанную вами почту</p>

        <textarea
          placeholder="Что у вас случилось?"
          value={aplication}
          onChange={(e) => setAplication(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Укажите вашу почту"
          value={mail}
          onChange={(e) => setMail(e.target.value)}
          required
        />
      </div>

      <button onClick={handleAplication} disabled={loading}>
        {loading ? "Отправка..." : "Отправить"}
      </button>
    </div>
  );
}

export default Support;