import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom"; // Pour le bouton retour accueil
import { Sun, Moon, Volume2, VolumeX } from 'lucide-react';
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

function MathsGames() {
  const { theme, toggleTheme } = React.useContext(ThemeContext);
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

  // --- LEADERBOARD & JOUEUR ---
  const [topScores, setTopScores] = useState([]);
  const [playerName, setPlayerName] = useState("");
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
      const q = query(collection(db, colName), orderBy("score", "desc"), limit(10));
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
          await updateDoc(doc(db, colName, existingDoc.id), { score: score, date: new Date().toISOString() });
        }
      } else {
        await addDoc(collection(db, colName), {
          pseudo: cleanPseudo,
          score: score,
          date: new Date().toISOString()
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
      <nav className="flex justify-end items-center mb-12">
        <button onClick={toggleTheme} className={`p-2 transition-colors rounded-lg ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}>
           {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
      </nav>

      {!selectedGame ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
          {/* BOUTON RETOUR ACCUEIL PRINCIPAL */}
          <Link to="/games" className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors mb-4 ${isDark ? 'text-cyan-400 bg-cyan-950/30 border-cyan-900/50 hover:bg-cyan-900/50' : 'text-cyan-700 bg-cyan-100/50 border-cyan-200 hover:bg-cyan-200/50'}`}>
             ← Retour Jeux
          </Link>
          
          <div className="space-y-2">
            <h1 className={`text-4xl md:text-5xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Mathématiques 📐</h1>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-lg`}>Choisis ton épreuve :</p>
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
                className={`group relative flex flex-col items-center p-6 rounded-2xl border transition-all cursor-pointer backdrop-blur-sm ${isDark ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 hover:border-cyan-500/30' : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-cyan-500/50 shadow-sm'}`}
                onClick={() => setSelectedGame(game.id)}
              >
                <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{game.icon}</span>
                <h3 className={`text-lg font-semibold group-hover:text-cyan-600 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{game.title}</h3>
                <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm`}>{game.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* --- ECRAN DE JEU (Identique à avant) --- */
        <div className={`w-full max-w-2xl mx-auto border p-8 rounded-2xl backdrop-blur-xl shadow-2xl mt-10 ${isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white/90 border-slate-200'}`}>
          <div className="flex justify-between items-center mb-8">
            <button 
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'}`} 
              onClick={goMenu}
            >
              ⬅ Menu Maths
            </button>
            <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{getGameTitle()} 🏆</h1>
          </div>

          <div className={`p-6 rounded-xl mb-8 border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>🥇 Top 10 ({getGameTitle()})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {topScores.length > 0 ? (
                 topScores.map(({ id, pseudo, score }) => (
                  <div key={id} className={`flex justify-between items-center py-2 border-b last:border-0 text-sm ${isDark ? 'border-slate-800/50 text-slate-300' : 'border-slate-200 text-slate-700'}`}>
                    <span>{pseudo}</span>
                    <strong className={isDark ? 'text-white' : 'text-slate-900'}>{score}</strong>
                  </div>
                 ))
              ) : (<div className="text-slate-500 text-sm italic">Aucun score...</div>)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className={`p-4 rounded-xl border text-center flex flex-col relative overflow-hidden ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}>
              <span className={`text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Temps</span>
              <strong className={`text-3xl ${isDark ? 'text-white' : 'text-slate-900'}`}>{isPracticeMode ? "∞" : `${timeLeft.toFixed(0)} s`}</strong>
              {showPenalty && !isPracticeMode && <span className="absolute top-2 right-2 text-red-500 text-xs font-bold animate-ping">-5s</span>}
            </div>
            <div className={`p-4 rounded-xl border text-center flex flex-col ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}>
              <span className={`text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Score</span>
              <strong className={`text-3xl ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{score}</strong>
            </div>
          </div>

          {!running && (
            <div className="mb-6 space-y-4">
              <input 
                type="text" 
                className={`w-full border rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'}`} 
                placeholder="Ton pseudo (max 12)" 
                value={playerName} 
                onChange={(e) => setPlayerName(e.target.value)} 
                maxLength={12} 
                autoFocus 
              />
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setIsAudioMode(!isAudioMode)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border flex items-center gap-2 ${isAudioMode ? 'bg-cyan-500/20 border-cyan-500 text-cyan-500' : 'bg-transparent border-slate-500 text-slate-500 hover:border-slate-400 hover:text-slate-400'}`}
                >
                  {isAudioMode ? <><Volume2 size={18}/> Audio Activé</> : <><VolumeX size={18}/> Audio Désactivé</>}
                </button>
                <button
                  onClick={() => setIsPracticeMode(!isPracticeMode)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border flex items-center gap-2 ${isPracticeMode ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-transparent border-slate-500 text-slate-500 hover:border-slate-400 hover:text-slate-400'}`}
                >
                  {isPracticeMode ? "🧘 Mode Entraînement (Activé)" : "⚡ Activer Mode Entraînement"}
                </button>
              </div>
            </div>
          )}

          {!running && !gameOver && playerName && (
            <button 
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-95" 
              onClick={startGame}
            >
              🎮 Démarrer ({playerName})
            </button>
          )}

          {running && !gameOver && (
            <>
              <div className="text-center mb-8">
                <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm`}>Combien font :</span>
                <div className={`text-6xl font-bold mt-4 tracking-tighter flex items-center justify-center gap-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {current.question}
                  <button onClick={() => speak(getSpokenText(current))} className="p-2 rounded-full hover:bg-slate-500/20 transition-colors text-slate-400 hover:text-cyan-500" title="Répéter">
                    <Volume2 size={32} />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                  type="number" 
                  className={`w-full text-center text-4xl font-bold border rounded-xl px-4 py-4 outline-none transition-all ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'}`} 
                  value={userAnswer} 
                  onChange={(e) => setUserAnswer(e.target.value)} 
                  placeholder="?" 
                  autoFocus 
                />
                <button 
                  type="submit" 
                  className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all active:scale-95"
                >
                  Valider
                </button>
              </form>
              {isPracticeMode && (
                <button 
                    onClick={() => { setRunning(false); setGameOver(true); }}
                    className="mt-4 w-full py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    Arrêter l'entraînement
                </button>
              )}
            </>
          )}

          {gameOver && (
            <div className="text-center space-y-6 py-4">
              <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{isPracticeMode ? "Entraînement terminé" : "⏰ Temps écoulé !"}</h2>
              <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'} text-xl`}>Score final : <strong className={isDark ? 'text-cyan-400' : 'text-cyan-600'}>{score}</strong></p>
              <div className="space-y-3">
                {!scoreSaved && !isPracticeMode && (
                  <button 
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" 
                    onClick={saveScore} 
                    disabled={savingScore}
                  >
                    {savingScore ? "Sauvegarde..." : "💾 Sauvegarder le score"}
                  </button>
                )}
                <button 
                  className={`w-full py-3 px-4 font-semibold rounded-xl transition-all ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`} 
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