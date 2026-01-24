const API_BASE = '/api/v1/paths';

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
