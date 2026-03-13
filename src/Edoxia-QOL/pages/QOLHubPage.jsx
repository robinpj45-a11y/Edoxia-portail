import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Map, ArrowLeft, Calculator } from 'lucide-react';

const QOLHubPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="w-full flex justify-start mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-brand-text bg-white/40 rounded-full border border-white/50 hover:bg-white/80 transition-all shadow-soft backdrop-blur-md w-fit h-fit focus:outline-none"
        >
          <ArrowLeft size={18} />
          Retour
        </button>
      </div>

      {/* Cards */}
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
          {/* CARTE 1 - Evénements */}
          <div onClick={() => navigate('/events')} className="bg-yellow-500 rounded-[20px] p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-transform cursor-pointer">
            <div className="p-3 bg-black/10 rounded-full shrink-0">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div className="overflow-hidden">
              <div className="text-[12px] font-bold uppercase tracking-wider text-white/60 truncate">Organisation</div>
              <div className="text-xl font-semibold text-white truncate">Événements</div>
            </div>
          </div>
          {/* CARTE 1 - Calendrier */}
          <div onClick={() => navigate('/calendar')} className="bg-brand-teal rounded-[20px] p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-transform cursor-pointer">
            <div className="p-3 bg-black/10 rounded-full shrink-0">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div className="overflow-hidden">
              <div className="text-[12px] font-bold uppercase tracking-wider text-white/60 truncate">Suivi & Événements</div>
              <div className="text-xl font-semibold text-white truncate">Calendrier</div>
            </div>
          </div>

          {/* CARTE 2 - Classe de mer 2026 */}
          <div onClick={() => navigate('/cd')} className="bg-brand-coral rounded-[20px] p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-transform cursor-pointer">
            <div className="p-3 bg-black/10 rounded-full shrink-0">
              <Map className="w-8 h-8 text-white" />
            </div>
            <div className="overflow-hidden">
              <div className="text-[12px] font-bold uppercase tracking-wider text-white/60 truncate">Voyage scolaire</div>
              <div className="text-xl font-semibold text-white truncate">CD 2026</div>
            </div>
          </div>

          {/* CARTE 3 - Réussite scolaire */}
          <div onClick={() => navigate('/success')} className="bg-brand-teal rounded-[20px] p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-transform cursor-pointer">
            <div className="p-3 bg-black/10 rounded-full shrink-0">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <div className="overflow-hidden">
              <div className="text-[12px] font-bold uppercase tracking-wider text-white/60 truncate">Suivi pédagogique</div>
              <div className="text-xl font-semibold text-white truncate">Réussite</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QOLHubPage;
