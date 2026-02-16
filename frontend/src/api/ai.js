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
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate questions');
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
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate similar questions');
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
