// js/state.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadState, saveState, defaultState, applyDailyTick, markPlayed, isZoneUnlocked
} from './state.js';
import { STORAGE_KEY, ZONES, STATE_VERSION } from './constants.js';

const day = (iso) => new Date(`${iso}T12:00:00Z`);

beforeEach(() => {
  globalThis.localStorage?.clear?.();
});

describe('defaultState', () => {
  it('initialises with version, created/lastPlayed today, streak 1, zones for every table', () => {
    const s = defaultState(day('2026-06-15'));
    expect(s.version).toBe(STATE_VERSION);
    expect(s.createdAt).toBe('2026-06-15');
    expect(s.lastPlayed).toBe('2026-06-15');
    expect(s.streak).toBe(1);
    expect(s.muted).toBe(false);
    expect(Object.keys(s.zones).length).toBe(ZONES.length);
    expect(s.sanctuary).toEqual([]);
    expect(s.incubating).toEqual([]);
  });

  it('unlocks zones 1 and 2, locks the rest', () => {
    const s = defaultState(day('2026-06-15'));
    expect(s.zones['1'].unlocked).toBe(true);
    expect(s.zones['2'].unlocked).toBe(true);
    expect(s.zones['3'].unlocked).toBe(false);
    expect(s.zones['12'].unlocked).toBe(false);
  });

  it('has 12 facts per zone with weight 1.0 and empty history', () => {
    const s = defaultState(day('2026-06-15'));
    const z3 = s.zones['3'].facts;
    expect(Object.keys(z3).length).toBe(12);
    expect(z3['3x1'].weight).toBe(1.0);
    expect(z3['3x12'].history).toEqual([]);
  });

  it('seeds the museum with 0 bones per species', () => {
    const s = defaultState(day('2026-06-15'));
    expect(s.museum.compsognathus.bones).toBe(0);
    expect(s.museum.trex.bones).toBe(0);
    expect(s.museum.trex.completedAt).toBeNull();
  });
});

describe('applyDailyTick', () => {
  it('same day → unchanged', () => {
    const s = defaultState(day('2026-06-15'));
    const next = applyDailyTick(s, day('2026-06-15'));
    expect(next).toEqual(s);
  });

  it('next day → streak +1, lastPlayed advances, eggs tick down by 1', () => {
    const s = defaultState(day('2026-06-15'));
    s.incubating = [{ id: 'e1', species: 'stegosaurus', ticksRemaining: 3 }];
    const next = applyDailyTick(s, day('2026-06-16'));
    expect(next.streak).toBe(2);
    expect(next.lastPlayed).toBe('2026-06-16');
    expect(next.incubating[0].ticksRemaining).toBe(2);
  });

  it('skipped days → streak resets to 1, eggs only tick once (missed days dont count)', () => {
    const s = defaultState(day('2026-06-15'));
    s.incubating = [{ id: 'e1', species: 'stegosaurus', ticksRemaining: 3 }];
    const next = applyDailyTick(s, day('2026-06-18')); // missed 16, 17
    expect(next.streak).toBe(1);
    expect(next.lastPlayed).toBe('2026-06-18');
    expect(next.incubating[0].ticksRemaining).toBe(2); // not 0
  });

  it('eggs at 0 ticks stay at 0 (hatching handled elsewhere)', () => {
    const s = defaultState(day('2026-06-15'));
    s.incubating = [{ id: 'e1', species: 'trex', ticksRemaining: 0 }];
    const next = applyDailyTick(s, day('2026-06-16'));
    expect(next.incubating[0].ticksRemaining).toBe(0);
  });

  it('clock skew to an earlier date → unchanged (no streak loss)', () => {
    const s = defaultState(day('2026-06-15'));
    s.incubating = [{ id: 'e1', species: 'trex', ticksRemaining: 2 }];
    const next = applyDailyTick(s, day('2026-06-14'));
    expect(next).toBe(s);
  });
});

describe('markPlayed', () => {
  it('updates lastPlayed when called on a new day', () => {
    const s = defaultState(day('2026-06-15'));
    const next = markPlayed(s, day('2026-06-16'));
    expect(next.lastPlayed).toBe('2026-06-16');
  });

  it('does not change streak or eggs', () => {
    const s = defaultState(day('2026-06-15'));
    s.streak = 5;
    s.incubating = [{ id: 'e1', species: 'trex', ticksRemaining: 2 }];
    const next = markPlayed(s, day('2026-06-16'));
    expect(next.streak).toBe(5);
    expect(next.incubating[0].ticksRemaining).toBe(2);
  });

  it('returns the same reference when called on the same day', () => {
    const s = defaultState(day('2026-06-15'));
    expect(markPlayed(s, day('2026-06-15'))).toBe(s);
  });
});

describe('loadState / saveState', () => {
  it('returns defaultState when storage is empty', () => {
    const s = loadState(day('2026-06-15'));
    expect(s.createdAt).toBe('2026-06-15');
  });

  it('roundtrips through saveState/loadState', () => {
    const s = defaultState(day('2026-06-15'));
    s.zones['1'].facts['1x1'].weight = 2.5;
    saveState(s);
    const back = loadState(day('2026-06-15'));
    expect(back.zones['1'].facts['1x1'].weight).toBe(2.5);
  });

  it('applies a daily tick when loading on a later day', () => {
    const s = defaultState(day('2026-06-15'));
    s.incubating = [{ id: 'e1', species: 'trex', ticksRemaining: 3 }];
    saveState(s);
    const back = loadState(day('2026-06-16'));
    expect(back.streak).toBe(2);
    expect(back.incubating[0].ticksRemaining).toBe(2);
  });

  it('falls back to default state if stored JSON is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, 'not json');
    const s = loadState(day('2026-06-15'));
    expect(s.version).toBe(STATE_VERSION);
  });

  it('falls back to default state if stored JSON has the right version but missing fields', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STATE_VERSION }));
    const s = loadState(day('2026-06-15'));
    expect(s.zones).toBeDefined();
    expect(s.museum).toBeDefined();
    expect(Array.isArray(s.incubating)).toBe(true);
  });
});

describe('isZoneUnlocked', () => {
  it('reads the unlocked flag', () => {
    const s = defaultState(day('2026-06-15'));
    expect(isZoneUnlocked(s, 1)).toBe(true);
    expect(isZoneUnlocked(s, 5)).toBe(false);
  });
});
