# Roadmap

Phased delivery from prototype to public release. Each phase has a clear **goal** and an
**exit criteria** (what must be true to move on). Phases are scoped by capability, not calendar time.

---

## Phase 0 — Foundations
**Goal:** a runnable Expo app skeleton and the engine/data spine, with CI.

- [ ] Initialize Expo + TypeScript app (`apps/mobile`) with expo-router and strict tsconfig.
- [ ] Set up workspace + `@battlepad/core` (pure TS) and `@battlepad/data` packages.
- [ ] ESLint/Prettier + GitHub Actions CI (typecheck, lint, test).
- [ ] Stand up `tools/ingest` — a **Serebii scraper** (gentle/cached; see
      [data-sources.md](data-sources.md#6-compliance--etiquette-for-scraping-serebii)) that ingests
      **Regulation M-A (Seasons M-1, M-2)** and **Regulation M-B (Season M-3)**: newly-usable Pokémon
      (incl. regional + **Mega forms**), **abilities/skills**, **moves**, and **item additions**.
- [ ] Cross-check scraped base stats/types for shared species against `@pkmn/data`; flag discrepancies.
- [ ] Emit a validated overlay into `@battlepad/data` with a `manifest.json`
      (`regulations: ["M-A","M-B"]`, `seasons: ["M-1","M-2","M-3"]`).
- [ ] SQLite + Drizzle wired with an initial migration and a smoke-test repository.

**Exit:** app boots on iOS & Android simulators; `core` has stat + type-chart + **Mega-resolution**
functions with passing tests; the M-A/M-B dataset loads, cumulative legality is correct, and a sample
species **plus at least one Mega form** read correctly (abilities + moves present).

---

## Phase 1 — Team Builder MVP
**Goal:** build, analyze, validate, and import/export a Reg M-B team — fully offline.

- [ ] Dex browser (search species/moves/items/abilities incl. **Mega Stones & Mega forms**).
- [ ] Team CRUD + slot editor (species, level 50, nature, ability, item, moves, EVs/IVs).
- [ ] Computed stats display from `core.stats` for **base and Mega forms**.
- [ ] Legality validation (`core.legality`) for Reg M-B — species/item clauses, allowed list,
      **Mega eligibility** — with inline warnings.
- [ ] Team analysis: defensive weakness matrix + offensive coverage (`core.types`), base & Mega.
- [ ] PokéPaste import/export parser + serializer (`core`).
- [ ] Persist teams in SQLite; list/rename/duplicate/tag.

**Exit:** MVP checklist items 1–3 from [product-plan.md §6](product-plan.md#6-mvp-definition-what-done-means-for-v1)
are satisfied; building a known Reg M-B team (including a Mega) produces stats/analysis matching references.

---

## Phase 2 — Battle Companion MVP
**Goal:** make better in-battle decisions live.

- [ ] Start a battle session from a saved team.
- [ ] **Team-preview / open-sheet flow:** load the opponent's full sheet and pick your 4 leads.
- [ ] Opponent tracker (record moves/item/ability; flag possible **Mega threats**; track
      **whether each side's Mega has been used** — one per side per battle).
- [ ] Type-matchup panel (attacker vs. defender effectiveness, threat summary) — **Mega-aware**.
- [ ] Speed comparison with modifiers (Tailwind, Trick Room, paralysis, Scarf, stat stages, pre/post-Mega).
- [ ] Damage calculator via `@smogon/calc` wrapper (min/max %, KO chance), **Mega-aware**.
- [ ] Battle log + notes, saved per session for post-game review.
- [ ] Polish for **glanceable, fast** in-battle UX (large touch targets, minimal navigation).

**Exit:** full MVP definition satisfied; a user can use the open-sheet flow, then run a Mega-aware
calc and matchup check mid-battle in a few taps.

---

## Phase 3 — Accounts, Sync & Sharing *(post-v1 — deferred)*
> **Not in the first release.** Per product decision, **v1 is offline-only** with no accounts.
> This phase is only picked up after the offline MVP ships.

**Goal:** persistence across devices and a sharing loop.

- [ ] Optional Supabase auth (anonymous-first; sign-in is never required for core features).
- [ ] Cloud sync of teams/sessions with conflict handling.
- [ ] Shareable team links / export to image card.
- [ ] Dataset auto-update via signed manifest (handle **regulation rotations** without a full app release).

**Exit:** a user can sign in, sync teams across two devices, and share a team.

---

## Phase 4 — Depth & Delight (post-launch backlog)
- Usage/meta insights (common items/abilities seen, personal win-rate notes by team).
- Saved "game plans" per matchup; lead/back recommendations tuned for the open-sheet metagame.
- **Regulation expansion** (the next Champions reg set after M-B; keep the overlay current).
- Accessibility pass (VoiceOver/TalkBack, color-blind-safe type colors, scalable text).
- Localization.
- Research track (clearly experimental): suggestion/prediction features.

---

## Cross-cutting, every phase
- **Correctness first:** any feature touching game math (esp. **Mega stat/type/ability swaps**) ships
  with tests against known references.
- **Offline must keep working:** no feature may make the core builder/companion require a network;
  **v1 is offline-only**.
- **Data isolation:** Champions-specific data lives in the curated overlay, versioned by regulation set.
- **Compliance:** no first-party assets; keep disclaimers current (see
  [technical-architecture.md §10](technical-architecture.md#10-legal--compliance)).

## Immediate next step
Kick off **Phase 0** — scaffold the Expo app and `@battlepad/core`, and build the **Serebii ingestion**
covering **M-A (Seasons M-1, M-2)** and **M-B (Season M-3)** — Pokémon, abilities/skills, moves, Megas,
and items. Everything else builds on that data spine.
