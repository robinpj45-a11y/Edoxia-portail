import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, CheckCircle, ArrowLeft } from 'lucide-react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

export default function DashboardQVGDC() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);

  const [newQ, setNewQ] = useState({
    question: "",
    options: ["", "", "", ""],
    correct: 0,
    type: 'mcq'
  });

  useEffect(() => {
    const q = query(collection(db, "qvgdc_questions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newQ.question || (newQ.type === 'mcq' && newQ.options.some(o => !o))) return alert("Remplissez tout !");
    
    try {
      const { type, question, options, correct } = newQ;
      const questionData = {
        type,
        question,
        createdAt: new Date(),
        ...(type === 'mcq' && { options, correct })
      };
      await addDoc(collection(db, "qvgdc_questions"), {
        ...questionData
      });
      setNewQ({ question: "", options: ["", "", "", ""], correct: 0, type: 'mcq' });
    } catch (error) {
      console.error("Erreur ajout question:", error);
      alert("Erreur lors de la sauvegarde.");
    }
  };

  const updateOption = (idx, val) => {
    const newOpts = [...newQ.options];
    newOpts[idx] = val;
    setNewQ({ ...newQ, options: newOpts });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cette question ?")) {
      await deleteDoc(doc(db, "qvgdc_questions", id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 border-b border-slate-800 pb-6 flex justify-between items-center">
          <div>
            <button onClick={() => navigate('/GVGDC')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4">
                <ArrowLeft size={18} /> Retour au Jeu
            </button>
            <h1 className="text-3xl font-bold text-white mb-2">DASHBOARD QVGDC</h1>
            <p className="text-slate-500 text-sm">Administration du Quiz "Qui Veut Gagner Des Cahiers"</p>
          </div>
          <div className="bg-slate-900 px-4 py-2 border border-slate-700 rounded text-xs">
            ADMIN MODE
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* FORMULAIRE */}
          <div className="bg-slate-900 p-6 border-2 border-slate-800 shadow-xl">
            <h2 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2">
              <Plus size={20} /> AJOUTER UNE QUESTION
            </h2>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-slate-500 mb-1">Type de Question</label>
                <div className="flex gap-2 p-1 bg-black/20 rounded-lg border border-slate-700">
                    <button type="button" onClick={() => setNewQ({...newQ, type: 'mcq'})} className={`flex-1 py-1 text-xs font-bold rounded ${newQ.type === 'mcq' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>QCM</button>
                    <button type="button" onClick={() => setNewQ({...newQ, type: 'oral'})} className={`flex-1 py-1 text-xs font-bold rounded ${newQ.type === 'oral' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>Choix Oral</button>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase text-slate-500 mb-1">Intitulé</label>
                <textarea 
                  value={newQ.question}
                  onChange={e => setNewQ({...newQ, question: e.target.value})}
                  className="w-full bg-black border border-slate-700 p-3 text-white focus:border-green-500 outline-none h-24 resize-none"
                  placeholder="Quelle est la question ?"
                  required
                />
              </div>

              {newQ.type === 'mcq' && (
                <div className="space-y-2">
                  <label className="block text-xs uppercase text-slate-500 mb-1">Réponses (Cochez la bonne)</label>
                  {newQ.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="correct" 
                        checked={newQ.correct === idx}
                        onChange={() => setNewQ({...newQ, correct: idx})}
                        className="accent-green-500 w-4 h-4 cursor-pointer"
                      />
                      <input 
                        value={opt}
                        onChange={e => updateOption(idx, e.target.value)}
                        className={`flex-1 bg-black border p-2 text-sm outline-none transition-colors ${newQ.correct === idx ? 'border-green-500 text-green-400' : 'border-slate-700 text-slate-300'}`}
                        placeholder={`Option ${['A','B','C','D'][idx]}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              <button type="submit" className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-3 mt-4 border-b-4 border-green-900 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2">
                <Save size={18} /> ENREGISTRER
              </button>
            </form>
          </div>

          {/* LISTE */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
              <CheckCircle size={20} /> BANQUE DE QUESTIONS ({questions.length})
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {questions.map((q, i) => (
                <div key={q.id} className="bg-slate-900 border border-slate-800 p-4 relative group hover:border-slate-600 transition-colors">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDelete(q.id)} className="text-red-500 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="text-xs text-slate-500 mb-1">
                    <span className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-bold uppercase">{q.type || 'QCM'}</span>
                  </div>
                  <div className="font-bold text-white mb-2">{q.question}</div>
                  {q.type !== 'oral' && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {(q.options || []).map((opt, idx) => (
                        <div key={idx} className={`p-1 px-2 ${idx === q.correct ? 'bg-green-900/30 text-green-400 border border-green-900' : 'text-slate-500'}`}>
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
