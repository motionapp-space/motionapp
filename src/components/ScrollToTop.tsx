import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    const scrollToTop = () => {
      // Prova a scrollare il container coach (layout interno)
      const coachContainer = document.getElementById("coach-scroll-container");
      if (coachContainer) {
        coachContainer.scrollTop = 0;
      }
      
      // Prova a scrollare il container client app
      const clientContainer = document.getElementById("client-scroll-container");
      if (clientContainer) {
        clientContainer.scrollTop = 0;
      }
      
      // Fallback: scrolla anche window per altri layout
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    // Prima passata immediata
    scrollToTop();
    
    // Seconda passata dopo il render per contrastare il browser scroll restoration
    const rafId = requestAnimationFrame(() => {
      scrollToTop();
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [location.key]);

  return null;
}
