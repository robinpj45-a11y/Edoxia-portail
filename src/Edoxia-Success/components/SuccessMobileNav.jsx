import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, PlusCircle, BarChart3, Upload, Settings2, Target } from 'lucide-react';

export default function SuccessMobileNav({ onOpenCreate, onOpenImport, mode = 'hub', onOpenView, onOpenRadar }) {
  const navigate = useNavigate();
  const { spaceId } = useParams();

  return (
    <nav className="md:hidden fixed bottom-6 left-6 right-6 z-[100] bg-white/80 backdrop-blur-xl rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-brand-text/5 flex justify-around items-center px-2 py-3">
      <button 
        onClick={() => navigate(-1)} 
        className="flex flex-col items-center gap-1 p-2 text-brand-text/40 hover:text-brand-coral transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
        <span className="text-[10px] font-bold text-center">Retour</span>
      </button>

      {mode === 'hub' && (
        <>
          <button 
            onClick={onOpenCreate} 
            className="flex flex-col items-center gap-1 p-2 text-brand-text/40 hover:text-brand-coral transition-colors"
          >
            <PlusCircle className="w-6 h-6" />
            <span className="text-[10px] font-bold text-center truncate w-14">Évaluation</span>
          </button>

          <button 
            onClick={() => navigate(`/success/${spaceId}/reports`)} 
            className="flex flex-col items-center gap-1 p-2 text-brand-text/40 hover:text-brand-coral transition-colors"
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-[10px] font-bold text-center">Résultats</span>
          </button>

          <button 
            onClick={onOpenImport} 
            className="flex flex-col items-center gap-1 p-2 text-brand-text/40 hover:text-brand-coral transition-colors"
          >
            <Upload className="w-6 h-6" />
            <span className="text-[10px] font-bold text-center">Importer</span>
          </button>
        </>
      )}

      {mode === 'reports' && (
        <>
          <button 
            onClick={onOpenRadar} 
            className="flex flex-col items-center gap-1 p-2 text-brand-text/40 hover:text-indigo-500 transition-colors"
          >
            <Target className="w-6 h-6" />
            <span className="text-[10px] font-bold text-center">Toile</span>
          </button>
          <button 
            onClick={onOpenView} 
            className="flex flex-col items-center gap-1 p-2 text-brand-text/40 hover:text-brand-teal transition-colors"
          >
            <Settings2 className="w-6 h-6" />
            <span className="text-[10px] font-bold text-center">Vue</span>
          </button>
        </>
      )}
    </nav>
  );
}
