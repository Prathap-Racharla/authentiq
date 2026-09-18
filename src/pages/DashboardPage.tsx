import React, { useState, useEffect } from 'react';
import { MetricCard } from '../components/common/MetricCard';
import { VerificationTable } from '../components/verification/VerificationTable';
import { EvidenceCard } from '../components/verification/EvidenceCard';
import { AlertCard } from '../components/common/AlertCard';
import { MOCK_VERIFICATIONS } from '../data/mockVerifications';
import { MOCK_ALERTS } from '../data/mockAlerts';
import { 
  Users, 
  ShieldAlert, 
  HelpCircle, 
  FileCheck2, 
  Layers, 
  PlusCircle,
  ShieldCheck,
  Server,
  Cpu,
  Database,
  Camera,
  ArrowRight,
  ExternalLink,
  Lock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchSecurityStatus, SecurityStatusResponse } from '../services/fusionApi';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const primaryRecord = MOCK_VERIFICATIONS[0];
  const [securityStatus, setSecurityStatus] = useState<SecurityStatusResponse | null>(null);

  useEffect(() => {
    fetchSecurityStatus().then(data => setSecurityStatus(data));
  }, []);

  const scenarios = [
    {
      id: 'VER-2026-7819',
      tag: 'SCENARIO A',
      title: 'Clean Passport + Active DB',
      outcome: 'Normal Processing',
      badgeColor: 'border-emerald-500/30 text-emerald-300 bg-emerald-950/20',
      risk: 8,
      conf: 96,
      desc: 'All 4 streams verified. Demonstrates low risk with high confidence.',
    },
    {
      id: 'VER-2026-8942',
      tag: 'SCENARIO B',
      title: 'Offline DB Gateway',
      outcome: 'Targeted Verification',
      badgeColor: 'border-cyan-500/30 text-cyan-300 bg-cyan-950/20',
      risk: 18,
      conf: 82,
      desc: 'DB HTTP 504 timeout. Demonstrates Unavailable != Fraud (+0 risk).',
    },
    {
      id: 'VER-2026-9031',
      tag: 'SCENARIO C',
      title: 'Biometric Mismatch',
      outcome: 'Officer Review',
      badgeColor: 'border-rose-500/30 text-rose-300 bg-rose-950/20',
      risk: 68,
      conf: 88,
      desc: 'Facial embedding divergence. Requires authorized officer investigation.',
    },
    {
      id: 'VER-2026-6412',
      tag: 'SCENARIO D',
      title: 'Degraded Streams',
      outcome: 'Inconclusive',
      badgeColor: 'border-amber-500/30 text-amber-300 bg-amber-950/20',
      risk: 32,
      conf: 42,
      desc: 'Confidence < 50. Low evidence density triggers Inconclusive.',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top Banner & Header Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Identity Assurance Operations
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold tracking-wider">
              SYNTHETIC DEMO DATA — NOT FOR OPERATIONAL USE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-source evidence correlation, adaptive routing, and tamper-evident audit trail (SIH 2026)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/verification/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-md hover:shadow-cyan-900/40 font-mono"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Verification</span>
          </Link>
        </div>
      </div>

      {/* Live System Operational & Cybersecurity Health Strip */}
      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300 font-semibold">Subsystem Health:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">API Gateway:</span>
            <span className="text-emerald-400 font-semibold">127.0.0.1:8000 OK</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">OCR:</span>
            <span className="text-emerald-400 font-semibold">RapidOCR ONNX</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Biometrics:</span>
            <span className="text-emerald-400 font-semibold">OpenCV Active</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Registry:</span>
            <span className="text-cyan-300 font-semibold">Simulated Gateway</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Audit Ledger:</span>
            <span className="text-emerald-400 font-semibold">SHA-256 Verified</span>
          </div>
        </div>
      </div>

      {/* Main Metrics (Clearly marked as Synthetic/Demo data) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
            System Assurance Metrics
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Synthetic Benchmark State
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <MetricCard
            title="Active Verifications"
            value="24"
            subtitle="Synthetic intake queue"
            icon={Users}
            variant="default"
            deltaText="24 active"
          />
          <MetricCard
            title="High Risk"
            value="3"
            subtitle="Score > 50"
            icon={ShieldAlert}
            variant="danger"
            deltaText="3 flagged"
          />
          <MetricCard
            title="Inconclusive"
            value="2"
            subtitle="Confidence < 50"
            icon={HelpCircle}
            variant="warning"
            deltaText="2 degraded"
          />
          <MetricCard
            title="Audit Events"
            value="1,284"
            subtitle="SHA-256 blocks"
            icon={FileCheck2}
            variant="info"
            deltaText="Verified"
          />
        </div>
      </div>

      {/* Synthetic Demo Scenarios Quick-Launch Banner */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
            SIH 2026 Core Demonstration Scenarios
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Deterministic Decision Engine Presets
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {scenarios.map((sc) => (
            <div
              key={sc.id}
              onClick={() => navigate(`/verification/${sc.id}`)}
              className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-cyan-500/50 hover:bg-slate-900 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
                    {sc.tag}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${sc.badgeColor}`}>
                    {sc.outcome}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                  {sc.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  {sc.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">
                  Risk: <strong className="text-slate-200">{sc.risk}</strong> • Conf: <strong className="text-slate-200">{sc.conf}</strong>
                </span>
                <span className="text-cyan-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  View Dossier <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Overview (Four Categories) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Evidence Stream Architecture Overview
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              (Live Pipeline State for Showcase Session {primaryRecord.id})
            </span>
          </div>

          <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/30 px-2.5 py-1 rounded border border-cyan-900/40">
            Core Law: Unavailable Stream ≠ Negative Fraud Indicator
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <EvidenceCard evidence={primaryRecord.evidence.document} />
          <EvidenceCard evidence={primaryRecord.evidence.biometric} />
          <EvidenceCard evidence={primaryRecord.evidence.database} />
          <EvidenceCard evidence={primaryRecord.evidence.context_history} />
        </div>
      </div>

      {/* Two Column Layout: Recent Verifications & Security Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Verifications Table (Takes 2 columns) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Recent Verification Sessions
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {MOCK_VERIFICATIONS.length} Synthetic Records
            </span>
          </div>
          <VerificationTable verifications={MOCK_VERIFICATIONS} />
        </div>

        {/* Operational & Security Alerts (Takes 1 column) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Operational &amp; Risk Alerts
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Live Feed
            </span>
          </div>

          <div className="space-y-3">
            {MOCK_ALERTS.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
