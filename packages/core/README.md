# @battlepad/core

Framework-agnostic engine for Pokémon Champions — no React/React Native dependencies. This is the
correctness-critical layer; every function here is unit-tested (`npm test` at the repo root).

## Modules

| Module | Responsibility |
| --- | --- |
| `natures` | Nature table + stat modifiers (±10%) |
| `stats` | Final-stat computation (main-series formula; Level 50 default for Champions VGC) |
| `typechart` | 18-type effectiveness, defensive profile, weaknesses/resistances |
| `dex` | Indexed accessors over the `@battlepad/data` dataset (species, forms, legality) |
| `mega` | Resolve a species' **Mega form(s)** — stats, types, ability — from the dataset |
| `legality` | Validate a team vs a regulation (team size, Species/Item Clause, EV cap, allowed forms) |

## Example

```ts
import { computeStats, getMegaForms, typeEffectiveness, validateTeam } from '@battlepad/core';

computeStats({ base: { hp: 108, atk: 130, def: 95, spa: 80, spd: 85, spe: 102 },
               level: 50, nature: 'adamant', evs: { atk: 252 } }).atk; // 200

getMegaForms('charizard');                 // Mega Charizard X (Fire/Dragon) & Y (Fire/Flying)
typeEffectiveness('ice', ['dragon', 'ground']); // 4 (Garchomp)
validateTeam([...], 'M-B', 'doubles');     // { legal, violations[] }
```

Data comes from [`@battlepad/data`](../data/), generated from Serebii (see that package's README).
