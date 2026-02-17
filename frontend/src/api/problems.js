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
