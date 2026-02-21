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
  Trophy,
  Home as HomeIcon,
  LayoutGrid,
  UserPlus
} from 'lucide-react';

// IMPORT DU LOGO PERSO
import logoPng from './assets/logo.png';
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
import PublicCalendar from './Edoxia-Calendar/pages/PublicCalendar';
import AdminCalendar from './Edoxia-Calendar/pages/AdminCalendar';

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
  },
  {
    id: 'calendar',
    name: 'Calendrier',
    path: '/calendar',
    desc: 'Agenda partagé interactif.',
    icon: <Calendar className="w-6 h-6 text-purple-400" />,
    tag: 'Vie scolaire',
    active: true,
    isProtected: false,
    requiresSchoolAuth: true
  }
];

// --- COMPOSANT CARTE ---
const ModuleCard = ({ app, locked, onClick, onNavigate }) => {
  const navigate = useNavigate();
  const baseClasses = "group relative flex items-center p-3 rounded-[20px] transition-all duration-300 overflow-hidden";
  const activeClasses = "bg-white/50 border border-white/50 hover:bg-white hover:shadow-soft backdrop-blur-md cursor-pointer";
  const inactiveClasses = "bg-white/20 border border-white/20 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 cursor-not-allowed";

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
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-teal/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}

      <div className={`flex items-center w-full gap-3 ${locked ? 'blur-sm select-none' : ''}`}>
        <h3 className={`text-sm font-semibold flex-1 transition-colors ${app.active ? 'text-brand-text group-hover:text-brand-teal' : 'text-brand-text/50'}`}>
          {app.name}
        </h3>
        {app.active && (
          <ArrowRight className="w-4 h-4 text-brand-text/40 group-hover:text-brand-teal transition-colors -rotate-45 group-hover:rotate-0" />
        )}
      </div>

      {locked && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-brand-bg/50 p-3 rounded-full backdrop-blur-sm border border-white/30 shadow-soft">
            <Lock className="w-5 h-5 text-brand-text" />
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

  const renderSidebarContent = () => (
    <>
      <div className="flex justify-between items-center mb-8 shrink-0">
        <h2 className="text-2xl font-bold text-brand-text">Applications</h2>
        <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-white/30 rounded-full text-brand-text hover:text-white hover:bg-brand-coral transition-all shadow-soft"><X size={20} /></button>
      </div>

      {modules.filter(m => (['games', 'quiz'].includes(m.id) || ['Jeux', 'Quiz'].includes(m.tag)) && isVisible(m)).length > 0 || true ? (
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4 px-2 flex items-center gap-2 text-brand-text/60">
            <Gamepad2 size={16} /> Jeux
          </h3>
          <div className="space-y-3">
            <ModuleCard key="edoxia-games" app={{ id: 'static-games', name: 'Edoxia Games', path: '/games', tag: 'Jeux', iconColor: 'text-brand-coral', active: true }} locked={false} onNavigate={handleModuleClick} />
            <ModuleCard key="edoxia-quiz" app={{ id: 'static-quiz', name: 'Edoxia Quiz', path: '/quiz', tag: 'Quiz', iconColor: 'text-brand-teal', active: true }} locked={false} onNavigate={handleModuleClick} />
            {modules.filter(m => (['games', 'quiz'].includes(m.id) || ['Jeux', 'Quiz'].includes(m.tag)) && isVisible(m)).map(app => (
              <ModuleCard key={app.id} app={app} locked={false} onNavigate={handleModuleClick} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4 px-2 flex items-center gap-2 text-brand-text/60">
          <School size={16} /> Espace École
        </h3>
        <div className="space-y-3">
          {modules.filter(m => (['events'].includes(m.id) || ['Vie scolaire'].includes(m.tag)) && isVisible(m)).map(app => (
            <ModuleCard key={app.id} app={app} locked={false} onNavigate={handleModuleClick} />
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-brand-coral/20 overflow-hidden transition-colors duration-300 bg-brand-bg font-sans text-brand-text">
      {/* Backgrounds */}
      <div className="fixed inset-0 -z-10">
        <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[128px] animate-blob ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-500/20'}`} />
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-[128px] animate-blob animation-delay-2000 ${isDark ? 'bg-violet-500/10' : 'bg-violet-500/20'}`} />
        <div className={`absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] ${isDark ? 'opacity-[0.03]' : 'opacity-[0.05]'}`} />
      </div>

      {/* Nouvelle Navbar Globale */}
      {!location.pathname.startsWith('/JS2026') && !location.pathname.startsWith('/GVGDC') && !location.pathname.startsWith('/DashboardQVGDC') && (
        <nav className="hidden md:flex justify-between items-center px-8 py-4 shrink-0 z-50 relative bg-brand-teal text-white shadow-soft">
          {/* Gauche : Logo */}
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 rounded-2xl transition-all duration-300 bg-white/20 text-white shadow-soft border border-white/30 hover:bg-white/30 hover:scale-105">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <img src={logoPng} alt="Logo Edoxia" className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
            </div>
          </div>

          {/* Droite : Search, Auth */}
          <div className="flex flex-1 justify-end items-center gap-6">
            {/* Search Bar */}
            <div className="hidden lg:flex items-center bg-white/20 rounded-full px-5 py-2.5 shadow-soft w-80 border border-white/30 text-white backdrop-blur-md">
              <Search size={16} className="text-white/70 mr-3 shrink-0" />
              <input type="text" placeholder="Rechercher une application ..." className="bg-transparent border-none outline-none text-sm w-full placeholder:text-white/60 text-white" />
            </div>

            {user ? (
              <div className="flex items-center gap-4 text-white">
                <button onClick={() => { if (user.role === 'admin') setShowSettingsModal(true); else navigate('/profile'); }} className="p-3 rounded-full bg-white/20 hover:bg-white/40 transition-all shadow-soft border border-white/30">
                  <User size={20} />
                </button>
                <button onClick={() => signOut(auth)} className="p-3 rounded-full bg-white/20 hover:bg-brand-coral hover:text-white hover:border-brand-coral transition-all shadow-soft border border-white/30 text-white">
                  <LogOut size={20} />
                </button>
                <div className="bg-white/20 rounded-full px-3 py-1 shadow-soft border border-white/30">
                  <ReportBug />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={() => { setIsRegistering(false); setShowAuthModal(true); }} className="px-6 py-2.5 text-sm font-bold text-brand-teal bg-white rounded-full hover:bg-white/90 transition-all shadow-soft active:scale-95">Se connecter</button>
                <button onClick={() => { setIsRegistering(true); setShowAuthModal(true); }} className="px-6 py-2.5 text-sm font-bold text-white bg-brand-coral rounded-full hover:bg-brand-coral/90 transition-all shadow-soft active:scale-95">S'inscrire</button>
                <div className="bg-white/20 rounded-full px-3 py-1 shadow-soft border border-white/30 hidden md:block">
                  <ReportBug />
                </div>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Navbar Mobile (Bottom) */}
      {!location.pathname.startsWith('/games') && !location.pathname.startsWith('/JS2026') && !location.pathname.startsWith('/GVGDC') && !location.pathname.startsWith('/DashboardQVGDC') && !location.pathname.startsWith('/events') && !location.pathname.startsWith('/calendar') && (
        <nav className="md:hidden fixed bottom-6 left-6 right-6 z-[100] bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-brand-text/5 flex justify-around items-center px-2 py-3 backdrop-blur-xl">
          <button onClick={() => navigate('/')} className={`flex flex-col items-center gap-1 p-2 transition-colors ${location.pathname === '/' ? 'text-brand-text' : 'text-brand-text/40 hover:text-brand-coral'}`}>
            <HomeIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold">Accueil</span>
          </button>

          <button onClick={() => setIsSidebarOpen(true)} className={`flex flex-col items-center gap-1 p-2 transition-colors ${isSidebarOpen ? 'text-brand-text' : 'text-brand-text/40 hover:text-brand-coral'}`}>
            <LayoutGrid className="w-6 h-6" />
            <span className="text-[10px] font-bold">Applis</span>
          </button>

          <ReportBug isMobileNav={true} />

          {!user ? (
            <>
              <button onClick={() => { setIsRegistering(false); setShowAuthModal(true); }} className="flex flex-col items-center gap-1 p-2 text-brand-text/40 hover:text-brand-coral transition-colors">
                <LogIn className="w-6 h-6" />
                <span className="text-[10px] font-bold">Connexion</span>
              </button>
              <button onClick={() => { setIsRegistering(true); setShowAuthModal(true); }} className="flex flex-col items-center gap-1 p-2 text-brand-text/40 hover:text-brand-coral transition-colors">
                <UserPlus className="w-6 h-6" />
                <span className="text-[10px] font-bold">Inscription</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { if (user.role === 'admin') setShowSettingsModal(true); else navigate('/profile'); }} className={`flex flex-col items-center gap-1 p-2 transition-colors ${location.pathname === '/profile' ? 'text-brand-text' : 'text-brand-text/40 hover:text-brand-coral'}`}>
                <User className="w-6 h-6" />
                <span className="text-[10px] font-bold">Profil</span>
              </button>
              <button onClick={() => signOut(auth)} className="flex flex-col items-center gap-1 p-2 text-brand-text/40 hover:text-brand-coral transition-colors">
                <LogOut className="w-6 h-6" />
                <span className="text-[10px] font-bold">Quitter</span>
              </button>
            </>
          )}
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
              {/* Desktop Sidebar (Left) */}
              <motion.aside
                initial={{ x: -400 }} animate={{ x: 0 }} exit={{ x: -400 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="hidden md:flex absolute top-0 left-0 bottom-0 w-80 z-[100] p-6 flex-col overflow-y-auto shadow-[20px_0_40px_-10px_rgba(0,0,0,0.1)] bg-brand-bg/90 border-r border-white/50 backdrop-blur-xl"
              >
                {renderSidebarContent()}
              </motion.aside>

              {/* Mobile Sidebar (Top Drawer) */}
              <motion.aside
                initial={{ y: "-100%" }} animate={{ y: 0 }} exit={{ y: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="flex md:hidden absolute top-0 left-0 right-0 z-[100] p-6 flex-col overflow-y-auto max-h-[85vh] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] bg-brand-bg/95 border-b border-white/50 backdrop-blur-xl rounded-b-[40px]"
              >
                {renderSidebarContent()}
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
            <ProtectedRoute isAllowed={isAuthorized}>
              <EventApp user={user} />
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={<PublicCalendar user={user} />} />
          <Route path="/calendar/admin" element={
            <ProtectedRoute isAllowed={isAuthorized}>
              <AdminCalendar />
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
        <div className="fixed inset-0 bg-brand-text/60 backdrop-blur-md flex items-center justify-center z-[150] p-4">
          <div className="bg-brand-bg border border-white/50 p-8 rounded-[30px] w-full max-w-md relative shadow-2xl">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-brand-text/50 hover:text-brand-coral transition-colors"><X /></button>
            <h2 className="text-3xl font-bold text-brand-text mb-6 text-center">{isRegistering ? "Créer un compte" : "Connexion"}</h2>

            <form onSubmit={handleAuth} className="space-y-4">
              {isRegistering && (
                <>
                  <div className="flex gap-4">
                    <input type="text" placeholder="Nom" className="w-1/2 bg-white/40 border border-white/50 rounded-2xl p-4 text-brand-text focus:border-brand-teal outline-none placeholder:text-brand-text/40 shadow-inner" value={authName} onChange={e => setAuthName(e.target.value)} required />
                    <input type="text" placeholder="Prénom" className="w-1/2 bg-white/40 border border-white/50 rounded-2xl p-4 text-brand-text focus:border-brand-teal outline-none placeholder:text-brand-text/40 shadow-inner" value={authFirstname} onChange={e => setAuthFirstname(e.target.value)} required />
                  </div>
                  <input type="text" placeholder="Pseudo" className="w-full bg-white/40 border border-white/50 rounded-2xl p-4 text-brand-text focus:border-brand-teal outline-none placeholder:text-brand-text/40 shadow-inner" value={authPseudo} onChange={e => setAuthPseudo(e.target.value)} required />
                </>
              )}
              <input type="email" placeholder="Email" className="w-full bg-white/40 border border-white/50 rounded-2xl p-4 text-brand-text focus:border-brand-teal outline-none placeholder:text-brand-text/40 shadow-inner" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required />
              <input type="password" placeholder="Mot de passe" className="w-full bg-white/40 border border-white/50 rounded-2xl p-4 text-brand-text focus:border-brand-teal outline-none placeholder:text-brand-text/40 shadow-inner" value={authPwd} onChange={e => setAuthPwd(e.target.value)} required />
              <button type="submit" className="w-full bg-brand-coral hover:bg-brand-coral/80 text-white font-bold py-4 rounded-2xl transition-all shadow-soft mt-4">{isRegistering ? "S'inscrire" : "Se connecter"}</button>
            </form>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px bg-brand-text/10 flex-1"></div><span className="text-brand-text/40 text-sm font-medium">OU</span><div className="h-px bg-brand-text/10 flex-1"></div>
            </div>

            <button onClick={handleGoogleLogin} className="w-full bg-white text-brand-text font-bold py-4 rounded-2xl hover:bg-white/80 transition-all shadow-soft flex items-center justify-center gap-3 border border-white/50">
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="G" /> Continuer avec Google
            </button>

            <p className="mt-8 text-center text-brand-text/60 text-sm font-medium">
              {isRegistering ? "Déjà un compte ?" : "Pas de compte ?"} <button onClick={() => setIsRegistering(!isRegistering)} className="text-brand-teal hover:underline font-bold ml-1">{isRegistering ? "Se connecter" : "S'inscrire"}</button>
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
        <div className="fixed inset-0 bg-brand-text/60 backdrop-blur-md flex items-center justify-center z-[150] p-4">
          <div className="bg-brand-bg border border-white/50 p-8 rounded-[30px] w-full max-w-sm relative shadow-2xl text-center">
            <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 text-brand-text/50 hover:text-brand-coral transition-colors"><X /></button>
            <h2 className="text-2xl font-bold text-brand-text mb-6">Paramètres</h2>
            <div className="space-y-4">
              <button onClick={() => { setShowSettingsModal(false); navigate('/profile'); }} className="w-full bg-white/40 hover:bg-white border border-white/50 text-brand-text font-bold py-4 rounded-2xl transition-all shadow-soft flex items-center justify-center gap-3">
                <User size={20} /> Mon Profil
              </button>
              <button onClick={() => { setShowSettingsModal(false); navigate('/global-admin'); }} className="w-full bg-brand-teal hover:bg-brand-teal/80 text-white font-bold py-4 rounded-2xl transition-all shadow-soft flex items-center justify-center gap-3">
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
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [homeNews, setHomeNews] = useState("Je vous souhaite de bonnes vacances !");

  const SLIDES = [
    {
      id: 'games',
      title: 'Edoxia Games',
      desc: 'Des jeux éducatifs et interactifs pour réviser tout en s\'amusant.',
      icon: <Gamepad2 className="w-12 h-12 text-brand-teal mb-4" />,
      path: '/games'
    },
    {
      id: 'quiz',
      title: 'Edoxia Quiz',
      desc: 'Défiez vos amis ou vos élèves avec des quiz multijoueurs en temps réel.',
      icon: <BookOpen className="w-12 h-12 text-brand-teal mb-4" />,
      path: '/quiz'
    },
    {
      id: 'qvgdc',
      title: 'QVGDC ?',
      desc: 'Qui Veut Gagner Des Cahiers ? Testez votre culture générale !',
      icon: <Trophy className="w-12 h-12 text-brand-teal mb-4" />,
      path: '/GVGDC'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "home_news"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().message !== undefined) {
        setHomeNews(docSnap.data().message);
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-brand-bg relative overflow-hidden h-full">
      <main className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-12 items-center">

        {/* Colonne de Gauche : Contenu & Fonctionnalités */}
        <div className="flex-1 flex flex-col gap-8 z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-brand-text mb-6">
              Viens apprendre<br />en t&apos;amusant !
            </h1>
            <p className="text-lg text-brand-text/80 max-w-md">
              Toutes les applications sont gratuites et disponibles sur mobile et tablette.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 gap-4 max-w-lg"
          >
            {/* Module Actualités */}
            {homeNews && (
              <div className="md:hidden col-span-2 bg-brand-peach/80 rounded-[20px] p-5 shadow-soft border border-white/40 mb-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 bg-brand-coral/20 rounded-full">
                    <Bell size={16} className="text-brand-coral" />
                  </div>
                  <h4 className="text-base font-bold text-brand-text">Actualités</h4>
                </div>
                <p className="text-brand-text/80 text-sm leading-relaxed whitespace-pre-wrap">
                  {homeNews}
                </p>
              </div>
            )}

            {/* CARTE 1 - Games */}
            <div onClick={() => navigate('/games')} className="bg-brand-coral rounded-[20px] p-4 flex items-center gap-4 shadow-soft hover:scale-105 transition-transform cursor-pointer">
              <div className="p-2 bg-black/10 rounded-full shrink-0">
                <Gamepad2 className="w-6 h-6 text-brand-text" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text/60 truncate">Apprendre & Jouer</div>
                <div className="text-sm font-semibold text-brand-text truncate">Jeux</div>
              </div>
            </div>

            {/* CARTE 2 - Quiz */}
            <div onClick={() => navigate('/quiz')} className="bg-brand-teal rounded-[20px] p-4 flex items-center gap-4 shadow-soft hover:scale-105 transition-transform cursor-pointer">
              <div className="p-2 bg-black/10 rounded-full shrink-0">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 truncate">Défier ses amis</div>
                <div className="text-sm font-semibold text-white truncate">Quiz</div>
              </div>
            </div>

            {/* CARTE 3 - QVGDC */}
            <div onClick={() => navigate('/GVGDC')} className="bg-brand-teal rounded-[20px] p-4 flex items-center gap-4 shadow-soft hover:scale-105 transition-transform cursor-pointer">
              <div className="p-2 bg-black/10 rounded-full shrink-0">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 truncate">Culture Générale</div>
                <div className="text-sm font-semibold text-white truncate">QVGDC ?</div>
              </div>
            </div>

            {/* CARTE 4 - Placeholder */}
            <div className="bg-brand-coral rounded-[20px] p-4 flex items-center gap-4 shadow-soft transition-transform cursor-not-allowed opacity-70">
              <div className="p-2 bg-black/10 rounded-full shrink-0">
                <Lock className="w-6 h-6 text-brand-text" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text/60 truncate">Prochainement</div>
                <div className="text-sm font-semibold text-brand-text truncate">Mystère...</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Colonne de Droite : Slider et Apps */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="flex-1 w-full max-w-lg relative bg-white/40 p-4 rounded-[40px] shadow-soft border border-white/60 backdrop-blur-sm z-10"
        >
          <div className="px-4 py-2 border-b border-brand-text/10 flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-brand-text/50"></span>
            <span className="text-xs font-bold tracking-widest text-brand-text/50 uppercase">Mes applications :</span>
          </div>

          {/* Grand Slider */}
          <div className="bg-brand-peach/80 bg-gradient-to-br from-brand-peach to-white/40 rounded-[30px] relative overflow-hidden mb-4 min-h-[300px] flex w-full group shadow-md border border-white/60">
            <button onClick={() => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/10 text-brand-text flex items-center justify-center hover:bg-black/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"><ArrowLeft size={18} /></button>
            <button onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/10 text-brand-text flex items-center justify-center hover:bg-black/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"><ArrowRight size={18} /></button>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 px-12 py-8 flex flex-col justify-center items-center text-center z-10"
              >
                <div className="bg-white/40 p-2.5 rounded-2xl mb-2 shadow-sm backdrop-blur-md border border-white/50">
                  {React.cloneElement(SLIDES[currentSlide].icon, { className: 'w-8 h-8 text-brand-teal' })}
                </div>
                <h3 className="text-xl md:text-2xl font-black text-brand-text mb-2 tracking-tight">{SLIDES[currentSlide].title}</h3>
                <p className="hidden md:block text-xs md:text-sm text-brand-text/80 leading-snug mb-4 max-w-sm line-clamp-3 px-4">{SLIDES[currentSlide].desc}</p>
                <button
                  onClick={() => navigate(SLIDES[currentSlide].path)}
                  className="group/btn flex items-center gap-2 bg-brand-coral text-white font-bold px-6 py-2.5 rounded-full text-sm hover:bg-brand-coral/90 hover:shadow-lg hover:-translate-y-0.5 transition-all mb-4"
                >
                  Y aller <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            </AnimatePresence>

            {/* Slider Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-20">
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${i === currentSlide ? 'w-8 bg-brand-teal' : 'w-2 bg-brand-text/20 hover:bg-brand-text/40'}`}
                />
              ))}
            </div>
          </div>

          {/* Module Actualités - Version Bureau Uniquement */}
          {homeNews && (
            <div className="hidden md:block bg-brand-peach/80 rounded-[24px] p-6 shadow-soft hover:bg-brand-peach transition-colors border border-white/40">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-brand-coral/20 rounded-full">
                  <Bell size={18} className="text-brand-coral" />
                </div>
                <h4 className="text-lg font-bold text-brand-text">Actualités</h4>
              </div>
              <p className="text-brand-text/80 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {homeNews}
              </p>
            </div>
          )}
        </motion.div>
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
