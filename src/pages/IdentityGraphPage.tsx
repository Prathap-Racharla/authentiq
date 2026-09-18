import React, { useState } from 'react';
import { IdentityGraphView } from '../components/graph/IdentityGraphView';
import { RelationshipPanel } from '../components/graph/RelationshipPanel';
import { 
  MOCK_GRAPH_NODES, 
  MOCK_GRAPH_EDGES, 
  MOCK_RELATIONSHIP_EVIDENCE 
} from '../data/mockIdentityGraph';
import { GraphNode, GraphEdge } from '../types';
import { GitFork, Info, ShieldCheck } from 'lucide-react';

export const IdentityGraphPage: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(MOCK_GRAPH_NODES[1]); // Default select Identity A
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(MOCK_GRAPH_EDGES[2]); // Default select Potential Link (78%)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Identity Relationship Graph
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-semibold tracking-wider">
              SYNTHETIC MULTI-ENTITY GRAPH
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual topological analysis of claimed identities, verified documents, and correlated historical records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-3 py-1.5 rounded-lg border border-cyan-800/40 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Assurance Standard: Objective Relationship Evidence</span>
          </span>
        </div>
      </div>

      {/* Operational Disclaimer Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-200">Ethical Governance Notice:</strong> Potential Identity Relationships are computed correlations across biographic attributes, historical municipal records, and contact metadata. They facilitate authorized officer verification and <strong>do not by themselves establish fraud</strong>.
        </div>
      </div>

      {/* Main Graph Grid: Interactive Canvas + Relationship Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive SVG Graph Area (Takes 2 Columns) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Interactive Entity Relationship Canvas
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Drag nodes • Click links to inspect
            </span>
          </div>

          <IdentityGraphView
            nodes={MOCK_GRAPH_NODES}
            edges={MOCK_GRAPH_EDGES}
            onSelectNode={setSelectedNode}
            onSelectEdge={setSelectedEdge}
            selectedNodeId={selectedNode?.id || null}
            selectedEdgeId={selectedEdge?.id || null}
          />

          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between px-1">
            <span>Primary Entity Chain: Person → Identity A → Document A</span>
            <span className="text-amber-400">Divergent Chain: Identity A ↔ Identity B → Related Record B</span>
          </div>
        </div>

        {/* Relationship Evidence Side Panel (Takes 1 Column) */}
        <div className="lg:col-span-1 h-full min-h-[540px]">
          <RelationshipPanel
            evidence={MOCK_RELATIONSHIP_EVIDENCE}
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
          />
        </div>
      </div>
    </div>
  );
};
