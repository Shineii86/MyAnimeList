/**
 * Sorting & Filtering System
 */

export const Filters = {
  state: {
    sort: 'az',
    status: 'all',
    genres: []
  },
  
  init() {
    // Sort dropdown
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.state.sort = e.target.value;
        this.applyFilters();
      });
    }
    
    // Status chips
    document.querySelectorAll('[data-filter="status"]').forEach(chip => {
      chip.addEventListener('click', () => {
        // Update active state
        document.querySelectorAll('[data-filter="status"]').forEach(c => 
          c.classList.remove('chip--active'));
        chip.classList.add('chip--active');
        
        // Update state
        this.state.status = chip.dataset.value;
        this.applyFilters();
      });
    });
    
    // Genre chips
    document.querySelectorAll('[data-filter="genre"]').forEach(chip => {
      chip.addEventListener('click', () => {
        const genre = chip.dataset.value;
        const index = this.state.genres.indexOf(genre);
        
        if (index > -1) {
          this.state.genres.splice(index, 1);
          chip.classList.remove('chip--active');
        } else {
          this.state.genres.push(genre);
          chip.classList.add('chip--active');
        }
        
        this.applyFilters();
      });
    });
  },
  
  // Filter and sort anime list
  apply(animeList) {
    if (!animeList) return [];
    
    let filtered = [...animeList];
    
    // Status filter
    if (this.state.status !== 'all') {
      filtered = filtered.filter(anime => 
        anime.status?.toLowerCase() === this.state.status
      );
    }
    
    // Genre filter
    if (this.state.genres.length > 0) {
      filtered = filtered.filter(anime => 
        anime.genres?.some(g => this.state.genres.includes(g))
      );
    }
    
    // Sorting
    switch (this.state.sort) {
      case 'az':
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'za':
        filtered.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
      case 'rating-high':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'rating-low':
        filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      case 'recent':
        // Assuming newer IDs or added dates - fallback to title
        filtered.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
        break;
    }
    
    return filtered;
  },
  
  // Apply filters and re-render (callback to main app)
  applyFilters() {
    // Dispatch custom event for main app to handle re-render
    window.dispatchEvent(new CustomEvent('filters:changed', { 
      detail: { ...this.state } 
    }));
  },
  
  // Reset all filters
  reset() {
    this.state = {
      sort: 'az',
      status: 'all',
      genres: []
    };
    
    // Reset UI
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'az';
    
    document.querySelectorAll('[data-filter="status"]').forEach(chip => {
      chip.classList.toggle('chip--active', chip.dataset.value === 'all');
    });
    
    document.querySelectorAll('[data-filter="genre"]').forEach(chip => {
      chip.classList.remove('chip--active');
    });
    
    this.applyFilters();
  }
};
