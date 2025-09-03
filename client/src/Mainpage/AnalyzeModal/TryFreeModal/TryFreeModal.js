import './TryFreeModal.css'

function TryFreeModal() {
    return (
        <div className="tryFreeModal">
            <h1>Попробовать бесплатно</h1>
            <div className="tryFreeContent">
                <div className="tryFreeInfoBlock">
                    <h2>Важная информация</h2>
                    <ul>
                        <li>В пробной версии анализы выполняются по шаблону</li>
                        <li>Полноценные анализы можно получить при заказе анализа</li>
                        <li>Подробнее через: Окно заказа анализа или Мой профиль → кнопка 'Заказать анализ'</li>
                    </ul>
                    <p>Теперь каждый игрок получает доступ к аналитике уровня киберспорта.</p>
                </div>
                <div className="selectMatchBlock">
                    <h2>Выбор матча</h2>
                    <input type="number" placeholder="Введите id матча" />
                    <button>Отправить</button>
                </div>
            </div>
        </div>
    )
}

export default TryFreeModal