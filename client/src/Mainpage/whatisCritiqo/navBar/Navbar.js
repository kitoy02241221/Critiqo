import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'

function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    fetch('http://localhost:5000/me', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.isLoggedIn) {
          setIsLoggedIn(true);
          setIsAdmin(data.isAdmin);
          setDisplayName(data.displayName);
        }
      });
  }, []);

  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/steam';
  };

  const handleLogout = () => {
    window.location.href = 'http://localhost:5000/logout';
  };

  return (
    <div className="navbar">
    <div className="banner">
      <h1>Critiqo</h1>
    </div>
    <div className="navbar-center">
      <button>Кто мы?</button>
      <button>Разбор матчей</button>
      <Link to={"/myprofile"}><button>Мой профиль</button></Link>
      <button>F.A.Q</button>
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