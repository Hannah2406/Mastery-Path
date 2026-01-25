import { useState, useEffect } from 'react';
import { getNodeLogs } from '../../api/history';

const statusLabels = {
  LOCKED: { label: 'Locked', color: 'text-gray-500', bg: 'bg-gray-100' },
  AVAILABLE: { label: 'Available', color: 'text-blue-600', bg: 'bg-blue-100' },
  MASTERED: { label: 'Mastered', color: 'text-green-600', bg: 'bg-green-100' },
  DECAYING: { label: 'Needs Review', color: 'text-yellow-600', bg: 'bg-yellow-100' },
};

const errorCodeLabels = {
  EXECUTION: 'Execution',
  FORGOT: 'Forgot',
  CONCEPT: 'Concept',
};

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
      getNodeLogs(node.id)
        .then(setLogs)
        .catch(() => setLogs([]))
        .finally(() => setLoadingLogs(false));
    }
  }, [node]);

  if (!node) return null;

  const statusInfo = statusLabels[node.status] || statusLabels.LOCKED;
  const progressPercent = Math.round((node.masteryScore || 0) * 100);
  const canPractice = node.status !== 'LOCKED';
  const successCount = logs.filter((l) => l.success).length;
  const totalAttempts = logs.length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-effect rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/20 animate-fade-in">
        <div className="p-8 flex-shrink-0">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <span className="text-3xl">📖</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{node.name}</h2>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-5 text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm font-semibold text-gray-600">Category:</span>
              <span className="text-sm font-bold text-gray-800 px-3 py-1 bg-indigo-50 rounded-lg">{node.category}</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm font-semibold text-gray-600">Status:</span>
              <span className={`text-sm font-bold px-4 py-1.5 rounded-xl ${statusInfo.bg} ${statusInfo.color} border-2 ${
                node.status === 'MASTERED' ? 'border-green-300' :
                node.status === 'AVAILABLE' ? 'border-blue-300' :
                node.status === 'DECAYING' ? 'border-yellow-300' :
                'border-gray-300'
              }`}>
                {statusInfo.label}
              </span>
            </div>
            {node.status !== 'LOCKED' && (
              <div className="max-w-sm mx-auto">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 font-medium">Mastery</span>
                  <span className="font-bold text-gray-800 text-lg">{progressPercent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      node.status === 'MASTERED'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : node.status === 'DECAYING'
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {node.status === 'DECAYING' && (
                  <p className="text-xs text-yellow-700 font-medium mt-2">
                    ⚠️ Practice soon to prevent further decay!
                  </p>
                )}
              </div>
            )}
            {node.description && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed">{node.description}</p>
              </div>
            )}
            {/* Show LeetCode link only for Blind 75 problems */}
            {node.externalUrl && node.externalUrl.includes('leetcode.com') && (
              <div className="flex justify-center">
                <a
                  href={node.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                >
                  <span>🔗</span>
                  Open on LeetCode
                  <span className="text-lg">↗</span>
                </a>
              </div>
            )}
          </div>
        </div>
        {/* Practice History Section */}
        {node.status !== 'LOCKED' && (
          <div className="border-t border-gray-200 flex-1 overflow-y-auto">
            <div className="p-5 bg-gradient-to-r from-gray-50 to-indigo-50 border-b border-gray-200 sticky top-0">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-gray-800">Practice History</h3>
                {totalAttempts > 0 && (
                  <span className="text-sm font-semibold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-lg">
                    {successCount}/{totalAttempts} successful
                  </span>
                )}
              </div>
            </div>
            {loadingLogs ? (
              <div className="p-8 text-center">
                <div className="text-gray-500 text-sm font-medium">Loading...</div>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">📝</div>
                <div className="text-gray-500 text-sm font-medium">No practice attempts yet</div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-64">
                {logs.slice(0, 10).map((log) => (
                  <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${
                        log.success
                          ? 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 border-2 border-green-200'
                          : 'bg-gradient-to-br from-red-100 to-rose-100 text-red-700 border-2 border-red-200'
                      }`}
                    >
                      {log.success ? '✓' : '✗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800">
                        {log.success ? 'Solved' : errorCodeLabels[log.errorCode] || 'Failed'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-700">
                        {formatDuration(log.durationMs)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(log.occurredAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold transition-colors"
          >
            Close
          </button>
          {canPractice && (
            <button
              onClick={() => onStartPractice(node)}
              className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all ${
                node.status === 'DECAYING'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
              }`}
            >
              {node.status === 'DECAYING' ? 'Review Now' : 'Start Practice'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
