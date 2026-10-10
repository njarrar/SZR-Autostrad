import fs from 'node:fs';
const here = new URL('.', import.meta.url).pathname;
const tpl = fs.readFileSync(here + 'src/template.html', 'utf8');
const engine = fs.readFileSync(here + 'src/engine.js', 'utf8');
const links = fs.existsSync(here + 'links.json') ? JSON.parse(fs.readFileSync(here + 'links.json', 'utf8')) : {};
fs.mkdirSync(here + 'dist', { recursive: true });
for (const id of ['amman', 'dubai']) {
  const src = fs.readFileSync(here + `src/cities/${id}.js`, 'utf8');
  const sandbox = {}; new Function('window', src)(sandbox);
  const page = sandbox.CITY.page;
  const other = id === 'amman' ? 'dubai' : 'amman';
  let html = tpl;
  const tokens = Object.entries(page.tokens).map(([k, v]) => `  --${k}: ${v};`).join('\n');
  html = html.replace('__TOKENS__', tokens);
  html = html.replace(/__([A-Z0-9_]+)__/g, (m, k) => {
    if (k === 'CITY' || k === 'ENGINE') return m;
    if (k === 'TITLE') return page.title;
    if (k === 'NAME') return page.name;
    if (k === 'EYEBROW') return page.eyebrow;
    if (k === 'BLURB') return page.blurb;
    if (k === 'ALT') return page.alt;
    if (k === 'OTHER') return links[other] ? `<a href="${links[other]}" target="_blank" rel="noopener">${page.otherLabel}</a>` : '';
    if (k in page) return page[k];
    throw new Error('missing ' + k);
  });
  html = html.replace('__CITY__', () => src).replace('__ENGINE__', () => engine);
  fs.writeFileSync(here + `dist/${id}.html`, html);
  console.log(id, html.length);
}
