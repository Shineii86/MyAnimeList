/**
 * GitHub README Parser
 */

import { showToast } from './utils.js';

export const GitHubParser = {
  // Fetch README from GitHub
  async fetchReadme(username, repo, branch = 'main') {
    try {
      const url = `https://raw.githubusercontent.com/${username}/${repo}/${branch}/README.md`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('README.md not found. Check your repository settings.');
        }
        throw new Error(`Failed to fetch README: ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('README fetch error:', error);
      showToast(error.message || 'Failed to load README', 'error');
      throw error;
    }
  },
  
  // Parse anime titles from markdown
  parseTitles(markdown) {
    if (!markdown) return [];
    
    const lines = markdown.split('\n');
    const titles = [];
    
    // Patterns to match
    const patterns = [
      /^[-*+]\s+\[?([^\]\n]+?)\]?(?:\([^)]*\))?\s*$/,  // - [Title](link) or - Title
      /^\d+\.\s+\[?([^\]\n]+?)\]?(?:\([^)]*\))?\s*$/,  // 1. [Title](link) or 1. Title
      /^\s*\[([^\]]+)\]\([^)]+\)\s*$/                   // [Title](link) alone
    ];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match && match[1]) {
          const title = match[1].trim();
          // Filter out empty or too short titles
          if (title.length > 2 && !title.startsWith('http')) {
            titles.push(title);
          }
          break;
        }
      }
    }
    
    // Remove duplicates while preserving order
    return [...new Set(titles)];
  },
  
  // Full pipeline: fetch + parse
  async getAnimeList(username, repo, branch = 'main') {
    try {
      const markdown = await this.fetchReadme(username, repo, branch);
      return this.parseTitles(markdown);
    } catch (error) {
      return [];
    }
  }
};
