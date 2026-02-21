import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogIn, LayoutDashboard, Download, Upload, Bug, Database, ArrowLeft, GraduationCap, Printer, Users, CheckSquare, Square, Save, X, Edit3, Lock, Unlock, Trash2, FileText, Flag, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { updateDoc, deleteDoc, addDoc, doc, collection, writeBatch, getDocs, query, onSnapshot, orderBy } from 'firebase/firestore';
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
            didParseCell: function (data) {
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
            setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const qTeams = query(collection(db, "teams"), orderBy("numId"));
        const unsubTeams = onSnapshot(qTeams, (snap) => {
            setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => { unsubStudents(); unsubTeams(); };
    }, [propStudents, propTeams]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-brand-bg text-brand-text">
                <div className="p-10 rounded-[30px] shadow-soft w-full max-w-md text-center border border-white/50 bg-white/60 backdrop-blur-xl">
                    <div className="w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-inner bg-white text-brand-teal transform rotate-3">
                        <Settings size={40} />
                    </div>
                    <h2 className="text-3xl font-black mb-2 tracking-tight text-brand-text">Administration</h2>
                    <p className="text-xs font-bold uppercase tracking-wide mb-8 text-brand-text/50">Veuillez vous identifier pour accéder à l'espace administrateur.</p>

                    <form onSubmit={(e) => { e.preventDefault(); if (password === "stpbb") setIsAuthenticated(true); else alert("Erreur"); }} className="flex flex-col gap-4">
                        <div className="relative">
                            <input
                                type="password"
                                className="w-full p-4 rounded-[20px] outline-none border border-white transition-all font-bold text-center tracking-widest bg-white/80 focus:ring-2 focus:ring-brand-teal text-brand-text placeholder-brand-text/40 shadow-inner"
                                autoFocus
                                placeholder="••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                        <button className="w-full py-4 rounded-full font-black text-lg shadow-soft transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-teal/90 text-white">
                            <LogIn size={20} /> Connexion
                        </button>
                    </form>

                    <button onClick={() => navigate('/JS2026')} className="mt-8 text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2 mx-auto text-brand-text/40 hover:text-brand-text/80">
                        <ArrowLeft size={16} /> Retour au Hub
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden flex flex-col md:flex-row font-sans bg-brand-bg text-brand-text">
            <aside className="hidden md:flex flex-col w-64 bg-white/40 backdrop-blur-md border-r border-white/50 z-20">
                <div className="p-6 border-b border-white/50 bg-white/40">
                    <button onClick={() => navigate('/JS2026')} className="flex items-center gap-2 text-brand-text/50 hover:text-brand-text transition-colors mb-4 text-[10px] font-bold uppercase tracking-widest"><ArrowLeft size={16} /> Retour</button>
                    <h2 className="text-xl font-black tracking-tight text-brand-text flex items-center gap-2"><Settings className="text-brand-teal" /> Admin</h2>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <AdminTabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<LayoutDashboard size={20} />} label="Vue d'ensemble" />
                    <AdminTabButton active={activeTab === 'export'} onClick={() => setActiveTab('export')} icon={<Download size={20} />} label="Exports PDF" />
                    <AdminTabButton active={activeTab === 'import'} onClick={() => setActiveTab('import')} icon={<Upload size={20} />} label="Importer Élèves" />
                    <AdminTabButton active={activeTab === 'bugs'} onClick={() => setActiveTab('bugs')} icon={<Bug size={20} />} label="Signalements" />
                    <AdminTabButton active={activeTab === 'danger'} onClick={() => setActiveTab('danger')} icon={<Database size={20} />} label="Maintenance" />
                </nav>
            </aside>
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header className="p-5 md:p-6 shadow-soft border-b border-white/50 bg-white/40 backdrop-blur-xl flex justify-between items-center z-10">
                    <h2 className="text-xl md:text-2xl font-black tracking-tight text-brand-text">
                        {activeTab === 'overview' && "Vue Globale"}
                        {activeTab === 'export' && "Exports PDF"}
                        {activeTab === 'import' && "Import"}
                        {activeTab === 'bugs' && "Signalements Bugs"}
                        {activeTab === 'danger' && "Maintenance"}
                    </h2>
                    <div className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/5 text-brand-text/60 shadow-inner">{students.length} élèves</div>
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 relative z-0">
                    {activeTab === 'overview' && <AdminOverview students={students} teams={teams} />}
                    {activeTab === 'export' && <AdminExport students={students} teams={teams} />}
                    {activeTab === 'import' && <AdminImport />}
                    {activeTab === 'bugs' && <AdminBugs />}
                    {activeTab === 'danger' && <AdminDanger />}
                </div>
            </div>
            <nav className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around p-3 pb-safe z-50 border-t border-white/50 bg-white/80 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <button onClick={() => setActiveTab('overview')} className={`p-3 rounded-full transition-all ${activeTab === 'overview' ? 'bg-brand-teal text-white shadow-soft scale-110' : 'text-brand-text/40 hover:bg-white/50'}`}><LayoutDashboard size={22} /></button>
                <button onClick={() => setActiveTab('export')} className={`p-3 rounded-full transition-all ${activeTab === 'export' ? 'bg-brand-teal text-white shadow-soft scale-110' : 'text-brand-text/40 hover:bg-white/50'}`}><Download size={22} /></button>
                <button onClick={() => setActiveTab('import')} className={`p-3 rounded-full transition-all ${activeTab === 'import' ? 'bg-brand-teal text-white shadow-soft scale-110' : 'text-brand-text/40 hover:bg-white/50'}`}><Upload size={22} /></button>
                <button onClick={() => navigate('/JS2026')} className="p-3 text-brand-text/40 hover:bg-white/50 rounded-full transition-all"><ArrowLeft size={22} /></button>
            </nav>
        </div>
    );
}

