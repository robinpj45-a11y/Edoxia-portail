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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
            >
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {initialData ? 'Modifier l\'événement' : 'Nouvel Événement'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="event-form" onSubmit={handleSubmit} className="space-y-4">

                        {/* Type Selector */}
                        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            {['general', 'sport'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: t })}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${formData.type === t
                                        ? 'bg-white dark:bg-slate-700 shadow text-cyan-600 dark:text-cyan-400'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {t === 'general' ? 'Général' : 'Sport / Activité'}
                                </button>
                            ))}
                        </div>

                        {/* Title */}
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                {formData.type === 'sport' ? 'Activité / Sport' : 'Titre'}
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                placeholder={formData.type === 'sport' ? "Ex: Tennis, Piscine..." : "Réunion Pédagogique..."}
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        {/* SPORT SPECIFIC FIELDS */}
                        {formData.type === 'sport' && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Enseignant</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                        placeholder="M. Dupont"
                                        value={formData.teacher}
                                        onChange={e => setFormData({ ...formData, teacher: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Classe</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                        placeholder="CM2"
                                        value={formData.classLevel}
                                        onChange={e => setFormData({ ...formData, classLevel: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Intervenant</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                        placeholder="Nom Prénom"
                                        value={formData.intervener}
                                        onChange={e => setFormData({ ...formData, intervener: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">Contact</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                        placeholder="Tél / Email"
                                        value={formData.contact}
                                        onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2"><AlignLeft size={16} /> Description</label>
                            <textarea
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all resize-none h-24"
                                placeholder="Détails de l'événement..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {/* Dates & Recurrence */}
                        {formData.type === 'general' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2"><Calendar size={16} /> Début</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                        value={formData.start}
                                        onChange={e => setFormData({ ...formData, start: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2"><Calendar size={16} /> Fin</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                        value={formData.end}
                                        onChange={e => setFormData({ ...formData, end: e.target.value })}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Calendar className="text-cyan-500" size={18} /> Récurrence
                                </h3>

                                {/* Period Range */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Début Période</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm"
                                            value={formData.recurrenceStart}
                                            onChange={e => setFormData({ ...formData, recurrenceStart: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Fin Période</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm"
                                            value={formData.recurrenceEnd}
                                            onChange={e => setFormData({ ...formData, recurrenceEnd: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Day & Time */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Jour</label>
                                        <select
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm"
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
                                        <label className="text-xs font-bold text-slate-500 uppercase">Heure Début</label>
                                        <input
                                            type="time"
                                            required
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm"
                                            value={formData.startTime}
                                            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Heure Fin</label>
                                        <input
                                            type="time"
                                            required
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm"
                                            value={formData.endTime}
                                            onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Location */}
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2"><MapPin size={16} /> Lieu</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                placeholder="Salle des profs..."
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>

                        {/* Roles */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2"><Users size={16} /> Cibles</label>
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
                                                : 'bg-transparent text-slate-500 border-slate-300 dark:border-slate-700 hover:border-cyan-500'
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

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                    {initialData && onDelete && (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="mr-auto px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold rounded-lg transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                        >
                            Supprimer
                        </button>
                    )}
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Annuler</button>
                    <button form="event-form" type="submit" className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all">
                        <Save size={18} /> Enregistrer
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminEventForm;
