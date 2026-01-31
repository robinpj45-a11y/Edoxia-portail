import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Gamepad2, 
  BookOpen, 
  Sparkles, 
  HelpCircle,
  Settings,
  ArrowRight,
  Lock,
  GraduationCap,
  Bell,
  Calendar,
  X,
  CreditCard
} from 'lucide-react';

// IMPORT DU LOGO PERSO
import logoSvg from './assets/logo.svg'; 

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
const PUBLIC_MODULES = [
  {
    id: 'games',
    name: 'Jeux éducatifs',
    url: 'https://edoxia-games.netlify.app/', // Lien visible car public
    desc: 'Activités ludiques pour renforcer les acquis.',
    icon: <Gamepad2 className="w-6 h-6 text-cyan-400" />,
    tag: 'Élèves',
    active: true,
    isProtected: false
  },
  {
    id: 'tcg',
    name: 'Edoxia TCG',
    url: '#', // Remplace par le vrai lien TCG si tu l'as
    desc: 'Jeu de cartes à collectionner éducatif.',
    icon: <CreditCard className="w-6 h-6 text-orange-400" />,
    tag: 'Jeu',
    active: true,
    isProtected: false
  },
  {
    id: 'teacher-access',
    name: 'Espace enseignant STPBB',
    url: '#',
    desc: 'Accès réservé au personnel de l\'établissement.',
    icon: <Lock className="w-6 h-6 text-red-400" />,
    tag: 'Privé',
    active: true,
    isProtected: true // Déclenche le mot de passe
  },
  // --- MODULES EN ATTENTE ---
  {
    id: 'soon-1',
    name: 'Bientôt disponible',
    url: '#',
    desc: 'Module en cours de développement.',
    icon: <HelpCircle className="w-6 h-6 text-slate-500" />,
    tag: 'Futur',
    active: false,
    isProtected: false
  },
  {
    id: 'soon-2',
    name: 'Bientôt disponible',
    url: '#',
    desc: 'Une nouvelle fonctionnalité arrive.',
    icon: <HelpCircle className="w-6 h-6 text-slate-500" />,
    tag: 'Futur',
    active: false,
    isProtected: false
  },
  {
    id: 'soon-3',
    name: 'Bientôt disponible',
    url: '#',
    desc: 'Extension de la suite Edoxia.',
    icon: <HelpCircle className="w-6 h-6 text-slate-500" />,
    tag: 'Futur',
    active: false,
    isProtected: false
  },
];

// --- CONFIGURATION DES MODULES PRIVÉS (Enseignants) ---
// LES URLS SONT ENCODÉES EN BASE64 POUR NE PAS APPARAITRE EN CLAIR DANS LE CODE
// Tu peux générer tes propres codes sur : https://www.base64encode.org/
const TEACHER_MODULES = [
  {
    id: 'gen-diff',
    name: 'Génération & Différenciation',
    // C'est le code Base64 pour : https://edoxia-diff.netlify.app/
    encodedUrl: 'aHR0cHM6Ly9lZG94aWEtZGlmZi5uZXRsaWZ5LmFwcC8=', 
    desc: 'Création de cours et étayage automatique.',
    icon: <BookOpen className="w-6 h-6 text-violet-400" />,
    tag: 'Pédagogie',
    active: true
  },
  {
    id: 'alerte',
    name: 'Edoxia Alerte',
    // Code Base64 factice (remplace par le tien encodé). Ex: https://alerte.stpbb.org
    encodedUrl: 'aHR0cHM6Ly9lZG94aWEtYWxlcnQubmV0bGlmeS5hcHA=', 
    desc: 'Système de notification et suivi vie scolaire.',
    icon: <Bell className="w-6 h-6 text-rose-400" />,
    tag: 'Vie Scolaire',
    active: true
  },
  {
    id: 'event',
    name: 'Edoxia Event',
    // Code Base64 factice. Ex: https://event.stpbb.org
    encodedUrl: 'aHR0cHM6Ly9lZG94aWEtZXZlbnQubmV0bGlmeS5hcHA=', 
    desc: 'Gestion des événements et calendrier.',
    icon: <Calendar className="w-6 h-6 text-emerald-400" />,
    tag: 'Agenda',
    active: true
  },
];

