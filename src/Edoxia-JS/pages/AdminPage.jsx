import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogIn, LayoutDashboard, Download, Upload, Bug, Database, ArrowLeft, GraduationCap, Printer, Users, CheckSquare, Square, Save, X, Edit3, Lock, Unlock, Trash2, FileText, Flag, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { updateDoc, deleteDoc, addDoc, doc, collection, writeBatch, getDocs, query, onSnapshot, orderBy } from 'firebase/firestore';
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

const generateTeamsPDF = (selectedTeamIds, teams, students) => {
    const doc = new jsPDF();
    let yPos = 20;

    selectedTeamIds.forEach((teamId, index) => {
        const team = teams.find(t => t.numId === teamId);
        if (!team) return;
        const teamMembers = students.filter(s => s.team === teamId).sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));
        const studentCount = teamMembers.filter(s => !s.isAdult).length;
        const adultCount = teamMembers.filter(s => s.isAdult).length;

        if (index > 0) { doc.addPage(); yPos = 20; }
        doc.setFontSize(22);
        doc.setTextColor(0, 119, 182); 
        doc.text(team.name.toUpperCase(), 105, yPos, { align: 'center' });
        yPos += 10;
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`${studentCount} élèves | ${adultCount} adultes`, 105, yPos, { align: 'center' });

        const tableData = teamMembers.map(s => {
            let lastName = s.lastName ? s.lastName.toUpperCase() : s.name.split(' ')[0].toUpperCase();
            let firstName = s.firstName ? s.firstName : s.name.split(' ').slice(1).join(' ');
            return [lastName, firstName, s.isAdult ? (s.role || "Adulte") : s.classLabel];
        });

        autoTable(doc, {
            startY: yPos + 10,
            head: [['Nom', 'Prénom', 'Classe / Rôle']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [0, 119, 182] },
            didParseCell: function(data) {
                if (data.section === 'body' && data.row.index < teamMembers.length && teamMembers[data.row.index].isAdult) {
                    data.cell.styles.textColor = [220, 38, 38];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });
    });
    doc.save(`Equipes_Selection.pdf`);
};

