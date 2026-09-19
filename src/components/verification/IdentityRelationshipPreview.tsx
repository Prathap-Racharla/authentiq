import React from 'react';
import { GitFork, ArrowUpRight, UserCheck, FileText, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export const IdentityRelationshipPreview: React.FC = () => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-800/50">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 tracking-wide">
              Potential Identity Relationship
            </h3>
            <span className="text-xs text-slate-400">
              Connected records and historical matches
            </span>
          </div>
        </div>

        <Link
          to="/identity-graph"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-medium border border-slate-700 transition-colors"
        >
          <span>Open Full Graph</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Visual Graph Relationship Diagram */}
      <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/90">
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 py-2">
          {/* Current Identity */}
          <div className="flex-1 w-full p-3 rounded bg-slate-900 border border-cyan-500/30 text-center space-y-1 shadow-sm">
            <div className="w-7 h-7 mx-auto rounded-full bg-cyan-950 flex items-center justify-center border border-cyan-500/40 text-cyan-400">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-100 block">Current Identity</span>
            <span className="text-xs font-mono text-cyan-300 block">Identity A (Claimed)</span>
          </div>

          {/* Connection Vector */}
          <div className="flex flex-col items-center justify-center px-2 py-1 text-center">
            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 mb-1">
              78% match
            </span>
            <div className="w-24 h-0.5 bg-gradient-to-r from-cyan-500 via-amber-400 to-slate-600 hidden md:block" />
            <div className="h-8 w-0.5 bg-gradient-to-b from-cyan-500 via-amber-400 to-slate-600 md:hidden" />
          </div>

          {/* Connected Entities */}
          <div className="flex-1 w-full space-y-2">
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center gap-2.5">
              <Database className="w-4 h-4 text-sky-400 shrink-0" />
              <div className="text-left min-w-0">
                <span className="text-xs font-medium text-slate-200 block truncate">Related Record A</span>
                <span className="text-xs font-mono text-slate-400 block truncate">Municipal Utility Register</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-left min-w-0">
                <span className="text-xs font-medium text-slate-200 block truncate">Related Document B</span>
                <span className="text-xs font-mono text-slate-400 block truncate">National ID Ref IND-DEMO-8942</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
