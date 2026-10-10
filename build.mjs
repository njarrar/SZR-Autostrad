import fs from 'node:fs';
const here = new URL('.', import.meta.url).pathname;
const tpl = fs.readFileSync(here + 'src/template.html', 'utf8');
const engine = fs.readFileSync(here + 'src/engine.js', 'utf8');
const links = fs.existsSync(here + 'links.json') ? JSON.parse(fs.readFileSync(here + 'links.json', 'utf8')) : {};
const CITIES = ['amman', 'dubai'];
const DEFAULT_LANG = 'ar';

// ---------- language files: lang/<code>.xml ----------
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
function readStrings(body) {
  const out = {};
  for (const m of body.matchAll(/<string key="([^"]+)">(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/string>/g)) out[m[1]] = m[2] != null ? m[2] : unescape(m[3]);
  return out;
}
function readLang(file) {
  const xml = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const head = xml.match(/<language code="([^"]+)" name="([^"]+)" dir="(ltr|rtl)">/);
  if (!head) throw new Error(file + ': missing <language code name dir>');
  const section = (re) => { const m = xml.match(re); return m ? readStrings(m[1]) : {}; };
  const common = section(/<common>([\s\S]*?)<\/common>/);
  const cities = {};
  for (const id of CITIES) cities[id] = { ...common, ...section(new RegExp(`<city id="${id}">([\\s\\S]*?)<\\/city>`)) };
  return { code: head[1], name: head[2], dir: head[3], cities, landing: section(/<landing>([\s\S]*?)<\/landing>/) };
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
  const src = fs.readFileSync(here + `src/cities/${id}.js`, 'utf8');
  const sandbox = {}; new Function('window', src)(sandbox);
  const page = sandbox.CITY.page;
  const S = langs[DEFAULT_LANG].cities[id];
  const pack = Object.fromEntries(Object.values(langs).map((l) => [l.code, { name: l.name, dir: l.dir, s: l.cities[id] }]));
  const other = id === 'amman' ? 'dubai' : 'amman';
  const span = (k) => { if (!(k in S)) throw new Error('missing string ' + k); return `<span data-t="${k}">${S[k]}</span>`; };
  let html = tpl;
  const tokens = Object.entries(page.tokens).map(([k, v]) => `  --${k}: ${v};`).join('\n');
  html = html.replace('__TOKENS__', tokens);
  html = html.replace(/__([A-Z0-9_]+)__/g, (m, k) => {
    if (k === 'CITY' || k === 'ENGINE' || k === 'LANGS') return m;
    if (k === 'LANG') return DEFAULT_LANG;
    if (k === 'DIR') return langs[DEFAULT_LANG].dir;
    if (k === 'TITLE') return S['page.title'];
    if (k === 'ALT') return S['page.alt'];
    if (k === 'NAME') return span('page.name');
    if (k === 'EYEBROW') return span('page.eyebrow');
    if (k === 'BLURB') return span('page.blurb');
    if (k === 'OTHER') return links[other] ? `<a href="${links[other]}" target="_blank" rel="noopener">${span('page.otherLabel')}</a>` : `<a href="${other}.html" data-local>${span('page.otherLabel')}</a>`;
    if (k.startsWith('T_')) return span('page.' + k);
    throw new Error('missing ' + k);
  });
  html = html.replace('__LANGS__', () => 'window.LANGS = ' + json(pack) + ';').replace('__CITY__', () => src).replace('__ENGINE__', () => engine);
  fs.writeFileSync(here + `dist/${id}.html`, html);
  console.log(id, html.length);
}

// ---------- landing page and its images ----------
{
  const S = langs[DEFAULT_LANG].landing;
  const pack = Object.fromEntries(Object.values(langs).map((l) => [l.code, { name: l.name, dir: l.dir, s: l.landing }]));
  let html = fs.readFileSync(here + 'src/landing.html', 'utf8');
  html = html.replace(/__L_([a-zA-Z0-9]+)__/g, (m, k) => { if (!(k in S)) throw new Error('missing landing string ' + k); return S[k]; });
  html = html.replace('__LANG__', DEFAULT_LANG).replace('__DIR__', langs[DEFAULT_LANG].dir).replace('__LANGS__', () => 'window.LANGS = ' + json(pack) + ';');
  fs.writeFileSync(here + 'dist/index.html', html);
}
fs.mkdirSync(here + 'dist/img', { recursive: true });
for (const f of ['amman-drive.png', 'dubai-drive.png']) fs.copyFileSync(here + 'docs/screenshots/' + f, here + 'dist/img/' + f);
console.log('index.html', Object.keys(langs).join(' '));
