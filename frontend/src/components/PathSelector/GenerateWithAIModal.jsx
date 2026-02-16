import { useState } from 'react';
import { generatePath } from '../../api/ai';
import { createPath } from '../../api/paths';

export default function GenerateWithAIModal({ onClose, onPathCreated }) {
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [creatingPath, setCreatingPath] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please describe what you want to learn');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await generatePath(description, difficulty, estimatedTime ? parseInt(estimatedTime) : null);
      setSuggestions(result.suggestions);
    } catch (err) {
      setError(err.message || 'Failed to generate path');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePath = async () => {
    if (!suggestions || suggestions.length === 0) return;
    setCreatingPath(true);
    setError('');
    try {
      const pathName = description.substring(0, 50) || 'AI Generated Path';
      const path = await createPath({ name: pathName, description: `AI-generated path: ${description}` });
      if (onPathCreated) {
        onPathCreated(path);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create path');
    } finally {
      setCreatingPath(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800">
          <h3 className="text-lg font-bold text-white">Generate path with AI</h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {!suggestions ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  What do you want to learn?
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Master Python for data science, Learn calculus fundamentals, Prepare for coding interviews..."
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Estimated time (minutes)
                  </label>
                  <input
                    type="number"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <p className="text-slate-500 text-xs">
                Uses <strong className="text-slate-400">OpenAI</strong>. For custom AI paths, set <code className="bg-slate-700 px-1 rounded">OPENAI_API_KEY</code> when starting the backend. Otherwise you’ll get a default template.
              </p>
              {error && (
                <div className="p-4 bg-red-900/30 border border-red-500/50 text-red-200 rounded-xl">
                  {error}
                </div>
              )}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
              >
                {loading ? 'Generating...' : '✨ Generate Path'}
              </button>
            </>
          ) : (
            <>
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                <h4 className="text-indigo-300 font-bold mb-2">Generated Learning Path</h4>
                <p className="text-slate-300 text-sm mb-4">{description}</p>
                <div className="space-y-2">
                  {suggestions.map((s, idx) => (
                    <div key={idx} className="p-3 bg-slate-700/50 rounded-lg">
                      <div className="font-medium text-white">{idx + 1}. {s.name}</div>
                      <div className="text-sm text-slate-400 mt-1">{s.description}</div>
                      <div className="text-xs text-slate-500 mt-1">Category: {s.category}</div>
                    </div>
                  ))}
                </div>
              </div>
              {error && (
                <div className="p-4 bg-red-900/30 border border-red-500/50 text-red-200 rounded-xl">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setSuggestions(null)}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleCreatePath}
                  disabled={creatingPath}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                >
                  {creatingPath ? 'Creating...' : 'Create Path'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
