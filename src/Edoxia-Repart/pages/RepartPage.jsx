import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Printer, Plus, Search, Lock, Eye, FileText, Flag, User, Users, Trash2, ChevronDown, ChevronUp, Filter, Sparkles, Circle, AlertCircle, XCircle, Info } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addDoc, updateDoc, deleteDoc, doc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { CLASSES as ALL_CLASSES } from '../../Edoxia-JS/utils/constants';

const CLASSES = ALL_CLASSES.filter(c => !c.includes("CM2"));

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

  const getContrastYIQ = (hexcolor) => {
    if (!hexcolor) return '#000000';
    hexcolor = hexcolor.replace("#", "");
    if (hexcolor.length === 3) hexcolor = hexcolor.split("").map(x => x + x).join("");
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
  };

  const tableData = classStudents.map(s => {
    let lastName = s.lastName ? s.lastName.toUpperCase() : s.name.split(' ')[0].toUpperCase();
    let firstName = s.firstName ? s.firstName : s.name.split(' ').slice(1).join(' ');

    const team = s.team ? teams.find(t => t.numId === s.team) : null;
    const teamName = team ? team.name : "Non placé";

    let equipeCell = teamName;
    if (team && team.color) {
      equipeCell = {
        content: teamName,
        styles: { fillColor: team.color, textColor: getContrastYIQ(team.color), fontStyle: 'bold' }
      };
    }

    return [lastName, firstName, equipeCell];
  });

  autoTable(doc, {
    startY: 35,
    head: [['Nom', 'Prénom', 'Future Classe']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 119, 182] },
  });
  doc.save(`${classLabel}_PDF.pdf`);
};

