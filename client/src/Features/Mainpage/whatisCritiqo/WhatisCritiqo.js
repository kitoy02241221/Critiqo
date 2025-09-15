import React, { useState, useEffect } from "react";
import "./whatisCritiqo.css";

function WhatisCritiqo() {
  const slides = [
    {
      title: "Находит",
      text: "Находит слабые места в твоей игре и показывает, как они влияют на общий результат. Помогает осознать привычки, мешающие прогрессу.",
    },
    {
      title: "Показывает",
      text: "Показывает конкретные эпизоды матча, где ошибка стоила драки или преимущества. Ты видишь, что пошло не так и как этого избежать.",
    },
    {
      title: "Предлагает",
      text: "Предлагает чёткие рекомендации по предметам, прокачке и игровым решениям. Их легко применить в следующей игре без догадок.",
    },
    {
      title: "Подсказывает",
      text: "Подсказывает направления для развития и выделяет главное. Это позволяет сосредоточиться на важном и быстрее улучшать игру.",
    },
  ];

  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);

  const nextSlide = () => {
    setFade(false);
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
      setFade(true);
    }, 300);
  };

  const prevSlide = () => {
    setFade(false);
    setTimeout(() => {
      setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
      setFade(true);
    }, 300);
  };

  // Автопрокрутка каждые 6 секунд
  useEffect(() => {
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="WhatisCritiqo">
      <div className="content">
        <h1>О нас</h1>

        <p className="aboutText">
          Critiqo — это умный помощник для игроков в Dota 2, который анализирует ваши матчи и помогает становиться лучше.
          Просто отправьте ID реплея — и Critiqo с помощью нейросети детально разберёт вашу игру:
          от первых секунд на линии до ключевых сражений в лейте.
        </p>

        <h2 className="whyDoingCritiqo">Что делает Critiqo:</h2>

        <div className="slider">
          <button className="slider-btn prev" onClick={prevSlide}>‹</button>

          <div className={`slide ${fade ? "fade-in" : "fade-out"}`}>
            <h3 className="blockName">{slides[current].title}</h3>
            <p>{slides[current].text}</p>
          </div>

          <button className="slider-btn next" onClick={nextSlide}>›</button>
        </div>

        <div className="dots">
          {slides.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === current ? "active" : ""}`}
              onClick={() => setCurrent(index)}
            />
          ))}
        </div>



        <div className="advantagesblock">
      <div className="advantages">

        <input type="radio" name="accordion" id="adv1" className="accordion-input" defaultChecked />
        <label htmlFor="adv1" className="advantageItem">
          <img src="https://cdn-icons-png.flaticon.com/512/117/117392.png" alt="icon" />
          <div className="textBlock">
            <p>Готовый разбор за 24 часа</p>
            <div className="description">
              Мы подготовим детальный анализ твоего матча и предоставим его в течение суток. 
              Ты получаешь структурированный отчёт с ключевыми моментами, советами и выводами — всё, 
              что нужно для роста твоего уровня игры.
            </div>
          </div>
        </label>

        <input type="radio" name="accordion" id="adv2" className="accordion-input" />
        <label htmlFor="adv2" className="advantageItem">
          <img src="https://cdn-icons-png.flaticon.com/512/654/654075.png" alt="icon" />
          <div className="textBlock">
            <p>Персональные рекомендации</p>
            <div className="description">
              На основе анализа твоих матчей мы формируем индивидуальные советы, 
              которые учитывают сильные и слабые стороны твоей игры. Такой подход 
              помогает не тратить время на лишнее и сосредоточиться на том, 
              что действительно даст прогресс.
            </div>
          </div>
        </label>

        <input type="radio" name="accordion" id="adv3" className="accordion-input" />
        <label htmlFor="adv3" className="advantageItem">
          <img src="https://cdn-icons-png.flaticon.com/512/1610/1610670.png" alt="icon" />
          <div className="textBlock">
            <p>Человеческий фактор — в прошлом</p>
            <div className="description">
              Каждый разбор строится исключительно на данных из матча и работе алгоритмов. 
              Никаких эмоций, субъективных мнений или предвзятых оценок — только точная 
              статистика и объективные выводы, которые помогут тебе реально расти.
            </div>
          </div>
        </label>

        <input type="radio" name="accordion" id="adv4" className="accordion-input" />
        <label htmlFor="adv4" className="advantageItem">
          <img src="https://cdn-icons-png.flaticon.com/512/77/77668.png" alt="icon" />
          <div className="textBlock">
            <p>Поддержка разных ролей и стилей игры</p>
            <div className="description">
              Анализ учитывает не только твою позицию в команде, но и индивидуальный 
              стиль поведения в матче. Благодаря этому ты получаешь рекомендации, которые действительно 
              работают именно для тебя. Такой персональный подход помогает развиваться быстрее и эффективнее.
            </div>
          </div>
        </label>

        <input type="radio" name="accordion" id="adv5" className="accordion-input" />
        <label htmlFor="adv5" className="advantageItem">
          <img src="https://cdn-icons-png.flaticon.com/512/0/30.png" alt="icon" />
          <div className="textBlock">
            <p>Доступность и простота</p>
            <div className="description">
              Воспользоваться сервисом можно всего в пару кликов — загружаешь матч и 
              сразу получаешь готовый разбор. Никаких установок, сложных программ или долгих 
              инструкций: всё работает прямо в браузере. Critiqo максимально упрощает процесс, 
              чтобы ты мог сосредоточиться на игре, а не на технических деталях.
            </div>
          </div>
        </label>

      </div>
    </div>
      </div>
    </div>
  );
}

export default WhatisCritiqo;