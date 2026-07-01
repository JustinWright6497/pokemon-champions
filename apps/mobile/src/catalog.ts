import { pokemon, type PokemonType } from '@battlepad/data';
import { getFormsForSpecies } from '@battlepad/core';

export interface CatalogEntry {
  slug: string;
  name: string;
  natdex: number;
  types: PokemonType[];
  hasMega: boolean;
}

// One row per species (base form), used by the dex list.
export const catalog: CatalogEntry[] = pokemon
  .map((p): CatalogEntry => {
    const speciesForms = getFormsForSpecies(p.slug);
    const base = speciesForms.find((f) => !f.isMega) ?? speciesForms[0];
    return {
      slug: p.slug,
      name: p.name,
      natdex: p.natdex,
      types: base?.types ?? [],
      hasMega: speciesForms.some((f) => f.isMega),
    };
  })
  .sort((a, b) => a.natdex - b.natdex);

export function searchCatalog(query: string): CatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return catalog;
  return catalog.filter(
    (e) => e.name.toLowerCase().includes(q) || String(e.natdex).padStart(3, '0').includes(q),
  );
}
