import React from 'react';
import { Outlet } from 'react-router-dom';

export default function EdoxiaKaraokeWrapper() {
  return (
    <div className="min-h-screen font-sans selection:bg-brand-coral/30 overflow-hidden flex flex-col relative bg-[#0f0f13] text-white">
      <div className="flex-1 relative z-10">
        <Outlet />
      </div>
    </div>
  );
}
