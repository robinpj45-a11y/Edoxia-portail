import React from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, MapPin, Clock, AlignLeft, Users, User, GraduationCap } from 'lucide-react';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-text/20 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={e => e.stopPropagation()}
                className="bg-white/90 backdrop-blur-xl w-full max-w-md rounded-[30px] shadow-2xl border border-white/50 flex flex-col overflow-hidden"
            >
                <div className="p-5 border-b border-white/50 flex justify-between items-center bg-white/40">
                    <h2 className="text-xl font-black text-brand-text tracking-tight line-clamp-1">
                        {event.title}
                    </h2>
                    <button onClick={onClose} className="p-2 bg-white/50 hover:bg-white rounded-full text-brand-text/50 hover:text-brand-coral shadow-sm transition-all active:scale-95">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">

                    <div className="flex gap-4">
                        <div className="shrink-0 mt-1">
                            <Calendar className="w-5 h-5 text-brand-teal" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-brand-text/50 uppercase tracking-wide mb-1">Date et Heure</h3>
                            <p className="text-brand-text font-bold capitalize">{startDate}</p>
                            <p className="text-brand-text/50 text-sm font-medium mt-1">au</p>
                            <p className="text-brand-text font-bold capitalize">{endDate}</p>
                        </div>
                    </div>

                    {event.location && (
                        <div className="flex gap-4">
                            <div className="shrink-0 mt-1">
                                <MapPin className="w-5 h-5 text-brand-coral" />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-brand-text/50 uppercase tracking-wide mb-1">Lieu</h3>
                                <p className="text-brand-text font-medium">{event.location}</p>
                            </div>
                        </div>
                    )}

                    {event.type === 'sport' && event.teacher && (
                        <div className="flex gap-4">
                            <div className="shrink-0 mt-1">
                                <User className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-brand-text/50 uppercase tracking-wide mb-1">Enseignant</h3>
                                <p className="text-brand-text font-medium">{event.teacher}</p>
                            </div>
                        </div>
                    )}

                    {event.type === 'sport' && event.classLevel && (
                        <div className="flex gap-4">
                            <div className="shrink-0 mt-1">
                                <GraduationCap className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-brand-text/50 uppercase tracking-wide mb-1">Classe</h3>
                                <p className="text-brand-text font-medium">{event.classLevel}</p>
                            </div>
                        </div>
                    )}

                    {event.description && (
                        <div className="flex gap-4">
                            <div className="shrink-0 mt-1">
                                <AlignLeft className="w-5 h-5 text-brand-peach" />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-brand-text/50 uppercase tracking-wide mb-1">Description</h3>
                                <p className="text-brand-text font-medium whitespace-pre-wrap leading-relaxed text-sm">
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
                            <h3 className="text-xs font-bold text-brand-text/50 uppercase tracking-wide mb-2">Concerne</h3>
                            <div className="flex flex-wrap gap-2">
                                {event.roles && event.roles.length > 0 ? event.roles.map(roleId => {
                                    const role = ROLES.find(r => r.id === roleId);
                                    if (!role) return null;
                                    return (
                                        <span key={roleId} className={`px-2.5 py-1 rounded-full text-xs font-bold ${role.color} text-white shadow-sm`}>
                                            {role.label}
                                        </span>
                                    );
                                }) : (
                                    <span className="text-brand-text/40 font-bold italic text-sm">Tout le monde</span>
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
