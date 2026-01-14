import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Gamepad2, 
  BookOpen, 
  Sparkles, 
  HelpCircle,
  Settings,
  ArrowRight
} from 'lucide-react';

// IMPORT DU LOGO PERSO
import logoSvg from './assets/logo.svg'; 

// --- CONFIGURATION DES MODULES ---
const MODULES = [
  {
    id: 'games',
    name: 'Jeux éducatifs',
    url: 'https://edoxia-games.netlify.app/',
    desc: 'Activités ludiques pour renforcer les acquis.',
    icon: <Gamepad2 className="w-6 h-6 text-cyan-400" />,
    tag: 'Élèves',
    active: true
  },
  {
    id: 'course-gen',
    name: 'Génération de cours',
    url: 'https://edoxia-diff.netlify.app/',
    desc: 'Niveau / Notion / Thème - Création assistée.',
    icon: <BookOpen className="w-6 h-6 text-violet-400" />,
    tag: 'Enseignant',
    active: true
  },
  {
    id: 'diff',
    name: 'Différenciation',
    url: 'https://edoxia-diff.netlify.app/',
    desc: 'Adaptation et étayage automatique.',
    icon: <Sparkles className="w-6 h-6 text-emerald-400" />,
    tag: 'Inclusion',
    active: true
  },
  // --- MODULES EN ATTENTE ---
  {
    id: 'soon-1',
    name: 'Bientôt disponible',
    url: '#',
    desc: 'Module en cours de développement.',
    icon: <HelpCircle className="w-6 h-6 text-slate-500" />,
    tag: 'Futur',
    active: false
  },
  {
    id: 'soon-2',
    name: 'Bientôt disponible',
    url: '#',
    desc: 'Une nouvelle fonctionnalité arrive.',
    icon: <HelpCircle className="w-6 h-6 text-slate-500" />,
    tag: 'Futur',
    active: false
  },
  {
    id: 'soon-3',
    name: 'Bientôt disponible',
    url: '#',
    desc: 'Extension de la suite Edoxia.',
    icon: <HelpCircle className="w-6 h-6 text-slate-500" />,
    tag: 'Futur',
    active: false
  },
];

// --- COMPOSANT CARTE ---
const ModuleCard = ({ app }) => {
  const baseClasses = "group relative flex flex-col p-5 rounded-2xl border transition-all duration-300 overflow-hidden";
  const activeClasses = "bg-slate-900/50 border-slate-800 hover:border-cyan-500/30 hover:bg-slate-800/80 backdrop-blur-md cursor-pointer";
  const inactiveClasses = "bg-slate-900/20 border-slate-800/50 opacity-70 grayscale hover:opacity-100 hover:grayscale-0 cursor-not-allowed";

  return (
    <motion.a
      href={app.active ? app.url : undefined}
      onClick={(e) => !app.active && e.preventDefault()}
      target={app.active ? "_blank" : undefined}
      rel="noopener noreferrer"
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={app.active ? { scale: 1.02, y: -2 } : {}}
      whileTap={app.active ? { scale: 0.98 } : {}}
      className={`${baseClasses} ${app.active ? activeClasses : inactiveClasses}`}
    >
      {app.active && (
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-2.5 rounded-xl border shadow-sm transition-colors ${app.active ? 'bg-slate-950 border-slate-800 group-hover:border-slate-700' : 'bg-slate-900/50 border-slate-800'}`}>
          {app.icon}
        </div>
        {app.active && (
          <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors -rotate-45 group-hover:rotate-0" />
        )}
      </div>

      <h3 className={`text-lg font-semibold mb-1 relative z-10 transition-colors ${app.active ? 'text-slate-100 group-hover:text-cyan-100' : 'text-slate-400'}`}>
        {app.name}
      </h3>
      <p className="text-slate-400 text-sm leading-relaxed mb-6 relative z-10">
        {app.desc}
      </p>

      <div className="mt-auto relative z-10 flex items-center justify-between">
        <span className="text-xs font-mono px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
          {app.tag}
        </span>
        <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${app.active ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-slate-600'}`}></span>
      </div>
    </motion.a>
  );
};

// --- APP PRINCIPALE ---
export default function App() {
  const [query, setQuery] = useState('');

  const filtered = MODULES.filter(app => 
    app.name.toLowerCase().includes(query.toLowerCase()) ||
    app.tag.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen relative selection:bg-cyan-500/20 overflow-hidden">
      
      {/* Background animé */}
      <div className="fixed inset-0 -z-10 bg-[#020617]">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] animate-blob" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[128px] animate-blob animation-delay-2000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Navbar Simplifiée (Juste le bouton settings à droite) */}
        <nav className="flex justify-end items-center mb-12">
          <button className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50">
             <Settings className="w-6 h-6" />
          </button>
        </nav>

        {/* En-tête Centré avec Logo SANS CADRE */}
        <div className="flex flex-col items-center text-center mb-16 space-y-8">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
             className="flex flex-col items-center gap-6"
          >
            {/* LOGO ET TITRE CENTRAL */}
            <div className="flex items-center gap-5 md:gap-6">
              
              {/* Le Logo SVG Personnalisé (NETTOYÉ) */}
              <div className="flex items-center justify-center">
                <img 
                  src={logoSvg} 
                  alt="Logo Edoxia" 
                  className="w-14 h-14 md:w-20 md:h-20 object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                />
              </div>
              
              {/* Le Titre */}
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter">
                Edoxia
              </h1>
            </div>

            <p className="text-slate-400 text-lg md:text-xl font-light">
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
            <div className="relative flex items-center bg-slate-900/80 border border-slate-700/50 rounded-xl backdrop-blur-xl focus-within:border-cyan-500/50 transition-colors shadow-2xl">
              <Search className="ml-4 w-5 h-5 text-slate-500" />
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un outil pédagogique..."
                className="w-full bg-transparent border-none py-4 px-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-0"
              />
            </div>
          </motion.div>
        </div>

        {/* Grille de 6 Fenêtres */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <AnimatePresence>
            {filtered.map((app) => (
              <ModuleCard key={app.id} app={app} />
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
             <p className="text-slate-600">Aucun module trouvé.</p>
          </div>
        )}

      </div>
    </div>
  );
}