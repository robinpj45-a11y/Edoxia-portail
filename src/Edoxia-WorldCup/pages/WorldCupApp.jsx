import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, Plus, Edit2, Trash2, Save, Calendar, Loader2, AlertTriangle, Users } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, query, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import PredictionModal from '../components/PredictionModal';
import MatchCard from '../components/MatchCard';

export const ROUNDS = [
  { id: 'r64', name: 'R64' },
  { id: 'r32', name: 'R32' },
  { id: 'r16', name: 'R16' },
  { id: 'quart', name: 'Quart' },
  { id: 'demi', name: 'Demi' },
  { id: 'finale', name: 'Finale' },
];

const WorldCupApp = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('r64');
  
  // Data
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [users, setUsers] = useState([]);
  
  // UI States
  const [selectedMatch, setSelectedMatch] = useState(null); // For prediction modal
  const [editingMatch, setEditingMatch] = useState(null); // For match edit modal
  
  // Form states (Match)
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [status, setStatus] = useState('A venir');
  const [date, setDate] = useState('');
  const [isSavingMatch, setIsSavingMatch] = useState(false);

  // Form state (User)
  const [newUserName, setNewUserName] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Data fetching
  useEffect(() => {
    const unsubMatches = onSnapshot(collection(db, 'wc_matches'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by creation time if available
      data.sort((a, b) => {
        if (a.createdAt && b.createdAt) return a.createdAt.toMillis() - b.createdAt.toMillis();
        return 0;
      });
      setMatches(data);
    });
    
    const unsubPreds = onSnapshot(collection(db, 'wc_predictions'), (snap) => {
      setPredictions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubUsers = onSnapshot(collection(db, 'wc_users'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => a.name.localeCompare(b.name));
      setUsers(data);
    });

    return () => {
      unsubMatches();
      unsubPreds();
      unsubUsers();
    };
  }, []);

  // Filter matches for the active tab
  const displayedMatches = matches.filter(m => m.round === activeTab);

  // --- ACTIONS MATCH ---
  const handleCreateMatch = async () => {
    const newMatch = {
      round: activeTab,
      teamA: 'Équipe A',
      teamB: 'Équipe B',
      scoreA: null,
      scoreB: null,
      status: 'A venir',
      date: '',
      createdAt: new Date()
    };
    try {
      await addDoc(collection(db, 'wc_matches'), newMatch);
    } catch (e) {
      alert("Erreur création match");
    }
  };

  const startEditing = (m) => {
    setEditingMatch(m);
    setTeamA(m.teamA || '');
    setTeamB(m.teamB || '');
    setScoreA(m.scoreA !== null ? m.scoreA : '');
    setScoreB(m.scoreB !== null ? m.scoreB : '');
    setStatus(m.status || 'A venir');
    setDate(m.date || '');
  };

  const handleSaveMatch = async (e) => {
    e.preventDefault();
    setIsSavingMatch(true);
    try {
      await setDoc(doc(db, 'wc_matches', editingMatch.id), {
        teamA,
        teamB,
        scoreA: scoreA !== '' ? parseInt(scoreA) : null,
        scoreB: scoreB !== '' ? parseInt(scoreB) : null,
        status,
        date
      }, { merge: true });
      setEditingMatch(null);
    } catch (err) {
      alert('Erreur de sauvegarde.');
    } finally {
      setIsSavingMatch(false);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (window.confirm("Supprimer ce match définitivement ?")) {
      await deleteDoc(doc(db, 'wc_matches', matchId));
    }
  };

  const handlePurgeMatches = async () => {
    if (window.confirm("Voulez-vous vraiment TOUT supprimer (matchs) ?")) {
      setIsDeletingAll(true);
      try {
        const q = query(collection(db, 'wc_matches'));
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.forEach(d => batch.delete(d.ref));
        await batch.commit();
      } catch (e) {
        alert("Erreur purge");
      }
      setIsDeletingAll(false);
    }
  };

  // --- ACTIONS USERS ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    setIsSavingUser(true);
    try {
      await addDoc(collection(db, 'wc_users'), { name: newUserName.trim() });
      setNewUserName('');
    } catch (err) {
      alert("Erreur d'ajout.");
    }
    setIsSavingUser(false);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Supprimer ce participant ?")) {
      await deleteDoc(doc(db, 'wc_users', userId));
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans overflow-x-hidden selection:bg-emerald-500/30 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 pt-8 pb-6 shadow-xl relative overflow-hidden sticky top-0 z-40">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="max-w-4xl mx-auto flex items-center justify-between relative z-10">
          <button onClick={() => navigate('/stpbb')} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors backdrop-blur-md">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full backdrop-blur-md">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tight">Pronostics 2026</h1>
          </div>
          <div className="w-10"></div> {/* Spacer */}
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-[#1e293b] sticky top-[88px] z-30 shadow-md border-b border-white/5">
        <div className="flex overflow-x-auto hide-scrollbar max-w-4xl mx-auto px-2 py-3 gap-2">
          {ROUNDS.map(round => (
            <button
              key={round.id}
              onClick={() => setActiveTab(round.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${
                activeTab === round.id 
                  ? 'bg-emerald-500 text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)]' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {round.name}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4 py-6 space-y-8 relative">
        
        {/* Purge Button (dev helper) */}
        {matches.length > 0 && (
          <div className="flex justify-end">
            <button onClick={handlePurgeMatches} disabled={isDeletingAll} className="text-xs flex items-center gap-1 text-rose-400/60 hover:text-rose-400 transition-colors bg-rose-500/10 px-3 py-1.5 rounded-full font-bold">
              <AlertTriangle size={12} /> {isDeletingAll ? 'Suppression...' : 'Supprimer TOUS les matchs'}
            </button>
          </div>
        )}

        {/* Section Participants */}
        <section className="bg-slate-800 border border-white/5 rounded-2xl p-5 shadow-lg">
          <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Users size={16} /> Participants ({users.length})
          </h2>
          
          <form onSubmit={handleAddUser} className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={newUserName} 
              onChange={e => setNewUserName(e.target.value)} 
              placeholder="Nouveau joueur..." 
              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500 outline-none text-sm"
            />
            <button type="submit" disabled={!newUserName.trim() || isSavingUser} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
              <Plus size={16} /> <span className="hidden sm:inline">Ajouter</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {users.map(u => (
              <div key={u.id} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                <span className="text-xs font-semibold">{u.name}</span>
                <button onClick={() => handleDeleteUser(u.id)} className="text-white/40 hover:text-rose-500 transition-colors">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Section Matchs */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
              <Trophy size={16} /> Matchs - {ROUNDS.find(r => r.id === activeTab)?.name}
            </h2>
            <button onClick={handleCreateMatch} className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1">
              <Plus size={14} /> Ajouter un match
            </button>
          </div>

          {displayedMatches.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center bg-slate-800/50 rounded-2xl border border-white/5 border-dashed">
              <p className="text-white/40 font-medium text-sm">Aucun match pour cette phase.</p>
              <button onClick={handleCreateMatch} className="mt-3 text-emerald-400 font-bold text-sm hover:underline">
                Créer le premier match
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedMatches.map(match => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  predictions={predictions.filter(p => p.matchId === match.id)}
                  onPredict={() => setSelectedMatch(match)}
                  onEdit={() => startEditing(match)}
                  onDelete={() => handleDeleteMatch(match.id)}
                />
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Editor Modal */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setEditingMatch(null)} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/5 rounded-full">
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold mb-6 text-emerald-400">Modifier le Match</h3>
            
            <form onSubmit={handleSaveMatch} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1 block">Équipe A</label>
                  <input type="text" value={teamA} onChange={e => setTeamA(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none" placeholder="Ex: France" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1 block">Équipe B</label>
                  <input type="text" value={teamB} onChange={e => setTeamB(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none" placeholder="Ex: Brésil" />
                </div>
              </div>

              <div className="flex gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="flex-1">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1 block">Score A</label>
                  <input type="number" value={scoreA} onChange={e => setScoreA(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white text-center font-black focus:border-emerald-500 outline-none" placeholder="-" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1 block">Score B</label>
                  <input type="number" value={scoreB} onChange={e => setScoreB(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white text-center font-black focus:border-emerald-500 outline-none" placeholder="-" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1 block">Statut</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none">
                  <option value="A venir">À venir</option>
                  <option value="En cours">En cours</option>
                  <option value="Termine">Terminé</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar size={12} /> Date / Heure (Optionnel)</label>
                <input type="text" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none" placeholder="Ex: 11 Juin 2026 - 21h00" />
              </div>

              <button type="submit" disabled={isSavingMatch} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 active:scale-95 shadow-lg">
                {isSavingMatch ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Mettre à jour
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Prediction Modal */}
      {selectedMatch && (
        <PredictionModal 
          match={selectedMatch} 
          onClose={() => setSelectedMatch(null)} 
        />
      )}
      
      {/* Global Styles for hiding scrollbar in tabs */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

// Simple standalone icon for users badge (X icon missing import in lucide above)
const X = ({size=24, className=""}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default WorldCupApp;
