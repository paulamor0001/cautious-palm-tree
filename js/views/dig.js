// js/views/dig.js
import {
  pickFactKey, parseFactKey, generateDistractors, updateFactAfterAnswer,
  hasUnlockedNextZone,
} from '../facts.js';
import { sfx } from '../audio.js';
import {
  ZONES, SPECIES_BY_ZONE, BONES_PER_SPECIES, EGG_CHANCE, EGG_TICKS_TO_HATCH,
} from '../constants.js';

const QUESTIONS_PER_BONE = 6;

// Decorative SVG: paintbrush + small pick, tossed at the dig site.
const TOOLS_SVG = `
  <svg class="dig-tool dig-tool-brush" viewBox="0 0 64 32" aria-hidden="true">
    <g transform="rotate(-18 32 16)">
      <rect x="6" y="13" width="30" height="6" rx="1.5" fill="#7a4a1f"/>
      <rect x="6" y="13" width="30" height="2" fill="#a16a35"/>
      <rect x="34" y="11" width="6" height="10" rx="1" fill="#d6b56a"/>
      <path d="M40 11 L58 8 L58 24 L40 21 Z" fill="#f0d49a"/>
      <path d="M40 12 L57 10 M40 14 L57 13 M40 16 L57 16 M40 18 L57 19 M40 20 L57 22"
            stroke="#c79a4f" stroke-width="0.6" fill="none"/>
    </g>
  </svg>
  <svg class="dig-tool dig-tool-pick" viewBox="0 0 64 36" aria-hidden="true">
    <g transform="rotate(22 32 18)">
      <rect x="10" y="20" width="34" height="4" rx="1" fill="#6b4423"/>
      <rect x="10" y="20" width="34" height="1.2" fill="#8a5a30"/>
      <path d="M40 14 L56 8 L58 12 L42 22 Z" fill="#b8b3a8"/>
      <path d="M40 14 L42 22 L36 24 L34 18 Z" fill="#8a8578"/>
      <path d="M40 14 L56 8 L57 10 L41 17 Z" fill="#d4cfc2"/>
    </g>
  </svg>
`;

// Small location-pin glyph for the zone marker.
const PIN_SVG = `
  <svg class="zone-pin" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 1.5 C5 1.5 3 3.5 3 6.2 C3 9.5 8 14.5 8 14.5 S13 9.5 13 6.2 C13 3.5 11 1.5 8 1.5 Z" fill="currentColor"/>
    <circle cx="8" cy="6.2" r="2" fill="#1f140a"/>
  </svg>
`;

// Trophy sparkle for the discovery moment.
const SPARKLE_SVG = `
  <svg class="dig-sparkle" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 1 L13.5 9 L21 12 L13.5 14 L12 22 L10.5 14 L3 12 L10.5 9 Z" fill="currentColor"/>
  </svg>
`;

