import type { Ability, PokemonType, StatSpread } from '@battlepad/data';
import { getSpecies, getFormsForSpecies, statBlockByLabel } from './dex';

export interface ResolvedForm {
  formId: string;
  displayName: string;
  isMega: boolean;
  types: PokemonType[];
  base: StatSpread;
  abilities: Ability[];
}

/** All Mega forms available to a species (may be more than one, e.g. Charizard X/Y). */
export function getMegaForms(speciesSlug: string): ResolvedForm[] {
  const species = getSpecies(speciesSlug);
  if (!species) return [];
  return getFormsForSpecies(speciesSlug)
    .filter((f) => f.isMega)
    .map((f) => resolveByForm(speciesSlug, f.id))
    .filter((r): r is ResolvedForm => r !== null);
}

function abilitiesFor(speciesSlug: string, formLabel: string): Ability[] {
  const species = getSpecies(speciesSlug);
  if (!species) return [];
  const byForm = species.abilities.forms;
  // Prefer a form-specific ability entry; otherwise fall back to the species default.
  const match = Object.entries(byForm).find(([k]) => formLabel.toLowerCase().includes(k.toLowerCase()));
  return match?.[1] ?? byForm['default'] ?? [];
}

/** Resolve a specific form (by form id) into stats/types/abilities the engine can use. */
export function resolveByForm(speciesSlug: string, formId: string): ResolvedForm | null {
  const species = getSpecies(speciesSlug);
  const form = getFormsForSpecies(speciesSlug).find((f) => f.id === formId);
  if (!species || !form) return null;

  // Stat block whose label matches the form's display name; fall back to the base block.
  const block = statBlockByLabel(speciesSlug, form.displayName) ?? species.statBlocks[0];
  if (!block) return null;

  return {
    formId: form.id,
    displayName: form.displayName,
    isMega: form.isMega,
    types: form.types,
    base: block.base,
    abilities: abilitiesFor(speciesSlug, form.isMega ? form.displayName : 'default'),
  };
}
