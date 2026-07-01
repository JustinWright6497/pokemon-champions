// Shared helpers for the Pokémon Champions (Serebii) ingestion.
// No external dependencies — uses Node 18+ global fetch.

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export const UA = 'Mozilla/5.0 (compatible; BattlepadDataBot/0.1; +local-ingestion)';
export const BASE = 'https://www.serebii.net';
export const CACHE_DIR = new URL('./.cache/', import.meta.url).pathname;

const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  eacute: 'é', Eacute: 'É', egrave: 'è', deg: '°', frac12: '½',
  ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', hellip: '…',
  times: '×', amp39: "'",
};

export function decodeEntities(s) {
  if (!s) return '';
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m, name) => (name in NAMED ? NAMED[name] : m));
}

export function stripTags(html) {
  return decodeEntities(
    String(html).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
  );
}

export function slugify(s) {
  return decodeEntities(s)
    .toLowerCase()
    .replace(/[.'’:]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fetch a URL, caching the raw HTML on disk. Rate-limited & gentle per Serebii etiquette.
export async function fetchCached(url, { delayMs = 400, force = false } = {}) {
  const key = url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9._-]+/g, '_');
  const cachePath = join(CACHE_DIR, `${key}.html`);
  if (!force && (await exists(cachePath))) {
    return readFile(cachePath, 'utf-8');
  }
  await mkdir(CACHE_DIR, { recursive: true });
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const text = await res.text();
      await writeFile(cachePath, text, 'utf-8');
      await sleep(delayMs); // be polite between live requests
      return text;
    } catch (err) {
      lastErr = err;
      await sleep(attempt * 1000 * 2 ** (attempt - 1));
    }
  }
  throw lastErr;
}

export async function writeJson(path, data, { pretty = true } = {}) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, pretty ? 2 : 0) + '\n', 'utf-8');
}

// Parse a Serebii Champions regulation page: rulesets, seasons, roster, added items.
export function parseRegulationPage(html, regulationId) {
  const roster = [];
  const iconRe = /pokedex-champions\/icon\/([a-z0-9-]+)\.png/gi;
  let m;
  const iconIdx = [];
  while ((m = iconRe.exec(html))) iconIdx.push({ i: m.index, icon: m[1] });

  for (let k = 0; k < iconIdx.length; k++) {
    const start = iconIdx[k].i;
    const end = k + 1 < iconIdx.length ? iconIdx[k + 1].i : Math.min(html.length, start + 2500);
    const seg = html.slice(start, end);

    // National dex number: nearest "#dddd" BEFORE the icon.
    const before = html.slice(Math.max(0, start - 400), start);
    const dexMatches = [...before.matchAll(/#(\d{3,4})/g)];
    const natdex = dexMatches.length ? parseInt(dexMatches[dexMatches.length - 1][1], 10) : null;

    // Species slug + display name from the name-cell link.
    const nameLink = seg.match(/\/pokedex-champions\/([a-z0-9-]+)\/">([^<]*?)(?:<br|<\/a)/i);
    if (!nameLink) continue;
    const speciesSlug = nameLink[1];
    const displayName = decodeEntities(nameLink[2]).trim();

    // Types: type-page links (.shtml) within this row segment.
    const types = [...seg.matchAll(/\/pokedex-champions\/([a-z]+)\.shtml/gi)]
      .map((t) => t[1].toLowerCase());

    const isMega = /^mega\b/i.test(displayName);
    roster.push({
      natdex,
      speciesSlug,
      displayName,
      icon: iconIdx[k].icon,
      types: [...new Set(types)],
      isMega,
      regulation: regulationId,
    });
  }

  // Rulesets (team-size bounds) from the text.
  const rulesets = {};
  const singles = html.match(/Singles Ruleset[\s\S]*?Team of (\d) to (\d)/i);
  const doubles = html.match(/Doubles Ruleset[\s\S]*?Team of (\d) to (\d)/i);
  if (singles) rulesets.singles = { minTeam: +singles[1], maxTeam: +singles[2] };
  if (doubles) rulesets.doubles = { minTeam: +doubles[1], maxTeam: +doubles[2] };

  // Regulation active dates.
  const dates = html.match(/Regulation Date[\s\S]*?([A-Z][a-z]+ \d{1,2}[a-z]{2} \d{4})\s*-\s*([A-Z][a-z]+ \d{1,2}[a-z]{2} \d{4})/);

  // Seasons table (skip the nav dropdown; match the real table rows).
  const seasons = [];
  const seasonRe = /seasonm-(\d)\.shtml"><u>Season M-\d<br\s*\/>Regulation (M-[AB])<\/u><\/a><\/td>\s*<td[^>]*>\s*([A-Za-z0-9 ]+?)\s*-\s*([A-Za-z0-9 ]+?)\s*<\/td>/gi;
  let s;
  while ((s = seasonRe.exec(html))) {
    seasons.push({ id: `M-${s[1]}`, regulation: s[2], from: s[3].trim(), until: s[4].trim() });
  }

  // Newly added items (present on the M-B page): links into /itemdex/.
  const addedItems = [];
  const itemsSection = html.split(/Newly Added Items/i)[1];
  if (itemsSection) {
    const itemRe = /\/itemdex\/([a-z0-9]+)\.shtml">([^<]+)<\/a>/gi;
    const seen = new Set();
    let it;
    while ((it = itemRe.exec(itemsSection))) {
      const slug = it[1];
      const name = decodeEntities(it[2]).trim();
      if (name && !seen.has(slug)) { seen.add(slug); addedItems.push({ slug, name }); }
    }
  }

  return {
    regulationId,
    activeFrom: dates ? dates[1] : null,
    activeUntil: dates ? dates[2] : null,
    rulesets,
    seasons: [...new Map(seasons.map((x) => [x.id, x])).values()],
    addedItems,
    roster,
  };
}

const CATEGORY = { physical: 'physical', special: 'special', other: 'status' };

function collectHeaders(html) {
  const headers = [];
  const re = /<h([123])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html))) {
    const text = stripTags(m[2]);
    if (text) headers.push({ i: m.index, level: +m[1], text });
  }
  return headers;
}

