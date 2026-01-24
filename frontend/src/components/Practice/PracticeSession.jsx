import { useState, useEffect } from 'react';
import { createLog } from '../../api/logs';

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

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

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
      onComplete(result);
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
      onComplete(result);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{node.name}</h2>
          <p className="text-sm text-gray-500">{node.category}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono text-gray-700">{formatTime(elapsed)}</div>
          <div className="text-xs text-gray-500">elapsed</div>
        </div>
      </div>
      {node.description && (
        <p className="text-gray-600 mb-4">{node.description}</p>
      )}
      {node.externalUrl && (
        <a
          href={node.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 mb-6"
        >
          Open Problem
          <span>↗</span>
        </a>
      )}
      <div className="border-t pt-6">
        {!showResult ? (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">How did it go?</h3>
            <div className="flex gap-4">
              <button
                onClick={handleSuccess}
                disabled={submitting}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                ✓ Solved it!
              </button>
              <button
                onClick={() => setShowResult(true)}
                disabled={submitting}
                className="flex-1 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 font-medium"
              >
                ✗ Didn't solve
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">What happened?</h3>
            <div className="space-y-3 mb-6">
              {errorTypes.map((err) => (
                <label
                  key={err.code}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedError === err.code
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="errorType"
                    value={err.code}
                    checked={selectedError === err.code}
                    onChange={() => setSelectedError(err.code)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-800">{err.label}</div>
                    <div className="text-sm text-gray-500">{err.description}</div>
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
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleFailure}
                disabled={submitting || !selectedError}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                Submit Result
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}
        <button
          onClick={onCancel}
          className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
        >
          Cancel Practice
        </button>
      </div>
    </div>
  );
}
