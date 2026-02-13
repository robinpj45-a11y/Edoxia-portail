import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification, updateProfile } from 'firebase/auth';
import {
  Search,
  Gamepad2,
  Settings,
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  School,
  Bell,
  Calendar,
  Lock,
  BookOpen,
  GraduationCap,
  Calculator,
  Languages,
  FlaskConical,
  LogIn,
  User,
  LogOut,
  X,
  Menu,
  Trophy
} from 'lucide-react';

// IMPORT DU LOGO PERSO
import logoSvg from './assets/logo.svg';
import HomeGames from './Edoxia-Games/pages/HomeGames.jsx';
import MathsGames from './Edoxia-Games/pages/MathsGames';
import FrenchGames from './Edoxia-Games/pages/FrenchGames';
import QuizHome from './Edoxia-Quiz/pages/Home';
import AdminDashboard from './Edoxia-Quiz/pages/AdminDashboard';
import HostGame from './Edoxia-Quiz/pages/HostGame';
import PlayerGame from './Edoxia-Quiz/pages/PlayerGame';
import { ThemeContext } from './ThemeContext';
import EventApp from './Edoxia-Event/EventApp';
import GlobalAdmin from './GlobalAdmin';
import ProfilePage from './ProfilePage';
import HubPage from './Edoxia-JS/pages/HubPage';
import MobileTeamsPage from './Edoxia-JS/pages/MobileTeamsPage';
import TeacherPage from './Edoxia-JS/pages/TeacherPage';
import AdminPage from './Edoxia-JS/pages/AdminPage';
import ReportBug from './modules/ReportBug';
import CompteurUser from './modules/CompteurUser';
import GVGDC from './Edoxia-QVGDC/pages/GVGDC';
import DashboardQVGDC from './Edoxia-QVGDC/pages/DashboardQVGDC';

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

// --- MAPPING DES ICÔNES ---
const ICON_MAP = {
  Gamepad2, Bell, Calendar, Lock, School, Search, Settings, ArrowRight, Sun, Moon,
  BookOpen, GraduationCap, Calculator, Languages, FlaskConical
};

// --- CONFIGURATION DES MODULES PUBLICS (Élèves) ---
const DEFAULT_MODULES = [
  {
    id: 'events',
    name: 'Evénements',
    path: '/events',
    desc: 'Calendrier et organisation.',
    icon: <Calendar className="w-6 h-6 text-yellow-400" />,
    tag: 'Vie scolaire',
    active: true,
    isProtected: false,
    requiresSchoolAuth: true
  },
  {
    id: 'sport_stpbb',
    name: 'Journée sportive STPBB',
    path: '/JS2026',
    desc: 'JS 2026',
    icon: <Trophy className="w-6 h-6 text-orange-400" />,
    tag: 'Vie scolaire',
    active: true,
    isProtected: false,
    requiresSchoolAuth: true,
    restrictedToRoles: ['enseignant', 'directeur', 'admin']
  },
  {
    id: 'qvgdc',
    name: 'QVGDC ?',
    path: '/GVGDC',
    desc: 'Qui Veut Gagner Des Cahiers ?',
    icon: <Gamepad2 className="w-6 h-6 text-green-400" />,
    tag: 'Jeux',
    active: true,
    isProtected: false,
    requiresSchoolAuth: false
  }
];

