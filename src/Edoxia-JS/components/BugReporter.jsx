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
        if (!formData.message.trim()) return;
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
            <button onClick={() => setIsOpen(true)} className="fixed bottom-4 right-4 bg-white/80 backdrop-blur-md text-brand-coral p-4 rounded-full shadow-soft hover:shadow-md hover:bg-white hover:scale-110 transition-all z-50 border border-white/50" title="Signaler un bug"><Bug size={24} /></button>
            {isOpen && (
                <div className="fixed inset-0 bg-brand-text/20 z-[60] flex items-end sm:items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white/90 backdrop-blur-xl w-full max-w-md rounded-[30px] shadow-2xl border border-white/50 overflow-hidden">
                        <div className="bg-white/40 p-5 flex justify-between items-center border-b border-white/50 rounded-t-[30px]">
                            <h3 className="font-black tracking-tight text-brand-coral flex items-center gap-2"><Bug size={20} /> Signaler un problème</h3>
                            <button onClick={() => setIsOpen(false)} className="p-2 bg-white/50 hover:bg-white rounded-full text-brand-text/40 hover:text-brand-coral shadow-sm transition-all active:scale-95"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1"><label className="text-[10px] font-bold text-brand-text/50 uppercase tracking-wide">Prénom</label><input required className="w-full bg-white/60 border border-white rounded-[20px] p-3 mt-1 text-brand-text focus:ring-2 focus:ring-brand-coral focus:bg-white shadow-inner outline-none transition-all" value={formData.prenom} onChange={e => setFormData({ ...formData, prenom: e.target.value })} /></div>
                                <div className="flex-1"><label className="text-[10px] font-bold text-brand-text/50 uppercase tracking-wide">Nom</label><input required className="w-full bg-white/60 border border-white rounded-[20px] p-3 mt-1 text-brand-text focus:ring-2 focus:ring-brand-coral focus:bg-white shadow-inner outline-none transition-all" value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} /></div>
                            </div>
                            <div><label className="text-[10px] font-bold text-brand-text/50 uppercase tracking-wide">Description du bug</label><textarea required rows="4" className="w-full bg-white/60 border border-white rounded-[20px] p-3 mt-1 text-brand-text focus:ring-2 focus:ring-brand-coral focus:bg-white shadow-inner outline-none transition-all resize-none" placeholder="Que s'est-il passé ?..." value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} /></div>
                            <button type="submit" disabled={sending} className="w-full bg-brand-coral hover:bg-brand-coral/90 text-white font-black py-4 rounded-full shadow-soft hover:scale-105 active:scale-95 transition-all disabled:opacity-50 tracking-wide mt-2">{sending ? "Envoi..." : "Envoyer le signalement"}</button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
