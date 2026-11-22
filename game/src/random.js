// The Velvet Vault — a tiny seeded random number generator.
// Screenshots stage the same frame every time, so the randomness behind
// them must be repeatable: same seed, same lamplight, same patrol jitter.

/** Mulberry32: a small, fast seeded PRNG. Seed is any 32-bit integer. */
export function makeRandom(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick an integer in [min, max] from the seeded generator. */
export function randomInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Pick one element of an array from the seeded generator. */
export function randomPick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}
