// Fills in the App Store page through the App Store Connect API: app info, age rating,
// store text in English and Arabic, screenshots, build, price, review notes.
// Runs from .github/workflows/app-store.yml. SHOTS=1 uploads the screenshots again, WAIT_BUILD=1 waits
// for Apple to finish processing the build, SUBMIT=1 sends the version for review.
// With --has-build it only says whether this version's build is already on App Store Connect.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const env = process.env;
const BUNDLE = 'com.njarrar.autostrad';
const VERSION = env.VERSION || fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '../build.mjs'), 'utf8').match(/const VERSION = '([\d.]+)'/)[1];
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
const findBuild = async () => (await get(`/v1/builds?filter[app]=${app.id}&filter[version]=${BUILD}&filter[preReleaseVersion.platform]=IOS`)).data[0];
if (process.argv.includes('--has-build')) {
  const b = await findBuild();
  console.log(b ? `build ${BUILD} is already on App Store Connect` : `build ${BUILD} is new`);
  if (env.GITHUB_OUTPUT) fs.appendFileSync(env.GITHUB_OUTPUT, `has=${b ? 1 : 0}\n`);
  process.exit(0);
}
console.log('app', app.id, app.attributes.name, 'version', VERSION, 'build', BUILD);

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
    if (typeof v === 'boolean' || /^(gambling|unrestrictedWebAccess|lootBox|messagingAndChat|userGeneratedContent|advertising|parentalControls|ageAssurance|healthOrWellnessTopics|seventeenPlus|socialMedia|socialMediaAgeRestricted)$/.test(k)) attributes[k] = false;
    else if (k === 'kidsAgeBand' || k === 'gracRatingClassificationNumber' || k === 'ageRatingOverride' || k === 'ageRatingOverrideV2' || k === 'koreaAgeRatingOverride' || k === 'developerAgeRatingInfoUrl') continue;
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
  let b = await findBuild();
  // a fresh upload takes Apple 5 to 30 minutes to process
  for (let i = 0; env.WAIT_BUILD === '1' && i < 60 && (!b || b.attributes.processingState === 'PROCESSING'); i++) {
    await new Promise((r) => setTimeout(r, 30000)); b = await findBuild();
  }
  if (!b) throw new Error('build ' + BUILD + ' not found yet');
  console.log('     build state', b.attributes.processingState);
  if (b.attributes.processingState !== 'VALID') throw new Error('build ' + BUILD + ' is ' + b.attributes.processingState);
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

for (const loc of verLocs.filter((l) => LOCALES[l.attributes.locale] && env.SHOTS === '1')) {
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
  attributes.contactFirstName = env.REVIEW_FIRST || 'Najeeb';
  attributes.contactLastName = env.REVIEW_LAST || 'Jarrar';
  if (env.REVIEW_PHONE) attributes.contactPhone = env.REVIEW_PHONE;
  const have = await get(`/v1/appStoreVersions/${ver.id}/appStoreReviewDetail`).then((r) => r.data).catch(() => null);
  if (have) await patch(`/v1/appStoreReviewDetails/${have.id}`, { data: { type: 'appStoreReviewDetails', id: have.id, attributes } });
  else await post('/v1/appStoreReviewDetails', { data: { type: 'appStoreReviewDetails', attributes, relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: ver.id } } } } });
});

await step('price: free', async () => {
  if ((await get(`/v1/apps/${app.id}/appPriceSchedule`).catch(() => ({}))).data) return;
  const points = (await get(`/v1/apps/${app.id}/appPricePoints?filter[territory]=USA&limit=200`)).data;
  const free = points.find((p) => parseFloat(p.attributes.customerPrice) === 0);
  if (!free) throw new Error('no free price point');
  await post('/v1/appPriceSchedules', {
    data: { type: 'appPriceSchedules', relationships: { app: { data: { type: 'apps', id: app.id } }, baseTerritory: { data: { type: 'territories', id: 'USA' } }, manualPrices: { data: [{ type: 'appPrices', id: '${free}' }] } } },
    included: [{ type: 'appPrices', id: '${free}', attributes: { startDate: null }, relationships: { appPricePoint: { data: { type: 'appPricePoints', id: free.id } } } }],
  });
});

