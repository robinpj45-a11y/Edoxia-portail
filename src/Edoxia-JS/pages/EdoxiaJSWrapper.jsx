import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Lock, LogIn, Eye, EyeOff } from 'lucide-react';

export default function EdoxiaJSWrapper() {
  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [scheduleSlots, setScheduleSlots] = useState([]);
  const [scheduleActivities, setScheduleActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth state
  const [authRole, setAuthRole] = useState(localStorage.getItem('js2026_auth') || null);
  const [selectedRole, setSelectedRole] = useState('Parent');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

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

    // 3. Snapshot for schedule slots
    const qSlots = query(collection(db, "scheduleSlots"), orderBy("order"));
    const unsubSlots = onSnapshot(qSlots, (snap) => {
      setScheduleSlots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 4. Snapshot for schedule activities
    const unsubActivities = onSnapshot(collection(db, "scheduleActivities"), (snap) => {
      // Sort activities alphabetically client-side to avoid needing an index
      const activities = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      activities.sort((a, b) => a.name.localeCompare(b.name));
      setScheduleActivities(activities);
    });

    return () => {
      unsubStudents();
      unsubTeams();
      unsubSlots();
      unsubActivities();
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (selectedRole === 'Parent') {
      setAuthRole('Parent');
      localStorage.setItem('js2026_auth', 'Parent');
    } else if (selectedRole === 'Ecole' && password === 'FFlaud!') {
      setAuthRole('Ecole');
      localStorage.setItem('js2026_auth', 'Ecole');
    } else if (selectedRole === 'Formasat' && password === 'FFormasat!') {
      setAuthRole('Formasat');
      localStorage.setItem('js2026_auth', 'Formasat');
    } else {
      setError('Mot de passe incorrect.');
    }
  };

  if (!authRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg font-sans p-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-teal/20 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-coral/20 rounded-full blur-[128px] pointer-events-none" />

        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[40px] shadow-soft border border-white max-w-md w-full relative z-10">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-brand-teal/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-brand-teal" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-brand-text">JS 2026</h1>
            <p className="text-brand-text/50 font-medium mt-2">Veuillez vous identifier pour accéder au module</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-brand-text/60 px-1">Je suis un(e)...</label>
              <select
                value={selectedRole}
                onChange={(e) => { setSelectedRole(e.target.value); setPassword(''); setError(''); }}
                className="w-full bg-white border-2 border-brand-bg rounded-2xl p-4 text-brand-text font-bold focus:border-brand-teal outline-none transition-colors cursor-pointer appearance-none"
              >
                <option value="Parent">Parent / Accompagnateur</option>
                <option value="Ecole">École</option>
                <option value="Formasat">Formasat</option>
              </select>
            </div>

            {selectedRole !== 'Parent' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-text/60 px-1">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe..."
                    className="w-full bg-white border-2 border-brand-bg rounded-2xl p-4 pr-12 text-brand-text font-bold focus:border-brand-teal outline-none transition-colors placeholder:text-brand-text/30 placeholder:font-normal"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text/40 hover:text-brand-teal transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-brand-coral/10 border border-brand-coral/20 rounded-xl text-brand-coral text-sm font-bold text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-4 bg-brand-teal hover:bg-brand-teal/90 text-white font-black py-4 rounded-2xl transition-all shadow-soft shadow-brand-teal/20 flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              Accéder
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Outlet context={{ students, teams, scheduleSlots, scheduleActivities, loading, authRole }} />
  );
}
