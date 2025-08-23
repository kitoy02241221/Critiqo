import React, { useState } from 'react';
import { useRef } from 'react';
import '../AnalyzeModal/Analyzemodal.css';
import { supabase } from '../../createSupabase/supabase';

function Modal() {

    const [match, setMatch] = useState(0)
  const [task, setTask] = useState('')
  const [problem, setProblem] = useState('')


const onAddTask = async (task) => {
  try {

    const res = await fetch('http://localhost:5000/take-session-auth_id', { credentials: 'include' });
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


    const incrementRes = await fetch('http://localhost:5000/increment-num-application', {
      method: 'POST',
      credentials: 'include'
    });

    if (!incrementRes.ok) throw new Error("Не удалось обновить счётчик заявок");

    const incrementData = await incrementRes.json();

    alert(`✅ Заявка добавлена и счётчик обновлён! Новое значение: ${incrementData.newValue}`);

  } catch (err) {
    console.error("Ошибка в onAddTask:", err);
    alert("Ошибка: " + err.message);
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
  <h2>Закажите анализ прямо сейчас!</h2>
  <p>
    Заказать анализ можно в несколько кликов:
    <li>Введите <b>ID матча</b>, анализ которого хотите получить</li>
    <li>Напишите, что именно интересует вас больше всего</li>
    <li>Расскажите о проблемах, с которыми вы столкнулись в ходе матча</li>
  </p>
  <p> 
    После анализа вы получите подробные рекомендации,
    которые помогут вам:
    <li>Увидеть свои сильные и слабые стороны</li>
    <li>Получить разбор ошибок с примерами из вашей игры</li>
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
          placeholder='Например: Не мог найти фарм, не получалось убить'
          onChange={(e) => setProblem(e.target.value)}
          rows={1}
        />

        <button className='submitMatch' onClick={handleSubmit}>
          Отправить
        </button>
      </div>
    </div>
  );
}

export default Modal;