import React, { useState } from 'react';
import { Bug, X } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

export default function BugReporter() {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({ nom: '', prenom: '', message: '' });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!formData.message.trim()) return;
        setSending(true);
        try {
            await addDoc(collection(db, "bugReports"), { ...formData, date: new Date().toISOString(), status: 'new' });
            alert("Merci ! Le bug a été signalé.");
            setFormData({ nom: '', prenom: '', message: '' });
            setIsOpen(false);
        } catch (error) { alert("Erreur lors de l'envoi."); }
        setSending(false);
    };

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="fixed bottom-4 right-4 bg-red-100 text-red-600 p-3 rounded-full shadow-lg hover:scale-110 transition-transform z-50 border-2 border-red-200" title="Signaler un bug"><Bug size={24} /></button>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                        <div className="bg-red-50 p-4 flex justify-between items-center border-b border-red-100">
                            <h3 className="font-bold text-red-700 flex items-center gap-2"><Bug size={20}/> Signaler un problème</h3>
                            <button onClick={() => setIsOpen(false)}><X size={20} className="text-red-400 hover:text-red-700"/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1"><label className="text-xs font-bold text-slate-500 uppercase">Prénom</label><input required className="w-full border rounded-lg p-2 mt-1 focus:border-red-400 outline-none" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} /></div>
                                <div className="flex-1"><label className="text-xs font-bold text-slate-500 uppercase">Nom</label><input required className="w-full border rounded-lg p-2 mt-1 focus:border-red-400 outline-none" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} /></div>
                            </div>
                            <div><label className="text-xs font-bold text-slate-500 uppercase">Description du bug</label><textarea required rows="4" className="w-full border rounded-lg p-2 mt-1 focus:border-red-400 outline-none resize-none" placeholder="Que s'est-il passé ?..." value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} /></div>
                            <button type="submit" disabled={sending} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">{sending ? "Envoi..." : "Envoyer le signalement"}</button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
