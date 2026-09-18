import React, { useState, useRef, useEffect } from 'react';
import { GraphNode, GraphEdge, GraphNodeType } from '../../types';
import { 
  User, 
  FileText, 
  Database, 
  ShieldCheck, 
  GitFork, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw
} from 'lucide-react';

interface IdentityGraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectNode: (node: GraphNode | null) => void;
  onSelectEdge: (edge: GraphEdge | null) => void;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
}

export const IdentityGraphView: React.FC<IdentityGraphViewProps> = ({
  nodes: initialNodes,
  edges,
  onSelectNode,
  onSelectEdge,
  selectedNodeId,
  selectedEdgeId,
}) => {
  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Sync if initialNodes change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  const getNodeColor = (type: GraphNodeType) => {
    switch (type) {
      case 'person':
        return { fill: '#042f2e', stroke: '#14b8a6', text: '#5eead4', icon: User };
      case 'identity':
        return { fill: '#082f49', stroke: '#0284c7', text: '#38bdf8', icon: GitFork };
      case 'document':
        return { fill: '#172554', stroke: '#2563eb', text: '#60a5fa', icon: FileText };
      case 'verification':
        return { fill: '#2e1065', stroke: '#7c3aed', text: '#a78bfa', icon: ShieldCheck };
      case 'related_record':
        return { fill: '#1c1917', stroke: '#d97706', text: '#fcd34d', icon: Database };
      default:
        return { fill: '#0f172a', stroke: '#475569', text: '#94a3b8', icon: FileText };
    }
  };

  // Node Dragging handlers
  const handleMouseDownNode = (e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation();
    onSelectNode(node);
    onSelectEdge(null);
    setDraggingNodeId(node.id);
    setDragOffset({
      x: (e.clientX / zoom) - (node.x || 0),
      y: (e.clientY / zoom) - (node.y || 0)
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      const newX = (e.clientX / zoom) - dragOffset.x;
      const newY = (e.clientY / zoom) - dragOffset.y;

      setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));
    } else if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    onSelectNode(null);
    onSelectEdge(null);
  };

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  return (
    <div className="relative w-full h-[540px] bg-slate-950 border border-slate-800 rounded-lg overflow-hidden select-none">
      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 backdrop-blur-sm">
        <button
          onClick={() => setZoom(z => Math.min(1.8, z + 0.15))}
          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.6, z - 0.15))}
          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 40, y: 30 }); }}
          className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 p-3 rounded-lg border border-slate-800 backdrop-blur-sm text-[11px] font-mono space-y-1.5 hidden md:block">
        <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
          Entity Classification
        </span>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-300">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-400" /> Person</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400" /> Identity</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Document</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Related Record</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400" /> Verification</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-400" /> Potential Link</span>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleBackgroundMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <defs>
          {/* Subtle grid pattern */}
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
          </pattern>
          {/* Arrow markers */}
          <marker id="arrow" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#64748b" />
          </marker>
          <marker id="arrow-amber" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#f59e0b" />
          </marker>
        </defs>

        {/* Background Grid */}
        <rect width="100%" height="100%" fill="url(#grid)" />

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Render Edges */}
          {edges.map((edge) => {
            const sourceNode = nodeMap.get(edge.source);
            const targetNode = nodeMap.get(edge.target);
            if (!sourceNode || !targetNode) return null;

            const sx = sourceNode.x || 0;
            const sy = sourceNode.y || 0;
            const tx = targetNode.x || 0;
            const ty = targetNode.y || 0;
            const midX = (sx + tx) / 2;
            const midY = (sy + ty) / 2;

            const isSelected = selectedEdgeId === edge.id;
            const isPotential = edge.isPotentialLink;

            return (
              <g 
                key={edge.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEdge(edge);
                  onSelectNode(null);
                }}
                className="cursor-pointer group"
              >
                {/* Edge line */}
                <line
                  x1={sx}
                  y1={sy}
                  x2={tx}
                  y2={ty}
                  stroke={isPotential ? '#f59e0b' : isSelected ? '#38bdf8' : '#334155'}
                  strokeWidth={isPotential || isSelected ? 2.5 : 1.5}
                  strokeDasharray={isPotential ? '5,4' : undefined}
                  markerEnd={isPotential ? 'url(#arrow-amber)' : 'url(#arrow)'}
                  className="transition-colors group-hover:stroke-cyan-400"
                />

                {/* Edge label badge */}
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x={-55}
                    y={-11}
                    width={110}
                    height={22}
                    rx={4}
                    fill="#090d16"
                    stroke={isPotential ? '#f59e0b' : '#1e293b'}
                    strokeWidth={isPotential ? 1.5 : 1}
                  />
                  <text
                    x={0}
                    y={4}
                    textAnchor="middle"
                    fill={isPotential ? '#fbbf24' : '#94a3b8'}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight={isPotential ? 'bold' : 'normal'}
                  >
                    {edge.label} {edge.confidence && isPotential ? `(${edge.confidence}%)` : ''}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const config = getNodeColor(node.type);
            const isSelected = selectedNodeId === node.id;
            const x = node.x || 0;
            const y = node.y || 0;

            return (
              <g
                key={node.id}
                transform={`translate(${x}, ${y})`}
                onMouseDown={(e) => handleMouseDownNode(e, node)}
                className="cursor-move group"
              >
                {/* Node Box */}
                <rect
                  x={-85}
                  y={-28}
                  width={170}
                  height={56}
                  rx={8}
                  fill={config.fill}
                  stroke={isSelected ? '#38bdf8' : config.stroke}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  className="transition-all drop-shadow-md group-hover:stroke-cyan-300"
                />

                {/* Left accent bar */}
                <rect
                  x={-85}
                  y={-28}
                  width={5}
                  height={56}
                  rx={2}
                  fill={config.stroke}
                />

                {/* Node Label */}
                <text
                  x={-72}
                  y={-6}
                  fill={config.text}
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="system-ui"
                >
                  {node.label.length > 22 ? `${node.label.substring(0, 20)}...` : node.label}
                </text>

                {/* SubLabel / ID */}
                <text
                  x={-72}
                  y={12}
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  {node.subLabel}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
