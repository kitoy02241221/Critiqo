import { Routes, Route, useLocation } from 'react-router-dom';
import { useRef } from 'react';
import Modal from './Mainpage/AnalyzeModal/Modal';
import WhatisCritiqo from './Mainpage/whatisCritiqo/WhatisCritiqo';
import MyProfile from './MyProfilePage/MyProfile';
import Navbar from './Mainpage/whatisCritiqo/navBar/Navbar';
import AdminPanel from './AdminPage/AdminPanel';
import WeAreTheFirst from './Mainpage/weAreTheFirstBlock/WeAreTheFirst';
import TryFreeModal from './Mainpage/AnalyzeModal/TryFreeModal/TryFreeModal';
import Advantagesblock from './Mainpage/AdvantagesBlock/AdvantagesBlock';
import './Mainpage/App.css';

function App() {
  const location = useLocation();  
  const isProfilePage = location.pathname === "/myprofile";
  const isAdmin = location.pathname === "/adminpanel";
  const isHomePage = location.pathname === "/";


  const whatisRef = useRef(null);
  const weAreRef = useRef(null);
  const tryFreeRef = useRef(null);

  return (
    <div className='header'>
      <Navbar 
        onScrollTo={(ref) => ref.current?.scrollIntoView({ behavior: "smooth" })}
        refs={{ whatisRef, weAreRef, tryFreeRef }}
      />

      <Routes>
        <Route path="/myprofile" element={<MyProfile />} />
        <Route path="/adminpanel" element={<AdminPanel />} />
      </Routes>

      {isHomePage && (
        <>
          <div ref={whatisRef}><WhatisCritiqo /></div>
          <div ref={weAreRef}><WeAreTheFirst /></div>
          <div ref={tryFreeRef}><TryFreeModal /></div>
          <Modal />
          <Advantagesblock/>
        </>
      )}

      {!isProfilePage && !isAdmin && !isHomePage && (
        <>
          <Modal />
          <WhatisCritiqo />
        </>
      )}
    </div>
  );
}

export default App;