import React, { useState, useEffect, useContext } from 'react';
import { 
  User, Utensils, CheckCircle, CalendarPlus, ArrowLeft, 
  MapPin, Clock, Info, Lock, Wine, ChevronRight, List, MessageSquare, ChevronDown 
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { TEMPLATE_REPAS, TEMPLATE_ACTIVITE } from '../constants';
import { ThemeContext } from '../../ThemeContext';

export default function RegisterUser({ event, user, onBack }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [formEntry, setFormEntry] = useState({ firstName: '', lastName: '', selectionType: 'carte', selections: {}, comment: '', total: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Helper pour les couleurs
  const isRepas = event.type === TEMPLATE_REPAS;
  const themeColor = isRepas ? 'text-orange-500' : 'text-violet-500';
  const themeBg = isRepas 
    ? (isDark ? 'bg-orange-500/20' : 'bg-orange-50') 
    : (isDark ? 'bg-violet-500/20' : 'bg-violet-50');

  // Calcul Prix
  useEffect(() => {
    if (event.isPaid && !event.isLocked) {
      let total = 0;
      if (event.type === TEMPLATE_REPAS) {
        if (formEntry.selectionType === 'carte') {
          Object.values(formEntry.selections).forEach(val => { 
            if (val && !val.toString().startsWith('APERO:')) {
                const parts = val.split('|');
                if(parts.length > 1) total += parseFloat(parts[1]) || 0;
            }
          });
        } else {
          const menu = event.menus.find(m => m.id === formEntry.selectionType);
          if (menu) total = parseFloat(menu.price);
        }
      } else {
        total += parseFloat(event.price || 0);
        Object.values(formEntry.selections).forEach(val => { 
           if (val && !val.toString().startsWith('APERO:')) {
               const parts = val.split('|');
               if(parts.length > 1) total += parseFloat(parts[1]) || 0;
           }
        });
      }
      setFormEntry(prev => ({ ...prev, total }));
    }
  }, [formEntry.selections, formEntry.selectionType, event]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'entries'), { ...formEntry, eventId: event.id, timestamp: serverTimestamp(), userId: user.uid, isPaid: false });
      setSubmitted(true);
    } catch (err) { alert(err.message); } finally { setSubmitting(false); }
  };

  const handleOptionCheck = (name, price, checked) => {
    setFormEntry(prev => {
      const newSelections = { ...prev.selections };
      if (checked) newSelections[name] = `${name}|${price}`; else delete newSelections[name];
      return { ...prev, selections: newSelections };
    });
  };

  const handleSelectionChange = (category, value) => {
    setFormEntry(prev => ({
        ...prev,
        selections: { ...prev.selections, [category]: value }
    }));
  };

  const handleTypeChange = (typeId) => {
    setFormEntry(prev => {
        // On garde l'apéro si sélectionné
        const apero = prev.selections['Apéritif'];
        const newSelections = apero ? { 'Apéritif': apero } : {};
        return { ...prev, selectionType: typeId, selections: newSelections };
    });
  };

  const handleAperoChange = (choice) => {
    setFormEntry(prev => ({
        ...prev,
        selections: { ...prev.selections, 'Apéritif': `APERO:${choice}` } 
    }));
  };

  const addToCalendar = () => {
    const title = event.title;
    const description = event.description || "Évènement Edoxia";
    const location = event.address || "";
    
    let startDate = new Date();
    if (event.date) {
        const [y, m, d] = event.date.split('-');
        startDate.setFullYear(y, m - 1, d);
        if (event.time) {
            const [h, min] = event.time.split(':');
            startDate.setHours(h, min);
        } else {
            startDate.setHours(12, 0);
        }
    } else {
        startDate.setDate(startDate.getDate() + 1);
        startDate.setHours(12, 0);
    }
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2); 
    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const icsContent = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Edoxia Event//FR", "BEGIN:VEVENT",
        `SUMMARY:${title}`, `DESCRIPTION:${description}`, `LOCATION:${location}`,
        `DTSTART:${formatDate(startDate)}`, `DTEND:${formatDate(endDate)}`,
        "END:VEVENT", "END:VCALENDAR"
    ].join("\n");
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (submitted) return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <div className={`p-10 rounded-[2rem] shadow-xl text-center max-w-md w-full border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}><CheckCircle size={40}/></div>
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Inscription validée !</h2>
        <p className={`mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Merci {formEntry.firstName}, c'est enregistré.</p>
        <button onClick={addToCalendar} className={`w-full py-4 rounded-xl font-bold transition-colors mb-3 flex items-center justify-center gap-2 ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}><CalendarPlus size={20}/> Ajouter au calendrier</button>
        <button onClick={onBack} className="w-full bg-cyan-600 text-white py-4 rounded-xl font-bold hover:bg-cyan-700 transition-colors">Retour</button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans pb-32 md:pb-24 ${isDark ? 'bg-[#020617] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      <header className={`p-4 px-6 flex items-center gap-4 sticky top-0 z-40 shadow-md backdrop-blur-md ${isDark ? 'bg-slate-900/80 border-b border-slate-800' : 'bg-white/80 border-b border-slate-200'}`}>
        <button onClick={onBack} className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}><ArrowLeft size={20}/></button>
        <h1 className={`font-bold text-lg truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{event.title}</h1>
      </header>

      <main className="p-6 max-w-2xl mx-auto space-y-6 mt-4">
        
        {/* Infos Activité (COMMUN) */}
        {(event.date || event.address) && (
           <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border shadow-sm flex flex-col items-center text-center gap-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                 <div className={`${themeBg} p-3 rounded-full ${themeColor}`}><Clock size={24}/></div>
                 <div><div className="text-[10px] font-bold text-slate-500 uppercase">Quand ?</div><div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{event.date || 'À définir'} <br/> {event.time}</div></div>
              </div>
              <div className={`p-4 rounded-2xl border shadow-sm flex flex-col items-center text-center gap-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                 <div className={`${themeBg} p-3 rounded-full ${themeColor}`}><MapPin size={24}/></div>
                 <div><div className="text-[10px] font-bold text-slate-500 uppercase">Où ?</div><div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{event.address || 'Non spécifié'}</div></div>
              </div>
           </div>
        )}

        {/* Description (COMMUN) */}
        {event.description && (
             <div className={`p-6 rounded-2xl shadow-sm border flex gap-4 items-start ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                 <Info className="text-slate-400 shrink-0 mt-1" size={20} />
                 <p className={`italic text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{event.description}</p>
             </div>
        )}

        {/* LOGIQUE DE VERROUILLAGE */}
        {event.isLocked ? (
            <div className={`border-2 rounded-3xl p-8 text-center animate-in zoom-in ${isDark ? 'bg-red-950/30 border-red-900/50' : 'bg-red-50 border-red-100'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-500'}`}>
                    <Lock size={32} />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-red-400' : 'text-red-800'}`}>Inscriptions closes</h3>
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Il n'est plus possible de s'inscrire à cet événement.</p>
                <button onClick={onBack} className="mt-6 text-sm text-slate-400 underline hover:text-slate-600">Retourner à la liste</button>
            </div>
        ) : (
            <>
                <section className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                   <h3 className={`text-xs font-bold uppercase mb-4 flex items-center gap-2 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}><User size={16}/> Qui êtes-vous ?</h3>
                   <div className="space-y-4">
                      <input required placeholder="Votre Prénom" className={`w-full border rounded-xl p-3 font-bold outline-none focus:border-cyan-500 transition-colors ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} value={formEntry.firstName} onChange={e => setFormEntry({...formEntry, firstName: e.target.value})} />
                      <input required placeholder="Votre Nom" className={`w-full border rounded-xl p-3 font-bold outline-none focus:border-cyan-500 transition-colors ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} value={formEntry.lastName} onChange={e => setFormEntry({...formEntry, lastName: e.target.value})} />
                   </div>
                </section>

                {event.hasApero && event.aperoChoices && (
                    <section className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className={`text-xs font-bold uppercase mb-4 flex items-center gap-2 ${isDark ? 'text-pink-400' : 'text-pink-600'}`}><Wine size={16}/> Apéritif offert</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {event.aperoChoices.map((choice, idx) => {
                                const isSelected = formEntry.selections['Apéritif'] === `APERO:${choice}`;
                                return (
                                    <button key={idx} type="button" onClick={() => handleAperoChange(choice)} className={`p-4 rounded-xl border-2 font-bold text-sm transition-all ${isSelected ? 'border-pink-500 bg-pink-500/10 text-pink-500' : (isDark ? 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-600' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300')}`}>{choice}</button>
                                )
                            })}
                        </div>
                    </section>
                )}

                {/* CHOIX REPAS */}
                {event.type === TEMPLATE_REPAS && (
                    <section className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className={`text-xs font-bold uppercase mb-4 flex items-center gap-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}><Utensils size={16}/> Votre Repas</h3>
                        
                        {/* TABS SI MENUS EXISTENT */}
                        {event.menus && event.menus.length > 0 && (
                            <div className={`flex p-1 rounded-xl border mb-6 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                                <button 
                                    onClick={() => handleTypeChange('carte')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formEntry.selectionType === 'carte' ? (isDark ? 'bg-slate-800 text-white shadow' : 'bg-white text-slate-800 shadow') : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')}`}
                                >
                                    À la carte
                                </button>
                                {event.menus.map(menu => (
                                    <button 
                                        key={menu.id}
                                        onClick={() => handleTypeChange(menu.id)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formEntry.selectionType === menu.id ? (isDark ? 'bg-slate-800 text-white shadow' : 'bg-white text-slate-800 shadow') : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')}`}
                                    >
                                        {menu.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* CONTENU CARTE */}
                        {formEntry.selectionType === 'carte' && (
                            <div className="space-y-4">
                                {['entrees', 'plats', 'desserts'].map(type => (
                                    event.carte && event.carte[type] && event.carte[type].length > 0 && (
                                        <div key={type}>
                                            <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{type}</label>
                                            <div className="relative">
                                                <select
                                                    value={formEntry.selections[type] || ""}
                                                    onChange={e => handleSelectionChange(type, e.target.value)}
                                                    className={`w-full p-3 rounded-xl border appearance-none outline-none transition-colors ${
                                                        isDark 
                                                        ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500' 
                                                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-cyan-600'
                                                    }`}
                                                >
                                                    <option value="">-- Choisir --</option>
                                                    {event.carte[type].map((item, idx) => (
                                                        <option key={idx} value={`${item.name}|${item.price}`}>
                                                            {item.name} {event.isPaid && item.price > 0 ? `(+${item.price}€)` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                    <ChevronDown size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}

                        {/* CONTENU MENU */}
                        {formEntry.selectionType !== 'carte' && (
                            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                {(() => {
                                    const menu = event.menus.find(m => m.id === formEntry.selectionType);
                                    return menu ? (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center border-b border-slate-200/10 pb-2 mb-2">
                                                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{menu.name}</span>
                                                {event.isPaid && <span className="font-bold text-orange-500">{menu.price}€</span>}
                                            </div>
                                            {['entrees', 'plats', 'desserts'].map(type => (
                                                menu[type] && menu[type].length > 0 && (
                                                    <div key={type}>
                                                        <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{type}</label>
                                                        <div className="relative">
                                                            <select
                                                                value={formEntry.selections[type] || ""}
                                                                onChange={e => handleSelectionChange(type, e.target.value)}
                                                                className={`w-full p-3 rounded-xl border appearance-none outline-none transition-colors ${
                                                                    isDark 
                                                                    ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500' 
                                                                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-cyan-600'
                                                                }`}
                                                            >
                                                                <option value="">-- Choisir --</option>
                                                                {menu[type].map((item, i) => (
                                                                    <option key={i} value={item}>{item}</option>
                                                                ))}
                                                            </select>
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                                <ChevronDown size={16} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                        )}
                    </section>
                )}

                {/* CHOIX ACTIVITE */}
                {event.type === TEMPLATE_ACTIVITE && event.activityOptions && event.activityOptions.length > 0 && (
                    <section className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className={`text-xs font-bold uppercase mb-4 flex items-center gap-2 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}><List size={16}/> Options</h3>
                        <div className="space-y-2">
                            {event.activityOptions.map((opt, idx) => (
                                <label key={idx} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${formEntry.selections[opt.name] ? (isDark ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-cyan-200 bg-cyan-50') : (isDark ? 'border-slate-800 hover:border-slate-700' : 'border-slate-100 hover:border-slate-200')}`}>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="checkbox" 
                                            className={`w-5 h-5 rounded border ${isDark ? 'bg-slate-900 border-slate-700 checked:bg-cyan-500' : 'bg-white border-slate-300 checked:bg-cyan-500'} accent-cyan-500`}
                                            checked={!!formEntry.selections[opt.name]}
                                            onChange={(e) => handleOptionCheck(opt.name, opt.price, e.target.checked)}
                                        />
                                        <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{opt.name}</span>
                                    </div>
                                    {event.isPaid && <span className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{opt.price}€</span>}
                                </label>
                            ))}
                        </div>
                    </section>
                )}

                <section className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                   <h3 className={`text-xs font-bold uppercase mb-2 flex items-center gap-2 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}><MessageSquare size={16}/> Remarques</h3>
                   <textarea rows="2" className={`w-full border rounded-xl p-3 text-sm focus:border-cyan-500 outline-none resize-none ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} placeholder="Allergies, infos..." value={formEntry.comment} onChange={e => setFormEntry({...formEntry, comment: e.target.value})} />
                </section>
            </>
        )}
      </main>

      {!event.isLocked && (
          <div className={`fixed bottom-0 left-0 right-0 border-t p-4 px-6 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{formEntry.total.toFixed(2)}€</p>
             </div>
             <button onClick={handleSubmit} disabled={submitting || !formEntry.firstName} className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-cyan-900/20 transition-all disabled:opacity-50 disabled:shadow-none">
                {submitting ? '...' : 'Valider'}
             </button>
          </div>
      )}
    </div>
  );
}