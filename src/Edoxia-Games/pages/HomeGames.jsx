import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../../ThemeContext';

export default function HomeGames() {
  const { theme } = React.useContext(ThemeContext);
  const isDark = theme === 'dark';

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Link to="/" className={`relative md:absolute top-0 left-0 md:top-6 md:left-6 z-10 w-fit mb-6 md:mb-0 flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors ${isDark ? 'text-cyan-400 bg-cyan-950/30 border-cyan-900/50 hover:bg-cyan-900/50' : 'text-cyan-700 bg-cyan-100/50 border-cyan-200 hover:bg-cyan-200/50'}`}>
        ← Retour
      </Link>

      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
        <div className={`max-w-3xl p-4 rounded-xl border text-sm ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <p>⚠️ « Les pseudonymes issus d'un registre familier ou jugés inappropriés seront retirés des classements. Ces activités s'inscrivent dans un cadre strictement pédagogique. Seulement le plus haut score par personne est gardé, dans la mesure du possible merci de garder exactement le même pseudonyme. »</p>
        </div>
        <div className="space-y-2">
          <h1 className={`text-4xl md:text-5xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Jeux Éducatifs 🎮</h1>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-lg`}>Choisis ta matière :</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
          <Link to="/games/maths" className={`group relative flex flex-col items-center p-8 rounded-2xl border transition-all cursor-pointer backdrop-blur-sm ${isDark ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 hover:border-cyan-500/30' : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-cyan-500/50 shadow-sm'}`}>
            <span className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">📐</span>
            <h3 className={`text-2xl font-semibold group-hover:text-cyan-600 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Mathématiques</h3>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} mt-2`}>Calcul mental, logique...</p>
          </Link>

          <Link to="/games/french" className={`group relative flex flex-col items-center p-8 rounded-2xl border transition-all cursor-pointer backdrop-blur-sm ${isDark ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 hover:border-violet-500/30' : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-violet-500/50 shadow-sm'}`}>
            <span className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">📚</span>
            <h3 className={`text-2xl font-semibold group-hover:text-violet-600 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Français</h3>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} mt-2`}>Grammaire, conjugaison...</p>
          </Link>
        </div>
      </div>
    </div>
  );
}