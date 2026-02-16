import { useState, useEffect } from 'react';
import { getPaths } from '../../api/paths';
import CreatePathModal from './CreatePathModal';
import GenerateWithAIModal from './GenerateWithAIModal';

const pathIcons = { 'Blind 75': '💻', 'AMC8': '🔢' };

export default function PathSelector({ onSelectPath, onShowMarketplace }) {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  const refreshPaths = () => {
    getPaths().then(setPaths).catch((err) => setError(err.message));
  };

  useEffect(() => {
    getPaths()
      .then(setPaths)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="text-center">
          <div className="w-12 h-12 bg-slate-700 rounded-xl mb-4 animate-pulse mx-auto" />
          <div className="text-slate-400">Loading paths...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center p-12">
        <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-6 rounded-xl max-w-md">
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Choose Your Learning Path</h2>
        <p className="text-slate-400">Select a path to start tracking your mastery</p>
      </div>
      {/* Make your own */}
      <div className="mb-8 p-4 bg-slate-800/80 border border-slate-700 rounded-xl">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Make your own path</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="group p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl text-left transition-all"
          >
            <span className="text-2xl mb-2 block">✏️</span>
            <span className="font-medium text-white group-hover:text-indigo-300">From scratch</span>
            <p className="text-slate-400 text-sm mt-0.5">Create a path with a name and description. Add skills later from the Map.</p>
          </button>
          <button
            type="button"
            onClick={() => setShowAIModal(true)}
            className="group p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl text-left transition-all"
          >
            <span className="text-2xl mb-2 block">✨</span>
            <span className="font-medium text-white group-hover:text-indigo-300">Generate with AI</span>
            <p className="text-slate-400 text-sm mt-0.5">AI will build a custom path from your goals.</p>
          </button>
        </div>
      </div>

      {onShowMarketplace && (
        <button
          type="button"
          onClick={onShowMarketplace}
          className="w-full mb-8 group bg-gradient-to-br from-indigo-900/60 to-slate-800/80 border border-indigo-500/40 hover:border-indigo-400/60 p-6 rounded-xl text-left transition-all hover:shadow-lg hover:shadow-indigo-500/15"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600/80 group-hover:bg-indigo-500 rounded-xl flex items-center justify-center text-2xl transition-colors shrink-0">
              🛒
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white mb-0.5 group-hover:text-indigo-200 transition-colors">
                Discover paths from the community
              </h3>
              <p className="text-slate-400 text-sm">
                Browse, preview, and import learning paths shared by others — or publish your own.
              </p>
              <span className="inline-flex items-center gap-1.5 mt-2 text-indigo-400 text-sm font-medium">
                Browse Marketplace
                <span aria-hidden>→</span>
              </span>
            </div>
          </div>
        </button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center md:justify-items-stretch">
        {paths.map((path) => {
          const icon = pathIcons[path.name] || '📚';
          return (
            <button
              key={path.id}
              onClick={() => onSelectPath(path)}
              className="group bg-slate-800/80 border border-slate-700 hover:border-indigo-500/50 p-8 rounded-xl text-left transition-all hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-slate-700 group-hover:bg-indigo-600 rounded-xl flex items-center justify-center text-2xl transition-colors">
                  {icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                    {path.name}
                  </h3>
                  <p className="text-slate-400 text-sm">{path.description}</p>
                  <div className="mt-3 text-indigo-400 text-sm font-medium">Start learning →</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {showCreateModal && (
        <CreatePathModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(path) => {
            refreshPaths();
            onSelectPath(path);
          }}
        />
      )}
      {showAIModal && (
        <GenerateWithAIModal 
          onClose={() => setShowAIModal(false)} 
          onPathCreated={(path) => {
            setShowAIModal(false);
            refreshPaths();
            onSelectPath(path);
          }}
        />
      )}
    </div>
  );
}