function headerBefore(headers, idx) {
  let best = null;
  for (const h of headers) {
    if (h.i < idx && (!best || h.i > best.i)) best = h;
  }
  return best;
}

// Resolve the form label for a stats table. Serebii labels base-form stats with a plain
// "Stats" header, alternate forms with "Stats - <Form>", and Mega forms with a "<Mega ...>"
// header followed by an empty "Stats -" subheader.
function statLabel(headers, idx, speciesName) {
  const hdr = headerBefore(headers, idx);
  if (!hdr) return speciesName;
  const t = hdr.text;
  if (!/^Stats\b/i.test(t)) return t;
  const after = t.replace(/^Stats\s*-?\s*/i, '').trim();
  if (after) return after; // "Stats - Alolan Raichu"
  if (/^Stats$/i.test(t)) return speciesName; // base form
  const prev = headers.filter((h) => h.i < hdr.i).sort((a, b) => b.i - a.i)[0]; // "Stats -" -> Mega header
  return prev ? prev.text : speciesName;
}

// Parse a Serebii Champions Pokédex species page.
export function parseSpeciesPage(html, slug) {
  const headers = collectHeaders(html);
  const nameMatch = html.match(/#(\d{1,4})\s+([A-Za-z0-9:'.\u00e9\- ]+?)\s*<\/h/);
  const natdex = nameMatch ? parseInt(nameMatch[1], 10) : null;
  const name = nameMatch ? decodeEntities(nameMatch[2]).trim() : slug;

  // --- Abilities (header line + per-form notes) ---
  const abilities = { forms: {}, raw: null };
  const abilBlock = html.match(/<b>Abilities<\/b>:([\s\S]*?)<\/td>/i);
  if (abilBlock) {
    abilities.raw = stripTags(abilBlock[1]);
    // Segment the header line by "(Form)" annotations to associate abilities.
    const linkRe = /\/abilitydex\/([a-z0-9-]+)\.shtml"><b>([^<]+)<\/b><\/a>\s*(?:<i><\/i>)?\s*(?:\(([^)]+)\))?/gi;
    let a;
    while ((a = linkRe.exec(abilBlock[1]))) {
      const ability = { slug: a[1], name: decodeEntities(a[2]).trim() };
      const form = a[3] ? decodeEntities(a[3]).trim() : 'default';
      (abilities.forms[form] ||= []).push(ability);
    }
  }

  // --- Base stats per form ---
  const statBlocks = [];
  const statRe = /Base Stats - Total:\s*(\d+)<\/td>((?:\s*<td[^>]*class="fooinfo">\d+<\/td>){6})/gi;
  let sm;
  while ((sm = statRe.exec(html))) {
    const nums = [...sm[2].matchAll(/>(\d+)</g)].map((x) => +x[1]);
    if (nums.length < 6) continue;
    const [hp, atk, def, spa, spd, spe] = nums;
    const label = statLabel(headers, sm.index, name);
    statBlocks.push({ label, total: +sm[1], base: { hp, atk, def, spa, spd, spe } });
  }

  // --- Moves per section ("Standard Moves", "<Form> Standard Moves") ---
  const moveSections = new Map();
  const moveRe = /<a href="\/attackdex-champions\/([a-z0-9-]+)\.shtml">([^<]+)<\/a><\/td>\s*<td class="cen"><img[^>]*alt="[^"]*?-\s*([A-Za-z]+)-type"[^>]*>[\s\S]*?alt="[^"]*?:\s*([A-Za-z]+) Move"[\s\S]*?<td class="cen">([^<]*)<\/td>\s*<td class="cen">([^<]*)<\/td>\s*<td class="cen">([^<]*)<\/td>\s*<td class="cen">([^<]*)<\/td>/gi;
  let mv;
  while ((mv = moveRe.exec(html))) {
    const hdr = headerBefore(headers, mv.index);
    let label = hdr ? hdr.text.replace(/Standard Moves/i, '').trim() : 'Standard';
    if (!label) label = 'Standard';
    const clean = (v) => {
      const t = decodeEntities(v).trim();
      return t === '' || t === '--' ? null : t;
    };
    const move = {
      slug: mv[1],
      name: decodeEntities(mv[2]).trim(),
      type: mv[3].toLowerCase(),
      category: CATEGORY[mv[4].toLowerCase()] ?? mv[4].toLowerCase(),
      power: clean(mv[5]),
      accuracy: clean(mv[6]),
      pp: clean(mv[7]),
    };
    if (!moveSections.has(label)) moveSections.set(label, new Map());
    moveSections.get(label).set(move.slug, move);
  }

  return {
    slug,
    natdex,
    name,
    abilities,
    statBlocks,
    moves: [...moveSections.entries()].map(([label, m]) => ({
      form: label,
      moves: [...m.values()].sort((a, b) => a.slug.localeCompare(b.slug)),
    })),
  };
}
