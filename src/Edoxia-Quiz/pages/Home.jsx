import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, arrayUnion, collection, query, where, onSnapshot, setDoc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification, updateProfile } from 'firebase/auth';
import { Lock, ArrowRight, Users, Play, RotateCcw, LogIn, User, X, LogOut } from 'lucide-react';

export default function Home() {
  const [code, setCode] = useState('');
  const [pseudo, setPseudo] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeLobbies, setActiveLobbies] = useState([]);
  const [resumeSession, setResumeSession] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPwd, setAuthPwd] = useState('');
  const [authName, setAuthName] = useState('');
  const [authFirstname, setAuthFirstname] = useState('');
  const [authPseudo, setAuthPseudo] = useState('');
  const auth = getAuth();

  // 1. Détection de session existante (LocalStorage)
  useEffect(() => {
    const savedSession = localStorage.getItem('edoxia_session');
    if (savedSession) {
        setResumeSession(JSON.parse(savedSession));
    }
  }, []);

  // 2. Écoute des lobbys publics
  useEffect(() => {
    const q = query(collection(db, "lobbies"), where("status", "in", ["waiting", "playing"])); // On affiche aussi "playing" pour le mode soirée
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lobbies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // On filtre : en mode Live seulement waiting, en mode Async waiting et playing
      const visibleLobbies = lobbies.filter(l => l.status === 'waiting' || (l.status === 'playing' && l.mode === 'async'));
      setActiveLobbies(visibleLobbies);
    });
    return () => unsubscribe();
  }, []);

  // 3. Gestion Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser);
        const userRef = doc(db, "users", currentUser.uid);
        getDoc(userRef).then((snap) => {
          if (!snap.exists()) setDoc(userRef, { email: currentUser.email, role: currentUser.email === "robinpj45@gmail.com" ? 'admin' : 'élève', createdAt: new Date() });
          else if (currentUser.email === "robinpj45@gmail.com" && snap.data().role !== 'admin') updateDoc(userRef, { role: 'admin' });
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleJoin = async (lobbyCode) => {
    const targetCode = typeof lobbyCode === 'string' ? lobbyCode : code;

    if (!targetCode || !pseudo) {
      alert("Merci de renseigner un pseudo !");
      return;
    }
    setLoading(true);

    try {
      const lobbyRef = doc(db, "lobbies", targetCode.toUpperCase());
      const lobbySnap = await getDoc(lobbyRef);

      if (lobbySnap.exists()) {
        const lobbyData = lobbySnap.data();
        
        // Vérification si le jeu est accessible
        const isOpen = lobbyData.status === 'waiting' || (lobbyData.status === 'playing' && lobbyData.mode === 'async');
        
        if (isOpen) {
            // Vérification si le joueur existe déjà (pour reprise de progression)
            const existingPlayer = lobbyData.players?.find(p => p.pseudo.toLowerCase() === pseudo.trim().toLowerCase());
            let playerData;

            if (existingPlayer) {
                playerData = existingPlayer;
            } else {
                const playerId = Date.now().toString();
                const initialIndex = lobbyData.status === 'playing' ? 0 : -1;
                playerData = {
                    id: playerId,
                    pseudo: pseudo.trim(),
                    score: 0,
                    currentQuestionIndex: initialIndex, // Progression individuelle
                    answers: {}, // Historique des réponses pour la review
                    hasAnswered: false
                };
                await updateDoc(lobbyRef, {
                  players: arrayUnion(playerData)
                });
            }

            // Sauvegarde Session Longue Durée
            const sessionData = { lobbyId: targetCode.toUpperCase(), ...playerData };
            localStorage.setItem('edoxia_session', JSON.stringify(sessionData));
            sessionStorage.setItem('playerData', JSON.stringify(playerData)); // Backward compatibility

            navigate(`/play/${targetCode.toUpperCase()}`);
        } else {
            alert("Ce lobby est fermé ou la partie a déjà commencé (Mode Live).");
        }
      } else {
        alert("Lobby introuvable !");
      }
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la connexion.");
    }
    setLoading(false);
  };

  const resumeGame = () => {
      if(resumeSession) {
          // On remet en sessionStorage pour PlayerGame
          sessionStorage.setItem('playerData', JSON.stringify(resumeSession));
          navigate(`/play/${resumeSession.lobbyId}`);
      }
  };

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
        alert("Compte créé ! Un email de vérification a été envoyé.");
        setIsRegistering(false);
      } else {
        const res = await signInWithEmailAndPassword(auth, authEmail, authPwd);
        if (!res.user.emailVerified) {
          await signOut(auth);
          alert("Veuillez vérifier votre email.");
          return;
        }
        setShowAuthModal(false);
      }
    } catch (error) { alert("Erreur: " + error.message); }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      setShowAuthModal(false);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 space-y-8 pb-20">
      <div className="w-full max-w-6xl flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 px-4 py-2 text-sm text-cyan-400 bg-cyan-950/30 rounded-lg border border-cyan-900/50 hover:bg-cyan-900/50 transition-colors">
           ← Retour Accueil
        </Link>
      </div>

      <div className="text-center space-y-2 mt-10">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-orange-400 rounded rotate-45"></div>
          <h1 className="text-5xl font-bold tracking-tight text-white">Edoxia Quiz</h1>
        </div>
        <p className="text-slate-400">Quiz & Jeux</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl">
        <div className="w-full md:w-1/2">
            <div className="relative group h-full">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-slate-900/80 p-8 rounded-xl border border-slate-700/50 space-y-4 shadow-2xl h-full flex flex-col justify-center backdrop-blur-xl">
                
                {/* BOUTON REPRENDRE SESSION */}
                {resumeSession && (
                    <div className="mb-6 bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                        <div className="text-left">
                            <p className="text-xs text-blue-300 uppercase font-bold">Partie détectée</p>
                            <p className="text-white font-bold">{resumeSession.pseudo} <span className="text-gray-400">dans</span> {resumeSession.lobbyId}</p>
                        </div>
                        <button onClick={resumeGame} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg" title="Reprendre"><RotateCcw size={20}/></button>
                    </div>
                )}

                <h2 className="text-xl font-semibold text-center mb-6">Rejoindre via Code</h2>
                <input 
                    type="text" 
                    placeholder="Code (6 caractères)" 
                    maxLength={6}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-center uppercase tracking-widest text-lg text-white focus:border-cyan-500 outline-none transition-colors"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                />
                
                <input 
                    type="text" 
                    placeholder="Votre Pseudo" 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none font-bold text-center"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value)}
                />

                <button onClick={(e) => { e.preventDefault(); handleJoin(); }} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                {loading ? 'Connexion...' : 'Rejoindre'}
                </button>
            </div>
            </div>
        </div>

        <div className="w-full md:w-1/2">
             <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-6 h-full min-h-[300px] backdrop-blur-xl">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Users className="text-green-400" size={20}/> Parties en cours
                </h2>
                {activeLobbies.length === 0 ? (
                    <div className="text-slate-500 text-center mt-10">Aucune partie publique accessible.</div>
                ) : (
                    <div className="space-y-3">
                        {activeLobbies.map((lobby) => (
                            <div key={lobby.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-cyan-500 transition group">
                                <div>
                                    <div className="font-bold text-lg tracking-widest flex items-center gap-2">
                                        {lobby.id}
                                        {lobby.mode === 'async' && <span className="text-[10px] bg-purple-500 px-2 rounded-full text-white">SOIRÉE</span>}
                                    </div>
                                    <div className="text-sm text-slate-400">{lobby.players?.length || 0} joueurs</div>
                                </div>
                                <button onClick={() => handleJoin(lobby.id)} className="bg-slate-700 hover:bg-emerald-500 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2">
                                    Rejoindre <Play size={14}/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
             </div>
        </div>
      </div>

      <div className="flex justify-center w-full max-w-5xl mt-12">
        <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700/50 transition cursor-not-allowed group relative overflow-hidden flex items-center gap-4 w-full md:w-auto opacity-50 grayscale">
            <div className="p-3 bg-red-500/10 rounded-lg text-red-400 transition"><Lock /></div>
            <div><h3 className="text-lg font-bold text-white">Espace Admin</h3><p className="text-sm text-slate-400">Gérer les quiz et les parties</p></div>
            <div className="ml-4 opacity-0 transition"><ArrowRight size={16} /></div>
        </div>
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
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G"/> Continuer avec Google
            </button>

            <p className="mt-6 text-center text-slate-400 text-sm">
              {isRegistering ? "Déjà un compte ?" : "Pas de compte ?"} <button onClick={() => setIsRegistering(!isRegistering)} className="text-cyan-400 hover:underline font-bold">{isRegistering ? "Se connecter" : "S'inscrire"}</button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}