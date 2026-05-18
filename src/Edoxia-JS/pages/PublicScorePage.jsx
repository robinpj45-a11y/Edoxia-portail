import React, { useState, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Trophy, Flag, ChevronDown, ChevronUp } from 'lucide-react';

export default function PublicScorePage() {
    const navigate = useNavigate();
    const context = useOutletContext();
    const teams = context?.teams || [];
    const scores = context?.scores || [];

    const [activeTab, setActiveTab] = useState('general'); // 'general' or 'spirit'
    const [expandedTeamId, setExpandedTeamId] = useState(null);

    // Calculate aggregated scores per team
    const teamStats = useMemo(() => {
        const stats = teams.map(team => {
            const teamScores = scores.filter(s => s.teamId === team.numId);
            const totalClassic = teamScores.reduce((sum, s) => sum + (s.classicScore || 0), 0);
            const totalSpirit = teamScores.reduce((sum, s) => sum + (s.spiritScore || 0), 0);
            const grandTotal = totalClassic + totalSpirit;

            return {
                ...team,
                teamScores,
                totalClassic,
                totalSpirit,
                grandTotal
            };
        });

        // Calculate Ranking for General
        const rankedGeneral = [...stats].sort((a, b) => {
            if (b.grandTotal !== a.grandTotal) return b.grandTotal - a.grandTotal;
            if (b.totalSpirit !== a.totalSpirit) return b.totalSpirit - a.totalSpirit;
            return Math.random() - 0.5; // Random tie-breaker
        });

        // Calculate Ranking for Spirit
        const rankedSpirit = [...stats].sort((a, b) => {
            if (b.totalSpirit !== a.totalSpirit) return b.totalSpirit - a.totalSpirit;
            return Math.random() - 0.5; // Random tie-breaker
        });

        return { rankedGeneral, rankedSpirit };
    }, [teams, scores]);

    const displayTeams = activeTab === 'general' ? teamStats.rankedGeneral : teamStats.rankedSpirit;

    const toggleExpand = (teamId) => {
        if (expandedTeamId === teamId) setExpandedTeamId(null);
        else setExpandedTeamId(teamId);
    };

    return (
        <div className="min-h-screen font-sans bg-brand-bg text-brand-text flex flex-col pb-20 transition-colors duration-300">
            {/* Header */}
            <div className="p-4 sticky top-0 z-20 shadow-soft rounded-b-[30px] bg-white/40 backdrop-blur-md border-b border-white/50 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/JS2026')} className="p-2 rounded-full transition-all bg-white/50 hover:bg-white text-brand-text/50 hover:text-brand-text shadow-sm active:scale-95">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-black tracking-tight flex items-center gap-2">Score <span className="text-yellow-500">en direct</span></h1>
                </div>

                <div className="flex gap-2 bg-black/5 p-1 rounded-full border border-black/5 mx-auto max-w-sm w-full">
                    <button 
                        onClick={() => setActiveTab('general')} 
                        className={`flex-1 py-2.5 px-4 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'general' ? 'bg-white text-yellow-500 shadow-sm scale-100' : 'text-brand-text/50 hover:text-brand-text'}`}
                    >
                        <Trophy size={16} /> Général
                    </button>
                    <button 
                        onClick={() => setActiveTab('spirit')} 
                        className={`flex-1 py-2.5 px-4 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'spirit' ? 'bg-white text-brand-teal shadow-sm scale-100' : 'text-brand-text/50 hover:text-brand-text'}`}
                    >
                        <Flag size={16} /> Fair-Play
                    </button>
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col max-w-2xl mx-auto w-full mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Podium */}
                {displayTeams.length >= 3 && (
                    <div className="flex justify-center items-end h-56 mb-12 gap-2 sm:gap-4 px-2 mt-6">
                        {/* 2nd Place */}
                        <div className="flex flex-col items-center w-1/3">
                            <div className="w-12 h-12 rounded-full border-4 border-slate-300 shadow-inner flex items-center justify-center bg-white z-10 -mb-4">
                                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: displayTeams[1].color || '#ccc' }}></span>
                            </div>
                            <div className="bg-slate-200/80 backdrop-blur-sm w-full rounded-t-[20px] shadow-soft border border-white/50 p-2 text-center h-32 flex flex-col justify-between pt-6 pb-3">
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-black text-xl text-slate-500">2</span>
                                    <span className="text-[10px] font-black uppercase truncate max-w-full text-slate-600 block px-1">{displayTeams[1].name}</span>
                                </div>
                                <span className="font-black text-brand-text text-sm shrink-0">{activeTab === 'general' ? displayTeams[1].grandTotal : displayTeams[1].totalSpirit} pts</span>
                            </div>
                        </div>

                        {/* 1st Place */}
                        <div className="flex flex-col items-center w-1/3">
                            <Trophy className="text-yellow-500 w-10 h-10 drop-shadow-md mb-1 shrink-0" />
                            <div className="w-14 h-14 rounded-full border-4 border-yellow-400 shadow-inner flex items-center justify-center bg-white z-10 -mb-5">
                                <span className="w-5 h-5 rounded-full" style={{ backgroundColor: displayTeams[0].color || '#ccc' }}></span>
                            </div>
                            <div className="bg-yellow-100/80 backdrop-blur-sm w-full rounded-t-[20px] shadow-soft border border-white/50 p-2 text-center h-40 flex flex-col justify-between pt-8 pb-3">
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-black text-2xl text-yellow-600">1</span>
                                    <span className="text-xs font-black uppercase truncate max-w-full text-yellow-700 block px-1">{displayTeams[0].name}</span>
                                </div>
                                <span className="font-black text-brand-text text-base shrink-0">{activeTab === 'general' ? displayTeams[0].grandTotal : displayTeams[0].totalSpirit} pts</span>
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="flex flex-col items-center w-1/3">
                            <div className="w-12 h-12 rounded-full border-4 border-amber-600 shadow-inner flex items-center justify-center bg-white z-10 -mb-4">
                                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: displayTeams[2].color || '#ccc' }}></span>
                            </div>
                            <div className="bg-amber-100/80 backdrop-blur-sm w-full rounded-t-[20px] shadow-soft border border-white/50 p-2 text-center h-28 flex flex-col justify-between pt-6 pb-3">
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-black text-xl text-amber-700">3</span>
                                    <span className="text-[10px] font-black uppercase truncate max-w-full text-amber-800 block px-1">{displayTeams[2].name}</span>
                                </div>
                                <span className="font-black text-brand-text text-sm shrink-0">{activeTab === 'general' ? displayTeams[2].grandTotal : displayTeams[2].totalSpirit} pts</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* List of all teams */}
                <div className="space-y-3">
                    {displayTeams.map((team, index) => {
                        const isExpanded = expandedTeamId === team.id;
                        const scoreToDisplay = activeTab === 'general' ? team.grandTotal : team.totalSpirit;

                        return (
                            <div key={team.id} className="bg-white/60 backdrop-blur-md rounded-[24px] shadow-sm border border-white/80 overflow-hidden transition-all">
                                <div 
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/40 transition-colors"
                                    onClick={() => toggleExpand(team.id)}
                                >
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-brand-text/50 bg-black/5 text-sm shrink-0">
                                            {index + 1}
                                        </div>
                                        <div className="w-4 h-4 rounded-full shadow-inner shrink-0" style={{ backgroundColor: team.color || '#ccc' }}></div>
                                        <span className="font-black text-brand-text text-base md:text-lg truncate">{team.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                        <span className="font-black text-xl text-brand-text">{scoreToDisplay}</span>
                                        <div className="text-brand-text/30">
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>
                                </div>

                                {/* Accordion Content (Details per activity) */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 bg-white/40 border-t border-black/5 animate-in slide-in-from-top-2">
                                        {team.teamScores.length === 0 ? (
                                            <div className="text-center py-4 text-[10px] font-bold uppercase tracking-widest text-brand-text/40">
                                                Aucun score enregistré
                                            </div>
                                        ) : (
                                            <div className="space-y-2 mt-4">
                                                {team.teamScores.map(score => (
                                                    <div key={score.id} className="flex justify-between items-center bg-white p-3 rounded-[16px] shadow-sm border border-black/5">
                                                        <span className="font-bold text-sm text-brand-text truncate pr-2">{score.activity}</span>
                                                        <div className="flex gap-2 shrink-0">
                                                            <span className="bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1">
                                                                <Trophy size={12} /> {score.classicScore}
                                                            </span>
                                                            <span className="bg-brand-teal/10 text-brand-teal px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1">
                                                                <Flag size={12} /> {score.spiritScore}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
