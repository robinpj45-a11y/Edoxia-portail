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
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState('overview'); 
  const [editingEvent, setEditingEvent] = useState(null);

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-[#020617]' : 'bg-slate-100'}`}>
        <div className={`p-8 rounded-2xl shadow-xl w-full max-w-md text-center border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-600 text-white'}`}><Settings size={32} /></div>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Administration</h2>
          <form onSubmit={(e) => { e.preventDefault(); if(password === ADMIN_PASSWORD) setIsAuthenticated(true); else alert("Erreur"); }} className="flex flex-col gap-4 mt-6">
            <input type="password" className={`w-full p-4 border rounded-xl outline-none text-center font-bold transition-colors ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-cyan-600'}`} autoFocus placeholder="Mot de passe..." value={password} onChange={e => setPassword(e.target.value)} />
            <button className={`py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${isDark ? 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-cyan-900/20' : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-cyan-200'}`}>Connexion</button>
          </form>
          <button onClick={onBack} className={`mt-6 text-sm underline ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>Retour Accueil</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans ${isDark ? 'bg-[#020617] text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
      {/* SIDEBAR ADMIN */}
      <aside className={`hidden md:flex w-64 flex-col h-screen sticky top-0 shadow-2xl z-50 ${isDark ? 'bg-slate-900 border-r border-slate-800' : 'bg-slate-900 text-white'}`}>
        <div className={`p-6 border-b flex items-center gap-3 ${isDark ? 'border-slate-800' : 'border-slate-800'}`}>
            <div className="bg-cyan-500/20 text-cyan-400 p-2 rounded-lg"><LayoutDashboard size={20}/></div>
            <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-white'}`}>Admin <span className="text-cyan-400">Panel</span></h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <AdminTabButton active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setEditingEvent(null); }} icon={<LayoutDashboard size={20}/>} label="Vue d'ensemble" isDark={isDark} />
          <AdminTabButton active={activeTab === 'create'} onClick={() => { setActiveTab('create'); setEditingEvent(null); }} icon={<Plus size={20}/>} label="Créer évènement" isDark={isDark} />
        </nav>
        <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-800'}`}><button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-full p-2 font-bold text-sm"><ArrowLeft size={18} /> Retour Site</button></div>
      </aside>

      {/* CONTENT AREA */}
      <div className={`flex-1 flex flex-col h-screen overflow-hidden ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
        <header className={`p-6 shadow-sm border-b flex justify-between items-center z-10 sticky top-0 ${isDark ? 'bg-slate-900/80 border-slate-800 backdrop-blur-md' : 'bg-white border-slate-200'}`}>
           <div>
               <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {activeTab === 'overview' && "Vue Globale"}
                  {activeTab === 'create' && (editingEvent ? "Modifier l'évènement" : "Nouvel évènement")}
               </h2>
               <p className="text-xs text-slate-500 font-medium mt-1">Gérez vos inscriptions et activités</p>
           </div>
           <div className={`text-sm font-bold px-4 py-2 rounded-xl border ${isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                {events.length} évènement(s) actif(s)
           </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24">
           {activeTab === 'overview' && <AdminOverview events={events} entries={entries} onEdit={(e) => { setEditingEvent(e); setActiveTab('create'); }} isDark={isDark} />}
           {activeTab === 'create' && <AdminCreateForm eventToEdit={editingEvent} user={user} onFinish={() => setActiveTab('overview')} isDark={isDark} />}
        </div>
      </div>

      {/* MOBILE NAV ADMIN */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 flex justify-around p-3 pb-safe z-50 border-t shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-900 text-white border-slate-800'}`}>
         <button onClick={() => setActiveTab('overview')} className={`p-2 rounded-xl ${activeTab === 'overview' ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}><LayoutDashboard size={24}/></button>
         <button onClick={() => { setActiveTab('create'); setEditingEvent(null); }} className={`p-2 rounded-xl ${activeTab === 'create' ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}><Plus size={24}/></button>
         <button onClick={onBack} className="p-2 text-slate-500"><ArrowLeft size={24}/></button>
      </nav>
    </div>
  );
}

function AdminTabButton({ active, onClick, icon, label, isDark }) {
  return <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${active ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>{icon}<span>{label}</span></button>
}

// --- ADMIN OVERVIEW ---
function AdminOverview({ events, entries, onEdit, isDark }) {
  const [expandedId, setExpandedId] = useState(null);

  const deleteEvent = async (id) => { if(confirm("Supprimer ?")) await deleteDoc(doc(db, 'events', id)); };
  
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
     const csv = "\ufeffNom;Prénom;Détail;Total;Payé\n" + eventEntries.map(e => `${e.lastName};${e.firstName};${JSON.stringify(e.selections).replace(/"/g,"'")};${e.total};${e.isPaid ? 'OUI' : 'NON'}`).join("\n");
     const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8;'})); link.download = "export.csv"; link.click();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
       {events.map(e => {
          const isRepas = e.type === TEMPLATE_REPAS;
          const color = isRepas ? '#f97316' : '#06b6d4';
          const bgHeader = isRepas ? 'bg-orange-500' : 'bg-cyan-600';
          const eventEntries = entries.filter(entry => entry.eventId === e.id);
          
          return (
             <div key={e.id} className={`rounded-2xl shadow-sm overflow-hidden border-2 transition-all hover:shadow-md ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`} style={{ borderColor: isDark ? undefined : color }}>
                {/* Header Card */}
                <div className={`${bgHeader} p-4 flex justify-between items-center text-white`}>
                   <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg">{e.title}</h3>
                      <button onClick={() => onEdit(e)} className="text-white/70 hover:text-white"><Edit3 size={16}/></button>
                      <button onClick={() => toggleEventLock(e)} className={`text-white/80 hover:text-white transition-colors ${e.isLocked ? 'text-red-200' : ''}`} title={e.isLocked ? "Déverrouiller" : "Verrouiller"}>
                        {e.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                      </button>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="text-xs bg-white/20 px-2 py-1 rounded border border-white/30 font-bold">{eventEntries.length} inscrits</span>
                      <button onClick={() => deleteEvent(e.id)} className="text-white/70 hover:text-red-200"><Trash2 size={18}/></button>
                   </div>
                </div>

                {/* Sub-header Actions */}
                <div className={`px-4 py-2 border-b flex justify-between items-center text-xs font-bold ${isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                   <span className="uppercase tracking-wider">{e.type}</span>
                   <div className="flex gap-2">
                      <button onClick={() => exportCsv(e)} className="flex items-center gap-1 hover:text-cyan-500"><Download size={14}/> CSV</button>
                      <button onClick={() => setExpandedId(expandedId === e.id ? null : e.id)} className={`flex items-center gap-1 hover:text-cyan-500 ${expandedId === e.id ? 'text-cyan-500' : ''}`}><Eye size={14}/> {expandedId === e.id ? 'Masquer' : 'Voir'}</button>
                   </div>
                </div>

                {/* Table Preview */}
                {expandedId === e.id && (
                   <div className="max-h-60 overflow-y-auto p-0">
                      <table className="w-full text-left text-sm">
                         <thead className={`text-[10px] uppercase font-bold sticky top-0 ${isDark ? 'bg-slate-950 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
                            <tr><th className="p-3">Nom</th><th className="p-3">Détails</th><th className="p-3 text-right">Total</th><th className="p-3 text-center">Paiement</th></tr>
                         </thead>
                         <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                            {eventEntries.map(ent => (
                               <tr key={ent.id} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                                  <td className={`p-3 font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{ent.lastName} {ent.firstName}</td>
                                  
                                  {/* Affichage Menu ou Carte */}
                                  <td className={`p-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                     <span className={`inline-block px-2 py-1 rounded font-bold mr-2 uppercase tracking-wide ${ent.selectionType === 'carte' ? (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500') : (isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600')}`}>
                                        {ent.selectionType === 'carte' ? 'À la carte' : (e.menus?.find(m => m.id === ent.selectionType)?.name || 'Menu')}
                                     </span>
                                     {Object.values(ent.selections).map(v => v && !v.startsWith('APERO:') && <span key={v} className={`inline-block border px-1.5 py-0.5 rounded mr-1 ${isDark ? 'bg-slate-950 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>{v.split('|')[0]}</span>)}
                                     {Object.values(ent.selections).filter(v => v && v.toString().startsWith('APERO:')).map(v => (
                                         <span key={v} className={`inline-block border px-1.5 py-0.5 rounded font-bold mr-1 ${isDark ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-pink-50 text-pink-600 border-pink-100'}`}>{v.split(':')[1]}</span>
                                     ))}
                                  </td>

                                  <td className={`p-3 text-right font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{ent.total}€</td>
                                  
                                  <td className="p-3 text-center">
                                      {ent.total > 0 ? (
                                          <button 
                                            onClick={() => togglePaid(ent.id, ent.isPaid)}
                                            className={`p-1.5 rounded-full transition-all ${ent.isPaid ? (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600') : (isDark ? 'bg-slate-800 text-slate-500 hover:bg-slate-700' : 'bg-slate-100 text-slate-300 hover:bg-slate-200')}`}
                                            title={ent.isPaid ? "Payé" : "Marquer comme payé"}
                                          >
                                              {ent.isPaid ? <CheckCircle size={16}/> : <Circle size={16}/>}
                                          </button>
                                      ) : <span className="text-xs text-slate-300">-</span>}
                                  </td>
                               </tr>
                            ))}
                            {eventEntries.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-slate-500 italic">Aucune inscription</td></tr>}
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
function AdminCreateForm({ eventToEdit, user, onFinish, isDark }) {
  const [data, setData] = useState(eventToEdit || {
    title: '', description: '', type: TEMPLATE_REPAS, isPaid: false,
    menus: [], carte: { entrees: [], plats: [], desserts: [] },
    date: '', time: '', address: '', price: 0, activityOptions: [],
    hasApero: false, aperoChoices: ['', ''],
    isLocked: false
  });

  const save = async () => {
     if(!data.title) return;
     if(eventToEdit) await updateDoc(doc(db, 'events', eventToEdit.id), data);
     else await addDoc(collection(db, 'events'), { ...data, createdAt: serverTimestamp(), creatorId: user.uid });
     onFinish();
  };

  // Helpers
  const addMenu = () => setData(p => ({ ...p, menus: [...p.menus, { id: Date.now().toString(), name: 'Menu', price: 0, entrees: [], plats: [], desserts: [] }] }));
  const updateMenu = (id, k, v) => setData(p => ({ ...p, menus: p.menus.map(m => m.id === id ? { ...m, [k]: v } : m) }));
  const addMenuItem = (mId, type) => setData(p => ({ ...p, menus: p.menus.map(m => m.id === mId ? { ...m, [type]: [...m[type], ''] } : m) }));
  const updateMenuItem = (mId, type, idx, val) => setData(p => ({ ...p, menus: p.menus.map(m => m.id !== mId ? m : { ...m, [type]: m[type].map((v, i) => i === idx ? val : v) }) }));
  
  const addCarteItem = (type) => setData(p => ({ ...p, carte: { ...p.carte, [type]: [...p.carte[type], {name:'', price:0}] } }));
  const updateCarteItem = (type, idx, k, v) => setData(p => ({ ...p, carte: { ...p.carte, [type]: p.carte[type].map((it, i) => i === idx ? {...it, [k]: v} : it) } }));

  const addOption = () => setData(p => ({ ...p, activityOptions: [...p.activityOptions, {name:'', price:0}] }));
  const updateOption = (idx, k, v) => setData(p => ({ ...p, activityOptions: p.activityOptions.map((o, i) => i === idx ? {...o, [k]: v} : o) }));

  const updateAperoChoice = (idx, val) => {
      const newChoices = [...data.aperoChoices];
      newChoices[idx] = val;
      setData({ ...data, aperoChoices: newChoices });
  };

  const inputClass = `w-full border rounded-xl p-3 font-bold outline-none ${isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500' : 'bg-white border-slate-200 text-slate-800 focus:border-cyan-600'}`;
  const labelClass = `text-xs font-bold uppercase mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`;

  return (
     <div className={`p-8 rounded-2xl shadow-sm border max-w-3xl mx-auto ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
           {eventToEdit ? <Edit3/> : <Plus/>} Configuration
        </h3>
        
        <div className="space-y-4">
           <div><label className={labelClass}>Titre</label><input className={inputClass} value={data.title} onChange={e => setData({...data, title: e.target.value})} /></div>
           
           <div className="flex gap-4">
              <button onClick={() => setData({...data, type: TEMPLATE_REPAS})} className={`flex-1 py-3 rounded-xl font-bold border-2 transition-colors ${data.type === TEMPLATE_REPAS ? (isDark ? 'border-orange-500 text-orange-400 bg-orange-500/10' : 'border-orange-500 text-orange-600 bg-orange-50') : (isDark ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400')}`}>Repas</button>
              <button onClick={() => setData({...data, type: TEMPLATE_ACTIVITE})} className={`flex-1 py-3 rounded-xl font-bold border-2 transition-colors ${data.type === TEMPLATE_ACTIVITE ? (isDark ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-cyan-600 text-cyan-600 bg-blue-50') : (isDark ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400')}`}>Activité</button>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
               <div><label className={labelClass}>Date</label><input type="date" className={inputClass} value={data.date} onChange={e => setData({...data, date: e.target.value})} /></div>
               <div><label className={labelClass}>Heure</label><input type="time" className={inputClass} value={data.time} onChange={e => setData({...data, time: e.target.value})} /></div>
           </div>
           <div><label className={labelClass}>Adresse</label><input className={inputClass} value={data.address} onChange={e => setData({...data, address: e.target.value})} /></div>
           <div><label className={labelClass}>Description</label><textarea rows="3" className={inputClass} value={data.description} onChange={e => setData({...data, description: e.target.value})} /></div>

           <div className="flex items-center gap-3 py-2">
               <input type="checkbox" id="isPaid" className="w-5 h-5 accent-cyan-600" checked={data.isPaid} onChange={e => setData({...data, isPaid: e.target.checked})} />
               <label htmlFor="isPaid" className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Évènement payant ?</label>
           </div>

           {data.isPaid && data.type === TEMPLATE_ACTIVITE && (
               <div><label className={labelClass}>Prix par personne (€)</label><input type="number" className={inputClass} value={data.price} onChange={e => setData({...data, price: e.target.value})} /></div>
           )}

           {/* CONFIGURATION REPAS */}
           {data.type === TEMPLATE_REPAS && (
               <div className="space-y-6 mt-6 border-t border-slate-200 pt-6">
                   {/* APERO */}
                   <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                       <div className="flex items-center gap-3 mb-4">
                           <input type="checkbox" id="hasApero" className="w-5 h-5 accent-pink-500" checked={data.hasApero} onChange={e => setData({...data, hasApero: e.target.checked})} />
                           <label htmlFor="hasApero" className={`font-bold ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>Proposer un apéritif ?</label>
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
                           <button onClick={addMenu} className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded hover:bg-cyan-200 font-bold">+ Ajouter Menu</button>
                       </div>
                       {data.menus.map((menu, idx) => (
                           <div key={menu.id} className={`p-4 rounded-xl border mb-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                               <div className="flex gap-2 mb-4">
                                   <input placeholder="Nom du menu" className={inputClass} value={menu.name} onChange={e => updateMenu(menu.id, 'name', e.target.value)} />
                                   {data.isPaid && <input type="number" placeholder="Prix" className={`w-24 ${inputClass}`} value={menu.price} onChange={e => updateMenu(menu.id, 'price', e.target.value)} />}
                                   <button onClick={() => setData(p => ({...p, menus: p.menus.filter(m => m.id !== menu.id)}))} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18}/></button>
                               </div>
                               <div className="grid grid-cols-3 gap-4">
                                   {['entrees', 'plats', 'desserts'].map(type => (
                                       <div key={type}>
                                           <div className="flex justify-between mb-1"><span className="text-[10px] uppercase font-bold opacity-50">{type}</span><button onClick={() => addMenuItem(menu.id, type)} className="text-[10px] bg-slate-200 px-1 rounded">+</button></div>
                                           {menu[type].map((item, i) => (
                                               <div key={i} className="flex gap-1 mb-1">
                                                   <input className={`text-xs p-1 w-full rounded border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-300'}`} value={item} onChange={e => updateMenuItem(menu.id, type, i, e.target.value)} />
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
                       <div className={`p-4 rounded-xl border grid grid-cols-3 gap-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                           {['entrees', 'plats', 'desserts'].map(type => (
                               <div key={type}>
                                   <div className="flex justify-between mb-2"><span className="text-xs font-bold uppercase opacity-50">{type}</span><button onClick={() => addCarteItem(type)} className="text-xs bg-slate-200 px-2 rounded font-bold">+</button></div>
                                   {data.carte[type].map((item, i) => (
                                       <div key={i} className="flex gap-1 mb-2">
                                           <input placeholder="Nom" className={`text-xs p-2 w-full rounded border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-300'}`} value={item.name} onChange={e => updateCarteItem(type, i, 'name', e.target.value)} />
                                           {data.isPaid && <input type="number" placeholder="€" className={`text-xs p-2 w-16 rounded border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-300'}`} value={item.price} onChange={e => updateCarteItem(type, i, 'price', e.target.value)} />}
                                           <button onClick={() => setData(p => ({ ...p, carte: { ...p.carte, [type]: p.carte[type].filter((_, idx) => idx !== i) } }))} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                       </div>
                                   ))}
                               </div>
                           ))}
                       </div>
                   </div>
               </div>
           )}
           
           <button onClick={save} className={`w-full font-bold py-4 rounded-xl shadow-lg mt-4 transition-all active:scale-95 ${isDark ? 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-cyan-900/20' : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-cyan-200'}`}>Sauvegarder</button>
        </div>
     </div>
  )
}