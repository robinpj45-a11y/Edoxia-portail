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
    <div className="min-h-screen font-sans flex flex-col bg-brand-bg text-brand-text">
      <header className="p-4 px-6 flex justify-between items-center shadow-md sticky top-0 z-50 backdrop-blur-md bg-white/40 border-b border-white/50">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 rounded-full transition-colors bg-white/50 hover:bg-white text-brand-text shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-wide flex items-center gap-2 text-brand-text">
              Edoxia Event
            </h1>
            <div className={`text-xs mt-1 inline-block px-2 py-0.5 rounded font-bold ${loading ? 'bg-orange-500/20 text-orange-600' : 'bg-green-500/20 text-green-600'}`}>
              {loading ? 'Connexion...' : 'En ligne'}
            </div>
          </div>
        </div>
        <button onClick={() => onViewChange('admin')} className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all bg-brand-coral hover:bg-brand-coral/90 text-white shadow-soft hover:scale-105 active:scale-95">
          <Plus size={16} /> Créer un évenement
        </button>
      </header>

      <main className="p-6 max-w-5xl mx-auto flex flex-col items-center justify-center flex-1 w-full">
        <h2 className="text-3xl font-black mb-8 px-2 text-center text-brand-text tracking-tight">Évènements disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pb-20 md:pb-0">
          {events.length === 0 ? (
            <div className="col-span-2 text-center py-10 italic text-brand-text/50">Aucun évènement pour le moment.</div>
          ) : events.map(e => (
            <motion.button
              key={e.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onSelect(e)}
              className={`relative group p-6 rounded-[30px] border flex flex-col md:flex-row items-center md:items-start justify-center md:justify-between gap-4 transition-all hover:-translate-y-1 hover:shadow-lg active:scale-95 text-center md:text-left h-auto md:h-40 overflow-hidden bg-white/50 border-white/50 shadow-soft cursor-pointer ${e.isLocked ? 'opacity-60 grayscale cursor-not-allowed hover:-translate-y-0 hover:shadow-soft' : 'hover:bg-white'}`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1.5 md:hidden ${e.type === TEMPLATE_REPAS ? 'bg-brand-peach' : 'bg-brand-teal'}`}></div>
              <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                <div className={`p-5 rounded-full md:rounded-[20px] shrink-0 mt-4 md:mt-0 bg-white/60 shadow-inner ${e.type === TEMPLATE_REPAS ? 'text-brand-coral' : 'text-brand-teal'}`}>
                  {e.type === TEMPLATE_REPAS ? <Utensils size={32} /> : <Calendar size={32} />}
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-xl leading-tight transition-colors mb-2 flex items-center justify-center md:justify-start gap-2 text-brand-text">
                    {e.title}
                    {e.isLocked && <Lock size={16} className="text-brand-coral" />}
                  </h3>
                  <div className="flex flex-col md:flex-row gap-2 md:gap-4 justify-center md:justify-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full w-fit mx-auto md:mx-0 bg-black/5 text-brand-text/60">{e.type}</span>
                    {e.isLocked ? (
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full w-fit mx-auto md:mx-0 border bg-red-50 text-red-600 border-red-200 uppercase tracking-wider">Inscriptions closes</span>
                    ) : (
                      e.date && <span className="text-xs font-bold flex items-center gap-1 text-brand-text/60"><Clock size={12} /> {new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2 justify-center md:justify-start">
                    {!e.isLocked && (
                      <button onClick={(ev) => handleShowEntries(ev, e)} className="text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1 transition-colors border bg-white/50 border-white/50 text-brand-text hover:bg-white hover:shadow-sm">
                        <Users size={12} /> Voir les inscrits
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-full transition-colors hidden md:block bg-black/5 text-brand-text/50 group-hover:bg-brand-coral group-hover:text-white">
                  <ChevronRight size={24} />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </main>

      <footer className="py-6 text-center text-xs font-medium pb-20 md:pb-6 mt-auto text-brand-text/40">
        <p>Powered by <span className="text-brand-coral font-bold">Edoxia</span> • {new Date().getFullYear()}</p>
      </footer>

      {/* MODAL LISTE DES INSCRITS */}
      {showEntriesModal && selectedEventForEntries && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-bg/80 backdrop-blur-sm" onClick={() => setShowEntriesModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-[30px] shadow-2xl overflow-hidden border bg-white/90 backdrop-blur-md border-white/50"
          >
            <div className="p-6 border-b flex justify-between items-center border-brand-text/10 bg-white/50">
              <h3 className="font-black text-xl flex items-center gap-2 text-brand-text">
                <Users size={20} className="text-brand-teal" />
                Inscrits - {selectedEventForEntries.title}
              </h3>
              <button onClick={() => setShowEntriesModal(false)} className="p-2 rounded-full transition-colors text-brand-text/50 hover:bg-black/5 hover:text-brand-text">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {(() => {
                const eventEntries = entries.filter(ent => ent.eventId === selectedEventForEntries.id);
                if (eventEntries.length === 0) return <div className="text-center py-8 text-brand-text/50 italic font-medium">Aucun inscrit pour le moment.</div>;

                return eventEntries.map(entry => (
                  <div key={entry.id} className="p-4 rounded-[20px] border flex flex-col gap-2 bg-white/50 border-white/50 shadow-sm transition-hover hover:bg-white hover:shadow-soft">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-brand-teal/10 text-brand-teal">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-brand-text">{entry.firstName} {entry.lastName}</p>
                        <p className="text-xs text-brand-text/60 font-medium">Inscrit le {entry.timestamp ? new Date(entry.timestamp.seconds * 1000).toLocaleDateString() : 'Date inconnue'}</p>
                      </div>
                    </div>
                    {entry.comment && (
                      <div className="mt-2 text-sm p-4 rounded-[16px] flex gap-3 items-start bg-brand-bg/60 text-brand-text/80 shadow-inner">
                        <MessageSquare size={14} className="mt-0.5 shrink-0 opacity-50 text-brand-teal" />
                        <p className="italic font-medium">"{entry.comment}"</p>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>

            <div className="p-4 border-t text-center text-xs font-bold border-brand-text/10 text-brand-text/60 bg-white/30">
              Total : {entries.filter(ent => ent.eventId === selectedEventForEntries.id).length} participant(s)
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}