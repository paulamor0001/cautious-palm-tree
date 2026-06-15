// js/state.js
import {
  STORAGE_KEY, STATE_VERSION, ZONES, ALL_SPECIES,
} from './constants.js';

const isoDate = (d) => d.toISOString().slice(0, 10);

const daysBetween = (isoA, isoB) => {
  const ms = new Date(isoB + 'T00:00:00Z') - new Date(isoA + 'T00:00:00Z');
  return Math.round(ms / 86400000);
};

function makeZone(zoneNumber) {
  const facts = {};
  for (let i = 1; i <= 12; i++) {
    facts[`${zoneNumber}x${i}`] = { weight: 1.0, history: [] };
  }
  return { unlocked: zoneNumber <= 2, facts };
}

function makeMuseum() {
  const m = {};
  for (const species of ALL_SPECIES) {
    m[species] = { bones: 0, completedAt: null };
  }
  return m;
}

export function defaultState(now) {
  const today = isoDate(now);
  const zones = {};
  for (const z of ZONES) zones[String(z)] = makeZone(z);
  return {
    version: STATE_VERSION,
    createdAt: today,
    lastPlayed: today,
    streak: 1,
    muted: false,
    zones,
    museum: makeMuseum(),
    sanctuary: [],
    incubating: [],
  };
}

export function applyDailyTick(state, now) {
  const today = isoDate(now);
  if (state.lastPlayed === today) return state;

  const diff = daysBetween(state.lastPlayed, today);
  const streak = diff === 1 ? state.streak + 1 : 1;
  const incubating = state.incubating.map(egg => ({
    ...egg,
    ticksRemaining: Math.max(0, egg.ticksRemaining - 1),
  }));

  return { ...state, lastPlayed: today, streak, incubating };
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadState(now) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState(now);
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== STATE_VERSION) return defaultState(now);
    return applyDailyTick(parsed, now);
  } catch {
    return defaultState(now);
  }
}

export function isZoneUnlocked(state, zone) {
  return state.zones[String(zone)]?.unlocked === true;
}
