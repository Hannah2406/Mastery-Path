import { useState, useEffect } from 'react';
import { getPaths } from '../../api/paths';
import ReviewQueue from './ReviewQueue';

export default function ReviewPageContent({ onStartPractice }) {
  const [paths, setPaths] = useState([]);
  const [selectedPathId, setSelectedPathId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPaths()
      .then(setPaths)
      .catch(() => setPaths([]))
      .finally(() => setLoading(false));
  }, []);

  const selectedPath = paths.find((p) => p.id === selectedPathId);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#E9E7F5] border-t-[#7C5CFF]" />
      </div>
    );
  }

  if (paths.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-[#FFFFFF] border border-[#E9E7F5] rounded-2xl max-w-md mx-auto">
        <p className="text-[#6B7280] font-medium mb-2">No learning paths yet</p>
        <p className="text-sm text-[#6B7280]">Create or import a path from Practice or Marketplace first.</p>
      </div>
    );
  }

  if (!selectedPathId) {
    return (
      <div className="w-full max-w-md mx-auto">
        <p className="text-[#6B7280] text-center mb-4">Choose a path to see your review queue:</p>
        <div className="space-y-2">
          {paths.map((path) => (
            <button
              key={path.id}
              type="button"
              onClick={() => setSelectedPathId(path.id)}
              className="w-full text-left px-5 py-4 rounded-2xl bg-[#FFFFFF] border border-[#E9E7F5] hover:border-[#7C5CFF]/50 hover:shadow-lg hover:shadow-[#7C5CFF]/10 transition-all"
            >
              <span className="font-heading font-semibold text-[#1F2937]">{path.name}</span>
              {path.description && (
                <p className="text-sm text-[#6B7280] mt-0.5 truncate">{path.description}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <button
        type="button"
        onClick={() => setSelectedPathId(null)}
        className="text-sm text-[#7C5CFF] hover:text-[#6B4CE6] mb-4"
      >
        ← Change path
      </button>
      <ReviewQueue
        pathId={selectedPathId}
        pathName={selectedPath?.name}
        onStartPractice={onStartPractice}
      />
    </div>
  );
}
