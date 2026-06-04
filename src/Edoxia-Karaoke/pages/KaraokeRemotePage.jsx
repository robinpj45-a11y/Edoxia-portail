import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Mic2, Search, Play, Plus, Youtube, AlertTriangle, Music, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const YOUTUBE_API_KEY = "AIzaSyCdcX-3Zfz4rqT6CppjUAYXor06zWgLllc";

export default function KaraokeRemotePage() {
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [singerName, setSingerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualId, setManualId] = useState('');
  const [queue, setQueue] = useState([]);
  const [recentlyAdded, setRecentlyAdded] = useState(null);

  useEffect(() => {
    // We order by createdAt and filter pending locally to avoid requiring a composite index
    const q = query(
      collection(db, 'karaoke_queue'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => item.status === 'pending');
      setQueue(items);
    });

    return () => unsubscribe();
  }, []);

  const handleSearchAndAdd = async (e) => {
    e.preventDefault();
    if (!artist.trim() || !title.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const searchQuery = `${artist} ${title} karaoke`;
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&videoEmbeddable=true&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`);
      
      if (!res.ok) {
        throw new Error('Erreur API YouTube');
      }

      const data = await res.json();
      
      if (data.items && data.items.length > 0) {
        const videoId = data.items[0].id.videoId;
        const videoTitle = data.items[0].snippet.title;
        const thumbnail = data.items[0].snippet.thumbnails?.medium?.url;

        await addDoc(collection(db, 'karaoke_queue'), {
          artist: artist.trim(),
          title: title.trim(),
          singerName: singerName.trim() || 'Anonyme',
          videoId,
          youtubeTitle: videoTitle,
          thumbnail,
          status: 'pending',
          createdAt: serverTimestamp()
        });

        setRecentlyAdded(`${artist} - ${title}`);
        setTimeout(() => setRecentlyAdded(null), 3000);
        
        setArtist('');
        setTitle('');
        setSingerName('');
      } else {
        setError("Aucune vidéo karaoké trouvée. Veuillez entrer un lien manuellement.");
        setShowManualInput(true);
      }
    } catch (err) {
      console.error(err);
      setError("La recherche automatique a échoué. Veuillez entrer un lien manuellement.");
      setShowManualInput(true);
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (urlOrId) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = urlOrId.match(regex);
    return match ? match[1] : urlOrId;
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!manualId.trim()) return;

    const videoId = extractVideoId(manualId.trim());
    if (videoId.length !== 11) {
      setError("L'ID ou l'URL de la vidéo semble invalide.");
      return;
    }

    setLoading(true);
    try {
      // Get video details just for title/thumbnail
      const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      
      let videoTitle = "Vidéo manuelle";
      let thumbnail = null;

      if (data.items && data.items.length > 0) {
        videoTitle = data.items[0].snippet.title;
        thumbnail = data.items[0].snippet.thumbnails?.medium?.url;
      }

      await addDoc(collection(db, 'karaoke_queue'), {
        artist: artist.trim() || 'Inconnu',
        title: title.trim() || 'Titre inconnu',
        singerName: singerName.trim() || 'Anonyme',
        videoId,
        youtubeTitle: videoTitle,
        thumbnail,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setRecentlyAdded(videoTitle);
      setTimeout(() => setRecentlyAdded(null), 3000);

      setArtist('');
      setTitle('');
      setSingerName('');
      setManualId('');
      setShowManualInput(false);
      setError('');
    } catch (err) {
      console.error(err);
      setError("Impossible d'ajouter la vidéo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-md space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-tr from-brand-teal to-indigo-600 rounded-full text-white shadow-xl mb-2">
            <Mic2 size={32} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter bg-gradient-to-r from-brand-teal to-indigo-600 text-transparent bg-clip-text">Karaoké Box</h1>
          <p className="text-sm font-bold text-brand-text/50 uppercase tracking-widest">Télécommande invité</p>
        </div>

        {/* Formulaire */}
        <div className="bg-white/60 backdrop-blur-md p-6 rounded-[30px] shadow-soft border border-white space-y-6 relative overflow-hidden">
          <AnimatePresence>
            {recentlyAdded && (
              <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="absolute top-0 left-0 right-0 bg-green-500 text-white text-xs font-bold py-2 text-center shadow-md z-10 uppercase tracking-widest"
              >
                Ajouté avec succès !
              </motion.div>
            )}
          </AnimatePresence>

          {!showManualInput ? (
            <form onSubmit={handleSearchAndAdd} className="space-y-4 pt-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-brand-text/40 mb-4 flex items-center gap-2">
                <Search size={16} /> Rechercher une chanson
              </h2>
              
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Votre prénom" 
                  value={singerName}
                  onChange={e => setSingerName(e.target.value)}
                  required
                  className="w-full bg-white border border-brand-text/10 rounded-2xl px-5 py-4 font-bold text-brand-text outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-all shadow-inner"
                />
                <input 
                  type="text" 
                  placeholder="Artiste (ex: Céline Dion)" 
                  value={artist}
                  onChange={e => setArtist(e.target.value)}
                  required
                  className="w-full bg-white border border-brand-text/10 rounded-2xl px-5 py-4 font-bold text-brand-text outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-all shadow-inner"
                />
                <input 
                  type="text" 
                  placeholder="Titre (ex: Pour que tu m'aimes encore)" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full bg-white border border-brand-text/10 rounded-2xl px-5 py-4 font-bold text-brand-text outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-all shadow-inner"
                />
              </div>

              {error && (
                <div className="p-3 bg-brand-coral/10 text-brand-coral rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle size={16} /> {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-teal to-indigo-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-sm shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Plus size={20} />}
                Ajouter à la file
              </button>
            </form>
          ) : (
            <form onSubmit={handleManualAdd} className="space-y-4 pt-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-brand-coral mb-4 flex items-center gap-2">
                <Youtube size={16} /> Ajout manuel (Fallback)
              </h2>
              
              <p className="text-xs font-medium text-brand-text/60 leading-relaxed">
                La recherche a échoué. Veuillez trouver votre karaoké sur YouTube et coller le lien ou l'ID de la vidéo ci-dessous.
              </p>

              <input 
                type="text" 
                placeholder="Votre prénom" 
                value={singerName}
                onChange={e => setSingerName(e.target.value)}
                required
                className="w-full bg-white border border-brand-text/10 rounded-2xl px-5 py-4 font-bold text-brand-text outline-none focus:ring-2 focus:ring-brand-coral/30 focus:border-brand-coral transition-all shadow-inner mb-3"
              />

              <input 
                type="text" 
                placeholder="Lien YouTube ou ID vidéo" 
                value={manualId}
                onChange={e => setManualId(e.target.value)}
                required
                className="w-full bg-white border border-brand-text/10 rounded-2xl px-5 py-4 font-bold text-brand-text outline-none focus:ring-2 focus:ring-brand-coral/30 focus:border-brand-coral transition-all shadow-inner"
              />

              {error && (
                <div className="p-3 bg-brand-coral/10 text-brand-coral rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle size={16} /> {error}
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => { setShowManualInput(false); setError(''); }}
                  className="flex-1 bg-white border border-brand-text/10 text-brand-text/60 font-black py-4 rounded-2xl uppercase tracking-widest text-sm hover:bg-brand-bg transition-all"
                >
                  Retour
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-[2] bg-brand-coral text-white font-black py-4 rounded-2xl uppercase tracking-widest text-sm shadow-lg shadow-brand-coral/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Plus size={20} />}
                  Ajouter
                </button>
              </div>
            </form>
          )}
        </div>

        {/* File d'attente */}
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-brand-text/40 flex items-center gap-2 px-2">
            <Music size={16} /> File d'attente ({queue.length})
          </h2>
          
          <div className="space-y-3">
            <AnimatePresence>
              {queue.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-center py-10 bg-white/30 rounded-[30px] border border-white/50 border-dashed"
                >
                  <p className="text-sm font-bold text-brand-text/40">La liste est vide.</p>
                  <p className="text-xs text-brand-text/30 mt-1">Ajoutez la première chanson !</p>
                </motion.div>
              ) : (
                queue.map((item, index) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-4 bg-white/70 backdrop-blur-md p-3 pr-5 rounded-2xl border border-white shadow-sm"
                  >
                    <div className="w-8 font-black text-brand-text/20 text-center shrink-0">#{index + 1}</div>
                    
                    {item.thumbnail ? (
                      <div className="w-16 h-12 bg-black rounded-lg overflow-hidden shrink-0 relative">
                        <img src={item.thumbnail} alt="thumbnail" className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play size={16} className="text-white drop-shadow-md" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-12 bg-brand-bg rounded-lg shrink-0 flex items-center justify-center">
                        <Youtube size={20} className="text-brand-text/20" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-brand-text truncate leading-tight">{item.title}</p>
                      <p className="text-xs font-bold text-brand-text/50 truncate uppercase tracking-widest">{item.artist}</p>
                    </div>
                    
                    {item.singerName && (
                      <div className="shrink-0 bg-brand-teal/10 px-3 py-1 rounded-full border border-brand-teal/20">
                        <p className="text-[10px] font-black text-brand-teal uppercase tracking-widest">{item.singerName}</p>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
