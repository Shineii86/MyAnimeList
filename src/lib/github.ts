import { readFile } from 'fs/promises';
import { join } from 'path';

const DATA_FILE = join(process.cwd(), 'data', 'anime.json');

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

function getConfig(): GitHubConfig | null {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (!token || !owner || !repo) return null;
  return {
    token,
    owner,
    repo,
    branch: process.env.GITHUB_BRANCH || 'main',
  };
}

export async function syncToGitHub(commitMessage?: string): Promise<{ synced: boolean; error?: string }> {
  const config = getConfig();
  if (!config) return { synced: false, error: 'GitHub not configured' };

  try {
    const content = await readFile(DATA_FILE, 'utf-8');
    const encoded = Buffer.from(content).toString('base64');

    // Get current file SHA (needed for update)
    const getUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/data/anime.json?ref=${config.branch}`;
    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'AnimeAdmin/1.0',
      },
    });

    let sha: string | undefined;
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    const message = commitMessage || `chore: update anime collection [${new Date().toISOString().slice(0, 10)}]`;

    const putUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/data/anime.json`;
    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'AnimeAdmin/1.0',
      },
      body: JSON.stringify({
        message,
        content: encoded,
        branch: config.branch,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.text();
      return { synced: false, error: `GitHub API error: ${putRes.status}` };
    }

    return { synced: true };
  } catch (err) {
    return { synced: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function isGitHubConfigured(): boolean {
  return getConfig() !== null;
}
