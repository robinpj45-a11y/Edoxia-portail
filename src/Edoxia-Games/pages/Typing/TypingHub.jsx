import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Keyboard, PlusCircle, LogIn } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

export default function TypingHub() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateLobbyCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleCreateLobby = async () => {
    setLoading(true);
    try {
      const code = generateLobbyCode();
      const docRef = await addDoc(collection(db, 'typing_lobbies'), {
        code: code,
        status: 'waiting',
        gameType: '2min200words',
        createdAt: new Date()
      });
      navigate(`/games/typing/host/${docRef.id}`);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la création de la partie.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLobby = (e) => {
    e.preventDefault();
    if (!joinCode || !firstName || !lastName) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    // L'Id de la room est résolu dans PlayerGame, ici on passe juste le code.
    navigate(`/games/typing/play/${joinCode}?f=${firstName}&l=${lastName}`);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col items-center py-12 px-4 selection:bg-brand-coral/20 font-sans">
      <div className="w-full max-w-4xl">
        <button onClick={() => navigate('/games')} className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-brand-text bg-white/40 rounded-full border border-white/50 hover:bg-white/80 transition-all shadow-soft backdrop-blur-md mb-12">
          <ArrowLeft size={18} /> Retour
        </button>

        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-white/30 rounded-3xl mb-6 shadow-soft border border-white/50">
            <Keyboard size={48} className="text-brand-teal" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-brand-text">Dactylographie</h1>
          <p className="text-xl text-brand-text/60 font-medium">2 minutes, 200 mots. Qui sera le plus rapide ?</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-brand-coral/10 border border-brand-coral/20 rounded-2xl text-brand-coral text-center font-bold">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Join Form */}
          <div className="bg-white/40 border border-white/50 p-8 rounded-[40px] shadow-soft backdrop-blur-md flex flex-col">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
              <LogIn className="text-brand-coral" /> Rejoindre
            </h2>
            <form onSubmit={handleJoinLobby} className="space-y-4 flex-1 flex flex-col">
              <input
                type="text"
                placeholder="Code de la partie (ex: 123456)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full bg-white/60 border border-white rounded-2xl p-4 text-brand-text font-bold text-center tracking-widest outline-none focus:ring-2 focus:ring-brand-coral"
                maxLength={6}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-white/60 border border-white rounded-2xl p-4 text-brand-text outline-none focus:ring-2 focus:ring-brand-coral"
                />
                <input
                  type="text"
                  placeholder="Nom"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-white/60 border border-white rounded-2xl p-4 text-brand-text outline-none focus:ring-2 focus:ring-brand-coral"
                />
              </div>
              <div className="flex-1 flex items-end mt-4">
                <button
                  type="submit"
                  className="w-full bg-brand-coral hover:bg-brand-coral/80 text-white font-black py-4 rounded-2xl transition-all shadow-md active:scale-95"
                >
                  Entrer dans l'arène
                </button>
              </div>
            </form>
          </div>

          {/* Create Lobby */}
          <div className="bg-white/40 border border-white/50 p-8 rounded-[40px] shadow-soft backdrop-blur-md flex flex-col items-center justify-center text-center">
            <Users size={48} className="text-brand-teal mb-6 opacity-80" />
            <h2 className="text-2xl font-black mb-4">Professeur</h2>
            <p className="text-brand-text/50 font-medium mt-2">
              Le premier jeu : Taper le plus de mots parmi les 200 les plus courants en 2 minutes.
            </p>
            <button
              onClick={handleCreateLobby}
              disabled={loading}
              className="w-full bg-brand-teal hover:bg-brand-teal/80 text-white font-black py-4 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? "Création..." : <><PlusCircle size={20} /> Créer une partie</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
