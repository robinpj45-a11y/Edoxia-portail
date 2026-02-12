// c:\Projets\Edoxia\src\Edoxia-Event\EventApp.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import Home from './pages/Home';
import RegisterUser from './pages/RegisterUser';
import AdminDashboard from './pages/AdminDashboard';

export default function EventApp({ user: propUser }) {
  const [view, setView] = useState('home'); // 'home', 'register', 'admin'
  const [events, setEvents] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gestion d'un utilisateur invité persistant si pas de user authentifié
  const [guestUser] = useState(() => {
    const storedUid = localStorage.getItem('edoxia_event_uid');
    if (storedUid) return { uid: storedUid };
    const newUid = `guest_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('edoxia_event_uid', newUid);
    return { uid: newUid };
  });

  const user = propUser || guestUser;

  useEffect(() => {
    // Écoute des évènements en temps réel
    const qEvents = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubEvents = onSnapshot(qEvents, (snapshot) => {
      const eventsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      console.error("Erreur chargement events:", error);
      setLoading(false);
    });

    // Écoute des inscriptions (pour l'admin)
    const qEntries = query(collection(db, 'entries'), orderBy('timestamp', 'desc'));
    const unsubEntries = onSnapshot(qEntries, (snapshot) => {
      const entriesData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setEntries(entriesData);
    }, (error) => {
      console.error("Erreur chargement entries:", error);
    });

    return () => {
      unsubEvents();
      unsubEntries();
    };
  }, []);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setView('register');
  };

  const handleBackToHome = () => {
    setSelectedEvent(null);
    setView('home');
  };

  // Rendu conditionnel selon la vue active
  if (view === 'admin') {
    return (
      <AdminDashboard
        events={events}
        entries={entries}
        user={user}
        onBack={handleBackToHome}
      />
    );
  }

  if (view === 'register' && selectedEvent) {
    return (
      <RegisterUser
        event={selectedEvent}
        user={user}
        onBack={handleBackToHome}
      />
    );
  }

  return (
    <Home
      events={events}
      entries={entries}
      onSelect={handleSelectEvent}
      onViewChange={setView}
      loading={loading}
    />
  );
}
