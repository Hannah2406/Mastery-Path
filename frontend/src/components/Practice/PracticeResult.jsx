export default function PracticeResult({ result, nodeName, onClose }) {
  const { userSkill, unlockedNodeIds } = result;
  const progressPercent = Math.round((userSkill.masteryScore || 0) * 100);
  const isMastered = userSkill.nodeStatus === 'MASTERED';

  return (
    <div className="glass-effect rounded-2xl shadow-2xl p-10 max-w-lg mx-auto text-center animate-fade-in">
      <div className="text-7xl mb-6">
        {isMastered ? '🎉' : progressPercent > 50 ? '👍' : '💪'}
      </div>
      <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
        {isMastered ? 'Mastered!' : 'Practice Logged!'}
      </h2>
      <p className="text-gray-700 text-lg font-medium mb-8">{nodeName}</p>
      <div className="mb-8 max-w-sm mx-auto">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 font-medium">Mastery</span>
          <span className="font-bold text-gray-800 text-lg">{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${
              isMastered ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {!isMastered && progressPercent < 80 && (
          <p className="text-sm text-gray-500 mt-3 font-medium">
            {80 - progressPercent}% more to mastery
          </p>
        )}
      </div>
      {unlockedNodeIds && unlockedNodeIds.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl mb-8 border-2 border-green-200 max-w-md mx-auto">
          <div className="text-green-700 font-bold text-lg mb-2">
            🔓 Unlocked {unlockedNodeIds.length} new {unlockedNodeIds.length === 1 ? 'skill' : 'skills'}!
          </div>
          <p className="text-green-600 text-sm">
            Check the skill tree to see what's available.
          </p>
        </div>
      )}
      <button
        onClick={onClose}
        className="w-full max-w-sm mx-auto py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
      >
        Back to Skill Tree
      </button>
    </div>
  );
}
