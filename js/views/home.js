import { zoneAccuracy } from '../facts.js';
import { SPECIES_BY_ZONE, ZONES } from '../constants.js';

export function mount(container, ctx) {
  const { state, navigate } = ctx;

  const unlocked = ZONES.filter(z => state.zones[String(z)].unlocked);
  const suggested = unlocked.find(z => zoneAccuracy(state.zones[String(z)].facts) < 0.8) ?? unlocked.at(-1);
  const speciesName = SPECIES_BY_ZONE[suggested];

  container.innerHTML = `
    <section class="view">
      <h1>Dino Times</h1>
      <p class="subtitle">Welcome back.</p>

      <div class="streak-card">
        <div class="num">${state.streak}</div>
        <div>
          <div><strong>day streak</strong></div>
          <div class="subtitle" style="margin:0;">Come back tomorrow to keep it.</div>
        </div>
      </div>

      <div class="next-card">
        <div style="flex:1;">
          <div class="subtitle" style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Today's dig</div>
          <div style="font-size:18px;font-weight:600;">${suggested}× zone — ${speciesName}</div>
        </div>
      </div>

      <button class="primary-btn" data-action="start-dig">Start digging</button>
    </section>
  `;

  container.querySelector('[data-action="start-dig"]').addEventListener('click', () => {
    ctx.suggestedZone = suggested;
    navigate('dig');
  });
}
