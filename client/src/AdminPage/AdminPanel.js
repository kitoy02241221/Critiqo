import { useEffect, useState } from 'react';
import { supabase } from '../createSupabase/supabase';
import TakeMatchModal from '../AdminPage/DataMatchModal';
import './AdminPage.css';

function AdminPanel() {
  const [update, setUpdate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [count, setCount] = useState(0);
  const [matchData, setMatchData] = useState(null); // исправлено: null вместо ''
  const [isOpenModal, setIsOpenModal] = useState(false);

  const API_BASE_URL = "https://critiqo-1.onrender.com";

  const [inputValues, setInputValues] = useState({});

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);

      const { data, error } = await supabase
        .from('AnalyzeAplication')
        .select('match, task, problem, id')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Ошибка при загрузке:', error.message);
      } else {
        setTasks(data);
      }

      setLoading(false);
    }

    async function aplicationCount() {
      const { count, error } = await supabase
        .from('AnalyzeAplication')
        .select('*', { count: 'exact' });

      if (error) {
        console.error('Ошибка:' + error.message);
        return 0;
      }

      setCount(count);
      return count || 0;
    };

    fetchTasks();
    aplicationCount();
    getComplite();
  }, [update]);

  async function resultAnalyze(match, taskInputs) {
    setLoading(true);

    if (!taskInputs.result.trim() || !taskInputs.advice.trim() || !taskInputs.grade.trim()) {
      alert('Пожалуйста, заполните все поля!');
      setLoading(false);
      return;
    }

    try {
      const resUser = await fetch(`${API_BASE_URL}/get-user`, {
        credentials: "include"
      });
      const dataUser = await resUser.json();

      if (!resUser.ok || !dataUser.user_auth_uid) {
        console.error("Ошибка при получении пользователя:", dataUser);
        alert("Не удалось определить пользователя");
        setLoading(false);
        return;
      }

      const uid = dataUser.user_auth_uid;

      const { error } = await supabase
        .from("ResultAnalyze")
        .insert([{
          result: taskInputs.result,
          grade: taskInputs.grade,
          advice: taskInputs.advice,
          match_id: match,
          user_auth_uid: uid
        }]);

      if (error) {
        console.error("❌ Ошибка при добавлении:", error);
        alert("Ошибка: " + error.message);
        setLoading(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from("AnalyzeAplication")
        .delete()
        .eq("match", match);

      if (deleteError) {
        console.error("❌ Ошибка при удалении заявки:", deleteError);
        alert("Ошибка: " + deleteError.message);
      } else {
        alert("✅ Заявка успешно обработана!");
        setUpdate(prev => !prev);
      }

      try {
        const res = await fetch(`${API_BASE_URL}/increment-application`, {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) throw new Error("Ошибка на сервере при обновлении счётчика");

        const data = await res.json();
        console.log("Новое значение complite_aplication:", data.newValue);
      } catch (err) {
        console.error("Не удалось обновить complite_aplication:", err);
      }

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