import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Gamepad2, 
  Settings,
  ArrowRight,
  Sun,
  Moon,
  School,
  Bell,
  Calendar,
  Lock
} from 'lucide-react';

// IMPORT DU LOGO PERSO
import logoSvg from './assets/logo.svg'; 
import GamesHome from './Edoxia-games/pages/Home';
import MathsGames from './Edoxia-games/pages/MathsGames';
import FrenchGames from './Edoxia-games/pages/FrenchGames';
import QuizHome from './Edoxia-Quiz/pages/Home';
import AdminDashboard from './Edoxia-Quiz/pages/AdminDashboard';
import HostGame from './Edoxia-Quiz/pages/HostGame';
import PlayerGame from './Edoxia-Quiz/pages/PlayerGame';
import { ThemeContext } from './ThemeContext';

// --- UTILITAIRE DE SÉCURITÉ (Obfuscation) ---
// Permet de cacher les liens dans le code source (Inspect Element)
// Les liens ne sont décodés qu'au moment du clic.
const decodeLink = (encoded) => {
  try {
    return atob(encoded);
  } catch (e) {
    return '#';
  }
};

// --- CONFIGURATION DES MODULES PUBLICS (Élèves) ---
const MODULES = [
  {
    id: 'games',
    name: 'Jeux éducatifs',
    path: '/games', // Route interne
    desc: '',
    icon: <Gamepad2 className="w-6 h-6 text-cyan-400" />,
    tag: 'Jeux',
    active: true,
    isProtected: false
  },
  {
    id: 'quiz',
    name: 'Quiz',
    path: '/quiz',
    desc: 'Participez à des quiz interactifs en temps réel.',
    icon: <Gamepad2 className="w-6 h-6 text-purple-400" />,
    tag: 'Quiz',
    active: true,
    isProtected: false
  },
  {
    id: 'alerte',
    name: 'Alerte périscolaire',
    path: '#',
    desc: 'Gestion des alertes et notifications.',
    icon: <Bell className="w-6 h-6 text-red-400" />,
    tag: 'Admin',
    active: true,
    isProtected: false,
    requiresSchoolAuth: true
  },
  {
    id: 'events',
    name: 'Evénements',
    path: '#',
    desc: 'Calendrier et organisation.',
    icon: <Calendar className="w-6 h-6 text-yellow-400" />,
    tag: 'Vie scolaire',
    active: true,
    isProtected: false,
    requiresSchoolAuth: true
  }
];

