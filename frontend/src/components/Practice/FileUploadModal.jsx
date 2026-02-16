import { useState } from 'react';
import { extractTextFromFile } from '../../api/ai';

export default function FileUploadModal({ onClose, onTextExtracted }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [extractedText, setExtractedText] = useState('');

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
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const result = await extractTextFromFile(file);
      setExtractedText(result.extractedText);
      if (onTextExtracted) {
        onTextExtracted(result.extractedText);
      }
    } catch (err) {
      setError(err.message || 'Failed to extract text from file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Upload Test Paper</h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Upload PDF or Image (handwritten test paper)
            </label>
            <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.gif"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <svg className="w-12 h-12 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-slate-300 font-medium mb-1">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-slate-500 text-sm">PDF, PNG, JPG up to 10MB</p>
              </label>
            </div>
          </div>
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-500/50 text-red-200 rounded-xl">
              {error}
            </div>
          )}
          {extractedText && (
            <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600">
              <h4 className="font-bold text-white mb-2">Extracted Text:</h4>
              <div className="text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
                {extractedText}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
            >
              {uploading ? 'Extracting...' : 'Extract Text'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
