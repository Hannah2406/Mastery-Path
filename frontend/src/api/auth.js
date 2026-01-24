const API_BASE = '/api/v1/auth';

export async function register(email, password) {
  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText || 'Registration failed' };
      }
      throw new Error(error.error || 'Registration failed');
    }
    
    return response.json();
  } catch (error) {
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running.');
    }
    throw error;
  }
}

export async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText || 'Login failed' };
      }
      throw new Error(error.error || 'Login failed');
    }
    
    return response.json();
  } catch (error) {
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please make sure the backend is running on port 8080.');
    }
    throw error;
  }
}

export async function logout() {
  try {
    await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    // Ignore logout errors
    console.error('Logout error:', error);
  }
}

export async function getMe() {
  try {
    const response = await fetch(`${API_BASE}/me`, {
      credentials: 'include',
    });
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch (error) {
    // Silently fail - user is not logged in
    return null;
  }
}
