import { Link } from "react-router-dom";
import "./byModalInProfile.css";

function ByModalinProfile({ ByModalIsOpen, setByModalIsOpen }) {
  const closeModal = () => setByModalIsOpen(false);

  if (!ByModalIsOpen) return null;

  return (
    <div className="modal-overlay-inProfile" onClick={closeModal}>
      <div className="modal-content-inProfile" onClick={(e) => e.stopPropagation()}>
        <h2>Оплата услуги</h2>
        <ul className="modalInfo-inProfile">
          <li>Убедись в точности id матча</li>
          <li>Результат анализа можно будет посмотреть в текстовом формате в профиле</li>
          <li>После оплаты в профиле будут изменены соответствующие данные</li>
        </ul>

        <label className="checkPolicy-inProfile">
            <span className="checkbox-wrapper">
                <input type="checkbox" />
            </span>
              Я принимаю <Link to={"/policy-offer"}>оферту</Link> и <Link to={""}>политику конфиденциальности</Link>
        </label>

        <div className="modal-actions-inProfile">
          <button className="close-btn-inProfile" onClick={closeModal}>
            Закрыть
          </button>

          <button className="confirm-btn-inProfile">
            <span className="price-wrapper-inProfile">
              <span className="old-price-inProfile">700 ₽</span>
              <span className="new-price-inProfile">Оплатить 575 ₽</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ByModalinProfile;