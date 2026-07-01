# Technical Architecture

## 1. Platform & stack decision

**Decision: React Native + Expo (managed workflow), TypeScript everywhere.**

> This was chosen specifically because the ask was for the option that is **best and most
> inexpensive to get online** across both app stores. Expo + EAS is the lowest-cost path to shipping
> a single codebase to iOS and Android.

### Why
- **One codebase, both stores.** Competitive players use both iOS and Android; a single RN codebase
  covers both with near-native UX, minimizing build/maintenance cost.
- **TypeScript end-to-end** lets us share the *core game engine* (stats, type math, legality, Mega
  handling, damage) between the app and any future web/CLI tooling with zero rewrites.
- **Reusable TS/JS Pokémon data ecosystem**: `@smogon/calc`, `@pkmn/dex`, `@pkmn/data` cover the
  main-series mechanics (types, abilities, moves, and the classic Megas) that **Pokémon Champions**
  shares. Champions-specific gaps (new Legends Z-A Megas, Reg M-B allow-lists) are filled by our own
  data layer — see [§9](#9-data-availability-risk-pokémon-champions).
- **Expo** gives us OTA updates, cheap builds (EAS free/low tiers), and good offline-storage modules,
  while still allowing native modules via prebuild/dev-clients if needed.

### Alternatives considered
| Option | Verdict |
| --- | --- |
| **Flutter (Dart)** | Great UI, but the Pokémon data/calc ecosystem is JS/TS — we'd reimplement the hardest, correctness-critical code. Rejected. |
| **Native iOS + Android (Swift/Kotlin)** | Best performance/UX ceiling, but ~2x build cost and can't share the TS engine. Overkill for v1. |
| **PWA / web-only** | Fails the "works at a tournament table, offline, glanceable" requirement and app-store discoverability. Rejected as primary; web can be a later add-on of the shared engine. |

## 2. High-level architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (Expo RN)                      │
│                                                               │
│  UI Layer (screens/components)                                │
│   • Team Builder    • Battle Companion    • Dex Browser       │
│        │                   │                    │             │
│  App State (Zustand stores) ── React Query for async/derived  │
│        │                                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  @battlepad/core  (pure TypeScript, no RN deps)         │  │
│  │   • stats        • type-effectiveness                   │  │
│  │   • legality     • team analysis (coverage/weakness)    │  │
│  │   • damage (wraps @smogon/calc)                         │  │
│  └───────────────────────────────────────────────────────┘  │
│        │                                                      │
│  Data Access Layer (repositories)                             │
│        │                         │                            │
│  Local DB (SQLite/Drizzle)   Bundled dataset (read-only)      │
│   • user teams, sessions      • species/moves/items/formats   │
└─────────────────────────────────────────────────────────────┘
              │ (optional, Phase 3+)
        ┌─────▼───────────────┐
        │  Supabase backend   │  auth, team sync, public sharing
        └─────────────────────┘
```

### Layering rules
- **`@battlepad/core` is framework-agnostic** — no React, no RN, no I/O. Pure functions and types.
  This is where every correctness-critical calculation lives, and where the bulk of unit tests go.
- **Repositories** are the only place that touch persistence; UI never queries SQLite directly.
- **Stores** hold ephemeral/UI state; durable data lives in SQLite and is loaded via repositories.

## 3. Proposed project structure (monorepo)

```
/
├─ apps/
│  └─ mobile/                 # Expo React Native app
│     ├─ app/                 # screens (expo-router file-based routing)
│     ├─ src/components/
│     ├─ src/stores/          # Zustand
│     ├─ src/db/              # Drizzle schema + migrations, repositories
│     └─ assets/
├─ packages/
│  ├─ core/                   # @battlepad/core — engine (pure TS)
│  └─ data/                   # @battlepad/data — generated datasets + loaders
├─ tools/
│  └─ ingest/                 # build-time data ingestion scripts (see data-model.md)
├─ docs/
└─ package.json               # pnpm workspaces + Turborepo (or npm workspaces to start)
```
> v1 can begin as a single Expo app and extract `packages/core` early; the engine separation is
> the important part and should exist from day one.

## 4. State & data flow
- **Zustand** for in-memory UI/session state (current team being edited, active battle session).
- **React Query (TanStack Query)** to wrap repository reads/writes so screens get caching,
  loading/error states, and invalidation for free.
- **Offline-only for v1:** the app must fully function with no network, and the first release ships
  **no account/cloud features at all** (per product decision). Any future network use (dataset
  refresh, optional sync) is deferred to a later phase and must never become a hard dependency of the
  builder or companion.

## 5. Offline & data strategy
- **Static reference data** (species, moves, items, abilities, type chart, format rulesets) is
  **bundled at build time** as a compact, versioned dataset in `@battlepad/data`. No runtime
  PokéAPI dependency for core features.
- **User data** (teams, battle sessions, notes) is stored in **SQLite** via Drizzle ORM with
  migrations.
- **Dataset updates** (new generation/format rotations) ship via app updates and/or an optional
  signed dataset download checked against a version manifest.

## 6. Core engine responsibilities (`@battlepad/core`)
- `stats`: compute final stats from base/level/IV/EV/nature (Level 50 default for Champions VGC).
- `types`: type-effectiveness multipliers, team defensive matrix, offensive coverage.
- `mega`: resolve a Pokémon's **Mega form** (stat/type/ability changes) from species + Mega Stone,
  and enforce the one-Mega-per-side rule during battle sessions. Mega state feeds every other module
  (stats, types, speed, damage) so all outputs can reflect base **or** Mega form.
- `legality`: validate a set/team against a **regulation set** (species/item clauses, level cap,
  allowed-Pokémon list, **Mega eligibility**, legal movesets).
- `damage`: thin, well-typed wrapper over **`@smogon/calc`** so we never hand-roll damage math;
  passes through Mega form and field/modifier state.
- `speed`: speed-tier computation with field/stat-stage/item/ability modifiers, incl. pre/post-Mega.
- `pokepaste`: parse/serialize PokéPaste-compatible text.

> **Principle:** prefer wrapping audited libraries (`@smogon/calc`, `@pkmn/*`) over reimplementing
> game mechanics. Reimplementation is the #1 source of "the app gave me a wrong number" bugs, which
> destroy trust in a competitive tool. Where Champions diverges from what those libraries model
> (new Megas, M-B lists), isolate the divergence in our data layer, not in re-derived math.

## 7. Testing strategy
- **Unit tests** for every `core` function; golden-file/snapshot tests for damage and stats against
  known reference values.
- **Property tests** for legality (e.g. EV totals never validate above 510).
- **Component tests** (React Native Testing Library) for key flows: build a set, import a paste,
  run a calc.
- **E2E** (Maestro or Detox) for the critical path: build team → start session → run calc.
- CI gate: typecheck + lint + unit/component tests on every PR.

## 8. Tooling
- **Package manager:** pnpm (workspaces) with Turborepo for caching; npm workspaces acceptable to start.
- **Lint/format:** ESLint + Prettier; strict `tsconfig`.
- **CI:** GitHub Actions (typecheck, lint, test); EAS Build for app binaries.
- **Releases:** Expo EAS + OTA updates for JS-only changes.

## 9. Data availability risk (Pokémon Champions)

**This is the biggest technical unknown.** Pokémon Champions is a new game, and the mainstream
competitive data/calc libraries (`@pkmn/*`, `@smogon/calc`) are built around the main-series games
(Scarlet/Violet + earlier). What that means for us:

- **What likely already works:** species base stats, types, abilities, moves, the type chart, and
  the **classic Gen 6/7 Mega Evolutions** — these mechanics are shared and well-modeled in existing
  libraries.
- **What is likely missing / must be sourced ourselves:**
  - The **16 new Legends Z-A Mega Evolutions** added in Reg M-B (and any M-A Megas not present in
    older data), including their Mega stats/types/abilities and Mega Stones.
  - The **Reg M-B allowed-Pokémon list** and Champions-specific availability (HOME transfer rules).
  - Any Champions-specific mechanical differences from Scarlet/Violet.
- **Mitigation:**
  1. Build a dedicated **Champions data layer** (`@battlepad/data`) that starts from `@pkmn/data`
     for shared content and **overlays** Champions/M-B specifics we curate ourselves.
  2. Keep every regulation set as a **versioned, swappable dataset** so the September M-B→next
     rotation is a data update, not code changes.
  3. Encode Mega transforms as **explicit data** (base→mega stat/type/ability deltas), validated by
     golden tests, rather than relying on library coverage we can't guarantee.
  4. **Verify our numbers against in-game reality** for a sample of Reg M-B Megas before launch;
     treat any mismatch as a release blocker.
- **Open action (Phase 0):** audit exactly which M-B Pokémon/Megas are present in `@pkmn/data`/
  `@smogon/calc` at build time and enumerate the gap we must fill manually.

## 10. Legal & compliance
> This is a **third-party fan companion app**, not affiliated with Nintendo, Game Freak, or
> The Pokémon Company. Built for **Pokémon Champions**.

- **No first-party assets shipped:** do not bundle official sprites, artwork, audio, or text ripped
  from the games. Use open/community sprite sets only where licenses permit, or generate
  placeholder/abstract icons; otherwise let users see names + computed data only.
- **Data, not media:** factual game data (base stats, type charts, learnsets) is broadly used by the
  community, but treat each data source's license/terms carefully and attribute sources
  (PokéAPI, Smogon datasets via `@pkmn`).
- **Trademark hygiene:** the app name must not imply official endorsement; include a clear
  disclaimer in-app and in store listings. "Pokémon" is a trademark of its owners.
- **No reverse engineering / no automation against first-party online services.** The Companion is a
  manual-input assistant; it never reads or interacts with the official games or servers.
- Revisit with a qualified reviewer before public release. Treat the above as engineering guidance,
  not legal advice.
