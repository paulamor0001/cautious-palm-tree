# Dino Times Tables — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a vanilla-JS web app for a 9-year-old to practise multiplication tables 1×–12× in a "paleontologist running a sanctuary" world (Dig Site → Museum → Sanctuary), targeted at iPad via PWA / Add-to-Home-Screen.

**Architecture:** Single static site, no backend, no framework. Three views switched by a bottom tab bar. Pure game state in a single `state.js` module (load/save `localStorage`, daily-tick logic). Pure question/distractor logic in `facts.js`. UI in plain HTML + ES modules + CSS. Vite for local dev. Vitest + jsdom for unit tests on the pure modules. Deployed as static files to GitHub Pages.

**Tech Stack:** Vanilla JavaScript (ES modules), HTML5, CSS, Web Audio API, PWA (manifest + service worker). Dev-only: Node 20+, Vite, Vitest, jsdom.

**Spec:** [docs/superpowers/specs/2026-06-15-dino-times-tables-design.md](../specs/2026-06-15-dino-times-tables-design.md)

---

## File structure (target)

```
dino-times/
├── package.json
├── vite.config.js
├── index.html
├── manifest.webmanifest
├── service-worker.js
├── css/
│   └── style.css
├── js/
│   ├── constants.js          # shared constants (zones, storage key, etc.)
│   ├── state.js              # localStorage I/O + daily tick + default state
│   ├── state.test.js
│   ├── facts.js              # weighted sampling, distractors, fact updates
│   ├── facts.test.js
│   ├── audio.js              # mute toggle + sound playback
│   ├── app.js                # bootstrap, tab switching
│   └── views/
│       ├── home.js
│       ├── dig.js
│       ├── museum.js
│       └── sanctuary.js
├── data/
│   └── species.json          # 12 species: name, fact, bone count, art ref
├── assets/
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   └── species/              # 12 SVG illustrations (placeholder OK in v1)
├── README.md                 # GitHub Pages deploy walkthrough for non-dev parent
└── docs/superpowers/...      # specs + plans (already exists)
```

Each file has one clear responsibility. The two pure modules (`state.js`, `facts.js`) hold all logic that can be unit-tested. View files own DOM + rendering. Bootstrap in `app.js` is the only cross-cutting glue.

---

## Conventions used throughout

- **ES modules** everywhere. Use `import`/`export`. Browser supports them natively when served from a web server.
- **Dependency injection for non-determinism.** Any function that uses `Math.random()` or `new Date()` accepts it as an injected parameter (default = the real thing) so tests can be deterministic.
- **Pure functions where possible.** State updates return new state objects rather than mutating.
- **No build step in production.** Vite is for `npm run dev`; the deployed site is the raw source files served as-is. (Vite's default `npm run build` would also work but adds complexity; we don't need it.)
- **CSS:** plain CSS, no framework. Use CSS custom properties for the three room palettes.
- **Commits:** small, frequent, with a clear message per step. Format: `<scope>: <imperative summary>`.

---

## Task 1: Project scaffold and tooling

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/app.js`
- Create: `.gitignore` (append-only)

- [ ] **Step 1.1: Initialise package.json**

Run in `C:\Users\paula\dino-times`:
```bash
npm init -y
```

Then replace generated `package.json` content with:
```json
{
  "name": "dino-times",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "vitest": "^2.1.0",
    "jsdom": "^25.0.0"
  }
}
```

- [ ] **Step 1.2: Install dev dependencies**

Run:
```bash
npm install
```
Expected: completes without errors, `node_modules/` and `package-lock.json` appear.

- [ ] **Step 1.3: Append `node_modules/` to .gitignore**

The repo already has `.gitignore` with `.superpowers/`. Append:
```
node_modules/
dist/
.DS_Store
```

- [ ] **Step 1.4: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5173, host: true },
  test: {
    environment: 'jsdom',
    globals: false,
  },
});
```

- [ ] **Step 1.5: Create `index.html` shell**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="theme-color" content="#6b4423" />
    <title>Dino Times</title>
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="/assets/icons/icon-192.png" />
    <link rel="stylesheet" href="/css/style.css" />
  </head>
  <body>
    <main id="app" aria-live="polite">
      <p class="loading">Loading…</p>
    </main>
    <nav id="tabbar" hidden>
      <button data-tab="home" aria-current="page">Home</button>
      <button data-tab="dig">Dig</button>
      <button data-tab="museum">Museum</button>
      <button data-tab="sanctuary">Sanctuary</button>
    </nav>
    <script type="module" src="/js/app.js"></script>
  </body>
</html>
```

- [ ] **Step 1.6: Create starter `css/style.css`**

```css
:root {
  --bg: #f5efe6;
  --ink: #2a2118;
  --muted: #847467;
  --dig: #6b4423;
  --museum: #2d3e50;
  --sanctuary: #2d5a1f;
  --accent: #f7b500;
  --tap: 56px;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--ink);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
  overscroll-behavior: none;
}

#app {
  min-height: 100vh;
  padding: 24px 20px 96px;
}

#tabbar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: #fff;
  border-top: 1px solid #ddd;
  padding-bottom: env(safe-area-inset-bottom);
}

#tabbar button {
  border: 0;
  background: transparent;
  min-height: var(--tap);
  font-size: 14px;
  color: var(--muted);
  cursor: pointer;
}

#tabbar button[aria-current="page"] { color: var(--ink); font-weight: 600; }

.loading { text-align: center; color: var(--muted); margin-top: 40vh; }
```

- [ ] **Step 1.7: Create stub `js/app.js`**

```js
const app = document.getElementById('app');
app.innerHTML = '<h1>Dino Times</h1><p>Scaffold ready.</p>';
console.log('Dino Times scaffold loaded');
```

- [ ] **Step 1.8: Verify dev server runs**

Run:
```bash
npm run dev
```
Expected: Vite prints a URL like `http://localhost:5173`. Open it in a browser — page shows "Dino Times" and "Scaffold ready." Stop the server with Ctrl-C.

