import { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import SkillNode from './SkillNode';
import NodeDetailModal from './NodeDetailModal';
import { getTree } from '../../api/paths';

const nodeTypes = { skill: SkillNode };

function layoutNodes(nodes, edges) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const childrenMap = new Map();
  const parentCount = new Map();
  nodes.forEach((n) => {
    childrenMap.set(n.id, []);
    parentCount.set(n.id, 0);
  });
  edges.forEach((e) => {
    childrenMap.get(e.source)?.push(e.target);
    parentCount.set(e.target, (parentCount.get(e.target) || 0) + 1);
  });
  const roots = nodes.filter((n) => parentCount.get(n.id) === 0);
  const levels = new Map();
  const visited = new Set();
  function assignLevel(nodeId, level) {
    if (visited.has(nodeId)) {
      levels.set(nodeId, Math.max(levels.get(nodeId) || 0, level));
      return;
    }
    visited.add(nodeId);
    levels.set(nodeId, level);
    (childrenMap.get(nodeId) || []).forEach((childId) => assignLevel(childId, level + 1));
  }
  roots.forEach((root) => assignLevel(root.id, 0));
  const levelNodes = new Map();
  nodes.forEach((n) => {
    const level = levels.get(n.id) || 0;
    if (!levelNodes.has(level)) levelNodes.set(level, []);
    levelNodes.get(level).push(n);
  });
  const nodeWidth = 180;
  const nodeHeight = 80;
  const horizontalGap = 40;
  const verticalGap = 100;
  return nodes.map((node) => {
    const level = levels.get(node.id) || 0;
    const nodesInLevel = levelNodes.get(level) || [];
    const index = nodesInLevel.indexOf(node);
    const totalWidth = nodesInLevel.length * (nodeWidth + horizontalGap) - horizontalGap;
    return {
      ...node,
      position: {
        x: index * (nodeWidth + horizontalGap) - totalWidth / 2 + 400,
        y: level * (nodeHeight + verticalGap) + 50,
      },
    };
  });
}

export default function SkillTree({ pathId, onStartPractice }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getTree(pathId)
      .then((data) => {
        const flowNodes = data.nodes.map((node) => ({
          id: String(node.id),
          type: 'skill',
          position: { x: 0, y: 0 },
          data: {
            ...node,
            onClick: () => setSelectedNode(node),
          },
        }));
        const flowEdges = data.edges.map((edge) => ({
          id: `e${edge.source}-${edge.target}`,
          source: String(edge.source),
          target: String(edge.target),
          style: { stroke: '#475569', strokeWidth: 2 },
        }));
        const positioned = layoutNodes(flowNodes, flowEdges);
        setNodes(positioned);
        setEdges(flowEdges);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [pathId, setNodes, setEdges]);

  const handleCloseModal = useCallback(() => setSelectedNode(null), []);
  const handleStartPractice = useCallback(
    (node) => {
      setSelectedNode(null);
      onStartPractice(node);
    },
    [onStartPractice]
  );

  if (loading) {
    return (
      <div className="flex justify-center h-96 items-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-xl mb-4 animate-pulse mx-auto" />
          <div className="text-slate-400">Loading skill tree...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center h-96 items-center">
        <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-6 rounded-xl max-w-md">
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="h-[600px] bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
        >
          <Background color="#334155" gap={20} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <div className="flex justify-center gap-8 py-4 border-t border-slate-700 mt-0 rounded-b-xl bg-slate-800/30">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="w-4 h-4 rounded-full bg-slate-600 border border-slate-500" />
          Locked
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="w-4 h-4 rounded-full bg-amber-500/80 border border-amber-400" />
          Needs Review
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="w-4 h-4 rounded-full bg-sky-500/80 border border-sky-400" />
          Available
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="w-4 h-4 rounded-full bg-emerald-500 border border-emerald-400" />
          Mastered
        </div>
      </div>
      <NodeDetailModal
        node={selectedNode}
        onClose={handleCloseModal}
        onStartPractice={handleStartPractice}
      />
    </div>
  );
}
