import React, { useState, useEffect } from 'react';
import { getAuth, updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { User, Camera, Save, Mail, Shield, ArrowLeft, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const auth = getAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [pseudo, setPseudo] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('élève');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');

  useEffect(() => {
    if (user) {
        const fetchUserData = async () => {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setRole(docSnap.data().role || 'élève');
                if (docSnap.data().pseudo) setPseudo(docSnap.data().pseudo);
                if (docSnap.data().photoURL) setPhotoURL(docSnap.data().photoURL);
                if (docSnap.data().nom) setNom(docSnap.data().nom);
                if (docSnap.data().prenom) setPrenom(docSnap.data().prenom);
            }
        };
        fetchUserData();
    } else {
        navigate('/');
    }
  }, [user, navigate]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
        await updateProfile(user, {
            displayName: pseudo,
            photoURL: photoURL
        });
        
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            pseudo: pseudo,
            photoURL: photoURL,
            nom: nom,
            prenom: prenom
        });

        alert("Profil mis à jour avec succès !");
    } catch (error) {
        console.error(error);
        alert("Erreur lors de la mise à jour : " + error.message);
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto pb-20 min-h-screen text-white">
        <div className="mb-8">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} /> Retour à l'accueil
            </button>
        </div>

        <div className="flex items-center justify-between mb-10">
            <h1 className="text-3xl font-bold flex items-center gap-3">
                <User className="text-cyan-400" size={32} /> Mon Profil
            </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Carte d'identité visuelle */}
            <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-xl flex flex-col items-center backdrop-blur-sm">
                <div className="relative mb-6 group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-cyan-500/30 bg-slate-800 flex items-center justify-center">
                        {photoURL ? (
                            <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={64} className="text-slate-500" />
                        )}
                    </div>
                </div>
                <h2 className="text-2xl font-bold mb-1 text-white">{pseudo || 'Utilisateur'}</h2>
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-sm border border-slate-700 uppercase tracking-wider font-bold">
                    {role}
                </span>
            </div>

            {/* Formulaire d'édition */}
            <div className="lg:col-span-2 bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-xl backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4 text-white">
                    <Settings className="text-cyan-400" size={20} /> Informations Personnelles
                </h3>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2 uppercase tracking-wider font-bold">Nom</label>
                            <input 
                                type="text" 
                                value={nom}
                                onChange={(e) => setNom(e.target.value)}
                                className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none text-white transition-all"
                                placeholder="Votre nom..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2 uppercase tracking-wider font-bold">Prénom</label>
                            <input 
                                type="text" 
                                value={prenom}
                                onChange={(e) => setPrenom(e.target.value)}
                                className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none text-white transition-all"
                                placeholder="Votre prénom..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-2 uppercase tracking-wider font-bold">Pseudo</label>
                        <input 
                            type="text" 
                            value={pseudo}
                            onChange={(e) => setPseudo(e.target.value)}
                            className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none text-white transition-all"
                            placeholder="Votre pseudo..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-2 uppercase tracking-wider font-bold">Photo de profil (URL)</label>
                        <input 
                            type="text" 
                            value={photoURL}
                            onChange={(e) => setPhotoURL(e.target.value)}
                            className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none text-white transition-all text-sm"
                            placeholder="https://..."
                        />
                        <p className="text-xs text-slate-500 mt-2">Collez l'adresse d'une image (ex: Imgur, Discord...)</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                            <div className="flex items-center gap-2 text-slate-400 mb-1 text-sm">
                                <Mail size={14} /> Adresse Email
                            </div>
                            <div className="text-white font-mono text-sm truncate">{user.email}</div>
                        </div>
                        <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                             <div className="flex items-center gap-2 text-slate-400 mb-1 text-sm">
                                <Shield size={14} /> Statut du compte
                            </div>
                            <div className="text-emerald-400 font-bold text-sm flex items-center gap-2">
                                {user.emailVerified ? 'Vérifié' : 'Non vérifié'}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-cyan-900/20 mt-4 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? 'Enregistrement...' : <><Save size={20} /> Enregistrer les modifications</>}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
}
