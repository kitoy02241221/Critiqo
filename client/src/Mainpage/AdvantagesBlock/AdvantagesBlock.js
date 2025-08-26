import './Advantagesblock.css'

function Advantagesblock() {
    
    return (
        <div className="advantagesblock">
            <h1>Наши преимущества</h1>
            <div className="advantages">
                <div className="advantageItem">
                    <div className="readyAnalyze">
                    <img src="https://cdn-icons-png.flaticon.com/512/117/117392.png" alt="icon"/>
                        <div className="textBlock">
                            <p>Готовый разбор за 24 часа</p>
                            <div className="description">
                                Мы подготовим детальный анализ твоего матча и предоставим его в течение суток. 
                                Ты получаешь структурированный отчёт с ключевыми моментами, советами и выводами — всё, 
                                что нужно для роста твоего уровня игры.
                            </div>
                        </div>
                    </div>   
                </div>

                <div className="advantageItem">
                    <div>
                        <img src="https://cdn-icons-png.flaticon.com/512/654/654075.png" alt="icon"/>
                        <div className="textBlock">
                            <p>Персональные рекомендации</p>
                            <div className="description">
                                На основе анализа твоих матчей мы формируем индивидуальные советы, 
                                которые учитывают сильные и слабые стороны твоей игры. Такой подход 
                                помогает не тратить время на лишнее и сосредоточиться на том, 
                                что действительно даст прогресс.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="advantageItem">
                    <div>
                        <img src="https://cdn-icons-png.flaticon.com/512/1610/1610670.png" alt="icon"/>
                        <div className="textBlock">
                            <p>Человеческий фактор — в прошлом</p>
                            <div className="description">
                                Каждый разбор строится исключительно на данных из матча и работе алгоритмов. 
                                Никаких эмоций, субъективных мнений или предвзятых оценок — только точная 
                                статистика и объективные выводы, которые помогут тебе реально расти.
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="advantageItem">
                    <div>
                        <img src="https://cdn-icons-png.flaticon.com/512/77/77668.png" alt="icon"/>
                        <div className="textBlock">
                            <p>Поддержка разных ролей и стилей игры</p>
                            <div className="description">
                                Анализ учитывает не только твою позицию в команде, но и индивидуальный 
                                стиль поведения в матче. Благодаря этому ты получаешь рекомендации, которые действительно 
                                работают именно для тебя. Такой персональный подход помогает развиваться быстрее и эффективнее.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="advantageItem">
                    <div>
                        <img src="https://cdn-icons-png.flaticon.com/512/0/30.png" alt="icon"/>
                        <div className="textBlock">
                            <p>Доступность и простота</p>
                            <div className="description">
                                Воспользоваться сервисом можно всего в пару кликов — загружаешь матч и 
                                сразу получаешь готовый разбор. Никаких установок, сложных программ или долгих 
                                инструкций: всё работает прямо в браузере. Critiqo максимально упрощает процесс, 
                                чтобы ты мог сосредоточиться на игре, а не на технических деталях.
                            </div>
                        </div>
                    </div>
                </div>




            </div>
        </div>
    )
}

export default Advantagesblock