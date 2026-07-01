# Data Model & Data Sources

## 1. Two kinds of data

| Kind | Examples | Lifetime | Storage |
| --- | --- | --- | --- |
| **Reference data** (read-only) | species, moves, items, abilities, **Mega forms & stones**, type chart, **regulation sets**, learnsets | Updated per regulation rotation, shipped with the app | Bundled, versioned dataset (`@battlepad/data`), loaded into in-memory indexes (optionally a read-only SQLite db) |
| **User data** (read/write) | teams, Pokémon sets, battle sessions, notes, settings | Created/edited by the user | SQLite (Drizzle ORM) with migrations |

> **Target game: Pokémon Champions.** Reference data is scoped to what Champions/VGC needs and is
> **versioned by regulation set** (v1 seeds **Regulation Set M-B**). The signature mechanic is
> **Mega Evolution**, so Mega forms are first-class reference data; there is **no Terastallization**.

## 2. Domain entities (conceptual)

```
RegulationSet ──< RulesetClause
  │  (allowedSpecies, allowedMegas, banlists, levelCap)
  └──< (legal) Species

Species ──< Ability (legal abilities)
Species ──< Move (legal moveset for Champions)
Species ──  BaseStats, Types[1..2]
Species ──? MegaForm (via a required Mega Stone item)
MegaForm:  megaStats, megaTypes[1..2], megaAbility

Team ──< TeamSlot (0..6) ── PokemonSet
PokemonSet:
  species, level(50), nature, item(may be a Mega Stone), ability,
  moves[0..4], isMega(intent),
  evs{hp,atk,def,spa,spd,spe}, ivs{...}, gender, nickname

BattleSession ──  myTeamRef, chosenLeads[4]
BattleSession ──< OpponentMon (from open sheet or revealed)
BattleSession ──  megaUsed{ me, opponent }   // one Mega per side per battle
BattleSession ──< LogEntry / Note
```

### Reference types (TypeScript sketch)
```ts
type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
type PokemonType =
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

interface Species {
  id: string;            // stable slug, e.g. "garchomp"
  name: string;
  natdex: number;
  types: [PokemonType] | [PokemonType, PokemonType];
  baseStats: Record<StatKey, number>;
  abilities: { slot: 0 | 1 | 'H'; name: string }[];
  mega?: MegaForm[];     // present if this species can Mega Evolve (may have >1, e.g. X/Y)
}

// A Mega Evolution: the transformed form the species takes when holding its Mega Stone.
interface MegaForm {
  id: string;            // e.g. "garchomp-mega"
  stoneItemId: string;   // required held item, e.g. "garchompite"
  name: string;          // display, e.g. "Mega Garchomp"
  types: [PokemonType] | [PokemonType, PokemonType];
  baseStats: Record<StatKey, number>;
  ability: string;       // Mega forms have a single fixed ability
}

// A regulation set (e.g. Pokémon Champions "M-A"/"M-B") is the top-level ruleset.
// Legality is cumulative across regulations; each spans one or more Seasons.
interface RegulationSet {
  id: string;            // e.g. "champions-mA" | "champions-mB"
  name: string;          // "Pokémon Champions — Regulation M-B"
  game: 'champions';
  // Champions has BOTH rulesets; VGC = doubles. Each carries its own team-size bounds.
  rulesets: {
    singles: { minTeam: 3; maxTeam: 6 };
    doubles: { minTeam: 4; maxTeam: 6 };   // VGC
  };
  levelCap: number;      // 50 (all Pokémon auto-leveled)
  pickCount: 4;          // chosen at team preview (VGC doubles)
  timers: { yourTimeSec: 420; teamPreviewSec: 90; turnSec: 45 };
  clauses: string[];     // ["species", "item"]
  allowedSpecies: string[];   // cumulative allow-list of species/form slugs legal in this reg set
  allowedMegas: string[];     // MegaForm ids permitted to Mega Evolve in this reg set
  addedItems?: string[];      // items newly introduced by this regulation (e.g. M-B item batch)
  banlist: { species: string[]; items: string[]; moves: string[]; abilities: string[] };
  activeFrom: string;    // ISO date, e.g. "2026-06-17"
  activeUntil?: string;  // ISO date, e.g. "2026-09-02"
  seasons: Season[];
}

interface Season {
  id: string;            // e.g. "M-1" | "M-2" | "M-3"
  regulationId: string;  // parent regulation
  activeFrom: string;    // ISO date
  activeUntil?: string;  // ISO date
  // Optional per-season legality delta if a season differs from its regulation's baseline.
  allowedSpeciesOverride?: string[];
}
```