// --- COMPOSANT CARTE ---
const ModuleCard = ({ app, locked }) => {
  const { theme } = React.useContext(ThemeContext);
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const baseClasses = "group relative flex flex-col p-4 rounded-2xl border transition-all duration-300 overflow-hidden";
  const activeClasses = isDark ? "bg-slate-900/50 border-slate-800 hover:border-cyan-500/30 hover:bg-slate-800/80 backdrop-blur-md cursor-pointer" : "bg-white border-slate-200 hover:border-cyan-500/50 hover:bg-slate-50/80 backdrop-blur-md cursor-pointer shadow-sm";
  const inactiveClasses = isDark ? "bg-slate-900/20 border-slate-800/50 opacity-70 grayscale hover:opacity-100 hover:grayscale-0 cursor-not-allowed" : "bg-slate-100 border-slate-200 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 cursor-not-allowed";

  // Gestion du clic sécurisé
  const handleClick = (e) => {
    if (locked) {
      e.preventDefault();
      return;
    }

    if (!app.active) {
      e.preventDefault();
      return;
    }

    // Navigation interne
    if (app.path) {
      e.preventDefault();
      navigate(app.path);
      return;
    }

    // Si c'est une carte privée avec URL cachée, on décode et on ouvre
    if (app.encodedUrl) {
      e.preventDefault();
      const realLink = decodeLink(app.encodedUrl);
      window.open(realLink, '_blank');
    }
  };

  return (
    <motion.a
      onClick={handleClick}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={app.active ? { scale: 1.02, y: -2 } : {}}
      whileTap={app.active ? { scale: 0.98 } : {}}
      className={`${baseClasses} ${app.active ? activeClasses : inactiveClasses} ${locked ? 'cursor-not-allowed' : ''}`}
    >
      {app.active && (
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}

      <div className={`flex flex-col h-full w-full ${locked ? 'blur-sm select-none' : ''}`}>
        <div className="flex items-center gap-3 mb-2 relative z-10">
          <div className={`p-2 rounded-xl border shadow-sm transition-colors ${isDark ? (app.active ? 'bg-slate-950 border-slate-800 group-hover:border-slate-700' : 'bg-slate-900/50 border-slate-800') : (app.active ? 'bg-slate-50 border-slate-200 group-hover:border-slate-300' : 'bg-slate-100 border-slate-200')}`}>
            {app.icon}
          </div>
          <h3 className={`text-base font-semibold flex-1 transition-colors ${isDark ? (app.active ? 'text-slate-100 group-hover:text-cyan-100' : 'text-slate-400') : (app.active ? 'text-slate-800 group-hover:text-cyan-700' : 'text-slate-500')}`}>
            {app.name}
          </h3>
          {app.active && (
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors -rotate-45 group-hover:rotate-0" />
          )}
        </div>

        <div className="mt-auto relative z-10 flex items-center justify-between">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {app.tag}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${app.active ? 'bg-emerald-500 shadow-emerald-500/50' : isDark ? 'bg-slate-600' : 'bg-slate-300'}`}></span>
        </div>
      </div>

      {locked && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-slate-900/50 p-3 rounded-full backdrop-blur-sm border border-white/10 shadow-xl">
            <Lock className="w-6 h-6 text-white/90" />
          </div>
        </div>
      )}
    </motion.a>
  );
};

// --- PAGE D'ACCUEIL ---
const Home = () => {
  const { theme, toggleTheme } = React.useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [isSchoolUnlocked, setIsSchoolUnlocked] = useState(false);

  const handleSchoolAuth = (e) => {
    e.preventDefault();
    if (isSchoolUnlocked) return;

    const pwd = prompt("Mot de passe Espace école :");
    if (pwd === "StpbbFLAUD@") {
      setIsSchoolUnlocked(true);
    } else if (pwd !== null) {
      alert("Mot de passe incorrect.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 h-screen flex flex-col overflow-hidden">
        
        {/* Navbar */}
        <nav className="flex justify-end items-center mb-6 gap-2 shrink-0">
          <button onClick={handleSchoolAuth} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm'} ${isSchoolUnlocked ? 'ring-2 ring-emerald-500/50' : ''}`}>
            <School size={18} />
            {isSchoolUnlocked ? 'Espace école (Débloqué)' : 'Espace école'}
          </button>
          <button onClick={toggleTheme} className={`p-2 transition-colors rounded-lg ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}>
             {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
          <button className={`p-2 transition-colors rounded-lg ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}>
             <Settings className="w-6 h-6" />
          </button>
        </nav>

        {/* En-tête Centré */}
        <div className="flex flex-col items-center text-center mb-8 space-y-6 shrink-0">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
             className="flex flex-col items-center gap-4"
          >
            {/* LOGO ET TITRE */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center">
                <img 
                  src={logoSvg} 
                  alt="Logo Edoxia" 
                  className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                />
              </div>
              <h1 className={`text-4xl md:text-6xl font-bold tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Edoxia
              </h1>
            </div>

            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-base md:text-lg font-light`}>
              Portail d'accès centralisé
            </p>
          </motion.div>

          {/* News Frame */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`relative w-full max-w-md p-4 rounded-xl border backdrop-blur-sm text-left ${isDark ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white/60 border-slate-200'}`}
          >
             <div className="flex items-center gap-2 mb-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>Nouveautés</h3>
             </div>
             <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
               - Bienvenue sur Edoxia. Merci beaucoup pour vos visites !<br />
               - Les scores sont réinitialisés chaque mois. À vous de jouer !<br />
               - Ajout du mode entrainement et du mode audio pour les jeux<br />
               - Pour la partie "Espace école", veuillez contacter Robin.<br />
             </p>
          </motion.div>
        </div>

        {/* Grille des Modules */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4 px-1 flex-1 min-h-0"
        >
          <AnimatePresence mode="popLayout">
            {MODULES.map((app) => (
              <ModuleCard 
                key={app.id} 
                app={app} 
                locked={app.requiresSchoolAuth && !isSchoolUnlocked}
              />
            ))}
          </AnimatePresence>
        </motion.div>

    </div>
  );
};

// --- APP PRINCIPALE ---
export default function App() {
  const [theme, setTheme] = useState('dark');
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Router>
        <div className={`min-h-screen relative selection:bg-cyan-500/20 overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
          
          {/* Background animé */}
          <div className="fixed inset-0 -z-10">
            <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[128px] animate-blob ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-500/20'}`} />
            <div className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-[128px] animate-blob animation-delay-2000 ${isDark ? 'bg-violet-500/10' : 'bg-violet-500/20'}`} />
            <div className={`absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] ${isDark ? 'opacity-[0.03]' : 'opacity-[0.05]'}`} />
          </div>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/games" element={<GamesHome />} />
            <Route path="/games/maths" element={<MathsGames />} />
            <Route path="/games/french" element={<FrenchGames />} />
            <Route path="/quiz" element={<QuizHome />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/host/:lobbyId" element={<HostGame />} />
            <Route path="/play/:lobbyId" element={<PlayerGame />} />
          </Routes>
        </div>
      </Router>
    </ThemeContext.Provider>
  );
}
