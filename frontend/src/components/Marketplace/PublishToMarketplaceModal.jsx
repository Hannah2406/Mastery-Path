import { useState } from 'react';
import { publishPath } from '../../api/marketplace';

export default function PublishToMarketplaceModal({ path, onClose, onPublished }) {
  const [title, setTitle] = useState(path?.name || '');
  const [description, setDescription] = useState(path?.description || '');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [estimatedTimeMinutes, setEstimatedTimeMinutes] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [priceCents, setPriceCents] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!path?.id) return;
    setSubmitting(true);
    setError('');
    try {
      const tags = tagsStr ? tagsStr.split(/[\s,]+/).filter(Boolean) : [];
      await publishPath({
        pathId: path.id,
        title: title.trim() || path.name,
        description: description.trim() || null,
        difficulty: difficulty || 'intermediate',
        estimatedTimeMinutes: estimatedTimeMinutes ? parseInt(estimatedTimeMinutes, 10) : null,
        tags: tags.length ? tags : null,
        isPaid: isPaid,
        priceCents: isPaid && priceCents ? Math.round(parseFloat(priceCents) * 100) : null,
      });
      onPublished?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Publish to Marketplace</h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              placeholder="Path title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white resize-none"
              rows={3}
              placeholder="What this path covers"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Estimated time (minutes)</label>
            <input
              type="number"
              min="0"
              value={estimatedTimeMinutes}
              onChange={(e) => setEstimatedTimeMinutes(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              placeholder="e.g. 120"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              placeholder="DSA, interview, math"
            />
          </div>
          <div className="border-t border-slate-700 pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPaid"
                checked={isPaid}
                onChange={(e) => {
                  setIsPaid(e.target.checked);
                  if (!e.target.checked) setPriceCents('');
                }}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isPaid" className="text-sm font-medium text-slate-300 cursor-pointer">
                Sell this path
              </label>
            </div>
            {isPaid && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={priceCents}
                    onChange={(e) => setPriceCents(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-8 pr-3 py-2 text-white"
                    placeholder="29.99"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Set a price to sell your path. Leave free to share for free.</p>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-600 rounded-xl text-slate-300 hover:bg-slate-700 font-medium">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium disabled:opacity-50">
              {submitting ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
