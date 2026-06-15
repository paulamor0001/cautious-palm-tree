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
