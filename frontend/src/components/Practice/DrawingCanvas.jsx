import { useState, useRef, useEffect } from 'react';
import { markDrawing } from '../../api/ai';

export default function DrawingCanvas({ question, onClose, onMarked }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [marking, setMarking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const questionText = question != null && typeof question === 'string' ? question : '';

  // Size canvas to container so cursor coordinates match 1:1 (fixes draw box misalignment)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(container.clientWidth);
    const h = Math.min(Math.floor(container.clientHeight || 400), 600);
    if (w <= 0 || h <= 0) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [color, lineWidth]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas || !containerRef.current) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(containerRef.current.clientWidth);
      const h = Math.min(Math.floor(containerRef.current.clientHeight || 400), 600);
      if (w <= 0 || h <= 0) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches?.[0]?.clientX);
    const clientY = e.clientY ?? (e.touches?.[0]?.clientY);
    if (clientX == null || clientY == null) return null;
    if (rect.width <= 0 || rect.height <= 0) return null;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    return {
      x: (clientX - rect.left) * (scaleX / dpr),
      y: (clientY - rect.top) * (scaleY / dpr),
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const coords = getCanvasCoords(e);
    if (!ctx || !coords) return;
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const coords = getCanvasCoords(e);
    if (!ctx || !coords) return;
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    setResult(null);
    setError('');
  };

  const handleMark = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check if canvas has any drawing
    const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const hasDrawing = imageData.data.some((val, idx) => idx % 4 !== 3 && val !== 255);
    
    if (!hasDrawing) {
      setError('Please draw your work before submitting');
      return;
    }

    setMarking(true);
    setError('');
    try {
      canvas.toBlob(async (blob) => {
        try {
          const result = await markDrawing(questionText, blob);
          setResult(result);
          if (onMarked) {
            onMarked(result);
          }
        } catch (err) {
          setError(err.message || 'Failed to mark your work');
        } finally {
          setMarking(false);
        }
      }, 'image/png');
    } catch (err) {
      setError(err.message || 'Failed to process drawing');
      setMarking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>✏️</span> Draw Your Work
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {questionText && (
            <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600">
              <h4 className="font-semibold text-white mb-2">Question:</h4>
              <p className="text-slate-300">{questionText}</p>
            </div>
          )}

          {/* Drawing Tools */}
          <div className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-xl">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-300">Color:</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-300">Size:</label>
              <input
                type="range"
                min="1"
                max="10"
                value={lineWidth}
                onChange={(e) => setLineWidth(parseInt(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-slate-400 w-8">{lineWidth}px</span>
            </div>
            <button
              onClick={clearCanvas}
              className="ml-auto px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Canvas - container sized so cursor and draw align 1:1 */}
          <div ref={containerRef} className="border-2 border-slate-600 rounded-xl overflow-hidden bg-white w-full aspect-video max-h-[50vh]" style={{ minHeight: 280 }}>
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                if (!touch) return;
                startDrawing({ clientX: touch.clientX, clientY: touch.clientY });
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                if (!isDrawing) return;
                const touch = e.touches[0];
                if (!touch) return;
                draw({ clientX: touch.clientX, clientY: touch.clientY });
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                stopDrawing();
              }}
              className="w-full max-w-full h-auto cursor-crosshair block"
              style={{ touchAction: 'none' }}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-900/30 border border-red-500/50 text-red-200 rounded-xl">
              {error}
            </div>
          )}

          {result && (
            <div className={`p-4 rounded-xl space-y-3 ${(result.feedback || '').toLowerCase().includes('not configured') ? 'bg-amber-900/30 border border-amber-500/50' : 'bg-green-900/30 border border-green-500/50'}`}>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-green-200 text-lg">AI Marking Results</h4>
                {result.score !== null && (
                  <div className="text-2xl font-bold text-green-300">
                    {result.score}%
                  </div>
                )}
              </div>
              {result.feedback && (
                <div className="text-green-100 whitespace-pre-wrap">{result.feedback}</div>
              )}
              {result.feedback && result.feedback.toLowerCase().includes('not configured') && (
                <p className="text-amber-200 text-sm font-bold">Add GEMINI_API_KEY or OPENAI_API_KEY to .env and restart the backend. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Get free key</a></p>
              )}
              {result.extractedText && (
                <div className="mt-3 pt-3 border-t border-green-500/30">
                  <h5 className="font-semibold text-green-200 mb-1">Recognized Text:</h5>
                  <div className="text-green-100 text-sm bg-green-900/20 p-2 rounded">
                    {result.extractedText}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={marking}
              className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
            >
              {result ? 'Close' : 'Cancel'}
            </button>
            <button
              onClick={handleMark}
              disabled={marking}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {marking ? (
                <>
                  <span className="animate-spin">⏳</span>
                  AI is marking...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Submit for AI Marking
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
