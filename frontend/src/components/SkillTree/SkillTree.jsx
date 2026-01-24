import { useState, useCallback, useMemo, useEffect } from 'react';
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

const nodeTypes = {
  skill: SkillNode,
};

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
    const children = childrenMap.get(nodeId) || [];
    children.forEach((childId) => assignLevel(childId, level + 1));
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

  const positionedNodes = nodes.map((node) => {
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

  return positionedNodes;
}

export default function SkillTree({ pathId, onStartPractice }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [treeData, setTreeData] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    getTree(pathId)
      .then((data) => {
        setTreeData(data);
        const flowNodes = data.nodes.map((node) => ({
          id: String(node.id),
          type: 'skill',
          position: { x: 0, y: 0 },
          data: {
            ...node,
            onClick: () => setSelectedNode(node),
          },
        }));

        const flowEdges = data.edges.map((edge, index) => ({
          id: `e${edge.source}-${edge.target}`,
          source: String(edge.source),
          target: String(edge.target),
          style: { stroke: '#94a3b8', strokeWidth: 2 },
          animated: false,
        }));

        const positionedNodes = layoutNodes(flowNodes, flowEdges);
        setNodes(positionedNodes);
        setEdges(flowEdges);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [pathId, setNodes, setEdges]);

  const handleCloseModal = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleStartPractice = useCallback(
    (node) => {
      setSelectedNode(null);
      onStartPractice(node);
    },
    [onStartPractice]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Loading skill tree...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-[600px] bg-gray-50 rounded-lg border">
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
        <Background color="#e2e8f0" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
      <NodeDetailModal
        node={selectedNode}
        onClose={handleCloseModal}
        onStartPractice={handleStartPractice}
      />
      <div className="flex justify-center gap-6 py-3 bg-white border-t">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded bg-gray-300"></span>
          <span className="text-gray-600">Locked</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded bg-blue-400"></span>
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded bg-green-500"></span>
          <span className="text-gray-600">Mastered</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded bg-yellow-500"></span>
          <span className="text-gray-600">Needs Review</span>
        </div>
      </div>
    </div>
  );
}
