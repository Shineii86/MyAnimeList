/**
 * AniLab API Service
 */

import { storage, slugify, showToast } from './utils.js';

const API_BASE = 'https://api.anilab.to/anime';
const CACHE_TTL = 24; // hours

export const AniLabAPI = {
  // Search anime by query
  async search(query, limit = 10) {
    try {
      const cacheKey = `anilab_search_${slugify(query)}_${limit}`;
      const cached = storage.get(cacheKey);
      
      if (cached) return cached;
      
      const url = `${API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      storage.set(cacheKey, data, CACHE_TTL);
      
      return data.results || data;
    } catch (error) {
      console.error('Search error:', error);
      showToast('Failed to fetch search results', 'error');
      return [];
    }
  },
  
  // Get anime details by ID
  async getDetails(id) {
    try {
      const cacheKey = `anilab_details_${id}`;
      const cached = storage.get(cacheKey);
      
      if (cached) return cached;
      
      const response = await fetch(`${API_BASE}/${id}`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      storage.set(cacheKey, data, CACHE_TTL);
      
      return data;
    } catch (error) {
      console.error('Details fetch error:', error);
      return null;
    }
  },
  
  // Get anime by title (search + first result details)
  async getByTitle(title) {
    try {
      const cacheKey = `anilab_title_${slugify(title)}`;
      const cached = storage.get(cacheKey);
      
      if (cached) return cached;
      
      const results = await this.search(title, 1);
      if (!results || results.length === 0) {
        return null;
      }
      
      const first = results[0];
      const details = first.id 
        ? await this.getDetails(first.id) 
        : first;
      
      storage.set(cacheKey, details, CACHE_TTL);
      return details;
    } catch (error) {
      console.error('GetByTitle error:', error);
      return null;
    }
  },
  
  // Fetch multiple anime with concurrency limit
  async fetchBatch(titles, concurrency = 5) {
    const results = [];
    const queue = [...titles];
    const inProgress = new Set();
    
    return new Promise((resolve) => {
      const next = async () => {
        if (queue.length === 0 && inProgress.size === 0) {
          resolve(results);
          return;
        }
        
        while (inProgress.size < concurrency && queue.length > 0) {
          const title = queue.shift();
          const promise = this.getByTitle(title)
            .then(data => {
              results.push({ title, data });
              inProgress.delete(promise);
              next();
            })
            .catch(() => {
              results.push({ title,  null, error: true });
              inProgress.delete(promise);
              next();
            });
          
          inProgress.add(promise);
        }
      };
      
      next();
    });
  }
};
