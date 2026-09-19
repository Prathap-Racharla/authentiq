import React, { useState } from 'react';
import { IdentityGraphView } from '../components/graph/IdentityGraphView';
import { RelationshipPanel } from '../components/graph/RelationshipPanel';
import { 
  MOCK_GRAPH_NODES, 
  MOCK_GRAPH_EDGES, 
  MOCK_RELATIONSHIP_EVIDENCE 
} from '../data/mockIdentityGraph';
import { GraphNode, GraphEdge } from '../types';
import { GitFork } from 'lucide-react';

export const IdentityGraphPage: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(MOCK_GRAPH_NODES[1]); // Default select Identity A
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(MOCK_GRAPH_EDGES[2]); // Default select Potential Link (78%)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Identity Graph
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Connections between people, documents, and records.
          </p>
        </div>
      </div>

      {/* Main Graph Grid: Interactive Canvas + Relationship Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive SVG Graph Area (Takes 2 Columns) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                Connections
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Drag to move • Click to inspect
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
        </div>

        {/* Relationship Side Panel (Takes 1 Column) */}
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
