import React from 'react';
import { motion } from 'framer-motion';

const EventCard = ({ event, onClick }) => {
    // Determine color based on primary role or default
    const getEventColor = (roles) => {
        if (!roles || roles.length === 0) return 'bg-slate-500';
        if (roles.includes('direction')) return 'bg-rose-500';
        if (roles.includes('enseignant')) return 'bg-indigo-500';
        if (roles.includes('aesh')) return 'bg-emerald-500';
        if (roles.includes('eleve')) return 'bg-cyan-500';
        return 'bg-blue-500';
    };

    return (
        <motion.div
            layoutId={`event-${event.id}`}
            onClick={(e) => { e.stopPropagation(); onClick(event); }}
            className={`
        text-[10px] md:text-xs truncate rounded px-1.5 py-0.5 my-0.5 cursor-pointer text-white font-medium shadow-sm hover:opacity-90 transition-opacity
        ${getEventColor(event.roles)}
      `}
            title={`${event.title} - ${event.location}`}
        >
            {event.title}
        </motion.div>
    );
};

export default EventCard;
