/**
 * Deterministic shuffle using Mulberry32 PRNG
 * Same seed → same order, prevents "refresh to change answer" cheating
 */

/** Mulberry32 — fast 32-bit PRNG */
export function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Simple string hash to 32-bit integer */
export function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

/** Fisher-Yates shuffle with seeded PRNG, returns new array */
export function shuffleSeeded(arr, seed) {
  const a = [...arr];
  const rand = mulberry32(typeof seed === 'string' ? hashStr(seed) : seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffle and return indices mapping (answer position after shuffle) */
export function shuffleWithIndex(arr, seed) {
  const a = arr.map((val, idx) => ({ val, idx }));
  const rand = mulberry32(typeof seed === 'string' ? hashStr(seed) : seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return {
    values: a.map(x => x.val),
    originalIndex: a.map(x => x.idx),
  };
}
