// c:\Projets\Edoxia\src\modules\ReportBug.jsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Bug, X, MessageSquare, Send } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

export default function ReportBug({ isMobileNav = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({ type: 'bug', message: '', email: '', name: '' });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.message.trim()) return;
        setSending(true);
        try {
            await addDoc(collection(db, "feedback"), {
                ...formData,
                date: new Date().toISOString(),
                status: 'new',
                userAgent: navigator.userAgent,
                url: window.location.href
            });
            alert("Merci pour votre retour !");
            setFormData({ type: 'bug', message: '', email: '', name: '' });
            setIsOpen(false);
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'envoi.");
        }
        setSending(false);
    };

    const toggleButton = isMobileNav ? (
        <button onClick={() => setIsOpen(true)} className="flex flex-col items-center gap-1 p-2 text-brand-text/40 hover:text-brand-coral transition-colors">
            <Bug className="w-6 h-6" />
            <span className="text-[10px] font-bold">Avis</span>
        </button>
    ) : (
        <button
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center p-2 transition-colors rounded-full text-white hover:bg-white/30"
            title="Signaler un bug ou donner un avis"
        >
            <Bug className="w-6 h-6" />
        </button>
    );

    return (
        <>
            {toggleButton}

            {isOpen && createPortal(
                <div className="fixed inset-0 h-screen w-screen bg-brand-text/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-[30px] shadow-2xl overflow-hidden border border-white/50 bg-brand-bg text-brand-text">

                        <div className="p-5 border-b border-white/50 flex justify-between items-center bg-white/40">
                            <h3 className="font-black text-xl flex items-center gap-3">
                                <Bug size={24} className="text-brand-coral" /> Signaler / Avis
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="p-2 rounded-full transition-all bg-white/50 hover:bg-white text-brand-text/50 hover:text-brand-coral shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white/20 backdrop-blur-sm">
                            <div className="flex gap-2 p-1.5 bg-white/50 rounded-[20px] border border-white shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'bug' })}
                                    className={`flex-1 py-2 text-sm font-bold rounded-[16px] transition-all flex items-center justify-center gap-2 ${formData.type === 'bug' ? 'bg-brand-coral text-white shadow-soft scale-[1.02]' : 'text-brand-text/50 hover:text-brand-text hover:bg-white/40'}`}
                                >
                                    <Bug size={16} /> Bug
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'feedback' })}
                                    className={`flex-1 py-2 text-sm font-bold rounded-[16px] transition-all flex items-center justify-center gap-2 ${formData.type === 'feedback' ? 'bg-brand-teal text-white shadow-soft scale-[1.02]' : 'text-brand-text/50 hover:text-brand-text hover:bg-white/40'}`}
                                >
                                    <MessageSquare size={16} /> Avis
                                </button>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold uppercase text-brand-text/50 tracking-wide">Votre message</label>
                                <textarea
                                    required
                                    rows="4"
                                    className="w-full p-4 rounded-[20px] border bg-white/60 border-white text-brand-text focus:ring-2 focus:ring-brand-teal focus:bg-white shadow-inner outline-none transition-all resize-none font-medium"
                                    placeholder={formData.type === 'bug' ? "Décrivez le problème rencontré..." : "Vos suggestions sont les bienvenues..."}
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold uppercase text-brand-text/50 tracking-wide">Nom et Prénom (optionnel)</label>
                                <input
                                    type="text"
                                    className="w-full p-4 rounded-[20px] border bg-white/60 border-white text-brand-text focus:ring-2 focus:ring-brand-teal focus:bg-white shadow-inner outline-none transition-all font-medium"
                                    placeholder="Votre identité..."
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-bold uppercase text-brand-text/50 tracking-wide">Email (optionnel)</label>
                                <input
                                    type="email"
                                    className="w-full p-4 rounded-[20px] border bg-white/60 border-white text-brand-text focus:ring-2 focus:ring-brand-teal focus:bg-white shadow-inner outline-none transition-all font-medium"
                                    placeholder="Pour vous recontacter..."
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={sending}
                                className={`w-full py-4 rounded-full font-bold text-white shadow-soft transition-all flex items-center justify-center gap-2 ${formData.type === 'bug' ? 'bg-brand-coral hover:bg-brand-coral/90' : 'bg-brand-teal hover:bg-brand-teal/90'} disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 disabled:hover:scale-100 mt-2`}
                            >
                                {sending ? "Envoi..." : <><Send size={18} /> Envoyer le signalement</>}
                            </button>
                        </form>
                    </div>
                </div>
                , document.body)}
        </>
    );
}
