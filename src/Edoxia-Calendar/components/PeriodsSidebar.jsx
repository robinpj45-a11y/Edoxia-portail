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
        <div className="border-b border-white/40 last:border-0">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full text-left py-2.5 px-3 hover:bg-white/50 transition-colors flex justify-between items-center group rounded-md"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {isRecurrent && <span className="text-xs bg-brand-teal/20 text-brand-teal px-1.5 py-0.5 rounded-md font-bold">R</span>}
                    <span className="text-sm font-bold text-brand-text capitalize group-hover:text-brand-teal transition-colors truncate">
                        {label}
                    </span>
                </div>
                {expanded ? <ChevronDown size={14} className="text-brand-text/50 flex-shrink-0" /> : <ChevronRight size={14} className="text-brand-text/50 flex-shrink-0" />}
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-black/5 px-4 pb-3 pt-1 text-xs text-brand-text/70 space-y-2 rounded-b-xl shadow-inner mb-2 mx-1"
                    >
                        <div className="pt-2 flex items-center gap-2">
                            <Calendar size={12} className="text-brand-teal" />
                            {isRecurrent ? (
                                <span className="font-medium">
                                    Du {new Date(event.start).toLocaleDateString()} au {new Date(event.end).toLocaleDateString()}
                                    <br />
                                    {event.recurrence?.startTime} - {event.recurrence?.endTime}
                                </span>
                            ) : (
                                <span className="font-medium">
                                    {new Date(event.start).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                                    {' -> '}
                                    {new Date(event.end).toLocaleString('fr-FR', { timeStyle: 'short' })}
                                </span>
                            )}
                        </div>
                        {event.location && (
                            <div className="flex items-center gap-2">
                                <MapPin size={12} className="text-brand-coral" />
                                <span className="font-medium">{event.location}</span>
                            </div>
                        )}
                        {event.intervener && (
                            <div className="flex items-center gap-2">
                                <User size={12} className="text-brand-peach" />
                                <span>Intervenant: <span className="text-brand-text font-black">{event.intervener}</span></span>
                            </div>
                        )}
                        {event.contact && (
                            <div className="flex items-center gap-2">
                                <Phone size={12} className="text-emerald-500" />
                                <span className="font-medium">{event.contact}</span>
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
        <div className="mb-3 bg-white/60 backdrop-blur-md rounded-[24px] border border-white/50 overflow-hidden shadow-soft">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-white/40 font-black tracking-tight text-brand-text hover:bg-white/60 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-brand-teal" />
                    {period.label}
                    <span className="text-[10px] uppercase font-bold text-brand-text/50 ml-2 tracking-wide block mt-0.5">
                        ({period.start.toLocaleDateString()} - {period.end.toLocaleDateString()})
                    </span>
                </div>
                {isOpen ? <ChevronDown size={18} className="text-brand-text/50 hover:text-brand-text transition-colors" /> : <ChevronRight size={18} className="text-brand-text/50 hover:text-brand-text transition-colors" />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-white/50">
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
            <h3 className="text-sm font-black text-brand-text/50 uppercase tracking-widest mb-4 px-2">
                Programmation par Période
            </h3>
            <div className="space-y-3">
                {PERIODS.map(period => (
                    <PeriodSection key={period.id} period={period} events={events} />
                ))}
            </div>
        </div>
    );
};

export default PeriodsSidebar;
