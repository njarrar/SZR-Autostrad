// Read-only: prints where the app stands on App Store Connect (versions and review submissions).
import crypto from 'node:crypto';
const env = process.env;
function token() {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'ES256', kid: env.ASC_KEY_ID, typ: 'JWT' });
  const body = b64({ iss: env.ASC_ISSUER_ID, iat: now, exp: now + 1100, aud: 'appstoreconnect-v1' });
  const key = env.ASC_KEY.includes('BEGIN') ? env.ASC_KEY : Buffer.from(env.ASC_KEY, 'base64').toString();
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return head + '.' + body + '.' + sig;
}
const get = async (u) => {
  const r = await fetch('https://api.appstoreconnect.apple.com' + u, { headers: { Authorization: 'Bearer ' + token() } });
  const t = await r.text();
  if (!r.ok) { console.log('GET', u, r.status, t.slice(0, 800)); return { data: [] }; }
  return JSON.parse(t);
};
const app = (await get('/v1/apps?filter[bundleId]=com.njarrar.autostrad')).data[0];
console.log('app', app.id, app.attributes.name);
const vers = (await get(`/v1/apps/${app.id}/appStoreVersions?limit=10`)).data;
for (const v of vers) console.log('version', v.attributes.versionString, v.attributes.appStoreState, v.attributes.appVersionState, 'created', v.attributes.createdDate);
const subs = (await get(`/v1/reviewSubmissions?filter[app]=${app.id}&limit=20&include=items`)).data;
for (const s of subs) {
  console.log('submission', s.id, s.attributes.state, 'submitted', s.attributes.submittedDate);
  const items = (await get(`/v1/reviewSubmissions/${s.id}/items?include=appStoreVersion`));
  for (const i of items.data) console.log('   item', i.attributes.state, i.relationships?.appStoreVersion?.data?.id || '');
}
for (const v of vers) console.log('version id', v.id, v.attributes.versionString);
const builds = (await get(`/v1/builds?filter[app]=${app.id}&sort=-uploadedDate&limit=5`)).data;
for (const b of builds) console.log('build', b.attributes.version, b.attributes.processingState, 'uploaded', b.attributes.uploadedDate, 'expired', b.attributes.expired);
