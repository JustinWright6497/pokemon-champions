// Cross-check the scraped Champions base stats against @pkmn/dex for shared species.
//
// Serebii is the source of truth for Champions legality/rosters, but base stats are shared with
// the main series, so @pkmn/dex is a useful sanity net to catch scraping errors. Champions-original
// forms (e.g. brand-new Mega Evolutions) won't exist in @pkmn/dex — those are reported as "unmatched"
// and are expected, not errors.
//
// Usage: node crosscheck.mjs

import { Dex } from '@pkmn/dex';
import { readFile, writeFile } from 'node:fs/promises';

const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const REGIONS = { Alolan: 'Alola', Galarian: 'Galar', Hisuian: 'Hisui', Paldean: 'Paldea' };
// Generic Serebii form-header labels -> @pkmn/dex forme suffix (resolved with the species name).
const FORME = {
  'Blade Forme': 'Blade', 'Shield Forme': '', 'Small Variety': 'Small',
  'Large Variety': 'Large', 'Jumbo Variety': 'Super', 'Average Variety': '',
  'Midnight Form': 'Midnight', 'Dusk Form': 'Dusk', 'Hero Form': 'Hero', 'Female': 'F',
};
// Ambiguous "<species>|<label>" headers that group several stat-identical formes.
const OVERRIDE = {
  'Rotom|Alternate Forms': ['Rotom-Heat', 'Rotom-Wash', 'Rotom-Frost', 'Rotom-Fan', 'Rotom-Mow'],
};

// Map a Serebii stat-block label to candidate @pkmn/dex species names.
function candidates(label, speciesName) {
  const L = label.trim();

  if (OVERRIDE[`${speciesName}|${L}`]) return OVERRIDE[`${speciesName}|${L}`];

  const mega = L.match(/^Mega (.+?)( X| Y)?$/);
  if (mega) {
    const base = mega[1].trim();
    const suffix = mega[2] ? `-${mega[2].trim()}` : '';
    return [`${base}-Mega${suffix}`, `${base}-Mega`];
  }

  for (const [prefix, region] of Object.entries(REGIONS)) {
    if (L.startsWith(`${prefix} `)) {
      const sp = L.slice(prefix.length + 1).replace(/\s*\(.*\)$/, '').trim();
      const cands = [`${sp}-${region}`];
      if (region === 'Paldea' && /tauros/i.test(sp)) {
        cands.push(`${sp}-Paldea-Combat`, `${sp}-Paldea-Blaze`, `${sp}-Paldea-Aqua`);
      }
      return cands;
    }
  }

  if (L in FORME) {
    return [FORME[L] ? `${speciesName}-${FORME[L]}` : speciesName];
  }
  return [L];
}

function lookup(label, speciesName) {
  for (const name of candidates(label, speciesName)) {
    const s = Dex.species.get(name);
    if (s && s.exists) return s;
  }
  return null;
}

const pkPath = new URL('../../packages/data/champions/pokemon.json', import.meta.url).pathname;
const { pokemon } = JSON.parse(await readFile(pkPath, 'utf-8'));

const pkgVersion = JSON.parse(
  await readFile(new URL('./node_modules/@pkmn/dex/package.json', import.meta.url).pathname, 'utf-8'),
).version;

const report = {
  generatedAt: new Date().toISOString(),
  reference: `@pkmn/dex@${pkgVersion}`,
  note: 'Base-stat sanity check vs main-series data. Unmatched entries are Champions-original forms (new Mega Evolutions) that do not exist in @pkmn/dex — expected, not errors.',
  matched: 0, identical: 0, mismatches: [], unmatched: [],
};

for (const p of pokemon) {
  for (const block of p.statBlocks) {
    const s = lookup(block.label, p.name);
    if (!s) {
      report.unmatched.push({ species: p.slug, label: block.label });
      continue;
    }
    report.matched += 1;
    const diffs = STATS.filter((k) => block.base[k] !== s.baseStats[k]).map((k) => ({
      stat: k, serebii: block.base[k], pkmn: s.baseStats[k],
    }));
    if (diffs.length === 0) {
      report.identical += 1;
    } else {
      report.mismatches.push({ species: p.slug, label: block.label, pkmnName: s.name, diffs });
    }
  }
}

const outPath = new URL('../../packages/data/champions/crosscheck-report.json', import.meta.url).pathname;
await writeFile(outPath, JSON.stringify(report, null, 2) + '\n', 'utf-8');

console.log('[crosscheck] matched:', report.matched, ' identical:', report.identical,
  ' mismatches:', report.mismatches.length, ' unmatched:', report.unmatched.length);
console.log('\n--- MISMATCHES ---');
for (const m of report.mismatches) {
  console.log(` ${m.label} (${m.pkmnName}): ` +
    m.diffs.map((d) => `${d.stat} serebii=${d.serebii} pkmn=${d.pkmn}`).join(', '));
}
console.log('\n--- UNMATCHED (expected: Champions-original forms) ---');
console.log(report.unmatched.map((u) => u.label).join(', '));
