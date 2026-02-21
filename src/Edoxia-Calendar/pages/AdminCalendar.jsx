import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import CalendarGrid from '../components/CalendarGrid';
import AdminEventForm from '../components/AdminEventForm';
import { calendarService } from '../services/calendarService';
import { Loader2, Plus, ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminCalendar = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

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

    // Expand recurring events for the grid view
    const expandedEvents = useMemo(() => {
        if (!events) return [];
        return calendarService.expandRecurringEvents(events);
    }, [events]);

    const handleEventClick = (ev) => {
        if (ev.isInstance) {
            // If clicking an instance, edit the original parent event
            const original = events.find(e => e.id === ev.originalId);
            setEditingEvent(original || ev);
        } else {
            setEditingEvent(ev);
        }
        setShowForm(true);
    };

    const handleSave = async (eventData) => {
        try {
            if (Array.isArray(eventData)) {
                // Batch create (legacy support or if future need)
                await calendarService.addMultipleEvents(eventData);
            } else if (editingEvent) {
                await calendarService.updateEvent(editingEvent.id, eventData);
            } else {
                await calendarService.addEvent(eventData);
            }
            await fetchEvents();
            setShowForm(false);
            setEditingEvent(null);
        } catch (error) {
            alert("Erreur lors de l'enregistrement : " + error.message);
        }
    };

    const handleDelete = async () => {
        if (!editingEvent) return;
        if (confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
            try {
                await calendarService.deleteEvent(editingEvent.id);
                await fetchEvents();
                setShowForm(false);
                setEditingEvent(null);
            } catch (e) {
                alert("Erreur suppression : " + e.message);
            }
        }
    };

    return (
        <div className={isEmbedded ? "h-full" : "min-h-screen bg-brand-bg text-brand-text p-4 md:p-8 pt-20"}>
            <div className={isEmbedded ? "" : "max-w-6xl mx-auto space-y-6"}>

                {isEmbedded ? (
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-black flex items-center gap-2 text-brand-text tracking-tight">
                            <CalendarIcon className="text-brand-teal" /> Gestion du Calendrier
                        </h2>
                        <button
                            onClick={() => { setEditingEvent(null); setShowForm(true); }}
                            className="bg-brand-teal hover:bg-brand-teal/90 text-white font-bold py-2 px-4 rounded-full shadow-soft hover:scale-105 flex items-center gap-2 transition-all"
                        >
                            <Plus size={20} /> Nouvel Événement
                        </button>
                    </div>
                ) : (
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <button onClick={() => navigate('/admin')} className="text-brand-text/50 font-bold text-sm hover:text-brand-teal flex items-center gap-2 mb-2 transition-colors">
                                <ArrowLeft size={16} /> Retour Dashboard
                            </button>
                            <h1 className="text-3xl md:text-4xl font-black text-brand-text tracking-tight">Gestion du Calendrier</h1>
                        </div>
                        <button
                            onClick={() => { setEditingEvent(null); setShowForm(true); }}
                            className="bg-brand-teal hover:bg-brand-teal/90 text-white font-bold py-3 px-6 rounded-full shadow-soft hover:scale-105 flex items-center gap-2 transition-all"
                        >
                            <Plus size={20} /> Nouvel Événement
                        </button>
                    </header>
                )}

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-10 h-10 text-brand-teal animate-spin" />
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <CalendarGrid
                            events={expandedEvents}
                            onEventClick={handleEventClick}
                        />
                    </motion.div>
                )}
            </div>

            {showForm && (
                <AdminEventForm
                    initialData={editingEvent}
                    onClose={() => { setShowForm(false); setEditingEvent(null); }}
                    onSave={handleSave}
                    onDelete={handleDelete}
                />
            )}

            {/* Delete button logic could be improved to be inside the form or a separate action,
          currently relying on the form being open for edit but I didn't put delete button in AdminEventForm.
          Let's add it to AdminEventForm? Or handle it here?
          Wait, I implemented AdminEventForm without a Delete button.
          I should update AdminEventForm to include a delete button if initialData matches.
       */}
        </div>
    );
};

export default AdminCalendar;
