import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Lock, Plus, GraduationCap, ChevronRight, FileText, Calendar, BookOpen, Calculator, BarChart3, Upload, Trash2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SuccessMobileNav from '../components/SuccessMobileNav';
import * as XLSX from 'xlsx';

const SUBJECT_ICONS = {
  'Français': <BookOpen size={16} className="text-brand-coral" />,
  'Mathématiques': <Calculator size={16} className="text-brand-teal" />
};

export default function SuccessSpacePage() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem(`success_auth_${spaceId}`) === 'true';
  });
  const [password, setPassword] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Class & Student states
  const [classes, setClasses] = useState([]);
  const [importTargetClassId, setImportTargetClassId] = useState('');
  const [importing, setImporting] = useState(false);

  // Form states for new evaluation
  const [newEval, setNewEval] = useState({ name: '', subject: 'Français', selectedClassId: '', exercises: [{ name: '', competence: '', points: 10 }] });

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch evaluations
      const qEvals = query(collection(db, 'success_evaluations'), where('spaceId', '==', spaceId));
      const unsubscribeEvals = onSnapshot(qEvals, (snapshot) => {
        const evals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        evals.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setEvaluations(evals);
        setLoading(false);
      }, (error) => {
        console.error("Firestore Error (Evals):", error);
        setLoading(false);
      });

      // Fetch classes
      const qClasses = query(collection(db, 'success_classes'), where('spaceId', '==', spaceId));
      const unsubscribeClasses = onSnapshot(qClasses, async (snapshot) => {
        const cls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (cls.length === 0) {
          try {
            const defaultName = spaceId === 'demo' ? 'Classe de Démo' : (spaceId === 'celia' ? 'CM2 - Célia NGUEMA' : `Classe de ${spaceId}`);
            const defaultCls = await addDoc(collection(db, 'success_classes'), {
              name: defaultName,
              spaceId,
              createdAt: serverTimestamp()
            });

            // If demo space, pre-populate 10 fictional students
            if (spaceId === 'demo') {
              const demoStudents = [
                { firstName: 'Jean', lastName: 'Dupont' },
                { firstName: 'Marie', lastName: 'Curie' },
                { firstName: 'Lucas', lastName: 'Martin' },
                { firstName: 'Emma', lastName: 'Bernard' },
                { firstName: 'Thomas', lastName: 'Petit' },
                { firstName: 'Chloé', lastName: 'Robert' },
                { firstName: 'Hugo', lastName: 'Richard' },
                { firstName: 'Léa', lastName: 'Durand' },
                { firstName: 'Nathan', lastName: 'Lefebvre' },
                { firstName: 'Zoé', lastName: 'Moreau' }
              ];
              for (const s of demoStudents) {
                await addDoc(collection(db, 'success_students'), {
                  ...s,
                  classId: defaultCls.id,
                  spaceId,
                  birthDate: '',
                  createdAt: serverTimestamp()
                });
              }
            }

            const createdCls = { id: defaultCls.id, name: defaultName };
            setClasses([createdCls]);
            setNewEval(prev => ({ ...prev, selectedClassId: defaultCls.id }));
            setImportTargetClassId(defaultCls.id);
          } catch (e) {
            console.error("Error creating default class:", e);
          }
        } else {
          setClasses(cls);
          setNewEval(prev => ({ ...prev, selectedClassId: cls[0].id }));
          setImportTargetClassId(cls[0].id);
        }
      });

      return () => {
        unsubscribeEvals();
        unsubscribeClasses();
      };
    }
  }, [isAuthenticated, spaceId]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normalize(password) === normalize(spaceId)) {
      sessionStorage.setItem(`success_auth_${spaceId}`, 'true');
      setIsAuthenticated(true);
    } else {
      alert(`Mot de passe incorrect. Astuce: le mot de passe est le nom de l'espace (ex: ${spaceId}).`);
    }
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        for (const row of data) {
          await addDoc(collection(db, 'success_students'), {
            lastName: row['nom_élève'] || row['Nom'] || '',
            firstName: row['prénom_élève'] || row['Prénom'] || '',
            birthDate: row['date_naissance'] || '',
            classId: importTargetClassId,
            spaceId,
            createdAt: serverTimestamp()
          });
        }

        setImporting(false);
        setShowImportModal(false);
        alert(`${data.length} élèves importés avec succès !`);
      } catch (err) {
        console.error("Excel Import Error:", err);
        alert("Erreur lors de l'import Excel. Vérifiez le format du fichier.");
        setImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-screen bg-brand-bg items-center justify-center p-6 text-brand-text">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/60 border border-white backdrop-blur-md p-10 rounded-[40px] shadow-soft w-full max-w-md text-center"
        >
          <div className="w-20 h-20 bg-brand-teal/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock size={40} className="text-brand-teal" />
          </div>
          <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Espace Protégé</h2>
          <p className="text-brand-text/60 font-medium mb-8">Veuillez entrer le mot de passe pour {spaceId}</p>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input 
              type="password" 
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/40 border border-white/50 rounded-2xl p-4 text-brand-text focus:ring-2 ring-brand-teal/20 outline-none text-center font-bold placeholder:text-brand-text/30 shadow-inner transition-all"
              autoFocus
            />
            <button type="submit" className="w-full bg-brand-teal text-white font-black py-4 rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest">
              Déverrouiller
            </button>
            <button type="button" onClick={() => navigate('/success')} className="text-sm font-bold text-brand-text/40 hover:text-brand-coral uppercase tracking-widest mt-4">
              Retour au Hub
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-brand-bg relative overflow-hidden text-brand-text pb-24 md:pb-0">
       <div className="absolute top-1/4 -right-20 w-80 h-80 bg-brand-teal/10 rounded-full blur-3xl pointer-events-none z-0"></div>
       <div className="absolute bottom-0 -left-20 w-80 h-80 bg-brand-coral/10 rounded-full blur-3xl pointer-events-none z-0"></div>
       
       <SuccessMobileNav 
         mode="hub"
         onOpenCreate={() => navigate(`/success/${spaceId}/create`)} 
         onOpenImport={() => setShowImportModal(true)} 
       />

      <header className="shrink-0 sticky top-0 z-[60] border-b border-white/50 p-4 px-8 hidden md:flex justify-between items-center shadow-soft bg-white/40 backdrop-blur-md">
        <button onClick={() => navigate('/success')} className="flex items-center gap-2 transition-colors font-bold text-brand-text/50 hover:text-brand-text">
          <ArrowLeft size={20} /> Espace {spaceId}
        </button>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setShowImportModal(true)}
             className="px-5 py-2.5 bg-white/50 border border-white hover:bg-white text-brand-text/60 rounded-2xl font-black shadow-sm transition-all text-sm uppercase tracking-wider flex items-center gap-2"
           >
             <Upload size={18} /> Importer
           </button>
           <button 
             onClick={() => navigate(`/success/${spaceId}/reports`)}
             className="px-5 py-2.5 bg-white/50 border border-white hover:bg-white text-brand-teal rounded-2xl font-black shadow-sm transition-all text-sm uppercase tracking-wider flex items-center gap-2"
           >
             <BarChart3 size={18} /> Voir les résultats
           </button>
           <button 
             onClick={() => navigate(`/success/${spaceId}/create`)}
             className="bg-brand-coral text-white px-5 py-2.5 rounded-2xl font-black shadow-lg flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all text-sm uppercase tracking-wider"
           >
             <Plus size={18} /> Nouvelle évaluation
           </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 lg:px-16 relative z-10 w-full max-w-7xl mx-auto">
        <div className="mb-10">
          <h2 className="text-4xl font-black text-brand-text mb-2 drop-shadow-sm flex items-center gap-4">
             <GraduationCap className="text-brand-teal w-10 h-10" /> Tableau de bord
          </h2>
          <p className="text-brand-text/60 font-medium">Gérez vos évaluations et suivez les progrès de votre classe.</p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center opacity-20"><Plus className="animate-spin" size={40} /></div>
        ) : evaluations.length === 0 ? (
          <div className="bg-white/40 border border-white/50 rounded-[40px] p-20 text-center backdrop-blur-md">
            <div className="w-20 h-20 bg-brand-coral/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FileText size={40} className="text-brand-coral" />
            </div>
            <h3 className="text-2xl font-black text-brand-text mb-2">Aucune évaluation</h3>
            <p className="text-brand-text/60 font-medium mb-4 max-w-md mx-auto">Commencez par créer votre première évaluation pour suivre les résultats de vos élèves.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {evaluations.map((ev) => (
              <motion.div
                key={ev.id}
                whileHover={{ y: -5 }}
                onClick={() => navigate(`/success/${spaceId}/eval/${ev.id}`)}
                className="bg-white/70 border border-white p-6 rounded-[32px] shadow-soft cursor-pointer group transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-2 px-3 py-1 bg-brand-bg rounded-full text-[10px] font-black uppercase tracking-widest text-brand-text/60 border border-white/50">
                     {SUBJECT_ICONS[ev.subject]} {ev.subject}
                   </div>
                   <ChevronRight size={20} className="text-brand-text/20 group-hover:text-brand-teal transition-colors" />
                </div>
                <h3 className="text-xl font-black text-brand-text mb-2 line-clamp-1">{ev.name}</h3>
                <p className="text-xs text-brand-text/40 font-bold mb-4 line-clamp-1 italic">{ev.competence}</p>
                <div className="flex items-center gap-4 pt-4 border-t border-brand-text/5 text-[10px] font-black uppercase tracking-tighter text-brand-text/40">
                   <span className="flex items-center gap-1"><FileText size={12} /> {ev.exercises?.length || 0} exercices</span>
                   <span className="flex items-center gap-1"><Users size={12} /> {ev.students?.length || 0} élèves</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {/* Modal Création Évaluation */}

        {/* Modal Import Excel */}
        {showImportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => !importing && setShowImportModal(false)}
               className="absolute inset-0 bg-black/40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white border border-white p-8 rounded-[40px] shadow-2xl w-full max-w-md relative z-10"
            >
              <h2 className="text-2xl font-black mb-6 text-brand-text uppercase tracking-tighter flex items-center gap-3">
                <Upload className="text-brand-coral" /> Importer des élèves
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-brand-text/40 mb-2 ml-2">1. Choisir la classe de destination</label>
                  <select 
                    value={importTargetClassId}
                    onChange={e => setImportTargetClassId(e.target.value)}
                    className="w-full bg-brand-bg border border-white/50 rounded-2xl p-4 text-brand-text outline-none font-bold"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="p-6 border-2 border-dashed border-brand-text/10 rounded-3xl text-center bg-brand-bg/30">
                  <p className="text-xs font-bold text-brand-text/40 mb-4">Structure attendue :<br/>nom_élève / prénom_élève / date_naissance</p>
                  
                  {importing ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Plus className="animate-spin text-brand-teal" />
                      <span className="text-xs font-black uppercase tracking-widest text-brand-teal">Importation en cours...</span>
                    </div>
                  ) : (
                    <label className="bg-brand-teal text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer hover:brightness-110 shadow-lg inline-block text-center w-full">
                      Sélectionner le fichier Excel
                      <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} />
                    </label>
                  )}
                </div>

                <button 
                  onClick={() => setShowImportModal(false)}
                  disabled={importing}
                  className="w-full text-brand-text/30 font-black text-[10px] uppercase tracking-widest hover:text-brand-coral transition-colors"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
