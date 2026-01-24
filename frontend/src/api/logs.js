const API_BASE = '/api/v1/logs';

export async function createLog(nodeId, isSuccess, errorCode, durationMs) {
  try {
    const body = {
      nodeId,
      isSuccess,
      durationMs,
    };
    if (!isSuccess && errorCode) {
      body.errorCode = errorCode;
    }
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to log practice');
    }
    return data;
  } catch (error) {
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    }
    throw error;
  }
}
