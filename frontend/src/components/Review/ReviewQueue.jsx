import { useState, useEffect } from 'react';
import { getReviewQueue } from '../../api/review';

const statusLabels = {
  LOCKED: 'Locked',
  AVAILABLE: 'Available',
  DECAYING: 'Needs Review',
  MASTERED: 'Mastered',
};

export default function ReviewQueue({ pathId, pathName, onStartPractice }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQueue = () => {
    if (!pathId) return;
    setLoading(true);
    setError('');
    getReviewQueue(pathId, 20)
      .then((data) => {
        setQueue(data.nodes || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setQueue([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchQueue();
  }, [pathId]);

  if (!pathId) {
    return (
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
        Select a path to see your review queue.
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-2">Review Queue</h2>
        <p className="text-slate-400 text-sm mb-6">
          Topics due for review to keep mastery strong. Completing a review logs an attempt and updates your progress.
        </p>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-600 border-t-indigo-500" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-900/30 border border-red-500/50 text-red-200 rounded-xl text-sm">
            {error}
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center py-12 bg-slate-700/30 rounded-xl border border-slate-600">
            <p className="text-slate-300 font-medium mb-2">Nothing due right now</p>
            <p className="text-slate-500 text-sm">Practice and master skills; they’ll appear here when they’re due for review.</p>
          </div>
        ) : (
          <ul className="space-y-2 mb-6">
            {queue.map((node) => (
              <li
                key={node.id}
                className="flex items-center justify-between gap-4 p-4 bg-slate-700/50 rounded-xl border border-slate-600 hover:border-slate-500 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">{node.name}</div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                    <span>{statusLabels[node.status] || node.status}</span>
                    {node.masteryScore != null && (
                      <span>· {Math.round((node.masteryScore || 0) * 100)}% mastery</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onStartPractice(node)}
                  className="shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  Start Review
                </button>
              </li>
            ))}
          </ul>
        )}
        {queue.length > 0 && (
          <p className="text-xs text-slate-500">
            Completing a review logs an attempt and refreshes the queue.
          </p>
        )}
      </div>
    </div>
  );
}
