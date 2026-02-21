import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, writeBatch, getDocs, updateDoc, orderBy, limit, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Trash2, Lock,
    Gamepad2, Bell, Calendar, Search, Settings,
    ArrowRight, Sun, Moon, School, BookOpen,
    GraduationCap, Calculator, Languages, FlaskConical,
    LayoutDashboard, Trophy, PartyPopper, UserCog, Medal,
    Bug, MessageSquare, Save
} from 'lucide-react';
import AdminDashboard from './Edoxia-Quiz/pages/AdminDashboard';
import AdminCalendar from './Edoxia-Calendar/pages/AdminCalendar';

export const ICON_OPTIONS = {
    Gamepad2, Bell, Calendar, School, BookOpen,
    GraduationCap, Calculator, Languages, FlaskConical,
    Search, Settings, Lock, Sun, Moon, Medal, Trophy
};

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

const HomeAdmin = ({ defaultModules }) => {
    const [modules, setModules] = useState([]);
    const [homeNews, setHomeNews] = useState("");
    const [savingNews, setSavingNews] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "modules"));
        const unsubModules = onSnapshot(q, (snap) => setModules(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubNews = onSnapshot(doc(db, "settings", "home_news"), (docSnap) => {
            if (docSnap.exists() && docSnap.data().message !== undefined) setHomeNews(docSnap.data().message);
        });
        return () => { unsubModules(); unsubNews(); };
    }, []);

    const handleSaveNews = async () => {
        setSavingNews(true);
        try {
            await setDoc(doc(db, "settings", "home_news"), { message: homeNews }, { merge: true });
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la sauvegarde.");
        }
        setSavingNews(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Supprimer ce module ?")) await deleteDoc(doc(db, "modules", id));
    };



    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-black text-brand-text flex items-center gap-3"><LayoutDashboard className="text-brand-coral" size={32} /> Gestion de l'Accueil</h2>

            {/* Actualités */}
            <div className="bg-white/40 p-6 rounded-[30px] shadow-soft border border-white/50 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-brand-text"><Bell className="text-brand-coral" size={24} /> Texte d'Actualités (Navigation)</h3>
                <div className="space-y-4">
                    <textarea
                        className="w-full bg-white/60 border border-white rounded-[20px] p-4 text-brand-text focus:ring-2 focus:ring-brand-teal focus:bg-white shadow-inner outline-none transition-all resize-none min-h-[100px] font-medium"
                        placeholder="Message d'actualité visible sur l'accueil... (laissez vide pour masquer la bulle)"
                        value={homeNews}
                        onChange={e => setHomeNews(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <button onClick={handleSaveNews} disabled={savingNews} className="px-6 py-3 bg-brand-teal hover:bg-brand-teal/90 hover:scale-105 active:scale-95 text-white font-bold rounded-full shadow-soft transition-all flex items-center gap-2 disabled:opacity-50">
                            <Save size={18} /> {savingNews ? "Enregistrement..." : "Enregistrer"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">


                {modules.map(m => (
                    <div key={m.id} className="bg-white/60 p-5 rounded-[24px] shadow-sm border border-white flex justify-between items-center transition-all hover:shadow-soft hover:bg-white">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-[16px] bg-white shadow-inner ${m.iconColor}`}>{React.createElement(ICON_OPTIONS[m.icon] || Gamepad2)}</div>
                            <div>
                                <h3 className="font-bold text-brand-text text-lg">{m.name}</h3>
                                <p className="text-sm text-brand-text/60">{m.desc}</p>
                                <div className="flex gap-2 mt-2 text-xs font-bold">
                                    <span className="bg-brand-text/5 px-3 py-1 rounded-full text-brand-text/60 border border-white/50 shadow-inner">{m.tag}</span>
                                    {m.requiresSchoolAuth && <span className="bg-brand-coral/10 text-brand-coral px-3 py-1 rounded-full flex items-center gap-1 border border-brand-coral/20 shadow-inner"><Lock size={10} /> École</span>}
                                    {!m.active && <span className="bg-black/10 text-brand-text/50 px-3 py-1 rounded-full shadow-inner border border-white/50">Inactif</span>}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(m.id)} className="text-brand-text/40 hover:text-brand-coral hover:bg-brand-coral/10 p-3 rounded-full transition-all" title="Supprimer ce module"><Trash2 /></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GAMES_LEADERBOARDS = [
    { title: "Maths - Multiplications", collection: "leaderboard_mult" },
    { title: "Maths - Additions", collection: "leaderboard_add" },
    { title: "Maths - Ajout Dizaines", collection: "leaderboard_addTen" },
    { title: "Maths - Retrait Dizaines", collection: "leaderboard_subTen" },
    { title: "Maths - +11", collection: "leaderboard_addEleven" },
    { title: "Maths - -11", collection: "leaderboard_subEleven" },
    { title: "Français - Pronoms", collection: "leaderboard_pronoms" }
];

const GamesAdmin = () => {
    const [leaderboards, setLeaderboards] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboards = async () => {
            const results = {};
            for (const game of GAMES_LEADERBOARDS) {
                try {
                    const q = query(collection(db, game.collection), orderBy("score", "desc"), limit(10));
                    const snapshot = await getDocs(q);
                    results[game.collection] = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                } catch (e) { results[game.collection] = []; }
            }
            setLeaderboards(results);
            setLoading(false);
        };
        fetchLeaderboards();
    }, []);

    const deleteScore = async (collectionName, scoreId) => {
        if (window.confirm("Supprimer ce score ?")) {
            await deleteDoc(doc(db, collectionName, scoreId));
            setLeaderboards(prev => ({ ...prev, [collectionName]: prev[collectionName].filter(s => s.id !== scoreId) }));
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full text-brand-text/50 font-bold animate-pulse">Chargement des scores...</div>;

    return (
        <div className="max-w-7xl mx-auto pb-20">
            <h2 className="text-3xl font-black flex items-center gap-3 mb-8 text-brand-text"><Gamepad2 className="text-brand-teal" size={32} /> Leaderboards Edoxia-Games</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {GAMES_LEADERBOARDS.map(game => (
                    <div key={game.collection} className="bg-white/40 border border-white/60 rounded-[30px] shadow-soft overflow-hidden flex flex-col h-96 backdrop-blur-sm">
                        <div className="p-5 border-b border-white/60 bg-white/50 font-black text-brand-teal flex justify-between items-center text-lg">
                            <span>{game.title}</span>
                            <span className="text-sm bg-white text-brand-text/60 px-3 py-1 rounded-full shadow-inner">{leaderboards[game.collection]?.length || 0}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {leaderboards[game.collection]?.length > 0 ? (
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="sticky top-0 bg-brand-bg/90 backdrop-blur z-10 rounded-[10px]">
                                        <tr className="text-brand-text/50 text-[10px] font-bold uppercase tracking-widest border-b border-white">
                                            <th className="p-3 w-10 text-center">#</th>
                                            <th className="p-3">Pseudo</th>
                                            <th className="p-3 text-right">Score</th>
                                            <th className="p-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboards[game.collection].map((score, index) => (
                                            <tr key={score.id} className="border-b border-white/50 last:border-0 hover:bg-white/60 group transition-all rounded-[10px] my-1">
                                                <td className="p-3 text-center font-black text-brand-text/40">{index + 1}</td>
                                                <td className="p-3 font-bold text-brand-text truncate max-w-[150px]" title={score.pseudo}>
                                                    {score.pseudo} {score.classLabel && <span className="text-[10px] text-brand-text/40 ml-1 bg-white px-2 py-0.5 rounded-full shadow-sm">({score.classLabel})</span>}
                                                </td>
                                                <td className="p-3 text-right font-black text-brand-teal">{score.score}</td>
                                                <td className="p-3 text-center">
                                                    <button onClick={() => deleteScore(game.collection, score.id)} className="text-brand-text/30 hover:text-brand-coral p-1.5 rounded-full hover:bg-brand-coral/10 outline-none transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-brand-text/40 font-bold text-sm">
                                    <Trophy size={48} className="mb-4 opacity-20 text-brand-teal" />
                                    Aucun score
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BugsAdmin = () => {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "feedback"), orderBy("date", "desc"));
        const unsub = onSnapshot(q, (snap) => setReports(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, []);

    const deleteReport = async (id) => {
        if (window.confirm("Supprimer ce signalement ?")) await deleteDoc(doc(db, "feedback", id));
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <h2 className="text-3xl font-black flex items-center gap-3 mb-8 text-brand-text"><Bug className="text-brand-coral" size={32} /> Signalements & Avis</h2>
            <div className="space-y-6">
                {reports.length === 0 && <div className="text-center text-brand-text/50 font-bold py-10 bg-white/40 rounded-[30px] border border-white/60 shadow-inner">Tout est propre ! Aucun signalement.</div>}
                {reports.map(report => (
                    <div key={report.id} className="bg-white/40 backdrop-blur-sm border border-white/60 p-6 rounded-[30px] shadow-soft flex gap-5 transition-all hover:bg-white/60 hover:shadow-lg">
                        <div className={`p-4 rounded-[20px] shadow-inner shrink-0 ${report.type === 'bug' ? 'bg-brand-coral/10 text-brand-coral border border-brand-coral/20' : 'bg-brand-teal/10 text-brand-teal border border-brand-teal/20'}`}>
                            {report.type === 'bug' ? <Bug size={28} /> : <MessageSquare size={28} />}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-inner ${report.type === 'bug' ? 'bg-brand-coral text-white' : 'bg-brand-teal text-white'}`}>
                                        {report.type}
                                    </span>
                                    <span className="text-brand-text/50 text-xs font-bold">
                                        {new Date(report.date).toLocaleString()}
                                    </span>
                                </div>
                                <button onClick={() => deleteReport(report.id)} className="text-brand-text/30 hover:text-brand-coral hover:bg-brand-coral/10 p-2 rounded-full transition-all shadow-sm bg-white/50 border border-white/40">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <p className="text-brand-text font-medium whitespace-pre-wrap leading-relaxed bg-white/50 p-4 rounded-[16px] shadow-inner mb-3 border border-white/40">{report.message}</p>
                            <div className="flex flex-wrap gap-4 text-xs">
                                {report.name && <p className="text-brand-text/70 bg-white/60 px-3 py-1.5 rounded-full shadow-sm font-bold border border-white">De: {report.name}</p>}
                                {report.email && <p className="text-brand-text/70 bg-white/60 px-3 py-1.5 rounded-full shadow-sm font-bold border border-white">Email: {report.email}</p>}
                            </div>
                            {report.url && (
                                <div className="mt-3 text-[10px] text-brand-text/40 font-mono truncate bg-white/40 px-3 py-1 rounded-full border border-white/50 inline-block w-full" title={report.url}>
                                    🌐 URL: {report.url}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const UsersAdmin = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            const snapshot = await getDocs(query(collection(db, "users")));
            setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetchUsers();
    }, []);

    const updateUserRole = async (userId, newRole) => {
        await updateDoc(doc(db, "users", userId), { role: newRole });
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    };

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <h2 className="text-3xl font-black flex items-center gap-3 mb-8 text-brand-text"><UserCog className="text-orange-400" size={32} /> Gestion des Utilisateurs</h2>
            <div className="bg-white/40 backdrop-blur-sm rounded-[30px] shadow-soft border border-white/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/50 border-b border-white">
                            <tr className="text-brand-text/40 text-[10px] font-bold uppercase tracking-widest">
                                <th className="p-5">Identité</th>
                                <th className="p-5">Pseudo</th>
                                <th className="p-5">Email</th>
                                <th className="p-5">Dernière Connexion</th>
                                <th className="p-5">Rôle</th>
                                <th className="p-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="font-medium text-sm">
                            {users.map(u => (
                                <tr key={u.id} className="border-b border-white/50 hover:bg-white/50 transition-colors">
                                    <td className="p-5 font-black text-brand-text">{u.nom || '-'} {u.prenom || ''}</td>
                                    <td className="p-5 text-brand-text/70">{u.pseudo || '-'}</td>
                                    <td className="p-5 text-brand-text/60">{u.email}</td>
                                    <td className="p-5 text-brand-text/50">{u.lastLogin ? (u.lastLogin.seconds ? new Date(u.lastLogin.seconds * 1000).toLocaleString() : new Date(u.lastLogin).toLocaleString()) : '-'}</td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-inner border ${u.role === 'admin' ? 'bg-brand-coral/10 text-brand-coral border-brand-coral/20' : u.role === 'enseignant' ? 'bg-brand-teal/10 text-brand-teal border-brand-teal/20' : 'bg-black/5 text-brand-text/50 border-white/50'}`}>{u.role || 'élève'}</span>
                                    </td>
                                    <td className="p-5 text-right">
                                        <select value={u.role || 'élève'} onChange={(e) => updateUserRole(u.id, e.target.value)} className="bg-white border border-white/60 rounded-[12px] p-2 text-brand-text font-bold shadow-soft outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal cursor-pointer">
                                            {['élève', 'parent', 'enseignant', 'admin', 'directeur'].map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default function GlobalAdmin({ defaultModules }) {
    const [activeTab, setActiveTab] = useState('home');
    const navigate = useNavigate();

    return (
        <div className="flex h-screen bg-brand-bg text-brand-text overflow-hidden font-outfit">
            {/* Sidebar */}
            <aside className="w-72 bg-white/40 backdrop-blur-xl border-r border-white/50 flex flex-col shrink-0 shadow-lg z-20">
                <div className="p-8">
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 text-brand-text/40 hover:text-brand-text font-bold transition-all mb-8 bg-white/50 px-4 py-2 rounded-full border border-white hover:bg-white shadow-sm active:scale-95">
                        <ArrowLeft size={16} /> Retour Site
                    </button>
                    <h1 className="text-3xl font-black flex items-center gap-3 text-brand-text">
                        <Settings className="text-brand-coral" size={28} /> Admin
                    </h1>
                    <p className="text-xs font-bold text-brand-text/40 mt-2 uppercase tracking-widest pl-10">Interface Globale</p>
                </div>

                <nav className="flex-1 px-6 space-y-3 overflow-y-auto mb-6 custom-scrollbar">
                    <SidebarItem icon={LayoutDashboard} label="Accueil" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                    <SidebarItem icon={UserCog} label="Utilisateurs" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                    <SidebarItem icon={Gamepad2} label="Edoxia-Games" active={activeTab === 'games'} onClick={() => setActiveTab('games')} />
                    <SidebarItem icon={BookOpen} label="Edoxia-Quiz" active={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')} />
                    <SidebarItem icon={Calendar} label="Calendrier" active={activeTab === 'events'} onClick={() => setActiveTab('events')} />
                    <SidebarItem icon={Bug} label="Signalements" active={activeTab === 'bugs'} onClick={() => setActiveTab('bugs')} />
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-transparent relative custom-scrollbar">
                <div className="p-8 md:p-12 min-h-full">
                    {activeTab === 'home' && <HomeAdmin defaultModules={defaultModules} />}
                    {activeTab === 'users' && <UsersAdmin />}
                    {activeTab === 'games' && <GamesAdmin />}
                    {activeTab === 'quiz' && <div className="h-full bg-white/40 p-8 rounded-[40px] shadow-soft border border-white/60"><AdminDashboard isGlobalAdmin={true} /></div>}
                    {activeTab === 'events' && <AdminCalendar isEmbedded={true} />}
                    {activeTab === 'bugs' && <BugsAdmin />}
                </div>
            </main>
        </div>
    );
}
