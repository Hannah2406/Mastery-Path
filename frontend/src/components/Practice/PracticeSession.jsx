import { useState, useEffect, useRef, useCallback } from 'react';
import { createLog } from '../../api/logs';
import { getProblemsForNode } from '../../api/problems';
import { getNodeLogs } from '../../api/history';
import { generateQuestions, generateSimilarQuestions, generateHomeworkPdf, checkAnswer, getLiveFeedback, checkCode } from '../../api/ai';
import FileUploadModal from './FileUploadModal';
import DrawingCanvas from './DrawingCanvas';
import CodeEditor from './CodeEditor';

const errorTypes = [
  { code: 'EXECUTION', label: 'Execution error', description: 'Typo, off-by-one, syntax error' },
  { code: 'FORGOT', label: 'Forgot approach', description: 'Knew it before but forgot' },
  { code: 'CONCEPT', label: 'Concept gap', description: "Didn't understand the concept" },
];

const AMC8_CACHE_KEY_PREFIX = 'amc8_questions_';
const AMC8_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getCachedAmc8Questions(pathName, nodeId) {
  try {
    const key = `${AMC8_CACHE_KEY_PREFIX}${pathName}_${nodeId}`;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { at, problems } = JSON.parse(raw);
    if (Date.now() - at > AMC8_CACHE_TTL_MS || !Array.isArray(problems)) return null;
    return problems;
  } catch {
    return null;
  }
}

function setCachedAmc8Questions(pathName, nodeId, problems) {
  try {
    const key = `${AMC8_CACHE_KEY_PREFIX}${pathName}_${nodeId}`;
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), problems }));
  } catch {
    /* ignore */
  }
}

function getCodeEditorTemplate(lang) {
  if (lang === 'java') {
    return `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
    }
}`;
  }
  if (lang === 'javascript') {
    return `var twoSum = function(nums, target) {
    // Your code here
};`;
  }
  return `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Your code here
`;
}

