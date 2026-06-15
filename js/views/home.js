// js/views/home.js
import { zoneAccuracy } from '../facts.js';
import { setMuted } from '../audio.js';
import { SPECIES_BY_ZONE, ZONES, ZONE_UNLOCK_ACCURACY } from '../constants.js';

const FLAME_PATH = 'M16 2c.5 4.2-2.6 5.4-2.6 9.6 0 1.6 1.3 2.9 2.9 2.9.7 0 1.4-.3 1.9-.7-.4 1.9-2.3 3.3-4.5 3.3-2.5 0-4.6-2-4.6-4.5 0-2 1.4-3.3 1.4-5.4 0-.6-.1-1.2-.4-1.8 1.9.6 3.1 2.2 3.3 4 .3-2.9 1.4-5.4 2.6-7.4z';
const BONE_ICON = '<svg viewBox="0 0 32 16" fill="currentColor" aria-hidden="true"><circle cx="4" cy="5" r="4"/><circle cx="4" cy="11" r="4"/><circle cx="28" cy="5" r="4"/><circle cx="28" cy="11" r="4"/><rect x="4" y="5" width="24" height="6"/></svg>';
const FOOT_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><ellipse cx="12" cy="15" rx="6" ry="5"/><ellipse cx="6" cy="7" rx="2.2" ry="2.6"/><ellipse cx="12" cy="4.5" rx="2.2" ry="2.6"/><ellipse cx="18" cy="7" rx="2.2" ry="2.6"/></svg>';
const EGG_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c4 0 8 6.5 8 12 0 4.4-3.6 8-8 8s-8-3.6-8-8C4 8.5 8 2 12 2z"/></svg>';
const SOUND_ON_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="4 9 8 9 13 5 13 19 8 15 4 15 4 9" fill="currentColor"/><path d="M17 8c1.5 1.2 2.4 2.6 2.4 4s-0.9 2.8-2.4 4"/></svg>';
const SOUND_OFF_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="4 9 8 9 13 5 13 19 8 15 4 15 4 9" fill="currentColor"/><line x1="17" y1="9" x2="22" y2="14"/><line x1="22" y1="9" x2="17" y2="14"/></svg>';

function welcomeFor(streak) {
  if (streak <= 0) return 'Welcome, paleontologist.';
  if (streak === 1) return "Let's find some bones.";
  if (streak <= 4) return 'Back already? Brilliant.';
  return `${streak} days running. You're an expert.`;
}

export function mount(container, ctx) {
  const { state, save, navigate } = ctx;
  const species = ctx.species;

  const unlocked = ZONES.filter(z => state.zones[String(z)].unlocked);
  const suggested = unlocked.find(z => zoneAccuracy(state.zones[String(z)].facts) < ZONE_UNLOCK_ACCURACY) ?? unlocked.at(-1);
  const suggestedSpeciesKey = SPECIES_BY_ZONE[suggested];
  const speciesInfo = species[suggestedSpeciesKey];

  const totalBones = Object.values(state.museum).reduce((s, m) => s + m.bones, 0);
  const totalDinos = state.sanctuary.length;
  const incubatingEggs = state.incubating.filter(e => e.ticksRemaining > 0);
  const eggsCount = incubatingEggs.length;

  const streak = state.streak ?? 0;
  const streakClass = streak >= 5 ? 'streak-card streak-hot' : streak >= 2 ? 'streak-card streak-warm' : 'streak-card';
  const flameSize = streak >= 5 ? 64 : streak >= 2 ? 52 : 44;

  const eggsHtml = eggsCount === 0 ? '' : `
    <div class="home-section">
      <div class="home-section-label">Incubating</div>
      <div class="home-egg-row">
        ${incubatingEggs.map(egg => {
          const tint = species[egg.species]?.tint ?? '#5a8c3d';
          const dayLabel = egg.ticksRemaining === 1 ? '1 day' : `${egg.ticksRemaining} days`;
          return `
            <div class="home-egg" style="--egg-tint:${tint};" title="${species[egg.species]?.displayName ?? 'Egg'}">
              <div class="home-egg-shape"></div>
              <div class="home-egg-days">${dayLabel}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  container.innerHTML = `
    <section class="view home-view">
      <div class="home-header">
        <h1>Dino Times</h1>
        <button class="mute-icon-btn" data-action="toggle-mute" aria-pressed="${state.muted}" aria-label="${state.muted ? 'Sound off' : 'Sound on'}">
          ${state.muted ? SOUND_OFF_ICON : SOUND_ON_ICON}
        </button>
      </div>
      <p class="subtitle home-welcome">${welcomeFor(streak)}</p>

      <div class="${streakClass}">
        <div class="streak-flame" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="${flameSize}" height="${flameSize}" fill="currentColor"><path d="${FLAME_PATH}"/></svg>
        </div>
        <div class="streak-num">${streak}</div>
        <div class="streak-text">
          <div class="streak-title">day streak</div>
          <div class="streak-sub">Come back tomorrow to keep it going.</div>
        </div>
        ${streak >= 5 ? '<div class="streak-spark" aria-hidden="true"></div>' : ''}
      </div>

      <div class="hero-dig" style="--species-tint:${speciesInfo.tint};">
        <div class="hero-dig-text">
          <div class="hero-dig-label">Today's dig · ${suggested}× zone</div>
          <div class="hero-dig-name">${speciesInfo.displayName}</div>
          <div class="hero-dig-copy">Waiting at the dig site.</div>
          <button class="hero-dig-btn primary-btn" data-action="start-dig">Start digging</button>
        </div>
        <div class="hero-dig-silhouette" aria-hidden="true">
          <svg viewBox="${speciesInfo.viewBox || '0 0 100 60'}" xmlns="http://www.w3.org/2000/svg" fill="currentColor" preserveAspectRatio="xMidYMid meet">${speciesInfo.silhouette}</svg>
        </div>
      </div>

      ${eggsHtml}

      <div class="home-section">
        <div class="home-section-label">So far</div>
        <div class="stat-pills">
          <div class="stat-pill ${totalBones === 0 ? 'is-empty' : ''}">
            <span class="stat-icon">${BONE_ICON}</span>
            <span class="stat-num">${totalBones}</span>
            <span class="stat-label">${totalBones === 1 ? 'bone' : 'bones'}</span>
          </div>
          <div class="stat-pill ${totalDinos === 0 ? 'is-empty' : ''}">
            <span class="stat-icon">${FOOT_ICON}</span>
            <span class="stat-num">${totalDinos}</span>
            <span class="stat-label">${totalDinos === 1 ? 'dino' : 'dinos'}</span>
          </div>
          <div class="stat-pill ${eggsCount === 0 ? 'is-empty' : ''}">
            <span class="stat-icon">${EGG_ICON}</span>
            <span class="stat-num">${eggsCount}</span>
            <span class="stat-label">${eggsCount === 1 ? 'egg' : 'eggs'}</span>
          </div>
        </div>
      </div>
    </section>
  `;

  container.querySelector('[data-action="start-dig"]').addEventListener('click', () => {
    ctx.suggestedZone = suggested;
    navigate('dig');
  });

  container.querySelector('[data-action="toggle-mute"]').addEventListener('click', (e) => {
    state.muted = !state.muted;
    setMuted(state.muted);
    save();
    const btn = e.currentTarget;
    btn.setAttribute('aria-pressed', String(state.muted));
    btn.setAttribute('aria-label', state.muted ? 'Sound off' : 'Sound on');
    btn.innerHTML = state.muted ? SOUND_OFF_ICON : SOUND_ON_ICON;
  });
}
