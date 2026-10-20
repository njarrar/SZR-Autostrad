// Fills in the App Store page through the App Store Connect API: app info, age rating,
// store text in English and Arabic, screenshots, build, price, review notes.
// Runs from .github/workflows/app-store.yml. Set SUBMIT=1 to send the version for review.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const env = process.env;
const BUNDLE = 'com.njarrar.autostrad';
const VERSION = env.VERSION || '2.29';
const BUILD = String(Math.round(parseFloat(VERSION) * 100));
const DIR = path.dirname(new URL(import.meta.url).pathname);
const LOCALES = { 'en-US': 'en-US', 'ar-SA': 'ar' };
const SHOT_SETS = { APP_IPHONE_67: 'iphone-6.9', APP_IPAD_PRO_3GEN_129: 'ipad-13' };
const URLS = {
  support: 'https://github.com/njarrar/SZR-Autostrad',
  marketing: 'https://njarrar.github.io/SZR-Autostrad/',
  privacy: 'https://njarrar.github.io/SZR-Autostrad/privacy.html',
};
const REVIEW_NOTES = 'No account or sign-in. Pick a city and tap Let\'s go to drive. Kids Mode is the button under the cars on the menu; to leave it, hold the lock in the top corner for 3 seconds. The app makes no network calls and collects no data.';

function token() {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'ES256', kid: env.ASC_KEY_ID, typ: 'JWT' });
  const body = b64({ iss: env.ASC_ISSUER_ID, iat: now, exp: now + 1100, aud: 'appstoreconnect-v1' });
  const key = env.ASC_KEY.includes('BEGIN') ? env.ASC_KEY : Buffer.from(env.ASC_KEY, 'base64').toString();
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return head + '.' + body + '.' + sig;
}

