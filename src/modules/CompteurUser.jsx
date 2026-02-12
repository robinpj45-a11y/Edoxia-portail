// c:\Projets\Edoxia\src\modules\CompteurUser.jsx
import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ThemeContext } from '../ThemeContext';

export default function CompteurUser() {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === 'dark';
    const [count, setCount] = useState(0);

    useEffect(() => {
        // On considère un utilisateur "en ligne" s'il s'est connecté (ou a rechargé la page)
        // dans les 15 dernières minutes.
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        
        const q = query(
            collection(db, "presence"), 
            where("lastSeen", ">", fifteenMinutesAgo)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCount(snapshot.size);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${isDark ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold">
                {count} <span className="hidden sm:inline">en ligne</span>
            </span>
        </div>
    );
}
