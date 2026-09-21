import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const MainLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Main Header with mobile hamburger toggle */}
      <Header 
        isMobileMenuOpen={isMobileMenuOpen} 
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)} 
      />

      {/* App Body Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          isMobileOpen={isMobileMenuOpen} 
          onCloseMobile={() => setIsMobileMenuOpen(false)} 
        />
        
        {/* Main Content Area - min-w-0 ensures flex children don't overflow on mobile */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-[#080d1a] w-full min-w-0">
          <div className="max-w-7xl mx-auto space-y-5 w-full min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