async function api(method, url, body) {
  const res = await fetch(url.startsWith('http') ? url : 'https://api.appstoreconnect.apple.com' + url, {
    method, headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url} ${res.status}\n${text.slice(0, 1500)}`);
  return text ? JSON.parse(text) : {};
}
const get = (u) => api('GET', u), post = (u, b) => api('POST', u, b), patch = (u, b) => api('PATCH', u, b), del = (u) => api('DELETE', u);
const read = (loc, f) => { try { return fs.readFileSync(path.join(DIR, 'listing', loc, f + '.txt'), 'utf8').trim(); } catch (e) { return undefined; } };
const step = async (name, fn) => { try { await fn(); console.log('ok   ' + name); } catch (e) { console.log('FAIL ' + name + '\n' + e.message); failed.push(name); } };
const failed = [];

const app = (await get(`/v1/apps?filter[bundleId]=${BUNDLE}`)).data[0];
if (!app) throw new Error('no app with bundle ID ' + BUNDLE);
console.log('app', app.id, app.attributes.name);

// ---------- app info: category, content rights, name and subtitle, age rating ----------
const infos = (await get(`/v1/apps/${app.id}/appInfos`)).data;
const info = infos.find((i) => !['READY_FOR_DISTRIBUTION', 'REPLACED_WITH_NEW_INFO'].includes(i.attributes.appStoreState || i.attributes.state)) || infos[0];

await step('category Games: Racing, Family', () => patch(`/v1/appInfos/${info.id}`, { data: { type: 'appInfos', id: info.id, relationships: {
  primaryCategory: { data: { type: 'appCategories', id: 'GAMES' } },
  primarySubcategoryOne: { data: { type: 'appCategories', id: 'GAMES_RACING' } },
  primarySubcategoryTwo: { data: { type: 'appCategories', id: 'GAMES_FAMILY' } },
} } }));

await step('content rights', () => patch(`/v1/apps/${app.id}`, { data: { type: 'apps', id: app.id, attributes: { contentRightsDeclaration: 'DOES_NOT_USE_THIRD_PARTY_CONTENT' } } }));

const infoLocs = (await get(`/v1/appInfos/${info.id}/appInfoLocalizations`)).data;
for (const [locale, dir] of Object.entries(LOCALES)) {
  const attributes = { name: read(dir, 'name'), subtitle: read(dir, 'subtitle'), privacyPolicyUrl: URLS.privacy };
  const have = infoLocs.find((l) => l.attributes.locale === locale);
  await step('name and subtitle ' + locale, () => have
    ? patch(`/v1/appInfoLocalizations/${have.id}`, { data: { type: 'appInfoLocalizations', id: have.id, attributes } })
    : post('/v1/appInfoLocalizations', { data: { type: 'appInfoLocalizations', attributes: { locale, ...attributes }, relationships: { appInfo: { data: { type: 'appInfos', id: info.id } } } } }));
}

await step('age rating 4+', async () => {
  const decl = (await get(`/v1/appInfos/${info.id}/ageRatingDeclaration`)).data;
  const attributes = {};
  for (const [k, v] of Object.entries(decl.attributes)) {
    if (typeof v === 'boolean' || /^(gambling|unrestrictedWebAccess|lootBox|messagingAndChat|userGeneratedContent|advertising|parentalControls|ageAssurance|healthOrWellnessTopics|seventeenPlus)$/.test(k)) attributes[k] = false;
    else if (k === 'kidsAgeBand' || k === 'ageRatingOverride' || k === 'ageRatingOverrideV2' || k === 'koreaAgeRatingOverride' || k === 'developerAgeRatingInfoUrl') continue;
    else attributes[k] = 'NONE';
  }
  console.log('     age rating fields:', Object.keys(attributes).join(', '));
  await patch(`/v1/ageRatingDeclarations/${decl.id}`, { data: { type: 'ageRatingDeclarations', id: decl.id, attributes } });
});

// ---------- the version: number, copyright, build, store text, screenshots ----------
const versions = (await get(`/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=20`)).data;
let ver = versions.find((v) => ['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED'].includes(v.attributes.appStoreState));
if (!ver) ver = (await post('/v1/appStoreVersions', { data: { type: 'appStoreVersions', attributes: { platform: 'IOS', versionString: VERSION }, relationships: { app: { data: { type: 'apps', id: app.id } } } } })).data;
console.log('version', ver.attributes.versionString, ver.attributes.appStoreState);
const firstVersion = versions.every((v) => v.id === ver.id);

await step('version ' + VERSION + ' and copyright', () => patch(`/v1/appStoreVersions/${ver.id}`, { data: { type: 'appStoreVersions', id: ver.id, attributes: { versionString: VERSION, copyright: '2026 njarrar', releaseType: 'AFTER_APPROVAL' } } }));

await step('build ' + BUILD, async () => {
  const builds = (await get(`/v1/builds?filter[app]=${app.id}&filter[version]=${BUILD}&filter[preReleaseVersion.platform]=IOS`)).data;
  if (!builds.length) throw new Error('build ' + BUILD + ' not found yet');
  const b = builds[0];
  console.log('     build state', b.attributes.processingState);
  if (b.attributes.usesNonExemptEncryption == null) await patch(`/v1/builds/${b.id}`, { data: { type: 'builds', id: b.id, attributes: { usesNonExemptEncryption: false } } }).catch(() => {});
  await patch(`/v1/appStoreVersions/${ver.id}/relationships/build`, { data: { type: 'builds', id: b.id } });
});

let verLocs = (await get(`/v1/appStoreVersions/${ver.id}/appStoreVersionLocalizations`)).data;
for (const [locale, dir] of Object.entries(LOCALES)) {
  const attributes = { description: read(dir, 'description'), keywords: read(dir, 'keywords'), promotionalText: read(dir, 'promotional-text'), supportUrl: URLS.support, marketingUrl: URLS.marketing };
  if (!firstVersion) attributes.whatsNew = read(dir, 'release-notes');
  const have = verLocs.find((l) => l.attributes.locale === locale);
  await step('store text ' + locale, async () => {
    if (have) await patch(`/v1/appStoreVersionLocalizations/${have.id}`, { data: { type: 'appStoreVersionLocalizations', id: have.id, attributes } });
    else await post('/v1/appStoreVersionLocalizations', { data: { type: 'appStoreVersionLocalizations', attributes: { locale, ...attributes }, relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: ver.id } } } } });
  });
}
verLocs = (await get(`/v1/appStoreVersions/${ver.id}/appStoreVersionLocalizations`)).data;

async function uploadShot(setId, file) {
  const data = fs.readFileSync(file);
  const shot = (await post('/v1/appScreenshots', { data: { type: 'appScreenshots', attributes: { fileName: path.basename(file), fileSize: data.length }, relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: setId } } } } })).data;
  for (const op of shot.attributes.uploadOperations) {
    const headers = Object.fromEntries((op.requestHeaders || []).map((h) => [h.name, h.value]));
    const res = await fetch(op.url, { method: op.method, headers, body: data.subarray(op.offset, op.offset + op.length) });
    if (!res.ok) throw new Error('upload part ' + res.status);
  }
  const md5 = crypto.createHash('md5').update(data).digest('hex');
  await patch(`/v1/appScreenshots/${shot.id}`, { data: { type: 'appScreenshots', id: shot.id, attributes: { uploaded: true, sourceFileChecksum: md5 } } });
}

for (const loc of verLocs.filter((l) => LOCALES[l.attributes.locale])) {
  const sets = (await get(`/v1/appStoreVersionLocalizations/${loc.id}/appScreenshotSets`)).data;
  for (const [type, folder] of Object.entries(SHOT_SETS)) {
    await step(`screenshots ${loc.attributes.locale} ${folder}`, async () => {
      let set = sets.find((s) => s.attributes.screenshotDisplayType === type);
      if (!set) set = (await post('/v1/appScreenshotSets', { data: { type: 'appScreenshotSets', attributes: { screenshotDisplayType: type }, relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: loc.id } } } } })).data;
      for (const old of (await get(`/v1/appScreenshotSets/${set.id}/appScreenshots`)).data) await del(`/v1/appScreenshots/${old.id}`);
      const shotDir = path.join(DIR, 'screenshots', folder);
      for (const f of fs.readdirSync(shotDir).filter((f) => f.endsWith('.png')).sort()) await uploadShot(set.id, path.join(shotDir, f));
    });
  }
}

// ---------- review details, price, countries ----------
await step('review notes and contact', async () => {
  const attributes = { notes: REVIEW_NOTES, demoAccountRequired: false, contactEmail: env.REVIEW_EMAIL || 'njarrar@gmail.com' };
  if (env.REVIEW_FIRST) attributes.contactFirstName = env.REVIEW_FIRST;
  if (env.REVIEW_LAST) attributes.contactLastName = env.REVIEW_LAST;
  if (env.REVIEW_PHONE) attributes.contactPhone = env.REVIEW_PHONE;
  const have = await get(`/v1/appStoreVersions/${ver.id}/appStoreReviewDetail`).then((r) => r.data).catch(() => null);
  if (have) await patch(`/v1/appStoreReviewDetails/${have.id}`, { data: { type: 'appStoreReviewDetails', id: have.id, attributes } });
  else await post('/v1/appStoreReviewDetails', { data: { type: 'appStoreReviewDetails', attributes, relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: ver.id } } } } });
});

await step('price: free', async () => {
  const points = (await get(`/v1/apps/${app.id}/appPricePoints?filter[territory]=USA&limit=200`)).data;
  const free = points.find((p) => parseFloat(p.attributes.customerPrice) === 0);
  if (!free) throw new Error('no free price point');
  await post('/v1/appPriceSchedules', {
    data: { type: 'appPriceSchedules', relationships: { app: { data: { type: 'apps', id: app.id } }, baseTerritory: { data: { type: 'territories', id: 'USA' } }, manualPrices: { data: [{ type: 'appPrices', id: '${free}' }] } } },
    included: [{ type: 'appPrices', id: '${free}', attributes: { startDate: null }, relationships: { appPricePoint: { data: { type: 'appPricePoints', id: free.id } } } }],
  });
});

await step('available in every country', async () => {
  let terr = [], url = '/v1/territories?limit=200';
  while (url) { const r = await get(url); terr = terr.concat(r.data); url = r.links && r.links.next; }
  await post('/v2/appAvailabilities', {
    data: { type: 'appAvailabilities', attributes: { availableInNewTerritories: true }, relationships: { app: { data: { type: 'apps', id: app.id } }, territoryAvailabilities: { data: terr.map((t) => ({ type: 'territoryAvailabilities', id: '${' + t.id + '}' })) } } },
    included: terr.map((t) => ({ type: 'territoryAvailabilities', id: '${' + t.id + '}', attributes: { available: true }, relationships: { territory: { data: { type: 'territories', id: t.id } } } })),
  });
});

if (env.SUBMIT === '1') {
  await step('submit for review', async () => {
    const sub = (await post('/v1/reviewSubmissions', { data: { type: 'reviewSubmissions', attributes: { platform: 'IOS' }, relationships: { app: { data: { type: 'apps', id: app.id } } } } })).data;
    await post('/v1/reviewSubmissionItems', { data: { type: 'reviewSubmissionItems', relationships: { reviewSubmission: { data: { type: 'reviewSubmissions', id: sub.id } }, appStoreVersion: { data: { type: 'appStoreVersions', id: ver.id } } } } });
    await patch(`/v1/reviewSubmissions/${sub.id}`, { data: { type: 'reviewSubmissions', id: sub.id, attributes: { submitted: true } } });
  });
}

console.log(failed.length ? '\nNot done: ' + failed.join('; ') : '\nAll done');
if (failed.length) process.exitCode = 1;
