import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Printer, Plus, Search, Lock, Eye, FileText, Flag, User, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addDoc, updateDoc, deleteDoc, doc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { CLASSES } from '../utils/constants';

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
    if (confirm("Attention : cela supprimera définitivement l'élève de la classe (et non seulement de l'équipe). Continuer ?")) await deleteDoc(doc(db, "students", id));
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
    .filter(s => {
      const displayName = s.name && s.name.trim() ? s.name : `${s.lastName || ''} ${s.firstName || ''}`;
      return s.classLabel === currentClass && s.team === null && displayName.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));

  if (loading) return <div className="min-h-screen flex items-center justify-center text-brand-text/50 font-bold tracking-wide">Chargement...</div>;

  return (
    <div className="flex flex-col font-sans min-h-screen transition-colors duration-300 bg-brand-bg text-brand-text">
      <header className="sticky top-0 z-[60] border-b border-white/50 p-4 px-8 flex justify-between items-center shadow-soft bg-white/40 backdrop-blur-md">
        <button onClick={() => navigate('/JS2026')} className="flex items-center gap-2 transition-colors font-bold text-brand-text/50 hover:text-brand-text"><ArrowLeft size={20} /> Retour</button>
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2 text-brand-text"><GraduationCap className="text-brand-teal" /> Espace enseignant</h1>
      </header>
      <div className="shrink-0 px-8 mt-6 flex gap-2 overflow-x-auto overflow-y-hidden pb-4 border-b border-white/50 bg-white/70 backdrop-blur-xl rounded-t-[30px] pt-4 shadow-inner mx-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-brand-teal/30 hover:scrollbar-thumb-brand-teal/50 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-brand-teal/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-brand-teal/50">
        {CLASSES.map((cls) => (
          <button key={cls} onClick={() => setCurrentClass(cls)} className={`px-5 py-3 rounded-t-[20px] font-bold transition-all duration-200 border-x border-t whitespace-nowrap text-sm ${currentClass === cls ? 'z-10 bg-white text-brand-teal border-white/50 shadow-soft translate-y-[1px]' : 'bg-white/40 text-brand-text/50 border-white/40 hover:bg-white/60 hover:text-brand-text'}`}>{cls}</button>
        ))}
      </div>
      <main className="flex gap-8 p-8 relative items-start">
        <div className="w-1/3 flex flex-col rounded-[30px] p-5 shadow-soft bg-white/60 backdrop-blur-md border border-white/50 sticky top-[150px] z-[40]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-black tracking-tight text-xl text-brand-teal">{currentClass}</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full bg-black/5 text-brand-text/60 shadow-inner">{students.filter(s => s.classLabel === currentClass && !s.isAdult).length} élèves</span>
              <button onClick={() => generateClassPDF(currentClass, students, teams)} className="p-2 rounded-full transition-colors text-brand-text/50 hover:text-brand-teal bg-white/50 hover:bg-white shadow-sm" title="Imprimer la classe"><Printer size={18} /></button>
            </div>
          </div>
          <form onSubmit={handleAddAdult} className="flex flex-col gap-2 mb-2 p-3 bg-white/40 rounded-[20px] shadow-inner border border-white/50">
            <input type="text" placeholder="Nom de l'adulte..." className="w-full px-4 py-3 rounded-[16px] focus:outline-none text-sm bg-white/80 border border-white shadow-inner focus:ring-2 focus:ring-brand-teal text-brand-text placeholder-brand-text/40 transition-all font-bold" value={newAdultName} onChange={(e) => setNewAdultName(e.target.value)} />
            <div className="flex gap-2">
              <select value={newAdultRole} onChange={(e) => setNewAdultRole(e.target.value)} className="flex-1 px-4 py-3 rounded-[16px] focus:outline-none text-sm bg-white/80 border border-white shadow-inner focus:ring-2 focus:ring-brand-teal text-brand-text/70 transition-all font-bold"><option value="Parent">Parent</option><option value="AESH">AESH</option><option value="AVS">AVS</option><option value="ASEM">ASEM</option></select>
              <button type="submit" disabled={loading} className="px-4 py-3 rounded-[16px] transition-all disabled:opacity-50 bg-brand-teal text-white hover:bg-brand-teal/90 shadow-soft hover:scale-105 active:scale-95"><Plus size={20} /></button>
            </div>
          </form>
          <div className="flex items-center gap-2 px-4 py-3 rounded-[20px] mb-4 bg-white/60 border border-white shadow-inner focus-within:ring-2 focus-within:ring-brand-teal transition-all"><Search size={18} className="text-brand-text/40" /><input type="text" placeholder="Rechercher..." className="bg-transparent text-sm font-bold w-full focus:outline-none text-brand-text placeholder-brand-text/40" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />{searchTerm && <button onClick={() => setSearchTerm("")} className="text-brand-text/40 hover:text-brand-text/70 p-1 bg-white/50 rounded-full shadow-sm">✕</button>}</div>
          <div className="h-[430px] overflow-y-auto space-y-3 p-3 shadow-inner rounded-[20px] bg-black/5 border border-white/40 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-brand-teal/30 hover:scrollbar-thumb-brand-teal/50 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-brand-teal/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-brand-teal/50" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, null)}>{poolStudents.map(student => (<PersonCard key={student.id} student={student} onDragStart={handleDragStart} onToggle={toggleAttribute} onDelete={handleDeleteStudent} />))}{poolStudents.length === 0 && <div className="text-center text-brand-text/40 font-bold uppercase tracking-wide text-[10px] py-10 opacity-70">{searchTerm ? "Aucun résultat" : "Aucun élève à placer"}</div>}</div>
          <div className="mt-4 rounded-[20px] p-4 shadow-inner shrink-0 bg-brand-teal/10 border border-brand-teal/20"><h3 className="text-brand-teal font-black tracking-tight text-sm mb-2 uppercase">Commentaires</h3><textarea className="w-full h-16 rounded-[16px] p-3 text-sm focus:outline-none resize-none bg-white/80 text-brand-text border border-white shadow-inner focus:ring-2 focus:ring-brand-teal transition-all font-medium placeholder-brand-text/30" placeholder="Notes..." value={comment} onChange={(e) => setComment(e.target.value)} /></div>
        </div>
        <div className="w-2/3">
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
                  <div className={`rounded-[30px] overflow-hidden flex flex-col shadow-soft min-h-[220px] transition-all bg-white/80 backdrop-blur-md border border-white/50 relative ${isLocked ? 'opacity-90 grayscale-[20%]' : ''}`}>
                    <div className="absolute top-0 left-0 bottom-0 w-[6px]" style={{ backgroundColor: isLocked ? '#a1a1aa' : teamColor }}></div>
                    <div className="pl-6 pr-5 py-4 flex justify-between items-center bg-white/40 border-b border-white/50">
                      <div className="flex items-center gap-2"><span className="font-black text-xl tracking-tight text-brand-text truncate">{teamName}</span>{isLocked && <Lock size={16} className="text-brand-text/40" />}</div>
                      <button onClick={() => toggleVisibility(teamId)} className="hover:scale-110 transition-transform bg-white/50 hover:bg-white p-2 text-brand-text/50 hover:text-brand-teal rounded-full shadow-sm"><Eye size={20} className={isVisible ? "text-brand-teal" : ""} /></button>
                    </div>
                    <div className="px-5 py-3 flex justify-between items-center text-xs font-bold bg-black/5 border-b border-white/50 shadow-inner"><span className="text-brand-text/40 uppercase tracking-widest text-[9px]">{isVisible ? "Total" : "Moi"}</span><div className="flex items-center gap-3"><div className="flex gap-2"><span className="text-blue-600 flex items-center">G: {boysCount}</span><span className="text-pink-600 flex items-center">F: {girlsCount}</span>{adultCount > 0 && <span className="text-brand-coral flex items-center border-l border-brand-text/20 pl-2 ml-1">A: {adultCount}</span>}</div><div className="h-4 w-px bg-brand-text/20"></div><div className="flex gap-3"><span className={`flex items-center gap-1 ${paiCount > 0 ? 'text-brand-teal font-black' : 'text-brand-text/30'}`} title="Nombre de PAI"><FileText size={14} strokeWidth={3} /> {paiCount}</span><span className={`flex items-center gap-1 ${disruptiveCount > 0 ? 'text-brand-coral font-black' : 'text-brand-text/30'}`} title="Nombre d'élèves perturbateurs"><Flag size={14} strokeWidth={3} /> {disruptiveCount}</span></div></div></div>
                    <div className={`flex-1 p-4 space-y-3 ${isLocked ? 'cursor-not-allowed bg-black/5' : 'bg-transparent'}`} onDragOver={(e) => { if (isLocked) { e.dataTransfer.dropEffect = "none"; } e.preventDefault(); }} onDrop={(e) => handleDrop(e, teamId)}>
                      {isVisible && otherStudents.map(s => {
                        const displayName = s.name && s.name.trim() ? s.name : `${s.lastName || ''} ${s.firstName || ''}`;
                        return (<div key={s.id} className={`border border-dashed rounded-[16px] p-2 text-sm flex items-center gap-2 select-none bg-black/5 text-brand-text/50 border-brand-text/20 shadow-inner ${s.isAdult ? 'border-brand-coral/40 bg-brand-coral/5 text-brand-coral/70' : ''}`}><User size={14} className={s.isAdult ? "text-brand-coral/70" : ""} /> <span className="truncate"><span className={`font-bold ${s.isAdult ? 'text-brand-coral' : ''}`}>{displayName}</span> <span className="text-[10px] uppercase tracking-wide">({s.isAdult ? <span className="font-bold">{s.role} - {s.classLabel}</span> : s.classLabel})</span></span></div>);
                      })}
                      {myStudents.map(s => <PersonCard key={s.id} student={s} onDragStart={handleDragStart} onToggle={toggleAttribute} onDelete={handleDeleteStudent} />)}
                      {myStudents.length === 0 && (!isVisible || otherStudents.length === 0) && <div className="h-full flex items-center justify-center text-brand-text/30 text-[10px] font-bold uppercase tracking-widest py-6">{isLocked ? "Équipe fermée" : "Glisser un élève ici"}</div>}
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