export default function AdminPage({ students: propStudents, teams: propTeams }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState('overview');

  // Chargement des données si non fournies par les props
  const [students, setStudents] = useState(propStudents || []);
  const [teams, setTeams] = useState(propTeams || []);

  useEffect(() => {
    if (propStudents && propTeams) return;
    
    const unsubStudents = onSnapshot(collection(db, "students"), (snap) => {
        setStudents(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });
    const qTeams = query(collection(db, "teams"), orderBy("numId"));
    const unsubTeams = onSnapshot(qTeams, (snap) => {
        setTeams(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });
    return () => { unsubStudents(); unsubTeams(); };
  }, [propStudents, propTeams]);

  if (!isAuthenticated) { 
      return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
            <div className={`p-10 rounded-3xl shadow-2xl w-full max-w-md text-center border ${isDark ? 'bg-slate-900/50 border-slate-800 backdrop-blur-xl' : 'bg-white border-slate-200'}`}>
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform rotate-3 ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-600 text-white'}`}>
                    <Settings size={40} />
                </div>
                <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Administration</h2>
                <p className={`text-sm mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Veuillez vous identifier pour accéder à l'espace administrateur.</p>
                
                <form onSubmit={(e) => { e.preventDefault(); if(password === "stpbb") setIsAuthenticated(true); else alert("Erreur"); }} className="flex flex-col gap-4">
                    <div className="relative">
                        <input 
                            type="password" 
                            className={`w-full p-4 rounded-xl outline-none border-2 transition-all font-bold text-center tracking-widest ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500 focus:shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white'}`} 
                            autoFocus 
                            placeholder="••••••" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                        />
                    </div>
                    <button className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'}`}>
                        <LogIn size={20} /> Connexion
                    </button>
                </form>
                
                <button onClick={() => navigate('/JS2026')} className={`mt-8 text-sm font-medium transition-colors flex items-center justify-center gap-2 mx-auto ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
                    <ArrowLeft size={16} /> Retour au Hub
                </button>
            </div>
        </div>
      ); 
  }
  
  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans ${isDark ? 'bg-[#020617] text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
      <aside className={`hidden md:flex w-64 flex flex-col h-screen sticky top-0 ${isDark ? 'bg-slate-900 border-r border-slate-800' : 'bg-slate-900 text-white'}`}>
          <div className={`p-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-700'}`}>
              <button onClick={() => navigate('/JS2026')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm font-medium"><ArrowLeft size={18} /> Retour</button>
              <h2 className="text-xl font-bold text-white">Interface admin</h2>
          </div>
          <nav className="flex-1 p-4 space-y-2">
              <AdminTabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutDashboard size={20}/>} label="Vue d'ensemble" isDark={isDark} />
              <AdminTabButton active={activeTab === 'export'} onClick={() => setActiveTab('export')} icon={<Download size={20}/>} label="Exports PDF" isDark={isDark} />
              <AdminTabButton active={activeTab === 'import'} onClick={() => setActiveTab('import')} icon={<Upload size={20}/>} label="Importer Élèves" isDark={isDark} />
              <AdminTabButton active={activeTab === 'bugs'} onClick={() => setActiveTab('bugs')} icon={<Bug size={20}/>} label="Signalements" isDark={isDark} />
              <AdminTabButton active={activeTab === 'danger'} onClick={() => setActiveTab('danger')} icon={<Database size={20}/>} label="Maintenance" isDark={isDark} />
          </nav>
      </aside>
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className={`p-4 md:p-6 shadow-sm border-b flex justify-between items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-lg md:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {activeTab === 'overview' && "Vue Globale"}
                {activeTab === 'export' && "Exports PDF"}
                {activeTab === 'import' && "Import"}
                {activeTab === 'bugs' && "Gestion des Bugs"}
                {activeTab === 'danger' && "Maintenance"}
            </h2>
            <div className={`text-sm font-medium px-3 py-1 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{students.length} élèves</div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
            {activeTab === 'overview' && <AdminOverview students={students} teams={teams} isDark={isDark} />}
            {activeTab === 'export' && <AdminExport students={students} teams={teams} isDark={isDark} />}
            {activeTab === 'import' && <AdminImport isDark={isDark} />}
            {activeTab === 'bugs' && <AdminBugs isDark={isDark} />}
            {activeTab === 'danger' && <AdminDanger isDark={isDark} />}
        </div>
      </div>
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 flex justify-around p-3 pb-safe z-50 border-t ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-900 text-white border-slate-800'}`}>
          <button onClick={() => setActiveTab('overview')} className={`p-2 rounded-xl ${activeTab === 'overview' ? 'bg-edoxia-blue text-white' : 'text-slate-400'}`}><LayoutDashboard size={20} /></button>
          <button onClick={() => setActiveTab('export')} className={`p-2 rounded-xl ${activeTab === 'export' ? 'bg-edoxia-blue text-white' : 'text-slate-400'}`}><Download size={20} /></button>
          <button onClick={() => setActiveTab('import')} className={`p-2 rounded-xl ${activeTab === 'import' ? 'bg-edoxia-blue text-white' : 'text-slate-400'}`}><Upload size={20} /></button>
          <button onClick={() => setActiveTab('bugs')} className={`p-2 rounded-xl ${activeTab === 'bugs' ? 'bg-edoxia-blue text-white' : 'text-slate-400'}`}><Bug size={20} /></button>
          <button onClick={() => navigate('/JS2026')} className="p-2 text-slate-400"><ArrowLeft size={20} /></button>
      </nav>
    </div>
  );
}

function AdminTabButton({ active, onClick, icon, label, isDark }) { 
    return <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-edoxia-blue text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>{icon}<span className="font-medium">{label}</span></button> 
}

function AdminExport({ students, teams, isDark }) {
    const [selectedTeams, setSelectedTeams] = useState([]);
    const toggleTeamSelection = (teamId) => { setSelectedTeams(prev => prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]); };
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}><GraduationCap className="text-edoxia-blue"/> Listes par Classe</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{CLASSES.map(cls => (<button key={cls} onClick={() => generateClassPDF(cls, students, teams)} className={`flex items-center justify-between p-3 rounded-xl transition-all text-sm group border ${isDark ? 'bg-slate-950 border-slate-800 hover:bg-slate-800 hover:border-cyan-500' : 'bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-300'}`}><span className={`truncate mr-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{cls}</span><Printer size={16} className={`group-hover:text-blue-600 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}/></button>))}</div>
            </div>
            <div className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center mb-4"><h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}><Users className="text-edoxia-blue"/> Listes par Équipe</h3><button onClick={() => generateTeamsPDF(selectedTeams, teams, students)} disabled={selectedTeams.length === 0} className="bg-edoxia-blue text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 hover:bg-blue-700 transition flex items-center gap-2"><Download size={18} /> Générer PDF ({selectedTeams.length})</button></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{teams.map(team => { const isSelected = selectedTeams.includes(team.numId); return (<button key={team.id} onClick={() => toggleTeamSelection(team.numId)} className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${isSelected ? (isDark ? 'border-cyan-500 bg-cyan-900/20' : 'border-edoxia-blue bg-blue-50') : (isDark ? 'border-slate-800 bg-slate-950 hover:bg-slate-900' : 'border-slate-200 bg-white hover:bg-slate-50')}`}>{isSelected ? <CheckSquare className="text-edoxia-blue" /> : <Square className={isDark ? "text-slate-700" : "text-slate-300"} />}<span className={`font-bold ${isSelected ? 'text-edoxia-blue' : (isDark ? 'text-slate-300' : 'text-slate-600')}`}>{team.name}</span></button>) })}</div>
                <div className="mt-4 flex gap-2"><button onClick={() => setSelectedTeams(teams.map(t => t.numId))} className="text-xs text-slate-500 hover:text-blue-600 underline">Tout sélectionner</button><button onClick={() => setSelectedTeams([])} className="text-xs text-slate-500 hover:text-blue-600 underline">Tout désélectionner</button></div>
            </div>
        </div>
    );
}

function AdminOverview({ students, teams, isDark }) {
    const [editingTeam, setEditingTeam] = useState(null); const [newName, setNewName] = useState(""); const [newColor, setNewColor] = useState("#0077b6");
    const startEdit = (team) => { setEditingTeam(team.id); setNewName(team.name); setNewColor(team.color || "#0077b6"); };
    const saveEdit = async (teamId) => { if(newName.trim()) { await updateDoc(doc(db, "teams", teamId), { name: newName, color: newColor }); } setEditingTeam(null); };
    const toggleLock = async (team) => { await updateDoc(doc(db, "teams", team.id), { locked: !team.locked }); };
    const addTeam = async () => { const maxId = teams.length > 0 ? Math.max(...teams.map(t => t.numId)) : 0; const newNumId = maxId + 1; await addDoc(collection(db, "teams"), { name: `Équipe `, numId: newNumId, color: "#0077b6", locked: false }); };
    const deleteTeam = async (teamId, studentCount) => { if (studentCount > 0) { alert("Impossible de supprimer une équipe qui contient des élèves."); return; } if (confirm("Supprimer cette équipe ?")) { await deleteDoc(doc(db, "teams", teamId)); } };
    return (
        <div className="pb-20"><div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">{teams.map(team => {
            const teamStudents = students.filter(s => s.team === team.numId);
            const boys = teamStudents.filter(s => s.gender && s.gender.toString().trim().toUpperCase() === 'M').length;
            const girls = teamStudents.filter(s => s.gender && s.gender.toString().trim().toUpperCase() === 'F').length;
            const paiCount = teamStudents.filter(s => s.pai).length;
            const disruptiveCount = teamStudents.filter(s => s.disruptive).length;
            const teamColor = team.color || '#0077b6'; const isLocked = team.locked;
            return (
                <div key={team.id} className={`rounded-2xl shadow-sm overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-white'}`} style={{ border: `2px solid ${isDark ? '#1e293b' : '#e2e8f0'}` }}><div className="p-4 border-b flex justify-between items-center text-white" style={{ backgroundColor: teamColor }}>{editingTeam === team.id ? (<div className="flex gap-2 items-center flex-1 mr-2"><input className="border rounded px-2 py-1 text-sm w-full text-slate-800" value={newName} onChange={e => setNewName(e.target.value)} autoFocus /><input type="color" className="h-8 w-8 rounded cursor-pointer border-none" value={newColor} onChange={e => setNewColor(e.target.value)}/><button onClick={() => saveEdit(team.id)} className="text-white hover:text-green-200"><Save size={18}/></button><button onClick={() => setEditingTeam(null)} className="text-white hover:text-red-200"><X size={18}/></button></div>) : (<div className="flex items-center gap-2"><h3 className="font-bold text-lg">{team.name}</h3><button onClick={() => startEdit(team)} className="text-white/70 hover:text-white"><Edit3 size={14}/></button></div>)}<div className="flex items-center gap-2"><button onClick={() => toggleLock(team)} className="text-white hover:scale-110 transition-transform" title={isLocked ? "Déverrouiller" : "Verrouiller"}>{isLocked ? <Lock size={18} /> : <Unlock size={18} className="opacity-70"/>}</button><span className="text-xs bg-white/20 text-white border border-white/30 rounded px-2 py-1">{teamStudents.filter(s => !s.isAdult).length} élèves</span>{teamStudents.filter(s => s.isAdult).length > 0 && <span className="text-xs bg-red-500/40 text-white border border-white/30 rounded px-2 py-1">{teamStudents.filter(s => s.isAdult).length} adu.</span>}<button onClick={() => deleteTeam(team.id, teamStudents.length)} className="text-white/70 hover:text-red-200"><Trash2 size={16}/></button></div></div>
                <div className={`px-4 py-2 border-b flex justify-end gap-4 text-xs font-bold ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}><span className="text-blue-600">G: {boys}</span><span className="text-pink-600">F: {girls}</span><div className="w-px bg-slate-300 h-3 my-auto"></div><span className={`flex items-center gap-1 ${paiCount > 0 ? 'text-blue-600' : 'text-slate-300'}`}><FileText size={12} strokeWidth={3} /> {paiCount}</span><span className={`flex items-center gap-1 ${disruptiveCount > 0 ? 'text-red-500' : 'text-slate-300'}`}><Flag size={12} strokeWidth={3} /> {disruptiveCount}</span></div>
                <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">{teamStudents.map(s => {
                    const displayName = s.name && s.name.trim() ? s.name : `${s.lastName || ''} ${s.firstName || ''}`;
                    return (<div key={s.id} className={`text-sm flex justify-between items-center p-2 border-b last:border-0 ${isDark ? 'hover:bg-slate-800 border-slate-800' : 'hover:bg-slate-50 border-slate-100'} ${s.isAdult ? (isDark ? 'bg-red-900/20' : 'bg-red-50') : ''}`}><div className="flex items-center gap-2"><span className={`font-medium ${s.isAdult ? 'text-red-500' : (isDark ? 'text-slate-300' : 'text-slate-700')}`}>{displayName}</span>{!s.isAdult && s.pai && <FileText size={14} className="text-blue-500" />}{!s.isAdult && s.disruptive && <Flag size={14} className="text-red-500 fill-red-500" />}</div><span className={`text-xs px-2 py-0.5 rounded-full ${s.isAdult ? (isDark ? 'bg-red-900/40 text-red-400 font-bold' : 'bg-red-100 text-red-700 font-bold') : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600')}`}>{s.isAdult ? s.role : s.classLabel}</span></div>)
                })}</div></div>
            )})}</div><div className="flex justify-center"><button onClick={addTeam} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all ${isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-edoxia-blue hover:bg-blue-700 text-white'}`}><Plus size={20} /> Ajouter une équipe</button></div></div>
    )
}

