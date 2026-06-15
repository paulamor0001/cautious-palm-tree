// js/views/museum.js
import { BONES_PER_SPECIES, ALL_SPECIES } from '../constants.js';

let speciesData = null;

async function loadSpecies() {
  if (speciesData) return speciesData;
  const res = await fetch('/data/species.json');
  speciesData = await res.json();
  return speciesData;
}

export async function mount(container, ctx) {
  const species = await loadSpecies();

  container.innerHTML = '';
  const view = document.createElement('section');
  view.className = 'view';
  view.innerHTML = `
    <h1>Museum</h1>
    <p class="subtitle">Tap a completed skeleton to read about the species.</p>
    <div class="museum-grid" data-role="grid"></div>
  `;
  container.appendChild(view);

  const grid = view.querySelector('[data-role="grid"]');

  for (const key of ALL_SPECIES) {
    const info = species[key];
    const museumEntry = ctx.state.museum[key];
    const zone = info.zone;
    const zoneUnlocked = ctx.state.zones[String(zone)].unlocked;
    const isComplete = museumEntry.bones >= BONES_PER_SPECIES;

    const card = document.createElement('div');
    card.className = `museum-card ${isComplete ? 'complete' : ''} ${zoneUnlocked ? '' : 'locked'}`;
    card.innerHTML = `
      <div class="silhouette" style="background:${info.tint};">${zoneUnlocked ? '🦴' : '?'}</div>
      <div class="name">${info.displayName}</div>
      <div class="progress">${zoneUnlocked ? `${museumEntry.bones}/${BONES_PER_SPECIES} bones` : `Locked (${zone}× zone)`}</div>
      ${isComplete ? `<button class="fact-btn" type="button" data-species="${key}">Read fact</button>` : ''}
    `;
    grid.appendChild(card);
  }

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.fact-btn');
    if (!btn) return;
    const info = species[btn.dataset.species];
    showFact(info, container);
  });
}

function showFact(info, container) {
  const modal = document.createElement('div');
  modal.className = 'fact-modal';
  modal.innerHTML = `
    <div class="panel" role="dialog" aria-label="${info.displayName}">
      <h3>${info.displayName}</h3>
      <p>${info.fact}</p>
      <button type="button">Close</button>
    </div>
  `;
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.tagName === 'BUTTON') modal.remove();
  });
  container.appendChild(modal);
}
