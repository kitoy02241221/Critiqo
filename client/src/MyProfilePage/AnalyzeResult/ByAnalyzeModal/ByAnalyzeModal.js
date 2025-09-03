import "./ByAnalyzeModal.css"

function ByAnalyzeModal({ modalstyle, onClose }) {
  const handleOverlayClick = (e) => {
    // если клик именно по фону (overlay), а не по окну
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
          <input type="number" required placeholder="Введите id матча" />

          <h3>Над чем будем работать?</h3>
          <input type="text" placeholder="Например: Фарм, билд" />

          <h3>Какие трудности были в матче?</h3>
          <input type="text" placeholder="Например: Не мог найти фарм" />
        </div>

        <button>Оплатить</button>
      </div>
    </div>
  );
}

export default ByAnalyzeModal