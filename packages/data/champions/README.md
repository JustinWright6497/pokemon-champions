# Pokémon Champions dataset

Generated competitive data for **Pokémon Champions**, covering **Regulation M-A** (Seasons M-1, M-2)
and **Regulation M-B** (Season M-3). Sourced from [Serebii](https://www.serebii.net/pokemonchampions/)
by [`tools/ingest`](../../../tools/ingest/).

> **Attribution:** Data derived from Serebii.net. Battlepad is a third-party fan tool, not affiliated
> with Nintendo, Game Freak, or The Pokémon Company. Serebii page images/sprites are **not**
> redistributed — only derived factual data (stats, types, abilities, moves, legality).

## Files

| File | Contents |
| --- | --- |
| `manifest.json` | Dataset version, source, regulations/seasons covered, and counts |
| `regulations.json` | Per-regulation rulesets (Singles/Doubles team sizes), active dates, and seasons |
| `forms.json` | Every legal battle form (base, regional, and Mega) with National Dex #, types, Mega flag, and **cumulative legality per regulation** |
| `items.json` | Competitive items newly added (Regulation M-B) |
| `pokemon.json` | Per-species detail: abilities, per-form base stats, and full move lists |
| `crosscheck-report.json` | Base-stat validation vs `@pkmn/dex` (see below) |

## Validation

Base stats are cross-checked against `@pkmn/dex` via `node tools/ingest/crosscheck.mjs`:

- **270 / 270** shared stat blocks are **identical** — **0 mismatches**.
- **34 unmatched** entries, **all Champions-original Mega Evolutions** (e.g. Mega Raichu X/Y, Mega
  Meganium, Mega Emboar, Mega Feraligatr, Mega Greninja …). These are new to Champions / Legends Z-A
  and do not exist in `@pkmn/dex` — expected, not errors. They are the Champions-specific data only
  Serebii provides.

See `crosscheck-report.json` for the full result.

### `forms.json`
```jsonc
{
  "forms": [
    {
      "id": "charizard:006-mx",      // speciesSlug + Serebii icon key (uniquely identifies the form)
      "natdex": 6,
      "speciesSlug": "charizard",
      "displayName": "Mega Charizard X",
      "icon": "006-mx",
      "types": ["fire", "dragon"],
      "isMega": true,
      "regulation": "M-A",           // regulation whose page listed this row
      "introducedIn": "M-A"          // first regulation the form became legal
    }
  ],
  "legalFormsByRegulation": {
    "M-A": ["venusaur:003", "..." ],  // 259 forms
    "M-B": ["venusaur:003", "..." ]   // 297 forms (cumulative; M-A + M-B additions)
  }
}
```

### `pokemon.json`
```jsonc
{
  "pokemon": [
    {
      "slug": "garchomp",
      "natdex": 445,
      "name": "Garchomp",
      "abilities": {
        "forms": {
          "default": [{ "slug": "sandveil", "name": "Sand Veil" },
                      { "slug": "roughskin", "name": "Rough Skin" }]
          // regional/Mega form abilities keyed by form label where present
        },
        "raw": "Sand Veil - Rough Skin"
      },
      "statBlocks": [
        { "label": "Garchomp",      "total": 600, "base": { "hp": 108, "atk": 130, "def": 95,  "spa": 80,  "spd": 85, "spe": 102 } },
        { "label": "Mega Garchomp", "total": 700, "base": { "hp": 108, "atk": 170, "def": 115, "spa": 120, "spd": 95, "spe": 92 } }
      ],
      "moves": [
        {
          "form": "Standard",       // or "<Form>" (e.g. "Alola Form") for form-specific pools
          "moves": [
            { "slug": "earthquake", "name": "Earthquake", "type": "ground",
              "category": "physical", "power": "100", "accuracy": "100", "pp": "12" }
            // category is one of: physical | special | status
            // power/accuracy/pp are null when not applicable ("--" on Serebii)
          ]
        }
      ]
    }
  ]
}
```

## Current counts

See `manifest.json`. As generated: **207 species**, **297 forms** (**75 Mega forms**),
**15 added items**, **493 unique moves**.

## Refreshing (next season, ~September 2026)

When Regulation M-B rotates out and a new regulation begins:

1. Add the new regulation's Serebii URL to the `REGULATIONS` array in
   [`tools/ingest/scrape.mjs`](../../../tools/ingest/scrape.mjs).
2. Run `node tools/ingest/scrape.mjs --refresh` (the `--refresh` flag bypasses the HTML cache).
3. Commit the regenerated JSON.

The ingestion is polite (cached + rate-limited); see
[`docs/data-sources.md`](../../../docs/data-sources.md) for scraping etiquette.
