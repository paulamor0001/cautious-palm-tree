// js/views/home.js
import { zoneAccuracy } from '../facts.js';
import { setMuted } from '../audio.js';
import { SPECIES_BY_ZONE, ZONES, ZONE_UNLOCK_ACCURACY } from '../constants.js';

export function mount(container, ctx) {
  const { state, save, navigate } = ctx;

  const unlocked = ZONES.filter(z => state.zones[String(z)].unlocked);
  const suggested = unlocked.find(z => zoneAccuracy(state.zones[String(z)].facts) < ZONE_UNLOCK_ACCURACY) ?? unlocked.at(-1);
  const suggestedSpecies = SPECIES_BY_ZONE[suggested];

  const totalBones = Object.values(state.museum).reduce((s, m) => s + m.bones, 0);
  const totalDinos = state.sanctuary.length;
  const eggsIncubating = state.incubating.filter(e => e.ticksRemaining > 0).length;

  container.innerHTML = `
    <section class="view">
      <h1>Dino Times</h1>
      <p class="subtitle">Welcome back.</p>

      <div class="streak-card">
        <div class="num">${state.streak}</div>
        <div>
          <div><strong>day streak</strong></div>
          <div class="subtitle" style="margin:0;">Come back tomorrow to keep it going.</div>
        </div>
      </div>

      <div class="next-card">
        <div style="flex:1;">
          <div class="subtitle" style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Today's dig</div>
          <div style="font-size:18px;font-weight:600;">${suggested}× zone — ${suggestedSpecies}</div>
        </div>
      </div>

      <button class="primary-btn" data-action="start-dig">Start digging</button>

      <div class="next-card" style="margin-top:18px;">
        <div style="flex:1;">
          <div class="subtitle" style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:1px;">So far</div>
          <div style="font-size:15px;">${totalBones} bones · ${totalDinos} dinos · ${eggsIncubating} eggs</div>
        </div>
      </div>

      <div class="utility-row">
        <button data-action="toggle-mute" aria-pressed="${state.muted}">
          ${state.muted ? '🔇 Sound off' : '🔊 Sound on'}
        </button>
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
    btn.textContent = state.muted ? '🔇 Sound off' : '🔊 Sound on';
  });
}