await step('available in every country', async () => {
  if (await get(`/v1/apps/${app.id}/appAvailabilityV2`).then((r) => r.data).catch(() => null)) return;
  let terr = [], url = '/v1/territories?limit=200';
  while (url) { const r = await get(url); terr = terr.concat(r.data); url = r.links && r.links.next; }
  await post('/v2/appAvailabilities', {
    data: { type: 'appAvailabilities', attributes: { availableInNewTerritories: true }, relationships: { app: { data: { type: 'apps', id: app.id } }, territoryAvailabilities: { data: terr.map((t) => ({ type: 'territoryAvailabilities', id: '${' + t.id + '}' })) } } },
    included: terr.map((t) => ({ type: 'territoryAvailabilities', id: '${' + t.id + '}', attributes: { available: true }, relationships: { territory: { data: { type: 'territories', id: t.id } } } })),
  });
});

if (env.SUBMIT === '1') {
  await step('submit for review', async () => {
    // reuse a submission a failed run left open, so they don't pile up
    const open = (await get(`/v1/reviewSubmissions?filter[app]=${app.id}&filter[platform]=IOS&filter[state]=READY_FOR_REVIEW`)).data[0];
    const sub = open || (await post('/v1/reviewSubmissions', { data: { type: 'reviewSubmissions', attributes: { platform: 'IOS' }, relationships: { app: { data: { type: 'apps', id: app.id } } } } })).data;
    const items = (await get(`/v1/reviewSubmissions/${sub.id}/items?include=appStoreVersion`)).data;
    if (!items.some((i) => i.relationships.appStoreVersion?.data?.id === ver.id)) await post('/v1/reviewSubmissionItems', { data: { type: 'reviewSubmissionItems', relationships: { reviewSubmission: { data: { type: 'reviewSubmissions', id: sub.id } }, appStoreVersion: { data: { type: 'appStoreVersions', id: ver.id } } } } });
    await patch(`/v1/reviewSubmissions/${sub.id}`, { data: { type: 'reviewSubmissions', id: sub.id, attributes: { submitted: true } } });
  });
}

// ---------- read everything back ----------
await step('check', async () => {
  const show = (label, v) => console.log(`     ${v === undefined || v === null || v === '' ? 'EMPTY' : 'set  '} ${label}${v && String(v).length < 80 ? ': ' + v : ''}`);
  const inf = (await get(`/v1/appInfos/${info.id}?include=primaryCategory,primarySubcategoryOne,primarySubcategoryTwo`));
  show('category', inf.data.relationships.primaryCategory.data?.id);
  show('subcategories', [inf.data.relationships.primarySubcategoryOne.data?.id, inf.data.relationships.primarySubcategoryTwo.data?.id].filter(Boolean).join(', '));
  show('content rights', (await get(`/v1/apps/${app.id}`)).data.attributes.contentRightsDeclaration);
  for (const l of (await get(`/v1/appInfos/${info.id}/appInfoLocalizations`)).data) for (const k of ['name', 'subtitle', 'privacyPolicyUrl']) show(`${l.attributes.locale} ${k}`, l.attributes[k]);
  const v = (await get(`/v1/appStoreVersions/${ver.id}?include=build`));
  show('version', v.data.attributes.versionString); show('copyright', v.data.attributes.copyright); show('build', v.data.relationships.build.data && BUILD);
  for (const l of (await get(`/v1/appStoreVersions/${ver.id}/appStoreVersionLocalizations`)).data) {
    for (const k of ['description', 'keywords', 'promotionalText', 'supportUrl', 'marketingUrl']) show(`${l.attributes.locale} ${k}`, l.attributes[k]);
    for (const set of (await get(`/v1/appStoreVersionLocalizations/${l.id}/appScreenshotSets`)).data) show(`${l.attributes.locale} ${set.attributes.screenshotDisplayType} screenshots`, (await get(`/v1/appScreenshotSets/${set.id}/appScreenshots`)).data.length);
  }
  const rd = await get(`/v1/appStoreVersions/${ver.id}/appStoreReviewDetail`).then((r) => r.data).catch(() => null);
  for (const k of ['contactFirstName', 'contactLastName', 'contactPhone', 'contactEmail', 'notes']) show('review ' + k, rd && rd.attributes[k]);
  show('price schedule', (await get(`/v1/apps/${app.id}/appPriceSchedule`).catch(() => ({}))).data?.id);
  show('countries', await get(`/v1/apps/${app.id}/appAvailabilityV2`).then((r) => r.data.attributes.availableInNewTerritories).catch(() => null));
  console.log('     App Privacy ("Data Not Collected") has no API: set it once by hand');
});

console.log(failed.length ? '\nNot done: ' + failed.join('; ') : '\nAll done');
if (failed.length) process.exitCode = 1;
