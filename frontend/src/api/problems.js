const API_BASE = '/api/v1/paths';

export async function getProblemsForNode(nodeId) {
  if (nodeId == null || nodeId === '') {
    return [];
  }
  try {
    const response = await fetch(`${API_BASE}/nodes/${nodeId}/problems`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch problems');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    }
    throw error;
  }
}

/**
 * Generate practice questions for this node (AMC 8 / Blind 75 style from path name) and save them.
 * Returns the list of saved problems. Use when node has no problems so each node gets questions.
 */
export async function generateAndSaveQuestionsForNode(nodeId, { pathName = null, count = 5, difficulty = 'intermediate' } = {}) {
  if (nodeId == null || nodeId === '') {
    throw new Error('Node is required');
  }
  const response = await fetch(`${API_BASE}/nodes/${nodeId}/generate-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ pathName, count, difficulty }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || response.statusText || 'Failed to generate questions');
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}
