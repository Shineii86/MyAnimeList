const { readData, getGhFromReq } = require('../../lib/data');
const { generateReadme } = require('../../lib/readme-generator');
const { pushReadme, pushData } = require('../../lib/github');
const { requireAuth } = require('../../lib/auth');
const { addEntry } = require('../../lib/activity-log');
const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
  if (!requireAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.body;

  try {
    // For push action, use the provided credentials for reading too
    const gh = action === 'push' && req.body.github_token
      ? { token: req.body.github_token, owner: req.body.owner, repo: req.body.repo }
      : getGhFromReq(req);

    const data = await readData(gh);
    const readme = generateReadme(data);

    if (action === 'generate') {
      try {
        const readmePath = path.join(process.cwd(), '..', 'README.md');
        if (fs.existsSync(path.dirname(readmePath))) {
          fs.writeFileSync(readmePath, readme, 'utf-8');
        }
      } catch {}

      addEntry({ action: 'generate', target: 'README.md', details: `${data.anime.length} anime entries`, gh });
      
      return res.status(200).json({ 
        success: true, 
        message: `README.md generated with ${data.anime.length} anime entries`,
        readme,
        preview: readme.substring(0, 500) + '...'
      });
    }

    if (action === 'push') {
      const github_token = req.body.github_token || process.env.GITHUB_TOKEN;
      const owner = req.body.owner || process.env.GITHUB_OWNER || 'Shineii86';
      const repo = req.body.repo || process.env.GITHUB_REPO || 'MyAnimeList';
      
      if (!github_token) {
        return res.status(400).json({ 
          error: 'GitHub token is required. Provide it in the form or set GITHUB_TOKEN in your environment variables.' 
        });
      }

      const readmeResult = await pushReadme(owner, repo, readme, github_token);
      const dataResult = await pushData(owner, repo, JSON.stringify(data, null, 2), github_token);

      addEntry({ action: 'push', target: `${owner}/${repo}`, details: `README.md + anime.json (${data.anime.length} entries)`, gh: { token: github_token, owner, repo } });

      return res.status(200).json({
        success: true,
        message: 'Pushed to GitHub successfully',
        readme: readmeResult.content?.html_url,
        data: dataResult.content?.html_url
      });
    }

    return res.status(400).json({ error: 'Invalid action. Use "generate" or "push"' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
