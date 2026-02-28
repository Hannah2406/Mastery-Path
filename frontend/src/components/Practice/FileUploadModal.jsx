import { useState } from 'react';
import { extractTextFromFile, extractTextToPdf, markHomework, generateQuestions } from '../../api/ai';

export default function FileUploadModal({ onClose, onTextExtracted, onAddQuestions, question = '', defaultTopic = '', initialMode = 'get', showGetHomeworkTab = true }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState(showGetHomeworkTab ? initialMode : (initialMode === 'get' ? 'mark' : initialMode)); // 'get' | 'mark' | 'extract'
  const [extractedText, setExtractedText] = useState('');
  const [extractPdfBlob, setExtractPdfBlob] = useState(null); // Blob for problems-only PDF download
  const [markResult, setMarkResult] = useState(null); // { score, feedback, extractedText }
  // Get homework for topic
  const [topic, setTopic] = useState(defaultTopic || '');
  const [topicDifficulty, setTopicDifficulty] = useState('intermediate');
  const [generatedQuestions, setGeneratedQuestions] = useState([]); // [{ problemText, solutionText, difficulty }]
  const [revealedSolution, setRevealedSolution] = useState({}); // { index: true } for which solution is shown

  const resetState = () => {
    setError('');
    setMarkResult(null);
    setExtractedText('');
    setExtractPdfBlob(null);
    setGeneratedQuestions([]);
    setRevealedSolution({});
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        setError('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      setError('');
      setMarkResult(null);
      setExtractedText('');
      setExtractPdfBlob(null);
    }
  };

  const handleGenerateHomework = async () => {
    const t = topic.trim();
    if (!t) {
      setError('Enter a topic (e.g. Algebra, Fractions, Quadratic Equations)');
      return;
    }
    setUploading(true);
    setError('');
    setGeneratedQuestions([]);
    try {
      const result = await generateQuestions(t, topicDifficulty, 5);
      const list = result?.questions ?? [];
      const mapped = list.map((q) => ({
        problemText: q.problemText ?? q.problem_text,
        solutionText: q.solutionText ?? q.solution_text ?? '',
        difficulty: q.difficulty ?? 2,
      }));
      setGeneratedQuestions(mapped);
      if (mapped.length === 0) {
        setError('No questions were generated. Add GEMINI_API_KEY or OPENAI_API_KEY to your .env file and restart the backend, then try again. Free key: https://aistudio.google.com/app/apikey');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate homework');
    } finally {
      setUploading(false);
    }
  };

  const handleAddToPractice = () => {
    if (generatedQuestions.length > 0 && onAddQuestions) {
      onAddQuestions(generatedQuestions);
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }
    setUploading(true);
    setError('');
    setMarkResult(null);
    setExtractedText('');
    try {
      if (mode === 'mark') {
        const result = await markHomework(file, question);
        setMarkResult(result);
        if (result.extractedText && onTextExtracted) {
          onTextExtracted(result.extractedText);
        }
      } else if (mode === 'extract') {
        const blob = await extractTextToPdf(file);
        setExtractPdfBlob(blob);
        setExtractedText('PDF created. Download below.');
      } else {
        const result = await extractTextFromFile(file);
        setExtractedText(result.extractedText);
        if (onTextExtracted) {
          onTextExtracted(result.extractedText);
        }
      }
    } catch (err) {
      setError(err.message || (mode === 'mark' ? 'Failed to mark homework' : 'Failed to extract text'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#FFFFFF] border border-[#E9E7F5] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#E9E7F5] flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-[#1F2937] tracking-tight">Homework</h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-[#6B7280] hover:text-[#1F2937] rounded-xl hover:bg-[#FAFAFF] transition-colors" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex rounded-xl border border-[#E9E7F5] overflow-hidden">
            {showGetHomeworkTab && (
              <button
                type="button"
                onClick={() => { setMode('get'); resetState(); setFile(null); }}
                className={`flex-1 py-2.5 text-base font-bold transition-colors ${mode === 'get' ? 'bg-[#7C5CFF] text-white' : 'bg-[#FAFAFF] text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F5F4FF] border-r border-[#E9E7F5]'}`}
              >
                Generate homework for topic
              </button>
            )}
            <button
              type="button"
              onClick={() => { setMode('mark'); resetState(); setFile(null); }}
              className={`flex-1 py-2.5 text-base font-bold transition-colors ${mode === 'mark' ? 'bg-[#7C5CFF] text-white' : 'bg-[#FAFAFF] text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F5F4FF] border-r border-[#E9E7F5]'}`}
            >
              Mark my homework
            </button>
            <button
              type="button"
              onClick={() => { setMode('extract'); resetState(); setFile(null); }}
              className={`flex-1 py-2.5 text-base font-bold transition-colors ${mode === 'extract' ? 'bg-[#7C5CFF] text-white' : 'bg-[#FAFAFF] text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F5F4FF]'}`}
            >
              Problems only (PDF)
            </button>
          </div>

          {/* --- Get homework for topic --- */}
          {mode === 'get' && (
            <>
              <div>
                <label className="block text-sm font-bold text-[#1F2937] mb-2">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Algebra, Fractions, Quadratic Equations"
                  className="w-full px-4 py-2.5 bg-[#FBFBFF] border border-[#E9E7F5] rounded-xl text-[#1F2937] placeholder-[#6B7280] focus:ring-2 focus:ring-[#7C5CFF]/40 focus:border-[#7C5CFF]/50 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#1F2937] mb-2">Difficulty</label>
                <div className="flex gap-2">
                  {['easy', 'intermediate', 'hard'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTopicDifficulty(d)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-colors ${topicDifficulty === d ? 'bg-[#7C5CFF] text-white' : 'bg-[#FAFAFF] text-[#6B7280] hover:text-[#1F2937] border border-[#E9E7F5] hover:border-[#7C5CFF]/40'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleGenerateHomework}
                disabled={uploading || !topic.trim()}
                className="w-full py-3 bg-[#7C5CFF] hover:bg-[#6B4CE6] disabled:bg-[#E9E7F5] disabled:cursor-not-allowed text-white rounded-xl font-bold text-base transition-colors"
              >
                {uploading ? 'Generating...' : 'Generate homework'}
              </button>
              {mode === 'get' && error && (
                <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#EF4444]/30 text-[#B91C1C] text-sm font-semibold">
                  {error}
                </div>
              )}
              {generatedQuestions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-extrabold text-[#1F2937] text-base">Generated questions</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {generatedQuestions.map((q, idx) => (
                      <div key={idx} className="p-4 bg-[#FAFAFF] rounded-xl border border-[#E9E7F5]">
                        <p className="text-[#1F2937] text-base font-medium mb-2">{q.problemText}</p>
                        <button
                          type="button"
                          onClick={() => setRevealedSolution((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                          className="text-sm text-[#7C5CFF] hover:text-[#6B4CE6] font-bold"
                        >
                          {revealedSolution[idx] ? 'Hide solution' : 'Reveal solution'}
                        </button>
                        {revealedSolution[idx] && q.solutionText && (
                          <p className="mt-2 text-emerald-700 text-base font-medium border-t border-[#E9E7F5] pt-2">{q.solutionText}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {onAddQuestions && (
                    <button
                      onClick={handleAddToPractice}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-base transition-colors"
                    >
                      Add these to practice
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* --- Mark my homework (upload) --- */}
          {mode === 'mark' && (
            <>
              {question && (
                <div className="p-4 bg-[#FAFAFF] rounded-xl border border-[#E9E7F5]">
                  <p className="text-xs font-bold text-[#6B7280] mb-1">Question (optional context for marking):</p>
                  <p className="text-[#1F2937] text-base font-medium line-clamp-2">{question}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-[#1F2937] mb-2">Upload PDF or image (writing or math)</label>
                <div className="border-2 border-dashed border-[#E9E7F5] rounded-xl p-6 sm:p-8 text-center hover:border-[#7C5CFF]/50 bg-[#FAFAFF] hover:bg-[#F5F4FF] transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.gif"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-[#7C5CFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-[#1F2937] font-bold mb-1 text-sm sm:text-base">
                      {file ? file.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-[#6B7280] text-xs sm:text-sm font-medium">PDF, PNG, JPG up to 10MB</p>
                  </label>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 bg-[#FAFAFF] hover:bg-[#F5F4FF] border border-[#E9E7F5] text-[#6B7280] rounded-xl font-bold transition-colors text-base">
                  {markResult ? 'Close' : 'Cancel'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!file || uploading}
                  className="flex-1 py-3 bg-[#7C5CFF] hover:bg-[#6B4CE6] disabled:bg-[#E9E7F5] disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors text-base"
                >
                  {uploading ? 'Marking...' : 'Get score & feedback'}
                </button>
              </div>
              {markResult && (
                <div className={`p-4 rounded-xl border space-y-3 ${(markResult.feedback || '').toLowerCase().includes('not configured') || (markResult.feedback || '').toLowerCase().includes('api key') ? 'bg-amber-50 border-amber-200' : 'bg-[#FAFAFF] border-[#E9E7F5]'}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="font-extrabold text-[#1F2937]">Marking result</h4>
                    {markResult.score != null && (
                      <span className="text-2xl font-extrabold text-[#7C5CFF]">{markResult.score}%</span>
                    )}
                  </div>
                  {markResult.feedback && (
                    <p className="text-[#6B7280] text-base font-medium whitespace-pre-wrap">{markResult.feedback}</p>
                  )}
                  {markResult.feedback && (markResult.feedback.toLowerCase().includes('not configured') || markResult.feedback.toLowerCase().includes('api key')) && (
                    <p className="text-sm font-bold text-amber-800">Add GEMINI_API_KEY or OPENAI_API_KEY to your <code className="bg-amber-100 px-1 rounded">.env</code> file and restart the backend. Free key: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[#7C5CFF] underline">Google AI Studio</a></p>
                  )}
                  {markResult.extractedText && (
                    <div className="pt-2 border-t border-[#E9E7F5]">
                      <p className="text-xs font-bold text-[#6B7280] mb-1">Extracted / reviewed text:</p>
                      <div className="text-[#1F2937] text-sm font-medium max-h-40 overflow-y-auto whitespace-pre-wrap">
                        {markResult.extractedText}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* --- Problems only (PDF) --- */}
          {mode === 'extract' && (
            <>
              <p className="text-[#6B7280] text-sm font-medium">
                Upload a worksheet or homework with printed problems and handwritten answers. We&apos;ll remove the writing, keep the problems, and generate a clean PDF with only the problem text.
              </p>
              <div>
                <label className="block text-sm font-bold text-[#1F2937] mb-2">Upload PDF or image</label>
                <div className="border-2 border-dashed border-[#E9E7F5] rounded-xl p-6 sm:p-8 text-center hover:border-[#7C5CFF]/50 bg-[#FAFAFF] hover:bg-[#F5F4FF] transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.gif"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload-extract"
                  />
                  <label htmlFor="file-upload-extract" className="cursor-pointer">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-[#7C5CFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-[#1F2937] font-bold mb-1 text-sm sm:text-base">
                      {file ? file.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-[#6B7280] text-xs sm:text-sm font-medium">PDF, PNG, JPG up to 10MB</p>
                  </label>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 bg-[#FAFAFF] hover:bg-[#F5F4FF] border border-[#E9E7F5] text-[#6B7280] rounded-xl font-bold transition-colors text-base">
                  {extractPdfBlob ? 'Close' : 'Cancel'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!file || uploading}
                  className="flex-1 py-3 bg-[#7C5CFF] hover:bg-[#6B4CE6] disabled:bg-[#E9E7F5] disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors text-base"
                >
                  {uploading ? 'Generating PDF...' : 'Generate problems-only PDF'}
                </button>
              </div>
              {extractPdfBlob && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <h4 className="font-extrabold text-[#1F2937] mb-2">PDF ready</h4>
                  <p className="text-[#6B7280] text-sm font-medium mb-3">Your clean PDF with only the problem text (no handwriting) is ready to download.</p>
                  <a
                    href={URL.createObjectURL(extractPdfBlob)}
                    download="problems-only.pdf"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-base transition-colors"
                  >
                    Download PDF
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        {error && (
          <div className="px-6 pb-4">
            <div className="p-4 bg-[#FEE2E2] border border-[#EF4444]/30 text-[#B91C1C] rounded-xl text-base font-semibold">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
