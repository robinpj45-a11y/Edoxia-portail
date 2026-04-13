import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, MapPin, X, ArrowLeft, Move, List, Edit2, Trash2, Flag, Trophy, Target, Activity, Utensils, Droplets, Star, Info } from 'lucide-react';
import { getFirestore, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

const AVAILABLE_ICONS = {
    MapPin, Flag, Trophy, Target, Activity, Utensils, Droplets, Star, Info
};

const MapInteractivePage = () => {
    const navigate = useNavigate();
    const db = getFirestore();
    const mapRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const [zones, setZones] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAdminDrawingState, setIsAdminDrawingState] = useState(false); // Controls if admin logic forces drawing mode
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    
    // Interactions
    const [highlightedZoneId, setHighlightedZoneId] = useState(null);
    const [editingZone, setEditingZone] = useState(null); // Zone en cours d'édition (popup d'info)
    
    // Dessin de zone
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });

    // Navigation sur la carte
    const [zoomLevel, setZoomLevel] = useState(100); // 100% = fit
    const [isDraggingMap, setIsDraggingMap] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        // Chargement des données Firebase
        const mapDocRef = doc(db, 'js2026_data', 'map_zones');
        const unsubscribe = onSnapshot(mapDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setZones(docSnap.data().zones || []);
            } else {
                setDoc(mapDocRef, { zones: [] });
            }
        });

        return () => unsubscribe();
    }, [db]);

    useEffect(() => {
        if (isImageLoaded && scrollContainerRef.current) {
            const el = scrollContainerRef.current;
            el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
            el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
        }
    }, [isImageLoaded, zoomLevel]);

    const handleAdminLogin = () => {
        if (isAdmin) {
            setIsAdmin(false);
            return;
        }
        const pwd = prompt("Mot de passe administrateur :");
        if (pwd === "stpbb") {
            setIsAdmin(true);
            setIsAdminDrawingState(true);
            alert("Mode administrateur activé. Le bouton en haut à droite vous permet de basculer entre la navigation et le tracé de zones.");
            setIsMenuOpen(false);
        } else if (pwd !== null) {
            alert("Mot de passe incorrect.");
        }
    };

    const saveZonesToFirebase = async (updatedZones) => {
        try {
            await updateDoc(doc(db, 'js2026_data', 'map_zones'), {
                zones: updatedZones
            });
        } catch (error) {
            console.error("Erreur de sauvegarde:", error);
            alert("Erreur lors de la sauvegarde.");
        }
    };

    // Gestion du tracé (Pointer Events pour supporter tactile et souris)
    const handlePointerDown = (e) => {
        if (!isAdmin || !isAdminDrawingState) return;
        // Empêcher le scroll fluide si on veut dessiner
        if (e.target.closest('.interactive-zone')) return; // Ne pas dessiner si on clique sur une zone existante
        
        const rect = mapRef.current.getBoundingClientRect();
        // Calcul des pourcentages
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        setStartPos({ x, y });
        setCurrentPos({ x, y });
        setIsDrawing(true);
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDrawing) return;
        const rect = mapRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setCurrentPos({ x: Math.max(0, Math.min(x, 100)), y: Math.max(0, Math.min(y, 100)) });
    };

    const handlePointerUp = (e) => {
        if (!isDrawing) return;
        setIsDrawing(false);
        e.target.releasePointerCapture(e.pointerId);

        // Calcul final de la boîte de délimitation
        const left = Math.min(startPos.x, currentPos.x);
        const top = Math.min(startPos.y, currentPos.y);
        const width = Math.abs(currentPos.x - startPos.x);
        const height = Math.abs(currentPos.y - startPos.y);

        // Si la zone est minuscule (clic simple sans drag), on ignore
        if (width < 2 && height < 2) return;

        // Créer une zone temporaire et ouvrir le formulaire
        const newZone = {
            id: Date.now().toString(),
            name: "Nouvelle Zone",
            description: "",
            left, top, width, height,
            color: '#2DD4BF' // default teal
        };
        
        const name = prompt("Nom de l'atelier / point d'intérêt :");
        if (!name) return; // Annulation
        
        const description = prompt("Courte description (facultatif) :");
        newZone.name = name;
        newZone.description = description || "";

        const newZones = [...zones, newZone];
        setZones(newZones); // Optimistic update
        saveZonesToFirebase(newZones);
    };

    const handleDeleteZone = (id) => {
        if (window.confirm("Voulez-vous vraiment supprimer cette zone ?")) {
            const newZones = zones.filter(z => z.id !== id);
            setZones(newZones);
            saveZonesToFirebase(newZones);
            setEditingZone(null);
        }
    };

    const handleEditZone = (zone) => {
        const name = prompt("Modifier le nom :", zone.name);
        if (name === null) return;
        const description = prompt("Modifier la description :", zone.description);
        
        const newZones = zones.map(z => {
            if (z.id === zone.id) {
                return { ...z, name, description: description !== null ? description : z.description };
            }
            return z;
        });
        setZones(newZones);
        saveZonesToFirebase(newZones);
        setEditingZone(null);
    };

    const focusZone = (zoneId) => {
        setHighlightedZoneId(zoneId);
        setIsMenuOpen(false);

        const el = document.getElementById(`zone-${zoneId}`);
        if (el && scrollContainerRef.current) {
            // Un petit scrollIntoView centré fluide pour trouver la zone
            el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }

        // Enlever la surbrillance après qq secondes
        setTimeout(() => {
            setHighlightedZoneId(null);
        }, 4000);
    };

    // Gestion de la navigation drag-to-scroll
    const handlePanStart = (e) => {
        // Ignorer si on est admin EN tracé, ou s'il s'agit d'un point tactile (le natif est géré par css touch-action)
        if ((isAdmin && isAdminDrawingState) || e.pointerType === 'touch') return;
        setIsDraggingMap(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setScrollStart({
            x: scrollContainerRef.current.scrollLeft,
            y: scrollContainerRef.current.scrollTop
        });
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePanMove = (e) => {
        if (!isDraggingMap || (isAdmin && isAdminDrawingState)) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        scrollContainerRef.current.scrollLeft = scrollStart.x - dx;
        scrollContainerRef.current.scrollTop = scrollStart.y - dy;
    };

    const handlePanEnd = (e) => {
        if (isDraggingMap) {
            setIsDraggingMap(false);
            e.target.releasePointerCapture(e.pointerId);
        }
    };

    // Calcul du style du rectangle en cours de dessin
    const renderDrawingBox = () => {
        if (!isDrawing) return null;
        const left = Math.min(startPos.x, currentPos.x);
        const top = Math.min(startPos.y, currentPos.y);
        const width = Math.abs(currentPos.x - startPos.x);
        const height = Math.abs(currentPos.y - startPos.y);

        return (
            <div 
                className="absolute border-2 border-brand-teal bg-brand-teal/30 pointer-events-none rounded-full"
                style={{
                    left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`
                }}
            />
        );
    };

    return (
        <div className="h-[100dvh] bg-brand-bg flex flex-col font-sans overflow-hidden relative">
            
            {/* Bouton Retour Flottant Supplémentaire pour faciliter la vie */}
            <button 
                onClick={() => navigate('/JS2026')} 
                className="fixed top-6 left-6 z-40 p-3 md:p-4 rounded-full transition-all bg-white/70 hover:bg-white text-brand-text shadow-soft active:scale-95 items-center justify-center backdrop-blur-md border border-white/50"
            >
                <ArrowLeft size={24} />
            </button>

            {/* Etiquette Mode Admin (Bouton pour activer/désactiver le dessin) */}
            {isAdmin && (
                <button 
                    onClick={() => setIsAdminDrawingState(!isAdminDrawingState)}
                    className={`fixed top-6 right-6 z-40 px-4 py-2 text-white rounded-full font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 ${isAdminDrawingState ? 'bg-rose-500 animate-pulse' : 'bg-brand-teal'}`}
                >
                    <Edit2 size={16} />
                    {isAdminDrawingState ? 'Mode Tracé: Activé' : 'Mode Tracé: Désactivé'}
                </button>
            )}

            {/* Zone Scrollable du Plan */}
            <main 
                ref={scrollContainerRef}
                className={`flex-1 overflow-auto w-full relative bg-white ${(isAdmin && isAdminDrawingState && isDrawing) ? 'touch-none' : ''} ${isDraggingMap ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ overscrollBehavior: 'none' }} // empèche le pull to refresh
                onPointerDown={handlePanStart}
                onPointerMove={handlePanMove}
                onPointerUp={handlePanEnd}
                onPointerCancel={handlePanEnd}
            >
                {/* Conteneur avec fond blanc et grand padding pour pouvoir naviguer et déborder */}
                <div className="w-max h-max p-[40vh] md:p-[30vw]">
                    <div 
                        ref={mapRef}
                        className="relative shadow-2xl bg-white border border-brand-text/10"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        style={{ 
                            touchAction: (isAdmin && isAdminDrawingState) ? 'none' : 'auto',
                            width: `${zoomLevel}vw`, 
                            maxWidth: `${zoomLevel * 10}px`, // Fallback desktop restraint basé sur le zoom
                            transition: isDraggingMap ? 'none' : 'width 0.3s ease-out, max-width 0.3s ease-out'
                        }} 
                    >
                        <img 
                            src="/CarteInteractive.png" 
                            alt="Plan de la Journée Sportive"
                            className="w-full h-auto object-contain select-none pointer-events-none"
                            draggable="false"
                            onLoad={() => setIsImageLoaded(true)}
                        />

                    {/* Rendu dynamique des zones enregistrées */}
                    <AnimatePresence>
                        {zones.map((zone) => {
                            const isHighlighted = highlightedZoneId === zone.id;
                            
                            return (
                                <motion.div 
                                    key={zone.id}
                                    id={`zone-${zone.id}`}
                                    className={`absolute cursor-pointer interactive-zone flex items-center justify-center transition-all rounded-full ${isHighlighted ? 'z-30' : 'z-10'} ${isAdmin ? 'hover:border-2 hover:border-black/50' : ''}`}
                                    style={{
                                        left: `${zone.left}%`,
                                        top: `${zone.top}%`,
                                        width: `${zone.width}%`,
                                        height: `${zone.height}%`,
                                        backgroundColor: isHighlighted ? 'rgba(45, 212, 191, 0.4)' : 'transparent',
                                        border: isHighlighted ? '3px solid #2DD4BF' : (isAdmin ? '2px dashed rgba(0,0,0,0.5)' : 'none'),
                                        boxShadow: isHighlighted ? '0 0 30px rgba(45, 212, 191, 0.8)' : 'none'
                                    }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1, scale: isHighlighted ? 1.05 : 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={(e) => {
                                        e.stopPropagation(); // ne pas déclencher le draw
                                        if (isAdmin) setEditingZone(zone);
                                        else focusZone(zone.id); // Sur mobile utilisateur: cliquer sur une zone invisible/visible l'anime
                                    }}
                                >
                                    {zone.icon && AVAILABLE_ICONS[zone.icon] && React.createElement(AVAILABLE_ICONS[zone.icon], {
                                        size: isAdmin ? 20 : 24,
                                        className: `relative z-20 pointer-events-none drop-shadow-sm ${isHighlighted ? 'text-brand-teal scale-125' : 'text-brand-teal bg-white/70 p-1 rounded-full shadow-sm'} transition-all`
                                    })}
                                    {isHighlighted && (
                                        <span className="absolute flex h-full w-full pointer-events-none">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-teal opacity-20"></span>
                                        </span>
                                    )}
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>

                    {/* Zone de dessin temp */}
                    {renderDrawingBox()}
                </div>
                </div>
            </main>

            {/* Contrôles de Zoom (Droite, au dessus de la barre) */}
            <div className="fixed right-6 bottom-28 z-40 flex flex-col gap-2 bg-white/80 p-2 rounded-2xl shadow-soft border border-white/50 backdrop-blur-md">
                <button onClick={() => setZoomLevel(z => Math.min(z + 50, 400))} className="p-2 bg-brand-bg rounded-xl text-brand-text hover:bg-brand-teal/20 transition-colors"><div className="text-xl leading-none font-bold">+</div></button>
                <div className="w-full h-px bg-brand-text/10" />
                <button onClick={() => setZoomLevel(z => Math.max(z - 50, 50))} className="p-2 bg-brand-bg rounded-xl text-brand-text hover:bg-brand-text/10 transition-colors"><div className="text-xl leading-none font-bold">-</div></button>
            </div>

            {/* Menu Contextuel Admin (Editer/Supprimer Zone) */}
            <AnimatePresence>
                {isAdmin && editingZone && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-24 left-4 right-4 md:left-auto md:right-1/2 md:translate-x-1/2 md:w-96 bg-white rounded-2xl p-4 shadow-2xl border border-brand-text/10 z-50 flex flex-col gap-3"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-brand-text leading-tight">{editingZone.name}</h3>
                                {editingZone.description && <p className="text-sm text-brand-text/60 mt-1 line-clamp-2">{editingZone.description}</p>}
                            </div>
                            <button onClick={() => setEditingZone(null)} className="p-1 text-brand-text/40 hover:text-brand-text"><X size={20} /></button>
                        </div>

                        {/* Icon Selector */}
                        <div className="flex flex-col gap-1.5 border-y border-brand-text/5 py-3">
                            <span className="text-[10px] font-bold uppercase text-brand-text/40 tracking-wider pl-1">Pictogramme</span>
                            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <button
                                    onClick={() => {
                                        const newZones = zones.map(z => z.id === editingZone.id ? { ...z, icon: null } : z);
                                        setZones(newZones);
                                        saveZonesToFirebase(newZones);
                                        setEditingZone({ ...editingZone, icon: null });
                                    }}
                                    className={`p-2 rounded-[12px] shrink-0 transition-all flex items-center justify-center ${!editingZone.icon ? 'bg-brand-teal text-white shadow-md' : 'bg-brand-bg text-brand-text/50 hover:bg-brand-teal/10 hover:text-brand-teal'}`}
                                    title="Aucun pictogramme"
                                >
                                    <X size={20} />
                                </button>
                                {Object.entries(AVAILABLE_ICONS).map(([iconName, IconComponent]) => (
                                    <button
                                        key={iconName}
                                        onClick={() => {
                                            const newZones = zones.map(z => z.id === editingZone.id ? { ...z, icon: iconName } : z);
                                            setZones(newZones);
                                            saveZonesToFirebase(newZones);
                                            setEditingZone({ ...editingZone, icon: iconName });
                                        }}
                                        className={`p-2 rounded-[12px] shrink-0 transition-all flex items-center justify-center ${editingZone.icon === iconName ? 'bg-brand-teal text-white shadow-md' : 'bg-brand-bg text-brand-text/60 hover:bg-brand-teal/10 hover:text-brand-teal'}`}
                                        title={iconName}
                                    >
                                        <IconComponent size={20} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-1.5">
                            <button onClick={() => handleEditZone(editingZone)} className="flex-1 py-2 px-3 bg-brand-bg rounded-lg text-brand-text text-sm font-bold flex items-center justify-center gap-2 hover:bg-brand-teal/10 hover:text-brand-teal transition-colors"><Edit2 size={16}/> Editer</button>
                            <button onClick={() => handleDeleteZone(editingZone.id)} className="flex-1 py-2 px-3 bg-brand-bg rounded-lg text-rose-500 text-sm font-bold flex items-center justify-center gap-2 hover:bg-rose-50 transition-colors"><Trash2 size={16}/> Supprimer</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Barre d'outils inférieure flottante */}
            <div className="fixed bottom-6 w-full px-4 md:px-8 pointer-events-none z-50">
                <div className="max-w-lg mx-auto bg-white/90 backdrop-blur-xl rounded-[24px] shadow-2xl p-2 pr-6 border border-white/50 flex justify-between items-center pointer-events-auto">
                    <button 
                        onClick={() => setIsMenuOpen(true)}
                        className="flex-1 flex items-center gap-4 py-3 px-4 bg-brand-teal/10 hover:bg-brand-teal/20 active:bg-brand-teal/30 rounded-[20px] transition-colors"
                    >
                        <div className="bg-brand-teal text-white p-2 rounded-full shadow-lg">
                            <List size={22} fill="currentColor" />
                        </div>
                        <span className="font-black text-brand-teal text-lg">Points d'intérêts</span>
                    </button>
                    
                    <button 
                        onClick={handleAdminLogin}
                        className={`ml-4 p-3 rounded-full transition-colors ${isAdmin ? 'text-rose-500 hover:bg-rose-50' : 'text-brand-text/40 hover:text-brand-text hover:bg-brand-bg active:bg-brand-text/5'}`}
                    >
                        <Settings size={24} className={isAdmin ? 'animate-spin-slow' : ''} />
                    </button>
                </div>
            </div>

            {/* Drawer Modal : Liste des Ateliers */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-brand-text/40 backdrop-blur-sm z-[90]"
                        />
                        <motion.div 
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 w-full h-[70vh] bg-brand-bg rounded-t-[40px] shadow-[0_-20px_40px_rgba(0,0,0,0.15)] z-[100] flex flex-col overflow-hidden"
                        >
                            <div className="p-6 pb-2 border-b border-brand-text/5 shrink-0 flex items-center justify-between bg-white relative">
                                {/* Petite poignée design */}
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-brand-text/10"></div>
                                
                                <h2 className="text-xl font-black mt-2 text-brand-text flex items-center gap-2"><MapPin size={24} className="text-brand-coral" /> Liste des lieux</h2>
                                <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full text-brand-text/50 hover:bg-brand-bg mt-2"><X size={24} /></button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-brand-bg">
                                {zones.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center px-6">
                                        <div className="w-20 h-20 bg-brand-text/5 rounded-full flex items-center justify-center mb-4 text-brand-text/20">
                                            <MapPin size={32} />
                                        </div>
                                        <p className="text-brand-text/50 font-medium">Aucun point d'intérêt n'a encore été ajouté à la carte.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {zones.map((zone) => (
                                            <button 
                                                key={zone.id}
                                                onClick={() => focusZone(zone.id)}
                                                className="w-full text-left bg-white p-4 rounded-2xl shadow-sm border border-brand-text/5 hover:shadow-md hover:border-brand-teal/30 active:scale-[0.98] transition-all flex flex-col gap-1 group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-bold text-brand-text group-hover:text-brand-teal transition-colors flex items-center gap-2">
                                                        {zone.icon && AVAILABLE_ICONS[zone.icon] 
                                                            ? React.createElement(AVAILABLE_ICONS[zone.icon], { size: 16, className: "text-brand-teal opacity-70" })
                                                            : <MapPin size={16} className="text-brand-teal opacity-50" />
                                                        }
                                                        {zone.name}
                                                    </h4>
                                                    <ArrowLeft size={16} className="text-brand-text/20 group-hover:text-brand-teal group-hover:translate-x-1 rotate-180 transition-all" />
                                                </div>
                                                {zone.description && (
                                                    <p className="text-sm font-medium text-brand-text/50 pl-6">{zone.description}</p>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div>
    );
};

export default MapInteractivePage;
