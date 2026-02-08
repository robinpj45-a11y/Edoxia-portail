import React from 'react';
import { FileText, Flag, Trash2 } from 'lucide-react';

export default function StudentCard({ student, onDragStart, onToggle, onDelete }) {
  const handleLocalDragStart = (e) => { 
      onDragStart(e, student.id); 
      requestAnimationFrame(() => { 
          requestAnimationFrame(() => { 
              if (e.target) { e.target.classList.add('opacity-20', 'grayscale', 'border-dashed'); } 
          }); 
      }); 
  };
  const handleDragEnd = (e) => { if (e.target) { e.target.classList.remove('opacity-20', 'grayscale', 'border-dashed'); } };
  
  return (
    <div draggable onDragStart={handleLocalDragStart} onDragEnd={handleDragEnd} className="bg-white border-2 border-edoxia-blue rounded-xl p-3 shadow-sm cursor-grab active:cursor-grabbing relative hover:shadow-md transition-all group flex justify-between items-start select-none">
        <div className="pr-2 overflow-hidden">
            <div className="font-bold text-slate-800 text-sm truncate">{student.name}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium truncate">{student.classLabel}{student.team && <span className="text-edoxia-blue"> • Équipe {student.team}</span>}</div>
        </div>
        <div className="flex gap-1 shrink-0">
            <button onClick={() => onToggle(student.id, 'pai')} className={`p-1.5 rounded-full hover:bg-slate-100 ${student.pai ? 'text-blue-600 scale-110' : 'text-slate-300 opacity-40 hover:opacity-100'}`}><FileText size={18} fill={student.pai ? "currentColor" : "none"} /></button>
            <button onClick={() => onToggle(student.id, 'disruptive')} className={`p-1.5 rounded-full hover:bg-slate-100 ${student.disruptive ? 'text-red-500 scale-110' : 'text-slate-300 opacity-40 hover:opacity-100'}`}><Flag size={18} fill={student.disruptive ? "currentColor" : "none"} /></button>
            <button onClick={() => onDelete(student.id)} className="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1.5"><Trash2 size={16} /></button>
        </div>
    </div>
  );
}
