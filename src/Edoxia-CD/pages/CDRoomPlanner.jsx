import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bed, Users, User, Search, Home, CheckCircle2, AlertCircle, Heart, Info, ChevronRight, Calculator, MessageSquare, Handshake, Map, ArrowRight, ArrowLeft, X, FileDown, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
    const [isExporting, setIsExporting] = useState(false);
    const [exportType, setExportType] = useState(null); // 'full' or 'blank'
    const gridRef = useRef(null);

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

    const handleExportPDF = async (type) => {
        if (!gridRef.current) return;
        setExportType(type);
        setIsExporting(true);
        setSelectedStudent(null); // Close popup before export

        // Give React a moment to re-render if we were to toggle styles
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const canvas = await html2canvas(gridRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#fdfbf7', // matched to bg-brand-bg approximate
                onclone: (clonedDoc) => {
                    // Force some styles on the clone to ensure no cropping
                    const style = clonedDoc.createElement('style');
                    style.innerHTML = `
                        .student-btn { height: 48px !important; line-height: 1 !important; padding-top: 0 !important; padding-bottom: 0 !important; overflow: visible !important; }
                        .student-name { white-space: nowrap !important; overflow: visible !important; text-overflow: clip !important; }
                    `;
                    clonedDoc.head.appendChild(style);
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a3'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

            const finalWidth = imgWidth * ratio;
            const finalHeight = imgHeight * ratio;
            const offsetX = (pdfWidth - finalWidth) / 2;
            const offsetY = (pdfHeight - finalHeight) / 2;

            pdf.addImage(imgData, 'PNG', offsetX, offsetY, finalWidth, finalHeight);
            pdf.save(`Plan_Chambres_Edoxia_${type === 'blank' ? 'Vierge_' : ''}${new Date().toLocaleDateString()}.pdf`);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
            setExportType(null);
        }
    };

    return (
        <div className="min-h-screen bg-brand-bg flex flex-col font-sans text-brand-text overflow-hidden">
            {/* Top Navigation - Fixed at the very top */}
            <header className="shrink-0 sticky top-0 z-[60] border-b border-white/50 p-4 px-8 flex justify-between items-center shadow-soft bg-white/40 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/cd')}
                        className="flex items-center gap-2 transition-colors font-bold text-brand-text/50 hover:text-brand-text"
                    >
                        <ArrowLeft size={20} /> Retour Hub
                    </button>
                    <div className="flex items-center gap-3 border-l border-white/50 pl-6">
                        <Bed className="w-6 h-6 text-brand-teal" />
                        <h1 className="text-xl font-black tracking-tight flex items-center gap-2 text-brand-text uppercase italic">Gestion des Chambres</h1>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2">
                    <button
                        onClick={() => handleExportPDF('blank')}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2 bg-white/50 border border-white rounded-2xl font-black text-xs uppercase tracking-widest text-brand-text/60 hover:bg-white transition-all shadow-sm disabled:opacity-50"
                    >
                        {isExporting && exportType === 'blank' ? <span className="w-3 h-3 border-2 border-brand-text/20 border-t-brand-text/60 rounded-full animate-spin" /> : <FileDown size={14} />}
                        Plan vierge
                    </button>
                    <button
                        onClick={() => handleExportPDF('full')}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-6 py-2 bg-brand-teal hover:bg-brand-teal/80 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-soft disabled:opacity-50"
                    >
                        {isExporting && exportType === 'full' ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Printer size={14} />}
                        Export complet
                    </button>
                    <div className="px-4 py-2 bg-brand-teal/10 border border-brand-teal/20 rounded-2xl ml-2">
                        <span className="text-xs font-black text-brand-teal flex items-center gap-2 uppercase tracking-tight">
                            <Calculator size={14} /> 46/50 ÉLÈVES
                        </span>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                {/* Cercles décoratifs */}
                <div className="absolute top-1/4 -right-20 w-80 h-80 bg-brand-coral/5 rounded-full blur-3xl pointer-events-none z-0"></div>
                <div className="absolute bottom-0 -left-20 w-80 h-80 bg-brand-teal/5 rounded-full blur-3xl pointer-events-none z-0"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Toolbar */}
                    <div className="mb-8 flex flex-col md:flex-row gap-6 items-center justify-between bg-white/40 p-4 rounded-[32px] shadow-soft border border-white/60 backdrop-blur-sm">
                        <div className="flex bg-brand-bg/60 p-1.5 rounded-2xl w-full md:w-auto border border-white/50">
                            {['all', 'girls', 'boys'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-brand-teal text-white shadow-lg scale-105' : 'text-brand-text/40 hover:text-brand-text/60'}`}
                                >
                                    {f === 'all' ? 'Toutes' : f === 'girls' ? 'Filles' : 'Garçons'}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full md:max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/20 group-focus-within:text-brand-teal transition-colors" />
                            <input
                                type="text"
                                placeholder="Rechercher un prénom..."
                                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-white bg-white/60 focus:ring-4 focus:ring-brand-teal/10 focus:outline-none shadow-inner text-sm font-bold text-brand-text placeholder:text-brand-text/20 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Room Grid */}
                    <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
                        {allRooms.map((room) => (
                            <div key={`${room.type}-${room.id}`} className="bg-white/80 rounded-[32px] border border-white overflow-hidden shadow-soft hover:shadow-xl transition-all flex flex-col group/room">
                                <div className={`px-6 py-4 flex justify-between items-center ${room.type === 'Fille' ? 'bg-brand-coral/10 text-brand-coral' : 'bg-brand-teal/10 text-brand-teal'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${room.type === 'Fille' ? 'bg-brand-coral/20' : 'bg-brand-teal/20'}`}>
                                            <Bed size={16} />
                                        </div>
                                        <span className="font-black text-sm uppercase tracking-[0.1em] italic">Chambre {room.id}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-black bg-white/40 px-2.5 py-1 rounded-full border border-white/50">
                                        <Users size={12} /> {room.students.length}/{room.capacity}
                                    </div>
                                </div>
                                <div className="p-5 space-y-3 flex-1 bg-gradient-to-br from-white/20 to-transparent">
                                    {(exportType === 'blank' ? Array(room.capacity).fill(null) : room.students).map((student, idx) => {
                                        const satisfied = student ? isSatisfied(student, room.students) : false;
                                        const isSelected = selectedStudent?.name === student && student !== null;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => student && handleStudentClick(student, room)}
                                                className={`student-btn w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all text-left group ${isSelected ? 'bg-brand-teal border-brand-teal text-white shadow-lg -translate-y-1' :
                                                    student ? (satisfied ? 'bg-white border-white hover:border-brand-teal/20 hover:bg-brand-teal/5' : 'bg-brand-coral/5 border-brand-coral/10 hover:border-brand-coral/20')
                                                        : 'bg-transparent border-dashed border-brand-text/5 min-h-[52px]'
                                                    }`}
                                            >
                                                {student ? (
                                                    <>
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-[10px] ${isSelected ? 'bg-white/20 text-white' : satisfied ? 'bg-brand-teal/10 text-brand-teal' : 'bg-brand-coral/20 text-brand-coral'}`}>
                                                                {student.charAt(0)}
                                                            </div>
                                                            <span className={`student-name text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-brand-text'}`}>
                                                                {student}
                                                            </span>
                                                        </div>
                                                        <div className="shrink-0 flex items-center">
                                                            {satisfied ? (
                                                                <CheckCircle2 size={16} className={`${isSelected ? 'text-white/60' : 'text-brand-teal'}`} />
                                                            ) : (
                                                                <AlertCircle size={16} className={`${isSelected ? 'text-white' : 'text-brand-coral'}`} />
                                                            )}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center opacity-10">
                                                        <div className="w-2 h-2 rounded-full bg-brand-text" />
                                                    </div>
                                                )}
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
                <div className="fixed bottom-8 right-8 w-[calc(100%-4rem)] md:w-[400px] bg-white border border-white rounded-[40px] shadow-2xl z-[100] animate-in slide-in-from-bottom duration-500 overflow-hidden">
                    <div className={`p-6 flex items-center justify-between ${selectedStudent.satisfied ? 'bg-brand-text text-white' : 'bg-brand-coral text-white'}`}>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 rounded-[20px] flex items-center justify-center font-black text-2xl uppercase">
                                {selectedStudent.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-black text-xl leading-tight tracking-tight italic uppercase">{selectedStudent.name}</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Chambre {selectedStudent.room} • {selectedStudent.roomType}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedStudent(null)}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-90"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-brand-text/30 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Heart size={14} className="text-brand-coral" /> Vœux exprimés
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                {selectedStudent.choices.map((c, i) => {
                                    const tG = DATA.girls.find(r => r.students.includes(c));
                                    const tB = DATA.boys.find(r => r.students.includes(c));
                                    const roomInfo = tG || tB;
                                    const inSameRoom = roomInfo && roomInfo.id === selectedStudent.room;

                                    return (
                                        <div key={i} className={`flex items-center justify-between p-4 rounded-3xl border-2 ${inSameRoom ? 'bg-brand-teal/5 border-brand-teal/20' : 'bg-brand-bg/50 border-white shadow-inner'}`}>
                                            <div className="flex items-center gap-3">
                                                <span className={`font-black text-sm uppercase tracking-tight ${inSameRoom ? 'text-brand-teal' : 'text-brand-text/60'}`}>{c}</span>
                                                {inSameRoom && <CheckCircle2 size={16} className="text-brand-teal" />}
                                            </div>
                                            {roomInfo ? (
                                                <div className={`text-[10px] px-3 py-1.5 rounded-xl font-black tracking-widest flex items-center gap-1.5 ${inSameRoom ? 'bg-brand-teal text-white shadow-sm' : 'bg-brand-text/5 text-brand-text/40 border border-brand-text/5'}`}>
                                                    <Map size={10} /> CH{roomInfo.id}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-brand-text/20 font-bold italic uppercase tracking-widest">N/A</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {!selectedStudent.satisfied && (
                            <div className="p-5 bg-brand-coral/5 border border-brand-coral/10 rounded-3xl flex gap-4 animate-pulse">
                                <AlertCircle size={24} className="text-brand-coral mt-1 shrink-0" />
                                <p className="text-xs text-brand-text/70 font-bold leading-relaxed">
                                    Attention, aucun de ses vœux n'est respecté dans cette chambre. Il faudra gérer cela avec l'élève.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="px-8 pb-8">
                        <button
                            onClick={() => setSelectedStudent(null)}
                            className="w-full py-4 bg-brand-bg hover:bg-white border border-white text-brand-text/40 font-black text-xs uppercase tracking-[0.2em] rounded-[24px] transition-all shadow-sm active:scale-95"
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