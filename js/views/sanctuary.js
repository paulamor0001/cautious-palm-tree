// js/views/sanctuary.js
import { zoneAccuracy } from '../facts.js';
import {
  SPECIES_BY_ZONE, STAGE_JUVENILE_AT, STAGE_ADULT_AT,
} from '../constants.js';
import { sfx } from '../audio.js';

let speciesData = null;

async function loadSpecies() {
  if (speciesData) return speciesData;
  const res = await fetch('/data/species.json');
  speciesData = await res.json();
  return speciesData;
}

function stageFor(speciesKey, state) {
  const zone = speciesZone(speciesKey);
  const acc = zoneAccuracy(state.zones[String(zone)].facts);
  if (acc >= STAGE_ADULT_AT) return 'adult';
  if (acc >= STAGE_JUVENILE_AT) return 'juvenile';
  return 'hatchling';
}

function speciesZone(key) {
  for (const [zone, name] of Object.entries(SPECIES_BY_ZONE)) {
    if (name === key) return Number(zone);
  }
  return 1;
}

const STAGE_ICON = { hatchling: '🥚', juvenile: '🦖', adult: '🦕' };

export async function mount(container, ctx) {
  const species = await loadSpecies();
  container.innerHTML = '';
  const view = document.createElement('section');
  view.className = 'view';
  view.innerHTML = `
    <h1>Sanctuary</h1>
    <p class="subtitle">Your dinosaurs. Come back tomorrow — eggs tick once per play day.</p>
    <div class="sanctuary" data-role="root"></div>
  `;
  container.appendChild(view);
  render();

  // If any egg is ready, prompt to hatch (one at a time).
  const ready = ctx.state.incubating.find(e => e.ticksRemaining <= 0);
  if (ready) showHatch(ready);

  function render() {
    const root = view.querySelector('[data-role="root"]');
    const eggs = ctx.state.incubating.filter(e => e.ticksRemaining > 0);
    const dinos = ctx.state.sanctuary;

    root.innerHTML = `
      <div class="section-title">Eggs</div>
      ${eggs.length === 0
        ? `<div class="empty-state">No eggs yet — keep digging. About 1 in 10 finds is an egg.</div>`
        : `<div class="egg-row">${eggs.map(eggCard).join('')}</div>`
      }
      <div class="section-title">Dinosaurs</div>
      ${dinos.length === 0
        ? `<div class="empty-state">No dinos hatched yet. Eggs hatch after 3 days of practice.</div>`
        : `<div class="dino-row">${dinos.map(dinoCard).join('')}</div>`
      }
    `;
  }

  function eggCard(egg) {
    return `
      <div class="egg">
        <div class="ticks">${egg.ticksRemaining}</div>
        <div class="ticks-label">days</div>
      </div>
    `;
  }

  function dinoCard(d) {
    const stage = stageFor(d.species, ctx.state);
    return `
      <div class="dino">
        <div class="icon">${STAGE_ICON[stage]}</div>
        <div class="name">${escapeHtml(d.name)}</div>
        <div class="stage">${stage} ${species[d.species].displayName}</div>
      </div>
    `;
  }

  function showHatch(egg) {
    const info = species[egg.species];
    const modal = document.createElement('div');
    modal.className = 'fact-modal hatch-modal';
    modal.innerHTML = `
      <div class="panel" role="dialog">
        <h3>An egg hatched!</h3>
        <p>It's a baby ${info.displayName}. Give it a name.</p>
        <input type="text" maxlength="12" placeholder="Name (12 letters)" />
        <button type="button" data-action="confirm">Welcome it</button>
      </div>
    `;
    container.appendChild(modal);
    const input = modal.querySelector('input');
    input.focus();
    modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
      const raw = input.value.trim().slice(0, 12) || info.displayName;
      ctx.state.incubating = ctx.state.incubating.filter(e => e.id !== egg.id);
      ctx.state.sanctuary.push({
        id: egg.id,
        species: egg.species,
        name: raw,
        hatchedAt: new Date().toISOString(),
      });
      ctx.save();
      sfx.fanfare();
      modal.remove();
      render();
      const next = ctx.state.incubating.find(e => e.ticksRemaining <= 0);
      if (next) showHatch(next);
    });
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}
