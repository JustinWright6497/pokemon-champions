import pokemonJson from '../champions/pokemon.json';
import formsJson from '../champions/forms.json';
import regulationsJson from '../champions/regulations.json';
import itemsJson from '../champions/items.json';
import manifestJson from '../champions/manifest.json';

import type {
  PokemonFile, FormsFile, RegulationsFile, ItemsFile,
} from './types';

export * from './types';

export const pokemonFile = pokemonJson as unknown as PokemonFile;
export const formsFile = formsJson as unknown as FormsFile;
export const regulationsFile = regulationsJson as unknown as RegulationsFile;
export const itemsFile = itemsJson as unknown as ItemsFile;
export const manifest = manifestJson as {
  datasetVersion: string;
  source: string;
  generatedAt: string;
  regulations: string[];
  seasons: string[];
  counts: Record<string, number>;
};

export const pokemon = pokemonFile.pokemon;
export const forms = formsFile.forms;
export const legalFormsByRegulation = formsFile.legalFormsByRegulation;
export const regulations = regulationsFile.regulations;
export const addedItems = itemsFile.addedItems;
