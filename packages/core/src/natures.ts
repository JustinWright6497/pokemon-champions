import type { StatKey } from '@battlepad/data';

// A nature raises one stat by 10% and lowers another by 10% (HP is never affected).
export interface Nature {
  name: string;
  plus: StatKey | null;
  minus: StatKey | null;
}

const N = (name: string, plus: StatKey | null, minus: StatKey | null): Nature => ({ name, plus, minus });

export const NATURES: Record<string, Nature> = {
  hardy: N('Hardy', null, null),
  lonely: N('Lonely', 'atk', 'def'),
  brave: N('Brave', 'atk', 'spe'),
  adamant: N('Adamant', 'atk', 'spa'),
  naughty: N('Naughty', 'atk', 'spd'),
  bold: N('Bold', 'def', 'atk'),
  docile: N('Docile', null, null),
  relaxed: N('Relaxed', 'def', 'spe'),
  impish: N('Impish', 'def', 'spa'),
  lax: N('Lax', 'def', 'spd'),
  timid: N('Timid', 'spe', 'atk'),
  hasty: N('Hasty', 'spe', 'def'),
  serious: N('Serious', null, null),
  jolly: N('Jolly', 'spe', 'spa'),
  naive: N('Naive', 'spe', 'spd'),
  modest: N('Modest', 'spa', 'atk'),
  mild: N('Mild', 'spa', 'def'),
  quiet: N('Quiet', 'spa', 'spe'),
  bashful: N('Bashful', null, null),
  rash: N('Rash', 'spa', 'spd'),
  calm: N('Calm', 'spd', 'atk'),
  gentle: N('Gentle', 'spd', 'def'),
  sassy: N('Sassy', 'spd', 'spe'),
  careful: N('Careful', 'spd', 'spa'),
  quirky: N('Quirky', null, null),
};

export function getNature(name: string): Nature {
  const key = name.toLowerCase().trim();
  const nature = NATURES[key];
  if (!nature) throw new Error(`Unknown nature: ${name}`);
  return nature;
}

// Multiplier applied to a stat under a nature (1.1, 0.9, or 1.0).
export function natureModifier(nature: Nature, stat: StatKey): number {
  if (stat === 'hp') return 1;
  if (nature.plus === stat) return 1.1;
  if (nature.minus === stat) return 0.9;
  return 1;
}
