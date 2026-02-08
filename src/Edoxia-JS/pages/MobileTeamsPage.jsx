import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Lock, FileText, Flag } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { ThemeContext } from '../../ThemeContext';

export default function Teams({ students: propStudents, teams: propTeams }) {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === 'dark';
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
            setStudents(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });

        const qTeams = query(collection(db, "teams"), orderBy("numId"));
        const unsubTeams = onSnapshot(qTeams, (snap) => {
            setTeams(snap.docs.map(d => ({id: d.id, ...d.data()})));
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
    
    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Chargement...</div>;

    return (
        <div className={`min-h-screen font-sans pb-20 transition-colors duration-300 ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-100 text-slate-900'}`}>
            <div className={`p-4 sticky top-0 z-20 shadow-md rounded-b-3xl ${isDark ? 'bg-slate-900 border-b border-slate-800' : 'bg-edoxia-blue text-white'}`}>
                <div className="flex items-center gap-3 mb-4"><button onClick={() => navigate('/JS2026')} className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white/20 hover:bg-white/30'}`}><ArrowLeft size={20} /></button><h1 className="text-lg font-bold">Consultation des Équipes</h1></div>
                <div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input type="text" placeholder="Rechercher un élève..." className={`w-full py-2.5 pl-10 pr-4 rounded-xl focus:outline-none shadow-sm ${isDark ? 'bg-slate-950 text-white placeholder-slate-600' : 'bg-white text-slate-800'}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div>
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
                        <div key={team.id} className={`rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`} style={{ borderLeft: `6px solid ${teamColor}` }}>
                            <button onClick={() => toggleTeam(team.numId)} className={`w-full p-4 flex justify-between items-center ${isDark ? 'active:bg-slate-800' : 'bg-white active:bg-slate-50'}`}>
                                <div><div className="flex items-center gap-2"><h3 className={`font-bold text-lg ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{team.name}</h3><span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400'}`}>{teamStudents.filter(s => !s.isAdult).length} élèves</span>{teamStudents.filter(s => s.isAdult).length > 0 && <span className="text-xs text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">{teamStudents.filter(s => s.isAdult).length} adu.</span>}{team.locked && <Lock size={14} className="text-slate-400"/>}</div><div className="flex gap-3 mt-1 text-xs">{paiCount > 0 && <span className="text-blue-600 font-bold flex items-center gap-1"><FileText size={12}/> {paiCount} PAI</span>}{disruptiveCount > 0 && <span className="text-red-500 font-bold flex items-center gap-1"><Flag size={12}/> {disruptiveCount} À surveiller</span>}</div></div>
                            </button>
                            {isOpen && (<div className={`border-t p-2 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50/50'}`}>{filteredStudents.length === 0 ? (<div className="text-center text-slate-400 py-4 italic text-sm">Aucun élève trouvé</div>) : (<div className="grid grid-cols-1 gap-2">{filteredStudents.map(student => {
                                const displayName = student.name && student.name.trim() ? student.name : `${student.lastName || ''} ${student.firstName || ''}`;
                                return (<div key={student.id} className={`p-3 rounded-xl border flex justify-between items-center shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${student.isAdult ? 'border-2 border-red-500' : ''}`}><div><div className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{searchTerm ? (<span>{displayName.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => part.toLowerCase() === searchTerm.toLowerCase() ? <span key={i} className="bg-yellow-200 text-black">{part}</span> : part)}</span>) : displayName}</div><div className="text-xs text-slate-500">{student.isAdult ? <span className="text-red-600 font-bold">{student.role}</span> : student.classLabel}</div></div><div className="flex gap-1">{!student.isAdult && student.pai && <div className="bg-blue-100 text-blue-700 p-1.5 rounded-full"><FileText size={16} /></div>}{!student.isAdult && student.disruptive && <div className="bg-red-100 text-red-700 p-1.5 rounded-full"><Flag size={16} /></div>}</div></div>);
                            })}</div>)}</div>)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
