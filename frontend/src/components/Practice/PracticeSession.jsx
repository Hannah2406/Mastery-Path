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
    <div className="glass-effect rounded-2xl shadow-2xl p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
          <span className="text-4xl">💻</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{node.name}</h2>
        <p className="text-gray-600 font-medium">{node.category}</p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-200">
          <span className="text-2xl font-mono font-bold text-indigo-600">{formatTime(elapsed)}</span>
          <span className="text-sm text-indigo-500 font-medium">elapsed</span>
        </div>
      </div>
      {node.description && (
        <div className="text-center mb-6">
          <p className="text-gray-700 text-lg leading-relaxed max-w-2xl mx-auto">{node.description}</p>
        </div>
      )}
      
      {loadingProblems ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading problems...</p>
        </div>
      ) : problems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No problems available for this topic yet.</p>
          {/* Show LeetCode link for Blind 75 problems if no database problems */}
          {node.externalUrl && node.externalUrl.includes('leetcode.com') && (
            <div className="mt-6">
              <a
                href={node.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all font-semibold"
              >
                Open on LeetCode
                <span className="text-lg">↗</span>
              </a>
            </div>
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
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase">
                Difficulty: {'⭐'.repeat(currentProblem.difficulty)}
              </span>
            </div>
            <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
              {currentProblem.problemText}
            </p>
          </div>
          
          {showSolution && currentProblem.solutionText && (
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200 shadow-sm mb-4">
              <h4 className="font-bold text-green-800 mb-2">Solution:</h4>
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {currentProblem.solutionText}
              </p>
            </div>
          )}
          
          {!showSolution && (
            <div className="text-center">
              <button
                onClick={() => setShowSolution(true)}
                className="px-6 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 font-medium transition-colors"
              >
                Show Solution
              </button>
            </div>
          )}
          
          {/* Show LeetCode link for Blind 75 problems */}
          {node.externalUrl && node.externalUrl.includes('leetcode.com') && (
            <div className="text-center mt-4">
              <a
                href={node.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all font-semibold text-sm"
              >
                <span>🔗</span>
                Open on LeetCode
                <span className="text-lg">↗</span>
              </a>
            </div>
          )}
        </div>
      ) : null}
      <div className="border-t border-gray-200 pt-8">
        {currentProblem && !showResult ? (
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">How did it go?</h3>
            <div className="flex gap-4 justify-center max-w-md mx-auto">
              <button
                onClick={handleSuccess}
                disabled={submitting}
                className="flex-1 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              >
                ✓ Solved it!
              </button>
              <button
                onClick={() => setShowResult(true)}
                disabled={submitting}
                className="flex-1 py-4 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 disabled:opacity-50 font-semibold border-2 border-red-200 hover:border-red-300 transition-all"
              >
                ✗ Didn't solve
              </button>
            </div>
            {hasMultipleProblems && currentProblemIndex < problems.length - 1 && (
              <p className="mt-4 text-sm text-gray-500">
                {problems.length - currentProblemIndex - 1} more problem{problems.length - currentProblemIndex - 1 !== 1 ? 's' : ''} remaining
              </p>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">What happened?</h3>
            <div className="space-y-3 mb-6">
              {errorTypes.map((err) => (
                <label
                  key={err.code}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedError === err.code
                      ? 'border-red-500 bg-red-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <input
                    type="radio"
                    name="errorType"
                    value={err.code}
                    checked={selectedError === err.code}
                    onChange={() => setSelectedError(err.code)}
                    className="mt-1 w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 mb-1">{err.label}</div>
                    <div className="text-sm text-gray-600">{err.description}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowResult(false);
                  setSelectedError(null);
                }}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleFailure}
                disabled={submitting || !selectedError}
                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              >
                Submit Result
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm max-w-2xl mx-auto">
            {error}
          </div>
        )}
        <div className="text-center mt-6">
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Cancel Practice
          </button>
        </div>
      </div>
    </div>
  );
}
