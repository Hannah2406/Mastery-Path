const API_BASE = '/api/v1/paths';

export async function createPath(body) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.message || 'Failed to create path');
  return data;
}

export async function getPaths() {
  try {
    const response = await fetch(API_BASE, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch paths');
    }
    return response.json();
  } catch (error) {
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    }
    throw error;
  }
}

export async function getTree(pathId) {
  try {
    const response = await fetch(`${API_BASE}/${pathId}/tree`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch tree');
    }
    return response.json();
  } catch (error) {
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    }
    throw error;
  }
}

export async function getPathStats(pathId) {
  try {
    const response = await fetch(`${API_BASE}/${pathId}/stats`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch path stats');
    }
    return response.json();
  } catch (error) {
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    }
    throw error;
  }
}
