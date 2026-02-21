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
    const [formEntry, setFormEntry] = useState({ firstName: user?.prenom || '', lastName: user?.nom || '', selectionType: 'carte', selections: {}, comment: '', total: 0 });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (user) {
            setFormEntry(prev => {
                const newFirst = prev.firstName || user.prenom || (user.displayName ? user.displayName.split(' ')[0] : '') || '';
                const newLast = prev.lastName || user.nom || (user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '') || '';
                if (newFirst !== prev.firstName || newLast !== prev.lastName) {
                    return { ...prev, firstName: newFirst, lastName: newLast };
                }
                return prev;
            });
        }
    }, [user]);

    // Helper pour les couleurs
    const isRepas = event.type === TEMPLATE_REPAS;
    const themeColor = isRepas ? 'text-brand-coral' : 'text-brand-teal';
    const themeBg = isRepas ? 'bg-brand-coral/10' : 'bg-brand-teal/10';

    // Calcul Prix
    useEffect(() => {
        if (event.isPaid && !event.isLocked) {
            let total = 0;
            if (event.type === TEMPLATE_REPAS) {
                if (formEntry.selectionType === 'carte') {
                    Object.values(formEntry.selections).forEach(val => {
                        if (val && !val.toString().startsWith('APERO:')) {
                            const parts = val.split('|');
                            if (parts.length > 1) total += parseFloat(parts[1]) || 0;
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
                        if (parts.length > 1) total += parseFloat(parts[1]) || 0;
                    }
                });
            }
            setFormEntry(prev => ({ ...prev, total }));
        }
    }, [formEntry.selections, formEntry.selectionType, event]);

    // Helper pour formater les choix en texte
    const formatSelections = () => {
        let details = [];
        if (event.type === TEMPLATE_REPAS) {
            const menuName = formEntry.selectionType === 'carte' ? 'À la carte' : (event.menus?.find(m => m.id === formEntry.selectionType)?.name || 'Menu');
            details.push(`Type: ${menuName}`);
            Object.entries(formEntry.selections).forEach(([key, val]) => {
                if (val) {
                    const cleanVal = val.toString().startsWith('APERO:') ? val.split(':')[1] : val.split('|')[0];
                    details.push(`- ${key}: ${cleanVal}`);
                }
            });
        } else {
            Object.entries(formEntry.selections).forEach(([key, val]) => {
                if (val) details.push(`- ${key}`);
            });
        }
        if (formEntry.comment) details.push(`Remarque: ${formEntry.comment}`);
        return details.join('\n');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // 1. Sauvegarde inscription
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
        const detailsText = formatSelections();
        const description = (event.description || "Évènement Edoxia") + "\\n\\n--- VOS CHOIX ---\\n" + detailsText.replace(/\n/g, "\\n");
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

    if (submitted) {
        const handleCopy = () => {
            const text = `Inscription : ${event.title}\n\n${formatSelections()}\n\nTotal: ${formEntry.total.toFixed(2)}€`;
            navigator.clipboard.writeText(text).then(() => alert("Récapitulatif copié !"));
        };

        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-brand-bg text-brand-text">
                <div className="p-8 rounded-[30px] shadow-2xl text-center max-w-lg w-full border flex flex-col gap-6 bg-white/90 backdrop-blur-md border-white/50">
                    <div>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-500/20 text-green-600 shadow-inner">
                            <CheckCircle size={32} />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-brand-text">Inscription validée !</h2>
                        <p className="mt-2 text-brand-text/70 font-medium">Merci {formEntry.firstName}, c'est enregistré. Il est conseillé de sauvegarder vos choix.</p>
                    </div>

                    <div className="p-6 rounded-[20px] text-left text-sm border flex flex-col gap-3 shadow-inner bg-white/50 border-white/60">
                        {/* En-tête du ticket */}
                        <div className="flex justify-between items-start border-b border-dashed pb-3 border-brand-text/20">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-brand-text/50 tracking-wider">Évènement</p>
                                <p className="font-bold text-brand-text">{event.title}</p>
                            </div>
                            <div className="px-2 py-1 rounded text-[10px] font-bold bg-white/60 text-brand-text/70 shadow-sm">
                                {new Date().toLocaleDateString()}
                            </div>
                        </div>

                        {/* Corps du ticket */}
                        <div className="space-y-2 py-1">
                            {event.type === TEMPLATE_REPAS && (
                                <div className="flex justify-between items-center">
                                    <span className="text-brand-text/60 font-medium">Formule</span>
                                    <span className="font-bold text-brand-text">
                                        {formEntry.selectionType === 'carte' ? 'À la carte' : (event.menus?.find(m => m.id === formEntry.selectionType)?.name || 'Menu')}
                                    </span>
                                </div>
                            )}

                            {/* Liste des sélections */}
                            {Object.entries(formEntry.selections).map(([key, val]) => {
                                if (!val) return null;
                                const cleanVal = val.toString().startsWith('APERO:') ? val.split(':')[1] : val.split('|')[0];
                                return (
                                    <div key={key} className="flex justify-between items-start text-xs group">
                                        <span className="text-brand-text/60 capitalize shrink-0 pr-4">{key}</span>
                                        <span className="font-bold text-right text-brand-text/90">{cleanVal}</span>
                                    </div>
                                );
                            })}

                            {/* Commentaire */}
                            {formEntry.comment && (
                                <div className="p-3 rounded-xl text-xs flex gap-2 bg-brand-bg/50 text-brand-text/80 mt-2 shadow-inner">
                                    <MessageSquare size={14} className="shrink-0 mt-0.5 opacity-50 text-brand-teal" />
                                    <span className="italic font-medium">"{formEntry.comment}"</span>
                                </div>
                            )}
                        </div>

                        {/* Pied du ticket */}
                        <div className="mt-1 pt-3 border-t-2 border-dashed border-brand-text/20 flex justify-between items-center">
                            <span className="font-bold text-brand-text/50 uppercase text-xs tracking-wider">Total à payer</span>
                            <span className="text-xl font-black text-brand-coral">{formEntry.total.toFixed(2)}€</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button onClick={handleCopy} className="w-full py-3 rounded-full font-bold border transition-all flex items-center justify-center gap-2 border-white/50 bg-white/50 hover:bg-white text-brand-text shadow-sm hover:scale-[1.02] active:scale-95">
                            <MessageSquare size={18} /> Copier le récapitulatif
                        </button>
                        <button onClick={addToCalendar} className="w-full py-3 rounded-full font-bold transition-all flex items-center justify-center gap-2 bg-brand-teal text-white hover:bg-brand-teal/90 shadow-soft hover:scale-[1.02] active:scale-95">
                            <CalendarPlus size={18} /> Ajouter au calendrier
                        </button>
                        <button onClick={onBack} className="w-full py-3 rounded-full font-bold transition-all bg-white/30 hover:bg-white/50 text-brand-text shadow-sm">
                            Retour
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans pb-32 md:pb-24 bg-brand-bg text-brand-text">
            <header className="p-4 px-6 flex items-center gap-4 sticky top-0 z-40 shadow-md backdrop-blur-md bg-white/40 border-b border-white/50">
                <button onClick={onBack} className="p-2 rounded-full transition-colors bg-white/50 hover:bg-white text-brand-text shadow-sm"><ArrowLeft size={20} /></button>
                <h1 className="font-black text-lg truncate text-brand-text tracking-tight">{event.title}</h1>
            </header>

            <main className="p-6 max-w-2xl mx-auto space-y-6 mt-4">

                {/* Infos Activité (COMMUN) */}
                {(event.date || event.address) && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-[20px] border shadow-soft flex flex-col items-center text-center gap-2 bg-white/50 border-white/50">
                                <div className={`${themeBg} p-3 rounded-full ${themeColor} shadow-inner bg-white/60`}><Clock size={24} /></div>
                                <div><div className="text-[10px] font-bold text-brand-text/50 uppercase tracking-wider">Quand ?</div><div className="font-bold text-sm text-brand-text">{event.date || 'À définir'} <br /> {event.time}</div></div>
                            </div>
                            <div className="p-4 rounded-[20px] border shadow-soft flex flex-col items-center text-center gap-2 bg-white/50 border-white/50">
                                <div className={`${themeBg} p-3 rounded-full ${themeColor} shadow-inner bg-white/60`}><MapPin size={24} /></div>
                                <div><div className="text-[10px] font-bold text-brand-text/50 uppercase tracking-wider">Où ?</div><div className="font-bold text-sm text-brand-text">{event.address || 'Non spécifié'}</div></div>
                            </div>
                        </div>

                        {event.address && (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full h-48 rounded-[20px] overflow-hidden border shadow-soft relative group border-white/60"
                            >
                                <iframe
                                    title="Map Preview"
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    scrolling="no"
                                    marginHeight="0"
                                    marginWidth="0"
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(event.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                    className="w-full h-full object-cover pointer-events-none group-hover:opacity-80 transition-opacity"
                                ></iframe>
                                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-brand-coral/10 transition-colors backdrop-blur-[1px]">
                                    <span className="bg-white text-brand-text text-xs font-bold px-4 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                        <MapPin size={14} className="text-brand-coral" /> Voir sur Maps
                                    </span>
                                </div>
                            </a>
                        )}
                    </div>
                )}

                {/* Description (COMMUN) */}
                {event.description && (
                    <div className="p-6 rounded-[20px] shadow-soft border flex gap-4 items-start bg-white/50 border-white/50">
                        <Info className="text-brand-teal shrink-0 mt-1" size={20} />
                        <p className="italic text-sm text-brand-text/80 font-medium">{event.description}</p>
                    </div>
                )}

                {/* LOGIQUE DE VERROUILLAGE */}
                {event.isLocked ? (
                    <div className="border border-white/50 shadow-soft rounded-[30px] p-8 text-center bg-white/60">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-brand-coral/10 text-brand-coral shadow-inner">
                            <Lock size={32} />
                        </div>
                        <h3 className="text-xl font-black mb-2 text-brand-text">Inscriptions closes</h3>
                        <p className="text-brand-text/60 font-medium">Il n'est plus possible de s'inscrire à cet événement.</p>
                        <button onClick={onBack} className="mt-6 text-sm text-brand-coral font-bold hover:underline">Retourner à la liste</button>
                    </div>
                ) : (
                    <>
                        <section className="p-6 rounded-[20px] shadow-soft border bg-white/50 border-white/50">
                            <h3 className="text-xs font-bold uppercase mb-4 flex items-center gap-2 text-brand-teal tracking-wider"><User size={16} /> Qui êtes-vous ?</h3>
                            <div className="space-y-4">
                                <input required placeholder="Votre Prénom" className="w-full border rounded-xl p-3 font-bold outline-none focus:border-brand-teal transition-colors bg-white/60 border-white text-brand-text placeholder-brand-text/40 shadow-inner" value={formEntry.firstName} onChange={e => setFormEntry({ ...formEntry, firstName: e.target.value })} />
                                <input required placeholder="Votre Nom" className="w-full border rounded-xl p-3 font-bold outline-none focus:border-brand-teal transition-colors bg-white/60 border-white text-brand-text placeholder-brand-text/40 shadow-inner" value={formEntry.lastName} onChange={e => setFormEntry({ ...formEntry, lastName: e.target.value })} />
                            </div>
                        </section>

                        {event.hasApero && event.aperoChoices && (
                            <section className="p-6 rounded-[20px] shadow-soft border bg-white/50 border-white/50">
                                <h3 className="text-xs font-bold uppercase mb-4 flex items-center gap-2 text-brand-peach tracking-wider"><Wine size={16} /> Apéritif offert</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {event.aperoChoices.map((choice, idx) => {
                                        const isSelected = formEntry.selections['Apéritif'] === `APERO:${choice}`;
                                        return (
                                            <button key={idx} type="button" onClick={() => handleAperoChange(choice)} className={`p-4 rounded-xl border-2 font-bold text-sm transition-all ${isSelected ? 'border-brand-peach bg-brand-peach/10 text-brand-peach shadow-sm' : 'border-white/60 bg-white/30 text-brand-text/60 hover:bg-white hover:border-white shadow-inner'}`}>{choice}</button>
                                        )
                                    })}
                                </div>
                            </section>
                        )}

                        {/* CHOIX REPAS */}
                        {event.type === TEMPLATE_REPAS && (
                            <section className="p-6 rounded-[20px] shadow-soft border bg-white/50 border-white/50">
                                <h3 className="text-xs font-bold uppercase mb-4 flex items-center gap-2 text-brand-coral tracking-wider"><Utensils size={16} /> Votre Repas</h3>

                                {/* TABS SI MENUS EXISTENT */}
                                {event.menus && event.menus.length > 0 && (
                                    <div className="flex p-1 rounded-xl border mb-6 bg-white/40 border-white shadow-inner">
                                        <button
                                            onClick={() => handleTypeChange('carte')}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formEntry.selectionType === 'carte' ? 'bg-white text-brand-text shadow-soft scale-[1.02]' : 'text-brand-text/50 hover:text-brand-text'}`}
                                        >
                                            À la carte
                                        </button>
                                        {event.menus.map(menu => (
                                            <button
                                                key={menu.id}
                                                onClick={() => handleTypeChange(menu.id)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formEntry.selectionType === menu.id ? 'bg-white text-brand-text shadow-soft scale-[1.02]' : 'text-brand-text/50 hover:text-brand-text'}`}
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
                                                    <label className="block text-xs font-bold uppercase mb-2 text-brand-text/60">{type}</label>
                                                    <div className="relative">
                                                        <select
                                                            value={formEntry.selections[type] || ""}
                                                            onChange={e => handleSelectionChange(type, e.target.value)}
                                                            className="w-full p-3 rounded-xl border appearance-none outline-none transition-colors bg-white/70 border-white/50 text-brand-text font-medium focus:border-brand-teal shadow-inner"
                                                        >
                                                            <option value="">-- Choisir --</option>
                                                            {event.carte[type].map((item, idx) => (
                                                                <option key={idx} value={`${item.name}|${item.price}`}>
                                                                    {item.name} {event.isPaid && item.price > 0 ? `(+${item.price}€)` : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-brand-teal">
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
                                    <div className="p-4 rounded-xl border bg-white/60 border-white/50 shadow-inner">
                                        {(() => {
                                            const menu = event.menus.find(m => m.id === formEntry.selectionType);
                                            return menu ? (
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center border-b border-brand-text/10 pb-2 mb-2">
                                                        <span className="font-bold text-brand-text">{menu.name}</span>
                                                        {event.isPaid && <span className="font-bold text-brand-coral">{menu.price}€</span>}
                                                    </div>
                                                    {['entrees', 'plats', 'desserts'].map(type => (
                                                        menu[type] && menu[type].length > 0 && (
                                                            <div key={type}>
                                                                <label className="block text-[10px] tracking-wider font-bold uppercase mb-2 text-brand-text/50">{type}</label>
                                                                <div className="relative">
                                                                    <select
                                                                        value={formEntry.selections[type] || ""}
                                                                        onChange={e => handleSelectionChange(type, e.target.value)}
                                                                        className="w-full p-3 rounded-xl border appearance-none outline-none transition-colors bg-white/70 border-white text-brand-text font-medium focus:border-brand-teal shadow-sm"
                                                                    >
                                                                        <option value="">-- Choisir --</option>
                                                                        {menu[type].map((item, i) => (
                                                                            <option key={i} value={item}>{item}</option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-brand-teal">
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
                            <section className="p-6 rounded-[20px] shadow-soft border bg-white/50 border-white/50">
                                <h3 className="text-xs font-bold uppercase mb-4 flex items-center gap-2 text-brand-teal tracking-wider"><List size={16} /> Options</h3>
                                <div className="space-y-2">
                                    {event.activityOptions.map((opt, idx) => (
                                        <label key={idx} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${formEntry.selections[opt.name] ? 'border-brand-teal bg-white shadow-soft scale-[1.01]' : 'border-white/50 bg-white/40 hover:bg-white/60 shadow-inner'}`}>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded border border-white/80 bg-white/50 checked:bg-brand-teal accent-brand-teal shadow-inner cursor-pointer"
                                                    checked={!!formEntry.selections[opt.name]}
                                                    onChange={(e) => handleOptionCheck(opt.name, opt.price, e.target.checked)}
                                                />
                                                <span className={`font-bold ${formEntry.selections[opt.name] ? 'text-brand-text' : 'text-brand-text/70'}`}>{opt.name}</span>
                                            </div>
                                            {event.isPaid && <span className="font-bold text-brand-text/50">{opt.price}€</span>}
                                        </label>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="p-6 rounded-[20px] shadow-soft border bg-white/50 border-white/50">
                            <h3 className="text-xs font-bold uppercase mb-2 flex items-center gap-2 text-brand-teal tracking-wider"><MessageSquare size={16} /> Remarques</h3>
                            <textarea rows="2" className="w-full border rounded-xl p-3 text-sm focus:border-brand-teal outline-none resize-none bg-white/60 border-white text-brand-text placeholder-brand-text/40 shadow-inner font-medium" placeholder="Allergies, infos..." value={formEntry.comment} onChange={e => setFormEntry({ ...formEntry, comment: e.target.value })} />
                        </section>
                    </>
                )}
            </main>

            {!event.isLocked && (
                <div className="fixed bottom-0 left-0 right-0 border-t p-4 px-6 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 bg-white/80 backdrop-blur-md border-white/50 rounded-t-[30px]">
                    <div>
                        <p className="text-[10px] font-bold text-brand-text/50 uppercase tracking-widest">Total</p>
                        <p className="text-2xl font-black text-brand-text">{formEntry.total.toFixed(2)}€</p>
                    </div>
                    <button onClick={handleSubmit} disabled={submitting || !formEntry.firstName} className="bg-brand-coral hover:bg-brand-coral/90 text-white px-8 py-3 rounded-full font-bold shadow-soft transition-all disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:cursor-not-allowed">
                        {submitting ? '...' : 'Valider'}
                    </button>
                </div>
            )}
        </div>
    );
}