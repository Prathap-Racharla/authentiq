import React from 'react';
import { RelationshipEvidence, GraphNode, GraphEdge } from '../../types';
import { 
  GitFork, 
  ShieldAlert, 
  CheckCircle2
} from 'lucide-react';

interface RelationshipPanelProps {
  evidence: RelationshipEvidence;
  selectedNode: GraphNode | null;
  selectedEdge: GraphEdge | null;
}

export const RelationshipPanel: React.FC<RelationshipPanelProps> = ({
  evidence,
  selectedNode,
  selectedEdge,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col h-full space-y-5 overflow-y-auto">
      {/* Panel Header */}
      <div className="pb-3 border-b border-slate-800 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
            <GitFork className="w-4 h-4" /> Relationship Evidence
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {evidence.id}
          </span>
        </div>
        <h3 className="text-sm font-bold text-slate-100">
          Potential Identity Relationship
        </h3>
      </div>

      {/* Confidence Callout */}
      <div className="bg-slate-950/70 border border-amber-900/40 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            Association Confidence
          </span>
          <span className="text-base font-black font-mono text-amber-300">
            {evidence.confidence}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-amber-400 rounded-full"
            style={{ width: `${evidence.confidence}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
          {evidence.detectedRelationship}
        </p>
      </div>

      {/* Supporting Signals List */}
      <div className="space-y-2">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold block">
          Supporting Signals
        </span>
        <div className="space-y-2">
          {evidence.supportingSignals.map((signal, idx) => (
            <div 
              key={idx}
              className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{signal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interpretation & Governance Directive (Strictly No Fraud Ring labels) */}
      <div className="bg-slate-950 border border-cyan-900/40 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 text-cyan-400">
          <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider font-mono">
            Interpretation & Governance
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          {evidence.interpretation}
        </p>
        <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
          Potential associations may represent legitimate name changes, shared residential utility billing, or synthetic identity clustering.
        </div>
      </div>

      {/* Dynamic Inspector for Selected Graph Element */}
      {selectedNode && (
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block font-semibold">
            Inspected Entity: {selectedNode.label}
          </span>
          <div className="space-y-1 text-xs">
            {Object.entries(selectedNode.properties).map(([k, v]) => (
              <div key={k} className="flex justify-between py-0.5 border-b border-slate-900 text-slate-300">
                <span className="text-slate-400">{k}:</span>
                <span className="font-mono text-slate-200">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedEdge && (
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1 text-xs">
          <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block font-semibold">
            Selected Relationship Link
          </span>
          <div className="text-slate-200">
            Relationship: <strong className="text-amber-300 font-mono">"{selectedEdge.label}"</strong>
          </div>
          {selectedEdge.confidence && (
            <div className="text-slate-400 text-[11px] font-mono">
              Correlation Confidence: {selectedEdge.confidence}%
            </div>
          )}
        </div>
      )}

      <div className="mt-auto pt-2 text-[11px] text-slate-400 text-center font-mono">
        AuthentiQ Graph Engine v0.1 • Synthetic Demonstration
      </div>
    </div>
  );
};
