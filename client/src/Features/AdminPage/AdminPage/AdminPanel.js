import { useEffect, useState } from 'react';
import { supabase } from '../../../Shared/DataBase/SupaBase';
import TakeMatchModal from '../DataMatchModal';
import './AdminPage.css';

function AdminPanel() {
  const [update, setUpdate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [count, setCount] = useState(0);
  const [matchData, setMatchData] = useState(null);
  const [isOpenModal, setIsOpenModal] = useState(false);

  const API_BASE_URL = "https://critiqo-1.onrender.com";

  const [inputValues, setInputValues] = useState({});

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/api/tasks`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Ошибка: ${response.status}`);
        }

        const data = await response.json();
        setTasks(data);
      } catch (err) {
        console.error('Ошибка при загрузке:', err.message);
      } finally {
        setLoading(false);
      }
    }

    async function aplicationCount() {
  try {
    const response = await fetch('https://critiqo-1.onrender.com/api/tasks/count', {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Ошибка: ${response.status}`);
    }

    const { count } = await response.json();
    setCount(count);
    return count || 0;
  } catch (err) {
    console.error('Ошибка:', err.message);
    setCount(0);
    return 0;
  }
}

    fetchTasks();
    aplicationCount();
  }, [update]);

  async function resultAnalyze(match, taskInputs) {
  setLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/api/result-analyze`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        match,
        result: taskInputs.result,
        grade: taskInputs.grade,
        advice: taskInputs.advice,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert("❌ Ошибка: " + (data.error || "Неизвестная ошибка"));
      return;
    }

    alert("✅ Заявка успешно обработана!");
    setUpdate((prev) => !prev);
    console.log("Новое значение complite_aplication:", data.newCompliteValue);

  } catch (err) {
    console.error("Ошибка в resultAnalyze:", err);
    alert("Что-то пошло не так: " + err.message);
  } finally {
    setLoading(false);
  }
}

  const getDataMatch = async (matchId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/match/${matchId}/full`);
      if (!res.ok) throw new Error(`Ошибка запроса: ${res.status} ${res.statusText}`);

      const data = await res.json();
      console.log('Данные матча:', data);
      setMatchData(data);
      setIsOpenModal(true);
    } catch (err) {
      console.error('Ошибка при получении данных матча:', err.message);
    }
  };

  return (
    <div className="profileBlock">
      <h1>Админ панель</h1>

      <div className='updateBlock'>
        <button onClick={() => setUpdate(prevState => !prevState)}>Обновить</button>
        <h2>Заявки на анализ:</h2>
      </div>

      <div className='adminStatistics'>
        <h2>Статистика</h2>
        {loading ? (
          <p>Загрузка...</p>
        ) : (
          <div>
            <h3>Заявок в базе:</h3>
            <p>{count}</p>
          </div>
        )}
      </div>

      <div className='tasks'>
        {loading ? (
          <p>Загрузка...</p>
        ) : (
          tasks.map((task) => {
            const taskInputs = inputValues[task.id] || { result: '', advice: '', grade: '' };

            return (
              <div key={task.id} className="aplicationCard">
                <h3>ID Матча: {task.match}</h3>
                <h3>Задачи анализа: {task.task}</h3>
                <h3>Проблемы в матче: {task.problem}</h3>

                <textarea
                  placeholder="Введите результат анализа"
                  className="resultInput"
                  value={taskInputs.result}
                  onChange={(e) => setInputValues(prev => ({
                    ...prev,
                    [task.id]: { ...taskInputs, result: e.target.value }
                  }))}
                  required
                />
                <textarea
                  placeholder="Советы по игре"
                  className="resultInput"
                  value={taskInputs.advice}
                  onChange={(e) => setInputValues(prev => ({
                    ...prev,
                    [task.id]: { ...taskInputs, advice: e.target.value }
                  }))}
                  required
                />
                <textarea
                  placeholder="Оценка матча"
                  className="resultInput"
                  value={taskInputs.grade}
                  onChange={(e) => setInputValues(prev => ({
                    ...prev,
                    [task.id]: { ...taskInputs, grade: e.target.value }
                  }))}
                  required
                />

                <div className='matchButton'>
                  <button onClick={() => getDataMatch(task.match)}>Получить данные</button>
                  <button onClick={() => resultAnalyze(task.match, taskInputs)}>Отправить анализ</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* модалка одна на весь список */}
      <TakeMatchModal
        matchData={matchData}
        isOpenModal={isOpenModal}
        setIsOpenModal={setIsOpenModal}
      />
    </div>
  );
}

export default AdminPanel;