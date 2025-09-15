import "./MyProfile.css"
import AnalyzeResult from "./AnalyzeResult/AnalyzeResult";
import { data, Link } from "react-router-dom"
import { useEffect, useState } from "react" 
import { supabase } from '../../Shared/createSupabase/supabase';
import ByAnalyzeModal from "./AnalyzeResult/ByAnalyzeModal/ByAnalyzeModal";

function MyProfile() {
  const [nameInput, setNameInput] = useState('')
  const [savedName, setSavedName] = useState('')
  const [userAuth, setUserAuth] = useState(false)
  const [sessionid, setSessionid] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [testsOrdered, setTestsOrder] = useState(0)
  const [daysSinceRegistration, setDaysSinceRegistration] = useState(0)
  const [activityLevel, setActivityLevel] = useState('')
  const [loading, setLoading] = useState(Boolean)
  const [siteRank, setSiteRank] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const API_BASE_URL = "https://critiqo-1.onrender.com";


  const modalstyle = {display: isOpen ? "block" : "none"}

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true)

   async function fetchData() {
  try {
    // 1. Получаем authUid
    const res = await fetch(`${API_BASE_URL}/take-session-auth_id`, { credentials: 'include' });
    if (!res.ok) throw new Error('Сессия не установлена');
    const { authUid } = await res.json();
    if (!authUid) throw new Error('Нет authUid в сессии');
    if (isMounted) setSessionid(authUid);

    // 2. Проверяем авторизацию
    const authRes = await fetch(`${API_BASE_URL}/check-auth`, { credentials: 'include' });
    if (!authRes.ok) throw new Error('Ошибка при проверке авторизации');
    if (isMounted) setUserAuth(true);

    // 3. Имя пользователя
    const nameRes = await fetch(`${API_BASE_URL}/take-name`, { credentials: 'include' });
    if (!nameRes.ok) throw new Error('Ошибка при получении имени');
    const { name } = await nameRes.json();
    if (isMounted && name) setSavedName(name);

    // 4. Инфа о пользователе (numAplication, created_at)
    const userRes = await fetch(`${API_BASE_URL}/user-info`, { credentials: 'include' });
    if (!userRes.ok) throw new Error('Ошибка при получении информации о пользователе');
    const { numAplication, created_at } = await userRes.json();

    if (isMounted) {
      setTestsOrder(numAplication ?? 0);

      const createdDate = new Date(created_at);
      const now = new Date();
      const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      setDaysSinceRegistration(diffDays);
    }

    // 5. Активность
    if (numAplication < 1) {
      setActivityLevel('Неактивный');
      setSiteRank('Курьер');
    } else if (numAplication >= 1 && numAplication <= 3) {
      setActivityLevel('Иногда заходит');
      setSiteRank('Сапорт');
    } else if (numAplication >= 4 && numAplication <= 8) {
      setActivityLevel('Постоянный пользователь');
      setSiteRank('Керри');
    } else if (numAplication >= 9 && numAplication <= 14) {
      setActivityLevel('Продвинутый');
      setSiteRank('Иммортал');
    } else if (numAplication >= 15 && numAplication <= 19) {
      setActivityLevel('Суперактивный');
      setSiteRank('Герой патча');
    } else if (numAplication >= 20) {
      setActivityLevel('Хардкорный');
      setSiteRank('Легенда');
    }

  } catch (err) {
    console.error(err.message);
  }
}


    fetchData();
    setLoading(false)
    return () => { isMounted = false; }
  }, [])

  async function saveUserName() {
    if (!sessionid) return console.error('Session ID еще не загружен');

    try {
      const res = await fetch(`${API_BASE_URL}/update-name`, {
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
        <div className="editName">
          <button onClick={startEditing} >Редактировать</button>
        </div>
      )}

      {savedName && !isEditing && <h2 className="userName">{savedName}</h2>}

      {loading ? (
  <h1>Загрузка...</h1>
) : (
  <div className="profileMainContent">
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
        <strong>{activityLevel}</strong>
      </div>
      <div className="statistics">
        <p>Ранг на сайте</p>
        <strong>{siteRank}</strong>
      </div>
    </div>

    <div className="analyzeHistory">
      <AnalyzeResult />
    </div>
  </div>
)}
      <ByAnalyzeModal
      modalstyle={modalstyle}
      onClose={handleClose}
      />

      <div className="profileButton">
        <button onClick={() => setIsOpen(prevState => !prevState)}>Заказать разбор</button>
        <Link to={"/"}><button>На главную</button></Link>
      </div>
    </div>
  )
}

export default MyProfile;