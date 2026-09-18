import React, { useState } from 'react';
import { AuditEvent } from '../../types';
import { 
  ShieldCheck, 
  Search, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  Lock,
  Layers
} from 'lucide-react';
import { truncateHash } from '../../utils/hash';
import { Link } from 'react-router-dom';

interface AuditTableProps {
  events: AuditEvent[];
}

export const AuditTable: React.FC<AuditTableProps> = ({ events }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  const filtered = events.filter(e => 
    e.eventId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.verificationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.actor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden flex flex-col space-y-0">
      {/* Table Top Toolbar */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter audit events by ID, session, actor..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>{filtered.length} Immutable Blocks Logged</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 w-10"></th>
              <th className="py-3 px-4">Event ID</th>
              <th className="py-3 px-4">Verification ID</th>
              <th className="py-3 px-4">Event</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Current SHA-256 Hash</th>
              <th className="py-3 px-4 text-right">Integrity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {filtered.map((evt) => {
              const isExpanded = expandedEventId === evt.eventId;

              return (
                <React.Fragment key={evt.eventId}>
                  <tr 
                    onClick={() => setExpandedEventId(isExpanded ? null : evt.eventId)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-3 text-slate-400">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                      {evt.eventId}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-cyan-400">
                      <Link 
                        to={`/verification/${evt.verificationId}`} 
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                      >
                        {evt.verificationId}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {evt.eventType}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {evt.actor}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {evt.timestamp}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <button
                        onClick={(e) => handleCopy(evt.currentHash, e)}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
                        title="Click to copy full SHA-256 hash"
                      >
                        <Lock className="w-3 h-3 text-cyan-400" />
                        <span>{truncateHash(evt.currentHash, 6, 6)}</span>
                        {copiedHash === evt.currentHash ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-mono font-semibold bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        {evt.integrity}
                      </span>
                    </td>
                  </tr>

                  {/* Expanded Block Details */}
                  {isExpanded && (
                    <tr className="bg-slate-950/60">
                      <td colSpan={8} className="p-4 pl-12 border-b border-slate-800">
                        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                            <span className="font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                              Cryptographic Chaining Details (Tamper-Evident Event Log)
                            </span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              SHA-256 Merkle Chaining
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                            <div>
                              <span className="text-slate-400 block mb-1">Previous Block Hash (Parent):</span>
                              <div className="bg-slate-950 p-2 rounded border border-slate-800/80 text-slate-300 break-all text-[11px]">
                                {evt.prevHash}
                              </div>
                            </div>

                            <div>
                              <span className="text-slate-400 block mb-1">Current Event Hash:</span>
                              <div className="bg-slate-950 p-2 rounded border border-cyan-900/50 text-cyan-300 break-all text-[11px]">
                                {evt.currentHash}
                              </div>
                            </div>
                          </div>

                          <div className="text-xs pt-1">
                            <span className="text-slate-400 block mb-1 font-mono text-[11px]">
                              Event Payload Summary:
                            </span>
                            <p className="text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800 leading-relaxed font-mono text-[11px]">
                              {evt.payloadSummary}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
