export default function PracticeResult({ result, nodeName, onClose }) {
  const { userSkill, unlockedNodeIds } = result;
  const progressPercent = Math.round((userSkill.masteryScore || 0) * 100);
  const isMastered = userSkill.nodeStatus === 'MASTERED';

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto text-center">
      <div className="text-5xl mb-4">
        {isMastered ? '🎉' : progressPercent > 50 ? '👍' : '💪'}
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">
        {isMastered ? 'Mastered!' : 'Practice Logged!'}
      </h2>
      <p className="text-gray-600 mb-6">{nodeName}</p>
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">Mastery</span>
          <span className="font-medium text-gray-700">{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              isMastered ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {!isMastered && progressPercent < 80 && (
          <p className="text-xs text-gray-500 mt-2">
            {80 - progressPercent}% more to mastery
          </p>
        )}
      </div>
      {unlockedNodeIds && unlockedNodeIds.length > 0 && (
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <div className="text-green-700 font-medium mb-1">
            🔓 Unlocked {unlockedNodeIds.length} new {unlockedNodeIds.length === 1 ? 'skill' : 'skills'}!
          </div>
          <p className="text-green-600 text-sm">
            Check the skill tree to see what's available.
          </p>
        </div>
      )}
      <button
        onClick={onClose}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        Back to Skill Tree
      </button>
    </div>
  );
}
