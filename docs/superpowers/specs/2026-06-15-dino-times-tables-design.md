# Dino Times Tables — Design

A multiplication tables game (1× through 12×) for a 9-year-old who likes dinosaurs, fossils, history and science, designed to be the thing she chooses to play rather than the thing she's told to practise.

**Date:** 2026-06-15
**Target user:** One specific 9-year-old. Reads fluently.
**Target device:** iPad, Safari.
**Target session:** 5–10 minutes, ideally daily.

## Goal

She will not learn her tables otherwise. The game has to be fun enough that she opens it voluntarily, and structured enough that opening it teaches her something. Engagement is the primary success metric; mastery is the secondary one. If she plays it for two weeks and stops, the design has failed regardless of how good the spaced-repetition is.

## Non-goals (for v1)

- Multi-user support, profiles, accounts.
- Cloud sync across devices.
- Parent dashboard / progress reports.
- Internationalisation.
- Adaptive difficulty beyond per-fact weighting.
- Social features.
- In-app purchases or ads (obviously).

## The world

She plays a paleontologist who runs a small dinosaur sanctuary. The game has three rooms, navigated via a bottom tab bar:

1. **Dig Site** — where she answers multiplication questions. Correct answers chip rock from a buried bone. 5–8 questions reveals one bone.
2. **Museum** — where bones accumulate into skeletons. Each completed skeleton unlocks a short real fact about the species.
3. **Sanctuary** — where rare digs produce eggs that hatch (after N days of practice) into living dinos she names and watches grow.

Skeletons and living dinos share species. Completing a Triceratops skeleton makes Triceratops eggs more likely to appear at the next dig — closing the loop between the three rooms.

## Core loops

**Short loop (one session):** open app → Dig Site → answer 10–15 questions → 1–2 bones revealed → satisfying. ~5–10 minutes.

**Medium loop (week):** bones accumulate into skeletons → Museum wing fills → real fact unlocked per completion. ~1 skeleton per week at the target play rate.

**Long loop (month+):** sanctuary fills with hatched, growing dinos she's named. This is the "come back tomorrow, my egg might hatch" pull.

## Tables progression

Twelve **expedition zones**, one per table (1× through 12×). Each zone holds 12 multiplication facts (1× zone: 1×1 through 1×12, etc.). Two unlock rules:

- Zones 1× and 2× start unlocked.
- A new zone unlocks when the previous zone hits **80% accuracy across its 12 facts** (last 5 attempts per fact).

Inside a zone, questions are sampled with weighted randomness based on a per-fact **shaky weight** stored locally:

- Each fact starts at weight 1.0.
- Wrong answer → weight ×1.6 (cap 5.0).
- Right answer first try → weight ×0.8 (floor 0.3).
- Right answer after being shown the answer → weight stays put.

This is spaced repetition without the SRS machinery — facts she struggles with reappear more often, naturally fading as she gets confident with them.

Once a zone is unlocked she can dig in any unlocked zone, so a session can mix easier and harder tables. The dig site shows the currently selected zone with a clear "Switch zone" affordance.

## Question UX

A dig question presents as:

- Big question text: `7 × 8 = ?`
- Four answer tiles. One correct, three distractors drawn from neighbouring facts (`7 × 7 = 49`, `7 × 9 = 63`, `8 × 8 = 64`).
- A "bone fragment" silhouette progressively revealed under the rock as she answers correctly.
- No timer. No streak counter visible inside the dig. Time pressure is the enemy here.

### Right answer
Satisfying rock-crack sound, the tapped tile pulses, a rock chunk falls away, bone reveals further. Next question after ~600ms.

### Wrong answer
The rock doesn't crack. The tapped tile greys out. No red flash, no "wrong" sting. She picks again from the remaining three.

### Second wrong on the same question
Game shows the answer with neutral framing: "7 × 8 = 56 — got it. Next one's coming…" Auto-advances. Fact's shaky weight goes up (1.6×) so it reappears soon. No streak broken, no penalty surfaced.

This is the core anti-frustration design. The cost of a wrong answer is just "the rock doesn't break this time" — never shame, never lost progress.

## Sanctuary mechanics

- A dig has a small chance (~10%) of unearthing an **egg** instead of a bone. If a species' skeleton in the museum is already complete, that species' egg is up-weighted, so the dig naturally pushes her toward "I dug up the bones, now I have the live one."
- Eggs incubate based on **days played**, not minutes. One incubation tick per day, regardless of session length. Eggs hatch after 3 ticks.
- This rewards daily play without punishing long sessions, and prevents grinding.
- Hatched dinos are named by her (text input, 12-char limit). It's a single-user game on her iPad, no moderation needed.
- A dino has three life stages: hatchling (on hatch) → juvenile (when its species' zone hits 50% accuracy) → adult (when its species' zone hits 80% accuracy — the same milestone that unlocks the next zone).
- Sanctuary view shows all living dinos in a side-scrolling pasture scene.

## Daily rhythm

