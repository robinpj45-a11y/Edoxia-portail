import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { setDoc, addDoc, doc, collection, getDocs, orderBy, query, onSnapshot, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { History, PlayCircle, Activity, Trash2, MonitorPlay, PlusCircle, Save, X, Home, ImageIcon, MinusCircle, Zap, Moon, ArrowLeft } from 'lucide-react';

const DEMO_QUIZ = {
  id: 'demo', title: 'Quiz de Démo',
  questions: [{ type: 'mcq', question: "Capitale de la France ?", options: ["Lyon", "Marseille", "Paris", "Bordeaux"], correct: 2 }, { type: 'tf', question: "La Terre est plate.", options: ["Vrai", "Faux"], correct: 1 }]
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeLobbies, setActiveLobbies] = useState([]);
  const [savedQuizzes, setSavedQuizzes] = useState([DEMO_QUIZ]);
  const [selectedQuizId, setSelectedQuizId] = useState('demo');
  const [gameMode, setGameMode] = useState('live'); // 'live' ou 'async'
  const navigate = useNavigate();

  // États Création Quiz
  const [isCreating, setIsCreating] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuestions, setNewQuestions] = useState([]);
  const [qType, setQType] = useState('mcq'); const [qText, setQText] = useState(''); const [qImage, setQImage] = useState(''); const [qOptions, setQOptions] = useState(['', '', '', '']); const [qCorrectIdx, setQCorrectIdx] = useState(0); const [qCorrectText, setQCorrectText] = useState(''); 

  useEffect(() => {
    const fetchHistory = async () => { const q = query(collection(db, "gameHistory"), orderBy("date", "desc")); const snapshot = await getDocs(q); setHistory(snapshot.docs.map(d => ({id: d.id, ...d.data()}))); }; fetchHistory();
    const fetchQuizzes = async () => { const q = query(collection(db, "quizzes"), orderBy("createdAt", "desc")); const snapshot = await getDocs(q); const dbQuizzes = snapshot.docs.map(d => ({id: d.id, ...d.data()})); setSavedQuizzes([DEMO_QUIZ, ...dbQuizzes]); }; fetchQuizzes();
    const unsub = onSnapshot(collection(db, "lobbies"), (snapshot) => { setActiveLobbies(snapshot.docs.map(d => ({id: d.id, ...d.data()}))); }); return () => unsub();
  }, [isCreating]);

  // --- LOGIQUE CRÉATION (Simplifiée pour focus sur le mode Soirée) ---
  const changeType = (type) => { setQType(type); setQCorrectIdx(0); if (type === 'tf') { setQOptions(['Vrai', 'Faux']); } else if (type === 'mcq') { setQOptions(['', '', '', '']); } };
  const addOption = () => setQOptions([...qOptions, '']);
  const removeOption = (idx) => { if(qOptions.length <= 2) return; const newOpts = qOptions.filter((_, i) => i !== idx); setQOptions(newOpts); if(qCorrectIdx >= newOpts.length) setQCorrectIdx(0); };
  const addQuestionToBuffer = () => { if(!qText) return alert("Vide !"); let newQ = { type: qType, question: qText, image: qImage }; if(qType === 'mcq' || qType === 'tf') { if(qOptions.some(o => !o)) return alert("Options vides"); newQ.options = [...qOptions]; newQ.correct = Number(qCorrectIdx); } else { if(!qCorrectText) return alert("Réponse ?"); newQ.correct = qCorrectText; } setNewQuestions([...newQuestions, newQ]); setQText(''); setQImage(''); setQCorrectText(''); if(qType === 'mcq') setQOptions(['', '', '', '']); };
  const saveQuizToDb = async () => { if(!newQuizTitle || newQuestions.length === 0) return alert("Titre?"); setLoading(true); await addDoc(collection(db, "quizzes"), { title: newQuizTitle, questions: newQuestions, createdAt: new Date() }); setIsCreating(false); setNewQuestions([]); setNewQuizTitle(''); setLoading(false); };
  const cancelCreation = () => { if(window.confirm("Annuler ?")) { setIsCreating(false); setNewQuestions([]); setNewQuizTitle(''); } };

  // --- CRÉATION LOBBY AVEC MODE ---
  const createLobby = async () => {
    setLoading(true);
    const selectedQuiz = savedQuizzes.find(q => q.id === selectedQuizId) || DEMO_QUIZ;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = ''; for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));

    try {
      await setDoc(doc(db, "lobbies", code), {
        code, 
        mode: gameMode, // 'live' ou 'async'
        status: 'waiting', 
        currentQuestion: -1, // Utilisé en LIVE
        reviewQuestionIndex: -1, // Pour le mode REVIEW
        players: [], 
        questions: selectedQuiz.questions, 
        quizTitle: selectedQuiz.title, 
        createdAt: new Date()
      });
      navigate(`/host/${code}`);
    } catch (e) { console.error(e); alert("Erreur création lobby"); }
    setLoading(false);
  };

  const deleteLobby = async (id) => { if(window.confirm("Supprimer ?")) await deleteDoc(doc(db, "lobbies", id)); };

  if(isCreating) {
    return (
      <div className="p-8 max-w-5xl mx-auto pb-20 min-h-screen">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <PlusCircle className="text-edoxia-accent" /> Créateur de Quiz
          </h1>
          <button onClick={cancelCreation} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="bg-edoxia-card p-8 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
          {/* TITRE DU QUIZ */}
          <div className="mb-8">
            <label className="block text-sm text-edoxia-muted mb-2 uppercase tracking-wider font-bold">Titre du Quiz</label>
            <input 
              value={newQuizTitle} 
              onChange={e => setNewQuizTitle(e.target.value)} 
              className="w-full bg-slate-950/50 p-4 rounded-xl border border-white/10 focus:border-edoxia-accent outline-none text-xl font-bold transition-all placeholder-slate-600" 
              placeholder="Ex: Culture Générale #1" 
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* COLONNE GAUCHE : FORMULAIRE */}
            <div className="space-y-6">
              
              {/* TYPE DE QUESTION */}
              <div>
                <label className="block text-sm text-edoxia-muted mb-2 uppercase tracking-wider font-bold">Type de question</label>
                <div className="flex bg-slate-950/50 p-1 rounded-lg border border-white/5">
                  {[
                    { id: 'mcq', label: 'QCM' },
                    { id: 'tf', label: 'Vrai/Faux' },
                    { id: 'text', label: 'Texte' }
                  ].map(type => (
                    <button 
                      key={type.id}
                      onClick={() => changeType(type.id)} 
                      className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${qType === type.id ? 'bg-edoxia-accent text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CONTENU QUESTION */}
              <div className="space-y-3">
                <input 
                  value={qText} 
                  onChange={e => setQText(e.target.value)} 
                  className="w-full bg-slate-950/50 p-3 rounded-lg border border-white/10 focus:border-edoxia-accent outline-none transition-all" 
                  placeholder="Intitulé de la question..." 
                />
                <div className="flex items-center gap-2">
                  <ImageIcon size={20} className="text-slate-500" />
                  <input 
                    value={qImage} 
                    onChange={e => setQImage(e.target.value)} 
                    className="flex-1 bg-slate-950/50 p-3 rounded-lg border border-white/10 focus:border-edoxia-accent outline-none transition-all text-sm" 
                    placeholder="URL de l'image (optionnel)" 
                  />
                </div>
              </div>

              {/* OPTIONS DE RÉPONSE */}
              <div className="bg-slate-950/30 p-4 rounded-xl border border-white/5">
                <label className="block text-sm text-edoxia-muted mb-3 uppercase tracking-wider font-bold flex justify-between">
                  Réponses <span className="text-xs normal-case font-normal text-slate-500">(Cochez la bonne réponse)</span>
                </label>
                
                {(qType === 'mcq' || qType === 'tf') ? (
                  <div className="space-y-3">
                    {qOptions.map((o, i) => (
                      <div key={i} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${qCorrectIdx === i ? 'bg-green-500/10 border border-green-500/30' : 'border border-transparent'}`}>
                        <input 
                          type="radio" 
                          name="correctAnswer" 
                          checked={qCorrectIdx === i} 
                          onChange={() => setQCorrectIdx(i)}
                          className="w-5 h-5 accent-green-500 cursor-pointer"
                        />
                        <input 
                          value={o} 
                          onChange={e => { const n = [...qOptions]; n[i] = e.target.value; setQOptions(n); }} 
                          className="flex-1 bg-transparent outline-none text-white placeholder-slate-600"
                          placeholder={`Option ${i + 1}`}
                        />
                        {qType === 'mcq' && qOptions.length > 2 && (
                          <button onClick={() => removeOption(i)} className="text-slate-600 hover:text-red-400 transition-colors"><MinusCircle size={18} /></button>
                        )}
                      </div>
                    ))}
                    {qType === 'mcq' && qOptions.length < 6 && (
                      <button onClick={addOption} className="text-xs flex items-center gap-1 text-edoxia-accent hover:text-cyan-300 font-bold mt-2">
                        <PlusCircle size={14} /> Ajouter une option
                      </button>
                    )}
                  </div>
                ) : (
                  <input 
                    value={qCorrectText} 
                    onChange={e => setQCorrectText(e.target.value)} 
                    className="w-full bg-slate-950/50 p-3 rounded-lg border border-green-500/30 focus:border-green-500 outline-none transition-all text-green-400 font-bold" 
                    placeholder="Réponse exacte attendue..." 
                  />
                )}
              </div>

              <button 
                onClick={addQuestionToBuffer} 
                className="w-full py-3 rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-2 group"
              >
                <PlusCircle className="group-hover:scale-110 transition-transform" /> Ajouter la question
              </button>
            </div>

            {/* COLONNE DROITE : APERÇU */}
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-edoxia-muted uppercase tracking-wider font-bold">Questions ({newQuestions.length})</label>
                {newQuestions.length > 0 && <span className="text-xs bg-edoxia-accent px-2 py-1 rounded-full text-white font-bold">{newQuestions.length}</span>}
              </div>
              
              <div className="flex-1 bg-slate-950/30 rounded-xl border border-white/10 overflow-hidden flex flex-col">
                {newQuestions.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4"><PlusCircle size={32} /></div>
                    <p>Ajoutez des questions pour voir l'aperçu ici.</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar flex-1">
                    {newQuestions.map((q, i) => (
                      <div key={i} className="bg-slate-800/50 p-4 rounded-lg border border-white/5 hover:border-white/10 transition-colors group relative">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-xs font-mono text-edoxia-accent mb-1 block">Q{i + 1} • {q.type.toUpperCase()}</span>
                            <p className="font-bold text-white line-clamp-2">{q.question}</p>
                            <p className="text-sm text-slate-400 mt-1">
                              Réponse : <span className="text-green-400">{q.type === 'text' ? q.correct : q.options[q.correct]}</span>
                            </p>
                          </div>
                          <button 
                            onClick={() => setNewQuestions(newQuestions.filter((_, idx) => idx !== i))}
                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={saveQuizToDb} 
                disabled={loading || newQuestions.length === 0}
                className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-900/20 mt-6 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? 'Sauvegarde...' : <><Save size={20} /> Enregistrer le Quiz</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto pb-20">
      <div className="mb-8">
        <button onClick={() => navigate('/quiz')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} /> Retour au Quiz
        </button>
      </div>
      <div className="flex justify-between items-center mb-10"><h1 className="text-3xl font-bold">Administration</h1><button onClick={() => setIsCreating(true)} className="bg-edoxia-accent px-6 py-3 rounded-lg font-bold flex items-center gap-2"><PlusCircle/> Créer Quiz</button></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="bg-edoxia-card p-8 rounded-xl border border-white/5 shadow-xl flex flex-col">
          <div className="bg-edoxia-accent/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-edoxia-accent"><PlayCircle /></div>
          <h2 className="text-2xl font-bold mb-4">Lancer une Partie</h2>
          <div className="mb-6"><label className="text-sm text-edoxia-muted mb-2 block">Choisir le Quiz</label><select value={selectedQuizId} onChange={(e) => setSelectedQuizId(e.target.value)} className="w-full bg-edoxia-bg border border-white/10 p-3 rounded-lg outline-none focus:border-edoxia-accent">{savedQuizzes.map(q => (<option key={q.id} value={q.id}>{q.title} ({q.questions.length} Q)</option>))}</select></div>
          
          {/* SÉLECTEUR DE MODE DE JEU */}
          <div className="mb-6 grid grid-cols-2 gap-2 bg-edoxia-bg p-1 rounded-lg">
              <button onClick={() => setGameMode('live')} className={`flex flex-col items-center justify-center py-3 rounded-md transition ${gameMode==='live' ? 'bg-blue-600 text-white shadow' : 'hover:bg-white/5 text-gray-400'}`}>
                  <Zap size={20} className="mb-1"/> <span className="text-xs font-bold">LIVE</span>
              </button>
              <button onClick={() => setGameMode('async')} className={`flex flex-col items-center justify-center py-3 rounded-md transition ${gameMode==='async' ? 'bg-purple-600 text-white shadow' : 'hover:bg-white/5 text-gray-400'}`}>
                  <Moon size={20} className="mb-1"/> <span className="text-xs font-bold">SOIRÉE</span>
              </button>
          </div>

          <button onClick={createLobby} disabled={loading} className={`w-full py-3 rounded-lg font-bold shadow-lg mt-auto ${gameMode === 'live' ? 'bg-edoxia-accent' : 'bg-purple-600 hover:bg-purple-700'}`}>{loading ? 'Création...' : `Créer Lobby ${gameMode==='live' ? 'Direct' : 'Soirée'}`}</button>
        </div>
        {/* LISTE LOBBYS (inchangée) */}
        <div className="bg-edoxia-card rounded-xl border border-white/5 lg:col-span-2 overflow-hidden flex flex-col h-[350px]">
          <div className="p-6 border-b border-white/5 flex items-center gap-2 bg-blue-900/10"><Activity className="text-green-400"/><h2 className="text-xl font-bold">Actifs</h2></div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeLobbies.length === 0 ? <div className="text-center text-edoxia-muted mt-10">Aucun lobby.</div> : activeLobbies.map(l => (
              <div key={l.id} className="flex justify-between items-center p-4 bg-white/5 rounded border border-white/10">
                <div><span className="font-bold mr-2">{l.id}</span><span className="text-xs bg-white/10 px-2 rounded">{l.mode}</span></div>
                <div className="flex items-center gap-3">
                  <button onClick={()=>navigate(`/host/${l.id}`)} className="text-blue-400 hover:text-blue-300 transition-colors"><MonitorPlay/></button>
                  <button onClick={() => deleteLobby(l.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 size={20}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HISTORIQUE */}
      <div className="bg-edoxia-card rounded-xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center gap-2 bg-purple-900/10">
          <History className="text-purple-400" />
          <h2 className="text-xl font-bold">Historique des Parties</h2>
        </div>
        <div className="p-4">
          {history.length === 0 ? (
            <div className="text-center text-edoxia-muted py-8">Aucune partie terminée.</div>
          ) : (
            <div className="space-y-3">
              {history.map((game) => (
                <div key={game.id} className="flex flex-col md:flex-row justify-between items-center p-4 bg-white/5 rounded border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="text-center min-w-[80px]">
                      <div className="text-sm font-bold text-white">{new Date(game.date).toLocaleDateString()}</div>
                      <div className="text-xs text-edoxia-muted">{new Date(game.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                    <div>
                      <div className="font-bold text-lg text-white">{game.quizTitle || 'Quiz sans titre'}</div>
                      <div className="text-sm text-edoxia-muted flex items-center gap-2">
                        <span className="bg-white/10 px-2 py-0.5 rounded text-xs">Code: {game.code}</span>
                        <span>•</span>
                        <span>{game.totalPlayers} Joueurs</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <div className="text-xs text-edoxia-muted uppercase tracking-wider mb-1">Vainqueur</div>
                      <div className="font-bold text-yellow-400 flex items-center gap-2 justify-end">
                        {game.winner}
                        <span className="bg-yellow-500/20 text-yellow-200 px-2 py-0.5 rounded text-xs border border-yellow-500/30">{game.winnerScore} pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}