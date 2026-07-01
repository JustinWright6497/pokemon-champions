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

// A regulation set (e.g. Pokémon Champions "M-B") is the top-level ruleset.
interface RegulationSet {
  id: string;            // e.g. "champions-mB"
  name: string;          // "Pokémon Champions — Regulation Set M-B"
  game: 'champions';
  style: 'doubles';
  levelCap: number;      // 50
  bringCount: 6;         // team size
  pickCount: 4;          // chosen at team preview
  clauses: string[];     // ["species", "item"]
  allowedSpecies: string[];   // allow-list of species slugs legal in this reg set
  allowedMegas: string[];     // MegaForm ids permitted to Mega Evolve in this reg set
  banlist: { species: string[]; items: string[]; moves: string[]; abilities: string[] };
  activeFrom: string;    // ISO date, e.g. "2026-06-17"
  activeUntil?: string;  // ISO date, e.g. "2026-09-02"
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
| **`@pkmn/dex` / `@pkmn/data`** | Species, moves, items, abilities, learnsets, type chart, **classic Megas** | Maintained TS port of Showdown data — primary source for **shared** main-series content |
| **`@smogon/calc`** | Damage calculation engine | Use directly; do not reimplement damage math |
| **Battlepad Champions overlay** (curated) | **Reg M-B allow-list**, **new Legends Z-A Mega forms & stones**, Champions-specific tweaks | Our own maintained data — the gap `@pkmn/*` does not yet cover for Champions |
| **PokéAPI** | Supplemental dex data, IDs, some media URLs | Good for seeding/cross-checking; not required at runtime |
| **Community sprite sets** | Icons/sprites | Only if license permits; otherwise omit media in v1 |

> See [technical-architecture.md §9](technical-architecture.md#9-data-availability-risk-pokémon-champions)
> for the Champions data-availability risk. The **overlay is the critical piece**: everything
> Champions-specific that upstream libraries lack lives there, kept separate from shared data.

### Pipeline (`tools/ingest`)
1. **Fetch/generate** shared content from `@pkmn/*` (and optionally PokéAPI) at build time.
2. **Apply the Champions overlay** (curated JSON): Reg M-B allowed species/Megas, new Mega forms
   (base→mega stat/type/ability deltas), and Mega Stones.
3. **Normalize** into Battlepad's compact schema (stable slugs, minimal fields we actually use).
4. **Validate** with a schema check (e.g. Zod) and golden tests (counts, sample species + **every
   Mega form** correctness).
5. **Emit** versioned artifacts into `packages/data` with a `manifest.json`
   (`{ datasetVersion, regulationSets[], generatedAt, counts }`).
6. **Commit** generated artifacts (or fetch during CI build) so the app build is reproducible offline.

### Versioning
- Reference dataset carries `datasetVersion` and the list of `regulationSets` it contains.
- **Regulation rotations** (e.g. M-B → the next Champions reg after 2 Sept 2026) = a new dataset
  version shipped via app update. Teams store `regulationId`, so old teams remain interpretable.

## 6. Open data questions to resolve during Phase 0
- Exact licenses/attribution requirements for each chosen source (especially any sprites).
- **Champions data gap audit:** which Reg M-B species and (especially) which of the 16 new Legends
  Z-A Megas are already present in `@pkmn/data`/`@smogon/calc`, and what must be curated by hand.
- Authoritative source for the **Reg M-B allowed-Pokémon and allowed-Mega lists** (e.g. Victory Road
  / official announcements) and a process to keep the overlay in sync.
- Whether to ship reference data as JSON bundles or a prebuilt read-only SQLite file (perf vs. size).
