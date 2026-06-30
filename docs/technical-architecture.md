# Technical Architecture

## 1. Platform & stack decision

**Decision: React Native + Expo (managed workflow), TypeScript everywhere.**

### Why
- **One codebase, both stores.** Champions use both iOS and Android; a single RN codebase covers
  both with near-native UX.
- **TypeScript end-to-end** lets us share the *core game engine* (stats, type math, legality,
  damage) between the app and any future web/CLI tooling with zero rewrites.
- **Rich OSS ecosystem in TS/JS for Pokémon data**: `@smogon/calc`, `@pkmn/dex`, `@pkmn/data`,
  PokéAPI sprites — all directly consumable from RN.
- **Expo** gives us OTA updates, easy builds (EAS), and good offline-storage modules, while still
  allowing native modules via prebuild/dev-clients if needed.

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
- **Offline-first by default:** the app must fully function with no network. Network is only used
  for optional account sync and dataset updates.

## 5. Offline & data strategy
- **Static reference data** (species, moves, items, abilities, type chart, format rulesets) is
  **bundled at build time** as a compact, versioned dataset in `@battlepad/data`. No runtime
  PokéAPI dependency for core features.
- **User data** (teams, battle sessions, notes) is stored in **SQLite** via Drizzle ORM with
  migrations.
- **Dataset updates** (new generation/format rotations) ship via app updates and/or an optional
  signed dataset download checked against a version manifest.

## 6. Core engine responsibilities (`@battlepad/core`)
- `stats`: compute final stats from base/level/IV/EV/nature.
- `types`: type-effectiveness multipliers, team defensive matrix, offensive coverage.
- `legality`: validate a set/team against a format ruleset (clauses, banlists, learnsets).
- `damage`: thin, well-typed wrapper over **`@smogon/calc`** so we never hand-roll damage math.
- `speed`: speed-tier computation with field/stat-stage/item/ability modifiers.

> **Principle:** prefer wrapping audited libraries (`@smogon/calc`, `@pkmn/*`) over reimplementing
> game mechanics. Reimplementation is the #1 source of "the app gave me a wrong number" bugs, which
> destroy trust in a competitive tool.

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

## 9. Legal & compliance
> This is a **third-party fan companion app**, not affiliated with Nintendo, Game Freak, or
> The Pokémon Company.

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
