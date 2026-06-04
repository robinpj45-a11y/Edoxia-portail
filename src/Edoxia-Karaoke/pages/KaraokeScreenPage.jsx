import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import YouTube from 'react-youtube';
import { Music, Mic2, PlayCircle, Loader2, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KaraokeScreenPage() {
  const [queue, setQueue] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [upcomingSongs, setUpcomingSongs] = useState([]);
  const [playerReady, setPlayerReady] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    // Listen to all and filter locally to avoid requiring composite indexes
    const q = query(
      collection(db, 'karaoke_queue'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const allItems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const playing = allItems.find(i => i.status === 'playing');
      const pendings = allItems.filter(i => i.status === 'pending');

      if (playing) {
        setCurrentSong(playing);
        setUpcomingSongs(pendings);
      } else if (pendings.length > 0) {
        // No song is currently playing, and we have pending songs.
        // Automatically start the first one by changing its status to 'playing'.
        const firstPending = pendings[0];
        startSong(firstPending.id);
      } else {
        // Nothing to play
        setCurrentSong(null);
        setUpcomingSongs([]);
      }
      
      setQueue(allItems);
    });

    return () => unsubscribe();
  }, []);

  const startSong = async (id) => {
    try {
      await updateDoc(doc(db, 'karaoke_queue', id), {
        status: 'playing'
      });
    } catch (e) {
      console.error("Erreur lors du lancement de la chanson:", e);
    }
  };

  const handleVideoEnd = async () => {
    if (currentSong) {
      setPlayerReady(false);
      setVideoError(false);
      try {
        await updateDoc(doc(db, 'karaoke_queue', currentSong.id), {
          status: 'played'
        });
        // The onSnapshot will trigger and automatically start the next pending song
      } catch (e) {
        console.error("Erreur de mise à jour du statut:", e);
      }
    }
  };

  const handlePlayerReady = (e) => {
    setVideoError(false);
    setPlayerReady(true);
    e.target.playVideo(); // Ensure autoplay
  };

  const handleError = (e) => {
    console.error("YouTube Player Error:", e.data);
    setVideoError(true);
    // Skip after 3 seconds so the user can see there was an error
    setTimeout(() => {
      handleVideoEnd();
    }, 3000);
  };

  // Options for react-youtube
  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 1,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
    },
  };

  return (
    <div className="h-screen w-full bg-[#0a0a0c] text-white flex overflow-hidden">
      
      {/* Main Player Area */}
      <div className="flex-1 flex flex-col p-8 pr-4 relative">
        <div className="flex justify-between items-end mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-brand-teal to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Mic2 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">Karaoké Box</h1>
              <p className="text-brand-text/50 font-bold uppercase tracking-widest text-xs">Écran Principal</p>
            </div>
          </div>
          
          {currentSong && (
            <div className="flex items-end gap-6 text-right">
              <div>
                <h2 className="text-3xl font-black text-white leading-tight drop-shadow-lg">{currentSong.title}</h2>
                <div className="flex items-center justify-end gap-3 mt-1">
                  <p className="text-xl font-bold text-white/80 uppercase tracking-widest drop-shadow-md">{currentSong.artist}</p>
                  {currentSong.singerName && (
                    <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-black text-white border border-white/20 flex items-center gap-1 shadow-sm">
                      🎤 {currentSong.singerName}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleVideoEnd}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-colors border border-white/20 text-white"
                  title="Passer à la suivante"
                >
                  <SkipForward size={18} /> Passer
                </button>
                <div className="bg-brand-coral/90 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                  <PlayCircle size={18} /> En cours
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 bg-black/50 border border-white/10 rounded-[40px] overflow-hidden relative shadow-2xl flex flex-col justify-center items-center">
          {currentSong ? (
            <>
              {!playerReady && !videoError && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0a0a0c]">
                  <Loader2 size={48} className="animate-spin text-brand-teal mb-4" />
                  <p className="text-xl font-bold uppercase tracking-widest animate-pulse">Chargement...</p>
                </div>
              )}
              {videoError && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0a0a0c] p-8 text-center">
                  <div className="w-20 h-20 bg-brand-coral/20 rounded-full flex items-center justify-center mb-6">
                    <Music size={40} className="text-brand-coral" />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-widest text-brand-coral mb-2">Vidéo indisponible</h2>
                  <p className="text-xl font-bold text-white/60">Le créateur a bloqué la lecture de cette vidéo en dehors de YouTube.</p>
                  <p className="text-sm font-bold text-brand-text/40 mt-6 uppercase tracking-widest animate-pulse">Passage à la suivante...</p>
                </div>
              )}
              <div className={`w-full h-full transition-opacity duration-1000 ${playerReady && !videoError ? 'opacity-100' : 'opacity-0'}`}>
                <YouTube 
                  videoId={currentSong.videoId} 
                  opts={opts} 
                  onEnd={handleVideoEnd} 
                  onReady={handlePlayerReady}
                  onError={handleError}
                  className="w-full h-full"
                  iframeClassName="w-full h-full"
                />
              </div>
              {/* Overlay info moved to header */}
            </>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 shadow-inner">
                <Music size={48} className="text-white/20" />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-widest text-white/40">Aucune chanson</h2>
                <p className="text-white/20 font-bold mt-2">Utilisez la télécommande pour ajouter des titres !</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Queue */}
      <div className="w-96 bg-white/5 border-l border-white/10 p-8 flex flex-col">
        <div className="mb-8">
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
            File d'attente
            <span className="bg-brand-teal/20 text-brand-teal px-3 py-1 rounded-full text-sm">
              {upcomingSongs.length}
            </span>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-white/10">
          <AnimatePresence>
            {upcomingSongs.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-10 opacity-30"
              >
                <Music size={32} className="mx-auto mb-2" />
                <p className="font-bold uppercase tracking-widest text-xs">La suite est vide</p>
              </motion.div>
            ) : (
              upcomingSongs.slice(0, 5).map((song, idx) => (
                <motion.div 
                  key={song.id}
                  initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50, height: 0, marginBottom: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="bg-black/40 border border-white/5 p-4 rounded-2xl flex gap-4 items-center overflow-hidden"
                >
                  <div className="text-2xl font-black text-white/10 w-8 text-center shrink-0">
                    {idx + 1}
                  </div>
                  
                  {song.thumbnail ? (
                    <div className="w-20 h-14 bg-black rounded-xl overflow-hidden shrink-0">
                      <img src={song.thumbnail} alt="thumb" className="w-full h-full object-cover opacity-70" />
                    </div>
                  ) : (
                    <div className="w-20 h-14 bg-white/5 rounded-xl shrink-0 flex items-center justify-center">
                      <Music size={20} className="text-white/20" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate">{song.title}</p>
                    <p className="text-xs text-brand-teal font-bold uppercase tracking-widest truncate">{song.artist}</p>
                  </div>

                  {song.singerName && (
                    <div className="shrink-0 max-w-[80px]">
                      <p className="text-[10px] font-bold text-white/40 truncate bg-white/5 px-2 py-1 rounded-md text-center" title={song.singerName}>
                        {song.singerName}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))
            )}
            
            {upcomingSongs.length > 5 && (
              <motion.div className="text-center py-4 text-xs font-bold text-white/30 uppercase tracking-widest">
                + {upcomingSongs.length - 5} autres titres
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
