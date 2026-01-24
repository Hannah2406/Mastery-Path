const API_BASE = '/api/v1/history';

export async function getLogs(limit = 50) {
  try {
    const response = await fetch(`${API_BASE}/logs?limit=${limit}`, {
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch logs');
    }
    return data;
  } catch (error) {
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    }
    throw error;
  }
}

export async function getStats() {
  try {
    const response = await fetch(`${API_BASE}/stats`, {
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch stats');
    }
    return data;
  } catch (error) {
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    }
    throw error;
  }
}

export async function getNodeLogs(nodeId) {
  try {
    const response = await fetch(`${API_BASE}/logs/node/${nodeId}`, {
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch node logs');
    }
    return data;
  } catch (error) {
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    }
    throw error;
  }
}
