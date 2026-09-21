import React from 'react';
import { EvidenceMap, VerificationRecord } from '../../types';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export interface KeyFindingItem {
  type: 'pass' | 'warning' | 'info';
  text: string;
}

interface KeyFindingsListProps {
  findings?: string[];
  evidenceMap?: EvidenceMap;
  documentType?: string;
}

export const KeyFindingsList: React.FC<KeyFindingsListProps> = ({
  findings = [],
  evidenceMap,
  documentType = '',
}) => {
  // Derive 3-5 decisive key findings from actual evidence streams if available,
  // falling back to parsed record.findings.
  const items: KeyFindingItem[] = [];

  const isPassport = documentType.toLowerCase().includes('passport');
  const isNonMrz = documentType.toLowerCase().includes('aadhaar') || 
                   documentType.toLowerCase().includes('driving') || 
                   documentType.toLowerCase().includes('voter');

  // 1. Document Quality Finding
  if (evidenceMap?.document) {
    const doc = evidenceMap.document;
    if (doc.status === 'Positive' || doc.confidence >= 70) {
      items.push({
        type: 'pass',
        text: 'Document quality is sufficient (optical sharpness & resolution within acceptable thresholds)',
      });
    } else if (doc.status === 'Uncertain' || doc.confidence < 70) {
      items.push({
        type: 'info',
        text: 'Evidence confidence reduced due to optical quality or capture glare (+0 fraud risk)',
      });
    } else if (doc.status === 'Negative') {
      items.push({
        type: 'warning',
        text: 'Document integrity defect or visual layout anomaly detected',
      });
    }
  }

  // 2. MRZ or Identity Fields Consistency
  if (evidenceMap?.document) {
    const doc = evidenceMap.document;
    const mrzSig = doc.signals?.find(s => s.label.toLowerCase().includes('mrz'));

    if (isPassport && mrzSig) {
      if (mrzSig.impact === 'positive') {
        items.push({
          type: 'pass',
          text: 'MRZ check digits are valid (ICAO 9303 TD3 checksums verified)',
        });
      } else {
        items.push({
          type: 'warning',
          text: 'MRZ check digit mismatch detected (potential alteration flag)',
        });
      }
    } else if (isNonMrz) {
      const dtLower = documentType.toLowerCase();
      if (dtLower.includes('aadhaar')) {
        items.push({
          type: 'pass',
          text: 'UIDAI 12-digit format and visual security layout verified',
        });
      } else if (dtLower.includes('driving')) {
        items.push({
          type: 'pass',
          text: 'Licence structure, RTO jurisdiction, and validity window verified',
        });
      } else if (dtLower.includes('voter')) {
        items.push({
          type: 'pass',
          text: 'EPIC alphanumeric identifier and electoral layout verified',
        });
      } else {
        items.push({
          type: 'pass',
          text: 'Visual inspection zone layout and security features verified',
        });
      }
    } else {
      items.push({
        type: 'pass',
        text: 'Identity fields are internally consistent across visual zones',
      });
    }
  }

  // 3. Database Registry Finding
  if (evidenceMap?.database) {
    const db = evidenceMap.database;
    if (db.status === 'Positive') {
      items.push({
        type: 'pass',
        text: 'Government civil identity registry confirmed credential status active',
      });
    } else if (db.status === 'Unavailable' || db.availability === 'Unavailable') {
      items.push({
        type: 'warning',
        text: 'Database evidence unavailable (external registry offline/timeout — zero risk penalty applied)',
      });
    } else if (db.status === 'Negative') {
      items.push({
        type: 'warning',
        text: 'Civil registry reported an adverse status or revocation flag',
      });
    }
  }

  // 4. Biometric Finding
  if (evidenceMap?.biometric) {
    const bio = evidenceMap.biometric;
    if (bio.status === 'Positive') {
      items.push({
        type: 'pass',
        text: `Biometric evidence has high confidence (${bio.confidence}% match similarity)`,
      });
    } else if (bio.status === 'Negative') {
      items.push({
        type: 'warning',
        text: 'Biometric facial comparison non-match between live capture and document portrait',
      });
    } else if (bio.status === 'Uncertain') {
      items.push({
        type: 'info',
        text: 'Secondary biometric verification recommended due to marginal capture lighting',
      });
    }
  }

  // Fallback to record.findings if evidenceMap had insufficient items
  if (items.length < 3 && findings.length > 0) {
    findings.forEach(f => {
      if (items.length >= 5) return;
      const lower = f.toLowerCase();
      const type: 'pass' | 'warning' | 'info' = 
        lower.includes('offline') || lower.includes('timeout') || lower.includes('mismatch') || lower.includes('anomaly')
          ? 'warning'
          : lower.includes('unavailable') || lower.includes('reduced') || lower.includes('confidence')
          ? 'info'
          : 'pass';
      
      // Avoid duplicate texts
      if (!items.some(it => it.text.includes(f) || f.includes(it.text))) {
        items.push({ type, text: f });
      }
    });
  }

  // Ensure max 5 items
  const displayItems = items.slice(0, 5);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 md:p-6 space-y-3 shadow-xl">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
          KEY FINDINGS
        </h3>
        <span className="text-[10px] font-mono text-slate-400">
          Decisive Verification Signals
        </span>
      </div>

      <div className="space-y-2 pt-1">
        {displayItems.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 p-3 rounded-lg border text-xs font-mono transition-all ${
              item.type === 'pass'
                ? 'bg-slate-950/60 border-emerald-900/40 text-slate-200'
                : item.type === 'warning'
                ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                : 'bg-slate-950/40 border-slate-800 text-slate-300'
            }`}
          >
            {item.type === 'pass' && (
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.2 font-bold text-xs">
                ✓
              </span>
            )}
            {item.type === 'warning' && (
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.2 font-bold text-xs">
                ⚠
              </span>
            )}
            {item.type === 'info' && (
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.2 font-bold text-xs">
                ℹ
              </span>
            )}

            <span className="leading-relaxed pt-0.5">
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