export function mount(container, ctx) {
  let zone = ctx.suggestedZone ?? firstUnlockedZone(ctx.state);
  if (!ctx.state.zones[String(zone)].unlocked) zone = firstUnlockedZone(ctx.state);

  let questionsThisBone = 0;
  let currentFact = null;
  let wrongCountThisQ = 0;
  let inputLocked = false;
  let mounted = true;
  const timeouts = new Set();

  const species = SPECIES_BY_ZONE[zone];
  const speciesInfo = ctx.species[species];
  const viewBox = speciesInfo.viewBox || '0 0 100 60';
  // Tint the buried bone: a bit warmer/darker than dirt so it reads as fossil in stone.
  const fossilTint = darken(speciesInfo.tint || '#a78b5f', 0.12);

  container.innerHTML = '';
  const view = document.createElement('section');
  view.className = 'view';
  view.innerHTML = `
    <div class="dig" style="--species-tint:${speciesInfo.tint}; --fossil-tint:${fossilTint};">
      <div class="dig-bg" aria-hidden="true">
        <div class="dig-sun"></div>
        <div class="dig-strata"></div>
      </div>
      <div class="dig-header">
        <div class="zone-pill">${PIN_SVG}<span>Dig site &middot; ${zone}× zone</span></div>
      </div>
      <div class="question" data-role="question">&mdash;</div>
      <div class="dig-site" data-role="site">
        ${TOOLS_SVG}
        <div class="dig-pit">
          <div class="dig-fossil" aria-hidden="true">
            <svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" fill="currentColor" preserveAspectRatio="xMidYMid meet">${speciesInfo.silhouette}</svg>
          </div>
          <div class="dig-dirt" data-role="dirt"></div>
          <div class="dig-dust" data-role="dust"></div>
          <div class="dig-glow" data-role="glow"></div>
          <div class="dig-trophy" data-role="trophy">${SPARKLE_SVG}</div>
        </div>
      </div>
      <div class="tiles" data-role="tiles"></div>
      <div class="reveal-msg" data-role="reveal"></div>
    </div>
  `;
  container.appendChild(view);

  const qEl = view.querySelector('[data-role="question"]');
  const dirtEl = view.querySelector('[data-role="dirt"]');
  const dustEl = view.querySelector('[data-role="dust"]');
  const glowEl = view.querySelector('[data-role="glow"]');
  const trophyEl = view.querySelector('[data-role="trophy"]');
  const tilesEl = view.querySelector('[data-role="tiles"]');
  const revealEl = view.querySelector('[data-role="reveal"]');
  const pitEl = view.querySelector('.dig-pit');
  const fossilEl = view.querySelector('.dig-fossil');

  // Initialise dirt cover at 100%.
  setDirtForProgress(0);

  function schedule(fn, ms) {
    const id = setTimeout(() => {
      timeouts.delete(id);
      if (mounted) fn();
    }, ms);
    timeouts.add(id);
    return id;
  }

  nextQuestion();

  function firstUnlockedZone(state) {
    return ZONES.find(z => state.zones[String(z)].unlocked);
  }

  function nextQuestion() {
    const zoneFacts = ctx.state.zones[String(zone)].facts;
    const key = pickFactKey(zoneFacts, Math.random);
    const { a, b, answer } = parseFactKey(key);
    const distractors = generateDistractors(a, b, Math.random);
    const correctIndex = Math.floor(Math.random() * 4);
    const options = [...distractors];
    options.splice(correctIndex, 0, answer);
    currentFact = { a, b, answer, key, correctIndex, options };
    wrongCountThisQ = 0;
    inputLocked = false;
    renderQuestion();
  }

  function renderQuestion() {
    qEl.textContent = `${currentFact.a} × ${currentFact.b} = ?`;
    tilesEl.innerHTML = '';
    currentFact.options.forEach((value, idx) => {
      const btn = document.createElement('button');
      btn.className = 'tile';
      btn.type = 'button';
      btn.textContent = value;
      btn.addEventListener('click', () => handleTap(idx, btn));
      tilesEl.appendChild(btn);
    });
  }

  function handleTap(idx, btn) {
    if (inputLocked) return;
    if (idx === currentFact.correctIndex) onRight(btn);
    else onWrong(btn);
  }

  function onRight(btn) {
    inputLocked = true;
    sfx.correct();
    btn.classList.add('correct');
    const outcome = wrongCountThisQ > 0 ? 'shown' : 'right';
    persistAnswer(currentFact.key, outcome);
    advanceBoneProgress();
    spawnDust();
    schedule(maybeRevealOrAdvance, 600);
  }

  function onWrong(btn) {
    inputLocked = true;
    sfx.wrong();
    btn.classList.add('greyed');
    wrongCountThisQ++;
    if (wrongCountThisQ >= 2) {
      persistAnswer(currentFact.key, 'shown');
      showAnswerThenAdvance();
    } else {
      inputLocked = false;
    }
  }

  function persistAnswer(key, outcome) {
    const zoneFacts = ctx.state.zones[String(zone)].facts;
    zoneFacts[key] = updateFactAfterAnswer(zoneFacts[key], outcome);
    if (hasUnlockedNextZone(zoneFacts)) {
      const nextZone = zone + 1;
      if (ctx.state.zones[String(nextZone)] && !ctx.state.zones[String(nextZone)].unlocked) {
        ctx.state.zones[String(nextZone)].unlocked = true;
      }
    }
    ctx.save();
  }

  function advanceBoneProgress() {
    questionsThisBone++;
    setDirtForProgress(questionsThisBone);
  }

  // Shrink the dirt overlay from the top down so the silhouette emerges
  // from beneath the dirt — feels more like an excavation than a meter.
  function setDirtForProgress(progress) {
    const ratio = Math.min(1, progress / QUESTIONS_PER_BONE);
    // 0 → cover everything; 1 → fully cleared.
    const coverPct = (1 - ratio) * 100;
    dirtEl.style.height = `${coverPct}%`;
    // A subtle opacity drop too so peeking parts feel "still a little dusty".
    dirtEl.style.opacity = ratio === 0 ? '1' : '0.96';
  }

  function spawnDust() {
    // Build 5 puff particles via DOM nodes so we can animate them
    // and tear them down after the animation completes.
    const count = 5;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'dust-particle';
      // Spread the angle so puffs go in different directions.
      const angle = -90 + (i - (count - 1) / 2) * 22; // degrees, mostly upward
      const dist = 36 + Math.random() * 22;
      const rad = angle * Math.PI / 180;
      p.style.setProperty('--dx', `${Math.cos(rad) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(rad) * dist}px`);
      p.style.setProperty('--delay', `${i * 30}ms`);
      p.style.setProperty('--size', `${6 + Math.random() * 6}px`);
      dustEl.appendChild(p);
      schedule(() => { if (p.parentNode) p.parentNode.removeChild(p); }, 900);
    }
  }

  function maybeRevealOrAdvance() {
    if (questionsThisBone >= QUESTIONS_PER_BONE) revealBoneOrEgg();
    else nextQuestion();
  }

  function showAnswerThenAdvance() {
    revealEl.textContent = `${currentFact.a} × ${currentFact.b} = ${currentFact.answer} — got it. Next one's coming…`;
    revealEl.classList.add('show');
    schedule(() => {
      revealEl.classList.remove('show');
      advanceBoneProgress();
      schedule(maybeRevealOrAdvance, 200);
    }, 1600);
  }

  function revealBoneOrEgg() {
    const speciesKey = SPECIES_BY_ZONE[zone];
    const museumEntry = ctx.state.museum[speciesKey];
    const isEgg = Math.random() < EGG_CHANCE;

    // Discovery flourish: glow ring + silhouette pulse + trophy sparkle.
    fireDiscoveryMoment();

    if (isEgg) {
      ctx.state.incubating.push({
        id: cryptoRandomId(),
        species: speciesKey,
        ticksRemaining: EGG_TICKS_TO_HATCH,
      });
      sfx.hatch();
      revealEl.textContent = `You found a rare ${speciesKey} egg! It's in the Sanctuary now.`;
    } else {
      museumEntry.bones = Math.min(BONES_PER_SPECIES, museumEntry.bones + 1);
      if (museumEntry.bones === BONES_PER_SPECIES && !museumEntry.completedAt) {
        museumEntry.completedAt = new Date().toISOString();
        sfx.fanfare();
        revealEl.textContent = `${speciesKey} skeleton complete! Check the Museum.`;
      } else {
        sfx.reveal();
        revealEl.textContent = `Found a bone! ${museumEntry.bones}/${BONES_PER_SPECIES} for ${speciesKey}.`;
      }
    }
    ctx.save();
    revealEl.classList.add('show');

    schedule(() => {
      revealEl.classList.remove('show');
      glowEl.classList.remove('flash');
      trophyEl.classList.remove('show');
      fossilEl.classList.remove('pulse');
      questionsThisBone = 0;
      setDirtForProgress(0);
      nextQuestion();
    }, 1800);
  }

  function fireDiscoveryMoment() {
    // Force a reflow before adding the class so the animation re-triggers
    // on consecutive bones.
    glowEl.classList.remove('flash');
    fossilEl.classList.remove('pulse');
    trophyEl.classList.remove('show');
    // eslint-disable-next-line no-unused-expressions
    void glowEl.offsetWidth;
    glowEl.classList.add('flash');
    fossilEl.classList.add('pulse');
    trophyEl.classList.add('show');
  }

  return function unmount() {
    mounted = false;
    for (const id of timeouts) clearTimeout(id);
    timeouts.clear();
  };
}

function cryptoRandomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2);
}

// Darken a hex colour by `amount` (0..1). Returns "#rrggbb".
function darken(hex, amount) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  r = Math.max(0, Math.round(r * (1 - amount)));
  g = Math.max(0, Math.round(g * (1 - amount)));
  b = Math.max(0, Math.round(b * (1 - amount)));
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}
