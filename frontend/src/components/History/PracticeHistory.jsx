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
          <div className="w-16 h-16 bg-slate-700 rounded-xl mb-4 animate-pulse mx-auto" />
          <div className="text-slate-400 font-medium">Loading history...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-6 rounded-xl">
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalTimeMinutes = Math.round((stats?.totalTimeMs || 0) / 60000);

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Practice History</h2>
        <p className="text-slate-400">Track your learning progress</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
        <div className="bg-slate-800/80 rounded-xl p-6 text-center border border-slate-700">
          <div className="text-3xl font-bold text-white mb-1">{stats?.totalPractices || 0}</div>
          <div className="text-sm text-slate-400 font-medium">Total Practices</div>
        </div>
        <div className="bg-slate-800/80 rounded-xl p-6 text-center border border-emerald-500/50">
          <div className="text-3xl font-bold text-emerald-400 mb-1">{Math.round((stats?.successRate || 0) * 100)}%</div>
          <div className="text-sm text-slate-400 font-medium">Success Rate</div>
        </div>
        <div className="bg-slate-800/80 rounded-xl p-6 text-center border border-slate-700">
          <div className="text-3xl font-bold text-indigo-400 mb-1">{stats?.masteredCount || 0}</div>
          <div className="text-sm text-slate-400 font-medium">Skills Mastered</div>
        </div>
        <div className="bg-slate-800/80 rounded-xl p-6 text-center border border-slate-700">
          <div className="text-3xl font-bold text-slate-200 mb-1">{totalTimeMinutes}m</div>
          <div className="text-sm text-slate-400 font-medium">Total Time</div>
        </div>
      </div>
      <div className="bg-slate-800/80 rounded-xl border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-xl font-bold text-white text-center">Recent Practice</h3>
        </div>
        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-slate-400 font-medium text-lg">No practice sessions yet</p>
            <p className="text-slate-500 text-sm mt-2">Start practicing to see your history!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {logs.map((log) => (
              <div key={log.id} className="p-5 flex items-center gap-5 hover:bg-slate-700/30 transition-colors">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${log.success ? 'bg-emerald-600/80 text-white' : 'bg-red-900/50 text-red-200'}`}>{log.success ? '✓' : '✗'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-lg truncate mb-1">{log.nodeName}</div>
                  <div className="text-sm text-slate-400">
                    <span className="font-medium">{log.categoryName}</span>
                    {!log.success && log.errorCode && <span className="ml-2 text-red-400 font-medium">• {errorCodeLabels[log.errorCode] || log.errorCode}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-semibold text-slate-300 mb-1">{formatDuration(log.durationMs)}</div>
                  <div className="text-xs text-slate-500 font-medium">{formatDate(log.occurredAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
