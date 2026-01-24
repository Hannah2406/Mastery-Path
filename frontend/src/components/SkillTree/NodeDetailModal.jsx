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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 flex-shrink-0">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-800">{node.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              &times;
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Category:</span>
              <span className="text-sm font-medium text-gray-700">{node.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Status:</span>
              <span className={`text-sm font-medium px-2 py-0.5 rounded ${statusInfo.bg} ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            {node.status !== 'LOCKED' && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Mastery</span>
                  <span className="font-medium text-gray-700">{progressPercent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      node.status === 'MASTERED'
                        ? 'bg-green-500'
                        : node.status === 'DECAYING'
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {node.status === 'DECAYING' && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Practice soon to prevent further decay!
                  </p>
                )}
              </div>
            )}
            {node.description && (
              <p className="text-sm text-gray-600">{node.description}</p>
            )}
            {node.externalUrl && (
              <a
                href={node.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                Open Problem
                <span>↗</span>
              </a>
            )}
          </div>
        </div>
        {/* Practice History Section */}
        {node.status !== 'LOCKED' && (
          <div className="border-t flex-1 overflow-y-auto">
            <div className="p-4 bg-gray-50 border-b sticky top-0">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">Practice History</h3>
                {totalAttempts > 0 && (
                  <span className="text-xs text-gray-500">
                    {successCount}/{totalAttempts} successful
                  </span>
                )}
              </div>
            </div>
            {loadingLogs ? (
              <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
            ) : logs.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No practice attempts yet
              </div>
            ) : (
              <div className="divide-y max-h-48">
                {logs.slice(0, 10).map((log) => (
                  <div key={log.id} className="p-3 flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        log.success
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {log.success ? '✓' : '✗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-600">
                        {log.success ? 'Solved' : errorCodeLabels[log.errorCode] || 'Failed'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {formatDuration(log.durationMs)}
                      </div>
                      <div className="text-xs text-gray-400">
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
        <div className="p-4 border-t flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          {canPractice && (
            <button
              onClick={() => onStartPractice(node)}
              className={`flex-1 px-4 py-2 text-white rounded-md ${
                node.status === 'DECAYING'
                  ? 'bg-yellow-500 hover:bg-yellow-600'
                  : 'bg-blue-600 hover:bg-blue-700'
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
