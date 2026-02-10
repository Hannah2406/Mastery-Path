export default function GenerateWithAIModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Generate path with AI</h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
            <p className="text-slate-300 text-sm">
              <strong className="text-indigo-300">Coming soon.</strong> AI will generate a custom learning path based on your goals, level, and time. You’ll be able to describe what you want to learn and get a structured path with skills and practice.
            </p>
          </div>
          <button onClick={onClose} className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
