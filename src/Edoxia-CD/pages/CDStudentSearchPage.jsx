import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, ArrowLeft, Phone, Mail, User, Calendar, GraduationCap, X, MapPin, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CDStudentSearchPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'cd_students'), orderBy('lastName', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredStudents = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return [];
    return students.filter(s => 
      s.firstName?.toLowerCase().includes(term) || 
      s.lastName?.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  const ContactInfo = ({ title, person, icon: Icon }) => {
    if (!person || (!person.lastName && !person.phone)) return null;
    return (
      <div className="bg-white/60 border border-white p-6 rounded-[32px] shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-brand-coral/10 rounded-xl">
            <Icon className="text-brand-coral w-5 h-5" />
          </div>
          <h3 className="font-black text-brand-text/40 uppercase tracking-widest text-xs">{title}</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center text-brand-text/30">
               <User size={16} />
            </div>
            <span className="font-black text-brand-text">{person.firstName} {person.lastName}</span>
          </div>
          {person.phone && (
            <a href={`tel:${person.phone}`} className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal group-hover:bg-brand-teal group-hover:text-white transition-all">
                 <Phone size={14} />
              </div>
              <span className="font-bold text-brand-text/60 group-hover:text-brand-teal transition-colors">{person.phone}</span>
            </a>
          )}
          {person.email && (
            <a href={`mailto:${person.email}`} className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                 <Mail size={14} />
              </div>
              <span className="font-bold text-brand-text/60 group-hover:text-indigo-500 transition-colors truncate">{person.email}</span>
            </a>
          )}
        </div>
      </div>
    );
  };

  const formatDOB = (val) => {
    if (!val) return '';
    if (typeof val === 'number') {
      // 25569 is the difference in days between 1970-01-01 and 1899-12-30
      const date = new Date((val - 25569) * 86400 * 1000);
      return date.toLocaleDateString('fr-FR');
    }
    return String(val);
  };

  return (
    <div className="flex flex-col h-screen bg-brand-bg text-brand-text overflow-hidden">
      <header className="shrink-0 sticky top-0 z-[60] border-b border-white/50 p-4 px-8 flex justify-between items-center shadow-soft bg-white/40 backdrop-blur-md">
        <button onClick={() => navigate('/cd')} className="flex items-center gap-2 transition-colors font-bold text-brand-text/50 hover:text-brand-text">
          <ArrowLeft size={20} /> Retour CD
        </button>
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2 text-brand-text">
          <Search size={24} className="text-brand-coral" /> Fiches Urgence
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-10 relative">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="text-brand-text/20 group-focus-within:text-brand-coral transition-colors" />
            </div>
            <input 
              type="text"
              placeholder="Rechercher un élève (Nom ou Prénom)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/80 border-2 border-white rounded-[32px] p-6 pl-16 text-lg font-bold shadow-soft focus:outline-none focus:ring-4 ring-brand-coral/5 transition-all text-brand-text placeholder:text-brand-text/20"
              autoFocus
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-6 flex items-center text-brand-text/20 hover:text-brand-coral transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {searchTerm && filteredStudents.length === 0 && !loading && (
              <p className="text-center py-10 font-bold text-brand-text/30 italic">Aucun élève trouvé pour "{searchTerm}"</p>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredStudents.map(s => (
                <motion.div
                  key={s.id}
                  layoutId={s.id}
                  onClick={() => setSelectedStudent(s)}
                  className="bg-white/60 border border-white p-6 rounded-[32px] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex justify-between items-center group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-bg rounded-2xl flex items-center justify-center text-brand-text/20 group-hover:bg-brand-coral/10 group-hover:text-brand-coral transition-colors">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-lg">{s.firstName} {s.lastName}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-text/30">{s.className}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Student Detail Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setSelectedStudent(null)}
               className="absolute inset-0 bg-brand-bg/95"
            />
            <motion.div 
              layoutId={selectedStudent.id}
              className="bg-white/90 border border-white p-6 md:p-10 rounded-[48px] shadow-2xl w-full max-w-2xl relative z-10 max-h-[90vh] overflow-y-auto scrollbar-none"
            >
              <button 
                onClick={() => setSelectedStudent(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-brand-bg text-brand-text/30 hover:text-brand-coral transition-all"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
                <div className="w-32 h-32 bg-brand-coral/10 rounded-[40px] flex items-center justify-center text-brand-coral">
                   <User size={64} />
                </div>
                <div className="text-center md:text-left pt-2">
                  <h2 className="text-4xl font-black tracking-tighter text-brand-text leading-none mb-4">{selectedStudent.firstName}<br/>{selectedStudent.lastName}</h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-brand-bg rounded-full text-[10px] font-black uppercase tracking-widest text-brand-text/50">
                       <Calendar size={12} className="text-brand-coral" /> {formatDOB(selectedStudent.birthDate)}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-brand-bg rounded-full text-[10px] font-black uppercase tracking-widest text-brand-text/50">
                       <GraduationCap size={12} className="text-brand-teal" /> {selectedStudent.className}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ContactInfo title="Responsable 1" person={selectedStudent.resp1} icon={ShieldAlert} />
                <ContactInfo title="Co-Responsable" person={selectedStudent.resp2} icon={MapPin} />
              </div>
              
              <div className="mt-10 p-6 bg-brand-coral/5 border border-brand-coral/10 rounded-[32px] text-center">
                 <p className="text-[10px] font-black uppercase tracking-widest text-brand-coral/40">Fiche d'urgence dématérialisée</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
