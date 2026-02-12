import React, { useContext } from 'react';
import { Sparkles, Utensils, Calendar, Lock, Clock, ChevronRight, ArrowLeft, Plus, Users, X, MessageSquare, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TEMPLATE_REPAS } from '../constants';
import { ThemeContext } from '../../ThemeContext';
import { motion } from 'framer-motion';

export default function EventHome({ events, entries, onSelect, onViewChange, loading }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [showEntriesModal, setShowEntriesModal] = React.useState(false);
  const [selectedEventForEntries, setSelectedEventForEntries] = React.useState(null);

  const handleShowEntries = (e, event) => {
    e.stopPropagation();
    setSelectedEventForEntries(event);
    setShowEntriesModal(true);
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col ${isDark ? 'bg-[#020617] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      <header className={`p-4 px-6 flex justify-between items-center shadow-md sticky top-0 z-50 backdrop-blur-md ${isDark ? 'bg-slate-900/80 border-b border-slate-800' : 'bg-white/80 border-b border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <Link to="/" className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className={`text-xl font-bold tracking-wide flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Sparkles size={20} className="text-cyan-400" /> Edoxia Event
            </h1>
            <div className={`text-xs mt-1 inline-block px-2 py-0.5 rounded ${loading ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-100'}`}>
              {loading ? 'Connexion...' : 'En ligne'}
            </div>
          </div>
        </div>
        <button onClick={() => onViewChange('admin')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`}>
          <Plus size={16} /> Créer un évenement
        </button>
      </header>

      <main className="p-6 max-w-5xl mx-auto flex flex-col items-center justify-center flex-1 w-full">
        <h2 className={`text-3xl font-bold mb-8 px-2 text-center ${isDark ? 'text-white' : 'text-slate-800'}`}>Évènements disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 w-full pb-20 md:pb-0">
          {events.length === 0 ? (
            <div className={`col-span-2 text-center py-10 italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Aucun évènement pour le moment.</div>
          ) : events.map(e => (
            <motion.button
              key={e.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onSelect(e)}
              className={`relative group p-6 rounded-[2rem] border flex flex-col md:flex-row items-center md:items-start justify-center md:justify-between gap-4 transition-all active:scale-95 text-center md:text-left h-auto md:h-40 overflow-hidden ${isDark
                ? 'bg-slate-900/50 border-slate-800 hover:border-cyan-500/30 hover:bg-slate-800/80'
                : 'bg-white border-slate-200 hover:border-cyan-500/50 hover:shadow-lg'
                } ${e.isLocked ? 'opacity-60 grayscale' : ''}`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 md:hidden ${e.type === TEMPLATE_REPAS ? 'bg-orange-500' : 'bg-cyan-500'}`}></div>
              <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                <div className={`p-5 rounded-full md:rounded-2xl shrink-0 mt-4 md:mt-0 ${isDark
                  ? (e.type === TEMPLATE_REPAS ? 'bg-orange-500/10 text-orange-400' : 'bg-cyan-500/10 text-cyan-400')
                  : (e.type === TEMPLATE_REPAS ? 'bg-orange-50 text-orange-500' : 'bg-cyan-50 text-cyan-600')
                  }`}>
                  {e.type === TEMPLATE_REPAS ? <Utensils size={32} /> : <Calendar size={32} />}
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-xl leading-tight transition-colors mb-2 flex items-center justify-center md:justify-start gap-2 ${isDark ? 'text-slate-100 group-hover:text-cyan-400' : 'text-slate-800 group-hover:text-cyan-600'}`}>
                    {e.title}
                    {e.isLocked && <Lock size={16} className="text-red-500" />}
                  </h3>
                  <div className="flex flex-col md:flex-row gap-2 md:gap-4 justify-center md:justify-start">
                    <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full w-fit mx-auto md:mx-0 ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{e.type}</span>
                    {e.isLocked ? (
                      <span className={`text-xs font-bold px-3 py-1 rounded-full w-fit mx-auto md:mx-0 border ${isDark ? 'bg-red-900/20 text-red-400 border-red-900/50' : 'bg-red-100 text-red-600 border-red-200'}`}>Inscriptions closes</span>
                    ) : (
                      e.date && <span className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}><Clock size={12} /> {new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    {!e.isLocked && (
                      <button onClick={(ev) => handleShowEntries(ev, e)} className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-800'}`}>
                        <Users size={12} /> Voir les inscrits
                      </button>
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-full transition-colors hidden md:block ${isDark ? 'bg-slate-800 text-slate-500 group-hover:bg-cyan-900/30 group-hover:text-cyan-400' : 'bg-slate-50 text-slate-300 group-hover:bg-cyan-50 group-hover:text-cyan-600'}`}>
                  <ChevronRight size={24} />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </main>

      <footer className={`py-6 text-center text-xs font-medium pb-20 md:pb-6 mt-auto ${isDark ? 'text-slate-600 bg-slate-900/30' : 'text-slate-400 bg-slate-100/50'}`}>
        <p>Powered by <span className="text-cyan-500 font-bold">Edoxia</span> • {new Date().getFullYear()}</p>
      </footer>

      {/* MODAL LISTE DES INSCRITS */}
      {showEntriesModal && selectedEventForEntries && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80" onClick={() => setShowEntriesModal(false)}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            className={`w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
          >
            <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-slate-50'}`}>
              <h3 className={`font-bold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                <Users size={20} className="text-cyan-500" />
                Inscrits - {selectedEventForEntries.title}
              </h3>
              <button onClick={() => setShowEntriesModal(false)} className={`p-2 rounded-full transition-colors ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(() => {
                const eventEntries = entries.filter(ent => ent.eventId === selectedEventForEntries.id);
                if (eventEntries.length === 0) return <div className="text-center py-8 text-slate-400 italic">Aucun inscrit pour le moment.</div>;

                return eventEntries.map(entry => (
                  <div key={entry.id} className={`p-4 rounded-xl border flex flex-col gap-2 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                        <User size={16} />
                      </div>
                      <div>
                        <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{entry.firstName} {entry.lastName}</p>
                        <p className="text-xs text-slate-500">Inscrit le {entry.timestamp ? new Date(entry.timestamp.seconds * 1000).toLocaleDateString() : 'Date inconnue'}</p>
                      </div>
                    </div>
                    {entry.comment && (
                      <div className={`mt-1 text-sm p-3 rounded-lg flex gap-2 items-start ${isDark ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
                        <MessageSquare size={14} className="mt-1 shrink-0 opacity-50" />
                        <p className="italic">"{entry.comment}"</p>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>

            <div className={`p-4 border-t text-center text-xs font-bold ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
              Total : {entries.filter(ent => ent.eventId === selectedEventForEntries.id).length} participant(s)
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}