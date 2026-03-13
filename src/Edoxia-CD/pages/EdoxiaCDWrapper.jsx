import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

export default function EdoxiaCDWrapper() {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch only CM2 students
    const qStudents = query(
      collection(db, 'students'),
      where('classLabel', 'in', ['CM2 - Lisa K.', 'CM2 - Célia N.'])
    );

    const unsubscribeStudents = onSnapshot(qStudents, (snapshot) => {
      const studs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studs);
      
      // Fetch rooms
      const qRooms = query(collection(db, 'cd_rooms'));
      const unsubscribeRooms = onSnapshot(qRooms, (roomSnapshot) => {
        const rms = roomSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // sort by order if available
        rms.sort((a, b) => (a.order || 0) - (b.order || 0));
        setRooms(rms);
        setLoading(false);
      });

      return () => {
        unsubscribeRooms();
      };
    });

    return () => {
      unsubscribeStudents();
    };
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-coral/20">
      <Outlet context={{ students, rooms, loading }} />
    </div>
  );
}
