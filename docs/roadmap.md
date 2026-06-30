# Roadmap

Phased delivery from prototype to public release. Each phase has a clear **goal** and an
**exit criteria** (what must be true to move on). Phases are scoped by capability, not calendar time.

---

## Phase 0 — Foundations
**Goal:** a runnable Expo app skeleton and the engine/data spine, with CI.

- [ ] Initialize Expo + TypeScript app (`apps/mobile`) with expo-router and strict tsconfig.
- [ ] Set up workspace + `@battlepad/core` (pure TS) and `@battlepad/data` packages.
- [ ] ESLint/Prettier + GitHub Actions CI (typecheck, lint, test).
- [ ] Stand up `tools/ingest`: pull from `@pkmn/data`, emit a validated v1 dataset
      (one VGC regulation + Gen 9 OU) with a `manifest.json`.
- [ ] SQLite + Drizzle wired with an initial migration and a smoke-test repository.

**Exit:** app boots on iOS & Android simulators; `core` has stat + type-chart functions with passing
tests; dataset loads and a sample species reads correctly.

---

## Phase 1 — Team Builder MVP
**Goal:** build, analyze, validate, and import/export a competitive team — fully offline.

- [ ] Dex browser (search species/moves/items/abilities from the bundled dataset).
- [ ] Team CRUD + slot editor (species, level, nature, ability, item, moves, Tera, EVs/IVs).
- [ ] Computed stats display from `core.stats`.
- [ ] Legality validation (`core.legality`) for the seeded formats with inline warnings.
- [ ] Team analysis: defensive weakness matrix + offensive coverage (`core.types`).
- [ ] PokéPaste import/export parser + serializer (`core`).
- [ ] Persist teams in SQLite; list/rename/duplicate/tag.

**Exit:** MVP checklist items 1–3 from [product-plan.md §5](product-plan.md#5-mvp-definition-what-done-means-for-v1)
are satisfied; building a known team produces stats/analysis matching references.

---

## Phase 2 — Battle Companion MVP
**Goal:** make better in-battle decisions live.

- [ ] Start a battle session from a saved team.
- [ ] Opponent tracker (add revealed mons; record moves/item/ability/Tera).
- [ ] Type-matchup panel (attacker vs. defender effectiveness, threat summary).
- [ ] Speed comparison with modifiers (Tailwind, Trick Room, paralysis, Scarf, stat stages).
- [ ] Damage calculator via `@smogon/calc` wrapper (min/max %, KO chance).
- [ ] Battle log + notes, saved per session for post-game review.
- [ ] Polish for **glanceable, fast** in-battle UX (large touch targets, minimal navigation).

**Exit:** full MVP definition satisfied; a user can run a calc and matchup check mid-battle in a few taps.

---

## Phase 3 — Accounts, Sync & Sharing
**Goal:** persistence across devices and a sharing loop.

- [ ] Optional Supabase auth (anonymous-first; sign-in is never required for core features).
- [ ] Cloud sync of teams/sessions with conflict handling.
- [ ] Shareable team links / export to image card.
- [ ] Dataset auto-update via signed manifest (handle format rotations without a full app release).

**Exit:** a user can sign in, sync teams across two devices, and share a team.

---

## Phase 4 — Depth & Delight (post-launch backlog)
- Usage/meta insights (common items/abilities seen, personal win-rate notes by team).
- Saved "game plans" per matchup; lead/back recommendations.
- Multiple-format expansion (more VGC regs, additional Smogon tiers).
- Accessibility pass (VoiceOver/TalkBack, color-blind-safe type colors, scalable text).
- Localization.
- Research track (clearly experimental): suggestion/prediction features.

---

## Cross-cutting, every phase
- **Correctness first:** any feature touching game math ships with tests against known references.
- **Offline must keep working:** no feature may make the core builder/companion require a network.
- **Compliance:** no first-party assets; keep disclaimers current (see
  [technical-architecture.md §9](technical-architecture.md#9-legal--compliance)).

## Immediate next step
Kick off **Phase 0** — scaffold the Expo app and `@battlepad/core`, and prove the data ingestion
pipeline with a single seeded format. Everything else builds on that spine.
