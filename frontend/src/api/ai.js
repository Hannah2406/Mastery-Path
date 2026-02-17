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

export async function generateQuestions(topic, difficulty, count = 5) {
  const response = await fetch(`${API_BASE}/ai/generate-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ topic, difficulty, count }),
  });
  if (!response.ok) {
    let data = {};
    try { data = await response.json(); } catch { /* non-JSON */ }
    const msg = data.error || 'Failed to generate questions';
    throw new Error(friendlyAiError(response.status, msg) || msg);
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

function friendlyAiError(status, message) {
  if (status === 429) return 'AI rate limit reached. Please wait a minute and try again.';
  const m = (message || '').toLowerCase();
  if (m.includes('quota') || m.includes('rate limit') || m.includes('resource_exhausted')) {
    return 'AI rate limit reached. Please wait a minute and try again.';
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
