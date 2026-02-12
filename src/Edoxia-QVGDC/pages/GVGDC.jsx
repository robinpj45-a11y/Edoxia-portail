// c:\Projets\Edoxia\src\Edoxia-QVGDC\pages\GVGDC.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Mic, Volume2, Skull, Check, X, HelpCircle, Zap, GripVertical, Plus, Trash2, Maximize, Minimize, RefreshCw, Trophy, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import suspensSound from '../../assets/Suspens QVGDC.mp3';
import winSound from '../../assets/Gagnant QVGDC.mp3';
import loseSound from '../../assets/Perte QVGDC.mp3';

// --- DONNÉES FICTIVES (MOCK) ---
const MOCK_QUESTIONS = [
  { id: 1, question: "Dans 'The Legend of Zelda', quel est le nom du héros ?", options: ["Zelda", "Link", "Ganon", "Epona"], correct: 1 },
  { id: 2, question: "Quelle est la capitale de l'Australie ?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], correct: 2 },
  { id: 3, question: "Qui a peint la Joconde ?", options: ["Van Gogh", "Picasso", "Da Vinci", "Michel-Ange"], correct: 2 },
  { id: 4, question: "Quel est l'élément chimique 'O' ?", options: ["Or", "Osmium", "Oxygène", "Oganesson"], correct: 2 },
  { id: 5, question: "En quelle année a eu lieu la chute du mur de Berlin ?", options: ["1987", "1989", "1991", "1993"], correct: 1 },
];

const JOKERS = [
  { id: '5050', label: '50:50', icon: <Zap size={16} /> },
  { id: 'call', label: 'Appel', icon: <Volume2 size={16} /> },
  { id: 'public', label: 'Public', icon: <Monitor size={16} /> },
];

const PRESETS = {
  "CE1A": [
    "Clémence", "Hector", "Nathanaël", "Raphaël", "Louis", "Estrella", 
    "Oumouldanes", "Abderrahman", "Abigaël", "Jules", "Solveig", "Mahé", 
    "Nolan", "Constance", "Léo", "Sarah", "Lukeni", "Daphné", "Léonce", 
    "Alba", "Célestine", "Dounia", "Emilia", "Charlie", "Emma", "Théophile"
  ]
};

export default function GVGDC() {
  const navigate = useNavigate();
  // --- ÉTATS DU JEU ---
  const [phase, setPhase] = useState('SETUP'); // SETUP, PLAYING, AWAITING_ADMIN, FINISHED
  const [step, setStep] = useState('QUESTION'); // QUESTION, SUSPENSE, PRE_REVEAL, REVEAL, AWAITING_ADMIN
  
  // --- DONNÉES DE SESSION ---
  const [teams, setTeams] = useState([
    { id: 't1', name: "Équipe 1", players: [], score: 0, jokers: [...JOKERS] },
    { id: 't2', name: "Équipe 2", players: [], score: 0, jokers: [...JOKERS] }
  ]);
  const [unassignedPlayers, setUnassignedPlayers] = useState([]);
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  
  // Gestion du tour par tour
  const [turnQueue, setTurnQueue] = useState([]); // File d'attente des tours { teamIndex, playerIndex }
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [buzzerTeamIndex, setBuzzerTeamIndex] = useState(null); // L'équipe qui a buzzé
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  
  // --- PROGRESSION ---
  const [level, setLevel] = useState(0);
  const [maxLevel, setMaxLevel] = useState(10);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hiddenOptions, setHiddenOptions] = useState([]); // Pour le 50/50
  const [oralResult, setOralResult] = useState(null); // 'correct' | 'incorrect' | null
  const [dbQuestions, setDbQuestions] = useState([]);
  const [activeJoker, setActiveJoker] = useState(null);
  const [showBuzzerWarning, setShowBuzzerWarning] = useState(false);

  // --- SETUP ---
  const [newPlayerName, setNewPlayerName] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- REFS & EFFETS ---
  const presenterRef = useRef(null);
  const audioRef = useRef(null);
  const winAudioRef = useRef(null);
  const loseAudioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(suspensSound);
    winAudioRef.current = new Audio(winSound);
    loseAudioRef.current = new Audio(loseSound);
    return () => {
        if(audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };
  }, []);

  // Animation du présentateur
  useEffect(() => {
    const interval = setInterval(() => {
      if (presenterRef.current) {
        presenterRef.current.style.transform = `translateY(${Math.sin(Date.now() / 200) * 10}px)`;
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Gestion du plein écran
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.log(e));
    } else {
      document.exitFullscreen();
    }
  };

  // Chargement des questions depuis Firebase
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "qvgdc_questions"));
        const loadedQuestions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (loadedQuestions.length > 0) {
          setDbQuestions(loadedQuestions);
        }
      } catch (error) {
        console.error("Erreur chargement questions:", error);
      }
    };
    fetchQuestions();
  }, []);

  // Sauvegarde automatique de la partie (Firebase)
  useEffect(() => {
    const saveGame = async () => {
      try {
        await setDoc(doc(db, "qvgdc_sessions", "current"), {
          teams, phase, level, currentTeamIndex, currentPlayerIndex, updatedAt: new Date()
        }, { merge: true });
      } catch (e) { console.error("Erreur sauvegarde partie:", e); }
    };
    if (teams.length > 0) saveGame();
  }, [teams, phase, level, currentTeamIndex, currentPlayerIndex]);

  // --- SAUVEGARDE LOCALE (REFRESH) ---
  useEffect(() => {
    const savedState = localStorage.getItem('gvgdc_session');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.phase) setPhase(parsed.phase);
        if (parsed.step) setStep(parsed.step);
        if (parsed.teams) setTeams(parsed.teams);
        if (parsed.unassignedPlayers) setUnassignedPlayers(parsed.unassignedPlayers);
        if (parsed.currentTeamIndex !== undefined) setCurrentTeamIndex(parsed.currentTeamIndex);
        if (parsed.currentPlayerIndex !== undefined) setCurrentPlayerIndex(parsed.currentPlayerIndex);
        if (parsed.level !== undefined) setLevel(parsed.level);
        if (parsed.maxLevel !== undefined) setMaxLevel(parsed.maxLevel);
        if (parsed.currentQuestion) setCurrentQuestion(parsed.currentQuestion);
        if (parsed.selectedOption !== undefined) setSelectedOption(parsed.selectedOption);
        if (parsed.hiddenOptions) setHiddenOptions(parsed.hiddenOptions);
        if (parsed.turnQueue) setTurnQueue(parsed.turnQueue);
        if (parsed.currentTurnIndex !== undefined) setCurrentTurnIndex(parsed.currentTurnIndex);
        if (parsed.showBuzzerWarning) setShowBuzzerWarning(parsed.showBuzzerWarning);
        if (parsed.activeJoker) setActiveJoker(parsed.activeJoker);
      } catch (e) {
        console.error("Erreur restauration session:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const stateToSave = {
      phase, step, teams, unassignedPlayers, currentTeamIndex, currentPlayerIndex,
      level, maxLevel, currentQuestion, selectedOption, hiddenOptions, oralResult, buzzerTeamIndex,
      turnQueue, currentTurnIndex, activeJoker, showBuzzerWarning
    };
    localStorage.setItem('gvgdc_session', JSON.stringify(stateToSave));
  }, [phase, step, teams, unassignedPlayers, currentTeamIndex, currentPlayerIndex, level, maxLevel, currentQuestion, selectedOption, hiddenOptions, isLoaded, turnQueue, currentTurnIndex, oralResult, buzzerTeamIndex, activeJoker, showBuzzerWarning]);

  // --- LOGIQUE SETUP ---
  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    setUnassignedPlayers([...unassignedPlayers, newPlayerName.trim()]);
    setNewPlayerName("");
  };

  const loadPreset = (presetKey) => {
    const players = PRESETS[presetKey];
    if (players) {
        const currentPlayers = new Set([...unassignedPlayers, ...teams.flatMap(t => t.players)]);
        const newPlayers = players.filter(p => !currentPlayers.has(p));
        if (newPlayers.length > 0) {
            setUnassignedPlayers(prev => [...prev, ...newPlayers]);
        }
    }
  };

  const addTeam = () => {
    const id = Date.now().toString();
    setTeams([...teams, { id, name: `Équipe ${teams.length + 1}`, players: [], score: 0, jokers: [...JOKERS] }]);
  };

  const removeTeam = (id) => {
    const team = teams.find(t => t.id === id);
    if (team) {
        setUnassignedPlayers([...unassignedPlayers, ...team.players]);
        setTeams(teams.filter(t => t.id !== id));
    }
  };

  const updateTeamName = (id, name) => {
    setTeams(teams.map(t => t.id === id ? { ...t, name } : t));
  };

  // --- DRAG & DROP ---
  const onDragStart = (e, player, sourceId) => {
    setDraggedPlayer({ player, sourceId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedPlayer) return;
    const { player, sourceId } = draggedPlayer;
    if (sourceId === targetId) return;

    // Retrait de la source
    if (sourceId === 'pool') {
        setUnassignedPlayers(prev => prev.filter(p => p !== player));
    } else {
        setTeams(prev => prev.map(t => t.id === sourceId ? { ...t, players: t.players.filter(p => p !== player) } : t));
    }

    // Ajout à la cible
    if (targetId === 'pool') {
        setUnassignedPlayers(prev => [...prev, player]);
    } else {
        setTeams(prev => prev.map(t => t.id === targetId ? { ...t, players: [...t.players, player] } : t));
    }
    setDraggedPlayer(null);
  };

  const resetGame = () => {
    if(window.confirm("Voulez-vous vraiment réinitialiser toute la partie ?")) {
        localStorage.removeItem('gvgdc_session');
        window.location.reload();
    }
  };

  const endGame = () => {
    if(window.confirm("Terminer la partie maintenant ?")) {
        if(audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setPhase('FINISHED');
    }
  };

  const startGame = () => {
    // Génération de la file d'attente (Round Robin)
    // On alterne entre les équipes : J1 Eq1, J1 Eq2, J2 Eq1, J2 Eq2...
    const queue = [];
    const maxPlayers = Math.max(...teams.map(t => t.players.length));
    
    for (let i = 0; i < maxPlayers; i++) {
        teams.forEach((team, tIndex) => {
            if (team.players[i]) {
                queue.push({ teamIndex: tIndex, playerIndex: i });
            }
        });
    }
    
    // Si plus de questions que de joueurs, on ajoute des tours "Buzzer"
    const totalQuestions = dbQuestions.length > 0 ? dbQuestions.length : MOCK_QUESTIONS.length;
    const extraTurns = Math.max(0, totalQuestions - queue.length);
    for(let i=0; i<extraTurns; i++) {
        queue.push({ type: 'buzzer' });
    }

    if (queue.length === 0) {
        alert("Ajoutez des joueurs dans les équipes avant de lancer !");
        return;
    }

    setTurnQueue(queue);
    setCurrentTurnIndex(0);
    
    if (queue[0].type === 'buzzer') {
        setBuzzerTeamIndex(null);
    } else {
        setCurrentTeamIndex(queue[0].teamIndex);
        setCurrentPlayerIndex(queue[0].playerIndex);
    }

    setMaxLevel(queue.length); // Palier max = nombre total de tours
    loadRandomQuestion();
    setPhase('PLAYING');
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(e => console.log(e));
    }
  };

  // --- LOGIQUE JEU ---
  const loadRandomQuestion = () => {
    const source = dbQuestions.length > 0 ? dbQuestions : MOCK_QUESTIONS;
    const randomIndex = Math.floor(Math.random() * source.length);
    setCurrentQuestion(source[randomIndex]);
    setBuzzerTeamIndex(null);
    setOralResult(null);
    setStep('QUESTION');
    setSelectedOption(null);
    setHiddenOptions([]);
  };

  const handleOptionClick = (index) => {
    if (step !== 'QUESTION') return;
    setSelectedOption(index);
  };

  const launchSuspense = () => {
    if (turnQueue[currentTurnIndex]?.type === 'buzzer' && buzzerTeamIndex === null) return alert("Sélectionnez d'abord l'équipe qui a buzzé !");
    if (currentQuestion.type !== 'oral' && selectedOption === null) return;
    setStep('SUSPENSE');
    if(audioRef.current) {
        audioRef.current.loop = true;
        audioRef.current.play().catch(e => console.log("Audio play error:", e));
    }
  };

  const revealAnswer = () => {
    if (currentQuestion.type === 'oral') {
        setStep('AWAITING_ADMIN');
        return;
    }
    setStep('PRE_REVEAL');
    // Clignotement bleu pendant 2.5 secondes
    setTimeout(() => {
        if(audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setStep('REVEAL');
        const isCorrect = selectedOption === currentQuestion.correct;
        
        if (isCorrect) {
          if (winAudioRef.current) {
              winAudioRef.current.currentTime = 0;
              winAudioRef.current.play().catch(e => console.log(e));
          }
          setLevel(prev => Math.min(prev + 1, maxLevel));
          // Update score équipe
          const newTeams = [...teams];
          const targetTeamIndex = buzzerTeamIndex !== null ? buzzerTeamIndex : currentTeamIndex;
          newTeams[targetTeamIndex].score += 1;
          setTeams(newTeams);
        } else {
          if (loseAudioRef.current) {
              loseAudioRef.current.currentTime = 0;
              loseAudioRef.current.play().catch(e => console.log(e));
          }
          setLevel(prev => Math.max(prev - 1, 0));
        }
    }, 2500);
  };

  const handleAdminDecision = (isCorrect) => {
    if(audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    setOralResult(isCorrect ? 'correct' : 'incorrect');
    setStep('REVEAL');
    
    if (isCorrect) {
      if (winAudioRef.current) {
          winAudioRef.current.currentTime = 0;
          winAudioRef.current.play().catch(e => console.log(e));
      }
      setLevel(prev => Math.min(prev + 1, maxLevel));
      // Update score équipe
      const newTeams = [...teams];
      const targetTeamIndex = buzzerTeamIndex !== null ? buzzerTeamIndex : currentTeamIndex;
      newTeams[targetTeamIndex].score += 1;
      setTeams(newTeams);
    } else {
      if (loseAudioRef.current) {
          loseAudioRef.current.currentTime = 0;
          loseAudioRef.current.play().catch(e => console.log(e));
      }
      setLevel(prev => Math.max(prev - 1, 0));
    }
  };

  const advanceTurn = () => {
    const nextIndex = currentTurnIndex + 1;
    
    // Si on a fait passer tout le monde, fin du jeu
    if (nextIndex >= turnQueue.length) {
        setPhase('FINISHED');
        return;
    }

    setCurrentTurnIndex(nextIndex);
    const nextTurnData = turnQueue[nextIndex];
    
    if (nextTurnData.type === 'buzzer') {
        setBuzzerTeamIndex(null);
    } else {
        setCurrentTeamIndex(nextTurnData.teamIndex);
        setCurrentPlayerIndex(nextTurnData.playerIndex);
    }
    
    loadRandomQuestion();
  };

  const handleNextTurn = () => {
    const nextIndex = currentTurnIndex + 1;
    if (nextIndex >= turnQueue.length) {
        setPhase('FINISHED');
        return;
    }

    const currentTurn = turnQueue[currentTurnIndex];
    const nextTurnData = turnQueue[nextIndex];

    // Check for transition to buzzer mode
    if (nextTurnData.type === 'buzzer' && currentTurn?.type !== 'buzzer') {
        setShowBuzzerWarning(true);
    } else {
        advanceTurn();
    }
  };

  const useJoker = (jokerId) => {
    const currentTeam = teams[currentTeamIndex];
    if (!currentTeam.jokers.find(j => j.id === jokerId)) return; // Déjà utilisé

    // Logique Joker
    if (jokerId === '5050') {
      const correct = currentQuestion.correct;
      const wrongOptions = currentQuestion.options
        .map((_, idx) => idx)
        .filter(idx => idx !== correct);
      // Enlever 2 mauvaises réponses au hasard
      const toHide = wrongOptions.sort(() => 0.5 - Math.random()).slice(0, 2);
      setHiddenOptions(toHide);
    } else if (jokerId === 'call' || jokerId === 'public') {
        setActiveJoker(jokerId);
    }

    // Marquer comme utilisé
    const newTeams = [...teams];
    newTeams[currentTeamIndex].jokers = newTeams[currentTeamIndex].jokers.filter(j => j.id !== jokerId);
    setTeams(newTeams);
  };

  // --- RENDER ---
  return (
    <div className={`min-h-screen bg-slate-900 text-white font-mono p-4 flex flex-col overflow-hidden selection:bg-green-400 selection:text-black ${isFullscreen ? '' : 'pt-28'}`}>
      <style>{`
        @keyframes flash-fast {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.02); }
        }
        .animate-flash-fast {
          animation: flash-fast 0.8s infinite;
        }
        @keyframes flash-blue {
            0%, 100% { background-color: rgb(30 58 138); border-color: rgb(59 130 246); color: white; }
            50% { background-color: rgb(23 37 84); border-color: rgb(29 78 216); color: #bfdbfe; }
        }
        .animate-flash-blue {
            animation: flash-blue 0.5s infinite;
        }
      `}</style>
      
      {/* HEADER / PRESENTER AREA */}
      <div className="border-b-4 border-white pb-4 mb-6 flex justify-between items-end relative">
        <div>
          {phase === 'SETUP' && (
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2 text-sm font-bold"><ArrowLeft size={16}/> RETOUR ACCUEIL</button>
          )}
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500" style={{textShadow: '2px 2px 0px rgba(255,255,255,0.2)'}}>
                Qui veut gagner des crayons ?
            </h1>
            <button onClick={toggleFullscreen} className="text-slate-500 hover:text-white transition-colors p-1" title="Plein écran">
                {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
          </div>
          <div className="text-xs text-slate-400 mt-1">SYSTEME DE JEU V.1.0.4</div>
        </div>
        
        {/* PRESENTER */}
        <div className="absolute left-[55%] -translate-x-1/2 bottom-4 flex flex-col items-center z-50">
          {!isFullscreen && (
            <div className="absolute -top-24 w-40 bg-yellow-300 text-slate-900 p-3 text-xs font-bold text-center border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[10px] after:border-transparent after:border-t-yellow-300 mb-2 animate-bounce">
                Tu devrais mettre en plein écran !
            </div>
          )}
          <div 
            ref={presenterRef}
            className="w-16 h-16 bg-white border-4 border-slate-900 shadow-[4px_4px_0px_0px_#22c55e] flex items-center justify-center text-slate-900 font-bold text-2xl mb-2"
          >
            ^_^
          </div>
        </div>

      </div>

      {/* VERTICAL LEVEL BAR */}
      {phase !== 'SETUP' && (
        <div className="absolute right-4 top-1/2 flex flex-col-reverse gap-1 h-[40vh] w-10 z-40 pointer-events-none">
            {Array.from({ length: maxLevel }).map((_, i) => {
                const stepLevel = i + 1;
                const isActive = stepLevel <= level;
                const isCurrent = stepLevel === level;
                
                return (
                    <div 
                        key={i} 
                        className={`flex-1 w-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                            isActive 
                                ? (isCurrent ? 'bg-orange-500 border-orange-300 text-white scale-110 z-10 shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'bg-green-600 border-green-400 text-green-100 opacity-80') 
                                : 'bg-slate-800 border-slate-700 text-slate-600'
                        }`}
                    >
                        {stepLevel}
                    </div>
                );
            })}
        </div>
      )}

      {phase === 'SETUP' && (
        <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            
            {/* GAUCHE : POOL JOUEURS */}
            <div className="bg-slate-800 border-4 border-white p-6 flex flex-col gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
               <div className="flex justify-between items-center border-b-2 border-dashed border-slate-600 pb-2">
                 <h2 className="text-xl font-bold flex items-center gap-2">
                   <Monitor size={20}/> 1. INSCRIPTION JOUEURS
                 </h2>
                 <div className="flex gap-2">
                    <button 
                        onClick={() => navigate('/DashboardQVGDC')}
                        className="bg-slate-900 border border-slate-600 text-xs p-1 px-2 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                        QUESTIONS
                    </button>
                    <select 
                        className="bg-slate-900 border border-slate-600 text-xs p-1 outline-none focus:border-green-400 text-slate-300"
                        onChange={(e) => {
                            if(e.target.value) {
                                loadPreset(e.target.value);
                                e.target.value = "";
                            }
                        }}
                        defaultValue=""
                    >
                        <option value="" disabled>Pré-config...</option>
                        {Object.keys(PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                 </div>
               </div>
               <div className="flex gap-2">
                  <input 
                    value={newPlayerName}
                    onChange={e => setNewPlayerName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addPlayer()}
                    className="flex-1 bg-slate-900 border-2 border-slate-600 p-3 outline-none focus:border-green-400 transition-colors text-lg"
                    placeholder="Prénom..."
                  />
                  <button onClick={addPlayer} className="bg-slate-700 border-2 border-slate-500 px-4 hover:bg-slate-600 active:translate-y-1 font-bold">
                    AJOUTER
                  </button>
               </div>
               <div 
                 className="flex-1 bg-slate-900 border-2 border-slate-700 p-4 overflow-y-auto min-h-[300px] content-start flex flex-wrap gap-2"
                 onDragOver={onDragOver}
                 onDrop={(e) => onDrop(e, 'pool')}
               >
                 {unassignedPlayers.length === 0 && <div className="w-full text-center text-slate-600 italic mt-10">Ajoutez des joueurs ici...</div>}
                 {unassignedPlayers.map((p, i) => (
                    <div 
                      key={i} 
                      draggable 
                      onDragStart={(e) => onDragStart(e, p, 'pool')}
                      className="bg-slate-700 text-white px-3 py-2 border border-slate-500 flex items-center gap-2 cursor-grab active:cursor-grabbing hover:bg-slate-600"
                    >
                      <GripVertical size={14} className="text-slate-400"/> {p}
                    </div>
                 ))}
               </div>
            </div>

            {/* DROITE : ÉQUIPES */}
            <div className="bg-slate-800 border-4 border-white p-6 flex flex-col gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
               <div className="flex justify-between items-center border-b-2 border-dashed border-slate-600 pb-2">
                  <h2 className="text-xl font-bold flex items-center gap-2"><Zap size={20}/> 2. ÉQUIPES</h2>
                  <button onClick={addTeam} className="bg-green-600 text-black p-1 hover:bg-green-500 transition-colors" title="Ajouter équipe"><Plus size={20}/></button>
               </div>
               <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {teams.map(team => (
                     <div 
                        key={team.id} 
                        className="bg-slate-900 border-2 border-slate-700 p-3 transition-colors hover:border-slate-500"
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, team.id)}
                     >
                        <div className="flex justify-between items-center mb-3 gap-2">
                            <input 
                                value={team.name} 
                                onChange={(e) => updateTeamName(team.id, e.target.value)}
                                className="bg-transparent border-b border-slate-700 focus:border-green-400 outline-none text-green-400 font-bold w-full"
                            />
                            <button onClick={() => removeTeam(team.id)} className="text-slate-600 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                        <div className="min-h-[60px] bg-black/30 border border-slate-800 p-2 flex flex-wrap gap-2">
                            {team.players.length === 0 && <div className="text-xs text-slate-600 italic w-full text-center py-2">Glissez les joueurs ici</div>}
                            {team.players.map((p, i) => (
                                <div 
                                  key={i} 
                                  draggable
                                  onDragStart={(e) => onDragStart(e, p, team.id)}
                                  className="bg-blue-900/50 text-blue-200 px-2 py-1 text-sm border border-blue-800 flex items-center gap-2 cursor-grab"
                                >
                                  {p}
                                  <button onClick={() => {
                                      setUnassignedPlayers(prev => [...prev, p]);
                                      setTeams(prev => prev.map(t => t.id === team.id ? { ...t, players: t.players.filter(pl => pl !== p) } : t));
                                  }} className="hover:text-red-400"><X size={12}/></button>
                                </div>
                            ))}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
                onClick={resetGame}
                className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg border-4 border-red-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
            >
                <RefreshCw size={20} /> RESET
            </button>
            <button 
                onClick={startGame}
                disabled={teams.every(t => t.players.length === 0)}
                className="flex-1 py-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:border-slate-600 disabled:cursor-not-allowed text-black font-black text-xl border-4 border-green-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all"
            >
                LANCER LE JEU
            </button>
          </div>
        </div>
      )}

      {phase === 'PLAYING' && currentQuestion && (
        <div className="flex-1 flex flex-col gap-6">
          
          {/* INFO BAR */}
          <div className="flex justify-between items-center bg-slate-800 p-2 border-2 border-slate-700">
            <div className="flex items-center gap-4">
              {turnQueue[currentTurnIndex]?.type === 'buzzer' ? (
                  <div className="flex items-center gap-4 animate-pulse">
                      <span className="bg-red-600 text-white px-3 py-1 font-bold border-2 border-red-400 uppercase">MODE BUZZER</span>
                      <span className="text-sm text-slate-300">Qui sera le plus rapide ?</span>
                  </div>
              ) : (
                  <>
                    <div className="bg-blue-600 text-white px-3 py-1 font-bold border-2 border-blue-400">
                        {teams[currentTeamIndex].name}
                    </div>
                    <div className="text-sm">
                        Joueur : <span className="text-yellow-400 font-bold text-lg">{teams[currentTeamIndex].players[currentPlayerIndex]}</span>
                    </div>
                  </>
              )}
            </div>
            
            {/* JOKERS */}
            <div className="flex gap-2">
              {JOKERS.map(joker => {
                const isAvailable = teams[currentTeamIndex].jokers.find(j => j.id === joker.id);
                return (
                  <button 
                    key={joker.id}
                    onClick={() => isAvailable && useJoker(joker.id)}
                    disabled={!isAvailable || step !== 'QUESTION'}
                    className={`px-3 py-1 text-xs font-bold border-2 flex items-center gap-2 transition-all
                      ${isAvailable 
                        ? 'bg-purple-900 border-purple-500 text-purple-200 hover:bg-purple-800 cursor-pointer' 
                        : 'bg-slate-900 border-slate-800 text-slate-700 line-through cursor-not-allowed opacity-50'
                      }`}
                  >
                    {joker.icon} {joker.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* QUESTION BOX */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-4xl">
              <div className="bg-slate-800 border-4 border-white p-8 mb-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 px-4 text-slate-400 text-sm border border-slate-700">QUESTION {currentTurnIndex + 1}</div>
                <h2 className="text-2xl md:text-4xl font-bold leading-tight">{currentQuestion.question}</h2>

                {turnQueue[currentTurnIndex]?.type === 'buzzer' && step === 'QUESTION' && (
                    <div className="mt-6 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                        <p className="text-sm text-slate-400 mb-3 uppercase font-bold">Sélectionnez l'équipe qui répond :</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {teams.map((team, idx) => (
                                <button key={team.id} onClick={() => setBuzzerTeamIndex(idx)} className={`px-4 py-2 font-bold border-2 transition-all ${buzzerTeamIndex === idx ? 'bg-green-600 border-green-400 text-white scale-110 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-white hover:text-white'}`}>
                                    {team.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 'AWAITING_ADMIN' && (
                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <button onClick={() => handleAdminDecision(true)} className="py-4 bg-green-600 hover:bg-green-500 text-black font-black text-xl border-4 border-green-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2">
                            <CheckCircle /> BONNE RÉPONSE
                        </button>
                        <button onClick={() => handleAdminDecision(false)} className="py-4 bg-red-600 hover:bg-red-500 text-white font-black text-xl border-4 border-red-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2">
                            <XCircle /> MAUVAISE RÉPONSE
                        </button>
                    </div>
                )}

                {step === 'REVEAL' && currentQuestion.type === 'oral' && (
                    <div className={`mt-6 text-4xl font-black animate-in zoom-in ${oralResult === 'correct' ? 'text-green-400' : 'text-red-500'}`}>
                        {oralResult === 'correct' ? 'CORRECT !' : 'INCORRECT !'}
                    </div>
                )}
              </div>

              {/* OPTIONS GRID */}
              {currentQuestion.type !== 'oral' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((opt, idx) => {
                    if (hiddenOptions.includes(idx)) {
                      return <div key={idx} className="opacity-0 pointer-events-none"></div>;
                    }

                    let stateClass = "bg-slate-900 border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-white"; // Default
                    
                    if (step === 'PRE_REVEAL') {
                      stateClass = "animate-flash-blue border-4";
                    } else if (selectedOption === idx) {
                      stateClass = "bg-yellow-900 border-yellow-500 text-yellow-100 shadow-[0_0_15px_rgba(234,179,8,0.3)]"; // Selected
                      if (step === 'SUSPENSE') stateClass += " animate-flash-fast";
                    }

                    if (step === 'REVEAL') {
                      if (idx === currentQuestion.correct) {
                        stateClass = "bg-green-900 border-green-500 text-green-100 shadow-[0_0_20px_rgba(34,197,94,0.5)]"; // Correct
                      } else if (selectedOption === idx) {
                        stateClass = "bg-red-900 border-red-500 text-red-100 opacity-50"; // Wrong
                      } else {
                        stateClass = "opacity-30 grayscale"; // Others
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionClick(idx)}
                        disabled={step !== 'QUESTION'}
                        className={`p-6 border-4 text-xl font-bold text-left transition-all relative group ${stateClass}`}
                      >
                        <span className="absolute top-2 left-3 text-xs opacity-50">OPTION {['A','B','C','D'][idx]}</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                step === 'QUESTION' && <div className="text-center text-slate-400 italic text-lg">Réponse orale attendue...</div>
              )}
            </div>
          </div>

          {/* GAME MASTER CONTROLS */}
          <div className="border-t-4 border-slate-800 pt-4 mt-4 grid grid-cols-4 gap-4">
            <button 
              onClick={step === 'QUESTION' ? launchSuspense : revealAnswer}
              disabled={(step === 'QUESTION' && currentQuestion.type !== 'oral' && selectedOption === null) || (step === 'QUESTION' && turnQueue[currentTurnIndex]?.type === 'buzzer' && buzzerTeamIndex === null) || (step !== 'QUESTION' && step !== 'SUSPENSE')}
              className={`text-white py-3 font-bold border-b-4 active:border-b-0 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                step === 'SUSPENSE' 
                  ? "bg-blue-700 hover:bg-blue-600 border-blue-900" 
                  : "bg-orange-700 hover:bg-orange-600 border-orange-900"
              }`}
            >
              {step === 'SUSPENSE' ? "VALIDER / RÉVÉLER" : "MUSIQUE / SUSPENSE"}
            </button>

            <button 
              onClick={handleNextTurn}
              disabled={step !== 'REVEAL'}
              className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 font-bold border-b-4 border-slate-900 active:border-b-0 active:translate-y-1"
            >
              QUESTION SUIVANTE
            </button>

            <button 
              onClick={endGame}
              className="bg-red-700 hover:bg-red-600 text-white py-3 font-bold border-b-4 border-red-900 active:border-b-0 active:translate-y-1"
            >
              FINIR PARTIE
            </button>

            <div className="bg-black p-2 font-mono text-xs text-green-500 border border-green-900 overflow-hidden">
              {`> STATUS: ${step}\n> MODE: ${turnQueue[currentTurnIndex]?.type === 'buzzer' ? 'BUZZER' : 'NORMAL'}\n> TEAM: ${buzzerTeamIndex !== null ? teams[buzzerTeamIndex].name : teams[currentTeamIndex].name}`}
            </div>
          </div>

        </div>
      )}

      {phase === 'FINISHED' && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in duration-500">
            <h2 className="text-6xl font-black text-yellow-400 mb-10 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">RÉSULTATS</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                {teams.sort((a,b) => b.score - a.score).map((team, index) => (
                    <div key={team.id} className="bg-slate-800 border-4 border-white p-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
                        {index === 0 && <div className="absolute -top-6 -right-6 text-yellow-400 animate-bounce"><Trophy size={48} /></div>}
                        <h3 className="text-2xl font-bold mb-2">{team.name}</h3>
                        <div className="text-4xl font-black text-green-400">{team.score} PTS</div>
                        <div className="mt-4 text-sm text-slate-400">
                            Joueurs : {team.players.join(', ')}
                        </div>
                    </div>
                ))}
            </div>

            <button 
                onClick={resetGame}
                className="mt-12 px-8 py-4 bg-white text-slate-900 font-black text-xl hover:bg-slate-200 transition-colors border-4 border-slate-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none"
            >
                NOUVELLE PARTIE
            </button>
        </div>
      )}

      {/* BUZZER WARNING MODAL */}
      {showBuzzerWarning && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-800 border-4 border-white p-8 max-w-lg w-full text-center shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                <h2 className="text-3xl font-black text-red-500 mb-6 uppercase flex items-center justify-center gap-4">
                    <Zap size={40}/>
                    ATTENTION : MODE BUZZER
                </h2>
                <div className="text-xl text-white mb-8 font-bold">
                    Les prochaines questions sont pour l'équipe la plus rapide. Soyez prêts !
                </div>
                <button 
                    onClick={() => {
                        setShowBuzzerWarning(false);
                        advanceTurn();
                    }}
                    className="px-8 py-4 bg-white text-slate-900 font-black text-xl hover:bg-slate-200 transition-colors border-4 border-slate-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none"
                >
                    COMMENCER !
                </button>
            </div>
        </div>
      )}

      {/* JOKER MODAL */}
      {activeJoker && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-800 border-4 border-white p-8 max-w-lg w-full text-center shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                <h2 className="text-3xl font-black text-yellow-400 mb-6 uppercase flex items-center justify-center gap-4">
                    {activeJoker === 'call' ? <Volume2 size={40}/> : <Monitor size={40}/>}
                    {activeJoker === 'call' ? "Appel à un ami" : "Vote du Public"}
                </h2>
                <div className="text-2xl text-white mb-8 animate-pulse font-bold">
                    Joker en cours d'utilisation ...
                </div>
                <button 
                    onClick={() => setActiveJoker(null)}
                    className="px-8 py-4 bg-white text-slate-900 font-black text-xl hover:bg-slate-200 transition-colors border-4 border-slate-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none"
                >
                    REPRENDRE LE JEU
                </button>
            </div>
        </div>
      )}
    </div>
  );
}
