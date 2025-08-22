import { Routes, Route, useLocation } from 'react-router-dom';
import Modal from './Mainpage/AnalyzeModal/Modal';
import WhatisCritiqo from './Mainpage/whatisCritiqo/WhatisCritiqo';
import MyProfile from './MyProfilePage/MyProfile';
import Navbar from './Mainpage/whatisCritiqo/navBar/Navbar';
import AdminPanel from './AdminPage/AdminPanel';
import WeAreTheFirst from './Mainpage/weAreTheFirstBlock/WeAreTheFirst';
import TryFreeModal from './Mainpage/AnalyzeModal/TryFreeModal/TryFreeModal';
import './Mainpage/App.css';

function App() {
  const location = useLocation(); 
  const isProfilePage = location.pathname === "/myprofile";
  const isAdmin = location.pathname === "/adminpanel";
  const isHomePage = location.pathname === "/";
  

  return (
    <div className='header'>
      <Navbar />

      <Routes>
        <Route path="/myprofile" element={<MyProfile />} />
        <Route path="/adminpanel" element={<AdminPanel />} />
      </Routes>

      {isHomePage && (
        <>
          
          <WhatisCritiqo />
          <WeAreTheFirst/>
          <TryFreeModal/>
          <Modal />
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