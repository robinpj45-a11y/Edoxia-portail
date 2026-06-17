import React, { useState, useRef } from 'react';
import { db } from './firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
    ArrowLeft, Settings, LayoutDashboard, Upload, Users, FileSpreadsheet
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-[20px] transition-all font-bold ${active
            ? 'bg-white text-brand-teal shadow-soft'
            : 'text-brand-text/60 hover:bg-white/50 hover:text-brand-text'
            }`}
    >
        <Icon size={20} className={active ? "text-brand-teal" : ""} />
        <span>{label}</span>
    </button>
);

const HomeAdminTest = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-black text-brand-text flex items-center gap-3"><LayoutDashboard className="text-brand-coral" size={32} /> Accès Rapides (TEST)</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => navigate('/test-JS2026/admin')} className="bg-white/40 p-6 rounded-[30px] shadow-soft border border-white/50 backdrop-blur-sm hover:bg-white transition-all text-left flex items-center gap-4 group">
                    <div className="p-4 bg-orange-400/20 text-orange-500 rounded-[20px] group-hover:scale-110 transition-transform"><Settings size={32} /></div>
                    <div>
                        <h3 className="text-xl font-bold text-brand-text">Admin JS-TEST</h3>
                        <p className="text-brand-text/60 font-medium">Gestion du système Jeu de Société</p>
                    </div>
                </button>
                <button onClick={() => navigate('/test-events')} className="bg-white/40 p-6 rounded-[30px] shadow-soft border border-white/50 backdrop-blur-sm hover:bg-white transition-all text-left flex items-center gap-4 group">
                    <div className="p-4 bg-yellow-500/20 text-yellow-600 rounded-[20px] group-hover:scale-110 transition-transform"><Settings size={32} /></div>
                    <div>
                        <h3 className="text-xl font-bold text-brand-text">Admin Event-TEST</h3>
                        <p className="text-brand-text/60 font-medium">Gestion des événements (Via App Event)</p>
                    </div>
                </button>
                <button onClick={() => navigate('/test-repart')} className="bg-white/40 p-6 rounded-[30px] shadow-soft border border-white/50 backdrop-blur-sm hover:bg-white transition-all text-left flex items-center gap-4 group">
                    <div className="p-4 bg-indigo-500/20 text-indigo-600 rounded-[20px] group-hover:scale-110 transition-transform"><Settings size={32} /></div>
                    <div>
                        <h3 className="text-xl font-bold text-brand-text">Répartition-TEST</h3>
                        <p className="text-brand-text/60 font-medium">Outil de création et gestion de classes</p>
                    </div>
                </button>
                <button onClick={() => navigate('/test-success')} className="bg-white/40 p-6 rounded-[30px] shadow-soft border border-white/50 backdrop-blur-sm hover:bg-white transition-all text-left flex items-center gap-4 group">
                    <div className="p-4 bg-teal-500/20 text-teal-600 rounded-[20px] group-hover:scale-110 transition-transform"><Settings size={32} /></div>
                    <div>
                        <h3 className="text-xl font-bold text-brand-text">Réussite-TEST</h3>
                        <p className="text-brand-text/60 font-medium">Suivi pédagogique et évaluations</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

const ImportStudentsAdminTest = () => {
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const bstr = evt.target.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws, { raw: false });
                    
                    if(data.length === 0) {
                        alert("Le fichier est vide.");
                        setIsImporting(false);
                        return;
                    }

                    const batch = writeBatch(db);
                    const studentsRef = collection(db, 'test_student_directory');

                    data.forEach((row) => {
                        const newDocRef = doc(studentsRef);
                        const firstName = String(row['prénom_élève'] || '').trim();
                        const lastName = String(row['nom_élève'] || '').trim();
                        let fullName = '';
                        if(firstName && lastName) fullName = `${firstName} ${lastName}`;
                        else if(firstName) fullName = firstName;
                        else fullName = lastName;

                        batch.set(newDocRef, {
                            lastName: lastName,
                            firstName: firstName,
                            name: fullName,
                            gender: String(row['genre_élève'] || '').trim(),
                            importedClassLabel: String(row['Classe_élève'] || '').trim(),
                            dateOfBirth: String(row['date_naissance'] || '').trim(),
                            parent1Name: String(row['nom_responsable'] || '').trim(),
                            parent1FirstName: String(row['prénom_responsable'] || '').trim(),
                            parent1Phone: String(row['portable_responsable'] || '').trim(),
                            parent1Email: String(row['email_responsable'] || '').trim(),
                            parent2Name: String(row['nom_coresp'] || '').trim(),
                            parent2FirstName: String(row['prénom_coresp'] || '').trim(),
                            parent2Phone: String(row['portable_coresp'] || '').trim(),
                            parent2Email: String(row['email_coresp'] || '')
                        });
                    });

                    await batch.commit();
                    alert(`${data.length} élèves importés avec succès dans l'environnement de TEST !`);
                } catch (error) {
                    console.error("Erreur lors de l'import :", error);
                    alert("Erreur lors de l'import des données. Vérifiez le format de votre fichier Excel.");
                } finally {
                    setIsImporting(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            };
            reader.readAsBinaryString(file);
        } catch(err) {
            console.error(err);
            setIsImporting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-black text-brand-text flex items-center gap-3"><Users className="text-brand-coral" size={32} /> Importation d'Élèves (TEST)</h2>

            <div className="bg-white/40 p-8 rounded-[30px] shadow-soft border border-white/50 backdrop-blur-sm">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-6 bg-brand-teal/10 rounded-full text-brand-teal mb-2">
                        <FileSpreadsheet size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-brand-text">Importer une liste d'élèves</h3>
                    <p className="text-brand-text/60 font-medium max-w-lg">
                        Veuillez sélectionner un fichier Excel respectant le format des colonnes :<br/>
                        <span className="text-xs bg-white/60 px-2 py-1 rounded-md text-brand-text/80 font-mono mt-2 inline-block">nom_élève / prénom_élève / genre_élève / date_naissance / Classe_élève / nom_responsable / prénom_responsable / portable_responsable / email_responsable / nom_coresp / prénom_coresp / portable_coresp / email_coresp</span>
                    </p>
                    
                    <div className="pt-6">
                        <input 
                            type="file" 
                            accept=".xlsx, .xls, .csv" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={isImporting}
                            className="bg-brand-teal hover:bg-brand-teal/90 text-white font-bold py-4 px-8 rounded-[20px] transition-all shadow-soft flex items-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            <Upload size={20} /> {isImporting ? "Importation en cours..." : "Choisir un fichier"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function GlobalAdminTest() {
    const [activeTab, setActiveTab] = useState('home');
    const navigate = useNavigate();

    return (
        <div className="flex h-screen bg-brand-bg text-brand-text overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-white/40 backdrop-blur-xl border-r border-white/50 flex flex-col shrink-0 shadow-lg z-20">
                <div className="p-8">
                    <button onClick={() => navigate('/test-stpbb')} className="flex items-center gap-2 text-brand-text/40 hover:text-brand-text font-bold transition-all mb-8 bg-white/50 px-4 py-2 rounded-full border border-white hover:bg-white shadow-sm active:scale-95">
                        <ArrowLeft size={16} /> Retour Hub TEST
                    </button>
                    <h1 className="text-3xl font-black flex items-center gap-3 text-brand-text">
                        <Settings className="text-brand-coral" size={28} /> Admin
                    </h1>
                    <p className="text-xs font-bold text-brand-text/40 mt-2 uppercase tracking-widest pl-10">Espace TEST</p>
                </div>

                <nav className="flex-1 px-6 space-y-3 overflow-y-auto mb-6 custom-scrollbar">
                    <SidebarItem icon={LayoutDashboard} label="Accès Rapides" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                    <SidebarItem icon={Users} label="Import Élèves" active={activeTab === 'import'} onClick={() => setActiveTab('import')} />
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-transparent relative custom-scrollbar">
                <div className="p-8 md:p-12 min-h-full">
                    {activeTab === 'home' && <HomeAdminTest />}
                    {activeTab === 'import' && <ImportStudentsAdminTest />}
                </div>
            </main>
        </div>
    );
}
