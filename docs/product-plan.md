# Product Plan

## 1. Vision

Give competitive Pokémon players a single mobile tool that covers the whole loop of high-level
play: **prepare a team**, **practice/validate it**, and **make better decisions during live
battles**. Most existing tools live on desktop or the web and are split across many sites
(damage calculators, teambuilders, dex sites, paste hosts). Battlepad consolidates the essentials
into a fast, offline-capable phone app you can use at a tournament table or while laddering.

## 2. Target users ("champions")

| Persona | Needs |
| --- | --- |
| **VGC competitor** | Doubles-legal teams, speed control planning, item/ability tracking, quick damage calcs between turns |
| **Smogon singles ladder player** | Tier legality (OU/UU/etc.), team coverage, common-set knowledge |
| **Aspiring competitor** | Guardrails (legality warnings), explanations of type math and stats |
| **Tournament player** | Reliable **offline** operation, fast glanceable UI, paste import/export to match official tools |

Primary focus for v1: **VGC doubles** and **Smogon OU singles**, because they have the clearest
rulesets and the largest communities.

## 3. Core features

### 3.1 Team Builder (MVP)
- Add/remove/reorder up to 6 Pokémon per team.
- Per-Pokémon configuration:
  - Species, level, gender (where relevant)
  - Ability (constrained to the species' legal abilities)
  - Held item
  - Nature
  - EVs (0–252 per stat, 510 total cap) and IVs (0–31)
  - Up to 4 moves (constrained to learnset for the format/generation)
  - Tera type (Gen 9 formats)
- **Computed stats** display (HP/Atk/Def/SpA/SpD/Spe) reflecting base stats, level, nature, IV/EV.
- **Legality validation** against a selected format:
  - Species clause, item clause, level cap, banned lists, move/ability legality.
  - Inline, non-blocking warnings (let users build illegal teams but flag them).
- **Team analysis:**
  - Defensive type chart (team weaknesses/resistances heatmap).
  - Offensive coverage (which types the team can hit super-effectively).
  - Speed tier table for the team and against a benchmark list.
- **Persistence & sharing:**
  - Save, rename, duplicate, tag teams locally.
  - Import/export **PokéPaste-compatible** plaintext (interoperate with Showdown/PokéPaste).

### 3.2 Battle Companion (MVP-lite, expands in Phase 2)
- Start a "battle session" by picking your active team.
- **Opponent tracker:** add opponent Pokémon as they're revealed; record observed moves,
  item, and ability.
- **Matchup panel:** for any attacker/defender pairing, show type effectiveness multiplier and
  a quick "what threatens what" summary.
- **Speed comparison:** compare your Pokémon's speed against an opponent's (with modifiers:
  Tailwind, Trick Room, paralysis, Choice Scarf, +/- stages).
- **Damage calculator:** integrate `@smogon/calc` for accurate rolls (min/max %, KO chance).
- **Battle log & notes:** freeform notes + turn log, saved per session for later review.

### 3.3 Reference Dex (supporting)
- Searchable Pokémon, move, item, and ability database (offline).
- Used by both Team Builder and Companion via the shared core engine.

## 4. Explicitly out of scope (for now)
- Automated reading of the official games' screen / no integration with first-party servers.
- Live opponent prediction via AI/ML (could be a later research track).
- Account-required features in the MVP — everything works offline and anonymously first.
- Selling or redistributing copyrighted assets (sprites/audio); see compliance notes.

## 5. MVP definition (what "done" means for v1)
A user can, fully offline:
1. Build a 6-Pokémon team with full sets and see computed stats.
2. Get legality warnings and team weakness/coverage analysis for at least one format (VGC Reg
   ruleset **or** Smogon OU).
3. Import and export PokéPaste text.
4. Run a damage calc and a type-matchup check during a battle session with an opponent tracker.

## 6. Success metrics
- **Activation:** % of new users who save at least one complete (6-mon) team in week 1.
- **Companion usage:** # of battle sessions started per active user per week.
- **Retention:** D30 retention of competitive users.
- **Correctness (quality bar):** 100% of damage-calc and stat outputs match `@smogon/calc` /
  known references in the test suite (this is a trust-critical product — wrong numbers are fatal).

## 7. Key risks
| Risk | Mitigation |
| --- | --- |
| **Correctness of game math** | Reuse battle-tested OSS (`@smogon/calc`, `@pkmn/*`); golden-file tests against known cases |
| **Data freshness** each generation/format rotation | Build a repeatable ingestion pipeline; version datasets (see data-model.md) |
| **IP/trademark** | Third-party companion positioning, no first-party assets, clear disclaimers (see technical-architecture.md) |
| **Scope creep** | Strict MVP gate; Companion ships "lite" first |
