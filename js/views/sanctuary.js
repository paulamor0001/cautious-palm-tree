// js/views/sanctuary.js
import { zoneAccuracy } from '../facts.js';
import {
  SPECIES_BY_ZONE, STAGE_JUVENILE_AT, STAGE_ADULT_AT,
} from '../constants.js';
import { sfx } from '../audio.js';

const STAGE_ORDER = { hatchling: 0, juvenile: 1, adult: 2 };
const STAGE_SCALE = { hatchling: 0.5, juvenile: 0.75, adult: 1 };

function speciesZone(key) {
  for (const [zone, name] of Object.entries(SPECIES_BY_ZONE)) {
    if (name === key) return Number(zone);
  }
  return 1;
}

function computedStageFor(speciesKey, state) {
  const zone = speciesZone(speciesKey);
  const acc = zoneAccuracy(state.zones[String(zone)].facts);
  if (acc >= STAGE_ADULT_AT) return 'adult';
  if (acc >= STAGE_JUVENILE_AT) return 'juvenile';
  return 'hatchling';
}

function stageFor(dino, state) {
  const computed = computedStageFor(dino.species, state);
  const stored = dino.stage ?? 'hatchling';
  return STAGE_ORDER[computed] > STAGE_ORDER[stored] ? computed : stored;
}

export function mount(container, ctx) {
  const species = ctx.species;
  container.innerHTML = '';
  const view = document.createElement('section');
  view.className = 'view';
  view.innerHTML = `
    <h1>Sanctuary</h1>
    <p class="subtitle">Your dinosaurs. Come back tomorrow — eggs tick once per play day.</p>
    <div class="sanctuary" data-role="root"></div>
  `;
  container.appendChild(view);
  promoteStoredStages();
  render();

  const ready = ctx.state.incubating.find(e => e.ticksRemaining <= 0);
  if (ready) showHatch(ready);

  function promoteStoredStages() {
    let changed = false;
    for (const dino of ctx.state.sanctuary) {
      const next = stageFor(dino, ctx.state);
      if (next !== dino.stage) {
        dino.stage = next;
        changed = true;
      }
    }
    if (changed) ctx.save();
  }

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
    const tint = species[egg.species]?.tint ?? '#5a8c3d';
    return `
      <div class="egg" style="--egg-tint:${tint};">
        <div class="egg-shell"></div>
        <div class="egg-meta">
          <div class="ticks">${egg.ticksRemaining}</div>
          <div class="ticks-label">${egg.ticksRemaining === 1 ? 'day' : 'days'}</div>
        </div>
      </div>
    `;
  }

  function dinoCard(d) {
    const stage = d.stage ?? 'hatchling';
    const info = species[d.species];
    const scale = STAGE_SCALE[stage] ?? 1;
    const isHatchling = stage === 'hatchling';
    const isAdult = stage === 'adult';
    return `
      <div class="dino stage-${stage}">
        <div class="icon" style="color:${info.tint};">
          ${isHatchling ? '<div class="egg-shell-bg" aria-hidden="true"></div>' : ''}
          <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="transform:scale(${scale});"><path d="${info.silhouette}" fill="currentColor"/></svg>
          ${isAdult ? '<div class="accent" aria-hidden="true"></div>' : ''}
        </div>
        <div class="name">${escapeHtml(d.name)}</div>
        <div class="stage">${stage} ${info.displayName}</div>
      </div>
    `;
  }

  function showHatch(egg) {
    const info = species[egg.species];
    const modal = document.createElement('div');
    modal.className = 'fact-modal hatch-modal';
    modal.innerHTML = `
      <div class="panel" role="dialog" aria-modal="true">
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
      const newDino = {
        id: egg.id,
        species: egg.species,
        name: raw,
        stage: 'hatchling',
        hatchedAt: new Date().toISOString(),
      };
      newDino.stage = stageFor(newDino, ctx.state);
      ctx.state.sanctuary.push(newDino);
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
