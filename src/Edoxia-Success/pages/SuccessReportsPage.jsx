import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDocs, documentId } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, BarChart3, TrendingUp, Users, AlertCircle, Calendar, GraduationCap, X, ChevronRight, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SuccessMobileNav from '../components/SuccessMobileNav';
import SuccessRadarChart from '../components/SuccessRadarChart';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRadarSelect, setShowRadarSelect] = useState(false);
  const [radarStep, setRadarStep] = useState(0); // 0: Subject, 1: Student, 2: Type
  const [radarSubject, setRadarSubject] = useState(null);
  const [radarStudentId, setRadarStudentId] = useState(null);
  const [radarType, setRadarType] = useState('competence');
  const [radarData, setRadarData] = useState(null);
  const [exportingRadar, setExportingRadar] = useState(false);
  const radarRef = React.useRef(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [tempCustomComps, setTempCustomComps] = useState([]);
  const [activeCustomComps, setActiveCustomComps] = useState([]);

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

  const allCompetences = useMemo(() => {
    const comps = new Set();
    const filteredEvals = selectedClassId === 'all'
      ? evaluations
      : evaluations.filter(ev => ev.selectedClassId === selectedClassId);
      
    filteredEvals.forEach(ev => {
      ev.exercises?.forEach(ex => {
        if (ex.competence && ex.competence.trim()) {
          comps.add(ex.competence.trim());
        }
      });
    });
    return Array.from(comps).sort();
  }, [evaluations, selectedClassId]);

  const stats = useMemo(() => {
    // Filter evaluations by class if a class is selected
    const filteredEvals = selectedClassId === 'all'
      ? evaluations
      : evaluations.filter(ev => ev.selectedClassId === selectedClassId);

    if (filteredEvals.length === 0) return null;

    const isSubjectView = selectedEvalId.startsWith('subject_');
    const isCompetenceView = selectedEvalId.startsWith('comp_');
    const isGlobalView = selectedEvalId === 'global';
    const isCustomView = selectedEvalId === 'custom';

    if (isGlobalView || isSubjectView || isCompetenceView || isCustomView) {
      const targetSubject = isSubjectView ? selectedEvalId.replace('subject_', '') : null;
      const targetCompetence = isCompetenceView ? selectedEvalId.replace('comp_', '') : null;

      const evalsToAggregate = targetSubject
        ? filteredEvals.filter(ev => ev.subject === targetSubject)
        : targetCompetence
        ? filteredEvals.filter(ev => ev.exercises.some(ex => ex.competence?.trim() === targetCompetence))
        : isCustomView
        ? filteredEvals.filter(ev => ev.exercises.some(ex => activeCustomComps.includes(ex.competence?.trim())))
        : filteredEvals;

      if (evalsToAggregate.length === 0 && !isGlobalView) {
        // Return an empty state for subject/competence view to avoid UI mismatch
        return { type: isCustomView ? 'custom' : isSubjectView ? 'subject' : 'competence', subject: targetSubject, name: targetCompetence || 'Personnalisé', globalAvg: 0, students: [], struggling: [], exercises: [] };
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
              // If competence view, only aggregate exercises matching this competence
              if (isCompetenceView && ex.competence?.trim() !== targetCompetence) return;
              if (isCustomView && !activeCustomComps.includes(ex.competence?.trim())) return;

              const resVal = res[idx];
              if (resVal !== undefined && resVal !== null && resVal !== '') {
                // Handle points (number) or legacy colors (string)
                let actualSuccess;
                if (COLOR_MAP.hasOwnProperty(resVal)) {
                  const mapped = COLOR_MAP[resVal];
                  if (mapped === null) return; // 'blue' / Non évalué
                  actualSuccess = mapped / 100;
                } else {
                  const pointsAwarded = parseFloat(resVal) || 0;
                  const maxPoints = ex.points || 10;
                  actualSuccess = (pointsAwarded / maxPoints);
                }

                evalScore += (actualSuccess * 100);
                evaluatedCount++;

                // Aggregate competences for subject view
                if (isSubjectView && ex.competence) {
                  const compName = ex.competence.trim();
                  if (!competenceAgg[compName]) competenceAgg[compName] = { totalScore: 0, count: 0 };
                  competenceAgg[compName].totalScore += (actualSuccess * 100);
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
      })).sort((a, b) => a.name.localeCompare(b.name));

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
        type: isCustomView ? 'custom' : isSubjectView ? 'subject' : isCompetenceView ? 'competence' : 'global',
        subject: targetSubject,
        name: isCustomView ? 'Personnalisé' : targetCompetence,
        globalAvg,
        students,
        struggling: students.filter(s => s.avg !== null && s.avg <= 30),
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
            let actualSuccess;
            if (COLOR_MAP.hasOwnProperty(resVal)) {
              const mapped = COLOR_MAP[resVal];
              if (mapped === null) return;
              actualSuccess = mapped / 100;
            } else {
              const pointsAwarded = parseFloat(resVal) || 0;
              const maxPoints = ex.points || 10;
              actualSuccess = (pointsAwarded / maxPoints);
            }
            total += actualSuccess * 100;
            evaluatedCount++;
          }
        });
        return { id: st.id, name: st.name, avg: evaluatedCount > 0 ? total / evaluatedCount : null };
      }).sort((a, b) => a.name.localeCompare(b.name));

      const exerciseScores = ev.exercises.map((ex, idx) => {
        let total = 0;
        let evaluatedCount = 0;
        ev.students.forEach(st => {
          const resVal = results[st.id]?.[idx];
          if (resVal !== undefined && resVal !== null && resVal !== '') {
            let actualSuccess;
            if (COLOR_MAP.hasOwnProperty(resVal)) {
              const mapped = COLOR_MAP[resVal];
              if (mapped === null) return;
              actualSuccess = mapped / 100;
            } else {
              const pointsAwarded = parseFloat(resVal) || 0;
              const maxPoints = ex.points || 10;
              actualSuccess = (pointsAwarded / maxPoints);
            }
            total += actualSuccess * 100;
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
        struggling: studentScores.filter(s => s.avg !== null && s.avg <= 30)
      };
    }
  }, [evaluations, allResults, selectedEvalId, selectedClassId, activeCustomComps]);

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
            score = (mapped === null) ? null : mapped;
          } else {
            score = Math.round((parseFloat(resVal) / (ex.points || 10)) * 100);
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

  const handleGenerateRadar = (studentId, subject, type) => {
    let studentsToProcess = [];
    if (studentId === 'all') {
      studentsToProcess = stats.students;
    } else {
      const student = stats.students.find(s => s.id === studentId) || evaluations.flatMap(ev => ev.students).find(s => s.id === studentId);
      if (student) studentsToProcess.push(student);
    }

    if (studentsToProcess.length === 0) return;

    let allRadarData = [];

    studentsToProcess.forEach(student => {
      let finalData = [];

      if (type === 'competence') {
        const compAgg = {};

        evaluations.forEach(ev => {
          if (subject !== 'Français & Mathématiques' && ev.subject !== subject) return;
          const results = allResults[ev.id]?.[student.id];
          if (!results) return;

          ev.exercises.forEach((ex, idx) => {
            const val = results[idx];
            if (val !== undefined && val !== null && val !== '') {
              let score;
              if (COLOR_MAP.hasOwnProperty(val)) {
                const mapped = COLOR_MAP[val];
                if (mapped === null) return;
                score = mapped;
              } else {
                score = (parseFloat(val) / (ex.points || 10)) * 100;
              }

              const compName = ex.competence?.trim() || ex.name || `Exercice ${idx + 1}`;
              if (!compAgg[compName]) compAgg[compName] = { total: 0, count: 0 };
              compAgg[compName].total += score;
              compAgg[compName].count += 1;
            }
          });
        });

        finalData = Object.entries(compAgg).map(([name, data]) => ({
          competence: name,
          score: Math.round(data.total / data.count)
        }));
      } else {
        evaluations.forEach(ev => {
          if (subject !== 'Français & Mathématiques' && ev.subject !== subject) return;
          const results = allResults[ev.id]?.[student.id];
          if (!results) return;

          let evalTotal = 0;
          let evalCount = 0;

          ev.exercises.forEach((ex, idx) => {
            const val = results[idx];
            if (val !== undefined && val !== null && val !== '') {
              let score;
              if (COLOR_MAP.hasOwnProperty(val)) {
                const mapped = COLOR_MAP[val];
                if (mapped === null) return;
                score = mapped;
              } else {
                score = (parseFloat(val) / (ex.points || 10)) * 100;
              }
              evalTotal += score;
              evalCount += 1;
            }
          });

          if (evalCount > 0) {
            finalData.push({
              evaluation: ev.name,
              score: Math.round(evalTotal / evalCount)
            });
          }
        });
      }

      if (type === 'competence' && finalData.length > 0) {
        allRadarData.push({ name: student.name, data: finalData, subject: subject, type: type });
      } else if (type === 'evaluation' && finalData.length >= 3) {
        allRadarData.push({ name: student.name, data: finalData, subject: subject, type: type });
      } else if (studentId !== 'all') {
        if (type === 'competence') alert(`Cet élève n'a pas de résultats pour ${subject}.`);
        else alert(`Cet élève n'a pas assez d'évaluations en ${subject} pour générer une toile (minimum 3).`);
      }
    });

    if (allRadarData.length === 0) {
      if (studentId === 'all') alert(`Aucun élève n'a de résultats valides pour ce bilan.`);
      return;
    }

    setRadarData(allRadarData);
    setShowRadarSelect(false);
    setRadarStep(0);
    setRadarSubject(null);
    setRadarStudentId(null);
  };

  const exportRadarPDF = async () => {
    if (!radarRef.current || !radarData || radarData.length === 0) return;
    setExportingRadar(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < radarData.length; i++) {
        const elementId = radarData.length === 1 ? 'radar-export-container' : `radar-export-container-${i}`;
        const element = document.getElementById(elementId);
        if (!element) continue;

        const canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true,
          windowWidth: 1000,
          onclone: (clonedDoc) => {
            const el = clonedDoc.getElementById(elementId);
            if (el) {
              el.style.padding = '40px';
              el.style.width = '1000px';
              el.style.height = 'auto';
              el.style.maxWidth = 'none';
            }
          }
        });

        const imgData = canvas.toDataURL('image/png');
        const ratio = pdfWidth / canvas.width;
        const imgHeight = canvas.height * ratio;

        let heightLeft = imgHeight;
        let position = 0;

        if (i > 0) pdf.addPage();

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position -= pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
      }

      if (radarData.length > 1) {
        pdf.save(`Bilans_Classe_${radarData[0].subject.replace(/\s+/g, '_')}.pdf`);
      } else {
        pdf.save(`Bilan_Competences_${radarData[0].name.replace(/\s+/g, '_')}.pdf`);
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'exportation.");
    }
    setExportingRadar(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-brand-text/20 uppercase tracking-widest text-center px-6">Calcul des analyses pédagogiques...</div>;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text p-4 md:p-10 pb-32">
      <SuccessMobileNav
        mode="reports"
        onOpenView={() => setShowViewModal(true)}
        onOpenRadar={() => setShowRadarSelect(true)}
      />
      <header className="max-w-7xl mx-auto hidden md:flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
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
            {activeCustomComps.length > 0 && (
              <option value="custom">🛠️ Vue personnalisée</option>
            )}
            <optgroup label="Évaluations de la classe">
              {(selectedClassId === 'all'
                ? evaluations
                : evaluations.filter(ev => ev.selectedClassId === selectedClassId)
              ).map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </optgroup>
            {allCompetences.length > 0 && (
              <optgroup label="Par compétence">
                {allCompetences.map(comp => (
                  <option key={comp} value={`comp_${comp}`}>{comp}</option>
                ))}
              </optgroup>
            )}
          </select>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowRadarSelect(true)}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all text-xs uppercase tracking-wider"
            >
              <Target size={18} /> Générer résultats
            </button>
            <button
              onClick={() => {
                setTempCustomComps(activeCustomComps);
                setShowCustomModal(true);
              }}
              className="w-full bg-brand-teal/10 text-brand-teal border border-brand-teal/20 px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-brand-teal/20 active:scale-95 transition-all text-xs uppercase tracking-wider"
            >
              Personnaliser
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-10 pb-20">
        {stats?.type === 'custom' && activeCustomComps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-brand-teal/5 border border-brand-teal/20 rounded-3xl p-6">
            <h2 className="text-sm font-black text-brand-teal uppercase tracking-widest mb-3 flex items-center gap-2">
              <Target size={16} /> Compétences sélectionnées ({activeCustomComps.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {activeCustomComps.map(comp => (
                <span key={comp} className="px-3 py-1.5 bg-white text-brand-teal font-black text-xs rounded-xl shadow-sm border border-brand-teal/10">
                  {comp}
                </span>
              ))}
            </div>
          </motion.div>
        )}

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
              Pourcentage de réussite {stats?.type === 'global' ? '' : stats?.type === 'subject' ? 'de la matière' : stats?.type === 'competence' ? 'de la compétence' : stats?.type === 'custom' ? 'des compétences sélectionnées' : 'de l\'évaluation'}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-8 bg-white/60 backdrop-blur-md border border-white rounded-[40px] shadow-soft text-center group">
            <div className="w-12 h-12 bg-brand-coral/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Users className="text-brand-coral" />
            </div>
            <div className="text-4xl font-black tracking-tighter mb-1">
              {stats?.type === 'global' ? evaluations.length : (stats?.type === 'competence' || stats?.type === 'custom') ? stats?.students.length : stats?.exercises.length}
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-brand-text/40">{stats?.type === 'global' ? 'Évaluations' : (stats?.type === 'competence' || stats?.type === 'custom') ? 'Élèves évalués' : 'Exercices'}</div>
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
              {stats.exercises.map((ex, idx) => {
                const isAcquiring = ex.avg >= 70;
                const isLearning = ex.avg > 30 && ex.avg < 70;
                const isFailed = ex.avg <= 30;

                return (
                  <div key={idx} className="p-6 bg-white/40 border border-white/60 rounded-3xl space-y-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-brand-text/30 uppercase tracking-widest">
                        {stats.type === 'subject' ? 'Compétence agrégée' : `Compétence ${idx + 1}`}
                      </span>
                      <span className="font-black text-sm line-clamp-2 min-h-[2.5rem]">{ex.competence || `Exercice ${idx + 1}`}</span>
                    </div>
                    <div className={`text-2xl font-black ${isAcquiring ? 'text-brand-teal' : isLearning ? 'text-amber-500' : 'text-brand-coral'}`}>
                      {ex.avg.toFixed(0)}%
                    </div>
                    <div className="w-full h-1.5 bg-brand-text/5 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ${isAcquiring ? 'bg-brand-teal' : isLearning ? 'bg-amber-400' : 'bg-brand-coral'}`} style={{ width: `${ex.avg}%` }}></div>
                    </div>
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
                );
              })}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6 order-2 lg:order-1">
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
                      <div className={`h-full transition-all duration-1000 ${s.avg >= 70 ? 'bg-brand-teal' : s.avg > 30 ? 'bg-amber-400' : 'bg-brand-coral'}`} style={{ width: `${s.avg || 0}%` }}></div>
                    </div>
                    <span className={`text-sm font-black w-10 text-right ${s.avg >= 70 ? 'text-brand-teal' : s.avg > 30 ? 'text-amber-500' : 'text-brand-coral'}`}>{s.avg !== null ? `${s.avg.toFixed(0)}%` : '-'}</span>
                    <ChevronRight size={16} className="text-brand-text/20 group-hover:text-brand-teal group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 order-1 lg:order-2">
            <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tight">
              <AlertCircle className="text-brand-coral" /> Vigilance pédagogique
            </h2>
            <div className="bg-brand-coral/5 border border-brand-coral/10 rounded-[40px] p-8">
              {stats?.struggling.length > 0 ? (
                <div className="space-y-6">
                  <p className="text-sm font-medium text-brand-text/60 italic">Ces élèves sont en dessous du seuil de 30% sur {stats?.type === 'global' ? 'la moyenne de toutes les évaluations' : 'cette évaluation'}.</p>
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
                  <p className="text-sm text-brand-text/40 mt-2">Aucun élève sous le seuil des 30%.</p>
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
              className="absolute inset-0 bg-brand-bg/95"
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
                          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${c.score === null ? 'bg-blue-500/10 border-blue-100 text-blue-600' :
                              c.score >= 70 ? 'bg-brand-teal/20 border-brand-teal/30 text-brand-teal' :
                                c.score > 30 ? 'bg-amber-400/10 border-amber-200 text-amber-600' :
                                  'bg-brand-coral/10 border-brand-coral/30 text-brand-coral'
                            }`}>
                            {c.score === null ? 'Non évalué' : c.score >= 70 ? 'Acquis' : c.score > 30 ? 'En cours' : 'Non acquis'}
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

      {/* Mobile View Selection Modal */}
      <AnimatePresence>
        {showViewModal && (
          <div className="fixed inset-0 z-[150] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowViewModal(false)}
              className="absolute inset-0 bg-black/40"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-[40px] shadow-2xl w-full p-8 pb-12 relative z-10 space-y-8"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-black uppercase tracking-tight">Choisir la vue</h3>
                <button onClick={() => setShowViewModal(false)} className="p-2 text-brand-text/20 hover:text-brand-coral transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-text/40 ml-2">Classe</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => { setSelectedClassId('all'); setSelectedEvalId('global'); }}
                      className={`p-4 rounded-2xl border-2 font-black text-sm text-left transition-all ${selectedClassId === 'all' ? 'bg-brand-teal/5 border-brand-teal text-brand-teal' : 'bg-brand-bg border-white text-brand-text/60'}`}
                    >
                      👥 Toutes les classes
                    </button>
                    {classes.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedClassId(c.id); setSelectedEvalId('global'); }}
                        className={`p-4 rounded-2xl border-2 font-black text-sm text-left transition-all ${selectedClassId === c.id ? 'bg-brand-teal/5 border-brand-teal text-brand-teal' : 'bg-brand-bg border-white text-brand-text/60'}`}
                      >
                        🏫 {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-text/40 ml-2">Analyse</label>
                  <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto pr-2">
                    {[
                      { id: 'global', label: '🌍 Vue Globale' },
                      { id: 'subject_Français', label: '📚 Vue Français' },
                      { id: 'subject_Mathématiques', label: '🧮 Vue Mathématiques' },
                      ...((selectedClassId === 'all' ? evaluations : evaluations.filter(ev => ev.selectedClassId === selectedClassId)).map(ev => ({ id: ev.id, label: `📝 ${ev.name}` }))),
                      ...(allCompetences.map(comp => ({ id: `comp_${comp}`, label: `🎯 ${comp}` })))
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => { setSelectedEvalId(opt.id); setShowViewModal(false); }}
                        className={`p-4 rounded-2xl border-2 font-black text-sm text-left transition-all ${selectedEvalId === opt.id ? 'bg-brand-teal/5 border-brand-teal text-brand-teal' : 'bg-brand-bg border-white text-brand-text/60'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRadarSelect && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowRadarSelect(false); setRadarStep(0); }} className="absolute inset-0 bg-black/40" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="bg-white rounded-[40px] shadow-2xl w-full max-w-md p-8 relative z-10">

              {radarStep === 0 ? (
                <>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-6">Étape 1 : Matière</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {['Français', 'Mathématiques', 'Français & Mathématiques'].map(subject => (
                      <button
                        key={subject}
                        onClick={() => { setRadarSubject(subject); setRadarStep(1); }}
                        className="w-full p-6 rounded-2xl border-2 border-brand-bg hover:border-brand-teal hover:bg-brand-teal/5 font-black text-lg transition-all flex justify-between items-center group"
                      >
                        <span>{subject === 'Français' ? '📚 Français' : subject === 'Mathématiques' ? '🧮 Mathématiques' : '📚🧮 Français & Mathématiques'}</span>
                        <ChevronRight size={24} className="text-brand-text/10 group-hover:text-brand-teal" />
                      </button>
                    ))}
                  </div>
                </>
              ) : radarStep === 1 ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black uppercase tracking-tight">Étape 2 : Élève</h3>
                    <button onClick={() => setRadarStep(0)} className="text-[10px] font-black uppercase tracking-widest text-brand-teal hover:underline">Retour</button>
                  </div>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                    <button
                      onClick={() => { setRadarStudentId('all'); setRadarStep(2); }}
                      className="w-full p-4 mb-4 rounded-2xl border-2 border-brand-teal/50 bg-brand-teal/5 hover:border-brand-teal hover:bg-brand-teal/10 font-black text-brand-teal text-sm text-left transition-all flex justify-between items-center group shadow-sm"
                    >
                      <span>🎓 Toute la classe</span>
                      <ChevronRight size={18} className="text-brand-teal/50 group-hover:text-brand-teal" />
                    </button>
                    {stats.students.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setRadarStudentId(s.id); setRadarStep(2); }}
                        className="w-full p-4 rounded-2xl border-2 border-brand-bg hover:border-indigo-200 hover:bg-indigo-50 font-black text-sm text-left transition-all flex justify-between items-center group"
                      >
                        <span>{s.name}</span>
                        <ChevronRight size={18} className="text-brand-text/20 group-hover:text-indigo-500" />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black uppercase tracking-tight">Étape 3 : Type d'analyse</h3>
                    <button onClick={() => setRadarStep(1)} className="text-[10px] font-black uppercase tracking-widest text-brand-teal hover:underline">Retour</button>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleGenerateRadar(radarStudentId, radarSubject, 'competence')}
                      className="w-full p-6 rounded-2xl border-2 border-brand-bg hover:border-indigo-200 hover:bg-indigo-50 font-black text-sm text-left transition-all flex flex-col gap-2 group"
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-lg">Par compétence</span>
                        <ChevronRight size={18} className="text-brand-text/20 group-hover:text-indigo-500" />
                      </div>
                      <span className="text-xs text-brand-text/50 font-medium">Affiche un diagramme en colonne des résultats par compétence détaillée.</span>
                    </button>
                    <button
                      onClick={() => handleGenerateRadar(radarStudentId, radarSubject, 'evaluation')}
                      className="w-full p-6 rounded-2xl border-2 border-brand-bg hover:border-indigo-200 hover:bg-indigo-50 font-black text-sm text-left transition-all flex flex-col gap-2 group"
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-lg">Par évaluation</span>
                        <ChevronRight size={18} className="text-brand-text/20 group-hover:text-indigo-500" />
                      </div>
                      <span className="text-xs text-brand-text/50 font-medium">Affiche un diagramme en toile d'araignée de la moyenne par évaluation.</span>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Radar Display Modal */}
      <AnimatePresence>
        {radarData && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 md:p-10">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRadarData(null)} className="absolute inset-0 bg-brand-bg/95" />
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-4xl max-h-full overflow-y-auto flex flex-col gap-6"
            >
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setRadarData(null)}
                  className="px-6 py-3 bg-white border border-indigo-100 rounded-2xl font-black text-brand-text/40 hover:text-brand-coral transition-all uppercase tracking-widest text-xs"
                >
                  Fermer
                </button>
                <button
                  onClick={exportRadarPDF}
                  disabled={exportingRadar}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center gap-2"
                >
                  {exportingRadar ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Target size={16} />}
                  Télécharger PDF
                </button>
              </div>

              <div ref={radarRef} className="flex flex-col gap-10">
                {radarData.map((data, index) => (
                  <div id={radarData.length === 1 ? 'radar-export-container' : `radar-export-container-${index}`} key={index} className="bg-white p-12 rounded-[40px] shadow-sm shrink-0 relative">
                    {radarData.length > 1 && (
                      <div className="absolute top-4 right-4 bg-brand-teal/10 text-brand-teal text-[10px] font-black px-2 py-1 rounded-full">
                        {index + 1} / {radarData.length}
                      </div>
                    )}
                    <div className="text-center mb-10">
                      <h2 className="text-3xl font-black uppercase tracking-tighter text-brand-text">Bilan mi-CM2</h2>
                      <div className="flex flex-col items-center justify-center gap-2 mt-3">
                        <span className="text-2xl font-black text-brand-text/60 leading-none">{data.name}</span>
                        <span className="px-4 py-1.5 bg-brand-teal/10 text-brand-teal text-[10px] font-black uppercase tracking-widest rounded-full">{data.subject}</span>
                      </div>
                    </div>

                    {data.type === 'evaluation' && (
                      <div className="flex justify-center mb-10 w-full overflow-x-auto overflow-y-hidden px-4">
                        <SuccessRadarChart data={data.data.map(d => ({ competence: d.evaluation, score: d.score }))} studentName={data.name} />
                      </div>
                    )}

                    <div className="mt-10 pt-10 border-t-2 border-brand-bg space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-brand-text/30 mb-6">Détail des résultats</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                        {data.data.map((item, idx) => {
                          const isAcquired = item.score >= 70;
                          const isLearning = item.score > 30 && item.score < 70;
                          const label = data.type === 'competence' ? item.competence : item.evaluation;
                          return (
                            <div key={idx} className="flex items-center justify-between py-3 border-b border-brand-bg group">
                              <div className="flex items-center gap-3 pr-4">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${isAcquired ? 'bg-brand-teal' : isLearning ? 'bg-amber-400' : 'bg-brand-coral'}`} />
                                <span className="text-xs font-black uppercase text-brand-text/70 leading-tight">{label}</span>
                              </div>
                              <div className="flex items-center gap-4 shrink-0">
                                <div className="w-20 h-1.5 bg-brand-bg rounded-full overflow-hidden hidden sm:block">
                                  <div className={`h-full ${isAcquired ? 'bg-brand-teal' : isLearning ? 'bg-amber-400' : 'bg-brand-coral'}`} style={{ width: `${item.score}%` }} />
                                </div>
                                <span className={`text-sm font-black w-10 text-right ${isAcquired ? 'text-brand-teal' : isLearning ? 'text-amber-500' : 'text-brand-coral'}`}>{Math.round(item.score)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Competences Modal */}
      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCustomModal(false)} className="absolute inset-0 bg-brand-bg/95" />
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl border border-white flex flex-col max-h-[85vh] overflow-hidden"
            >
              <header className="p-8 border-b border-brand-text/5 flex justify-between items-center shrink-0">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Personnaliser la vue</h2>
                  <p className="text-xs font-bold text-brand-text/40 uppercase tracking-widest">
                    Sélectionnez les compétences à combiner
                  </p>
                </div>
                <button
                  onClick={() => setShowCustomModal(false)}
                  className="p-3 hover:bg-brand-bg rounded-2xl transition-colors text-brand-text/20 hover:text-brand-coral"
                >
                  <X size={24} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                {allCompetences.map(comp => (
                  <label key={comp} className="flex items-center gap-4 p-4 rounded-2xl border border-brand-bg hover:bg-brand-bg/50 cursor-pointer transition-colors group">
                    <input
                      type="checkbox"
                      checked={tempCustomComps.includes(comp)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTempCustomComps([...tempCustomComps, comp]);
                        } else {
                          setTempCustomComps(tempCustomComps.filter(c => c !== comp));
                        }
                      }}
                      className="w-5 h-5 rounded border-brand-text/20 text-brand-teal focus:ring-brand-teal"
                    />
                    <span className="font-black text-sm">{comp}</span>
                  </label>
                ))}
              </div>

              <footer className="p-8 border-t border-brand-text/5 flex justify-end gap-4 shrink-0 bg-white">
                <button
                  onClick={() => {
                    setTempCustomComps([]);
                  }}
                  className="px-6 py-3 bg-brand-bg border border-transparent rounded-2xl font-black text-brand-text/60 hover:text-brand-text transition-all text-xs uppercase tracking-wider"
                >
                  Tout décocher
                </button>
                <button
                  onClick={() => {
                    setActiveCustomComps(tempCustomComps);
                    if (tempCustomComps.length > 0) {
                      setSelectedEvalId('custom');
                    } else {
                      setSelectedEvalId('global');
                    }
                    setShowCustomModal(false);
                  }}
                  className="px-6 py-3 bg-brand-teal text-white rounded-2xl font-black shadow-lg shadow-brand-teal/30 hover:brightness-110 active:scale-95 transition-all text-xs uppercase tracking-wider"
                >
                  Valider la sélection
                </button>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

