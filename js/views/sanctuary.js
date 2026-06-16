// js/views/sanctuary.js
import { zoneAccuracy } from '../facts.js';
import {
  SPECIES_BY_ZONE, STAGE_JUVENILE_AT, STAGE_ADULT_AT,
} from '../constants.js';
import { sfx } from '../audio.js';

const STAGE_ORDER = { hatchling: 0, juvenile: 1, adult: 2 };
const STAGE_SCALE = { hatchling: 0.55, juvenile: 0.78, adult: 1 };

// Small inline icons used in section headers + stage labels.
const LEAF_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 19c0-9 6-15 15-15-.5 9-6 15-15 15zm1.5-1.5C12 16 16 12 18 6.5c-6 1.5-10 5.5-11.5 11z"/></svg>';
const FOOT_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><ellipse cx="12" cy="16" rx="5.5" ry="4.5"/><ellipse cx="6.5" cy="8" rx="2" ry="2.4"/><ellipse cx="12" cy="5.5" rx="2" ry="2.4"/><ellipse cx="17.5" cy="8" rx="2" ry="2.4"/></svg>';
const STAGE_ICON = {
  hatchling: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3c3.3 0 6 5 6 9a6 6 0 1 1-12 0c0-4 2.7-9 6-9zm-3.6 8.2 2.2 1.6 1.4-2.2 1.6 2 2-1.4" stroke="#fff" stroke-width="0.6" fill="none"/></svg>',
  juvenile: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3l2.6 5.4 5.9.7-4.4 4 1.2 5.8L12 16.1 6.7 18.9l1.2-5.8L3.5 9.1l5.9-.7z"/></svg>',
  adult: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3l1.6 4.3L18 9l-4.4 1.7L12 15l-1.6-4.3L6 9l4.4-1.7zM5 17l.8 2 2 .8-2 .8L5 22.5l-.8-2-2-.8 2-.8zM19 16l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>',
};