export default function PracticeSession({ node, pathName, onComplete, onCancel }) {
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
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generateDifficulty, setGenerateDifficulty] = useState('intermediate');
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
  const [similarExample, setSimilarExample] = useState(null); // { problemText, solutionText } for learning hint
  const [showExampleSolution, setShowExampleSolution] = useState(false);
  const [loadingExample, setLoadingExample] = useState(false);
  const liveFeedbackTimeoutRef = useRef(null);
  // Coding (LeetCode-style) mode
  const [codeEditorValue, setCodeEditorValue] = useState(() => getCodeEditorTemplate('python'));
  const [codeLanguage, setCodeLanguage] = useState('python');
  const [codeCheckResult, setCodeCheckResult] = useState(null);
  const [codeCheckLoading, setCodeCheckLoading] = useState(false);

  // Normalize node: Skill Tree may pass React Flow node (id string, name/category in .data)
  const rawNode = node?.data ?? node;
  const nodeId = rawNode?.id != null ? Number(rawNode.id) : node?.id;
  const nodeName = rawNode?.name ?? node?.name ?? 'Practice';
  const nodeCategory = rawNode?.category ?? node?.category ?? '';
  const nodeDescription = rawNode?.description ?? node?.description;
  const externalUrl = rawNode?.externalUrl ?? node?.externalUrl ?? '';
  const isCodingNode = externalUrl.toLowerCase().includes('leetcode');

  const problemsList = Array.isArray(problems) ? problems : [];
  const safeIndex = problemsList.length > 0 ? Math.min(currentProblemIndex, problemsList.length - 1) : 0;
  const currentProblem = problemsList[safeIndex] ?? null;
  const hasMultipleProblems = problemsList.length > 1;
  const difficultyNum = Math.min(5, Math.max(0, Number(currentProblem?.difficulty) || 1));
  const codingPassedAll = isCodingNode && codeCheckResult && codeCheckResult.total > 0 && codeCheckResult.passed === codeCheckResult.total;
  const runnerFailedAll =
    isCodingNode && codeCheckResult?.results?.length > 0 && codeCheckResult.passed === 0 &&
    codeCheckResult.results.every((r) => r?.error && (r.error.includes('unavailable') || r.error.includes('execution service') || r.error.includes('Piston') || r.error.includes('401') || r.error.includes('temporarily')));
  const canAdvance = submitResult?.correct === true || codingPassedAll || (runnerFailedAll && codeCheckResult?.aiFeedback);
  const showTryAgain = submitResult?.correct === false || (isCodingNode && codeCheckResult && codeCheckResult.failed > 0);

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
    const isAMC8 = pathName && /AMC\s*8/i.test(String(pathName).trim());
    if (isAMC8) {
      // Use cached questions for this node to avoid repeated AI calls (30 min TTL)
      const cached = getCachedAmc8Questions(pathName, nodeId);
      if (cached && cached.length > 0) {
        setProblems(cached);
        setCurrentProblemIndex(0);
        setError('');
        setLoadingProblems(false);
        return;
      }
      // AMC8 path: try AI first; if it fails, fall back to DB so user isn't stuck
      function tryDbFallback(aiErrorMsg) {
        getProblemsForNode(nodeId)
          .then((probs) => {
            const list = Array.isArray(probs) ? probs : [];
            if (list.length > 0) {
              setProblems(list);
              setCurrentProblemIndex(0);
              setError('AI wasn\'t available; showing practice questions from the library. You can also use "Generate homework PDF" below.');
            } else {
              setProblems([]);
              setError(aiErrorMsg + ' Add GEMINI_API_KEY or OPENAI_API_KEY to .env and restart the backend, or use "Generate homework PDF" to get questions.');
            }
          })
          .catch(() => {
            setProblems([]);
            setError(aiErrorMsg + ' Add GEMINI_API_KEY or OPENAI_API_KEY to .env and restart the backend, or use "Generate homework PDF".');
          })
          .finally(() => setLoadingProblems(false));
      }

      generateQuestions(nodeName, 'hard', 5, pathName)
        .then((res) => {
          const list = res?.questions ?? [];
          const mapped = list.map((q) => ({
            problemText: q.problemText ?? q.problem_text,
            solutionText: q.solutionText ?? q.solution_text ?? '',
            difficulty: q.difficulty ?? 4,
          }));
          if (mapped.length > 0) {
            setProblems(mapped);
            setCurrentProblemIndex(0);
            setError('');
            setCachedAmc8Questions(pathName, nodeId, mapped);
            setLoadingProblems(false);
          } else {
            tryDbFallback('No AMC8 questions generated.');
          }
        })
        .catch((err) => {
          console.error('AMC8 question load failed:', err);
          setError(err?.message || 'AI could not generate questions.');
          tryDbFallback(err?.message || 'AI could not generate questions.');
        });
      return;
    }
    Promise.all([getProblemsForNode(nodeId), getNodeLogs(nodeId).catch(() => [])])
      .then(([probs, logs]) => {
        const list = Array.isArray(probs) ? probs : [];
        setProblems(list);
        const successCount = Array.isArray(logs) ? logs.filter((l) => l.success).length : 0;
        const startIndex = list.length === 0 ? 0 : Math.min(successCount, list.length - 1);
        setCurrentProblemIndex(startIndex);
        setLoadingProblems(false);
      })
      .catch(err => {
        console.error('Failed to load problems:', err);
        setError(`Failed to load problems: ${err.message}`);
        setProblems([]);
        setLoadingProblems(false);
      });
  }, [nodeId, pathName, nodeName]);

  // Reset code editor to template when problem changes (coding nodes)
  useEffect(() => {
    if (isCodingNode) {
      setCodeEditorValue(getCodeEditorTemplate(codeLanguage));
      setCodeCheckResult(null);
    }
  }, [isCodingNode, currentProblem?.problemText]);

  // Learning mode: debounced live feedback (min length + longer debounce to reduce AI calls)
  const questionForAi = currentProblem?.problemText ?? '';
  useEffect(() => {
    if (aiMode !== 'learning' || !yourAnswer.trim()) {
      setLiveFeedback('');
      return;
    }
    if (yourAnswer.trim().length < 15) {
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
    }, 1800);
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
    setSimilarExample(null);
    setShowExampleSolution(false);
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
        <p className="text-slate-400 mb-4 text-lg font-semibold">No skill selected.</p>
        <button onClick={onCancel} className="px-5 py-2.5 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-bold text-base">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-2xl mx-auto animate-fade-in overflow-x-hidden">
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 bg-indigo-600 rounded-xl mb-4">
          <span className="text-3xl sm:text-4xl">💻</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">{nodeName}</h2>
        <p className="text-slate-400 text-base sm:text-lg font-semibold">{nodeCategory}</p>
        <div className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-700 rounded-xl border border-slate-600">
          <span className="text-2xl font-mono font-bold text-white">{formatTime(elapsed)}</span>
          <span className="text-base text-slate-400 font-medium">elapsed</span>
        </div>
      </div>
      {nodeDescription && (
        <div className="text-center mb-6">
          <p className="text-slate-300 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto font-medium">{nodeDescription}</p>
        </div>
      )}
      
      {loadingProblems ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-slate-600 border-t-indigo-500"></div>
          <p className="mt-4 text-slate-400 text-lg font-semibold">Loading...</p>
        </div>
      ) : problemsList.length === 0 && !isCodingNode ? (
        <div className="text-center py-6 space-y-4">
          <p className="text-slate-400 text-base sm:text-lg font-medium">No practice questions yet. Generate a homework PDF for this topic, or open the external link below.</p>
          <p className="text-slate-500 text-sm">PDF uses AI — add GEMINI_API_KEY or OPENAI_API_KEY to <code className="bg-slate-700 px-1 rounded">.env</code> and restart the backend if the button fails.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={async () => {
                setGeneratingPdf(true);
                setError('');
                try {
                  const blob = await generateHomeworkPdf(nodeName, generateDifficulty, 5, pathName);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `homework-${nodeName.replace(/\s+/g, '-')}.pdf`;
                  a.style.display = 'none';
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }, 200);
                } catch (e) {
                  setError(e.message || 'Failed to generate PDF');
                } finally {
                  setGeneratingPdf(false);
                }
              }}
              disabled={generatingPdf}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white rounded-xl font-bold text-base transition-colors"
            >
              {generatingPdf ? 'Generating PDF...' : '📄 Generate homework PDF'}
            </button>
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
          <div className="flex justify-center gap-2 pt-2">
            <span className="text-slate-500 text-sm font-medium">PDF difficulty:</span>
            {['easy', 'intermediate', 'hard'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setGenerateDifficulty(d)}
                className={`px-3 py-1 rounded-lg text-sm font-bold capitalize ${generateDifficulty === d ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      ) : isCodingNode && problemsList.length === 0 ? (
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <button
              type="button"
              onClick={async () => {
                setGeneratingPdf(true);
                setError('');
                try {
                  const blob = await generateHomeworkPdf(nodeName, generateDifficulty, 5, pathName);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `homework-${nodeName.replace(/\s+/g, '-')}.pdf`;
                  a.style.display = 'none';
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }, 200);
                } catch (e) {
                  setError(e.message || 'Failed to generate PDF');
                } finally {
                  setGeneratingPdf(false);
                }
              }}
              disabled={generatingPdf}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white rounded-xl font-bold text-sm transition-colors"
            >
              {generatingPdf ? 'Generating...' : '📄 Generate homework PDF'}
            </button>
          </div>
          <div className="bg-slate-700/50 rounded-xl p-6 sm:p-7 border border-slate-600 mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{nodeName}</h3>
            <p className="text-slate-200 leading-relaxed font-medium">{nodeDescription || 'Solve this coding problem. Write your solution below and run tests.'}</p>
            {nodeName && nodeName.toLowerCase().includes('two sum') && (
              <p className="text-amber-400/90 text-xs mt-2 font-medium">
                Tip: return the <strong>indices</strong> of the two numbers (e.g. <code>i</code>, <code>j</code>), not the values (<code>nums[i]</code>, <code>nums[j]</code>).
              </p>
            )}
          </div>
          <div className="mb-6 p-5 bg-slate-800/60 rounded-xl border border-slate-600">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white text-lg font-bold">Code editor</h4>
              <select
                value={codeLanguage}
                onChange={(e) => {
                  const lang = e.target.value;
                  setCodeLanguage(lang);
                  setCodeEditorValue(getCodeEditorTemplate(lang));
                }}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-base font-semibold"
              >
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
            <CodeEditor
              value={codeEditorValue}
              onChange={setCodeEditorValue}
              placeholder="Type your solution here..."
              className="w-full h-64 px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y font-mono text-sm leading-relaxed"
              aria-label="Code editor"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  setCodeCheckLoading(true);
                  setError('');
                  setCodeCheckResult(null);
                  try {
                    const problemStmt = `${nodeName}: ${nodeDescription || ''}`.trim();
                    const res = await checkCode(problemStmt, codeEditorValue, codeLanguage, null);
                    setCodeCheckResult(res);
                  } catch (e) {
                    setError(e.message || 'Failed to run tests');
                  } finally {
                    setCodeCheckLoading(false);
                  }
                }}
                disabled={codeCheckLoading || !codeEditorValue.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
              >
                {codeCheckLoading ? 'Running tests...' : 'Run tests'}
              </button>
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600/90 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Open on LeetCode ↗
              </a>
            </div>
            {codeCheckResult != null && (
              <div className="mt-4 space-y-2">
                <div className={`text-base sm:text-lg font-bold ${codeCheckResult.passed === codeCheckResult.total ? 'text-emerald-400' : 'text-amber-400'}`}>
                  Tests: {codeCheckResult.passed}/{codeCheckResult.total} passed
                </div>
                {codeCheckResult.passed === 0 && codeCheckResult.results?.length > 0 && codeCheckResult.results.some(r => r.error && (r.error.includes('401') || r.error.includes('Unauthorized') || r.error.includes('execution service') || r.error.includes('unavailable'))) && (
                  <p className="text-slate-300 text-sm font-medium">
                    Tests couldn&apos;t run (runner service error). Your solution may still be correct — check AI feedback below.
                  </p>
                )}
                {codeCheckResult.results?.length > 0 && (
                  <ul className="space-y-2">
                    {codeCheckResult.results.map((r, i) => (
                      <li key={i} className={`p-3 rounded-lg border text-sm font-mono ${r.passed ? 'bg-slate-700/50 border-slate-600 text-slate-300' : 'bg-amber-900/20 border-amber-500/50 text-amber-200'}`}>
                        <span className="font-bold">Test {r.index}:</span> {r.passed ? 'Passed' : 'Failed'}
                        {!r.passed && (
                          <>
                            {r.expectedOutput != null && <div>Expected: {String(r.expectedOutput).trim() || '(empty)'}</div>}
                            {r.actualOutput != null && <div>Got: {String(r.actualOutput).trim() || '(empty)'}</div>}
                            {r.error && <div className="text-red-300">Error: {r.error}</div>}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {codeCheckResult.aiFeedback && (
                  <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg text-slate-200 text-base font-medium whitespace-pre-wrap">
                    {codeCheckResult.aiFeedback}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : currentProblem ? (
        <div className="mb-8">
          {(hasMultipleProblems || problemsList.length >= 1) && (
            <div className="text-center mb-4 flex flex-wrap items-center justify-center gap-2">
              {hasMultipleProblems && (
                <span className="px-5 py-2.5 bg-indigo-100 text-indigo-700 rounded-full text-base font-bold">
                  Problem {safeIndex + 1} of {problemsList.length}
                </span>
              )}
              <button
                type="button"
                onClick={async () => {
                  setGeneratingPdf(true);
                  setError('');
                  try {
                    const blob = await generateHomeworkPdf(nodeName, generateDifficulty, 5, pathName);
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `homework-${nodeName.replace(/\s+/g, '-')}.pdf`;
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }, 200);
                  } catch (e) {
                    setError(e.message || 'Failed to generate PDF');
                  } finally {
                    setGeneratingPdf(false);
                  }
                }}
                disabled={generatingPdf}
                className="text-sm font-bold text-emerald-400 hover:text-emerald-300 disabled:text-slate-500"
              >
                {generatingPdf ? 'Generating PDF...' : '📄 Generate homework PDF'}
              </button>
            </div>
          )}
          <div className="bg-slate-700/50 rounded-xl p-6 sm:p-7 border border-slate-600 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wide">Difficulty: {'⭐'.repeat(difficultyNum)}</span>
            </div>
            <p className="text-lg sm:text-xl text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">{currentProblem?.problemText ?? ''}</p>
          </div>

          {/* Your answer: code editor for LeetCode-style nodes, else text + AI */}
          {isCodingNode ? (
            <div className="mb-6 p-5 bg-slate-800/60 rounded-xl border border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white text-lg font-bold">Your solution</h4>
                <select
                  value={codeLanguage}
                  onChange={(e) => {
                    const lang = e.target.value;
                    setCodeLanguage(lang);
                    setCodeEditorValue(getCodeEditorTemplate(lang));
                  }}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-base font-semibold"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                </select>
              </div>
              <p className="text-slate-400 text-sm mb-2 font-medium">
                Write a class/function with the given parameters and return value (LeetCode style). Run tests to check against AI-generated test cases.
              </p>
              {nodeName && nodeName.toLowerCase().includes('two sum') && (
                <p className="text-amber-400/90 text-xs mb-2 font-medium">
                  Tip: return the <strong>indices</strong> of the two numbers (e.g. <code>i</code>, <code>j</code>), not the values (<code>nums[i]</code>, <code>nums[j]</code>).
                </p>
              )}
              <CodeEditor
                value={codeEditorValue}
                onChange={setCodeEditorValue}
                placeholder="Type your solution here..."
                className="w-full min-h-[280px] px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y font-mono text-sm leading-relaxed"
                aria-label="Code editor"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setCodeCheckLoading(true);
                    setError('');
                    setCodeCheckResult(null);
                    try {
                      const res = await checkCode(
                        currentProblem?.problemText ?? '',
                        codeEditorValue,
                        codeLanguage,
                        null
                      );
                      setCodeCheckResult(res);
                    } catch (e) {
                      setError(e.message || 'Failed to run tests');
                    } finally {
                      setCodeCheckLoading(false);
                    }
                  }}
                  disabled={codeCheckLoading || !codeEditorValue.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
                >
                  {codeCheckLoading ? 'Running tests...' : 'Run tests'}
                </button>
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600/90 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Open on LeetCode ↗
                </a>
              </div>
              {codeCheckResult != null && (
                <div className="mt-4 space-y-2">
                  <div className={`text-base sm:text-lg font-bold ${codeCheckResult.passed === codeCheckResult.total ? 'text-emerald-400' : 'text-amber-400'}`}>
                    Tests: {codeCheckResult.passed}/{codeCheckResult.total} passed
                  </div>
                  {codeCheckResult.passed === 0 && codeCheckResult.results?.length > 0 && codeCheckResult.results.some(r => r.error && (r.error.includes('401') || r.error.includes('Unauthorized') || r.error.includes('execution service') || r.error.includes('unavailable'))) && (
                    <p className="text-slate-300 text-sm font-medium">
                      Tests couldn&apos;t run (runner service error). Your solution may still be correct — check AI feedback below.
                    </p>
                  )}
                  {codeCheckResult.results?.length > 0 && (
                    <ul className="space-y-2">
                      {codeCheckResult.results.map((r, i) => (
                        <li key={i} className={`p-3 rounded-lg border text-sm font-mono ${r.passed ? 'bg-slate-700/50 border-slate-600 text-slate-300' : 'bg-amber-900/20 border-amber-500/50 text-amber-200'}`}>
                          <span className="font-bold">Test {r.index}:</span> {r.passed ? 'Passed' : 'Failed'}
                          {!r.passed && (
                            <>
                              {r.expectedOutput != null && <div>Expected: {String(r.expectedOutput).trim() || '(empty)'}</div>}
                              {r.actualOutput != null && <div>Got: {String(r.actualOutput).trim() || '(empty)'}</div>}
                              {r.error && <div className="text-red-300">Error: {r.error}</div>}
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {codeCheckResult.aiFeedback && (
                    <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg text-slate-200 text-base font-medium whitespace-pre-wrap">
                      {codeCheckResult.aiFeedback}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6 p-5 bg-slate-800/60 rounded-xl border border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white text-lg font-bold">Your answer</h4>
                <div className="flex rounded-lg border border-slate-600 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { setAiMode('learning'); setSubmitResult(null); }}
                    className={`px-5 py-2.5 text-base font-bold transition-colors ${aiMode === 'learning' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                  >
                    Learning
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAiMode('submit'); setLiveFeedback(''); }}
                    className={`px-5 py-2.5 text-base font-bold transition-colors ${aiMode === 'submit' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                  >
                    Submit
                  </button>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-2 font-medium">
                {aiMode === 'learning' ? 'AI gives live hints and feedback as you type.' : 'No live feedback. AI checks only when you press Submit.'}
              </p>
              <textarea
                value={yourAnswer}
                onChange={(e) => setYourAnswer(e.target.value)}
                placeholder="Type your answer or solution here..."
                className="w-full h-36 px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y text-base font-medium"
                aria-label="Your answer"
              />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDrawingCanvas(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600/80 hover:bg-purple-500 text-white rounded-lg text-base font-bold transition-colors"
              >
                ✏️ Draw your work
              </button>
              <button
                type="button"
                onClick={() => setShowFileUpload(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-lg text-base font-bold transition-colors"
              >
                📄 Upload to mark
              </button>
              <span className="text-slate-500 text-sm font-medium">Upload your work to get AI feedback, or extract text.</span>
            </div>
            {aiMode === 'learning' && (
              <div className="mt-3 p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                <div className="text-amber-200/90 text-sm font-bold uppercase tracking-wide mb-1">Live AI feedback</div>
                {liveFeedbackLoading ? (
                  <p className="text-slate-400 text-base font-medium">Thinking...</p>
                ) : liveFeedback ? (
                  <p className="text-slate-200 text-base font-medium whitespace-pre-wrap">{liveFeedback}</p>
                ) : (
                  <p className="text-slate-500 text-base font-medium">Type above to get hints and feedback.</p>
                )}
              </div>
            )}
            {/* Hints / similar example - learning aid in both modes */}
            <div className="mt-3">
              {!similarExample ? (
                <button
                  type="button"
                  onClick={async () => {
                    setLoadingExample(true);
                    setError('');
                    try {
                      const res = await generateSimilarQuestions(questionForAi || nodeName, nodeName, 'CONCEPT');
                      const first = res?.questions?.[0];
                      if (first) {
                        setSimilarExample({
                          problemText: first.problemText ?? first.problem_text,
                          solutionText: first.solutionText ?? first.solution_text ?? '',
                        });
                        setShowExampleSolution(false);
                      } else {
                        setError('Could not load an example. Try again in a minute.');
                      }
                    } catch (e) {
                      setError(e.message || 'Could not load similar example');
                    } finally {
                      setLoadingExample(false);
                    }
                  }}
                  disabled={loadingExample || !questionForAi}
                  className="text-base font-bold text-indigo-400 hover:text-indigo-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  {loadingExample ? 'Loading...' : '💡 Show a similar example (hint)'}
                </button>
              ) : (
                <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
                  <div className="text-slate-300 text-sm font-bold uppercase tracking-wide mb-2">Similar example</div>
                  <p className="text-slate-200 text-base font-medium mb-2 whitespace-pre-wrap">{similarExample.problemText}</p>
                  {similarExample.solutionText ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowExampleSolution((v) => !v)}
                        className="text-sm font-bold text-indigo-400 hover:text-indigo-300"
                      >
                        {showExampleSolution ? 'Hide solution' : 'Reveal solution'}
                      </button>
                      {showExampleSolution && (
                        <p className="mt-2 text-emerald-200/90 text-base font-medium whitespace-pre-wrap border-t border-slate-600 pt-2">{similarExample.solutionText}</p>
                      )}
                    </>
                  ) : null}
                </div>
              )}
            </div>
            {aiMode === 'submit' && (
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSubmitForCheck}
                  disabled={submittingCheck || !yourAnswer.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-bold text-base transition-colors"
                >
                  {submittingCheck ? 'Checking...' : 'Submit for AI check'}
                </button>
                {submitResult && (
                  <div className={`p-4 rounded-lg border text-base ${submitResult.correct ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-200' : 'bg-slate-700/50 border-slate-500 text-slate-200'}`}>
                    <div className="font-bold mb-1 text-lg">
                      {submitResult.correct ? '✓ Correct' : 'Not quite'} — Score: {submitResult.score}%
                    </div>
                    <p className="whitespace-pre-wrap font-medium">{submitResult.feedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {showSolution && currentProblem?.solutionText && (
            <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600 mb-4">
              <h4 className="font-extrabold text-emerald-400 mb-2 text-lg">Solution:</h4>
              <p className="text-slate-200 text-base sm:text-lg leading-relaxed whitespace-pre-wrap font-medium">{currentProblem.solutionText}</p>
            </div>
          )}
          {!showSolution && currentProblem?.solutionText && (
            <div className="text-center">
              <button onClick={() => setShowSolution(true)} className="px-6 py-3 bg-slate-700 text-slate-200 rounded-xl hover:bg-slate-600 font-bold text-base transition-colors">Show Solution</button>
            </div>
          )}
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
            {/* Only allow moving on when they got it right (AI check or all tests passed for coding). */}
            {canAdvance ? (
              <>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 tracking-tight">
                  {runnerFailedAll ? 'Tests couldn\'t run, but AI reviewed your code and it looks correct. Move on when ready.' : 'Correct! Move on when ready.'}
                </h3>
                <button
                  onClick={handleSuccess}
                  disabled={submitting}
                  className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-50 font-bold text-lg transition-colors"
                >
                  ✓ Move to next
                </button>
                {hasMultipleProblems && currentProblemIndex < problemsList.length - 1 && (
                  <p className="mt-4 text-base font-semibold text-slate-400">
                    {problemsList.length - currentProblemIndex - 1} more problem{problemsList.length - currentProblemIndex - 1 !== 1 ? 's' : ''} remaining
                  </p>
                )}
              </>
            ) : showTryAgain ? (
              <>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">Get one right to move on</h3>
                <p className="text-slate-400 mb-4 text-base font-medium">
                  {generatingSimilar ? 'Adding similar questions...' : similarQuestionsAdded > 0
                    ? `We added ${similarQuestionsAdded} similar question${similarQuestionsAdded !== 1 ? 's' : ''}. Try again below or try the next one.`
                    : 'Try again with a different answer, or try the next similar question.'}
                </p>
                <button
                  type="button"
                  onClick={tryNextSimilarQuestion}
                  disabled={generatingSimilar || currentProblemIndex >= problemsList.length - 1}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-bold text-base transition-colors"
                >
                  Try next (similar) question
                </button>
              </>
            ) : (
              <p className="text-slate-400 text-base font-semibold">
                {isCodingNode ? 'Run tests above. You can move on when all tests pass.' : 'Submit your answer above for AI check. You can move on when you get it right.'}
              </p>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 text-center tracking-tight">What went wrong?</h3>
            <div className="space-y-3 mb-6">
              {errorTypes.map((err) => (
                <label
                  key={err.code}
                  className={`flex items-start gap-4 p-5 rounded-xl border cursor-pointer transition-all ${
                    selectedError === err.code
                      ? 'border-red-500 bg-red-900/30'
                      : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
                  }`}
                >
                  <input type="radio" name="errorType" value={err.code} checked={selectedError === err.code} onChange={() => setSelectedError(err.code)} className="mt-1.5 w-5 h-5" />
                  <div className="flex-1">
                    <div className="font-bold text-white mb-1 text-lg">{err.label}</div>
                    <div className="text-base text-slate-400 font-medium">{err.description}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={() => { setShowResult(false); setSelectedError(null); }} className="flex-1 py-3 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700 font-bold text-base transition-colors">Back</button>
              <button onClick={handleFailure} disabled={submitting || !selectedError} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-50 font-bold text-base transition-colors">Log Attempt</button>
            </div>
            <p className="mt-4 text-center text-slate-500 text-base font-semibold">You must log your attempt to track progress.</p>
          </div>
        )}
        {error && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-500/50 text-red-200 rounded-lg text-base font-semibold max-w-2xl mx-auto">
            {error}
          </div>
        )}
        {!showResult && (
          <div className="text-center mt-6">
            <button onClick={onCancel} className="text-slate-400 hover:text-white text-base font-bold">Cancel Practice</button>
          </div>
        )}
      </div>
      {showFileUpload && (
        <FileUploadModal
          question={currentProblem?.problemText ?? ''}
          defaultTopic={nodeName}
          initialMode="mark"
          showGetHomeworkTab={true}
          onClose={() => setShowFileUpload(false)}
          onTextExtracted={(text) => {
            if (text) setYourAnswer((prev) => (prev ? prev + '\n' + text : text));
            setShowFileUpload(false);
          }}
          onAddQuestions={(questions) => {
            if (Array.isArray(questions) && questions.length > 0) {
              setProblems((prev) => (Array.isArray(prev) ? prev : []).concat(questions));
              setShowFileUpload(false);
            }
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
