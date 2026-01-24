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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  const totalTimeMinutes = Math.round((stats?.totalTimeMs || 0) / 60000);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Practice History</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          Back
        </button>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-800">
            {stats?.totalPractices || 0}
          </div>
          <div className="text-sm text-gray-500">Total Practices</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">
            {Math.round((stats?.successRate || 0) * 100)}%
          </div>
          <div className="text-sm text-gray-500">Success Rate</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">
            {stats?.masteredCount || 0}
          </div>
          <div className="text-sm text-gray-500">Skills Mastered</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-600">
            {totalTimeMinutes}m
          </div>
          <div className="text-sm text-gray-500">Total Time</div>
        </div>
      </div>
      {/* Recent Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="font-medium text-gray-800">Recent Practice</h3>
        </div>
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No practice sessions yet. Start practicing to see your history!
          </div>
        ) : (
          <div className="divide-y">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    log.success
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {log.success ? '✓' : '✗'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">
                    {log.nodeName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {log.categoryName}
                    {!log.success && log.errorCode && (
                      <span className="ml-2 text-red-500">
                        • {errorCodeLabels[log.errorCode] || log.errorCode}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
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
    </div>
  );
}
