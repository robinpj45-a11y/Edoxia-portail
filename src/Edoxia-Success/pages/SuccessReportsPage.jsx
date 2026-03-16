import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDocs, documentId } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, BarChart3, TrendingUp, Users, AlertCircle, Calendar, GraduationCap, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COLOR_MAP = {
  'blue': null,
  'white': 0,
  'orange': 50,
  'green': 100
};

export default function SuccessReportsPage() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [allResults, setAllResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedEvalId, setSelectedEvalId] = useState('global');
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  useEffect(() => {
    // 1. Fetch all evaluations for this space
    const qEvals = query(collection(db, 'success_evaluations'), where('spaceId', '==', spaceId));

    // 2. Fetch all classes
    const qClasses = query(collection(db, 'success_classes'), where('spaceId', '==', spaceId));

    const unsubscribeEvals = onSnapshot(qEvals, async (snap) => {
      const evals = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      evals.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setEvaluations(evals);

      // 3. Fetch all results linked to this space
      const resultsMap = {};
      // Step A: fetch with spaceId (fastest)
      const resultsSnap = await getDocs(query(collection(db, 'success_results'), where('spaceId', '==', spaceId)));
      resultsSnap.docs.forEach(d => {
        resultsMap[d.id] = d.data().data;
      });

      // Step B: fallback for old results without spaceId
      const missingEvalIds = evals.filter(e => !resultsMap[e.id]).map(e => e.id);
      if (missingEvalIds.length > 0) {
        // Firestore 'in' queries are limited to 30 items
        for (let i = 0; i < missingEvalIds.length; i += 30) {
          const chunk = missingEvalIds.slice(i, i + 30);
          const qMissing = query(collection(db, 'success_results'), where(documentId(), 'in', chunk));
          const missingSnap = await getDocs(qMissing);
          missingSnap.docs.forEach(d => {
            resultsMap[d.id] = d.data().data;
          });
        }
      }

      setAllResults(resultsMap);
      setLoading(false);
    });

    const unsubscribeClasses = onSnapshot(qClasses, (snap) => {
      const cls = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(cls);
    });

    return () => {
      unsubscribeEvals();
      unsubscribeClasses();
    };
  }, [spaceId]);

  // Auto-select first class when loaded
  useEffect(() => {
    if (selectedClassId === 'all' && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const stats = useMemo(() => {
    // Filter evaluations by class if a class is selected
    const filteredEvals = selectedClassId === 'all'
      ? evaluations
      : evaluations.filter(ev => ev.selectedClassId === selectedClassId);

    if (filteredEvals.length === 0) return null;

    const isSubjectView = selectedEvalId.startsWith('subject_');
    const isGlobalView = selectedEvalId === 'global';

    if (isGlobalView || isSubjectView) {
      const targetSubject = isSubjectView ? selectedEvalId.replace('subject_', '') : null;
      
      const evalsToAggregate = targetSubject 
        ? filteredEvals.filter(ev => ev.subject === targetSubject)
        : filteredEvals;

      if (evalsToAggregate.length === 0 && !isGlobalView) {
        // Return an empty state for subject view to avoid UI mismatch
        return { type: 'subject', subject: targetSubject, globalAvg: 0, students: [], struggling: [], exercises: [] };
      }
      if (evalsToAggregate.length === 0) return null;

      const studentStats = {};
      const competenceAgg = {}; // { competenceName: { totalScore: 0, count: 0 } }

      evalsToAggregate.forEach(ev => {
        ev.students?.forEach(st => {
          if (!studentStats[st.id]) {
            studentStats[st.id] = { id: st.id, name: st.name, totalScore: 0, count: 0 };
          }
          const res = allResults[ev.id]?.[st.id];
          if (res) {
            let evalScore = 0;
            let evaluatedCount = 0;
            ev.exercises.forEach((ex, idx) => {
              const resVal = res[idx];
              if (resVal !== undefined && resVal !== null && resVal !== '') {
                // Handle points (number) or legacy colors (string)
                let isSuccess;
                if (COLOR_MAP.hasOwnProperty(resVal)) {
                  const mapped = COLOR_MAP[resVal];
                  if (mapped === null) return; // 'blue' / Non évalué
                  isSuccess = mapped >= 75 ? 1 : 0;
                } else {
                  const pointsAwarded = parseFloat(resVal) || 0;
                  const maxPoints = ex.points || 10;
                  isSuccess = (pointsAwarded / maxPoints) >= 0.75 ? 1 : 0;
                }

                evalScore += (isSuccess * 100);
                evaluatedCount++;

                // Aggregate competences for subject view
                if (isSubjectView && ex.competence) {
                  const compName = ex.competence.trim();
                  if (!competenceAgg[compName]) competenceAgg[compName] = { totalScore: 0, count: 0 };
                  competenceAgg[compName].totalScore += (isSuccess * 100);
                  competenceAgg[compName].count += 1;
                }
              }
            });
            if (evaluatedCount > 0) {
              const avg = evalScore / evaluatedCount;
              studentStats[st.id].totalScore += avg;
              studentStats[st.id].count += 1;
            }
          }
        });
      });

      const students = Object.values(studentStats).map(s => ({
        ...s,
        avg: s.count > 0 ? s.totalScore / s.count : null
      })).sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));

      const evaluatedStudents = students.filter(s => s.avg !== null);
      const globalAvg = evaluatedStudents.length > 0
        ? evaluatedStudents.reduce((acc, s) => acc + s.avg, 0) / evaluatedStudents.length
        : 0;

      const aggregatedCompetences = Object.entries(competenceAgg).map(([name, data]) => ({
        competence: name,
        avg: data.totalScore / data.count,
        count: data.count
      })).sort((a, b) => b.avg - a.avg);

      return {
        type: isSubjectView ? 'subject' : 'global',
        subject: targetSubject,
        globalAvg,
        students,
        struggling: students.filter(s => s.avg !== null && s.avg < 50),
        exercises: aggregatedCompetences // Reusing exercises key for rendering consistency
      };
    } else {
      // Logic spécifique à une évaluation
      const ev = filteredEvals.find(e => e.id === selectedEvalId);
      if (!ev) return null;

      const results = allResults[ev.id] || {};
      const studentScores = ev.students.map(st => {
        let total = 0;
        let evaluatedCount = 0;
        ev.exercises.forEach((ex, idx) => {
          const resVal = results[st.id]?.[idx];
          if (resVal !== undefined && resVal !== null && resVal !== '') {
            let isSuccess;
            if (COLOR_MAP.hasOwnProperty(resVal)) {
              const mapped = COLOR_MAP[resVal];
              if (mapped === null) return;
              isSuccess = mapped >= 75 ? 1 : 0;
            } else {
              const pointsAwarded = parseFloat(resVal) || 0;
              const maxPoints = ex.points || 10;
              isSuccess = (pointsAwarded / maxPoints) >= 0.75 ? 1 : 0;
            }
            total += isSuccess * 100;
            evaluatedCount++;
          }
        });
        return { id: st.id, name: st.name, avg: evaluatedCount > 0 ? total / evaluatedCount : null };
      }).sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));

      const exerciseScores = ev.exercises.map((ex, idx) => {
        let total = 0;
        let evaluatedCount = 0;
        ev.students.forEach(st => {
          const resVal = results[st.id]?.[idx];
          if (resVal !== undefined && resVal !== null && resVal !== '') {
            let isSuccess;
            if (COLOR_MAP.hasOwnProperty(resVal)) {
              const mapped = COLOR_MAP[resVal];
              if (mapped === null) return;
              isSuccess = mapped >= 75 ? 1 : 0;
            } else {
              const pointsAwarded = parseFloat(resVal) || 0;
              const maxPoints = ex.points || 10;
              isSuccess = (pointsAwarded / maxPoints) >= 0.75 ? 1 : 0;
            }
            total += isSuccess * 100;
            evaluatedCount++;
          }
        });
        return { ...ex, avg: evaluatedCount > 0 ? total / evaluatedCount : 0 };
      });

      const evaluatedStudents = studentScores.filter(s => s.avg !== null);
      const globalAvg = evaluatedStudents.length > 0
        ? evaluatedStudents.reduce((acc, s) => acc + s.avg, 0) / evaluatedStudents.length
        : 0;

      return {
        type: 'evaluation',
        name: ev.name,
        globalAvg,
        students: studentScores,
        exercises: exerciseScores,
        struggling: studentScores.filter(s => s.avg !== null && s.avg < 50)
      };
    }
  }, [evaluations, allResults, selectedEvalId, selectedClassId]);

  const studentDetails = useMemo(() => {
    if (!selectedStudentId || !stats) return null;

    let studentInfo = stats.students.find(s => s.id === selectedStudentId);
    
    // Fallback if student not in current stats list (e.g. not evaluated)
    if (!studentInfo) {
      // Find them in any evaluation student list
      for (const ev of evaluations) {
        const found = ev.students?.find(s => s.id === selectedStudentId);
        if (found) {
          studentInfo = { id: found.id, name: found.name, avg: null };
          break;
        }
      }
    }

    if (!studentInfo) return null;

    const comps = [];
    evaluations.forEach(ev => {
      // Check if student is in this evaluation
      const hasStudent = ev.students?.some(st => st.id === selectedStudentId);
      if (!hasStudent) return;

      const results = allResults[ev.id]?.[selectedStudentId] || {};
      ev.exercises.forEach((ex, idx) => {
        const resVal = results[idx];
        let score = null;
        if (resVal !== undefined && resVal !== null && resVal !== '') {
          if (COLOR_MAP.hasOwnProperty(resVal)) {
            const mapped = COLOR_MAP[resVal];
            score = (mapped === null) ? null : (mapped >= 75 ? 100 : 0);
          } else {
            score = (parseFloat(resVal) / (ex.points || 10)) >= 0.75 ? 100 : 0;
          }
        }

        comps.push({
          id: `${ev.id}_${idx}`,
          evalName: ev.name,
          subject: ev.subject,
          exerciseName: ex.name,
          competence: ex.competence,
          score: score,
          date: ev.createdAt
        });
      });
    });

    return {
      name: studentInfo.name,
      avg: studentInfo.avg,
      competences: comps.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0))
    };
  }, [selectedStudentId, evaluations, allResults, stats]);

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-brand-text/20 uppercase tracking-widest text-center px-6">Calcul des analyses pédagogiques...</div>;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text p-4 md:p-10">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="flex flex-col gap-4">
          <button onClick={() => navigate(`/success/${spaceId}`)} className="flex items-center gap-2 transition-colors font-bold text-brand-text/50 hover:text-brand-text">
            <ArrowLeft size={20} /> Tableau de bord
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Rapports</h1>
            <p className="text-xs font-bold text-brand-text/40">Suivi des progrès et performances</p>
          </div>
        </div>

        <div className="w-full md:w-auto flex flex-col md:flex-row gap-4">
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedEvalId('global'); // Reset evaluation selection when class changes
            }}
            className="w-full md:w-60 bg-white/60 border border-white px-5 py-3 rounded-2xl font-black text-sm uppercase tracking-wider shadow-soft focus:outline-none focus:ring-2 focus:ring-brand-coral/20"
          >
            <option value="all">👥 Toutes les classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>🏫 {c.name}</option>
            ))}
          </select>

          <select
            value={selectedEvalId}
            onChange={(e) => setSelectedEvalId(e.target.value)}
            className="w-full md:w-72 bg-white/60 border border-white px-5 py-3 rounded-2xl font-black text-sm uppercase tracking-wider shadow-soft focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
          >
            <option value="global">🌍 Vue Globale</option>
            <option value="subject_Français">📚 Vue Français</option>
            <option value="subject_Mathématiques">🧮 Vue Mathématiques</option>
            <optgroup label="Évaluations de la classe">
              {(selectedClassId === 'all'
                ? evaluations
                : evaluations.filter(ev => ev.selectedClassId === selectedClassId)
              ).map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-10 pb-20">
        {/* Résumé */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-white/60 backdrop-blur-md border border-white rounded-[40px] shadow-soft text-center group">
            <div className="w-12 h-12 bg-brand-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="text-brand-teal" />
            </div>
            <div className="text-4xl font-black tracking-tighter mb-1">
              {stats?.globalAvg?.toFixed(1) || '0.0'}%
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-brand-text/40">
              Pourcentage de réussite {stats?.type === 'global' ? '' : stats?.type === 'subject' ? 'de la matière' : 'de l\'évaluation'}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-8 bg-white/60 backdrop-blur-md border border-white rounded-[40px] shadow-soft text-center group">
            <div className="w-12 h-12 bg-brand-coral/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Users className="text-brand-coral" />
            </div>
            <div className="text-4xl font-black tracking-tighter mb-1">
              {stats?.type === 'global' ? evaluations.length : stats?.exercises.length}
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-brand-text/40">{stats?.type === 'global' ? 'Évaluations' : 'Exercices'}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-8 bg-white/60 backdrop-blur-md border border-white rounded-[40px] shadow-soft text-center group">
            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <AlertCircle className="text-orange-500" />
            </div>
            <div className="text-4xl font-black tracking-tighter mb-1">
              {stats?.struggling.length}
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-brand-text/40">Élèves en difficulté</div>
          </motion.div>
        </div>

        {(stats?.type === 'evaluation' || stats?.type === 'subject') && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tight">
              <BarChart3 className="text-brand-teal" /> Résultats par compétence
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.exercises.map((ex, idx) => (
                <div key={idx} className="p-6 bg-white/40 border border-white/60 rounded-3xl space-y-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-brand-text/30 uppercase tracking-widest">
                      {stats.type === 'subject' ? 'Compétence agrégée' : `Compétence ${idx + 1}`}
                    </span>
                    <span className="font-black text-sm line-clamp-2 min-h-[2.5rem]">{ex.competence || `Exercice ${idx + 1}`}</span>
                  </div>
                  <div className="text-2xl font-black text-brand-teal">{ex.avg.toFixed(0)}%</div>
                  {stats.type === 'evaluation' && (
                    <div className="text-[10px] font-bold text-brand-text/50 leading-tight bg-white/50 p-2 rounded-xl italic">
                      {ex.name}
                    </div>
                  )}
                  {stats.type === 'subject' && (
                    <div className="text-[10px] font-bold text-brand-text/50 uppercase tracking-widest">
                      {ex.count} évaluation(s)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tight">
              <GraduationCap className="text-brand-teal" /> Réussite par élève
            </h2>
            <div className="space-y-4">
              {stats?.students.map((s, idx) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudentId(s.id)}
                  className="p-5 bg-white/40 border border-white/60 rounded-3xl flex items-center justify-between group hover:bg-white hover:shadow-soft transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-brand-text/20 group-hover:text-brand-teal transition-colors">#{idx + 1}</span>
                    <span className="font-black">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 md:w-32 h-2 bg-brand-text/5 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-teal transition-all duration-1000" style={{ width: `${s.avg || 0}%` }}></div>
                    </div>
                    <span className="text-sm font-black w-10 text-right">{s.avg !== null ? `${s.avg.toFixed(0)}%` : '-'}</span>
                    <ChevronRight size={16} className="text-brand-text/20 group-hover:text-brand-teal group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tight">
              <AlertCircle className="text-brand-coral" /> Vigilance pédagogique
            </h2>
            <div className="bg-brand-coral/5 border border-brand-coral/10 rounded-[40px] p-8">
              {stats?.struggling.length > 0 ? (
                <div className="space-y-6">
                  <p className="text-sm font-medium text-brand-text/60 italic">Ces élèves sont en dessous du seuil de réussite de 50% sur {stats?.type === 'global' ? 'la moyenne de toutes les évaluations' : 'cette évaluation'}.</p>
                  <div className="flex flex-wrap gap-3">
                    {stats.struggling.map(s => (
                      <div key={s.name} className="px-5 py-3 bg-white border border-brand-coral/20 rounded-2xl font-black text-brand-coral shadow-sm">
                        {s.name}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-brand-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="text-brand-teal" />
                  </div>
                  <p className="font-black text-brand-teal uppercase tracking-widest text-xs">Excellente dynamique !</p>
                  <p className="text-sm text-brand-text/40 mt-2">Aucun élève sous le seuil des 50%.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Student Detail Modal */}
      <AnimatePresence>
        {selectedStudentId && studentDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudentId(null)}
              className="absolute inset-0 bg-brand-bg/60 backdrop-blur-md"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-[40px] shadow-2xl border border-white overflow-hidden flex flex-col"
            >
              <header className="p-8 border-b border-brand-text/5 flex justify-between items-center shrink-0">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">{studentDetails.name}</h2>
                  <p className="text-xs font-bold text-brand-text/40 uppercase tracking-widest">
                    Détail des compétences • Moyenne {studentDetails.avg !== null ? `${studentDetails.avg.toFixed(1)}%` : '-'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="p-3 hover:bg-brand-bg rounded-2xl transition-colors text-brand-text/20 hover:text-brand-coral"
                >
                  <X size={24} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {studentDetails.competences.length > 0 ? (
                  <div className="space-y-4">
                    {studentDetails.competences.map((c) => (
                      <div key={c.id} className="p-5 bg-brand-bg/30 rounded-3xl border border-white flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-white hover:shadow-soft transition-all">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded-md uppercase tracking-widest">{c.subject}</span>
                            <span className="text-[10px] font-bold text-brand-text/30 uppercase tracking-widest">via {c.evalName}</span>
                          </div>
                          <h3 className="font-black text-sm uppercase leading-tight">{c.competence || c.exerciseName}</h3>
                          {c.competence && <p className="text-[10px] font-bold text-brand-text/30 italic">{c.exerciseName}</p>}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${c.score >= 75 ? 'bg-brand-teal/20 border-brand-teal/30 text-brand-teal' :
                            c.score === null ? 'bg-blue-500/10 border-blue-200 text-blue-600' :
                              'bg-white border-brand-text/10 text-brand-text/30'
                            }`}>
                            {c.score >= 75 ? 'Acquis' : c.score === null ? 'Non évalué' : 'Non acquis'}
                          </div>
                          <div className="text-sm font-black w-8 text-right text-brand-text/40">
                            {c.score !== null ? `${c.score}%` : '-'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 opacity-20 font-black uppercase tracking-widest">
                    Aucune donnée à afficher
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
