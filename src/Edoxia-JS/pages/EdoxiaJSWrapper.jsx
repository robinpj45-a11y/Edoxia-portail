import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

export default function EdoxiaJSWrapper() {
  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Snapshot for students
    const unsubStudents = onSnapshot(collection(db, "students"), (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 2. Snapshot for teams
    const qTeams = query(collection(db, "teams"), orderBy("numId"));
    const unsubTeams = onSnapshot(qTeams, (snap) => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      // Once teams load, we can assume both listeners are active.
      setLoading(false); 
    });

    return () => {
      unsubStudents();
      unsubTeams();
    };
  }, []);

  return (
    <Outlet context={{ students, teams, loading }} />
  );
}
