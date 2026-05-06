// Auto-push helper — triggers GitHub push after data mutations
// Settings are read client-side and sent with API requests

export function getSettings() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('mal_admin_settings') || '{}');
  } catch {
    return {};
  }
}

export async function autoPushIfEnabled() {
  const settings = getSettings();
  if (!settings.autoPush || !settings.githubToken) return null;

  try {
    const res = await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'push',
        github_token: settings.githubToken,
        owner: settings.owner || 'Shineii86',
        repo: settings.repo || 'MyAnimeList'
      })
    });
    if (res.ok) return await res.json();
  } catch {
    // Silent fail — don't block the UI
  }
  return null;
}

// Wraps fetch with auto-push after mutations
export async function apiWithAutoPush(url, options = {}) {
  const res = await fetch(url, options);
  
  if (res.ok && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
    // Fire and forget auto-push
    autoPushIfEnabled();
  }
  
  return res;
}
