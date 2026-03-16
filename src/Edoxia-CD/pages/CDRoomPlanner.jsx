import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bed, Users, User, Search, Home, CheckCircle2, AlertCircle, Heart, Info, ChevronRight, Calculator, MessageSquare, Handshake, Map, ArrowRight, ArrowLeft, X } from 'lucide-react';

const CHOICES = {
    "Siloé": ["Anaïs", "Adèle M."], "Jeanne": ["Siahn", "Ambre"], "Ambre": ["Siahn", "Jeanne"],
    "Ewen": ["Armand", "/"], "Noam": ["Rafaël", "Sacha"], "Izia": ["Amandine", "Siahn"],
    "Anaïs": ["Adèle M.", "Siloé"], "Armand": ["Aaron", "Ewen"], "Olivia": ["Khya", "Lola"],
    "Dïone": ["Fred-Hugo", "Pierre"], "Lola": ["Maïline", "Niki"], "Zana": ["Chloé", "Amandine"],
    "Ibrahim": ["Nicolas", "Paul"], "Soline": ["Ninon", "Rose"], "Amandine": ["Izia", "Siahn"],
    "Sacha": ["Malone", "Arthur"], "Rose": ["Eurydice", "Soline"], "Chloé": ["Zana", "Izia"],
    "Nicolas": ["Ibrahim", "Paul"], "Arthur": ["Sacha", "Ibrahim"], "Adèle M.": ["Siloé", "Anaïs"],
    "Eurydice": ["Rose", "Soline"], "Khya": ["Ninon", "Ariel-Solène"], "Paul": ["Arthur", "Nicolas"],
    "Aaron": ["Armand", "?"], "Siahn": ["Izia", "Amandine"], "Maïline": ["Adèle D.", "Soline"],
    "Loéline": ["Sidonie", "Zana"], "Sidonie": ["Loéline", "Zana"], "Mila": ["Maïline", "Lola"],
    "Ariel-Solène": ["Ninon", "Soline"], "Ninon": ["Soline", "Ariel-Solène"], "Rafaël": ["Sacha", "Malone"],
    "Pierre": ["Dïone", "Fred-Hugo"], "Louis": ["Rafaël", "/"], "Fred-Hugo": ["George", "Dïone"],
    "Malone": ["Sacha", "Arthur"], "Maxence": ["Auguste", "/"], "George": ["Théo", "Fred-Hugo"],
    "Charles-Eliott": ["Rafaël", "Fred-Hugo"], "Théo": ["Louis", "George"], "Alix": ["Adèle B.", "/"],
    "Adèle B.": ["Alix", "/"], "Eliakim": ["Matéo", "Fred-Hugo"], "Auguste": ["Maxence", "/"],
    "Matéo": ["Fred-Hugo", "Eliakim"], "Adèle D.": ["Niki", "Marwa"], "Marwa": ["Niki", "Adèle D."],
    "Laura": ["Mila", "Maïline"], "Niki": ["Marwa", "Adèle D."]
};

const DATA = {
    girls: [
        { id: 1, capacity: 6, students: ["Ariel-Solène", "Ninon", "Soline", "Rose", "Eurydice", "Khya"] },
        { id: 2, capacity: 6, students: ["Izia", "Amandine", "Siahn", "Ambre", "Jeanne", "Zana"] },
        { id: 3, capacity: 4, students: ["Marwa", "Niki", "Adèle D.", "Maïline"] },
        { id: 4, capacity: 4, students: ["Anaïs", "Siloé", "Adèle M.", "Chloé"] },
        { id: 5, capacity: 4, students: ["Alix", "Adèle B.", "Mila", "Laura"] },
        { id: 6, capacity: 4, students: ["Sidonie", "Loéline", "Lola", "Olivia"] }
    ],
    boys: [
        { id: 1, capacity: 6, students: ["Fred-Hugo", "Dïone", "Pierre", "George", "Théo", "Charles-Eliott"] },
        { id: 2, capacity: 4, students: ["Rafaël", "Sacha", "Malone", "Noam"] },
        { id: 3, capacity: 4, students: ["Ibrahim", "Nicolas", "Paul", "Arthur"] },
        { id: 4, capacity: 4, students: ["Auguste", "Maxence", "Matéo", "Eliakim"] },
        { id: 5, capacity: 4, students: ["Ewen", "Armand", "Aaron", "Louis"] }
    ]
};

const isSatisfied = (name, roomStudents) => {
    const studentChoices = CHOICES[name] || [];
    return studentChoices.some(choice => roomStudents.includes(choice));
};

