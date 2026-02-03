import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, onSnapshot, updateDoc, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { Trash2, Users, Save, CheckCircle, XCircle, Play, Eye, Award } from 'lucide-react';

export default function HostGame() {
  const { lobbyId } = useParams();
  const [lobby, setLobby] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "lobbies", lobbyId), (docSnap) => {
      if (docSnap.exists()) { setLobby(docSnap.data()); } else { navigate('/admin'); }
    });
    return () => unsub();
  }, [lobbyId, navigate]);

  // --- ACTIONS ---

  const startGame = async () => {
    const playersReset = lobby.players.map(p => ({ ...p, hasAnswered: false, currentQuestionIndex: 0, answers: {} }));
    await updateDoc(doc(db, "lobbies", lobbyId), { status: 'playing', currentQuestion: 0, showAnswer: false, players: playersReset });
  };

  const cancelLobby = async () => { if(window.confirm("Annuler ?")) await deleteDoc(doc(db, "lobbies", lobbyId)); };

  const startReview = async () => {
      // Passage en mode REVIEW
      await updateDoc(doc(db, "lobbies", lobbyId), { status: 'review', reviewQuestionIndex: 0 });
  };

  const nextReviewQuestion = async () => {
      if(lobby.reviewQuestionIndex + 1 < lobby.questions.length) {
          await updateDoc(doc(db, "lobbies", lobbyId), { reviewQuestionIndex: lobby.reviewQuestionIndex + 1 });
      } else {
          // Fin de la review -> Clôture
          archiveAndClose();
      }
  };

  const nextQuestionLive = async () => {
    const nextIdx = lobby.currentQuestion + 1;
    if (nextIdx < lobby.questions.length) {
      const playersReset = lobby.players.map(p => ({ ...p, hasAnswered: false }));
      await updateDoc(doc(db, "lobbies", lobbyId), { currentQuestion: nextIdx, showAnswer: false, players: playersReset });
    } else {
      // En Live, la fin mène aussi à la review maintenant
      startReview();
    }
  };

  const archiveAndClose = async () => {
      try {
          const sortedPlayers = [...lobby.players].sort((a, b) => b.score - a.score);
          const historyData = { code: lobby.code, date: new Date().toISOString(), winner: sortedPlayers[0]?.pseudo || 'Aucun', winnerScore: sortedPlayers[0]?.score || 0, totalPlayers: lobby.players.length, quizTitle: lobby.quizTitle || 'Quiz', players: sortedPlayers };
          await setDoc(doc(collection(db, "gameHistory")), historyData);
          await updateDoc(doc(db, "lobbies", lobbyId), { status: 'finished' }); // On notifie les joueurs pour le podium
          // On ne supprime pas tout de suite pour laisser le temps de voir le podium
          // await deleteDoc(doc(db, "lobbies", lobbyId)); 
      } catch (error) { console.error(error); }
  };

  const cleanUp = async () => { await deleteDoc(doc(db, "lobbies", lobbyId)); navigate('/admin'); };

  if (!lobby) return <div className="text-center mt-20 text-white">Chargement...</div>;

  // 1. SALLE D'ATTENTE
  if (lobby.status === 'waiting') {
    return (
      <div className="flex min-h-screen bg-edoxia-bg">
        <div className="w-1/3 bg-edoxia-card border-r border-white/10 p-8 flex flex-col justify-center items-center text-center shadow-2xl z-10">
            <h2 className="text-edoxia-muted uppercase tracking-widest text-sm mb-4">Code de la partie</h2>
            <div className="bg-white text-black px-8 py-4 rounded-xl text-6xl font-mono font-black mb-4 select-all">{lobby.code}</div>
            <div className="mb-8"><span className={`px-3 py-1 rounded text-xs uppercase font-bold ${lobby.mode==='async'?'bg-purple-600':'bg-blue-600'}`}>{lobby.mode === 'async' ? 'Mode Soirée' : 'Mode Live'}</span></div>
            <div className="mb-12"><div className="text-6xl font-bold text-edoxia-accent mb-2">{lobby.players.length}</div><div className="text-edoxia-muted uppercase tracking-widest text-xs">Joueurs prêts</div></div>
            <div className="w-full space-y-4">
                <button onClick={startGame} className="w-full bg-green-500 hover:bg-green-600 text-black py-4 rounded-xl font-bold text-xl shadow-lg transition">Lancer la partie</button>
                <button onClick={cancelLobby} className="w-full py-3 rounded-xl font-bold text-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-2"><XCircle size={20} /> Annuler</button>
            </div>
        </div>
        <div className="w-2/3 p-8 overflow-y-auto bg-edoxia-bg"><h1 className="text-3xl font-bold mb-8 flex items-center gap-3 text-white"><Users className="text-blue-400" /> Participants</h1><div className="grid grid-cols-3 gap-4">{lobby.players.map(p=><div key={p.id} className="bg-edoxia-card border border-white/10 px-4 py-3 rounded-lg font-bold">{p.pseudo}</div>)}</div></div>
      </div>
    );
  }

  // 2. JEU EN COURS (LIVE OU ASYNC)
  if (lobby.status === 'playing') {
      if(lobby.mode === 'async') {
          // MODE SOIRÉE : TABLEAU DE SUIVI
          return (
            <div className="p-8 min-h-screen bg-edoxia-bg flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Soirée en cours...</h1>
                        <p className="text-edoxia-muted">Code: <span className="font-mono text-white font-bold text-xl">{lobby.code}</span></p>
                    </div>
                    <button onClick={startReview} className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-4 rounded-xl font-bold text-xl shadow-lg flex items-center gap-3"><Eye /> Clôturer et Vérifier</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lobby.players.map(p => {
                        const progress = (p.currentQuestionIndex || 0) / lobby.questions.length * 100;
                        return (
                            <div key={p.id} className="bg-edoxia-card p-4 rounded-xl border border-white/10">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold">{p.pseudo}</span>
                                    <span className="text-xs text-edoxia-muted">{p.currentQuestionIndex || 0} / {lobby.questions.length}</span>
                                </div>
                                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 transition-all duration-500" style={{width: `${Math.min(progress, 100)}%`}}></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
          )
      } else {
          // MODE LIVE : CONTROLEUR CLASSIQUE
          const question = lobby.questions[lobby.currentQuestion];
          const answeredCount = lobby.players.filter(p => p.hasAnswered).length;
          return (
            <div className="flex flex-col h-screen p-6 bg-edoxia-bg">
              <div className="flex-1 flex flex-col items-center justify-center">
                <h2 className="text-4xl font-bold text-center mb-12 max-w-5xl leading-tight">{question.question}</h2>
                {question.image && <img src={question.image} className="h-64 mb-8 rounded shadow"/>}
              </div>
              <div className="h-24 flex items-center justify-between border-t border-white/10 mt-6 pt-4 px-4 bg-edoxia-bg">
                <div className="flex items-center gap-6 text-2xl font-bold">Q: {lobby.currentQuestion + 1} <span className="text-green-400 ml-4">{answeredCount} Réponses</span></div>
                <button onClick={nextQuestionLive} className="bg-white hover:bg-gray-200 text-black px-8 py-4 rounded-xl font-bold shadow-lg text-xl flex items-center gap-2 hover:scale-105 transition">Suivant →</button>
              </div>
            </div>
          );
      }
  }

  // 3. MODE REVIEW (NOUVEAU)
  if (lobby.status === 'review') {
      const qIndex = lobby.reviewQuestionIndex;
      const question = lobby.questions[qIndex];
      
      // Trouver les gagnants de CETTE question
      const winners = lobby.players.filter(p => {
          const answer = p.answers ? p.answers[qIndex] : undefined;
          if (answer === undefined) return false;
          if (question.type === 'text') return String(answer).toLowerCase().trim() === String(question.correct).toLowerCase().trim();
          return answer === question.correct;
      });

      return (
        <div className="flex min-h-screen bg-edoxia-bg">
            {/* Colonne Question */}
            <div className="w-2/3 p-8 flex flex-col justify-center items-center border-r border-white/10">
                <div className="mb-4 text-edoxia-muted uppercase tracking-widest font-bold">Vérification - Question {qIndex + 1} / {lobby.questions.length}</div>
                {question.image && <img src={question.image} className="max-h-60 mb-6 rounded shadow border border-white/10"/>}
                <h2 className="text-4xl font-bold text-center mb-8">{question.question}</h2>
                
                <div className="bg-green-500/20 text-green-400 border border-green-500/50 px-8 py-4 rounded-xl text-2xl font-bold mb-8">
                    Réponse : {question.type === 'mcq' || question.type === 'tf' ? question.options[question.correct] : question.correct}
                </div>

                <button onClick={nextReviewQuestion} className="bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-gray-200 shadow-lg">
                    {qIndex + 1 === lobby.questions.length ? "Voir le Podium Final" : "Question Suivante →"}
                </button>
            </div>

            {/* Colonne Gagnants */}
            <div className="w-1/3 p-8 bg-edoxia-card overflow-y-auto">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><Award className="text-yellow-400"/> Bonnes Réponses ({winners.length})</h3>
                <div className="space-y-2">
                    {winners.length === 0 ? <p className="text-edoxia-muted">Personne n'a trouvé !</p> : 
                    winners.map(p => (
                        <div key={p.id} className="bg-green-500/10 border border-green-500/30 p-3 rounded flex justify-between items-center animate-in slide-in-from-right-4">
                            <span className="font-bold">{p.pseudo}</span>
                            <CheckCircle size={16} className="text-green-400"/>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )
  }

  // 4. FIN (PODIUM)
  if (lobby.status === 'finished') {
    const sortedPlayers = [...lobby.players].sort((a, b) => b.score - a.score);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center bg-edoxia-bg relative overflow-hidden">
        <h1 className="text-5xl font-bold mb-16 text-white z-10">Podium Final</h1>
        <div className="flex items-end gap-6 mb-20 z-10">
            {sortedPlayers[1] && <div className="flex flex-col items-center"><div className="w-20 h-20 rounded-full bg-gray-300 border-4 border-gray-500 mb-4 flex items-center justify-center text-gray-800 font-black text-3xl">2</div><div className="h-32 w-24 bg-gradient-to-t from-gray-800 to-gray-600 rounded-t-lg"></div><p className="mt-4 font-bold text-xl text-white">{sortedPlayers[1].pseudo}</p><p className="text-sm text-gray-400">{sortedPlayers[1].score} pts</p></div>}
            {sortedPlayers[0] && <div className="flex flex-col items-center"><div className="w-28 h-28 rounded-full bg-yellow-400 border-4 border-yellow-600 mb-4 flex items-center justify-center text-yellow-900 font-black text-5xl">1</div><div className="h-48 w-32 bg-gradient-to-t from-yellow-700 to-yellow-500 rounded-t-lg shadow-2xl"></div><p className="mt-4 font-bold text-2xl text-yellow-400">{sortedPlayers[0].pseudo}</p><p className="text-lg text-yellow-200">{sortedPlayers[0].score} pts</p></div>}
            {sortedPlayers[2] && <div className="flex flex-col items-center"><div className="w-20 h-20 rounded-full bg-amber-700 border-4 border-amber-900 mb-4 flex items-center justify-center text-amber-100 font-black text-3xl">3</div><div className="h-24 w-24 bg-gradient-to-t from-amber-900 to-amber-700 rounded-t-lg"></div><p className="mt-4 font-bold text-xl text-white">{sortedPlayers[2].pseudo}</p><p className="text-sm text-gray-400">{sortedPlayers[2].score} pts</p></div>}
        </div>
        <button onClick={cleanUp} className="z-10 flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition"><Trash2 size={24}/> Supprimer le Lobby</button>
      </div>
    )
  }

  return <div>Etat inconnu</div>;
}