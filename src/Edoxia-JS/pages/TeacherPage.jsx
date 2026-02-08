import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Printer, Plus, Search, Lock, Eye, FileText, Flag, User, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addDoc, updateDoc, deleteDoc, doc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { CLASSES } from '../utils/constants';
import { ThemeContext } from '../../ThemeContext';

const generateClassPDF = (classLabel, students, teams) => {
    const doc = new jsPDF();
    const classStudents = students.filter(s => s.classLabel === classLabel && !s.isAdult);
    classStudents.sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));

    doc.setFontSize(18);
    doc.setTextColor(0, 119, 182); 
    doc.text(`Classe : ${classLabel}`, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Effectif : ${classStudents.length} élèves`, 14, 28);

    const tableData = classStudents.map(s => {
        let lastName = s.lastName ? s.lastName.toUpperCase() : s.name.split(' ')[0].toUpperCase();
        let firstName = s.firstName ? s.firstName : s.name.split(' ').slice(1).join(' ');
        const teamName = s.team ? (teams.find(t => t.numId === s.team)?.name || `Équipe ${s.team}`) : "Non placé";
        return [lastName, firstName, teamName];
    });

    autoTable(doc, {
        startY: 35,
        head: [['Nom', 'Prénom', 'Équipe']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0, 119, 182] },
    });
    doc.save(`${classLabel}_PDF.pdf`);
};

export default function TeacherPage({ students: propStudents, teams: propTeams, loading: propLoading }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [currentClass, setCurrentClass] = useState(CLASSES[0]);
  const [teamsVisibility, setTeamsVisibility] = useState({});
  const [newAdultName, setNewAdultName] = useState("");
  const [newAdultRole, setNewAdultRole] = useState("Parent");
  const [searchTerm, setSearchTerm] = useState("");
  const [comment, setComment] = useState("");

  const [students, setStudents] = useState(propStudents || []);
  const [teams, setTeams] = useState(propTeams || []);
  const [loading, setLoading] = useState(propLoading !== undefined ? propLoading : (!propStudents || !propTeams));

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

  useEffect(() => { setSearchTerm(""); }, [currentClass]);

  const handleAddAdult = async (e) => { 
      e.preventDefault(); 
      if (!newAdultName.trim()) return; 
      const parts = newAdultName.trim().split(' ');
      const lastName = parts[0].toUpperCase();
      const firstName = parts.slice(1).join(' ');
      try { 
          await addDoc(collection(db, "students"), { 
              name: newAdultName, lastName, firstName, classLabel: currentClass, team: null, pai: false, disruptive: false, gender: "", isAdult: true, role: newAdultRole, createdAt: new Date() 
          }); 
          setNewAdultName(""); 
      } catch (error) { console.error(error); } 
  };

  const toggleAttribute = async (id, attribute) => {
    const student = students.find(s => s.id === id);
    if (!student) return;
    if (student.team) {
        const team = teams.find(t => t.numId === student.team);
        if (team && team.locked) { alert("Impossible de modifier un élève dans une équipe verrouillée."); return; }
    }
    await updateDoc(doc(db, "students", id), { [attribute]: !student[attribute] });
  };

  const handleDeleteStudent = async (id) => {
    const student = students.find(s => s.id === id);
    if (student.team) {
        const team = teams.find(t => t.numId === student.team);
        if (team && team.locked) { alert("Impossible de supprimer un élève d'une équipe verrouillée."); return; }
    }
    if(confirm("Attention : cela supprimera définitivement l'élève de la classe (et non seulement de l'équipe). Continuer ?")) await deleteDoc(doc(db, "students", id));
  };

  const handleDragStart = (e, studentId) => e.dataTransfer.setData("studentId", studentId);
  const handleDrop = async (e, teamId) => {
    e.preventDefault();
    const studentId = e.dataTransfer.getData("studentId");
    if (teamId !== null) {
        const targetTeam = teams.find(t => t.numId === teamId);
        if (targetTeam && targetTeam.locked) { alert(`L'équipe "${targetTeam.name}" est verrouillée 🔒.`); return; }
    }
    const student = students.find(s => s.id === studentId);
    if (student && student.team) {
        const sourceTeam = teams.find(t => t.numId === student.team);
        if (sourceTeam && sourceTeam.locked) { alert(`L'équipe d'origine "${sourceTeam.name}" est verrouillée 🔒.`); return; }
    }
    await updateDoc(doc(db, "students", studentId), { team: teamId });
  };

  const toggleVisibility = (teamId) => { setTeamsVisibility(prev => ({ ...prev, [teamId]: !prev[teamId] })); };

  const poolStudents = students
    .filter(s => s.classLabel === currentClass && s.team === null && s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Chargement...</div>;

  return (
    <div className={`flex flex-col font-sans h-full transition-colors duration-300 ${isDark ? 'bg-[#020617] text-slate-300' : 'bg-edoxia-bg text-slate-700'}`}>
      <header className={`border-b p-4 px-8 flex justify-between items-center shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
        <button onClick={() => navigate('/JS2026')} className={`flex items-center gap-2 transition-colors font-medium ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-edoxia-blue'}`}><ArrowLeft size={20} /> Retour</button>
        <h1 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-cyan-400' : 'text-edoxia-blue'}`}><GraduationCap /> Espace enseignant</h1>
      </header>
      <div className={`px-8 mt-6 border-b-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide ${isDark ? 'border-slate-800 bg-[#020617]' : 'border-edoxia-blue/20 bg-edoxia-bg'}`}>
        {CLASSES.map((cls) => (
          <button key={cls} onClick={() => setCurrentClass(cls)} className={`px-5 py-2 rounded-t-xl font-bold transition-all duration-200 border-t-2 border-x-2 whitespace-nowrap text-sm ${currentClass === cls ? (isDark ? 'bg-slate-800 text-cyan-400 border-slate-700' : 'bg-edoxia-blue text-white border-edoxia-blue translate-y-[2px]') : (isDark ? 'bg-slate-950 text-slate-500 border-transparent hover:bg-slate-900' : 'bg-slate-50 text-slate-400 border-transparent hover:text-edoxia-blue hover:bg-slate-100')}`}>{cls}</button>
        ))}
      </div>
      <main className="flex-1 flex gap-8 p-8 overflow-hidden h-[calc(100vh-160px)]">
        <div className={`w-1/3 flex flex-col border-2 rounded-3xl p-5 shadow-sm h-full ${isDark ? 'bg-slate-900 border-slate-800' : 'border-edoxia-blue bg-slate-50'}`}>
          <div className="flex justify-between items-center mb-4">
             <h2 className={`font-bold text-lg ${isDark ? 'text-cyan-400' : 'text-edoxia-blue'}`}>{currentClass}</h2>
             <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>{students.filter(s => s.classLabel === currentClass && !s.isAdult).length} élèves</span>
                <button onClick={() => generateClassPDF(currentClass, students, teams)} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-cyan-400 bg-slate-950' : 'text-slate-400 hover:text-blue-600 bg-slate-100'}`} title="Imprimer la classe"><Printer size={18} /></button>
             </div>
          </div>
          <form onSubmit={handleAddAdult} className="flex flex-col gap-2 mb-2">
            <input type="text" placeholder="Nom de l'adulte..." className={`w-full px-3 py-2 rounded-lg border focus:outline-none text-sm ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500' : 'bg-white border-slate-300 focus:border-edoxia-blue'}`} value={newAdultName} onChange={(e) => setNewAdultName(e.target.value)} />
            <div className="flex gap-2">
                <select value={newAdultRole} onChange={(e) => setNewAdultRole(e.target.value)} className={`flex-1 px-3 py-2 rounded-lg border focus:outline-none text-sm ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500' : 'bg-white border-slate-300 focus:border-edoxia-blue text-slate-700'}`}><option value="Parent">Parent</option><option value="AESH">AESH</option><option value="AVS">AVS</option><option value="ASEM">ASEM</option></select>
                <button type="submit" disabled={loading} className={`p-2 rounded-lg transition disabled:opacity-50 ${isDark ? 'bg-cyan-600 text-white hover:bg-cyan-500' : 'bg-edoxia-blue text-white hover:bg-blue-700'}`}><Plus size={20} /></button>
            </div>
          </form>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border mb-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}><Search size={16} className="text-slate-400" /><input type="text" placeholder="Rechercher..." className={`bg-transparent text-sm w-full focus:outline-none ${isDark ? 'text-white' : 'text-slate-600'}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>{searchTerm && <button onClick={() => setSearchTerm("")} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>}</div>
          <div className={`flex-1 overflow-y-auto space-y-3 p-2 border-t shadow-inner rounded-xl ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, null)}>{poolStudents.map(student => (<PersonCard key={student.id} student={student} onDragStart={handleDragStart} onToggle={toggleAttribute} onDelete={handleDeleteStudent} isDark={isDark} />))}{poolStudents.length === 0 && <div className="text-center text-slate-400 italic text-sm py-10">{searchTerm ? "Aucun résultat" : "Aucun élève à placer"}</div>}</div>
          <div className={`mt-4 rounded-2xl p-4 shadow-inner shrink-0 ${isDark ? 'bg-slate-800' : 'bg-edoxia-blue'}`}><h3 className="text-white font-bold text-sm mb-2">Commentaires</h3><textarea className={`w-full h-16 rounded-xl p-3 text-sm focus:outline-none resize-none ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`} placeholder="Notes..." value={comment} onChange={(e) => setComment(e.target.value)} /></div>
        </div>
        <div className="w-2/3 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-6 pb-10">
            {teams.map(team => {
              const teamId = team.numId; const teamName = team.name; const teamColor = team.color || '#0077b6'; const isLocked = team.locked;
              const myStudents = students
                .filter(s => s.team === teamId && s.classLabel === currentClass)
                .sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));
              const otherStudents = students.filter(s => s.team === teamId && s.classLabel !== currentClass);
              const allStudentsInTeam = students.filter(s => s.team === teamId);
              const isVisible = teamsVisibility[teamId];
              
              const studentsToCount = isVisible ? allStudentsInTeam : myStudents;
              const boysCount = studentsToCount.filter(s => s.gender && s.gender.toString().trim().toUpperCase() === 'M').length;
              const girlsCount = studentsToCount.filter(s => s.gender && s.gender.toString().trim().toUpperCase() === 'F').length;
              const adultCount = studentsToCount.filter(s => s.isAdult).length;
              
              const paiCount = studentsToCount.filter(s => s.pai).length;
              const disruptiveCount = studentsToCount.filter(s => s.disruptive).length;

              return (
                <div key={team.id} className="flex flex-col">
                  <div className={`rounded-3xl overflow-hidden flex flex-col shadow-sm min-h-[220px] transition-all ${isLocked ? 'opacity-90' : ''} ${isDark ? 'bg-slate-900' : 'bg-white'}`} style={{ border: `3px solid ${isLocked ? '#475569' : teamColor}` }}>
                    <div className="text-white px-5 py-3 flex justify-between items-center" style={{ backgroundColor: isLocked ? '#64748b' : teamColor }}>
                      <div className="flex items-center gap-2"><span className="font-bold text-lg truncate pr-2">{teamName}</span>{isLocked && <Lock size={16} className="text-white/80" />}</div>
                      <button onClick={() => toggleVisibility(teamId)} className="hover:scale-110 transition-transform"><Eye size={20} className={isVisible ? "" : "opacity-70"} /></button>
                    </div>
                    <div className={`border-b px-3 py-2 flex justify-between items-center text-xs font-semibold ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}><span className="text-slate-400 uppercase tracking-wider text-[10px]">{isVisible ? "Total" : "Moi"}</span><div className="flex items-center gap-3"><div className="flex gap-2"><span className="text-blue-600 flex items-center">G: {boysCount}</span><span className="text-pink-600 flex items-center">F: {girlsCount}</span>{adultCount > 0 && <span className="text-slate-500 flex items-center border-l border-slate-300 pl-2 ml-1">A: {adultCount}</span>}</div><div className="h-3 w-px bg-slate-300"></div><div className="flex gap-3"><span className={`flex items-center gap-1 ${paiCount > 0 ? 'text-blue-600 font-bold' : 'text-slate-300'}`} title="Nombre de PAI"><FileText size={12} strokeWidth={3} /> {paiCount}</span><span className={`flex items-center gap-1 ${disruptiveCount > 0 ? 'text-red-500 font-bold' : 'text-slate-300'}`} title="Nombre d'élèves perturbateurs"><Flag size={12} strokeWidth={3} /> {disruptiveCount}</span></div></div></div>
                    <div className={`flex-1 p-3 space-y-2 ${isLocked ? (isDark ? 'cursor-not-allowed bg-slate-950' : 'cursor-not-allowed bg-slate-50') : (isDark ? 'bg-slate-900' : 'bg-white')}`} onDragOver={(e) => { if (isLocked) { e.dataTransfer.dropEffect = "none"; } e.preventDefault(); }} onDrop={(e) => handleDrop(e, teamId)}>
                      {isVisible && otherStudents.map(s => {
                          const displayName = s.name && s.name.trim() ? s.name : `${s.lastName || ''} ${s.firstName || ''}`;
                          return (<div key={s.id} className={`border border-dashed rounded-lg p-2 text-sm flex items-center gap-2 select-none ${isDark ? 'bg-slate-950 text-slate-500 border-slate-800' : 'bg-slate-100 text-slate-500 border-slate-300'} ${s.isAdult ? 'border-red-300 bg-red-50' : ''}`}><User size={14} className={s.isAdult ? "text-red-500" : ""} /> <span className="truncate"><span className={`font-bold ${s.isAdult ? 'text-red-700' : ''}`}>{displayName}</span> <span className="text-xs">({s.isAdult ? <span className="text-red-600 font-bold">{s.role} - {s.classLabel}</span> : s.classLabel})</span></span></div>);
                      })}
                      {myStudents.map(s => <PersonCard key={s.id} student={s} onDragStart={handleDragStart} onToggle={toggleAttribute} onDelete={handleDeleteStudent} isDark={isDark} />)}
                      {myStudents.length === 0 && (!isVisible || otherStudents.length === 0) && <div className="h-full flex items-center justify-center text-slate-200 text-sm italic py-4">{isLocked ? "Équipe fermée" : "Glisser un élève"}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function PersonCard({ student, onDragStart, onToggle, onDelete, isDark }) {
  const isAdult = student.isAdult;
  const displayName = student.name && student.name.trim() ? student.name : `${student.lastName || ''} ${student.firstName || ''}`;
  const handleLocalDragStart = (e) => { onDragStart(e, student.id); requestAnimationFrame(() => { requestAnimationFrame(() => { if (e.target) { e.target.classList.add('opacity-20', 'grayscale', 'border-dashed'); } }); }); };
  const handleDragEnd = (e) => { if (e.target) { e.target.classList.remove('opacity-20', 'grayscale', 'border-dashed'); } };
  return (<div draggable onDragStart={handleLocalDragStart} onDragEnd={handleDragEnd} className={`border-2 rounded-xl p-3 shadow-sm cursor-grab active:cursor-grabbing relative hover:shadow-md transition-all group flex justify-between items-start select-none ${isAdult ? 'border-red-500' : (isDark ? 'border-cyan-500' : 'border-edoxia-blue')} ${isDark ? 'bg-slate-800' : 'bg-white'}`}><div className="pr-2 overflow-hidden"><div className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{displayName}</div><div className="text-xs text-slate-500 mt-0.5 font-medium truncate">{isAdult ? <span className="text-red-600 font-bold">{student.role}</span> : student.classLabel}{student.team && <span className={isDark ? 'text-cyan-400' : 'text-edoxia-blue'}> • Équipe {student.team}</span>}</div></div><div className="flex gap-1 shrink-0">{!isAdult && (<><button onClick={() => onToggle(student.id, 'pai')} className={`p-1.5 rounded-full hover:bg-slate-100 ${student.pai ? 'text-blue-600 scale-110' : 'text-slate-300 opacity-40 hover:opacity-100'}`}><FileText size={18} fill={student.pai ? "currentColor" : "none"} /></button><button onClick={() => onToggle(student.id, 'disruptive')} className={`p-1.5 rounded-full hover:bg-slate-100 ${student.disruptive ? 'text-red-500 scale-110' : 'text-slate-300 opacity-40 hover:opacity-100'}`}><Flag size={18} fill={student.disruptive ? "currentColor" : "none"} /></button></>)}<button onClick={() => onDelete(student.id)} className="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1.5"><Trash2 size={16} /></button></div></div>);
}
