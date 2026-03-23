import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { ArrowLeft, Users, Trophy, Play, Keyboard, Medal, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TypingHost() {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const [lobby, setLobby] = useState(null);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (!lobbyId) return;
    const unsubLobby = onSnapshot(doc(db, 'typing_lobbies', lobbyId), (docSnap) => {
      if (docSnap.exists()) {
        setLobby({ id: docSnap.id, ...docSnap.data() });
      }
    });

    const qPlayers = query(collection(db, 'typing_lobbies', lobbyId, 'players'), orderBy('score', 'desc'));
    const unsubPlayers = onSnapshot(qPlayers, (snap) => {
      setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubLobby();
      unsubPlayers();
    };
  }, [lobbyId]);

  const handleStartGame = async () => {
    if (!lobbyId) return;
    const now = Date.now();
    await updateDoc(doc(db, 'typing_lobbies', lobbyId), {
      status: 'playing',
      startTime: now + 5000, // 5 seconds preparation
      endTime: now + 5000 + 120000 // 2 minutes game
    });
  };

  const handleUpdateGameType = async (type) => {
    if (!lobbyId) return;
    await updateDoc(doc(db, 'typing_lobbies', lobbyId), {
      gameType: type
    });
  };

  const handleResetLobby = async () => {
    if (!lobbyId || players.length === 0) return;

    // 1. Find the player(s) with the highest score
    const maxScore = Math.max(...players.map(p => p.score || 0));
    const winners = players.filter(p => (p.score || 0) === maxScore && maxScore > 0);

    // 2. Increment wins for winners and reset scores for all
    for (const player of players) {
      const isWinner = winners.some(w => w.id === player.id);
      await updateDoc(doc(db, 'typing_lobbies', lobbyId, 'players', player.id), {
        score: 0,
        wins: (player.wins || 0) + (isWinner ? 1 : 0)
      });
    }

    // 3. Reset lobby status
    await updateDoc(doc(db, 'typing_lobbies', lobbyId), {
      status: 'waiting',
      startTime: null,
      endTime: null
    });
  };

  const handleEndGame = async () => {
    if (!lobbyId) return;
    await updateDoc(doc(db, 'typing_lobbies', lobbyId), {
      status: 'finished'
    });
  };

  // Automatically end game if time is up
  useEffect(() => {
    if (lobby?.status === 'playing' && lobby.endTime) {
      const interval = setInterval(() => {
        if (Date.now() >= lobby.endTime) {
          handleEndGame();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lobby]);

  if (!lobby) return <div className="min-h-screen bg-brand-bg flex items-center justify-center text-white font-bold">Chargement...</div>;

  const titlePrefix = "Code de la partie :";

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col font-sans">
      <header className="shrink-0 p-6 flex justify-between items-center shadow-soft bg-white/40 backdrop-blur-md">
        <button onClick={() => navigate('/games/typing')} className="flex items-center gap-2 font-bold text-brand-text hover:text-brand-coral transition-colors">
          <ArrowLeft size={20} /> Retour
        </button>
        <div className="text-xl font-black tracking-widest text-brand-coral uppercase">
          Tableau de bord Professeur
        </div>
        <div className="w-20"></div> {/* Spacer */}
      </header>

      <main className="flex-1 p-8 flex flex-col max-w-7xl mx-auto w-full">
        {lobby.status === 'waiting' && (
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <h1 className="text-3xl font-bold text-brand-text/60 mb-2">{titlePrefix}</h1>
            <div className="text-8xl md:text-9xl font-black tracking-widest text-brand-teal mb-12 drop-shadow-md">
              {lobby.code}
            </div>
            
            <div className="bg-white/40 p-8 rounded-[40px] border border-white/50 w-full max-w-4xl shadow-soft">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                <h2 className="text-3xl font-black flex items-center gap-3">
                  <Users className="text-brand-coral" size={28} /> Joueurs en attente ({players.length})
                </h2>
                <button 
                  onClick={handleStartGame}
                  disabled={players.length === 0}
                  className="bg-brand-teal hover:bg-brand-teal/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-4 rounded-3xl font-black transition-all shadow-lg flex items-center gap-2 text-lg active:scale-95"
                >
                  <Play fill="white" size={24} /> Lancer la partie
                </button>
              </div>

              <div className="flex flex-col items-center mb-10">
                <div className="text-sm font-black text-brand-text/40 mb-4 uppercase tracking-[0.2em]">
                  Configuration de la manche
                </div>
                <div className="flex p-1.5 bg-white/60 border border-white rounded-[24px] shadow-inner w-full max-w-lg">
                  <button 
                    onClick={() => handleUpdateGameType('2min200words')}
                    className={`flex-1 py-4 rounded-[20px] font-black transition-all ${
                      (lobby.gameType || '2min200words') === '2min200words' 
                      ? 'bg-brand-teal text-white shadow-md' 
                      : 'text-brand-text/60 hover:bg-white/50'
                    }`}
                  >
                    Standard (200 mots)
                  </button>
                  <button 
                    onClick={() => handleUpdateGameType('2minHARDchara')}
                    className={`flex-1 py-4 rounded-[20px] font-black transition-all ${
                      lobby.gameType === '2minHARDchara' 
                      ? 'bg-brand-teal text-white shadow-md' 
                      : 'text-brand-text/60 hover:bg-white/50'
                    }`}
                  >
                    Hard (Ç, À, î, ë...)
                  </button>
                </div>
              </div>
              
              <div className="border-t border-brand-text/5 pt-8">
                <div className="text-sm font-black text-brand-text/40 mb-6 uppercase tracking-widest text-center">
                  Prêts à en découdre
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                  {players.length === 0 ? (
                    <p className="text-brand-text/40 font-medium py-8 italic w-full text-center">En attente des premiers élèves...</p>
                  ) : (
                    players.map(p => (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        key={p.id} 
                        className="bg-white/80 px-6 py-3 rounded-2xl font-bold text-brand-text shadow-sm border border-white flex items-center gap-3 backdrop-blur-sm"
                      >
                        <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse"></span>
                        {p.firstName} {p.lastName}
                        {p.wins > 0 && (
                          <span className="flex items-center gap-1 text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-lg text-xs font-black">
                            <Medal size={12} fill="currentColor" /> {p.wins}
                          </span>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {lobby.status === 'playing' && (
          <div className="flex flex-col flex-1">
            <div className="flex justify-between items-end mb-8">
               <div>
                  <h1 className="text-4xl font-black text-brand-text flex items-center gap-3">
                    <Keyboard className="text-brand-teal" size={32} /> Partie en cours !
                  </h1>
                   <p className="text-brand-text/50 font-bold mt-2">Les scores se mettent à jour en temps réel.</p>
                   <div className="mt-4 px-4 py-1.5 bg-white/40 border border-white rounded-full inline-flex items-center gap-2 text-xs font-black text-brand-text/40 uppercase tracking-widest backdrop-blur-sm">
                      Mode: {lobby.gameType === '2minHARDchara' ? 'Hard' : 'Standard'}
                   </div>
                </div>
                <div className="text-3xl font-black text-brand-coral bg-brand-coral/10 px-6 py-2 rounded-2xl border border-brand-coral/20">
                  <Countdown endTime={lobby.endTime} />
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
              {players.map((p, idx) => (
                <motion.div layout key={p.id} className="bg-white/60 p-5 rounded-3xl border border-white shadow-soft flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-black text-brand-text/20 w-8 text-center">{idx + 1}</span>
                    <div className="flex flex-col">
                      <div className="font-bold text-lg">{p.firstName} {p.lastName}</div>
                      {p.wins > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-black text-yellow-600 uppercase tracking-tighter">
                          <Medal size={10} fill="currentColor" /> {p.wins} {p.wins === 1 ? 'Victoire' : 'Victoires'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-2xl font-black text-brand-teal w-16 text-right">
                    {p.score} <span className="text-xs text-brand-text/40">mots</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {lobby.status === 'finished' && (
          <div className="flex flex-col items-center flex-1">
            <div className="bg-white/40 border border-white px-6 py-2 rounded-full mb-8 font-black text-brand-text/40 text-sm uppercase tracking-widest backdrop-blur-md">
              Mode: {lobby.gameType === '2minHARDchara' ? 'Hard (Caractères Spéciaux)' : 'Standard (200 mots)'}
            </div>
            <div className="flex justify-between items-center w-full max-w-5xl mb-8">
              <h1 className="text-5xl font-black text-brand-text flex items-center gap-4">
                <Trophy className="text-brand-coral" size={48} /> Podium
              </h1>
              <button 
                onClick={handleResetLobby}
                className="bg-brand-teal hover:bg-brand-teal/80 text-white px-8 py-4 rounded-3xl font-black transition-all shadow-lg flex items-center gap-2 scale-110 active:scale-105"
              >
                <PlusCircle size={20} /> Relancer une partie
              </button>
            </div>
            
            {/* Podium */}
            <div className="flex items-end justify-center h-64 gap-4 md:gap-8 mb-16 w-full max-w-3xl border-b-4 border-white/20 pb-4">
               {/* 2nd Place */}
               {players[1] && (
                 <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="w-1/3 flex flex-col items-center">
                   <div className="font-bold text-center mb-2">{players[1].firstName}</div>
                   <div className="bg-slate-300 w-full h-32 rounded-t-2xl shadow-lg border-2 border-slate-400 flex flex-col items-center justify-start pt-4 relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-t from-slate-400/20 to-transparent"></div>
                     <Medal size={32} className="text-slate-500 mb-2 drop-shadow-md" />
                     <div className="text-2xl font-black text-slate-700">{players[1].score}</div>
                   </div>
                 </motion.div>
               )}
               {/* 1st Place */}
               {players[0] && (
                 <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="w-1/3 flex flex-col items-center -mt-8">
                   <div className="font-black text-lg text-brand-coral text-center mb-2">{players[0].firstName}</div>
                   <div className="bg-yellow-400 w-full h-44 rounded-t-2xl shadow-[0_0_30px_rgba(250,204,21,0.4)] border-2 border-yellow-500 flex flex-col items-center justify-start pt-4 relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-t from-yellow-600/20 to-transparent"></div>
                     <Trophy size={48} className="text-yellow-600 mb-2 drop-shadow-md" />
                     <div className="text-3xl font-black text-yellow-800">{players[0].score}</div>
                   </div>
                 </motion.div>
               )}
               {/* 3rd Place */}
               {players[2] && (
                 <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="w-1/3 flex flex-col items-center mt-8">
                   <div className="font-bold text-center mb-2">{players[2].firstName}</div>
                   <div className="bg-amber-600 w-full h-24 rounded-t-2xl shadow-lg border-2 border-amber-700 flex flex-col items-center justify-start pt-4 relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-t from-amber-800/20 to-transparent"></div>
                     <Medal size={24} className="text-amber-800 mb-2 drop-shadow-md" />
                     <div className="text-xl font-black text-amber-900">{players[2].score}</div>
                   </div>
                 </motion.div>
               )}
            </div>

            {/* List of other players */}
            <div className="w-full max-w-3xl bg-white/40 border border-white/50 rounded-3xl p-6 shadow-soft">
              <h3 className="text-xl font-black mb-6 text-brand-text/60">Classement Complet</h3>
              <div className="space-y-3">
                {players.map((p, idx) => (
                  <div key={p.id} className="flex justify-between items-center p-3 hover:bg-white/50 rounded-xl transition-colors border-b border-brand-text/5 last:border-0">
                    <div className="flex items-center gap-4">
                      <span className="font-black text-brand-text/30 w-6">{idx + 1}.</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">{p.firstName} {p.lastName}</span>
                        {p.wins > 0 && (
                          <span className="flex items-center gap-1 text-xs font-black text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-200">
                            <Medal size={12} fill="currentColor" /> {p.wins}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-black text-brand-teal">{p.score} <span className="text-xs font-bold text-brand-text/40">mots</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper Countdown
function Countdown({ endTime }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const update = () => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeft(Math.floor(remaining / 1000));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;
  return <span>{min}:{sec.toString().padStart(2, '0')}</span>;
}
