import { useRef } from 'react';
import { Link } from 'react-router-dom';
import './footer.css';

function Footerblock({ refs }) {
  const footerRef = useRef(null);

  const scrollWithOffset = (ref) => {
    if (ref.current && footerRef.current) {
      const footerHeight = footerRef.current.offsetHeight;
      const elementPosition = ref.current.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - footerHeight + 300;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <footer ref={footerRef}>
      <h2 className="footerLogo">Critiqo</h2>

      <div className='footer-top'>
          <div className="navigate">
          <ul>
            <li onClick={() => scrollWithOffset(refs.aboutRef)}>О нас</li>
            <li onClick={() => scrollWithOffset(refs.advantagesRef)}>Наши преимущества</li>
            <li onClick={() => scrollWithOffset(refs.tryFreeRef)}>Попробовать бесплатно</li>
            <li onClick={() => scrollWithOffset(refs.matchAnalysisRef)}>Разбор матчей</li>
          </ul>
        </div>

        <div className="contacts">
          <h3>Связаться с нами</h3>
          <ul>
            <li>
              <a href="https://mail.ru/">CritiqoSupport@mail.ru</a>
            </li>
            <Link to="/support">
              <li>Написать в техподдержку</li>
            </Link>
          </ul>
        </div>

        <div className="policy">
          <ul>
            <Link to="/">
              <li>Политика конфиденциальности</li>
            </Link>
            <Link to="/">
              <li>Условия использования</li>
            </Link>
          </ul>
        </div>
      </div>

      <h2 className='CritiqoAP'>© 2025 Critiqo</h2>
    </footer>
  );
}

export default Footerblock;