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
    desc: 'Activités ludiques pour renforcer les acquis.',
    icon: <Gamepad2 className="w-6 h-6 text-cyan-400" />,
    tag: 'Élèves',
    active: true,
    isProtected: false
  },
  {
    id: 'quiz',
    name: 'Quiz',
    path: '/quiz',
    desc: 'Participez à des quiz interactifs en temps réel.',
    icon: <Gamepad2 className="w-6 h-6 text-purple-400" />,
    tag: 'Jeu',
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
  const baseClasses = "group relative flex flex-col p-5 rounded-2xl border transition-all duration-300 overflow-hidden";
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
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className={`p-2.5 rounded-xl border shadow-sm transition-colors ${isDark ? (app.active ? 'bg-slate-950 border-slate-800 group-hover:border-slate-700' : 'bg-slate-900/50 border-slate-800') : (app.active ? 'bg-slate-50 border-slate-200 group-hover:border-slate-300' : 'bg-slate-100 border-slate-200')}`}>
            {app.icon}
          </div>
          {app.active && (
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors -rotate-45 group-hover:rotate-0" />
          )}
        </div>

        <h3 className={`text-lg font-semibold mb-1 relative z-10 transition-colors ${isDark ? (app.active ? 'text-slate-100 group-hover:text-cyan-100' : 'text-slate-400') : (app.active ? 'text-slate-800 group-hover:text-cyan-700' : 'text-slate-500')}`}>
          {app.name}
        </h3>
        <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm leading-relaxed mb-6 relative z-10`}>
          {app.desc}
        </p>

        <div className="mt-auto relative z-10 flex items-center justify-between">
          <span className={`text-xs font-mono px-2 py-1 rounded border ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
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
  const [query, setQuery] = useState('');
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

  const filtered = MODULES.filter(app => 
    app.name.toLowerCase().includes(query.toLowerCase()) ||
    app.tag.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Navbar */}
        <nav className="flex justify-end items-center mb-12 gap-3">
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
        <div className="flex flex-col items-center text-center mb-16 space-y-8">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
             className="flex flex-col items-center gap-6"
          >
            {/* LOGO ET TITRE */}
            <div className="flex items-center gap-5 md:gap-6">
              <div className="flex items-center justify-center">
                <img 
                  src={logoSvg} 
                  alt="Logo Edoxia" 
                  className="w-14 h-14 md:w-20 md:h-20 object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                />
              </div>
              <h1 className={`text-5xl md:text-7xl font-bold tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Edoxia
              </h1>
            </div>

            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-lg md:text-xl font-light`}>
              Portail d'accès centralisé
            </p>
          </motion.div>

          {/* Barre de Recherche */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative w-full max-w-lg group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className={`relative flex items-center border rounded-xl backdrop-blur-xl focus-within:border-cyan-500/50 transition-colors shadow-2xl ${isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white/80 border-slate-200'}`}>
              <Search className="ml-4 w-5 h-5 text-slate-500" />
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un outil..."
                className={`w-full bg-transparent border-none py-4 px-4 placeholder-slate-500 focus:outline-none focus:ring-0 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
              />
            </div>
          </motion.div>
        </div>

        {/* Grille des Modules */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((app) => (
              <ModuleCard 
                key={app.id} 
                app={app} 
                locked={app.requiresSchoolAuth && !isSchoolUnlocked}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
             <p className="text-slate-600">Aucun module trouvé.</p>
          </div>
        )}

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