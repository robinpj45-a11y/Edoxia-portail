import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Save, Trash2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

// SUCCESS THRESHOLD: 75%
const SUCCESS_THRESHOLD = 0.75;

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

  // CALCULATIONS
  const stats = useMemo(() => {
    if (!evaluation || !results) return null;
    
    const students = evaluation.students || [];
    const exercises = evaluation.exercises || [];
    
    const studentScores = students.map(st => {
      let successes = 0;
      let evaluatedCount = 0;
      
      exercises.forEach((ex, idx) => {
        const val = results[st.id]?.[idx];
        if (val !== undefined && val !== null && val !== '') {
          const scoreNum = parseFloat(val) || 0;
          const maxPoints = ex.points || 10;
          if ((scoreNum / maxPoints) >= SUCCESS_THRESHOLD) {
            successes++;
          }
          evaluatedCount++;
        }
      });
      
      return {
        id: st.id,
        name: st.name,
        score: evaluatedCount > 0 ? (successes / evaluatedCount) * 100 : null
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
         <div className="flex flex-wrap gap-8 justify-center">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-text/40">
              <div className="w-4 h-4 rounded-md bg-brand-teal/10 border border-brand-teal/20"></div>
              Réussi (≥ 75%)
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-text/40">
              <div className="w-4 h-4 rounded-md bg-white border border-brand-text/10"></div>
              Échec/Non évalué
            </div>
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
                      {evaluation.exercises.map((ex, idx) => {
                        const val = results[st.id]?.[idx];
                        const isNotEvaluated = val === undefined || val === null || val === '';
                        const isSuccess = !isNotEvaluated && (parseFloat(val) / (ex.points || 10)) >= SUCCESS_THRESHOLD;
                        
                        return (
                          <td key={idx} className="p-2 text-center border-l border-brand-text/5 relative group/cell">
                            <div className={`relative flex items-center h-12 rounded-2xl border-2 transition-all ${
                              isSuccess ? 'bg-brand-teal/5 border-brand-teal/20' : 
                              isNotEvaluated ? 'bg-brand-bg/50 border-brand-text/5' : 'bg-white border-brand-text/10'
                            }`}>
                              <input 
                                type="number"
                                step="0.5"
                                min="0"
                                max={ex.points}
                                placeholder="-"
                                value={val ?? ''}
                                onChange={(e) => setScore(st.id, idx, e.target.value)}
                                className={`w-full bg-transparent text-center font-black text-sm focus:outline-none ${
                                  isSuccess ? 'text-brand-teal' : 'text-brand-text'
                                }`}
                              />
                              <button 
                                onClick={() => setScore(st.id, idx, ex.points || 10)}
                                className="absolute right-2 opacity-0 group-hover/cell:opacity-100 p-1.5 bg-brand-teal text-white rounded-lg transition-all scale-75 hover:scale-100"
                                title="Mettre le maximum"
                              >
                                <Plus size={14} />
                              </button>
                              <div className="absolute -top-1 right-2 text-[8px] font-black text-brand-text/10 group-hover/cell:text-brand-text/20">
                                /{ex.points || 10}
                              </div>
                            </div>
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
