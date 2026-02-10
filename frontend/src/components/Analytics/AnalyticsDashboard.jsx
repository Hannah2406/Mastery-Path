import { useState, useEffect } from 'react';
import { getAnalyticsSummary } from '../../api/analytics';
import ContributionHeatmap from '../Profile/ContributionHeatmap';

const ERROR_LABELS = {
  EXECUTION: 'Execution',
  FORGOT: 'Forgot',
  CONCEPT: 'Concept',
};

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState(null);
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getAnalyticsSummary(range)
      .then(setSummary)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [range]);

  if (loading && !summary) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-600 border-t-indigo-500" />
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="p-6 bg-red-900/30 border border-red-500/50 text-red-200 rounded-xl max-w-md mx-auto">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-bold text-white">Analytics</h2>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">Mistake breakdown range:</span>
          <select
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
            className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-sm"
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
      </div>

      {/* Heatmap - reuse existing component */}
      <ContributionHeatmap />

      {summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-center">
              <div className="text-sm font-semibold text-slate-400 mb-1">Mastered</div>
              <div className="text-2xl font-bold text-emerald-400">{summary.masteredCount}</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-center">
              <div className="text-sm font-semibold text-slate-400 mb-1">Needs Review</div>
              <div className="text-2xl font-bold text-amber-400">{summary.decayingCount}</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-center">
              <div className="text-sm font-semibold text-slate-400 mb-1">Available</div>
              <div className="text-2xl font-bold text-sky-400">{summary.availableCount}</div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Mistake breakdown (last {range} days)</h3>
            <div className="flex flex-wrap gap-4">
              {summary.mistakeCounts && Object.entries(summary.mistakeCounts).map(([code, count]) => (
                <div
                  key={code}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-xl border border-slate-600"
                >
                  <span className="font-medium text-white">{ERROR_LABELS[code] || code}</span>
                  <span className="text-slate-400">{count}</span>
                </div>
              ))}
              {summary.mistakeCounts && Object.keys(summary.mistakeCounts).length === 0 && (
                <p className="text-slate-500 text-sm">No failures in this period.</p>
              )}
            </div>
          </div>

          {summary.topLeakNodes && summary.topLeakNodes.length > 0 && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Top topics to reinforce</h3>
              <ul className="space-y-2">
                {summary.topLeakNodes.map((n) => (
                  <li
                    key={n.nodeId}
                    className="flex items-center justify-between gap-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600"
                  >
                    <span className="font-medium text-white">{n.nodeName}</span>
                    <span className="text-slate-400 text-sm">
                      {n.failureCount} failure{n.failureCount !== 1 ? 's' : ''} · {Math.round((n.masteryScore || 0) * 100)}% mastery
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
