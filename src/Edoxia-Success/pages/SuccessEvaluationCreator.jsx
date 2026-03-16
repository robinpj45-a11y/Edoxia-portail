import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, addDoc, setDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Save, Plus, Trash2, CheckCircle, AlertCircle, Calendar, GraduationCap, Calculator, BookOpen, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SUBJECT_ICONS = {
  'Français': <BookOpen size={24} className="text-brand-coral" />,
  'Mathématiques': <Calculator size={24} className="text-brand-teal" />
};

export default function SuccessEvaluationCreator() {
  const { spaceId } = useParams();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(editId ? true : false);
  const [classes, setClasses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(null); // { message: string, type: 'success' | 'info' }

  const [evaluation, setEvaluation] = useState({
    name: '',
    subject: 'Français',
    selectedClassId: '',
    status: 'draft', // 'draft' or 'published'
    exercises: [{ name: '', competence: '', points: 10 }]
  });

  useEffect(() => {
    // Fetch classes
    const fetchClasses = async () => {
      const q = query(collection(db, 'success_classes'), where('spaceId', '==', spaceId));
      const snap = await getDocs(q);
      const cls = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(cls);
      if (cls.length > 0 && !evaluation.selectedClassId) {
        setEvaluation(prev => ({ ...prev, selectedClassId: cls[0].id }));
      }
    };

    const fetchEditData = async () => {
      if (editId) {
        try {
          const snap = await getDoc(doc(db, 'success_evaluations', editId));
          if (snap.exists()) {
            setEvaluation(snap.data());
          }
        } catch (error) {
          console.error("Error fetching evaluation:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchClasses();
    fetchEditData();
  }, [spaceId, editId]);

  const triggerToast = (message, type = 'success') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const addExercise = () => {
    setEvaluation(prev => ({
      ...prev,
      exercises: [...prev.exercises, { name: '', competence: '', points: 10 }]
    }));
    triggerToast("Exercice ajouté", "info");
  };

  const removeExercise = (index) => {
    if (evaluation.exercises.length > 1) {
      setEvaluation(prev => ({
        ...prev,
        exercises: prev.exercises.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSave = async (status = 'published') => {
    if (!evaluation.name || !evaluation.selectedClassId) {
      alert("Veuillez remplir le nom et choisir une classe.");
      return;
    }

    setSaving(true);
    try {
      // Get students for the class if publishing
      let students = evaluation.students || [];
      if (status === 'published' && (!students || students.length === 0)) {
        const studentsSnap = await getDocs(query(
          collection(db, 'success_students'), 
          where('classId', '==', evaluation.selectedClassId)
        ));
        students = studentsSnap.docs.map(doc => ({ id: doc.id, name: `${doc.data().lastName} ${doc.data().firstName}` }));
        
        if (students.length === 0) {
          students = [
            { id: 'default-1', name: 'Élève Exemple 1' },
            { id: 'default-2', name: 'Élève Exemple 2' }
          ];
        }
      }

      const data = {
        ...evaluation,
        status,
        spaceId,
        updatedAt: serverTimestamp(),
        createdAt: evaluation.createdAt || serverTimestamp(),
        students
      };

      if (editId) {
        await setDoc(doc(db, 'success_evaluations', editId), data);
      } else {
        const docRef = await addDoc(collection(db, 'success_evaluations'), data);
        if (status === 'published') {
          navigate(`/success/${spaceId}/eval/${docRef.id}`);
        } else {
          // If draft, stay and offer to edit
          navigate(`/success/${spaceId}/create?edit=${docRef.id}`);
          triggerToast("Brouillon sauvegardé");
        }
        return;
      }

      triggerToast(status === 'published' ? "Évaluation publiée !" : "Brouillon mis à jour");
      if (status === 'published') {
        setTimeout(() => navigate(`/success/${spaceId}/eval/${editId}`), 1000);
      }
    } catch (error) {
      console.error("Error saving evaluation:", error);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-brand-text/20 uppercase tracking-widest">Chargement...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg relative overflow-hidden text-brand-text pb-32 md:pb-0">
      {/* Background Decor */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-brand-teal/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 -left-20 w-96 h-96 bg-brand-coral/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="shrink-0 sticky top-0 z-[60] border-b border-white/50 p-4 px-8 flex justify-between items-center shadow-soft bg-white/40 backdrop-blur-md">
        <button onClick={() => navigate(`/success/${spaceId}`)} className="flex items-center gap-2 transition-colors font-bold text-brand-text/50 hover:text-brand-text">
          <ArrowLeft size={20} /> Annuler
        </button>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-5 py-2.5 bg-white/50 border border-white hover:bg-white text-brand-text/60 rounded-2xl font-black shadow-sm transition-all text-sm uppercase tracking-wider flex items-center gap-2"
          >
            <Clock size={18} /> Sauvegarder
          </button>
          <button 
            onClick={() => handleSave('published')}
            disabled={saving}
            className="bg-brand-coral text-white px-5 py-2.5 rounded-2xl font-black shadow-lg flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all text-sm uppercase tracking-wider"
          >
            {saving ? <Plus size={18} className="animate-spin" /> : <Save size={18} />}
            {editId ? "Mettre à jour" : "Créer l'évaluation"}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-12 relative z-10 w-full max-w-5xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
            {editId ? "Modifier l'évaluation" : "Nouvelle évaluation"}
          </h1>
          <p className="text-brand-text/50 font-medium">Définissez les exercices, les compétences et le barème.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Metadata Section */}
          <section className="md:col-span-2 space-y-6">
            <div className="bg-white/60 border border-white p-8 rounded-[40px] shadow-soft space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-brand-text/40 mb-3 ml-2">Nom de l'évaluation</label>
                <input 
                  type="text" 
                  className="w-full bg-brand-bg/50 border border-white/50 rounded-2xl p-4 text-xl font-black text-brand-text outline-none focus:ring-2 ring-brand-coral/20 placeholder:text-brand-text/20 transition-all shadow-inner"
                  placeholder="Ex: Évaluation de Conjugaison"
                  value={evaluation.name}
                  onChange={e => setEvaluation({...evaluation, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-brand-text/40 mb-3 ml-2">Matière</label>
                  <div className="flex gap-3">
                    {['Français', 'Mathématiques'].map(sub => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setEvaluation({...evaluation, subject: sub})}
                        className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 font-black uppercase text-[10px] tracking-widest ${
                          evaluation.subject === sub 
                          ? 'bg-white border-brand-teal text-brand-teal shadow-lg' 
                          : 'bg-brand-bg/30 border-white/50 text-brand-text/40 opacity-60'
                        }`}
                      >
                        {SUBJECT_ICONS[sub]}
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-brand-text/40 mb-3 ml-2">Classe</label>
                  <select 
                    className="w-full bg-brand-bg/50 border border-white/50 rounded-2xl p-4 font-black text-brand-text outline-none focus:ring-2 ring-brand-teal/20 shadow-inner"
                    value={evaluation.selectedClassId}
                    onChange={e => setEvaluation({...evaluation, selectedClassId: e.target.value})}
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Exercises List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-brand-text/60">Liste des exercices ({evaluation.exercises.length})</h3>
                <button 
                  onClick={addExercise}
                  className="p-2.5 bg-brand-teal text-white rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                  <Plus size={20} />
                </button>
              </div>

              <AnimatePresence mode="popLayout">
                {evaluation.exercises.map((ex, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white/70 border border-white p-6 rounded-[32px] shadow-soft group"
                  >
                    <div className="flex gap-6">
                      <div className="w-10 h-10 shrink-0 rounded-2xl bg-brand-text/5 flex items-center justify-center text-xs font-black text-brand-text/30 border border-brand-text/5">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-3">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-brand-text/40 mb-2 ml-2">Nom de l'exercice</label>
                            <input 
                              type="text"
                              value={ex.name}
                              onChange={e => {
                                const newExs = [...evaluation.exercises];
                                newExs[idx].name = e.target.value;
                                setEvaluation({...evaluation, exercises: newExs});
                              }}
                              className="w-full bg-brand-bg/30 border border-white/50 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:bg-white focus:ring-2 ring-brand-teal/10 transition-all"
                              placeholder="Ex: Dictée de mots"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-brand-text/40 mb-2 ml-2">Barème</label>
                            <div className="relative">
                              <input 
                                type="number"
                                value={ex.points}
                                onChange={e => {
                                  const newExs = [...evaluation.exercises];
                                  newExs[idx].points = parseInt(e.target.value) || 0;
                                  setEvaluation({...evaluation, exercises: newExs});
                                }}
                                className="w-full bg-brand-bg/30 border border-white/50 rounded-xl px-4 py-2.5 text-sm font-black text-center outline-none focus:bg-white focus:ring-2 ring-brand-teal/10 transition-all"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand-text/20">pts</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-brand-text/40 mb-2 ml-2">Compétence</label>
                          <textarea 
                            value={ex.competence}
                            onChange={e => {
                              const newExs = [...evaluation.exercises];
                              newExs[idx].competence = e.target.value;
                              setEvaluation({...evaluation, exercises: newExs});
                            }}
                            className="w-full bg-brand-bg/30 border border-white/50 rounded-xl px-4 py-2.5 text-sm font-medium outline-none h-16 resize-none focus:bg-white focus:ring-2 ring-brand-teal/10 transition-all"
                            placeholder="Décrivez la compétence évaluée..."
                          />
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => removeExercise(idx)}
                        disabled={evaluation.exercises.length <= 1}
                        className="p-2 h-fit text-brand-coral/20 hover:text-brand-coral hover:bg-brand-coral/10 rounded-xl transition-all disabled:hidden"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <button 
                onClick={addExercise}
                className="w-full py-6 border-2 border-dashed border-brand-text/10 rounded-[32px] text-brand-text/30 font-black uppercase tracking-widest text-xs hover:border-brand-teal/40 hover:text-brand-teal/60 hover:bg-brand-teal/5 transition-all flex items-center justify-center gap-3"
              >
                <Plus size={18} /> Ajouter un exercice
              </button>
            </div>
          </section>

          {/* Sidebar / Tips */}
          <aside className="space-y-6">
            <div className="bg-brand-teal text-white p-8 rounded-[40px] shadow-lg sticky top-28">
              <GraduationCap className="w-10 h-10 mb-6 opacity-40 shadow-xl" />
              <h4 className="text-xl font-black uppercase tracking-tight mb-4 leading-tight">Quelques conseils</h4>
              <ul className="space-y-4 text-xs font-bold leading-relaxed opacity-80">
                <li className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">1</span>
                  Soyez précis dans l'intitulé des exercices pour faciliter la lecture.
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">2</span>
                  Le barème sera automatiquement utilisé pour calculer les pourcentages de réussite.
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">3</span>
                  Vous pouvez sauvegarder en brouillon et revenir plus tard si l'évaluation n'est pas finie.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      {/* Floating Notifications */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border backdrop-blur-md ${
              showToast.type === 'success' ? 'bg-brand-teal text-white border-white/20' : 'bg-white text-brand-text border-brand-teal/20'
            }`}
          >
            {showToast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} className="text-brand-teal" />}
            <span className="text-sm font-black uppercase tracking-wider">{showToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
