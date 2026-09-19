import React from 'react';
import { MetricCard } from '../components/common/MetricCard';
import { VerificationTable } from '../components/verification/VerificationTable';
import { HowItWorksVideoPlayer } from '../components/dashboard/HowItWorksVideoPlayer';
import { MOCK_VERIFICATIONS } from '../data/mockVerifications';
import { 
  Users, 
  ShieldCheck, 
  FileCheck2, 
  Plus,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* 1. Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono uppercase">
              Identity Verifications
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[11px] font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live System
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time document verification and identity assurance.
          </p>
        </div>

        <div>
          <Link
            to="/verification/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold uppercase tracking-wider transition-all shadow-md shadow-cyan-950 hover:shadow-cyan-900/50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Verify New Document</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Vital Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Verifications"
          value="24"
          subtitle="Processed in session"
          icon={Users}
          variant="default"
          deltaText="24 active"
        />
        <MetricCard
          title="Autonomous Pass Rate"
          value="87.5%"
          subtitle="Low fraud risk (< 25)"
          icon={ShieldCheck}
          variant="default"
          deltaText="Normal Processing"
        />
        <MetricCard
          title="Average Confidence"
          value="91.4%"
          subtitle="4-stream completeness"
          icon={Activity}
          variant="default"
          deltaText="High Assurance"
        />
        <MetricCard
          title="Audit Ledger Blocks"
          value="1,284"
          subtitle="SHA-256 chained"
          icon={FileCheck2}
          variant="info"
          deltaText="Tamper-evident"
        />
      </div>

      {/* 3. Primary Operational Queue */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
              Recent Verification Sessions
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Click any session to open the Officer Decision Console
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-md border border-slate-800">
            {MOCK_VERIFICATIONS.length} Records
          </span>
        </div>

        <VerificationTable verifications={MOCK_VERIFICATIONS} />
      </div>

      {/* 4. Bottom Video Walkthrough: "How AuthentiQ Works" */}
      <div className="pt-4 border-t border-slate-800/80">
        <HowItWorksVideoPlayer />
      </div>
    </div>
  );
};
