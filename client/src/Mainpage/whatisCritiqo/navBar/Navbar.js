import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar({ refs }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navbarRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/me', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.isLoggedIn) {
          setIsLoggedIn(true);
          setIsAdmin(data.isAdmin);
        }
      });
  }, []);

  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/steam';
  };

  const handleLogout = () => {
    window.location.href = 'http://localhost:5000/logout';
  };


  const scrollWithOffset = (ref) => {
    if (ref.current && navbarRef.current) {
      const navbarHeight = navbarRef.current.offsetHeight;
      const elementPosition = ref.current.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - navbarHeight - 160; // 20px зазор

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