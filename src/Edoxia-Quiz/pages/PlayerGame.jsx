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
    if(localSession && JSON.parse(localSession).lobbyId === lobbyId) {
        user = JSON.parse(localSession);
    } else if (sessionSession) {
        user = JSON.parse(sessionSession);
    }

    if (user) { setPlayerData(user); } else { navigate('/'); }

    const unsub = onSnapshot(doc(db, "lobbies", lobbyId), (docSnap) => {
      if(!docSnap.exists()) return; 
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
          if(me) setPlayerData(me);
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
    if(currentQ.type === 'mcq' || currentQ.type === 'tf') isCorrect = currentQ.correct === payload;
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
                  
                  if(lobby.mode === 'async') {
                      // ASYNC : On incrémente l'index perso et on reset hasAnswered immédiatement pour la suivante
                      return { ...p, score: newScore, answers: newAnswers, currentQuestionIndex: (p.currentQuestionIndex||0) + 1 };
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
        if(lobby.mode === 'async') {
            setTimeout(() => {
                setHasAnswered(false);
                setTextAnswer('');
            }, 500); // Petit délai pour feedback visuel
        }

    } catch (e) { console.error(e); }
  };

  if (!lobby || !playerData) return <div className="p-10 text-center text-white">Chargement...</div>;

  // --- ÉTATS GLOBAUX ---
  if (lobby.status === 'review') return <div className="flex flex-col items-center justify-center h-screen bg-edoxia-bg p-6 text-center animate-pulse"><Eye size={64} className="text-yellow-400 mb-4"/><h2 className="text-3xl font-bold text-white">Vérification...</h2><p className="text-edoxia-muted">L'admin passe en revue les réponses.<br/></p></div>;
  if (lobby.status === 'finished') { /* ... Code Podium identique à avant ... */ 
    const sortedPlayers = [...lobby.players].sort((a, b) => b.score - a.score);
    const myRank = sortedPlayers.findIndex(p => p.id === playerData.id) + 1;
    return (
        <div className="flex flex-col h-screen bg-edoxia-bg overflow-hidden">
          <div className="p-6 text-center border-b border-white/10 bg-edoxia-card shadow-xl z-10"><h2 className="text-2xl font-bold mb-1">Classement Final</h2><p className="text-edoxia-muted text-sm">Tu es <strong className="text-white">#{myRank}</strong></p></div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex justify-center items-end gap-2 mt-4 mb-8">
                 {sortedPlayers[1] && <div className="flex flex-col items-center w-1/3"><div className="text-xs font-bold mb-1 truncate w-full text-center">{sortedPlayers[1].pseudo}</div><div className="w-full h-24 bg-gray-600 rounded-t-lg flex items-end justify-center pb-2"><span className="text-2xl font-black text-gray-300">2</span></div><div className="bg-gray-800 w-full text-center text-xs py-1 rounded-b-lg">{sortedPlayers[1].score}</div></div>}
                 {sortedPlayers[0] && <div className="flex flex-col items-center w-1/3"><Trophy className="text-yellow-400 mb-2 animate-bounce" size={24} /><div className="text-sm font-bold mb-1 truncate w-full text-center text-yellow-400">{sortedPlayers[0].pseudo}</div><div className="w-full h-32 bg-yellow-500 rounded-t-lg flex items-end justify-center pb-2 shadow-yellow-500/40 shadow-2xl relative z-10"><span className="text-4xl font-black text-white">1</span></div><div className="bg-yellow-700 w-full text-center text-xs py-1 rounded-b-lg">{sortedPlayers[0].score}</div></div>}
                 {sortedPlayers[2] && <div className="flex flex-col items-center w-1/3"><div className="text-xs font-bold mb-1 truncate w-full text-center">{sortedPlayers[2].pseudo}</div><div className="w-full h-16 bg-amber-700 rounded-t-lg flex items-end justify-center pb-2"><span className="text-2xl font-black text-amber-200">3</span></div><div className="bg-amber-900 w-full text-center text-xs py-1 rounded-b-lg">{sortedPlayers[2].score}</div></div>}
            </div>
            <div className="bg-edoxia-card rounded-xl border border-white/5 overflow-hidden">
                {sortedPlayers.map((p, index) => (<div key={p.id} className={`flex items-center justify-between p-4 border-b border-white/5 ${p.id === playerData.id ? 'bg-edoxia-accent/10' : ''}`}><div className="flex items-center gap-3"><span className={`font-mono font-bold w-6 ${index < 3 ? 'text-yellow-400' : 'text-gray-500'}`}>#{index + 1}</span><span className={p.id === playerData.id ? 'font-bold text-white' : 'text-gray-300'}>{p.pseudo}</span></div><span className="font-mono text-edoxia-muted">{p.score}</span></div>))}
            </div>
            <button onClick={() => {localStorage.removeItem('edoxia_session'); navigate('/');}} className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-xl font-bold flex items-center justify-center gap-2 mb-8"><Home size={20}/> Quitter</button>
          </div>
        </div>
      );
  }

  // --- LOGIQUE QUESTION ---
  const qIndex = lobby.mode === 'live' ? lobby.currentQuestion : (playerData.currentQuestionIndex || 0);
  
  // FIN DU JEU ASYNC (Si on a fini toutes les questions)
  if (lobby.mode === 'async' && qIndex >= lobby.questions.length) {
      return <div className="flex flex-col items-center justify-center h-screen bg-edoxia-bg p-6 text-center"><CheckCircle size={64} className="text-green-500 mb-4"/><h2 className="text-3xl font-bold text-white">Terminé !</h2><p className="text-edoxia-muted mt-2">Tu as répondu à tout.<br/>Reviens plus tard pour les résultats !</p></div>;
  }

  // Waiting Screen (Généralisé)
  if (lobby.status === 'waiting' || qIndex < 0) return <div className="flex flex-col items-center justify-center h-screen bg-edoxia-bg p-6 text-center"><div className="w-16 h-16 bg-edoxia-accent rounded-full animate-pulse mb-6 flex items-center justify-center text-2xl font-bold border-4 border-edoxia-bg shadow-[0_0_0_4px_#3B82F6]">{playerData.pseudo.charAt(0)}</div><h2 className="text-3xl font-bold mb-2 text-white">Tu es connecté !</h2><div className="mt-8 text-edoxia-muted text-sm uppercase tracking-widest animate-pulse">Le jeu va bientôt commencer...</div></div>;

  const currentQ = lobby.questions[qIndex];
  if (!currentQ) return <div className="flex flex-col items-center justify-center h-screen bg-edoxia-bg p-6 text-center text-white">Chargement...</div>;

  // Answered Screen (Seulement en Live)
  if (lobby.mode === 'live' && hasAnswered) {
      const answeredPlayers = lobby.players.filter(p => p.hasAnswered);
      const waitingPlayers = lobby.players.filter(p => !p.hasAnswered);
      return <div className="flex flex-col h-screen bg-edoxia-bg p-4 animate-in fade-in duration-300"><div className="text-center mt-6 mb-8"><div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-black shadow-green-500/50 shadow-xl"><CheckCircle size={32} /></div><h2 className="text-2xl font-bold text-white">Réponse envoyée !</h2><p className="text-edoxia-muted">En attente des autres...</p></div><div className="flex-1 overflow-y-auto space-y-6"><div><h3 className="text-xs uppercase font-bold text-green-400 mb-2 px-2 flex items-center gap-2"><CheckCircle size={12}/> Ont répondu ({answeredPlayers.length})</h3><div className="flex flex-wrap gap-2">{answeredPlayers.map(p => (<span key={p.id} className="bg-green-500/20 text-green-200 border border-green-500/30 px-3 py-1 rounded-full text-sm font-bold">{p.pseudo} {p.id === playerData.id && "(Moi)"}</span>))}</div></div>{waitingPlayers.length > 0 && (<div><h3 className="text-xs uppercase font-bold text-gray-500 mb-2 px-2 flex items-center gap-2"><Clock size={12}/> Réfléchissent... ({waitingPlayers.length})</h3><div className="flex flex-wrap gap-2">{waitingPlayers.map(p => (<span key={p.id} className="bg-white/5 text-gray-400 border border-white/5 px-3 py-1 rounded-full text-sm animate-pulse">{p.pseudo}</span>))}</div></div>)}</div></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-edoxia-bg">
      <div className="p-6 pb-2 border-b border-white/5 bg-edoxia-card shadow-lg z-10">
        <div className="flex justify-between items-center mb-4"><span className="text-xs font-bold bg-edoxia-accent/20 text-edoxia-accent px-2 py-1 rounded">QUIZ</span><span className="text-sm text-edoxia-muted">{qIndex + 1}/{lobby.questions.length}</span></div><h3 className="text-lg font-bold leading-snug">{currentQ.question}</h3>
      </div>
      <div className="flex-1 p-4 flex flex-col justify-center max-w-md mx-auto w-full">
         {currentQ.image && <div className="mb-4 flex justify-center"><img src={currentQ.image} alt="Q" className="max-h-48 rounded-lg shadow border border-white/10" /></div>}
        {(currentQ.type === 'mcq' || currentQ.type === 'tf') && (
            <div className={`grid gap-3 ${currentQ.options.length <= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {currentQ.options.map((optionText, idx) => (<button key={idx} onClick={() => submitAnswer(idx)} className={`w-full p-6 rounded-xl shadow-lg flex items-center text-left active:scale-95 border-b-4 transition-all ${idx === 0 ? 'bg-red-500 border-red-700 active:border-red-500' : ''} ${idx === 1 ? 'bg-blue-500 border-blue-700 active:border-blue-500' : ''} ${idx === 2 ? 'bg-yellow-500 border-yellow-600 active:border-yellow-500 text-black' : ''} ${idx === 3 ? 'bg-green-500 border-green-700 active:border-green-500' : ''} ${idx > 3 ? 'bg-gray-600 border-gray-700 active:border-gray-500' : ''}`}><div className="w-8 h-8 flex-shrink-0 bg-black/20 rounded-full flex items-center justify-center mr-4 font-bold text-lg">{['▲','●','■','♦','★','✚'][idx] || idx+1}</div><span className="font-bold text-lg leading-tight">{optionText}</span></button>))}
            </div>
        )}
        {currentQ.type === 'text' && (<div className="space-y-6"><input type="text" placeholder="Ta réponse..." className="w-full bg-white text-black text-center text-2xl p-4 rounded-xl font-bold outline-none border-4 border-edoxia-accent focus:shadow-blue-500/50 shadow-xl transition" value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)} /><button onClick={() => textAnswer && submitAnswer(textAnswer)} className="w-full bg-green-500 hover:bg-green-600 text-black font-bold text-xl py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition">Valider <Send size={24}/></button></div>)}
      </div>
    </div>
  );
}