import React, { useState, useRef } from 'react';
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, Upload, User as UserIcon, Phone, Mail, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { writeBatch, doc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

export default function StudentSearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [students, setStudents] = useState([]);

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, "student_directory"), (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { raw: false });
          
          if(data.length === 0) {
             alert("Le fichier est vide.");
             setIsImporting(false);
             return;
          }

          const batch = writeBatch(db);
          const studentsRef = collection(db, 'student_directory');

          data.forEach((row) => {
             const newDocRef = doc(studentsRef);
             const firstName = String(row['prénom_élève'] || '').trim();
             const lastName = String(row['nom_élève'] || '').trim();
             let fullName = '';
             if(firstName && lastName) fullName = `${firstName} ${lastName}`;
             else if(firstName) fullName = firstName;
             else fullName = lastName;

             batch.set(newDocRef, {
               lastName: lastName,
               firstName: firstName,
               name: fullName,
               importedClassLabel: String(row['Classe_élève'] || '').trim(),
               dateOfBirth: String(row['date_naissance'] || '').trim(),
               parent1Name: String(row['nom_responsable'] || '').trim(),
               parent1FirstName: String(row['prénom_responsable'] || '').trim(),
               parent1Phone: String(row['portable_responsable'] || '').trim(),
               parent1Email: String(row['email_responsable'] || '').trim(),
               parent2Name: String(row['nom_coresp'] || '').trim(),
               parent2FirstName: String(row['prénom_coresp'] || '').trim(),
               parent2Phone: String(row['portable_coresp'] || '').trim(),
               parent2Email: String(row['email_coresp'] || '')
             });
          });

          await batch.commit();
          alert(`${data.length} élèves importés avec succès !`);
        } catch (error) {
          console.error("Erreur lors de l'import :", error);
          alert("Erreur lors de l'import des données. Vérifiez le format de votre fichier Excel.");
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsBinaryString(file);
    } catch(err) {
      console.error(err);
      setIsImporting(false);
    }
  };

  const removeAccents = (str) => {
    return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
  };

  const filteredStudents = searchTerm.trim() === '' ? [] : students.filter(student => {
    const searchLow = removeAccents(searchTerm.toLowerCase());
    const sName = removeAccents(student.name ? student.name.toLowerCase() : '');
    const sLastName = removeAccents(student.lastName ? student.lastName.toLowerCase() : '');
    const sFirstName = removeAccents(student.firstName ? student.firstName.toLowerCase() : '');
    
    return sName.includes(searchLow) || sLastName.includes(searchLow) || sFirstName.includes(searchLow);
  });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-brand-bg text-brand-text transition-colors duration-300">
      <header className="p-4 px-6 rounded-b-[30px] flex justify-between items-center shadow-soft bg-white/40 backdrop-blur-md border-b border-white/50 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => {
            if (location.state?.from === 'stpbb') {
              navigate('/stpbb');
            } else if (location.state?.fromTeamId) {
              navigate('/JS2026/teams', { state: { fromTeamId: location.state.fromTeamId } });
            } else {
              navigate('/JS2026');
            }
          }} className="p-2 rounded-full transition-all bg-white/50 hover:bg-white text-brand-text/50 hover:text-brand-text shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black tracking-tight text-brand-text">Recherche d'élèves</h1>
        </div>

      </header>

      <main className="p-6 max-w-5xl w-full mx-auto flex-1 flex flex-col pt-8 pb-10 space-y-6">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/40" />
          <input 
            type="text" 
            placeholder="Rechercher par nom ou prénom..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-[20px] shadow-sm border border-white/50 bg-white/80 backdrop-blur-sm text-brand-text font-medium outline-none focus:border-brand-teal transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStudents.length > 0 ? (
            filteredStudents.map(student => (
              <div key={student.id} className="bg-white/60 backdrop-blur-sm border border-white/50 p-4 rounded-[24px] shadow-sm flex flex-col gap-2 hover:shadow-md hover:bg-white transition-all">
                <div className="flex justify-between items-start">
                  <div className="font-black text-lg text-brand-text flex items-center gap-2">
                    <UserIcon size={18} className="text-brand-teal" />
                    {student.firstName || ''} <span className="uppercase">{student.lastName || ''}</span>
                  </div>
                  <div className="text-xs font-bold bg-brand-teal/20 text-brand-teal px-2 py-1 rounded-full uppercase">
                    {student.importedClassLabel || student.classLabel || 'N/A'}
                  </div>
                </div>
                
                {student.dateOfBirth && (
                  <div className="text-sm font-medium text-brand-text/60 flex items-center gap-2">
                    <Calendar size={14} /> Né(e) le : {
                      /^\d+$/.test(student.dateOfBirth) 
                        ? new Date((parseInt(student.dateOfBirth) - 25569) * 86400 * 1000).toLocaleDateString("fr-FR") 
                        : student.dateOfBirth
                    }
                  </div>
                )}
                
                {((student.parent1Name && student.parent1Name !== 'undefined') || (student.parent2Name && student.parent2Name !== 'undefined')) && (
                   <div className="mt-2 pt-2 border-t border-brand-text/10">
                     <div className="text-xs font-bold text-brand-text/40 uppercase mb-2">Responsables légaux</div>
                     <div className="space-y-2">
                       {student.parent1Name && student.parent1Name !== 'undefined' && (
                         <div className="text-sm">
                           <span className="font-semibold">{student.parent1FirstName} {student.parent1Name}</span>
                           {student.parent1Phone && <a href={`tel:${student.parent1Phone}`} className="flex items-center gap-2 text-brand-text/70 mt-1 hover:text-brand-teal transition-colors"><Phone size={12}/> {student.parent1Phone}</a>}
                           {student.parent1Email && <a href={`mailto:${student.parent1Email}`} className="flex items-center gap-2 text-brand-text/70 hover:text-brand-teal transition-colors"><Mail size={12}/> {student.parent1Email}</a>}
                         </div>
                       )}
                       {student.parent2Name && student.parent2Name !== 'undefined' && (
                         <div className="text-sm border-t border-brand-text/5 pt-2">
                           <span className="font-semibold">{student.parent2FirstName} {student.parent2Name}</span>
                           {student.parent2Phone && <a href={`tel:${student.parent2Phone}`} className="flex items-center gap-2 text-brand-text/70 mt-1 hover:text-brand-teal transition-colors"><Phone size={12}/> {student.parent2Phone}</a>}
                           {student.parent2Email && <a href={`mailto:${student.parent2Email}`} className="flex items-center gap-2 text-brand-text/70 hover:text-brand-teal transition-colors"><Mail size={12}/> {student.parent2Email}</a>}
                         </div>
                       )}
                     </div>
                   </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 text-center text-brand-text/50 font-medium py-10">
              {searchTerm.trim() === '' ? "Tapez un nom ou prénom pour rechercher." : "Aucun élève trouvé."}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
