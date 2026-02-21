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

  const cancelLobby = async () => { if (window.confirm("Annuler ?")) await deleteDoc(doc(db, "lobbies", lobbyId)); };

  const startReview = async () => {
    // Passage en mode REVIEW
    await updateDoc(doc(db, "lobbies", lobbyId), { status: 'review', reviewQuestionIndex: 0 });
  };

  const nextReviewQuestion = async () => {
    if (lobby.reviewQuestionIndex + 1 < lobby.questions.length) {
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
      <div className="flex h-screen bg-brand-bg relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-teal/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="w-1/3 bg-white/40 border-r border-white/50 p-8 flex flex-col justify-center items-center text-center shadow-soft z-10 backdrop-blur-xl">
          <h2 className="text-brand-text/60 uppercase tracking-widest text-sm font-bold mb-4">Code de la partie</h2>
          <div className="bg-white text-brand-text px-8 py-4 rounded-[20px] text-6xl font-mono font-black mb-4 select-all shadow-inner border border-white/50">{lobby.code}</div>
          <div className="mb-8"><span className={`px-4 py-2 rounded-full text-xs uppercase font-black shadow-sm ${lobby.mode === 'async' ? 'bg-brand-peach text-brand-text' : 'bg-brand-teal text-white'}`}>{lobby.mode === 'async' ? 'Mode Soirée' : 'Mode Live'}</span></div>
          <div className="mb-12"><div className="text-7xl font-black text-brand-coral mb-2 drop-shadow-sm">{lobby.players.length}</div><div className="text-brand-text/60 uppercase tracking-widest text-xs font-bold">Joueurs prêts</div></div>
          <div className="w-full space-y-4 max-w-sm">
            <button onClick={startGame} className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white py-4 rounded-[20px] font-black text-xl shadow-soft transition-all active:scale-95">Lancer la partie</button>
            <button onClick={cancelLobby} className="w-full py-4 rounded-[20px] font-bold text-lg border-2 border-brand-coral/20 text-brand-coral hover:bg-brand-coral/10 hover:border-brand-coral/40 transition-all flex items-center justify-center gap-2"><XCircle size={20} /> Annuler</button>
          </div>
        </div>
        <div className="w-2/3 p-12 overflow-y-auto bg-transparent relative z-10 pl-24 pt-20">
          <h1 className="text-4xl font-black mb-12 flex items-center gap-4 text-brand-text">
            <Users className="text-brand-teal" size={36} /> Participants
          </h1>
          <div className="grid grid-cols-3 gap-6">
            {lobby.players.map(p =>
              <div key={p.id} className="bg-white/60 border border-white/50 px-6 py-4 rounded-[16px] font-black text-brand-text shadow-sm text-center text-lg">{p.pseudo}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. JEU EN COURS (LIVE OU ASYNC)
  if (lobby.status === 'playing') {
    if (lobby.mode === 'async') {
      // MODE SOIRÉE : TABLEAU DE SUIVI
      return (
        <div className="p-8 min-h-screen bg-brand-bg flex flex-col relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-brand-coral/5 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="flex justify-between items-center mb-12 relative z-10">
            <div>
              <h1 className="text-5xl font-black text-brand-text mb-2">Soirée en cours...</h1>
              <p className="text-brand-text/60 font-bold uppercase tracking-widest text-sm">Code: <span className="font-mono text-brand-coral font-black text-xl">{lobby.code}</span></p>
            </div>
            <button onClick={startReview} className="bg-brand-peach hover:bg-brand-peach/80 text-brand-text px-8 py-4 rounded-[20px] font-black text-lg shadow-soft flex items-center gap-3 transition-colors border border-brand-coral/20"><Eye size={24} /> Clôturer et Vérifier</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {lobby.players.map(p => {
              const progress = (p.currentQuestionIndex || 0) / lobby.questions.length * 100;
              return (
                <div key={p.id} className="bg-white/40 p-5 rounded-[20px] border border-white/50 backdrop-blur-md shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-black text-lg text-brand-text">{p.pseudo}</span>
                    <span className="text-xs font-bold text-brand-text/60 uppercase tracking-widest">{p.currentQuestionIndex || 0} / {lobby.questions.length}</span>
                  </div>
                  <div className="h-4 bg-white/60 rounded-full overflow-hidden border border-white/80 shadow-inner">
                    <div className="h-full bg-brand-teal transition-all duration-700 ease-out" style={{ width: `${Math.min(progress, 100)}%` }}></div>
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
        <div className="flex flex-col h-screen bg-brand-bg relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand-teal/5 rounded-full blur-[80px] pointer-events-none translate-x-1/4 translate-y-1/4"></div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 w-full max-w-5xl mx-auto">
            {question.image && <img src={question.image} className="max-h-[30vh] mb-12 rounded-[24px] shadow-soft border border-white/50" />}
            <div className="bg-white/40 border border-white/50 p-12 rounded-[30px] backdrop-blur-xl shadow-soft w-full">
              <h2 className="text-5xl font-black text-center text-brand-text leading-tight">{question.question}</h2>
            </div>
          </div>

          <div className="h-28 flex items-center justify-between border-t border-white/30 pt-4 px-12 bg-white/20 backdrop-blur-md relative z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-8 text-2xl font-black text-brand-text">
              <span className="bg-white/60 px-6 py-2 rounded-full border border-white/80 shadow-inner text-brand-teal">Q: {lobby.currentQuestion + 1}</span>
              <span className="text-brand-coral flex items-center gap-2 bg-brand-coral/10 px-6 py-2 rounded-full border border-brand-coral/20">{answeredCount} Réponses</span>
            </div>
            <button onClick={nextQuestionLive} className="bg-brand-teal hover:bg-brand-teal/90 text-white px-10 py-5 rounded-[20px] font-black shadow-soft text-xl flex items-center gap-3 transition-all active:scale-95">Suivant →</button>
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
      <div className="flex h-screen bg-brand-bg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-teal/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Colonne Question */}
        <div className="w-2/3 p-12 flex flex-col justify-center items-center border-r border-white/50 backdrop-blur-sm z-10">
          <div className="mb-6 text-brand-text/50 uppercase tracking-widest font-black text-sm bg-white/40 px-6 py-2 rounded-full border border-white/60 shadow-inner">Vérification - Question {qIndex + 1} / {lobby.questions.length}</div>
          {question.image && <img src={question.image} className="max-h-60 mb-8 rounded-[20px] shadow-sm border border-white/50" />}
          <div className="bg-white/40 border border-white/50 p-10 rounded-[30px] backdrop-blur-xl shadow-soft w-full max-w-4xl text-center mb-10">
            <h2 className="text-4xl font-black text-brand-text leading-tight">{question.question}</h2>
          </div>

          <div className="bg-brand-teal/10 text-brand-teal border border-brand-teal/20 px-10 py-5 rounded-[20px] text-2xl font-black mb-10 shadow-sm backdrop-blur-md text-center max-w-3xl w-full">
            Réponse : {question.type === 'mcq' || question.type === 'tf' ? question.options[question.correct] : question.correct}
          </div>

          <button onClick={nextReviewQuestion} className="bg-brand-teal text-white px-10 py-4 rounded-[20px] font-black hover:bg-brand-teal/90 shadow-soft transition-all active:scale-95 text-lg">
            {qIndex + 1 === lobby.questions.length ? "Voir le Podium Final 🏆" : "Question Suivante →"}
          </button>
        </div>

        {/* Colonne Gagnants */}
        <div className="w-1/3 p-10 bg-white/30 backdrop-blur-xl border-l border-white/40 z-10 overflow-y-auto">
          <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-brand-text"><Award className="text-brand-coral" size={32} /> Bonnes Réponses ({winners.length})</h3>
          <div className="space-y-4">
            {winners.length === 0 ? <p className="text-brand-text/50 font-bold text-lg text-center mt-10">Personne n'a trouvé ! 😕</p> :
              winners.map(p => (
                <div key={p.id} className="bg-brand-teal/10 border border-brand-teal/20 p-4 rounded-[16px] flex justify-between items-center animate-in slide-in-from-right-4 shadow-sm backdrop-blur-md">
                  <span className="font-black text-brand-text text-lg">{p.pseudo}</span>
                  <div className="bg-brand-teal text-white rounded-full p-1"><CheckCircle size={20} /></div>
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
      <div className="flex flex-col items-center justify-center min-h-screen text-center bg-brand-bg relative overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-brand-coral/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[20%] w-[500px] h-[500px] bg-brand-teal/10 rounded-full blur-[80px] pointer-events-none"></div>

        <h1 className="text-5xl font-black mb-16 text-brand-text z-10 drop-shadow-sm">Podium Final</h1>
        <div className="flex items-end gap-6 mb-20 z-10">
          {sortedPlayers[1] && <div className="flex flex-col items-center"><div className="w-20 h-20 rounded-full bg-slate-200 border-4 border-slate-300 mb-4 flex items-center justify-center text-slate-500 font-black text-3xl shadow-inner">2</div><div className="h-32 w-28 bg-white/60 border border-white/50 border-b-0 rounded-t-[20px] backdrop-blur-md shadow-[0_-10px_20px_rgba(0,0,0,0.02)]"></div><p className="mt-6 font-black text-xl text-brand-text">{sortedPlayers[1].pseudo}</p><p className="text-sm font-bold text-brand-text/50">{sortedPlayers[1].score} pts</p></div>}
          {sortedPlayers[0] && <div className="flex flex-col items-center"><div className="w-28 h-28 rounded-full bg-brand-coral/20 border-4 border-brand-coral/50 mb-4 flex items-center justify-center text-brand-coral font-black text-5xl shadow-inner relative"><Award className="absolute -top-3 -right-3 text-brand-teal" size={32} />1</div><div className="h-48 w-36 bg-white/80 border border-white/60 border-b-0 rounded-t-[20px] backdrop-blur-xl shadow-[0_-15px_30px_rgba(0,0,0,0.05)]"></div><p className="mt-6 font-black text-2xl text-brand-coral drop-shadow-sm">{sortedPlayers[0].pseudo}</p><p className="text-lg font-black text-brand-text">{sortedPlayers[0].score} pts</p></div>}
          {sortedPlayers[2] && <div className="flex flex-col items-center"><div className="w-20 h-20 rounded-full bg-brand-peach/30 border-4 border-brand-peach/60 mb-4 flex items-center justify-center text-brand-coral/70 font-black text-3xl shadow-inner">3</div><div className="h-24 w-28 bg-white/40 border border-white/50 border-b-0 rounded-t-[20px] backdrop-blur-sm shadow-[0_-5px_15px_rgba(0,0,0,0.01)]"></div><p className="mt-6 font-black text-xl text-brand-text">{sortedPlayers[2].pseudo}</p><p className="text-sm font-bold text-brand-text/50">{sortedPlayers[2].score} pts</p></div>}
        </div>
        <button onClick={cleanUp} className="z-10 flex items-center gap-3 px-8 py-4 bg-red-500/10 border-2 border-red-500 hover:bg-red-500 hover:text-white text-red-500 rounded-full font-black text-lg shadow-soft hover:scale-105 transition-all"><Trash2 size={24} /> Supprimer le Lobby</button>
      </div>
    )
  }

  return <div>Etat inconnu</div>;
}