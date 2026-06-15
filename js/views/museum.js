// js/views/museum.js
import { BONES_PER_SPECIES, ALL_SPECIES } from '../constants.js';

const BONE_SVG = `
  <circle cx="4" cy="5" r="4"/>
  <circle cx="4" cy="11" r="4"/>
  <circle cx="28" cy="5" r="4"/>
  <circle cx="28" cy="11" r="4"/>
  <rect x="4" y="5" width="24" height="6"/>
`;

function bonesRow(collected, total, tint) {
  let html = '<div class="bones" style="--bone-tint:' + tint + ';">';
  for (let i = 0; i < total; i++) {
    const filled = i < collected ? 'filled' : 'empty';
    html += `<svg class="bone ${filled}" viewBox="0 0 32 16" aria-hidden="true" fill="currentColor">${BONE_SVG}</svg>`;
  }
  html += '</div>';
  return html;
}

export function mount(container, ctx) {
  const species = ctx.species;

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
    const progressBlock = zoneUnlocked
      ? bonesRow(museumEntry.bones, BONES_PER_SPECIES, info.tint)
      : `<div class="progress">Locked (${zone}× zone)</div>`;
    card.innerHTML = `
      <div class="silhouette" style="color:${info.tint};">
        <svg viewBox="${info.viewBox || '0 0 100 60'}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="currentColor">${info.silhouette}</svg>
      </div>
      <div class="name">${info.displayName}</div>
      ${progressBlock}
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
  const credit = info.credit;
  const creditLine = credit
    ? `<p class="credit">Silhouette: <em>${credit.artist || 'Public domain'}</em> · ${credit.license}</p>`
    : '';
  const modal = document.createElement('div');
  modal.className = 'fact-modal';
  modal.innerHTML = `
    <div class="panel" role="dialog" aria-modal="true" aria-label="${info.displayName}">
      <h3>${info.displayName}</h3>
      <p>${info.fact}</p>
      ${creditLine}
      <button type="button">Close</button>
    </div>
  `;
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.tagName === 'BUTTON') modal.remove();
  });
  container.appendChild(modal);
}
