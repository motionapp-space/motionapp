import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Forza scroll immediato al top
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // Backup: esegui anche dopo un piccolo delay per gestire
    // il ripristino scroll del browser
    const timeoutId = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}
