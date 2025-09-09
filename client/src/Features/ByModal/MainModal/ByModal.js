import { Link } from "react-router-dom";
import "./ByModal.css";

function ByModal({ ByModalIsOpen, setByModalIsOpen, match, task, problem }) {
  const closeModal = () => setByModalIsOpen(false);

  const handlePayment = async () => {
    try {
      const res = await fetch("https://critiqo-1.onrender.com/create-payment", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match, task, problem })
      });

      const data = await res.json();
      if (data.confirmation_url) {
        window.location.href = data.confirmation_url; // редирект на YooKassa
      } else {
        alert("Ошибка при создании платежа");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка при оплате");
    }
  };

  if (!ByModalIsOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Оплата услуги</h2>
        <ul className="modalInfo">
            <li>Убедись в точности id матча</li>
            <li>Результат анализа можно будет посмотреть в текстовом формате в профиле</li>
            <li>После оплаты в профиле будут изменены соответствующие данные</li>
        </ul>
        <label className="checkPolicy">
            <input type="checkbox" required />Я принимаю <Link to={"/policy-offer"}>оферту</Link> и <Link to={""}>политику конфиденциальности</Link>
        </label>

        <div className="modal-actions">
          <button className="close-btn" onClick={closeModal}>Закрыть</button>
          <button className="confirm-btn" onClick={handlePayment}>
            <span className="price-wrapper">
              <span className="old-price">700 ₽</span>
              <span className="new-price">Оплатить 575 ₽</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ByModal;