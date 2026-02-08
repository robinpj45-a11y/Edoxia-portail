import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Users, Search, Trophy, GraduationCap, Settings, ArrowLeft } from 'lucide-react';
import { ThemeContext } from '../../ThemeContext';

export default function HubPage({ loading }) {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-100 text-slate-900'}`}>
      <header className={`p-4 px-6 rounded-b-3xl flex justify-between items-center shadow-md ${isDark ? 'bg-slate-900 border-b border-slate-800' : 'bg-edoxia-blue text-white'}`}>
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}>
                <ArrowLeft size={20} />
            </button>
            <div><h1 className="text-xl font-bold tracking-wide">STPBB - Journée Sportive 2026</h1>
            <div className={`text-xs mt-1 inline-block px-2 py-0.5 rounded ${loading ? 'bg-orange-400' : 'bg-green-500/20 text-green-100'}`}>{loading ? 'Connexion...' : 'En ligne'}</div></div>
        </div>
        <div className="flex gap-3">
            <button onClick={() => navigate('/JS2026/teacher')} className={`px-3 py-2 rounded-xl flex items-center gap-2 transition-colors border text-sm font-semibold ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-white/10 hover:bg-white/20 text-white border-white/20'}`}><GraduationCap size={18} /> <span className="hidden md:inline">Espace enseignant</span></button>
        </div>
      </header>
      <main className="p-6 max-w-5xl mx-auto h-[calc(100vh-80px)] flex flex-col justify-center">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <HubCard isDark={isDark} icon={<Map size={32} className="text-blue-500" />} title="Carte Interactive" onClick={() => alert("Bientôt disponible !")} />
            <HubCard isDark={isDark} icon={<Users size={32} className="text-green-500" />} title="Voir les équipes" onClick={() => navigate('/JS2026/teams')} />
            <HubCard isDark={isDark} icon={<Search size={32} className="text-purple-500" />} title="Rechercher un élève" onClick={() => alert("Fonction bientôt intégrée ici !")} />
            <HubCard isDark={isDark} icon={<Trophy size={32} className="text-yellow-500" />} title="Score en direct" onClick={() => alert("Bientôt disponible !")} />
            <HubCard isDark={isDark} icon={<Settings size={32} className="text-red-500" />} title="Administration" onClick={() => navigate('/JS2026/admin')} />
         </div>
         <p className={`text-center text-sm mt-8 italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Sélectionnez une action</p>
      </main>
    </div>
  );
}

function HubCard({ icon, title, onClick, isDark }) {
    return (<button onClick={onClick} className={`p-6 rounded-3xl shadow-sm border flex flex-col items-center justify-center gap-3 hover:shadow-md transition-all active:scale-95 h-40 ${isDark ? 'bg-slate-900 border-slate-800 hover:border-cyan-500/50' : 'bg-white border-slate-200 hover:border-edoxia-blue'}`}><div className={`p-3 rounded-full ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>{icon}</div><span className={`font-bold text-center leading-tight ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{title}</span></button>)
}
