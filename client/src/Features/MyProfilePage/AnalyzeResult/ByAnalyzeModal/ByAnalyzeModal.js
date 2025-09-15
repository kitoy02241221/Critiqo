import "./ByAnalyzeModal.css"
import ByModalinProfile from "../../../ByModal/ByModalinProfile/ByModalInProfile";
import { useState } from "react";

function ByAnalyzeModal({ modalstyle, onClose }) {
  const [match, setMatch] = useState(0);
  const [task, setTask] = useState('');
  const [problem, setProblem] = useState('');
  const [isOpen, setIsOpen] = useState(false)



  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("modalOverlay")) {
      onClose();
    }
  };


  return (
    <div
      className="modalOverlay"
      style={modalstyle}
      onClick={handleOverlayClick}
    >
      <div className="modalWindow">
        <h1>Заказать разбор</h1>

        <div className="infoModal">
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

        <div className="inputModal">
          <h3>Выбор матча:</h3>
          <input type="number" required placeholder="Введите id матча" onChange={(e) => setMatch(e.target.value)}/>

          <h3>Над чем будем работать?</h3>
          <input type="text" placeholder="Например: Фарм, билд" onChange={(e) => setTask(e.target.value)}/>

          <h3>Какие трудности были в матче?</h3>
          <input type="text" placeholder="Например: Не мог найти фарм" onChange={(e) => setProblem(e.target.value)}/>
        </div>

        <button onClick={() => setIsOpen(true)}>Оплатить</button>
      </div>

      <ByModalinProfile
        ByModalIsOpen={isOpen}
        setByModalIsOpen={setIsOpen}
        match={match}
        task={task}
        problem={problem}
      />
    </div>
  );
}

export default ByAnalyzeModal