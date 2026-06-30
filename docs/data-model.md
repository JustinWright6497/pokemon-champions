# Data Model & Data Sources

## 1. Two kinds of data

| Kind | Examples | Lifetime | Storage |
| --- | --- | --- | --- |
| **Reference data** (read-only) | species, moves, items, abilities, type chart, format rulesets, learnsets | Updated per game/format rotation, shipped with the app | Bundled, versioned dataset (`@battlepad/data`), loaded into in-memory indexes (optionally a read-only SQLite db) |
| **User data** (read/write) | teams, Pokémon sets, battle sessions, notes, settings | Created/edited by the user | SQLite (Drizzle ORM) with migrations |

## 2. Domain entities (conceptual)

```
Format ──< RulesetClause
  │
  └──< (legal) Species

Species ──< Ability (legal abilities)
Species ──< Move (learnset, per format/generation)
Species ──  BaseStats, Types[1..2]

Team ──< TeamSlot (0..6) ── PokemonSet
PokemonSet:
  species, level, nature, item, ability,
  moves[0..4], teraType,
  evs{hp,atk,def,spa,spd,spe}, ivs{...}, gender, nickname

BattleSession ──< OpponentMon (revealed)
BattleSession ──< LogEntry / Note
BattleSession ──  myTeamRef
```

### Reference types (TypeScript sketch)
```ts
type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
type PokemonType =
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

interface Species {
  id: string;            // stable slug, e.g. "great-tusk"
  name: string;
  natdex: number;
  types: [PokemonType] | [PokemonType, PokemonType];
  baseStats: Record<StatKey, number>;
  abilities: { slot: 0 | 1 | 'H'; name: string }[];
}

interface Format {
  id: string;            // e.g. "vgc2025-regH" | "gen9ou"
  name: string;
  generation: number;
  style: 'singles' | 'doubles';
  levelCap?: number;
  clauses: string[];     // e.g. ["species", "item", "sleep"]
  banlist: { species: string[]; items: string[]; moves: string[]; abilities: string[] };
}
```

### User types (TypeScript sketch)
```ts
interface PokemonSet {
  id: string;
  speciesId: string;
  nickname?: string;
  level: number;         // default 50 (VGC) or 100 (Smogon)
  nature: string;
  abilityName: string;
  itemName?: string;
  teraType?: PokemonType;
  moves: string[];       // up to 4
  evs: Record<StatKey, number>;  // each 0..252, sum <= 510
  ivs: Record<StatKey, number>;  // each 0..31
  gender?: 'M' | 'F' | 'N';
}

interface Team {
  id: string;
  name: string;
  formatId: string;
  slots: PokemonSet[];   // up to 6
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

interface BattleSession {
  id: string;
  teamId: string;
  formatId: string;
  startedAt: number;
  opponents: OpponentMon[];
  log: { turn: number; text: string; at: number }[];
  notes: string;
}

interface OpponentMon {
  speciesId: string;
  revealedMoves: string[];
  revealedItem?: string;
  revealedAbility?: string;
  teraType?: PokemonType;
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
| **`@pkmn/dex` / `@pkmn/data`** | Species, moves, items, abilities, learnsets, type chart, formats | Maintained TS port of Showdown data — the recommended primary source |
| **`@smogon/calc`** | Damage calculation engine | Use directly; do not reimplement damage math |
| **PokéAPI** | Supplemental dex data, IDs, some media URLs | Good for seeding/cross-checking; not required at runtime |
| **Community sprite sets** | Icons/sprites | Only if license permits; otherwise omit media in v1 |

### Pipeline (`tools/ingest`)
1. **Fetch/generate** from `@pkmn/*` (and optionally PokéAPI) at build time.
2. **Normalize** into Battlepad's compact schema (stable slugs, minimal fields we actually use).
3. **Validate** with a schema check (e.g. Zod) and golden tests (counts, sample species correctness).
4. **Emit** versioned artifacts into `packages/data` with a `manifest.json`
   (`{ datasetVersion, generatedAt, formats[], counts }`).
5. **Commit** generated artifacts (or fetch during CI build) so the app build is reproducible offline.

### Versioning
- Reference dataset carries `datasetVersion`; the app records which version produced/validated a team.
- New format rotations (e.g. VGC regulation changes) = a new dataset version shipped via app update.

## 6. Open data questions to resolve during Phase 0
- Exact licenses/attribution requirements for each chosen source (especially any sprites).
- Which formats to seed first (proposal: one VGC regulation + Gen 9 OU).
- Whether to ship reference data as JSON bundles or a prebuilt read-only SQLite file (perf vs. size).