export default function RepartPage() {
  const navigate = useNavigate();
  const context = useOutletContext();
  const students = context?.students || [];
  const teams = context?.classesList || [];
  const loading = context?.loading;

  const classDisplayNames = {
    "CP - Delphine A.": "CP - Aurélie B.",
    "CE1 - Charlotte D.": "CE1 - Claire C."
  };

  const [currentClass, setCurrentClass] = useState(CLASSES[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [addClassModalOpen, setAddClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [comment, setComment] = useState("");
  const [paiClassModalOpen, setPaiClassModalOpen] = useState(false);
  const [paiTeamModalOpen, setPaiTeamModalOpen] = useState(null);
  const [ebepClassModalOpen, setEbepClassModalOpen] = useState(false);
  const [ebepTeamModalOpen, setEbepTeamModalOpen] = useState(null);
  const [collapsedTeams, setCollapsedTeams] = useState([]);
  const [hiddenClassIds, setHiddenClassIds] = useState([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [newStudentLastName, setNewStudentLastName] = useState("");
  const [newStudentFirstName, setNewStudentFirstName] = useState("");
  const [newStudentGender, setNewStudentGender] = useState("");
  const [newStudentClass, setNewStudentClass] = useState(CLASSES[0]);

  useEffect(() => { setSearchTerm(""); setNewStudentClass(currentClass); }, [currentClass]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentLastName.trim() || !newStudentFirstName.trim() || !newStudentGender) return;

    const lastName = newStudentLastName.trim().toUpperCase();
    const firstName = newStudentFirstName.trim().charAt(0).toUpperCase() + newStudentFirstName.trim().slice(1).toLowerCase();
    const name = `${lastName} ${firstName}`;

    try {
      await addDoc(collection(db, "repart_students"), {
        name,
        lastName,
        firstName,
        classLabel: newStudentClass,
        team: null,
        pai: false,
        disruptive: false,
        gender: newStudentGender,
        isAdult: false,
        createdAt: new Date()
      });
      setStudentModalOpen(false);
      setNewStudentLastName("");
      setNewStudentFirstName("");
      setNewStudentGender("");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'ajout de l'élève.");
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    try {
      await addDoc(collection(db, "repart_classes"), {
        name: newClassName.trim(),
        numId: (teams.length > 0 ? Math.max(...teams.map(t => t.numId || 0)) : 0) + 1,
        locked: false,
        color: '#6366f1',
        createdAt: new Date()
      });
      setNewClassName("");
      setAddClassModalOpen(false);
    } catch (error) { console.error(error); }
  };

  const handleDeleteClass = async (teamId, numId) => {
    if (!confirm("Supprimer cette classe ? Les élèves seront remis en liste d'attente.")) return;
    try {
      await deleteDoc(doc(db, "repart_classes", teamId));
      const updates = students.filter(s => s.team === numId).map(s => 
        updateDoc(doc(db, "repart_students", s.id), { team: null })
      );
      await Promise.all(updates);
    } catch (error) { console.error(error); }
  };

  const toggleClassLock = async (teamId, currentLocked) => {
    try {
      await updateDoc(doc(db, "repart_classes", teamId), { locked: !currentLocked });
    } catch (error) { console.error(error); }
  };

  const toggleAttribute = useCallback(async (id, attribute) => {
    const student = students.find(s => s.id === id);
    if (!student) return;
    if (student.team) {
      const team = teams.find(t => t.numId === student.team);
      if (team && team.locked) { alert("Impossible de modifier un élève dans une classe verrouillée."); return; }
    }
    await updateDoc(doc(db, "repart_students", id), { [attribute]: !student[attribute] });
  }, [students, teams]);

  const toggleStatus = useCallback(async (id, status) => {
    const student = students.find(s => s.id === id);
    if (!student) return;
    if (student.team) {
      const team = teams.find(t => t.numId === student.team);
      if (team && team.locked) { alert("Impossible de modifier un élève dans une classe verrouillée."); return; }
    }
    const newStatus = student.status === status ? null : status;
    await updateDoc(doc(db, "repart_students", id), { status: newStatus });
  }, [students, teams]);

  const toggleClassVisibility = (numId) => {
    setHiddenClassIds(prev =>
      prev.includes(numId) ? prev.filter(id => id !== numId) : [...prev, numId]
    );
  };

  const toggleTeamCollapse = (teamId) => {
    setCollapsedTeams(prev => prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]);
  };

  const handleDeleteStudent = useCallback(async (id) => {
    const student = students.find(s => s.id === id);
    if (student.team) {
      const team = teams.find(t => t.numId === student.team);
      if (team && team.locked) { alert("Impossible de supprimer un élève d'une classe verrouillée."); return; }
    }
    if (confirm("Attention : cela supprimera définitivement l'élève de la base. Continuer ?")) await deleteDoc(doc(db, "repart_students", id));
  }, [students, teams]);

  const handleDragStart = useCallback((e, studentId) => e.dataTransfer.setData("studentId", studentId), []);

  const handleDrop = useCallback(async (e, teamId) => {
    e.preventDefault();
    const studentId = e.dataTransfer.getData("studentId");
    if (teamId !== null) {
      const targetTeam = teams.find(t => t.numId === teamId);
      if (targetTeam && targetTeam.locked) { alert(`L'équipe "${targetTeam.name}" est verrouillée 🔒.`); return; }
    }
    const student = students.find(s => s.id === studentId);
    if (student && student.team) {
      const sourceTeam = teams.find(t => t.numId === student.team);
      if (sourceTeam && sourceTeam.locked) { alert(`La classe d'origine "${sourceTeam.name}" est verrouillée 🔒.`); return; }
    }
    await updateDoc(doc(db, "repart_students", studentId), { team: teamId });
  }, [students, teams]);

  const poolStudents = useMemo(() => {
    return students
      .filter(s => {
        const displayName = s.name && s.name.trim() ? s.name : `${s.lastName || ''} ${s.firstName || ''}`;
        return s.classLabel === currentClass && s.team === null && displayName.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));
  }, [students, currentClass, searchTerm]);

  const classStudentsWithPAI = students.filter(s => s.classLabel === currentClass && !s.isAdult && s.pai);
  const missingPAICommentsCount = classStudentsWithPAI.filter(s => !s.paiComment || s.paiComment.trim() === "").length;
  const classStudentsWithEbep = students.filter(s => s.classLabel === currentClass && !s.isAdult && s.ebep);
  const missingEbepCommentsCount = classStudentsWithEbep.filter(s => !s.ebepComment || s.ebepComment.trim() === "").length;

  const visibleTeams = teams.filter(t => !hiddenClassIds.includes(t.numId));
  const allVisibleCollapsed = visibleTeams.length > 0 && visibleTeams.every(t => collapsedTeams.includes(t.numId));

  const toggleAllTeams = () => {
    if (allVisibleCollapsed) {
      setCollapsedTeams(prev => prev.filter(id => !visibleTeams.map(t => t.numId).includes(id)));
    } else {
      const visibleIds = visibleTeams.map(t => t.numId);
      setCollapsedTeams(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-brand-text/50 font-bold tracking-wide">Chargement...</div>;

  return (
    <div className="flex flex-col font-sans min-h-screen transition-colors duration-300 bg-brand-bg text-brand-text">
      <header className="sticky top-0 z-[60] border-b border-white/50 p-4 px-8 flex justify-between items-center shadow-soft bg-white/40 backdrop-blur-md">
        <button onClick={() => navigate('/stpbb')} className="flex items-center gap-2 transition-colors font-bold text-brand-text/50 hover:text-brand-text"><ArrowLeft size={20} /> Retour</button>
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2 text-brand-text">
          <button onClick={() => navigate('/repart/college')} className="px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all text-xs font-black mr-1" title="Répartition 6ème">6ème</button>
          <button onClick={() => setHelpModalOpen(true)} className="p-1.5 rounded-full hover:bg-brand-teal/10 text-brand-teal/60 hover:text-brand-teal transition-all mr-1" title="Aide"><Info size={22} /></button>
          <GraduationCap className="text-indigo-500" /> Répartition école 2026/2027
        </h1>
      </header>
      <div className="shrink-0 px-8 mt-6 flex gap-2 overflow-x-auto overflow-y-hidden pb-4 border-b border-white/50 bg-white/70 backdrop-blur-xl rounded-t-[30px] pt-4 shadow-inner mx-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-brand-teal/30 hover:scrollbar-thumb-brand-teal/50 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-brand-teal/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-brand-teal/50">
        {CLASSES.map((cls) => (
          <button key={cls} onClick={() => setCurrentClass(cls)} className={`px-5 py-3 rounded-t-[20px] font-bold transition-all duration-200 border-x border-t whitespace-nowrap text-sm ${currentClass === cls ? 'z-10 bg-white text-brand-teal border-white/50 shadow-soft translate-y-[1px]' : 'bg-white/40 text-brand-text/50 border-white/40 hover:bg-white/60 hover:text-brand-text'}`}>
            {classDisplayNames[cls] || cls}
          </button>
        ))}
      </div>
      <main className="flex gap-8 p-8 relative items-start">
        <div className="w-1/3 flex flex-col rounded-[30px] p-5 shadow-soft bg-white/60 backdrop-blur-md border border-white/50 sticky top-[150px] z-[40]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-black tracking-tight text-lg text-brand-teal truncate mr-2 min-w-0" title={classDisplayNames[currentClass] || currentClass}>{classDisplayNames[currentClass] || currentClass}</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full bg-black/5 text-brand-text/60 shadow-inner whitespace-nowrap shrink-0">{students.filter(s => s.classLabel === currentClass && !s.isAdult).length} élèves</span>

              <div className="relative flex items-center">
                <button onClick={() => setPaiClassModalOpen(true)} disabled={classStudentsWithPAI.length === 0} className={`p-2 rounded-full transition-colors shadow-sm ${classStudentsWithPAI.length === 0 ? 'bg-black/5 text-brand-text/30 cursor-not-allowed' : 'bg-white/50 hover:bg-white text-brand-teal'}`} title="Détails des PAI de la classe"><FileText size={18} /></button>
                {classStudentsWithPAI.length > 0 && missingPAICommentsCount > 0 && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-brand-coral border border-brand-coral/50 text-white text-[10px] font-bold px-2 py-1 rounded-[8px] shadow-soft whitespace-nowrap z-50 flex flex-col items-center animate-pulse">
                    {missingPAICommentsCount} PAI incomplets
                    <div className="w-2 h-2 bg-brand-coral rotate-45 absolute -bottom-1"></div>
                  </div>
                )}
              </div>

              <div className="relative flex items-center">
                <button onClick={() => setEbepClassModalOpen(true)} disabled={classStudentsWithEbep.length === 0} className={`p-2 rounded-full transition-colors shadow-sm ${classStudentsWithEbep.length === 0 ? 'bg-black/5 text-brand-text/30 cursor-not-allowed' : 'bg-white/50 hover:bg-white text-indigo-500'}`} title="Détails des EBEP de la classe"><Sparkles size={18} /></button>
                {classStudentsWithEbep.length > 0 && missingEbepCommentsCount > 0 && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-brand-coral border border-brand-coral/50 text-white text-[10px] font-bold px-2 py-1 rounded-[8px] shadow-soft whitespace-nowrap z-50 flex flex-col items-center animate-pulse">
                    {missingEbepCommentsCount} EBEP incomplets
                    <div className="w-2 h-2 bg-brand-coral rotate-45 absolute -bottom-1"></div>
                  </div>
                )}
              </div>

              <button onClick={() => generateClassPDF(currentClass, students, teams)} className="p-2 rounded-full transition-colors text-brand-text/50 hover:text-brand-teal bg-white/50 hover:bg-white shadow-sm" title="Imprimer la classe"><Printer size={18} /></button>
            </div>
          </div>


          <div className="flex justify-between items-end mb-2 mt-4 px-1">
            <h3 className="text-brand-text/50 font-black tracking-tight text-xs uppercase ml-2">Élèves à répartir</h3>
            <button onClick={() => { setNewStudentClass(currentClass); setStudentModalOpen(true); }} className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-brand-teal bg-brand-teal/10 hover:bg-brand-teal/20 px-3 py-1.5 rounded-full transition-all shadow-sm border border-brand-teal/20">
              <Plus size={14} /> Nouvel élève
            </button>
          </div>

          <div className="flex items-center gap-2 px-4 py-3 rounded-[20px] mb-4 bg-white/60 border border-white shadow-inner focus-within:ring-2 focus-within:ring-brand-teal transition-all"><Search size={18} className="text-brand-text/40" /><input type="text" placeholder="Rechercher..." className="bg-transparent text-sm font-bold w-full focus:outline-none text-brand-text placeholder-brand-text/40" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />{searchTerm && <button onClick={() => setSearchTerm("")} className="text-brand-text/40 hover:text-brand-text/70 p-1 bg-white/50 rounded-full shadow-sm">✕</button>}</div>
          <div className="h-[430px] overflow-y-auto space-y-3 p-3 shadow-inner rounded-[20px] bg-black/5 border border-white/40 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-brand-teal/30 hover:scrollbar-thumb-brand-teal/50 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-brand-teal/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-brand-teal/50" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, null)}>{poolStudents.map(student => (<PersonCard key={student.id} student={student} onDragStart={handleDragStart} onToggle={toggleAttribute} onToggleStatus={toggleStatus} onDelete={handleDeleteStudent} />))}{poolStudents.length === 0 && <div className="text-center text-brand-text/40 font-bold uppercase tracking-wide text-[10px] py-10 opacity-70">{searchTerm ? "Aucun résultat" : "Aucun élève à placer"}</div>}</div>
          <div className="mt-4 rounded-[20px] p-4 shadow-inner shrink-0 bg-brand-teal/10 border border-brand-teal/20"><h3 className="text-brand-teal font-black tracking-tight text-sm mb-2 uppercase">Commentaires</h3><textarea className="w-full h-16 rounded-[16px] p-3 text-sm focus:outline-none resize-none bg-white/80 text-brand-text border border-white shadow-inner focus:ring-2 focus:ring-brand-teal transition-all font-medium placeholder-brand-text/30" placeholder="Notes..." value={comment} onChange={(e) => setComment(e.target.value)} /></div>
        </div>
        <div className="w-2/3 h-[75vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-brand-teal/30 hover:scrollbar-thumb-brand-teal/50 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-brand-teal/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-brand-teal/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-brand-text flex items-center gap-2">
              <Users className="text-indigo-500" /> Futures classes
            </h2>
            <div className="flex items-center gap-3">
              <button onClick={toggleAllTeams} className="bg-white border-2 border-brand-bg text-brand-text/60 font-bold px-4 py-2.5 rounded-full text-sm hover:border-indigo-500 hover:text-indigo-500 transition-all shadow-sm flex items-center gap-2">
                {allVisibleCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />} {allVisibleCollapsed ? "Tout déplier" : "Tout plier"}
              </button>
              <button onClick={() => setFilterModalOpen(true)} className="bg-white border-2 border-brand-bg text-brand-text/60 font-bold px-4 py-2.5 rounded-full text-sm hover:border-indigo-500 hover:text-indigo-500 transition-all shadow-sm flex items-center gap-2">
                <Filter size={18} /> Filtrer ({teams.length - hiddenClassIds.length})
              </button>
              <button onClick={() => setAddClassModalOpen(true)} className="bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-full text-sm hover:bg-indigo-600 transition-all shadow-soft flex items-center gap-2">
                <Plus size={18} /> Créer une classe
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 pb-10">
            {teams.filter(t => !hiddenClassIds.includes(t.numId)).map(team => {
              const teamId = team.numId; const teamName = team.name; const teamColor = team.color || '#0077b6'; const isLocked = team.locked;
              const allStudentsInTeam = students
                .filter(s => s.team === teamId)
                .sort((a, b) => {
                  const classIndexA = CLASSES.indexOf(a.importedClassLabel || a.classLabel);
                  const classIndexB = CLASSES.indexOf(b.importedClassLabel || b.classLabel);
                  const idxA = classIndexA === -1 ? 999 : classIndexA;
                  const idxB = classIndexB === -1 ? 999 : classIndexB;
                  if (idxA !== idxB) return idxA - idxB;
                  return (a.lastName || a.name).localeCompare(b.lastName || b.name);
                });

              const studentsToCount = allStudentsInTeam;
              const boysCount = studentsToCount.filter(s => s.gender && s.gender.toString().trim().toUpperCase() === 'M').length;
              const girlsCount = studentsToCount.filter(s => s.gender && s.gender.toString().trim().toUpperCase() === 'F').length;
              const totalCount = boysCount + girlsCount;
              const adultCount = studentsToCount.filter(s => s.isAdult).length;

              const paiCount = studentsToCount.filter(s => s.pai).length;
              const ebepCount = studentsToCount.filter(s => s.ebep).length;
              const disruptiveCount = studentsToCount.filter(s => s.disruptive).length;

              return (
                <div key={team.id} className="flex flex-col">
                  <div className={`rounded-[30px] overflow-hidden flex flex-col shadow-soft transition-all bg-white/80 backdrop-blur-md border border-white/50 relative ${isLocked ? 'opacity-90 grayscale-[20%]' : ''} ${collapsedTeams.includes(teamId) ? 'min-h-0' : 'min-h-[220px]'}`}>
                    <div className="absolute top-0 left-0 bottom-0 w-[6px]" style={{ backgroundColor: isLocked ? '#a1a1aa' : teamColor }}></div>
                    <div className="pl-6 pr-5 py-4 flex justify-between items-center bg-white/40 border-b border-white/50 cursor-pointer hover:bg-white/60 transition-colors" onClick={() => toggleTeamCollapse(teamId)}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-black text-lg tracking-tight text-brand-text truncate">{teamName}</span>
                        {isLocked && <Lock size={16} className="text-brand-text/40 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); toggleClassLock(team.id, isLocked); }} className={`p-1.5 rounded-full transition-all ${isLocked ? 'text-indigo-500 bg-indigo-50' : 'text-brand-text/20 hover:text-indigo-500 hover:bg-white'}`} title={isLocked ? "Déverrouiller" : "Verrouiller"}>
                          {isLocked ? <Lock size={16} /> : <Eye size={16} />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClass(team.id, teamId); }} className="p-1.5 rounded-full text-brand-text/20 hover:text-brand-coral hover:bg-white transition-all" title="Supprimer la classe">
                          <Trash2 size={16} />
                        </button>
                        <button className="text-brand-text/50 hover:text-brand-teal transition-colors ml-1">
                          {collapsedTeams.includes(teamId) ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                        </button>
                      </div>
                    </div>
                    <div className="px-5 py-3 flex justify-between items-center text-xs font-bold bg-black/5 border-b border-white/50 shadow-inner">
                      <span className="text-brand-text/40 uppercase tracking-widest text-[9px]">Total : {totalCount}</span>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                          <span className="text-blue-600 flex items-center">G: {boysCount}</span>
                          <span className="text-pink-600 flex items-center">F: {girlsCount}</span>
                          {adultCount > 0 && <span className="text-brand-coral flex items-center border-l border-brand-text/20 pl-2 ml-1">A: {adultCount}</span>}
                        </div>
                        <div className="h-4 w-px bg-brand-text/20"></div>
                        <div className="flex gap-3">
                          <span className={`flex items-center gap-1 transition-all ${paiCount > 0 ? 'text-brand-teal font-black cursor-pointer hover:scale-110 active:scale-95' : 'text-brand-text/30'}`} title="Détails des PAI" onClick={(e) => { e.stopPropagation(); if (paiCount > 0) setPaiTeamModalOpen(teamId); }}><FileText size={14} strokeWidth={3} /> {paiCount}</span>
                          <span className={`flex items-center gap-1 transition-all ${ebepCount > 0 ? 'text-indigo-500 font-black cursor-pointer hover:scale-110 active:scale-95' : 'text-brand-text/30'}`} title="Détails des EBEP" onClick={(e) => { e.stopPropagation(); if (ebepCount > 0) setEbepTeamModalOpen(teamId); }}><Sparkles size={14} strokeWidth={3} /> {ebepCount}</span>
                          <span className={`flex items-center gap-1 ${disruptiveCount > 0 ? 'text-brand-coral font-black' : 'text-brand-text/30'}`} title="Nombre d'élèves perturbateurs"><Flag size={14} strokeWidth={3} /> {disruptiveCount}</span>
                        </div>
                      </div>
                    </div>
                    {!collapsedTeams.includes(teamId) && (
                      <div className={`flex-1 p-4 space-y-3 ${isLocked ? 'cursor-not-allowed bg-black/5' : 'bg-transparent'}`} onDragOver={(e) => { if (isLocked) { e.dataTransfer.dropEffect = "none"; } e.preventDefault(); }} onDrop={(e) => handleDrop(e, teamId)}>
                        {allStudentsInTeam.map(s => {
                          if (s.classLabel === currentClass) {
                            return <PersonCard key={s.id} student={s} onDragStart={handleDragStart} onToggle={toggleAttribute} onDelete={handleDeleteStudent} />;
                          } else {
                            const displayName = s.name && s.name.trim() ? s.name : `${s.lastName || ''} ${s.firstName || ''}`;
                            return (
                              <div key={s.id} className={`border border-dashed rounded-[16px] p-2 text-sm flex justify-between items-center select-none bg-black/5 text-brand-text/50 border-brand-text/20 shadow-inner ${s.isAdult ? 'border-brand-coral/40 bg-brand-coral/5 text-brand-coral/70' : ''}`}>
                                <div className="flex items-center gap-2 truncate">
                                  <User size={14} className={s.isAdult ? "text-brand-coral/70 shrink-0" : "shrink-0"} />
                                  <span className="truncate"><span className={`font-bold ${s.isAdult ? 'text-brand-coral' : ''}`}>{displayName}</span> <span className="text-[10px] uppercase tracking-wide">({s.isAdult ? <span className="font-bold">{s.role} • {s.importedClassLabel || s.classLabel}</span> : (s.importedClassLabel || s.classLabel)})</span></span>
                                </div>
                                {(!s.isAdult && (s.pai || s.ebep || s.disruptive)) && (
                                  <div className="flex gap-1 shrink-0 ml-2">
                                    {s.pai && <FileText size={14} className="text-brand-teal" />}
                                    {s.ebep && <Sparkles size={14} className="text-indigo-500" />}
                                    {s.disruptive && <Flag size={14} className="text-brand-coral" />}
                                  </div>
                                )}
                              </div>
                            );
                          }
                        })}
                        {allStudentsInTeam.length === 0 && <div className="h-full flex items-center justify-center text-brand-text/30 text-[10px] font-bold uppercase tracking-widest py-6">{isLocked ? "Équipe fermée" : "Glisser un élève ici"}</div>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {paiClassModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-[30px] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-brand-teal text-white">
              <h2 className="text-xl font-black flex items-center gap-2"><FileText /> Commentaires PAI - {currentClass}</h2>
              <button onClick={() => setPaiClassModalOpen(false)} className="hover:scale-110 transition-transform bg-white/20 hover:bg-white/30 p-2 rounded-full">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-brand-bg">
              {classStudentsWithPAI.length === 0 && (
                <div className="text-center text-brand-text/50 font-bold py-8">Aucun élève avec PAI dans cette classe.</div>
              )}
              {classStudentsWithPAI.map(s => (
                <div key={s.id} className="bg-white rounded-[20px] p-4 shadow-soft border border-white/50 flex flex-col gap-2 transition-all hover:shadow-md">
                  <div className="font-bold text-brand-text flex justify-between items-center text-lg px-1">
                    <span>{s.name && s.name.trim() ? s.name : `${s.lastName || ''} ${s.firstName || ''}`}</span>
                  </div>
                  <textarea
                    className="w-full h-24 rounded-[16px] p-4 text-sm focus:outline-none resize-none bg-black/5 text-brand-text border border-transparent focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/10 transition-all font-medium placeholder-brand-text/30 shadow-inner"
                    placeholder="Détails du PAI (ex: Allergie aux arachides, protocole d'urgence...)"
                    defaultValue={s.paiComment || ""}
                    onBlur={async (e) => {
                      if (e.target.value !== (s.paiComment || "")) {
                        await updateDoc(doc(db, "repart_students", s.id), { paiComment: e.target.value });
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {paiTeamModalOpen !== null && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-[30px] w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-brand-teal text-white">
              <h2 className="text-xl font-black flex items-center gap-2"><FileText /> PAI - {teams.find(t => t.numId === paiTeamModalOpen)?.name}</h2>
              <button onClick={() => setPaiTeamModalOpen(null)} className="hover:scale-110 transition-transform bg-white/20 hover:bg-white/30 p-2 rounded-full">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-brand-bg">
              {students.filter(s => s.team === paiTeamModalOpen && s.pai && !s.isAdult).map(s => {
                const displayName = s.name && s.name.trim() ? s.name : `${s.lastName || ''} ${s.firstName || ''}`;
                return (
                  <div key={s.id} className="bg-white rounded-[20px] p-5 shadow-soft border border-white/50 flex flex-col gap-3 transition-all hover:shadow-md">
                    <div className="font-bold text-brand-text flex justify-between items-center text-lg">
                      <span>{displayName}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-black/5 px-3 py-1 rounded-full text-brand-text/50 shadow-inner border border-black/5">{s.importedClassLabel || s.classLabel}</span>
                    </div>
                    <div className="bg-brand-teal/10 border border-brand-teal/20 text-brand-teal p-4 rounded-[16px] text-sm whitespace-pre-wrap shadow-inner font-medium leading-relaxed">
                      {s.paiComment && s.paiComment.trim() !== "" ? s.paiComment : <span className="italic opacity-60">Aucun commentaire renseigné pour ce PAI.</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {ebepClassModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-[30px] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-indigo-500 text-white">
              <h2 className="text-xl font-black flex items-center gap-2"><Sparkles /> Commentaires EBEP - {currentClass}</h2>
              <button onClick={() => setEbepClassModalOpen(false)} className="hover:scale-110 transition-transform bg-white/20 hover:bg-white/30 p-2 rounded-full">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-brand-bg">
              {classStudentsWithEbep.length === 0 && (
                <div className="text-center text-brand-text/50 font-bold py-8">Aucun élève avec EBEP dans cette classe.</div>
              )}
              {classStudentsWithEbep.map(s => (
                <div key={s.id} className="bg-white rounded-[20px] p-4 shadow-soft border border-white/50 flex flex-col gap-2 transition-all hover:shadow-md">
                  <div className="font-bold text-brand-text flex justify-between items-center text-lg px-1">
                    <span>{s.name && s.name.trim() ? s.name : `${s.lastName || ''} ${s.firstName || ''}`}</span>
                  </div>
                  <textarea
                    className="w-full h-24 rounded-[16px] p-4 text-sm focus:outline-none resize-none bg-black/5 text-brand-text border border-transparent focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder-brand-text/30 shadow-inner"
                    placeholder="Détails de l'EBEP (ex: Dyslexie, TDAH, aménagement spécifique...)"
                    defaultValue={s.ebepComment || ""}
                    onBlur={async (e) => {
                      if (e.target.value !== (s.ebepComment || "")) {
                        await updateDoc(doc(db, "repart_students", s.id), { ebepComment: e.target.value });
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {ebepTeamModalOpen !== null && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-[30px] w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-indigo-500 text-white">
              <h2 className="text-xl font-black flex items-center gap-2"><Sparkles /> EBEP - {teams.find(t => t.numId === ebepTeamModalOpen)?.name}</h2>
              <button onClick={() => setEbepTeamModalOpen(null)} className="hover:scale-110 transition-transform bg-white/20 hover:bg-white/30 p-2 rounded-full">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-brand-bg">
              {students.filter(s => s.team === ebepTeamModalOpen && s.ebep && !s.isAdult).map(s => {
                const displayName = s.name && s.name.trim() ? s.name : `${s.lastName || ''} ${s.firstName || ''}`;
                return (
                  <div key={s.id} className="bg-white rounded-[20px] p-5 shadow-soft border border-white/50 flex flex-col gap-3 transition-all hover:shadow-md">
                    <div className="font-bold text-brand-text flex justify-between items-center text-lg">
                      <span>{displayName}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-black/5 px-3 py-1 rounded-full text-brand-text/50 shadow-inner border border-black/5">{s.importedClassLabel || s.classLabel}</span>
                    </div>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 p-4 rounded-[16px] text-sm whitespace-pre-wrap shadow-inner font-medium leading-relaxed">
                      {s.ebepComment && s.ebepComment.trim() !== "" ? s.ebepComment : <span className="italic opacity-60">Aucun commentaire renseigné pour cet EBEP.</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {studentModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setStudentModalOpen(false); }}>
          <div className="bg-white rounded-[30px] w-full max-w-md flex flex-col shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-brand-teal text-white">
              <h2 className="text-xl font-black flex items-center gap-2"><User /> Nouvel Élève</h2>
              <button onClick={() => setStudentModalOpen(false)} className="hover:scale-110 transition-transform bg-white/20 hover:bg-white/30 p-2 rounded-full">✕</button>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 flex-1 space-y-4 bg-brand-bg">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-text/60 ml-1">Nom</label>
                <input type="text" required placeholder="Ex: DUPONT" className="w-full px-4 py-3 rounded-[16px] focus:outline-none text-sm bg-white/80 border border-white shadow-inner focus:ring-2 focus:ring-brand-teal text-brand-text font-bold uppercase" value={newStudentLastName} onChange={(e) => setNewStudentLastName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-text/60 ml-1">Prénom</label>
                <input type="text" required placeholder="Ex: Jean" className="w-full px-4 py-3 rounded-[16px] focus:outline-none text-sm bg-white/80 border border-white shadow-inner focus:ring-2 focus:ring-brand-teal text-brand-text font-bold" value={newStudentFirstName} onChange={(e) => setNewStudentFirstName(e.target.value)} />
              </div>
              <div className="flex gap-4">
                <div className="space-y-1 flex-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-text/60 ml-1">Genre</label>
                  <select required value={newStudentGender} onChange={(e) => setNewStudentGender(e.target.value)} className="w-full px-4 py-3 rounded-[16px] focus:outline-none text-sm bg-white/80 border border-white shadow-inner focus:ring-2 focus:ring-brand-teal text-brand-text font-bold">
                    <option value="" disabled>Choisir</option>
                    <option value="M">Garçon (M)</option>
                    <option value="F">Fille (F)</option>
                  </select>
                </div>
                <div className="space-y-1 flex-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-text/60 ml-1">Classe</label>
                  <select required value={newStudentClass} onChange={(e) => setNewStudentClass(e.target.value)} className="w-full px-4 py-3 rounded-[16px] focus:outline-none text-sm bg-white/80 border border-white shadow-inner focus:ring-2 focus:ring-brand-teal text-brand-text font-bold">
                    {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full mt-4 py-4 rounded-[16px] transition-all disabled:opacity-50 bg-brand-teal text-white font-black hover:bg-brand-teal/90 shadow-soft hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2">
                Créer l'élève
              </button>
            </form>
          </div>
        </div>
      )}
      {addClassModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setAddClassModalOpen(false); }}>
          <div className="bg-white rounded-[30px] w-full max-w-md flex flex-col shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-indigo-600 text-white">
              <h2 className="text-xl font-black flex items-center gap-2"><Plus /> Nouvelle Classe</h2>
              <button onClick={() => setAddClassModalOpen(false)} className="hover:scale-110 transition-transform bg-white/20 hover:bg-white/30 p-2 rounded-full">✕</button>
            </div>
            <form onSubmit={handleAddClass} className="p-6 flex-1 space-y-4 bg-brand-bg">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-text/60 ml-1">Nom de la classe</label>
                <input type="text" required placeholder="Ex: CM1-CM2 A" className="w-full px-4 py-3 rounded-[16px] focus:outline-none text-sm bg-white/80 border border-white shadow-inner focus:ring-2 focus:ring-indigo-500 text-brand-text font-bold" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="w-full mt-4 py-4 rounded-[16px] transition-all disabled:opacity-50 bg-indigo-600 text-white font-black hover:bg-indigo-700 shadow-soft hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2">
                Créer la classe
              </button>
            </form>
          </div>
        </div>
      )}
      {filterModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setFilterModalOpen(false); }}>
          <div className="bg-white rounded-[30px] w-full max-w-md flex flex-col shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-indigo-500 text-white">
              <h2 className="text-xl font-black flex items-center gap-2"><Filter /> Filtrer les classes</h2>
              <button onClick={() => setFilterModalOpen(false)} className="hover:scale-110 transition-transform bg-white/20 hover:bg-white/30 p-2 rounded-full">✕</button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-2 bg-brand-bg">
              <div className="flex justify-between items-center mb-4 px-2">
                <button onClick={() => setHiddenClassIds([])} className="text-xs font-bold text-indigo-500 hover:underline">Tout cocher</button>
                <button onClick={() => setHiddenClassIds(teams.map(t => t.numId))} className="text-xs font-bold text-brand-text/40 hover:underline">Tout décocher</button>
              </div>
              {teams.map(team => (
                <label key={team.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-white/50 shadow-sm cursor-pointer hover:bg-indigo-50 transition-colors">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded-lg border-2 border-brand-bg text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                    checked={!hiddenClassIds.includes(team.numId)}
                    onChange={() => toggleClassVisibility(team.numId)}
                  />
                  <span className="font-bold text-brand-text">{team.name}</span>
                </label>
              ))}
              {teams.length === 0 && <p className="text-center text-brand-text/40 py-4 font-bold">Aucune classe créée.</p>}
            </div>
          </div>
        </div>
      )}
      {helpModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-[3px] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setHelpModalOpen(false); }}>
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-black/5 flex justify-between items-center bg-gradient-to-r from-brand-teal to-indigo-600 text-white shadow-lg">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-2xl"><Info size={24} /></div>
                <h2 className="text-2xl font-black tracking-tight">Guide d'utilisation</h2>
              </div>
              <button onClick={() => setHelpModalOpen(false)} className="hover:scale-110 transition-transform bg-white/20 hover:bg-white/30 p-2 rounded-full font-bold">✕</button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 space-y-8 bg-brand-bg">
              <section className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-brand-teal flex items-center gap-2 px-1"><User className="text-brand-teal" size={16} /> Cartes Élèves & Statuts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-[24px] shadow-sm border border-white/50 flex items-start gap-3 transition-all hover:shadow-md">
                    <div className="p-2 rounded-full bg-yellow-500/20 text-yellow-500 shrink-0"><AlertCircle size={18} fill="currentColor" /></div>
                    <div>
                      <p className="font-bold text-sm">Départ incertain</p>
                      <p className="text-xs text-brand-text/60 leading-relaxed mt-1">L'élève n'est pas sûr de rester l'année prochaine. La carte devient jaune.</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-[24px] shadow-sm border border-white/50 flex items-start gap-3 transition-all hover:shadow-md">
                    <div className="p-2 rounded-full bg-red-500/20 text-red-500 shrink-0"><XCircle size={18} fill="currentColor" /></div>
                    <div>
                      <p className="font-bold text-sm">Départ confirmé</p>
                      <p className="text-xs text-brand-text/60 leading-relaxed mt-1">L'élève ne revient sûrement pas. La carte devient rouge.</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-[24px] shadow-sm border border-white/50 flex items-start gap-3 transition-all hover:shadow-md">
                    <div className="p-2 rounded-full bg-brand-teal/20 text-brand-teal shrink-0"><FileText size={18} fill="currentColor" /></div>
                    <div>
                      <p className="font-bold text-sm">PAI</p>
                      <p className="text-xs text-brand-text/60 leading-relaxed mt-1">Signale un Projet d'Accueil Individualisé. Cliquez sur l'icône dans le titre ou sur la carte pour voir les détails.</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-[24px] shadow-sm border border-white/50 flex items-start gap-3 transition-all hover:shadow-md">
                    <div className="p-2 rounded-full bg-indigo-500/20 text-indigo-500 shrink-0"><Sparkles size={18} fill="currentColor" /></div>
                    <div>
                      <p className="font-bold text-sm">EBEP</p>
                      <p className="text-xs text-brand-text/60 leading-relaxed mt-1">Élève à Besoins Éducatifs Particuliers. Cliquez pour les aménagements spécifiques.</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-[24px] shadow-sm border border-white/50 flex items-start gap-3 transition-all hover:shadow-md">
                    <div className="p-2 rounded-full bg-brand-coral/20 text-brand-coral shrink-0"><Flag size={18} fill="currentColor" /></div>
                    <div>
                      <p className="font-bold text-sm">À surveiller</p>
                      <p className="text-xs text-brand-text/60 leading-relaxed mt-1">Élève perturbateur ou nécessitant une attention particulière lors de la répartition.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-brand-teal flex items-center gap-2 px-1"><Users className="text-brand-teal" size={16} /> Outils de Gestion</h3>
                <div className="space-y-3">
                  <div className="bg-white p-5 rounded-[24px] shadow-sm border border-white/50 flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="flex gap-2 shrink-0">
                      <div className="p-2 rounded-full bg-black/5 text-brand-text/60 shadow-inner"><ChevronUp size={18} /></div>
                      <div className="p-2 rounded-full bg-black/5 text-brand-text/60 shadow-inner"><ChevronDown size={18} /></div>
                    </div>
                    <p className="text-sm font-medium"><b>Plier/Déplier :</b> Boutons pour masquer ou afficher le contenu des classes. Un bouton général permet de tout plier/déplier d'un coup.</p>
                  </div>
                  <div className="bg-white p-5 rounded-[24px] shadow-sm border border-white/50 flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="p-2 rounded-full bg-black/5 text-brand-text/60 shrink-0 shadow-inner"><Filter size={18} /></div>
                    <p className="text-sm font-medium"><b>Filtrer :</b> Masquez certaines classes pour vous concentrer sur une partie spécifique de l'école.</p>
                  </div>
                  <div className="bg-white p-5 rounded-[24px] shadow-sm border border-white/50 flex items-center gap-4 transition-all hover:shadow-md">
                    <div className="p-2 rounded-full bg-black/5 text-brand-text/60 shrink-0 shadow-inner"><Printer size={18} /></div>
                    <p className="text-sm font-medium"><b>Imprimer :</b> Génère un PDF complet de la liste des élèves pour la classe sélectionnée.</p>
                  </div>
                </div>
              </section>

              <div className="bg-indigo-50 p-6 rounded-[30px] border border-indigo-100 flex items-start gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-500 shrink-0"><Plus size={24} /></div>
                <div>
                  <h4 className="font-bold text-indigo-900">Astuce : Drag & Drop</h4>
                  <p className="text-sm text-indigo-700/80 leading-relaxed mt-1">Glissez-déposez les élèves de la liste de gauche vers les futures classes à droite. Vous pouvez aussi les déplacer entre les classes ou les remettre dans la liste d'attente (à gauche).</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-white border-t border-black/5 flex justify-center shadow-inner">
              <button onClick={() => setHelpModalOpen(false)} className="px-12 py-4 bg-gradient-to-r from-brand-teal to-indigo-600 text-white font-black rounded-full hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all">J'ai compris !</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PersonCard = memo(function PersonCard({ student, onDragStart, onToggle, onToggleStatus, onDelete }) {
  const isAdult = student.isAdult;
  const status = student.status;
  const displayName = student.name && student.name.trim() ? student.name : `${student.lastName || ''} ${student.firstName || ''}`;
  const handleLocalDragStart = (e) => { onDragStart(e, student.id); requestAnimationFrame(() => { requestAnimationFrame(() => { if (e.target) { e.target.classList.add('opacity-40', 'grayscale', 'border-dashed'); } }); }); };
  const handleDragEnd = (e) => { if (e.target) { e.target.classList.remove('opacity-40', 'grayscale', 'border-dashed'); } };

  let cardBg = "bg-white";
  let borderColor = "border-white/50";
  if (status === 'leaving') { cardBg = "bg-red-50"; borderColor = "border-red-200"; }
  else if (status === 'uncertain') { cardBg = "bg-yellow-50"; borderColor = "border-yellow-200"; }
  else if (isAdult) { cardBg = "bg-brand-coral/5"; borderColor = "border-brand-coral"; }

  return (
    <div draggable onDragStart={handleLocalDragStart} onDragEnd={handleDragEnd} className={`border ${borderColor} rounded-[20px] p-3 shadow-sm cursor-grab active:cursor-grabbing relative hover:shadow-md transition-all group flex justify-between items-start select-none ${cardBg} text-brand-text`}>
      <div className="pr-2 overflow-hidden min-w-0 flex-1">
        <div className="font-bold text-sm truncate tracking-tight">{displayName}</div>
        <div className="text-[10px] uppercase text-brand-text/50 mt-0.5 font-bold truncate tracking-wide">
          {isAdult ? <span className="text-brand-coral">{student.role} • {student.importedClassLabel || student.classLabel}</span> : (student.importedClassLabel || student.classLabel)}
        </div>
      </div>
      <div className="flex gap-1 shrink-0 items-center">
        {!isAdult && (
          <>
            <button onClick={() => onToggleStatus(student.id, 'uncertain')} className={`p-1 rounded-full shadow-inner hover:scale-110 active:scale-95 transition-all ${status === 'uncertain' ? 'text-yellow-500 bg-yellow-500/20' : 'text-brand-text/10 bg-black/5 hover:text-yellow-500/80 hover:bg-white'}`} title="Pas sûr de rester"><AlertCircle size={14} fill={status === 'uncertain' ? "currentColor" : "none"} /></button>
            <button onClick={() => onToggleStatus(student.id, 'leaving')} className={`p-1 rounded-full shadow-inner hover:scale-110 active:scale-95 transition-all ${status === 'leaving' ? 'text-red-500 bg-red-500/20' : 'text-brand-text/10 bg-black/5 hover:text-red-500/80 hover:bg-white'}`} title="Sûr de ne pas revenir"><XCircle size={14} fill={status === 'leaving' ? "currentColor" : "none"} /></button>
            <div className="w-px h-4 bg-brand-text/10 mx-0.5"></div>
            <button onClick={() => onToggle(student.id, 'pai')} className={`p-1 rounded-full shadow-inner hover:scale-110 active:scale-95 transition-all ${student.pai ? 'text-brand-teal bg-brand-teal/20' : 'text-brand-text/20 bg-black/5 hover:text-brand-teal/80 hover:bg-white'}`} title="Signaler PAI"><FileText size={14} fill={student.pai ? "currentColor" : "none"} /></button>
            <button onClick={() => onToggle(student.id, 'ebep')} className={`p-1 rounded-full shadow-inner hover:scale-110 active:scale-95 transition-all ${student.ebep ? 'text-indigo-500 bg-indigo-500/20' : 'text-brand-text/20 bg-black/5 hover:text-indigo-500/80 hover:bg-white'}`} title="Signaler EBEP"><Sparkles size={14} fill={student.ebep ? "currentColor" : "none"} /></button>
            <button onClick={() => onToggle(student.id, 'disruptive')} className={`p-1 rounded-full shadow-inner hover:scale-110 active:scale-95 transition-all ${student.disruptive ? 'text-brand-coral bg-brand-coral/20' : 'text-brand-text/20 bg-black/5 hover:text-brand-coral/80 hover:bg-white'}`} title="Élève à surveiller"><Flag size={14} fill={student.disruptive ? "currentColor" : "none"} /></button>
          </>
        )}
        <button onClick={() => onDelete(student.id)} className="text-brand-text/30 hover:text-brand-coral opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white shadow-soft rounded-full absolute -top-2 -right-2"><Trash2 size={12} /></button>
      </div>
    </div>
  );
});
