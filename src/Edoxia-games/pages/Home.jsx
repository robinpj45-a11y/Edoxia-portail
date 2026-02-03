import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { ThemeContext } from '../../ThemeContext';

export default function GamesHome() {
  const { theme, toggleTheme } = React.useContext(ThemeContext);
  const isDark = theme === 'dark';

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <nav className="flex justify-end items-center mb-12">
        <button onClick={toggleTheme} className={`p-2 transition-colors rounded-lg ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}>
           {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
      </nav>

      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
        <Link to="/" className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors mb-4 ${isDark ? 'text-cyan-400 bg-cyan-950/30 border-cyan-900/50 hover:bg-cyan-900/50' : 'text-cyan-700 bg-cyan-100/50 border-cyan-200 hover:bg-cyan-200/50'}`}>
           ← Retour Accueil
        </Link>

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