- [ ] **Step 1.9: Verify test runner works**

Create `js/smoke.test.js`:
```js
import { describe, it, expect } from 'vitest';
describe('smoke', () => {
  it('runs', () => { expect(1 + 1).toBe(2); });
});
```
Run:
```bash
npm test
```
Expected: one test passes. Delete `js/smoke.test.js`.

- [ ] **Step 1.10: Commit**

```bash
git add package.json package-lock.json vite.config.js index.html css/ js/ .gitignore
git commit -m "scaffold: vite + vitest project with index.html, tab bar shell, basic css"
```

---

## Task 2: Constants module

**Files:**
- Create: `js/constants.js`

- [ ] **Step 2.1: Write constants**

```js
// js/constants.js

export const STORAGE_KEY = 'dinoTimes.state.v1';
export const STATE_VERSION = 1;

export const ZONES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const BONES_PER_SPECIES = 9;

// One incubation tick per play day. 3 ticks → hatched.
export const EGG_TICKS_TO_HATCH = 3;

// Chance a dig produces an egg instead of a bone.
export const EGG_CHANCE = 0.10;

// Per-fact weight bounds and multipliers.
export const WEIGHT_MIN = 0.3;
export const WEIGHT_MAX = 5.0;
export const WEIGHT_RIGHT_MULT = 0.8;
export const WEIGHT_WRONG_MULT = 1.6;

// Zone unlocks at this accuracy across last-5-attempts per fact.
export const ZONE_UNLOCK_ACCURACY = 0.80;

// Dino growth milestones (accuracy within own species' zone).
export const STAGE_JUVENILE_AT = 0.50;
export const STAGE_ADULT_AT = 0.80;

// Twelve species keyed by zone (1 → smallest, 12 → biggest).
export const SPECIES_BY_ZONE = {
  1:  'compsognathus',
  2:  'velociraptor',
  3:  'pterodactyl',
  4:  'iguanodon',
  5:  'stegosaurus',
  6:  'parasaurolophus',
  7:  'ankylosaurus',
  8:  'triceratops',
  9:  'allosaurus',
  10: 'spinosaurus',
  11: 'brachiosaurus',
  12: 'trex',
};

export const ALL_SPECIES = Object.values(SPECIES_BY_ZONE);
```

- [ ] **Step 2.2: Commit**

```bash
git add js/constants.js
git commit -m "constants: zones, weights, species mapping, storage key"
```

---

## Task 3: State module (TDD)

**Files:**
- Create: `js/state.js`
- Create: `js/state.test.js`

This module owns the persistence model. Tests come first — they pin down the shape and the daily-tick semantics, which are the trickiest part of the design.

### Contract

```
loadState(now: Date) -> StateObject
saveState(state)     -> void
defaultState(now)    -> StateObject
applyDailyTick(state, now) -> StateObject   // pure, used by loadState
isZoneUnlocked(state, zone) -> boolean
markPlayed(state, now) -> StateObject       // bump lastPlayed without crossing day boundary
```

The `StateObject` shape matches the spec's Persistence section.

- [ ] **Step 3.1: Write the failing tests**

```js
// js/state.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadState, saveState, defaultState, applyDailyTick, isZoneUnlocked
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
});

describe('isZoneUnlocked', () => {
  it('reads the unlocked flag', () => {
    const s = defaultState(day('2026-06-15'));
    expect(isZoneUnlocked(s, 1)).toBe(true);
    expect(isZoneUnlocked(s, 5)).toBe(false);
  });
});
```

- [ ] **Step 3.2: Run tests to verify they fail**

Run:
```bash
npm test
```
Expected: all `state.test.js` tests fail because `state.js` doesn't exist yet.

- [ ] **Step 3.3: Implement `js/state.js`**

```js
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
```

- [ ] **Step 3.4: Run tests to verify they pass**

Run:
```bash
npm test
```
Expected: every test in `state.test.js` passes.

- [ ] **Step 3.5: Commit**

```bash
git add js/state.js js/state.test.js
git commit -m "state: localStorage I/O, default state, daily-tick semantics, unit tests"
```

---

## Task 4: Facts module (TDD)

**Files:**
- Create: `js/facts.js`
- Create: `js/facts.test.js`

Owns weighted question sampling, distractor generation, per-fact weight updates after answers, and zone-accuracy calculation. All pure functions with injected RNG so tests are deterministic.

### Contract

```
pickFactKey(zoneFacts, rng) -> 'AxB'                       // weighted sample
parseFactKey('7x8') -> { a: 7, b: 8, answer: 56, key: '7x8' }
generateDistractors(a, b, rng, count=3) -> number[]        // wrong answers, unique, plausible
updateFactAfterAnswer(fact, outcome) -> fact               // outcome: 'right'|'wrong'|'shown'
zoneAccuracy(zoneFacts) -> number                          // 0..1, mean of recent attempts
hasUnlockedNextZone(zoneFacts) -> boolean                  // accuracy >= threshold
```

- [ ] **Step 4.1: Write the failing tests**

```js
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
```

- [ ] **Step 4.2: Run tests to verify they fail**

