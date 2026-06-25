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
  UserPlus,
  Users,
  Mic2
} from 'lucide-react';

// IMPORT DU LOGO PERSO
import logoPng from './assets/logo.png';
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
import EdoxiaJSWrapper from './Edoxia-JS/pages/EdoxiaJSWrapper';
import SongPage from './Edoxia-JS/pages/SongPage';
import MapInteractivePage from './Edoxia-JS/pages/MapInteractivePage';
import StudentSearchPage from './Edoxia-JS/pages/StudentSearchPage';
import AdminScorePage from './Edoxia-JS/pages/AdminScorePage';
import PublicScorePage from './Edoxia-JS/pages/PublicScorePage';
import ReportBug from './modules/ReportBug';
import CompteurUser from './modules/CompteurUser';
import QOLHubPage from './Edoxia-QOL/pages/QOLHubPage';
import EdoxiaCDWrapper from './Edoxia-CD/pages/EdoxiaCDWrapper';
import CDHubPage from './Edoxia-CD/pages/CDHubPage';
import CDRoomPlanner from './Edoxia-CD/pages/CDRoomPlanner';
import CDStudentSearchPage from './Edoxia-CD/pages/CDStudentSearchPage';
import CDGroupMakerPage from './Edoxia-CD/pages/CDGroupMakerPage';
import SuccessHubPage from './Edoxia-Success/pages/SuccessHubPage';
import SuccessSpacePage from './Edoxia-Success/pages/SuccessSpacePage';
import SuccessEvaluationDetail from './Edoxia-Success/pages/SuccessEvaluationDetail';
import SuccessReportsPage from './Edoxia-Success/pages/SuccessReportsPage';
import EdoxiaRepartWrapper from './Edoxia-Repart/pages/EdoxiaRepartWrapper';
import RepartPage from './Edoxia-Repart/pages/RepartPage';
import RepartCollegePage from './Edoxia-Repart/pages/RepartCollegePage';
import SuccessEvaluationCreator from './Edoxia-Success/pages/SuccessEvaluationCreator';
import EdoxiaKaraokeWrapper from './Edoxia-Karaoke/pages/EdoxiaKaraokeWrapper';
import KaraokeScreenPage from './Edoxia-Karaoke/pages/KaraokeScreenPage';
import KaraokeRemotePage from './Edoxia-Karaoke/pages/KaraokeRemotePage';

// Imports pour l'Espace TEST
import EventAppTest from './Edoxia-Event-TEST/EventApp';
import HubPageTest from './Edoxia-JS-TEST/pages/HubPage';
import MobileTeamsPageTest from './Edoxia-JS-TEST/pages/MobileTeamsPage';
import TeacherPageTest from './Edoxia-JS-TEST/pages/TeacherPage';
import AdminPageTest from './Edoxia-JS-TEST/pages/AdminPage';
import EdoxiaJSWrapperTest from './Edoxia-JS-TEST/pages/EdoxiaJSWrapper';
import SongPageTest from './Edoxia-JS-TEST/pages/SongPage';
import MapInteractivePageTest from './Edoxia-JS-TEST/pages/MapInteractivePage';
import StudentSearchPageTest from './Edoxia-JS-TEST/pages/StudentSearchPage';
import AdminScorePageTest from './Edoxia-JS-TEST/pages/AdminScorePage';
import PublicScorePageTest from './Edoxia-JS-TEST/pages/PublicScorePage';
import QOLHubPageTest from './Edoxia-QOL-TEST/pages/QOLHubPage';
import EdoxiaCDWrapperTest from './Edoxia-CD-TEST/pages/EdoxiaCDWrapper';
import CDHubPageTest from './Edoxia-CD-TEST/pages/CDHubPage';
import CDRoomPlannerTest from './Edoxia-CD-TEST/pages/CDRoomPlanner';
import CDStudentSearchPageTest from './Edoxia-CD-TEST/pages/CDStudentSearchPage';
import CDGroupMakerPageTest from './Edoxia-CD-TEST/pages/CDGroupMakerPage';
import SuccessHubPageTest from './Edoxia-Success-TEST/pages/SuccessHubPage';
import SuccessSpacePageTest from './Edoxia-Success-TEST/pages/SuccessSpacePage';
import SuccessEvaluationDetailTest from './Edoxia-Success-TEST/pages/SuccessEvaluationDetail';
import SuccessReportsPageTest from './Edoxia-Success-TEST/pages/SuccessReportsPage';
import SuccessEvaluationCreatorTest from './Edoxia-Success-TEST/pages/SuccessEvaluationCreator';
import EdoxiaRepartWrapperTest from './Edoxia-Repart-TEST/pages/EdoxiaRepartWrapper';
import RepartPageTest from './Edoxia-Repart-TEST/pages/RepartPage';
import RepartCollegePageTest from './Edoxia-Repart-TEST/pages/RepartCollegePage';
import GlobalAdminTest from './GlobalAdminTest';
import WorldCupApp from './Edoxia-WorldCup/pages/WorldCupApp';

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

