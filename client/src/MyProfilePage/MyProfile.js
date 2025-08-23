import "./MyProfile.css"
import AnalyzeResult from "./AnalyzeResult/AnalyzeResult";
import { Link } from "react-router-dom"
import { useEffect, useState } from "react" 
import { supabase } from '../createSupabase/supabase';

function MyProfile() {
  const [nameInput, setNameInput] = useState('')
  const [savedName, setSavedName] = useState('')
  const [userAuth, setUserAuth] = useState(false)
  const [sessionid, setSessionid] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [testsOrdered, setTestsOrder] = useState(0)
  const [daysSinceRegistration, setDaysSinceRegistration] = useState(0)

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const res = await fetch('http://localhost:5000/take-session-auth_id', { credentials: 'include' });
        if (!res.ok) throw new Error('Сессия не установлена');
        const authdata = await res.json();
        if (!authdata.authUid) throw new Error('Нет authUid в сессии');
        const authUid = authdata.authUid;
        if (isMounted) setSessionid(authUid);

        const authRes = await fetch('http://localhost:5000/check-auth', { credentials: 'include' });
        if (!authRes.ok) throw new Error('Ошибка при проверке авторизации');
        if (isMounted) setUserAuth(true);

        const nameRes = await fetch('http://localhost:5000/take-name', { credentials: 'include' });
        if (!nameRes.ok) throw new Error('Ошибка при получении имени');
        const nameData = await nameRes.json();
        if (isMounted && nameData.name) setSavedName(nameData.name);

        const { data: userData, error: userError } = await supabase
          .from('Users')
          .select('numAplication, created_at')
          .eq('auth_uid', authUid)
          .single();

        if (userError) throw userError;

        if (isMounted) {

          setTestsOrder(userData.numAplication ?? 0);

          const createdDate = new Date(userData.created_at);
          const now = new Date();
          const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
          setDaysSinceRegistration(diffDays);



        }

      } catch (err) {
        console.error(err.message);
      }
    }

    fetchData();
    return () => { isMounted = false; }
  }, [])

  async function saveUserName() {
    if (!sessionid) return console.error('Session ID еще не загружен');

    try {
      const res = await fetch('http://localhost:5000/update-name', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сервера');

      setSavedName(data.name);
      setNameInput('');
      setIsEditing(false);
    } catch (err) {
      console.error('Ошибка при сохранении имени:', err.message);
    }
  }

  function startEditing() {
    setNameInput(savedName);
    setIsEditing(true);
  }

  function cancelEditing() {
    setNameInput('');
    setIsEditing(false);
  }

  return (
    <div className="profileBlock">
      <h1>Мой профиль</h1>

      {userAuth && (!savedName || isEditing) && (
        <div>
          <input
            type="text"
            placeholder="Никнейм"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
          <button onClick={saveUserName} disabled={!sessionid || !nameInput}>Сохранить</button>
          {isEditing && <button onClick={cancelEditing}>Отмена</button>}
        </div>
      )}

      {userAuth && savedName && !isEditing && (
        <div>
          <button onClick={startEditing} className="editName">Редактировать</button>
        </div>
      )}

      {savedName && !isEditing && <h2 className="userName">{savedName}</h2>}

      <div className="statisticsBlock">
        <div className="statistics">
          <p>Ты с нами уже</p>
          <strong>{daysSinceRegistration} Дней!</strong>
        </div>
        <div className="statistics">
          <p>Заказано разборов</p>
          <strong>{testsOrdered}</strong>
        </div>
        <div className="statistics">
          <p>Уровень активности</p>
          <strong>Слабый</strong>
        </div>
        <div className="statistics">
          <p>Статус подписки</p>
          <strong>Активно</strong>
        </div>
      </div>

      <AnalyzeResult/>

      <div className="profileButton">
        <button>Оформить подписку</button>
        <Link to={"/"}><button>На главную</button></Link>
      </div>
    </div>
  )
}

export default MyProfile;