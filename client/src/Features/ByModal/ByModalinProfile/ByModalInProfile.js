import { useState } from "react";
import { Link } from "react-router-dom";
import "./ByModalInProfile.css";

function ByModal({ ByModalIsOpen, setByModalIsOpen, match, task, problem }) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [policyError, setPolicyError] = useState("");

  const closeModal = () => setByModalIsOpen(false);

  const validateEmail = (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  };

  const handlePayment = async () => {
    if (!email.trim()) {
      setEmailError("Введите почту");
      return;
    }
    if (!validateEmail(email)) {
      setEmailError("Введите корректный email");
      return;
    }
    if (!acceptedPolicy) {
      setPolicyError("Необходимо принять оферту и политику конфиденциальности");
      return;
    }
    setEmailError("");
    setPolicyError("");

    try {
      const res = await fetch("https://critiqo-1.onrender.com/create-payment", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match, task, problem, email }),
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
    <div className="modal-overlay-profile" onClick={closeModal}>
      <div className="modal-content-profile" onClick={(e) => e.stopPropagation()}>
        <h2>Оплата услуги</h2>
        <ul className="modalInfo-profile">
          <li>Матч должен быть сыгран не более 7 дней назад</li>
          <li>Убедись в точности id матча</li>
          <li>После отправки заявки, результат появится в профиле
                в истории анализов</li>
        </ul>

        <input
          type="email"
          placeholder="Введите почту"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {emailError && <p className="error-text-profile">{emailError}</p>}

        <label className="checkPolicy-profile">
          <input
            type="checkbox"
            checked={acceptedPolicy}
            onChange={(e) => setAcceptedPolicy(e.target.checked)}
          />
          Я принимаю
          <Link to={"/policy-offer"}>оферту</Link> и{" "}
          <Link to={"/privacy-policy"}>политику конфиденциальности</Link>
        </label>
        {policyError && <p className="error-text-profile">{policyError}</p>}

        <div className="modal-actions-profile">
          <button className="close-btn-profile" onClick={closeModal}>
            Закрыть
          </button>
          <button className="confirm-btn-profile" onClick={handlePayment}>
            <span className="price-wrapper-profile">
              <span className="old-price-profile">700 ₽</span>
              <span className="new-price-profile">Оплатить 575 ₽</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ByModal;