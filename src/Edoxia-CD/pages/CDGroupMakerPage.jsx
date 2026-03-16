import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, ArrowLeft, Plus, X, ArrowRight, User, Settings2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CDGroupMakerPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState(null);

  const activeGroupIdRef = React.useRef(activeGroupId);
  useEffect(() => {
    activeGroupIdRef.current = activeGroupId;
  }, [activeGroupId]);

  useEffect(() => {
    const qStudents = query(collection(db, 'cd_students'), orderBy('firstName', 'asc'));
    const unsubscribeStudents = onSnapshot(qStudents, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qGroups = query(collection(db, 'cd_groups'), orderBy('createdAt', 'asc'));
    const unsubscribeGroups = onSnapshot(qGroups, (snapshot) => {
      const gData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroups(gData);
      if (gData.length > 0 && !activeGroupIdRef.current) {
        setActiveGroupId(gData[0].id);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeStudents();
      unsubscribeGroups();
    };
  }, []);

  const handleCreateGroup = async () => {
    const newGroup = {
      name: `Groupe ${groups.length + 1}`,
      studentIds: [],
      createdAt: new Date()
    };
    const docRef = await addDoc(collection(db, 'cd_groups'), newGroup);
    setActiveGroupId(docRef.id);
  };

  const handleRenameGroup = async (id, newName) => {
    await updateDoc(doc(db, 'cd_groups', id), { name: newName });
  };

  const handleDeleteGroup = async (id) => {
    if (window.confirm("Supprimer ce groupe ?")) {
      await deleteDoc(doc(db, 'cd_groups', id));
      if (activeGroupId === id) setActiveGroupId(groups[0]?.id || null);
    }
  };

  const handleAddStudentToGroup = async (studentId) => {
    if (!activeGroupId) return;
    await updateDoc(doc(db, 'cd_groups', activeGroupId), {
      studentIds: arrayUnion(studentId)
    });
  };

  const handleRemoveStudentFromGroup = async (groupId, studentId) => {
    await updateDoc(doc(db, 'cd_groups', groupId), {
      studentIds: arrayRemove(studentId)
    });
  };

  // Helper to find which group a student belongs to
  const getStudentGroup = (studentId) => {
    return groups.find(g => g.studentIds.includes(studentId));
  };

  const availableStudents = students.filter(s => !getStudentGroup(s.id));

  return (
    <div className="flex flex-col h-screen bg-brand-bg text-brand-text overflow-hidden">
      <header className="shrink-0 sticky top-0 z-[60] border-b border-white/50 p-4 px-8 flex justify-between items-center shadow-soft bg-white/40 backdrop-blur-md">
        <button onClick={() => navigate('/cd')} className="flex items-center gap-2 transition-colors font-bold text-brand-text/50 hover:text-brand-text">
          <ArrowLeft size={20} /> Retour CD
        </button>
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2 text-brand-text">
          <Users size={24} className="text-brand-teal" /> Création de Groupes
        </h1>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Liste des élèves (Disponible) */}
        <div className="w-80 md:w-96 border-r border-white/50 bg-white/20 flex flex-col">
          <div className="p-6 border-b border-white/50">
            <h2 className="text-sm font-black uppercase tracking-widest text-brand-text/40 mb-2">Élèves disponibles ({availableStudents.length})</h2>
            <div className="text-[10px] font-bold text-brand-text/30 italic">Cliquez sur un élève pour l'ajouter au groupe actif</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {availableStudents.map(s => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 5 }}
                onClick={() => handleAddStudentToGroup(s.id)}
                className="bg-white/60 border border-white p-3 rounded-2xl shadow-sm cursor-pointer hover:bg-white transition-all flex justify-between items-center group"
              >
                <div>
                  <div className="font-bold text-sm">{s.firstName} {s.lastName}</div>
                  <div className="text-[10px] font-black uppercase tracking-tighter text-brand-text/30">{s.className}</div>
                </div>
                <ArrowRight size={14} className="text-brand-text/20 group-hover:text-brand-teal group-hover:translate-x-1 transition-all" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Espace de Groupes */}
        <div className="flex-1 flex flex-col bg-brand-bg/50 overflow-hidden">
          <div className="p-6 border-b border-white/50 flex justify-between items-center bg-white/30 backdrop-blur-sm">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none max-w-[70%]">
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => setActiveGroupId(g.id)}
                  className={`px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shrink-0 border ${
                    activeGroupId === g.id 
                    ? 'bg-brand-teal text-white border-brand-teal shadow-lg scale-105' 
                    : 'bg-white/50 text-brand-text/40 border-white hover:bg-white hover:text-brand-text/60'
                  }`}
                >
                  {g.name}
                </button>
              ))}
              <button 
                onClick={handleCreateGroup}
                className="px-4 py-2 bg-brand-coral/10 text-brand-coral border border-brand-coral/20 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-coral hover:text-white transition-all shrink-0 flex items-center gap-2"
              >
                <Plus size={14} /> Nouveau
              </button>
            </div>
            
            {activeGroupId && (
              <div className="flex items-center gap-3">
                 <button 
                   onClick={() => handleDeleteGroup(activeGroupId)}
                   className="p-2 text-brand-text/20 hover:text-brand-coral transition-colors"
                   title="Supprimer le groupe"
                 >
                   <Trash2 size={18} />
                 </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-8 relative">
            <AnimatePresence mode="wait">
              {activeGroupId ? (
                <motion.div
                  key={activeGroupId}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="max-w-4xl mx-auto"
                >
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div className="flex-1">
                      <input 
                        type="text"
                        value={groups.find(g => g.id === activeGroupId)?.name || ''}
                        onChange={(e) => handleRenameGroup(activeGroupId, e.target.value)}
                        className="bg-transparent border-none text-4xl md:text-5xl font-black tracking-tighter text-brand-text w-full outline-none focus:ring-0 placeholder:text-brand-text/10"
                        placeholder="Nom du groupe..."
                      />
                      <p className="text-sm font-bold text-brand-text/40 mt-2 flex items-center gap-2">
                        <Users size={16} /> {groups.find(g => g.id === activeGroupId)?.studentIds.length || 0} élèves
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.find(g => g.id === activeGroupId)?.studentIds.map(sid => {
                      const student = students.find(s => s.id === sid);
                      if (!student) return null;
                      return (
                        <motion.div
                          key={student.id}
                          layoutId={student.id}
                          className="bg-white/80 border border-white p-5 rounded-3xl shadow-soft flex justify-between items-center group relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-brand-teal/30"></div>
                          <div>
                            <div className="font-bold text-brand-text">{student.firstName} {student.lastName}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-brand-text/30">{student.className}</div>
                          </div>
                          <button 
                            onClick={() => handleRemoveStudentFromGroup(activeGroupId, student.id)}
                            className="p-2 rounded-xl bg-brand-bg text-brand-text/20 hover:text-brand-coral hover:bg-brand-coral/10 transition-all active:scale-95"
                            title="Retirer du groupe"
                          >
                            <ArrowLeft size={16} />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>

                  {groups.find(g => g.id === activeGroupId)?.studentIds.length === 0 && (
                    <div className="py-20 text-center bg-white/30 border-2 border-dashed border-white/50 rounded-[40px] backdrop-blur-sm">
                       <User size={48} className="mx-auto text-brand-text/10 mb-4" />
                       <h3 className="text-xl font-black text-brand-text/30">Groupe vide</h3>
                       <p className="text-sm font-bold text-brand-text/20">Cliquez sur un élève dans la liste latérale pour l'ajouter.</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <Users size={80} className="mb-6" />
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Sélectionnez ou créez un groupe</h2>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
