import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserPlus, 
  GitFork, 
  FileText,
  X
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/verification/new', label: 'New Verification', icon: UserPlus },
    { to: '/identity-graph', label: 'Identity Graph', icon: GitFork },
    { to: '/audit', label: 'Audit Ledger', icon: FileText },
  ];

  const handleLinkClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md: and above) */}
      <aside className="hidden md:flex w-56 bg-slate-950/80 backdrop-blur-md border-r border-slate-800/80 flex-col justify-between shrink-0 select-none">
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

        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/90 text-xs">
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
            <span>AuthentiQ</span>
            <span className="text-cyan-400 font-semibold">v0.1</span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (visible only on small screens when isMobileOpen is true) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile} 
          />

          {/* Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between select-none shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                  NAVIGATION
                </span>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={handleLinkClick}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm'
                            : 'text-slate-300 hover:text-white hover:bg-slate-900'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 text-xs">
              <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                <span>AuthentiQ Engine</span>
                <span className="text-cyan-400 font-semibold">v0.1 Live</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
