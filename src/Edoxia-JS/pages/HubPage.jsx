import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Users, Search, Trophy, GraduationCap, Settings, ArrowLeft } from 'lucide-react';

export default function HubPage({ loading }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen font-sans bg-brand-bg text-brand-text transition-colors duration-300">
      <header className="p-4 px-6 rounded-b-[30px] flex justify-between items-center shadow-soft bg-white/40 backdrop-blur-md border-b border-white/50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-full transition-all bg-white/50 hover:bg-white text-brand-text/50 hover:text-brand-text shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div><h1 className="text-xl font-black tracking-tight text-brand-text">STPBB - Journée Sportive 2026</h1>
            <div className={`text-[10px] uppercase font-bold tracking-wide mt-1 inline-block px-2 py-0.5 rounded-md shadow-sm ${loading ? 'bg-orange-400 text-white' : 'bg-brand-teal/20 text-brand-teal'}`}>{loading ? 'Connexion...' : 'En ligne'}</div></div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/JS2026/teacher')} className="px-4 py-2 rounded-full flex items-center gap-2 transition-all shadow-soft bg-brand-teal hover:bg-brand-teal/90 text-white hover:scale-105 active:scale-95 font-bold"><GraduationCap size={18} /> <span className="hidden md:inline">Espace enseignant</span></button>
        </div>
      </header>
      <main className="p-6 max-w-5xl mx-auto h-[calc(100vh-80px)] flex flex-col justify-center">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <HubCard icon={<Map size={32} className="text-brand-teal" />} title="Carte Interactive" onClick={() => alert("Bientôt disponible !")} />
          <HubCard icon={<Users size={32} className="text-brand-peach" />} title="Voir les équipes" onClick={() => navigate('/JS2026/teams')} />
          <HubCard icon={<Search size={32} className="text-brand-coral" />} title="Rechercher un élève" onClick={() => alert("Fonction bientôt intégrée ici !")} />
          <HubCard icon={<Trophy size={32} className="text-yellow-500" />} title="Score en direct" onClick={() => alert("Bientôt disponible !")} />
          <HubCard icon={<Settings size={32} className="text-rose-500" />} title="Administration" onClick={() => navigate('/JS2026/admin')} />
        </div>
        <p className="text-center text-xs mt-8 font-bold uppercase tracking-widest text-brand-text/40">Sélectionnez une action</p>
      </main>
    </div>
  );
}

function HubCard({ icon, title, onClick }) {
  return (<button onClick={onClick} className="p-6 rounded-[30px] shadow-soft border border-white/50 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center gap-3 hover:shadow-md hover:bg-white transition-all active:scale-95 hover:scale-105 h-40"><div className="p-4 rounded-full bg-white shadow-inner mb-2">{icon}</div><span className="font-black tracking-tight text-center leading-tight text-brand-text">{title}</span></button>)
}
