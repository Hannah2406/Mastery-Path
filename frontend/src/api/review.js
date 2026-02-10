const API_BASE = '/api/v1/review';

export async function getReviewQueue(pathId, limit = 20) {
  try {
    const response = await fetch(`${API_BASE}/queue?pathId=${pathId}&limit=${limit}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch review queue');
    }
    return response.json();
  } catch (error) {
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    }
    throw error;
  }
}
