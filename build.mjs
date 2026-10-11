import fs from 'node:fs';
const here = new URL('.', import.meta.url).pathname;
const tpl = fs.readFileSync(here + 'src/template.html', 'utf8');
const engine = fs.readFileSync(here + 'src/audio.js', 'utf8') + '\n' + fs.readFileSync(here + 'src/engine.js', 'utf8');
const links = fs.existsSync(here + 'links.json') ? JSON.parse(fs.readFileSync(here + 'links.json', 'utf8')) : {};
// every folder in cities/ with a city.js is a game; sorted by its `order`, then by name
const CITIES = fs.readdirSync(here + 'cities').filter((d) => fs.existsSync(here + `cities/${d}/city.js`)).map((id) => {
  const sandbox = {}; new Function('window', fs.readFileSync(here + `cities/${id}/city.js`, 'utf8'))(sandbox);
  if (sandbox.CITY.id !== id) throw new Error(`cities/${id}/city.js: id is '${sandbox.CITY.id}', expected '${id}'`);
  return sandbox.CITY;
}).sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.id.localeCompare(b.id)).map((c) => c.id);
if (!CITIES.length) throw new Error('no cities found in cities/');
const DEFAULT_LANG = 'ar';
// shown on each game's start screen and on the landing cards; raise VERSION with each release
const VERSION = '2.10';
const BUILT = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
const STAMP = `v${VERSION} · ${BUILT}`;

// ---------- language files: lang/<code>.xml ----------
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
function readStrings(body) {
  const out = {};
  for (const m of body.matchAll(/<string key="([^"]+)">(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/string>/g)) out[m[1]] = m[2] != null ? m[2] : unescape(m[3]);
  return out;
}
const readXml = (file) => fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
// lang/<code>.xml holds the shared text; cities/<id>/lang/<code>.xml holds each city's own text
function readLang(file) {
  const xml = readXml(file);
  const head = xml.match(/<language code="([^"]+)" name="([^"]+)" dir="(ltr|rtl)">/);
  if (!head) throw new Error(file + ': missing <language code name dir>');
  const section = (src, re) => { const m = src.match(re); return m ? readStrings(m[1]) : {}; };
  const common = section(xml, /<common>([\s\S]*?)<\/common>/);
  const cities = {};
  for (const id of CITIES) {
    const cf = here + `cities/${id}/lang/${head[1]}.xml`;
    if (!fs.existsSync(cf)) throw new Error(`missing cities/${id}/lang/${head[1]}.xml`);
    cities[id] = { ...common, ...section(readXml(cf), /<city>([\s\S]*?)<\/city>/) };
  }
  // each game links to the next city; the label uses that city's name in this language
  CITIES.forEach((id, i) => { const next = CITIES[(i + 1) % CITIES.length]; cities[id]['page.otherLabel'] = (common['page.tryCity'] || '{city}').replace('{city}', cities[next]['page.name']); });
  return { code: head[1], name: head[2], dir: head[3], cities, landing: section(xml, /<landing>([\s\S]*?)<\/landing>/) };
}
const langs = {};
for (const f of fs.readdirSync(here + 'lang').filter((f) => f.endsWith('.xml')).sort()) { const l = readLang(here + 'lang/' + f); langs[l.code] = l; }
if (!langs[DEFAULT_LANG]) throw new Error('missing lang/' + DEFAULT_LANG + '.xml');
// every language must have every key the default language has
for (const [code, l] of Object.entries(langs)) {
  const cmp = (a, b, where) => { const miss = Object.keys(a).filter((k) => !(k in b)); if (miss.length) throw new Error(`lang/${code}.xml ${where} is missing: ${miss.join(', ')}`); };
  for (const id of CITIES) { cmp(langs[DEFAULT_LANG].cities[id], l.cities[id], id); cmp(l.cities[id], langs[DEFAULT_LANG].cities[id], id + ' (extra keys vs ' + DEFAULT_LANG + ')'); }
  cmp(langs[DEFAULT_LANG].landing, l.landing, 'landing');
}
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