// Decorative SVG fragments for the background scene.
const SCENE_SVG = `
  <svg class="sanctuary-scene" viewBox="0 0 400 460" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fef3d2"/>
        <stop offset="55%" stop-color="#d2e9b0"/>
        <stop offset="100%" stop-color="#a7cc7d"/>
      </linearGradient>
      <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7fa64a"/>
        <stop offset="100%" stop-color="#3f6520"/>
      </linearGradient>
    </defs>

    <!-- Sky band -->
    <rect x="0" y="0" width="400" height="460" fill="url(#sky)"/>

    <!-- Sun glow -->
    <circle cx="320" cy="60" r="80" fill="#fff3c8" opacity="0.55"/>
    <circle cx="320" cy="60" r="38" fill="#fff1b3" opacity="0.7"/>

    <!-- Far mountains -->
    <path d="M0 175 L60 130 L110 165 L160 110 L220 160 L280 125 L340 155 L400 130 L400 200 L0 200 Z"
          fill="#7fa6a3" opacity="0.42"/>
    <!-- Mid mountains -->
    <path d="M0 210 L50 170 L100 200 L160 160 L210 200 L260 175 L320 205 L400 175 L400 240 L0 240 Z"
          fill="#5b8a6b" opacity="0.55"/>

    <!-- Ground -->
    <rect x="0" y="225" width="400" height="235" fill="url(#ground)"/>

    <!-- Distant cycad/ginkgo trees on horizon -->
    <g opacity="0.55" fill="#3f6520">
      <path d="M40 225 q-6 -22 -3 -36 q3 -10 9 -10 q6 0 9 10 q3 14 -3 36 z"/>
      <path d="M85 225 q-8 -28 -4 -44 q4 -12 12 -12 q8 0 12 12 q4 16 -4 44 z"/>
      <path d="M360 225 q-7 -24 -3 -38 q4 -10 10 -10 q6 0 10 10 q4 14 -3 38 z"/>
    </g>

    <!-- Mid ginkgo tree (left) -->
    <g transform="translate(20 225)" fill="#2f5018">
      <rect x="-2" y="-4" width="4" height="-46" fill="#3a2a1a" transform="scale(1 -1)"/>
      <path d="M0 -50 q-22 -4 -28 -18 q14 4 22 14 q-10 -16 -4 -30 q10 14 10 28 q4 -14 16 -22 q-2 16 -10 28 q14 -10 28 -8 q-12 12 -34 8 z"/>
    </g>

    <!-- Mid cycad cluster (right) -->
    <g transform="translate(370 235)" fill="#365a1a">
      <path d="M0 0 q-3 -18 -16 -28 q4 18 0 28 z"/>
      <path d="M0 0 q3 -18 16 -28 q-4 18 0 28 z"/>
      <path d="M0 0 q-1 -22 -6 -36 q-3 22 -1 36 z"/>
      <path d="M0 0 q1 -22 6 -36 q3 22 1 36 z"/>
      <ellipse cx="0" cy="-4" rx="6" ry="3" fill="#604c20"/>
    </g>

    <!-- Foreground ferns scattered along the ground -->
    <g fill="#244010" opacity="0.85">
      <!-- left fern -->
      <g transform="translate(-4 360)">
        <path d="M0 0 q-4 -28 -2 -52 q2 12 4 24 q-8 -6 -14 -16 q4 14 12 22 q-6 0 -14 -4 q6 8 14 10 q-6 4 -12 4 q8 2 14 0 z"/>
      </g>
      <!-- mid-left fern -->
      <g transform="translate(75 410)">
        <path d="M0 0 q-6 -34 -2 -64 q2 14 6 28 q-10 -8 -16 -18 q4 14 14 22 q-8 0 -16 -2 q8 6 16 6 q-6 4 -12 4 q10 2 14 0 q-4 6 -10 8 q12 0 16 -4 z"/>
      </g>
      <!-- right fern -->
      <g transform="translate(380 380)">
        <path d="M0 0 q4 -28 2 -52 q-2 12 -4 24 q8 -6 14 -16 q-4 14 -12 22 q6 0 14 -4 q-6 8 -14 10 q6 4 12 4 q-8 2 -14 0 z"/>
      </g>
      <!-- behind right -->
      <g transform="translate(320 440)">
        <path d="M0 0 q-6 -40 0 -72 q4 16 4 30 q10 -10 16 -22 q-6 18 -16 26 q10 0 18 -4 q-10 10 -20 10 q8 6 14 8 q-12 0 -18 -6 z"/>
      </g>
    </g>

    <!-- Small grass tufts in the foreground -->
    <g stroke="#1f3a0c" stroke-width="1.4" opacity="0.6" fill="none">
      <path d="M30 440 q2 -10 0 -16 M34 440 q4 -8 2 -16 M38 440 q-1 -10 -3 -16"/>
      <path d="M140 450 q2 -10 0 -16 M144 450 q4 -8 2 -16 M148 450 q-1 -10 -3 -16"/>
      <path d="M210 445 q2 -10 0 -16 M214 445 q4 -8 2 -16 M218 445 q-1 -10 -3 -16"/>
      <path d="M280 450 q2 -10 0 -16 M284 450 q4 -8 2 -16 M288 450 q-1 -10 -3 -16"/>
    </g>

    <!-- Pterosaur silhouette flying high (single decorative path) -->
    <g class="sanctuary-pterosaur" fill="#3a4a48" opacity="0.65">
      <path d="M0 0 q12 -10 24 -2 q-6 -2 -12 0 q10 -2 18 4 q-12 -2 -22 2 q10 0 18 6 q-14 -2 -26 -4 z"/>
    </g>
  </svg>
`;

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

