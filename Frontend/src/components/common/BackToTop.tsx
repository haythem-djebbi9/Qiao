import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/** Bouton « Retour en haut » : visible dès que la page a défilé, sur toutes les pages. */
export const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 500);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Retour en haut"
      title="Retour en haut"
      className={`fixed right-4 sm:right-6 bottom-[calc(1rem+var(--qiao-bottom-bar,0px))] sm:bottom-[calc(1.5rem+var(--qiao-bottom-bar,0px))] z-40 w-11 h-11 rounded-full bg-[#0a1c3d] text-white shadow-lg shadow-slate-900/25 border border-white/20 flex items-center justify-center hover:bg-red-600 transition-all duration-200 cursor-pointer ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
};
