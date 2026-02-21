import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom"; // Pour le bouton retour accueil
import { Volume2, VolumeX, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { collection, addDoc, query, orderBy, limit, getDocs, where, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { ThemeContext } from "../../ThemeContext";

// --- LOGIQUE DES JEUX (MATHS) ---
// (J'ai repris exactement tes fonctions)

function getRandomMultiplication() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, question: `${a} × ${b}`, answer: a * b };
}

function getRandomAddition() {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  return { a, b, question: `${a} + ${b}`, answer: a + b };
}

function getRandomAddTen() {
  const a = Math.floor(Math.random() * 61) + 11;
  const b = (Math.floor(Math.random() * 5) + 1) * 10;
  return { a, b, question: `${a} + ${b}`, answer: a + b };
}

function getRandomSubTen() {
  const a = Math.floor(Math.random() * 80) + 20;
  const maxTens = Math.floor(a / 10);
  const b = (Math.floor(Math.random() * maxTens) + 1) * 10;
  return { a, b, question: `${a} - ${b}`, answer: a - b };
}

function getRandomAddEleven() {
  const isLowNumber = Math.random() < 0.8;
  let a;
  if (isLowNumber) { a = Math.floor(Math.random() * 60) + 40; }
  else { a = Math.floor(Math.random() * 851) + 100; }
  const b = 11;
  return { a, b, question: `${a} + ${b}`, answer: a + b };
}

function getRandomSubEleven() {
  const isLowNumber = Math.random() < 0.8;
  let a;
  if (isLowNumber) { a = Math.floor(Math.random() * 60) + 40; }
  else { a = Math.floor(Math.random() * 851) + 100; }
  const b = 11;
  return { a, b, question: `${a} - ${b}`, answer: a - b };
}

const CLASSES = ["CP A", "CP B", "CE1 A", "CE1 B", "CE2 A", "CE2 B", "CM1 A", "CM1 B", "CM2 A", "CM2 B"];

