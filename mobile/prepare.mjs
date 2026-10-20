// Builds the games and copies them into www/ for the apps, with three.js and the
// fonts saved next to them so the apps play with no network.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const here = new URL('.', import.meta.url).pathname;
const root = here + '../';
const www = here + 'www/';
execFileSync(process.execPath, [root + 'build.mjs'], { stdio: 'inherit' });
fs.rmSync(www, { recursive: true, force: true });
fs.cpSync(root + 'dist', www, { recursive: true });

const THREE = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
const FONTS = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Lalezar&family=Silkscreen&display=swap';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const get = async (url, type) => {
  const r = await fetch(url, { headers: { 'user-agent': UA } });
  if (!r.ok) throw new Error(url + ': ' + r.status);
  return type === 'text' ? r.text() : Buffer.from(await r.arrayBuffer());
};
fs.mkdirSync(www + 'vendor/fonts', { recursive: true });
fs.writeFileSync(www + 'vendor/three.min.js', await get(THREE));
let css = await get(FONTS, 'text');
let n = 0;
for (const url of new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+/g))) {
  const name = `f${n++}.woff2`;
  fs.writeFileSync(www + 'vendor/fonts/' + name, await get(url));
  css = css.split(url).join('fonts/' + name);
}
fs.writeFileSync(www + 'vendor/fonts.css', css);

// point the pages at the saved files, and link folders by their index.html
for (const file of fs.readdirSync(www, { recursive: true }).filter((f) => f.endsWith('.html'))) {
  const depth = file.split('/').length - 1;
  const up = '../'.repeat(depth);
  let html = fs.readFileSync(www + file, 'utf8');
  html = html.replace(/<link rel="preconnect"[^>]*>\n?/g, '')
    // the game and the landing page ask for different font sets; the saved file holds them all
    .replace(/https:\/\/fonts\.googleapis\.com\/css2\?[^"']*/g, up + 'vendor/fonts.css')
    .split(THREE).join(up + 'vendor/three.min.js')
    .replace(/href="((?:\.\.\/)?[a-z]+\/)"/g, 'href="$1index.html"')
    .replace(/href="\.\.\/"/g, 'href="../index.html"')
    .replace(/(location\.replace\(')([a-z]+\/)'/g, "$1$2index.html'")
    .replace(/(url=)([a-z]+\/)"/g, '$1$2index.html"');
  if (/https:\/\/(fonts|cdn)\./.test(html)) throw new Error(file + ' still loads from the network');
  fs.writeFileSync(www + file, html);
}
// the apps carry the same version number as the games
const version = fs.readFileSync(root + 'build.mjs', 'utf8').match(/const VERSION = '([^']+)'/)[1];
const setVersion = (file, re, to) => { const f = root + file; fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(re, to)); };
setVersion('android/app/build.gradle', /versionName "[^"]*"/, `versionName "${version}"`);
// Google Play needs a whole number that only goes up: 2.19 becomes 219
const [major, minor] = version.split('.').map(Number);
setVersion('android/app/build.gradle', /versionCode \d+/, `versionCode ${major * 100 + minor}`);
setVersion('ios/App/App.xcodeproj/project.pbxproj', /MARKETING_VERSION = [^;]*;/g, `MARKETING_VERSION = ${version};`);
// the App Store needs a new build number for each upload too
setVersion('ios/App/App.xcodeproj/project.pbxproj', /CURRENT_PROJECT_VERSION = [^;]*;/g, `CURRENT_PROJECT_VERSION = ${major * 100 + minor};`);
console.log('www ready, version ' + version);
