import { describe, it, expect } from 'vitest';
import { getMegaForms, resolveByForm } from '../src/mega';
import { getFormsForSpecies } from '../src/dex';

describe('getMegaForms', () => {
  it('returns both Charizard Megas with correct typing and stats', () => {
    const megas = getMegaForms('charizard');
    const names = megas.map((m) => m.displayName).sort();
    expect(names).toEqual(['Mega Charizard X', 'Mega Charizard Y']);

    const x = megas.find((m) => m.displayName === 'Mega Charizard X')!;
    expect(x.isMega).toBe(true);
    expect(x.types).toEqual(['fire', 'dragon']);
    expect(x.base).toEqual({ hp: 78, atk: 130, def: 111, spa: 130, spd: 85, spe: 100 });
  });

  it('resolves Mega Garchomp stats (total 700)', () => {
    const megas = getMegaForms('garchomp');
    expect(megas).toHaveLength(1);
    const m = megas[0]!;
    expect(m.base).toEqual({ hp: 108, atk: 170, def: 115, spa: 120, spd: 95, spe: 92 });
  });
});

describe('resolveByForm', () => {
  it('resolves a base form with its default abilities', () => {
    const base = getFormsForSpecies('garchomp').find((f) => !f.isMega)!;
    const resolved = resolveByForm('garchomp', base.id)!;
    expect(resolved.types).toEqual(['dragon', 'ground']);
    expect(resolved.abilities.map((a) => a.slug)).toContain('roughskin');
  });
});