Run:
```bash
npm test
```
Expected: every test in `facts.test.js` fails (`facts.js` doesn't exist).

- [ ] **Step 4.3: Implement `js/facts.js`**

```js
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
      if (v !== answer && v > 0) neighbours.push(v);
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
```

- [ ] **Step 4.4: Run tests to verify they pass**

Run:
```bash
npm test
```
Expected: all tests pass for `facts.test.js` and `state.test.js`.

- [ ] **Step 4.5: Commit**

```bash
git add js/facts.js js/facts.test.js
git commit -m "facts: weighted sample, distractors, fact updates, zone accuracy, unit tests"
```

---

## Task 5: Species data

**Files:**
- Create: `data/species.json`

The 12 species with display names, the 1-2-sentence fact for the museum, and a placeholder colour for the not-yet-drawn illustration. SVG illustrations are deferred to Task 11 — for now we use a coloured silhouette.

- [ ] **Step 5.1: Create `data/species.json`**

```json
{
  "compsognathus": {
    "displayName": "Compsognathus",
    "zone": 1,
    "fact": "Compsognathus was about the size of a chicken — one of the smallest dinosaurs ever found. It chased lizards and insects on its long, thin legs.",
    "tint": "#a78b5f"
  },
  "velociraptor": {
    "displayName": "Velociraptor",
    "zone": 2,
    "fact": "Velociraptors were about the size of a turkey and covered in feathers. The big claw on each foot was for pinning down prey, not slashing.",
    "tint": "#7a3e2e"
  },
  "pterodactyl": {
    "displayName": "Pterodactyl",
    "zone": 3,
    "fact": "Pterodactyls were flying reptiles, not dinosaurs. They had wings made of skin stretched from one very long finger to their body.",
    "tint": "#5f7d9c"
  },
  "iguanodon": {
    "displayName": "Iguanodon",
    "zone": 4,
    "fact": "Iguanodon had a spike on each thumb that scientists first thought went on its nose. It chewed plants with cheeks full of grinding teeth.",
    "tint": "#6b8a3e"
  },
  "stegosaurus": {
    "displayName": "Stegosaurus",
    "zone": 5,
    "fact": "Stegosaurus had two rows of bony plates down its back that may have helped it warm up in the sun. Its brain was about the size of a walnut.",
    "tint": "#4a6b3a"
  },
  "parasaurolophus": {
    "displayName": "Parasaurolophus",
    "zone": 6,
    "fact": "The long tube on its head was hollow and could trumpet like a horn. Herds probably called to each other across long distances.",
    "tint": "#8b5f7d"
  },
  "ankylosaurus": {
    "displayName": "Ankylosaurus",
    "zone": 7,
    "fact": "Ankylosaurus was a tank — covered in bony plates, with a heavy club on its tail. Even its eyelids had armour.",
    "tint": "#5e5e3a"
  },
  "triceratops": {
    "displayName": "Triceratops",
    "zone": 8,
    "fact": "Triceratops had three horns and a huge bony frill protecting its neck. It lived right at the very end of the age of dinosaurs.",
    "tint": "#6b3e3e"
  },
  "allosaurus": {
    "displayName": "Allosaurus",
    "zone": 9,
    "fact": "Allosaurus was a fierce hunter long before T. rex appeared. It opened its mouth wider than almost any other dinosaur and bit like an axe.",
    "tint": "#8b4a2e"
  },
  "spinosaurus": {
    "displayName": "Spinosaurus",
    "zone": 10,
    "fact": "Spinosaurus had a huge sail on its back and was probably the only dinosaur that mostly lived in water, hunting fish like a giant crocodile.",
    "tint": "#3a5e7d"
  },
  "brachiosaurus": {
    "displayName": "Brachiosaurus",
    "zone": 11,
    "fact": "Brachiosaurus held its neck high like a giraffe and could reach the tops of trees. It might have weighed more than ten elephants put together.",
    "tint": "#6b7d3e"
  },
  "trex": {
    "displayName": "Tyrannosaurus rex",
    "zone": 12,
    "fact": "T. rex had the strongest bite of any land animal that ever lived. Its tiny arms were still strong enough to lift a grown person.",
    "tint": "#3e3e3e"
  }
}
```

- [ ] **Step 5.2: Commit**

```bash
git add data/species.json
git commit -m "data: 12 species with display name, zone, kid-readable fact, tint colour"
```

---

## Task 6: Audio module

**Files:**
- Create: `js/audio.js`

Lightweight wrapper around the Web Audio API. No external files needed in v1 — we synthesise short tones. Mute state is read from the game state object.

- [ ] **Step 6.1: Implement `js/audio.js`**

```js
// js/audio.js

let ctx = null;
let muted = false;

function ensureCtx() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    ctx = null;
  }
  return ctx;
}

export function setMuted(value) {
  muted = !!value;
}

export function isMuted() {
  return muted;
}

function tone({ freq, duration, type = 'sine', gain = 0.12, attack = 0.005, release = 0.08 }) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gn = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const now = ac.currentTime;
  gn.gain.setValueAtTime(0, now);
  gn.gain.linearRampToValueAtTime(gain, now + attack);
  gn.gain.linearRampToValueAtTime(0, now + attack + duration + release);
  osc.connect(gn).connect(ac.destination);
  osc.start(now);
  osc.stop(now + attack + duration + release + 0.02);
}

export const sfx = {
  correct() { tone({ freq: 660, duration: 0.05, type: 'triangle' }); },
  wrong()   { tone({ freq: 180, duration: 0.10, type: 'sine', gain: 0.08 }); },
  reveal()  { tone({ freq: 880, duration: 0.12, type: 'sine' });
              setTimeout(() => tone({ freq: 1320, duration: 0.18, type: 'sine' }), 90); },
  hatch()   { tone({ freq: 520, duration: 0.18, type: 'triangle' });
              setTimeout(() => tone({ freq: 780, duration: 0.22, type: 'triangle' }), 120); },
  fanfare() {
    [523, 659, 784].forEach((f, i) =>
      setTimeout(() => tone({ freq: f, duration: 0.18, type: 'triangle' }), i * 130));
  },
};
```

- [ ] **Step 6.2: Commit**

```bash
git add js/audio.js
git commit -m "audio: Web Audio synth for chip/wrong/reveal/hatch/fanfare with mute toggle"
```

---

## Task 7: App shell + tab navigation

**Files:**
- Modify: `js/app.js` (full replace)
- Create: `js/views/home.js`
- Create: `js/views/dig.js` (stub)
- Create: `js/views/museum.js` (stub)
- Create: `js/views/sanctuary.js` (stub)

`app.js` becomes the bootstrap: loads state, mounts the active view, wires tab clicks, persists on every state change.

- [ ] **Step 7.1: Add the tab-related CSS**

Append to `css/style.css`:

```css
.view { animation: fadein 180ms ease-out; }
@keyframes fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

.view h1 { margin: 0 0 4px; font-size: 28px; }
.view .subtitle { color: var(--muted); margin: 0 0 20px; }

.streak-card, .next-card {
  background: #fff; border-radius: 16px; padding: 16px 18px; margin-bottom: 14px;
  display: flex; align-items: center; gap: 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
}

.streak-card .num {
  font-size: 36px; font-weight: 700; color: var(--accent);
  min-width: 48px; text-align: center;
}

.primary-btn {
  width: 100%; min-height: var(--tap);
  background: var(--dig); color: #fff;
  border: 0; border-radius: 14px;
  font-size: 18px; font-weight: 600;
  margin-top: 12px;
  cursor: pointer;
}
.primary-btn:active { transform: scale(0.98); }
```

- [ ] **Step 7.2: Create stub view files**

Each stub exports a `mount(container, ctx)` function that the router calls. `ctx` carries `{ state, save, navigate }`.

`js/views/home.js`:
```js
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
```

`js/views/dig.js`:
```js
export function mount(container, ctx) {
  container.innerHTML = '<section class="view"><h1>Dig Site</h1><p class="subtitle">Coming next…</p></section>';
}
```

`js/views/museum.js`:
```js
export function mount(container, ctx) {
  container.innerHTML = '<section class="view"><h1>Museum</h1><p class="subtitle">Coming next…</p></section>';
}
```

`js/views/sanctuary.js`:
```js
export function mount(container, ctx) {
  container.innerHTML = '<section class="view"><h1>Sanctuary</h1><p class="subtitle">Coming next…</p></section>';
}
```

- [ ] **Step 7.3: Replace `js/app.js`**

```js
// js/app.js
import { loadState, saveState } from './state.js';
import { setMuted } from './audio.js';
import * as home from './views/home.js';
import * as dig from './views/dig.js';
import * as museum from './views/museum.js';
import * as sanctuary from './views/sanctuary.js';

const views = { home, dig, museum, sanctuary };

const appEl = document.getElementById('app');
const tabbarEl = document.getElementById('tabbar');

const ctx = {
  state: loadState(new Date()),
  save() { saveState(this.state); },
  navigate(tab) { switchTo(tab); },
};

setMuted(ctx.state.muted);
ctx.save(); // persist any tick that happened on load

let currentTab = 'home';

function switchTo(tab) {
  if (!views[tab]) return;
  currentTab = tab;
  for (const btn of tabbarEl.querySelectorAll('button')) {
    btn.toggleAttribute('aria-current', btn.dataset.tab === tab);
    btn.setAttribute('aria-current', btn.dataset.tab === tab ? 'page' : 'false');
  }
  appEl.innerHTML = '';
  views[tab].mount(appEl, ctx);
}

tabbarEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-tab]');
  if (btn) switchTo(btn.dataset.tab);
});

tabbarEl.hidden = false;
switchTo('home');
```

- [ ] **Step 7.4: Manually verify in the browser**

Run:
```bash
npm run dev
```
Open the URL. Expected:
- Home view shows the streak (1), today's dig zone (1× compsognathus), and a "Start digging" button.
- Tapping each tab in the bar switches views — even though dig/museum/sanctuary show stub headings.
- Refreshing the page keeps the same state (streak still 1, etc.).

Stop the server with Ctrl-C.

- [ ] **Step 7.5: Commit**

```bash
git add js/app.js js/views/ css/style.css
git commit -m "app: bootstrap, tab router, home view with streak and today's dig"
```

---

## Task 8: Dig view

**Files:**
- Modify: `js/views/dig.js` (full replace)
- Append: `css/style.css`

This is the heart of the game. The view:
1. Shows a question and four answer tiles (one right, three distractors).
2. Right answer → bone fragment progresses, satisfying tone, advance after 600ms.
3. Wrong answer → tile greys out, no penalty, pick again.
4. Second wrong → show answer briefly, advance.
5. After N correct answers (configurable; default 6), reveal a bone — increment the museum count for the active species.
6. Rare egg event on bone reveal (~10% chance).
7. Persist state after each interaction.

- [ ] **Step 8.1: Add dig CSS**

Append to `css/style.css`:

```css
.dig {
  background: linear-gradient(160deg, #c9a778 0%, #a07847 60%, #6b4423 100%);
  color: #fff;
  border-radius: 24px;
  padding: 20px;
  min-height: 460px;
  display: flex; flex-direction: column; gap: 16px;
  position: relative; overflow: hidden;
}

.dig .zone-pill {
  align-self: flex-start;
  background: rgba(0,0,0,0.28); border-radius: 999px;
  padding: 6px 12px; font-size: 13px; letter-spacing: 0.5px;
}

.dig .question {
  font-size: 56px; font-weight: 700; text-align: center;
  margin: 16px 0 8px; letter-spacing: -1px;
  font-feature-settings: "tnum";
}

.dig .rock {
  align-self: center;
  width: 180px; height: 90px;
  background: linear-gradient(180deg, #5a3e1f, #2e1f10);
  border-radius: 90px 90px 12px 12px;
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
}

.dig .rock .bone-fill {
  position: absolute; left: 0; bottom: 0;
  width: 100%; background: #f5efd6;
  transition: height 280ms ease-out;
}

.dig .tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: auto;
}

.dig .tile {
  min-height: 76px;
  background: rgba(255,255,255,0.92);
  color: #2a2118;
  border: 0; border-radius: 16px;
  font-size: 30px; font-weight: 700;
  cursor: pointer;
  transition: transform 120ms, opacity 200ms, background 200ms;
}

.dig .tile.greyed { opacity: 0.32; pointer-events: none; }
.dig .tile.correct {
  background: var(--accent); color: #2a2118;
  animation: pulse 320ms ease-out;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.06); }
  100% { transform: scale(1); }
}

.dig .reveal-msg {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.5); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; text-align: center; padding: 24px;
  border-radius: 24px;
  opacity: 0; pointer-events: none;
  transition: opacity 200ms;
}
.dig .reveal-msg.show { opacity: 1; }
```

- [ ] **Step 8.2: Implement `js/views/dig.js`**

```js
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
```

- [ ] **Step 8.3: Manually verify in browser**

Run:
```bash
npm run dev
```
Open in browser. Steps:
- Tap "Start digging" on home → Dig view loads with a 1× question.
- Tap the correct answer → tile pulses gold, bone-fill rises a notch, next question.
- Tap a wrong answer → tile greys, no flash. Try the right one → progress continues.
- Tap wrong twice in a row → "X × Y = Z — got it" message appears, then advances.
- After 6 correct answers (mix of attempts) → bone count increases for compsognathus.
- Refresh page mid-dig → state persisted (e.g. bone counts retain).
- Repeat enough to get 9 bones → "skeleton complete!" message.

Stop the server.

- [ ] **Step 8.4: Commit**

```bash
git add js/views/dig.js css/style.css
git commit -m "dig: question UX, weighted sampling, forgiving wrong-answer handling, bone/egg reveal"
```

---

## Task 9: Museum view

**Files:**
- Modify: `js/views/museum.js`
- Append: `css/style.css`

A scrollable grid of 12 species. Each card shows: silhouette tinted with the species colour, name, bones X/9. Completed skeletons show a tap-to-reveal fact.

- [ ] **Step 9.1: Add museum CSS**

Append to `css/style.css`:

```css
.museum-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.museum-card {
  background: #fff; border-radius: 14px; padding: 12px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.museum-card .silhouette {
  width: 100%; aspect-ratio: 1.5;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 32px;
  color: rgba(255,255,255,0.92);
}

.museum-card.locked .silhouette { opacity: 0.18; filter: grayscale(1); }
.museum-card.complete .silhouette { box-shadow: 0 0 0 3px var(--accent) inset; }

.museum-card .name { font-size: 13px; font-weight: 600; text-align: center; }
.museum-card .progress { font-size: 12px; color: var(--muted); }

.museum-card button.fact-btn {
  border: 0; background: rgba(0,0,0,0.06);
  border-radius: 999px; padding: 4px 10px; font-size: 11px;
  cursor: pointer; margin-top: 4px;
}

.fact-modal {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  padding: 20px; z-index: 10;
}

.fact-modal .panel {
  background: #fff; border-radius: 20px;
  padding: 24px; max-width: 360px; width: 100%;
}

.fact-modal h3 { margin: 0 0 8px; }
.fact-modal p  { margin: 0 0 16px; line-height: 1.5; }
.fact-modal button {
  width: 100%; min-height: 48px;
  background: var(--museum); color: #fff;
  border: 0; border-radius: 12px; font-size: 16px;
  cursor: pointer;
}
```

- [ ] **Step 9.2: Implement `js/views/museum.js`**

```js
// js/views/museum.js
import { BONES_PER_SPECIES, ALL_SPECIES, SPECIES_BY_ZONE } from '../constants.js';

let speciesData = null;

async function loadSpecies() {
  if (speciesData) return speciesData;
  const res = await fetch('/data/species.json');
  speciesData = await res.json();
  return speciesData;
}

export async function mount(container, ctx) {
  const species = await loadSpecies();

  container.innerHTML = '';
  const view = document.createElement('section');
  view.className = 'view';
  view.innerHTML = `
    <h1>Museum</h1>
    <p class="subtitle">Tap a completed skeleton to read about the species.</p>
    <div class="museum-grid" data-role="grid"></div>
  `;
  container.appendChild(view);

  const grid = view.querySelector('[data-role="grid"]');

  for (const key of ALL_SPECIES) {
    const info = species[key];
    const museumEntry = ctx.state.museum[key];
    const zone = info.zone;
    const zoneUnlocked = ctx.state.zones[String(zone)].unlocked;
    const isComplete = museumEntry.bones >= BONES_PER_SPECIES;

    const card = document.createElement('div');
    card.className = `museum-card ${isComplete ? 'complete' : ''} ${zoneUnlocked ? '' : 'locked'}`;
    card.innerHTML = `
      <div class="silhouette" style="background:${info.tint};">${zoneUnlocked ? '🦴' : '?'}</div>
      <div class="name">${info.displayName}</div>
      <div class="progress">${zoneUnlocked ? `${museumEntry.bones}/${BONES_PER_SPECIES} bones` : `Locked (${zone}× zone)`}</div>
      ${isComplete ? `<button class="fact-btn" type="button" data-species="${key}">Read fact</button>` : ''}
    `;
    grid.appendChild(card);
  }

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.fact-btn');
    if (!btn) return;
    const info = species[btn.dataset.species];
    showFact(info, container);
  });
}

function showFact(info, container) {
  const modal = document.createElement('div');
  modal.className = 'fact-modal';
  modal.innerHTML = `
    <div class="panel" role="dialog" aria-label="${info.displayName}">
      <h3>${info.displayName}</h3>
      <p>${info.fact}</p>
      <button type="button">Close</button>
    </div>
  `;
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.tagName === 'BUTTON') modal.remove();
  });
  container.appendChild(modal);
}
```

- [ ] **Step 9.3: Manually verify in browser**

Run `npm run dev`. Steps:
- Tap Museum tab → grid of 12 cards. Compsognathus and velociraptor are unlocked (bones 0/9). The rest are locked, showing "Locked (Nx zone)".
- Go to Dig, complete a few bones for compsognathus.
- Return to Museum → progress updated.
- If you've completed a skeleton (test by manually setting `bones: 9` in DevTools `localStorage` then refreshing), tapping "Read fact" shows the fact modal.

Stop the server.

- [ ] **Step 9.4: Commit**

```bash
git add js/views/museum.js css/style.css
git commit -m "museum: 12-species grid, lock/progress/complete states, fact modal"
```

---

## Task 10: Sanctuary view

**Files:**
- Modify: `js/views/sanctuary.js`
- Append: `css/style.css`

Shows incubating eggs (with ticks remaining) and hatched dinos (with name and stage). Hatching modal appears on entering the view if any incubating egg has ticksRemaining === 0.

- [ ] **Step 10.1: Add sanctuary CSS**

Append to `css/style.css`:

```css
.sanctuary {
  background: linear-gradient(160deg, #cde4a8 0%, #8aae5a 60%, #4d7a2a 100%);
  border-radius: 24px; padding: 20px; min-height: 460px;
  color: #1f3010;
}

.sanctuary .section-title {
  font-size: 13px; text-transform: uppercase; letter-spacing: 1px;
  margin: 16px 0 8px; opacity: 0.7;
}

.egg-row {
  display: flex; gap: 12px; flex-wrap: wrap;
}
.egg {
  width: 56px; height: 70px;
  background: #fff; border-radius: 50% 50% 45% 45%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  font-size: 11px; color: #5a8c3d; font-weight: 700;
}
.egg .ticks { font-size: 22px; font-weight: 700; color: #2d5a1f; line-height: 1; }
.egg .ticks-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; }

.dino-row {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}
.dino {
  background: rgba(255,255,255,0.85); border-radius: 12px; padding: 10px;
  text-align: center;
}
.dino .icon { font-size: 32px; line-height: 1; }
.dino .name { font-weight: 700; margin-top: 4px; }
.dino .stage { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }

.empty-state {
  background: rgba(255,255,255,0.55);
  border-radius: 12px; padding: 16px;
  font-size: 14px; line-height: 1.5;
}

.hatch-modal { /* reuses .fact-modal layout */ }
.hatch-modal input {
  width: 100%; min-height: 48px; font-size: 18px;
  border: 1px solid #ddd; border-radius: 12px; padding: 0 14px;
  margin: 8px 0 16px;
}
```

- [ ] **Step 10.2: Implement `js/views/sanctuary.js`**

```js
// js/views/sanctuary.js
import { zoneAccuracy } from '../facts.js';
import {
  SPECIES_BY_ZONE, STAGE_JUVENILE_AT, STAGE_ADULT_AT,
} from '../constants.js';
import { sfx } from '../audio.js';

let speciesData = null;

async function loadSpecies() {
  if (speciesData) return speciesData;
  const res = await fetch('/data/species.json');
  speciesData = await res.json();
  return speciesData;
}

function stageFor(speciesKey, state) {
  const zone = speciesZone(speciesKey);
  const acc = zoneAccuracy(state.zones[String(zone)].facts);
  if (acc >= STAGE_ADULT_AT) return 'adult';
  if (acc >= STAGE_JUVENILE_AT) return 'juvenile';
  return 'hatchling';
}

function speciesZone(key) {
  for (const [zone, name] of Object.entries(SPECIES_BY_ZONE)) {
    if (name === key) return Number(zone);
  }
  return 1;
}

const STAGE_ICON = { hatchling: '🥚', juvenile: '🦖', adult: '🦕' };

export async function mount(container, ctx) {
  const species = await loadSpecies();
  container.innerHTML = '';
  const view = document.createElement('section');
  view.className = 'view';
  view.innerHTML = `
    <h1>Sanctuary</h1>
    <p class="subtitle">Your dinosaurs. Come back tomorrow — eggs tick once per play day.</p>
    <div class="sanctuary" data-role="root"></div>
  `;
  container.appendChild(view);
  render();

  // If any egg is ready, prompt to hatch (one at a time).
  const ready = ctx.state.incubating.find(e => e.ticksRemaining <= 0);
  if (ready) showHatch(ready);

  function render() {
    const root = view.querySelector('[data-role="root"]');
    const eggs = ctx.state.incubating.filter(e => e.ticksRemaining > 0);
    const dinos = ctx.state.sanctuary;

    root.innerHTML = `
      <div class="section-title">Eggs</div>
      ${eggs.length === 0
        ? `<div class="empty-state">No eggs yet — keep digging. About 1 in 10 finds is an egg.</div>`
        : `<div class="egg-row">${eggs.map(eggCard).join('')}</div>`
      }
      <div class="section-title">Dinosaurs</div>
      ${dinos.length === 0
        ? `<div class="empty-state">No dinos hatched yet. Eggs hatch after 3 days of practice.</div>`
        : `<div class="dino-row">${dinos.map(dinoCard).join('')}</div>`
      }
    `;
  }

  function eggCard(egg) {
    return `
      <div class="egg">
        <div class="ticks">${egg.ticksRemaining}</div>
        <div class="ticks-label">days</div>
      </div>
    `;
  }

  function dinoCard(d) {
    const stage = stageFor(d.species, ctx.state);
    return `
      <div class="dino">
        <div class="icon">${STAGE_ICON[stage]}</div>
        <div class="name">${escapeHtml(d.name)}</div>
        <div class="stage">${stage} ${species[d.species].displayName}</div>
      </div>
    `;
  }

  function showHatch(egg) {
    const info = species[egg.species];
    const modal = document.createElement('div');
    modal.className = 'fact-modal hatch-modal';
    modal.innerHTML = `
      <div class="panel" role="dialog">
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
      ctx.state.sanctuary.push({
        id: egg.id,
        species: egg.species,
        name: raw,
        hatchedAt: new Date().toISOString(),
      });
      ctx.save();
      sfx.fanfare();
      modal.remove();
      render();
      // Chain: if more eggs ready, show next.
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
```

- [ ] **Step 10.3: Manually verify in browser**

Run `npm run dev`. Steps:
- Sanctuary tab loads. Empty state shown for eggs and dinos.
- In DevTools localStorage, manually add an incubating egg with `ticksRemaining: 0` and a species key (e.g. compsognathus). Refresh.
- On entering Sanctuary, the hatch modal appears. Enter a name → confirm. Dino appears.
- Add another egg with `ticksRemaining: 2`. Refresh, change system date one day forward (or change `lastPlayed` in localStorage to yesterday). The egg should tick to 1, etc.

Stop the server.

- [ ] **Step 10.4: Commit**

```bash
git add js/views/sanctuary.js css/style.css
git commit -m "sanctuary: eggs, hatch modal with naming, dino cards with stage from zone accuracy"
```

---

## Task 11: Polish — home additions, mute toggle, dino emoji set

**Files:**
- Modify: `js/views/home.js`
- Append: `css/style.css`

Add a mute toggle on home and a few quality-of-life details surfacing recent progress.

- [ ] **Step 11.1: Add mute-toggle CSS**

Append to `css/style.css`:

```css
.utility-row {
  display: flex; gap: 12px; margin-top: 20px;
}
.utility-row button {
  flex: 1; min-height: 44px;
  background: #fff; color: var(--ink);
  border: 1px solid rgba(0,0,0,0.08); border-radius: 12px;
  font-size: 14px; cursor: pointer;
}
.utility-row button[aria-pressed="true"] { background: var(--ink); color: #fff; }
```

- [ ] **Step 11.2: Update `js/views/home.js`**

Replace its contents with:

```js
// js/views/home.js
import { zoneAccuracy } from '../facts.js';
import { setMuted } from '../audio.js';
import { SPECIES_BY_ZONE, ZONES, BONES_PER_SPECIES } from '../constants.js';

export function mount(container, ctx) {
  const { state, save, navigate } = ctx;

  const unlocked = ZONES.filter(z => state.zones[String(z)].unlocked);
  const suggested = unlocked.find(z => zoneAccuracy(state.zones[String(z)].facts) < 0.8) ?? unlocked.at(-1);
  const suggestedSpecies = SPECIES_BY_ZONE[suggested];

  const totalBones = Object.values(state.museum).reduce((s, m) => s + m.bones, 0);
  const totalDinos = state.sanctuary.length;
  const eggsIncubating = state.incubating.length;

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
```

- [ ] **Step 11.3: Manually verify**

Run `npm run dev`. Confirm:
- Home shows streak, today's dig, "So far" summary line, and a mute toggle.
- Tapping mute disables sound effects across views. Reloading the page preserves the setting.

- [ ] **Step 11.4: Commit**

```bash
git add js/views/home.js css/style.css
git commit -m "home: progress summary line and mute toggle"
```

---

## Task 12: PWA — manifest + service worker + iPad install test

**Files:**
- Create: `manifest.webmanifest`
- Create: `service-worker.js`
- Create: `assets/icons/icon-192.png` (placeholder — generated SVG export)
- Create: `assets/icons/icon-512.png` (same)
- Modify: `js/app.js` (register SW)

Goal: when the parent opens the deployed URL on the iPad and hits Share → Add to Home Screen, the result is a full-screen icon that works offline.

- [ ] **Step 12.1: Create `manifest.webmanifest`**

```json
{
  "name": "Dino Times",
  "short_name": "Dino Times",
  "description": "Times-tables practice with a paleontologist twist.",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#f5efe6",
  "theme_color": "#6b4423",
  "orientation": "portrait",
  "icons": [
    { "src": "assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 12.2: Generate placeholder icons**

The icons can be simple flat-colour SVG-derived PNGs. Easiest: use an online maskable-icon generator, OR write a tiny Node script. For v1, the script approach keeps it reproducible:

Create `scripts/make-icons.mjs`:
```js
// Generates simple stub PNGs. Requires no native deps.
import { writeFileSync } from 'node:fs';

function pngSquare(size, rgb) {
  // Minimal uncompressed PNG. Not optimal, fine for a 512px icon.
  const { PNG } = await import('pngjs');
  const img = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) * 4;
      img.data[idx] = rgb[0];
      img.data[idx+1] = rgb[1];
      img.data[idx+2] = rgb[2];
      img.data[idx+3] = 255;
    }
  }
  return PNG.sync.write(img);
}

// This is a deferred-deps approach. If pngjs isn't installed, fall back to instruction:
console.log('To regenerate icons run: npm i -D pngjs && node scripts/make-icons.mjs');
```

Alternative (simpler) — commit hand-made PNGs:
- Open `https://maskable.app/editor`, pick a flat colour (#6b4423), add the text "DT", export 192 + 512.
- Save as `assets/icons/icon-192.png` and `assets/icons/icon-512.png`.

Either path is fine. **The plan-executor should use the maskable.app/editor route for speed in v1.**

- [ ] **Step 12.3: Create `service-worker.js`**

```js
// service-worker.js
// Cache-first for the app shell. Bumped CACHE_VERSION invalidates old caches.
const CACHE_VERSION = 'dino-times-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './js/constants.js',
  './js/state.js',
  './js/facts.js',
  './js/audio.js',
  './js/views/home.js',
  './js/views/dig.js',
  './js/views/museum.js',
  './js/views/sanctuary.js',
  './data/species.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const res = await fetch(event.request);
      const cache = await caches.open(CACHE_VERSION);
      cache.put(event.request, res.clone());
      return res;
    } catch {
      return cached || Response.error();
    }
  })());
});
```

- [ ] **Step 12.4: Register the service worker in `js/app.js`**

Append at the bottom of `js/app.js`:

```js
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(err => {
      console.warn('SW registration failed', err);
    });
  });
}
```

- [ ] **Step 12.5: Manual test — service worker locally**

Run `npm run dev`. In a Chromium browser, open DevTools → Application → Service Workers. Confirm the worker registers without errors. Toggle "Offline" and refresh — the page still loads.

- [ ] **Step 12.6: Commit**

```bash
git add manifest.webmanifest service-worker.js js/app.js assets/icons/
git commit -m "pwa: manifest, cache-first service worker, app shell offline-capable"
```

---

## Task 13: README + GitHub Pages deploy walkthrough

**Files:**
- Create: `README.md`

The README is written for the parent (not a developer). Give them exact, click-by-click instructions for GitHub Pages, and the AirDrop fallback.

- [ ] **Step 13.1: Write `README.md`**

```markdown
# Dino Times

A multiplication tables game for one specific 9-year-old who likes dinosaurs.

## What it does

- Three rooms: a Dig Site (where she answers questions), a Museum (where bones collect into skeletons), and a Sanctuary (where rare eggs hatch into dinos she names).
- 12 tables zones (1× through 12×). Each unlocks the next at 80% accuracy.
- 5–10 minute sessions. Comes back better tomorrow because eggs only tick once per play day.

## Get it on her iPad — recommended path: GitHub Pages

This takes about 10 minutes the first time. After that, updates are just dragging a new file into the website.

### Step 1: Make a free GitHub account

1. Go to https://github.com/signup
2. Use any email, pick a username, verify the email.

### Step 2: Create a repository

1. Click the **+** at the top right of GitHub, then **New repository**.
2. **Repository name:** `dino-times`
3. **Visibility:** Public.
4. Check **Add a README file**.
5. Click **Create repository**.

### Step 3: Upload the game files

1. On your new repo page, click **Add file** → **Upload files**.
2. Drag and drop everything in the `dino-times` folder EXCEPT:
   - `node_modules/` (developer-only)
   - `docs/`, `package.json`, `package-lock.json`, `vite.config.js` (developer-only — not harmful, just unused)
   - `.superpowers/` (already gitignored)
3. Bottom of the page: **Commit changes**.

### Step 4: Turn on GitHub Pages

1. In the repo, click **Settings** (top right of the repo page).
2. Left sidebar: **Pages**.
3. Under **Build and deployment** → **Source**, pick **Deploy from a branch**.
4. **Branch:** `main` and folder `/ (root)`. Save.
5. Wait 1 minute. The page now shows: **Your site is live at `https://<your-username>.github.io/dino-times/`**.

### Step 5: Install on the iPad

1. Open Safari on the iPad. Go to the URL from step 4.
2. Tap the **Share** button (square with up arrow).
3. Scroll down → **Add to Home Screen** → **Add**.
4. Done. The icon on her home screen opens it like a real app, works offline, and updates next time it's online.

## Fallback path: AirDrop the file

If GitHub Pages feels like too much:
1. (Developer step) Bundle the site into a single `dino-times.html` file. _v1 doesn't ship this packaging — see notes in the spec._
2. AirDrop or email the file to the iPad.
3. Open it in Safari from the Files app.
4. Less polished: no app icon, no auto-update.

## Developer notes

```bash
npm install         # one-time
npm run dev         # start local dev server (http://localhost:5173)
npm test            # run unit tests
```

State lives in `localStorage` under key `dinoTimes.state.v1`. To reset: DevTools → Application → Local Storage → delete the key.
```

- [ ] **Step 13.2: Commit**

```bash
git add README.md
git commit -m "docs: README with non-developer GitHub Pages walkthrough + dev notes"
```

---

## Task 14: Final pass — end-to-end manual playtest

This task is verification, not new code. Skip if all earlier tasks were already manually verified.

- [ ] **Step 14.1: Reset state and play the first 10 minutes**

In DevTools → Application → Local Storage, delete the `dinoTimes.state.v1` key. Refresh.

Play through:
- Home → Start digging → answer 12–15 questions across 1× and 2×.
- Confirm: at least one bone added to compsognathus.
- Tap Museum → confirm compsognathus card shows `1/9` or more.
- Intentionally get two wrong on the same question → confirm the "got it" message appears, no streak drop, no red flash.
- Check that the suggested zone on Home advances once 1× zone hits 80%.

- [ ] **Step 14.2: Test the daily-tick**

In localStorage, edit `lastPlayed` to a date 1 day ago. Refresh. Confirm:
- Streak incremented by 1.
- Any incubating eggs decreased by 1 tick.

Set `lastPlayed` 3 days ago. Refresh. Confirm:
- Streak reset to 1.
- Eggs only ticked once (not 3 times).

- [ ] **Step 14.3: Test offline (PWA)**

In DevTools, set network to **Offline**. Refresh. Page loads from cache. All views work.

- [ ] **Step 14.4: Tag v0.1**

```bash
git tag v0.1
```

---

## Self-review

After writing the plan above, here's the checklist against the spec.

**Spec coverage:**
- World (3 rooms): Tasks 7–10. ✓
- Core loops (short / medium / long): Task 8 (short), Task 9 (medium), Task 10 (long). ✓
- Tables progression (80% unlock, weighted resampling): Task 4 + Task 8. ✓
- Question UX (forgiving wrong handling, two-wrong = show answer): Task 8. ✓
- Sanctuary mechanics (egg chance, ticks, hatch, naming, growth stages): Task 10 + Task 3 (tick semantics). ✓
- Daily rhythm (streak, today's dig banner): Task 7 + Task 11. ✓
- Content (12 species, 9 bones each, age-9 facts): Task 5. ✓
- Visual direction (warm/cool/green palettes, large tap targets): CSS across tasks. ✓
- Audio (defaults on, mute toggle, short synth tones): Task 6 + Task 11. ✓
- Tech architecture (vanilla JS, localStorage, no backend, PWA): Tasks 1–12. ✓
- Delivery (GitHub Pages + AirDrop fallback): Task 13. The AirDrop fallback is documented but not built in v1 — flagged explicitly in the README. ✓
- File layout: matches Task 1 scaffold. ✓
- Risks: anti-frustration UX baked into Task 8 (the forgiving wrong handling). localStorage warning surfaced in README. ✓

**Placeholder scan:** No "TBD", "TODO", or "implement later" steps. The icon generation step (12.2) offers two concrete paths and picks one — not a placeholder.

**Type consistency check:**
- Storage key: `dinoTimes.state.v1` consistent across `constants.js` and README.
- Fact keys: `'AxB'` format (e.g. `'7x8'`) used in `state.js`, `facts.js`, all tests, view code.
- State shape: `state.zones[String(z)].facts[key]` consistent everywhere.
- `outcome` values: `'right'|'wrong'|'shown'` consistent across `facts.test.js`, `facts.js`, `dig.js`.
- Egg shape: `{ id, species, ticksRemaining }` consistent across state, dig (creation), sanctuary (display + hatch).
- Species keys: lowercase strings (`'trex'`, not `'Trex'` or `'t-rex'`) consistent across constants, species.json, museum/sanctuary views.

Plan is clean.
