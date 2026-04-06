/**
 * GitHub README Fetcher
 * Fetches and parses anime list from GitHub README
 */

const GITHUB_CONFIG = {
    username: 'Shineii86',
    repo: 'MyAnimeList',
    branch: 'main',
    filename: 'README.md'
};

// Fetch README from GitHub
export async function fetchGitHubReadme() {
    const url = `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.filename}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch README');
        return await response.text();
    } catch (error) {
        console.error('GitHub Fetch Error:', error);
        throw new Error('Unable to fetch GitHub README. Check connection or repository settings.');
    }
}

// Alternative: Fetch via GitHub API (if raw fails due to CORS)
export async function fetchGitHubReadmeAPI() {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filename}?ref=${GITHUB_CONFIG.branch}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('GitHub API Error');
        const data = await response.json();
        // Decode base64 content
        const content = atob(data.content.replace(/\n/g, ''));
        return content;
    } catch (error) {
        console.error('GitHub API Error:', error);
        throw error;
    }
}
