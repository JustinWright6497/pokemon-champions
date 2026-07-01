import type { PokemonType } from '@battlepad/data';

export const colors = {
  bg: '#0f1220',
  card: '#1a1f36',
  cardAlt: '#232a4a',
  text: '#f5f7ff',
  textDim: '#9aa3c7',
  accent: '#5b8cff',
  border: '#2c3358',
};

export const TYPE_COLORS: Record<PokemonType, string> = {
  normal: '#9099a1', fire: '#ff9d55', water: '#5090d6', electric: '#f4d23c',
  grass: '#63bc5a', ice: '#73cec0', fighting: '#ce4069', poison: '#ab6ac8',
  ground: '#d97845', flying: '#8fa9de', psychic: '#f97176', bug: '#90c12c',
  rock: '#c7b78b', ghost: '#5269ad', dragon: '#0b6dc3', dark: '#5a5366',
  steel: '#5a8ea1', fairy: '#ec8fe6',
};

export const STAT_LABELS: Record<string, string> = {
  hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe',
};

export function typeColor(t: PokemonType): string {
  return TYPE_COLORS[t] ?? colors.textDim;
}
