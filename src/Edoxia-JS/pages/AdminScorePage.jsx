import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Trophy, ClipboardList, Plus, Save, History, Flag } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

export default function AdminScorePage() {
    const navigate = useNavigate();
    const context = useOutletContext();
    const teams = (context?.teams || []).filter(t => t.name !== "Anna");
    const scheduleActivities = context?.scheduleActivities || [];
    const authRole = context?.authRole;

    // Protection
    useEffect(() => {
        if (authRole !== 'Ecole' && authRole !== 'Formasat') {
            navigate('/JS2026');
        }
    }, [authRole, navigate]);

    const [activeTab, setActiveTab] = useState('add'); // 'add' or 'history'
    
    // Add Score State
    const [selectedActivity, setSelectedActivity] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('');
    const [classicScore, setClassicScore] = useState('');
    const [spiritScore, setSpiritScore] = useState('');
    const [adminName, setAdminName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // History State
    const [scoreHistory, setScoreHistory] = useState([]);

    // Fetch history
    useEffect(() => {
        const q = query(collection(db, "scores"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setScoreHistory(list);
        });
        return () => unsub();
    }, []);

    const handleAddScore = async (e) => {
        e.preventDefault();
        if (!selectedActivity || !selectedTeam || classicScore === '' || spiritScore === '' || !adminName.trim()) {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "scores"), {
                activity: selectedActivity,
                teamId: parseInt(selectedTeam), // Assuming team numId is number
                classicScore: parseInt(classicScore) || 0,
                spiritScore: parseInt(spiritScore) || 0,
                adminName: adminName.trim(),
                createdAt: serverTimestamp()
            });
            alert("Score ajouté avec succès !");
            setSelectedActivity('');
            setSelectedTeam('');
            setClassicScore('');
            setSpiritScore('');
            setAdminName('');
            setActiveTab('history');
        } catch (error) {
            console.error("Erreur lors de l'ajout du score :", error);
            alert("Erreur lors de l'ajout du score.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTeamInfo = (teamId) => {
        return teams.find(t => t.numId === teamId) || { name: `Équipe inconnue (${teamId})`, color: '#ccc' };
    };

    return (
        <div className="min-h-screen font-sans bg-brand-bg text-brand-text flex flex-col pb-20 transition-colors duration-300">
            {/* Header */}
            <div className="p-4 sticky top-0 z-20 shadow-soft rounded-b-[30px] bg-white/40 backdrop-blur-md border-b border-white/50 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/JS2026')} className="p-2 rounded-full transition-all bg-white/50 hover:bg-white text-brand-text/50 hover:text-brand-text shadow-sm active:scale-95">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-black tracking-tight flex items-center gap-2">Administration <span className="text-indigo-500">Scores</span></h1>
                </div>

                <div className="flex gap-2 bg-black/5 p-1 rounded-full border border-black/5 mx-auto max-w-sm w-full">
                    <button 
                        onClick={() => setActiveTab('add')} 
                        className={`flex-1 py-2.5 px-4 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'add' ? 'bg-white text-indigo-500 shadow-sm scale-100' : 'text-brand-text/50 hover:text-brand-text'}`}
                    >
                        <Plus size={16} /> Ajouter
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')} 
                        className={`flex-1 py-2.5 px-4 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-white text-indigo-500 shadow-sm scale-100' : 'text-brand-text/50 hover:text-brand-text'}`}
                    >
                        <History size={16} /> Historique
                    </button>
                </div>
            </div>

            <div className="p-6 max-w-2xl mx-auto w-full flex-1 mt-4">
                {activeTab === 'add' && (
                    <div className="bg-white/60 backdrop-blur-md p-6 sm:p-8 rounded-[30px] shadow-soft border border-white/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="w-16 h-16 rounded-[20px] bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-6 shadow-inner">
                            <Trophy size={32} />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight mb-2 text-brand-text">Nouveau Score</h2>
                        <p className="text-sm font-bold text-brand-text/50 mb-8 uppercase tracking-widest">Saisie des points pour une équipe</p>

                        <form onSubmit={handleAddScore} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-brand-text/60 ml-2">Activité</label>
                                <select 
                                    value={selectedActivity} 
                                    onChange={(e) => setSelectedActivity(e.target.value)}
                                    className="w-full p-4 rounded-[20px] border border-white bg-white/80 font-bold text-brand-text focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                    required
                                >
                                    <option value="">Sélectionner l'activité...</option>
                                    {scheduleActivities.map(act => (
                                        <option key={act.id} value={act.name}>{act.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-brand-text/60 ml-2">Équipe</label>
                                <select 
                                    value={selectedTeam} 
                                    onChange={(e) => setSelectedTeam(e.target.value)}
                                    className="w-full p-4 rounded-[20px] border border-white bg-white/80 font-bold text-brand-text focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                    required
                                >
                                    <option value="">Sélectionner l'équipe...</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.numId}>{team.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-text/60 ml-2">Score Classique</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={classicScore} 
                                            onChange={(e) => setClassicScore(e.target.value)}
                                            placeholder="0"
                                            className="w-full p-4 pl-12 rounded-[20px] border border-white bg-white/80 font-black text-xl text-brand-text focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                            required
                                        />
                                        <Trophy size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/30" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-text/60 ml-2">Esprit d'équipe</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={spiritScore} 
                                            onChange={(e) => setSpiritScore(e.target.value)}
                                            placeholder="0"
                                            className="w-full p-4 pl-12 rounded-[20px] border border-white bg-white/80 font-black text-xl text-brand-text focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                            required
                                        />
                                        <Flag size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/30" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-brand-text/60 ml-2">Votre Prénom</label>
                                <input 
                                    type="text" 
                                    value={adminName} 
                                    onChange={(e) => setAdminName(e.target.value)}
                                    placeholder="Ex: Jean"
                                    className="w-full p-4 rounded-[20px] border border-white bg-white/80 font-bold text-brand-text focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full py-4 mt-4 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-full shadow-soft hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                <Save size={20} />
                                {isSubmitting ? "Enregistrement..." : "Enregistrer le score"}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {scoreHistory.length === 0 ? (
                            <div className="text-center py-12 text-brand-text/40 font-bold uppercase tracking-widest text-xs">
                                Aucun score enregistré.
                            </div>
                        ) : (
                            scoreHistory.map(score => {
                                const teamInfo = getTeamInfo(score.teamId);
                                const dateStr = score.createdAt?.toDate ? score.createdAt.toDate().toLocaleString('fr-FR', {
                                    day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'
                                }) : 'À l\'instant';

                                return (
                                    <div key={score.id} className="bg-white rounded-[24px] p-4 shadow-sm border border-black/5 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: teamInfo.color }}></div>
                                                <span className="font-black text-brand-text truncate max-w-[150px] sm:max-w-[200px]">{teamInfo.name}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-brand-text/40 uppercase tracking-widest">{dateStr}</span>
                                        </div>
                                        
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-bold text-brand-text">{score.activity}</span>
                                            <span className="text-[10px] font-bold text-brand-text/50 uppercase tracking-widest">Saisi par {score.adminName}</span>
                                        </div>

                                        <div className="flex gap-2 mt-1">
                                            <div className="flex-1 bg-black/5 p-3 rounded-[16px] border border-black/5 flex items-center justify-between">
                                                <span className="text-xs font-bold uppercase tracking-widest text-brand-text/60">Classique</span>
                                                <span className="font-black text-lg text-brand-text">{score.classicScore}</span>
                                            </div>
                                            <div className="flex-1 bg-black/5 p-3 rounded-[16px] border border-black/5 flex items-center justify-between">
                                                <span className="text-xs font-bold uppercase tracking-widest text-brand-text/60">Esprit</span>
                                                <span className="font-black text-lg text-brand-text">{score.spiritScore}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
