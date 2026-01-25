import { useState, useEffect } from 'react';
import { getLogs, getStats } from '../../api/history';

const errorCodeLabels = {
  EXECUTION: 'Execution error',
  FORGOT: 'Forgot approach',
  CONCEPT: 'Concept gap',
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

export default function PracticeHistory({ onClose }) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [logsData, statsData] = await Promise.all([
          getLogs(50),
          getStats(),
        ]);
        setLogs(logsData);
        setStats(statsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg animate-pulse">
            <span className="text-3xl">📊</span>
          </div>
          <div className="text-gray-600 font-medium">Loading history...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-sm">
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalTimeMinutes = Math.round((stats?.totalTimeMs || 0) / 60000);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="text-center">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Practice History
        </h2>
        <p className="text-gray-600">Track your learning progress</p>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
        <div className="glass-effect rounded-xl shadow-lg p-6 text-center border border-gray-100">
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {stats?.totalPractices || 0}
          </div>
          <div className="text-sm text-gray-600 font-medium">Total Practices</div>
        </div>
        <div className="glass-effect rounded-xl shadow-lg p-6 text-center border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {Math.round((stats?.successRate || 0) * 100)}%
          </div>
          <div className="text-sm text-gray-600 font-medium">Success Rate</div>
        </div>
        <div className="glass-effect rounded-xl shadow-lg p-6 text-center border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="text-3xl font-bold text-indigo-600 mb-1">
            {stats?.masteredCount || 0}
          </div>
          <div className="text-sm text-gray-600 font-medium">Skills Mastered</div>
        </div>
        <div className="glass-effect rounded-xl shadow-lg p-6 text-center border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {totalTimeMinutes}m
          </div>
          <div className="text-sm text-gray-600 font-medium">Total Time</div>
        </div>
      </div>
      {/* Recent Logs */}
      <div className="glass-effect rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 text-center">Recent Practice</h3>
        </div>
        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-gray-600 font-medium text-lg">No practice sessions yet</p>
            <p className="text-gray-500 text-sm mt-2">Start practicing to see your history!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="p-5 flex items-center gap-5 hover:bg-gray-50 transition-colors">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-sm ${
                    log.success
                      ? 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 border-2 border-green-200'
                      : 'bg-gradient-to-br from-red-100 to-rose-100 text-red-700 border-2 border-red-200'
                  }`}
                >
                  {log.success ? '✓' : '✗'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800 text-lg truncate mb-1">
                    {log.nodeName}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{log.categoryName}</span>
                    {!log.success && log.errorCode && (
                      <span className="ml-2 text-red-600 font-medium">
                        • {errorCodeLabels[log.errorCode] || log.errorCode}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-semibold text-gray-700 mb-1">
                    {formatDuration(log.durationMs)}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    {formatDate(log.occurredAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
