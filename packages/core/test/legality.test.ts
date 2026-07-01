import { describe, it, expect } from 'vitest';
import { validateTeam } from '../src/legality';
import { getFormsForSpecies } from '../src/dex';

const REG = 'M-B';
const baseForm = (slug: string) => getFormsForSpecies(slug).find((f) => !f.isMega)!.id;
const megaForm = (slug: string) => getFormsForSpecies(slug).find((f) => f.isMega)!.id;

describe('validateTeam', () => {
  it('accepts a legal 4-Pokémon doubles team', () => {
    const team = [
      { formId: baseForm('garchomp') },
      { formId: baseForm('incineroar') },
      { formId: baseForm('charizard') },
      { formId: baseForm('gyarados') },
    ];
    const result = validateTeam(team, REG, 'doubles');
    expect(result.legal).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('flags an undersized doubles team', () => {
    const result = validateTeam([{ formId: baseForm('garchomp') }], REG, 'doubles');
    expect(result.violations.some((v) => v.code === 'team-size')).toBe(true);
  });

  it('flags the Species Clause (base + Mega of the same species)', () => {
    const team = [
      { formId: baseForm('charizard') },
      { formId: megaForm('charizard') },
      { formId: baseForm('garchomp') },
      { formId: baseForm('incineroar') },
    ];
    const result = validateTeam(team, REG, 'doubles');
    expect(result.violations.some((v) => v.code === 'species-clause')).toBe(true);
  });

  it('flags the Item Clause (duplicate held item)', () => {
    const team = [
      { formId: baseForm('garchomp'), itemName: 'Life Orb' },
      { formId: baseForm('incineroar'), itemName: 'Life Orb' },
      { formId: baseForm('charizard') },
      { formId: baseForm('gyarados') },
    ];
    const result = validateTeam(team, REG, 'doubles');
    expect(result.violations.some((v) => v.code === 'item-clause')).toBe(true);
  });

  it('flags an EV total over 510', () => {
    const team = [
      { formId: baseForm('garchomp'), evs: { hp: 252, atk: 252, spe: 252 } },
      { formId: baseForm('incineroar') },
      { formId: baseForm('charizard') },
      { formId: baseForm('gyarados') },
    ];
    const result = validateTeam(team, REG, 'doubles');
    expect(result.violations.some((v) => v.code === 'ev-total')).toBe(true);
  });
});
