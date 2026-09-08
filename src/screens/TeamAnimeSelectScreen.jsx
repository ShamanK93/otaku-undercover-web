import React, { useMemo, useState } from 'react';
import AnimeCheckboxRow from '../components/AnimeCheckboxRow';
import PrimaryButton from '../components/PrimaryButton';
import { CHARACTER_DATABASE } from '../data/characterDatabase';

export default function TeamAnimeSelectScreen({ selectedIds, setSelectedIds, onBack, onNext }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CHARACTER_DATABASE;
    return CHARACTER_DATABASE.filter((a) => a.title.toLowerCase().includes(q));
  }, [search]);

  const allSelected = selectedIds.length > 0 && selectedIds.length === CHARACTER_DATABASE.length;
  const totalCharacters = useMemo(
    () => CHARACTER_DATABASE.filter((a) => selectedIds.includes(a.id)).reduce((sum, a) => sum + a.characters.length, 0),
    [selectedIds]
  );

  function toggle(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : CHARACTER_DATABASE.map((a) => a.id));
  }

  return (
    <div className="screen">
      <button type="button" className="back-link" onClick={onBack}>← Retour</button>

      <p className="filter-eyebrow">{totalCharacters} personnage{totalCharacters > 1 ? 's' : ''} dans le pool</p>
      <h2 className="screen-title">Univers autorisés</h2>

      <input
        type="text"
        className="text-input"
        style={{ width: '100%', marginBottom: 18 }}
        placeholder="Rechercher une franchise..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="filter-section-head">
        <span className="filter-section-title">Franchises</span>
        <button type="button" className="select-all-link" onClick={toggleAll}>
          {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
        </button>
      </div>

      <div className="anime-grid" style={{ marginBottom: 16 }}>
        {filtered.map((anime) => (
          <AnimeCheckboxRow
            key={anime.id}
            title={anime.title}
            checked={selectedIds.includes(anime.id)}
            onToggle={() => toggle(anime.id)}
          />
        ))}
      </div>

      <PrimaryButton title="Valider la sélection" disabled={selectedIds.length === 0} onClick={onNext} />
    </div>
  );
}
