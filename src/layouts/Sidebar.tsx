import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserPlus, 
  GitFork, 
  FileText
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/verification/new', label: 'New Verification', icon: UserPlus },
    { to: '/identity-graph', label: 'Identity Graph', icon: GitFork },
    { to: '/audit', label: 'Audit Ledger', icon: FileText },
  ];

  return (
    <aside className="w-56 bg-slate-950/80 backdrop-blur-md border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      {/* Navigation Links */}
      <div className="p-3.5 space-y-4">
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
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
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

      {/* Sidebar Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/90 text-xs">
        <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
          <span>AuthentiQ</span>
          <span className="text-cyan-400 font-semibold">v0.1</span>
        </div>
      </div>
    </aside>
  );
};
