import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { SaveIcon, EditIcon, NoteIcon, StarIcon } from '../../lib/icons';
import { apiFetch, apiGet, apiPost, apiPut, apiDelete } from '../../lib/api';

export default function EditAnime({ showToast }) {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (id) loadAnime(); }, [id]);

  async function loadAnime() {
    try {
      const res = await apiGet(`/api/anime/${id}`);
      if (res.ok) {
        const data = await res.json();
        setForm({
          title: data.title || '', anilistUrl: data.anilistUrl || '',
          anilistId: data.anilistId ? String(data.anilistId) : '',
          type: data.type || 'TV', score: data.score ? String(data.score) : '',
          genres: (data.genres || []).join(', '),
          episodes: data.episodes ? String(data.episodes) : '',
          status: data.status || 'Completed', notes: data.notes || '',
          tags: (data.tags || []).join(', '), coverImage: data.coverImage || ''
        });
      } else {
        showToast?.('Anime not found', 'error');
        router.push('/anime');
      }
    } catch {
      showToast?.('Failed to load anime', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        genres: form.genres ? form.genres.split(',').map(g => g.trim()).filter(Boolean) : [],
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        score: form.score ? parseFloat(form.score) : 0,
        episodes: form.episodes ? parseInt(form.episodes) : 0,
        anilistId: form.anilistId ? parseInt(form.anilistId) : null
      };
      const res = await apiPut(`/api/anime/${id}`, body);
      if (res.ok) {
        showToast?.('Anime updated successfully', 'success');
        router.push('/anime');
      } else { showToast?.('Failed to update', 'error'); }
    } catch { showToast?.('Error updating anime', 'error'); } finally { setSaving(false); }
  }

  if (loading || !form) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>;

  return (
    <>
      <Head><title>Edit: {form.title} - MyAnimeList Admin</title></Head>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Edit Anime</h1>
        <p style={{ color: 'var(--text-muted)' }}>Editing: {form.title}</p>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">AniList URL</label>
              <input className="form-input" name="anilistUrl" value={form.anilistUrl} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">AniList ID</label>
              <input className="form-input" name="anilistId" value={form.anilistId} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-input" name="type" value={form.type} onChange={handleChange}>
                <option value="TV">TV</option><option value="Movie">Movie</option><option value="OVA">OVA</option><option value="ONA">ONA</option><option value="Special">Special</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" name="status" value={form.status} onChange={handleChange}>
                <option value="Completed">Completed</option>
                <option value="Watching">Watching</option>
                <option value="Plan to Watch">Plan to Watch</option>
                <option value="On Hold">On Hold</option>
                <option value="Dropped">Dropped</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Score (0-10)</label>
              <input className="form-input" name="score" type="number" min="0" max="10" step="0.1" value={form.score} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Episodes</label>
              <input className="form-input" name="episodes" type="number" min="0" value={form.episodes} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Genres (comma separated)</label>
            <input className="form-input" name="genres" value={form.genres} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Custom Tags <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(e.g., favorite, hidden-gem)</span></label>
            <input className="form-input" name="tags" value={form.tags} onChange={handleChange} placeholder="favorite, hidden-gem, rewatch" />
          </div>
          <div className="form-group">
            <label className="form-label">Cover Image URL</label>
            <input className="form-input" name="coverImage" value={form.coverImage} onChange={handleChange} placeholder="https://example.com/cover.jpg" />
            {form.coverImage && <img src={form.coverImage} alt="Preview" style={{ marginTop: 8, width: 80, height: 112, borderRadius: 8, objectFit: 'cover' }} />}
          </div>
          <div className="form-group">
            <label className="form-label"><NoteIcon size={14} style={{ marginRight: 4 }} /> Personal Notes</label>
            <textarea className="form-input" name="notes" value={form.notes} onChange={handleChange} placeholder="Your thoughts, rewatch notes..." rows={4} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><div className="spinner" /> Saving...</> : <><SaveIcon size={16} /> Save Changes</>}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => router.push('/anime')}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
}
