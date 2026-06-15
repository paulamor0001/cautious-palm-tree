// js/views/dig.js
import {
  pickFactKey, parseFactKey, generateDistractors, updateFactAfterAnswer,
  zoneAccuracy, hasUnlockedNextZone,
} from '../facts.js';
import { sfx } from '../audio.js';
import {
  ZONES, SPECIES_BY_ZONE, BONES_PER_SPECIES, EGG_CHANCE, EGG_TICKS_TO_HATCH,
} from '../constants.js';

const QUESTIONS_PER_BONE = 6;

export function mount(container, ctx) {
  let zone = ctx.suggestedZone ?? firstUnlockedZone(ctx.state);
  if (!ctx.state.zones[String(zone)].unlocked) zone = firstUnlockedZone(ctx.state);

  let questionsThisBone = 0;
  let currentFact = null;       // { a, b, answer, key, correctIndex, options: number[] }
  let wrongCountThisQ = 0;

  container.innerHTML = '';
  const view = document.createElement('section');
  view.className = 'view';
  view.innerHTML = `
    <div class="dig">
      <div class="zone-pill">${zone}× zone — ${SPECIES_BY_ZONE[zone]}</div>
      <div class="question" data-role="question">—</div>
      <div class="rock"><div class="bone-fill" data-role="fill" style="height:0%"></div></div>
      <div class="tiles" data-role="tiles"></div>
      <div class="reveal-msg" data-role="reveal"></div>
    </div>
  `;
  container.appendChild(view);

  const qEl = view.querySelector('[data-role="question"]');
  const fillEl = view.querySelector('[data-role="fill"]');
  const tilesEl = view.querySelector('[data-role="tiles"]');
  const revealEl = view.querySelector('[data-role="reveal"]');

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
    if (idx === currentFact.correctIndex) onRight(btn);
    else onWrong(btn);
  }

  function onRight(btn) {
    sfx.correct();
    btn.classList.add('correct');
    const outcome = wrongCountThisQ > 0 ? 'shown' : 'right';
    persistAnswer(currentFact.key, outcome);
    advanceBoneProgress();
    setTimeout(maybeRevealOrAdvance, 600);
  }

  function onWrong(btn) {
    sfx.wrong();
    btn.classList.add('greyed');
    wrongCountThisQ++;
    if (wrongCountThisQ >= 2) {
      persistAnswer(currentFact.key, 'shown');
      showAnswerThenAdvance();
    }
  }

  function persistAnswer(key, outcome) {
    const zoneFacts = ctx.state.zones[String(zone)].facts;
    zoneFacts[key] = updateFactAfterAnswer(zoneFacts[key], outcome);
    // Unlock next zone if criteria met.
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
    const pct = Math.min(100, (questionsThisBone / QUESTIONS_PER_BONE) * 100);
    fillEl.style.height = `${pct}%`;
  }

  function maybeRevealOrAdvance() {
    if (questionsThisBone >= QUESTIONS_PER_BONE) revealBoneOrEgg();
    else nextQuestion();
  }

  function showAnswerThenAdvance() {
    revealEl.textContent = `${currentFact.a} × ${currentFact.b} = ${currentFact.answer} — got it. Next one's coming…`;
    revealEl.classList.add('show');
    setTimeout(() => {
      revealEl.classList.remove('show');
      advanceBoneProgress();
      setTimeout(maybeRevealOrAdvance, 200);
    }, 1600);
  }

  function revealBoneOrEgg() {
    const species = SPECIES_BY_ZONE[zone];
    const museumEntry = ctx.state.museum[species];
    const isEgg = Math.random() < EGG_CHANCE;

    if (isEgg) {
      ctx.state.incubating.push({
        id: cryptoRandomId(),
        species,
        ticksRemaining: EGG_TICKS_TO_HATCH,
      });
      sfx.hatch();
      revealEl.textContent = `You found a rare ${species} egg! It's in the Sanctuary now.`;
    } else {
      museumEntry.bones = Math.min(BONES_PER_SPECIES, museumEntry.bones + 1);
      if (museumEntry.bones === BONES_PER_SPECIES && !museumEntry.completedAt) {
        museumEntry.completedAt = new Date().toISOString();
        sfx.fanfare();
        revealEl.textContent = `${species} skeleton complete! Check the Museum.`;
      } else {
        sfx.reveal();
        revealEl.textContent = `Found a bone! ${museumEntry.bones}/${BONES_PER_SPECIES} for ${species}.`;
      }
    }
    ctx.save();
    revealEl.classList.add('show');

    setTimeout(() => {
      revealEl.classList.remove('show');
      questionsThisBone = 0;
      fillEl.style.height = '0%';
      nextQuestion();
    }, 1800);
  }
}

function cryptoRandomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2);
}
