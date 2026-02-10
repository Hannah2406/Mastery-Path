import { useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getMarketplaceTree } from '../../api/marketplace';
import SkillNode from '../SkillTree/SkillNode';

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
      data: { ...node.data, onClick: () => {} },
    };
  });
}

export default function MarketplaceTreePreview({
  marketplacePathId,
  onClose,
  path,
  onImport,
  onCheckout,
  isPathPaid,
  hasUserPurchased,
  importingId,
  purchasingId,
  formatPrice,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [pathName, setPathName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getMarketplaceTree(marketplacePathId)
      .then((data) => {
        setPathName(data.pathName || 'Preview');
        const flowNodes = (data.nodes || []).map((node) => ({
          id: String(node.id),
          type: 'skill',
          position: { x: 0, y: 0 },
          data: {
            ...node,
            onClick: () => {},
          },
        }));
        const flowEdges = (data.edges || []).map((edge, i) => ({
          id: `e${edge.source}-${edge.target}-${i}`,
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
  }, [marketplacePathId]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between flex-shrink-0 gap-3">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-white font-medium text-sm transition-colors"
          >
            <span aria-hidden>←</span>
            Back
          </button>
          <h3 className="text-lg font-bold text-white truncate flex-1 text-center">Preview: {pathName}</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 shrink-0 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 min-h-0 p-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-600 border-t-indigo-500" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-900/30 border border-red-500/50 text-red-200 rounded-xl">{error}</div>
          ) : (
            <div className="h-[500px] bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
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
                elementsSelectable={false}
              >
                <Background color="#334155" gap={20} />
              </ReactFlow>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-700 flex-shrink-0 flex flex-wrap items-center justify-center gap-3">
          {path && onImport && (
            <>
              {isPathPaid && !hasUserPurchased && onCheckout && (
                <button
                  onClick={onCheckout}
                  disabled={purchasingId === path.id}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  {purchasingId === path.id ? '…' : `Checkout ${formatPrice ? formatPrice(path.priceCents) : ''}`}
                </button>
              )}
              <button
                onClick={onImport}
                disabled={importingId === path.id}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold disabled:opacity-50"
              >
                {importingId === path.id ? 'Importing…' : isPathPaid && hasUserPurchased ? 'Import' : 'Get Free'}
              </button>
            </>
          )}
          {(!path || !onImport) && (
            <span className="text-slate-500 text-sm">Read-only preview. Import from the marketplace to practice.</span>
          )}
        </div>
      </div>
    </div>
  );
}
