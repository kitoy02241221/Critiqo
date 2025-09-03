import React, { useState } from 'react';
import { useRef } from 'react';
import '../AnalyzeModal/Analyzemodal.css';
import { supabase } from '../../createSupabase/supabase';

function Modal() {

    const [match, setMatch] = useState(0)
  const [task, setTask] = useState('')
  const [problem, setProblem] = useState('')

  const API_BASE_URL = "https://critiqo-1.onrender.com";


const onAddTask = async (task) => {
  try {

    const res = await fetch(`${API_BASE_URL}/take-session-auth_id`, { credentials: 'include' });
    if (!res.ok) throw new Error("Не удалось получить сессию");

    const data = await res.json();
    const authUid = data.authUid;

    const newTask = { ...task, user_auth_uid: authUid };
    const { data: existingMatches, error: checkError } = await supabase
      .from('AnalyzeAplication')
      .select('match')
      .eq('match', task.match);

    if (checkError) throw checkError;

    if (existingMatches && existingMatches.length > 0) {
      alert('Заявка на этот матч уже в обработке');
      return;
    }


    const { error: insertError } = await supabase
      .from('AnalyzeAplication')
      .insert([newTask]);

    if (insertError) throw insertError;


    const incrementRes = await fetch(`${API_BASE_URL}/increment-num-application`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!incrementRes.ok) throw new Error("Не удалось обновить счётчик заявок");

    const incrementData = await incrementRes.json();

    alert(`✅ Заявка добавлена и счётчик обновлён! Новое значение: ${incrementData.newValue}`);

  } catch (err) {
    console.error("Ошибка в onAddTask:", err);
    alert("Сначала авторизируйся!");
  }
};

function handleSubmit(event) {
  event.preventDefault()

  const testAnalyze = {
    match: match,
    task: task,
    problem: problem
  }

  onAddTask(testAnalyze)
}


  const refArea1 = useRef(null);
  const refArea2 = useRef(null);

  const autoResize = (ref) => {
    if (ref && ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  };

  return (
    <div className='modalAnalyze'>
    <h1>Заказать анализ</h1>
      <div className='infoTakeAnalyze'>
        <h2>Закажи анализ прямо сейчас!</h2>
        <p>
          Заказать анализ можно в несколько кликов:
          <li>Введи <b>ID матча</b>, анализ которого хочешь получить</li>
          <li>Напиши, что именно интересует тебя больше всего</li>
          <li>Расскажи о проблемах, с которыми ты столкнулся в ходе матча</li>
        </p>
        <p> 
          После анализа ты получишь подробные рекомендации,
          которые помогут тебе:
          <li>Увидеть свои сильные и слабые стороны</li>
          <li>Получить разбор ошибок с примерами из твоей игры</li>
          <li>Узнать, над чем стоит поработать в первую очередь</li>
        </p>
      </div>
      <div className='interactiveItem'>
        <h3>Выбор матча:</h3>
        <input
          className='selectMatch'
          type='number'
          placeholder='Введите id матча'
          onChange={(e) => setMatch(e.target.value)}
        />

        <h3>Над чем будем работать?</h3>
        <textarea
          ref={refArea1}
          onInput={() => autoResize(refArea1)}
          placeholder='Например: Фарм, билд'
          onChange={(e) => setTask(e.target.value)}
          rows={1}
        />

        <h3>Какие трудности были в матче?</h3>
        <textarea
          ref={refArea2}
          onInput={() => autoResize(refArea2)}
          placeholder='Например: Не мог найти фарм'
          onChange={(e) => setProblem(e.target.value)}
          rows={1}
        />

        <button className='submitMatch' onClick={handleSubmit}>
          Отправить
        </button>
        <div class="circle circle1"></div>
        <div class="circle circle2"></div>
        <div class="circle circle3"></div>
      </div>
    </div>
  );
}

export default Modal;