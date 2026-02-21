import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Calendar, MapPin, AlignLeft, Users } from 'lucide-react';
import { ROLES } from '../constants';

const AdminEventForm = ({ onClose, onSave, onDelete, initialData }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start: '',
        end: '',
        location: '',
        roles: [],
        type: 'general', // 'general' | 'sport'
        // Sport fields
        teacher: '',
        classLevel: '',
        intervener: '',
        contact: '',
        // Recurrence fields for Sport
        recurrenceDay: '1', // 1=Lundi
        recurrenceStart: '',
        recurrenceEnd: '',
        startTime: '08:00',
        endTime: '09:00'
    });

    useEffect(() => {
        if (initialData) {
            // Flatten recurrence data for the form if it exists
            const recurrenceOverrides = initialData.recurrence ? {
                recurrenceStart: initialData.recurrence.start,
                recurrenceEnd: initialData.recurrence.end,
                recurrenceDay: initialData.recurrence.dayOfWeek,
                startTime: initialData.recurrence.startTime,
                endTime: initialData.recurrence.endTime
            } : {};

            setFormData({
                ...initialData,
                ...recurrenceOverrides,
                // Ensure roles is at least an empty array
                roles: initialData.roles || []
            });
        } else {
            // Default start time: next hour rounded
            const now = new Date();
            now.setMinutes(0, 0, 0);
            now.setHours(now.getHours() + 1);
            const start = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm

            const endData = new Date(now);
            endData.setHours(endData.getHours() + 1);
            const end = endData.toISOString().slice(0, 16);

            setFormData(prev => ({ ...prev, start, end }));
        }
    }, [initialData]);

    const toggleRole = (roleId) => {
        setFormData(prev => {
            const roles = prev.roles.includes(roleId)
                ? prev.roles.filter(r => r !== roleId)
                : [...prev.roles, roleId];
            return { ...prev, roles };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Check if Recurrence Logic applies (recurrence fields present and type is sport)
        // Applies for both NEW and EDIT
        if (formData.type === 'sport' && formData.recurrenceStart && formData.recurrenceEnd) {

            // Construct Recurring Event Object
            const startPeriod = new Date(formData.recurrenceStart);
            const [startH, startM] = formData.startTime.split(':');

            const endPeriod = new Date(formData.recurrenceEnd);
            const [endH, endM] = formData.endTime.split(':');

            // Set main start/end to the full period bounds (with time applied to first/last day)
            // Or just period bounds. Let's use period bounds with correct time.
            const eventStart = new Date(startPeriod);
            eventStart.setHours(parseInt(startH), parseInt(startM));

            const eventEnd = new Date(endPeriod);
            eventEnd.setHours(parseInt(endH), parseInt(endM));

            // Create payload
            const eventData = {
                ...formData,
                isRecurrent: true,
                // Main start/end cover the ENTIRE period range
                start: eventStart.toISOString(),
                end: eventEnd.toISOString(),
                recurrence: {
                    active: true,
                    start: formData.recurrenceStart, // YYYY-MM-DD
                    end: formData.recurrenceEnd,     // YYYY-MM-DD
                    dayOfWeek: parseInt(formData.recurrenceDay),
                    startTime: formData.startTime,
                    endTime: formData.endTime
                }
            };

            // Remove temporary form fields from final object
            delete eventData.recurrenceStart;
            delete eventData.recurrenceEnd;
            delete eventData.recurrenceDay;
            delete eventData.startTime;
            delete eventData.endTime;

            onSave(eventData);

        } else {
            // Standard save
            onSave(formData);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-text/20 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white/90 backdrop-blur-xl w-full max-w-lg rounded-[30px] shadow-2xl border border-white/50 flex flex-col max-h-[90vh]"
            >
                <div className="p-5 border-b border-white/50 flex justify-between items-center bg-white/40 rounded-t-[30px]">
                    <h2 className="text-xl font-black text-brand-text tracking-tight flex items-center gap-2">
                        {initialData ? 'Modifier l\'événement' : 'Nouvel Événement'}
                    </h2>
                    <button onClick={onClose} className="p-2 bg-white/50 hover:bg-white rounded-full text-brand-text/50 hover:text-brand-coral shadow-sm transition-all active:scale-95">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="event-form" onSubmit={handleSubmit} className="space-y-4">

                        {/* Type Selector */}
                        <div className="flex gap-2 p-1.5 bg-black/5 rounded-[20px] shadow-inner">
                            {['general', 'sport'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: t })}
                                    className={`flex-1 py-2 text-sm font-bold rounded-[16px] transition-all ${formData.type === t
                                        ? 'bg-white shadow-soft text-brand-teal'
                                        : 'text-brand-text/50 hover:text-brand-text hover:bg-white/30'
                                        }`}
                                >
                                    {t === 'general' ? 'Général' : 'Sport / Activité'}
                                </button>
                            ))}
                        </div>

                        {/* Title */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-brand-text/50 uppercase tracking-wide">
                                {formData.type === 'sport' ? 'Activité / Sport' : 'Titre'}
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full bg-white/50 border border-white rounded-[20px] p-3 text-brand-text focus:ring-2 focus:ring-brand-teal focus:bg-white shadow-inner outline-none transition-all"
                                placeholder={formData.type === 'sport' ? "Ex: Tennis, Piscine..." : "Réunion Pédagogique..."}
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        {/* SPORT SPECIFIC FIELDS */}
                        {formData.type === 'sport' && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-brand-text/50 uppercase tracking-wide">Enseignant</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/50 border border-white rounded-[20px] p-3 text-brand-text focus:ring-2 focus:ring-brand-teal focus:bg-white shadow-inner outline-none transition-all"
                                        placeholder="M. Dupont"
                                        value={formData.teacher}
                                        onChange={e => setFormData({ ...formData, teacher: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-brand-text/50 uppercase tracking-wide">Classe</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/50 border border-white rounded-[20px] p-3 text-brand-text focus:ring-2 focus:ring-brand-teal focus:bg-white shadow-inner outline-none transition-all"
                                        placeholder="CM2"
                                        value={formData.classLevel}
                                        onChange={e => setFormData({ ...formData, classLevel: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-brand-text/50 uppercase tracking-wide">Intervenant</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/50 border border-white rounded-[20px] p-3 text-brand-text focus:ring-2 focus:ring-brand-teal focus:bg-white shadow-inner outline-none transition-all"
                                        placeholder="Nom Prénom"
                                        value={formData.intervener}
                                        onChange={e => setFormData({ ...formData, intervener: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-brand-text/50 uppercase tracking-wide">Contact</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/50 border border-white rounded-[20px] p-3 text-brand-text focus:ring-2 focus:ring-brand-teal focus:bg-white shadow-inner outline-none transition-all"
                                        placeholder="Tél / Email"
                                        value={formData.contact}
                                        onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-brand-text/50 uppercase tracking-wide flex items-center gap-2"><AlignLeft size={16} /> Description</label>
                            <textarea
                                className="w-full bg-white/50 border border-white rounded-[20px] p-3 text-brand-text focus:ring-2 focus:ring-brand-teal focus:bg-white shadow-inner outline-none transition-all resize-none h-24"
                                placeholder="Détails de l'événement..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {/* Dates & Recurrence */}
                        {formData.type === 'general' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-brand-text/50 uppercase tracking-wide flex items-center gap-2"><Calendar size={16} /> Début</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full bg-white/50 border border-white rounded-[20px] p-3 text-brand-text focus:ring-2 focus:ring-brand-teal focus:bg-white shadow-inner outline-none transition-all"
                                        value={formData.start}
                                        onChange={e => setFormData({ ...formData, start: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-brand-text/50 uppercase tracking-wide flex items-center gap-2"><Calendar size={16} /> Fin</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full bg-white/50 border border-white rounded-[20px] p-3 text-brand-text focus:ring-2 focus:ring-brand-teal focus:bg-white shadow-inner outline-none transition-all"
                                        value={formData.end}
                                        onChange={e => setFormData({ ...formData, end: e.target.value })}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 p-5 bg-white/50 rounded-[20px] border border-white shadow-soft">
                                <h3 className="font-black text-brand-text flex items-center gap-2 uppercase tracking-tight">
                                    <Calendar className="text-brand-teal" size={18} /> Récurrence
                                </h3>

                                {/* Period Range */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-brand-text/50 uppercase tracking-wide">Début Période</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full bg-white/60 border border-white rounded-[16px] p-2.5 text-brand-text focus:ring-2 focus:ring-brand-teal shadow-inner text-sm outline-none transition-all"
                                            value={formData.recurrenceStart}
                                            onChange={e => setFormData({ ...formData, recurrenceStart: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-brand-text/50 uppercase tracking-wide">Fin Période</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full bg-white/60 border border-white rounded-[16px] p-2.5 text-brand-text focus:ring-2 focus:ring-brand-teal shadow-inner text-sm outline-none transition-all"
                                            value={formData.recurrenceEnd}
                                            onChange={e => setFormData({ ...formData, recurrenceEnd: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Day & Time */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-brand-text/50 uppercase tracking-wide">Jour</label>
                                        <select
                                            className="w-full bg-white/60 border border-white rounded-[16px] p-2.5 text-brand-text focus:ring-2 focus:ring-brand-teal shadow-inner text-sm outline-none transition-all"
                                            value={formData.recurrenceDay}
                                            onChange={e => setFormData({ ...formData, recurrenceDay: e.target.value })}
                                        >
                                            <option value="1">Lundi</option>
                                            <option value="2">Mardi</option>
                                            <option value="3">Mercredi</option>
                                            <option value="4">Jeudi</option>
                                            <option value="5">Vendredi</option>
                                            <option value="6">Samedi</option>
                                            <option value="0">Dimanche</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-brand-text/50 uppercase tracking-wide">Heure Début</label>
                                        <input
                                            type="time"
                                            required
                                            className="w-full bg-white/60 border border-white rounded-[16px] p-2.5 text-brand-text focus:ring-2 focus:ring-brand-teal shadow-inner text-sm outline-none transition-all"
                                            value={formData.startTime}
                                            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-brand-text/50 uppercase tracking-wide">Heure Fin</label>
                                        <input
                                            type="time"
                                            required
                                            className="w-full bg-white/60 border border-white rounded-[16px] p-2.5 text-brand-text focus:ring-2 focus:ring-brand-teal shadow-inner text-sm outline-none transition-all"
                                            value={formData.endTime}
                                            onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Location */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-brand-text/50 uppercase tracking-wide flex items-center gap-2"><MapPin size={16} /> Lieu</label>
                            <input
                                type="text"
                                className="w-full bg-white/50 border border-white rounded-[20px] p-3 text-brand-text focus:ring-2 focus:ring-brand-teal focus:bg-white shadow-inner outline-none transition-all"
                                placeholder="Salle des profs..."
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>

                        {/* Roles */}
                        <div className="space-y-2 mb-4">
                            <label className="text-xs font-bold text-brand-text/50 uppercase tracking-wide flex items-center gap-2"><Users size={16} /> Cibles</label>
                            <div className="flex flex-wrap gap-2">
                                {ROLES.map(role => {
                                    const isSelected = formData.roles.includes(role.id);
                                    return (
                                        <button
                                            type="button"
                                            key={role.id}
                                            onClick={() => toggleRole(role.id)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${isSelected
                                                ? `${role.color} text-white border-transparent`
                                                : 'text-brand-text/50 border-white hover:border-brand-teal bg-white/50 hover:bg-white shadow-inner'
                                                }`}
                                        >
                                            {role.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                    </form>
                </div>

                <div className="p-5 border-t border-white/50 bg-white/40 rounded-b-[30px] flex justify-end gap-2">
                    {initialData && onDelete && (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="mr-auto px-4 py-2 text-brand-coral hover:bg-white bg-white/50 font-bold rounded-[20px] transition-all border border-transparent hover:border-white shadow-inner hover:shadow-sm"
                        >
                            Supprimer
                        </button>
                    )}
                    <button onClick={onClose} className="px-4 py-2 text-brand-text/60 font-bold hover:bg-white/50 hover:text-brand-text rounded-[20px] transition-colors">Annuler</button>
                    <button form="event-form" type="submit" className="px-6 py-2 bg-brand-teal hover:bg-brand-teal/90 hover:scale-105 text-white font-bold rounded-full shadow-soft flex items-center gap-2 transition-all">
                        <Save size={18} /> Enregistrer
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminEventForm;
