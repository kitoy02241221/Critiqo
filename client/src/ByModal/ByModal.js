import { Link } from "react-router-dom";
import "./ByModal.css";

function ByModal({ ByModalIsOpen, setByModalIsOpen}) {
  const closeModal = () => setByModalIsOpen(false);

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
          <button className="close-btn" onClick={closeModal}>
            Закрыть
          </button>

            <button className="confirm-btn">
                <span class="price-wrapper">
                    <span class="old-price">700 ₽</span>
                    <span class="new-price">Оплатить  575 ₽</span>
                </span>
            </button>

        </div>
      </div>
    </div>
  );
}

export default ByModal;