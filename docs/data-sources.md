# Data Sources — Pokémon Champions (Serebii)

**Primary source for Champions-specific data: [Serebii.net](https://www.serebii.net/pokemonchampions/).**
Serebii maintains up-to-date, per-regulation and per-season legality lists plus a Champions Pokédex
with each Pokémon's **abilities ("skills")** and **moves**. This is the authoritative overlay source
referenced from [data-model.md](data-model.md#5-data-sources--ingestion-pipeline) and
[technical-architecture.md §9](technical-architecture.md#9-data-availability-risk-pokémon-champions).

> **Scope for v1 (per product direction):** cover **all three seasons to date** — Regulation **M-A**
> (Seasons **M-1** and **M-2**) and Regulation **M-B** (Season **M-3**) — including every newly usable
> **Pokémon** (base forms, regional forms, and **Mega forms**), their **abilities/skills**, their
> **moves**, and the Champions **item list**. We'll likely have to "hunt around" Serebii because this
> data is spread across regulation pages, season pages, and individual Pokédex entries.

---

## 1. Regulation & season structure

Champions Ranked Battle is organized as **Regulations** (rule sets) that each span one or more
**Seasons**. Legality is cumulative: each new regulation adds "newly usable" Pokémon/items on top of
what came before.

| Regulation | Active dates | Seasons | Notes |
| --- | --- | --- | --- |
| **M-A** | Apr 8 – Jun 17, 2026 | **M-1** (Apr 8 – May 13), **M-2** (May 13 – Jun 17) | Launch ruleset; allowed a large roster + classic Mega Evolutions |
| **M-B** | Jun 17 – Sep 2, 2026 | **M-3** (Jun 17 – Jul 8, 2026), + later seasons in this window | Mobile launch; **added** more Pokémon, new Mega Evolutions, and competitive items. Used through Worlds 2026. |

> **Current (as of this plan): Regulation M-B, Season M-3.** M-B runs until Sep 2, 2026, after which a
> new regulation rotates in — so the dataset **must be versioned by regulation/season** (see
> data-model.md).

## 2. Battle formats

Champions Ranked has **two** rulesets; both auto-level all Pokémon to **Level 50**:

| Ruleset | Team size | Timers |
| --- | --- | --- |
| **Singles** | 3–6 Pokémon | Your Time 7 min · Team Preview 90 s · Turn 45 s |
| **Doubles** (= VGC) | 4–6 Pokémon | Your Time 7 min · Team Preview 90 s · Turn 45 s |

**VGC = Doubles**, and it is Battlepad's primary focus. The dataset also supports **Singles** (same
Pokémon pool), so a Singles mode is a low-cost addition later.

## 3. Serebii URL map

| Data | URL pattern |
| --- | --- |
| Champions hub | `https://www.serebii.net/pokemonchampions/` |
| Regulation M-A (rules + newly usable Pokémon) | `https://www.serebii.net/pokemonchampions/rankedbattle/regulationm-a.shtml` |
| Regulation M-B (rules + newly usable Pokémon + newly added items) | `https://www.serebii.net/pokemonchampions/rankedbattle/regulationm-b.shtml` |
| Season pages (M-1, M-2, M-3) | linked from the regulation pages (season-scoped legality) |
| Champions Pokédex (per-species abilities/skills + moves) | `https://www.serebii.net/pokedex-champions/<species>/` |

> The per-species Pokédex pages are where **abilities and movesets** live; the regulation pages give
> the **legal-species/Mega lists** and **item additions**. Ingestion must join these.

## 4. What each regulation page provides
- **Ruleset details** (Singles/Doubles team sizes, timers, level).
- **Season list** with durations.
- **"Newly Useable Pokémon"** — includes base species, regional forms, and **Mega forms** (e.g. the
  M-A page lists classic Megas like Mega Charizard X/Y, Mega Garchomp, Mega Metagross's line, etc.;
  the M-B page adds new ones like **Mega Raichu X/Y**, Mega Sceptile/Blaziken/Swampert, Mega Mawile,
  Mega Metagross, and more).
- **"Newly Added Items"** (M-B) — competitive items such as Life Orb, Expert Belt, Wide Lens, Muscle
  Band, Wise Glasses, Light Clay, Zoom Lens, Metronome, Iron Ball, the weather rocks, Shed Shell,
  Big Root, etc.

## 5. Ingestion approach (see roadmap Phase 0)
1. **Scrape** each regulation page → parse the ruleset, season durations, newly-usable Pokémon
   (with form/Mega flags via National Dex number + form name), and item additions.
2. **Scrape** each referenced **Champions Pokédex** species page → abilities/skills, learnable moves,
   base stats, types (and Mega form stats/types/ability where present).
3. **Join & normalize** into Battlepad's schema keyed by stable slugs; compute cumulative legality
   per regulation/season.
4. **Cross-check** base stats / type data against `@pkmn/data` where the species is shared, and flag
   any discrepancies for manual review (Serebii is source-of-truth for Champions legality/availability;
   `@pkmn` is a sanity check for shared mechanics).
5. **Emit** the versioned overlay into `@battlepad/data` with a `manifest.json`
   (`{ datasetVersion, regulations: ["M-A","M-B"], seasons: ["M-1","M-2","M-3"], counts }`).

## 6. Compliance & etiquette for scraping Serebii
- **Respect `robots.txt` and Serebii's terms.** Scrape gently: cache responses, rate-limit, run
  ingestion **offline at build time** (never from the shipping app), and re-run only when regulations
  rotate.
- **Attribute Serebii** as the data source in-app (About/credits) and in the repo.
- **Store derived factual data, not their page assets.** Do not redistribute Serebii's images/sprites;
  see the media/asset rules in
  [technical-architecture.md §10](technical-architecture.md#10-legal--compliance).
- Prefer reaching out to Serebii for permission / checking for any official data feed before a public
  launch. Treat this as engineering guidance, not legal advice.

## 7. Open items
- Confirm exact **per-season** legality deltas (M-1 vs M-2) from the season pages, if they differ from
  the regulation-level lists.
- Enumerate the complete **Mega form** set across M-A + M-B and capture each Mega's stats/type/ability
  from the Champions Pokédex (this is the data most likely missing from non-Champions sources).
- Decide refresh cadence for future M-B seasons after M-3 and the post-M-B regulation.
