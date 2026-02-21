import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { Trophy, Home, Send, CheckCircle, Clock, Eye } from 'lucide-react';

export default function PlayerGame() {
  const { lobbyId } = useParams();
  const [lobby, setLobby] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [textAnswer, setTextAnswer] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // On essaie localStorage en priorité (pour la persistance), sinon sessionStorage
    const localSession = localStorage.getItem('edoxia_session');
    const sessionSession = sessionStorage.getItem('playerData');

    let user = null;
    if (localSession && JSON.parse(localSession).lobbyId === lobbyId) {
      user = JSON.parse(localSession);
    } else if (sessionSession) {
      user = JSON.parse(sessionSession);
    }

    if (user) { setPlayerData(user); } else { navigate('/'); }

    const unsub = onSnapshot(doc(db, "lobbies", lobbyId), (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      setLobby(data);

      const me = data.players.find(p => p.id === user.id);

      // LOGIQUE RESET (Dépend du mode)
      if (data.mode === 'live') {
        // En LIVE, c'est l'admin qui reset hasAnswered
        if (me && !me.hasAnswered) { setHasAnswered(false); setTextAnswer(''); }
      } else {
        // En ASYNC, on reset dès que l'index local change (géré par submitAnswer)
        // Ici on met juste à jour playerData avec les données fraîches de la BDD (score, index)
        if (me) setPlayerData(me);
      }
    });
    return () => unsub();
  }, [lobbyId, navigate]);

  const submitAnswer = async (payload) => {
    if (hasAnswered || !lobby) return;
    setHasAnswered(true);

    // Déterminer l'index de la question (Global en Live, Perso en Async)
    const qIndex = lobby.mode === 'live' ? lobby.currentQuestion : (playerData.currentQuestionIndex || 0);
    const currentQ = lobby.questions[qIndex];

    let isCorrect = false;
    if (currentQ.type === 'mcq' || currentQ.type === 'tf') isCorrect = currentQ.correct === payload;
    else if (currentQ.type === 'text') isCorrect = String(payload).toLowerCase().trim() === String(currentQ.correct).toLowerCase().trim();

    try {
      await runTransaction(db, async (transaction) => {
        const lobbyRef = doc(db, "lobbies", lobbyId);
        const lobbyDoc = await transaction.get(lobbyRef);
        if (!lobbyDoc.exists()) throw "Erreur Lobby";

        const updatedPlayers = lobbyDoc.data().players.map(p => {
          if (p.id === playerData.id) {
            const newAnswers = { ...p.answers, [qIndex]: payload }; // On stocke la réponse spécifique
            const newScore = (p.score || 0) + (isCorrect ? 100 : 0);

            if (lobby.mode === 'async') {
              // ASYNC : On incrémente l'index perso et on reset hasAnswered immédiatement pour la suivante
              return { ...p, score: newScore, answers: newAnswers, currentQuestionIndex: (p.currentQuestionIndex || 0) + 1 };
            } else {
              // LIVE : On attend l'admin
              return { ...p, score: newScore, answers: newAnswers, hasAnswered: true };
            }
          }
          return p;
        });
        transaction.update(lobbyRef, { players: updatedPlayers });
      });

      // En Async, on débloque l'interface locale immédiatement
      if (lobby.mode === 'async') {
        setTimeout(() => {
          setHasAnswered(false);
          setTextAnswer('');
        }, 500); // Petit délai pour feedback visuel
      }

    } catch (e) { console.error(e); }
  };

  if (!lobby || !playerData) return <div className="p-10 text-center text-white">Chargement...</div>;

  // --- ÉTATS GLOBAUX ---
  if (lobby.status === 'review') return <div className="flex flex-col items-center justify-center h-screen bg-brand-bg p-6 text-center animate-pulse relative overflow-hidden"><div className="absolute inset-0 bg-brand-teal/5 backdrop-blur-[2px]"></div><Eye size={80} className="text-brand-coral mb-6 drop-shadow-sm relative z-10" /><h2 className="text-4xl font-black text-brand-text relative z-10">Vérification...</h2><p className="text-brand-text/60 font-bold mt-2 relative z-10">L'admin passe en revue les réponses.<br /></p></div>;
  if (lobby.status === 'finished') { /* ... Code Podium identique à avant ... */
    const sortedPlayers = [...lobby.players].sort((a, b) => b.score - a.score);
    const myRank = sortedPlayers.findIndex(p => p.id === playerData.id) + 1;
    return (
      <div className="flex flex-col h-screen bg-brand-bg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-coral/10 rounded-full blur-[80px] pointer-events-none translate-x-1/3 -translate-y-1/3"></div>

        <div className="p-8 text-center border-b border-white/50 bg-white/40 backdrop-blur-xl shadow-soft z-10"><h2 className="text-3xl font-black mb-2 text-brand-text">Classement Final</h2><p className="text-brand-text/60 text-sm font-bold uppercase tracking-widest">Tu es <strong className="text-brand-coral text-lg ml-1">#{myRank}</strong></p></div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10">
          <div className="flex justify-center items-end gap-4 mt-6 mb-12">
            {sortedPlayers[1] && <div className="flex flex-col items-center w-1/3"><div className="text-sm font-black mb-2 truncate w-full text-center text-brand-text/80">{sortedPlayers[1].pseudo}</div><div className="w-full h-28 bg-white/60 border border-white/80 rounded-t-[16px] flex items-end justify-center pb-3 shadow-inner"><span className="text-3xl font-black text-brand-text/40">2</span></div><div className="bg-white/80 border border-white/50 border-t-0 w-full text-center text-xs font-bold py-2 rounded-b-[16px] text-brand-text shadow-sm">{sortedPlayers[1].score}</div></div>}
            {sortedPlayers[0] && <div className="flex flex-col items-center w-1/3"><Trophy className="text-brand-coral mb-3 animate-bounce drop-shadow-sm" size={32} /><div className="text-base font-black mb-2 truncate w-full text-center text-brand-coral">{sortedPlayers[0].pseudo}</div><div className="w-full h-36 bg-brand-coral/20 border border-brand-coral/30 rounded-t-[20px] flex items-end justify-center pb-3 shadow-[0_-5px_15px_rgba(206,106,107,0.2)] relative z-10 backdrop-blur-sm"><span className="text-5xl font-black text-brand-coral">1</span></div><div className="bg-brand-coral w-full text-center text-sm py-2 rounded-b-[20px] font-black text-white shadow-soft">{sortedPlayers[0].score}</div></div>}
            {sortedPlayers[2] && <div className="flex flex-col items-center w-1/3"><div className="text-sm font-black mb-2 truncate w-full text-center text-brand-text/80">{sortedPlayers[2].pseudo}</div><div className="w-full h-20 bg-white/40 border border-white/50 rounded-t-[16px] flex items-end justify-center pb-2 shadow-inner"><span className="text-2xl font-black text-brand-text/30">3</span></div><div className="bg-white/60 border border-white/40 border-t-0 w-full text-center text-xs font-bold py-2 rounded-b-[16px] text-brand-text shadow-sm">{sortedPlayers[2].score}</div></div>}
          </div>
          <div className="bg-white/40 rounded-[24px] border border-white/50 overflow-hidden shadow-soft backdrop-blur-md">
            {sortedPlayers.map((p, index) => (<div key={p.id} className={`flex items-center justify-between p-5 border-b border-white/50 last:border-0 ${p.id === playerData.id ? 'bg-brand-teal/10' : 'hover:bg-white/60 transition-colors'}`}><div className="flex items-center gap-4"><span className={`font-black w-8 ${index === 0 ? 'text-brand-coral text-xl' : index < 3 ? 'text-brand-peach text-lg' : 'text-brand-text/30'}`}>#{index + 1}</span><span className={p.id === playerData.id ? 'font-black text-brand-teal text-lg' : 'font-bold text-brand-text'}>{p.pseudo}</span></div><span className="font-black text-brand-text/60 bg-white/60 px-3 py-1 rounded-full text-sm shadow-inner">{p.score}</span></div>))}
          </div>
          <button onClick={() => { localStorage.removeItem('edoxia_session'); navigate('/'); }} className="w-full bg-white hover:bg-brand-coral hover:text-white border border-white/60 text-brand-coral py-5 rounded-[20px] font-black text-lg flex items-center justify-center gap-3 mb-8 shadow-soft transition-all active:scale-95 mt-8"><Home size={24} /> Quitter la partie</button>
        </div>
      </div>
    );
  }

  // --- LOGIQUE QUESTION ---
  const qIndex = lobby.mode === 'live' ? lobby.currentQuestion : (playerData.currentQuestionIndex || 0);

  // FIN DU JEU ASYNC (Si on a fini toutes les questions)
  if (lobby.mode === 'async' && qIndex >= lobby.questions.length) {
    return <div className="flex flex-col items-center justify-center h-screen bg-brand-bg p-6 text-center relative overflow-hidden"><div className="absolute inset-0 bg-brand-teal/5 pointer-events-none blur-xl"></div><CheckCircle size={80} className="text-brand-teal mb-6 drop-shadow-sm relative z-10" /><h2 className="text-4xl font-black text-brand-text relative z-10">Terminé !</h2><p className="text-brand-text/60 font-bold mt-4 relative z-10 text-lg">Tu as répondu à tout.<br />Reviens plus tard pour les résultats !</p></div>;
  }

  // Waiting Screen (Généralisé)
  if (lobby.status === 'waiting' || qIndex < 0) return <div className="flex flex-col items-center justify-center h-screen bg-brand-bg p-8 text-center relative overflow-hidden"><div className="absolute top-0 left-0 w-[400px] h-[400px] bg-brand-coral/10 rounded-full blur-[80px] -translate-y-1/2 -translate-x-1/2"></div><div className="w-24 h-24 bg-brand-teal rounded-[30px] animate-[pulse_2s_ease-in-out_infinite] mb-8 flex items-center justify-center text-4xl font-black border-[6px] border-white shadow-soft text-white relative z-10 rotate-3">{playerData.pseudo.charAt(0).toUpperCase()}</div><h2 className="text-4xl font-black mb-3 text-brand-text relative z-10">Tu es connecté !</h2><div className="mt-6 text-brand-text/50 font-bold uppercase tracking-widest text-sm relative z-10 bg-white/60 px-6 py-3 rounded-full border border-white/80 shadow-inner">Le jeu va bientôt commencer...</div></div>;

  const currentQ = lobby.questions[qIndex];
  if (!currentQ) return <div className="flex flex-col items-center justify-center h-screen bg-brand-bg p-6 text-center text-brand-text font-bold">Chargement...</div>;

  // Answered Screen (Seulement en Live)
  if (lobby.mode === 'live' && hasAnswered) {
    const answeredPlayers = lobby.players.filter(p => p.hasAnswered);
    const waitingPlayers = lobby.players.filter(p => !p.hasAnswered);
    return <div className="flex flex-col h-screen bg-brand-bg p-6 animate-in fade-in duration-300 relative overflow-hidden"><div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-teal/5 pointer-events-none"></div><div className="text-center mt-10 mb-10 relative z-10"><div className="w-24 h-24 bg-white/80 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-teal border-[4px] border-brand-teal/20 shadow-soft"><CheckCircle size={48} /></div><h2 className="text-3xl font-black text-brand-text mb-2">Réponse envoyée !</h2><p className="text-brand-text/60 font-bold">En attente des autres...</p></div><div className="flex-1 overflow-y-auto space-y-8 relative z-10 max-w-lg mx-auto w-full"><div className="bg-white/40 p-6 rounded-[24px] border border-white/50 backdrop-blur-md shadow-sm"><h3 className="text-sm uppercase font-black text-brand-teal mb-4 flex items-center gap-2"><CheckCircle size={16} /> Ont répondu ({answeredPlayers.length})</h3><div className="flex flex-wrap gap-2">{answeredPlayers.map(p => (<span key={p.id} className="bg-white text-brand-text border border-white/80 shadow-sm px-4 py-2 rounded-full text-sm font-bold">{p.pseudo} {p.id === playerData.id && <span className="text-brand-teal ml-1">(Moi)</span>}</span>))}</div></div>{waitingPlayers.length > 0 && (<div className="bg-brand-peach/10 p-6 rounded-[24px] border border-brand-peach/20"><h3 className="text-sm uppercase font-black text-brand-coral mb-4 flex items-center gap-2"><Clock size={16} /> Réfléchissent... ({waitingPlayers.length})</h3><div className="flex flex-wrap gap-2">{waitingPlayers.map(p => (<span key={p.id} className="bg-white/40 text-brand-text/60 border border-white/50 px-4 py-2 rounded-full text-sm font-bold animate-pulse">{p.pseudo}</span>))}</div></div>)}</div></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-teal/5 rounded-full blur-[80px] pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
      <div className="p-6 pb-4 border-b border-white/40 bg-white/40 shadow-sm z-10 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-4"><span className="text-xs font-black bg-brand-coral/10 text-brand-coral px-3 py-1.5 rounded-full uppercase tracking-widest shadow-inner border border-brand-coral/20">QUIZ</span><span className="text-sm font-bold text-brand-text/50 uppercase tracking-widest bg-white/60 px-4 py-1.5 rounded-full shadow-inner border border-white/80">{qIndex + 1}/{lobby.questions.length}</span></div><h3 className="text-2xl font-black leading-snug text-brand-text">{currentQ.question}</h3>
      </div>
      <div className="flex-1 p-6 flex flex-col justify-center max-w-md mx-auto w-full relative z-10">
        {currentQ.image && <div className="mb-6 flex justify-center"><img src={currentQ.image} alt="Q" className="max-h-56 rounded-[24px] shadow-sm border border-white/50" /></div>}
        {(currentQ.type === 'mcq' || currentQ.type === 'tf') && (
          <div className={`grid gap-4 ${currentQ.options.length <= 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {currentQ.options.map((optionText, idx) => (<button key={idx} onClick={() => submitAnswer(idx)} className={`w-full p-6 rounded-[24px] shadow-sm flex items-center text-left active:scale-95 transition-all border border-white/40 hover:shadow-soft ${idx === 0 ? 'bg-brand-coral hover:bg-brand-coral/90 text-white' : ''} ${idx === 1 ? 'bg-brand-teal hover:bg-brand-teal/90 text-white' : ''} ${idx === 2 ? 'bg-brand-peach hover:bg-brand-peach/90 text-brand-text' : ''} ${idx === 3 ? 'bg-white hover:bg-slate-50 text-brand-text' : ''} ${idx > 3 ? 'bg-white/60 hover:bg-white text-brand-text' : ''}`}><div className="w-10 h-10 flex-shrink-0 bg-black/10 rounded-full flex items-center justify-center mr-4 font-black text-xl shadow-inner">{['▲', '●', '■', '♦', '★', '✚'][idx] || idx + 1}</div><span className="font-black text-xl leading-snug">{optionText}</span></button>))}
          </div>
        )}
        {currentQ.type === 'text' && (<div className="space-y-6"><input type="text" placeholder="Ta réponse..." className="w-full bg-white/60 text-brand-text text-center text-3xl p-6 rounded-[24px] font-black outline-none border border-white/50 focus:border-brand-teal shadow-inner transition-all placeholder-brand-text/30" value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)} /><button onClick={() => textAnswer && submitAnswer(textAnswer)} className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white font-black text-xl py-5 rounded-[24px] flex items-center justify-center gap-3 shadow-soft active:scale-95 transition-all">Valider <Send size={24} /></button></div>)}
      </div>
    </div>
  );
}