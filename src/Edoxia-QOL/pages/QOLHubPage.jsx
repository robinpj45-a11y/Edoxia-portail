import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Map, ArrowLeft, Calculator, Trophy, Users, Lock, LogIn, Eye, EyeOff, LogOut, Search } from 'lucide-react';

const QOLHubPage = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const repartAuth = localStorage.getItem('repart_auth');
    const jsAuth = localStorage.getItem('js2026_auth');
    if (repartAuth === 'Ecole' || jsAuth === 'Ecole') {
      setIsAuthorized(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'FFlaud!') {
      setIsAuthorized(true);
      localStorage.setItem('repart_auth', 'Ecole');
      localStorage.setItem('js2026_auth', 'Ecole');
    } else {
      setError('Mot de passe incorrect.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('repart_auth');
    localStorage.removeItem('js2026_auth');
    setIsAuthorized(false);
    navigate('/');
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-transparent font-sans p-4">
        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[40px] shadow-soft border border-white max-w-md w-full relative z-10">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-indigo-500" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-brand-text">Espace STPBB</h1>
            <p className="text-brand-text/50 font-medium mt-2">Veuillez entrer le mot de passe pour accéder aux outils</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
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
              {error && <p className="text-brand-coral text-sm font-bold px-1">{error}</p>}
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
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="w-full flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-brand-text bg-white/40 rounded-full border border-white/50 hover:bg-white/80 transition-all shadow-soft backdrop-blur-md w-fit h-fit focus:outline-none"
        >
          <ArrowLeft size={18} />
          Retour
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-brand-coral bg-white/40 rounded-full border border-white/50 hover:bg-brand-coral hover:text-white transition-all shadow-soft backdrop-blur-md w-fit h-fit focus:outline-none"
        >
          <LogOut size={18} />
          Quitter l'Espace École
        </button>
      </div>

      {/* Cards */}
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
          {/* CARTE 1 - Evénements */}
          <div onClick={() => navigate('/events')} className="bg-yellow-500 rounded-[20px] p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-transform cursor-pointer">
            <div className="p-3 bg-black/10 rounded-full shrink-0">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div className="overflow-hidden text-left">
              <div className="text-[12px] font-bold uppercase tracking-wider text-white/60 truncate">Organisation</div>
              <div className="text-xl font-semibold text-white truncate">Événements</div>
            </div>
          </div>
          {/* CARTE 1 - Calendrier (LOCKÉ) */}
          <div className="bg-brand-teal/40 rounded-[20px] p-6 flex items-center gap-4 shadow-sm grayscale cursor-not-allowed opacity-60 border border-white/20 relative overflow-hidden group">
            <div className="absolute top-2 right-3">
              <Lock size={14} className="text-white/40" />
            </div>
            <div className="p-3 bg-black/5 rounded-full shrink-0">
              <Calendar className="w-8 h-8 text-white/50" />
            </div>
            <div className="overflow-hidden text-left">
              <div className="text-[12px] font-bold uppercase tracking-wider text-white/40 truncate">Indisponible</div>
              <div className="text-xl font-semibold text-white/50 truncate">Calendrier</div>
            </div>
          </div>

          {/* CARTE 2 - Classe de mer 2026 */}
          <div onClick={() => navigate('/cd')} className="bg-brand-coral rounded-[20px] p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-transform cursor-pointer">
            <div className="p-3 bg-black/10 rounded-full shrink-0">
              <Map className="w-8 h-8 text-white" />
            </div>
            <div className="overflow-hidden text-left">
              <div className="text-[12px] font-bold uppercase tracking-wider text-white/60 truncate">Voyage scolaire</div>
              <div className="text-xl font-semibold text-white truncate">CD 2026</div>
            </div>
          </div>

          {/* CARTE 3 - Réussite scolaire */}
          <div onClick={() => navigate('/success')} className="bg-brand-teal rounded-[20px] p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-transform cursor-pointer">
            <div className="p-3 bg-black/10 rounded-full shrink-0">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <div className="overflow-hidden text-left">
              <div className="text-[12px] font-bold uppercase tracking-wider text-white/60 truncate">Suivi pédagogique</div>
              <div className="text-xl font-semibold text-white truncate">Calc. de Réussite</div>
            </div>
          </div>

          {/* CARTE 4 - JS 2026 */}
          <div onClick={() => navigate('/JS2026')} className="bg-orange-400 rounded-[20px] p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-transform cursor-pointer">
            <div className="p-3 bg-black/10 rounded-full shrink-0">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div className="overflow-hidden text-left">
              <div className="text-[12px] font-bold uppercase tracking-wider text-white/60 truncate">Vie scolaire</div>
              <div className="text-xl font-semibold text-white truncate">JS 2026</div>
            </div>
          </div>

          {/* CARTE 5 - Répartition */}
          <div onClick={() => navigate('/repart')} className="bg-indigo-500 rounded-[20px] p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-transform cursor-pointer">
            <div className="p-3 bg-black/10 rounded-full shrink-0">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="overflow-hidden text-left">
              <div className="text-[12px] font-bold uppercase tracking-wider text-white/60 truncate">Organisation</div>
              <div className="text-xl font-semibold text-white truncate">Répartition</div>
            </div>
          </div>
          {/* CARTE 6 - Recherche d'élève */}
          <div onClick={() => navigate('/JS2026/search', { state: { from: 'stpbb' } })} className="bg-rose-500 rounded-[20px] p-6 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-transform cursor-pointer">
            <div className="p-3 bg-black/10 rounded-full shrink-0">
              <Search className="w-8 h-8 text-white" />
            </div>
            <div className="overflow-hidden text-left">
              <div className="text-[12px] font-bold uppercase tracking-wider text-white/60 truncate">Informations</div>
              <div className="text-xl font-semibold text-white truncate">Recherche d'élève</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QOLHubPage;
