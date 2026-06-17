import React from 'react';
import { Clock, CheckCircle2, XCircle, Edit2, Trash2 } from 'lucide-react';

const MatchCard = ({ match, predictions, onPredict, onEdit, onDelete }) => {
  const isFinished = match.status === 'Termine';
  const isInProgress = match.status === 'En cours';

  // Helper to determine if prediction is correct
  const getPredictionStatus = (p) => {
    if (!isFinished) return 'pending';
    if (match.scoreA === null || match.scoreB === null) return 'pending';
    
    const isExact = p.scoreA === match.scoreA && p.scoreB === match.scoreB;
    
    // Check 1N2 outcome
    const matchDiff = match.scoreA - match.scoreB;
    const pDiff = p.scoreA - p.scoreB;
    const isOutcomeCorrect = (matchDiff > 0 && pDiff > 0) || (matchDiff < 0 && pDiff < 0) || (matchDiff === 0 && pDiff === 0);
    
    if (isExact) return 'exact';
    if (isOutcomeCorrect) return 'outcome';
    return 'incorrect';
  };

  return (
    <div className="bg-[#1e293b] rounded-2xl p-5 shadow-lg border border-white/10 relative overflow-hidden group">
      {/* Background glow if active */}
      {isInProgress && (
        <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none"></div>
      )}

      {/* Match Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {/* <span className="text-xs font-bold text-white/50 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
            Match
          </span> */}
          {onEdit && (
            <button onClick={onEdit} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-emerald-400 transition-colors">
              <Edit2 size={14} />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-rose-400 transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isFinished && <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded">Terminé</span>}
          {isInProgress && <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>En cours</span>}
          {!isFinished && !isInProgress && <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded flex items-center gap-1"><Clock size={12} /> À venir</span>}
        </div>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-between mb-6">
        {/* Team A */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-2 shadow-inner border border-white/10">
            <span className="text-xl font-black text-white/80">{match.teamA ? match.teamA.substring(0, 3).toUpperCase() : '?'}</span>
          </div>
          <span className="text-sm font-bold text-center text-white">{match.teamA || 'À définir'}</span>
        </div>

        {/* Score or VS */}
        <div className="px-4 flex flex-col items-center justify-center">
          {(isFinished || isInProgress) ? (
            <div className="bg-slate-900 px-4 py-2 rounded-xl border border-white/10 shadow-inner">
              <span className="text-2xl font-black text-white">
                {match.scoreA !== null ? match.scoreA : '-'} : {match.scoreB !== null ? match.scoreB : '-'}
              </span>
            </div>
          ) : (
            <span className="text-lg font-black text-white/20 italic">VS</span>
          )}
        </div>

        {/* Team B */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-2 shadow-inner border border-white/10">
            <span className="text-xl font-black text-white/80">{match.teamB ? match.teamB.substring(0, 3).toUpperCase() : '?'}</span>
          </div>
          <span className="text-sm font-bold text-center text-white">{match.teamB || 'À définir'}</span>
        </div>
      </div>

      {/* Action Button */}
      {!isFinished && (
        <button 
          onClick={onPredict}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] shadow-[0_4px_15px_rgba(5,150,105,0.3)] mb-4"
        >
          Ajouter un pronostic
        </button>
      )}

      {/* Predictions List */}
      {predictions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Pronostics ({predictions.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto hide-scrollbar pr-1">
            {predictions.map(p => {
              const status = getPredictionStatus(p);
              let statusClasses = "bg-white/5 border-white/5";
              let Icon = null;

              if (status === 'exact') {
                statusClasses = "bg-emerald-500/20 border-emerald-500/50 text-emerald-100";
                Icon = <CheckCircle2 size={16} className="text-emerald-400" />;
              } else if (status === 'outcome') {
                statusClasses = "bg-teal-500/20 border-teal-500/30 text-teal-100";
                Icon = <CheckCircle2 size={16} className="text-teal-400 opacity-60" />;
              } else if (status === 'incorrect') {
                statusClasses = "bg-rose-500/20 border-rose-500/30 text-rose-100";
                Icon = <XCircle size={16} className="text-rose-400" />;
              }

              return (
                <div key={p.id} className={`flex items-center justify-between p-2 px-3 rounded-lg border ${statusClasses}`}>
                  <span className="font-semibold text-sm truncate pr-2">{p.userName}</span>
                  <div className="flex items-center gap-2 shrink-0 font-bold bg-black/20 px-2 py-1 rounded">
                    <span>{p.scoreA} - {p.scoreB}</span>
                    {Icon}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchCard;
