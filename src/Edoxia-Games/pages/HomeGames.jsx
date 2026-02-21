import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../../ThemeContext';
import { ArrowLeft } from 'lucide-react';

export default function HomeGames() {
  const { theme } = React.useContext(ThemeContext);
  const isDark = theme === 'dark';

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="w-full flex justify-start mb-6">
        <Link to="/" className="flex flex-shrink-0 items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-brand-text bg-white/40 rounded-full border border-white/50 hover:bg-white/80 transition-all shadow-soft backdrop-blur-md w-fit">
          <ArrowLeft size={18} />
          Retour Accueil
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
        <div className="max-w-3xl p-4 rounded-2xl border bg-brand-peach/20 border-brand-coral/20 text-brand-coral text-sm font-medium shadow-soft">
          <p>⚠️ « Les pseudonymes issus d'un registre familier ou jugés inappropriés seront retirés des classements. Ces activités s'inscrivent dans un cadre strictement pédagogique. Seulement le plus haut score par personne est gardé, dans la mesure du possible merci de garder exactement le même pseudonyme. »</p>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-text">Jeux Éducatifs 🎮</h1>
          <p className="text-brand-text/70 text-lg">Choisis ta matière :</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <Link to="/games/maths" className="group relative flex flex-col items-center p-8 rounded-[24px] border border-white/50 bg-white/40 hover:bg-white/80 transition-all cursor-pointer backdrop-blur-xl shadow-soft">
            <span className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-md">📐</span>
            <h3 className="text-2xl font-bold group-hover:text-brand-teal text-brand-text transition-colors">Mathématiques</h3>
            <p className="text-brand-text/60 font-medium mt-2">Calcul mental, logique...</p>
          </Link>

          <Link to="/games/french" className="group relative flex flex-col items-center p-8 rounded-[24px] border border-white/50 bg-white/40 hover:bg-white/80 transition-all cursor-pointer backdrop-blur-xl shadow-soft">
            <span className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-md">📚</span>
            <h3 className="text-2xl font-bold group-hover:text-brand-coral text-brand-text transition-colors">Français</h3>
            <p className="text-brand-text/60 font-medium mt-2">Grammaire, conjugaison...</p>
          </Link>
        </div>
      </div>
    </div>
  );
}