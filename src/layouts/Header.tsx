import React from 'react';
import { ShieldCheck, UserCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-5 py-2.5 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Platform Identity */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center border border-cyan-400/30 shadow-lg shadow-cyan-950/50 shrink-0">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-black tracking-widest text-white font-mono leading-none">
            AUTHENTIQ
          </span>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Identity Verification &amp; Fraud Detection
          </p>
        </div>
      </div>

      {/* System Status & Officer Profile */}
      <div className="flex items-center gap-4">
        {/* System Operational Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold tracking-wider text-[10px] uppercase">Engine Operational</span>
        </div>

        {/* Officer Profile Badge */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 shrink-0">
            <UserCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="hidden md:block text-left leading-tight">
            <div className="text-xs font-semibold text-slate-200">
              Officer V. Sharma
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Verification Unit
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
