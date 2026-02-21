import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Lock, FileText, Flag } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { ThemeContext } from '../../ThemeContext';

export default function Teams({ students: propStudents, teams: propTeams }) {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [openTeams, setOpenTeams] = useState({});

    const [students, setStudents] = useState(propStudents || []);
    const [teams, setTeams] = useState(propTeams || []);
    const [loading, setLoading] = useState(!propStudents || !propTeams);

    useEffect(() => {
        if (propStudents && propTeams) {
            setStudents(propStudents);
            setTeams(propTeams);
            setLoading(false);
            return;
        }

        const unsubStudents = onSnapshot(collection(db, "students"), (snap) => {
            setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const qTeams = query(collection(db, "teams"), orderBy("numId"));
        const unsubTeams = onSnapshot(qTeams, (snap) => {
            setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });

        return () => {
            unsubStudents();
            unsubTeams();
        };
    }, [propStudents, propTeams]);

    const toggleTeam = (teamId) => { setOpenTeams(prev => ({ ...prev, [teamId]: !prev[teamId] })); };
    const getFilteredStudents = (teamId) => {
        return students.filter(s => {
            const displayName = s.name && s.name.trim() ? s.name : `${s.lastName || ''} ${s.firstName || ''}`;
            return s.team === teamId && displayName.toLowerCase().includes(searchTerm.toLowerCase());
        }).sort((a, b) => {
            const nameA = a.name && a.name.trim() ? a.name : `${a.lastName || ''} ${a.firstName || ''}`;
            const nameB = b.name && b.name.trim() ? b.name : `${b.lastName || ''} ${b.firstName || ''}`;
            return nameA.localeCompare(nameB);
        });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-brand-text/50 font-bold tracking-wide">Chargement...</div>;

    return (
        <div className="min-h-screen font-sans pb-20 transition-colors duration-300 bg-brand-bg text-brand-text">
            <div className="p-4 sticky top-0 z-20 shadow-soft rounded-b-[30px] bg-white/40 backdrop-blur-md border-b border-white/50">
                <div className="flex items-center gap-3 mb-4"><button onClick={() => navigate('/JS2026')} className="p-2 rounded-full transition-all bg-white/50 hover:bg-white text-brand-text/50 hover:text-brand-text shadow-sm active:scale-95"><ArrowLeft size={20} /></button><h1 className="text-xl font-black tracking-tight flex items-center gap-2">Consultation <span className="text-brand-teal">Équipes</span></h1></div>
                <div className="relative"><Search className="absolute left-4 top-3.5 text-brand-text/40" size={18} /><input type="text" placeholder="Rechercher un élève..." className="w-full py-3 l-12 pr-4 rounded-[20px] focus:outline-none shadow-inner bg-white/60 border border-white/50 text-brand-text placeholder-brand-text/40 focus:bg-white focus:ring-2 focus:ring-brand-teal transition-all font-medium pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            </div>
            <div className="p-4 space-y-4 mt-2">
                {teams.map(team => {
                    const teamStudents = students.filter(s => s.team === team.numId);
                    const filteredStudents = getFilteredStudents(team.numId);
                    const hasMatch = searchTerm && filteredStudents.length > 0;
                    const isOpen = hasMatch || openTeams[team.numId];
                    if (searchTerm && !hasMatch) return null;
                    const paiCount = teamStudents.filter(s => s.pai).length;
                    const disruptiveCount = teamStudents.filter(s => s.disruptive).length;
                    const teamColor = team.color || '#0077b6';
                    return (
                        <div key={team.id} className="rounded-[24px] shadow-soft overflow-hidden transition-all duration-300 bg-white/80 backdrop-blur-md border border-white/50" style={{ borderLeft: `6px solid ${teamColor}` }}>
                            <button onClick={() => toggleTeam(team.numId)} className="w-full p-4 flex justify-between items-center hover:bg-white/50 active:bg-white/30 transition-colors">
                                <div><div className="flex items-center gap-2"><h3 className="font-black text-lg tracking-tight text-brand-text">{team.name}</h3><span className="text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full bg-black/5 text-brand-text/60 shadow-inner">{teamStudents.filter(s => !s.isAdult).length} élèves</span>{teamStudents.filter(s => s.isAdult).length > 0 && <span className="text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full bg-brand-coral/20 text-brand-coral shadow-inner border border-brand-coral/30">{teamStudents.filter(s => s.isAdult).length} adu.</span>}{team.locked && <Lock size={14} className="text-brand-text/40" />}</div><div className="flex gap-3 mt-1 text-xs">{paiCount > 0 && <span className="text-brand-teal font-bold flex items-center gap-1"><FileText size={12} /> {paiCount} PAI</span>}{disruptiveCount > 0 && <span className="text-brand-coral font-bold flex items-center gap-1"><Flag size={12} /> {disruptiveCount} À surveiller</span>}</div></div>
                            </button>
                            {isOpen && (<div className="border-t p-3 border-white/40 bg-black/5 shadow-inner">{filteredStudents.length === 0 ? (<div className="text-center text-brand-text/40 py-4 font-bold text-sm tracking-wide">Aucun élève trouvé</div>) : (<div className="grid grid-cols-1 gap-2">{filteredStudents.map(student => {
                                const displayName = student.name && student.name.trim() ? student.name : `${student.lastName || ''} ${student.firstName || ''}`;
                                return (<div key={student.id} className={`p-3 rounded-[16px] border flex justify-between items-center shadow-sm bg-white/70 border-white/80 backdrop-blur-sm ${student.isAdult ? 'border-2 border-brand-coral' : ''}`}><div><div className="font-bold text-brand-text">{searchTerm ? (<span>{displayName.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => part.toLowerCase() === searchTerm.toLowerCase() ? <span key={i} className="bg-brand-peach/40 text-brand-text px-1 rounded">{part}</span> : part)}</span>) : displayName}</div><div className="text-xs text-brand-text/60 font-medium mt-0.5">{student.isAdult ? <span className="text-brand-coral font-bold">{student.role}</span> : student.classLabel}</div></div><div className="flex gap-1">{!student.isAdult && student.pai && <div className="bg-brand-teal/20 text-brand-teal p-1.5 rounded-full shadow-inner"><FileText size={16} /></div>}{!student.isAdult && student.disruptive && <div className="bg-brand-coral/20 text-brand-coral p-1.5 rounded-full shadow-inner"><Flag size={16} /></div>}</div></div>);
                            })}</div>)}</div>)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
