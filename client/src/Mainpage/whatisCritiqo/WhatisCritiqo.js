import './whatisCritiqo.css'

function WhatisCritiqo() {
    return (

      <>
        <div className='WhatisCritiqo'>
        <h1>
          О нас
        </h1>

        <div >
          <p>
            Critiqo — это умный помощник для игроков в Dota 2, который анализирует
            ваши матчи и помогает становиться лучше. Просто отправьте ID реплея — и
            Critiqo с помощью нейросети детально разберёт вашу игру:
            от первых секунд на линии до ключевых сражений в лейте.
          </p><br/>
          <div>
             <p>Что делает Critiqo:</p> <br/>
             <ul>
                <li>
                  <strong className="blockName">Находит</strong>
                <p>Находит <strong>слабые места</strong> в твоей игре и показывает, как именно они влияют на общий <strong>результат</strong> в игре. 
                  Это помогает осознать <strong>привычки</strong>, которые мешают <strong>прогрессу</strong>.</p>
                </li>
                <li>
                  <strong className="blockName">Показывает</strong>
                <p>Показывает конкретные <strong>эпизоды</strong> матча, где <strong>ошибка</strong> стоила драки или преимущества. 
                  Так ты видишь, <strong>что именно</strong> пошло не так и как этого <strong>избежать</strong>.</p>
                </li>
                <li>
                  <strong className="blockName">Предлагает</strong>
                <p>Предлагает <strong>чёткие рекомендации</strong> по предметам, прокачке и игровым решениям. 
                  Их <strong>легко применить</strong> в следующей игре без лишних догадок.</p>
                </li>
                <li>
                  <strong className="blockName">Подсказывает</strong>
                <p>Подсказывает <strong>направления для развития</strong> и выделяет самое важное. 
                  Это позволяет сосредоточиться на <strong>главном</strong> и <strong>быстрее улучшать игру</strong>.</p>
                </li>
             </ul>
                <p>Сервис работает на базе искусственного интеллекта и настоящих игровых данных — без гаданий и шаблонов.
                С Critiqo вы не просто узнаете, что пошло не так, — вы поймёте, почему и как это исправить.</p>
          </div>
        </div>
      </div>
      </>
    )
}

export default WhatisCritiqo