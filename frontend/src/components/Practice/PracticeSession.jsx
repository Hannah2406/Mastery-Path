import { useState, useEffect, useRef, useCallback } from 'react';
import { createLog } from '../../api/logs';
import { getProblemsForNode } from '../../api/problems';
import { generateQuestions, generateSimilarQuestions, checkAnswer, getLiveFeedback } from '../../api/ai';
import FileUploadModal from './FileUploadModal';
import DrawingCanvas from './DrawingCanvas';

const errorTypes = [
  { code: 'EXECUTION', label: 'Execution error', description: 'Typo, off-by-one, syntax error' },
  { code: 'FORGOT', label: 'Forgot approach', description: 'Knew it before but forgot' },
  { code: 'CONCEPT', label: 'Concept gap', description: "Didn't understand the concept" },
];

export default function PracticeSession({ node, onComplete, onCancel }) {
  const [lastErrorType, setLastErrorType] = useState(null);
  const [lastQuestion, setLastQuestion] = useState(null);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedError, setSelectedError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [problems, setProblems] = useState([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [showSolution, setShowSolution] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
  // AI answer area: two modes
  const [aiMode, setAiMode] = useState('submit'); // 'learning' | 'submit'
  const [yourAnswer, setYourAnswer] = useState('');
  const [liveFeedback, setLiveFeedback] = useState('');
  const [liveFeedbackLoading, setLiveFeedbackLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState(null); // { correct, score, feedback }
  const [submittingCheck, setSubmittingCheck] = useState(false);
  const [generatingSimilar, setGeneratingSimilar] = useState(false);
  const [similarQuestionsAdded, setSimilarQuestionsAdded] = useState(0); // count added this "wrong" round
  const liveFeedbackTimeoutRef = useRef(null);

  // Normalize node: Skill Tree may pass React Flow node (id string, name/category in .data)
  const rawNode = node?.data ?? node;
  const nodeId = rawNode?.id != null ? Number(rawNode.id) : node?.id;
  const nodeName = rawNode?.name ?? node?.name ?? 'Practice';
  const nodeCategory = rawNode?.category ?? node?.category ?? '';
  const nodeDescription = rawNode?.description ?? node?.description;

  const problemsList = Array.isArray(problems) ? problems : [];
  const safeIndex = problemsList.length > 0 ? Math.min(currentProblemIndex, problemsList.length - 1) : 0;
  const currentProblem = problemsList[safeIndex] ?? null;
  const hasMultipleProblems = problemsList.length > 1;
  const difficultyNum = Math.min(5, Math.max(0, Number(currentProblem?.difficulty) || 1));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    if (nodeId == null) {
      setLoadingProblems(false);
      setError('No skill selected.');
      return;
    }
    setLoadingProblems(true);
    setError('');
    getProblemsForNode(nodeId)
      .then(probs => {
        setProblems(Array.isArray(probs) ? probs : []);
        setLoadingProblems(false);
      })
      .catch(err => {
        console.error('Failed to load problems:', err);
        console.error('Error details:', err.message);
        setError(`Failed to load problems: ${err.message}`);
        setProblems([]);
        setLoadingProblems(false);
      });
  }, [nodeId]);

  // Learning mode: debounced live feedback as user types
  const questionForAi = currentProblem?.problemText ?? '';
  useEffect(() => {
    if (aiMode !== 'learning' || !yourAnswer.trim()) {
      setLiveFeedback('');
      return;
    }
    if (liveFeedbackTimeoutRef.current) clearTimeout(liveFeedbackTimeoutRef.current);
    liveFeedbackTimeoutRef.current = setTimeout(() => {
      setLiveFeedbackLoading(true);
      getLiveFeedback(questionForAi, yourAnswer)
        .then((res) => setLiveFeedback(res.feedback || ''))
        .catch(() => setLiveFeedback('Could not get live feedback.'))
        .finally(() => setLiveFeedbackLoading(false));
    }, 800);
    return () => {
      if (liveFeedbackTimeoutRef.current) clearTimeout(liveFeedbackTimeoutRef.current);
    };
  }, [aiMode, yourAnswer, questionForAi]);

  const handleSubmitForCheck = useCallback(async () => {
    if (!yourAnswer.trim()) {
      setError('Enter an answer before submitting.');
      return;
    }
    setSubmittingCheck(true);
    setError('');
    setSubmitResult(null);
    setSimilarQuestionsAdded(0);
    try {
      const result = await checkAnswer(questionForAi, yourAnswer);
      setSubmitResult(result);
      if (result && result.correct === false) {
        setGeneratingSimilar(true);
        setError('');
        try {
          const similar = await generateSimilarQuestions(questionForAi, nodeName, 'CONCEPT');
          const list = similar?.questions;
          if (list && list.length > 0) {
            const newOnes = list.map(q => ({
              problemText: q.problemText ?? q.problem_text,
              solutionText: q.solutionText ?? q.solution_text ?? '',
              difficulty: q.difficulty ?? difficultyNum
            }));
            setProblems(prev => {
              const arr = Array.isArray(prev) ? prev : [];
              const before = arr.slice(0, currentProblemIndex + 1);
              const after = arr.slice(currentProblemIndex + 1);
              return [...before, ...newOnes, ...after];
            });
            setSimilarQuestionsAdded(newOnes.length);
          }
        } catch (e) {
          setError(e.message || 'Could not add similar questions. Try again in a minute.');
        } finally {
          setGeneratingSimilar(false);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to check answer');
    } finally {
      setSubmittingCheck(false);
    }
  }, [questionForAi, yourAnswer, nodeName, currentProblemIndex, difficultyNum]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSuccess = async () => {
    setSubmitting(true);
    setError('');
    try {
      const durationMs = Date.now() - startTime;
      const result = await createLog(nodeId, true, null, durationMs);
      
      // If there are more problems, move to next one
      if (currentProblemIndex < problemsList.length - 1) {
        setCurrentProblemIndex(currentProblemIndex + 1);
        setShowSolution(false);
        setSubmitting(false);
      } else {
        // All problems done
        onComplete(result, null, null);
      }
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const handleFailure = async () => {
    if (!selectedError) {
      setError('Please select a reason');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const durationMs = Date.now() - startTime;
      const result = await createLog(nodeId, false, selectedError, durationMs);
      
      // Store error info for similar question generation
      setLastErrorType(selectedError);
      setLastQuestion(currentProblem?.problemText || nodeName);
      
      // If there are more problems, move to next one
      if (currentProblemIndex < problemsList.length - 1) {
        setCurrentProblemIndex(currentProblemIndex + 1);
        setShowResult(false);
        setSelectedError(null);
        setShowSolution(false);
        setSubmitting(false);
      } else {
        // All problems done
        onComplete(result, selectedError, currentProblem?.problemText || nodeName);
      }
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  // Reset answer area when moving to next problem
  useEffect(() => {
    setYourAnswer('');
    setSubmitResult(null);
    setLiveFeedback('');
    setSimilarQuestionsAdded(0);
  }, [currentProblemIndex]);

  const tryNextSimilarQuestion = useCallback(() => {
    if (currentProblemIndex < problemsList.length - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1);
      setSubmitResult(null);
      setShowSolution(false);
    }
  }, [currentProblemIndex, problemsList.length]);

  if (!node || (nodeId == null && rawNode?.id == null)) {
    return (
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl shadow-2xl p-8 w-full max-w-2xl mx-auto text-center">
        <p className="text-slate-400 mb-4">No skill selected.</p>
        <button onClick={onCancel} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-medium">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl shadow-2xl p-8 w-full max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-xl mb-4">
          <span className="text-3xl">💻</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{nodeName}</h2>
        <p className="text-slate-400 font-medium">{nodeCategory}</p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-xl border border-slate-600">
          <span className="text-xl font-mono font-bold text-white">{formatTime(elapsed)}</span>
          <span className="text-sm text-slate-400">elapsed</span>
        </div>
      </div>
      {nodeDescription && (
        <div className="text-center mb-6">
          <p className="text-slate-300 text-lg leading-relaxed max-w-2xl mx-auto">{nodeDescription}</p>
        </div>
      )}
      
      {loadingProblems ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-600 border-t-indigo-500"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      ) : problemsList.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-slate-400 mb-4">Practice this skill and log your attempt below.</p>
          {(rawNode?.externalUrl ?? node?.externalUrl) && (rawNode?.status ?? node?.status) !== 'LOCKED' && (
            <a
              href={rawNode?.externalUrl ?? node?.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-medium transition-colors"
            >
              {((rawNode?.externalUrl ?? node?.externalUrl) || '').includes('leetcode.com') ? 'Open on LeetCode ↗' : 'Open link ↗'}
            </a>
          )}
        </div>
      ) : currentProblem ? (
        <div className="mb-8">
          {hasMultipleProblems && (
            <div className="text-center mb-4">
              <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                Problem {safeIndex + 1} of {problemsList.length}
              </span>
            </div>
          )}
          <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase">Difficulty: {'⭐'.repeat(difficultyNum)}</span>
            </div>
            <p className="text-lg text-slate-200 leading-relaxed whitespace-pre-wrap">{currentProblem?.problemText ?? ''}</p>
          </div>

          {/* Your answer + AI: two modes */}
          <div className="mb-6 p-4 bg-slate-800/60 rounded-xl border border-slate-600">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">Your answer</h4>
              <div className="flex rounded-lg border border-slate-600 overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setAiMode('learning'); setSubmitResult(null); }}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${aiMode === 'learning' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                >
                  Learning
                </button>
                <button
                  type="button"
                  onClick={() => { setAiMode('submit'); setLiveFeedback(''); }}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${aiMode === 'submit' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                >
                  Submit
                </button>
              </div>
            </div>
            <p className="text-slate-400 text-xs mb-2">
              {aiMode === 'learning' ? 'AI gives live hints and feedback as you type.' : 'No live feedback. AI checks only when you press Submit.'}
            </p>
            <textarea
              value={yourAnswer}
              onChange={(e) => setYourAnswer(e.target.value)}
              placeholder="Type your answer or solution here..."
              className="w-full h-32 px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
              aria-label="Your answer"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDrawingCanvas(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/80 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                ✏️ Draw your work
              </button>
              <button
                type="button"
                onClick={() => setShowFileUpload(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                📄 Upload image/PDF
              </button>
              <span className="text-slate-500 text-xs">Handwritten answers: draw or upload, then AI will mark it.</span>
            </div>
            {aiMode === 'learning' && (
              <div className="mt-3 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                <div className="text-amber-200/90 text-xs font-semibold uppercase mb-1">Live AI feedback</div>
                {liveFeedbackLoading ? (
                  <p className="text-slate-400 text-sm">Thinking...</p>
                ) : liveFeedback ? (
                  <p className="text-slate-200 text-sm whitespace-pre-wrap">{liveFeedback}</p>
                ) : (
                  <p className="text-slate-500 text-sm">Type above to get hints and feedback.</p>
                )}
              </div>
            )}
            {aiMode === 'submit' && (
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSubmitForCheck}
                  disabled={submittingCheck || !yourAnswer.trim()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm transition-colors"
                >
                  {submittingCheck ? 'Checking...' : 'Submit for AI check'}
                </button>
                {submitResult && (
                  <div className={`p-3 rounded-lg border text-sm ${submitResult.correct ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-200' : 'bg-slate-700/50 border-slate-500 text-slate-200'}`}>
                    <div className="font-semibold mb-1">
                      {submitResult.correct ? '✓ Correct' : 'Not quite'} — Score: {submitResult.score}%
                    </div>
                    <p className="whitespace-pre-wrap">{submitResult.feedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {showSolution && currentProblem?.solutionText && (
            <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600 mb-4">
              <h4 className="font-bold text-emerald-400 mb-2">Solution:</h4>
              <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{currentProblem.solutionText}</p>
            </div>
          )}
          {!showSolution && currentProblem?.solutionText && (
            <div className="text-center">
              <button onClick={() => setShowSolution(true)} className="px-6 py-2 bg-slate-700 text-slate-200 rounded-xl hover:bg-slate-600 font-medium transition-colors">Show Solution</button>
            </div>
          )}
          <div className="text-center mt-4">
            <p className="text-slate-500 text-xs mb-2">Extra practice (optional)</p>
            <button
              onClick={async () => {
                setGeneratingQuestions(true);
                setError('');
                try {
                    const result = await generateQuestions(nodeName, 'intermediate', 3);
                  const list = result?.questions;
                  if (list && list.length > 0) {
                    const newProblems = list.map(q => ({
                      problemText: q.problemText ?? q.problem_text,
                      solutionText: q.solutionText ?? q.solution_text ?? '',
                      difficulty: q.difficulty ?? 2
                    }));
                    setProblems(prev => (Array.isArray(prev) ? prev : []).concat(newProblems));
                  } else {
                    setError('No new questions were generated. Try again in a minute (rate limit).');
                  }
                } catch (err) {
                  setError(err.message || 'Failed to generate questions');
                } finally {
                  setGeneratingQuestions(false);
                }
              }}
              disabled={generatingQuestions}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors text-sm"
            >
              {generatingQuestions ? 'Generating...' : '✨ Generate More Questions'}
            </button>
          </div>
          
          {/* Show external link only when skill is unlocked */}
          {(rawNode?.externalUrl ?? node?.externalUrl) && (rawNode?.status ?? node?.status) !== 'LOCKED' && (
            <div className="text-center mt-4">
              <a
                href={rawNode?.externalUrl ?? node?.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all font-semibold text-sm"
              >
                <span>🔗</span>
                {((rawNode?.externalUrl ?? node?.externalUrl) || '').includes('leetcode.com') ? 'Open on LeetCode' : 'Open link'}
                <span className="text-lg">↗</span>
              </a>
            </div>
          )}
        </div>
      ) : null}
      <div className="border-t border-slate-700 pt-8">
        {(currentProblem || problemsList.length === 0) && !showResult ? (
          <div className="text-center">
            {/* Only allow moving on when they got it right (AI check correct). Fail does not advance. */}
            {submitResult?.correct === true ? (
              <>
                <h3 className="text-xl font-bold text-white mb-6">Correct! Move on when ready.</h3>
                <button
                  onClick={handleSuccess}
                  disabled={submitting}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-50 font-semibold transition-colors"
                >
                  ✓ Move to next
                </button>
                {hasMultipleProblems && currentProblemIndex < problemsList.length - 1 && (
                  <p className="mt-4 text-sm text-slate-400">
                    {problemsList.length - currentProblemIndex - 1} more problem{problemsList.length - currentProblemIndex - 1 !== 1 ? 's' : ''} remaining
                  </p>
                )}
              </>
            ) : submitResult?.correct === false ? (
              <>
                <h3 className="text-xl font-bold text-white mb-2">Get one right to move on</h3>
                <p className="text-slate-400 mb-4 text-sm">
                  {generatingSimilar ? 'Adding similar questions...' : similarQuestionsAdded > 0
                    ? `We added ${similarQuestionsAdded} similar question${similarQuestionsAdded !== 1 ? 's' : ''}. Try again below or try the next one.`
                    : 'Try again with a different answer, or try the next similar question.'}
                </p>
                <button
                  type="button"
                  onClick={tryNextSimilarQuestion}
                  disabled={generatingSimilar || currentProblemIndex >= problemsList.length - 1}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
                >
                  Try next (similar) question
                </button>
              </>
            ) : (
              <p className="text-slate-400 text-sm">Submit your answer above for AI check. You can move on when you get it right.</p>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-6 text-center">What went wrong?</h3>
            <div className="space-y-3 mb-6">
              {errorTypes.map((err) => (
                <label
                  key={err.code}
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedError === err.code
                      ? 'border-red-500 bg-red-900/30'
                      : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
                  }`}
                >
                  <input type="radio" name="errorType" value={err.code} checked={selectedError === err.code} onChange={() => setSelectedError(err.code)} className="mt-1 w-5 h-5" />
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">{err.label}</div>
                    <div className="text-sm text-slate-400">{err.description}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={() => { setShowResult(false); setSelectedError(null); }} className="flex-1 py-3 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700 font-medium transition-colors">Back</button>
              <button onClick={handleFailure} disabled={submitting || !selectedError} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-50 font-semibold transition-colors">Log Attempt</button>
            </div>
            <p className="mt-4 text-center text-slate-500 text-sm">You must log your attempt to track progress.</p>
          </div>
        )}
        {error && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-500/50 text-red-200 rounded-lg text-sm max-w-2xl mx-auto">
            {error}
          </div>
        )}
        {!showResult && (
          <div className="text-center mt-6">
            <button onClick={onCancel} className="text-slate-400 hover:text-white text-sm font-medium">Cancel Practice</button>
          </div>
        )}
      </div>
      {showFileUpload && (
        <FileUploadModal
          onClose={() => setShowFileUpload(false)}
          onTextExtracted={(text) => {
            console.log('Extracted text:', text);
            setShowFileUpload(false);
          }}
        />
      )}
      {showDrawingCanvas && (
        <DrawingCanvas
          question={currentProblem?.problemText ?? ''}
          onClose={() => setShowDrawingCanvas(false)}
          onMarked={(result) => {
            console.log('AI Marking Result:', result);
            // Could use the score/feedback here
          }}
        />
      )}
    </div>
  );
}
