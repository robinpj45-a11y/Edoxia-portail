import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import CalendarGrid from '../components/CalendarGrid';
import FilterBar from '../components/FilterBar';
import PeriodsSidebar from '../components/PeriodsSidebar';
import EventDetailsModal from '../components/EventDetailsModal';
import { calendarService } from '../services/calendarService';
import { Loader2, Settings } from 'lucide-react';
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
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-4 md:p-8 pt-20">
            <div className="max-w-6xl mx-auto space-y-6">

                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-2">Calendrier Scolaire</h1>
                        <p className="text-slate-500 dark:text-slate-400">Consultez les événements et filtrez selon votre rôle.</p>
                    </div>
                    {user && user.role === 'admin' && (
                        <Link to="/calendar/admin" className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg hover:bg-cyan-500 hover:text-white transition-colors">
                            <Settings size={24} />
                        </Link>
                    )}
                </header>

                <FilterBar selectedRoles={selectedRoles} onToggleRole={toggleRole} />

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-4 gap-8"
                    >
                        <div className="lg:col-span-3">
                            <CalendarGrid
                                events={expandedEvents}
                                filterRoles={selectedRoles.includes('tout') ? null : selectedRoles}
                                onEventClick={setSelectedEvent}
                            />
                        </div>

                        <div className="lg:col-span-1">
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
