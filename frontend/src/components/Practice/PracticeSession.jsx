import { useState, useEffect } from 'react';
import { createLog } from '../../api/logs';
import { getProblemsForNode } from '../../api/problems';

const errorTypes = [
  { code: 'EXECUTION', label: 'Execution error', description: 'Typo, off-by-one, syntax error' },
  { code: 'FORGOT', label: 'Forgot approach', description: 'Knew it before but forgot' },
  { code: 'CONCEPT', label: 'Concept gap', description: "Didn't understand the concept" },
];

export default function PracticeSession({ node, onComplete, onCancel }) {
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedError, setSelectedError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [problems, setProblems] = useState([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    console.log('Loading problems for node:', node.id);
    getProblemsForNode(node.id)
      .then(probs => {
        console.log('Loaded problems:', probs);
        setProblems(probs);
        setLoadingProblems(false);
      })
      .catch(err => {
        console.error('Failed to load problems:', err);
        console.error('Error details:', err.message);
        setError(`Failed to load problems: ${err.message}`);
        setProblems([]);
        setLoadingProblems(false);
      });
  }, [node.id]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSuccess = async () => {
    setSubmitting(true);
    setError('');
    try {
      const durationMs = Date.now() - startTime;
      const result = await createLog(node.id, true, null, durationMs);
      
      // If there are more problems, move to next one
      if (currentProblemIndex < problems.length - 1) {
        setCurrentProblemIndex(currentProblemIndex + 1);
        setShowSolution(false);
        setSubmitting(false);
      } else {
        // All problems done
        onComplete(result);
      }
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const handleFailure = async () => {
    if (!selectedError) {
      setError('Please select a reason');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const durationMs = Date.now() - startTime;
      const result = await createLog(node.id, false, selectedError, durationMs);
      
      // If there are more problems, move to next one
      if (currentProblemIndex < problems.length - 1) {
        setCurrentProblemIndex(currentProblemIndex + 1);
        setShowResult(false);
        setSelectedError(null);
        setShowSolution(false);
        setSubmitting(false);
      } else {
        // All problems done
        onComplete(result);
      }
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const currentProblem = problems[currentProblemIndex];
  const hasMultipleProblems = problems.length > 1;

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl shadow-2xl p-8 w-full max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-xl mb-4">
          <span className="text-3xl">💻</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{node.name}</h2>
        <p className="text-slate-400 font-medium">{node.category}</p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-xl border border-slate-600">
          <span className="text-xl font-mono font-bold text-white">{formatTime(elapsed)}</span>
          <span className="text-sm text-slate-400">elapsed</span>
        </div>
      </div>
      {node.description && (
        <div className="text-center mb-6">
          <p className="text-slate-300 text-lg leading-relaxed max-w-2xl mx-auto">{node.description}</p>
        </div>
      )}
      
      {loadingProblems ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-600 border-t-indigo-500"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      ) : problems.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-slate-400 mb-4">Practice this skill and log your attempt below.</p>
          {node.externalUrl && node.status !== 'LOCKED' && (
            <a
              href={node.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-medium transition-colors"
            >
              {node.externalUrl.includes('leetcode.com') ? 'Open on LeetCode ↗' : 'Open link ↗'}
            </a>
          )}
        </div>
      ) : currentProblem ? (
        <div className="mb-8">
          {hasMultipleProblems && (
            <div className="text-center mb-4">
              <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                Problem {currentProblemIndex + 1} of {problems.length}
              </span>
            </div>
          )}
          <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase">Difficulty: {'⭐'.repeat(currentProblem.difficulty || 1)}</span>
            </div>
            <p className="text-lg text-slate-200 leading-relaxed whitespace-pre-wrap">{currentProblem.problemText}</p>
          </div>
          {showSolution && currentProblem.solutionText && (
            <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600 mb-4">
              <h4 className="font-bold text-emerald-400 mb-2">Solution:</h4>
              <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{currentProblem.solutionText}</p>
            </div>
          )}
          {!showSolution && currentProblem.solutionText && (
            <div className="text-center">
              <button onClick={() => setShowSolution(true)} className="px-6 py-2 bg-slate-700 text-slate-200 rounded-xl hover:bg-slate-600 font-medium transition-colors">Show Solution</button>
            </div>
          )}
          
          {/* Show external link only when skill is unlocked */}
          {node.externalUrl && node.status !== 'LOCKED' && (
            <div className="text-center mt-4">
              <a
                href={node.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all font-semibold text-sm"
              >
                <span>🔗</span>
                {node.externalUrl.includes('leetcode.com') ? 'Open on LeetCode' : 'Open link'}
                <span className="text-lg">↗</span>
              </a>
            </div>
          )}
        </div>
      ) : null}
      <div className="border-t border-slate-700 pt-8">
        {(currentProblem || problems.length === 0) && !showResult ? (
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-6">How did it go?</h3>
            <div className="flex gap-4 justify-center max-w-md mx-auto">
              <button
                onClick={handleSuccess}
                disabled={submitting}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-50 font-semibold transition-colors"
              >
                ✓ Success
              </button>
              <button
                onClick={() => setShowResult(true)}
                disabled={submitting}
                className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-red-300 border border-slate-600 rounded-xl disabled:opacity-50 font-semibold transition-colors"
              >
                ✗ Fail
              </button>
            </div>
            {hasMultipleProblems && currentProblemIndex < problems.length - 1 && (
              <p className="mt-4 text-sm text-slate-400">
                {problems.length - currentProblemIndex - 1} more problem{problems.length - currentProblemIndex - 1 !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-6 text-center">What went wrong?</h3>
            <div className="space-y-3 mb-6">
              {errorTypes.map((err) => (
                <label
                  key={err.code}
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedError === err.code
                      ? 'border-red-500 bg-red-900/30'
                      : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
                  }`}
                >
                  <input type="radio" name="errorType" value={err.code} checked={selectedError === err.code} onChange={() => setSelectedError(err.code)} className="mt-1 w-5 h-5" />
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">{err.label}</div>
                    <div className="text-sm text-slate-400">{err.description}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={() => { setShowResult(false); setSelectedError(null); }} className="flex-1 py-3 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700 font-medium transition-colors">Back</button>
              <button onClick={handleFailure} disabled={submitting || !selectedError} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-50 font-semibold transition-colors">Log Attempt</button>
            </div>
            <p className="mt-4 text-center text-slate-500 text-sm">You must log your attempt to track progress.</p>
          </div>
        )}
        {error && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-500/50 text-red-200 rounded-lg text-sm max-w-2xl mx-auto">
            {error}
          </div>
        )}
        {!showResult && (
          <div className="text-center mt-6">
            <button onClick={onCancel} className="text-slate-400 hover:text-white text-sm font-medium">Cancel Practice</button>
          </div>
        )}
      </div>
    </div>
  );
}
