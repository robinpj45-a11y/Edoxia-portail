import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { setDoc, addDoc, doc, collection, getDocs, orderBy, query, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { History, PlayCircle, Activity, Trash2, MonitorPlay, PlusCircle, Save, X, Home, ImageIcon, MinusCircle, Zap, Moon, ArrowLeft, Edit, Lock } from 'lucide-react';

const DEMO_QUIZ = {
  id: 'demo', title: 'Quiz de Démo',
  questions: [{ type: 'mcq', question: "Capitale de la France ?", options: ["Lyon", "Marseille", "Paris", "Bordeaux"], correct: 2 }, { type: 'tf', question: "La Terre est plate.", options: ["Vrai", "Faux"], correct: 1 }]
};

export default function AdminDashboard({ isGlobalAdmin }) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeLobbies, setActiveLobbies] = useState([]);
  const [savedQuizzes, setSavedQuizzes] = useState([DEMO_QUIZ]);
  const [selectedQuizId, setSelectedQuizId] = useState('demo');
  const [gameMode, setGameMode] = useState('live'); // 'live' ou 'async'
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(isGlobalAdmin || false);
  const [passwordInput, setPasswordInput] = useState('');

  // États Création Quiz
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuestions, setNewQuestions] = useState([]);
  const [qType, setQType] = useState('mcq'); const [qText, setQText] = useState(''); const [qImage, setQImage] = useState(''); const [qOptions, setQOptions] = useState(['', '', '', '']); const [qCorrectIdx, setQCorrectIdx] = useState(0); const [qCorrectText, setQCorrectText] = useState('');

  useEffect(() => {
    if (isGlobalAdmin) setIsAuthenticated(true);
  }, [isGlobalAdmin]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchHistory = async () => { const q = query(collection(db, "gameHistory"), orderBy("date", "desc")); const snapshot = await getDocs(q); setHistory(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); }; fetchHistory();
    const fetchQuizzes = async () => { const q = query(collection(db, "quizzes"), orderBy("createdAt", "desc")); const snapshot = await getDocs(q); const dbQuizzes = snapshot.docs.map(d => ({ id: d.id, ...d.data() })); setSavedQuizzes([DEMO_QUIZ, ...dbQuizzes]); }; fetchQuizzes();
    const unsub = onSnapshot(collection(db, "lobbies"), (snapshot) => { setActiveLobbies(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); }); return () => unsub();
  }, [isCreating, isAuthenticated]);

  // --- LOGIQUE CRÉATION (Simplifiée pour focus sur le mode Soirée) ---
  const changeType = (type) => { setQType(type); setQCorrectIdx(0); if (type === 'tf') { setQOptions(['Vrai', 'Faux']); } else if (type === 'mcq') { setQOptions(['', '', '', '']); } };
  const addOption = () => setQOptions([...qOptions, '']);
  const removeOption = (idx) => { if (qOptions.length <= 2) return; const newOpts = qOptions.filter((_, i) => i !== idx); setQOptions(newOpts); if (qCorrectIdx >= newOpts.length) setQCorrectIdx(0); };
  const addQuestionToBuffer = () => { if (!qText) return alert("Vide !"); let newQ = { type: qType, question: qText, image: qImage }; if (qType === 'mcq' || qType === 'tf') { if (qOptions.some(o => !o)) return alert("Options vides"); newQ.options = [...qOptions]; newQ.correct = Number(qCorrectIdx); } else { if (!qCorrectText) return alert("Réponse ?"); newQ.correct = qCorrectText; } setNewQuestions([...newQuestions, newQ]); setQText(''); setQImage(''); setQCorrectText(''); if (qType === 'mcq') setQOptions(['', '', '', '']); };

  const saveQuizToDb = async () => {
    if (!newQuizTitle || newQuestions.length === 0) return alert("Titre et au moins une question requis.");
    setLoading(true);
    if (editingQuizId) {
      await updateDoc(doc(db, "quizzes", editingQuizId), { title: newQuizTitle, questions: newQuestions });
    } else {
      await addDoc(collection(db, "quizzes"), { title: newQuizTitle, questions: newQuestions, createdAt: new Date() });
    }
    setIsCreating(false); setNewQuestions([]); setNewQuizTitle(''); setEditingQuizId(null); setLoading(false);
  };

  const cancelCreation = () => { if (window.confirm("Annuler ?")) { setIsCreating(false); setNewQuestions([]); setNewQuizTitle(''); setEditingQuizId(null); } };

  const handleEdit = (quiz) => {
    if (quiz.id === 'demo') return alert("Le quiz de démo n'est pas modifiable.");
    setNewQuizTitle(quiz.title);
    setNewQuestions(quiz.questions);
    setEditingQuizId(quiz.id);
    setIsCreating(true);
  };

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

  const deleteLobby = async (id) => { if (window.confirm("Supprimer ?")) await deleteDoc(doc(db, "lobbies", id)); };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bg text-brand-text p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-teal/10 rounded-full blur-[80px] pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
        <div className="bg-white/40 p-10 rounded-[30px] border border-white/50 shadow-soft max-w-md w-full text-center backdrop-blur-xl relative z-10">
          <div className="mb-6 flex justify-center">
            <div className="p-5 bg-brand-coral/10 rounded-[20px] text-brand-coral shadow-inner">
              <Lock size={36} />
            </div>
          </div>
          <h1 className="text-3xl font-black mb-2 text-brand-text">Espace Administrateur</h1>
          <p className="text-brand-text/60 mb-8 font-bold text-sm uppercase tracking-widest">Veuillez saisir le mot de passe pour continuer.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (passwordInput === "StpbbFLAUD@") setIsAuthenticated(true); else alert("Mot de passe incorrect."); }} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Mot de passe"
              className="w-full bg-white/60 p-4 rounded-[20px] border border-white/50 focus:border-brand-teal outline-none transition-all text-center text-brand-text font-bold shadow-inner placeholder-brand-text/40"
              autoFocus
            />
            <button type="submit" className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white font-black text-lg py-4 rounded-[20px] transition-all shadow-soft active:scale-95">
              Accéder
            </button>
          </form>
          <button onClick={() => navigate('/')} className="mt-8 text-sm font-bold text-brand-text/60 hover:text-brand-teal transition-colors flex items-center justify-center gap-2 w-full">
            <ArrowLeft size={16} /> Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="p-8 max-w-5xl mx-auto pb-20 min-h-screen bg-brand-bg md:bg-transparent">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black flex items-center gap-3 text-brand-text">
            <PlusCircle className="text-brand-coral" size={32} /> {editingQuizId ? 'Modifier le Quiz' : 'Créateur de Quiz'}
          </h1>
          <button onClick={cancelCreation} className="p-3 bg-white/40 border border-white/50 hover:bg-white/80 rounded-full shadow-sm transition-all text-brand-text">
            <X size={24} />
          </button>
        </div>

        <div className="bg-white/40 p-8 rounded-[30px] border border-white/50 shadow-soft backdrop-blur-xl">
          {/* TITRE DU QUIZ */}
          <div className="mb-8 p-6 bg-white/30 rounded-[24px] border border-white/40 shadow-inner">
            <label className="block text-sm text-brand-text/60 mb-3 uppercase tracking-widest font-black flex items-center gap-2">Titre du Quiz</label>
            <input
              value={newQuizTitle}
              onChange={e => setNewQuizTitle(e.target.value)}
              className="w-full bg-white/60 p-4 rounded-xl border border-white/50 focus:border-brand-teal outline-none text-xl font-black transition-all text-brand-text placeholder-brand-text/30 shadow-sm"
              placeholder="Ex: Culture Générale #1"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* COLONNE GAUCHE : FORMULAIRE */}
            <div className="space-y-6">

              {/* TYPE DE QUESTION */}
              <div className="p-6 bg-white/30 rounded-[24px] border border-white/40 shadow-inner">
                <label className="block text-sm text-brand-text/60 mb-3 uppercase tracking-widest font-black">Type de question</label>
                <div className="flex bg-white/60 p-1.5 rounded-[16px] border border-white/50 shadow-sm">
                  {[
                    { id: 'mcq', label: 'QCM' },
                    { id: 'tf', label: 'Vrai/Faux' },
                    { id: 'text', label: 'Texte' }
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => changeType(type.id)}
                      className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${qType === type.id ? 'bg-brand-coral text-white shadow-soft' : 'text-brand-text/60 hover:text-brand-text hover:bg-white/40'}`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CONTENU QUESTION */}
              <div className="space-y-4 p-6 bg-white/30 rounded-[24px] border border-white/40 shadow-inner">
                <input
                  value={qText}
                  onChange={e => setQText(e.target.value)}
                  className="w-full bg-white/60 p-4 rounded-xl border border-white/50 focus:border-brand-teal outline-none transition-all text-brand-text font-bold shadow-sm placeholder-brand-text/40"
                  placeholder="Intitulé de la question..."
                />
                <div className="flex items-center gap-3 bg-white/60 p-2 rounded-xl border border-white/50 shadow-sm focus-within:border-brand-teal transition-all">
                  <div className="p-2 bg-brand-text/5 rounded-lg"><ImageIcon size={20} className="text-brand-text/50" /></div>
                  <input
                    value={qImage}
                    onChange={e => setQImage(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-brand-text font-bold placeholder-brand-text/40"
                    placeholder="URL de l'image (optionnel)"
                  />
                </div>
              </div>

              {/* OPTIONS DE RÉPONSE */}
              <div className="bg-white/30 p-6 rounded-[24px] border border-white/40 shadow-inner">
                <label className="block text-sm text-brand-text/60 mb-4 uppercase tracking-widest font-black flex justify-between items-center">
                  Réponses <span className="text-xs normal-case font-bold text-brand-text/50 bg-white/50 px-3 py-1 rounded-full">(Cochez la bonne réponse)</span>
                </label>

                {(qType === 'mcq' || qType === 'tf') ? (
                  <div className="space-y-3">
                    {qOptions.map((o, i) => (
                      <div key={i} className={`flex items-center gap-3 p-2 rounded-[16px] transition-colors border-2 ${qCorrectIdx === i ? 'bg-brand-teal/10 border-brand-teal/30 shadow-sm' : 'border-transparent hover:bg-white/40'}`}>
                        <div className="pl-2">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={qCorrectIdx === i}
                            onChange={() => setQCorrectIdx(i)}
                            className="w-5 h-5 accent-brand-teal cursor-pointer"
                          />
                        </div>
                        <input
                          value={o}
                          onChange={e => { const n = [...qOptions]; n[i] = e.target.value; setQOptions(n); }}
                          className="flex-1 bg-white/60 p-3 rounded-xl border border-white/50 outline-none text-brand-text font-bold placeholder-brand-text/40 focus:border-brand-teal shadow-inner transition-colors"
                          placeholder={`Option ${i + 1}`}
                        />
                        {qType === 'mcq' && qOptions.length > 2 && (
                          <button onClick={() => removeOption(i)} className="text-brand-coral/60 hover:text-brand-coral transition-colors p-2 bg-white/60 hover:bg-white rounded-lg shadow-sm border border-white/50"><MinusCircle size={20} /></button>
                        )}
                      </div>
                    ))}
                    {qType === 'mcq' && qOptions.length < 6 && (
                      <button onClick={addOption} className="text-sm flex items-center gap-2 text-brand-teal hover:text-white bg-white/60 hover:bg-brand-teal border border-brand-teal/20 px-4 py-2 rounded-full font-black mt-4 shadow-sm transition-all ml-2">
                        <PlusCircle size={16} /> Ajouter une option
                      </button>
                    )}
                  </div>
                ) : (
                  <input
                    value={qCorrectText}
                    onChange={e => setQCorrectText(e.target.value)}
                    className="w-full bg-brand-teal/10 p-4 rounded-xl border-2 border-brand-teal/30 focus:border-brand-teal outline-none transition-all text-brand-teal font-black text-lg placeholder-brand-teal/50 shadow-inner"
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
            <div className="flex flex-col h-full bg-white/40 p-6 rounded-[24px] border border-white/50 shadow-soft backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm text-brand-text/60 uppercase tracking-widest font-black flex items-center gap-2">Questions Aperçu</label>
                {newQuestions.length > 0 && <span className="text-xs bg-brand-teal px-3 py-1 rounded-full text-white font-black shadow-inner">{newQuestions.length}</span>}
              </div>

              <div className="flex-1 bg-white/60 rounded-[20px] border border-white/50 overflow-hidden flex flex-col shadow-inner">
                {newQuestions.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-brand-text/40 p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-white/40 border border-white/60 flex items-center justify-center mb-6 shadow-sm"><PlusCircle size={40} className="text-brand-text/30" /></div>
                    <p className="font-bold text-lg">Ajoutez des questions pour voir l'aperçu ici.</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto p-4 space-y-4 custom-scrollbar flex-1">
                    {newQuestions.map((q, i) => (
                      <div key={i} className="bg-white/80 p-5 rounded-[16px] border border-white/80 shadow-sm hover:shadow-soft transition-all group relative">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-xs font-black text-brand-teal mb-2 block bg-brand-teal/10 w-fit px-2 py-0.5 rounded-md border border-brand-teal/20">Q{i + 1} • {q.type.toUpperCase()}</span>
                            <p className="font-black text-brand-text line-clamp-2 text-lg leading-snug">{q.question}</p>
                            <p className="text-sm font-bold text-brand-text/60 mt-2 flex gap-2">
                              Réponse : <span className="text-brand-teal">{q.type === 'text' ? q.correct : q.options[q.correct]}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => setNewQuestions(newQuestions.filter((_, idx) => idx !== i))}
                            className="text-brand-coral/50 hover:text-white hover:bg-brand-coral opacity-0 group-hover:opacity-100 transition-all p-2 rounded-lg bg-white shadow-sm border border-white/80"
                          >
                            <Trash2 size={20} />
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
                className="w-full bg-brand-teal hover:bg-brand-teal/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-5 rounded-[20px] font-black text-xl shadow-soft mt-6 flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                {loading ? 'Sauvegarde...' : <><Save size={24} /> {editingQuizId ? 'Mettre à jour' : 'Enregistrer le Quiz'}</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto pb-20 relative overflow-hidden bg-brand-bg min-h-screen border-none text-brand-text">
      <div className="absolute top-[10%] left-[-10%] w-[600px] h-[600px] bg-brand-coral/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-brand-teal/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="mb-8 relative z-10">
        <button onClick={() => navigate('/quiz')} className="flex items-center gap-2 text-brand-text/60 font-black hover:text-brand-text bg-white/40 px-5 py-2.5 rounded-full border border-white/50 shadow-sm backdrop-blur-md transition-all">
          <ArrowLeft size={20} /> Retour au Quiz
        </button>
      </div>
      <div className="flex justify-between items-center mb-12 relative z-10"><h1 className="text-4xl font-black text-brand-text">Administration</h1><button onClick={() => setIsCreating(true)} className="bg-brand-coral hover:bg-brand-coral/90 text-white px-6 py-3.5 rounded-[20px] font-black flex items-center gap-3 shadow-soft transition-all active:scale-95"><PlusCircle size={20} /> Créer Quiz</button></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 relative z-10">
        <div className="bg-white/40 p-8 rounded-[30px] border border-white/50 shadow-soft backdrop-blur-xl flex flex-col">
          <div className="bg-brand-teal/10 w-16 h-16 rounded-[20px] flex items-center justify-center mb-6 text-brand-teal shadow-inner border border-brand-teal/20"><PlayCircle size={32} /></div>
          <h2 className="text-3xl font-black mb-6 text-brand-text">Lancer une Partie</h2>
          <div className="mb-8">
            <label className="text-sm font-black text-brand-text/60 uppercase tracking-widest mb-3 block">Choisir le Quiz</label>
            <div className="flex gap-3">
              <select value={selectedQuizId} onChange={(e) => setSelectedQuizId(e.target.value)} className="flex-1 bg-white/60 border border-white/50 p-4 rounded-[16px] outline-none focus:border-brand-teal font-bold shadow-inner text-brand-text">{savedQuizzes.map(q => (<option key={q.id} value={q.id}>{q.title} ({q.questions.length} Q)</option>))}</select>
              <button onClick={() => { const q = savedQuizzes.find(sq => sq.id === selectedQuizId); if (q) handleEdit(q); }} className="bg-white/60 hover:bg-white border border-white/50 p-4 rounded-[16px] text-brand-teal transition-colors shadow-sm" title="Modifier">
                <Edit size={24} />
              </button>
            </div>
          </div>

          {/* SÉLECTEUR DE MODE DE JEU */}
          <div className="mb-8 grid grid-cols-2 gap-3 bg-white/30 p-2 rounded-[20px] border border-white/50 shadow-inner">
            <button onClick={() => setGameMode('live')} className={`flex flex-col items-center justify-center py-4 rounded-[16px] transition-all font-black border ${gameMode === 'live' ? 'bg-brand-teal text-white shadow-soft border-brand-teal' : 'hover:bg-white/60 text-brand-text/50 border-transparent'}`}>
              <Zap size={24} className="mb-2" /> <span className="text-sm">LIVE</span>
            </button>
            <button onClick={() => setGameMode('async')} className={`flex flex-col items-center justify-center py-4 rounded-[16px] transition-all font-black border ${gameMode === 'async' ? 'bg-brand-peach text-brand-text shadow-soft border-brand-coral/20' : 'hover:bg-white/60 text-brand-text/50 border-transparent'}`}>
              <Moon size={24} className="mb-2" /> <span className="text-sm">SOIRÉE</span>
            </button>
          </div>

          <button onClick={createLobby} disabled={loading} className={`w-full py-5 rounded-[20px] font-black text-xl shadow-soft mt-auto transition-all active:scale-95 text-white ${gameMode === 'live' ? 'bg-brand-teal hover:bg-brand-teal/90' : 'bg-brand-peach hover:bg-brand-peach/90 text-brand-text'}`}>{loading ? 'Création...' : `Créer Lobby ${gameMode === 'live' ? 'Direct' : 'Soirée'}`}</button>
        </div>
        {/* LISTE LOBBYS */}
        <div className="bg-white/40 rounded-[30px] border border-white/50 shadow-soft lg:col-span-2 overflow-hidden flex flex-col h-[400px] backdrop-blur-xl relative z-10">
          <div className="p-8 border-b border-white/40 flex items-center gap-3 bg-white/30 backdrop-blur-md shadow-sm"><Activity className="text-brand-teal" size={28} /><h2 className="text-2xl font-black text-brand-text">Actifs</h2></div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 relative bg-white/10">
            {activeLobbies.length === 0 ? <div className="text-center font-bold text-brand-text/50 mt-12 text-lg">Aucun lobby.</div> : activeLobbies.map(l => (
              <div key={l.id} className="flex justify-between items-center p-5 bg-white/60 rounded-[20px] border border-white/50 shadow-sm hover:shadow-soft transition-all">
                <div className="flex items-center gap-4"><span className="font-black text-2xl text-brand-text bg-white/60 px-4 py-1.5 rounded-[12px] shadow-inner">{l.id}</span><span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm ${l.mode === 'live' ? 'bg-brand-teal text-white' : 'bg-brand-peach text-brand-text'}`}>{l.mode}</span></div>
                <div className="flex items-center gap-4">
                  <button onClick={() => navigate(`/host/${l.id}`)} className="text-brand-teal hover:text-white hover:bg-brand-teal bg-white border border-white/80 p-3 rounded-[12px] shadow-sm transition-all"><MonitorPlay size={20} /></button>
                  <button onClick={() => deleteLobby(l.id)} className="text-brand-coral/60 hover:text-white hover:bg-brand-coral bg-white border border-white/80 p-3 rounded-[12px] shadow-sm transition-all"><Trash2 size={20} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HISTORIQUE */}
      <div className="bg-white/40 rounded-[30px] border border-white/50 shadow-soft overflow-hidden backdrop-blur-xl relative z-10">
        <div className="p-8 border-b border-white/40 flex items-center gap-3 bg-brand-coral/5 backdrop-blur-md shadow-sm">
          <History className="text-brand-coral" size={28} />
          <h2 className="text-2xl font-black text-brand-text">Historique des Parties</h2>
        </div>
        <div className="p-4 bg-white/10">
          {history.length === 0 ? (
            <div className="text-center text-brand-text/50 py-12 font-bold text-lg">Aucune partie terminée.</div>
          ) : (
            <div className="space-y-4">
              {history.map((game) => (
                <div key={game.id} className="flex flex-col md:flex-row justify-between items-center p-5 bg-white/60 rounded-[20px] border border-white/50 shadow-sm hover:shadow-soft transition-all">
                  <div className="flex items-center gap-8 w-full md:w-auto">
                    <div className="text-center min-w-[100px] bg-white p-3 rounded-[16px] shadow-inner border border-white/80">
                      <div className="text-sm font-black text-brand-text">{new Date(game.date).toLocaleDateString()}</div>
                      <div className="text-xs font-bold text-brand-text/50 mt-1">{new Date(game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div>
                      <div className="font-black text-xl text-brand-text mb-2">{game.quizTitle || 'Quiz sans titre'}</div>
                      <div className="text-sm font-bold text-brand-text/60 flex items-center gap-3">
                        <span className="bg-white/80 px-3 py-1 rounded-md text-xs shadow-inner border border-white/80">Code: <span className="font-black">{game.code}</span></span>
                        <span className="text-brand-text/30">•</span>
                        <span>{game.totalPlayers} Joueurs</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-6 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right bg-white/40 p-4 rounded-[16px] border border-white/60 shadow-inner">
                      <div className="text-xs font-black text-brand-text/50 uppercase tracking-widest mb-2 text-left">Vainqueur</div>
                      <div className="font-black text-brand-coral flex items-center gap-3 text-xl">
                        {game.winner}
                        <span className="bg-brand-coral text-white px-3 py-1 rounded-full text-sm font-black shadow-soft border border-brand-coral/20">{game.winnerScore} pts</span>
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