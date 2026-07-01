# Product Plan

## 1. Vision

Give competitive **Pokémon Champions** players a single mobile tool that covers the whole loop of
high-level play: **prepare a team**, **practice/validate it**, and **make better decisions during
live battles**. Pokémon Champions is the new official VGC platform (Switch/Switch 2, mobile later),
and the tooling ecosystem around it is young — Battlepad consolidates the essentials into a fast,
offline-capable phone app you can use at a tournament table or while laddering.

## 2. Target game & format

**Game:** Pokémon Champions (turn-based battle game; the official VGC platform for the 2026 season).

**Format for v1: VGC Regulation Set M-B** (17 June – 2 September 2026; used through the 2026 World
Championships). Rules that shape the product:

- **Double Battles**, all Pokémon auto-leveled to **Level 50**.
- **Bring 6, pick 4** at team preview (90-second team-preview timer; 45s per move; 20-min game).
- **Species Clause** (no two Pokémon sharing a National Pokédex number) and **Item Clause**
  (no duplicate held items).
- **Mega Evolution** is allowed but limited to an **eligible list** (all M-A Megas plus 16 new
  Legends Z-A Megas in M-B). No Terastallization.
- Team members must be obtainable in Champions or brought in via **Pokémon HOME**.
- **Open team sheets** at TPCi events: at match start players exchange full team lists (species,
  abilities, items, all known moves, stat alignment). Notes on the opponent's list are not allowed
  *in-game*, but a player planning their own strategy from what they saw is normal play.

> Because M-B rotates out on 2 September 2026, the data layer must be **versioned by regulation set**
> so future rotations are a data update, not a rewrite (see data-model.md).

## 3. Target users ("champions")

| Persona | Needs |
| --- | --- |
| **VGC competitor (Champions)** | Reg M-B-legal doubles teams, Mega planning, speed control, live damage calcs between turns |
| **Tournament player** | Reliable **offline** operation, glanceable UI, PokéPaste import/export, fast use of open team sheets at preview |
| **Ladder grinder** | Quick team iteration, matchup/coverage checks against the current meta |
| **Aspiring competitor** | Guardrails (legality/Mega-eligibility warnings), explanations of type math, stats, and speed tiers |

Primary focus for v1: **Pokémon Champions VGC doubles, Regulation Set M-B.**

## 4. Core features

### 4.1 Team Builder (MVP)
- Add/remove/reorder up to 6 Pokémon per team.
- Per-Pokémon configuration:
  - Species, level (default 50), gender (where relevant)
  - Ability (constrained to the species' legal abilities)
  - Held item (including **Mega Stones**)
  - Nature
  - EVs (0–252 per stat, 510 total cap) and IVs (0–31)
  - Up to 4 moves (constrained to the species' legal moveset for Champions/M-B)
  - **Mega designation** where the species+stone is Mega-eligible in M-B
- **Computed stats** display (HP/Atk/Def/SpA/SpD/Spe) for the **base form and, if applicable, the
  Mega form** (Mega changes base stats, often typing and ability).
- **Legality validation** against Regulation Set M-B:
  - Species clause, item clause, level cap, allowed-Pokémon list, **Mega eligibility**, at most one
    Mega-capable configuration usable per battle.
  - Inline, non-blocking warnings (let users build illegal teams but flag them clearly).
- **Team analysis:**
  - Defensive type chart (team weaknesses/resistances heatmap) for base **and** Mega forms.
  - Offensive coverage (which types the team can hit super-effectively).
  - Speed tier table for the team and against a benchmark list (Mega speed shifts highlighted).
- **Persistence & sharing:**
  - Save, rename, duplicate, tag teams locally.
  - Import/export **PokéPaste-compatible** plaintext for interop with community tools.

### 4.2 Battle Companion (MVP-lite, expands in Phase 2)
- Start a "battle session" by picking your active team.
- **Team-preview / open-sheet mode:** during the 90-second preview, load the opponent's full sheet
  (paste or quick-entry), review threats, and decide your **4 leads**.
- **Opponent tracker:** record revealed moves/items/abilities, and track **whether the opponent has
  already used their Mega** (only one Mega per side per battle).
- **Matchup panel:** for any attacker/defender pairing, show type effectiveness and a quick
  "what threatens what" summary — accounting for Mega form changes.
- **Speed comparison:** compare speeds with modifiers (Tailwind, Trick Room, paralysis, Choice Scarf,
  +/- stages, and pre/post-Mega speed).
- **Damage calculator:** accurate rolls (min/max %, KO chance), Mega-aware.
- **Battle log & notes:** freeform notes + turn log, saved per session for later review.

### 4.3 Reference Dex (supporting)
- Searchable Pokémon, move, item (incl. Mega Stones), and ability database (offline).
- Includes Mega forms and their stat/type/ability changes.

## 5. Explicitly out of scope (for now)
- Any integration that reads the Champions game screen or interacts with first-party online services
  (Battlepad is a **manual-input** assistant).
- Terastallization tooling (not a Champions mechanic).
- Accounts / cloud sync — **v1 is offline-only** (deferred to a later phase).
- Selling or redistributing copyrighted assets (sprites/audio); see compliance notes.

## 6. MVP definition (what "done" means for v1)
A user can, fully offline:
1. Build a 6-Pokémon **Regulation M-B** team with full sets (incl. a Mega) and see computed stats for
   base and Mega forms.
2. Get legality/Mega-eligibility warnings and team weakness/coverage analysis for Reg M-B.
3. Import and export PokéPaste text.
4. Run a Mega-aware damage calc and a type-matchup check during a battle session, using the
   open-team-sheet flow to plan leads.

## 7. Success metrics
- **Activation:** % of new users who save at least one complete (6-mon) team in week 1.
- **Companion usage:** # of battle sessions started per active user per week.
- **Retention:** D30 retention of competitive users.
- **Correctness (quality bar):** 100% of damage-calc and stat outputs (base and Mega) match trusted
  references in the test suite — wrong numbers are fatal for a competitive tool.

## 8. Key risks
| Risk | Mitigation |
| --- | --- |
| **Champions data availability** (new Legends Z-A Megas, M-B allow-lists may not exist in mainstream datasets yet) | Custom Champions data layer + ingestion pipeline; start with what community datasets cover and fill gaps manually (see technical-architecture.md §9) |
| **Correctness of game math** (esp. Mega stat/type/ability swaps) | Reuse battle-tested OSS where it applies; golden-file tests for base and Mega cases |
| **Format rotation** (M-B ends 2 Sept 2026) | Version data by regulation set so rotations are data updates |
| **IP/trademark** | Third-party companion positioning, no first-party assets, clear disclaimers |
| **Scope creep** | Strict MVP gate; Companion ships "lite" first |
