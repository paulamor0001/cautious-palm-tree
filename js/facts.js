// js/facts.js
import {
  WEIGHT_MIN, WEIGHT_MAX, WEIGHT_RIGHT_MULT, WEIGHT_WRONG_MULT,
  ZONE_UNLOCK_ACCURACY,
} from './constants.js';

export function parseFactKey(key) {
  const [a, b] = key.split('x').map(Number);
  return { a, b, answer: a * b, key };
}

export function pickFactKey(zoneFacts, rng) {
  const entries = Object.entries(zoneFacts);
  const total = entries.reduce((s, [, f]) => s + f.weight, 0);
  let r = rng() * total;
  for (const [key, fact] of entries) {
    r -= fact.weight;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

export function generateDistractors(a, b, rng, count = 3) {
  const answer = a * b;
  const neighbours = [];
  for (const da of [-1, 0, 1]) {
    for (const db of [-1, 0, 1]) {
      if (da === 0 && db === 0) continue;
      const na = a + da, nb = b + db;
      if (na < 1 || nb < 1) continue;
      const v = na * nb;
      if (v !== answer) neighbours.push(v);
    }
  }
  // unique, shuffled
  const unique = [...new Set(neighbours)];
  shuffleInPlace(unique, rng);

  const picked = unique.slice(0, count);

  // Pad with safe fallbacks if neighbours weren't enough.
  let offset = 1;
  while (picked.length < count) {
    const candidate = answer + offset * (offset % 2 === 0 ? -1 : 1);
    if (candidate > 0 && candidate !== answer && !picked.includes(candidate)) {
      picked.push(candidate);
    }
    offset++;
  }
  return picked;
}

function shuffleInPlace(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function updateFactAfterAnswer(fact, outcome) {
  const weight = (() => {
    if (outcome === 'right') return Math.max(WEIGHT_MIN, fact.weight * WEIGHT_RIGHT_MULT);
    if (outcome === 'wrong') return Math.min(WEIGHT_MAX, fact.weight * WEIGHT_WRONG_MULT);
    return fact.weight; // shown
  })();
  const bit = outcome === 'right' ? 1 : 0;
  const history = [...fact.history, bit].slice(-5);
  return { weight, history };
}

export function zoneAccuracy(zoneFacts) {
  const attempts = Object.values(zoneFacts).flatMap(f => f.history);
  if (attempts.length === 0) return 0;
  const sum = attempts.reduce((a, b) => a + b, 0);
  return sum / attempts.length;
}

export function hasUnlockedNextZone(zoneFacts) {
  return zoneAccuracy(zoneFacts) >= ZONE_UNLOCK_ACCURACY;
}
