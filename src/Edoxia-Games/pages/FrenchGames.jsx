import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Volume2, VolumeX, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { collection, addDoc, query, orderBy, limit, getDocs, where, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { ThemeContext } from "../../ThemeContext";

// --- BANQUE DE QUESTIONS MASSIVE (Niveau CE2) ---
const questionsBank = [
  // --- IL (Masculin Singulier) ---
  { gn: "Le petit chat", rest: "dort sur le tapis.", answer: "Il" },
  { gn: "Mon père", rest: "lave la voiture.", answer: "Il" },
  { gn: "L'avion", rest: "traverse les nuages.", answer: "Il" },
  { gn: "Ce garçon", rest: "court très vite.", answer: "Il" },
  { gn: "Le boulanger", rest: "cuit du pain frais.", answer: "Il" },
  { gn: "Mon stylo bleu", rest: "est dans la trousse.", answer: "Il" },
  { gn: "Le soleil", rest: "brille fort aujourd'hui.", answer: "Il" },
  { gn: "Ton frère", rest: "regarde un dessin animé.", answer: "Il" },
  { gn: "Le lion", rest: "est le roi de la savane.", answer: "Il" },
  { gn: "Ce livre", rest: "raconte une belle histoire.", answer: "Il" },
  { gn: "Le train", rest: "entre en gare.", answer: "Il" },
  { gn: "Mon oncle", rest: "habite à Paris.", answer: "Il" },
  { gn: "Le directeur", rest: "parle aux élèves.", answer: "Il" },
  { gn: "L'ordinateur", rest: "est allumé.", answer: "Il" },
  { gn: "Le ballon", rest: "roule dans l'herbe.", answer: "Il" },
  { gn: "Un oiseau", rest: "chante sur la branche.", answer: "Il" },
  { gn: "Le jardinier", rest: "arrose les fleurs.", answer: "Il" },
  { gn: "Ce gâteau", rest: "sent le chocolat.", answer: "Il" },
  { gn: "Le vent", rest: "souffle dans les arbres.", answer: "Il" },
  { gn: "Mon ami Paul", rest: "vient jouer demain.", answer: "Il" },
  { gn: "Le facteur", rest: "apporte le courrier.", answer: "Il" },
  { gn: "Ce château", rest: "est très ancien.", answer: "Il" },
  { gn: "Le cheval", rest: "galope dans le pré.", answer: "Il" },
  { gn: "Mon cartable", rest: "est trop lourd.", answer: "Il" },
  { gn: "Le tableau", rest: "est rempli de craie.", answer: "Il" },
  { gn: "L'éléphant", rest: "a une longue trompe.", answer: "Il" },
  { gn: "Le policier", rest: "arrête la circulation.", answer: "Il" },
  { gn: "Ce manteau", rest: "est bien chaud.", answer: "Il" },
  { gn: "Le ciel", rest: "devient tout gris.", answer: "Il" },
  { gn: "Mon lit", rest: "est très confortable.", answer: "Il" },

  // --- ELLE (Féminin Singulier) ---
  { gn: "La petite fille", rest: "saute à la corde.", answer: "Elle" },
  { gn: "Ma maîtresse", rest: "nous lit un conte.", answer: "Elle" },
  { gn: "Une belle fleur", rest: "pousse dans le pot.", answer: "Elle" },
  { gn: "La voiture rouge", rest: "démarre doucement.", answer: "Elle" },
  { gn: "Ta gomme", rest: "efface très bien.", answer: "Elle" },
  { gn: "La lune", rest: "éclaire la nuit.", answer: "Elle" },
  { gn: "Ma mère", rest: "travaille au bureau.", answer: "Elle" },
  { gn: "Cette table", rest: "est mise pour le dîner.", answer: "Elle" },
  { gn: "La pluie", rest: "tombe depuis ce matin.", answer: "Elle" },
  { gn: "La girafe", rest: "mange des feuilles.", answer: "Elle" },
  { gn: "Une pomme", rest: "est tombée de l'arbre.", answer: "Elle" },
  { gn: "Ma soeur", rest: "fait ses devoirs.", answer: "Elle" },
  { gn: "La musique", rest: "est trop forte.", answer: "Elle" },
  { gn: "Cette maison", rest: "a des volets bleus.", answer: "Elle" },
  { gn: "La boulangère", rest: "vend des croissants.", answer: "Elle" },
  { gn: "La télévision", rest: "est éteinte.", answer: "Elle" },
  { gn: "Une abeille", rest: "vole vers la ruche.", answer: "Elle" },
  { gn: "La mer", rest: "est calme aujourd'hui.", answer: "Elle" },
  { gn: "Ma voisine", rest: "promène son chien.", answer: "Elle" },
  { gn: "La lampe", rest: "éclaire le salon.", answer: "Elle" },
  { gn: "Cette chaise", rest: "est cassée.", answer: "Elle" },
  { gn: "La rivière", rest: "coule sous le pont.", answer: "Elle" },
  { gn: "Une souris", rest: "se cache dans le trou.", answer: "Elle" },
  { gn: "La cantine", rest: "sert des frites.", answer: "Elle" },
  { gn: "Ma tante", rest: "m'a offert un cadeau.", answer: "Elle" },
  { gn: "La fenêtre", rest: "est ouverte.", answer: "Elle" },
  { gn: "Cette règle", rest: "mesure trente centimètres.", answer: "Elle" },
  { gn: "La neige", rest: "recouvre la route.", answer: "Elle" },
  { gn: "Une étoile", rest: "file dans le ciel.", answer: "Elle" },
  { gn: "La porte", rest: "grince un peu.", answer: "Elle" },

  // --- ILS (Masculin Pluriel) ---
  { gn: "Les enfants", rest: "jouent au ballon.", answer: "Ils" },
  { gn: "Mes cousins", rest: "arrivent ce soir.", answer: "Ils" },
  { gn: "Les oiseaux", rest: "s'envolent vers le sud.", answer: "Ils" },
  { gn: "Les tigres", rest: "sont dans la cage.", answer: "Ils" },
  { gn: "Paul et Marc", rest: "sont meilleurs amis.", answer: "Ils" },
  { gn: "Les nuages", rest: "cachent le soleil.", answer: "Ils" },
  { gn: "Mes stylos", rest: "ne marchent plus.", answer: "Ils" },
  { gn: "Les pompiers", rest: "éteignent le feu.", answer: "Ils" },
  { gn: "Des loups", rest: "hurlent dans la forêt.", answer: "Ils" },
  { gn: "Ton père et ton frère", rest: "lavent le garage.", answer: "Ils" },
  { gn: "Les avions", rest: "décollent de la piste.", answer: "Ils" },
  { gn: "Ces gâteaux", rest: "sont délicieux.", answer: "Ils" },
  { gn: "Les élèves", rest: "écoutent la leçon.", answer: "Ils" },
  { gn: "Mon chien et mon chat", rest: "dorment ensemble.", answer: "Ils" },
  { gn: "Les arbres", rest: "perdent leurs feuilles.", answer: "Ils" },
  { gn: "Mes amis", rest: "organisent une fête.", answer: "Ils" },
  { gn: "Les joueurs", rest: "entrent sur le terrain.", answer: "Ils" },
  { gn: "Ces livres", rest: "sont à la bibliothèque.", answer: "Ils" },
  { gn: "Les poissons", rest: "nagent dans l'eau.", answer: "Ils" },
  { gn: "Lucas et son papa", rest: "vont à la pêche.", answer: "Ils" },
  { gn: "Les magasins", rest: "ferment à 19h.", answer: "Ils" },
  { gn: "Tes cheveux", rest: "sont bien coiffés.", answer: "Ils" },
  { gn: "Les camions", rest: "transportent des marchandises.", answer: "Ils" },
  { gn: "Les devoirs", rest: "sont difficiles.", answer: "Ils" },
  { gn: "Ces bonbons", rest: "sont trop sucrés.", answer: "Ils" },
  { gn: "Le garçon et la fille", rest: "rentrent de l'école.", answer: "Ils" },
  { gn: "Les médecins", rest: "soignent les malades.", answer: "Ils" },
  { gn: "Les voisins", rest: "font du bruit.", answer: "Ils" },
  { gn: "Les ordinateurs", rest: "sont en panne.", answer: "Ils" },
  { gn: "Des cailloux", rest: "gênent le passage.", answer: "Ils" },

  // --- ELLES (Féminin Pluriel) ---
  { gn: "Les filles", rest: "dansent sur la piste.", answer: "Elles" },
  { gn: "Mes chaussures", rest: "sont toutes neuves.", answer: "Elles" },
  { gn: "Les pommes", rest: "sont bien mûres.", answer: "Elles" },
  { gn: "Julie et Sophie", rest: "révisent leurs leçons.", answer: "Elles" },
  { gn: "Des étoiles", rest: "brillent ce soir.", answer: "Elles" },
  { gn: "Les vaches", rest: "broutent dans le pré.", answer: "Elles" },
  { gn: "Mes tantes", rest: "habitent à Lyon.", answer: "Elles" },
  { gn: "Les fleurs", rest: "sentent très bon.", answer: "Elles" },
  { gn: "Ces maisons", rest: "sont en briques.", answer: "Elles" },
  { gn: "Les voitures", rest: "klaxonnent dans la rue.", answer: "Elles" },
  { gn: "La mère et la fille", rest: "font un gâteau.", answer: "Elles" },
  { gn: "Les poules", rest: "pondent des oeufs.", answer: "Elles" },
  { gn: "Tes chaussettes", rest: "sont dépareillées.", answer: "Elles" },
  { gn: "Les tables", rest: "sont propres.", answer: "Elles" },
  { gn: "Les feuilles", rest: "tombent en automne.", answer: "Elles" },
  { gn: "Mes copines", rest: "m'ont invité.", answer: "Elles" },
  { gn: "Les fourmis", rest: "travaillent dur.", answer: "Elles" },
  { gn: "Les montagnes", rest: "sont couvertes de neige.", answer: "Elles" },
  { gn: "Ces images", rest: "sont magnifiques.", answer: "Elles" },
  { gn: "Léa et sa maman", rest: "lisent un livre.", answer: "Elles" },
  { gn: "Les fenêtres", rest: "sont fermées.", answer: "Elles" },
  { gn: "Les vacances", rest: "passent trop vite.", answer: "Elles" },
  { gn: "Mes lunettes", rest: "sont sur mon nez.", answer: "Elles" },
  { gn: "Les girafes", rest: "ont un long cou.", answer: "Elles" },
  { gn: "Ces couleurs", rest: "sont vives.", answer: "Elles" },
  { gn: "Les glaces", rest: "fondent au soleil.", answer: "Elles" },
  { gn: "Les bouteilles", rest: "sont vides.", answer: "Elles" },
  { gn: "Marie et Claire", rest: "sont jumelles.", answer: "Elles" },
  { gn: "Les lumières", rest: "s'allument.", answer: "Elles" },
  { gn: "Les dents", rest: "doivent être brossées.", answer: "Elles" },

  // --- NOUS (Moi + ...) ---
  { gn: "Mon frère et moi", rest: "regardons un film.", answer: "Nous" },
  { gn: "Toi et moi", rest: "sommes une équipe.", answer: "Nous" },
  { gn: "Mes parents et moi", rest: "allons à la plage.", answer: "Nous" },
  { gn: "Le chien et moi", rest: "courons vite.", answer: "Nous" },
  { gn: "Paul et moi", rest: "sommes dans la même classe.", answer: "Nous" },
  { gn: "Ma soeur et moi", rest: "partageons la chambre.", answer: "Nous" },
  { gn: "Les élèves et moi", rest: "sortons en récréation.", answer: "Nous" },
  { gn: "Mon papi et moi", rest: "jouons aux cartes.", answer: "Nous" },
  { gn: "Toi et moi", rest: "aimons les glaces.", answer: "Nous" },
  { gn: "Julie et moi", rest: "faisons du vélo.", answer: "Nous" },
  { gn: "Mon chat et moi", rest: "faisons la sieste.", answer: "Nous" },
  { gn: "Mes amis et moi", rest: "préparons un spectacle.", answer: "Nous" },
  { gn: "Le maître et moi", rest: "discutons du devoir.", answer: "Nous" },
  { gn: "Ta mère et moi", rest: "buvons du café.", answer: "Nous" },
  { gn: "Léo et moi", rest: "sommes voisins.", answer: "Nous" },
  { gn: "Ma cousine et moi", rest: "chantons une chanson.", answer: "Nous" },
  { gn: "Les joueurs et moi", rest: "fêtons la victoire.", answer: "Nous" },
  { gn: "Ton père et moi", rest: "réparons le vélo.", answer: "Nous" },
  { gn: "Sarah et moi", rest: "écrivons une lettre.", answer: "Nous" },
  { gn: "Le groupe et moi", rest: "visitons le musée.", answer: "Nous" },
  { gn: "Mes frères et moi", rest: "aidons maman.", answer: "Nous" },
  { gn: "Toi et moi", rest: "irons au parc.", answer: "Nous" },
  { gn: "Lucas et moi", rest: "échangeons des billes.", answer: "Nous" },
  { gn: "La classe et moi", rest: "prenons le bus.", answer: "Nous" },
  { gn: "Mon oncle et moi", rest: "pêchons au lac.", answer: "Nous" },
  { gn: "Sophie et moi", rest: "dessinons des chats.", answer: "Nous" },
  { gn: "Les voisins et moi", rest: "organisons un repas.", answer: "Nous" },
  { gn: "Mon équipe et moi", rest: "avons gagné.", answer: "Nous" },
  { gn: "Toi et moi", rest: "restons ici.", answer: "Nous" },
  { gn: "Ma famille et moi", rest: "déménageons bientôt.", answer: "Nous" },

  // --- VOUS (Toi + ...) ---
  { gn: "Ta sœur et toi", rest: "préparez le goûter.", answer: "Vous" },
  { gn: "Ton copain et toi", rest: "jouez aux jeux vidéo.", answer: "Vous" },
  { gn: "Les élèves et toi", rest: "écoutez le directeur.", answer: "Vous" },
  { gn: "Maman et toi", rest: "allez faire les courses.", answer: "Vous" },
  { gn: "Paul et toi", rest: "êtes en retard.", answer: "Vous" },
  { gn: "Tes parents et toi", rest: "partez en voyage.", answer: "Vous" },
  { gn: "Le chien et toi", rest: "faites trop de bruit.", answer: "Vous" },
  { gn: "Julie et toi", rest: "savez bien danser.", answer: "Vous" },
  { gn: "Ton frère et toi", rest: "devez ranger la chambre.", answer: "Vous" },
  { gn: "Léa et toi", rest: "êtes invitées.", answer: "Vous" },
  { gn: "Les voisins et toi", rest: "nettoyez la rue.", answer: "Vous" },
  { gn: "Ton père et toi", rest: "regardez le match.", answer: "Vous" },
  { gn: "Marc et toi", rest: "avez fini l'exercice.", answer: "Vous" },
  { gn: "Tes amis et toi", rest: "venez à la maison.", answer: "Vous" },
  { gn: "La classe et toi", rest: "préparez la fête.", answer: "Vous" },
  { gn: "Sophie et toi", rest: "portez la même robe.", answer: "Vous" },
  { gn: "Mon frère et toi", rest: "vous disputez souvent.", answer: "Vous" },
  { gn: "Le chat et toi", rest: "dormez tout le temps.", answer: "Vous" },
  { gn: "Tes cousines et toi", rest: "chantez bien.", answer: "Vous" },
  { gn: "Pierre et toi", rest: "êtes les plus grands.", answer: "Vous" },
  { gn: "Le maître et toi", rest: "corrigez le tableau.", answer: "Vous" },
  { gn: "Ta grand-mère et toi", rest: "faites du tricot.", answer: "Vous" },
  { gn: "Lucas et toi", rest: "courez vite.", answer: "Vous" },
  { gn: "Les filles et toi", rest: "jouez à la marelle.", answer: "Vous" },
  { gn: "Ton oncle et toi", rest: "lavez la voiture.", answer: "Vous" },
  { gn: "Marie et toi", rest: "aimez le chocolat.", answer: "Vous" },
  { gn: "Les garçons et toi", rest: "jouez au foot.", answer: "Vous" },
  { gn: "Ta meilleure amie et toi", rest: "rigolez tout le temps.", answer: "Vous" },
  { gn: "Le groupe et toi", rest: "présentez l'exposé.", answer: "Vous" },
  { gn: "Tes parents et toi", rest: "habitez ici.", answer: "Vous" },
];

// Liste des pronoms affichés sur les boutons (SANS JE/TU)
const pronounsList = ["Il", "Elle", "Nous", "Vous", "Ils", "Elles"];

const CLASSES = ["CP A", "CP B", "CE1 A", "CE1 B", "CE2 A", "CE2 B", "CM1 A", "CM1 B", "CM2 A", "CM2 B"];

function FrenchGames() {
  const { theme } = React.useContext(ThemeContext);
  const isDark = theme === 'dark';
  // --- ETATS ---
  const [selectedGame, setSelectedGame] = useState(null);
  const [timeLeft, setTimeLeft] = useState(100); // 100 sec au départ
  const [speedFactor, setSpeedFactor] = useState(1); // Facteur de vitesse
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState({ gn: "", rest: "", answer: "" });
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
  const loadTopScores = useCallback(async () => {
    try {
      const q = query(collection(db, "leaderboard_pronoms"), orderBy("score", "desc"), limit(15));
      const snapshot = await getDocs(q);
      const scores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTopScores(scores);
    } catch (error) {
      console.error("Erreur leaderboard:", error);
    }
  }, []);

  // --- LOGIQUE DU JEU ---
  const getNextQuestion = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * questionsBank.length);
    return questionsBank[randomIndex];
  }, []);

  const startGame = () => {
    setCurrent(getNextQuestion());
    setTimeLeft(100); // Reset à 100
    setSpeedFactor(1); // Reset vitesse
    setScore(0);
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
      const cleanPseudo = playerName.slice(0, 12);
      const q = query(collection(db, "leaderboard_pronoms"), where("pseudo", "==", cleanPseudo));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        if (score > existingDoc.data().score) {
          await updateDoc(doc(db, "leaderboard_pronoms", existingDoc.id), { score: score, date: new Date().toISOString(), classLabel: playerClass });
        }
      } else {
        await addDoc(collection(db, "leaderboard_pronoms"), {
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

  // --- AUDIO ---
  const speak = useCallback((text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    if (running && !gameOver && isAudioMode) {
      speak(`${current.gn} ... ${current.rest}`);
    }
  }, [current, running, gameOver, isAudioMode, speak]);

  // Timer avec SpeedFactor
  useEffect(() => {
    if (!running) return;
    if (isPracticeMode) return;
    if (timeLeft <= 0) {
      setRunning(false);
      setGameOver(true);
      return;
    }
    // Le temps s'écoule de plus en plus vite selon speedFactor
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000 / speedFactor);
    return () => clearInterval(interval);
  }, [timeLeft, running, speedFactor, isPracticeMode]);

  useEffect(() => {
    if (selectedGame) loadTopScores();
  }, [selectedGame, loadTopScores]);

  // Validation réponse
  const handleAnswer = (chosenPronoun) => {
    if (!running || gameOver) return;

    if (chosenPronoun.toLowerCase() === current.answer.toLowerCase()) {
      // BONNE RÉPONSE
      setScore(score + 1);
      if (!isPracticeMode) {
        setSpeedFactor((prev) => prev * 1.1); // On accélère le temps
        setTimeLeft(100); // On remet le temps à fond
      }
      setCurrent(getNextQuestion());
    } else {
      // MAUVAISE RÉPONSE
      if (!isPracticeMode) setTimeLeft((prev) => Math.max(prev - 5, 0)); // Pénalité -5s
      setShowPenalty(true);
      setTimeout(() => setShowPenalty(false), 800);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Link to="/games" className={`relative md:absolute top-0 left-0 md:top-6 md:left-6 z-10 w-fit mb-6 md:mb-0 flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors ${isDark ? 'text-cyan-400 bg-cyan-950/30 border-cyan-900/50 hover:bg-cyan-900/50' : 'text-cyan-700 bg-cyan-100/50 border-cyan-200 hover:bg-cyan-200/50'}`}>
        ← Retour
      </Link>

      {!selectedGame ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
          <div className="space-y-2">
            <h1 className={`text-4xl md:text-5xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Français 📚</h1>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-lg`}>Choisis ton exercice :</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
            <div
              className={`group relative flex flex-col items-center p-6 rounded-2xl border transition-all cursor-pointer backdrop-blur-sm ${isDark ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 hover:border-violet-500/30' : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-violet-500/50 shadow-sm'}`}
              onClick={() => setSelectedGame('pronoms')}
            >
              <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">👤</span>
              <h3 className={`text-lg font-semibold group-hover:text-violet-600 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Les Pronoms</h3>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm`}>Remplace le groupe nominal</p>
            </div>

            <div className={`group relative flex flex-col items-center p-6 rounded-2xl border opacity-50 cursor-not-allowed ${isDark ? 'border-slate-800 bg-slate-900/20' : 'border-slate-200 bg-slate-50'}`}>
              <span className="text-4xl mb-4 grayscale">⏳</span>
              <h3 className="text-lg font-semibold text-slate-500">Conjugaison</h3>
              <p className="text-slate-600 text-sm">Bientôt...</p>
            </div>
          </div>
        </div>
      ) : (
        <div className={`w-full max-w-2xl mx-auto border p-8 rounded-2xl backdrop-blur-xl shadow-2xl mt-10 ${isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white/90 border-slate-200'}`}>
          <div className="flex justify-between items-center mb-8">
            <button
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'}`}
              onClick={goMenu}
            >
              ⬅ Menu Français
            </button>
            <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Grammaire : Pronoms 👤</h1>
          </div>

          <div className={`p-6 rounded-xl mb-8 border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
              <Trophy size={20} className="text-yellow-500" /> Classement
            </h3>

            {topScores.length > 0 ? (
              <div className="flex flex-col">
                {/* PODIUM */}
                <div className="flex justify-center items-end gap-2 sm:gap-4 mb-6 px-2 pt-4">
                  {/* 2ND PLACE */}
                  <div className="flex flex-col items-center w-1/3">
                    {topScores[1] ? (
                      <>
                        <div className={`relative flex flex-col items-center justify-end w-full rounded-t-xl p-2 border-t border-l border-r ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-200'}`} style={{ height: '120px' }}>
                          <span className="text-2xl mb-1">🥈</span>
                          <span className={`font-bold text-center text-sm truncate w-full ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{topScores[1].pseudo}</span>
                          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{topScores[1].score} pts</span>
                        </div>
                        <div className={`w-full h-2 ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
                      </>
                    ) : <div className="h-[120px]"></div>}
                  </div>

                  {/* 1ST PLACE */}
                  <div className="flex flex-col items-center w-1/3">
                    {topScores[0] ? (
                      <>
                        <div className="mb-2"><Trophy size={24} className="text-yellow-400 animate-bounce" /></div>
                        <div className={`relative flex flex-col items-center justify-end w-full rounded-t-xl p-2 border-t border-l border-r shadow-[0_0_15px_rgba(250,204,21,0.3)] ${isDark ? 'bg-gradient-to-b from-yellow-500/20 to-slate-900 border-yellow-500/50' : 'bg-gradient-to-b from-yellow-100 to-white border-yellow-400'}`} style={{ height: '150px' }}>
                          <span className="text-3xl mb-1">👑</span>
                          <span className={`font-bold text-center truncate w-full ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>{topScores[0].pseudo}</span>
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{topScores[0].score} pts</span>
                        </div>
                        <div className="w-full h-2 bg-yellow-400"></div>
                      </>
                    ) : null}
                  </div>

                  {/* 3RD PLACE */}
                  <div className="flex flex-col items-center w-1/3">
                    {topScores[2] ? (
                      <>
                        <div className={`relative flex flex-col items-center justify-end w-full rounded-t-xl p-2 border-t border-l border-r ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-200'}`} style={{ height: '100px' }}>
                          <span className="text-2xl mb-1">🥉</span>
                          <span className={`font-bold text-center text-sm truncate w-full ${isDark ? 'text-amber-700' : 'text-amber-800'}`}>{topScores[2].pseudo}</span>
                          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{topScores[2].score} pts</span>
                        </div>
                        <div className={`w-full h-2 ${isDark ? 'bg-amber-900' : 'bg-amber-700'}`}></div>
                      </>
                    ) : <div className="h-[100px]"></div>}
                  </div>
                </div>

                {/* LIST (4th - 15th) */}
                {topScores.length > 3 && (
                  <div className="mt-2">
                    <button
                      onClick={() => setShowAllScores(!showAllScores)}
                      className={`w-full flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
                    >
                      {showAllScores ? <><ChevronUp size={16} /> Masquer la suite</> : <><ChevronDown size={16} /> Voir la suite ({topScores.length - 3})</>}
                    </button>

                    {showAllScores && (
                      <div className={`mt-2 space-y-1 rounded-xl p-2 ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                        {topScores.slice(3).map((score, index) => (
                          <div key={score.id || index} className={`flex items-center justify-between px-3 py-2 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-white border border-slate-100'}`}>
                            <div className="flex items-center gap-3">
                              <span className={`flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>{index + 4}</span>
                              <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{score.pseudo} <span className="opacity-50 text-xs font-normal">({score.classLabel || "?"})</span></span>
                            </div>
                            <strong className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{score.score}</strong>
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

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className={`p-4 rounded-xl border text-center flex flex-col relative overflow-hidden ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}>
              <span className={`text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Temps</span>
              <strong className={`text-3xl ${isDark ? 'text-white' : 'text-slate-900'}`}>{isPracticeMode ? "∞" : `${timeLeft.toFixed(0)} s`}</strong>
              {showPenalty && !isPracticeMode && <span className="absolute top-2 right-2 text-red-500 text-xs font-bold animate-ping">-5s</span>}
            </div>
            <div className={`p-4 rounded-xl border text-center flex flex-col ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}>
              <span className={`text-xs uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Score</span>
              <strong className={`text-3xl ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>{score}</strong>
            </div>
          </div>

          {!running && (
            <div className="mb-6 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  className={`flex-1 border rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500'}`}
                  placeholder="Ton pseudo"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={12}
                  autoFocus
                />
                <select
                  className={`w-1/3 border rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500' : 'bg-white border-slate-300 text-slate-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500'}`}
                  value={playerClass}
                  onChange={(e) => setPlayerClass(e.target.value)}
                >
                  <option value="">Choisir sa classe</option>
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setIsAudioMode(!isAudioMode)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border flex items-center gap-2 ${isAudioMode ? 'bg-violet-500/20 border-violet-500 text-violet-500' : 'bg-transparent border-slate-500 text-slate-500 hover:border-slate-400 hover:text-slate-400'}`}
                >
                  {isAudioMode ? <><Volume2 size={18} /> Audio Activé</> : <><VolumeX size={18} /> Audio Désactivé</>}
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

          {!running && !gameOver && playerName && playerClass && (
            <button
              className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl shadow-lg shadow-violet-900/20 transition-all active:scale-95"
              onClick={startGame}
            >
              🎮 Démarrer ({playerName})
            </button>
          )}

          {running && !gameOver && (
            <>
              <div className={`text-center mb-8 text-2xl flex flex-col items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <div className="flex items-center gap-3">
                  <span className={`${isDark ? 'text-violet-400' : 'text-violet-600'} font-bold`}>{current.gn}</span> {current.rest}
                  <button onClick={() => speak(`${current.gn} ... ${current.rest}`)} className="p-2 rounded-full hover:bg-slate-500/20 transition-colors text-slate-400 hover:text-violet-500" title="Répéter"><Volume2 size={24} /></button>
                </div>
              </div>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm text-center mb-6`}>Par quel pronom peux-tu remplacer ce qui est en couleur ?</p>

              <div className="grid grid-cols-2 gap-4">
                {pronounsList.map((pronom) => (
                  <button
                    key={pronom}
                    className={`py-4 px-2 border rounded-xl font-bold text-lg transition-all active:scale-95 ${isDark ? 'bg-slate-800 hover:bg-violet-600 border-slate-700 hover:border-violet-500 text-white' : 'bg-white hover:bg-violet-500 border-slate-200 hover:border-violet-500 text-slate-900 hover:text-white'}`}
                    onClick={() => handleAnswer(pronom)}
                  >
                    {pronom}
                  </button>
                ))}
              </div>
              {isPracticeMode && (
                <button
                  onClick={() => { setRunning(false); setGameOver(true); }}
                  className="mt-6 w-full py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  Arrêter l'entraînement
                </button>
              )}
            </>
          )}

          {gameOver && (
            <div className="text-center space-y-6 py-4">
              <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{isPracticeMode ? "Entraînement terminé" : "⏰ Temps écoulé !"}</h2>
              <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'} text-xl`}>Score final : <strong className={isDark ? 'text-violet-400' : 'text-violet-600'}>{score}</strong></p>
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

export default FrenchGames;