import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Map, Users, Search, Trophy, GraduationCap, Settings, ArrowLeft, Music, LogOut, ClipboardList } from 'lucide-react';

export default function HubPage() {
  const navigate = useNavigate();
  const context = useOutletContext();
  const loading = context?.loading;
  const authRole = context?.authRole;

  const handleLogout = () => {
    localStorage.removeItem('js2026_auth');
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-brand-bg text-brand-text transition-colors duration-300">
      <header className="p-4 px-6 rounded-b-[30px] flex justify-between items-center shadow-soft bg-white/40 backdrop-blur-md border-b border-white/50 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/stpbb')} className="p-2 rounded-full transition-all bg-white/50 hover:bg-white text-brand-text/50 hover:text-brand-text shadow-sm" title="Retour QoL">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-brand-text">STPBB - JS 2026</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`text-[10px] uppercase font-bold tracking-wide inline-block px-2 py-0.5 rounded-md shadow-sm ${loading ? 'bg-orange-400 text-white' : 'bg-brand-teal/20 text-brand-teal'}`}>{loading ? 'Connexion...' : 'En ligne'}</div>
              <div className="text-[10px] uppercase font-bold tracking-wide inline-block px-2 py-0.5 rounded-md shadow-sm bg-brand-coral/10 text-brand-coral">Connecté : {authRole}</div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {authRole === 'Ecole' && (
            <button onClick={() => navigate('/JS2026/teacher')} className="px-4 py-2 rounded-full flex items-center gap-2 transition-all shadow-soft bg-brand-teal hover:bg-brand-teal/90 text-white hover:scale-105 active:scale-95 font-bold">
              <GraduationCap size={18} /> <span className="hidden md:inline">Espace enseignant</span>
            </button>
          )}
          <button onClick={handleLogout} className="p-2 rounded-full transition-all bg-white/50 hover:bg-brand-coral hover:text-white text-brand-text/50 shadow-sm" title="Se déconnecter">
            <LogOut size={20} />
          </button>
        </div>
      </header>
      <main className="p-6 max-w-5xl w-full mx-auto flex-1 flex flex-col pt-8 pb-10">
        <div className="my-auto w-full flex flex-col">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Accessible à tous */}
            <HubCard icon={<Map size={32} className="text-brand-teal" />} title="Carte Interactive" onClick={() => navigate('/JS2026/map')} />
            <HubCard icon={<Music size={32} className="text-sky-500" />} title="Chanson JS" onClick={() => navigate('/JS2026/song')} />
            <HubCard icon={<Trophy size={32} className="text-yellow-500" />} title="Score en direct" onClick={() => navigate('/JS2026/live-scores')} />

            {/* Formasat & Ecole */}
            {(authRole === 'Formasat' || authRole === 'Ecole') && (
              <HubCard icon={<ClipboardList size={32} className="text-indigo-500" />} title="Administrer les scores" onClick={() => navigate('/JS2026/scores')} />
            )}

            {/* Uniquement Ecole */}
            {authRole === 'Ecole' && (
              <>
                <HubCard icon={<Users size={32} className="text-brand-peach" />} title="Gérer mon équipe" onClick={() => navigate('/JS2026/teams')} />
                <HubCard icon={<Search size={32} className="text-brand-coral" />} title="Rechercher un élève" onClick={() => navigate('/JS2026/search')} />
                <HubCard icon={<Settings size={32} className="text-rose-500" />} title="Administration" onClick={() => navigate('/JS2026/admin')} />
              </>
            )}
          </div>
          <p className="text-center text-xs mt-10 font-bold uppercase tracking-widest text-brand-text/40">Sélectionnez une action</p>
        </div>
      </main>
    </div>
  );
}

function HubCard({ icon, title, onClick }) {
  return (<button onClick={onClick} className="p-6 rounded-[30px] shadow-soft border border-white/50 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center gap-3 hover:shadow-md hover:bg-white transition-all active:scale-95 hover:scale-105 h-40"><div className="p-4 rounded-full bg-white shadow-inner mb-2">{icon}</div><span className="font-black tracking-tight text-center leading-tight text-brand-text">{title}</span></button>)
}
