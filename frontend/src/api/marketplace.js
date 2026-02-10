const API_BASE = '/api/v1/marketplace';

async function parseJson(response, fallback = null) {
  const text = await response.text();
  if (!text?.trim()) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export async function getMarketplacePaths(params = {}) {
  const { tag, difficulty, sort = 'newest', limit = 20 } = params;
  const search = new URLSearchParams();
  if (tag) search.set('tag', tag);
  if (difficulty) search.set('difficulty', difficulty);
  search.set('sort', sort);
  search.set('limit', limit);
  const response = await fetch(`${API_BASE}/paths?${search}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch marketplace paths');
  const data = await parseJson(response, []);
  return Array.isArray(data) ? data : [];
}

export async function getMarketplacePath(id) {
  const response = await fetch(`${API_BASE}/paths/${id}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch path');
  const data = await parseJson(response);
  if (!data) throw new Error('Invalid response from server');
  return data;
}

export async function getMarketplaceTree(id) {
  const response = await fetch(`${API_BASE}/paths/${id}/tree`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch tree preview');
  const data = await parseJson(response);
  if (!data) throw new Error('Invalid response from server');
  return data;
}

export async function publishPath(body) {
  const response = await fetch(`${API_BASE}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await parseJson(response, {});
  if (!response.ok) throw new Error(data?.error || 'Failed to publish');
  return data;
}

export async function purchasePath(id) {
  const response = await fetch(`${API_BASE}/paths/${id}/purchase`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await parseJson(response, {});
  if (!response.ok) throw new Error(data?.error || 'Failed to purchase');
  return data;
}

export async function importPath(id) {
  const response = await fetch(`${API_BASE}/paths/${id}/import`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await parseJson(response, {});
  if (!response.ok) throw new Error(data?.error || 'Failed to import');
  return data;
}
