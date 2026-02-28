const API_BASE = '/api/v1';

async function parseErrorResponse(response) {
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    return json.error || json.message || text || response.statusText;
  } catch {
    if (response.status === 404) return 'Generate path endpoint not found. Restart the backend and try again.';
    return text || response.statusText || 'Request failed';
  }
}

export async function generatePath(description, difficulty, estimatedTimeMinutes) {
  const response = await fetch(`${API_BASE}/ai/generate-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ description, difficulty, estimatedTimeMinutes }),
  });
  if (!response.ok) {
    const msg = await parseErrorResponse(response);
    throw new Error(msg);
  }
  return response.json();
}

export async function generateQuestions(topic, difficulty, count = 5, pathName = null) {
  const response = await fetch(`${API_BASE}/ai/generate-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ topic, difficulty, count, pathName: pathName || undefined }),
  });
  if (!response.ok) {
    let data = {};
    try { data = await response.json(); } catch {
      try { data = { error: await response.text() }; } catch { data = { error: response.statusText }; }
    }
    const msg = data.error || 'Failed to generate questions';
    const friendly = friendlyAiError(response.status, msg);
    if (response.status === 401) {
      throw new Error('Please log in again. Session may have expired.');
    }
    throw new Error(friendly || msg);
  }
  return response.json();
}

export async function generateSimilarQuestions(originalQuestion, topic, errorType) {
  const response = await fetch(`${API_BASE}/ai/generate-similar-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ originalQuestion, topic, errorType }),
  });
  if (!response.ok) {
    let data = {};
    try { data = await response.json(); } catch { /* non-JSON */ }
    const msg = data.error || 'Failed to generate similar questions';
    throw new Error(friendlyAiError(response.status, msg) || msg);
  }
  return response.json();
}

export async function extractTextFromFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/ai/extract-text`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to extract text');
  }
  return response.json();
}

/** Generate homework PDF for a topic (e.g. node). Returns blob for download. */
export async function generateHomeworkPdf(topic, difficulty = 'intermediate', count = 5, pathName = null) {
  const response = await fetch(`${API_BASE}/ai/generate-homework-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ topic, difficulty, count, pathName: pathName || undefined }),
  });
  if (!response.ok) {
    let msg = 'Failed to generate PDF';
    try {
      const data = await response.json();
      msg = data.error || msg;
    } catch {
      msg = await response.text() || msg;
    }
    throw new Error(friendlyAiError(response.status, msg) || msg);
  }
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    throw new Error(data.error || 'Server returned an error instead of a PDF.');
  }
  const blob = await response.blob();
  if (!blob || blob.size === 0) {
    throw new Error('Received an empty PDF. Try again or check that AI is configured.');
  }
  return blob;
}

/** Extract problem text only (ignores handwriting) and returns a PDF blob for download. */
export async function extractTextToPdf(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/ai/extract-text-to-pdf`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!response.ok) {
    let msg = 'Failed to create PDF';
    try {
      const data = await response.json();
      msg = data.error || msg;
    } catch {
      msg = await response.text() || msg;
    }
    throw new Error(msg);
  }
  return response.blob();
}

export async function markDrawing(question, imageBlob) {
  const formData = new FormData();
  formData.append('image', imageBlob, 'drawing.png');
  formData.append('question', question || '');
  
  const response = await fetch(`${API_BASE}/ai/mark-drawing`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!response.ok) {
    let error = {};
    try { error = await response.json(); } catch { /* non-JSON */ }
    const msg = error.error || 'Failed to mark drawing';
    throw new Error(friendlyAiError(response.status, msg) || msg);
  }
  return response.json();
}

/** Upload homework (image or PDF); get score and feedback. Writing and math supported. */
export async function markHomework(file, question = '') {
  const formData = new FormData();
  formData.append('file', file);
  if (question) formData.append('question', question);
  const response = await fetch(`${API_BASE}/ai/mark-homework`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!response.ok) {
    let data = {};
    try { data = await response.json(); } catch { /* non-JSON */ }
    const msg = data.error || 'Failed to mark homework';
    throw new Error(friendlyAiError(response.status, msg) || msg);
  }
  return response.json();
}

function friendlyAiError(status, message) {
  if (status === 429) return 'AI rate limit reached. Please wait a minute and try again.';
  if (status === 503) return 'AI is not set up. Add GEMINI_API_KEY or OPENAI_API_KEY to your .env file (see .env.example) and restart the backend. Get a free Gemini key: https://aistudio.google.com/app/apikey';
  const m = (message || '').toLowerCase();
  if (m.includes('quota') || m.includes('rate limit') || m.includes('resource_exhausted')) {
    return 'AI rate limit reached. Please wait a minute and try again.';
  }
  if (m.includes('not configured') || m.includes('api key') || m.includes('gemini_api_key') || m.includes('openai_api_key')) {
    return 'AI is not set up. Add GEMINI_API_KEY or OPENAI_API_KEY to your .env file and restart the backend. Free Gemini key: https://aistudio.google.com/app/apikey';
  }
  return null;
}

/** Submit mode: check answer only when user presses Submit. */
export async function checkAnswer(question, answer) {
  const response = await fetch(`${API_BASE}/ai/check-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ question: question || '', answer: answer || '' }),
  });
  if (!response.ok) {
    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    const msg = data.error || 'Failed to check answer';
    const friendly = friendlyAiError(response.status, msg);
    throw new Error(friendly || msg);
  }
  return response.json();
}

/** Learning mode: get live advice as the user types (call debounced). */
export async function getLiveFeedback(question, answer) {
  const response = await fetch(`${API_BASE}/ai/live-feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ question: question || '', answer: answer || '' }),
  });
  if (!response.ok) {
    let data = {};
    try { data = await response.json(); } catch { /* non-JSON */ }
    const msg = data.error || 'Failed to get feedback';
    throw new Error(friendlyAiError(response.status, msg) || msg);
  }
  return response.json();
}

/** Run code against test cases (and optional AI-generated cases). Returns { passed, failed, total, results, aiFeedback }. */
export async function checkCode(problemStatement, code, language = 'python', testCases = null) {
  const response = await fetch(`${API_BASE}/ai/check-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      problemStatement: problemStatement || '',
      code: code || '',
      language: language || 'python',
      testCases: testCases || undefined,
    }),
  });
  if (!response.ok) {
    let data = {};
    try { data = await response.json(); } catch { /* non-JSON */ }
    const msg = data.error || 'Failed to run tests';
    throw new Error(friendlyAiError(response.status, msg) || msg);
  }
  return response.json();
}
