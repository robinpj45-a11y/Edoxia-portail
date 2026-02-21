import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import CalendarGrid from '../components/CalendarGrid';
import FilterBar from '../components/FilterBar';
import PeriodsSidebar from '../components/PeriodsSidebar';
import EventDetailsModal from '../components/EventDetailsModal';
import { calendarService } from '../services/calendarService';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PublicCalendar = ({ user }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoles, setSelectedRoles] = useState(['tout']);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const data = await calendarService.getEvents();
            setEvents(data);
        } catch (error) {
            console.error("Failed to load events", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRole = (roleId) => {
        if (roleId === 'tout') {
            setSelectedRoles(['tout']);
            return;
        }

        setSelectedRoles(prev => {
            // Enforce removal of 'tout' if selecting specific role
            const withoutTout = prev.filter(r => r !== 'tout');
            const isSelected = withoutTout.includes(roleId);

            let newRoles;
            if (isSelected) {
                newRoles = withoutTout.filter(id => id !== roleId);
            } else {
                newRoles = [...withoutTout, roleId];
            }

            // If no roles selected, revert to 'tout'
            return newRoles.length === 0 ? ['tout'] : newRoles;
        });
    };

    const expandedEvents = useMemo(() => {
        if (!events) return [];
        return calendarService.expandRecurringEvents(events);
    }, [events]);

    return (
        <div className="min-h-screen bg-brand-bg text-brand-text p-4 md:p-8 pt-6 md:pt-20">
            <div className="max-w-6xl mx-auto space-y-6">

                <div className="w-full flex justify-start mb-6">
                    <Link to="/" className="flex flex-shrink-0 items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-brand-text bg-white/40 rounded-full border border-white/50 hover:bg-white/80 transition-all shadow-soft backdrop-blur-md w-fit">
                        <ArrowLeft size={18} />
                        Retour Accueil
                    </Link>
                </div>
                <header className="mb-8 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-brand-text mb-2 tracking-tight">Calendrier Scolaire</h1>
                            <p className="text-brand-text/60 font-medium">Consultez les événements et filtrez selon votre rôle.</p>
                        </div>
                    </div>
                </header>

                <FilterBar selectedRoles={selectedRoles} onToggleRole={toggleRole} />

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-10 h-10 text-brand-teal animate-spin" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-4 gap-8"
                    >
                        <div className="order-2 lg:order-1 lg:col-span-3">
                            <CalendarGrid
                                events={expandedEvents}
                                filterRoles={selectedRoles.includes('tout') ? null : selectedRoles}
                                onEventClick={setSelectedEvent}
                            />
                        </div>

                        <div className="order-1 lg:order-2 lg:col-span-1">
                            <PeriodsSidebar
                                events={events.filter(e => {
                                    if (selectedRoles.includes('tout')) return true;
                                    if (!e.roles) return true;
                                    return e.roles.some(r => selectedRoles.includes(r));
                                })}
                            />
                        </div>
                    </motion.div>
                )}

            </div>

            {selectedEvent && (
                <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
            )}
        </div>
    );
};

export default PublicCalendar;