function AdminTabButton({ active, onClick, icon, label }) {
    return <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-[20px] transition-all font-bold tracking-tight ${active ? 'bg-white text-brand-teal shadow-soft' : 'text-brand-text/50 hover:bg-white/50 hover:text-brand-text'}`}>{icon}<span>{label}</span></button>
}

function AdminExport({ students, teams }) {
    const [selectedTeams, setSelectedTeams] = useState([]);
    const toggleTeamSelection = (teamId) => { setSelectedTeams(prev => prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]); };
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="p-6 rounded-[30px] border border-white/50 bg-white/60 backdrop-blur-md shadow-soft">
                <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-2 text-brand-text"><GraduationCap className="text-brand-teal" /> Listes par Classe</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{CLASSES.map(cls => (<button key={cls} onClick={() => generateClassPDF(cls, students, teams)} className="flex items-center justify-between p-4 rounded-[20px] transition-all text-sm group border border-white/80 bg-white shadow-sm hover:shadow-md hover:-translate-y-1"><span className="truncate mr-2 font-bold text-brand-text">{cls}</span><Printer size={16} className="text-brand-text/40 group-hover:text-brand-teal" /></button>))}</div>
            </div>
            <div className="p-6 rounded-[30px] border border-white/50 bg-white/60 backdrop-blur-md shadow-soft">
                <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-black tracking-tight flex items-center gap-2 text-brand-text"><Users className="text-brand-peach" /> Listes par Équipe</h3><button onClick={() => generateTeamsPDF(selectedTeams, teams, students)} disabled={selectedTeams.length === 0} className="bg-brand-teal text-white px-5 py-2.5 rounded-full font-black tracking-wide disabled:opacity-50 hover:bg-brand-teal/90 shadow-soft hover:scale-105 active:scale-95 transition-all flex items-center gap-2"><Download size={18} /> Générer PDF ({selectedTeams.length})</button></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{teams.map(team => { const isSelected = selectedTeams.includes(team.numId); return (<button key={team.id} onClick={() => toggleTeamSelection(team.numId)} className={`p-4 rounded-[20px] flex items-center gap-3 transition-all border shadow-sm ${isSelected ? 'border-brand-peach bg-white text-brand-peach' : 'border-white/50 bg-white/50 hover:bg-white text-brand-text/60'}`}>{isSelected ? <CheckSquare className="text-brand-peach" /> : <Square className="text-brand-text/30" />}<span className="font-bold">{team.name}</span></button>) })}</div>
                <div className="mt-4 flex gap-4 bg-white/40 p-3 rounded-[20px] shadow-inner border border-white/50"><button onClick={() => setSelectedTeams(teams.map(t => t.numId))} className="text-[10px] uppercase font-bold tracking-widest text-brand-text/50 hover:text-brand-teal">Tout sélectionner</button><div className="w-px bg-white"></div><button onClick={() => setSelectedTeams([])} className="text-[10px] uppercase font-bold tracking-widest text-brand-text/50 hover:text-brand-coral">Tout désélectionner</button></div>
            </div>
        </div>
    );
}

function AdminOverview({ students, teams }) {
    const [editingTeam, setEditingTeam] = useState(null); const [newName, setNewName] = useState(""); const [newColor, setNewColor] = useState("#0077b6");
    const startEdit = (team) => { setEditingTeam(team.id); setNewName(team.name); setNewColor(team.color || "#0077b6"); };
    const saveEdit = async (teamId) => { if (newName.trim()) { await updateDoc(doc(db, "teams", teamId), { name: newName, color: newColor }); } setEditingTeam(null); };
    const toggleLock = async (team) => { await updateDoc(doc(db, "teams", team.id), { locked: !team.locked }); };
    const addTeam = async () => { const maxId = teams.length > 0 ? Math.max(...teams.map(t => t.numId)) : 0; const newNumId = maxId + 1; await addDoc(collection(db, "teams"), { name: `Équipe `, numId: newNumId, color: "#0077b6", locked: false }); };
    const deleteTeam = async (teamId, studentCount) => { if (studentCount > 0) { alert("Impossible de supprimer une équipe qui contient des élèves."); return; } if (confirm("Supprimer cette équipe ?")) { await deleteDoc(doc(db, "teams", teamId)); } };
    return (
        <div className="pb-20"><div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">{teams.map(team => {
            const teamStudents = students.filter(s => s.team === team.numId);
            const boys = teamStudents.filter(s => s.gender && s.gender.toString().trim().toUpperCase() === 'M').length;
            const girls = teamStudents.filter(s => s.gender && s.gender.toString().trim().toUpperCase() === 'F').length;
            const paiCount = teamStudents.filter(s => s.pai).length;
            const disruptiveCount = teamStudents.filter(s => s.disruptive).length;
            const teamColor = team.color || '#0077b6'; const isLocked = team.locked;
            return (
                <div key={team.id} className={`rounded-[30px] shadow-soft overflow-hidden transition-all bg-white/80 backdrop-blur-md border border-white/50 relative ${isLocked ? 'grayscale-[30%]' : ''}`}>
                    <div className="absolute top-0 left-0 bottom-0 w-[6px] z-10" style={{ backgroundColor: isLocked ? '#a1a1aa' : teamColor }}></div>
                    <div className="pl-6 pr-4 py-4 border-b border-white/50 flex justify-between items-center bg-white/40">
                        {editingTeam === team.id ? (<div className="flex gap-2 items-center flex-1 mr-2"><input className="border border-white/80 bg-white rounded-[12px] px-3 py-1.5 text-sm w-full text-brand-text shadow-inner focus:outline-none focus:ring-2 focus:ring-brand-teal font-bold" value={newName} onChange={e => setNewName(e.target.value)} autoFocus /><input type="color" className="h-8 w-8 rounded-full cursor-pointer border-none shadow-sm shrink-0" value={newColor} onChange={e => setNewColor(e.target.value)} /><button onClick={() => saveEdit(team.id)} className="text-brand-teal p-1.5 bg-brand-teal/10 rounded-full hover:bg-brand-teal/20 transition-colors"><Save size={18} /></button><button onClick={() => setEditingTeam(null)} className="text-brand-coral p-1.5 bg-brand-coral/10 rounded-full hover:bg-brand-coral/20 transition-colors"><X size={18} /></button></div>) : (<div className="flex items-center gap-2"><h3 className="font-black text-xl tracking-tight text-brand-text truncate">{team.name}</h3><button onClick={() => startEdit(team)} className="text-brand-text/30 hover:text-brand-teal p-1"><Edit3 size={16} /></button></div>)}
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] uppercase tracking-widest font-bold bg-black/5 text-brand-text/60 shadow-inner px-2 py-0.5 rounded-full">{teamStudents.filter(s => !s.isAdult).length} élèves</span>
                            {teamStudents.filter(s => s.isAdult).length > 0 && <span className="text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full bg-brand-coral/20 text-brand-coral shadow-inner border border-brand-coral/30">{teamStudents.filter(s => s.isAdult).length} adu.</span>}
                            <button onClick={() => toggleLock(team)} className="p-1.5 hover:bg-white rounded-full transition-colors text-brand-text/40 hover:text-brand-text" title={isLocked ? "Déverrouiller" : "Verrouiller"}>{isLocked ? <Lock size={16} /> : <Unlock size={16} />}</button>
                            <button onClick={() => deleteTeam(team.id, teamStudents.length)} className="p-1.5 hover:bg-white rounded-full transition-colors text-brand-text/30 hover:text-brand-coral"><Trash2 size={16} /></button>
                        </div>
                    </div>
                    <div className="px-5 py-2.5 border-b border-white/50 flex justify-end gap-4 text-xs font-bold bg-black/5 shadow-inner"><span className="text-blue-600">G: {boys}</span><span className="text-pink-600">F: {girls}</span><div className="w-px bg-brand-text/20 h-3 my-auto"></div><span className={`flex items-center gap-1 ${paiCount > 0 ? 'text-brand-teal' : 'text-brand-text/30'}`}><FileText size={12} strokeWidth={3} /> {paiCount}</span><span className={`flex items-center gap-1 ${disruptiveCount > 0 ? 'text-brand-coral' : 'text-brand-text/30'}`}><Flag size={12} strokeWidth={3} /> {disruptiveCount}</span></div>
                    <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">{teamStudents.map(s => {
                        const displayName = s.name && s.name.trim() ? s.name : `${s.lastName || ''} ${s.firstName || ''}`;
                        return (<div key={s.id} className={`text-sm flex justify-between items-center p-3 rounded-[16px] border border-white/50 shadow-sm bg-white/70 ${s.isAdult ? 'border-brand-coral/40 bg-brand-coral/5 text-brand-coral' : ''}`}><div className="flex items-center gap-2"><span className={`font-bold text-brand-text ${s.isAdult ? 'text-brand-coral' : ''}`}>{displayName}</span>{!s.isAdult && s.pai && <div className="bg-brand-teal/20 text-brand-teal p-1 rounded-full"><FileText size={12} /></div>}{!s.isAdult && s.disruptive && <div className="bg-brand-coral/20 text-brand-coral p-1 rounded-full"><Flag size={12} /></div>}</div><span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full text-brand-text/50 bg-black/5">{s.isAdult ? s.role : s.classLabel}</span></div>)
                    })}</div></div>
            )
        })}</div><div className="flex justify-center"><button onClick={addTeam} className="px-6 py-3 rounded-full font-black tracking-wide flex items-center gap-2 shadow-soft hover:shadow-md transition-all bg-brand-teal hover:bg-brand-teal/90 text-white hover:scale-105 active:scale-95"><Plus size={20} /> Ajouter une équipe</button></div></div>
    )
}

function AdminImport() {
    const [status, setStatus] = useState(null);
    const handleFileUpload = async (e) => { const file = e.target.files[0]; if (!file) return; setStatus({ type: 'loading', msg: 'Traitement...' }); const reader = new FileReader(); reader.onload = async (evt) => { try { const wb = XLSX.read(evt.target.result, { type: 'binary' }); const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]); const batch = writeBatch(db); let count = 0; data.forEach((row) => { const nom = row['Nom'] || row['nom'] || ''; const prenom = row['Prenom'] || row['prenom'] || ''; const classeExcel = row['Classe'] || row['classe'] || ''; const rawGenre = row['Genre'] || row['genre'] || row['Sexe'] || row['sexe'] || ''; const gender = rawGenre.toString().trim().toUpperCase(); const matchedClass = CLASSES.find(c => c.trim().toLowerCase() === classeExcel.trim().toLowerCase()); if ((nom || prenom) && matchedClass) { const docRef = doc(collection(db, "students")); batch.set(docRef, { name: `${nom} ${prenom}`.trim(), lastName: nom.toString().toUpperCase(), firstName: prenom.toString(), classLabel: matchedClass, team: null, pai: false, disruptive: false, gender: gender, createdAt: new Date() }); count++; } }); await batch.commit(); setStatus({ type: 'success', msg: ` ${count} élèves importés !` }); } catch (error) { setStatus({ type: 'error', msg: 'Erreur fichier.' }); } }; reader.readAsBinaryString(file); };
    return (<div className="max-w-xl mx-auto mt-10 text-center"><div className="p-10 rounded-[30px] border-2 border-dashed relative group border-white hover:border-brand-teal transition-colors bg-white/40 backdrop-blur-md shadow-inner"><input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" /><Upload size={48} className="mx-auto mb-4 text-brand-text/30 group-hover:text-brand-teal transition-colors" /><h3 className="font-black text-brand-text text-xl tracking-tight">Glisser fichier Excel</h3><p className="text-xs uppercase font-bold tracking-widest text-brand-text/50 mt-2">Colonnes : nom, prenom, classe, genre</p></div>{status && <div className={`mt-6 p-4 rounded-[20px] font-bold shadow-sm ${status.type === 'success' ? 'bg-brand-teal/20 text-brand-teal' : 'bg-brand-coral/20 text-brand-coral'}`}>{status.msg}</div>}</div>)
}

function AdminBugs() {
    const [bugs, setBugs] = useState([]);
    useEffect(() => { const q = query(collection(db, "bugReports")); const unsub = onSnapshot(q, (snap) => { const list = snap.docs.map(d => ({ id: d.id, ...d.data() })); list.sort((a, b) => new Date(b.date) - new Date(a.date)); setBugs(list); }); return () => unsub(); }, []);
    const deleteBug = async (id) => { if (confirm("Supprimer ce signalement ?")) { await deleteDoc(doc(db, "bugReports", id)); } };
    if (bugs.length === 0) return <div className="text-center text-brand-text/40 py-10 font-bold uppercase tracking-widest text-[10px]">Aucun signalement pour le moment.</div>;
    return (<div className="grid grid-cols-1 gap-4 pb-20 max-w-3xl mx-auto">{bugs.map(bug => (<div key={bug.id} className="rounded-[24px] shadow-soft border border-white/50 p-5 flex gap-4 bg-white/60 backdrop-blur-md"><div className="bg-brand-coral/20 text-brand-coral p-4 rounded-[20px] h-fit shrink-0 shadow-inner"><Bug size={24} /></div><div className="flex-1"><div className="flex justify-between items-start"><div><h4 className="font-black text-brand-text text-lg">{bug.prenom} {bug.nom}</h4><div className="text-[10px] text-brand-text/50 uppercase font-bold tracking-wide mt-1">{new Date(bug.date).toLocaleString()}</div></div><button onClick={() => deleteBug(bug.id)} className="text-brand-text/30 hover:text-brand-coral p-1 bg-white hover:shadow-soft rounded-full transition-all"><Trash2 size={18} /></button></div><p className="mt-4 text-sm p-4 rounded-[16px] border border-white/40 shadow-inner bg-black/5 text-brand-text">{bug.message}</p></div></div>))}</div>);
}

function AdminDanger() {
    const handleReset = async () => { if (confirm("Tout effacer ?")) { const batch = writeBatch(db); const snaps = await getDocs(collection(db, "students")); snaps.forEach(d => batch.delete(d.ref)); await batch.commit(); alert("Terminé."); } }
    return <div className="max-w-xl mx-auto mt-10 p-8 rounded-[30px] border border-brand-coral/30 text-center shadow-inner bg-brand-coral/10"><h3 className="font-black text-brand-coral text-xl tracking-tight mb-4 uppercase">Zone Danger</h3><button onClick={handleReset} className="px-6 py-3 rounded-full font-black tracking-wide text-white bg-brand-coral hover:bg-brand-coral/90 shadow-soft hover:scale-105 active:scale-95 transition-all">Tout effacer</button></div>
}
