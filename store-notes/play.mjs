// Writes android/whatsnew/ for a Google Play upload. It asks Google Play which version the players
// on the chosen track have now, and writes the notes for every version after that one up to the build.
// Runs from .github/workflows/play.yml with PLAY_SERVICE_ACCOUNT_JSON and TRACK set. Without the key,
// or if Google Play does not answer, it writes the notes for every version up to the build.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { notes, buildVersion, fromCode } from './notes.mjs';

const PACKAGE = 'com.njarrar.autostrad';
const FILES = { 'en-US': 'whatsnew-en-US', ar: 'whatsnew-ar' };
const MAX = 500; // Google Play's limit per language
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), '../android/whatsnew');
const env = process.env;
const build = env.VERSION || buildVersion();
const track = env.TRACK || 'internal';

async function liveOnTrack() {
  const key = JSON.parse(env.PLAY_SERVICE_ACCOUNT_JSON);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const body = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud: key.token_uri || 'https://oauth2.googleapis.com/token', iat: now, exp: now + 600 });
  const jwt = body + '.' + crypto.createSign('RSA-SHA256').update(body).sign(key.private_key, 'base64url');
  const tok = await fetch(key.token_uri || 'https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) }).then((r) => r.json());
  if (!tok.access_token) throw new Error('no Google Play token: ' + JSON.stringify(tok).slice(0, 200));
  const api = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE}/edits`;
  const headers = { authorization: 'Bearer ' + tok.access_token };
  const edit = await fetch(api, { method: 'POST', headers }).then((r) => r.json());
  if (!edit.id) throw new Error('no Google Play edit: ' + JSON.stringify(edit).slice(0, 200));
  try {
    const t = await fetch(`${api}/${edit.id}/tracks/${track}`, { headers }).then((r) => r.json());
    if (t.error) throw new Error(t.error.message);
    // only a fully rolled out release counts: during a staged rollout some players still have the one before
    const codes = (t.releases || []).filter((r) => r.status === 'completed').flatMap((r) => r.versionCodes || []).map(Number);
    return codes.length ? fromCode(Math.max(...codes)) : null;
  } finally {
    await fetch(`${api}/${edit.id}`, { method: 'DELETE', headers }).catch(() => {});
  }
}

let live = null, why = '';
if (env.PLAY_SERVICE_ACCOUNT_JSON) {
  try { live = await liveOnTrack(); why = live ? `players on ${track} have ${live}` : `nothing live on ${track} yet`; }
  catch (e) { why = 'could not ask Google Play (' + e.message + ')'; }
} else why = 'no PLAY_SERVICE_ACCOUNT_JSON';

fs.mkdirSync(OUT, { recursive: true });
const summary = [`### Google Play notes for ${build} on ${track}`, `${why}, so the notes cover ${live ? 'every version after ' + live : 'every version'} up to ${build}.`];
for (const [lang, file] of Object.entries(FILES)) {
  const text = notes(lang, { live, build, max: MAX });
  fs.writeFileSync(path.join(OUT, file), text + '\n');
  summary.push('', `**${lang}**`, '', text);
}
console.log(summary.join('\n'));
if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, summary.join('\n') + '\n');
