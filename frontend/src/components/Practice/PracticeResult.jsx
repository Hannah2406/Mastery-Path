import { useState } from 'react';
import { generateSimilarQuestions } from '../../api/ai';

export default function PracticeResult({ result, nodeName, onClose, onRetry, onNextRecommended, lastErrorType, lastQuestion }) {
  const { userSkill, unlockedNodeIds } = result;
  const progressPercent = Math.round((userSkill.masteryScore || 0) * 100);
  const isMastered = userSkill.nodeStatus === 'MASTERED';
  const [similarQuestions, setSimilarQuestions] = useState(null);
  const [generatingSimilar, setGeneratingSimilar] = useState(false);
  const showSimilarQuestions = !isMastered && lastErrorType && lastQuestion;

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl shadow-2xl p-10 w-full max-w-md mx-auto text-center animate-fade-in">
      <div className="text-6xl mb-6">{isMastered ? '🎉' : progressPercent > 50 ? '👍' : '💪'}</div>
      <h2 className="text-2xl font-bold text-white mb-3">{isMastered ? 'Mastered!' : 'Practice Logged!'}</h2>
      <p className="text-slate-400 text-lg font-medium mb-6">{nodeName}</p>
      <div className="mb-6 max-w-sm mx-auto">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400 font-medium">Mastery</span>
          <span className="font-bold text-white text-lg">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
          <div className={`h-4 rounded-full transition-all duration-500 ${isMastered ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${progressPercent}%` }} />
        </div>
        {!isMastered && progressPercent < 80 && <p className="text-sm text-slate-500 mt-3 font-medium">{80 - progressPercent}% more to mastery</p>}
      </div>
      {unlockedNodeIds && unlockedNodeIds.length > 0 && (
        <div className="bg-emerald-900/30 border border-emerald-500/50 p-6 rounded-xl mb-6 max-w-md mx-auto text-left">
          <h3 className="text-emerald-300 font-bold text-lg mb-2">🔓 Unlocks</h3>
          <p className="text-emerald-200/80 text-sm mb-1">You unlocked {unlockedNodeIds.length} new {unlockedNodeIds.length === 1 ? 'skill' : 'skills'}. Check the Map to practice them.</p>
        </div>
      )}
      {showSimilarQuestions && !similarQuestions && (
        <div className="mb-6">
          <button
            onClick={async () => {
              setGeneratingSimilar(true);
              try {
                const result = await generateSimilarQuestions(lastQuestion, nodeName, lastErrorType);
                if (result.questions && result.questions.length > 0) {
                  setSimilarQuestions(result.questions);
                }
              } catch (err) {
                console.error('Failed to generate similar questions:', err);
              } finally {
                setGeneratingSimilar(false);
              }
            }}
            disabled={generatingSimilar}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
          >
            {generatingSimilar ? 'Generating...' : '✨ Generate Similar Questions'}
          </button>
        </div>
      )}
      {similarQuestions && (
        <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-left">
          <h4 className="text-indigo-300 font-bold mb-3">Similar Practice Questions</h4>
          <div className="space-y-3">
            {similarQuestions.map((q, idx) => (
              <div key={idx} className="p-3 bg-slate-700/50 rounded-lg">
                <div className="font-medium text-white mb-1">{q.problemText}</div>
                <details className="mt-2">
                  <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300">Show solution</summary>
                  <div className="mt-2 text-sm text-slate-300">{q.solutionText}</div>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-3 mt-8">
        {onNextRecommended && (
          <button
            onClick={onNextRecommended}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors"
          >
            Next recommended
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full py-3.5 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-semibold transition-colors border border-slate-500"
          >
            Retry this skill
          </button>
        )}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition-colors border border-slate-600"
        >
          Back to map
        </button>
      </div>
    </div>
  );
}
