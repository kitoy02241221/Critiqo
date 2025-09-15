import React, { useState, useRef } from 'react';
import '../AnalyzeModal/Analyzemodal.css';
import { supabase } from '../../../Shared/createSupabase/supabase';
import ByModal from '../../ByModal/MainModal/ByModal';

function Modal() {
  const [match, setMatch] = useState(0);
  const [task, setTask] = useState('');
  const [problem, setProblem] = useState('');
  const [ByModalIsOpen, setByModalIsOpen] = useState(false);

  const API_BASE_URL = "https://critiqo-1.onrender.com";

  const refArea1 = useRef(null);
  const refArea2 = useRef(null);

  const autoResize = (ref) => {
    if (ref && ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  };

  function openModal() {
    setByModalIsOpen(true);
  }

  return (
    <div className='modalAnalyze'>
      <h1>Заказать анализ</h1>
      <div className='analyzeContent'>
        <div className='infoTakeAnalyze'>
          <div className='leftColumn'>
            <h2>Закажи анализ прямо сейчас!</h2>
            <p>
              <li>Введи <b>ID матча</b>, анализ которого хочешь получить</li>
              <li>Напиши, что именно интересует тебя</li>
              <li>Расскажи о проблемах, с которыми ты столкнулся в матче</li>
            </p>
          </div>
          <div className="rightColumn">
            <h2>Важная информация</h2>
            <ul>
              <li>Матч должен быть сыгран не более 7 дней назад</li>
              <li>Убедись в точности id матча</li>
              <li>
                После отправки заявки, результат появится в профиле
                в истории анализов
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

          <h3>Задачи</h3>
          <textarea
            ref={refArea1}
            onInput={() => autoResize(refArea1)}
            placeholder='Над чем будем работать? (необязательно)'
            onChange={(e) => setTask(e.target.value)}
            rows={1}
          />

          <h3>Трудности</h3>
          <textarea
            ref={refArea2}
            onInput={() => autoResize(refArea2)}
            placeholder='Какие трудности были в матче? (необязательно)'
            onChange={(e) => setProblem(e.target.value)}
            rows={1}
          />
          
          <button className='submitMatch' onClick={openModal}> 
            Оплатить
          </button>
          <div className="circle circle1"></div>
          <div className="circle circle2"></div>
          <div className="circle circle3"></div>
        </div>
      </div>

      <ByModal
        ByModalIsOpen={ByModalIsOpen}
        setByModalIsOpen={setByModalIsOpen}
        match={match}
        task={task}
        problem={problem}
      />
      <h5 className='backgroundModal'>CRITIQO</h5>
    </div>
  );
}

export default Modal;