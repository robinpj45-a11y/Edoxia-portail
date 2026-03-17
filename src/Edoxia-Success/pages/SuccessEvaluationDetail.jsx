import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Save, Trash2, Plus, Edit, ChevronLeft, ChevronRight, User, CheckCircle2, AlertCircle, ChevronDown, ListChecks } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SuccessMobileNav from '../components/SuccessMobileNav';

// SUCCESS THRESHOLD: 75%
const SUCCESS_THRESHOLD = 0.75;

// Custom styles to remove number input arrows
const styles = `
  .no-spinner::-webkit-outer-spin-button,
  .no-spinner::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .no-spinner {
    -moz-appearance: textfield;
  }
`;

export default function SuccessEvaluationDetail() {
  const { spaceId, evalId } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsubEval = onSnapshot(doc(db, 'success_evaluations', evalId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setEvaluation(data);
        if (!activeStudentId && data.students?.length > 0) {
          const sorted = [...data.students].sort((a, b) => a.name.localeCompare(b.name));
          setActiveStudentId(sorted[0].id);
        }
      } else {
        navigate(`/success/${spaceId}`);
      }
    });

    const resultsRef = doc(db, 'success_results', evalId);
    const unsubResults = onSnapshot(resultsRef, (snap) => {
      if (snap.exists()) {
        setResults(snap.data().data || {});
      }
      setLoading(false);
    });

    // Close dropdown on click outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      unsubEval();
      unsubResults();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [evalId, spaceId, navigate]);

  const setScore = (studentId, exerciseIdx, score) => {
    setResults(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [exerciseIdx]: score
      }
    }));
  };

  const saveResults = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'success_results', evalId), {
        data: results,
        spaceId,
        updatedAt: new Date()
      });
      setSaving(false);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la sauvegarde.");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette évaluation et tous ses résultats ? Cette action est irréversible.")) {
      try {
        await deleteDoc(doc(db, 'success_evaluations', evalId));
        await deleteDoc(doc(db, 'success_results', evalId));
        navigate(`/success/${spaceId}`);
      } catch (e) {
        console.error("Error deleting evaluation:", e);
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const students = useMemo(() => {
    if (!evaluation?.students) return [];
    return [...evaluation.students].sort((a, b) => a.name.localeCompare(b.name));
  }, [evaluation]);

  const activeStudent = useMemo(() => {
    return students.find(s => s.id === activeStudentId);
  }, [students, activeStudentId]);

  const studentProgress = useMemo(() => {
    const progress = {};
    students.forEach(st => {
      const res = results[st.id] || {};
      const count = Object.keys(res).filter(k => res[k] !== '' && res[k] !== null && res[k] !== undefined).length;
      progress[st.id] = { count, total: evaluation?.exercises?.length || 0 };
    });
    return progress;
  }, [students, results, evaluation]);

  const navigateStudent = (dir) => {
    const idx = students.findIndex(s => s.id === activeStudentId);
    if (dir === 'next' && idx < students.length - 1) {
      setActiveStudentId(students[idx + 1].id);
    } else if (dir === 'prev' && idx > 0) {
      setActiveStudentId(students[idx - 1].id);
    }
  };

  if (loading || !evaluation) return <div className="h-screen flex items-center justify-center font-black text-brand-text/20 uppercase tracking-widest">Chargement...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg relative overflow-hidden text-brand-text pb-32 md:pb-0">
      <style>{styles}</style>
      <SuccessMobileNav mode="edit" />
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-brand-teal/5 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-0 -left-20 w-80 h-80 bg-brand-coral/5 rounded-full blur-3xl pointer-events-none z-0"></div>

      <header className="shrink-0 sticky top-0 z-[60] border-b border-white/50 p-4 px-8 hidden md:flex justify-between items-center shadow-soft bg-white/40 backdrop-blur-md">
        <button onClick={() => navigate(`/success/${spaceId}`)} className="flex items-center gap-2 transition-colors font-bold text-brand-text/50 hover:text-brand-text">
          <ArrowLeft size={20} /> Retour
        </button>
        <div className="text-center">
           <h1 className="text-lg font-black tracking-tighter uppercase leading-none">{evaluation.name}</h1>
           <p className="text-[10px] font-bold text-brand-text/40">{evaluation.subject}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/success/${spaceId}/create?edit=${evalId}`)}
            className="p-2.5 text-brand-teal hover:bg-brand-teal/10 rounded-2xl transition-all"
            title="Modifier la structure"
          >
            <Edit size={20} />
          </button>
          <button 
            onClick={handleDelete}
            className="p-2.5 text-brand-coral hover:bg-brand-coral/10 rounded-2xl transition-all"
            title="Supprimer l'évaluation"
          >
            <Trash2 size={20} />
          </button>
          <button 
            onClick={saveResults}
            disabled={saving}
            className="bg-brand-teal text-white px-5 py-2.5 rounded-2xl font-black shadow-lg flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all text-xs uppercase tracking-wider disabled:opacity-50"
          >
            {saving ? <Plus size={18} className="animate-spin" /> : <Save size={18} />}
            Sauvegarder
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 w-full max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* Student Selector Area */}
        <section className="bg-white/60 border border-white backdrop-blur-md rounded-[40px] shadow-soft p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-visible relative z-[50]">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <button 
                onClick={() => navigateStudent('prev')}
                disabled={students[0]?.id === activeStudentId}
                className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-white hover:border-brand-teal transition-all disabled:opacity-30 active:scale-95"
             >
                <ChevronLeft size={24} />
             </button>

             <div className="relative flex-1 md:min-w-[300px]" ref={dropdownRef}>
                <button 
                   onClick={() => setShowDropdown(!showDropdown)}
                   className="w-full flex items-center justify-center gap-4 p-5 bg-white border border-white rounded-3xl font-black text-sm uppercase tracking-wider shadow-soft group relative transition-all hover:border-brand-teal"
                >
                   <span className="truncate">{activeStudent?.name || "Sélectionner..."}</span>
                   <div className="text-[10px] bg-brand-teal text-white px-3 py-1.5 rounded-xl">
                      {studentProgress[activeStudentId]?.count}/{studentProgress[activeStudentId]?.total}
                   </div>
                   <ChevronDown size={20} className={`text-brand-text/20 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-teal" />
                </button>

                <AnimatePresence>
                   {showDropdown && (
                      <motion.div 
                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 10, scale: 0.95 }}
                         className="absolute top-full left-0 right-0 mt-3 p-2 bg-white/95 backdrop-blur-xl border border-white rounded-[32px] shadow-2xl z-[200] max-h-[400px] overflow-y-auto"
                      >
                         {students.map(st => (
                            <button
                               key={st.id}
                               onClick={() => { setActiveStudentId(st.id); setShowDropdown(false); }}
                               className={`w-full p-4 rounded-2xl flex items-center justify-between font-black text-xs uppercase tracking-widest transition-all ${st.id === activeStudentId ? 'bg-brand-teal text-white shadow-lg' : 'hover:bg-brand-bg/50 text-brand-text/60'}`}
                            >
                               <span>{st.name}</span>
                               <span className={`text-[9px] px-2 py-1 rounded-lg ${st.id === activeStudentId ? 'bg-white/20' : 'bg-brand-text/5 text-brand-text/20'}`}>
                                  {studentProgress[st.id]?.count}/{studentProgress[st.id]?.total}
                               </span>
                            </button>
                         ))}
                      </motion.div>
                   )}
                </AnimatePresence>
             </div>

             <button 
                onClick={() => navigateStudent('next')}
                disabled={students[students.length - 1]?.id === activeStudentId}
                className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-white hover:border-brand-teal transition-all disabled:opacity-30 active:scale-95"
             >
                <ChevronRight size={24} />
             </button>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-brand-text/20 uppercase tracking-widest leading-none mb-1">Progression globale</span>
                <span className="font-black text-xs text-brand-teal">
                   {Math.round((Object.values(results).flatMap(r => Object.values(r)).filter(v => v !== '').length / (students.length * evaluation.exercises.length)) * 100)}%
                </span>
             </div>
             <div className="w-24 h-2 bg-brand-text/5 rounded-full overflow-hidden">
                <motion.div 
                   className="h-full bg-brand-teal"
                   initial={{ width: 0 }}
                   animate={{ width: `${(Object.values(results).flatMap(r => Object.values(r)).filter(v => v !== '').length / (students.length * evaluation.exercises.length)) * 100}%` }}
                />
             </div>
          </div>
        </section>

        {/* Input Area */}
        <AnimatePresence mode="wait">
           <motion.div 
              key={activeStudentId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
           >
              {evaluation.exercises.map((ex, idx) => {
                 const val = results[activeStudentId]?.[idx];
                 const isNotEvaluated = val === undefined || val === null || val === '';
                 const pct = !isNotEvaluated ? (parseFloat(val) / (ex.points || 10)) * 100 : 0;
                 
                 let colorClass = "from-white/40 to-white/20";
                 let ringClass = "border-white";
                 let badgeClass = "bg-brand-text/5 text-brand-text/20";

                 if (!isNotEvaluated) {
                    if (pct >= 75) { colorClass = "from-brand-teal/20 to-brand-teal/5"; ringClass = "border-brand-teal"; badgeClass = "bg-brand-teal text-white"; }
                    else if (pct >= 31) { colorClass = "from-amber-400/20 to-amber-400/5"; ringClass = "border-amber-400"; badgeClass = "bg-amber-400 text-white"; }
                    else { colorClass = "from-brand-coral/20 to-brand-coral/5"; ringClass = "border-brand-coral"; badgeClass = "bg-brand-coral text-white"; }
                 }

                 return (
                    <div 
                       key={idx}
                       className={`relative bg-gradient-to-br ${colorClass} border-2 ${ringClass} rounded-[40px] shadow-soft p-8 overflow-hidden group hover:shadow-xl transition-all`}
                    >
                       <div className="flex flex-col items-center text-center gap-8 relative z-10">
                          <div className="space-y-1">
                             <div className="flex items-center justify-center gap-3">
                                <span className="text-3xl font-black uppercase tracking-tighter leading-none italic">Exercice {idx + 1}</span>
                                {pct >= 75 && !isNotEvaluated && <CheckCircle2 size={16} className="text-brand-teal" />}
                             </div>
                             <h2 className="text-[10px] font-black uppercase tracking-widest text-brand-text/40">{ex.name}</h2>
                             <p className="text-sm font-bold text-brand-text/40 leading-relaxed max-w-xl mx-auto">{ex.competence}</p>
                          </div>

                          <div className="flex flex-col items-center gap-6">
                             <div className="relative group/input">
                                <input 
                                   type="number"
                                   step="0.5"
                                   min="0"
                                   max={ex.points}
                                   placeholder="-"
                                   value={val ?? ''}
                                   onChange={(e) => setScore(activeStudentId, idx, e.target.value)}
                                   className="w-32 h-32 bg-white border-2 border-white rounded-[40px] text-center text-4xl font-black focus:outline-none focus:ring-8 focus:ring-brand-teal/5 shadow-soft transition-all no-spinner"
                                />
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-brand-text text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                                   Score
                                </div>
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white border border-brand-text/5 text-brand-text/20 rounded-full text-[10px] font-black tracking-widest">
                                   /{ex.points}
                                </div>
                             </div>

                             <button 
                                onClick={() => setScore(activeStudentId, idx, ex.points)}
                                className="px-6 py-3 bg-white/50 border border-white hover:bg-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-brand-text/40 hover:text-brand-teal transition-all active:scale-90"
                             >
                                Mettre au MAX
                             </button>
                          </div>
                       </div>
                       
                       {/* Abstract Background Decor */}
                       <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                          <ListChecks size={200} />
                       </div>
                    </div>
                 );
              })}
           </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center py-10 px-6">
           <button 
              onClick={() => navigateStudent('prev')}
              disabled={students[0]?.id === activeStudentId}
              className="flex items-center gap-3 font-black text-xs uppercase tracking-widest text-brand-text/40 hover:text-brand-text transition-all disabled:opacity-0"
           >
              <ChevronLeft size={20} /> Précédent
           </button>
           <button 
              onClick={() => navigateStudent('next')}
              disabled={students[students.length - 1]?.id === activeStudentId}
              className="flex items-center gap-6 px-10 py-5 bg-brand-text text-white rounded-[24px] font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl group"
           >
              Suivant <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
           </button>
        </div>

      </main>

      {/* Floating Save Button on Mobile */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 md:hidden z-[100]">
         <button 
             onClick={saveResults}
             disabled={saving}
             className="bg-brand-teal text-white px-10 py-5 rounded-[24px] font-black shadow-2xl flex items-center gap-3 hover:brightness-110 active:scale-95 transition-all text-sm uppercase tracking-wider"
         >
            {saving ? <Plus size={20} className="animate-spin" /> : <Save size={20} />}
            Sauvegarder les résultats
         </button>
      </div>

    </div>
  );
}
