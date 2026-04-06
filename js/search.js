/**
 * Search System with Debounce & Suggestions
 */

import { debounce, showToast } from './utils.js';
import { AniLabAPI } from './api.js';
import { UI } from './ui.js';

export const Search = {
  input: null,
  suggestions: null,
  clearBtn: null,
  
  init() {
    this.input = document.getElementById('anime-search');
    this.suggestions = document.getElementById('search-suggestions');
    this.clearBtn = document.getElementById('search-clear');
    
    if (!this.input) return;
    
    // Debounced search
    const handleSearch = debounce(async (query) => {
      if (!query.trim()) {
        this.hideSuggestions();
        return;
      }
      
      await this.fetchSuggestions(query);
    }, 300);
    
    this.input.addEventListener('input', (e) => {
      const query = e.target.value;
      
      // Show/hide clear button
      if (this.clearBtn) {
        this.clearBtn.style.display = query ? 'flex' : 'none';
      }
      
      handleSearch(query);
    });
    
    // Clear button
    this.clearBtn?.addEventListener('click', () => {
      this.input.value = '';
      this.hideSuggestions();
      this.input.focus();
    });
    
    // Keyboard navigation
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideSuggestions();
        this.input.blur();
      }
    });
    
    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search__wrapper')) {
        this.hideSuggestions();
      }
    });
  },
  
  async fetchSuggestions(query) {
    try {
      const results = await AniLabAPI.search(query, 8);
      
      if (!results || results.length === 0) {
        this.hideSuggestions();
        return;
      }
      
      this.renderSuggestions(results);
    } catch (error) {
      console.error('Suggestion fetch error:', error);
    }
  },
  
  renderSuggestions(results) {
    if (!this.suggestions) return;
    
    const items = results.map((anime, index) => `
      <div class="suggestion-item" 
           role="option" 
           aria-selected="${index === 0}" 
           tabindex="${index === 0 ? 0 : -1}"
           data-id="${anime.id}"
           data-title="${anime.title}">
        <img src="${anime.coverImage || ''}" 
             alt="" 
             width="40" 
             height="60"
             style="border-radius: 8px; object-fit: cover;"
             onerror="this.style.display='none'">
        <div>
          <div class="suggestion-title">${anime.title}</div>
          <div class="suggestion-meta">
            ${anime.rating ? `⭐ ${anime.rating}` : ''}
            ${anime.year ? ` • ${anime.year}` : ''}
            ${anime.genres?.[0] ? ` • ${anime.genres[0]}` : ''}
          </div>
        </div>
      </div>
    `).join('');
    
    this.suggestions.innerHTML = items;
    this.suggestions.hidden = false;
    
    // Click handler
    this.suggestions.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const title = item.dataset.title;
        this.input.value = title;
        this.hideSuggestions();
        
        // Trigger search or open modal
        // For now, just log - integrate with your main search logic
        console.log('Selected:', title);
      });
    });
    
    // Keyboard navigation
    this.suggestions.querySelectorAll('.suggestion-item').forEach((item, index) => {
      item.addEventListener('keydown', (e) => {
        const items = this.suggestions.querySelectorAll('.suggestion-item');
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = items[index + 1] || items[0];
          next.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = items[index - 1] || items[items.length - 1];
          prev.focus();
        } else if (e.key === 'Enter') {
          item.click();
        }
      });
    });
  },
  
  hideSuggestions() {
    if (this.suggestions) {
      this.suggestions.hidden = true;
      this.suggestions.innerHTML = '';
    }
  },
  
  // Public method to trigger search
  triggerSearch(query) {
    if (this.input) {
      this.input.value = query;
      this.input.dispatchEvent(new Event('input'));
    }
  }
};
