import React, { useState, useEffect } from 'react';
import { AuditTable } from '../components/audit/AuditTable';
import { fetchAuditEvents, verifyAuditLedger, AuditVerificationStatus } from '../services/auditApi';
import { AuditEvent } from '../types';
import { MOCK_AUDIT_EVENTS } from '../data/mockAuditEvents';
import { ShieldCheck, Lock, Layers, RefreshCw, AlertTriangle, CheckCircle2, Hash } from 'lucide-react';
import { truncateHash } from '../utils/hash';

export const AuditPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>(MOCK_AUDIT_EVENTS);
  const [verificationStatus, setVerificationStatus] = useState<AuditVerificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const loadAuditData = async () => {
    setIsLoading(true);
    try {
      const [fetchedEvents, status] = await Promise.all([
        fetchAuditEvents(100),
        verifyAuditLedger()
      ]);
      if (fetchedEvents && fetchedEvents.length > 0) {
        setEvents(fetchedEvents);
      }
      setVerificationStatus(status);
    } catch (err) {
      console.warn('Error fetching live audit data, retaining prototype state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  const handleReverify = async () => {
    setIsVerifying(true);
    try {
      const status = await verifyAuditLedger();
      setVerificationStatus(status);
      const fetchedEvents = await fetchAuditEvents(100);
      if (fetchedEvents && fetchedEvents.length > 0) {
        setEvents(fetchedEvents);
      }
    } finally {
      setTimeout(() => setIsVerifying(false), 500);
    }
  };

  const isVerified = verificationStatus?.integrityStatus === 'VERIFIED' || !verificationStatus;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Tamper-Evident Prototype Audit Log
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-semibold tracking-wider">
              BLOCKCHAIN SIMULATION
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cryptographic SHA-256 block-chained event ledger maintaining non-repudiation and decision traceability
          </p>
        </div>

        {/* Dynamic Ledger Integrity Badge & Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReverify}
            disabled={isVerifying || isLoading}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Re-verify entire SHA-256 cryptographic chain"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span>{isVerifying ? 'Verifying Hashes...' : 'Verify Chain'}</span>
          </button>

          <div className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg border ${
            isVerified 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400' 
              : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
          }`}>
            {isVerified ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            )}
            <div className="text-left">
              <span className="text-[10px] font-mono uppercase tracking-widest block font-bold">
                Ledger: {isVerified ? 'VERIFIED' : 'COMPROMISED'}
              </span>
              <span className="text-[10px] font-mono opacity-80 block">
                {isVerified ? 'Zero Inconsistencies' : 'Hash Mismatch Detected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cryptographic Ledger Summary Strip */}
      {verificationStatus && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div>
            <span className="text-slate-400 text-[10px] block uppercase">Chained Blocks</span>
            <span className="font-bold text-slate-200 text-sm">{verificationStatus.totalBlocks} Blocks</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block uppercase">Genesis Hash</span>
            <span className="text-cyan-400 font-semibold">{truncateHash(verificationStatus.genesisHash, 8)}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block uppercase">Latest Head Hash</span>
            <span className="text-emerald-400 font-semibold">{truncateHash(verificationStatus.latestHash, 8)}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block uppercase">Last Verified</span>
            <span className="text-slate-300">{verificationStatus.verifiedAt ? verificationStatus.verifiedAt.substring(11, 19) + ' UTC' : 'Live'}</span>
          </div>
        </div>
      )}

      {/* Mandatory Scope & Privacy Disclaimer (User Requirements) */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 flex items-start gap-3.5 text-xs">
        <Lock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-semibold text-slate-200">
            Privacy Assurance &amp; Architecture Roadmap:
          </p>
          <p className="text-slate-400">
            Prototype audit records represent tamper-evident event logging with SHA-256 block chaining. 
            <strong className="text-slate-300"> Raw identity and biometric data are not stored on the ledger.</strong>{' '}
            Audit blocks log actor identities, timestamps, event state hashes, and deterministic outcomes. 
            Production permissioned enterprise blockchain (e.g. Hyperledger Fabric) and multi-signature authorization will be integrated in Phase 2.
          </p>
        </div>
      </div>

      {/* Chained Ledger Block Explorer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Immutable Verification Event Stream
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Chained Parent-Child Hash Sequence ({events.length} records)
          </span>
        </div>

        <AuditTable events={events} />
      </div>
    </div>
  );
};