// --- COMPOSANT CARTE ---
const ModuleCard = ({ app, onClickOverride }) => {
  const baseClasses = "group relative flex flex-col p-5 rounded-2xl border transition-all duration-300 overflow-hidden";
  const activeClasses = "bg-slate-900/50 border-slate-800 hover:border-cyan-500/30 hover:bg-slate-800/80 backdrop-blur-md cursor-pointer";
  const inactiveClasses = "bg-slate-900/20 border-slate-800/50 opacity-70 grayscale hover:opacity-100 hover:grayscale-0 cursor-not-allowed";

  // Gestion du clic sécurisé
  const handleClick = (e) => {
    if (!app.active) {
      e.preventDefault();
      return;
    }

    // Si c'est une carte protégée (Espace Enseignant), on gère le clic manuellement
    if (onClickOverride) {
      e.preventDefault();
      onClickOverride();
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
      href={app.encodedUrl ? '#' : app.url}
      onClick={handleClick}
      target={app.active && !app.encodedUrl && !onClickOverride ? "_blank" : undefined}
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
        <span className={`text-xs font-mono px-2 py-1 rounded border ${app.id === 'teacher-access' ? 'bg-red-900/20 text-red-300 border-red-800/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
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
  const [isTeacherView, setIsTeacherView] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Détermine quels modules afficher (Public ou Enseignant)
  const currentModules = isTeacherView ? TEACHER_MODULES : PUBLIC_MODULES;

  const filtered = currentModules.filter(app => 
    app.name.toLowerCase().includes(query.toLowerCase()) ||
    app.tag.toLowerCase().includes(query.toLowerCase())
  );

  // Gère l'ouverture du modal
  const handleTeacherAccess = () => {
    setShowPasswordModal(true);
    setErrorMsg('');
    setPasswordInput('');
  };

  // Vérification du mot de passe
  const verifyPassword = (e) => {
    e.preventDefault();
    if (passwordInput === 'StpbbFLAUD@') {
      setIsTeacherView(true);
      setShowPasswordModal(false);
      setQuery(''); // Reset recherche
    } else {
      setErrorMsg('Accès refusé. Mot de passe incorrect.');
    }
  };

  const handleBackToStudent = () => {
    setIsTeacherView(false);
    setQuery('');
  };

  return (
    <div className="min-h-screen relative selection:bg-cyan-500/20 overflow-hidden">
      
      {/* Background animé */}
      <div className="fixed inset-0 -z-10 bg-[#020617]">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] animate-blob" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[128px] animate-blob animation-delay-2000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Navbar */}
        <nav className="flex justify-between items-center mb-12">
          {isTeacherView ? (
             <button 
               onClick={handleBackToStudent}
               className="flex items-center gap-2 px-4 py-2 text-sm text-cyan-400 bg-cyan-950/30 rounded-lg border border-cyan-900/50 hover:bg-cyan-900/50 transition-colors"
             >
               ← Retour Espace Élèves
             </button>
          ) : (
            <div className="w-1"></div> // Spacer
          )}
          <button className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50">
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
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter">
                Edoxia
              </h1>
            </div>

            <p className="text-slate-400 text-lg md:text-xl font-light">
              {isTeacherView ? (
                <span className="text-violet-400 font-medium flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" /> Espace Enseignant STPBB
                </span>
              ) : (
                "Portail d'accès centralisé"
              )}
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
                placeholder={isTeacherView ? "Rechercher un outil enseignant..." : "Rechercher un outil pédagogique..."}
                className="w-full bg-transparent border-none py-4 px-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-0"
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
                // Si la carte est protégée, on passe la fonction d'ouverture du modal
                onClickOverride={app.isProtected ? handleTeacherAccess : null}
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

      {/* MODAL MOT DE PASSE */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl shadow-black/50"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-red-400" />
                  Accès Restreint
                </h3>
                <button 
                  onClick={() => setShowPasswordModal(false)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={verifyPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Mot de passe Enseignant
                  </label>
                  <input 
                    type="password"
                    autoFocus
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                    placeholder="••••••••••••"
                  />
                </div>

                {errorMsg && (
                  <p className="text-red-400 text-sm animate-pulse">
                    {errorMsg}
                  </p>
                )}

                <button 
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold rounded-lg shadow-lg shadow-red-900/20 transition-all active:scale-95"
                >
                  Déverrouiller
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}