// Types describing the generated Pokémon Champions dataset (see packages/data/champions/).

export type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';

export type PokemonType =
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

export type StatSpread = Record<StatKey, number>;

export type MoveCategory = 'physical' | 'special' | 'status';

export interface Move {
  slug: string;
  name: string;
  type: PokemonType;
  category: MoveCategory;
  power: string | null;
  accuracy: string | null;
  pp: string | null;
}

export interface MoveSection {
  form: string;
  moves: Move[];
}

export interface Ability {
  slug: string;
  name: string;
}

export interface StatBlock {
  label: string;
  total: number;
  base: StatSpread;
}

export interface SpeciesEntry {
  slug: string;
  natdex: number;
  name: string;
  abilities: { forms: Record<string, Ability[]>; raw: string | null };
  statBlocks: StatBlock[];
  moves: MoveSection[];
}

export interface Form {
  id: string;
  natdex: number;
  speciesSlug: string;
  displayName: string;
  icon: string;
  types: PokemonType[];
  isMega: boolean;
  regulation: string;
  introducedIn: string;
}

export type RegulationId = string;

export interface Ruleset {
  minTeam: number;
  maxTeam: number;
}

export interface Season {
  id: string;
  regulation: string;
  from: string;
  until: string;
}

export interface RegulationSummary {
  id: RegulationId;
  activeFrom: string | null;
  activeUntil: string | null;
  rulesets: { singles?: Ruleset; doubles?: Ruleset };
  seasons: Season[];
  rosterCount: number;
}

export interface ItemEntry {
  slug: string;
  name: string;
  introducedIn: string;
}

export interface PokemonFile { source: string; generatedAt: string; pokemon: SpeciesEntry[] }
export interface FormsFile {
  source: string;
  generatedAt: string;
  forms: Form[];
  legalFormsByRegulation: Record<RegulationId, string[]>;
}
export interface RegulationsFile {
  source: string;
  generatedAt: string;
  regulations: RegulationSummary[];
}
export interface ItemsFile { source: string; generatedAt: string; addedItems: ItemEntry[] }
