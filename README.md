# Battlepad — Champion's Team Builder & Live Battle Companion

> **Working title.** A cross-platform mobile app for competitive Pokémon players that helps you
> build legal, optimized teams and gives you a real-time edge during active battles.

Battlepad is a **third-party fan companion tool**. It is not affiliated with, endorsed by, or
sponsored by Nintendo, Game Freak, or The Pokémon Company. See
[Legal & Compliance](docs/technical-architecture.md#legal--compliance) before building or shipping.

---

## What it does

Battlepad targets serious competitive players ("champions") across formats like **VGC** (doubles)
and **Smogon singles**. It splits into two tightly integrated experiences:

### 1. Team Builder
- Build teams of up to 6 Pokémon with full competitive detail: ability, held item, nature,
  EV/IV spreads, moves, Tera type, and level.
- Live **legality validation** against a chosen format/ruleset (banned species, item clause,
  species clause, level caps).
- Computed stat blocks, speed tiers, and **team-wide type-coverage / weakness analysis**.
- Save, clone, tag, version, import/export (PokéPaste-compatible text), and share teams.

### 2. Battle Companion
- A fast, glanceable in-battle assistant for live play.
- Track the opponent's revealed Pokémon, items, and moves as the battle unfolds.
- Instant **type-matchup** guidance, **speed-tier** comparisons, and a **damage calculator**.
- Quick notes and a battle log you can review afterward.

See the [Product Plan](docs/product-plan.md) for the full feature breakdown and prioritization.

---

## Documentation

| Doc | Purpose |
| --- | --- |
| [docs/product-plan.md](docs/product-plan.md) | Vision, target users, feature breakdown, MVP scope, success metrics |
| [docs/technical-architecture.md](docs/technical-architecture.md) | Tech-stack decision, app architecture, offline strategy, legal/compliance |
| [docs/data-model.md](docs/data-model.md) | Domain entities, local schema, and data-source ingestion pipeline |
| [docs/roadmap.md](docs/roadmap.md) | Phased delivery plan from prototype to release |

---

## Proposed stack (summary)

- **App:** React Native + Expo, TypeScript
- **State/data:** Zustand (UI state) + SQLite via Drizzle/expo-sqlite (offline-first storage)
- **Core engine:** A shared, framework-agnostic TypeScript package for stats, type math, legality,
  and damage calculation (reuses the open-source `@smogon/calc` where possible)
- **Data sources:** PokéAPI (base dex data, seeded at build time) + competitive datasets
  (formats, learnsets, sprites)
- **Optional cloud:** Supabase for account sync and team sharing (Phase 3+)

Rationale and alternatives are documented in
[docs/technical-architecture.md](docs/technical-architecture.md).

---

## Status

📋 **Planning.** This branch contains planning artifacts only — no application code yet.
The first implementation milestone is described in [docs/roadmap.md](docs/roadmap.md#phase-0--foundations).
