// Pokémon Champions data ingestion from Serebii.
//
// Scrapes the M-A and M-B regulation pages plus every referenced Champions Pokédex
// species page, and writes a normalized, versioned dataset to packages/data/champions/.
//
// Re-runnable: raw HTML is cached under tools/ingest/.cache, so re-runs are cheap.
// Refresh for the next regulation (post-M-B) by adding its page URL below and running
// `node tools/ingest/scrape.mjs --refresh`.
//
// Usage:
//   node tools/ingest/scrape.mjs            # use cache when available
//   node tools/ingest/scrape.mjs --refresh  # force re-fetch from Serebii

import {
  BASE, fetchCached, writeJson, parseRegulationPage, parseSpeciesPage,
} from './lib.mjs';

const OUT = new URL('../../packages/data/champions/', import.meta.url).pathname;
const force = process.argv.includes('--refresh');

const REGULATIONS = [
  { id: 'M-A', url: `${BASE}/pokemonchampions/rankedbattle/regulationm-a.shtml` },
  { id: 'M-B', url: `${BASE}/pokemonchampions/rankedbattle/regulationm-b.shtml` },
];

function log(...a) { console.log('[ingest]', ...a); }

async function main() {
  // 1) Regulation pages -> rulesets, seasons, roster, items.
  const regulations = [];
  for (const reg of REGULATIONS) {
    log(`regulation ${reg.id} …`);
    const html = await fetchCached(reg.url, { force });
    regulations.push(parseRegulationPage(html, reg.id));
  }

  // 2) Union of species referenced across regulations.
  const speciesSlugs = [...new Set(
    regulations.flatMap((r) => r.roster.map((f) => f.speciesSlug)),
  )].sort();
  log(`unique species to fetch: ${speciesSlugs.length}`);

  // 3) Fetch + parse each species page.
  const pokemon = [];
  let n = 0;
  for (const slug of speciesSlugs) {
    n += 1;
    const html = await fetchCached(`${BASE}/pokedex-champions/${slug}/`, { force });
    const parsed = parseSpeciesPage(html, slug);
    pokemon.push(parsed);
    if (n % 25 === 0 || n === speciesSlugs.length) log(`  parsed ${n}/${speciesSlugs.length}`);
  }

  // 4) Cumulative legality: a form is legal in a regulation if introduced in it or earlier.
  const order = REGULATIONS.map((r) => r.id);
  // Icon file encodes the specific form (e.g. 026, 026-mx, 026-a), so it uniquely
  // distinguishes regional forms that share a display name.
  const formId = (f) => `${f.speciesSlug}:${f.icon}`;
  const allForms = [];
  const seenForm = new Set();
  for (const reg of regulations) {
    for (const f of reg.roster) {
      const id = formId(f);
      if (seenForm.has(id)) continue;
      seenForm.add(id);
      allForms.push({ id, ...f, introducedIn: reg.regulationId });
    }
  }
  const legalFormsByRegulation = {};
  for (const regId of order) {
    const upto = order.slice(0, order.indexOf(regId) + 1);
    legalFormsByRegulation[regId] = allForms
      .filter((f) => upto.includes(f.introducedIn))
      .map((f) => f.id);
  }

  // 5) Items (M-B introduced a competitive item batch; M-A base items not separately listed).
  const addedItems = regulations.flatMap((r) =>
    r.addedItems.map((it) => ({ ...it, introducedIn: r.regulationId })),
  );

  // 6) Write outputs.
  const generatedAt = new Date().toISOString();
  const source = 'https://www.serebii.net/pokemonchampions/';

  await writeJson(`${OUT}regulations.json`, {
    source, generatedAt,
    regulations: regulations.map((r) => ({
      id: r.regulationId,
      activeFrom: r.activeFrom,
      activeUntil: r.activeUntil,
      rulesets: r.rulesets,
      seasons: r.seasons,
      rosterCount: r.roster.length,
    })),
  });

  await writeJson(`${OUT}forms.json`, {
    source, generatedAt,
    forms: allForms,
    legalFormsByRegulation,
  });

  await writeJson(`${OUT}items.json`, { source, generatedAt, addedItems });

  await writeJson(`${OUT}pokemon.json`, { source, generatedAt, pokemon }, { pretty: false });

  const megaForms = allForms.filter((f) => f.isMega);
  const manifest = {
    datasetVersion: `champions-${generatedAt.slice(0, 10)}`,
    source,
    generatedAt,
    regulations: order,
    seasons: regulations.flatMap((r) => r.seasons.map((s) => s.id)),
    counts: {
      species: pokemon.length,
      forms: allForms.length,
      megaForms: megaForms.length,
      addedItems: addedItems.length,
      moves: new Set(pokemon.flatMap((p) => p.moves.flatMap((m) => m.moves.map((x) => x.slug)))).size,
    },
    files: ['regulations.json', 'forms.json', 'items.json', 'pokemon.json'],
    attribution: 'Data sourced from Serebii.net (Pokémon Champions). Not affiliated with Nintendo/Game Freak/The Pokémon Company.',
  };
  await writeJson(`${OUT}manifest.json`, manifest);

  log('done. counts:', JSON.stringify(manifest.counts));
}

main().catch((err) => { console.error(err); process.exit(1); });
