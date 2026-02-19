import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, writeBatch, getDocs, updateDoc, orderBy, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Trash2, Lock,
    Gamepad2, Bell, Calendar, Search, Settings,
    ArrowRight, Sun, Moon, School, BookOpen,
    GraduationCap, Calculator, Languages, FlaskConical,
    LayoutDashboard, Trophy, PartyPopper, UserCog, Medal,
    Bug, MessageSquare
} from 'lucide-react';
import AdminDashboard from './Edoxia-Quiz/pages/AdminDashboard';
import AdminCalendar from './Edoxia-Calendar/pages/AdminCalendar';

// Mapping des icônes disponibles pour le sélecteur
export const ICON_OPTIONS = {
    Gamepad2, Bell, Calendar, School, BookOpen,
    GraduationCap, Calculator, Languages, FlaskConical,
    Search, Settings, Lock, Sun, Moon, Medal, Trophy
};

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
    >
        <Icon size={20} />
        <span>{label}</span>
    </button>
);

const HomeAdmin = ({ defaultModules }) => {
    const [modules, setModules] = useState([]);
    const [newModule, setNewModule] = useState({
        name: '',
        desc: '',
        path: '',
        icon: 'Gamepad2',
        iconColor: 'text-cyan-400',
        tag: 'Nouveau',
        active: true,
        requiresSchoolAuth: false
    });

    useEffect(() => {
        const q = query(collection(db, "modules"));
        const unsub = onSnapshot(q, (snap) => {
            setModules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    const handleAdd = async () => {
        if (!newModule.name) return alert("Nom requis");
        try {
            await addDoc(collection(db, "modules"), {
                ...newModule,
                createdAt: new Date()
            });
            setNewModule({ ...newModule, name: '', desc: '', path: '' });
        } catch (e) {
            console.error(e);
            alert("Erreur lors de l'ajout");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Supprimer ce module ?")) {
            await deleteDoc(doc(db, "modules", id));
        }
    };

    const importDefaults = async () => {
        if (!window.confirm("Ajouter les modules par défaut à la base de données ?")) return;
        const batch = writeBatch(db);
        defaultModules.forEach(m => {
            let iconName = 'Gamepad2';
            let iconColor = 'text-cyan-400';
            if (m.id === 'quiz') { iconName = 'Gamepad2'; iconColor = 'text-purple-400'; }
            if (m.id === 'events') { iconName = 'Calendar'; iconColor = 'text-yellow-400'; }

            const docRef = doc(collection(db, "modules"));
            batch.set(docRef, {
                name: m.name,
                desc: m.desc,
                path: m.path,
                icon: iconName,
                iconColor: iconColor,
                tag: m.tag,
                active: m.active,
                requiresSchoolAuth: m.requiresSchoolAuth || false,
                restrictedToRoles: m.restrictedToRoles || null
            });
        });
        await batch.commit();
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Gestion de l'Accueil</h2>
            </div>

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus /> Ajouter un module</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input placeholder="Nom" className="bg-slate-950 p-2 rounded border border-slate-800 text-white" value={newModule.name} onChange={e => setNewModule({ ...newModule, name: e.target.value })} />
                    <input placeholder="Description" className="bg-slate-950 p-2 rounded border border-slate-800 text-white" value={newModule.desc} onChange={e => setNewModule({ ...newModule, desc: e.target.value })} />
                    <input placeholder="Chemin / URL" className="bg-slate-950 p-2 rounded border border-slate-800 text-white" value={newModule.path} onChange={e => setNewModule({ ...newModule, path: e.target.value })} />
                    <input placeholder="Tag (ex: Jeux)" className="bg-slate-950 p-2 rounded border border-slate-800 text-white" value={newModule.tag} onChange={e => setNewModule({ ...newModule, tag: e.target.value })} />
                    <div className="flex gap-2">
                        <select className="bg-slate-950 p-2 rounded border border-slate-800 flex-1 text-white" value={newModule.icon} onChange={e => setNewModule({ ...newModule, icon: e.target.value })}>{Object.keys(ICON_OPTIONS).map(k => <option key={k} value={k}>{k}</option>)}</select>
                        <input placeholder="Couleur (text-cyan-400)" className="bg-slate-950 p-2 rounded border border-slate-800 flex-1 text-white" value={newModule.iconColor} onChange={e => setNewModule({ ...newModule, iconColor: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newModule.requiresSchoolAuth} onChange={e => setNewModule({ ...newModule, requiresSchoolAuth: e.target.checked })} /> <Lock size={16} /> Vérouillage École</label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newModule.active} onChange={e => setNewModule({ ...newModule, active: e.target.checked })} /> Actif</label>
                    </div>
                </div>
                <button onClick={handleAdd} className="mt-4 w-full bg-emerald-600 py-2 rounded font-bold hover:bg-emerald-500 text-white">Ajouter</button>
            </div>

            <div className="space-y-4">
                {modules.length === 0 && (
                    <div className="bg-blue-900/20 border border-blue-900/50 p-6 rounded-xl text-center">
                        <p className="text-blue-200 mb-4">Aucun module en base de données. L'accueil affiche actuellement les modules par défaut.</p>
                        <button onClick={importDefaults} className="bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-500 font-bold text-white flex items-center gap-2 mx-auto">
                            <LayoutDashboard size={20} /> Importer les modules par défaut
                        </button>
                        <p className="text-xs text-slate-500 mt-2">Cela copiera les modules par défaut dans la base de données pour que vous puissiez les modifier ou les supprimer.</p>
                    </div>
                )}

                {modules.map(m => (
                    <div key={m.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded bg-slate-950 ${m.iconColor}`}>{React.createElement(ICON_OPTIONS[m.icon] || Gamepad2)}</div>
                            <div>
                                <h3 className="font-bold">{m.name}</h3>
                                <p className="text-sm text-slate-400">{m.desc}</p>
                                <div className="flex gap-2 mt-1 text-xs"><span className="bg-slate-800 px-2 rounded">{m.tag}</span>{m.requiresSchoolAuth && <span className="bg-red-900/50 text-red-400 px-2 rounded flex items-center gap-1"><Lock size={10} /> École</span>}</div>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded transition-colors" title="Supprimer"><Trash2 /></button>
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
                } catch (e) {
                    console.error(`Error fetching ${game.collection}`, e);
                    results[game.collection] = [];
                }
            }
            setLeaderboards(results);
            setLoading(false);
        };
        fetchLeaderboards();
    }, []);

    const deleteScore = async (collectionName, scoreId) => {
        if (window.confirm("Supprimer ce score ?")) {
            await deleteDoc(doc(db, collectionName, scoreId));
            setLeaderboards(prev => ({
                ...prev,
                [collectionName]: prev[collectionName].filter(s => s.id !== scoreId)
            }));
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full text-slate-500">Chargement des scores...</div>;

    return (
        <div className="max-w-7xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2"><Gamepad2 className="text-cyan-400" /> Leaderboards Edoxia-Games</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {GAMES_LEADERBOARDS.map(game => (
                    <div key={game.collection} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-96">
                        <div className="p-4 border-b border-slate-800 bg-slate-950/50 font-bold text-cyan-400 flex justify-between items-center">
                            <span>{game.title}</span>
                            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">{leaderboards[game.collection]?.length || 0}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                            {leaderboards[game.collection]?.length > 0 ? (
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-900 shadow-sm">
                                        <tr className="text-slate-500 border-b border-slate-800 text-xs uppercase tracking-wider">
                                            <th className="p-3 w-10 text-center">#</th>
                                            <th className="p-3">Pseudo</th>
                                            <th className="p-3 text-right">Score</th>
                                            <th className="p-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboards[game.collection].map((score, index) => (
                                            <tr key={score.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 group transition-colors">
                                                <td className="p-3 text-center font-mono text-slate-600">{index + 1}</td>
                                                <td className="p-3 font-medium text-slate-300 truncate max-w-[180px]" title={score.pseudo}>
                                                    {score.pseudo}
                                                    {score.classLabel && <span className="text-xs text-slate-500 ml-2">({score.classLabel})</span>}
                                                </td>
                                                <td className="p-3 text-right font-bold text-white">{score.score}</td>
                                                <td className="p-3 text-center">
                                                    <button onClick={() => deleteScore(game.collection, score.id)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 italic text-sm p-4">
                                    <Trophy size={32} className="mb-2 opacity-20" />
                                    Aucun score enregistré
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const EventsAdmin = () => (
    <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <Calendar size={64} className="mb-4 opacity-20" />
        <h2 className="text-xl font-bold text-slate-400">Administration Edoxia-Event</h2>
        <p>Fonctionnalité à venir.</p>
    </div>
);

const BugsAdmin = () => {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "feedback"), orderBy("date", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    const deleteReport = async (id) => {
        if (window.confirm("Supprimer ce signalement ?")) {
            await deleteDoc(doc(db, "feedback", id));
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2"><Bug className="text-red-500" /> Signalements & Avis</h2>
            </div>
            <div className="space-y-4">
                {reports.length === 0 && <div className="text-center text-slate-500 py-10 italic">Aucun signalement pour le moment.</div>}
                {reports.map(report => (
                    <div key={report.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex gap-4">
                        <div className={`p-3 rounded-full h-fit shrink-0 ${report.type === 'bug' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            {report.type === 'bug' ? <Bug size={24} /> : <MessageSquare size={24} />}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${report.type === 'bug' ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                        {report.type}
                                    </span>
                                    <span className="text-slate-500 text-xs ml-2">
                                        {new Date(report.date).toLocaleString()}
                                    </span>
                                </div>
                                <button onClick={() => deleteReport(report.id)} className="text-slate-500 hover:text-red-500 transition-colors p-1">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <p className="mt-2 text-slate-300 whitespace-pre-wrap text-sm">{report.message}</p>
                            {report.name && <p className="text-xs text-slate-400 mt-2 font-bold">De: {report.name}</p>}
                            {report.email && <p className="text-xs text-slate-500 mt-2">Contact: {report.email}</p>}
                            <div className="mt-2 text-[10px] text-slate-600 font-mono truncate">
                                {report.url}
                            </div>
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
            const q = query(collection(db, "users"));
            const snapshot = await getDocs(q);
            setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetchUsers();
    }, []);

    const updateUserRole = async (userId, newRole) => {
        await updateDoc(doc(db, "users", userId), { role: newRole });
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2"><UserCog className="text-orange-400" /> Gestion des Utilisateurs</h2>
            </div>
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-400 text-sm border-b border-slate-800">
                                <th className="p-4">Identité</th>
                                <th className="p-4">Pseudo</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Dernière Connexion</th>
                                <th className="p-4">Rôle</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                    <td className="p-4"><div className="font-bold text-white">{u.nom || '-'} {u.prenom || ''}</div></td>
                                    <td className="p-4 text-slate-300">{u.pseudo || '-'}</td>
                                    <td className="p-4 text-slate-400 text-sm">{u.email}</td>
                                    <td className="p-4 text-sm text-slate-400">{u.lastLogin ? (u.lastLogin.seconds ? new Date(u.lastLogin.seconds * 1000).toLocaleString() : new Date(u.lastLogin).toLocaleString()) : '-'}</td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : u.role === 'enseignant' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>{u.role || 'élève'}</span></td>
                                    <td className="p-4">
                                        <select value={u.role || 'élève'} onChange={(e) => updateUserRole(u.id, e.target.value)} className="bg-slate-950 border border-slate-700 rounded p-2 text-sm outline-none focus:border-cyan-500 text-white">
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
    const [activeTab, setActiveTab] = useState('users');
    const navigate = useNavigate();

    return (
        <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900/50 border-r border-slate-800 flex flex-col shrink-0">
                <div className="p-6">
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6">
                        <ArrowLeft size={18} /> Retour Site
                    </button>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
                        <Settings className="text-cyan-400" /> Admin
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Panel d'administration global</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    <SidebarItem icon={UserCog} label="Utilisateurs" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                    <SidebarItem icon={Gamepad2} label="Edoxia-Games" active={activeTab === 'games'} onClick={() => setActiveTab('games')} />
                    <SidebarItem icon={Calendar} label="Calendrier" active={activeTab === 'events'} onClick={() => setActiveTab('events')} />
                    <SidebarItem icon={Bug} label="Signalements" active={activeTab === 'bugs'} onClick={() => setActiveTab('bugs')} />
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-slate-950 relative">
                <div className="p-8 min-h-full">
                    {activeTab === 'home' && <HomeAdmin defaultModules={defaultModules} />}
                    {activeTab === 'games' && <GamesAdmin />}
                    {activeTab === 'quiz' && (
                        <div className="h-full">
                            <AdminDashboard isGlobalAdmin={true} />
                        </div>
                    )}
                    {activeTab === 'events' && <AdminCalendar isEmbedded={true} />}
                    {activeTab === 'users' && <UsersAdmin />}
                    {activeTab === 'bugs' && <BugsAdmin />}
                </div>
            </main>
        </div>
    );
}
