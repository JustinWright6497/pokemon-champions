import { regulations, type StatSpread } from '@battlepad/data';
import { getForm, isFormLegal } from './dex';
import { totalEvs } from './stats';

export type BattleStyle = 'singles' | 'doubles';

export interface TeamMemberInput {
  formId: string;
  itemName?: string | null;
  evs?: Partial<StatSpread>;
}

export interface Violation {
  code:
    | 'team-size'
    | 'unknown-form'
    | 'illegal-form'
    | 'species-clause'
    | 'item-clause'
    | 'ev-total';
  message: string;
  memberIndex?: number;
}

export interface LegalityResult {
  legal: boolean;
  violations: Violation[];
}

/** Validate a team against a Champions regulation + battle style. Warnings are non-blocking; the
 *  caller decides how to surface them. Returns every violation found. */
export function validateTeam(
  team: TeamMemberInput[],
  regulationId: string,
  style: BattleStyle = 'doubles',
): LegalityResult {
  const violations: Violation[] = [];
  const reg = regulations.find((r) => r.id === regulationId);
  const ruleset = reg?.rulesets[style];

  if (ruleset) {
    if (team.length < ruleset.minTeam || team.length > ruleset.maxTeam) {
      violations.push({
        code: 'team-size',
        message: `${style} teams must have ${ruleset.minTeam}–${ruleset.maxTeam} Pokémon (got ${team.length}).`,
      });
    }
  }

  const seenNatdex = new Set<number>();
  const seenItems = new Set<string>();

  team.forEach((member, i) => {
    const form = getForm(member.formId);
    if (!form) {
      violations.push({ code: 'unknown-form', message: `Unknown form "${member.formId}".`, memberIndex: i });
      return;
    }
    if (!isFormLegal(member.formId, regulationId)) {
      violations.push({
        code: 'illegal-form',
        message: `${form.displayName} is not legal in Regulation ${regulationId}.`,
        memberIndex: i,
      });
    }
    if (seenNatdex.has(form.natdex)) {
      violations.push({
        code: 'species-clause',
        message: `Species Clause: more than one Pokémon with National Dex #${form.natdex} (${form.displayName}).`,
        memberIndex: i,
      });
    }
    seenNatdex.add(form.natdex);

    if (member.itemName) {
      const key = member.itemName.toLowerCase().trim();
      if (seenItems.has(key)) {
        violations.push({
          code: 'item-clause',
          message: `Item Clause: duplicate held item "${member.itemName}".`,
          memberIndex: i,
        });
      }
      seenItems.add(key);
    }

    if (member.evs && totalEvs(member.evs) > 510) {
      violations.push({
        code: 'ev-total',
        message: `EV total exceeds 510 (got ${totalEvs(member.evs)}).`,
        memberIndex: i,
      });
    }
  });

  return { legal: violations.length === 0, violations };
}