fs.mkdirSync(here + 'dist', { recursive: true });
for (const id of CITIES) {
  const src = fs.readFileSync(here + `cities/${id}/city.js`, 'utf8');
  const sandbox = {}; new Function('window', src)(sandbox);
  const page = sandbox.CITY.page;
  const S = langs[DEFAULT_LANG].cities[id];
  const pack = Object.fromEntries(Object.values(langs).map((l) => [l.code, { name: l.name, dir: l.dir, s: l.cities[id] }]));
  const other = CITIES[(CITIES.indexOf(id) + 1) % CITIES.length];
  const span = (k) => { if (!(k in S)) throw new Error('missing string ' + k); return `<span data-t="${k}">${S[k]}</span>`; };
  let html = tpl;
  const tokens = Object.entries(page.tokens).map(([k, v]) => `  --${k}: ${v};`).join('\n');
  html = html.replace('__TOKENS__', tokens);
  // placeholders inside aria-label get plain text plus a marker so the game can swap the language later
  html = html.replace(/aria-label="__(T_[A-Z0-9_]+)__"/g, (m, k) => { if (!(('page.' + k) in S)) throw new Error('missing string page.' + k); return `aria-label="${S['page.' + k]}" data-t-aria="page.${k}"`; });
  html = html.replace(/__([A-Z0-9_]+)__/g, (m, k) => {
    if (k === 'CITY' || k === 'ENGINE' || k === 'LANGS') return m;
    if (k === 'LANG') return DEFAULT_LANG;
    if (k === 'STAMP') return STAMP;
    if (k === 'DIR') return langs[DEFAULT_LANG].dir;
    if (k === 'TITLE') return S['page.title'];
    if (k === 'ALT') return S['page.alt'];
    if (k === 'NAME') return span('page.name');
    if (k === 'EYEBROW') return span('page.eyebrow');
    if (k === 'BLURB') return span('page.blurb');
    if (k === 'OTHER') return links[other] ? `<a href="${links[other]}" target="_blank" rel="noopener">${span('page.otherLabel')}</a>` : `<a href="../${other}/" data-local>${span('page.otherLabel')}</a>`;
    if (k.startsWith('T_')) return span('page.' + k);
    throw new Error('missing ' + k);
  });
  html = html.replace('__LANGS__', () => 'window.LANGS = ' + json(pack) + ';').replace('__CITY__', () => src).replace('__ENGINE__', () => engine);
  // each city has its own page at /<city>/; the old /<city>.html address forwards there
  fs.mkdirSync(here + `dist/${id}`, { recursive: true });
  fs.writeFileSync(here + `dist/${id}/index.html`, html);
  fs.writeFileSync(here + `dist/${id}.html`, `<!doctype html><meta charset="utf-8"><title>${S['page.title']}</title><meta http-equiv="refresh" content="0; url=${id}/"><script>location.replace('${id}/' + location.search + location.hash)</script><a href="${id}/">${S['page.title']}</a>\n`);
  console.log(id, html.length);
}

// ---------- landing page: one card per city ----------
{
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  // the landing strings plus each city's card text, as <id>.tag, <id>.name, <id>.text and <id>.alt
  const landingOf = (l) => { const s = { ...l.landing }; for (const id of CITIES) for (const k of ['tag', 'name', 'text', 'alt']) { const v = l.cities[id]['card.' + k]; if (v == null) throw new Error(`cities/${id}/lang/${l.code}.xml is missing card.${k}`); s[`${id}.${k}`] = v; } return s; };
  const S = landingOf(langs[DEFAULT_LANG]);
  const pack = Object.fromEntries(Object.values(langs).map((l) => [l.code, { name: l.name, dir: l.dir, s: landingOf(l) }]));
  const cfg = Object.fromEntries(CITIES.map((id) => { const sb = {}; new Function('window', fs.readFileSync(here + `cities/${id}/city.js`, 'utf8'))(sb); return [id, sb.CITY]; }));
  const cards = CITIES.map((id) => `    <a class="city c-${id}" href="${id}/" data-game>
      <img src="img/${id}.png" alt="${esc(S[id + '.alt'])}" data-t-alt="${id}.alt">
      <div class="txt">
        <span class="en" data-t="${id}.tag">${S[id + '.tag']}</span>
        <h2 data-t="${id}.name">${S[id + '.name']}</h2>
        <p data-t="${id}.text">${S[id + '.text']}</p>
        <span class="play" data-t="play">${S.play}</span>
        <span class="ver">${STAMP}</span>
      </div>
    </a>`).join('\n');
  const colors = (k) => CITIES.map((id) => `.c-${id} { --c: ${(cfg[id].card || {})[k] || (cfg[id].card || {}).color || 'var(--ink)'}; }`).join(' ');
  let html = fs.readFileSync(here + 'src/landing.html', 'utf8');
  html = html.replace('__CARDS__', () => cards).replace('__CARD_COLORS__', () => colors('color')).replace('__CARD_COLORS_DARK__', () => colors('dark'));
  html = html.replace(/__L_([a-zA-Z0-9]+)__/g, (m, k) => { if (!(k in S)) throw new Error('missing landing string ' + k); return S[k]; });
  html = html.replace('__LANG__', DEFAULT_LANG).replace('__DIR__', langs[DEFAULT_LANG].dir).replace('__LANGS__', () => 'window.LANGS = ' + json(pack) + ';');
  fs.writeFileSync(here + 'dist/index.html', html);
  // each city's cover picture
  fs.mkdirSync(here + 'dist/img', { recursive: true });
  for (const id of CITIES) if (fs.existsSync(here + `cities/${id}/cover.png`)) fs.copyFileSync(here + `cities/${id}/cover.png`, here + `dist/img/${id}.png`);
}
console.log('index.html', Object.keys(langs).join(' '), '·', CITIES.join(' '));