// --- COMPOSANT CARTE ---
const ModuleCard = ({ app, locked, onClick, onNavigate }) => {
  const { theme } = React.useContext(ThemeContext);
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const baseClasses = "group relative flex items-center p-3 rounded-xl border transition-all duration-300 overflow-hidden";
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

    if (onClick) onClick();

    if (onNavigate) {
      e.preventDefault();
      onNavigate(app);
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

      <div className={`flex items-center w-full gap-3 ${locked ? 'blur-sm select-none' : ''}`}>
        <h3 className={`text-sm font-semibold flex-1 transition-colors ${isDark ? (app.active ? 'text-slate-100 group-hover:text-cyan-100' : 'text-slate-400') : (app.active ? 'text-slate-800 group-hover:text-cyan-700' : 'text-slate-500')}`}>
          {app.name}
        </h3>
        {app.active && (
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors -rotate-45 group-hover:rotate-0" />
        )}
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

// --- COMPOSANT ROUTE PROTÉGÉE ---
const ProtectedRoute = ({ isAllowed, children }) => {
  const navigate = useNavigate();
  React.useEffect(() => {
    if (!isAllowed) {
      navigate('/');
    }
  }, [isAllowed, navigate]);
  return isAllowed ? children : null;
};

// --- LAYOUT PRINCIPAL (Contient Navbar + Routes) ---
const AppLayout = () => {
  const { theme, toggleTheme } = React.useContext(ThemeContext);
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPwd, setAuthPwd] = useState('');
  const [authName, setAuthName] = useState('');
  const [authFirstname, setAuthFirstname] = useState('');
  const [authPseudo, setAuthPseudo] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [completeName, setCompleteName] = useState('');
  const [completeFirstname, setCompleteFirstname] = useState('');
  const [modules, setModules] = useState(DEFAULT_MODULES);

  // États globaux
  const [isSchoolUnlocked, setIsSchoolUnlocked] = useState(false);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);

  // QVGDC Password States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingPath, setPendingPath] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        // On set le user tout de suite pour l'UI, puis on mettra à jour avec le rôle
        setUser(currentUser);
        const userRef = doc(db, "users", currentUser.uid);
        getDoc(userRef).then((snap) => {
          let userData = {};
          let role = 'élève';

          if (!snap.exists()) {
            role = currentUser.email === "robinpj45@gmail.com" ? 'admin' : 'élève';
            userData = { email: currentUser.email, role, createdAt: new Date(), lastLogin: new Date() };
            setDoc(userRef, userData);
          } else {
            userData = snap.data();
            role = userData.role || 'élève';
            const updates = { lastLogin: new Date() };
            if (currentUser.email === "robinpj45@gmail.com" && role !== 'admin') {
              role = 'admin';
              updates.role = 'admin';
            }
            updateDoc(userRef, updates);
            userData = { ...userData, ...updates };
          }
          setUser({ ...currentUser, ...userData, role });
          setIsGlobalAdmin(role === 'admin');
        });
      } else {
        setUser(null);
        setIsGlobalAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "modules"), (snapshot) => {
      if (!snapshot.empty) {
        const dbModules = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Fusionner avec les modules par défaut s'ils manquent en base (basé sur le nom)
        const missingDefaults = DEFAULT_MODULES.filter(def => !dbModules.some(dbm => dbm.name === def.name));
        setModules([...dbModules, ...missingDefaults]);
      } else {
        setModules(DEFAULT_MODULES);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- GESTION DE LA PRÉSENCE (Invités + Connectés) ---
  useEffect(() => {
    const updatePresence = async () => {
      let visitorId = localStorage.getItem('visitorId');
      if (!visitorId) {
        visitorId = 'guest_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('visitorId', visitorId);
      }

      try {
        // On écrit dans une collection 'presence' dédiée
        await setDoc(doc(db, "presence", visitorId), {
          lastSeen: new Date(),
          type: user ? 'user' : 'guest',
          uid: user ? user.uid : null
        }, { merge: true });
      } catch (e) { console.error("Erreur présence", e); }
    };

    updatePresence(); // Appel immédiat
    const interval = setInterval(updatePresence, 5 * 60 * 1000); // Rappel toutes les 5 min
    return () => clearInterval(interval);
  }, [user]); // Se relance si le statut de connexion change

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        if (!authName || !authFirstname || !authPseudo) return alert("Veuillez remplir tous les champs.");
        const res = await createUserWithEmailAndPassword(auth, authEmail, authPwd);
        await updateProfile(res.user, { displayName: authPseudo });
        const role = authEmail === "robinpj45@gmail.com" ? 'admin' : 'élève';
        await setDoc(doc(db, "users", res.user.uid), {
          nom: authName,
          prenom: authFirstname,
          pseudo: authPseudo,
          email: authEmail,
          role: role,
          createdAt: new Date()
        });
        await sendEmailVerification(res.user);
        await signOut(auth);
        alert("Compte créé ! Un email de vérification a été envoyé. Veuillez vérifier votre boîte mail (et vos spams).");
        setIsRegistering(false);
      } else {
        const res = await signInWithEmailAndPassword(auth, authEmail, authPwd);
        if (!res.user.emailVerified) {
          await signOut(auth);
          alert("Veuillez vérifier votre email avant de vous connecter.");
          return;
        }
        setShowAuthModal(false);
      }
    } catch (error) { alert("Erreur: " + error.message); }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, new GoogleAuthProvider());
      const userRef = doc(db, "users", res.user.uid);
      const snap = await getDoc(userRef);

      // Si le doc n'existe pas ou s'il manque le nom/prénom, on affiche la modale de complétion
      if (!snap.exists() || !snap.data().nom || !snap.data().prenom) {
        setShowAuthModal(false);
        setShowCompleteProfileModal(true);
      } else {
        setShowAuthModal(false);
      }
    } catch (error) { console.error(error); }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!completeName || !completeFirstname) return alert("Veuillez remplir tous les champs.");

    const userRef = doc(db, "users", auth.currentUser.uid);
    await setDoc(userRef, {
      nom: completeName,
      prenom: completeFirstname
    }, { merge: true });

    setShowCompleteProfileModal(false);
  };

  const isAuthorized = user && (user.role === 'admin' || user.role === 'enseignant');
  const isVisible = (app) => {
    if (app.restrictedToRoles) {
      return user && app.restrictedToRoles.includes(user.role);
    }
    return !app.requiresSchoolAuth || isSchoolUnlocked || isAuthorized;
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === 'stpbb') {
      setShowPasswordModal(false);
      setPasswordInput('');
      setIsSidebarOpen(false);
      if (pendingPath) navigate(pendingPath);
    } else {
      alert("Mot de passe incorrect");
    }
  };

  const handleModuleClick = (app) => {
    // Comportement standard
    setIsSidebarOpen(false);
    if (app.path) {
      navigate(app.path);
    } else if (app.encodedUrl) {
      const realLink = decodeLink(app.encodedUrl);
      window.open(realLink, '_blank');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col relative selection:bg-cyan-500/20 overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      {/* Backgrounds */}
      <div className="fixed inset-0 -z-10">
        <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[128px] animate-blob ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-500/20'}`} />
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-[128px] animate-blob animation-delay-2000 ${isDark ? 'bg-violet-500/10' : 'bg-violet-500/20'}`} />
        <div className={`absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] ${isDark ? 'opacity-[0.03]' : 'opacity-[0.05]'}`} />
      </div>

      {/* Navbar Globale */}
      {!location.pathname.startsWith('/JS2026') && !location.pathname.startsWith('/GVGDC') && !location.pathname.startsWith('/DashboardQVGDC') && (
        <nav className={`flex justify-between items-center p-2 md:p-4 gap-2 shrink-0 z-50 relative border-b backdrop-blur-md transition-colors ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-1 md:p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}>
              <Menu className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <CompteurUser />
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <ReportBug />
            <button onClick={toggleTheme} className={`p-1 md:p-2 transition-colors rounded-lg ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}>
              {isDark ? <Sun className="w-5 h-5 md:w-6 md:h-6" /> : <Moon className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
            <button onClick={() => { if (user) { if (user.role === 'admin') setShowSettingsModal(true); else navigate('/profile'); } else { setShowAuthModal(true); } }} className={`p-1 md:p-2 transition-colors rounded-lg ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}>
              <Settings className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            {user ? (
              <div className="flex items-center gap-1 md:gap-2 ml-1 md:ml-2">
                <span className={`text-xs md:text-sm font-bold flex items-center gap-1 md:gap-2 ${isDark ? 'text-white' : 'text-slate-700'}`}><User size={16} className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">{user.displayName || user.email}</span><span className="sm:hidden">{(user.displayName || user.email).split(' ')[0]}</span></span>
                <button onClick={() => signOut(auth)} className="p-1 md:p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"><LogOut size={16} className="w-4 h-4 md:w-5 md:h-5" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-1 md:gap-2 ml-1 md:ml-2">
                <button onClick={() => { setIsRegistering(true); setShowAuthModal(true); }} className="px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors shadow-sm">S'inscrire</button>
                <button onClick={() => { setIsRegistering(false); setShowAuthModal(true); }} className="px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-sm">Se connecter</button>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Contenu des Routes */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setIsSidebarOpen(false)}
                className="absolute inset-0 bg-black/50 z-[90]"
              />
              <motion.aside
                initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
                transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
                className={`absolute top-0 left-0 bottom-0 w-64 z-[100] border-r p-6 gap-8 overflow-y-auto transition-colors shadow-2xl ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}
              >
                <div className="flex justify-between items-center mb-6">
                  <button onClick={() => { navigate('/'); setIsSidebarOpen(false); }} className={`font-bold text-lg flex items-center gap-2 transition-colors ${isDark ? 'text-white hover:text-cyan-400' : 'text-slate-900 hover:text-cyan-600'}`}>
                    <ArrowLeft size={20} /> Accueil
                  </button>
                  <button onClick={() => setIsSidebarOpen(false)} className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}><X /></button>
                </div>

                {modules.filter(m => (['games', 'quiz'].includes(m.id) || ['Jeux', 'Quiz'].includes(m.tag)) && isVisible(m)).length > 0 && (
                  <div>
                    <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 px-1 flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <Gamepad2 size={14} /> Jeux
                    </h3>
                    <div className="space-y-3">
                      {modules.filter(m => (['games', 'quiz'].includes(m.id) || ['Jeux', 'Quiz'].includes(m.tag)) && isVisible(m)).map(app => (
                        <ModuleCard key={app.id} app={app} locked={false} onNavigate={handleModuleClick} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 px-1 flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <School size={14} /> Espace École
                  </h3>
                  <div className="space-y-3">
                    {modules.filter(m => (['events'].includes(m.id) || ['Vie scolaire'].includes(m.tag)) && isVisible(m)).map(app => (
                      <ModuleCard key={app.id} app={app} locked={false} onNavigate={handleModuleClick} />
                    ))}
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
        <Routes>
          <Route path="/" element={<Home user={user} isSchoolUnlocked={isSchoolUnlocked} />} />
          <Route path="/games" element={<HomeGames />} />
          <Route path="/games/maths" element={<MathsGames />} />
          <Route path="/games/french" element={<FrenchGames />} />
          <Route path="/quiz" element={<QuizHome />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminDashboard isGlobalAdmin={isGlobalAdmin} />} />
          <Route path="/host/:lobbyId" element={<HostGame />} />
          <Route path="/play/:lobbyId" element={<PlayerGame />} />
          <Route path="/global-admin" element={
            <ProtectedRoute isAllowed={isGlobalAdmin}>
              <GlobalAdmin defaultModules={DEFAULT_MODULES} />
            </ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute isAllowed={isSchoolUnlocked || (user && (user.role === 'admin' || user.role === 'enseignant'))}>
              <EventApp user={user} />
            </ProtectedRoute>
          } />
          <Route path="/JS2026" element={<HubPage />} />
          <Route path="/JS2026/teams" element={<MobileTeamsPage />} />
          <Route path="/JS2026/teacher" element={<TeacherPage />} />
          <Route path="/JS2026/admin" element={<AdminPage />} />
          <Route path="/GVGDC" element={<GVGDC />} />
          <Route path="/DashboardQVGDC" element={<DashboardQVGDC />} />
        </Routes>
      </div>

      {/* MODAL AUTH */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-md relative shadow-2xl">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X /></button>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">{isRegistering ? "Créer un compte" : "Connexion"}</h2>

            <form onSubmit={handleAuth} className="space-y-4">
              {isRegistering && (
                <>
                  <div className="flex gap-2"><input type="text" placeholder="Nom" className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none" value={authName} onChange={e => setAuthName(e.target.value)} required /><input type="text" placeholder="Prénom" className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none" value={authFirstname} onChange={e => setAuthFirstname(e.target.value)} required /></div>
                  <input type="text" placeholder="Pseudo" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none" value={authPseudo} onChange={e => setAuthPseudo(e.target.value)} required />
                </>
              )}
              <input type="email" placeholder="Email" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required />
              <input type="password" placeholder="Mot de passe" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none" value={authPwd} onChange={e => setAuthPwd(e.target.value)} required />
              <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-all">{isRegistering ? "S'inscrire" : "Se connecter"}</button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px bg-slate-700 flex-1"></div><span className="text-slate-500 text-sm">OU</span><div className="h-px bg-slate-700 flex-1"></div>
            </div>

            <button onClick={handleGoogleLogin} className="w-full bg-white text-slate-900 font-bold py-3 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G" /> Continuer avec Google
            </button>

            <p className="mt-6 text-center text-slate-400 text-sm">
              {isRegistering ? "Déjà un compte ?" : "Pas de compte ?"} <button onClick={() => setIsRegistering(!isRegistering)} className="text-cyan-400 hover:underline font-bold">{isRegistering ? "Se connecter" : "S'inscrire"}</button>
            </p>
          </div>
        </div>
      )}

      {/* MODAL COMPLETE PROFILE (GOOGLE) */}
      {showCompleteProfileModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-md relative shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Finaliser l'inscription</h2>
            <p className="text-slate-400 text-center mb-6 text-sm">Veuillez renseigner votre nom et prénom pour continuer.</p>

            <form onSubmit={handleCompleteProfile} className="space-y-4">
              <input type="text" placeholder="Nom" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none" value={completeName} onChange={e => setCompleteName(e.target.value)} required />
              <input type="text" placeholder="Prénom" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none" value={completeFirstname} onChange={e => setCompleteFirstname(e.target.value)} required />
              <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-all">Enregistrer</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SETTINGS (ADMIN) */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-sm relative shadow-2xl text-center">
            <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X /></button>
            <h2 className="text-2xl font-bold text-white mb-6">Paramètres</h2>
            <div className="space-y-3">
              <button onClick={() => { setShowSettingsModal(false); navigate('/profile'); }} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2">
                <User size={20} /> Mon Profil
              </button>
              <button onClick={() => { setShowSettingsModal(false); navigate('/global-admin'); }} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2">
                <Settings size={20} /> Administration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PASSWORD QVGDC */}
      {
        showPasswordModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-sm relative shadow-2xl text-center">
              <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X /></button>
              <div className="mb-6 flex justify-center">
                <div className="p-4 bg-cyan-500/10 rounded-full">
                  <Lock className="w-8 h-8 text-cyan-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Accès Restreint</h2>
              <p className="text-slate-400 mb-6 text-sm">Ce module est réservé aux enseignants. Veuillez entrer le mot de passe pour continuer.</p>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <input
                  type="password"
                  placeholder="Mot de passe"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none transition-colors"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-cyan-500/20"
                >
                  Déverrouiller
                </button>
              </form>
            </div>
          </div>
        )
      }
    </div >
  );
};

// --- PAGE D'ACCUEIL (Contenu) ---
const Home = ({ isSchoolUnlocked, user }) => {
  const { theme } = React.useContext(ThemeContext);
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const SLIDES = [
    {
      id: 'games',
      title: 'Jeux Éducatifs',
      desc: 'Mathématiques, Français... Apprends en t\'amusant !',
      path: '/games',
      bgClass: 'bg-gradient-to-br from-cyan-600 to-blue-800',
      icon: <Gamepad2 size={96} className="text-white/10" />
    },
    {
      id: 'quiz',
      title: 'Edoxia Quiz',
      desc: 'Défie tes amis dans des quiz en temps réel.',
      path: '/quiz',
      bgClass: 'bg-gradient-to-br from-purple-600 to-pink-800',
      icon: <Gamepad2 size={96} className="text-white/10" />
    },
    {
      id: 'qvgdc',
      title: 'Qui veut gagner des CRAYONS ?',
      desc: 'Participe à l\'émission culte de l\'école !',
      path: '/GVGDC',
      bgClass: 'bg-gradient-to-br from-yellow-600 to-orange-800',
      icon: <Trophy size={96} className="text-white/10" />
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-full overflow-hidden">
      {/* CONTENU PRINCIPAL (NEWS) */}
      <main className="flex-1 relative overflow-hidden flex flex-col justify-center">
        <div className="max-w-5xl mx-auto px-8 flex flex-col items-center justify-center gap-10 h-full pt-20">

          {/* Logo & Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-row items-center gap-8"
          >
            <div className="relative shrink-0">
              <div className={`absolute inset-0 blur-2xl rounded-full ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-500/30'}`}></div>
              <img
                src={logoSvg}
                alt="Logo Edoxia"
                className="w-32 h-32 relative z-10 object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              />
            </div>

            <div className="text-left">
              <h1 className={`text-7xl font-bold tracking-tighter mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Edoxia
              </h1>
            </div>
          </motion.div>

          {/* HOLIDAY MESSAGE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`text-2xl font-semibold text-center ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}
          >
            Je vous souhaite de très bonnes vacances !
          </motion.div>

          {/* SLIDER */}
          <div className="w-full max-w-3xl h-60 relative rounded-3xl overflow-hidden shadow-2xl group">
            <AnimatePresence mode='wait'>
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                onClick={() => navigate(SLIDES[currentSlide].path)}
                className={`absolute inset-0 ${SLIDES[currentSlide].bgClass} flex flex-col items-center justify-center cursor-pointer hover:brightness-110 transition-all rounded-3xl overflow-hidden`}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {SLIDES[currentSlide].icon}
                </div>

                <div className="relative z-10 text-center p-8">
                  <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{SLIDES[currentSlide].title}</h2>
                  <p className="text-lg text-white/90 font-medium drop-shadow-md">{SLIDES[currentSlide].desc}</p>
                  <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-bold border border-white/30 group-hover:bg-white/30 transition-colors">
                    Accéder <ArrowRight size={16} />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
              {SLIDES.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentSlide(index); }}
                  className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-white w-8' : 'bg-white/40 w-2 hover:bg-white/60'}`}
                />
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

// --- APP PRINCIPALE ---
export default function App() {
  const [theme, setTheme] = useState('dark');
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Router>
        <AppLayout />
      </Router>
    </ThemeContext.Provider>
  );
}
