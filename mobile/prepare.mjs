// Builds the games and copies them into www/ for the apps, with three.js and the
// fonts saved next to them so the apps play with no network.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { code } from '../store-notes/notes.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const www = path.join(here, 'www');
execFileSync(process.execPath, [path.join(root, 'build.mjs')], { stdio: 'inherit' });
fs.rmSync(www, { recursive: true, force: true });
fs.cpSync(path.join(root, 'dist'), www, { recursive: true });

// remove web-only legal/support pages and legacy root redirect shims from the mobile app bundle
for (const entry of fs.readdirSync(www)) {
  if (entry === 'privacy.html' || entry === 'support.html' || (entry.endsWith('.html') && entry !== 'index.html')) {
    fs.rmSync(path.join(www, entry), { force: true });
  }
}

const THREE = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
// single source of truth for the Google Fonts URL from src/template.html
const tplHtml = fs.readFileSync(path.join(root, 'src/template.html'), 'utf8');
const fontsMatch = tplHtml.match(/https:\/\/fonts\.googleapis\.com\/css2\?[^"']+/);
if (!fontsMatch) throw new Error('src/template.html: Google Fonts stylesheet URL not found');
const FONTS = fontsMatch[0];
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const get = async (url, type) => {
  const r = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(url + ': ' + r.status);
  return type === 'text' ? r.text() : Buffer.from(await r.arrayBuffer());
};

const vendorDir = path.join(www, 'vendor');
const fontsDir = path.join(vendorDir, 'fonts');
fs.mkdirSync(fontsDir, { recursive: true });

// prefer integrity-locked three@0.160.0 from mobile/node_modules, falling back to CDN if not yet installed
const localThree = path.join(here, 'node_modules/three/build/three.min.js');
if (fs.existsSync(localThree)) fs.copyFileSync(localThree, path.join(vendorDir, 'three.min.js'));
else fs.writeFileSync(path.join(vendorDir, 'three.min.js'), await get(THREE));

// prefer vendored offline fonts if present, else fetch and verify non-empty matches
const vendoredFonts = path.join(here, 'vendor/fonts.css');
if (fs.existsSync(vendoredFonts)) {
  fs.cpSync(path.join(here, 'vendor'), vendorDir, { recursive: true });
  if (fs.existsSync(localThree)) fs.copyFileSync(localThree, path.join(vendorDir, 'three.min.js'));
} else {
  let css = await get(FONTS, 'text');
  const matches = css.match(/https:\/\/fonts\.gstatic\.com\/[^)'"]+/g);
  if (!matches || !matches.length) throw new Error('No font URLs matched in Google Fonts CSS');
  let n = 0;
  for (const url of new Set(matches)) {
    const name = `f${n++}.woff2`;
    fs.writeFileSync(path.join(fontsDir, name), await get(url));
    css = css.split(url).join('fonts/' + name);
  }
  if (/https?:\/\//i.test(css)) throw new Error('vendor/fonts.css still contains external URLs');
  fs.writeFileSync(path.join(vendorDir, 'fonts.css'), css);
}

// point the pages at the saved files, and link folders by their index.html
for (const file of fs.readdirSync(www, { recursive: true }).filter((f) => String(f).endsWith('.html'))) {
  const rel = String(file);
  const depth = rel.split(/[\\/]/).length - 1;
  const up = '../'.repeat(depth);
  const full = path.join(www, rel);
  let html = fs.readFileSync(full, 'utf8');
  html = html.replace(/<link rel="preconnect"[^>]*>\n?/g, '')
    // the game and the landing page ask for different font sets; the saved file holds them all
    .replace(/https:\/\/fonts\.googleapis\.com\/css2\?[^"']*/g, up + 'vendor/fonts.css')
    .split(THREE).join(up + 'vendor/three.min.js')
    .replace(/href="((?:\.\.\/)?[a-z0-9_-]+\/)"/g, 'href="$1index.html"')
    .replace(/href="\.\.\/"/g, 'href="../index.html"')
    .replace(/(location\.replace\(')([a-z0-9_-]+\/)'/g, "$1$2index.html'")
    .replace(/(url=)([a-z0-9_-]+\/)"/g, '$1$2index.html"')
    // strip external GitHub link from the bundled mobile app HTML
    .replace(/\s*<a href="https:\/\/github\.com\/[^"]*"[^>]*>[\s\S]*?<\/a>/g, '');
  if (/<(?:script|link)\b[^>]+(?:src|href)="https?:\/\//i.test(html) || /url\(['"]?https?:\/\//i.test(html)) {
    throw new Error(rel + ' still loads external network assets');
  }
  fs.writeFileSync(full, html);
}

// the apps carry the same version number as the games
const version = fs.readFileSync(path.join(root, 'build.mjs'), 'utf8').match(/const VERSION = '([^']+)'/)[1];
const buildCode = code(version);
const setVersion = (file, re, to) => {
  const f = path.join(root, file);
  const src = fs.readFileSync(f, 'utf8');
  if (!re.test(src)) throw new Error(`setVersion: pattern ${re} did not match in ${file}`);
  fs.writeFileSync(f, src.replace(re, to));
};
setVersion('android/app/build.gradle', /versionName "[^"]*"/, `versionName "${version}"`);
setVersion('android/app/build.gradle', /versionCode \d+/, `versionCode ${buildCode}`);
setVersion('ios/App/App.xcodeproj/project.pbxproj', /MARKETING_VERSION = [^;]*;/g, `MARKETING_VERSION = ${version};`);
setVersion('ios/App/App.xcodeproj/project.pbxproj', /CURRENT_PROJECT_VERSION = [^;]*;/g, `CURRENT_PROJECT_VERSION = ${buildCode};`);
console.log('www ready, version ' + version + ' (build ' + buildCode + ')');