const DEFAULT_MODULES = [
  {
    id: 'stpbb',
    name: 'QoL',
    path: '/stpbb',
    desc: 'Qualité de vie',
    icon: <Sun className="w-6 h-6 text-brand-teal" />,
    tag: 'Vie scolaire',
    active: true,
    requiresSchoolAuth: false
  },
  {
    id: 'success',
    name: 'Réussite scolaire',
    path: '/success',
    desc: 'Suivi pédagogique',
    icon: <Calculator className="w-6 h-6 text-brand-teal" />,
    active: true,
    isProtected: false,
    requiresSchoolAuth: false
  },
  {
    id: 'karaoke',
    name: 'Karaoké Box',
    path: '/karaoke/remote',
    desc: 'Karaoké collaboratif',
    icon: <Mic2 className="w-6 h-6 text-indigo-400" />,
    tag: 'Jeux',
    active: true,
    isProtected: false,
    requiresSchoolAuth: false
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

  // --- AUTO-RELOAD APRÈS INACTIVITÉ (Pour s'assurer d'avoir la dernière version) ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.setItem('lastHiddenAt', Date.now().toString());
      } else if (document.visibilityState === 'visible') {
        const lastHiddenAt = localStorage.getItem('lastHiddenAt');
        if (lastHiddenAt) {
          const timeHidden = Date.now() - parseInt(lastHiddenAt, 10);
          // Si l'application est restée en arrière-plan pendant plus de 2 heures (7200000 ms), on force le rafraîchissement
          if (timeHidden > 7200000) {
            window.location.reload();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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

      {/* Navbar Mobile (Bottom) */}
      {location.pathname !== '/' && !location.pathname.startsWith('/JS2026') && !location.pathname.startsWith('/test-JS2026') && !location.pathname.startsWith('/events') && !location.pathname.startsWith('/test-events') && !location.pathname.startsWith('/cd') && !location.pathname.startsWith('/test-cd') && !location.pathname.startsWith('/success') && !location.pathname.startsWith('/test-success') && !location.pathname.startsWith('/stpbb') && !location.pathname.startsWith('/test-stpbb') && !location.pathname.startsWith('/karaoke') && !location.pathname.startsWith('/worldcup') && (
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

          {user && (
            <button onClick={() => signOut(auth)} className="flex flex-col items-center gap-1 p-2 text-brand-text/40 hover:text-brand-coral transition-colors">
              <LogOut className="w-6 h-6" />
              <span className="text-[10px] font-bold">Quitter</span>
            </button>
          )}
        </nav>
      )}

      {/* Contenu des Routes */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence>
          {isSidebarOpen && location.pathname !== '/' && (
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
          <Route path="/events" element={<EventApp user={user} />} />
          <Route path="/events/:eventId" element={<EventApp user={user} />} />
          <Route path="/repart" element={<EdoxiaRepartWrapper />}>
            <Route index element={<RepartPage />} />
            <Route path="college" element={<RepartCollegePage />} />
          </Route>
          <Route path="/JS2026" element={<EdoxiaJSWrapper />}>
            <Route index element={<HubPage />} />
            <Route path="teams" element={<MobileTeamsPage />} />
            <Route path="teacher" element={<TeacherPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="song" element={<SongPage />} />
            <Route path="map" element={<MapInteractivePage />} />
            <Route path="search" element={<StudentSearchPage />} />
            <Route path="scores" element={<AdminScorePage />} />
            <Route path="live-scores" element={<PublicScorePage />} />
          </Route>
          <Route path="/stpbb" element={<QOLHubPage />} />
          <Route path="/cd" element={<EdoxiaCDWrapper />}>
            <Route index element={<CDHubPage />} />
            <Route path="rooms" element={<CDRoomPlanner />} />
            <Route path="search" element={<CDStudentSearchPage />} />
            <Route path="groups" element={<CDGroupMakerPage />} />
          </Route>
          <Route path="/success">
            <Route index element={<SuccessHubPage />} />
            <Route path=":spaceId" element={<SuccessSpacePage />} />
            <Route path=":spaceId/create" element={<SuccessEvaluationCreator />} />
            <Route path=":spaceId/eval/:evalId" element={<SuccessEvaluationDetail />} />
            <Route path=":spaceId/reports" element={<SuccessReportsPage />} />
          </Route>
          <Route path="/karaoke" element={<EdoxiaKaraokeWrapper />}>
            <Route index element={<KaraokeScreenPage />} />
            <Route path="remote" element={<KaraokeRemotePage />} />
          </Route>
          
          <Route path="/worldcup/*" element={<WorldCupApp />} />

          {/* Routes de l'Espace TEST */}
          <Route path="/test-global-admin" element={<GlobalAdminTest />} />
          <Route path="/test-events" element={<EventAppTest user={user} />} />
          <Route path="/test-events/:eventId" element={<EventAppTest user={user} />} />
          <Route path="/test-repart" element={<EdoxiaRepartWrapperTest />}>
            <Route index element={<RepartPageTest />} />
            <Route path="college" element={<RepartCollegePageTest />} />
          </Route>
          <Route path="/test-JS2026" element={<EdoxiaJSWrapperTest />}>
            <Route index element={<HubPageTest />} />
            <Route path="teams" element={<MobileTeamsPageTest />} />
            <Route path="teacher" element={<TeacherPageTest />} />
            <Route path="admin" element={<AdminPageTest />} />
            <Route path="song" element={<SongPageTest />} />
            <Route path="map" element={<MapInteractivePageTest />} />
            <Route path="search" element={<StudentSearchPageTest />} />
            <Route path="scores" element={<AdminScorePageTest />} />
            <Route path="live-scores" element={<PublicScorePageTest />} />
          </Route>
          <Route path="/test-stpbb" element={<QOLHubPageTest />} />
          <Route path="/test-cd" element={<EdoxiaCDWrapperTest />}>
            <Route index element={<CDHubPageTest />} />
            <Route path="rooms" element={<CDRoomPlannerTest />} />
            <Route path="search" element={<CDStudentSearchPageTest />} />
            <Route path="groups" element={<CDGroupMakerPageTest />} />
          </Route>
          <Route path="/test-success">
            <Route index element={<SuccessHubPageTest />} />
            <Route path=":spaceId" element={<SuccessSpacePageTest />} />
            <Route path=":spaceId/create" element={<SuccessEvaluationCreatorTest />} />
            <Route path=":spaceId/eval/:evalId" element={<SuccessEvaluationDetailTest />} />
            <Route path=":spaceId/reports" element={<SuccessReportsPageTest />} />
          </Route>
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
const Home = () => {
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const handleStpbbClick = () => {
    const isUnlocked = localStorage.getItem('stpbb_unlocked') === 'true';
    if (isUnlocked) {
      navigate('/stpbb');
    } else {
      setShowPasswordModal(true);
      setPasswordInput('');
      setPasswordError(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === 'FFlaud!') {
      localStorage.setItem('stpbb_unlocked', 'true');
      setShowPasswordModal(false);
      navigate('/stpbb');
    } else {
      setPasswordError(true);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-brand-bg relative overflow-hidden h-full w-full">
      {/* Decorative blurred blobs for extra premium feel */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-brand-teal/20 rounded-full blur-[96px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-coral/20 rounded-full blur-[96px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-2xl w-full flex flex-col items-center text-center gap-6 z-10 bg-white/40 backdrop-blur-2xl p-6 md:p-8 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
          className="relative"
        >
          <div className="absolute inset-0 bg-white/60 blur-2xl rounded-full scale-125 -z-10" />
          <img src={logoPng} alt="Logo Edoxia" className="w-24 h-24 md:w-28 md:h-28 object-contain drop-shadow-xl relative z-10" />
        </motion.div>

        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-brand-text mb-3">
            Bienvenue sur <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-coral to-brand-teal">Edoxia</span>
          </h1>
          <p className="text-brand-text/60 font-medium text-sm md:text-base max-w-md mx-auto leading-relaxed">
            Votre portail d'accès aux différents espaces de gestion et d'accompagnement.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center mt-2">
          <button 
            disabled
            className="w-full sm:w-60 flex flex-col items-center justify-center gap-1 bg-white/50 text-brand-text/40 font-bold py-4 rounded-[20px] cursor-not-allowed border border-white/30 backdrop-blur-md transition-all relative overflow-hidden group"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-50">Accès restreint</span>
            <span className="text-lg">Espace Parents</span>
            <div className="absolute inset-0 bg-slate-200/50 -z-10" />
          </button>
          
          <button 
            onClick={handleStpbbClick}
            className="w-full sm:w-60 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-brand-coral to-[#ff6b6b] hover:from-[#ff6b6b] hover:to-brand-coral text-white font-bold py-4 rounded-[20px] transition-all shadow-[0_8px_30px_-8px_rgba(255,127,80,0.5)] hover:shadow-[0_12px_40px_-8px_rgba(255,127,80,0.7)] hover:-translate-y-0.5 active:scale-95 border border-white/20"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-90 text-white/90">Accès portail</span>
            <span className="text-lg">Espace STPBB</span>
          </button>
          
          <button 
            onClick={() => navigate('/test-stpbb')}
            className="w-full sm:w-60 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 text-white font-bold py-4 rounded-[20px] transition-all shadow-soft hover:shadow-lg hover:-translate-y-0.5 active:scale-95 border border-white/20"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-90 text-white/90">Environnement isolé</span>
            <span className="text-lg">Espace TEST</span>
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[150] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white/90 backdrop-blur-2xl border border-white/60 p-6 md:p-8 rounded-[30px] w-full max-w-sm relative shadow-2xl text-center text-brand-text"
            >
              <button 
                onClick={() => setShowPasswordModal(false)} 
                className="absolute top-4 right-4 text-brand-text/50 hover:text-brand-coral transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-4 flex justify-center">
                <div className="p-3 bg-brand-coral/10 rounded-full">
                  <Lock className="w-6 h-6 text-brand-coral" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-brand-text mb-2">Accès Sécurisé</h2>
              <p className="text-brand-text/60 mb-6 text-sm">
                Veuillez entrer le mot de passe pour accéder à l'Espace STPBB.
              </p>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <input
                  type="password"
                  placeholder="Mot de passe"
                  className="w-full bg-white/60 border border-white/80 rounded-2xl p-3 text-brand-text focus:border-brand-teal outline-none placeholder:text-brand-text/30 shadow-inner text-center font-medium"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (passwordError) setPasswordError(false);
                  }}
                  autoFocus
                />
                
                {passwordError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs font-semibold"
                  >
                    Mot de passe incorrect
                  </motion.p>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-brand-coral to-[#ff6b6b] hover:from-[#ff6b6b] hover:to-brand-coral text-white font-bold py-3 rounded-2xl transition-all shadow-[0_4px_15px_rgba(255,127,80,0.3)] active:scale-95 border border-white/20"
                >
                  Valider
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
