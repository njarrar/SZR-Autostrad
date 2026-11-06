// Puts a bundle that is already on Google Play onto a track, with no new build.
// Used by play.yml when "reuse" is on. Needs PLAY_SERVICE_ACCOUNT_JSON, TRACK and STATUS.
// The version code comes from VERSION in build.mjs (major*100+minor), like the apps.
import { readFileSync, existsSync } from 'node:fs';
import { createSign } from 'node:crypto';

const pkg = 'com.njarrar.autostrad';
const track = process.env.TRACK || 'production';
const status = process.env.STATUS || 'completed';
const key = JSON.parse(process.env.PLAY_SERVICE_ACCOUNT_JSON);
const version = readFileSync('build.mjs', 'utf8').match(/const VERSION = '([^']*)'/)[1];
const [major, minor] = version.split('.').map(Number);
const code = String(major * 100 + minor);

const b64 = (s) => Buffer.from(s).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const head = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
const claim = b64(JSON.stringify({
  iss: key.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher',
  aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
}));
const sig = createSign('RSA-SHA256').update(`${head}.${claim}`).sign(key.private_key, 'base64url');
const tok = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claim}.${sig}` }),
}).then((r) => r.json());
if (!tok.access_token) throw new Error('Sign-in to Google Play failed: ' + JSON.stringify(tok));

const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/edits`;
async function call(method, url, body) {
  const r = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${tok.access_token}`, 'content-type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${url.replace(base, 'edits')} failed (${r.status}): ${j.error?.message || JSON.stringify(j)}`);
  return j;
}

const notes = [];
for (const [file, language] of [['whatsnew-en-US', 'en-US'], ['whatsnew-ar', 'ar']]) {
  const p = `android/whatsnew/${file}`;
  if (existsSync(p)) notes.push({ language, text: readFileSync(p, 'utf8').trim() });
}

const edit = await call('POST', base, {});
const bundles = await call('GET', `${base}/${edit.id}/bundles`);
const have = (bundles.bundles || []).map((b) => String(b.versionCode));
console.log('Bundles on Google Play:', have.join(', ') || 'none');
if (!have.includes(code)) throw new Error(`Version code ${code} (${version}) is not on Google Play yet. Run without reuse to build and send it.`);

await call('PUT', `${base}/${edit.id}/tracks/${track}`, {
  track,
  releases: [{ name: version, versionCodes: [code], status, releaseNotes: notes }],
});
await call('POST', `${base}/${edit.id}:commit`);
console.log(`Put ${version} (version code ${code}) on the ${track} track as ${status}.`);
