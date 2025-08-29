import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar({ refs }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navbarRef = useRef(null);
  const navigate = useNavigate();
  const API_BASE_URL = "https://critiqo-1.onrender.com";

  useEffect(() => {
    fetch(`${API_BASE_URL}/me`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.isLoggedIn) {
          setIsLoggedIn(true);
          setIsAdmin(data.isAdmin);
        }
      })
      .catch(err => console.error("Ошибка получения /me:", err));
  }, []);

  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/steam`;
  };

  const handleLogout = () => {
    window.location.href = `${API_BASE_URL}/logout`;;
  };

  const scrollWithOffset = (ref) => {
    if (ref.current && navbarRef.current) {
      const navbarHeight = navbarRef.current.offsetHeight;
      const elementPosition = ref.current.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - navbarHeight - 160;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="navbar" ref={navbarRef}>
      <div className="banner">
        <h1
          onClick={() => navigate('/')}
        >
          Critiqo
        </h1>
      </div>

      <div className="navbar-center">
        <button onClick={() => scrollWithOffset(refs.whatisRef)}>Кто мы?</button>
        <button onClick={() => scrollWithOffset(refs.tryFreeRef)}>Разбор матчей</button>

        <Link to={"/myprofile"}><button>Мой профиль</button></Link>
        <Link to={"/faq"}><button>F.A.Q</button></Link>
      </div>

      <div className="steamAuth">
        {!isLoggedIn ? (
          <button onClick={handleLogin}>Войти через Steam</button>
        ) : (
          <>
            <button onClick={handleLogout}>Выйти</button>
          </>
        )}

        {isAdmin && (
          <Link to={"/adminpanel"}>
            <button>Админ панель</button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default Navbar;