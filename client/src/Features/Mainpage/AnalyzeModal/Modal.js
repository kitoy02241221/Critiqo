import React, { useState } from 'react';
import { useRef } from 'react';
import '../AnalyzeModal/Analyzemodal.css';
import { supabase } from '../../../Shared/createSupabase/supabase';
import ByModal from '../../ByModal/MainModal/ByModal';


function Modal() {

  const [match, setMatch] = useState(0)
  const [task, setTask] = useState('')
  const [problem, setProblem] = useState('')
  const [ByModalIsOpen, setByModalIsOpen] = useState(false)

  const API_BASE_URL = "https://critiqo-1.onrender.com";


function openModal() {
  setByModalIsOpen(true);
}

// function handleSubmit(event) {
//   event.preventDefault()

//   const testAnalyze = {
//     match: match,
//     task: task,
//     problem: problem
//   }

//   // onAddTask(testAnalyze)
// }

 function openByModal () {
  
 }


  const refArea1 = useRef(null);
  const refArea2 = useRef(null);

  const autoResize = (ref) => {
    if (ref && ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  };


  function openModal() {
    setByModalIsOpen(true)
  }


  return (
    <div className='modalAnalyze'>
    <h1>Заказать анализ</h1>
      <div className='infoTakeAnalyze'>
        <div className='leftColumn'>
          <h2>Закажи анализ прямо сейчас!</h2>
        <p>
          Заказать анализ можно в несколько кликов:
          <li>Введи <b>ID матча</b>, анализ которого хочешь получить</li>
          <li>Напиши, что именно интересует тебя больше всего</li>
          <li>Расскажи о проблемах, с которыми ты столкнулся в ходе матча</li>
        </p>
        </div>
        <div className="rightColumn">
          <h2>Важная информация</h2>
          <ul>
            <li>Матч должен быть сыгран не более 7-10 дней назад</li>
            <li>Убедись в точности id матча</li>
            <li>
              После подтверждения оплаты результат можно будет посмотреть в
              профиле, в разделе "История анализов". Результат появится в течении
              24 часов после оплаты
            </li>
          </ul>
        </div>
      </div>
      <div className='interactiveItem'>
        <h3>Выбор матча:</h3>
        <input
          className='selectMatch'
          type='number'
          placeholder='Введите id матча'
          required
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
        
        {/*onClick={handleSubmit} */}
        <button className='submitMatch' onClick={openModal}> 
          Оплатить
        </button>
        <div class="circle circle1"></div>
        <div class="circle circle2"></div>
        <div class="circle circle3"></div>
      </div>

      <ByModal
  ByModalIsOpen={ByModalIsOpen}
  setByModalIsOpen={setByModalIsOpen}
  match={match}
  task={task}
  problem={problem}
/>
    </div>
  );
}

export default Modal;