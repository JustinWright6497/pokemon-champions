import { describe, it, expect } from 'vitest';
import { typeEffectiveness, weaknesses, resistances } from '../src/typechart';

describe('typeEffectiveness', () => {
  it('handles immunities (Ground vs Charizard = 0)', () => {
    expect(typeEffectiveness('ground', ['fire', 'flying'])).toBe(0);
  });

  it('handles 4x weaknesses (Ice vs Garchomp = 4)', () => {
    expect(typeEffectiveness('ice', ['dragon', 'ground'])).toBe(4);
  });

  it('handles 4x weaknesses (Electric vs Gyarados = 4)', () => {
    expect(typeEffectiveness('electric', ['water', 'flying'])).toBe(4);
  });

  it('handles resistances (Water vs Water/Ground = 0.5*2 = 1)', () => {
    expect(typeEffectiveness('grass', ['water', 'ground'])).toBe(4);
  });

  it('neutral matchup is 1', () => {
    expect(typeEffectiveness('normal', ['fire'])).toBe(1);
  });
});

describe('weaknesses / resistances', () => {
  it('lists Garchomp (Dragon/Ground) weaknesses', () => {
    const w = weaknesses(['dragon', 'ground']);
    expect(w).toContain('ice');
    expect(w).toContain('dragon');
    expect(w).toContain('fairy');
  });

  it('lists an immunity as a resistance (Garchomp resists Electric = 0)', () => {
    expect(resistances(['dragon', 'ground'])).toContain('electric');
  });
});
