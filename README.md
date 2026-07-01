# Battlepad — Champion's Team Builder & Live Battle Companion

> **Working title.** A cross-platform mobile app for competitive **Pokémon Champions** players that
> helps you build legal, optimized teams and gives you a real-time edge during active battles.

Battlepad is a **third-party fan companion tool** built around **Pokémon Champions** (the standalone
turn-based battle game released April 8, 2026 — now the official VGC platform). It is not affiliated
with, endorsed by, or sponsored by Nintendo, Game Freak, or The Pokémon Company. See
[Legal & Compliance](docs/technical-architecture.md#10-legal--compliance) before building or shipping.

---

## Target game: Pokémon Champions

Battlepad targets **Pokémon Champions VGC**, not Scarlet/Violet. Key implications baked into the plan:

- **Double Battles**, auto-leveled to **Level 50**, pick **4 of your 6** at team preview, 20-minute games.
- **Mega Evolution** is the signature battle mechanic (back for the first time since 2019). There is
  **no Terastallization** — Battlepad models Megas, not Tera.
- Teams are built from Pokémon obtained in Champions or brought in via **Pokémon HOME**.
- Battlepad seeds **all three seasons to date**: **Regulation M-A** (Seasons M-1 & M-2) and
  **Regulation M-B** (Season M-3, current — 17 June onward, used through the 2026 World Championships),
  with **M-B / Season M-3** as the active default.
- TPCi events use **open team sheets** — at team preview you legally know the opponent's species,
  abilities, items, and moves. Battlepad turns this into a live planning advantage.

---

## What it does

Battlepad splits into two tightly integrated experiences:

### 1. Team Builder
- Build teams of up to 6 Pokémon with full competitive detail: ability, held item (incl. **Mega
  Stones**), nature, EV/IV spreads, moves, and level (50 for VGC).
- **Mega Evolution aware:** mark a Pokémon's Mega and see its Mega form's stats/types/ability.
- Live **legality validation** against Regulation Set M-B (species clause, item clause, Mega
  eligibility, allowed-Pokémon list, level cap).
- Computed stat blocks, speed tiers, and team-wide type-coverage / weakness analysis (base **and**
  Mega forms).
- Save, clone, tag, version, import/export (PokéPaste-compatible text), and share teams.

### 2. Battle Companion
- A fast, glanceable in-battle assistant for live play.
- **Open team-sheet mode:** pre-load the opponent's full sheet during the 90-second team preview and
  plan your 4 leads.
- Track the opponent's revealed Pokémon, items, moves, and **whether their Mega is still available**.
- Instant **type-matchup** guidance, **speed-tier** comparisons, and a **damage calculator** — all
  Mega-aware.
- Quick notes and a battle log you can review afterward.

See the [Product Plan](docs/product-plan.md) for the full feature breakdown and prioritization.

---

## Documentation

| Doc | Purpose |
| --- | --- |
| [docs/product-plan.md](docs/product-plan.md) | Vision, target users, feature breakdown, MVP scope, success metrics |
| [docs/technical-architecture.md](docs/technical-architecture.md) | Tech-stack decision, app architecture, offline strategy, legal/compliance |
| [docs/data-model.md](docs/data-model.md) | Domain entities, local schema, and data-source ingestion pipeline |
| [docs/data-sources.md](docs/data-sources.md) | Serebii source map, regulation/season matrix (M-A/M-B), rulesets, and scraping/compliance plan |
| [docs/roadmap.md](docs/roadmap.md) | Phased delivery plan from prototype to release |

---

## Proposed stack (summary)

- **App:** React Native + Expo, TypeScript — the cheapest path to ship on **both iOS and Android**
  from one codebase.
- **State/data:** Zustand (UI state) + SQLite via Drizzle/expo-sqlite (offline-first storage).
- **Core engine:** A shared, framework-agnostic TypeScript package for stats, type math, legality,
  Mega Evolution handling, and damage calculation.
- **Data sources:** **Serebii** is the source of truth for Champions — per-regulation/season legality
  (M-A → Seasons M-1/M-2; M-B → Season M-3), newly-usable Pokémon (incl. Mega forms), abilities/skills,
  moves, and item additions — ingested into a versioned overlay and cross-checked against `@pkmn/data`.
  See [docs/data-sources.md](docs/data-sources.md).
- **Cloud:** none in v1 — **offline-only** first release. Optional sync deferred to a later phase.

Rationale and alternatives are documented in
[docs/technical-architecture.md](docs/technical-architecture.md).

---

## Status

📋 **Planning.** This branch contains planning artifacts only — no application code yet.
The first implementation milestone is described in [docs/roadmap.md](docs/roadmap.md#phase-0--foundations).
