// GitHub API integration for pushing changes
const GITHUB_API = 'https://api.github.com';

async function getFileContent(owner, repo, filePath, token) {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}`, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MyAnimeList-Admin'
    }
  });
  
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  
  const data = await res.json();
  return { sha: data.sha, content: Buffer.from(data.content, 'base64').toString('utf-8') };
}

async function pushFile(owner, repo, filePath, content, message, token, sha = null) {
  const body = {
    message,
    content: Buffer.from(content).toString('base64'),
  };
  
  if (sha) {
    body.sha = sha;
  }

  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'MyAnimeList-Admin'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`GitHub push failed: ${res.status} - ${JSON.stringify(err)}`);
  }

  return await res.json();
}

async function pushReadme(owner, repo, readmeContent, token) {
  // Get current file SHA
  const existing = await getFileContent(owner, repo, 'README.md', token);
  const sha = existing ? existing.sha : null;
  
  const message = `📝 Update anime list via Admin Panel [${new Date().toISOString().split('T')[0]}]`;
  return pushFile(owner, repo, 'README.md', readmeContent, message, token, sha);
}

async function pushData(owner, repo, dataContent, token) {
  const existing = await getFileContent(owner, repo, 'admin-panel/data/anime.json', token);
  const sha = existing ? existing.sha : null;
  
  const message = `📊 Update anime data via Admin Panel [${new Date().toISOString().split('T')[0]}]`;
  return pushFile(owner, repo, 'admin-panel/data/anime.json', dataContent, message, token, sha);
}

async function pushChangelog(owner, repo, changelogContent, token) {
  const existing = await getFileContent(owner, repo, 'CHANGELOG.md', token);
  const sha = existing ? existing.sha : null;
  
  const message = `📋 Update CHANGELOG via Admin Panel [${new Date().toISOString().split('T')[0]}]`;
  return pushFile(owner, repo, 'CHANGELOG.md', changelogContent, message, token, sha);
}

module.exports = { getFileContent, pushFile, pushReadme, pushData, pushChangelog };
