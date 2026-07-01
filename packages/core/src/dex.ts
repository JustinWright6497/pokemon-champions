import {
  pokemon, forms, legalFormsByRegulation,
  type SpeciesEntry, type Form, type StatBlock,
} from '@battlepad/data';

const speciesBySlug = new Map<string, SpeciesEntry>(pokemon.map((p) => [p.slug, p]));
const formById = new Map<string, Form>(forms.map((f) => [f.id, f]));

const formsBySpecies = new Map<string, Form[]>();
for (const f of forms) {
  const list = formsBySpecies.get(f.speciesSlug) ?? [];
  list.push(f);
  formsBySpecies.set(f.speciesSlug, list);
}

export function getSpecies(slug: string): SpeciesEntry | undefined {
  return speciesBySlug.get(slug);
}

export function getForm(id: string): Form | undefined {
  return formById.get(id);
}

export function getFormsForSpecies(slug: string): Form[] {
  return formsBySpecies.get(slug) ?? [];
}

/** Whether a form id is legal in a regulation (cumulative). */
export function isFormLegal(formId: string, regulationId: string): boolean {
  return legalFormsByRegulation[regulationId]?.includes(formId) ?? false;
}

/** The base (non-Mega) stat block for a species — the first block, by Serebii convention. */
export function baseStatBlock(slug: string): StatBlock | undefined {
  return getSpecies(slug)?.statBlocks[0];
}

/** Find a stat block on a species by its label (case-insensitive). */
export function statBlockByLabel(slug: string, label: string): StatBlock | undefined {
  const target = label.toLowerCase();
  return getSpecies(slug)?.statBlocks.find((b) => b.label.toLowerCase() === target);
}
