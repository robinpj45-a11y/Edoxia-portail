import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Music, SkipBack, SkipForward, Shuffle, Repeat } from 'lucide-react';

export default function SongPage() {
    const navigate = useNavigate();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLooping, setIsLooping] = useState(false);
    const audioRef = useRef(null);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            // Sur iOS, forcer le rechargement si la piste n'est pas du tout prête
            if (audioRef.current.readyState === 0) {
                audioRef.current.load();
            }
            
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch(error => {
                        console.error("Erreur de lecture audio :", error);
                        setIsPlaying(false);
                        // On pourrait ici afficher un toast à l'utilisateur
                    });
            } else {
                setIsPlaying(true);
            }
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const restartSong = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            if (!isPlaying) togglePlay();
        }
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen font-sans pb-20 md:pb-0 transition-colors duration-300 bg-brand-bg text-brand-text md:h-screen md:flex md:flex-col md:overflow-hidden relative">
            <header className="p-4 sticky top-0 z-20 shadow-soft bg-white/80 backdrop-blur-md border-b border-white/50 shrink-0 flex items-center justify-between md:hidden">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/test-JS2026')} className="p-2 rounded-full transition-all bg-white/50 hover:bg-white text-brand-text/50 hover:text-brand-text shadow-sm active:scale-95">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-black tracking-tight flex items-center gap-2">Chanson <span className="text-brand-teal">JS</span></h1>
                </div>
            </header>

            {/* Bouton Retour Flottant (Ordinateur) */}
            <button
                onClick={() => navigate('/test-JS2026')}
                className="hidden md:flex fixed top-6 left-6 z-50 p-2.5 rounded-full transition-all bg-white/60 hover:bg-white text-brand-text/60 hover:text-brand-text shadow-soft active:scale-95 items-center justify-center backdrop-blur-md border border-white/50"
            >
                <ArrowLeft size={20} />
            </button>

            <main className="p-4 md:p-6 md:py-8 md:pl-[80px] w-full mx-auto md:max-w-none flex flex-col gap-6 md:flex-1 md:flex-row relative">
                {/* Audio Player Module (Flottant sur Desktop - Taille réduite) */}
                <div className="bg-white text-brand-text rounded-[32px] md:rounded-[24px] p-6 md:p-5 shadow-soft border border-white/50 flex flex-col items-center gap-6 md:gap-4 relative overflow-hidden md:fixed md:bottom-6 md:right-6 md:w-[320px] md:z-50 md:shadow-2xl md:backdrop-blur-xl md:bg-white/90">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-teal/5 to-brand-peach/5 pointer-events-none"></div>

                    {/* Header du lecteur */}
                    <div className="w-full flex items-center gap-4 z-10 w-full">
                        <div className={`w-[72px] h-[72px] md:w-[60px] md:h-[60px] shrink-0 bg-gradient-to-br from-brand-teal to-brand-peach rounded-[20px] md:rounded-[16px] flex items-center justify-center text-white shadow-md transition-transform duration-700 ${isPlaying ? 'scale-[1.02] shadow-brand-teal/20' : 'scale-100'}`}>
                            <Music size={28} className={isPlaying ? 'animate-bounce' : ''} />
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                            <h2 className="font-bold text-xl md:text-lg truncate tracking-tight text-brand-text">Hymne JS 2026</h2>
                            <p className="text-sm md:text-xs font-medium text-brand-text/50 truncate mt-0.5">Saint Paul Bourdon Blanc</p>
                        </div>
                    </div>

                    {/* Lecteur natif masqué */}
                    <audio
                        ref={audioRef}
                        src="/hymne-js.mp3"
                        preload="auto"
                        playsInline
                        onEnded={() => setIsPlaying(false)}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        loop={isLooping}
                        className="hidden"
                    />

                    <div className="w-full flex flex-col gap-1 z-10 mt-2 md:mt-0">
                        {/* Barre de progression */}
                        <div className="flex items-center gap-3 text-xs md:text-[10px] text-brand-text/50 font-medium">
                            <span className="w-8 text-right tabular-nums">{formatTime(currentTime)}</span>

                            <div className="flex-1 relative flex items-center group h-5 cursor-pointer">
                                {/* Fond de la barre */}
                                <div className="absolute w-full h-1 bg-brand-text/10 rounded-full overflow-hidden">
                                    {/* Remplissage de la barre */}
                                    <div className="h-full bg-brand-text/40 group-hover:bg-brand-teal transition-colors" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}></div>
                                </div>
                                {/* Le pointeur invisible natif */}
                                <input
                                    type="range"
                                    min={0}
                                    max={duration || 100}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="absolute w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>

                            <span className="w-8 tabular-nums">{formatTime(duration)}</span>
                        </div>

                        {/* Contrôles Principaux */}
                        <div className="flex items-center justify-center w-full px-1 mt-4 md:mt-2 relative">
                            {/* Les contrôles du centre */}
                            <div className="flex items-center gap-5 md:gap-4">
                                <button onClick={restartSong} className="text-brand-text/70 hover:text-brand-text transition-colors active:scale-90"><SkipBack size={24} fill="currentColor" /></button>

                                <button
                                    onClick={togglePlay}
                                    className="bg-brand-teal text-white w-16 h-16 md:w-14 md:h-14 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(45,212,191,0.4)]"
                                >
                                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                                </button>

                                <button className="text-brand-text/70 hover:text-brand-text transition-colors active:scale-90"><SkipForward size={24} fill="currentColor" /></button>
                            </div>

                            {/* Le bouton répétition positionné à droite */}
                            <button
                                onClick={() => setIsLooping(!isLooping)}
                                className={`absolute right-1 p-2 md:p-1.5 rounded-full transition-all active:scale-95 ${isLooping ? 'text-brand-teal bg-brand-teal/10' : 'text-brand-text/30 hover:text-brand-text/50'}`}
                            >
                                <Repeat size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Lyrics : Container principal sécurisé pour ne pas chevaucher le widget à droite */}
                <div className="bg-white/60 md:bg-white/30 backdrop-blur-sm rounded-[30px] md:rounded-[32px] p-6 shadow-soft border border-white/50 mb-8 md:mb-0 w-full md:w-[calc(100%-340px)] flex flex-col justify-center h-full overflow-y-auto">
                    <h3 className="font-black text-brand-text/40 text-center uppercase tracking-widest text-xs md:text-[11px] mb-6 md:mb-3 shrink-0 flex items-center gap-4">
                        <div className="flex-1 h-px bg-brand-text/10"></div>
                        Paroles
                        <div className="flex-1 h-px bg-brand-text/10"></div>
                    </h3>

                    {/* Grille de 3 colonnes indépendantes pour éviter les chevauchements */}
                    <div className="flex flex-col md:grid md:grid-cols-3 gap-6 md:gap-x-4 lg:gap-x-6 text-center font-bold text-brand-text text-[17px] md:text-[13px] lg:text-[15px] leading-relaxed md:leading-normal w-full md:h-full">

                        {/* Colonne 1 : Couplet 1 + Refrain */}
                        <div className="flex flex-col gap-4 md:gap-2 lg:gap-4 h-full">
                            <p className="flex-1 flex items-center justify-center">
                                <span>
                                    À Saint Paul Bourdon Blanc, on se lève ce matin,<br />
                                    On court, on saute, on rit, on va jusqu’au chemin.<br />
                                    On essaie toujours, on se dépasse, on ose,<br />
                                    Avec nos amis, chacun trouve sa cause.
                                </span>
                            </p>
                            <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-[24px] md:rounded-[20px] p-4 md:p-3 flex-1 flex items-center justify-center shadow-inner">
                                <p className="font-black text-brand-teal text-xl md:text-[14px] lg:text-[16px] leading-snug md:leading-tight drop-shadow-sm">
                                    Deviens qui tu es, viens danser avec nous,<br />
                                    À la journée sportive, on joue jusqu’au bout.<br />
                                    Petits et grands ensemble, la main dans la main,<br />
                                    À Saint Paul Bourdon Blanc, on va toujours plus loin.
                                </p>
                            </div>
                        </div>

                        {/* Colonne 2 : Couplet 2 + Refrain */}
                        <div className="flex flex-col gap-4 md:gap-2 lg:gap-4 h-full">
                            <p className="flex-1 flex items-center justify-center">
                                <span>
                                    On s’entraide, on partage, on joue tous ensemble,<br />
                                    Petits et grands réunis, notre cœur rassemble.<br />
                                    On apprend et on rit, on avance pas à pas,<br />
                                    Avec courage et sourire, chacun trouve sa voie.
                                </span>
                            </p>
                            <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-[24px] md:rounded-[20px] p-4 md:p-3 flex-1 flex items-center justify-center shadow-inner">
                                <p className="font-black text-brand-teal text-xl md:text-[14px] lg:text-[16px] leading-snug md:leading-tight drop-shadow-sm">
                                    Deviens qui tu es, viens danser avec nous,<br />
                                    À la journée sportive, on joue jusqu’au bout.<br />
                                    Petits et grands ensemble, la main dans la main,<br />
                                    À Saint Paul Bourdon Blanc, on va toujours plus loin.
                                </p>
                            </div>
                        </div>

                        {/* Colonne 3 : Couplet 3 + Refrain */}
                        <div className="flex flex-col gap-4 md:gap-2 lg:gap-4 h-full">
                            <p className="flex-1 flex items-center justify-center">
                                <span>
                                    De la Petite Section au CM2,<br />
                                    On joue, on rit, on va tous plus loin.<br />
                                    Petits et grands, ensemble on apprend,<br />
                                    À Saint Paul Bourdon Blanc, on est tous gagnants !
                                </span>
                            </p>
                            <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-[24px] md:rounded-[20px] p-4 md:p-3 flex-1 flex items-center justify-center shadow-inner">
                                <p className="font-black text-brand-teal text-xl md:text-[14px] lg:text-[16px] leading-snug md:leading-tight drop-shadow-sm">
                                    Deviens qui tu es, viens danser avec nous,<br />
                                    À la journée sportive, on joue jusqu’au bout.<br />
                                    Petits et grands ensemble, la main dans la main,<br />
                                    À Saint Paul Bourdon Blanc, on va toujours plus loin.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
