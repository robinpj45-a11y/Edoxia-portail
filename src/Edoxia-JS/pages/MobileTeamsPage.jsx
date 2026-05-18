import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import { ArrowLeft, Lock, FileText, Flag, Users, Calendar, User, Search } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { ThemeContext } from '../../ThemeContext';
import { CLASSES } from '../utils/constants';

export default function Teams() {
    const navigate = useNavigate();
    const location = useLocation();
    const context = useOutletContext();
    const students = context?.students || [];
    const teams = context?.teams || [];
    const scheduleSlots = context?.scheduleSlots || [];
    const loading = context?.loading;

    const [selectedTeamId, setSelectedTeamId] = useState(location.state?.fromTeamId !== undefined ? location.state.fromTeamId : null);
    const [tab, setTab] = useState('dashboard');

    const getTeamStudents = (teamId) => {
        return students.filter(s => s.team === teamId).sort((a, b) => {
            const classIndexA = CLASSES.indexOf(a.importedClassLabel || a.classLabel);
            const classIndexB = CLASSES.indexOf(b.importedClassLabel || b.classLabel);
            const idxA = classIndexA === -1 ? 999 : classIndexA;
            const idxB = classIndexB === -1 ? 999 : classIndexB;
            if (idxA !== idxB) return idxA - idxB;

            const nameA = a.name && a.name.trim() ? a.name : `${a.lastName || ''} ${a.firstName || ''}`;
            const nameB = b.name && b.name.trim() ? b.name : `${b.lastName || ''} ${b.firstName || ''}`;
            return nameA.localeCompare(nameB);
        });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-brand-text/50 font-bold tracking-wide">Chargement...</div>;

    if (selectedTeamId) {
        const team = teams.find(t => t.numId === selectedTeamId);
        const teamStudents = getTeamStudents(team.numId);
        const paiCount = teamStudents.filter(s => s.pai && !s.isAdult).length;
        const disruptiveCount = teamStudents.filter(s => s.disruptive && !s.isAdult).length;
        const boysCount = teamStudents.filter(s => s.gender && s.gender.toString().trim().toUpperCase() === 'M').length;
        const girlsCount = teamStudents.filter(s => s.gender && s.gender.toString().trim().toUpperCase() === 'F').length;
        const teamColor = team.color || '#0077b6';

        return (
            <div className="min-h-screen font-sans pb-28 transition-colors duration-300 bg-brand-bg text-brand-text">
                <div className="p-4 sticky top-0 z-20 shadow-soft bg-white/80 backdrop-blur-md border-b border-white/50" style={{ borderBottom: `4px solid ${teamColor}` }}>
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: teamColor }}></div>
                        <h1 className="text-2xl font-black tracking-tight drop-shadow-sm truncate">{team.name}</h1>
                    </div>
                </div>

                {tab === 'dashboard' && (
                    <div className="p-4 mt-2 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-px bg-white border-b border-brand-text/5"></div>
                            <h2 className="text-[10px] font-black text-brand-text/40 text-center uppercase tracking-widest drop-shadow-sm">Vue d'ensemble</h2>
                            <div className="flex-1 h-px bg-white border-b border-brand-text/5"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto w-full">
                            <div className="bg-white py-4 px-2 rounded-[20px] shadow-soft border border-white/50 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-brand-teal drop-shadow-sm leading-none">{teamStudents.filter(s => !s.isAdult).length}</span>
                                <span className="text-[9px] uppercase font-bold text-brand-text/40 mt-2 tracking-widest">Élèves</span>
                            </div>
                            <div className="bg-white py-4 px-2 rounded-[20px] shadow-soft border border-white/50 flex flex-col items-center justify-center gap-2">
                                <div className="flex items-center gap-2 text-blue-500 font-black text-lg leading-none"><User size={18} strokeWidth={3} /> {boysCount}</div>
                                <div className="w-10 h-[2px] bg-black/5 rounded-full"></div>
                                <div className="flex items-center gap-2 text-pink-500 font-black text-lg leading-none"><User size={18} strokeWidth={3} /> {girlsCount}</div>
                            </div>
                            <div className="bg-white py-4 px-2 rounded-[20px] shadow-soft border border-white/50 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-brand-peach drop-shadow-sm leading-none">{paiCount}</span>
                                <span className="text-[9px] uppercase font-bold text-brand-text/40 mt-2 tracking-widest text-center leading-tight">PAI déclarés</span>
                            </div>
                            <div className="bg-white py-4 px-2 rounded-[20px] shadow-soft border border-white/50 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-brand-coral drop-shadow-sm leading-none">{disruptiveCount}</span>
                                <span className="text-[9px] uppercase font-bold text-brand-text/40 mt-2 tracking-widest text-center leading-tight">À surveiller</span>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'team' && (
                    <div className="p-4 space-y-2 mt-2 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {teamStudents.map(student => {
                            const displayName = student.name && student.name.trim() ? student.name : `${student.lastName || ''} ${student.firstName || ''}`;
                            return (
                                <div key={student.id} className={`p-3 rounded-[16px] border flex justify-between items-center shadow-sm bg-white border-white/80 ${student.isAdult ? 'border-2 border-brand-coral/50 bg-brand-coral/5' : ''}`}>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="font-bold text-base text-brand-text truncate leading-tight">{displayName}</div>
                                        <div className="text-[10px] uppercase text-brand-text/50 font-black mt-0.5 tracking-wide truncate">{student.isAdult ? <span className="text-brand-coral">{student.role} • {student.importedClassLabel || student.classLabel}</span> : (student.importedClassLabel || student.classLabel)}</div>
                                    </div>
                                    <div className="flex gap-1.5 shrink-0">
                                        {!student.isAdult && student.pai && <div className="bg-brand-teal/20 text-brand-teal p-1.5 rounded-full shadow-inner"><FileText size={16} /></div>}
                                        {!student.isAdult && student.disruptive && <div className="bg-brand-coral/20 text-brand-coral p-1.5 rounded-full shadow-inner"><Flag size={16} /></div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {tab === 'pai' && (
                    <div className="p-4 space-y-3 mt-2 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {students.filter(s => s.team === selectedTeamId && s.pai && !s.isAdult).length === 0 && (
                            <div className="text-center text-brand-text/40 font-bold py-12 uppercase tracking-widest text-xs border-2 border-dashed border-white/50 rounded-[20px] bg-black/5">Aucun élève avec PAI</div>
                        )}
                        {students.filter(s => s.team === selectedTeamId && s.pai && !s.isAdult).map(s => {
                            const displayName = s.name && s.name.trim() ? s.name : `${s.lastName || ''} ${s.firstName || ''}`;
                            return (
                                <div key={s.id} className="bg-white rounded-[20px] p-4 shadow-sm border border-white/80 flex flex-col gap-3">
                                    <div className="font-bold text-brand-text flex justify-between items-center text-base">
                                        <span className="truncate pr-2 border-l-4 border-brand-teal pl-2 leading-tight">{displayName}</span>
                                        <span className="shrink-0 text-[9px] font-black uppercase tracking-widest bg-black/5 px-2 py-1 rounded-full text-brand-text/50 shadow-inner border border-black/5">{s.importedClassLabel || s.classLabel}</span>
                                    </div>
                                    <div className="bg-brand-bg border border-white/50 text-brand-text/70 p-3 rounded-[12px] text-xs whitespace-pre-wrap shadow-inner font-medium leading-relaxed italic">
                                        {s.paiComment && s.paiComment.trim() !== "" ? s.paiComment : <span className="opacity-40">Aucun protocole médical ou commentaire spécifique n'a été renseigné pour ce PAI.</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {tab === 'prog' && (
                    <div className="p-4 space-y-4 mt-2 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {scheduleSlots.length === 0 ? (
                            <div className="text-center text-brand-text/40 font-bold py-12 uppercase tracking-widest text-xs border-2 border-dashed border-white/50 rounded-[20px] bg-black/5">Le programme n'a pas encore été défini.</div>
                        ) : (
                            <div className="relative border-l-2 border-brand-teal/30 ml-4 space-y-8 py-4">
                                {scheduleSlots.map((slot, index) => {
                                    const activity = team.schedule?.[slot.id] || "Activité libre";
                                    return (
                                        <div key={slot.id} className="relative pl-6">
                                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-brand-teal border-4 border-brand-bg shadow-sm"></div>
                                            <div className="bg-white rounded-[20px] p-4 shadow-sm border border-white/80 flex flex-col gap-2">
                                                <div className="flex justify-between items-start">
                                                    <div className="font-black text-brand-teal text-lg leading-none">{slot.startTime}</div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest bg-brand-teal/10 text-brand-teal px-2 py-1 rounded-full">{slot.endTime}</div>
                                                </div>
                                                {slot.label && <div className="text-[10px] uppercase font-bold text-brand-text/50 tracking-widest">{slot.label}</div>}
                                                <div className="font-bold text-brand-text text-lg mt-1">{activity}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white/90 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)] border-t border-black/5 flex justify-around items-center px-4 pb-safe z-50 rounded-t-[40px]">
                    <button onClick={() => { if(tab === 'dashboard') setSelectedTeamId(null); else setTab('dashboard'); }} className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl gap-1.5 transition-all ${tab === 'dashboard' ? 'bg-brand-bg shadow-inner scale-105' : 'hover:bg-black/5'}`}>
                        <ArrowLeft size={24} strokeWidth={2.5} className={tab === 'dashboard' ? 'text-brand-text/40' : 'text-brand-text/60'} />
                        <span className={`text-[8px] uppercase font-black tracking-widest ${tab === 'dashboard' ? 'text-brand-text/30' : 'text-brand-text/50'}`}>Retour</span>
                    </button>
                    
                    <button onClick={() => setTab('team')} className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl gap-1.5 transition-all ${tab === 'team' ? 'bg-brand-teal/10 text-brand-teal shadow-inner scale-105' : 'text-brand-text/60 hover:bg-black/5'}`}>
                        <Users size={24} strokeWidth={2.5} />
                        <span className="text-[8px] uppercase font-black tracking-widest">Équipe</span>
                    </button>

                    <button onClick={() => setTab('pai')} className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl gap-1.5 transition-all ${tab === 'pai' ? 'bg-brand-peach/20 text-brand-peach shadow-inner scale-105' : 'text-brand-text/60 hover:bg-black/5'}`}>
                        <FileText size={24} strokeWidth={2.5} />
                        <span className="text-[8px] uppercase font-black tracking-widest">Les PAI</span>
                    </button>

                    <button onClick={() => setTab('prog')} className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl gap-1.5 transition-all ${tab === 'prog' ? 'bg-brand-teal/10 text-brand-teal shadow-inner scale-105' : 'text-brand-text/60 hover:bg-black/5'}`}>
                        <Calendar size={24} strokeWidth={2.5} />
                        <span className="text-[8px] uppercase font-black tracking-widest">Prog.</span>
                    </button>

                    <button onClick={() => navigate('/JS2026/search', { state: { fromTeamId: selectedTeamId } })} className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl gap-1.5 transition-all text-brand-text/60 hover:bg-black/5">
                        <Search size={24} strokeWidth={2.5} />
                        <span className="text-[8px] uppercase font-black tracking-widest text-[9px] relative">Élèves</span>
                    </button>
                </nav>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans pb-20 transition-colors duration-300 bg-brand-bg text-brand-text">
            <div className="p-4 sticky top-0 z-20 shadow-soft rounded-b-[30px] bg-white/40 backdrop-blur-md border-b border-white/50">
                <div className="flex items-center gap-3"><button onClick={() => navigate('/JS2026')} className="p-2 rounded-full transition-all bg-white/50 hover:bg-white text-brand-text/50 hover:text-brand-text shadow-sm active:scale-95"><ArrowLeft size={20} /></button><h1 className="text-xl font-black tracking-tight flex items-center gap-2">Consultation <span className="text-brand-teal">Équipes</span></h1></div>
            </div>
            <div className="p-6 grid grid-cols-3 gap-4 mt-4">
                {teams.map(team => {
                    const teamColor = team.color || '#0077b6';
                    return (
                        <button key={team.id} onClick={() => { setSelectedTeamId(team.numId); setTab('dashboard'); }} className="w-full aspect-square rounded-[24px] shadow-sm overflow-hidden transition-all duration-300 border border-white/30 flex flex-col justify-center items-center hover:scale-105 active:scale-95 relative group" style={{ backgroundColor: teamColor }}>
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                            <h3 className="font-black text-xl tracking-tighter text-white z-10 text-center drop-shadow-md px-1 leading-none break-all">{team.name}</h3>
                            {team.locked && <Lock size={12} className="text-white/60 absolute bottom-3" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
