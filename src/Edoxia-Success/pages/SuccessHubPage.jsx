import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GraduationCap, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';

const SPACES = [
  { id: 'celia', name: 'Célia', color: 'bg-brand-teal', icon: <GraduationCap className="w-12 h-12 text-white" /> },
  { id: 'demo', name: 'Démo', color: 'bg-brand-coral', icon: <LayoutGrid className="w-12 h-12 text-white" /> }
];

export default function SuccessHubPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-brand-bg relative overflow-hidden text-brand-text">
      {/* Cercles décoratifs */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-brand-teal/10 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-0 -left-20 w-80 h-80 bg-brand-coral/10 rounded-full blur-3xl pointer-events-none z-0"></div>

      <header className="shrink-0 sticky top-0 z-[60] border-b border-white/50 p-4 px-8 flex justify-between items-center shadow-soft bg-white/40 backdrop-blur-md">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 transition-colors font-bold text-brand-text/50 hover:text-brand-text">
          <ArrowLeft size={20} /> Retour Accueil
        </button>
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2 text-brand-text">
          <LayoutGrid size={24} className="text-brand-teal" /> Suivi Pédagogique
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto relative z-10 flex flex-col items-center justify-center p-6">
        <div className="max-w-4xl w-full text-center mb-12">
          <h2 className="text-4xl font-black text-brand-text mb-4 drop-shadow-sm">Calculateur de Réussite</h2>
          <p className="text-lg text-brand-text/60 font-medium whitespace-pre-line">
            Sélectionnez votre espace pour accéder à vos évaluations et rapports.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
          {SPACES.map((space) => (
            <motion.div
              key={space.id}
              whileHover={{ y: -10, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/success/${space.id}`)}
              className="bg-white/60 border border-white backdrop-blur-md p-8 rounded-[40px] shadow-soft flex flex-col items-center gap-6 cursor-pointer group transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]"
            >
              <div className={`p-6 ${space.color} rounded-3xl shadow-lg group-hover:rotate-6 transition-transform`}>
                {space.icon}
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-black text-brand-text leading-tight">{space.name}</h3>
                <p className="text-brand-text/50 font-bold text-sm mt-1 uppercase tracking-widest">Espace Enseignant</p>
              </div>
            </motion.div>
          ))}

          {/* Placeholders for future spaces */}
          <div className="border-2 border-dashed border-brand-text/10 rounded-[40px] p-8 flex flex-col items-center justify-center gap-4 opacity-40">
            <div className="w-20 h-20 bg-brand-text/5 rounded-3xl flex items-center justify-center">
              <span className="text-3xl font-black text-brand-text/20">+</span>
            </div>
            <p className="font-bold text-brand-text/30">Nouvel espace bientôt</p>
          </div>
        </div>
      </main>
    </div>
  );
}
