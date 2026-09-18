import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { AlertTriangle } from 'lucide-react';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Application-Level Banner (Compact Notice) */}
      <div className="bg-amber-950/80 border-b border-amber-800/60 px-3 py-0.5 text-center text-[10px] font-mono text-amber-300 flex items-center justify-center gap-1.5 z-40 select-none">
        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
        <span className="font-semibold tracking-wider">
          SYNTHETIC DEMO DATA — NOT FOR OPERATIONAL USE
        </span>
        <span className="text-amber-400/70 hidden sm:inline">
          • All records and biometrics are strictly fictional simulation data
        </span>
      </div>

      {/* Main Header */}
      <Header />

      {/* App Body Layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#080d1a]">
          <div className="max-w-7xl mx-auto space-y-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
