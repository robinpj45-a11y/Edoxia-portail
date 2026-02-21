import React, { useState, useContext } from 'react';
import {
  Settings, LayoutDashboard, Plus, ArrowLeft, Edit3, Unlock, Lock,
  Trash2, Download, Eye, CheckCircle, Circle
} from 'lucide-react';
import { updateDoc, doc, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { ADMIN_PASSWORD, TEMPLATE_REPAS, TEMPLATE_ACTIVITE } from '../constants';
import { ThemeContext } from '../../ThemeContext';

export default function AdminDashboard({ events, entries, user, onBack }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState('overview');
  const [editingEvent, setEditingEvent] = useState(null);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-brand-bg text-brand-text">
        <div className="p-8 rounded-[30px] shadow-2xl w-full max-w-md text-center border bg-white/90 backdrop-blur-md border-white/50">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-brand-teal/20 text-brand-teal shadow-inner"><Settings size={32} /></div>
          <h2 className="text-2xl font-black mb-2 text-brand-text">Administration</h2>
          <form onSubmit={(e) => { e.preventDefault(); if (password === "stpbb") setIsAuthenticated(true); else alert("Erreur"); }} className="flex flex-col gap-4 mt-6">
            <input type="password" className="w-full p-4 border rounded-xl outline-none text-center font-bold transition-colors bg-white/50 border-white text-brand-text focus:border-brand-teal shadow-inner placeholder-brand-text/30" autoFocus placeholder="Mot de passe..." value={password} onChange={e => setPassword(e.target.value)} />
            <button className="py-4 rounded-full font-bold shadow-soft transition-all active:scale-95 bg-brand-teal text-white hover:bg-brand-teal/90 hover:scale-[1.02]">Connexion</button>
          </form>
          <button onClick={onBack} className="mt-6 text-sm font-bold text-brand-text/50 hover:text-brand-text underline">Retour Accueil</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-brand-bg text-brand-text">
      {/* SIDEBAR ADMIN */}
      <aside className="hidden md:flex w-64 flex-col h-screen sticky top-0 shadow-2xl z-50 bg-white/80 backdrop-blur-md border-r border-white/50">
        <div className="p-6 border-b border-brand-text/10">
          <button onClick={onBack} className="flex items-center gap-2 text-brand-text/50 hover:text-brand-text transition-colors font-bold text-sm"><ArrowLeft size={18} /> Retour Site</button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <AdminTabButton active={activeTab === 'create'} onClick={() => { setActiveTab('create'); setEditingEvent(null); }} icon={<Plus size={20} />} label="Créer évènement" />
        </nav>
      </aside>

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-brand-bg">
        <header className="p-6 shadow-sm border-b flex justify-between items-center z-10 sticky top-0 bg-white/40 border-white/50 backdrop-blur-md">
          <div>
            <h2 className="text-2xl font-black text-brand-text tracking-tight">
              {activeTab === 'overview' && "Vue Globale"}
              {activeTab === 'create' && (editingEvent ? "Modifier l'évènement" : "Nouvel évènement")}
            </h2>
            <p className="text-xs text-brand-text/50 font-bold mt-1 uppercase tracking-wider">Administration</p>
          </div>
          <div className="text-sm font-bold px-4 py-2 rounded-full border bg-brand-coral/10 text-brand-coral border-brand-coral/20 shadow-sm">
            {events.length} évènement(s) actif(s)
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24">
          {activeTab === 'overview' && <AdminOverview events={events} entries={entries} onEdit={(e) => { setEditingEvent(e); setActiveTab('create'); }} />}
          {activeTab === 'create' && <AdminCreateForm eventToEdit={editingEvent} user={user} onFinish={() => setActiveTab('overview')} />}
        </div>
      </div>

      {/* MOBILE NAV ADMIN */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around p-3 pb-safe z-50 border-t shadow-[0_-10px_40px_rgba(0,0,0,0.05)] bg-white/90 backdrop-blur-md border-white/50 rounded-t-[30px]">
        <button onClick={() => setActiveTab('overview')} className={`p-2 rounded-xl transition-colors ${activeTab === 'overview' ? 'bg-brand-teal text-white shadow-soft' : 'text-brand-text/50 hover:text-brand-text hover:bg-black/5'}`}><LayoutDashboard size={24} /></button>
        <button onClick={() => { setActiveTab('create'); setEditingEvent(null); }} className={`p-2 rounded-xl transition-colors ${activeTab === 'create' ? 'bg-brand-teal text-white shadow-soft' : 'text-brand-text/50 hover:text-brand-text hover:bg-black/5'}`}><Plus size={24} /></button>
        <button onClick={onBack} className="p-2 text-brand-text/50 hover:text-brand-text hover:bg-black/5 transition-colors rounded-xl"><ArrowLeft size={24} /></button>
      </nav>
    </div>
  );
}

function AdminTabButton({ active, onClick, icon, label }) {
  return <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-[20px] transition-all font-bold ${active ? 'bg-brand-teal text-white shadow-soft scale-[1.02]' : 'text-brand-text/60 hover:bg-white/50 hover:text-brand-text'}`}>{icon}<span>{label}</span></button>
}

// --- ADMIN OVERVIEW ---
function AdminOverview({ events, entries, onEdit }) {
  const [expandedId, setExpandedId] = useState(null);

  const deleteEvent = async (id) => { if (confirm("Supprimer ?")) await deleteDoc(doc(db, 'events', id)); };

  const togglePaid = async (entryId, currentStatus) => {
    try { await updateDoc(doc(db, 'entries', entryId), { isPaid: !currentStatus }); }
    catch (err) { alert("Erreur mise à jour paiement"); }
  };

  const toggleEventLock = async (event) => {
    try { await updateDoc(doc(db, 'events', event.id), { isLocked: !event.isLocked }); }
    catch (err) { alert("Erreur verrouillage"); }
  };

  const exportCsv = (event) => {
    const eventEntries = entries.filter(e => e.eventId === event.id);
    const csv = "\ufeffNom;Prénom;Détail;Total;Payé\n" + eventEntries.map(e => `${e.lastName};${e.firstName};${JSON.stringify(e.selections).replace(/"/g, "'")};${e.total};${e.isPaid ? 'OUI' : 'NON'}`).join("\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); link.download = "export.csv"; link.click();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {events.map(e => {
        const isRepas = e.type === TEMPLATE_REPAS;
        const bgHeader = isRepas ? 'bg-brand-peach' : 'bg-brand-teal';
        const eventEntries = entries.filter(entry => entry.eventId === e.id);

        return (
          <div key={e.id} className="rounded-[30px] shadow-soft overflow-hidden border transition-all hover:-translate-y-1 hover:shadow-lg bg-white/60 border-white/50 flex flex-col">
            {/* Header Card */}
            <div className={`${bgHeader} p-5 flex justify-between items-center text-white shadow-sm`}>
              <div className="flex items-center gap-3">
                <h3 className="font-black text-lg tracking-tight">{e.title}</h3>
                <button onClick={() => onEdit(e)} className="text-white/70 hover:text-white hover:scale-110 transition-transform"><Edit3 size={16} /></button>
                <button onClick={() => toggleEventLock(e)} className={`text-white/80 hover:text-white transition-all hover:scale-110 ${e.isLocked ? 'text-red-200' : ''}`} title={e.isLocked ? "Déverrouiller" : "Verrouiller"}>
                  {e.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-black/10 px-3 py-1.5 rounded-full font-bold backdrop-blur-sm">{eventEntries.length} inscrits</span>
                <button onClick={() => deleteEvent(e.id)} className="text-white/70 hover:text-red-200 hover:scale-110 transition-transform"><Trash2 size={18} /></button>
              </div>
            </div>

            {/* Sub-header Actions */}
            <div className="px-5 py-3 border-b flex justify-between items-center text-xs font-bold bg-white/50 border-white text-brand-text/70">
              <span className="uppercase tracking-widest">{e.type}</span>
              <div className="flex gap-4">
                <button onClick={() => exportCsv(e)} className="flex items-center gap-1.5 hover:text-brand-teal transition-colors"><Download size={14} /> CSV</button>
                <button onClick={() => setExpandedId(expandedId === e.id ? null : e.id)} className={`flex items-center gap-1.5 transition-colors ${expandedId === e.id ? 'text-brand-teal' : 'hover:text-brand-teal'}`}><Eye size={14} /> {expandedId === e.id ? 'Masquer' : 'Voir'}</button>
              </div>
            </div>

            {/* Table Preview */}
            {expandedId === e.id && (
              <div className="max-h-80 overflow-y-auto p-2 bg-white/30 backdrop-blur-sm">
                <table className="w-full text-left text-sm border-separate border-spacing-y-1">
                  <thead className="text-[10px] uppercase font-bold sticky top-0 bg-white/80 backdrop-blur-md text-brand-text/50 z-10 rounded-xl">
                    <tr><th className="p-3">Nom</th><th className="p-3">Détails</th><th className="p-3 text-right">Total</th><th className="p-3 text-center">Paiement</th></tr>
                  </thead>
                  <tbody>
                    {eventEntries.map(ent => (
                      <tr key={ent.id} className="hover:bg-white/60 transition-colors bg-white/40 rounded-[10px] shadow-sm">
                        <td className="p-3 font-bold text-brand-text rounded-l-[10px]">{ent.lastName} {ent.firstName}</td>

                        {/* Affichage Menu ou Carte */}
                        <td className="p-3 text-xs text-brand-text/70">
                          <span className="inline-block px-2 py-1 rounded-md font-bold mr-2 uppercase tracking-wide bg-brand-teal/10 text-brand-teal">
                            {ent.selectionType === 'carte' ? 'À la carte' : (e.menus?.find(m => m.id === ent.selectionType)?.name || 'Menu')}
                          </span>
                          {Object.values(ent.selections).map(v => v && !v.startsWith('APERO:') && <span key={v} className="inline-block border px-1.5 py-0.5 rounded mr-1 bg-white/50 border-white text-brand-text/60 font-medium">{v.split('|')[0]}</span>)}
                          {Object.values(ent.selections).filter(v => v && v.toString().startsWith('APERO:')).map(v => (
                            <span key={v} className="inline-block border px-1.5 py-0.5 rounded font-bold mr-1 bg-brand-peach/10 text-brand-peach border-brand-peach/20">{v.split(':')[1]}</span>
                          ))}
                        </td>

                        <td className="p-3 text-right font-mono font-bold text-brand-coral">{ent.total}€</td>

                        <td className="p-3 text-center rounded-r-[10px]">
                          {ent.total > 0 ? (
                            <button
                              onClick={() => togglePaid(ent.id, ent.isPaid)}
                              className={`p-1.5 rounded-full transition-all flex items-center justify-center mx-auto hover:scale-110 ${ent.isPaid ? 'bg-green-500/20 text-green-600 shadow-inner' : 'bg-black/5 text-brand-text/30 hover:bg-brand-text/10'}`}
                              title={ent.isPaid ? "Payé" : "Marquer comme payé"}
                            >
                              {ent.isPaid ? <CheckCircle size={16} /> : <Circle size={16} />}
                            </button>
                          ) : <span className="text-xs text-brand-text/30 font-bold p-1.5">-</span>}
                        </td>
                      </tr>
                    ))}
                    {eventEntries.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-brand-text/40 italic font-medium">Aucune inscription</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// --- ADMIN CREATE FORM ---
function AdminCreateForm({ eventToEdit, user, onFinish }) {
  const [data, setData] = useState(eventToEdit || {
    title: '', description: '', type: TEMPLATE_REPAS, isPaid: false,
    menus: [], carte: { entrees: [], plats: [], desserts: [] },
    date: '', time: '', address: '', price: 0, activityOptions: [],
    hasApero: false, aperoChoices: ['', ''],
    isLocked: false
  });

  const save = async () => {
    if (!data.title) return;
    if (eventToEdit) await updateDoc(doc(db, 'events', eventToEdit.id), data);
    else await addDoc(collection(db, 'events'), { ...data, createdAt: serverTimestamp(), creatorId: user.uid });
    onFinish();
  };

  // Helpers
  const addMenu = () => setData(p => ({ ...p, menus: [...p.menus, { id: Date.now().toString(), name: 'Menu', price: 0, entrees: [], plats: [], desserts: [] }] }));
  const updateMenu = (id, k, v) => setData(p => ({ ...p, menus: p.menus.map(m => m.id === id ? { ...m, [k]: v } : m) }));
  const addMenuItem = (mId, type) => setData(p => ({ ...p, menus: p.menus.map(m => m.id === mId ? { ...m, [type]: [...m[type], ''] } : m) }));
  const updateMenuItem = (mId, type, idx, val) => setData(p => ({ ...p, menus: p.menus.map(m => m.id !== mId ? m : { ...m, [type]: m[type].map((v, i) => i === idx ? val : v) }) }));

  const addCarteItem = (type) => setData(p => ({ ...p, carte: { ...p.carte, [type]: [...p.carte[type], { name: '', price: 0 }] } }));
  const updateCarteItem = (type, idx, k, v) => setData(p => ({ ...p, carte: { ...p.carte, [type]: p.carte[type].map((it, i) => i === idx ? { ...it, [k]: v } : it) } }));

  const addOption = () => setData(p => ({ ...p, activityOptions: [...p.activityOptions, { name: '', price: 0 }] }));
  const updateOption = (idx, k, v) => setData(p => ({ ...p, activityOptions: p.activityOptions.map((o, i) => i === idx ? { ...o, [k]: v } : o) }));

  const updateAperoChoice = (idx, val) => {
    const newChoices = [...data.aperoChoices];
    newChoices[idx] = val;
    setData({ ...data, aperoChoices: newChoices });
  };

  const inputClass = "w-full border rounded-xl p-3 font-bold outline-none transition-colors bg-white/60 border-white text-brand-text placeholder-brand-text/40 focus:border-brand-teal shadow-inner";
  const labelClass = "text-[10px] font-bold uppercase mb-1 text-brand-text/50 tracking-wider";

  return (
    <div className="p-8 rounded-[30px] shadow-soft border max-w-3xl mx-auto bg-white/60 border-white/50 backdrop-blur-sm">
      <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-brand-teal tracking-tight">
        {eventToEdit ? <Edit3 size={24} /> : <Plus size={24} />} Configuration
      </h3>

      <div className="space-y-4">
        <div><label className={labelClass}>Titre</label><input className={inputClass} value={data.title} onChange={e => setData({ ...data, title: e.target.value })} /></div>

        <div className="flex gap-4">
          <button onClick={() => setData({ ...data, type: TEMPLATE_REPAS })} className={`flex-1 py-3 rounded-2xl font-bold border-2 transition-all ${data.type === TEMPLATE_REPAS ? 'border-brand-peach text-brand-peach bg-brand-peach/10 shadow-sm scale-[1.02]' : 'border-white/60 bg-white/30 text-brand-text/50 hover:bg-white hover:border-white shadow-inner'}`}>Repas</button>
          <button onClick={() => setData({ ...data, type: TEMPLATE_ACTIVITE })} className={`flex-1 py-3 rounded-2xl font-bold border-2 transition-all ${data.type === TEMPLATE_ACTIVITE ? 'border-brand-teal text-brand-teal bg-brand-teal/10 shadow-sm scale-[1.02]' : 'border-white/60 bg-white/30 text-brand-text/50 hover:bg-white hover:border-white shadow-inner'}`}>Activité</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelClass}>Date</label><input type="date" className={inputClass} value={data.date} onChange={e => setData({ ...data, date: e.target.value })} /></div>
          <div><label className={labelClass}>Heure</label><input type="time" className={inputClass} value={data.time} onChange={e => setData({ ...data, time: e.target.value })} /></div>
        </div>
        <div><label className={labelClass}>Adresse</label><input className={inputClass} value={data.address} onChange={e => setData({ ...data, address: e.target.value })} /></div>
        <div><label className={labelClass}>Description</label><textarea rows="3" className={inputClass} value={data.description} onChange={e => setData({ ...data, description: e.target.value })} /></div>

        <div className="flex items-center gap-3 py-2">
          <input type="checkbox" id="isPaid" className="w-5 h-5 accent-cyan-600" checked={data.isPaid} onChange={e => setData({ ...data, isPaid: e.target.checked })} />
          <label htmlFor="isPaid" className="font-bold text-brand-text">Évènement payant ?</label>
        </div>

        {data.isPaid && data.type === TEMPLATE_ACTIVITE && (
          <div><label className={labelClass}>Prix par personne (€)</label><input type="number" className={inputClass} value={data.price} onChange={e => setData({ ...data, price: e.target.value })} /></div>
        )}

        {/* CONFIGURATION REPAS */}
        {data.type === TEMPLATE_REPAS && (
          <div className="space-y-6 mt-6 border-t border-slate-200 pt-6">
            {/* APERO */}
            <div className="p-4 rounded-2xl border bg-white/50 border-white/50 shadow-inner">
              <div className="flex items-center gap-3 mb-4">
                <input type="checkbox" id="hasApero" className="w-5 h-5 accent-brand-peach" checked={data.hasApero} onChange={e => setData({ ...data, hasApero: e.target.checked })} />
                <label htmlFor="hasApero" className="font-bold text-brand-peach">Proposer un apéritif ?</label>
              </div>
              {data.hasApero && (
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Choix 1 (ex: Sangria)" className={inputClass} value={data.aperoChoices[0]} onChange={e => updateAperoChoice(0, e.target.value)} />
                  <input placeholder="Choix 2 (ex: Jus d'orange)" className={inputClass} value={data.aperoChoices[1]} onChange={e => updateAperoChoice(1, e.target.value)} />
                </div>
              )}
            </div>

            {/* MENUS */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className={labelClass}>Menus</label>
                <button onClick={addMenu} className="text-xs bg-brand-teal/20 text-brand-teal px-3 py-1.5 rounded-full hover:bg-brand-teal/30 font-bold transition-colors">+ Ajouter Menu</button>
              </div>
              {data.menus.map((menu, idx) => (
                <div key={menu.id} className="p-4 rounded-2xl border mb-4 bg-white/50 border-white/50 shadow-inner">
                  <div className="flex gap-2 mb-4">
                    <input placeholder="Nom du menu" className={inputClass} value={menu.name} onChange={e => updateMenu(menu.id, 'name', e.target.value)} />
                    {data.isPaid && <input type="number" placeholder="Prix" className={`w-24 ${inputClass}`} value={menu.price} onChange={e => updateMenu(menu.id, 'price', e.target.value)} />}
                    <button onClick={() => setData(p => ({ ...p, menus: p.menus.filter(m => m.id !== menu.id) }))} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {['entrees', 'plats', 'desserts'].map(type => (
                      <div key={type}>
                        <div className="flex justify-between mb-1 items-center"><span className="text-[10px] uppercase font-bold text-brand-text/50">{type}</span><button onClick={() => addMenuItem(menu.id, type)} className="text-[10px] bg-black/5 hover:bg-black/10 text-brand-text/60 px-2 rounded-md transition-colors">+</button></div>
                        {menu[type].map((item, i) => (
                          <div key={i} className="flex gap-1 mb-1">
                            <input className="text-xs p-2 w-full rounded border bg-white/70 border-white text-brand-text font-medium outline-none focus:border-brand-teal" value={item} onChange={e => updateMenuItem(menu.id, type, i, e.target.value)} />
                            <button onClick={() => setData(p => ({ ...p, menus: p.menus.map(m => m.id !== menu.id ? m : { ...m, [type]: m[type].filter((_, idx) => idx !== i) }) }))} className="text-red-400 text-xs">x</button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* CARTE */}
            <div>
              <label className={labelClass}>À la carte</label>
              <div className="p-4 rounded-2xl border grid grid-cols-3 gap-4 bg-white/50 border-white/50 shadow-inner">
                {['entrees', 'plats', 'desserts'].map(type => (
                  <div key={type}>
                    <div className="flex justify-between mb-2 items-center"><span className="text-[10px] font-bold uppercase text-brand-text/50">{type}</span><button onClick={() => addCarteItem(type)} className="text-[10px] bg-black/5 hover:bg-black/10 text-brand-text/60 px-2 rounded-md font-bold transition-colors">+</button></div>
                    {data.carte[type].map((item, i) => (
                      <div key={i} className="flex gap-1 mb-2">
                        <input placeholder="Nom" className="text-xs p-2 w-full rounded border bg-white/70 border-white text-brand-text font-medium outline-none focus:border-brand-teal" value={item.name} onChange={e => updateCarteItem(type, i, 'name', e.target.value)} />
                        {data.isPaid && <input type="number" placeholder="€" className="text-xs p-2 w-16 rounded border bg-white/70 border-white text-brand-text font-medium outline-none focus:border-brand-teal" value={item.price} onChange={e => updateCarteItem(type, i, 'price', e.target.value)} />}
                        <button onClick={() => setData(p => ({ ...p, carte: { ...p.carte, [type]: p.carte[type].filter((_, idx) => idx !== i) } }))} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <button onClick={save} className="w-full font-bold py-4 rounded-full shadow-soft mt-4 transition-all active:scale-95 bg-brand-teal text-white hover:bg-brand-teal/90 hover:scale-[1.02]">Sauvegarder</button>
      </div>
    </div>
  )
}