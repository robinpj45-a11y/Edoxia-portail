import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Lock, LogIn, Eye, EyeOff } from 'lucide-react';

export default function EdoxiaRepartWrapper() {
  const [students, setStudents] = useState([]);
  const [classesList, setClassesList] = useState([]); // destination classes
  const [loading, setLoading] = useState(true);

  // Auth state
  const [authRole, setAuthRole] = useState(localStorage.getItem('repart_auth') || null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Setup the initial data copy if repart_students is empty
  const initializeDatabaseIfNeeded = async () => {
    try {
      const repartSnap = await getDocs(collection(db, "repart_students"));
      if (repartSnap.empty) {
        console.log("Initialisation de repart_students depuis students...");
        const studentsSnap = await getDocs(collection(db, "students"));
        for (const studentDoc of studentsSnap.docs) {
          await setDoc(doc(db, "repart_students", studentDoc.id), {
             ...studentDoc.data(),
             team: null // we reset the "team" equivalent which we'll call "destinationClass" or keep "team" for simplicity in cloning
          });
        }
        console.log("Copie terminée !");
      }
    } catch (err) {
      console.error("Erreur d'initialisation :", err);
    }
  };

  useEffect(() => {
    if (!authRole) return;

    initializeDatabaseIfNeeded();

    // 1. Snapshot for students
    const unsubStudents = onSnapshot(collection(db, "repart_students"), (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 2. Snapshot for classes
    const qClasses = query(collection(db, "repart_classes"), orderBy("numId"));
    const unsubClasses = onSnapshot(qClasses, (snap) => {
      setClassesList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubStudents();
      unsubClasses();
    };
  }, [authRole]);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (password === 'FFlaud!') {
      setAuthRole('Ecole');
      localStorage.setItem('repart_auth', 'Ecole');
    } else {
      setError('Mot de passe incorrect.');
    }
  };

  if (!authRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg font-sans p-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-teal/20 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px] pointer-events-none" />

        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[40px] shadow-soft border border-white max-w-md w-full relative z-10">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-indigo-500" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-brand-text">Répartition 26/27</h1>
            <p className="text-brand-text/50 font-medium mt-2">Veuillez vous identifier (mot de passe école)</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-bold uppercase tracking-widest text-brand-text/60 px-1">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe..."
                  className="w-full bg-white border-2 border-brand-bg rounded-2xl p-4 pr-12 text-brand-text font-bold focus:border-indigo-500 outline-none transition-colors placeholder:text-brand-text/30 placeholder:font-normal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text/40 hover:text-indigo-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {error && <p className="text-brand-coral text-sm font-bold px-1 animate-in slide-in-from-top-1">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-500 text-white font-black text-lg py-4 rounded-2xl hover:bg-indigo-600 hover:-translate-y-1 transition-all active:translate-y-0 active:scale-95 shadow-soft hover:shadow-lg flex items-center justify-center gap-2"
            >
              <LogIn size={20} /> Accéder
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Outlet context={{ students, classesList, loading, authRole }} />
  );
}
