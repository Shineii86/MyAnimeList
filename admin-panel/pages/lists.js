import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { PlusIcon, TrashIcon, EditIcon, StarIcon, ListIcon, SearchIcon, CheckCircleIcon, XIcon } from '../lib/icons';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

export default function CustomLists({ showToast }) {
  const [anime, setAnime] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editList, setEditList] = useState(null);
  const [listName, setListName] = useState('');
  const [listEmoji, setListEmoji] = useState('📋');
  const [listDesc, setListDesc] = useState('');
  const [selectedAnime, setSelectedAnime] = useState(new Set());
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);

  const EMOJIS = ['📋', '⭐', '❤️', '🔥', '💎', '🏆', '🎬', '🎵', '⚔️', '🧙', '🤖', '💔', '😂', '🧠', '🌀', '🎮'];

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    Promise.all([
      apiGet('/api/anime').then(r => r.json()),
      apiGet('/api/lists').then(r => r.json()).catch(() => ({ lists: [] }))
    ]).then(([animeData, listsData]) => {
      setAnime(animeData.anime || []);
      setLists(listsData.lists || []);
      setLoading(false);
    }).catch(() => {
      showToast?.('Failed to load data', 'error');
      setLoading(false);
    });
  }

  function openCreate() {
    setListName('');
    setListEmoji('📋');
    setListDesc('');
    setSelectedAnime(new Set());
    setSearch('');
    setEditList(null);
    setCreateModal(true);
  }

  function openEdit(list) {
    setListName(list.name);
    setListEmoji(list.emoji || '📋');
    setListDesc(list.description || '');
    setSelectedAnime(new Set(list.animeIds || []));
    setSearch('');
    setEditList(list);
    setCreateModal(true);
  }

  async function handleSave() {
    if (!listName.trim()) {
      showToast?.('List name is required', 'error');
      return;
    }

    const payload = {
      name: listName.trim(),
      emoji: listEmoji,
      description: listDesc.trim(),
      animeIds: Array.from(selectedAnime)
    };

    try {
      let res;
      if (editList) {
        res = await apiPut(`/api/lists/${editList.id}`, payload);
      } else {
        res = await apiPost('/api/lists', payload);
      }

      if (res.ok) {
        showToast?.(editList ? 'List updated' : 'List created', 'success');
        setCreateModal(false);
        loadData();
      } else {
        showToast?.('Failed to save list', 'error');
      }
    } catch {
      showToast?.('Error saving list', 'error');
    }
  }

  async function handleDeleteList(id) {
    try {
      const res = await apiDelete(`/api/lists/${id}`);
      if (res.ok) {
        showToast?.('List deleted', 'success');
        setLists(prev => prev.filter(l => l.id !== id));
      } else {
        showToast?.('Failed to delete', 'error');
      }
    } catch {
      showToast?.('Error deleting', 'error');
    }
    setDeleteModal(null);
  }

  const filteredAnime = search
    ? anime.filter(a => a.title.toLowerCase().includes(search.toLowerCase()))
    : anime;

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  return (
    <>
      <Head><title>Custom Lists - MyAnimeList Admin</title></Head>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}><ListIcon size={18} style={{ marginRight: 6 }} /> Custom Lists</h1>
          <p style={{ color: 'var(--text-muted)' }}>Create themed collections of your anime</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <PlusIcon size={16} /> New List
        </button>
      </div>

      {lists.length === 0 ? (
        <div className="empty-state">
          <ListIcon size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <h3>No custom lists yet</h3>
          <p>Create themed collections like "Best Fights", "Top OSTs", or "Rewatch List".</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreate}>
            <PlusIcon size={16} /> Create Your First List
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {lists.map(list => {
            const listAnime = anime.filter(a => (list.animeIds || []).includes(a.id));
            return (
              <div key={list.id} className="list-card" onClick={() => openEdit(list)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 28 }}>{list.emoji || '📋'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{list.name}</div>
                    {list.description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{list.description}</div>}
                  </div>
                  <button className="btn-icon" onClick={e => { e.stopPropagation(); setDeleteModal(list); }} style={{ color: 'var(--danger)' }}>
                    <TrashIcon size={14} />
                  </button>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  {listAnime.length} anime
                </div>
                {/* Preview covers */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {listAnime.slice(0, 5).map(a => (
                    a.coverImage && <img key={a.id} src={a.coverImage} alt="" style={{ width: 36, height: 50, borderRadius: 4, objectFit: 'cover' }} />
                  ))}
                  {listAnime.length > 5 && (
                    <div style={{ width: 36, height: 50, borderRadius: 4, background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                      +{listAnime.length - 5}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {createModal && (
        <div className="modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }}>
            <h3 className="modal-title">
              {editList ? <><EditIcon size={18} style={{ marginRight: 6 }} /> Edit List</> : <><PlusIcon size={18} style={{ marginRight: 6 }} /> Create List</>}
            </h3>

            <div className="form-group">
              <label className="form-label">List Name</label>
              <input className="form-input" value={listName} onChange={e => setListName(e.target.value)} placeholder="e.g., Best Fights, Top OSTs" />
            </div>

            <div className="form-group">
              <label className="form-label">Emoji</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setListEmoji(e)} style={{
                    width: 40, height: 40, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: listEmoji === e ? 'var(--accent)' : 'var(--bg-input)', border: listEmoji === e ? 'none' : '1px solid var(--border)',
                    borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s'
                  }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <input className="form-input" value={listDesc} onChange={e => setListDesc(e.target.value)} placeholder="Short description..." />
            </div>

            <div className="form-group">
              <label className="form-label">Select Anime ({selectedAnime.size} selected)</label>
              <div className="search-container" style={{ marginBottom: 12 }}>
                <SearchIcon size={18} className="search-icon" />
                <input className="search-input" placeholder="Search anime..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div style={{ maxHeight: 300, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                {filteredAnime.map(a => (
                  <div key={a.id} onClick={() => {
                    setSelectedAnime(prev => {
                      const next = new Set(prev);
                      if (next.has(a.id)) next.delete(a.id);
                      else next.add(a.id);
                      return next;
                    });
                  }} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', cursor: 'pointer',
                    background: selectedAnime.has(a.id) ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 4,
                      background: selectedAnime.has(a.id) ? 'var(--accent)' : 'var(--bg-input)',
                      border: selectedAnime.has(a.id) ? 'none' : '2px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {selectedAnime.has(a.id) && <CheckCircleIcon size={12} style={{ color: 'white' }} />}
                    </div>
                    {a.coverImage && <img src={a.coverImage} alt="" style={{ width: 24, height: 34, borderRadius: 3, objectFit: 'cover' }} />}
                    <span style={{ fontSize: 13, flex: 1 }}>{a.title}</span>
                    {a.score > 0 && <span style={{ fontSize: 12, color: '#fbbf24' }}><StarIcon size={10} /> {a.score}</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setCreateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editList ? 'Update List' : 'Create List'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title"><TrashIcon size={18} style={{ marginRight: 6 }} /> Delete List</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Delete <strong>{deleteModal.emoji} {deleteModal.name}</strong>? The anime won't be removed from your collection.
            </p>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setDeleteModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDeleteList(deleteModal.id)}>Delete List</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
