import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, arrayUnion, collection, query, where, onSnapshot } from 'firebase/firestore';
import { Lock, ArrowRight, ArrowLeft, Users, Play, RotateCcw } from 'lucide-react';

export default function Home() {
  const [code, setCode] = useState('');
  const [pseudo, setPseudo] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeLobbies, setActiveLobbies] = useState([]);
  const [resumeSession, setResumeSession] = useState(null);

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
    if (resumeSession) {
      // On remet en sessionStorage pour PlayerGame
      sessionStorage.setItem('playerData', JSON.stringify(resumeSession));
      navigate(`/play/${resumeSession.lobbyId}`);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 space-y-8 pb-20">
      <div className="w-full max-w-6xl flex justify-start items-center">
        <Link to="/" className="flex flex-shrink-0 items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-brand-text bg-white/40 rounded-full border border-white/50 hover:bg-white/80 transition-all shadow-soft backdrop-blur-md w-fit">
          <ArrowLeft size={18} />
          Retour Accueil
        </Link>
      </div>

      <div className="text-center space-y-2 mt-10">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-5xl font-bold tracking-tight text-brand-text">Edoxia Quiz</h1>
        </div>
        <p className="text-brand-text/60 font-semibold uppercase tracking-widest text-sm">Quiz & Jeux</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl">
        <div className="w-full md:w-1/2">
          <div className="relative group h-full">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-teal to-brand-coral rounded-[30px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-white/40 p-8 rounded-[30px] border border-white/50 space-y-6 shadow-soft h-full flex flex-col justify-center backdrop-blur-xl">

              {/* BOUTON REPRENDRE SESSION */}
              {resumeSession && (
                <div className="mb-6 bg-brand-teal/10 border border-brand-teal/20 p-4 rounded-[20px] flex items-center justify-between animate-in fade-in slide-in-from-top-4 shadow-sm">
                  <div className="text-left">
                    <p className="text-xs text-brand-teal uppercase font-bold tracking-widest">Partie détectée</p>
                    <p className="text-brand-text font-black">{resumeSession.pseudo} <span className="text-brand-text/50 font-semibold">dans</span> {resumeSession.lobbyId}</p>
                  </div>
                  <button onClick={resumeGame} className="bg-brand-teal hover:bg-brand-teal/90 text-white p-3 rounded-full shadow-soft transition-all" title="Reprendre"><RotateCcw size={20} /></button>
                </div>
              )}

              <h2 className="text-2xl font-black text-center mb-6 text-brand-text">Rejoindre via Code</h2>
              <input
                type="text"
                placeholder="Code (6 caractères)"
                maxLength={6}
                className="w-full bg-white/60 border border-white/50 rounded-2xl p-4 text-center uppercase tracking-widest text-lg text-brand-text focus:border-brand-teal focus:bg-white outline-none transition-all shadow-inner font-black placeholder-brand-text/40"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />

              <input
                type="text"
                placeholder="Votre Pseudo"
                className="w-full bg-white/60 border border-white/50 rounded-2xl p-4 text-brand-text focus:border-brand-teal focus:bg-white outline-none font-black text-center shadow-inner transition-all placeholder-brand-text/40"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
              />

              <button onClick={(e) => { e.preventDefault(); handleJoin(); }} disabled={loading} className="w-full bg-brand-coral hover:bg-brand-coral/90 text-white font-black text-lg py-4 rounded-2xl transition-all shadow-soft active:scale-95 disabled:opacity-50 mt-4">
                {loading ? 'Connexion...' : 'Rejoindre 🎮'}
              </button>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2">
          <div className="bg-white/40 border border-white/50 rounded-[30px] p-8 h-full min-h-[300px] backdrop-blur-xl shadow-soft">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-brand-text">
              <Users className="text-brand-teal" size={24} /> Parties en cours
            </h2>
            {activeLobbies.length === 0 ? (
              <div className="text-brand-text/50 text-center mt-10 font-bold">Aucune partie publique accessible.</div>
            ) : (
              <div className="space-y-4">
                {activeLobbies.map((lobby) => (
                  <div key={lobby.id} className="flex items-center justify-between p-5 bg-white/60 rounded-[20px] border border-white/50 hover:border-brand-teal hover:bg-white shadow-sm transition-all group">
                    <div>
                      <div className="font-black text-xl tracking-widest flex items-center gap-3 text-brand-text">
                        {lobby.id}
                        {lobby.mode === 'async' && <span className="text-[10px] bg-brand-peach text-brand-text px-3 py-1 rounded-full shadow-sm">SOIRÉE</span>}
                      </div>
                      <div className="text-sm font-bold text-brand-text/60 mt-1">{lobby.players?.length || 0} joueurs</div>
                    </div>
                    <button onClick={() => handleJoin(lobby.id)} className="bg-white hover:bg-brand-teal text-brand-teal hover:text-white border border-brand-teal/20 hover:border-brand-teal px-5 py-3 rounded-full text-sm font-black transition-all flex items-center gap-2 shadow-sm">
                      Rejoindre <Play size={16} fill="currentColor" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center w-full max-w-5xl mt-12">
        <div className="bg-white/30 p-6 rounded-[24px] border border-white/40 transition cursor-not-allowed group relative overflow-hidden flex items-center gap-5 w-full md:w-auto opacity-60 grayscale shadow-sm backdrop-blur-sm">
          <div className="p-4 bg-brand-coral/10 rounded-2xl text-brand-coral transition"><Lock size={24} /></div>
          <div><h3 className="text-xl font-black text-brand-text">Espace Admin</h3><p className="text-sm font-bold text-brand-text/60">Gérer les quiz et les parties</p></div>
          <div className="ml-4 opacity-0 transition"><ArrowRight size={20} /></div>
        </div>
      </div>
    </div>
  );
}