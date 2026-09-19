import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { AlertTriangle } from 'lucide-react';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
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
