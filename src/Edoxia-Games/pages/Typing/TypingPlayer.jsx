import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, setDoc, onSnapshot, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { wordLists } from './TypingWords';
import { ArrowLeft, Clock, Medal, Trophy, Keyboard } from 'lucide-react';
import { motion } from 'framer-motion';

// Helper to shuffle array
function shuffleArray(array) {
  let curId = array.length;
  // There remain elements to shuffle
  while (0 !== curId) {
    // Pick a remaining element
    let randId = Math.floor(Math.random() * curId);
    curId -= 1;
    // Swap it with the current element.
    let tmp = array[curId];
    array[curId] = array[randId];
    array[randId] = tmp;
  }
  return array;
}

export default function TypingPlayer() {
  const { lobbyId: joinCode } = useParams(); // Using lobbyId param as joinCode based on route /games/typing/play/:lobbyId
  const [searchParams] = useSearchParams();
  const firstName = searchParams.get('f') || 'Joueur';
  const lastName = searchParams.get('l') || '';
  const navigate = useNavigate();

  const [lobbyId, setLobbyId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [lobby, setLobby] = useState(null);
  const [players, setPlayers] = useState([]);
  
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [score, setScore] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const inputRef = useRef(null);
  const hasJoined = useRef(false);

  // 1. Initialize find lobby and join
  useEffect(() => {
    const init = async () => {
      if (hasJoined.current) return;
      hasJoined.current = true;

      // Find lobby by code
      const qSelected = query(collection(db, 'typing_lobbies'), where('code', '==', joinCode));
      const snap = await getDocs(qSelected);
      if (snap.empty) {
        alert("Code de partie invalide ou partie terminée.");
        navigate('/games/typing');
        return;
      }
      
      const foundLobbyId = snap.docs[0].id;
      setLobbyId(foundLobbyId);

      // Create player doc
      const newPlayerRef = doc(collection(db, 'typing_lobbies', foundLobbyId, 'players'));
      await setDoc(newPlayerRef, {
        firstName,
        lastName,
        score: 0
      });
      setPlayerId(newPlayerRef.id);
    };

    init();
  }, [joinCode, firstName, lastName, navigate]);

  // 2. Listen to Lobby & Players
  useEffect(() => {
    if (!lobbyId) return;

    const unsubLobby = onSnapshot(doc(db, 'typing_lobbies', lobbyId), (docSnap) => {
      if (docSnap.exists()) {
        setLobby(docSnap.data());
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

  // Auto focus logic
  useEffect(() => {
    if (lobby?.status === 'playing' && isGameStarted && inputRef.current) {
      inputRef.current.focus();
    }
  }, [lobby?.status, isGameStarted]);

  // Reactive Countdown handling
  useEffect(() => {
    if (lobby?.status === 'playing' && lobby.startTime) {
      const updateStart = () => {
        if (Date.now() >= lobby.startTime) {
          setIsGameStarted(true);
          return true;
        }
        return false;
      };

      if (updateStart()) return;

      const interval = setInterval(() => {
        if (updateStart()) clearInterval(interval);
      }, 100); // Check frequently for smooth transition
      return () => clearInterval(interval);
    } else {
      setIsGameStarted(false);
    }
  }, [lobby?.status, lobby?.startTime]);

  // Handle typing
  const handleInputChange = (e) => {
    const val = e.target.value;
    
    // Allow space at the end to validate, or exact match
    const cleanInput = val.trim().toLowerCase();
    const targetWord = words[currentWordIndex]?.toLowerCase() || '';
    
    setInputValue(val);

    // Some players might type space to validate
    if ((val.endsWith(' ') || val.endsWith(' ')) && cleanInput === targetWord) {
      handleValidWord();
    } else if (cleanInput === targetWord && val.length > targetWord.length) {
      // Typed punctuation or just past it?
       handleValidWord();
    }
  };

  const handleValidWord = async () => {
    setInputValue('');
    setCurrentWordIndex(prev => prev + 1);
    const newScore = score + 1;
    setScore(newScore);

    // Sync to DB
    if (lobbyId && playerId) {
      await updateDoc(doc(db, 'typing_lobbies', lobbyId, 'players', playerId), {
        score: newScore
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const cleanInput = inputValue.trim().toLowerCase();
      const targetWord = words[currentWordIndex]?.toLowerCase() || '';
      if (cleanInput === targetWord) {
        handleValidWord();
      }
    }
  };

  // 3. Reset local state and load words if lobby status or game type changes
  useEffect(() => {
    if (lobby?.status === 'waiting' || lobby?.gameType) {
      setScore(0);
      setCurrentWordIndex(0);
      setInputValue('');
      
      const type = lobby?.gameType || '2min200words';
      const baseWords = wordLists[type] || wordLists['2min200words'];
      // Shuffle and double to ensure plenty of words
      setWords(shuffleArray([...baseWords, ...baseWords]));
    }
  }, [lobby?.status, lobby?.gameType]);


  if (!lobby) return <div className="min-h-screen flex items-center justify-center bg-brand-bg text-white font-bold">Connexion à la partie...</div>;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col font-sans">
      <header className="p-4 flex justify-between items-center shadow-soft bg-white/40 border-b border-white/50 backdrop-blur-md">
        <div className="font-black flex items-center gap-2">
          <Keyboard className="text-brand-coral" size={20} />
          {firstName} {lastName}
        </div>
        <div className="text-sm font-bold bg-white/60 px-4 py-1.5 rounded-full border border-white flex items-center gap-2">
          <span className="opacity-40 font-black uppercase text-[10px] border-r border-brand-text/10 pr-2">Mode</span>
          {lobby?.gameType === '2minHARDchara' ? 'Hard' : 'Standard'}
        </div>
        <div className="text-sm font-bold bg-white/60 px-4 py-1.5 rounded-full border border-white">
          Code: {joinCode}
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 flex flex-col max-w-6xl mx-auto w-full">
        {lobby.status === 'waiting' && (
           <div className="flex-1 flex flex-col items-center justify-center text-center">
             <div className="w-24 h-24 bg-white/30 rounded-full flex items-center justify-center mb-8 border-[4px] border-brand-teal animate-pulse">
                <Clock className="text-brand-teal" size={40} />
             </div>
             <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Prépare-toi !</h2>
             <p className="text-xl text-brand-text/60 font-medium max-w-lg">
               En attente que le professeur lance la partie. Échauffe tes doigts, le premier jeu consistera à taper le plus de mots possibles en 2 minutes.
             </p>
           </div>
        )}

        {lobby.status === 'playing' && (
          <div className="flex-1 flex flex-col md:flex-row gap-8">
            {/* Game Area */}
            <div className="flex-1 bg-white/60 border border-white rounded-[40px] p-8 shadow-soft flex flex-col items-center justify-center text-center relative overflow-hidden backdrop-blur-md">
               <div className="absolute top-6 right-6 font-black text-2xl text-brand-coral bg-white/80 px-4 py-2 rounded-2xl border flex items-center gap-2">
                 <Clock size={20} /> <Countdown endTime={lobby.endTime} />
               </div>

               <div className="absolute top-6 left-6 font-black text-2xl text-brand-teal bg-white/80 px-4 py-2 rounded-2xl border flex items-center gap-2">
                 <Trophy size={20} /> {score}
               </div>

               {/* Countdown before start */}
               {lobby.startTime && !isGameStarted && (
                 <div className="absolute inset-0 z-10 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                   <div className="text-brand-teal text-8xl font-black animate-ping">
                       <Countdown endTime={lobby.startTime} absolute={true} />
                   </div>
                 </div>
               )}

               <div className="mb-4 text-brand-text/40 font-bold text-xl uppercase tracking-widest">
                 Mot {currentWordIndex + 1}
               </div>

               {/* Word Display */}
               <div className="text-6xl md:text-8xl font-black text-brand-text mb-12 select-none tracking-tight">
                 {words[currentWordIndex]}
               </div>

               <input 
                 ref={inputRef}
                 type="text"
                 value={inputValue}
                 onChange={handleInputChange}
                 onKeyDown={handleKeyDown}
                 disabled={!isGameStarted}
                 autoFocus
                 autoComplete="off"
                 placeholder="Tapez ici..."
                 className={`w-full max-w-sm text-center text-3xl font-bold bg-white border-4 rounded-3xl p-4 outline-none transition-colors shadow-inner ${
                   inputValue && words[currentWordIndex] && !words[currentWordIndex].toLowerCase().startsWith(inputValue.toLowerCase()) 
                   ? 'border-brand-coral/50 text-brand-coral'
                   : 'border-brand-teal/50 text-brand-teal focus:border-brand-teal'
                 }`}
               />

               <div className="mt-8 text-brand-text/30 font-bold">
                 Appuyer sur <kbd className="bg-brand-text/10 px-2 py-1 rounded-md">Espace</kbd> ou <kbd className="bg-brand-text/10 px-2 py-1 rounded-md">Entrée</kbd> pour valider
               </div>
            </div>

            {/* Live Leaderboard Sidebar */}
            <div className="w-full md:w-80 bg-white/40 border border-white/50 rounded-[40px] p-6 shadow-soft flex flex-col h-96 md:h-auto">
               <h3 className="font-black text-xl mb-4 text-brand-text/60 flex items-center gap-2">
                 <Trophy size={20}/> Classement Live
               </h3>
               <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                 {players.map((p, idx) => (
                   <motion.div 
                     layout 
                     key={p.id} 
                     className={`flex justify-between items-center p-3 rounded-2xl transition-all ${
                       p.id === playerId ? 'bg-brand-teal text-white shadow-md' : 'bg-white/60 text-brand-text/80'
                     }`}
                   >
                     <div className="flex items-center gap-3">
                       <span className="font-black text-sm opacity-50">{idx + 1}.</span>
                       <div className="flex flex-col">
                         <span className="font-bold truncate max-w-[120px] leading-tight">{p.firstName}</span>
                         {p.wins > 0 && (
                           <span className="flex items-center gap-0.5 text-[9px] font-black text-yellow-600 uppercase tracking-tighter">
                             <Medal size={8} fill="currentColor" /> {p.wins} {p.wins === 1 ? 'Victoire' : 'Victoires'}
                           </span>
                         )}
                       </div>
                     </div>
                     <span className="font-black">{p.score}</span>
                   </motion.div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {lobby.status === 'finished' && (
          <div className="max-w-4xl w-full mx-auto flex flex-col items-center mb-8">
            <h2 className="text-5xl font-black text-brand-text mb-4 text-center mt-8">Partie Terminée !</h2>
            <p className="text-xl font-bold text-brand-text/50 mb-12">Voici le classement final</p>

            <div className="bg-white/40 border border-white rounded-[40px] p-4 md:p-8 w-full shadow-soft">
              {players.map((p, idx) => {
                let badge = null;
                if (idx === 0) badge = <Medal size={24} className="text-yellow-500 fill-yellow-500" />;
                if (idx === 1) badge = <Medal size={24} className="text-slate-400 fill-slate-400" />;
                if (idx === 2) badge = <Medal size={24} className="text-amber-600 fill-amber-600" />;

                return (
                  <div key={p.id} className={`flex items-center justify-between p-4 mb-3 rounded-2xl border transition-all ${
                    p.id === playerId ? 'bg-brand-teal/10 border-brand-teal shadow-md transform scale-[1.02]' : 'bg-white/60 border-white shadow-sm'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="w-8 flex justify-center font-black text-xl text-brand-text/40">
                        {badge || `${idx + 1}.`}
                      </div>
                      <span className={`font-bold text-lg ${p.id === playerId ? 'text-brand-teal' : 'text-brand-text'}`}>
                        {p.firstName} {p.lastName} {p.id === playerId && "(Moi)"}
                      </span>
                      {p.wins > 0 && (
                        <span className="flex items-center gap-1 text-xs font-black text-yellow-600 bg-yellow-100/50 px-2 py-0.5 rounded-lg border border-yellow-200">
                          <Medal size={12} fill="currentColor" /> {p.wins}
                        </span>
                      )}
                    </div>
                    <span className="font-black text-2xl text-brand-coral">{p.score} <span className="text-sm font-bold text-brand-text/40">mots</span></span>
                  </div>
                )
              })}
            </div>
            
            <button onClick={() => navigate('/games/typing')} className="mt-8 px-8 py-4 bg-white/40 border border-white hover:bg-white transition-all rounded-full font-black text-brand-text/60 hover:text-brand-text shadow-soft">
               Quitter
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper Countdown
function Countdown({ endTime, absolute = false }) {
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

  if (absolute) return <span>{timeLeft}</span>;

  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;
  return <span>{min}:{sec.toString().padStart(2, '0')}</span>;
}
