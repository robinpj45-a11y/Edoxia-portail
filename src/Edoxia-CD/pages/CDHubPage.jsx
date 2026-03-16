import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BedDouble, ArrowLeft, Upload, Plus, X, Users } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

export default function CDHubPage() {
  const navigate = useNavigate();
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [importing, setImporting] = React.useState(false);

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const formatExcelDate = (val) => {
          if (!val) return '';
          if (val instanceof Date) {
            return val.toLocaleDateString('fr-FR');
          }
          if (typeof val === 'number') {
            // Excel serial date to JS Date
            // 25569 is the difference in days between 1970-01-01 and 1899-12-30
            const date = new Date((val - 25569) * 86400 * 1000);
            return date.toLocaleDateString('fr-FR');
          }
          return String(val);
        };

        for (const row of data) {
          // Normalizing keys to handle potential whitespace or small differences
          const getVal = (possibleKeys) => {
            const key = possibleKeys.find(k => row.hasOwnProperty(k));
            return key ? row[key] : '';
          };

          await addDoc(collection(db, 'cd_students'), {
            lastName: getVal(['nom_élève', 'Nom', 'nom']),
            firstName: getVal(['prénom_élève', 'Prénom', 'prenom']),
            birthDate: formatExcelDate(getVal(['date_naissance', 'Date de naissance', 'date'])),
            className: getVal(['Classe_élève', 'Classe']),
            resp1: {
              lastName: getVal(['nom_responsable']),
              firstName: getVal(['prénom_responsable']),
              phone: getVal(['portable_responsable']),
              email: getVal(['email_responsable'])
            },
            resp2: {
              lastName: getVal(['nom_coresp']),
              firstName: getVal(['prénom_coresp']),
              phone: getVal(['portable_coresp']),
              email: getVal(['email_coresp'])
            },
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

  return (
    <div className="flex flex-col h-screen">
      <header className="shrink-0 sticky top-0 z-[60] border-b border-white/50 p-4 px-8 flex justify-between items-center shadow-soft bg-white/40 backdrop-blur-md">
        <button onClick={() => navigate('/qol')} className="flex items-center gap-2 transition-colors font-bold text-brand-text/50 hover:text-brand-text"><ArrowLeft size={20} /> Retour QoL</button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowImportModal(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/50 border border-white rounded-2xl font-black text-xs uppercase tracking-widest text-brand-text/60 hover:bg-white transition-all shadow-sm"
          >
            <Upload size={16} /> Importer Élèves
          </button>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2 text-brand-text">Classe Découverte 2026</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-brand-bg relative">
        {/* Cercles décoratifs */}
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-brand-coral/10 rounded-full blur-3xl pointer-events-none z-0"></div>
        <div className="absolute bottom-0 -left-20 w-80 h-80 bg-brand-teal/10 rounded-full blur-3xl pointer-events-none z-0"></div>

        <div className="max-w-4xl w-full mx-auto p-6 py-12 xl:py-20 relative z-10">
          <h2 className="text-3xl font-black text-brand-text mb-8 text-center drop-shadow-sm">Centre Opérationnel</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* BOUTON 1 - RECHERCHE / FICHE URGENCE */}
            <div
              onClick={() => navigate('/cd/search')}
              className="bg-brand-coral rounded-[30px] p-8 flex flex-col items-center gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-transform cursor-pointer relative overflow-hidden group border border-white/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
              <div className="p-5 bg-black/10 rounded-full shrink-0 group-hover:scale-110 transition-transform">
                <Search className="w-12 h-12 text-white" />
              </div>
              <div className="text-center z-10">
                <div className="text-sm font-bold uppercase tracking-widest text-white/70 mb-2">Informations utiles</div>
                <div className="text-2xl font-black text-white leading-tight drop-shadow-md">Recherche d'élève <br />(Fiche de contact)</div>
              </div>
            </div>

            {/* BOUTON 2 - GESTION DES CHAMBRES */}
            <div
              onClick={() => navigate('/cd/rooms')}
              className="bg-brand-teal rounded-[30px] p-8 flex flex-col items-center gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-transform cursor-pointer relative overflow-hidden group border border-white/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
              <div className="p-5 bg-black/10 rounded-full shrink-0 group-hover:scale-110 transition-transform">
                <BedDouble className="w-12 h-12 text-white" />
              </div>
              <div className="text-center z-10">
                <div className="text-sm font-bold uppercase tracking-widest text-white/70 mb-2">Répartition</div>
                <div className="text-2xl font-black text-white leading-tight drop-shadow-md">Gestion des<br />chambres</div>
              </div>
            </div>

            {/* BOUTON 3 - CRÉATION DE GROUPE */}
            <div
              onClick={() => navigate('/cd/groups')}
              className="bg-brand-teal rounded-[30px] p-8 flex flex-col items-center gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-transform cursor-pointer relative overflow-hidden group border border-white/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
              <div className="p-5 bg-black/10 rounded-full shrink-0 group-hover:scale-110 transition-transform">
                <Users className="w-12 h-12 text-white" />
              </div>
              <div className="text-center z-10">
                <div className="text-sm font-bold uppercase tracking-widest text-white/70 mb-2">Organisation</div>
                <div className="text-2xl font-black text-white leading-tight drop-shadow-md">Création de<br />groupe</div>
              </div>
            </div>




          </div>
        </div>
      </main>

      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !importing && setShowImportModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white border border-white p-8 rounded-[40px] shadow-2xl w-full max-w-md relative z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-brand-text uppercase tracking-tighter flex items-center gap-3">
                  <Upload className="text-brand-coral" /> Importer les élèves
                </h2>
                <button onClick={() => setShowImportModal(false)} className="text-brand-text/20 hover:text-brand-coral">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-8 border-2 border-dashed border-brand-text/10 rounded-3xl text-center bg-brand-bg/30">
                  <p className="text-xs font-bold text-brand-text/40 mb-6 leading-relaxed">
                    Colonnes attendues :<br />
                    <span className="text-brand-text/60 italic font-medium">nom_élève, prénom_élève, date_naissance, Classe_élève, nom_responsable, prénom_responsable, portable_responsable, email_responsable, nom_coresp, prénom_coresp, portable_coresp, email_coresp</span>
                  </p>

                  {importing ? (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-black uppercase tracking-widest text-brand-teal">Importation en cours...</span>
                    </div>
                  ) : (
                    <label className="bg-brand-coral text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer hover:brightness-110 shadow-lg inline-block text-center w-full transition-all active:scale-95">
                      Sélectionner le fichier Excel
                      <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} />
                    </label>
                  )}
                </div>

                <div className="text-[10px] font-bold text-brand-text/30 text-center uppercase tracking-widest">
                  Fichiers supportés : .xlsx, .xls
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
