import { ShieldCheck, UserCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-950 border-b border-slate-800/80 px-5 py-2 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Platform Identity */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center border border-cyan-400/30 shadow-md shadow-cyan-950/40 shrink-0">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black tracking-widest text-white font-mono leading-none">
              AUTHENTIQ
            </h1>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-cyan-400 border border-slate-700 font-semibold tracking-wider">
              SIH 2026 • Blockchain &amp; Cybersecurity
            </span>
          </div>
          <p className="text-[10px] text-slate-400 tracking-wide font-sans leading-tight mt-0.5">
            AI-Based Identity Assurance &amp; Adaptive Verification
          </p>
        </div>
      </div>

      {/* System Status & Officer Profile */}
      <div className="flex items-center gap-4">
        {/* System Operational Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="font-semibold tracking-wider">SYSTEM OPERATIONAL</span>
        </div>

        {/* Officer Profile Badge */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="hidden md:block text-left leading-tight">
            <div className="text-xs font-semibold text-slate-200">
              Officer V. Sharma
            </div>
            <div className="text-[9px] font-mono text-slate-400">
              Cyber Defense &amp; Verification Unit
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
