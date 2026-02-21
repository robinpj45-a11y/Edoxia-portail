import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';
import EventCard from './EventCard';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const CalendarGrid = ({ events, onEventClick, filterRoles }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Convertir pour Lun=0 ... Dim=6
    };

    const generateCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const totalSlots = Math.ceil((daysInMonth + firstDay) / 7) * 7;

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
        while (days.length < totalSlots) days.push(null);
        return days;
    };

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    };

    const getEventsForDay = (date) => {
        if (!date) return [];
        return events.filter(e => {
            const start = new Date(e.start);
            const end = new Date(e.end);

            // Comparaison simple par jour (ne gère pas bien les événements multi-jours affichés sur chaque case pour l'instanct, 
            // mais suffisant pour "start date" ou single day events)
            // Pour être plus précis si multi-jours : date >= startDay && date <= endDay
            const d = new Date(date).setHours(0, 0, 0, 0);
            const s = new Date(start).setHours(0, 0, 0, 0);
            const eEnd = new Date(end).setHours(0, 0, 0, 0);

            return d >= s && d <= eEnd;
        }).filter(e => {
            if (!filterRoles || filterRoles.length === 0) return true;
            if (!e.roles) return true;
            return e.roles.some(r => filterRoles.includes(r));
        });
    };

    const calendarDays = generateCalendarDays();

    return (
        <div className="bg-white/60 backdrop-blur-md rounded-[30px] shadow-soft border border-white/50 overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center justify-between bg-white/40 border-b border-white/50">
                <h2 className="text-xl md:text-2xl font-black flex items-center gap-2 text-brand-text tracking-tight capitalize">
                    <CalendarIcon className="w-6 h-6 text-brand-teal" />
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-white/50 text-brand-text/60 hover:text-brand-text transition-all active:scale-95 shadow-sm hover:shadow-md">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-white/50 text-brand-text/60 hover:text-brand-text transition-all active:scale-95 shadow-sm hover:shadow-md">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Grid Header days */}
            <div className="grid grid-cols-7 border-b border-white/50 bg-black/5">
                {DAYS.map(day => (
                    <div key={day} className="py-2 text-center text-xs font-bold text-brand-text/50 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid Body */}
            <div className="grid grid-cols-7 auto-rows-fr">
                {calendarDays.map((date, index) => {
                    const dayEvents = getEventsForDay(date);
                    return (
                        <div
                            key={index}
                            className={`min-h-[100px] md:min-h-[120px] p-1 border-b border-r border-white/40 relative transition-colors ${!date ? 'bg-white/30 hover:bg-white/40' : 'hover:bg-white/60 bg-white/10'}`}
                        >
                            {date && (
                                <>
                                    <div className={`text-right px-2 py-1 text-sm font-semibold mb-1 ${isToday(date) ? 'text-brand-teal' : 'text-brand-text/40'}`}>
                                        {isToday(date) && <span className="inline-block w-6 h-6 bg-brand-teal/20 backdrop-blur-sm rounded-full text-center leading-6 mr-1 absolute top-1 right-1 -z-0"></span>}
                                        <span className="relative z-10">{date.getDate()}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 overflow-y-auto max-h-[80px]">
                                        {dayEvents.map(event => (
                                            <EventCard key={event.id} event={event} onClick={onEventClick} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarGrid;