function AdminImport({ isDark }) {
    const [status, setStatus] = useState(null);
    const handleFileUpload = async (e) => { const file = e.target.files[0]; if (!file) return; setStatus({ type: 'loading', msg: 'Traitement...' }); const reader = new FileReader(); reader.onload = async (evt) => { try { const wb = XLSX.read(evt.target.result, { type: 'binary' }); const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]); const batch = writeBatch(db); let count = 0; data.forEach((row) => { const nom = row['Nom'] || row['nom'] || ''; const prenom = row['Prenom'] || row['prenom'] || ''; const classeExcel = row['Classe'] || row['classe'] || ''; const rawGenre = row['Genre'] || row['genre'] || row['Sexe'] || row['sexe'] || ''; const gender = rawGenre.toString().trim().toUpperCase(); const matchedClass = CLASSES.find(c => c.trim().toLowerCase() === classeExcel.trim().toLowerCase()); if ((nom || prenom) && matchedClass) { const docRef = doc(collection(db, "students")); batch.set(docRef, { name: `${nom} ${prenom}`.trim(), lastName: nom.toString().toUpperCase(), firstName: prenom.toString(), classLabel: matchedClass, team: null, pai: false, disruptive: false, gender: gender, createdAt: new Date() }); count++; } }); await batch.commit(); setStatus({ type: 'success', msg: ` élèves importés !` }); } catch (error) { setStatus({ type: 'error', msg: 'Erreur fichier.' }); } }; reader.readAsBinaryString(file); };
    return (<div className="max-w-xl mx-auto mt-10 text-center"><div className={`p-8 rounded-3xl border-2 border-dashed relative group ${isDark ? 'bg-slate-900 border-slate-700 hover:border-cyan-500' : 'bg-white border-slate-300 hover:border-edoxia-blue'}`}><input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" /><Upload size={48} className={`mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} /><h3 className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Glisser fichier Excel</h3><p className="text-sm text-slate-400 mt-2">Colonnes : nom, prenom, classe, genre</p></div>{status && <div className={`mt-6 p-4 rounded-xl ${status.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{status.msg}</div>}</div>)
}

