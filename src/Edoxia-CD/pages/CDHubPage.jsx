import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BedDouble, ArrowLeft } from 'lucide-react';

export default function CDHubPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen">
      <header className="shrink-0 sticky top-0 z-[60] border-b border-white/50 p-4 px-8 flex justify-between items-center shadow-soft bg-white/40 backdrop-blur-md">
        <button onClick={() => navigate('/qol')} className="flex items-center gap-2 transition-colors font-bold text-brand-text/50 hover:text-brand-text"><ArrowLeft size={20} /> Retour QoL</button>
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2 text-brand-text">Classe Découverte 2026</h1>
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
              onClick={() => alert("Application de recherche en cours de développement")} 
              className="bg-brand-coral rounded-[30px] p-8 flex flex-col items-center gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-2 transition-transform cursor-pointer relative overflow-hidden group border border-white/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
              <div className="p-5 bg-black/10 rounded-full shrink-0 group-hover:scale-110 transition-transform">
                <Search className="w-12 h-12 text-white" />
              </div>
              <div className="text-center z-10">
                <div className="text-sm font-bold uppercase tracking-widest text-white/70 mb-2">Informations utiles</div>
                <div className="text-2xl font-black text-white leading-tight drop-shadow-md">Recherche élève /<br/>Fiche urgence</div>
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
                <div className="text-2xl font-black text-white leading-tight drop-shadow-md">Gestion des<br/>chambres</div>
              </div>
            </div>




          </div>
        </div>
      </main>
    </div>
  );
}
