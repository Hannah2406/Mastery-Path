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
      <div className="flex justify-center items-center p-12 min-h-[160px]">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#E9E7F5] rounded-2xl mb-4 animate-pulse mx-auto" />
          <div className="text-[#6B7280] text-lg sm:text-xl font-bold">Loading paths...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center p-12">
        <div className="bg-[#FEE2E2] border border-[#EF4444]/30 text-[#B91C1C] p-5 sm:p-6 rounded-2xl max-w-md">
          <p className="font-bold text-base sm:text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in min-h-full flex flex-col">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1F2937] mb-2 leading-tight tracking-tight">
          Choose Your Learning Path
        </h2>
        <p className="text-[#6B7280] text-lg sm:text-xl font-semibold">
          Select a path to start tracking your mastery
        </p>
      </div>
      {/* Make your own — Soft Pastel surfaces */}
      <div className="mb-6 sm:mb-8 p-5 sm:p-6 bg-[#FAFAFF] border border-[#E9E7F5] rounded-2xl shadow-sm shadow-[#7C5CFF]/5">
        <h3 className="font-heading text-lg sm:text-xl font-bold text-[#1F2937] mb-3 sm:mb-4">Make your own path</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="group p-5 sm:p-6 bg-[#FBFBFF] hover:bg-[#F5F4FF] border border-[#E9E7F5] hover:border-[#7C5CFF]/40 rounded-2xl text-left transition-all hover:shadow-lg shadow-sm shadow-[#7C5CFF]/5 hover:shadow-[#7C5CFF]/15"
          >
            <span className="text-3xl sm:text-4xl mb-2 block">✏️</span>
            <span className="font-heading font-bold text-[#1F2937] group-hover:text-[#7C5CFF] text-lg sm:text-xl">From scratch</span>
            <p className="text-[#6B7280] text-base sm:text-lg mt-1 font-medium">Create a path with a name and description. Add skills later from the Map.</p>
          </button>
          <button
            type="button"
            onClick={() => setShowAIModal(true)}
            className="group p-5 sm:p-6 bg-[#FBFBFF] hover:bg-[#F5F4FF] border border-[#E9E7F5] hover:border-[#7C5CFF]/40 rounded-2xl text-left transition-all hover:shadow-lg shadow-sm shadow-[#7C5CFF]/5 hover:shadow-[#7C5CFF]/15"
          >
            <span className="text-3xl sm:text-4xl mb-2 block">✨</span>
            <span className="font-heading font-bold text-[#1F2937] group-hover:text-[#7C5CFF] text-lg sm:text-xl">Generate with AI</span>
            <p className="text-[#6B7280] text-base sm:text-lg mt-1 font-medium">AI will build a custom path from your goals.</p>
          </button>
        </div>
      </div>

      {onShowMarketplace && (
        <button
          type="button"
          onClick={onShowMarketplace}
          className="w-full mb-6 sm:mb-8 group bg-[#FAFAFF] border border-[#E9E7F5] hover:border-[#7C5CFF]/50 hover:bg-[#F5F4FF] p-5 sm:p-6 rounded-2xl text-left transition-all hover:shadow-xl shadow-sm shadow-[#7C5CFF]/5 hover:shadow-[#7C5CFF]/15"
        >
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#7C5CFF]/15 group-hover:bg-[#7C5CFF] rounded-2xl flex items-center justify-center text-2xl sm:text-3xl transition-colors shrink-0 text-[#7C5CFF] group-hover:text-white">
              🛒
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-[#1F2937] mb-0.5 group-hover:text-[#7C5CFF] transition-colors">
                Discover paths from the community
              </h3>
              <p className="text-[#6B7280] text-base sm:text-lg font-medium">
                Browse, preview, and import learning paths shared by others — or publish your own.
              </p>
              <span className="inline-flex items-center gap-1.5 mt-2 text-[#7C5CFF] text-base font-bold">
                Browse Marketplace
                <span aria-hidden>→</span>
              </span>
            </div>
          </div>
        </button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 justify-items-stretch flex-1 min-h-0">
        {paths.map((path) => {
          const icon = pathIcons[path.name] || '📚';
          return (
            <button
              key={path.id}
              onClick={() => onSelectPath(path)}
              className="group bg-[#FAFAFF] border border-[#E9E7F5] hover:border-[#7C5CFF]/40 hover:bg-[#F5F4FF] p-6 sm:p-7 rounded-2xl text-left transition-all hover:shadow-xl shadow-sm shadow-[#7C5CFF]/5 hover:shadow-[#7C5CFF]/15"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#E9E7F5] group-hover:bg-[#7C5CFF] rounded-2xl flex items-center justify-center text-2xl sm:text-3xl transition-colors group-hover:text-white shrink-0">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-[#1F2937] mb-1 group-hover:text-[#7C5CFF] transition-colors">
                    {path.name}
                  </h3>
                  <p className="text-[#6B7280] text-base sm:text-lg font-medium">{path.description}</p>
                  <div className="mt-2 sm:mt-3 text-[#7C5CFF] text-base font-bold">Start learning →</div>
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