const CDRoomPlanner = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [selectedStudent, setSelectedStudent] = useState(null);

    const allRooms = useMemo(() => {
        let rooms = [];
        if (filter === 'all' || filter === 'girls') rooms = [...rooms, ...DATA.girls.map(r => ({ ...r, type: 'Fille' }))];
        if (filter === 'all' || filter === 'boys') rooms = [...rooms, ...DATA.boys.map(r => ({ ...r, type: 'Garçon' }))];
        return searchTerm ? rooms.filter(room => room.students.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))) : rooms;
    }, [filter, searchTerm]);

    const handleStudentClick = (name, room) => {
        if (selectedStudent?.name === name) {
            setSelectedStudent(null);
            return;
        }
        setSelectedStudent({
            name,
            choices: CHOICES[name] || ["Aucun vœu", "Aucun vœu"],
            satisfied: isSatisfied(name, room.students),
            room: room.id,
            roomType: room.type
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Top Navigation - Fixed at the very top */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm shrink-0">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate('/cd')}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" /> Retour Hub
                            </button>
                            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
                                <Bed className="w-6 h-6 text-indigo-600" />
                                <span className="font-black text-lg text-slate-800 uppercase tracking-tight">Gestion des Chambres</span>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-4">
                            <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                                <span className="text-sm font-bold text-indigo-600 flex items-center gap-2">
                                    <Calculator className="w-4 h-4" /> Plan des chambres (46/50)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Toolbar */}
                    <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                            {['all', 'girls', 'boys'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {f === 'all' ? 'Toutes les chambres' : f === 'girls' ? 'Filles' : 'Garçons'}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full md:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un élève par son prénom ..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-slate-50 shadow-inner text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Room Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
                        {allRooms.map((room) => (
                            <div key={`${room.type}-${room.id}`} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                                <div className={`px-5 py-3 flex justify-between items-center ${room.type === 'Fille' ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'}`}>
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${room.type === 'Fille' ? 'bg-pink-100' : 'bg-blue-100'}`}>
                                            <Bed className="w-4 h-4" />
                                        </div>
                                        <span className="font-black text-sm uppercase tracking-wider">Chambre {room.id}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-black bg-white/50 px-2 py-1 rounded-md">
                                        <Users className="w-3 h-3" /> {room.students.length}/{room.capacity}
                                    </div>
                                </div>
                                <div className="p-4 space-y-2 flex-1">
                                    {room.students.map((student, idx) => {
                                        const satisfied = isSatisfied(student, room.students);
                                        const isSelected = selectedStudent?.name === student;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleStudentClick(student, room)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-[1.02]' :
                                                    satisfied ? 'bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-slate-100' : 'bg-red-50 border-red-100 hover:border-red-200 hover:bg-red-100/50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${isSelected ? 'bg-white/20 text-white' : satisfied ? 'bg-slate-200 text-slate-500' : 'bg-red-200 text-red-600'}`}>
                                                        {student.charAt(0)}
                                                    </div>
                                                    <span className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                                                        {student}
                                                    </span>
                                                </div>
                                                <div className="shrink-0 flex items-center">
                                                    {satisfied ? (
                                                        <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-indigo-200' : 'text-emerald-500'}`} />
                                                    ) : (
                                                        <AlertCircle className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-red-500'}`} />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Floating Student Detail Popup */}
            {selectedStudent && (
                <div className="fixed bottom-6 right-6 w-[calc(100%-3rem)] md:w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl z-[100] animate-in slide-in-from-bottom duration-300 overflow-hidden">
                    <div className={`p-4 flex items-center justify-between ${selectedStudent.satisfied ? 'bg-slate-800 text-white' : 'bg-red-600 text-white'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center font-black text-lg">
                                {selectedStudent.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-black text-base leading-tight">{selectedStudent.name}</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Chambre {selectedStudent.room} • {selectedStudent.roomType}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedStudent(null)}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-5">
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Heart className="w-3.5 h-3.5" /> Vœux exprimés
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                                {selectedStudent.choices.map((c, i) => {
                                    const tG = DATA.girls.find(r => r.students.includes(c));
                                    const tB = DATA.boys.find(r => r.students.includes(c));
                                    const roomInfo = tG || tB;
                                    const inSameRoom = roomInfo && roomInfo.id === selectedStudent.room;

                                    return (
                                        <div key={i} className={`flex items-center justify-between p-3 rounded-2xl border ${inSameRoom ? 'bg-emerald-50 border-emerald-100 ring-2 ring-emerald-500/10' : 'bg-slate-50 border-slate-100'}`}>
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold text-sm ${inSameRoom ? 'text-emerald-700' : 'text-slate-600'}`}>{c}</span>
                                                {inSameRoom && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                            </div>
                                            {roomInfo ? (
                                                <span className={`text-[10px] px-2 py-1 rounded-lg font-black tracking-tight ${inSameRoom ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                                                    CH. {roomInfo.id}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-300 font-bold italic">N/A</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {!selectedStudent.satisfied && (
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                    Aucun vœu n'est respecté dans cette chambre. Un compromis sera nécessaire demain matin.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="px-6 pb-6 pt-2">
                        <button
                            onClick={() => setSelectedStudent(null)}
                            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-sm font-black transition-colors"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CDRoomPlanner;