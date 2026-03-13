import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Save, Trash2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const COLOR_MAP = {
  'blue': { label: 'Non évalué', bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-200', value: null },
  'white': { label: 'Non acquis', bg: 'bg-white', text: 'text-brand-text/30', border: 'border-brand-text/10', value: 0 },
  'orange': { label: 'En cours', bg: 'bg-brand-coral/20', text: 'text-brand-coral', border: 'border-brand-coral/30', value: 50 },
  'green': { label: 'Acquis', bg: 'bg-brand-teal/20', text: 'text-brand-teal', border: 'border-brand-teal/30', value: 100 }
};

export default function SuccessEvaluationDetail() {
  const { spaceId, evalId } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubEval = onSnapshot(doc(db, 'success_evaluations', evalId), (snap) => {
      if (snap.exists()) {
        setEvaluation({ id: snap.id, ...snap.data() });
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

    return () => {
      unsubEval();
      unsubResults();
    };
  }, [evalId, spaceId, navigate]);

  const handleCellClick = (studentId, exerciceIdx) => {
    const current = results[studentId]?.[exerciceIdx] || 'blue';
    const states = ['blue', 'white', 'orange', 'green'];
    const next = states[(states.indexOf(current) + 1) % states.length];
    
    setResults(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [exerciceIdx]: next
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

  // CALCULATIONS
  const stats = useMemo(() => {
    if (!evaluation || !results) return null;
    
    const students = evaluation.students || [];
    const exercises = evaluation.exercises || [];
    
    const studentScores = students.map(st => {
      let total = 0;
      let evaluatedCount = 0;
      exercises.forEach((_, idx) => {
        const color = results[st.id]?.[idx] || 'blue';
        const val = COLOR_MAP[color].value;
        if (val !== null) {
          total += val;
          evaluatedCount++;
        }
      });
      return {
        id: st.id,
        name: st.name,
        score: evaluatedCount > 0 ? total / evaluatedCount : null
      };
    });

    const evaluatedStudents = studentScores.filter(s => s.score !== null);
    const globalAvg = evaluatedStudents.length > 0
      ? evaluatedStudents.reduce((acc, s) => acc + s.score, 0) / evaluatedStudents.length
      : 0;

    return {
      studentScores,
      globalAvg
    };
  }, [evaluation, results]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-brand-text/20 uppercase tracking-widest">Chargement...</div>;

  return (
    <div className="flex flex-col h-screen bg-brand-bg relative overflow-hidden text-brand-text">
       <div className="absolute top-1/4 -right-20 w-80 h-80 bg-brand-teal/5 rounded-full blur-3xl pointer-events-none z-0"></div>
       <div className="absolute bottom-0 -left-20 w-80 h-80 bg-brand-coral/5 rounded-full blur-3xl pointer-events-none z-0"></div>

      <header className="shrink-0 sticky top-0 z-[60] border-b border-white/50 p-4 px-8 flex justify-between items-center shadow-soft bg-white/40 backdrop-blur-md">
        <button onClick={() => navigate(`/success/${spaceId}`)} className="flex items-center gap-2 transition-colors font-bold text-brand-text/50 hover:text-brand-text">
          <ArrowLeft size={20} /> Retour
        </button>
        <div className="text-center">
           <h1 className="text-lg font-black tracking-tighter uppercase leading-none">{evaluation.name}</h1>
           <p className="text-[10px] font-bold text-brand-text/40">{evaluation.subject}</p>
        </div>
        <div className="flex items-center gap-2">
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

      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative z-10 w-full max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Légende */}
        <div className="flex flex-wrap gap-4 justify-center">
           {Object.entries(COLOR_MAP).map(([key, cfg]) => (
             <div key={key} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-text/40">
               <div className={`w-4 h-4 rounded-md ${cfg.bg} border ${cfg.border}`}></div>
               {cfg.label}
             </div>
           ))}
        </div>

        {/* Matrice de Résultats */}
        <div className="flex-shrink-0 bg-white/60 border border-white backdrop-blur-md rounded-[40px] shadow-soft overflow-visible">
          <div className="overflow-x-auto rounded-[40px]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-brand-text/5">
                  <th className="p-6 text-left text-xs font-black uppercase tracking-widest text-brand-text/40 bg-white/20 min-w-[200px]">Élève</th>
                  {evaluation.exercises.map((ex, i) => (
                    <th key={i} className="p-4 text-center border-l border-brand-text/5 min-w-[140px]">
                      <div className="text-[10px] font-black uppercase tracking-widest text-brand-text/40 mb-1">{ex.name}</div>
                      <div className="text-[9px] font-bold text-brand-text/20 italic line-clamp-2 px-2 leading-tight uppercase tracking-tighter">
                        {ex.competence}
                      </div>
                    </th>
                  ))}
                  <th className="p-6 text-center text-xs font-black uppercase tracking-widest text-brand-teal border-l-2 border-brand-teal/10 bg-brand-teal/5 min-w-[100px]">Score</th>
                </tr>
              </thead>
              <tbody>
                {evaluation.students.map((st) => {
                  const score = stats?.studentScores.find(s => s.id === st.id)?.score;
                  return (
                    <tr key={st.id} className="border-b border-brand-text/5 hover:bg-white/30 transition-colors">
                      <td className="p-6 font-black text-brand-text">{st.name}</td>
                      {evaluation.exercises.map((_, idx) => {
                        const color = results[st.id]?.[idx] || 'blue';
                        const cfg = COLOR_MAP[color];
                        return (
                          <td key={idx} className="p-2 text-center border-l border-brand-text/5">
                            <motion.div 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCellClick(st.id, idx)}
                              className={`w-full aspect-square md:aspect-auto md:h-12 rounded-2xl cursor-pointer ${cfg.bg} border-2 ${cfg.border} flex items-center justify-center transition-all shadow-sm group`}
                            >
                               <span className={`text-[10px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity ${cfg.text}`}>
                                 {cfg.label}
                               </span>
                            </motion.div>
                          </td>
                        );
                      })}
                      <td className="p-6 text-center border-l-2 border-brand-teal/10 bg-brand-teal/5">
                        <div className="text-xl font-black text-brand-teal">{score !== null ? `${Math.round(score)}%` : '-'}</div>
                        <div className="w-full h-1.5 bg-brand-teal/10 rounded-full mt-2 overflow-hidden">
                           <div className="h-full bg-brand-teal rounded-full" style={{ width: `${score || 0}%` }}></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
