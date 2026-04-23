import { MAX_BIOMES } from './engine/constants'

/** Today's date as `YYYY-MM-DD` in Europe/Moscow. Deterministic across runs in the same day. */
export function todayMskIso(now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return fmt.format(now)
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

/** Mulberry32 PRNG seeded from a 32-bit integer. Returns a function producing [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Deterministic biome order for a given date (MSK).
 * Index 0 (desert) is always first; indices 1..MAX_BIOMES-1 are shuffled.
 */
export function getDailyBiomeOrder(dateIso: string): number[] {
  const rng = mulberry32(hashString(dateIso))
  const tail: number[] = []
  for (let i = 1; i < MAX_BIOMES; i++) tail.push(i)
  for (let i = tail.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = tail[i]
    tail[i] = tail[j]
    tail[j] = tmp
  }
  return [0, ...tail]
}