function PersonCard({ student, onDragStart, onToggle, onDelete }) {
  const isAdult = student.isAdult;
  const displayName = student.name && student.name.trim() ? student.name : `${student.lastName || ''} ${student.firstName || ''}`;
  const handleLocalDragStart = (e) => { onDragStart(e, student.id); requestAnimationFrame(() => { requestAnimationFrame(() => { if (e.target) { e.target.classList.add('opacity-40', 'grayscale', 'border-dashed'); } }); }); };
  const handleDragEnd = (e) => { if (e.target) { e.target.classList.remove('opacity-40', 'grayscale', 'border-dashed'); } };
  return (<div draggable onDragStart={handleLocalDragStart} onDragEnd={handleDragEnd} className={`border border-white/50 rounded-[20px] p-3 shadow-sm cursor-grab active:cursor-grabbing relative hover:shadow-md transition-all group flex justify-between items-start select-none bg-white text-brand-text ${isAdult ? 'border-brand-coral bg-brand-coral/5' : ''}`}><div className="pr-2 overflow-hidden"><div className="font-bold text-sm truncate tracking-tight">{displayName}</div><div className="text-[10px] uppercase text-brand-text/50 mt-0.5 font-bold truncate tracking-wide">{isAdult ? <span className="text-brand-coral">{student.role}</span> : student.classLabel}{student.team && <span className="text-brand-teal"> • Équipe {student.team}</span>}</div></div><div className="flex gap-1 shrink-0">{!isAdult && (<><button onClick={() => onToggle(student.id, 'pai')} className={`p-1.5 rounded-full shadow-inner hover:scale-110 active:scale-95 transition-all ${student.pai ? 'text-brand-teal bg-brand-teal/20' : 'text-brand-text/20 bg-black/5 hover:text-brand-teal/80 hover:bg-white'}`}><FileText size={16} fill={student.pai ? "currentColor" : "none"} /></button><button onClick={() => onToggle(student.id, 'disruptive')} className={`p-1.5 rounded-full shadow-inner hover:scale-110 active:scale-95 transition-all ${student.disruptive ? 'text-brand-coral bg-brand-coral/20' : 'text-brand-text/20 bg-black/5 hover:text-brand-coral/80 hover:bg-white'}`}><Flag size={16} fill={student.disruptive ? "currentColor" : "none"} /></button></>)}<button onClick={() => onDelete(student.id)} className="text-brand-text/30 hover:text-brand-coral opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white shadow-soft rounded-full absolute -top-2 -right-2"><Trash2 size={12} /></button></div></div>);
}