function MathsGames() {
  const { theme } = React.useContext(ThemeContext);
  const isDark = theme === 'dark';
  // --- ETATS ---
  const [selectedGame, setSelectedGame] = useState(null);
  const [timeLeft, setTimeLeft] = useState(100);
  const [speedFactor, setSpeedFactor] = useState(1);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState({ question: "", answer: 0 });
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showPenalty, setShowPenalty] = useState(false);
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [showAllScores, setShowAllScores] = useState(false);

  // --- LEADERBOARD & JOUEUR ---
  const [topScores, setTopScores] = useState([]);
  const [playerName, setPlayerName] = useState("");
  const [playerClass, setPlayerClass] = useState("");
  const [savingScore, setSavingScore] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  // --- LOGIQUE FIREBASE ---
  const getCollectionName = useCallback(() => {
    if (selectedGame === 'add') return "leaderboard_add";
    if (selectedGame === 'addTen') return "leaderboard_addTen";
    if (selectedGame === 'subTen') return "leaderboard_subTen";
    if (selectedGame === 'addEleven') return "leaderboard_addEleven";
    if (selectedGame === 'subEleven') return "leaderboard_subEleven";
    return "leaderboard_mult";
  }, [selectedGame]);

  const loadTopScores = useCallback(async () => {
    if (!selectedGame) return;
    try {
      const colName = getCollectionName();
      const q = query(collection(db, colName), orderBy("score", "desc"), limit(15));
      const snapshot = await getDocs(q);
      const scores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTopScores(scores);
    } catch (error) {
      console.error("Erreur leaderboard:", error);
    }
  }, [selectedGame, getCollectionName]);

  const getNextQuestion = useCallback(() => {
    if (selectedGame === 'add') return getRandomAddition();
    if (selectedGame === 'addTen') return getRandomAddTen();
    if (selectedGame === 'subTen') return getRandomSubTen();
    if (selectedGame === 'addEleven') return getRandomAddEleven();
    if (selectedGame === 'subEleven') return getRandomSubEleven();
    return getRandomMultiplication();
  }, [selectedGame]);

  const startGame = () => {
    setCurrent(getNextQuestion());
    setTimeLeft(100);
    setSpeedFactor(1);
    setScore(0);
    setUserAnswer("");
    setGameOver(false);
    setRunning(true);
    setScoreSaved(false);
    setSavingScore(false);
    setShowPenalty(false);
  };

  const goMenu = () => {
    setRunning(false);
    setGameOver(false);
    setSelectedGame(null);
    setTopScores([]);
    setIsAudioMode(false);
    setIsPracticeMode(false);
  };

  const saveScore = async () => {
    if (!playerName) return;
    setSavingScore(true);
    try {
      const colName = getCollectionName();
      const cleanPseudo = playerName.slice(0, 12);

      const q = query(collection(db, colName), where("pseudo", "==", cleanPseudo));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        if (score > existingDoc.data().score) {
          await updateDoc(doc(db, colName, existingDoc.id), { score: score, date: new Date().toISOString(), classLabel: playerClass });
        }
      } else {
        await addDoc(collection(db, colName), {
          pseudo: cleanPseudo,
          score: score,
          date: new Date().toISOString(),
          classLabel: playerClass
        });
      }
      await loadTopScores();
      setScoreSaved(true);
      startGame();
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("Problème de connexion à la base de données.");
      setSavingScore(false);
    }
  };

  useEffect(() => { loadTopScores(); }, [loadTopScores]);

  // --- AUDIO ---
  const speak = useCallback((text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  const getSpokenText = useCallback((q) => {
    if (!q || !q.question) return "";
    let t = q.question.replace(/×/g, "fois").replace(/-/g, "moins").replace(/\+/g, "plus");
    return `Combien font ${t} ?`;
  }, []);

  useEffect(() => {
    if (running && !gameOver && isAudioMode) {
      speak(getSpokenText(current));
    }
  }, [current, running, gameOver, isAudioMode, speak, getSpokenText]);

  useEffect(() => {
    if (!running) return;
    if (isPracticeMode) return;
    if (timeLeft <= 0) {
      setRunning(false);
      setGameOver(true);
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000 / speedFactor);
    return () => clearInterval(interval);
  }, [timeLeft, running, speedFactor, isPracticeMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!running || gameOver) return;
    const num = parseInt(userAnswer, 10);

    if (num === current.answer) {
      const newScore = score + 1;
      setScore(newScore);
      if (!isPracticeMode) {
        setSpeedFactor((prev) => prev * 1.1);
        setTimeLeft(100);
      }
      setCurrent(getNextQuestion());
      setUserAnswer("");
    } else {
      if (!isPracticeMode) setTimeLeft((prev) => Math.max(prev - 5, 0));
      setUserAnswer("");
      setShowPenalty(true);
      setTimeout(() => setShowPenalty(false), 800);
    }
  };

  const getGameTitle = () => {
    if (selectedGame === 'mult') return 'Multiplications';
    if (selectedGame === 'add') return 'Additions';
    if (selectedGame === 'addTen') return 'Ajout de dizaines';
    if (selectedGame === 'subTen') return 'Retrait de dizaines';
    if (selectedGame === 'addEleven') return '+11';
    if (selectedGame === 'subEleven') return '-11';
    return 'Jeu';
  };

  // --- RENDER ---
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Link to="/games" className="relative md:absolute top-0 left-0 md:top-6 md:left-6 z-10 w-fit mb-6 md:mb-0 flex items-center gap-2 px-4 py-2 text-sm rounded-full font-bold text-brand-text bg-white/40 border border-white/50 hover:bg-white/80 transition-all shadow-soft backdrop-blur-md">
        ← Retour
      </Link>

      {!selectedGame ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-text">Mathématiques 📐</h1>
            <p className="text-brand-text/70 text-lg">Choisis ton épreuve :</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-4xl">
            {/* LISTE DES JEUX */}
            {[
              { id: 'mult', icon: '✖️', title: 'Multiplications', desc: 'Tables de 1 à 9' },
              { id: 'add', icon: '➕', title: 'Additions', desc: 'Calcul mental' },
              { id: 'addTen', icon: '🔢', title: '+ 10/20/30...', desc: 'Ajout de dizaines' },
              { id: 'subTen', icon: '➖', title: '- 10/20/30...', desc: 'Retrait de dizaines' },
              { id: 'addEleven', icon: '🚀', title: '+ 11', desc: "Nombres jusqu'à 950" },
              { id: 'subEleven', icon: '📉', title: '- 11', desc: "Nombres jusqu'à 950" },
            ].map((game) => (
              <div
                key={game.id}
                className="group relative flex flex-col items-center p-6 rounded-[24px] border border-white/50 bg-white/40 hover:bg-white/80 transition-all cursor-pointer backdrop-blur-xl shadow-soft"
                onClick={() => setSelectedGame(game.id)}
              >
                <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{game.icon}</span>
                <h3 className="text-lg font-bold group-hover:text-brand-teal text-brand-text transition-colors">{game.title}</h3>
                <p className="text-brand-text/60 text-sm font-medium">{game.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* --- ECRAN DE JEU --- */
        <div className="w-full max-w-2xl mx-auto border border-white/50 p-8 rounded-[30px] bg-white/40 backdrop-blur-xl shadow-soft mt-10">
          <div className="flex justify-between items-center mb-8">
            <button
              className="px-4 py-2 text-sm font-bold rounded-full bg-white text-brand-text border border-brand-text/10 hover:bg-brand-coral hover:text-white transition-all shadow-sm"
              onClick={goMenu}
            >
              ⬅ Menu Maths
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-brand-text">{getGameTitle()} 🏆</h1>
          </div>

          <div className="p-6 rounded-[24px] mb-8 border border-white/40 bg-white/60 shadow-inner">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-brand-teal">
              <Trophy size={20} className="text-brand-coral" /> Classement
            </h3>

            {topScores.length > 0 ? (
              <div className="flex flex-col">
                {/* PODIUM */}
                <div className="flex justify-center items-end gap-2 sm:gap-4 mb-6 px-2 pt-4">
                  {/* 2ND PLACE */}
                  <div className="flex flex-col items-center w-1/3">
                    {topScores[1] ? (
                      <>
                        <div className="relative flex flex-col items-center justify-end w-full rounded-t-2xl p-2 border-t border-l border-r border-white/50 bg-brand-bg/50 backdrop-blur-sm" style={{ height: '120px' }}>
                          <span className="text-2xl mb-1 drop-shadow-sm">🥈</span>
                          <span className="font-bold text-center text-sm truncate w-full text-brand-text">{topScores[1].pseudo}</span>
                          <span className="text-xs text-brand-text/60 font-medium">{topScores[1].score} pts</span>
                        </div>
                        <div className="w-full h-2 bg-brand-teal mt-1 rounded-full"></div>
                      </>
                    ) : <div className="h-[120px]"></div>}
                  </div>

                  {/* 1ST PLACE */}
                  <div className="flex flex-col items-center w-1/3">
                    {topScores[0] ? (
                      <>
                        <div className="mb-2"><Trophy size={28} className="text-brand-coral drop-shadow-md animate-bounce" /></div>
                        <div className="relative flex flex-col items-center justify-end w-full rounded-t-2xl p-2 border-t border-l border-r border-white/60 bg-gradient-to-b from-brand-peach/40 to-white/20 backdrop-blur-md shadow-[0_0_20px_rgba(235,172,162,0.4)]" style={{ height: '150px' }}>
                          <span className="text-3xl mb-1 drop-shadow-sm">👑</span>
                          <span className="font-bold text-center truncate w-full text-brand-coral">{topScores[0].pseudo}</span>
                          <span className="font-black text-brand-text">{topScores[0].score} pts</span>
                        </div>
                        <div className="w-full h-2 bg-brand-coral mt-1 rounded-full"></div>
                      </>
                    ) : null}
                  </div>

                  {/* 3RD PLACE */}
                  <div className="flex flex-col items-center w-1/3">
                    {topScores[2] ? (
                      <>
                        <div className="relative flex flex-col items-center justify-end w-full rounded-t-2xl p-2 border-t border-l border-r border-white/50 bg-brand-bg/40 backdrop-blur-sm" style={{ height: '100px' }}>
                          <span className="text-2xl mb-1 drop-shadow-sm">🥉</span>
                          <span className="font-bold text-center text-sm truncate w-full text-brand-text/80">{topScores[2].pseudo}</span>
                          <span className="text-xs text-brand-text/70">{topScores[2].score} pts</span>
                        </div>
                        <div className="w-full h-2 bg-brand-text/30 mt-1 rounded-full"></div>
                      </>
                    ) : <div className="h-[100px]"></div>}
                  </div>
                </div>

                {/* LIST (4th - 15th) */}
                {topScores.length > 3 && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowAllScores(!showAllScores)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold transition-all rounded-xl hover:bg-white text-brand-text/60 hover:text-brand-text bg-white/40 shadow-sm border border-white/50"
                    >
                      {showAllScores ? <><ChevronUp size={16} /> Masquer la suite</> : <><ChevronDown size={16} /> Voir la suite ({topScores.length - 3})</>}
                    </button>

                    {showAllScores && (
                      <div className="mt-3 space-y-2 rounded-2xl p-2 bg-white/30 backdrop-blur-sm border border-white/30">
                        {topScores.slice(3).map((score, index) => (
                          <div key={score.id || index} className="flex items-center justify-between px-4 py-3 rounded-[16px] bg-white/60 hover:bg-white/90 border border-white/50 shadow-sm transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-8 h-8 text-xs font-bold rounded-full bg-brand-bg text-brand-text shadow-inner border border-brand-text/5">{index + 4}</span>
                              <span className="text-sm font-bold text-brand-text">{score.pseudo} <span className="opacity-60 text-xs font-medium">({score.classLabel || "?"})</span></span>
                            </div>
                            <strong className="text-sm text-brand-teal font-black">{score.score}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 italic">Aucun score enregistré pour le moment...</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="p-4 rounded-[20px] border border-white/50 text-center flex flex-col relative overflow-hidden bg-brand-teal text-white shadow-soft">
              <span className="text-[10px] font-bold uppercase tracking-wider mb-1 text-white/70">Temps</span>
              <strong className="text-4xl font-black drop-shadow-sm">{isPracticeMode ? "∞" : `${timeLeft.toFixed(0)} s`}</strong>
              {showPenalty && !isPracticeMode && <span className="absolute top-2 right-2 text-brand-coral bg-white px-2 py-0.5 rounded-full text-xs font-black animate-ping">-5s</span>}
            </div>
            <div className="p-4 rounded-[20px] border border-white/60 text-center flex flex-col bg-white/80 backdrop-blur-sm shadow-soft">
              <span className="text-[10px] font-bold uppercase tracking-wider mb-1 text-brand-text/50">Score</span>
              <strong className="text-4xl font-black text-brand-coral drop-shadow-sm">{score}</strong>
            </div>
          </div>

          {!running && (
            <div className="mb-6 space-y-6">
              <div className="flex gap-4">
                <input
                  type="text"
                  className="flex-1 w-2/3 border border-white/50 rounded-2xl px-5 py-4 outline-none transition-all bg-white/60 text-brand-text placeholder-brand-text/40 focus:border-brand-teal focus:bg-white shadow-inner font-semibold"
                  placeholder="Ton pseudo"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={12}
                  autoFocus
                />
                <select
                  className="w-1/3 border border-white/50 rounded-2xl px-5 py-4 outline-none transition-all bg-white/60 text-brand-text focus:border-brand-teal focus:bg-white shadow-inner font-semibold cursor-pointer"
                  value={playerClass}
                  onChange={(e) => setPlayerClass(e.target.value)}
                >
                  <option value="">Ta classe</option>
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setIsAudioMode(!isAudioMode)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 shadow-sm ${isAudioMode ? 'bg-brand-teal text-white border-brand-teal' : 'bg-white/40 border-white/60 text-brand-text/60 hover:bg-white hover:text-brand-text'}`}
                >
                  {isAudioMode ? <><Volume2 size={16} /> Audio Activé</> : <><VolumeX size={16} /> Audio Désactivé</>}
                </button>
                <button
                  onClick={() => setIsPracticeMode(!isPracticeMode)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 shadow-sm ${isPracticeMode ? 'bg-brand-peach text-brand-text border-brand-coral/30' : 'bg-white/40 border-white/60 text-brand-text/60 hover:bg-white hover:text-brand-text'}`}
                >
                  {isPracticeMode ? "🧘 Entraînement : ON" : "⚡ Entraînement : OFF"}
                </button>
              </div>
            </div>
          )}

          {!running && !gameOver && playerName && playerClass && (
            <button
              className="w-full py-4 px-6 bg-brand-coral hover:bg-brand-coral/90 text-white text-lg font-black rounded-2xl shadow-soft transition-all active:scale-95"
              onClick={startGame}
            >
              🎮 Démarrer ({playerName})
            </button>
          )}

          {running && !gameOver && (
            <div className="flex flex-col items-center max-w-sm mx-auto w-full">
              <div className="text-center mb-8">
                <span className="text-brand-text/60 font-bold uppercase tracking-widest text-xs">Combien font :</span>
                <div className="text-7xl font-black mt-4 tracking-tighter flex items-center justify-center gap-4 text-brand-text drop-shadow-sm">
                  {current.question}
                  <button onClick={() => speak(getSpokenText(current))} className="p-3 rounded-full hover:bg-white/60 bg-white/40 transition-all text-brand-teal shadow-sm border border-white/50" title="Répéter">
                    <Volume2 size={28} />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 w-full">
                <input
                  type="number"
                  className="w-full text-center text-5xl font-black border border-white/60 rounded-[24px] px-6 py-6 outline-none transition-all bg-white/60 text-brand-text focus:border-brand-teal focus:bg-white shadow-inner"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="?"
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full py-4 text-xl bg-brand-teal hover:bg-brand-teal/90 text-white font-black rounded-[20px] transition-all active:scale-95 shadow-soft"
                >
                  Valider
                </button>
              </form>
              {isPracticeMode && (
                <button
                  onClick={() => { setRunning(false); setGameOver(true); }}
                  className="mt-6 w-full py-2 text-sm font-bold text-brand-coral/70 hover:text-brand-coral hover:bg-brand-coral/10 rounded-full transition-colors"
                >
                  Arrêter l'entraînement
                </button>
              )}
            </div>
          )}

          {gameOver && (
            <div className="text-center space-y-8 py-6">
              <h2 className="text-4xl font-black text-brand-text">{isPracticeMode ? "Entraînement terminé" : "⏰ Temps écoulé !"}</h2>
              <div className="bg-white/50 border border-white/60 p-6 rounded-[24px] shadow-inner inline-block">
                <p className="text-brand-text/60 font-bold uppercase tracking-widest text-sm mb-2">Score final</p>
                <div className="text-6xl font-black text-brand-teal drop-shadow-md">{score}</div>
              </div>
              <div className="space-y-4 max-w-sm mx-auto">
                {!scoreSaved && !isPracticeMode && (
                  <button
                    className="w-full py-4 text-lg bg-brand-coral hover:bg-brand-coral/90 text-white font-black rounded-2xl shadow-soft transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={saveScore}
                    disabled={savingScore}
                  >
                    {savingScore ? "Sauvegarde..." : "💾 Sauvegarder le score"}
                  </button>
                )}
                <button
                  className="w-full py-4 text-lg font-bold rounded-2xl transition-all bg-white/60 text-brand-text/80 hover:bg-white hover:text-brand-text border border-white/50 shadow-sm"
                  onClick={startGame}
                >
                  {scoreSaved ? "🔄 Rejouer" : "Rejouer sans sauvegarder"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MathsGames;