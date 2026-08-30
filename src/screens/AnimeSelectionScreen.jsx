import React, { useMemo, useState } from 'react';
import AnimeCheckboxRow from '../components/AnimeCheckboxRow';
import PrimaryButton from '../components/PrimaryButton';
import { ANIME_LIST } from '../data/animeDatabase';
import { countMatchingPairs } from '../utils/gameLogic';

const TYPE_OPTIONS = [
  { id: 'personnage', label: 'Personnage' },
  { id: 'titre', label: 'Titre' },
  { id: 'lieu', label: 'Lieu' },
  { id: 'groupe', label: 'Groupe' },
  { id: 'evenement', label: 'Événement' },
  { id: 'objet', label: 'Objet' },
  { id: 'pouvoir', label: 'Pouvoir' },
];

const DIFFICULTY_OPTIONS = [
  { id: 'facile', label: 'Facile' },
  { id: 'moyen', label: 'Moyen' },
  { id: 'difficile', label: 'Difficile' },
];

export default function AnimeSelectionScreen({
  selectedIds,
  setSelectedIds,
  selectedTypes,
  setSelectedTypes,
  selectedDifficulties,
  setSelectedDifficulties,
  onBack,
  onNext,
}) {
  const [search, setSearch] = useState('');

  const filteredAnime = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ANIME_LIST;
    return ANIME_LIST.filter((a) => a.title.toLowerCase().includes(q));
  }, [search]);

  const allSelected = selectedIds.length > 0 && selectedIds.length === ANIME_LIST.length;

  const availableCount = useMemo(
    () =>
      countMatchingPairs({
        animeList: ANIME_LIST,
        selectedAnimeIds: selectedIds,
        selectedTypes,
        selectedDifficulties,
      }),
    [selectedIds, selectedTypes, selectedDifficulties]
  );

  function toggleAnime(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : ANIME_LIST.map((a) => a.id));
  }

  function toggleType(id) {
    setSelectedTypes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleDifficulty(id) {
    setSelectedDifficulties((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="screen">
      <button type="button" className="back-link" onClick={onBack}>← Retour</button>

      <p className="filter-eyebrow">{availableCount} paire{availableCount > 1 ? 's' : ''} disponible{availableCount > 1 ? 's' : ''}</p>
      <h2 className="screen-title">Choisis tes animés</h2>

      <input
        type="text"
        className="text-input"
        style={{ width: '100%', marginBottom: 18 }}
        placeholder="Rechercher une franchise..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="screen-list">
        <div className="filter-section-head">
          <span className="filter-section-title">Franchises</span>
          <button type="button" className="select-all-link" onClick={toggleAll}>
            {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        </div>
        <div className="anime-grid" style={{ flex: 'none', maxHeight: 260 }}>
          {filteredAnime.map((anime) => (
            <AnimeCheckboxRow
              key={anime.id}
              title={anime.title}
              checked={selectedIds.includes(anime.id)}
              onToggle={() => toggleAnime(anime.id)}
            />
          ))}
        </div>

        <div className="filter-section-head" style={{ marginTop: 18 }}>
          <span className="filter-section-title">Types</span>
        </div>
        <div className="anime-grid" style={{ flex: 'none' }}>
          {TYPE_OPTIONS.map((t) => (
            <AnimeCheckboxRow
              key={t.id}
              title={t.label}
              checked={selectedTypes.includes(t.id)}
              onToggle={() => toggleType(t.id)}
            />
          ))}
        </div>

        <div className="filter-section-head" style={{ marginTop: 18 }}>
          <span className="filter-section-title">Difficultés</span>
        </div>
        <div className="anime-grid" style={{ flex: 'none' }}>
          {DIFFICULTY_OPTIONS.map((d) => (
            <AnimeCheckboxRow
              key={d.id}
              title={d.label}
              checked={selectedDifficulties.includes(d.id)}
              onToggle={() => toggleDifficulty(d.id)}
            />
          ))}
        </div>
      </div>

      <PrimaryButton
        title="Valider la sélection"
        disabled={selectedIds.length === 0}
        onClick={onNext}
        style={{ marginTop: 16 }}
      />
    </div>
  );
}
