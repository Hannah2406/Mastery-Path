const API_BASE = '/api/v1/analytics';

export async function getAnalyticsSummary(range = 30) {
  try {
    const response = await fetch(`${API_BASE}/summary?range=${range}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }
    return response.json();
  } catch (error) {
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    }
    throw error;
  }
}