// Pick up to 4 ghost-preview species: unlocked zones, no live dino of that species,
// no egg currently incubating, plus fill with the smallest locked zones to keep
// the empty state interesting for brand-new players.
function ghostSpeciesFor(state) {
  const alreadyShown = new Set([
    ...state.sanctuary.map(d => d.species),
    ...state.incubating.map(e => e.species),
  ]);
  const candidates = [];
  for (const z of Object.keys(SPECIES_BY_ZONE).map(Number).sort((a, b) => a - b)) {
    const key = SPECIES_BY_ZONE[z];
    if (alreadyShown.has(key)) continue;
    const unlocked = state.zones[String(z)]?.unlocked;
    candidates.push({ key, unlocked, zone: z });
  }
  // Prefer unlocked species first, then locked (so progression hints at the future).
  candidates.sort((a, b) => (b.unlocked === a.unlocked ? a.zone - b.zone : (b.unlocked ? 1 : -1)));
  return candidates.slice(0, 4);
}

export function mount(container, ctx) {
  const species = ctx.species;
  container.innerHTML = '';
  const view = document.createElement('section');
  view.className = 'view sanctuary-view';
  view.innerHTML = `
    <h1>Sanctuary</h1>
    <p class="subtitle" data-role="subtitle"></p>
    <div class="sanctuary" data-role="root">
      ${SCENE_SVG}
      <div class="sanctuary-content" data-role="content"></div>
    </div>
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

  function subtitleFor() {
    const hatched = ctx.state.sanctuary.length;
    const eggs = ctx.state.incubating.filter(e => e.ticksRemaining > 0).length;
    if (hatched === 0 && eggs === 0) {
      return 'Your sanctuary is waiting — find an egg at the dig site to begin.';
    }
    const parts = [];
    if (hatched > 0) parts.push(`${hatched} hatched`);
    if (eggs > 0) parts.push(`${eggs} incubating`);
    return `Your prehistoric preserve · ${parts.join(' · ')}`;
  }

  function render() {
    const content = view.querySelector('[data-role="content"]');
    view.querySelector('[data-role="subtitle"]').textContent = subtitleFor();
    const eggs = ctx.state.incubating.filter(e => e.ticksRemaining > 0);
    const dinos = ctx.state.sanctuary;

    content.innerHTML = `
      <div class="section-title">
        <span class="section-title-icon">${LEAF_ICON}</span>
        <span>Nesting area</span>
      </div>
      ${eggs.length === 0
        ? `<div class="empty-state empty-state-eggs">No eggs in the nest — keep digging. About 1 in 10 finds is an egg.</div>`
        : `<div class="egg-row">${eggs.map(eggCard).join('')}</div>`
      }
      <div class="section-title">
        <span class="section-title-icon">${FOOT_ICON}</span>
        <span>Dinosaurs</span>
      </div>
      ${dinos.length === 0
        ? emptyDinoState()
        : `<div class="dino-row">${dinos.map(dinoCard).join('')}</div>`
      }
    `;
  }

  function eggCard(egg) {
    const tint = species[egg.species]?.tint ?? '#5a8c3d';
    const wobbleClass = egg.ticksRemaining === 1
      ? 'egg-wobble-soon'
      : (egg.ticksRemaining === 2 ? 'egg-wobble-slow' : 'egg-wobble-gentle');
    const aboutToHatch = egg.ticksRemaining === 1 ? 'about-to-hatch' : '';
    return `
      <div class="egg-plot ${aboutToHatch}" title="${species[egg.species]?.displayName ?? 'Egg'}">
        <div class="nest" aria-hidden="true">
          <svg viewBox="0 0 80 36" preserveAspectRatio="xMidYMid meet">
            <ellipse cx="40" cy="26" rx="36" ry="9" fill="#6b4423" opacity="0.55"/>
            <g stroke="#4a2e18" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.85">
              <path d="M10 24 q14 -10 30 -10"/>
              <path d="M14 28 q18 -8 32 -8"/>
              <path d="M22 30 q14 -6 28 -8"/>
              <path d="M30 22 q14 -4 24 -2"/>
            </g>
            <g stroke="#7a4d2a" stroke-width="2" stroke-linecap="round" fill="none">
              <path d="M16 27 q16 -7 28 -7"/>
              <path d="M40 30 q14 -4 22 -4"/>
              <path d="M28 26 l8 -4"/>
              <path d="M44 24 l8 -2"/>
            </g>
          </svg>
        </div>
        <div class="egg ${wobbleClass}" style="--egg-tint:${tint};">
          <div class="egg-highlight" aria-hidden="true"></div>
          <div class="egg-stripe" aria-hidden="true"></div>
          <div class="egg-ticks">
            <span class="ticks-num">${egg.ticksRemaining}</span>
            <span class="ticks-word">${egg.ticksRemaining === 1 ? 'day' : 'days'}</span>
          </div>
        </div>
      </div>
    `;
  }

  function dinoCard(d) {
    const stage = d.stage ?? 'hatchling';
    const info = species[d.species];
    const scale = STAGE_SCALE[stage] ?? 1;
    const isAdult = stage === 'adult';
    const stageLabel = `${stage}`;
    return `
      <div class="dino stage-${stage}">
        <div class="vignette" aria-hidden="true">
          <svg viewBox="0 0 140 90" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="vg-sky-${d.id}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#fef0c8"/>
                <stop offset="100%" stop-color="#cde6a4"/>
              </linearGradient>
              <linearGradient id="vg-ground-${d.id}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#8db75c"/>
                <stop offset="100%" stop-color="#3f6520"/>
              </linearGradient>
            </defs>
            <rect width="140" height="90" fill="url(#vg-sky-${d.id})"/>
            <path d="M0 55 L25 40 L55 52 L90 35 L120 50 L140 42 L140 70 L0 70 Z" fill="#7fa6a3" opacity="0.45"/>
            <rect y="60" width="140" height="30" fill="url(#vg-ground-${d.id})"/>
            <g fill="#244010" opacity="0.85">
              <path d="M10 70 q-3 -16 0 -28 q3 8 4 14 q-6 -2 -10 -8 q3 8 9 12 q-4 0 -10 -2 z"/>
              <path d="M126 70 q3 -18 0 -32 q-3 8 -4 16 q6 -2 10 -10 q-3 10 -9 14 q4 0 10 -2 z"/>
            </g>
            <g stroke="#1f3a0c" stroke-width="1" opacity="0.55" fill="none">
              <path d="M28 78 q1 -6 0 -10 M32 78 q2 -5 1 -10 M70 80 q1 -6 0 -10 M74 80 q2 -5 1 -10 M104 78 q1 -6 0 -10 M108 78 q2 -5 1 -10"/>
            </g>
          </svg>
        </div>
        <div class="icon" style="color:${info.tint};">
          <svg viewBox="${info.viewBox || '0 0 100 60'}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="currentColor" style="transform:scale(${scale});">${info.silhouette}</svg>
          ${isAdult ? '<div class="accent" aria-hidden="true"></div>' : ''}
        </div>
        <div class="name">${escapeHtml(d.name)}</div>
        <div class="stage">
          <span class="stage-icon">${STAGE_ICON[stage]}</span>
          <span>${stageLabel} ${info.displayName}</span>
        </div>
      </div>
    `;
  }

  function emptyDinoState() {
    const ghosts = ghostSpeciesFor(ctx.state);
    if (ghosts.length === 0) {
      return `<div class="empty-state">Your sanctuary is full of life — every species accounted for!</div>`;
    }
    return `
      <div class="empty-state empty-state-dinos">
        <div class="empty-headline">Your sanctuary awaits…</div>
        <div class="ghost-row">
          ${ghosts.map(g => {
            const info = species[g.key];
            if (!info) return '';
            return `
              <div class="ghost" style="color:${info.tint};" title="${info.displayName}">
                <div class="ghost-silhouette">
                  <svg viewBox="${info.viewBox || '0 0 100 60'}" fill="currentColor" aria-hidden="true">${info.silhouette}</svg>
                </div>
                <div class="ghost-name">${info.displayName}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="empty-sub">Eggs hatch after 3 days of practice — keep digging.</div>
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
