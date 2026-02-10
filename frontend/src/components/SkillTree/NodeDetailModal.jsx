import { useState, useEffect } from 'react';
import { getNodeLogs } from '../../api/history';

const statusLabels = {
  LOCKED: { label: 'Locked', color: 'text-slate-400', bg: 'bg-slate-600' },
  AVAILABLE: { label: 'Available', color: 'text-sky-300', bg: 'bg-sky-600/80' },
  MASTERED: { label: 'Mastered', color: 'text-emerald-300', bg: 'bg-emerald-600' },
  DECAYING: { label: 'Needs Review', color: 'text-amber-300', bg: 'bg-amber-600/90' },
};

const errorCodeLabels = { EXECUTION: 'Execution', FORGOT: 'Forgot', CONCEPT: 'Concept' };

function formatDuration(ms) {
  if (!ms) return '-';
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function NodeDetailModal({ node, onClose, onStartPractice }) {
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (node && node.status !== 'LOCKED') {
      setLoadingLogs(true);
      getNodeLogs(node.id).then(setLogs).catch(() => setLogs([])).finally(() => setLoadingLogs(false));
    }
  }, [node]);

  if (!node) return null;

  const statusInfo = statusLabels[node.status] || statusLabels.LOCKED;
  const progressPercent = Math.round((node.masteryScore || 0) * 100);
  const canPractice = node.status !== 'LOCKED';
  const successCount = logs.filter((l) => l.success).length;
  const totalAttempts = logs.length;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
        <div className="p-6 flex-shrink-0 relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">{node.name}</h2>
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-sm text-slate-400">Category:</span>
              <span className="text-sm font-medium text-slate-300 px-3 py-1 bg-slate-700 rounded-lg">{node.category}</span>
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-sm text-slate-400">Status:</span>
              <span className={`text-sm font-medium px-4 py-1.5 rounded-xl ${statusInfo.bg} ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
            {node.status !== 'LOCKED' && (
              <div className="max-w-sm mx-auto mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400 font-medium">Mastery</span>
                  <span className="font-bold text-white text-lg">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div className={`h-3 rounded-full transition-all duration-500 ${node.status === 'MASTERED' ? 'bg-emerald-500' : node.status === 'DECAYING' ? 'bg-amber-500' : 'bg-sky-500'}`} style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            )}
            {node.description && (
              <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                <p className="text-sm text-slate-300 leading-relaxed">{node.description}</p>
              </div>
            )}
            {node.externalUrl && (
              node.status === 'LOCKED' ? (
                <div className="mt-4 p-3 bg-slate-700/50 rounded-xl border border-slate-600">
                  <p className="text-sm text-slate-500">Unlock this skill to open the external link.</p>
                </div>
              ) : (
                <div className="mt-4">
                  <a href={node.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-medium transition-colors">
                    {node.externalUrl.includes('leetcode.com') ? 'Open on LeetCode ↗' : 'Open link ↗'}
                  </a>
                </div>
              )
            )}
          </div>
        </div>
        {node.status !== 'LOCKED' && (
          <div className="border-t border-slate-700 flex-1 overflow-y-auto">
            <div className="p-4 bg-slate-800/80 border-b border-slate-700 sticky top-0">
              <h3 className="text-base font-bold text-white">Practice History</h3>
              {totalAttempts > 0 && <span className="text-sm text-slate-400">{successCount}/{totalAttempts} successful</span>}
            </div>
            {loadingLogs ? <div className="p-8 text-center text-slate-400 text-sm">Loading...</div> : logs.length === 0 ? <div className="p-8 text-center text-slate-500 text-sm">No practice attempts yet</div> : (
              <div className="divide-y divide-slate-700 max-h-64">
                {logs.slice(0, 10).map((log) => (
                  <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-slate-700/30 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${log.success ? 'bg-emerald-600/80 text-white' : 'bg-red-900/50 text-red-200'}`}>{log.success ? '✓' : '✗'}</div>
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium text-white">{log.success ? 'Solved' : errorCodeLabels[log.errorCode] || 'Failed'}</div></div>
                    <div className="text-right"><div className="text-sm font-medium text-slate-300">{formatDuration(log.durationMs)}</div><div className="text-xs text-slate-500">{formatDate(log.occurredAt)}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="p-6 border-t border-slate-700 flex gap-3 flex-shrink-0 bg-slate-800/50">
          <button onClick={onClose} className="flex-1 px-4 py-3 border border-slate-600 rounded-xl text-slate-300 hover:bg-slate-700 font-medium transition-colors">Close</button>
          {canPractice && (
            <button onClick={() => onStartPractice(node)} className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors">
              {node.status === 'DECAYING' ? 'Review Now' : 'Start Practice'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
