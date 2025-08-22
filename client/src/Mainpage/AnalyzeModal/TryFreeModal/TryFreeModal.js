import { useState } from "react";
import './TryFreeModal.css'

function TryFreeModal() {
    const[freematchid, setFreeMatchId] = useState(0)
    
    return(
        <div className="tryFreeModal">
        <h1>Попробовать бесплатно</h1>
            <div>
                <div className="tryFreeInfoBlock">
                    <h2>Важная информация:</h2>
                    <div>
                        <p>В пробной версии анализы выполняются по шаблону
                        для демонстрации возможностей сервиса Critiqo. Полноценные анализы повторов
                        ваших игр можно получить при заказе анализа. Подробнее узнать об отличиях можно через:
                        <li>Окно заказа анализа</li>
                        <li>Мой профиль → кнопка 'Заказать анализ'</li>
                        <li>На главной странице в блоке 'В чем отличие бесплатного анализа от платного?'</li>
                        </p>
                    </div>
                </div>

                <div className="selectMatchBlock">
                    <h2>Выбор матча</h2>

                    <input
                    type='number'
                    placeholder="Введите id матча"
                    onChange={(e) => setFreeMatchId(e.target.value)}
                    />

                    <button>Отправить</button>
                </div>
            </div>
        </div>
    )
}

export default TryFreeModal