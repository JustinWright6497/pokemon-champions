import type { StatKey, StatSpread } from '@battlepad/data';
import { getNature, natureModifier, type Nature } from './natures';

export const STAT_KEYS: StatKey[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

export interface StatInput {
  base: StatSpread;
  ivs?: Partial<StatSpread>;
  evs?: Partial<StatSpread>;
  level?: number;
  nature?: string | Nature;
}

const clampIV = (v: number) => Math.max(0, Math.min(31, Math.trunc(v)));
const clampEV = (v: number) => Math.max(0, Math.min(252, Math.trunc(v)));

/** Compute a single final stat using the main-series (Gen 3+) formula, shared by Champions. */
export function computeStat(
  key: StatKey,
  base: number,
  iv: number,
  ev: number,
  level: number,
  natureMod: number,
): number {
  const i = clampIV(iv);
  const e = clampEV(ev);
  const common = Math.floor(((2 * base + i + Math.floor(e / 4)) * level) / 100);
  if (key === 'hp') {
    // Shedinja and other 1-HP cases are handled by data, not here.
    return common + level + 10;
  }
  return Math.floor((common + 5) * natureMod);
}

/** Compute all six final stats at a given level, IV/EV spread, and nature. */
export function computeStats(input: StatInput): StatSpread {
  const level = input.level ?? 50;
  const nature = typeof input.nature === 'string'
    ? getNature(input.nature)
    : input.nature ?? getNature('serious');

  const out = {} as StatSpread;
  for (const key of STAT_KEYS) {
    const iv = input.ivs?.[key] ?? 31;
    const ev = input.evs?.[key] ?? 0;
    out[key] = computeStat(key, input.base[key], iv, ev, level, natureModifier(nature, key));
  }
  return out;
}

/** Total of an EV spread (competitive cap is 510 total, 252 per stat). */
export function totalEvs(evs: Partial<StatSpread>): number {
  return STAT_KEYS.reduce((sum, k) => sum + (evs[k] ?? 0), 0);
}