- Home screen shows: streak counter ("3 days in a row!"), a "today's dig" banner highlighting the most appropriate zone (one she's not yet at 80%), and any egg about to hatch.
- Streak breaks are silent — no shame message, just the counter resets.
- Push notifications: not in v1 (PWA notifications on iOS are clunky and feel pushy).

## Content (v1)

Twelve species, one headline dino per zone:

| Zone | Species         |
|------|-----------------|
| 1×   | Compsognathus   |
| 2×   | Velociraptor    |
| 3×   | Pterodactyl     |
| 4×   | Iguanodon       |
| 5×   | Stegosaurus     |
| 6×   | Parasaurolophus |
| 7×   | Ankylosaurus    |
| 8×   | Triceratops     |
| 9×   | Allosaurus      |
| 10×  | Spinosaurus     |
| 11×  | Brachiosaurus   |
| 12×  | T. rex          |

Loosely sized by approximate dino size so the late zones feel like the big payoff. Each species has:

- A skeleton of 9 bones (Museum view).
- A 2-sentence fact at age-9 reading level.
- A hatchling / juvenile / adult illustration (Sanctuary view).

Illustrations: SVG, hand-stylised, simple shapes. Not pixel art, not photorealistic.

## Visual direction

- Warm dig-site palette (sandstone, ochre, deep brown) for Dig.
- Cool museum palette (navy, brass, off-white) for Museum.
- Lush green palette (moss, fern, sky) for Sanctuary.
- One typeface across the app (e.g. Quicksand or Nunito — friendly, round, age-appropriate, free).
- iPad-first: large tap targets, generous spacing, no hover states.

A separate visual-direction screen will be brainstormed once implementation begins.

## Audio

- Default on, with a single mute toggle on the home screen.
- Sounds: rock chip (correct), soft "hmm" (wrong), little brass fanfare (skeleton complete), gentle chirp (egg hatch).
- No background music in v1.
- All sounds are short (<1s) and use Web Audio API or pre-rendered MP3s under 50KB each.

## Tech architecture

A standalone web app, vanilla HTML/CSS/JS, no framework.

- **State:** all in `localStorage` as a single JSON blob. No backend.
- **Persistence model:**
  ```json
  {
    "version": 1,
    "createdAt": "2026-06-15",
    "lastPlayed": "2026-06-15",
    "streak": 0,
    "muted": false,
    "zones": {
      "1": { "facts": { "1x1": { "weight": 1.0, "history": [] }, ... }, "unlocked": true },
      ...
    },
    "museum": { "compsognathus": { "bones": 0, "completedAt": null }, ... },
    "sanctuary": [ { "id": "...", "species": "triceratops", "name": "Bramble", "stage": "hatchling", "hatchedAt": "..." } ],
    "incubating": [ { "id": "...", "species": "stegosaurus", "ticksRemaining": 2 } ]
  }
  ```
- **One incubation tick per day** is enforced by comparing `lastPlayed`'s date with today's date on app open.
- **PWA:** `manifest.json` + service worker for "Add to Home Screen" behaviour (full-screen, icon, works offline).
- **Build:** none. Hand-written files. Can be hosted as static files anywhere.

## Delivery

Two paths, parent picks whichever is easier:

**(Recommended) GitHub Pages PWA**

1. Create a free GitHub account.
2. Create a new public repo, drop the project files in.
3. Settings → Pages → enable.
4. Open the URL on the iPad in Safari → Share → Add to Home Screen.
5. Result: looks and feels like a real app, free hosting, easy to update by editing files in GitHub's web UI.

Walkthrough provided when we get to it.

**(Fallback) Self-contained HTML file**

1. Single `index.html` with all CSS/JS inline and assets as data URIs.
2. AirDrop or email it to the iPad.
3. Open in Safari from Files app.
4. Works, but no Add-to-Home-Screen icon, and updates mean re-AirDropping.

Both delivery paths are supported by the same build — the only difference is whether assets are inlined or split. The implementation should start with split files and inline as a final packaging step.

## File layout (target)

```
dino-times/
├── index.html
├── manifest.json
├── service-worker.js
├── css/
│   └── style.css
├── js/
│   ├── state.js          # load/save localStorage, daily-tick logic
│   ├── facts.js          # weighted question sampling, distractor generation
│   ├── views/
│   │   ├── home.js
│   │   ├── dig.js
│   │   ├── museum.js
│   │   └── sanctuary.js
│   └── audio.js
├── data/
│   ├── species.json      # 12 species: name, fact, sizing
│   └── facts.json        # all 144 multiplication facts (optional, can compute)
├── assets/
│   ├── icons/
│   ├── species/          # SVG illustrations
│   └── sounds/
└── docs/
    └── superpowers/specs/2026-06-15-dino-times-tables-design.md
```

## Open questions (deferred from brainstorm)

- **Visual style of dinos** — cute / cartoony vs more naturalistic. Decide via mockup during implementation.
- **Typography choice** — Quicksand vs Nunito vs Fredoka. Decide via mockup.
- **Sound assets** — record / synth / library. Decide during implementation; placeholder beeps until then.

## Risks

- **She bounces in week 1.** Mitigation: keep the early zones (1×, 2×) trivial so the first session is pure win.
- **The hatchery loop feels artificial.** Mitigation: tie species to zones she's earned, so the egg she hatches is a species she "discovered." Egg can also be the dino she just completed in the museum.
- **localStorage gets cleared by Safari.** Mitigation: warn in the README; consider exporting state to a copy-pasteable string as a manual backup. Defer to v2 unless it actually bites.
- **The math becomes the obstacle to the dinosaurs.** This is the existential risk. The wrong-answer handling is the main defence — it has to feel friendly, never punishing. Implementation must guard this in playtesting.

## Success criteria

- She plays at least 3 of the first 5 days unprompted.
- After 4 weeks she can answer 5× and below in under 5 seconds each, cold.
- She talks about the dinos by name.
- No tears.