function AdminBugs({ isDark }) {
    const [bugs, setBugs] = useState([]);
    useEffect(() => { const q = query(collection(db, "bugReports")); const unsub = onSnapshot(q, (snap) => { const list = snap.docs.map(d => ({id: d.id, ...d.data()})); list.sort((a, b) => new Date(b.date) - new Date(a.date)); setBugs(list); }); return () => unsub(); }, []);
    const deleteBug = async (id) => { if(confirm("Supprimer ce signalement ?")) { await deleteDoc(doc(db, "bugReports", id)); } };
    if(bugs.length === 0) return <div className="text-center text-slate-400 py-10 italic">Aucun signalement pour le moment.</div>;
    return (<div className="grid grid-cols-1 gap-4 pb-20 max-w-3xl mx-auto">{bugs.map(bug => (<div key={bug.id} className={`rounded-xl shadow-sm border p-4 flex gap-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}><div className="bg-red-500/10 text-red-500 p-3 rounded-full h-fit shrink-0"><Bug size={24} /></div><div className="flex-1"><div className="flex justify-between items-start"><div><h4 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{bug.prenom} {bug.nom}</h4><div className="text-xs text-slate-400">{new Date(bug.date).toLocaleString()}</div></div><button onClick={() => deleteBug(bug.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={18} /></button></div><p className={`mt-2 text-sm p-3 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>{bug.message}</p></div></div>))}</div>);
}

function AdminDanger({ isDark }) {
    const handleReset = async () => { if(confirm("Tout effacer ?")) { const batch = writeBatch(db); const snaps = await getDocs(collection(db, "students")); snaps.forEach(d => batch.delete(d.ref)); await batch.commit(); alert("Terminé."); } }
    return <div className={`max-w-xl mx-auto mt-10 p-6 rounded-2xl text-center ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}><h3 className={`font-bold mb-4 ${isDark ? 'text-red-400' : 'text-red-800'}`}>Zone Danger</h3><button onClick={handleReset} className={`px-4 py-2 rounded border font-bold ${isDark ? 'bg-red-950 text-red-400 border-red-900 hover:bg-red-900' : 'bg-white text-red-600 border-red-200 hover:bg-red-50'}`}>Tout effacer</button></div>
}
