import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserPlus, 
  GitFork, 
  FileText, 
  Cpu
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/verification/new', label: 'New Verification', icon: UserPlus },
    { to: '/identity-graph', label: 'Identity Graph', icon: GitFork },
    { to: '/audit', label: 'Audit Trail', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-slate-950/95 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      {/* Navigation Links */}
      <div className="p-4 space-y-6">
        <div>
          <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold block mb-2">
            Navigation Controls
          </span>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-800/60 font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Engine Capability Section */}
        <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-cyan-400">
            <Cpu className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono uppercase font-semibold">Engine Core</span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1 leading-snug">
            <div>• Decoupled Risk/Confidence</div>
            <div>• Deterministic Priority Logic</div>
            <div>• SHA-256 Audit Log Chaining</div>
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950 space-y-2 text-xs">
        <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
          <span>Release:</span>
          <span className="text-cyan-400 font-semibold">AuthentiQ Prototype v0.1</span>
        </div>
        <div className="text-[10px] text-slate-400 leading-tight">
          Smart India Hackathon 2026<br />
          Cybersecurity &amp; Blockchain
        </div>
      </div>
    </aside>
  );
};