### User types (TypeScript sketch)
```ts
interface PokemonSet {
  id: string;
  speciesId: string;
  nickname?: string;
  level: number;         // 50 for Champions VGC
  nature: string;
  abilityName: string;
  itemName?: string;     // may be a Mega Stone
  moves: string[];       // up to 4
  evs: Record<StatKey, number>;  // each 0..252, sum <= 510
  ivs: Record<StatKey, number>;  // each 0..31
  gender?: 'M' | 'F' | 'N';
  // `isMega` is derived: true when itemName is this species' Mega Stone and the reg set allows it.
  // No teraType — Terastallization is not a Pokémon Champions mechanic.
}

interface Team {
  id: string;
  name: string;
  regulationId: string;  // e.g. "champions-mB"
  slots: PokemonSet[];   // up to 6
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

interface BattleSession {
  id: string;
  teamId: string;
  regulationId: string;
  startedAt: number;
  chosenLeads: string[];        // up to `pickCount` set ids brought to the battle
  opponents: OpponentMon[];     // pre-loaded from an open sheet, or added as revealed
  megaUsed: { me: boolean; opponent: boolean };  // one Mega per side per battle
  log: { turn: number; text: string; at: number }[];
  notes: string;
}

interface OpponentMon {
  speciesId: string;
  source: 'openSheet' | 'revealed';
  knownMoves: string[];
  knownItem?: string;     // Mega Stone here flags a possible Mega threat
  knownAbility?: string;
  canMega?: boolean;      // derived from species + Mega Stone + reg set
}
```

## 3. Local persistence (SQLite via Drizzle)
- Tables for `teams`, `pokemon_sets`, `battle_sessions`, `opponent_mons`, `log_entries`, `settings`.
- `pokemon_sets.evs/ivs/moves` stored as JSON columns (small, append-rarely) to keep schema simple;
  promote to relational tables only if querying inside them becomes necessary.
- **Migrations** are mandatory from day one (Drizzle migrations) so user teams survive app updates.
- All reference IDs (speciesId, move/item/ability names) are **stable slugs**, never numeric DB IDs,
  so user data stays valid across dataset updates.

## 4. Interoperability
- **PokéPaste / Showdown text format** is the lingua franca of competitive Pokémon. Implement a
  robust **parser and serializer** in `@battlepad/core` so users can paste teams in/out and match the
  tools they already use. This is a high-value, MVP-level feature.

## 5. Data sources & ingestion pipeline

### Sources (evaluate licenses before use)
| Source | Provides | Notes |
| --- | --- | --- |
| **Serebii — Pokémon Champions** | **Source of truth** for Champions: per-regulation/season legality, newly-usable Pokémon (incl. regional + **Mega forms**), item additions, and per-species **abilities/skills + moves** | See [data-sources.md](data-sources.md) for the URL map and scraping plan |
| **`@pkmn/dex` / `@pkmn/data`** | Base stats, type chart, shared main-series mechanics, classic Megas | Used as a **cross-check** for shared content, not the Champions authority |
| **`@smogon/calc`** | Damage calculation engine | Use directly; do not reimplement damage math |
| **PokéAPI** | Supplemental dex data, IDs | Optional seeding/cross-checking; not required at runtime |
| **Community sprite sets** | Icons/sprites | Only if license permits; otherwise omit media in v1 (do not redistribute Serebii assets) |

> The **Champions overlay is built from Serebii** and is the critical piece: everything
> Champions-specific (Reg M-A/M-B legality across Seasons M-1/M-2/M-3, Mega forms, item additions)
> lives there, kept separate from shared data. See
> [technical-architecture.md §9](technical-architecture.md#9-data-availability-risk-pokémon-champions).

### Pipeline (`tools/ingest`)
1. **Scrape Serebii** at build time (gently; cached, rate-limited — see
   [data-sources.md §6](data-sources.md#6-compliance--etiquette-for-scraping-serebii)):
   - Regulation pages (**M-A**, **M-B**) → rulesets, season durations, newly-usable Pokémon, item additions.
   - Champions Pokédex species pages → abilities/skills, moves, stats, types, and Mega-form data.
2. **Join & normalize** into Battlepad's schema (stable slugs); compute **cumulative legality per
   regulation and per season** (M-1, M-2 under M-A; M-3 under M-B).
3. **Cross-check** base stats/types against `@pkmn/data` for shared species; flag discrepancies.
4. **Validate** with a schema check (e.g. Zod) and golden tests (counts, sample species + **every
   Mega form** correctness).
5. **Emit** versioned artifacts into `packages/data` with a `manifest.json`
   (`{ datasetVersion, regulations: ["M-A","M-B"], seasons: ["M-1","M-2","M-3"], generatedAt, counts }`).
6. **Commit** generated artifacts (or fetch during CI build) so the app build is reproducible offline.

### Versioning
- Reference dataset carries `datasetVersion` and the list of `regulationSets` it contains.
- **Regulation rotations** (e.g. M-B → the next Champions reg after 2 Sept 2026) = a new dataset
  version shipped via app update. Teams store `regulationId`, so old teams remain interpretable.

## 6. Open data questions to resolve during Phase 0
- Serebii scraping **terms/permission** and attribution requirements (see
  [data-sources.md §6](data-sources.md#6-compliance--etiquette-for-scraping-serebii)).
- Whether **per-season** legality (M-1 vs M-2) differs from the regulation-level lists, or whether
  regulation-level lists are sufficient.
- Full enumeration of **Mega forms** across M-A + M-B and each Mega's stats/type/ability (the data
  least likely to exist outside Serebii).
- Whether to ship reference data as JSON bundles or a prebuilt read-only SQLite file (perf vs. size).
