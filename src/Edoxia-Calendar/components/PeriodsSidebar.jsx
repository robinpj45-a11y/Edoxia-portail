import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Calendar, User, MapPin, Phone } from 'lucide-react';

const PERIODS = [
    { id: 'P1', label: 'Période 1', start: new Date('2025-09-01'), end: new Date('2025-11-23'), active: true },
    { id: 'P2', label: 'Période 2', start: new Date('2025-11-24'), end: new Date('2026-03-01'), active: true },
    { id: 'P3', label: 'Période 3', start: new Date('2026-03-02'), end: new Date('2026-05-24'), active: true },
    { id: 'P4', label: 'Période 4', start: new Date('2026-05-25'), end: new Date('2026-07-03'), active: true }
];

const EventItem = ({ event }) => {
    const [expanded, setExpanded] = useState(false);

    // For date display
    const isRecurrent = event.isRecurrent;
    let dayName;

    if (isRecurrent && event.recurrence) {
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        dayName = days[parseInt(event.recurrence.dayOfWeek)];
    } else {
        const dateObj = new Date(event.start);
        dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' });
    }

    // Label Logic
    let label;
    if (event.type === 'sport') {
        const teacherPart = event.teacher ? `${event.teacher} - ` : '';
        const activityPart = event.title || 'Sport';
        label = `${teacherPart}${activityPart} - ${dayName}`;
    } else {
        // General: Title only (+ day)
        label = `${event.title} - ${dayName}`;
    }

    return (
        <div className="border-b border-slate-100 dark:border-slate-800 last:border-0">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full text-left py-2 px-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center group"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {isRecurrent && <span className="text-xs bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 px-1.5 py-0.5 rounded">R</span>}
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize group-hover:text-cyan-600 dark:group-hover:text-cyan-400 truncate">
                        {label}
                    </span>
                </div>
                {expanded ? <ChevronDown size={14} className="text-slate-400 flex-shrink-0" /> : <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />}
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-slate-50 dark:bg-slate-900/50 px-3 pb-2 text-xs text-slate-500 space-y-1"
                    >
                        <div className="pt-2 flex items-center gap-2">
                            <Calendar size={12} className="text-cyan-500" />
                            {isRecurrent ? (
                                <span>
                                    Du {new Date(event.start).toLocaleDateString()} au {new Date(event.end).toLocaleDateString()}
                                    <br />
                                    {event.recurrence?.startTime} - {event.recurrence?.endTime}
                                </span>
                            ) : (
                                <span>
                                    {new Date(event.start).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                                    {' -> '}
                                    {new Date(event.end).toLocaleString('fr-FR', { timeStyle: 'short' })}
                                </span>
                            )}
                        </div>
                        {event.location && (
                            <div className="flex items-center gap-2">
                                <MapPin size={12} className="text-rose-500" />
                                <span>{event.location}</span>
                            </div>
                        )}
                        {event.intervener && (
                            <div className="flex items-center gap-2">
                                <User size={12} className="text-indigo-500" />
                                <span>Intervenant: <span className="text-slate-700 dark:text-slate-300 font-bold">{event.intervener}</span></span>
                            </div>
                        )}
                        {event.contact && (
                            <div className="flex items-center gap-2">
                                <Phone size={12} className="text-emerald-500" />
                                <span>{event.contact}</span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const PeriodSection = ({ period, events }) => {
    const [isOpen, setIsOpen] = useState(false);

    const periodEvents = events.filter(e => {
        const eStart = new Date(e.start);
        const eEnd = new Date(e.end);
        // Check overlap: Event Start <= Period End AND Event End >= Period Start
        return eStart <= period.end && eEnd >= period.start;
    });

    if (periodEvents.length === 0) return null;

    return (
        <div className="mb-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 font-bold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-500" />
                    {period.label}
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-2">
                        ({period.start.toLocaleDateString()} - {period.end.toLocaleDateString()})
                    </span>
                </div>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-slate-200 dark:border-slate-800">
                            {periodEvents.map(event => (
                                <EventItem key={event.id} event={event} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const PeriodsSidebar = ({ events }) => {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 px-1">
                Programmation par Période
            </h3>
            <div className="space-y-4">
                {PERIODS.map(period => (
                    <PeriodSection key={period.id} period={period} events={events} />
                ))}
            </div>
        </div>
    );
};

export default PeriodsSidebar;
