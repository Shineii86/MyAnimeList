// API helper that automatically includes GitHub credentials for persistent storage
// All client-side API calls should use this instead of raw fetch

export function getGitHubSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem('mal_admin_settings') || '{}');
    if (settings.githubToken && settings.owner && settings.repo) {
      return {
        'x-github-token': settings.githubToken,
        'x-github-owner': settings.owner,
        'x-github-repo': settings.repo
      };
    }
  } catch {}
  return {};
}

export async function apiFetch(url, options = {}) {
  const ghHeaders = getGitHubSettings();
  
  const mergedOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...ghHeaders,
      ...(options.headers || {})
    }
  };

  return fetch(url, mergedOptions);
}

// Convenience methods
export async function apiGet(url) {
  return apiFetch(url);
}

export async function apiPost(url, body) {
  return apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function apiPut(url, body) {
  return apiFetch(url, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

export async function apiDelete(url) {
  return apiFetch(url, { method: 'DELETE' });
}
