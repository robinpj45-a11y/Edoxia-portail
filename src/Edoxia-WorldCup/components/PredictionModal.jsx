import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Save, User } from 'lucide-react';
import { collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const PredictionModal = ({ match, onClose }) => {
  const [userName, setUserName] = useState('');
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState([]);

  // Fetch users from admin list
  useEffect(() => {
    const fetchUsers = async () => {
      const unsub = onSnapshot(collection(db, 'wc_users'), (snap) => {
        const data = snap.docs.map(d => d.data().name);
        data.sort((a, b) => a.localeCompare(b));
        setUsers(data);
      });
      return () => unsub();
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userName.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'wc_predictions'), {
        matchId: match.id,
        userName: userName.trim(),
        scoreA,
        scoreB,
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (error) {
      console.error("Error adding prediction:", error);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScoreChange = (team, delta) => {
    if (team === 'A') setScoreA(prev => Math.max(0, prev + delta));
    if (team === 'B') setScoreB(prev => Math.max(0, prev + delta));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div 
          initial={{ y: "100%", opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="bg-[#1e293b] w-full max-w-sm rounded-[32px] p-6 relative z-10 shadow-2xl border border-white/10 flex flex-col max-h-[85vh] overflow-y-auto"
        >
          {/* Close handle for mobile */}
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 sm:hidden"></div>

          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors hidden sm:block">
            <X size={20} />
          </button>

          <h3 className="text-2xl font-black text-white text-center mb-6">Ton Pronostic</h3>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            
            {/* User Dropdown */}
            <div className="mb-6 relative">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 block pl-2">Qui es-tu ?</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
                  <User size={20} />
                </div>
                <select 
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  className="w-full bg-slate-900 border-2 border-white/10 focus:border-emerald-500 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="" disabled>Sélectionne ton nom</option>
                  {users.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                {/* Custom arrow for select */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            {/* Score Pickers */}
            <div className="flex justify-between items-center bg-slate-900 rounded-3xl p-6 border border-white/5 mb-8 shadow-inner">
              
              {/* Team A Picker */}
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-white/70 mb-4">{match.teamA || 'Equipe A'}</span>
                <button type="button" onClick={() => handleScoreChange('A', 1)} className="w-14 h-14 bg-white/5 hover:bg-emerald-500/20 rounded-full flex items-center justify-center text-white transition-colors active:scale-95 border border-white/10 hover:border-emerald-500/50">
                  <Plus size={24} />
                </button>
                <div className="text-5xl font-black text-white my-4 w-16 text-center tabular-nums">{scoreA}</div>
                <button type="button" onClick={() => handleScoreChange('A', -1)} className="w-14 h-14 bg-white/5 hover:bg-rose-500/20 rounded-full flex items-center justify-center text-white transition-colors active:scale-95 border border-white/10 hover:border-rose-500/50">
                  <Minus size={24} />
                </button>
              </div>

              {/* Separator */}
              <div className="text-white/20 font-black text-3xl">-</div>

              {/* Team B Picker */}
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-white/70 mb-4">{match.teamB || 'Equipe B'}</span>
                <button type="button" onClick={() => handleScoreChange('B', 1)} className="w-14 h-14 bg-white/5 hover:bg-emerald-500/20 rounded-full flex items-center justify-center text-white transition-colors active:scale-95 border border-white/10 hover:border-emerald-500/50">
                  <Plus size={24} />
                </button>
                <div className="text-5xl font-black text-white my-4 w-16 text-center tabular-nums">{scoreB}</div>
                <button type="button" onClick={() => handleScoreChange('B', -1)} className="w-14 h-14 bg-white/5 hover:bg-rose-500/20 rounded-full flex items-center justify-center text-white transition-colors active:scale-95 border border-white/10 hover:border-rose-500/50">
                  <Minus size={24} />
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || !userName.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 active:scale-95 mt-auto"
            >
              {isSubmitting ? 'Validation...' : <><Save size={20} /> Valider</>}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PredictionModal;
