import { Routes, Route, useLocation } from 'react-router-dom';
import { useRef } from 'react';
import Modal from './Mainpage/AnalyzeModal/Modal';
import WhatisCritiqo from './Mainpage/whatisCritiqo/WhatisCritiqo';
import MyProfile from './MyProfilePage/MyProfile';
import Navbar from './Mainpage/navBar/Navbar';
import AdminPanel from './AdminPage/AdminPanel';
import WeAreTheFirst from './Mainpage/weAreTheFirstBlock/WeAreTheFirst';
import Advantagesblock from './Mainpage/AdvantagesBlock/AdvantagesBlock';
import FAQpage from './FAQpage/FAQpage';
import Footerblock from './Mainpage/footer/Footerblock'
import Support from './supportPage/support';
import './Mainpage/App.css';

function App() {
  const location = useLocation();  
  const isSupportPage = location.pathname === "/support"
  const isHomePage = location.pathname === "/";


  const aboutRef = useRef(null);
  const weAreRef = useRef(null);
  const matchAnalysisRef = useRef(null)
  const advantagesRef = useRef(null)

  return (
    <div className='header'>
      <Navbar 
        onScrollTo={(ref) => ref.current?.scrollIntoView({ behavior: "smooth" })}
        refs={{ aboutRef, weAreRef, matchAnalysisRef }}
      />

      <Routes>
        <Route path="/myprofile" element={<MyProfile />} />
        <Route path="/adminpanel" element={<AdminPanel />} />
        <Route path="/faq" element={<FAQpage />} />
      </Routes>

      {isHomePage && (
        <>
          <div ref={aboutRef}><WhatisCritiqo /></div>
          <div ref={advantagesRef}><Advantagesblock/></div>
          <div ref={weAreRef}><WeAreTheFirst /></div>
          <div ref={matchAnalysisRef}><Modal/></div>
          
          <Footerblock
          onScrollTo={(ref) => ref.current?.scrollIntoView({ behavior: "smooth" })}
          refs={{ aboutRef, advantagesRef, matchAnalysisRef }}
         />
        </>
      )}

      {isSupportPage && (
        <>
          <Support/>
        </>
      )}
    </div>
  );
}

export default App;