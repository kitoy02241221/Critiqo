import { useRef } from 'react';
import { Link } from 'react-router-dom';
import './footer.css';

function Footerblock({ refs }) {
  const footerRef = useRef(null);

  const scrollWithOffset = (ref) => {
    if (ref.current && footerRef.current) {
      const footerHeight = footerRef.current.offsetHeight;
      const elementPosition = ref.current.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - footerHeight + 200;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <footer ref={footerRef}>
      
    </footer>
  );
}

export default Footerblock;