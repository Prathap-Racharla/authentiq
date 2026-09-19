import React from 'react';
import { RelationshipEvidence, GraphNode, GraphEdge } from '../../types';
import { 
  GitFork, 
  CheckCircle2,
  FileText,
  User,
  Database,
  ShieldCheck
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
  const getNodeIcon = (type?: string) => {
    switch (type) {
      case 'person': return <User className="w-4 h-4 text-teal-400" />;
      case 'identity': return <GitFork className="w-4 h-4 text-sky-400" />;
      case 'document': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'verification': return <ShieldCheck className="w-4 h-4 text-purple-400" />;
      case 'related_record': return <Database className="w-4 h-4 text-amber-400" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col h-full space-y-5 overflow-y-auto">
      {/* Required Section 1: Selected Item Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            {selectedNode ? getNodeIcon(selectedNode.type) : <GitFork className="w-4 h-4 text-cyan-400" />}
            <span>Details</span>
          </h3>
          {selectedNode && (
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono capitalize">
              {selectedNode.type.replace('_', ' ')}
            </span>
          )}
        </div>

        {selectedNode ? (
          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold text-white">
                {selectedNode.label}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                {selectedNode.subLabel}
              </div>
            </div>

            <div className="bg-slate-950/70 rounded-lg border border-slate-800 divide-y divide-slate-800/60 text-xs">
              {Object.entries(selectedNode.properties).map(([k, v]) => (
                <div key={k} className="p-2.5 flex justify-between gap-2">
                  <span className="text-slate-400">{k}</span>
                  <span className="font-medium text-slate-200 text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ) : selectedEdge ? (
          <div className="bg-slate-950/70 rounded-lg border border-slate-800 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Connection</span>
              {selectedEdge.confidence && (
                <span className="text-xs font-mono font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {selectedEdge.confidence}% Match
                </span>
              )}
            </div>
            <div className="text-sm font-medium text-white capitalize">
              {selectedEdge.label}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800/70 text-xs text-slate-400 text-center">
            Click any item on the graph to view details.
          </div>
        )}
      </div>

      {/* Required Section 2: Potential Match Signals */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">
            Potential Match Signals
          </span>
          <span className="text-xs font-mono font-bold text-amber-400">
            {evidence.confidence}% Match
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-amber-400 rounded-full transition-all duration-300"
            style={{ width: `${evidence.confidence}%` }}
          />
        </div>

        {/* Supporting Signals */}
        <div className="space-y-2 pt-1">
          {evidence.supportingSignals.map((signal, idx) => (
            <div 
              key={idx}
              className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{signal}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
