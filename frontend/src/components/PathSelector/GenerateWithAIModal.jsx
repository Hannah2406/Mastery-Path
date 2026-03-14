import { useState } from 'react';
import { generatePath } from '../../api/ai';
import { createPathFromAI } from '../../api/paths';

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
      const list = Array.isArray(result?.suggestions) ? result.suggestions : [];
      setSuggestions(list);
      if (list.length === 0) {
        setError('No nodes were generated. Try a different or more specific topic, or try again in a moment.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate path');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePath = async () => {
    if (!suggestions || suggestions.length === 0) {
      setError('No nodes to add. Try regenerating or add an AI API key (see instructions above).');
      return;
    }
    setCreatingPath(true);
    setError('');
    try {
      const pathName = (description || '').substring(0, 50).trim() || 'AI Generated Path';
      const path = await createPathFromAI({
        name: pathName,
        description: `AI-generated path: ${description}`,
        suggestions: suggestions.map((s) => ({
          name: s.name ?? '',
          description: s.description ?? '',
          category: s.category ?? 'General',
          prerequisites: Array.isArray(s.prerequisites) ? s.prerequisites : [],
        })),
      });
      if (!path?.id) {
        setError('Path was created but the response was invalid. Refresh the page to see your new path.');
        return;
      }
      onClose();
      if (onPathCreated) {
        onPathCreated(path);
      }
    } catch (err) {
      setError(err.message || 'Failed to create path. Make sure you’re logged in and the backend is running.');
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
                  Topic or goal (e.g. AMC 8–style path, LeetCode–style path, or any subject)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., AMC 8 competition math, LeetCode-style coding interviews, Python for data science, Calculus fundamentals, SAT math..."
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                />
                <p className="mt-1.5 text-xs text-slate-500">AI will build a path with proper difficulty and topics that build on each other.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Difficulty (shapes the path)
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
                Uses AI to generate a path for your topic with the right difficulty and order. Set <code className="bg-slate-700 px-1 rounded">GEMINI_API_KEY</code> or <code className="bg-slate-700 px-1 rounded">OPENAI_API_KEY</code> in <code className="bg-slate-700 px-1 rounded">.env</code> and restart the backend for best results.
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
                <h4 className="text-indigo-300 font-bold mb-2">Generated path for your topic</h4>
                <p className="text-slate-300 text-sm mb-4">Topic: {description}. Nodes are ordered for success (foundation first, then harder).</p>
                <div className="space-y-2">
                  {suggestions.map((s, idx) => (
                    <div key={idx} className="p-3 bg-slate-700/50 rounded-lg">
                      <div className="font-medium text-white">{idx + 1}. {s.name}</div>
                      <div className="text-sm text-slate-400 mt-1">{s.description || '—'}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-slate-500">Category: {s.category}</span>
                        {Array.isArray(s.prerequisites) && s.prerequisites.length > 0 && (
                          <span className="text-xs text-slate-500">After: unit(s) {s.prerequisites.map((p) => p + 1).join(', ')}</span>
                        )}
                      </div>
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
                  disabled={creatingPath || !suggestions?.length}
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
