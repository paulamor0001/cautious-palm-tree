// js/facts.test.js
import { describe, it, expect } from 'vitest';
import {
  pickFactKey, parseFactKey, generateDistractors,
  updateFactAfterAnswer, zoneAccuracy, hasUnlockedNextZone,
} from './facts.js';
import {
  WEIGHT_MIN, WEIGHT_MAX, WEIGHT_RIGHT_MULT, WEIGHT_WRONG_MULT,
  ZONE_UNLOCK_ACCURACY,
} from './constants.js';

// Deterministic RNG that yields successive values from a list.
const seq = (values) => {
  let i = 0;
  return () => values[i++ % values.length];
};

const zone = (overrides = {}) => {
  const facts = {};
  for (let i = 1; i <= 12; i++) {
    facts[`3x${i}`] = { weight: 1.0, history: [] };
  }
  return { ...facts, ...overrides };
};

describe('parseFactKey', () => {
  it('splits a key into operands and answer', () => {
    expect(parseFactKey('7x8')).toEqual({ a: 7, b: 8, answer: 56, key: '7x8' });
  });
});

describe('pickFactKey', () => {
  it('picks proportionally to weight', () => {
    // Heavily weight 3x7. With rng=0.0, sample should fall in 3x1's bucket.
    // With rng near 1.0 it should fall in the last fact (3x12).
    const facts = zone();
    facts['3x7'].weight = 100;
    // Total weight = 11 * 1.0 + 100 = 111. Pick at 0.5 → 55.5 cumulative → still inside 3x7's slab.
    const key = pickFactKey(facts, seq([0.5]));
    expect(key).toBe('3x7');
  });

  it('returns a valid key from the zone for any rng value', () => {
    const facts = zone();
    for (const r of [0, 0.1, 0.5, 0.999]) {
      const key = pickFactKey(facts, seq([r]));
      expect(facts[key]).toBeDefined();
    }
  });
});

describe('generateDistractors', () => {
  it('returns 3 unique wrong answers that are not the correct one', () => {
    const distractors = generateDistractors(7, 8, seq([0.1, 0.2, 0.3, 0.4, 0.5]));
    expect(distractors).toHaveLength(3);
    expect(new Set(distractors).size).toBe(3);
    expect(distractors).not.toContain(56);
    for (const d of distractors) expect(d).toBeGreaterThan(0);
  });

  it('prefers neighbouring facts as distractors', () => {
    const distractors = generateDistractors(7, 8, seq([0, 0, 0, 0, 0]));
    // Neighbours of 7x8: 6x7=42, 6x8=48, 6x9=54, 7x7=49, 7x9=63, 8x7=56(same), 8x8=64, 8x9=72
    // At least 2 of the 3 should come from this set.
    const neighbours = new Set([42, 48, 54, 49, 63, 64, 72]);
    const hits = distractors.filter(d => neighbours.has(d)).length;
    expect(hits).toBeGreaterThanOrEqual(2);
  });
});

describe('updateFactAfterAnswer', () => {
  it('right answer reduces weight by 0.8 with floor 0.3 and appends 1 to history', () => {
    const start = { weight: 1.0, history: [] };
    const next = updateFactAfterAnswer(start, 'right');
    expect(next.weight).toBeCloseTo(1.0 * WEIGHT_RIGHT_MULT);
    expect(next.history).toEqual([1]);
  });

  it('right answer respects weight floor', () => {
    const start = { weight: 0.3, history: [1, 1, 1, 1, 1] };
    const next = updateFactAfterAnswer(start, 'right');
    expect(next.weight).toBe(WEIGHT_MIN);
  });

  it('wrong answer multiplies weight by 1.6 with cap 5.0 and appends 0 to history', () => {
    const start = { weight: 1.0, history: [] };
    const next = updateFactAfterAnswer(start, 'wrong');
    expect(next.weight).toBeCloseTo(1.0 * WEIGHT_WRONG_MULT);
    expect(next.history).toEqual([0]);
  });

  it('wrong answer respects weight cap', () => {
    const start = { weight: 5.0, history: [] };
    const next = updateFactAfterAnswer(start, 'wrong');
    expect(next.weight).toBe(WEIGHT_MAX);
  });

  it('shown outcome leaves weight unchanged and appends 0 to history', () => {
    const start = { weight: 2.0, history: [1, 0] };
    const next = updateFactAfterAnswer(start, 'shown');
    expect(next.weight).toBe(2.0);
    expect(next.history).toEqual([1, 0, 0]);
  });

  it('history keeps only the last 5 entries', () => {
    const start = { weight: 1.0, history: [1, 1, 0, 1, 1] };
    const next = updateFactAfterAnswer(start, 'wrong');
    expect(next.history).toHaveLength(5);
    expect(next.history).toEqual([1, 0, 1, 1, 0]);
  });
});

describe('zoneAccuracy', () => {
  it('is 0 when no attempts yet', () => {
    expect(zoneAccuracy(zone())).toBe(0);
  });

  it('is the mean of all attempts across all facts in the zone', () => {
    const facts = zone();
    facts['3x1'].history = [1, 1];
    facts['3x2'].history = [1, 0];
    // 4 attempts, 3 right → 0.75
    expect(zoneAccuracy(facts)).toBe(0.75);
  });
});

describe('hasUnlockedNextZone', () => {
  it('false when accuracy below threshold', () => {
    const facts = zone();
    facts['3x1'].history = [1, 0, 0, 0, 0];
    expect(hasUnlockedNextZone(facts)).toBe(false);
  });

  it('true when accuracy at or above threshold', () => {
    const facts = zone();
    for (let i = 1; i <= 12; i++) facts[`3x${i}`].history = [1, 1, 1, 1, 1];
    expect(zoneAccuracy(facts)).toBe(1.0);
    expect(hasUnlockedNextZone(facts)).toBe(true);
  });

  it('uses the configured threshold', () => {
    const facts = zone();
    // 80% threshold: need 48 / 60 ones
    let ones = 48, zeros = 12;
    for (let i = 1; i <= 12; i++) {
      facts[`3x${i}`].history = [];
      for (let j = 0; j < 5; j++) {
        const bit = ones-- > 0 ? 1 : (zeros--, 0);
        facts[`3x${i}`].history.push(bit);
      }
    }
    expect(zoneAccuracy(facts)).toBe(ZONE_UNLOCK_ACCURACY);
    expect(hasUnlockedNextZone(facts)).toBe(true);
  });
});
