import { describe, it, expect } from 'vitest';
import { computeStats, totalEvs } from '../src/stats';

// Garchomp base stats.
const GARCHOMP = { hp: 108, atk: 130, def: 95, spa: 80, spd: 85, spe: 102 };

describe('computeStats (Level 50, main-series formula)', () => {
  it('computes neutral HP with 0 EVs / 31 IVs', () => {
    const s = computeStats({ base: GARCHOMP, level: 50 });
    expect(s.hp).toBe(183);
  });

  it('matches the known Adamant 252 Atk Garchomp value (200)', () => {
    const s = computeStats({ base: GARCHOMP, level: 50, nature: 'adamant', evs: { atk: 252 } });
    expect(s.atk).toBe(200);
  });

  it('matches the known Jolly 252 Spe Garchomp value (169)', () => {
    const s = computeStats({ base: GARCHOMP, level: 50, nature: 'jolly', evs: { spe: 252 } });
    expect(s.spe).toBe(169);
  });

  it('applies the hindering nature to the lowered stat', () => {
    const neutral = computeStats({ base: GARCHOMP, level: 50, nature: 'serious' });
    const minusAtk = computeStats({ base: GARCHOMP, level: 50, nature: 'bold' }); // -atk
    expect(minusAtk.atk).toBeLessThan(neutral.atk);
  });
});

describe('totalEvs', () => {
  it('sums an EV spread', () => {
    expect(totalEvs({ atk: 252, spe: 252, hp: 4 })).toBe(508);
  });
});
