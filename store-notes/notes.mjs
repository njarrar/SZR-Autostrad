// Builds a store's release notes from the per-version entries in store-notes/<lang>.txt.
// A store gets every entry newer than the version its players have now ("live") and no newer than
// the version in the build being sent ("build"). So when one store is still reviewing an older
// version, the other store's notes never promise a change that store's players do not have.
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.dirname(new URL(import.meta.url).pathname);

// '2.35' -> 235, the same number the stores use as the build number
export const code = (v) => { const [a, b = '0'] = String(v).split('.'); return Number(a) * 100 + Number(b); };
export const fromCode = (c) => `${Math.floor(c / 100)}.${String(c % 100).padStart(2, '0')}`;

export const buildVersion = () => fs.readFileSync(path.join(DIR, '../build.mjs'), 'utf8').match(/const VERSION = '([\d.]+)'/)[1];

export function entries(lang) {
  const out = [];
  for (const line of fs.readFileSync(path.join(DIR, lang + '.txt'), 'utf8').split('\n')) {
    if (line.startsWith('#') && !line.startsWith('## ')) continue;
    const head = line.match(/^## ([\d.]+)\s*$/);
    if (head) out.push({ version: head[1], lines: [] });
    else if (out.length && line.trim()) out[out.length - 1].lines.push(line.trim());
  }
  return out.map((e) => ({ version: e.version, text: e.lines.join(' ') })).sort((a, b) => code(b.version) - code(a.version));
}

// live: the version the store's players have now, or null when unknown (then every entry up to the build counts,
// which may say more than needed but never promises a change the build lacks). max: the store's length limit;
// older entries are left out first.
export function notes(lang, { live, build, max }) {
  let pick = entries(lang).filter((e) => code(e.version) <= code(build));
  // the store already has this build (sent again to another track): just this build's own entry
  if (live != null && code(live) >= code(build)) pick = pick.slice(0, 1);
  else if (live != null) pick = pick.filter((e) => code(e.version) > code(live));
  if (!pick.length) throw new Error(`store-notes/${lang}.txt has no entry newer than ${live} up to ${build}: add one for ${build}`);
  if (pick[0].version !== build) console.warn(`store-notes/${lang}.txt has no entry for ${build}; newest used is ${pick[0].version}`);
  let text = '';
  for (const e of pick) {
    const next = text ? text + '\n\n' + e.text : e.text;
    if (max && next.length > max) break;
    text = next;
  }
  return text || pick[0].text.slice(0, max);
}

// node store-notes/notes.mjs [live] : prints what each language would get
if (process.argv[1] && path.resolve(process.argv[1]) === path.join(DIR, 'notes.mjs')) {
  const live = process.argv[2] || null, build = process.argv[3] || buildVersion();
  for (const lang of ['en-US', 'ar']) console.log(`--- ${lang}, live ${live || 'unknown'}, build ${build}\n${notes(lang, { live, build })}\n`);
}
