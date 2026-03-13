import React, { useState, useCallback, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { addDoc, updateDoc, doc, collection, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { User, Plus, Trash2, ArrowLeft, GripVertical, Undo2 } from 'lucide-react';

const CLASSES = ['CM2 - Célia N.', 'CM2 - Lisa K.'];

export default function RoomAllocatorPage() {
  const { students, rooms, loading } = useOutletContext();
  const navigate = useNavigate();
  const [currentClass, setCurrentClass] = useState(CLASSES[0]);

  // New room state
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomCapacity, setNewRoomCapacity] = useState(4);
  const [newRoomGender, setNewRoomGender] = useState("Garçons");

  const unassignedStudents = useMemo(() => {
    return students
      .filter(s => s.classLabel === currentClass && !s.cdRoom && !s.isAdult)
      .sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));
  }, [students, currentClass]);

  const handleDragStart = useCallback((e, type, id) => {
    e.dataTransfer.setData("type", type);
    e.dataTransfer.setData("id", id);
    // Add visual effect safely
    setTimeout(() => {
      if (e.target && e.target.classList) e.target.classList.add('opacity-50');
    }, 0);
  }, []);

  const handleDragEnd = useCallback((e) => {
    if (e.target && e.target.classList) e.target.classList.remove('opacity-50');
  }, []);

  const handleDropStudent = useCallback(async (e, roomId) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("type");
    if (type !== "student") return;
    const studentId = e.dataTransfer.getData("id");

    // Check capacity before dropping
    const targetRoom = rooms.find(r => r.id === roomId);
    if (targetRoom) {
      const currentOccupants = students.filter(s => s.cdRoom === roomId).length;
      if (currentOccupants >= targetRoom.capacity) {
        alert("La chambre est pleine.");
        return;
      }

      // Check gender
      const student = students.find(s => s.id === studentId);
      if (student) {
        const isBoy = student.gender === 'M';
        if (targetRoom.gender === 'Filles' && isBoy) {
          alert('Impossible de placer un garçon dans une chambre de filles.');
          return;
        }
        if (targetRoom.gender === 'Garçons' && !isBoy) {
          alert('Impossible de placer une fille dans une chambre de garçons.');
          return;
        }
      }
    }

    await updateDoc(doc(db, "students", studentId), { cdRoom: roomId });
  }, [students, rooms]);

  const handleDropStudentToPool = useCallback(async (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("type");
    if (type !== "student") return;
    const studentId = e.dataTransfer.getData("id");

    await updateDoc(doc(db, "students", studentId), { cdRoom: null });
  }, []);

  const handleRemoveStudentFromRoom = async (studentId) => {
    await updateDoc(doc(db, "students", studentId), { cdRoom: null });
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    await addDoc(collection(db, "cd_rooms"), {
      name: newRoomName,
      capacity: parseInt(newRoomCapacity, 10),
      gender: newRoomGender,
      order: rooms.length
    });
    setNewRoomName("");
    setNewRoomCapacity(4);
    setShowNewRoom(false);
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Supprimer cette chambre ? Les élèves seront remis dans la liste.")) return;
    // Unassign students
    const occupants = students.filter(s => s.cdRoom === roomId);
    for (const student of occupants) {
      await updateDoc(doc(db, "students", student.id), { cdRoom: null });
    }
    // Delete room
    await deleteDoc(doc(db, "cd_rooms", roomId));
  };

  // Implementation for drag-to-reorder rooms
  const handleDropRoomOnRoom = useCallback(async (e, targetRoomId) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("type");
    if (type !== "room") return;
    const sourceRoomId = e.dataTransfer.getData("id");
    if (sourceRoomId === targetRoomId) return;

    const sourceRoom = rooms.find(r => r.id === sourceRoomId);
    const targetRoom = rooms.find(r => r.id === targetRoomId);

    if (sourceRoom && targetRoom) {
      const sourceOrder = sourceRoom.order || 0;
      const targetOrder = targetRoom.order || 0;
      await updateDoc(doc(db, "cd_rooms", sourceRoomId), { order: targetOrder });
      await updateDoc(doc(db, "cd_rooms", targetRoomId), { order: sourceOrder });
    }
  }, [rooms]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-brand-text/50">Chargement...</div>;

  return (
    <div className="flex flex-col h-screen">
      <header className="shrink-0 sticky top-0 z-[60] border-b border-white/50 p-4 px-8 flex justify-between items-center shadow-soft bg-white/40 backdrop-blur-md">
        <button onClick={() => navigate('/cd')} className="flex items-center gap-2 transition-colors font-bold text-brand-text/50 hover:text-brand-text"><ArrowLeft size={20} /> Retour</button>
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2 text-brand-text">Gestion des Chambres - Classe Découverte 2026</h1>
      </header>

      <main className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Panneau de Gauche : Élèves */}
        <div
          className="w-1/4 flex flex-col rounded-[30px] shadow-soft bg-white/60 backdrop-blur-md border border-white/50 overflow-hidden"
          onDragOver={e => e.preventDefault()}
          onDrop={handleDropStudentToPool}
        >
          <div className="p-4 border-b border-white/50 bg-white/40 shrink-0">
            <select
              value={currentClass}
              onChange={(e) => setCurrentClass(e.target.value)}
              className="w-full px-4 py-3 rounded-[16px] focus:outline-none font-bold text-brand-teal bg-white border border-white/50 shadow-inner"
            >
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="mt-2 text-sm font-bold text-brand-text/60 text-center">
              À placer : {unassignedStudents.length} élèves
            </div>
          </div>
          <div
            className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-black/10 hover:scrollbar-thumb-black/20 scrollbar-track-transparent"
          >
            {unassignedStudents.map(student => {
              const displayName = student.name && student.name.trim() ? student.name : `${student.lastName || ''} ${student.firstName || ''}`;
              const isBoy = student.gender === 'M';
              return (
                <div
                  key={student.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, "student", student.id)}
                  onDragEnd={handleDragEnd}
                  className={`border border-white/50 rounded-[16px] p-3 shadow-sm cursor-grab active:cursor-grabbing bg-white transition-all hover:shadow-md flex items-center gap-3 ${isBoy ? 'border-l-4 border-l-blue-400' : 'border-l-4 border-l-pink-400'}`}
                >
                  <User size={16} className={isBoy ? 'text-blue-400' : 'text-pink-400'} />
                  <span className="font-bold text-brand-text text-sm truncate">{displayName}</span>
                </div>
              );
            })}
            {unassignedStudents.length === 0 && (
              <div className="text-center mt-10 text-brand-text/40 font-bold uppercase text-xs">Tous les élèves sont placés</div>
            )}
          </div>
        </div>

        {/* Panneau de Droite : Chambres */}
        <div className="w-3/4 flex flex-col rounded-[30px] shadow-soft bg-white/40 backdrop-blur-md border border-white/50 overflow-hidden p-6 relative">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-2xl font-black text-brand-teal">Chambres</h2>
            <button
              onClick={() => setShowNewRoom(true)}
              className="flex items-center gap-2 bg-brand-teal text-white px-4 py-2 rounded-full font-bold shadow-soft hover:bg-brand-teal/90 transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={18} /> Nouvelle chambre
            </button>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 auto-rows-max scrollbar-thin scrollbar-thumb-black/10 hover:scrollbar-thumb-black/20 scrollbar-track-transparent content-start pr-2">
            {rooms.map(room => {
              const occupants = students.filter(s => s.cdRoom === room.id).sort((a, b) => (a.lastName || a.name).localeCompare(b.lastName || b.name));
              const isGirlRoom = room.gender === 'Filles';
              const colorClass = isGirlRoom ? 'border-pink-300 bg-pink-50/50' : 'border-blue-300 bg-blue-50/50';
              const headerColor = isGirlRoom ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700';

              return (
                <div
                  key={room.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, "room", room.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    const type = e.dataTransfer.getData("type");
                    if (type === "student") handleDropStudent(e, room.id);
                    else if (type === "room") handleDropRoomOnRoom(e, room.id);
                  }}
                  className={`rounded-[24px] border-2 shadow-sm overflow-hidden flex flex-col ${colorClass} transition-colors min-h-[160px]`}
                >
                  <div className={`px-4 py-3 flex justify-between items-center cursor-grab active:cursor-grabbing border-b border-white/50 ${headerColor}`}>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <GripVertical size={16} className="opacity-50 shrink-0" />
                      <span className="font-bold truncate" title={room.name}>{room.name}</span>
                    </div>
                    <button onClick={() => handleDeleteRoom(room.id)} className="text-black/30 hover:text-red-500 transition-colors shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="px-4 py-2 bg-white/40 border-b border-white/50 flex justify-between items-center text-xs font-bold shrink-0">
                    <span className="uppercase">{room.gender}</span>
                    <span>{occupants.length} / {room.capacity} occupés</span>
                  </div>
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    {occupants.map(student => {
                      const displayName = student.name && student.name.trim() ? student.name : `${student.lastName || ''} ${student.firstName || ''}`;
                      // Extraire "Lisa" ou "Célia" de "CM2 - Lisa K." ou "CM2 - Célia N."
                      const teacherName = student.classLabel.includes("Lisa") ? "Lisa" : (student.classLabel.includes("Célia") ? "Célia" : "");
                      
                      return (
                        <div 
                          key={student.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, "student", student.id)}
                          onDragEnd={handleDragEnd}
                          className="bg-white px-3 py-2 rounded-[12px] shadow-sm text-sm font-semibold border border-white/50 cursor-grab active:cursor-grabbing hover:shadow-md transition-all flex justify-between items-center group"
                          title={displayName}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="truncate">{displayName}</span>
                            {teacherName && (
                              <span className="text-[10px] uppercase font-bold text-brand-text/40 bg-black/5 px-2 py-0.5 rounded-full shrink-0">
                                {teacherName}
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={() => handleRemoveStudentFromRoom(student.id)} 
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-teal/60 hover:text-brand-teal shrink-0"
                            title="Remettre dans la liste"
                          >
                            <Undo2 size={16} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* Modal Ajout Chambre */}
      {showNewRoom && (
        <div className="fixed inset-0 bg-brand-text/60 flex items-center justify-center z-[150] p-4">
          <div className="bg-brand-bg border border-white/50 p-6 rounded-[30px] w-full max-w-sm relative shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Créer une chambre</h3>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-brand-text/70 mb-1">Nom de la chambre</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-white shadow-inner bg-white/50 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-text/70 mb-1">Nombre de lits</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newRoomCapacity}
                  onChange={e => setNewRoomCapacity(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-white shadow-inner bg-white/50 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-text/70 mb-1">Genre</label>
                <select
                  value={newRoomGender}
                  onChange={e => setNewRoomGender(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-white shadow-inner bg-white/50 focus:outline-none focus:ring-2 focus:ring-brand-teal"
                >
                  <option value="Garçons">Garçons</option>
                  <option value="Filles">Filles</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowNewRoom(false)} className="px-4 py-2 rounded-xl font-bold text-brand-text/60 hover:text-brand-text hover:bg-black/5">Annuler</button>
                <button type="submit" className="px-4 py-2 rounded-xl font-bold text-white bg-brand-teal hover:bg-brand-teal/90 shadow-soft">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
