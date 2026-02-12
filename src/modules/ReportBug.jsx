// c:\Projets\Edoxia\src\modules\ReportBug.jsx
import React, { useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { Bug, X, MessageSquare, Send } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { ThemeContext } from '../ThemeContext';

export default function ReportBug() {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === 'dark';
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({ type: 'bug', message: '', email: '', name: '' });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!formData.message.trim()) return;
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

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`p-2 transition-colors rounded-lg ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
                title="Signaler un bug ou donner un avis"
            >
                <Bug className="w-6 h-6" />
            </button>

            {isOpen && createPortal(
                <div className="fixed inset-0 h-screen w-screen bg-black/80 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className={`p-4 flex justify-between items-center border-b ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                            <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                <Bug size={20} className="text-red-500"/> Signaler un problème
                            </h3>
                            <button onClick={() => setIsOpen(false)} className={`p-1 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="flex gap-2 p-1 bg-slate-100/50 rounded-lg border border-slate-200/50 dark:bg-slate-950/50 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, type: 'bug'})}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${formData.type === 'bug' ? 'bg-red-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                                >
                                    <Bug size={16}/> Bug
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, type: 'feedback'})}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${formData.type === 'feedback' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                                >
                                    <MessageSquare size={16}/> Avis
                                </button>
                            </div>

                            <div>
                                <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Votre message</label>
                                <textarea
                                    required
                                    rows="4"
                                    className={`w-full p-3 rounded-xl border outline-none transition-all resize-none ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500'}`}
                                    placeholder={formData.type === 'bug' ? "Décrivez le problème rencontré..." : "Vos suggestions sont les bienvenues..."}
                                    value={formData.message}
                                    onChange={e => setFormData({...formData, message: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Nom et Prénom (optionnel)</label>
                                <input
                                    type="text"
                                    className={`w-full p-3 rounded-xl border outline-none transition-all ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500'}`}
                                    placeholder="Votre identité..."
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email (optionnel)</label>
                                <input
                                    type="email"
                                    className={`w-full p-3 rounded-xl border outline-none transition-all ${isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500'}`}
                                    placeholder="Pour vous recontacter..."
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={sending}
                                className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${formData.type === 'bug' ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {sending ? "Envoi..." : <><Send size={18}/> Envoyer</>}
                            </button>
                        </form>
                    </div>
                </div>
            , document.body)}
        </>
    );
}
