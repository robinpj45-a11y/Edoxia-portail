import React from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, MapPin, Clock, AlignLeft, Users } from 'lucide-react';
import { ROLES } from '../constants';

const EventDetailsModal = ({ event, onClose }) => {
    if (!event) return null;

    const startDate = new Date(event.start).toLocaleString('fr-FR', {
        dateStyle: 'full', timeStyle: 'short'
    });

    const endDate = new Date(event.end).toLocaleString('fr-FR', {
        dateStyle: 'full', timeStyle: 'short'
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
            >
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white line-clamp-1">
                        {event.title}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">

                    <div className="flex gap-4">
                        <div className="shrink-0 mt-1">
                            <Calendar className="w-5 h-5 text-cyan-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Date et Heure</h3>
                            <p className="text-slate-800 dark:text-slate-200 font-medium capitalize">{startDate}</p>
                            <p className="text-slate-500 text-sm mt-1">au</p>
                            <p className="text-slate-800 dark:text-slate-200 font-medium capitalize">{endDate}</p>
                        </div>
                    </div>

                    {event.location && (
                        <div className="flex gap-4">
                            <div className="shrink-0 mt-1">
                                <MapPin className="w-5 h-5 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Lieu</h3>
                                <p className="text-slate-800 dark:text-slate-200">{event.location}</p>
                            </div>
                        </div>
                    )}

                    {event.description && (
                        <div className="flex gap-4">
                            <div className="shrink-0 mt-1">
                                <AlignLeft className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Description</h3>
                                <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed text-sm">
                                    {event.description}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <div className="shrink-0 mt-1">
                            <Users className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Concerne</h3>
                            <div className="flex flex-wrap gap-2">
                                {event.roles && event.roles.length > 0 ? event.roles.map(roleId => {
                                    const role = ROLES.find(r => r.id === roleId);
                                    if (!role) return null;
                                    return (
                                        <span key={roleId} className={`px-2 py-1 rounded text-xs font-bold ${role.color} text-white`}>
                                            {role.label}
                                        </span>
                                    );
                                }) : (
                                    <span className="text-slate-500 italic text-sm">Tout le monde</span>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
};

export default EventDetailsModal;
