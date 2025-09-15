import { Routes, Route, useLocation } from 'react-router-dom';
import { useRef } from 'react';
import Modal from './Mainpage/AnalyzeModal/Modal';
import WhatisCritiqo from './Mainpage/whatisCritiqo/WhatisCritiqo';
import MyProfile from './MyProfilePage/MyProfile';
import Navbar from './Mainpage/navBar/Navbar';
import AdminPanel from './AdminPage/AdminPage/AdminPanel';
import WeAreTheFirst from './Mainpage/weAreTheFirstBlock/WeAreTheFirst';
import Advantagesblock from './Mainpage/AdvantagesBlock/AdvantagesBlock';
import FAQpage from './FAQpage/FAQpage';
import Footerblock from './Mainpage/footer/Footerblock'
import Support from './supportPage/support';
import PolicyOffer from './CritiqoPolicy/PolicyOffer/PolicyOffer';
import TermsOfUse from './CritiqoPolicy/UsePolicy/UsePolicy';
import PrivacyPolicy from './CritiqoPolicy/PrivacyPolicy/PrivacyPolicy'
import './Mainpage/App.css';

function App() {
  const location = useLocation();  
  const isSupportPage = location.pathname === "/support"
  const isHomePage = location.pathname === "/";
  const isPolicyOffer = location.pathname === "/policy-offer"
  const isUsePolicy = location.pathname ==="/use-policy"
  const isPrivacyPolicy = location.pathname ==="/privacy-policy"
  const isWhatIsCritiqo = location.pathname === "/whatIsCritiqo"


  const aboutRef = useRef(null);
  const weAreRef = useRef(null);
  const matchAnalysisRef = useRef(null)
  const advantagesRef = useRef(null)

  return (
    <div className='header'>
      <Navbar 
        onScrollTo={(ref) => ref.current?.scrollIntoView({ behavior: "smooth" })}
        refs={{ aboutRef, weAreRef, matchAnalysisRef, advantagesRef }}
      />

      <Routes>
        <Route path="/myprofile" element={<MyProfile />} />
        <Route path="/adminpanel" element={<AdminPanel />} />
        <Route path="/faq" element={<FAQpage />} />
      </Routes>

      {isHomePage && (
        <>
          <div ref={matchAnalysisRef}><Modal/></div>
          {/* <div ref={aboutRef}><WhatisCritiqo /></div>
          <div ref={advantagesRef}><Advantagesblock/></div>
          <div ref={weAreRef}><WeAreTheFirst /></div> */}
          
          {/* <Footerblock
          onScrollTo={(ref) => ref.current?.scrollIntoView({ behavior: "smooth" })}
          refs={{ aboutRef, advantagesRef, matchAnalysisRef }}
         /> */}
        </>
      )}

      {isSupportPage && (
        <>
          <Support/>
        </>
      )}

      {isPolicyOffer && (
        <>
          <PolicyOffer/>
        </>
      )}
      {isUsePolicy && (
        <>
        <TermsOfUse/>
        </>
      )}
      {isPrivacyPolicy && (
        <PrivacyPolicy/>
      )}
      {isWhatIsCritiqo && (
        <WhatisCritiqo/>
      )}
    </div>
  );
}

export default App;