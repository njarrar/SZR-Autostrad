/* Ring road driving game engine. City data comes from window.CITY. */
(function () {
'use strict';
const C = window.CITY;
const $ = (s) => document.querySelector(s);

// ---------- language ----------
// window.LANGS holds every lang/*.xml for this city: { code: { name, dir, s: { key: text } } }.
// Pick: ?lang= in the address, then the saved choice, then the browser language.
const LANGS = window.LANGS;
const LANG_KEY = 'szr:lang';
const LANG = (() => {
  let l = null;
  try { l = new URLSearchParams(location.search).get('lang'); } catch (e) { /* no query */ }
  if (!LANGS[l]) { try { l = localStorage.getItem(LANG_KEY); } catch (e) { l = null; } }
  if (!LANGS[l]) l = /^ar\b/i.test(navigator.language || '') ? 'ar' : Object.keys(LANGS).includes('en') ? 'en' : Object.keys(LANGS)[0];
  return l;
})();
const S = LANGS[LANG].s;
const strings = (prefix) => Object.fromEntries(Object.entries(S).filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k.slice(prefix.length), v]));
const T = strings('text.');
C.currency = T.currency;
C.tour = { tryIt: S['tour.tryIt'], nice: S['tour.nice'], steps: C.tour.map((st, i) => ({ ...st, title: S[`tour.${i}.title`], keys: S[`tour.${i}.keys`], touch: S[`tour.${i}.touch`], body: S[`tour.${i}.body`] })) };
C.cars.forEach((c, i) => Object.assign(c, { name: S[`car.${i}.name`], sub: S[`car.${i}.sub`], pros: S[`car.${i}.pros`], cons: S[`car.${i}.cons`] }));
// road signs stay bilingual like the real ones; menus and the HUD use the chosen language
const SIGN_AR = (LANGS.ar || LANGS[LANG]).s, SIGN_EN = (LANGS.en || LANGS[LANG]).s;
C.landmarks.forEach((lm, i) => Object.assign(lm, { name: S['place.' + i], ar: SIGN_AR['place.' + i], en: SIGN_EN['place.' + i] }));
function switchLang(code) {
  if (code === LANG) return;
  try { localStorage.setItem(LANG_KEY, code); } catch (e) { /* no storage */ }
  try { const u = new URL(location.href); u.searchParams.set('lang', code); location.replace(u.href); } catch (e) { location.reload(); }
}
function applyLanguage() {
  const L = LANGS[LANG];
  document.documentElement.lang = LANG; document.documentElement.dir = L.dir;
  document.title = S['page.title'];
  $('#gl').setAttribute('aria-label', S['page.alt']);
  document.querySelectorAll('[data-t]').forEach((el) => { if (el.dataset.t in S) el.innerHTML = S[el.dataset.t]; });
  document.querySelectorAll('[data-t-aria]').forEach((el) => { if (el.dataset.tAria in S) el.setAttribute('aria-label', S[el.dataset.tAria]); });
  const codes = Object.keys(LANGS), next = codes[(codes.indexOf(LANG) + 1) % codes.length];
  document.querySelectorAll('[data-lang-switch]').forEach((b) => {
    b.textContent = LANGS[next].name; b.lang = next; b.setAttribute('aria-label', S['page.T_LANG'] + ': ' + LANGS[next].name);
    b.onclick = () => switchLang(next);
  });
  // keep the language when jumping to the other city on the same site
  document.querySelectorAll('a[data-local]').forEach((a) => { a.href = a.getAttribute('href').split('?')[0] + '?lang=' + LANG; });
}
applyLanguage();

// ---------- helpers ----------
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rand = mulberry32(C.seed || 7);
const R = (a, b) => a + (b - a) * rand();
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const mr = (a, b) => a + (b - a) * Math.random();
const mpick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const store = {
  get(k, d) { try { const v = localStorage.getItem(C.id + ':' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(C.id + ':' + k, JSON.stringify(v)); } catch (e) { /* no storage */ } }
};
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const fmtTime = (s) => { s = Math.max(0, s); const m = Math.floor(s / 60); const r = Math.floor(s % 60); return m + ':' + String(r).padStart(2, '0'); };

// ---------- geography ----------
const lat0 = C.origin[0], lon0 = C.origin[1];
const COSL = Math.cos(lat0 * Math.PI / 180);
function geo(lat, lon) { return [(lon - lon0) * COSL * 111320, -(lat - lat0) * 110574]; }

// ---------- road dims ----------
const LW = 3.6, SH = 1.6, MED = 1.4, LANES = C.lanes;
const CW = SH * 2 + LANES * LW;
const HW = MED + CW;
const laneD = (i) => MED + SH + LW * (i + 0.5);
const D_MIN = MED + 1.0, D_MAX = MED + CW - 1.0;

// ---------- track ----------
const ctrl = C.route.map((p) => { const g = geo(p[0], p[1]); return new THREE.Vector3(g[0], 0, g[1]); });
const curve = new THREE.CatmullRomCurve3(ctrl, true, 'centripetal', 0.5);
curve.arcLengthDivisions = 8000;
const L = curve.getLength();
const N = Math.ceil(L / 4);
const ds = L / N;
const PX = new Float32Array(N + 1), PZ = new Float32Array(N + 1), PY = new Float32Array(N + 1);
const TX = new Float32Array(N + 1), TZ = new Float32Array(N + 1), K = new Float32Array(N + 1);
{
  const p = new THREE.Vector3(), t = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const u = i / N;
    curve.getPointAt(u, p); curve.getTangentAt(u, t);
    const l = Math.hypot(t.x, t.z) || 1;
    PX[i] = p.x; PZ[i] = p.z; TX[i] = t.x / l; TZ[i] = t.z / l;
  }
  PX[N] = PX[0]; PZ[N] = PZ[0]; TX[N] = TX[0]; TZ[N] = TZ[0];
  for (let i = 0; i < N; i++) { const j = i + 1; K[i] = (TX[i] * TZ[j] - TZ[i] * TX[j]) / ds; }
  K[N] = K[0];
}

function terrainH(x, z) {
  if (!C.hills) return 0;
  return 34 * Math.sin(x / 900 + 1.3) * Math.cos(z / 760 - 0.4) + 20 * Math.sin((x + z) / 430) +
    11 * Math.cos((x - z * 0.7) / 260 + 2) + 7 * Math.sin(x / 170) * Math.sin(z / 190);
}
{
  for (let i = 0; i < N; i++) PY[i] = terrainH(PX[i], PZ[i]);
  const tmp = new Float32Array(N);
  for (let pass = 0; pass < 3; pass++) {
    const r = 30;
    for (let i = 0; i < N; i++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) sum += PY[(i + k + N) % N];
      tmp[i] = sum / (2 * r + 1);
    }
    PY.set(tmp);
  }
  for (let i = 0; i < N; i++) PY[i] += C.hills ? 0.4 : 0.05;
  PY[N] = PY[0];
}

// spatial hash of road samples
const CELL = 120;
const grid = new Map();
for (let i = 0; i < N; i++) {
  const key = Math.floor(PX[i] / CELL) + ',' + Math.floor(PZ[i] / CELL);
  let a = grid.get(key); if (!a) { a = []; grid.set(key, a); } a.push(i);
}
function nearestRoad(x, z) {
  const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
  let best = 1e9, bi = -1;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
    const arr = grid.get((cx + a) + ',' + (cz + b)); if (!arr) continue;
    for (const i of arr) { const dx = PX[i] - x, dz = PZ[i] - z; const d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
  }
  return { d: Math.sqrt(best), i: bi };
}

// position on curve: s along curve, lat along curve-right normal
function curveAt(s, lat, o) {
  s = ((s % L) + L) % L;
  const f = s / ds; const i = Math.min(N - 1, Math.floor(f)); const a = f - i; const j = i + 1;
  const x = PX[i] + (PX[j] - PX[i]) * a, z = PZ[i] + (PZ[j] - PZ[i]) * a, y = PY[i] + (PY[j] - PY[i]) * a;
  let tx = TX[i] + (TX[j] - TX[i]) * a, tz = TZ[i] + (TZ[j] - TZ[i]) * a; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
  o.x = x - tz * lat; o.z = z + tx * lat; o.y = y; o.tx = tx; o.tz = tz; o.k = K[i]; o.s = s;
  return o;
}
let DIR = 1;
// travel coords: t along travel direction, d to the travel-right
function trackAt(t, d, o) {
  curveAt(DIR > 0 ? t : -t, DIR * d, o);
  o.fx = DIR * o.tx; o.fz = DIR * o.tz; o.k *= DIR;
  return o;
}
const sOfT = (t) => (((DIR > 0 ? t : -t) % L) + L) % L;
const tOfS = (s) => DIR > 0 ? s : -s;
// distance ahead (travel) from player curve pos sp to object curve pos so
const aheadDist = (sp, so) => (((DIR * (so - sp)) % L) + L) % L;
const yawOf = (fx, fz) => Math.atan2(-fx, -fz);

function nearestS(x, z) {
  let best = 1e18, bi = 0;
  for (let i = 0; i < N; i++) { const dx = PX[i] - x, dz = PZ[i] - z; const d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
  const side = Math.sign(-TZ[bi] * (x - PX[bi]) + TX[bi] * (z - PZ[bi])) || 1;
  return { s: bi * ds, dist: Math.sqrt(best), side, i: bi };
}

// control point s and zone per sample
const ctrlS = ctrl.map((v) => nearestS(v.x, v.z).s);
const zoneAt = new Array(N);
{
  for (let i = 0; i < N; i++) {
    const s = i * ds; let zi = 0, bestBack = 1e18;
    for (let c = 0; c < ctrlS.length; c++) { const back = ((s - ctrlS[c]) % L + L) % L; if (back < bestBack) { bestBack = back; zi = c; } }
    zoneAt[i] = C.route[zi][2] || C.defaultZone;
  }
}

// landmarks
const LMS = C.landmarks.map((lm) => {
  const g = geo(lm.lat, lm.lon); const ns = nearestS(g[0], g[1]);
  return Object.assign({}, lm, { x: g[0], z: g[1], s: ns.s, dist: ns.dist, side: ns.side });
});

// ---------- three setup ----------
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = C.look.exposure || 1;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, 1, 0.5, 40000);
scene.fog = new THREE.Fog(C.look.fog, C.look.fogNear, C.look.fogFar);
scene.background = new THREE.Color(C.look.fog);

const hemi = new THREE.HemisphereLight(C.look.skyLight, C.look.groundLight, C.look.hemi);
scene.add(hemi);
const sun = new THREE.DirectionalLight(C.look.sunColor, C.look.sun);
sun.position.set(C.look.sunDir[0], C.look.sunDir[1], C.look.sunDir[2]);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 10, far: 900 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6;
scene.add(sun); scene.add(sun.target);
const SUN_DIR = new THREE.Vector3().fromArray(C.look.sunDir).normalize(); // changes with the time of day
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// quality: high = real shadows and sharper pixels, low = faster on phones
// auto: when frames run slow for a few seconds, draw fewer pixels, then drop the shadows
const autoQ = { step: 0, slow: 0, all: 0, t: 0, told: false };
const AUTO_SCALE = [1, 0.85, 0.72, 0.6];
function applyQuality() {
  const hi = settings.quality === 'high';
  if (!settings.autoQ) autoQ.step = 0;
  renderer.shadowMap.enabled = hi && autoQ.step < AUTO_SCALE.length;
  renderer.setPixelRatio(Math.max(0.5, Math.min(window.devicePixelRatio || 1, hi ? 1.75 : 1) * AUTO_SCALE[Math.min(autoQ.step, AUTO_SCALE.length - 1)]));
  scene.traverse((o) => { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.needsUpdate = true; }); } });
  if (typeof resize === 'function') resize();
}

// sky dome
{
  const g = new THREE.SphereGeometry(30000, 32, 16);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(C.look.skyTop) }, hor: { value: new THREE.Color(C.look.fog) }, glow: { value: new THREE.Color(C.look.sunGlow) }, sdir: { value: new THREE.Vector3().fromArray(C.look.sunDir).normalize() }, clouds: { value: C.look.clouds || 0 }, cloudCol: { value: new THREE.Color(C.look.cloudColor || '#ffffff') }, stars: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 glow; uniform vec3 sdir; uniform float clouds; uniform vec3 cloudCol; uniform float stars; varying vec3 vP;
      float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h2(i), h2(i+vec2(1,0)), f.x), mix(h2(i+vec2(0,1)), h2(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * n2(p); p *= 2.03; a *= 0.5; } return v; }
      void main(){
        float h = clamp(vP.y, 0.0, 1.0);
        vec3 c = mix(hor, top, pow(h, 0.55));
        float sd = max(dot(vP, sdir), 0.0);
        c += glow * pow(sd, 24.0) * 0.9 + glow * pow(sd, 3.0) * 0.25 * (1.0 - h);
        c += glow * smoothstep(0.9993, 0.9997, sd) * 2.5;
        if (clouds > 0.0 && vP.y > 0.0) {
          vec2 uv = vP.xz / (vP.y + 0.12) * 1.6;
          float cl = smoothstep(0.52, 0.85, fbm(uv + vec2(3.0, 1.0))) * clouds * smoothstep(0.0, 0.18, vP.y);
          vec3 cc = mix(cloudCol, glow, pow(sd, 6.0) * 0.6);
          c = mix(c, cc, cl);
        }
        if (stars > 0.0 && vP.y > 0.02) { vec2 sp = floor(vP.xz / (vP.y + 0.35) * 260.0); float st = step(0.9975, h2(sp)) * (0.5 + 0.5 * h2(sp + 3.1)); c += vec3(st) * stars * smoothstep(0.02, 0.25, vP.y) * (1.0 - clouds * 0.8); }
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`
  });
  const sky = new THREE.Mesh(g, m); sky.renderOrder = -1; scene.add(sky);
  scene.userData.sky = sky;
}

// shared by every building, so the time of day can light the windows and tint the glass
const ATM_U = { top: { value: new THREE.Color(C.look.skyTop) }, hor: { value: new THREE.Color(C.look.fog) }, night: { value: C.look.night } };
// window shader for buildings
function windowMaterial(opts, curtain) {
  const m = new THREE.MeshLambertMaterial({ color: 0xffffff });
  m.defines = {}; if (curtain) m.defines.CURTAIN = 1; if (C.stone) m.defines.STONE = 1;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTop = ATM_U.top;
    sh.uniforms.uHor = ATM_U.hor;
    sh.uniforms.uNight = ATM_U.night;
    sh.uniforms.uLit = { value: new THREE.Color(C.look.winLit) };
    sh.uniforms.uGlass = { value: new THREE.Color(C.look.winGlass) };
    sh.uniforms.uWin = { value: new THREE.Vector3(opts.floor, opts.bay, opts.size) };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 wp4 = vec4(transformed,1.0); vec3 wn3 = normal;
        #ifdef USE_INSTANCING
          wp4 = instanceMatrix * wp4; wn3 = mat3(instanceMatrix) * wn3;
        #endif
        wp4 = modelMatrix * wp4; vWP = wp4.xyz; vWN = normalize(mat3(modelMatrix) * wn3);`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vWP; varying vec3 vWN; uniform float uNight; uniform vec3 uLit; uniform vec3 uGlass; uniform vec3 uWin; uniform vec3 uTop; uniform vec3 uHor;
        float hsh(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        // facade detail: frames, sills, floor slabs, glass that catches the sky, shutters and AC units on homes
        vec3 an = abs(vWN); float uu = an.x > 0.5 ? vWP.z : vWP.x;
        float vert = step(an.y, 0.5);
        float fy = fract(vWP.y / uWin.x); float fx = fract(uu / uWin.y); float hw = uWin.z * 0.5;
        float win = step(0.5 - hw, fx) * step(fx, 0.5 + hw) * step(0.3, fy) * step(fy, 0.82) * vert;
        float frame = step(0.5 - hw - 0.035, fx) * step(fx, 0.5 + hw + 0.035) * step(0.26, fy) * step(fy, 0.86) * vert * (1.0 - win);
        float sill = step(0.5 - hw - 0.06, fx) * step(fx, 0.5 + hw + 0.06) * step(0.2, fy) * step(fy, 0.26) * vert;
        float slab = step(fy, 0.045) * vert;
        vec3 cell = floor(vec3(uu / uWin.y, vWP.y / uWin.x, dot(floor(vWP.xz / 40.0), vec2(1.0, 7.0))));
        float rr = hsh(cell), r2 = hsh(cell + 3.1), r3 = hsh(cell + 5.7);
        float homey = step(diffuseColor.b + 0.02, diffuseColor.r);
        vec3 base = diffuseColor.rgb * (0.93 + 0.1 * hsh(vec3(cell.x, 0.0, cell.z)));
        base *= 1.0 - 0.16 * slab;
        base = mix(base, base * 1.1 + 0.04, frame);
        base = mix(base, base * 1.15 + 0.06, sill);
        vec3 glass = uGlass * (0.62 + 0.45 * rr) + vec3(0.09, 0.12, 0.16) * smoothstep(0.3, 0.82, fy);
        float shut = step(0.74, r2) * win * homey;
        vec3 shutC = mix(vec3(0.84, 0.82, 0.76), vec3(0.56, 0.43, 0.3), step(0.5, r3)) * (0.86 + 0.14 * step(0.5, fract(fy * 16.0)));
        base = mix(base, glass, win * (1.0 - shut) * 0.92);
        base = mix(base, shutC, shut);
        float ac = step(0.8, r3) * homey * vert * step(0.5 + hw - 0.22, fx) * step(fx, 0.5 + hw + 0.02) * step(0.06, fy) * step(fy, 0.19);
        base = mix(base, vec3(0.88, 0.88, 0.86) * (0.8 + 0.2 * step(0.12, fy)), ac);
        // cut limestone: courses and staggered joints, faded out with distance so it never shimmers
        #ifdef STONE
        float near = 1.0 - smoothstep(30.0, 110.0, length(vViewPosition));
        float crs = vWP.y / 0.5; float row = floor(crs);
        float blk = fract((uu + 0.45 * mod(row, 2.0)) / 0.9);
        float joint = max(step(fract(crs), 0.06), step(blk, 0.035)) * vert * (1.0 - win) * (1.0 - frame);
        float tone = hsh(vec3(floor((uu + 0.45 * mod(row, 2.0)) / 0.9), row, 1.0));
        base *= 1.0 - homey * near * (0.12 * joint + 0.07 * (tone - 0.5));
        #endif
        float extraLit = 0.0;
        #ifdef CURTAIN
          // glass curtain wall: thin mullions, dark floor bands, and the sky mirrored in it
          vec3 V = normalize(cameraPosition - vWP); vec3 Nw = normalize(vWN);
          vec3 Rf = reflect(-V, Nw);
          vec3 skyR = mix(uHor, uTop, 0.75 * smoothstep(-0.05, 0.9, Rf.y)) * (Rf.y < -0.05 ? 0.6 : 1.0);
          float fres = 0.3 + 0.7 * pow(1.0 - max(dot(Nw, V), 0.0), 3.0);
          float mull = step(0.965, fract(uu / 3.0)) * vert;
          float band = step(fract(vWP.y / uWin.x), 0.07) * vert;
          float pane = hsh(vec3(floor(uu / 3.0), floor(vWP.y / uWin.x), cell.z + 9.0));
          float flr = floor(vWP.y / uWin.x);
          float panel = hsh(vec3(flr, cell.z, floor(uu / 40.0)));
          float nearC = 1.0 - smoothstep(120.0, 700.0, length(vViewPosition));
          band *= nearC; mull *= nearC;
          base = diffuseColor.rgb * 0.42;
          base = mix(base, base * 0.8, band);
          base = mix(base, diffuseColor.rgb * 0.7, mull * 0.25);
          extraLit = 1.0;
          float roofT = 1.0 - vert;
          base = mix(base, diffuseColor.rgb * 0.8, roofT);
          vec3 refl = mix(skyR, diffuseColor.rgb * 1.1, 0.5) * fres * (1.0 - mull * 0.3) * (1.0 - band * 0.3) * vert * (0.86 + 0.28 * pane * nearC + 0.14 * (1.0 - nearC));
        #endif
        diffuseColor.rgb = base;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        #ifdef CURTAIN
          totalEmissiveRadiance += refl * 0.8 + step(0.86, panel) * uNight * uLit * 0.18 * vert * (1.0 - band);
        #else
          totalEmissiveRadiance += win * (1.0 - shut) * step(0.42, rr) * uNight * uLit * (0.6 + 0.6*hsh(cell+1.7));
        #endif`);
  };
  return m;
}

// ---------- canvas textures ----------
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
const FONT_AR = "'Lalezar', 'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, sans-serif";
const FONT_BODY = "'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, sans-serif";

// ---------- road ----------
function buildRoad() {
  // one tile covers both carriageways across and 32 m along the road
  const roadTex = canvasTex(1024, 1024, (g, w, h) => {
    const px = (d) => w / 2 + (d / HW) * (w / 2), PM = h / 32;
    g.fillStyle = C.look.asphalt; g.fillRect(0, 0, w, h);
    // big soft patches so it never looks like a flat color
    for (let i = 0; i < 160; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 20 + Math.random() * 90, dark = Math.random() < 0.55;
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, dark ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.05)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; for (const dy of [-h, 0, h]) g.fillRect(x - r, y - r + dy, r * 2, r * 2);
    }
    // grain
    for (let i = 0; i < 70000; i++) { const v = Math.random() < 0.5 ? 0 : 255; g.fillStyle = `rgba(${v},${v},${v},${0.04 + Math.random() * 0.07})`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5); }
    // worn tyre tracks in every lane, plus an oily streak down the middle
    for (const sgn of [-1, 1]) for (let i = 0; i < LANES; i++) {
      const c = sgn * (MED + SH + LW * (i + 0.5));
      for (const off of [-0.85, 0.85]) { const x = px(c + off * sgn); const gr = g.createLinearGradient(x - 14, 0, x + 14, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.13)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 14, 0, 28, h); }
      const x = px(c); const gr = g.createLinearGradient(x - 10, 0, x + 10, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(20,16,10,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 10, 0, 20, h);
    }
    // a few repair patches and cracks
    for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.06})`; g.fillRect(Math.random() * w, Math.random() * h, 30 + Math.random() * 90, 20 + Math.random() * 70); }
    g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 1.2;
    for (let i = 0; i < 18; i++) { let x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (Math.random() - 0.5) * 30; y += 6 + Math.random() * 18; g.lineTo(x, y); } g.stroke(); }
    // median strip
    g.fillStyle = C.look.median; g.fillRect(px(-MED), 0, px(MED) - px(-MED), h);
    // paint: solid edge lines, long lane dashes, slightly worn
    const paint = (col, x, y, wd, ht) => { g.fillStyle = col; g.fillRect(x, y, wd, ht); g.fillStyle = 'rgba(0,0,0,0.12)'; for (let k = 0; k < ht / 6; k++) g.fillRect(x + Math.random() * wd, y + Math.random() * ht, 2, 2); };
    for (const sgn of [-1, 1]) {
      paint(C.look.lineEdge, Math.min(px(sgn * (MED + 0.35)), px(sgn * (MED + 0.53))), 0, 0.18 / HW * (w / 2), h);
      paint(C.look.lineEdge, Math.min(px(sgn * (MED + CW - 0.35)), px(sgn * (MED + CW - 0.53))), 0, 0.18 / HW * (w / 2), h);
    }
    for (const sgn of [-1, 1]) for (let i = 1; i < LANES; i++) {
      const x = px(sgn * (MED + SH + LW * i));
      for (let y = 0; y < h; y += 16 * PM) paint(C.look.lineLane, x - 3, y, 6, 5 * PM);
    }
  }, true);
  const pos = [], uv = [], idx = [];
  const o = {};
  for (let i = 0; i <= N; i++) {
    curveAt(i * ds, 0, o);
    for (const side of [-1, 1]) {
      const lat = side * (HW + 0.5);
      pos.push(o.x - o.tz * lat, o.y, o.z + o.tx * lat);
      uv.push(side < 0 ? 0 : 1, (i * ds) / 32);
    }
    if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  roadTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const m = new THREE.MeshLambertMaterial({ map: roadTex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const roadMesh = new THREE.Mesh(g, m); roadMesh.receiveShadow = true; scene.add(roadMesh);

  // concrete jersey barriers: [lat center, base width, height]; 4 m blocks with a joint between them
  const barTex = canvasTex(256, 256, (g, w, h) => {
    const c = new THREE.Color(C.look.barrier); g.fillStyle = '#' + c.getHexString(); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const v = Math.random() < 0.5 ? 0 : 255; g.fillStyle = `rgba(${v},${v},${v},${0.03 + Math.random() * 0.05})`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
    // road grime near the feet (u = 0 and 1 are the bottom edges of the profile)
    for (const [a, b] of [[0, 0.22], [1, 0.78]]) { const gr = g.createLinearGradient(a * w, 0, b * w, 0); gr.addColorStop(0, 'rgba(40,30,20,0.35)'); gr.addColorStop(1, 'rgba(40,30,20,0)'); g.fillStyle = gr; g.fillRect(Math.min(a, b) * w, 0, Math.abs(b - a) * w, h); }
    // lighter top cap and the joint
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(w * 0.44, 0, w * 0.12, h);
    g.fillStyle = 'rgba(0,0,0,0.38)'; g.fillRect(0, 0, w, 4); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 4, w, 2);
  }, true);
  const barMat = new THREE.MeshLambertMaterial({ map: barTex });
  for (const [lc, bw, hgt] of [[0, 0.62, 0.95], [-(HW + 0.3), 0.58, 0.9], [HW + 0.3, 0.58, 0.9]]) {
    const prof = [[-0.5, -0.3], [-0.5, 0.08], [-0.27, 0.33], [-0.14, hgt], [0.14, hgt], [0.27, 0.33], [0.5, 0.08], [0.5, -0.3]].map(([x, y]) => [x * bw, y]);
    const lens = [0]; for (let k = 1; k < prof.length; k++) lens.push(lens[k - 1] + Math.hypot(prof[k][0] - prof[k - 1][0], prof[k][1] - prof[k - 1][1]));
    const tot = lens[lens.length - 1], np = prof.length;
    const P = [], U = [], I = [];
    for (let i = 0; i <= N; i++) {
      curveAt(i * ds, 0, o);
      for (let k = 0; k < np; k++) { const l = lc + prof[k][0]; P.push(o.x - o.tz * l, o.y + prof[k][1], o.z + o.tx * l); U.push(lens[k] / tot, (i * ds) / 4); }
      if (i < N) for (let k = 0; k < np - 1; k++) { const a = i * np + k, b = a + np; I.push(a, b, a + 1, a + 1, b, b + 1); }
    }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); bg.setIndex(I); bg.computeVertexNormals();
    const wm = new THREE.Mesh(bg, barMat); wm.material.side = THREE.DoubleSide; wm.receiveShadow = true; wm.castShadow = true; scene.add(wm);
  }
}

// ---------- terrain ----------
let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
for (let i = 0; i < N; i++) { minX = Math.min(minX, PX[i]); maxX = Math.max(maxX, PX[i]); minZ = Math.min(minZ, PZ[i]); maxZ = Math.max(maxZ, PZ[i]); }
const coast = C.coast ? C.coast.map((p) => geo(p[0], p[1])) : null;
function seaDist(x, z) { // positive inland, negative at sea (sea on the left of the coast line)
  if (!coast) return 1e9;
  let best = 1e18, sgn = 1;
  for (let i = 0; i < coast.length - 1; i++) {
    const [ax, az] = coast[i], [bx, bz] = coast[i + 1];
    const vx = bx - ax, vz = bz - az; const t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz), 0, 1);
    const px = ax + vx * t, pz = az + vz * t; const d = (x - px) ** 2 + (z - pz) ** 2;
    if (d < best) { best = d; sgn = Math.sign(vx * (z - az) - vz * (x - ax)) || 1; }
  }
  return Math.sqrt(best) * sgn;
}
function groundH(x, z) {
  const nr = nearestRoad(x, z);
  let h = terrainH(x, z);
  const sd = seaDist(x, z);
  if (coast && sd < 0) h = Math.max(-6, sd * 0.08) ;
  if (nr.i >= 0) {
    const ry = PY[nr.i] - (C.hills ? 4 : 0.3);
    const b = smooth(HW + 20, HW + 160, nr.d);
    h = ry + (h - ry) * b;
    h = Math.min(h, ry + Math.max(0, nr.d - HW - 8) * 0.15);
  }
  // Amman's roads run along the valleys with the hills climbing away on both sides
  if (C.valley) h += C.valley * (nr.i >= 0 ? smooth(HW + 25, HW + 115, nr.d) : 1);
  return h;
}
function buildTerrain() {
  const pad = 2600;
  const w = maxX - minX + pad * 2, d = maxZ - minZ + pad * 2;
  const seg = Math.min(320, Math.ceil(Math.max(w, d) / 40));
  const g = new THREE.PlaneGeometry(w, d, seg, seg); g.rotateX(-Math.PI / 2);
  g.translate((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
  const p = g.attributes.position; const cols = new Float32Array(p.count * 3); const c = new THREE.Color();
  const cA = new THREE.Color(C.look.ground[0]), cB = new THREE.Color(C.look.ground[1]), cU = new THREE.Color(C.look.ground[2]), cS = new THREE.Color(C.look.sand || C.look.ground[1]);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const h = groundH(x, z); p.setY(i, h);
    const n = 0.5 + 0.5 * Math.sin(x / 210 + Math.cos(z / 170) * 2) * Math.cos(z / 260);
    c.copy(cA).lerp(cB, n);
    const nr = nearestRoad(x, z); if (nr.d < 400) c.lerp(cU, 0.55 * (1 - nr.d / 400));
    if (coast) { const sd = seaDist(x, z); if (sd < 160) c.lerp(cS, smooth(160, 20, sd)); }
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); g.computeVertexNormals();
  const ground = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })); ground.receiveShadow = true; scene.add(ground);
  if (coast) {
    const wg = new THREE.PlaneGeometry(w + 30000, d + 30000); wg.rotateX(-Math.PI / 2);
    const wm = new THREE.MeshPhongMaterial({ color: C.look.sea, shininess: 90, specular: 0x667788, transparent: true, opacity: 0.94 });
    const water = new THREE.Mesh(wg, wm); water.position.set((minX + maxX) / 2, -0.8, (minZ + maxZ) / 2); scene.add(water);
  }
}

// ---------- merged colored geometry ----------
function mergeParts(parts, grouped) {
  const pos = [], nor = [], col = [], groups = [];
  if (grouped) parts = parts.slice().sort((a, b) => (a.m || 0) - (b.m || 0));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  for (const p of parts) {
    let g = p.g.index ? p.g.toNonIndexed() : p.g.clone();
    e.set(p.rx || 0, p.ry || 0, p.rz || 0); q.setFromEuler(e);
    m.compose(new THREE.Vector3(p.x || 0, p.y || 0, p.z || 0), q, new THREE.Vector3(p.sx || 1, p.sy || 1, p.sz || 1));
    g.applyMatrix4(m);
    c.set(p.c);
    const pa = g.attributes.position, na = g.attributes.normal;
    if (grouped) { const last = groups[groups.length - 1], m = p.m || 0; if (last && last.m === m) last.n += pa.count; else groups.push({ m, s: pos.length / 3, n: pa.count }); }
    for (let i = 0; i < pa.count; i++) { pos.push(pa.getX(i), pa.getY(i), pa.getZ(i)); nor.push(na.getX(i), na.getY(i), na.getZ(i)); col.push(c.r, c.g, c.b); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  for (const gr of groups) g.addGroup(gr.s, gr.n, gr.m);
  g.computeBoundingSphere();
  return g;
}
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = (rt, rb, h, s) => new THREE.CylinderGeometry(rt, rb, h, s || 8);
const box = (c, x, y, z, sx, sy, sz, extra) => Object.assign({ g: BOX, c, x, y, z, sx, sy, sz }, extra || {});

// ---------- vehicles ----------
const GLASS = 0x18222c, TIRE = 0x141414, RIM = 0xc9cdd2, TAIL = 0xff2a1a, HEAD = 0xfff6dc, TRIM = 0x1c1f22, CHROME = 0xd8dce0;
const TIRE_G = CYL(1, 1, 0.26, 20), RIM_G = CYL(1, 1, 0.28, 20), HUB_G = CYL(1, 1, 0.3, 12);
function wheels(len, wid, r, out, axle) {
  for (const zx of [-1, 1]) for (const xx of [-1, 1]) {
    const z = zx * len * (axle || 0.31), x = xx * wid / 2;
    out.push({ g: TIRE_G, c: TIRE, x, y: r, z, rz: Math.PI / 2, sx: r, sy: 1, sz: r });
    out.push({ g: RIM_G, c: RIM, x: x + xx * 0.012, y: r, z, rz: Math.PI / 2, sx: r * 0.66, sy: 1, sz: r * 0.66 });
    out.push({ g: HUB_G, c: 0x2a2d31, x: x + xx * 0.018, y: r, z, rz: Math.PI / 2, sx: r * 0.5, sy: 1, sz: r * 0.5 });
    // five spokes over the dark dish
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * Math.PI * 2;
      out.push({ g: BOX, c: RIM, x: x + xx * 0.16, y: r + Math.sin(a) * r * 0.27, z: z + Math.cos(a) * r * 0.27, rx: -a, sx: 0.03, sy: r * 0.13, sz: r * 0.56 });
    }
    out.push({ g: HUB_G, c: CHROME, x: x + xx * 0.03, y: r, z, rz: Math.PI / 2, sx: r * 0.13, sy: 1, sz: r * 0.13 });
  }
}
// side profile (u along length, front at -len/2; v up) extruded across the width.
// a point is [u, v]; ['q', cu, cv, u, v] is a curve; ['arc', cu, cv, r, a0, a1] cuts a wheel arch
const profCache = new Map();
function profile(pts, width, bevel, seg) {
  const key = JSON.stringify(pts) + width + bevel + seg;
  if (profCache.has(key)) return profCache.get(key);
  const sh = new THREE.Shape();
  pts.forEach((p, i) => {
    if (p[0] === 'q') sh.quadraticCurveTo(p[1], p[2], p[3], p[4]);
    else if (p[0] === 'arc') sh.absarc(p[1], p[2], p[3], p[4], p[5], true);
    else if (i) sh.lineTo(p[0], p[1]); else sh.moveTo(p[0], p[1]);
  });
  const bv = bevel || 0;
  const g = new THREE.ExtrudeGeometry(sh, { depth: width - bv * 2, bevelEnabled: bv > 0, bevelThickness: bv, bevelSize: bv, bevelSegments: seg || 2, curveSegments: 6 });
  // (x, y, z) -> (-(z - w/2), y, x): length along z, width along x
  const m = new THREE.Matrix4().set(0, 0, -1, (width - bv * 2) / 2, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1);
  g.applyMatrix4(m); g.computeVertexNormals();
  profCache.set(key, g); return g;
}
// pull the sides in as they rise, so the body and glass curve in like a real car
function taper(g, y0, y1, k) {
  const t = g.clone(), p = t.attributes.position;
  for (let i = 0; i < p.count; i++) { const f = clamp((p.getY(i) - y0) / (y1 - y0), 0, 1); p.setX(i, p.getX(i) * (1 - k * f * f)); }
  t.computeVertexNormals(); return t;
}
const SHAPES = {
  sedan: { len: 4.6, wid: 1.82, y0: 0.3, bh: 0.72, hood: 1.25, trunk: 0.95, ws: 0.78, rs: 0.62, roof: 0.62, r: 0.33, nose: 0.2 },
  sports: { len: 4.5, wid: 1.96, y0: 0.2, bh: 0.56, hood: 1.45, trunk: 0.55, ws: 1.05, rs: 1.25, roof: 0.47, r: 0.34, nose: 0.3 },
  hatch: { len: 4.55, wid: 1.78, y0: 0.3, bh: 0.68, hood: 0.95, trunk: 0.22, ws: 1.0, rs: 1.3, roof: 0.64, r: 0.32, nose: 0.22 },
  suv: { len: 4.98, wid: 2.0, y0: 0.45, bh: 0.95, hood: 1.15, trunk: 0.18, ws: 0.6, rs: 0.22, roof: 0.82, r: 0.42, nose: 0.08 },
  pickup: { len: 5.3, wid: 1.88, y0: 0.45, bh: 0.82, hood: 1.3, trunk: 2.05, ws: 0.58, rs: 0.12, roof: 0.74, r: 0.4, nose: 0.1 }
};
function shapedCar(kind, body, roofCol, P) {
  const S = SHAPES[kind];
  const { len, wid, y0, bh, hood, trunk, ws, rs, roof, r, nose } = S;
  const f = -len / 2, b = len / 2, top = y0 + bh, axle = kind === 'pickup' ? 0.32 : 0.3;
  const lo = y0 + 0.06, ra = r + 0.07;
  const arch = (wz) => { const s = clamp((lo - r) / ra, -0.99, 0.99), a = Math.asin(s); return ['arc', wz, r, ra, Math.PI - a, a]; };
  const archX = (wz) => Math.sqrt(ra * ra - (lo - r) ** 2);
  const fw = -len * axle, rw = len * axle;
  const ge = b - trunk, gb = f + hood;
  const deck = Math.min(ge + 0.12, b - 0.3);
  const lower = [
    [f + 0.25, lo], [fw - archX(fw), lo], arch(fw), [rw - archX(rw), lo], arch(rw), [b - 0.22, lo],
    ['q', b + 0.02, lo, b, lo + 0.26], [b, top - 0.22],
    ['q', b + 0.01, top + 0.01, b - 0.28, top + 0.03], [deck, top + 0.06],
    [gb, top + 0.08],
    ['q', f + nose + 0.5, top + 0.06, f + 0.12, top - 0.1 - nose * 0.3],
    ['q', f - 0.04, top - 0.25 - nose * 0.3, f, lo + 0.28], ['q', f, lo, f + 0.25, lo]
  ];
  P.push({ g: taper(profile(lower, wid, 0.07, 3), top - 0.3, top + 0.1, 0.07), c: body });
  // dark underside so you never see through the arches
  P.push(box(0x0c0d0e, 0, y0 + 0.12, 0, wid - 0.42, 0.34, len - 0.6));
  const gy = top + 0.06, ry = top + roof;
  const green = [[gb, gy], [ge + 0.02, gy], ['q', ge - rs * 0.25, ry - 0.02, ge - rs, ry], ['q', (gb + ws + ge - rs) / 2, ry + 0.05, gb + ws, ry], ['q', gb + ws * 0.35, ry - 0.08, gb, gy]];
  const gw = wid * 0.9;
  P.push({ g: taper(profile(green, gw, 0.04, 2), gy, ry, 0.24), c: GLASS });
  // painted roof skin over the glass, plus thin black pillars
  const roofPts = [[gb + ws * 0.92, ry - 0.03], [ge - rs * 0.9, ry - 0.03], ['q', ge - rs * 0.95, ry + 0.02, ge - rs - 0.02, ry + 0.025], ['q', (gb + ws + ge - rs) / 2, ry + 0.075, gb + ws + 0.02, ry + 0.025], ['q', gb + ws * 0.88, ry + 0.02, gb + ws * 0.92, ry - 0.03]];
  P.push({ g: profile(roofPts, gw * 0.75, 0.03, 2), c: roofCol });
  const bz = (gb + ws + ge - rs) / 2;
  // bumpers, grille, lower intake, mirrors
  P.push(box(TRIM, 0, lo + 0.1, f + 0.08, wid * 0.86, 0.12, 0.12));
  P.push(box(TRIM, 0, lo + 0.08, b - 0.06, wid * 0.86, 0.14, 0.14));
  P.push(box(0x0e1012, 0, top - 0.3, f - 0.008, wid * 0.44, 0.14, 0.04));
  P.push(box(CHROME, 0, top - 0.22, f - 0.012, wid * 0.44, 0.025, 0.03));
  // rear: trunk shut line, plate recess, reflectors and a dark diffuser
  P.push(box(0x101214, 0, top - 0.15, b + 0.004, wid * 0.66, 0.018, 0.012));
  P.push(box(0x24272b, 0, y0 + 0.42, b + 0.004, wid * 0.32, 0.17, 0.012));
  for (const s of [-1, 1]) P.push(box(0x8a1010, s * wid * 0.38, lo + 0.12, b - 0.02, 0.16, 0.035, 0.012));
  // chrome strip under the windows, door lines and handles
  const sx = (wid / 2) * (1 - 0.07 * 0.36);
  for (const s of [-1, 1]) {
    P.push(box(CHROME, s * (sx - 0.005), top + 0.03, (gb + ge) / 2, 0.012, 0.022, ge - gb - 0.1));
    P.push(box(0x101214, s * (wid / 2 + 0.001), (lo + top) / 2 + 0.03, bz + 0.15, 0.012, bh * 0.66, 0.015));
    P.push(box(CHROME, s * (wid / 2 + 0.01), top - 0.13, bz + 0.45, 0.02, 0.035, 0.15));
    P.push(box(CHROME, s * (wid / 2 + 0.01), top - 0.13, bz - 0.4, 0.02, 0.035, 0.15));
    // side mirror on a short stalk
    P.push(box(TRIM, s * (wid / 2 + 0.04), top + 0.1, gb + 0.18, 0.1, 0.04, 0.08));
    P.push(box(body, s * (wid / 2 + 0.1), top + 0.14, gb + 0.18, 0.14, 0.11, 0.2));
  }
  wheels(len, wid - 0.06, r, P, axle);
  if (kind === 'pickup') {
    P.push(box(0x1e1e1e, 0, top + 0.03, b - trunk / 2 - 0.05, wid * 0.84, 0.04, trunk - 0.2));
    P.push(box(TRIM, 0, top + 0.45, ge - 0.05, wid * 0.8, 0.6, 0.06));
  }
  return S;
}
function carParts(kind, body, extra) {
  const P = [], Lp = [];
  const lights = (len, wid, y, w, round) => {
    for (const s of [-1, 1]) {
      Lp.push(box(TAIL, s * wid * 0.36, y, len / 2 + 0.02, w || wid * 0.24, 0.13, 0.04));
      Lp.push(box(0xff6a50, s * wid * 0.36, y + 0.055, len / 2 + 0.024, (w || wid * 0.24) * 0.9, 0.02, 0.03));
      Lp.push(box(0xffb15a, s * wid * 0.43, y - 0.045, len / 2 + 0.025, wid * 0.07, 0.05, 0.03));
      Lp.push(box(HEAD, s * wid * 0.35, y + (round ? 0 : 0.02), -len / 2 - 0.02, w || wid * 0.2, 0.08, 0.04));
      Lp.push(box(0xdff0ff, s * wid * 0.35, y - 0.05, -len / 2 - 0.024, (w || wid * 0.2) * 0.9, 0.018, 0.03));
    }
  };
  const shaped = { sedan: 'sedan', taxi: 'sedan', dtaxi: 'sedan', sports: 'sports', hatch: 'hatch', suv: 'suv', pickup: 'pickup' }[kind];
  if (shaped) {
    const S = shapedCar(shaped, body, kind === 'dtaxi' ? extra.roof : body, P);
    const top = S.y0 + S.bh, gb = -S.len / 2 + S.hood, ge = S.len / 2 - S.trunk;
    const roofZ = (gb + S.ws + ge - S.rs) / 2, ry = top + S.roof + 0.07;
    if (kind === 'taxi') { P.push(box(0xffffff, 0, ry + 0.12, roofZ, 0.72, 0.22, 0.3)); Lp.push(box(0xffe680, 0, ry + 0.12, roofZ - 0.16, 0.5, 0.1, 0.02)); }
    if (kind === 'dtaxi') { P.push(box(0xfff6c8, 0, ry + 0.1, roofZ, 0.7, 0.18, 0.3)); Lp.push(box(0xfff2a0, 0, ry + 0.1, roofZ - 0.16, 0.5, 0.09, 0.02)); }
    if (kind === 'sports') { P.push(box(0x111111, 0, top + 0.2, S.len / 2 - 0.14, S.wid * 0.9, 0.04, 0.26)); for (const s of [-1, 1]) P.push(box(0x111111, s * 0.6, top + 0.12, S.len / 2 - 0.16, 0.05, 0.14, 0.12)); }
    if (kind === 'suv') for (const s of [-1, 1]) P.push(box(0x2a2a2a, s * S.wid * 0.33, ry + 0.04, roofZ, 0.05, 0.06, 2.0));
    lights(S.len, S.wid, top - 0.16);
    return { parts: P, lightParts: Lp, len: S.len, wid: S.wid, tailY: top - 0.16 };
  }
  if (kind === 'coaster' || kind === 'bus') {
    const big = kind === 'bus';
    const len = big ? 11.5 : 7, wid = big ? 2.5 : 2.05, bh = big ? 2.6 : 2.0, y0 = 0.45;
    P.push({ g: profile([[-len / 2, y0], [len / 2, y0], [len / 2, y0 + bh - 0.2], ['q', len / 2, y0 + bh, len / 2 - 0.25, y0 + bh], [-len / 2 + 0.5, y0 + bh], ['q', -len / 2 + 0.05, y0 + bh, -len / 2, y0 + bh - 0.6]], wid, 0.08, 3), c: body });
    P.push(box(GLASS, 0, y0 + bh * 0.68, 0.2, wid + 0.02, bh * 0.32, len * 0.86));
    P.push(box(GLASS, 0, y0 + bh * 0.6, -len / 2 + 0.05, wid * 0.9, bh * 0.42, 0.06));
    P.push(box(extra.stripe, 0, y0 + bh * 0.32, 0, wid + 0.03, 0.22, len * 0.98));
    P.push(box(TRIM, 0, y0 + 0.12, 0, wid + 0.02, 0.2, len + 0.04));
    wheels(len * 1.15, wid - 0.1, 0.45, P); lights(len, wid, y0 + 0.5, 0.3);
    return { parts: P, lightParts: Lp, len, wid, tailY: y0 + 0.5 };
  }
  if (kind === 'truck') {
    const len = 8.5, wid = 2.45, y0 = 0.55;
    P.push({ g: profile([[-len / 2, y0], [-len / 2 + 2.3, y0], [-len / 2 + 2.3, y0 + 2.3], [-len / 2 + 0.6, y0 + 2.3], ['q', -len / 2 + 0.1, y0 + 2.2, -len / 2, y0 + 1.5]], wid, 0.06, 2), c: body });
    P.push(box(GLASS, 0, y0 + 1.75, -len / 2 + 0.28, wid * 0.85, 0.7, 0.5, { rx: -0.5 }));
    P.push(box(extra.cargo, 0, y0 + 1.6, 1.15, wid, 3.1, len - 2.45));
    P.push(box(TRIM, 0, y0 - 0.05, 0, wid * 0.7, 0.3, len - 0.4));
    wheels(len, wid - 0.1, 0.5, P); lights(len, wid, y0 + 0.5, 0.3);
    return { parts: P, lightParts: Lp, len, wid, tailY: y0 + 0.5 };
  }
  return carParts('sedan', body, extra);
}
// which finish each part gets: 0 paint, 1 glass, 2 rubber and plastic, 3 chrome
function finishOf(c, paints) {
  if (paints.includes(c)) return 0;
  if (c === GLASS) return 1;
  if (c === RIM || c === CHROME) return 3;
  const k = new THREE.Color(c); return k.r + k.g + k.b < 0.5 ? 2 : 0;
}
const geoCache = new Map();
function carGeo(kind, body, extra) {
  const key = kind + body + JSON.stringify(extra || {});
  if (!geoCache.has(key)) {
    const r = carParts(kind, body, extra || {}), paints = [body, (extra || {}).roof, (extra || {}).stripe, (extra || {}).cargo];
    for (const p of r.parts) p.m = finishOf(p.c, paints);
    geoCache.set(key, { g: mergeParts(r.parts, true), lg: mergeParts(r.lightParts), len: r.len, wid: r.wid, tailY: r.tailY });
  }
  return geoCache.get(key);
}
// a small sky picture the paint and glass reflect: sky, a sun, a row of buildings and the road
function makeEnv() {
  const tex = canvasTex(512, 256, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h / 2);
    sky.addColorStop(0, C.look.skyTop); sky.addColorStop(1, C.look.fog);
    g.fillStyle = sky; g.fillRect(0, 0, w, h / 2);
    const sd = SUN_DIR, u = (Math.atan2(sd.z, sd.x) / (Math.PI * 2) + 0.5) * w, v = (0.5 - Math.asin(sd.y) / Math.PI) * h;
    for (const du of [-w, 0, w]) { const gr = g.createRadialGradient(u + du, v, 0, u + du, v, 60); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.15, C.look.sunGlow); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(u + du - 60, v - 60, 120, 120); }
    let x = 0; while (x < w) { const bw = 4 + Math.random() * 18, bh = 3 + Math.random() * (C.hills ? 14 : 34); g.fillStyle = `rgba(${C.hills ? '120,110,95' : '60,70,85'},${0.35 + Math.random() * 0.3})`; g.fillRect(x, h / 2 - bh, bw, bh); x += bw + Math.random() * 6; }
    const gd = g.createLinearGradient(0, h / 2, 0, h); gd.addColorStop(0, '#6d6a66'); gd.addColorStop(0.25, '#3a3a3c'); gd.addColorStop(1, '#202022');
    g.fillStyle = gd; g.fillRect(0, h / 2, w, h / 2);
  });
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer); const env = pm.fromEquirectangular(tex).texture; pm.dispose(); tex.dispose();
  return env;
}
const ENV = makeEnv();
const carMat = [
  new THREE.MeshPhysicalMaterial({ vertexColors: true, metalness: 0.3, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.06, envMap: ENV, envMapIntensity: 1.1 }),
  new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.6, roughness: 0.06, envMap: ENV, envMapIntensity: 1.3 }),
  new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0, roughness: 0.8, envMap: ENV, envMapIntensity: 0.4 }),
  new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 1, roughness: 0.22, envMap: ENV, envMapIntensity: 1.2 })
];
const lightMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });

// blob shadows
const shadowTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
shadowTex.colorSpace = THREE.NoColorSpace;
const MAXS = 140;
const shadowGeo = new THREE.PlaneGeometry(1, 1); shadowGeo.rotateX(-Math.PI / 2);
const shadows = new THREE.InstancedMesh(shadowGeo, new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }), MAXS);
shadows.frustumCulled = false; scene.add(shadows);

// ---------- scenery ----------
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpV = new THREE.Vector3(), tmpS = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
function makeInstanced(geo, mat, list, colored) {
  const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
  const c = new THREE.Color();
  list.forEach((it, i) => {
    tmpQ.setFromAxisAngle(UP, it.yaw || 0);
    tmpM.compose(tmpV.set(it.x, it.y, it.z), tmpQ, tmpS.set(it.sx, it.sy, it.sz));
    im.setMatrixAt(i, tmpM);
    if (colored) im.setColorAt(i, c.set(it.c));
  });
  im.count = list.length;
  im.computeBoundingSphere(); im.frustumCulled = false; im.castShadow = true; im.receiveShadow = true;
  scene.add(im); return im;
}

const lmZones = LMS.map((l) => ({ x: l.x, z: l.z, r: l.clear || 90 }));
function blocked(x, z, r) {
  for (const zz of lmZones) { const dx = x - zz.x, dz = z - zz.z; if (dx * dx + dz * dz < (zz.r + r) ** 2) return true; }
  if (coast && seaDist(x, z) < 40 + r) return true;
  return false;
}

// lowest ground under a footprint, so a building on a slope steps down instead of floating
function baseH(x, z, w, d) {
  let m = groundH(x, z); const r = Math.max(w, d) * 0.6;
  for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) m = Math.min(m, groundH(x + a * r, z + b * r));
  return m - 1.5;
}
function buildScenery() {
  const bList = [], tanks = [], trees = [], palmT = [], palmC = [], crowns = [];
  const glassT = [], roundT = [], taperT = [], balc = [], solar = [], dishes = [], rebar = [];
  const o = {};
  // a point on a building in its own frame (x across the road, z along it)
  const local = (x, z, yaw, lx, lz) => [x + lx * Math.cos(yaw) + lz * Math.sin(yaw), z - lx * Math.sin(yaw) + lz * Math.cos(yaw)];
  // stacked balconies on the face that looks at the road
  function addBalconies(x, z, yaw, side, w, dp, g0, h, col) {
    const fl = C.look.windows.floor, floors = Math.floor(h / fl), yb = yaw + (side > 0 ? Math.PI : 0);
    const spots = dp > 14 ? [-dp * 0.27, dp * 0.27] : [R(-dp * 0.2, dp * 0.2)];
    const shape = rand() < 0.5;
    for (const lz of spots) for (let f = 1; f < Math.min(floors, 5); f++) {
      const [px, pz] = local(x, z, yaw, -side * w / 2, lz);
      balc.push({ x: px, y: g0 + f * fl - 0.12, z: pz, sx: 1, sy: 1, sz: shape ? 1 : 0.8, yaw: yb, c: col });
    }
  }
  // what sits on a flat Amman roof: black and white water tanks, solar heaters, dishes,
  // a stair room, and steel bars left for the next floor
  function roofStuff(x, z, yaw, w, dp, y, col, p) {
    const nT = rand() < p ? 1 + Math.floor(rand() * 3) : 0;
    for (let k = 0; k < nT; k++) { const [px, pz] = local(x, z, yaw, R(-w * 0.35, w * 0.35), R(-dp * 0.35, dp * 0.35)); tanks.push({ x: px, y, z: pz, sx: 1, sy: 1, sz: 1, yaw: 0, c: pick(C.look.tanks) }); }
    if (rand() < 0.55 * p) { const [px, pz] = local(x, z, yaw, R(-w * 0.3, w * 0.3), R(-dp * 0.3, dp * 0.3)); solar.push({ x: px, y, z: pz, sx: 1, sy: 1, sz: 1, yaw: R(-0.3, 0.3) }); }
    if (rand() < 0.35 * p) { const [px, pz] = local(x, z, yaw, R(-w * 0.4, w * 0.4), R(-dp * 0.4, dp * 0.4)); dishes.push({ x: px, y, z: pz, sx: 1, sy: 1, sz: 1, yaw: R(2.2, 3.4) }); }
    if (rand() < 0.4 * p) { const [px, pz] = local(x, z, yaw, R(-w * 0.2, w * 0.2), R(-dp * 0.2, dp * 0.2)); bList.push({ x: px, y: y - 0.2, z: pz, sx: 3.2, sy: 3, sz: 3.6, yaw, c: col }); }
    if (rand() < 0.22 * p) for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const [px, pz] = local(x, z, yaw, a * (w / 2 - 0.4), b * (dp / 2 - 0.4)); rebar.push({ x: px, y, z: pz, sx: 0.35, sy: R(1.2, 2.2), sz: 0.35, yaw }); }
  }
  const occ = new Map(); // occupancy grid to stop overlaps
  const occKey = (x, z) => Math.floor(x / 10) + ',' + Math.floor(z / 10);
  const free = (x, z, r) => { const n = Math.ceil(r / 10); const cx = Math.floor(x / 10), cz = Math.floor(z / 10); for (let a = -n; a <= n; a++) for (let b = -n; b <= n; b++) if (occ.has((cx + a) + ',' + (cz + b))) return false; return true; };
  const mark = (x, z, r) => { const n = Math.ceil(r / 10); const cx = Math.floor(x / 10), cz = Math.floor(z / 10); for (let a = -n + 1; a <= n - 1; a++) for (let b = -n + 1; b <= n - 1; b++) occ.set((cx + a) + ',' + (cz + b), 1); };
  for (const side of [-1, 1]) {
    let s = R(0, 20);
    while (s < L) {
      const zn = C.zones[zoneAt[Math.min(N - 1, Math.floor(s / ds))]];
      const rows = zn.rows;
      for (let r = 0; r < rows; r++) {
        const tall = zn.tallP && rand() < zn.tallP && r < 2;
        const w = tall ? R(zn.tw[0], zn.tw[1]) : R(zn.w[0], zn.w[1]);
        const dp = tall ? R(zn.tw[0], zn.tw[1]) : R(zn.d[0], zn.d[1]);
        const h = tall ? R(zn.th[0], zn.th[1]) : R(zn.h[0], zn.h[1]);
        const lat = side * (HW + zn.setback + r * zn.rowGap + dp / 2 + R(0, zn.jitter));
        curveAt(s + R(-4, 4), lat, o);
        const rad = Math.max(w, dp) * 0.72;
        const nr = nearestRoad(o.x, o.z);
        if (nr.d < HW + 6 + rad) continue;
        if (blocked(o.x, o.z, rad)) continue;
        if (!free(o.x, o.z, rad * 0.8)) continue;
        mark(o.x, o.z, rad * 0.8);
        const g0 = groundH(o.x, o.z), gy = C.hills ? baseH(o.x, o.z, w, dp) : g0 - 0.5;
        const yaw = yawOf(o.tx, o.tz) + (zn.skew ? R(-zn.skew, zn.skew) : 0);
        const col = tall ? pick(zn.tallColors) : pick(zn.colors);
        const extraH = g0 - gy, roofY = g0 + h;
        if (tall && zn.shapes) { const sh = pick(zn.shapes); (sh === 'box' ? (zn.curtain ? glassT : bList) : sh === 'round' ? roundT : taperT).push({ x: o.x, y: gy, z: o.z, sx: w, sy: h + extraH, sz: sh === 'box' ? dp : w, yaw, c: col }); }
        else (tall && zn.curtain ? glassT : bList).push({ x: o.x, y: gy, z: o.z, sx: w, sy: h + extraH, sz: dp, yaw, c: col });
        if (!tall && zn.balcony && r < 2) addBalconies(o.x, o.z, yaw, side, w, dp, g0, h, col);
        if (!tall && zn.tanks) roofStuff(o.x, o.z, yaw, w, dp, roofY, col, r < 3 ? 1 : 0.6);
        if (tall && zn.crown && rand() < 0.7) {
          const ch = R(8, 30);
          (zn.curtain ? glassT : bList).push({ x: o.x, y: roofY, z: o.z, sx: w * R(0.45, 0.75), sy: ch, sz: dp * R(0.45, 0.75), yaw, c: col });
          if (rand() < 0.5) crowns.push({ x: o.x, y: roofY + ch, z: o.z, sx: 0.6, sy: R(10, 35), sz: 0.6, yaw: 0 });
        }
      }
      // roadside trees
      if (zn.tree && rand() < zn.treeP) {
        const underRail = C.metro && side === C.metro.side && s > C.metro.from * L && s < C.metro.to * L;
        const lat = side * (HW + (underRail ? R(2.5, 4) : R(3, zn.setback - 2)));
        curveAt(s + R(0, 10), lat, o);
        const nr = nearestRoad(o.x, o.z);
        if (nr.d > HW + 2.5 && !blocked(o.x, o.z, 3)) {
          const gy = groundH(o.x, o.z);
          if (zn.tree === 'palm') {
            const h = R(7, 12);
            palmT.push({ x: o.x, y: gy, z: o.z, sx: 1, sy: h, sz: 1, yaw: 0 });
            palmC.push({ x: o.x, y: gy + h, z: o.z, sx: R(0.9, 1.2), sy: 1, sz: R(0.9, 1.2), yaw: R(0, 6) });
          } else {
            const kind = zn.tree === 'mix' ? (rand() < 0.5 ? 'cypress' : 'olive') : zn.tree;
            trees.push({ x: o.x, y: gy, z: o.z, sx: kind === 'cypress' ? 1 : R(1.6, 2.4), sy: kind === 'cypress' ? R(7, 12) : R(2.5, 3.5), sz: kind === 'cypress' ? 1 : R(1.6, 2.4), yaw: R(0, 6), c: kind === 'cypress' ? C.look.treeDark : C.look.treeLight, kind });
          }
        }
      }
      s += R(zn.spacing[0], zn.spacing[1]);
    }
  }
  // fill the rest of the city so it reads as a city from a distance
  if (C.fill) {
    const pad = C.fill.pad;
    for (let k = 0; k < C.fill.count; k++) {
      const x = R(minX - pad, maxX + pad), z = R(minZ - pad, maxZ + pad);
      const nr = nearestRoad(x, z);
      const zn = C.zones[nr.i >= 0 ? zoneAt[nr.i] : C.fill.zone] || C.zones[C.fill.zone];
      const w = R(zn.w[0], zn.w[1]), dp = R(zn.d[0], zn.d[1]), h = R(zn.h[0], zn.h[1]) * R(0.7, 1.1);
      const rad = Math.max(w, dp) * 0.72;
      if (nr.i >= 0 && nr.d < HW + 12 + rad) continue;
      if (blocked(x, z, rad) || !free(x, z, rad * 0.8)) continue;
      mark(x, z, rad * 0.8);
      const g0 = groundH(x, z), gy = C.hills ? baseH(x, z, w, dp) : g0 - 0.5, yaw = R(-0.4, 0.4) + (C.fill.yaw || 0), col = pick(zn.colors);
      bList.push({ x, y: gy, z, sx: w, sy: h + g0 - gy, sz: dp, yaw, c: col });
      if (zn.tanks && rand() < 0.35) roofStuff(x, z, yaw, w, dp, g0 + h, col, 0.6);
    }
  }
  const bGeo = BOX.clone(); bGeo.translate(0, 0.5, 0);
  makeInstanced(bGeo, windowMaterial(C.look.windows), bList, true);
  if (glassT.length + roundT.length + taperT.length) {
    const gm = windowMaterial(C.look.windows, true);
    if (glassT.length) makeInstanced(bGeo, gm, glassT, true);
    if (roundT.length) { const g = new THREE.CylinderGeometry(0.5, 0.5, 1, 20); g.translate(0, 0.5, 0); makeInstanced(g, gm, roundT, true); }
    if (taperT.length) { const g = new THREE.CylinderGeometry(0.36, 0.62, 1, 4, 1).toNonIndexed(); g.rotateY(Math.PI / 4); g.translate(0, 0.5, 0); g.computeVertexNormals(); makeInstanced(g, gm, taperT, true); }
  }
  if (balc.length) {
    // slab, stone parapet on three sides, and a thin rail on top
    const bg = mergeParts([box(0xffffff, 0.65, 0, 0, 1.3, 0.2, 3.2), box(0xffffff, 1.25, 0.5, 0, 0.12, 0.8, 3.2), box(0xffffff, 0.65, 0.5, 1.55, 1.3, 0.8, 0.1), box(0xffffff, 0.65, 0.5, -1.55, 1.3, 0.8, 0.1), box(0x555555, 1.25, 1.0, 0, 0.06, 0.06, 3.2)]);
    makeInstanced(bg, new THREE.MeshLambertMaterial({ vertexColors: true }), balc, true);
  }
  if (solar.length) {
    const sg = mergeParts([box(0x1d2a3a, 0, 1.0, 0.2, 2.0, 0.06, 1.3, { rx: -0.7 }), box(0x9a9a9a, 0, 0.5, 0.45, 2.0, 1.0, 0.06), { g: CYL(0.28, 0.28, 2.0, 6), c: 0xe8e8e4, x: 0, y: 1.45, z: -0.35, rz: Math.PI / 2 }]);
    makeInstanced(sg, new THREE.MeshLambertMaterial({ vertexColors: true }), solar, false);
  }
  if (dishes.length) {
    const dg = mergeParts([{ g: CYL(0.45, 0.12, 0.18, 7), c: 0xe9e9e6, y: 1.0, rx: 1.1 }, box(0x777777, 0, 0.5, 0, 0.06, 1.0, 0.06)]);
    makeInstanced(dg, new THREE.MeshLambertMaterial({ vertexColors: true }), dishes, false);
  }
  if (rebar.length) { const rg = BOX.clone(); rg.translate(0, 0.5, 0); makeInstanced(rg, new THREE.MeshLambertMaterial({ color: 0x9a948a }), rebar, false); }
  if (tanks.length) { const tg = CYL(0.65, 0.65, 1.3, 8, 1, false); tg.translate(0, 0.85, 0); makeInstanced(tg, new THREE.MeshLambertMaterial(), tanks, true); }
  if (crowns.length) { const cg = CYL(0.3, 0.6, 1, 5); cg.translate(0, 0.5, 0); makeInstanced(cg, new THREE.MeshLambertMaterial({ color: 0xdedede }), crowns, false); }
  const cyp = trees.filter((t) => t.kind === 'cypress'), oli = trees.filter((t) => t.kind !== 'cypress');
  if (cyp.length) { const g = new THREE.ConeGeometry(1.3, 1, 7); g.translate(0, 0.5, 0); makeInstanced(g, new THREE.MeshLambertMaterial(), cyp, true); }
  if (oli.length) { const g = new THREE.IcosahedronGeometry(1, 0); g.translate(0, 1.1, 0); makeInstanced(g, new THREE.MeshLambertMaterial(), oli, true); }
  if (palmT.length) {
    const tg = CYL(0.18, 0.28, 1, 6); tg.translate(0, 0.5, 0);
    makeInstanced(tg, new THREE.MeshLambertMaterial({ color: 0x7a5c3e }), palmT, false);
    const leaves = [];
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; leaves.push({ g: BOX, c: 0x3f7a35, x: Math.sin(a) * 1.6, y: -0.35, z: Math.cos(a) * 1.6, sx: 0.5, sy: 0.08, sz: 3.4, ry: a, rx: 0.35 }); }
    const lg = mergeParts(leaves.map((p) => { const q = Object.assign({}, p); return q; }));
    makeInstanced(lg, new THREE.MeshLambertMaterial({ vertexColors: true }), palmC, false);
  }
  // street lights
  const poles = [], lamps = [];
  // twin-arm lights on the median, one arm over each carriageway
  for (let s = 0; s < L; s += 42) {
    curveAt(s, 0, o);
    poles.push({ x: o.x, y: o.y + 0.9, z: o.z, sx: 1, sy: 1, sz: 1, yaw: yawOf(o.tx, o.tz) });
    for (const side of [-1, 1]) { curveAt(s, side * (MED + 4.6), o); lamps.push({ x: o.x, y: o.y + 11.35, z: o.z, sx: 1, sy: 1, sz: 1, yaw: yawOf(o.tx, o.tz) }); }
  }
  const arm = (sg) => [box(C.look.pole, sg * 1.6, 11.0, 0, 3.2, 0.12, 0.12, { rz: sg * 0.18 }), box(C.look.pole, sg * 3.9, 11.55, 0, 1.6, 0.1, 0.1)];
  const pg = mergeParts([{ g: CYL(0.11, 0.2, 11.2, 8), c: C.look.pole, y: 5.6 }, box(C.look.pole, 0, 0.15, 0, 0.6, 0.3, 0.6), ...arm(1), ...arm(-1)]);
  // rotate so arm points toward the road: arm is along +x, poles yaw set so +x faces road
  makeInstanced(pg, new THREE.MeshLambertMaterial({ vertexColors: true }), poles, false);
  LAMP_MAT.color.set(C.look.night > 0.3 ? 0xffd9a0 : 0xd8d8d0);
  makeInstanced(new THREE.BoxGeometry(1.4, 0.22, 0.55), LAMP_MAT, lamps, false);
}

const LAMP_MAT = new THREE.MeshBasicMaterial({ color: 0xd8d8d0, toneMapped: false });

// ---------- time of day and weather ----------
// "auto" keeps the city's own light; the others swap the sky, sun, fog and how many windows are lit
const TIMES = {
  morning: { skyTop: '#5f97d6', fog: '#d6dfe6', sunGlow: '#fff1cf', sunDir: [0.75, 0.42, 0.35], sunColor: 0xfff0d8, sun: 2.0, skyLight: 0xd8e8f6, groundLight: 0xa3957c, hemi: 1.15, night: 0, exposure: 1.0, clouds: 0.35, cloudColor: '#ffffff' },
  noon: { skyTop: '#6f9fcf', fog: '#dccaa6', sunGlow: '#ffd59a', sunDir: [-0.7, 0.45, 0.25], sunColor: 0xffe1b0, sun: 1.9, skyLight: 0xcfe1f2, groundLight: 0xb59c73, hemi: 1.15, night: 0, exposure: 1.0, clouds: 0.5, cloudColor: '#fbf7f0' },
  sunset: { skyTop: '#26295a', fog: '#e3a98a', sunGlow: '#ffb070', sunDir: [-0.8, 0.12, -0.45], sunColor: 0xffa26b, sun: 1.7, skyLight: 0x9aa3d6, groundLight: 0x6b5040, hemi: 1.55, night: 0.8, exposure: 1.2, clouds: 0.3, cloudColor: '#f1b49a' },
  night: { skyTop: '#03061a', fog: '#1a2238', sunGlow: '#7d8dbf', sunDir: [0.35, 0.55, -0.6], sunColor: 0x9fb4e6, sun: 0.45, skyLight: 0x5a6a99, groundLight: 0x221c18, hemi: 0.8, night: 1, exposure: 1.2, clouds: 0.12, cloudColor: '#2c3452', stars: 1, fogK: 0.75 }
};
// weather: Amman gets winter rain and mist, Dubai a sandstorm (CITY.weather picks which)
const WEATHER = {
  rain: { fogTo: '#8e979f', fogMix: 0.65, fogK: 0.32, sunK: 0.3, hemiK: 0.85, clouds: 1, cloudColor: '#9aa1a8', skyMix: 0.55 },
  dust: { fogTo: '#c9a26a', fogMix: 0.8, fogK: 0.14, sunK: 0.45, hemiK: 0.95, clouds: 0, cloudColor: '#c9a26a', skyMix: 0.75 }
};
const headlight = new THREE.SpotLight(0xfff1d6, 0, 90, 0.48, 0.65, 1.1);
scene.add(headlight); scene.add(headlight.target);
const atm = { night: C.look.night, wx: null };
const mixHex = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
function applyTime() {
  const L = Object.assign({}, C.look, TIMES[settings.time] || {});
  const W = settings.weather ? WEATHER[C.weather] : null;
  const fogK = (L.fogK || 1) * (W ? W.fogK : 1);
  const fog = W ? mixHex(L.fog, W.fogTo, W.fogMix) : new THREE.Color(L.fog);
  scene.fog.color.copy(fog); scene.background.copy(fog);
  scene.fog.near = C.look.fogNear * fogK; scene.fog.far = C.look.fogFar * fogK;
  hemi.color.set(L.skyLight); hemi.groundColor.set(L.groundLight); hemi.intensity = L.hemi * (W ? W.hemiK : 1);
  sun.color.set(L.sunColor); sun.intensity = L.sun * (W ? W.sunK : 1);
  SUN_DIR.fromArray(L.sunDir).normalize();
  renderer.toneMappingExposure = L.exposure || 1;
  const u = scene.userData.sky.material.uniforms;
  u.top.value.copy(W ? mixHex(L.skyTop, fog, W.skyMix) : new THREE.Color(L.skyTop)); u.hor.value.copy(fog);
  u.glow.value.copy(W ? mixHex(L.sunGlow, fog, 0.7) : new THREE.Color(L.sunGlow)); u.sdir.value.copy(SUN_DIR);
  u.clouds.value = W ? W.clouds : L.clouds || 0; u.cloudCol.value.set(W ? W.cloudColor : L.cloudColor || '#ffffff');
  u.stars.value = W ? 0 : L.stars || 0;
  ATM_U.top.value.copy(u.top.value); ATM_U.hor.value.copy(fog);
  // dark skies switch on more windows, the street lamps and your headlights
  const night = Math.min(1, L.night + (W ? 0.25 : 0));
  ATM_U.night.value = night; atm.night = night; atm.wx = W ? C.weather : null;
  LAMP_MAT.color.set(night > 0.3 ? 0xffd9a0 : 0xd8d8d0);
  headlight.intensity = night > 0.5 ? 3.2 * night : 0;
  $('#wx').hidden = !W; $('#wx').dataset.kind = W ? C.weather : '';
  SND.weather(W ? C.weather : null);
}
// rain streaks or blowing sand, drawn flat over the picture
const wxEl = $('#wx'), wxG = wxEl.getContext('2d'); const wxP = [];
function drawWeather(dt) {
  if (!atm.wx || wxEl.hidden) return;
  const w = wxEl.clientWidth, h = wxEl.clientHeight;
  if (wxEl.width !== w || wxEl.height !== h) { wxEl.width = w; wxEl.height = h; wxP.length = 0; }
  const rain = atm.wx === 'rain', n = rain ? 170 : 90, spd = game.mode === 'drive' ? player.v : 0;
  while (wxP.length < n) wxP.push({ x: Math.random() * w, y: Math.random() * h, z: 0.4 + Math.random() * 0.6, s: Math.random() });
  wxG.clearRect(0, 0, w, h);
  if (rain) {
    wxG.strokeStyle = 'rgba(210,222,235,0.42)'; wxG.lineWidth = 1.2; wxG.beginPath();
    const slant = 0.12 + spd * 0.012;
    for (const p of wxP) {
      // drops fall and, at speed, fly out from the middle of the screen
      const len = (14 + spd * 0.5) * p.z;
      const dx = (p.x - w / 2) / w * spd * 0.02 * p.z;
      p.y += (900 + spd * 14) * p.z * dt; p.x += (dx * 60 + slant * 300 * p.z) * dt;
      if (p.y > h || p.x < 0 || p.x > w) { p.y = -20; p.x = Math.random() * w; }
      wxG.moveTo(p.x, p.y); wxG.lineTo(p.x - slant * len, p.y - len);
    }
    wxG.stroke();
  } else {
    for (const p of wxP) {
      p.x -= (120 + spd * 6) * p.z * dt * (p.s > 0.5 ? 1 : 0.7); p.y += Math.sin(p.x * 0.01 + p.s * 6) * 20 * dt;
      if (p.x < -20) { p.x = w + 20; p.y = Math.random() * h; }
      wxG.fillStyle = `rgba(214,178,118,${0.18 + 0.3 * p.z})`; wxG.beginPath(); wxG.arc(p.x, p.y, 1 + 2.4 * p.z, 0, 6.283); wxG.fill();
    }
  }
}

// ---------- Dubai Metro: an elevated line beside the road, with gold stations and a moving train ----------
const metro = { cars: [], pos: 0 };
function buildMetro() {
  const M = C.metro; if (!M) return;
  const lat = M.side * (HW + M.off), H = 11, step = 32, t0 = M.from * L, t1 = M.to * L;
  const a = {}, b = {}, beams = [], piers = [], caps = [];
  for (let s = t0; s < t1; s += step) {
    curveAt(s, lat, a); curveAt(s + step, lat, b);
    if (blocked(a.x, a.z, 5) || blocked(b.x, b.z, 5)) continue;
    const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz);
    beams.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + H, z: (a.z + b.z) / 2, sx: 1, sy: 1, sz: len + 0.2, yaw: yawOf(dx / len, dz / len) });
    const gy = groundH(a.x, a.z);
    piers.push({ x: a.x, y: gy, z: a.z, sx: 1.7, sy: a.y + H - gy - 0.8, sz: 1.7, yaw: yawOf(dx / len, dz / len) });
    caps.push({ x: a.x, y: a.y + H - 1.6, z: a.z, sx: 1, sy: 1, sz: 1, yaw: yawOf(dx / len, dz / len) });
  }
  // the deck: a wide box girder with low walls and two rails on top
  const deck = mergeParts([box(0xd9d6cf, 0, -0.5, 0, 7.6, 1.0, 1), box(0xc9c5bc, 0, -1.15, 0, 4.2, 0.5, 1), box(0xe4e1da, 3.7, 0.35, 0, 0.2, 0.7, 1), box(0xe4e1da, -3.7, 0.35, 0, 0.2, 0.7, 1), box(0x6a6d70, 1.8, 0.08, 0, 1.6, 0.16, 1), box(0x6a6d70, -1.8, 0.08, 0, 1.6, 0.16, 1)]);
  makeInstanced(deck, new THREE.MeshLambertMaterial({ vertexColors: true }), beams, false);
  const pg = BOX.clone(); pg.translate(0, 0.5, 0);
  makeInstanced(pg, new THREE.MeshLambertMaterial({ color: 0xd2cec6 }), piers, false);
  const cg = new THREE.CylinderGeometry(3.6, 0.9, 1.6, 4, 1); cg.rotateY(Math.PI / 4); cg.scale(1.5, 1, 0.5); cg.translate(0, 0.8, 0); cg.computeVertexNormals();
  makeInstanced(cg, new THREE.MeshLambertMaterial({ color: 0xd2cec6 }), caps, false);
  // stations: a long gold shell over the tracks
  const gold = new THREE.MeshStandardMaterial({ color: 0xc9a453, metalness: 0.7, roughness: 0.32, envMap: ENV });
  const shell = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  for (const f of M.stations) {
    curveAt(f * L, lat, a); if (blocked(a.x, a.z, 30)) continue;
    const g = new THREE.Group(); g.position.set(a.x, a.y + H, a.z); g.rotation.y = yawOf(a.tx, a.tz);
    const sh = new THREE.Mesh(shell, gold); sh.scale.set(9, 7, 48); sh.position.y = 0.2; g.add(sh);
    g.add(mesh(new THREE.BoxGeometry(14, 1.2, 80), lam(0xd9d6cf), 0, -0.6, 0));
    for (const k of [-1, 1]) for (const z of [-28, 0, 28]) g.add(mesh(new THREE.BoxGeometry(1.6, H - 1, 1.6), lam(0xd2cec6), k * 4.5, -H / 2 - 0.6, z));
    scene.add(g);
  }
  // the train: five white cars with a dark glass band and a red stripe
  const tg = mergeParts([box(0xf2f2ee, 0, 1.65, 0, 2.9, 3.0, 16.4), box(0x1c252e, 0, 2.1, 0, 2.96, 0.95, 15.6), box(0xc8102e, 0, 0.75, 0, 2.95, 0.22, 16.2), box(0x2a2d31, 0, 0.1, 0, 2.4, 0.4, 14)]);
  const tm = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 70, specular: 0x666666 });
  for (let k = 0; k < 5; k++) { const m = new THREE.Mesh(tg, tm); m.castShadow = true; scene.add(m); metro.cars.push(m); }
  Object.assign(metro, { lat: lat + M.side * 1.8, H, t0, t1, pos: t0 + (t1 - t0) * 0.3 });
}
function updateMetro(dt) {
  if (!metro.cars.length) return;
  metro.pos += dt * 22; if (metro.pos > metro.t1) metro.pos = metro.t0 + 90;
  metro.cars.forEach((m, k) => { curveAt(metro.pos - k * 16.8, metro.lat, Q); m.position.set(Q.x, Q.y + metro.H + 0.2, Q.z); m.rotation.y = yawOf(Q.tx, Q.tz); });
}
// green lawn strips beside the road, the way Dubai keeps its highways
function buildVerge() {
  if (!C.verge) return;
  const tex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#5f8a3a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'; g.fillRect(i * w / 8, 0, w / 8, h); }
    for (let i = 0; i < 9000; i++) { const v = Math.random(); g.fillStyle = `rgba(${v < 0.5 ? '40,70,20' : '150,190,90'},${0.15 + Math.random() * 0.2})`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 2.5); }
  }, true);
  const pos = [], uv = [], a = {}, b = {}, c = {}, d = {};
  const step = 8, x0 = HW + 0.6, x1 = HW + C.verge.width;
  for (const side of [-1, 1]) for (let s = 0; s < L; s += step) {
    const zn = zoneAt[Math.min(N - 1, Math.floor(s / ds))]; if (!C.verge.zones.includes(zn)) continue;
    curveAt(s, side * x0, a); curveAt(s, side * x1, b); curveAt(s + step, side * x0, c); curveAt(s + step, side * x1, d);
    const y = (p) => groundH(p.x, p.z) + 0.08;
    const P = [a, b, d, a, d, c]; const U = [[0, s / 6], [1.6, s / 6], [1.6, (s + step) / 6], [0, s / 6], [1.6, (s + step) / 6], [0, (s + step) / 6]];
    if (side < 0) { P.reverse(); U.reverse(); }
    P.forEach((p, i) => { pos.push(p.x, Math.max(y(p), p.y - 0.25), p.z); uv.push(U[i][0], U[i][1]); });
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: tex })); m.receiveShadow = true; scene.add(m);
}

// ---------- signs ----------
function signTexture(ar, en, sub, color) {
  return canvasTex(1024, 360, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ffffff'; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, h - 28);
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.direction = 'rtl';
    g.font = `110px ${FONT_AR}`; g.fillText(ar, w / 2, 150);
    g.direction = 'ltr'; g.font = `600 58px ${FONT_BODY}`; g.fillText(en, w / 2, 235);
    g.font = `500 48px ${FONT_BODY}`; g.fillText(sub, w / 2, 310);
  });
}
function addGantry(sCurve, dir, tex, spanBoth) {
  const o = {}; const center = spanBoth ? 0 : dir * (MED + CW / 2); const span = spanBoth ? HW * 2 + 1 : CW + 1;
  curveAt(sCurve, center, o);
  const g = new THREE.Group();
  const frame = new THREE.MeshLambertMaterial({ color: 0x8a8f96 });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(span, 0.6, 0.6), frame); beam.position.y = 7.2; g.add(beam);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(CYL(0.25, 0.3, 7.5), frame); p.position.set(s * span / 2, 3.75, 0); g.add(p); }
  if (tex) {
    const pw = Math.min(14, CW * 0.95);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(pw, pw * 360 / 1024), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
    panel.position.set(0, 7.2 + pw * 0.176 - 0.2, 0.35); g.add(panel);
  }
  g.position.set(o.x, o.y, o.z);
  // panel normal (+z local) must face incoming traffic: -dir * tangent
  const nx = -dir * o.tx, nz = -dir * o.tz; g.rotation.y = Math.atan2(nx, nz);
  scene.add(g); return g;
}
function buildSigns() {
  for (const lm of LMS) {
    for (const dir of [1, -1]) {
      const sSign = lm.s - dir * 450;
      addGantry(sSign, dir, signTexture(lm.ar, lm.en, '450 ' + T.meters, C.look.signColor), false);
    }
  }
}

// speed cameras, bumps, toll gates
const events = [];
function buildEvents() {
  const o = {};
  for (const f of C.radars) {
    const s = f * L;
    for (const dir of [1, -1]) {
      curveAt(s, dir * (HW + 1.6), o);
      const g = new THREE.Group();
      const pole = new THREE.Mesh(CYL(0.12, 0.15, 5), new THREE.MeshLambertMaterial({ color: 0x9aa0a6 })); pole.position.y = 2.5; g.add(pole);
      const cam = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 1.0), new THREE.MeshLambertMaterial({ color: C.look.radarColor })); cam.position.y = 5.2; g.add(cam);
      g.position.set(o.x, o.y, o.z); scene.add(g);
    }
    events.push({ type: 'radar', s });
  }
  for (const f of (C.bumps || [])) {
    const s = f * L;
    const tex = canvasTex(256, 32, (g, w, h) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#111' : '#f2c218'; g.fillRect(i * 16, 0, 16, h); } }, true);
    tex.repeat.set(4, 1);
    for (const dir of [1, -1]) {
      curveAt(s, dir * (MED + CW / 2), o);
      const m = new THREE.Mesh(new THREE.BoxGeometry(CW, 0.14, 1.6), new THREE.MeshLambertMaterial({ map: tex }));
      m.position.set(o.x, o.y + 0.05, o.z); m.rotation.y = yawOf(o.tx, o.tz); scene.add(m);
      addGantry(s - dir * 120, dir, signTexture(SIGN_AR['text.bumpSign'], 'Speed bump', '120 ' + T.meters, C.look.warnColor), false);
    }
    events.push({ type: 'bump', s });
  }
  for (const tg of (C.tollsAt || [])) {
    const gg = geo(tg[0], tg[1]); const s = nearestS(gg[0], gg[1]).s;
    for (const dir of [1, -1]) addGantry(s, dir, signTexture(SIGN_AR['text.tollName'], 'Toll gate', T.tollPrice, C.look.tollColor), false);
    events.push({ type: 'toll', s });
  }
}

// ---------- landmark builders ----------
const LB = {};
const lam = (c, extra) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, extra || {}));
function mesh(g, m, x, y, z) { const me = new THREE.Mesh(g, m); me.position.set(x || 0, y || 0, z || 0); return me; }
LB.fountain = (g) => { g.add(mesh(CYL(16, 16, 1.2, 28), lam(0xd8cdb6), 0, 0.6, 0)); g.add(mesh(CYL(13, 13, 0.4, 28), lam(0x3e8fb0, { emissive: 0x0b2a38 }), 0, 1.2, 0)); g.add(mesh(CYL(1, 2, 8, 10), lam(0xe8dfcc), 0, 4, 0)); g.add(mesh(new THREE.SphereGeometry(2.2, 12, 8), lam(0xbfe6f5, { transparent: true, opacity: 0.7 }), 0, 8.5, 0)); };
LB.towers = (g, lm) => {
  const cols = [0x7fa3bd, 0x9bb7c9, 0x5f7f97, 0xc9d3db];
  (lm.towers || [[0, 0, 30, 30, 150], [60, 20, 28, 28, 120], [-50, 40, 24, 30, 95], [20, -60, 26, 26, 80]]).forEach((t, i) => {
    const m = mesh(new THREE.BoxGeometry(t[2], t[4], t[3]), windowMaterial(C.look.windows), t[0], t[4] / 2, t[1]);
    m.material.color.set(cols[i % cols.length]); g.add(m);
  });
};
LB.mosqueBlue = (g) => {
  const stone = lam(0xe9e1d0), blue = lam(0x2f6db5, { emissive: 0x0a1a33 });
  g.add(mesh(new THREE.CylinderGeometry(22, 22, 14, 8), stone, 0, 7, 0));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(18, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), blue); dome.position.y = 14; g.add(dome);
  g.add(mesh(CYL(0.4, 0.8, 5, 6), lam(0xd4af37), 0, 34, 0));
  for (const s of [-1, 1]) { g.add(mesh(CYL(1.6, 2, 48, 8), stone, s * 32, 24, -8)); g.add(mesh(new THREE.ConeGeometry(2.2, 6, 8), blue, s * 32, 51, -8)); }
};
LB.citadel = (g) => {
  const stone = lam(0xc9a978), hill = lam(0xb59a6e);
  g.add(mesh(new THREE.CylinderGeometry(70, 110, 35, 9), hill, 0, 14, 0));
  g.add(mesh(new THREE.BoxGeometry(40, 2, 24), stone, 0, 32.5, 0));
  for (const s of [-1, 1]) for (const k of [0, 1]) g.add(mesh(CYL(1.3, 1.5, 14, 12), stone, s * 6 + k * s * 5, 40.5, 4));
  g.add(mesh(new THREE.BoxGeometry(26, 2, 4), stone, 0, 48.5, 4));
  g.add(mesh(new THREE.BoxGeometry(18, 9, 18), stone, -30, 36, -20));
  g.add(mesh(new THREE.SphereGeometry(8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), stone, -30, 40.5, -20));
};
LB.theatre = (g) => {
  const stone = lam(0xd2b48a);
  for (let k = 0; k < 14; k++) {
    const r1 = 14 + k * 3, r2 = r1 + 3.2;
    const sh = new THREE.Shape(); sh.absarc(0, 0, r2, 0, Math.PI, false); sh.absarc(0, 0, r1, Math.PI, 0, true);
    const eg = new THREE.ExtrudeGeometry(sh, { depth: 1.4 + k * 1.4, bevelEnabled: false, curveSegments: 24 }); eg.rotateX(-Math.PI / 2);
    g.add(new THREE.Mesh(eg, stone));
  }
  g.add(mesh(new THREE.BoxGeometry(34, 6, 4), stone, 0, 3, 4));
};
let flagMesh = null;
LB.flagpole = (g, lm) => {
  const h = lm.h || 126;
  g.add(mesh(CYL(0.7, 1.4, h, 10), lam(0xd5d8dc), 0, h / 2, 0));
  g.add(mesh(CYL(5, 6, 2, 12), lam(0xbdb2a0), 0, 1, 0));
  const tex = canvasTex(600, 300, C.flag);
  const fg = new THREE.PlaneGeometry(60, 30, 30, 10); fg.translate(30, 0, 0);
  flagMesh = new THREE.Mesh(fg, new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide, fog: false }));
  flagMesh.position.set(0, h - 16, 0); g.add(flagMesh);
  flagMesh.userData.base = Float32Array.from(fg.attributes.position.array);
  g.children[0].material.fog = false;
};
LB.oldHouses = (g) => {
  const cols = [0xe6d6b8, 0xd8c29a, 0xefe3cb, 0xc7a983, 0xe0cda8];
  for (let i = 0; i < 26; i++) { const w = 6 + Math.random() * 7, h = 6 + Math.random() * 10; const m = mesh(new THREE.BoxGeometry(w, h, w), windowMaterial(C.look.windows), (Math.random() - 0.5) * 110, h / 2 + i * 0.6, (Math.random() - 0.5) * 90); m.material.color.set(mpick(cols)); g.add(m); }
};
LB.cableBridge = (g) => {
  const con = lam(0xd9d4c8), cab = lam(0xf2f2f2);
  const deck = mesh(new THREE.BoxGeometry(260, 2, 16), con, 0, 30, 0); g.add(deck);
  for (const x of [-90, 0, 90]) g.add(mesh(new THREE.BoxGeometry(4, 30, 10), con, x, 15, 0));
  const pyl = mesh(new THREE.BoxGeometry(3, 70, 3), con, 0, 62, 0); pyl.rotation.z = 0.12; g.add(pyl);
  for (let k = 1; k <= 7; k++) for (const s of [-1, 1]) {
    const x2 = s * k * 15, y1 = 92 - k * 4; const len = Math.hypot(x2 + 3, y1 - 31);
    const c = mesh(CYL(0.15, 0.15, len, 4), cab, (x2 - 3) / 2, (y1 + 31) / 2, 0); c.rotation.z = Math.atan2(x2 + 3, y1 - 31) * -1; g.add(c);
  }
};
LB.shops = (g, lm) => {
  const cols = [0xe9dcc2, 0xd9c8a6, 0xf1ebe0];
  const signs = lm.signs || [0xc8102e, 0x007a3d, 0x1f4e9c, 0xf2a900];
  for (let i = 0; i < 10; i++) {
    const w = 14 + Math.random() * 10, h = 10 + Math.random() * 14; const x = (i - 5) * 26, z = (Math.random() - 0.5) * 20;
    const m = mesh(new THREE.BoxGeometry(w, h, 16), windowMaterial(C.look.windows), x, h / 2, z); m.material.color.set(mpick(cols)); g.add(m);
    g.add(mesh(new THREE.BoxGeometry(w * 0.8, 2.2, 0.4), lam(signs[i % signs.length], { emissive: signs[i % signs.length], emissiveIntensity: 0.25 + C.look.night * 0.6 }), x, 5, z - 8.3));
  }
};
LB.mall = (g, lm) => {
  g.add(mesh(new THREE.BoxGeometry(170, 22, 90), lam(lm.color || 0xe7dfd1), 0, 11, 0));
  g.add(mesh(new THREE.BoxGeometry(60, 6, 50), lam(0x9fb8c8), 0, 25, 0));
  const t = canvasTex(1024, 200, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = lm.ink || '#7a1f2b'; c.textAlign = 'center'; c.font = `120px ${FONT_AR}`; c.fillText(lm.ar, w / 2, 145); });
  const p = mesh(new THREE.PlaneGeometry(60, 12), new THREE.MeshBasicMaterial({ map: t }), 0, 15, 45.3); g.add(p);
  if (lm.ski) { const sk = mesh(new THREE.BoxGeometry(80, 22, 400), lam(0xc7ccd2), 120, 30, 0); sk.rotation.x = 0.12; g.add(sk); }
};
LB.burjKhalifa = (g) => {
  const m = windowMaterial(C.look.windows); m.color.set(0xaec3d3);
  const stages = [[60, 160], [48, 150], [38, 130], [28, 120], [20, 100], [13, 80], [8, 50]];
  let y = 0;
  stages.forEach(([r, h], i) => {
    for (let k = 0; k < 3; k++) {
      const a = k * Math.PI * 2 / 3 + i * 0.35;
      const wing = mesh(new THREE.BoxGeometry(r * 0.55, h, r * 1.1), m, Math.sin(a) * r * 0.45, y + h / 2, Math.cos(a) * r * 0.45); wing.rotation.y = a; g.add(wing);
    }
    g.add(mesh(CYL(r * 0.35, r * 0.4, h, 10), m, 0, y + h / 2, 0));
    y += h;
  });
  g.add(mesh(CYL(0.6, 4, 120, 8), lam(0xdfe6ec, { fog: false }), 0, y + 60, 0));
  g.add(mesh(new THREE.SphereGeometry(1.4, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff3b30, fog: false }), 0, y + 121, 0));
  g.traverse((o) => { if (o.material) o.material.fog = false; });
};
LB.burjAlArab = (g) => {
  g.add(mesh(CYL(70, 80, 4, 24), lam(0xd9c9a3), 0, 1, 0));
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(95, 120, 10, 320); sh.lineTo(0, 320); sh.lineTo(0, 0);
  const sail = new THREE.ExtrudeGeometry(sh, { depth: 46, bevelEnabled: false, curveSegments: 20 }); sail.translate(0, 0, -23);
  const sm = new THREE.Mesh(sail, lam(0xf3f1ec, { emissive: C.look.night > 0.3 ? 0x2a2050 : 0x000000, fog: false })); sm.position.y = 3; g.add(sm);
  g.add(mesh(new THREE.BoxGeometry(6, 330, 6), lam(0xb8bcc2, { fog: false }), -2, 165, -20));
  g.add(mesh(new THREE.BoxGeometry(6, 330, 6), lam(0xb8bcc2, { fog: false }), -2, 165, 20));
  g.add(mesh(CYL(16, 16, 1.2, 20), lam(0xe8e4dc, { fog: false }), 45, 200, 0));
};
LB.museum = (g) => {
  g.add(mesh(new THREE.CylinderGeometry(40, 50, 18, 16), lam(0x7a9a6a), 0, 9, 0));
  const tor = new THREE.Mesh(new THREE.TorusGeometry(34, 14, 20, 40), lam(0xd5dade, { emissive: C.look.night > 0.3 ? 0x1b2a3a : 0x000000 }));
  tor.scale.set(1, 1.15, 0.8); tor.position.y = 55; g.add(tor);
};
LB.emiratesTowers = (g) => {
  const m = windowMaterial(C.look.windows); m.color.set(0x9aa5ae);
  const a = mesh(CYL(26, 26, 300, 3), m, -40, 150, 0); a.rotation.y = 0.5; g.add(a);
  const b = mesh(CYL(22, 22, 255, 3), m, 40, 127, 10); b.rotation.y = 0.5; g.add(b);
  g.add(mesh(new THREE.ConeGeometry(26, 50, 3), m, -40, 325, 0)); g.add(mesh(new THREE.ConeGeometry(22, 40, 3), m, 40, 275, 10));
  g.traverse((o) => { if (o.material) o.material.fog = false; });
};
LB.frame = (g) => {
  const gold = lam(0xd4a64a, { emissive: C.look.night > 0.3 ? 0x3a2a08 : 0x000000, fog: false });
  g.add(mesh(new THREE.BoxGeometry(20, 150, 14), gold, -46, 75, 0)); g.add(mesh(new THREE.BoxGeometry(20, 150, 14), gold, 46, 75, 0));
  g.add(mesh(new THREE.BoxGeometry(112, 16, 14), gold, 0, 142, 0));
  g.add(mesh(new THREE.BoxGeometry(112, 8, 16), lam(0x5a4b3a), 0, 4, 0));
};
LB.wtc = (g) => { const m = windowMaterial(C.look.windows); m.color.set(0xd9d2c0); g.add(mesh(new THREE.BoxGeometry(30, 150, 30), m, 0, 75, 0)); g.add(mesh(new THREE.BoxGeometry(60, 20, 60), lam(0xcfc6b2), 0, 10, 0)); };
let wheel = null;
LB.ainDubai = (g) => {
  g.add(mesh(CYL(60, 70, 4, 20), lam(0xd9c9a3), 0, 1, 0));
  wheel = new THREE.Group(); wheel.position.y = 130;
  const steel = lam(0xe6e9ec, { fog: false, emissive: C.look.night > 0.3 ? 0x332244 : 0x000000 });
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(120, 2.2, 6, 64), steel));
  for (let k = 0; k < 24; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 120, 0.8), steel); sp.rotation.z = k / 24 * Math.PI * 2; sp.position.set(-Math.sin(sp.rotation.z) * 60, Math.cos(sp.rotation.z) * 60, 0); wheel.add(sp); }
  for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2; const cab = new THREE.Mesh(new THREE.SphereGeometry(3.2, 8, 6), lam(0xbfd9ea, { fog: false, emissive: C.look.night > 0.3 ? 0x6688cc : 0x000000 })); cab.position.set(Math.cos(a) * 123, Math.sin(a) * 123, 0); wheel.add(cab); }
  g.add(wheel);
  for (const s of [-1, 1]) { const leg = mesh(new THREE.BoxGeometry(4, 140, 4), steel, s * 20, 65, 0); leg.rotation.z = -s * 0.15; g.add(leg); }
};
LB.marina = (g) => {
  const cols = [0x9ab0c0, 0xc9d1d8, 0x6f879a, 0xb7a58a, 0x8fa9b8];
  for (let i = 0; i < 16; i++) {
    const h = 120 + Math.random() * 200, w = 22 + Math.random() * 14; const x = (Math.random() - 0.5) * 380, z = (Math.random() - 0.5) * 260;
    const m = windowMaterial(C.look.windows); m.color.set(mpick(cols));
    if (i === 0) { // twisted tower
      for (let k = 0; k < 30; k++) { const sl = mesh(new THREE.BoxGeometry(w, 10, w), m, x, k * 10 + 5, z); sl.rotation.y = k * Math.PI / 2 / 30; g.add(sl); }
    } else g.add(mesh(new THREE.BoxGeometry(w, h, w), m, x, h / 2, z));
  }
  g.traverse((o) => { if (o.material) o.material.fog = false; });
};
LB.jumeirahMosque = (g) => {
  const st = lam(0xe8d9bd);
  g.add(mesh(new THREE.BoxGeometry(50, 14, 40), st, 0, 7, 0));
  g.add(mesh(new THREE.SphereGeometry(11, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), st, 0, 14, 0));
  for (const x of [-16, 16]) g.add(mesh(new THREE.SphereGeometry(5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), st, x, 14, 8));
  for (const s of [-1, 1]) { g.add(mesh(CYL(1.6, 2, 46, 8), st, s * 30, 23, -18)); g.add(mesh(new THREE.ConeGeometry(2.1, 5, 8), st, s * 30, 48.5, -18)); }
};

function buildLandmarks() {
  for (const lm of LMS) {
    const g = new THREE.Group();
    (LB[lm.build] || LB.fountain)(g, lm);
    let x = lm.x, z = lm.z;
    if (lm.dist < HW + (lm.clear || 60)) {
      const o = {}; curveAt(lm.s, lm.side * (HW + (lm.clear || 60) + 10), o); x = o.x; z = o.z;
    }
    const y = lm.sea ? -0.5 : groundH(x, z) - 0.5;
    g.position.set(x, y, z);
    const o = {}; curveAt(lm.s, 0, o);
    g.rotation.y = Math.atan2(o.x - x, o.z - z); // face the road
    scene.add(g);
  }
}

// ---------- traffic ----------
const SAME = [], ONC = [];
let trafficLevel = 1;
function makeTrafficCar(onc) {
  const m = new THREE.Mesh(BOX, carMat); m.castShadow = true;
  const lm = new THREE.Mesh(BOX, lightMat); m.add(lm); m.userData.lights = lm; scene.add(m);
  return { mesh: m, t: 0, d: 0, lane: 0, tl: 0, v: 0, vt: 0, len: 4.6, wid: 1.8, onc, kind: '', honked: 0, passed: false };
}
function assignType(car) {
  const ty = mpick(C.traffic);
  const body = mpick(ty.colors);
  const cg = carGeo(ty.kind, body, ty.extra);
  car.mesh.geometry = cg.g; car.mesh.userData.lights.geometry = cg.lg; car.len = cg.len; car.wid = cg.wid;
  car.kind = ty.kind; car.wild = ty.wild || 0;
  car.vt = mr(ty.speed[0], ty.speed[1]) / 3.6 * (trafficLevel === 2 ? 0.7 : 1);
  car.v = car.vt;
}
function laneClear(t, lane, except, back, front) {
  const d = laneD(lane);
  if (Math.abs(player.d - d) < 2.4 && player.t - t > -back && player.t - t < front) return false;
  for (const c of SAME) { if (c === except) continue; if ((Math.abs(c.d - d) < 2.6 || c.tl === lane) && c.t - t > -back && c.t - t < front) return false; }
  return true;
}
function spawnSame(car, ahead) {
  assignType(car);
  for (let tries = 0; tries < 12; tries++) {
    const lane = Math.floor(Math.random() * LANES);
    const t = ahead ? player.t + mr(250, 950) : player.t - mr(120, 260);
    if (laneClear(t, lane, car, 18, 18)) { car.t = t; car.lane = car.tl = lane; car.d = laneD(lane); car.passed = car.t < player.t; return; }
  }
  car.t = player.t + 2000; car.lane = car.tl = 0; car.d = laneD(0);
}
function resetTraffic() {
  for (const c of SAME) scene.remove(c.mesh); for (const c of ONC) scene.remove(c.mesh);
  SAME.length = 0; ONC.length = 0;
  const n = [Math.round(14 * LANES / 3), Math.round(26 * LANES / 3), Math.round(42 * LANES / 3)][trafficLevel];
  for (let i = 0; i < n; i++) { const c = makeTrafficCar(false); SAME.push(c); assignType(c); spawnSame(c, true); c.t = player.t + mr(30, 950); if (!laneClear(c.t, c.lane, c, 14, 14)) c.t += 1500; }
  for (let i = 0; i < Math.round(n * 0.6); i++) { const c = makeTrafficCar(true); ONC.push(c); assignType(c); c.t = player.t + mr(-150, 1100); c.lane = Math.floor(Math.random() * LANES); c.d = -laneD(c.lane); }
}
function updateTraffic(dt, honk) {
  const all = SAME;
  for (const c of all) {
    // leader search
    let gap = 1e9, lv = 0;
    for (const o of all) { if (o === c) continue; if (Math.abs(o.d - c.d) < 2.2) { const g = o.t - c.t - (o.len + c.len) / 2; if (g > -1 && g < gap) { gap = g; lv = o.v; } } }
    if (Math.abs(player.d - c.d) < 2.2) {
      const g = player.t - c.t - (player.len + c.len) / 2; if (g > -1 && g < gap) { gap = g; lv = player.v; }
      // a car stuck behind you lets you know
      if (game.mode === 'drive' && !game.tour && g > -1 && g < 14 && c.vt > player.v + 4 && game.time > (c.honkT || 0)) { c.honkT = game.time + mr(5, 9); SND.otherHorn(c.d - player.d, g + 4, C.horn); }
    }
    let target = c.vt;
    const safe = c.close ? 5 + c.v * 0.18 : 8 + c.v * 0.9; // a tailgater sits much closer than other drivers
    if (gap < safe) target = Math.min(target, lv * (gap < safe * 0.5 ? 0.85 : 1));
    if (gap < 3) target = 0;
    const acc = target > c.v ? 2.2 : 6.5;
    c.v += clamp(target - c.v, -acc * dt, acc * dt * 1.0); c.v = Math.max(0, c.v);
    // lane changes
    if (c.tl === c.lane) {
      const want = (gap < safe * 1.4 && c.vt > lv + 2) || Math.random() < dt * (0.01 + c.wild * 0.08);
      const honked = honk && c.t > player.t && c.t - player.t < 55 && Math.abs(c.d - player.d) < 2.4;
      if ((want || honked) && !c.fixed) {
        const opts = [c.lane - 1, c.lane + 1].filter((l) => l >= 0 && l < LANES).sort(() => Math.random() - 0.5);
        for (const l of opts) if (laneClear(c.t, l, c, c.wild ? 6 : 12, c.wild ? 8 : 14)) { c.tl = l; if (honked) c.honked = 1; break; }
      }
    } else {
      const td = laneD(c.tl); const step = (2.0 + c.wild * 1.5) * dt;
      if (Math.abs(td - c.d) <= step) { c.d = td; c.lane = c.tl; } else c.d += Math.sign(td - c.d) * step;
    }
    if (c.tl === c.lane) c.d += (laneD(c.lane) - c.d) * Math.min(1, dt * 3);
    c.t += c.v * dt;
    const rel = c.t - player.t;
    if (rel < -320 || rel > 1250) { if (c.special) c.gone = true; else spawnSame(c, rel < 0); }
  }
  for (const c of ONC) {
    c.t -= c.vt * dt;
    if (c.t - player.t < -250) { assignType(c); c.t = player.t + mr(900, 1300); c.lane = Math.floor(Math.random() * LANES); c.d = -laneD(c.lane); }
  }
}

// ---------- road events: an ambulance, a wedding convoy, a car flashing its lights ----------
// one at a time, every minute or so; each pays points when you do the right thing
const NITRO_SWEET = [0.7, 0.86];
const ev = { kind: null, cars: [], t: 0, scored: false, warned: false, blockT: 0, flashT: 0, honkT: 0, last: '' };
const glowMat = (color) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
function evCar(kind, body, extra, lane, t, v) {
  const c = makeTrafficCar(false), cg = carGeo(kind, body, extra);
  c.mesh.geometry = cg.g; c.mesh.userData.lights.geometry = cg.lg;
  Object.assign(c, { len: cg.len, wid: cg.wid, kind, wild: 0, special: true, t, lane, tl: lane, d: laneD(lane), v, vt: v, passed: t < player.t, top: cg.tailY + 0.16 });
  SAME.push(c); ev.cars.push(c);
  return c;
}
function evAdd(c, color, x, y, z, w, h, l, ry) { const m = new THREE.Mesh(BOX, glowMat(color)); m.position.set(x, y, z); m.scale.set(w, h, l); if (ry) m.rotation.y = ry; c.mesh.add(m); return m; }
function evStart(kind) {
  evEnd(); ev.kind = kind; ev.t = 0; ev.scored = false; ev.warned = false; ev.blockT = 0; ev.flashT = 0; ev.honkT = 2; ev.last = kind;
  const lane = player.laneT;
  if (kind === 'amb') {
    const c = evCar('coaster', 0xf6f6f2, { stripe: 0xd3202a }, lane, player.t - 120, Math.max(player.v + 12, 95 / 3.6));
    c.bar = [evAdd(c, 0xff2020, -0.45, 2.55, -c.len / 2 + 0.6, 0.7, 0.18, 0.32), evAdd(c, 0x2a6bff, 0.45, 2.55, -c.len / 2 + 0.6, 0.7, 0.18, 0.32)];
  } else if (kind === 'wed') {
    // the convoy keeps to a lane next to yours, a little slower than you
    const wl = lane + 1 < LANES ? lane + 1 : lane - 1 >= 0 ? lane - 1 : lane, v = clamp(player.v * 0.72, 45 / 3.6, 70 / 3.6);
    for (let i = 0; i < 3; i++) {
      const c = evCar('sedan', 0xf7f7f2, null, wl, player.t + 240 + i * 11, v); c.fixed = true;
      for (const s of [-1, 1]) evAdd(c, 0xff6fa8, 0, c.top + 0.03, -c.len / 2 + 1.0, 0.07, 0.03, 1.9, s * 0.42);
      [0xff4f8b, 0xffffff, 0xff9ec4, 0xe8233f].forEach((col, k) => evAdd(c, col, (k - 1.5) * 0.22, c.top + 0.09, -c.len / 2 + 0.45, 0.17, 0.15, 0.17));
    }
  } else {
    const c = evCar('sedan', 0x16181c, null, lane, player.t - 80, Math.max(player.v + 7, 75 / 3.6)); c.close = true;
    c.beams = [-1, 1].map((s) => evAdd(c, 0xffffff, s * c.wid * 0.35, c.top - 0.14, -c.len / 2 - 0.05, 0.42, 0.16, 0.06));
  }
}
function evEnd() {
  for (const c of ev.cars) { scene.remove(c.mesh); const i = SAME.indexOf(c); if (i >= 0) SAME.splice(i, 1); }
  ev.cars = []; ev.kind = null; SND.siren(null); hud.beam.dataset.c = '';
}
function evPoints(n, msg) { game.extraPts += n; toast(msg, 'good'); SND.cue('bonus'); vibrate([20, 30, 20]); }
function roadEvent(dt, hornTap) {
  if (!ev.kind) {
    if (game.tour || player.v < 12) return '';
    game.evT -= dt; if (game.evT > 0) return '';
    game.evT = mr(45, 80);
    evStart(mpick(['amb', 'wed', 'tail'].filter((k) => k !== ev.last)));
  }
  ev.t += dt;
  let txt = '', beam = '';
  if (ev.cars.some((c) => c.gone) || ev.t > 75) { evEnd(); return ''; }
  if (ev.kind === 'amb') {
    const c = ev.cars[0], behind = player.t - c.t, same = Math.abs(c.d - player.d) < 2.2;
    c.vt = Math.min(200 / 3.6, Math.max(c.vt, player.v + 8));
    // from far back it heads for your lane, so you have to let it through
    if (behind > 45 && c.tl === c.lane && Math.abs(laneD(player.laneT) - c.d) > 1 && laneClear(c.t, player.laneT, c, 8, 12)) c.tl = player.laneT;
    // cars ahead of it move over when they can
    for (const o of SAME) {
      if (o.special || o.tl !== o.lane || Math.abs(o.d - c.d) > 2 || o.t < c.t || o.t - c.t > 80) continue;
      for (const l of [o.lane - 1, o.lane + 1]) if (l >= 0 && l < LANES && laneClear(o.t, l, o, 10, 12)) { o.tl = l; break; }
    }
    if (behind > 0 && behind < 45 && same) ev.blockT += dt;
    // it waits behind you a few seconds before it goes round
    c.fixed = behind > 0 && behind < 60 && same && ev.blockT < 4;
    if (ev.blockT > 2.5 && !ev.warned) { ev.warned = true; toast(T.ambBlock, 'bad'); SND.cue('bad'); }
    if (!ev.scored && c.t > player.t + 6) { ev.scored = true; if (ev.blockT <= 2.5) evPoints(250, T.ambThanks); }
    const on = Math.floor(ev.t * 6) % 2;
    c.bar[0].visible = !!on; c.bar[1].visible = !on;
    if (behind > -10 && behind < 160) txt = T.ambBehind;
    if (behind > 0 && behind < 70) beam = on ? 'red' : 'blue';
    SND.siren(c.d - player.d, Math.hypot(c.t - player.t, c.d - player.d));
    if (c.t - player.t > 350) evEnd();
  } else if (ev.kind === 'wed') {
    const left = ev.cars.filter((c) => !c.cheered);
    // the convoy honks in its own rhythm
    ev.honkT -= dt;
    const near = ev.cars.reduce((m, c) => (Math.abs(c.t - player.t) < Math.abs(m.t - player.t) ? c : m), ev.cars[0]);
    if (ev.honkT <= 0 && Math.abs(near.t - player.t) < 220) { ev.honkT = mr(2.5, 4.5); SND.otherHorn(near.d - player.d, Math.abs(near.t - player.t) + 3, C.horn, [[0, 0.1], [0.16, 0.1], [0.32, 0.1], [0.52, 0.35]]); }
    if (hornTap) {
      const c = left.find((o) => Math.abs(o.t - player.t) < 8 && Math.abs(o.d - player.d) < 5.5);
      if (c) { c.cheered = true; evPoints(100, T.mabrook); SND.otherHorn(c.d - player.d, 4, C.horn, [[0.2, 0.1], [0.36, 0.1], [0.52, 0.3]]); }
    }
    const ahead = ev.cars[ev.cars.length - 1].t - player.t;
    if (left.length && ahead > -10 && ahead < 320) txt = T.wedAhead;
    if (!left.length || ev.cars[ev.cars.length - 1].t < player.t - 150) evEnd();
  } else {
    const c = ev.cars[0], gap = player.t - c.t - (c.len + player.len) / 2, same = Math.abs(c.d - player.d) < 2.2;
    if (!ev.scored) c.vt = Math.max(c.vt, player.v + 7);
    // right behind you it holds your lane; further back it may go round other cars to reach you
    c.fixed = !ev.scored && same && gap > 0 && gap < 25;
    // close behind you in your lane it flashes its high beams: two quick flashes, then a pause
    const flashing = c.fixed && gap < 18;
    if (flashing) ev.flashT += dt;
    const ph = ev.flashT % 1.2, lit = flashing && (ph < 0.12 || (ph > 0.24 && ph < 0.36));
    c.beams.forEach((b) => { b.visible = lit; });
    if (lit) beam = 'white';
    if (!ev.scored && ev.flashT > 0.3) txt = T.tailBehind;
    if (!ev.scored && ev.flashT > 0.3 && !same && gap > -2 && gap < 35) { ev.scored = true; c.vt = player.v + 12; evPoints(120, T.tailOk); }
    else if (!ev.scored && ev.flashT > 10) { ev.scored = true; c.vt = player.v + 12; }
    if (!ev.scored && c.tl === c.lane && Math.abs(laneD(player.laneT) - c.d) > 1 && gap > 25 && laneClear(c.t, player.laneT, c, 8, 12)) c.tl = player.laneT;
    if (c.t - player.t > 300) evEnd();
  }
  if (hud.beam.dataset.c !== beam) hud.beam.dataset.c = beam;
  return txt;
}

// ---------- player ----------
const player = { t: 0, d: laneD(0), v: 0, cruise: 0, lat: 0, steer: 0, laneT: 0, len: 4.6, wid: 1.85, dmg: 0, group: null, brakeMat: null, input: {}, slip: 0 };
const brakeMat = new THREE.MeshBasicMaterial({ color: 0x550000, toneMapped: false });
let plateTex = null;
function drawPlate() {
  if (!plateTex) { plateTex = canvasTex(512, 128, () => {}); }
  const cv = plateTex.image; const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
  C.drawPlate(g, cv.width, cv.height, settings.plate || C.defaultPlate); plateTex.needsUpdate = true;
}
function buildPlayer() {
  if (player.group) {
    player.group.traverse((o) => { if (o.userData.own) o.geometry.dispose(); });
    scene.remove(player.group);
  }
  const car = CARS[settings.car] || CARS[0];
  const kind = car.kind;
  const cg = carGeo(kind, car.fixedColor || settings.color, car.extra);
  const g = new THREE.Group();
  const m = new THREE.Mesh(cg.g, carMat); m.castShadow = true; g.add(m);
  g.add(new THREE.Mesh(cg.lg, lightMat));
  player.len = cg.len; player.wid = cg.wid;
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(cg.wid * 0.23, 0.13, 0.03), brakeMat); b.userData.own = true; b.position.set(s * cg.wid * 0.36, cg.tailY, cg.len / 2 + 0.045); g.add(b); }
  player.brakeMat = brakeMat;
  if (!plateTex) drawPlate();
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.13), new THREE.MeshBasicMaterial({ map: plateTex })); plate.userData.own = true;
  plate.position.set(0, Math.max(0.42, cg.tailY - 0.25), cg.len / 2 + 0.1); g.add(plate);
  player.group = g; scene.add(g);
  const vm = car.vmax / 3.6; player.vmax = vm; player.accel = car.accel; player.grip = car.grip; player.tough = car.tough || 1;
}
function plateTexture(text) { return canvasTex(512, 128, (g, w, h) => C.drawPlate(g, w, h, text || C.defaultPlate)); }

// ---------- state ----------
const CARS = C.cars;
const settings = Object.assign({ car: 0, color: C.colors[0], plate: C.defaultPlate, cam: 1, hornSide: 'right', hornSize: 'normal', sound: 1, volEngine: 70, volFx: 80, dir: 1, traffic: 1, trip: 0, quality: (matchMedia('(pointer: coarse)').matches ? 'low' : 'high'),
  control: 'stick', steerFeel: 50, brakeFeel: 50, fx: 1, mini: 1, volHorn: 80, volMusic: 60, music: 1, vib: 2, station: 0, autoQ: 1, time: 'auto', weather: 0, hornStyle: 'city' }, store.get('settings', {}));
function saveSettings() { store.set('settings', settings); }

const game = { mode: 'menu', time: 0, dist: 0, startT: 0, tripLen: 0, dest: null, weaves: 0, combo: 0, comboT: 0, weavePts: 0, radar: 0, crashes: 0, fines: 0, tolls: 0, bumps: 0, bonus: 0, nextBonus: 10000, nextShop: 25000, crashCool: 0, shake: 0, lastS: 0, paused: false, free: false, lap: false, count: 0, nitro: 0, boost: 0, boostCap: 1, boostK: 1, extraPts: 0, nitroReq: false, evT: 40, hornWas: false };

// ---------- input ----------
const keys = {};
const touch = { left: false, right: false, gas: false, brake: false, horn: false };
// analog stick: x to the right, y up, both -1..1
const stick = { on: false, x: 0, y: 0, sx: 0, sy: 0, id: null, ox: 0, oy: 0, zone: '' };
const tilt = { x: 0, ok: false };
addEventListener('keydown', (e) => {
  if (e.target && e.target.tagName === 'INPUT') return;
  keys[e.code] = true;
  if (e.repeat && ['KeyC', 'KeyP', 'Escape'].includes(e.code)) return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if ((e.code === 'KeyN' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !e.repeat) game.nitroReq = true;
  if (e.code === 'KeyC') { settings.cam = (settings.cam + 1) % 3; saveSettings(); syncSettingsUI(); }
  if ((e.code === 'KeyP' || e.code === 'Escape') && game.mode === 'drive') togglePause();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
function resetInputs() {
  for (const k of Object.keys(keys)) keys[k] = false;
  for (const k of Object.keys(touch)) touch[k] = false;
  stickRelease(); if (typeof wheelRelease === 'function') wheelRelease();
  document.querySelectorAll('[data-hold]').forEach((el) => el.classList.remove('on'));
}
addEventListener('blur', () => { resetInputs(); if (game.mode === 'drive' && !game.paused && !tourEndShown()) togglePause(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { resetInputs(); if (game.mode === 'drive' && !game.paused && !tourEndShown()) togglePause(); }
});
function bindHold(el, key) {
  const on = (e) => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } touch[key] = true; el.classList.add('on'); audioInit(); };
  const off = (e) => { e.preventDefault(); touch[key] = false; el.classList.remove('on'); };
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off);
}
document.querySelectorAll('[data-hold]').forEach((el) => bindHold(el, el.dataset.hold));
$('#btnNitro').addEventListener('pointerdown', (e) => { e.preventDefault(); game.nitroReq = true; audioInit(); });

// the stick: fixed at the bottom ("stick"), or it jumps under your thumb ("onehand", "tilt")
const stickEl = $('#stick'), knobEl = $('#knob');
const fills = { up: stickEl.querySelectorAll('.fil.up'), dn: stickEl.querySelectorAll('.fil.dn') };
// how far into the gas or brake zone the thumb is, 0..1, past a small dead zone
const pushAmt = (v) => clamp((v - 0.25) / 0.55, 0, 1);
function stickMove(px, py) {
  const r = stickEl.offsetWidth * 0.42 || 60;
  let dx = px - stick.ox, dy = py - stick.oy; const len = Math.hypot(dx, dy);
  if (len > r) { dx *= r / len; dy *= r / len; }
  stick.x = dx / r; stick.y = -dy / r;
  knobEl.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`;
  const g = pushAmt(stick.y), b = pushAmt(-stick.y);
  fills.up.forEach((el) => { el.style.strokeDasharray = `${g * 100} 200`; });
  fills.dn.forEach((el) => { el.style.strokeDasharray = `${b * 100} 200`; });
  const zone = g > 0 ? 'gas' : b > 0 ? 'brake' : '';
  if (zone && zone !== stick.zone) vibrate(8);
  stick.zone = zone;
  stickEl.classList.toggle('gas', zone === 'gas'); stickEl.classList.toggle('brake', zone === 'brake');
  stickEl.classList.toggle('left', stick.x < -0.3); stickEl.classList.toggle('right', stick.x > 0.3);
}
function stickPress(e) {
  if (stick.on || game.mode !== 'drive') return;
  e.preventDefault(); audioInit();
  const floating = settings.control === 'onehand' || settings.control === 'tilt';
  if (floating) { stickEl.style.left = e.clientX + 'px'; stickEl.style.top = e.clientY + 'px'; stickEl.style.bottom = 'auto'; stickEl.style.transform = 'translate(-50%, -50%)'; stick.ox = e.clientX; stick.oy = e.clientY; }
  else { const b = stickEl.getBoundingClientRect(); stick.ox = b.left + b.width / 2; stick.oy = b.top + b.height / 2; }
  stick.on = true; stick.id = e.pointerId; $('#touch').classList.add('held');
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  stickMove(e.clientX, e.clientY);
}
function stickRelease() {
  stick.on = false; stick.id = null; stick.x = 0; stick.y = 0; stick.sx = 0; stick.sy = 0; stick.zone = '';
  knobEl.style.transform = ''; stickEl.classList.remove('gas', 'brake', 'left', 'right');
  for (const el of [...fills.up, ...fills.dn]) el.style.strokeDasharray = '0 200';
  stickEl.style.left = stickEl.style.top = stickEl.style.bottom = stickEl.style.transform = '';
  $('#touch').classList.remove('held');
}
for (const el of [stickEl, $('#ctl')]) {
  el.addEventListener('pointerdown', stickPress);
  el.addEventListener('pointermove', (e) => { if (stick.on && e.pointerId === stick.id) { e.preventDefault(); stickMove(e.clientX, e.clientY); } });
  for (const ev of ['pointerup', 'pointercancel']) el.addEventListener(ev, (e) => { if (e.pointerId === stick.id) stickRelease(); });
}
// tilt: turn the phone like a wheel; works upright and sideways
function screenAngle() { try { return screen.orientation ? screen.orientation.angle : (window.orientation || 0); } catch (e) { return 0; } }
addEventListener('deviceorientation', (e) => {
  if (e.gamma == null) return;
  tilt.ok = true;
  const a = screenAngle();
  const deg = a === 90 ? e.beta : a === -90 || a === 270 ? -e.beta : a === 180 ? -e.gamma : e.gamma;
  tilt.x = clamp(Math.abs(deg) < 3 ? 0 : (deg - Math.sign(deg) * 3) / 22, -1, 1);
});
// the wheel: drag around its middle to turn it, up to about a third of a turn each way; let go and it springs back
const wheelEl = $('#wheel'), wheelSvg = wheelEl.querySelector('svg');
const wheelIn = { on: false, x: 0, ang: 0, last: 0, id: null };
const angAt = (e) => { const b = wheelEl.getBoundingClientRect(); return Math.atan2(e.clientY - (b.top + b.height / 2), e.clientX - (b.left + b.width / 2)); };
wheelEl.addEventListener('pointerdown', (e) => {
  if (game.mode !== 'drive' || wheelIn.on) return;
  e.preventDefault(); audioInit(); wheelIn.on = true; wheelIn.id = e.pointerId; wheelIn.last = angAt(e); wheelEl.classList.add('held');
  try { wheelEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
});
wheelEl.addEventListener('pointermove', (e) => {
  if (!wheelIn.on || e.pointerId !== wheelIn.id) return;
  e.preventDefault();
  const a = angAt(e); let da = a - wheelIn.last; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; wheelIn.last = a;
  const before = Math.abs(wheelIn.ang) > 1.9;
  wheelIn.ang = clamp(wheelIn.ang + da, -2.27, 2.27);
  if (!before && Math.abs(wheelIn.ang) > 1.9) vibrate(10);
  // a little dead zone in the middle, then a gentle curve so small turns stay small
  const r = Math.max(0, Math.abs(wheelIn.ang) - 0.08) / 1.75;
  wheelIn.x = Math.sign(wheelIn.ang) * Math.min(1, Math.pow(r, 1.3));
  wheelSvg.style.transform = `rotate(${wheelIn.ang}rad)`;
});
for (const ev of ['pointerup', 'pointercancel']) wheelEl.addEventListener(ev, (e) => { if (e.pointerId === wheelIn.id) wheelRelease(); });
function wheelRelease() { wheelIn.on = false; wheelIn.id = null; wheelIn.x = 0; wheelIn.ang = 0; wheelSvg.style.transform = ''; wheelEl.classList.remove('held'); }
function askTilt() {
  try { if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().catch(() => {}); } catch (e) { /* ignore */ }
}
function applyControls() {
  const t = $('#touch');
  t.dataset.mode = settings.control;
  t.classList.toggle('horn-left', settings.hornSide === 'left');
  t.classList.toggle('horn-small', settings.hornSize === 'small');
  $('#fx').hidden = !settings.fx;
  $('#mini').hidden = !settings.mini;
}

// ---------- sound (see audio.js) ----------
function audioInit() { SND.unlock(); SND.apply(settings); }
const vibrate = (p) => SND.vibrate(p);
SND.radio.setStations(C.radio || []);
SND.apply(settings);

// ---------- HUD ----------
const hud = {
  speed: $('#hSpeed'), limit: $('#hLimit'), time: $('#hTime'), score: $('#hScore'), viol: $('#hViol'), dmg: $('#hDmgBar'),
  next: $('#hNext'), remain: $('#hRemain'), toast: $('#toast'), warn: $('#warn'), weave: $('#hWeave'), gear: $('#hGear'), rpm: $('#hRpm'), nitro: $('#hNitro'), nitroBtn: $('#btnNitro'), beam: $('#beam')
};
let toastTimer = 0;
function toast(msg, kind) { hud.toast.textContent = msg; hud.toast.className = 'toast show ' + (kind || ''); toastTimer = 2.4; }
const mini = $('#mini'); const mctx = mini.getContext('2d');
let miniPath = null, miniScale = 1, miniOff = [0, 0];
function prepMini() {
  const w = maxX - minX, d = maxZ - minZ; const size = 300; miniScale = (size - 30) / Math.max(w, d);
  miniOff = [(size - w * miniScale) / 2 - minX * miniScale, (size - d * miniScale) / 2 - minZ * miniScale];
  miniPath = new Path2D();
  for (let i = 0; i <= N; i += 4) { const x = PX[i] * miniScale + miniOff[0], y = PZ[i] * miniScale + miniOff[1]; if (i === 0) miniPath.moveTo(x, y); else miniPath.lineTo(x, y); }
  miniPath.closePath();
}
function drawMini(px, pz) {
  const g = mctx; g.clearRect(0, 0, 300, 300);
  g.lineJoin = 'round'; g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 11; g.stroke(miniPath);
  g.strokeStyle = C.look.miniRoad; g.lineWidth = 6; g.stroke(miniPath);
  for (const lm of LMS) { g.fillStyle = (game.dest && game.dest === lm) ? C.look.miniDest : C.look.miniDot; const x = lm.x * miniScale + miniOff[0], y = lm.z * miniScale + miniOff[1]; g.beginPath(); g.arc(x, y, game.dest === lm ? 9 : 5, 0, 7); g.fill(); }
  g.fillStyle = C.look.miniMe; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(px * miniScale + miniOff[0], pz * miniScale + miniOff[1], 9, 0, 7); g.fill(); g.stroke();
}

// ---------- trips ----------
function orderedLandmarks() {
  // landmarks in travel order for the chosen direction, starting at landmark 0
  const base = LMS[0].s;
  return LMS.slice().sort((a, b) => aheadDist(base, a.s) - aheadDist(base, b.s));
}
function tripList() {
  const ord = orderedLandmarks(); const out = [];
  for (let i = 0; i < ord.length; i++) {
    const a = ord[i], b = ord[(i + C.tripHop) % ord.length];
    out.push({ from: a, to: b, len: aheadDist(a.s, b.s) });
  }
  out.push({ lap: true, from: ord[0], to: ord[0], len: L });
  out.push({ free: true, from: ord[0], to: null, len: 0 });
  return out;
}

// ---------- game flow ----------
function startTrip(opts) {
  opts = opts || {};
  resetInputs();
  audioInit();
  DIR = settings.dir;
  const trips = tripList(); const tr = trips[opts.free ? trips.length - 1 : Math.min(settings.trip, trips.length - 1)];
  trafficLevel = opts.traffic != null ? opts.traffic : settings.traffic;
  player.t = tOfS(tr.from.s) + 30; player.d = laneD(Math.min(1, LANES - 1)); player.v = 0; player.cruise = 40 / 3.6; player.lat = 0; player.steer = 0; player.laneT = Math.min(1, LANES - 1); player.dmg = 0;
  Object.assign(game, { mode: 'drive', time: 0, dist: 0, startT: player.t, tripLen: tr.free ? 0 : tr.len - 30, dest: tr.free ? null : tr.to, weaves: 0, combo: 0, comboT: 0, weavePts: 0, radar: 0, crashes: 0, fines: 0, tolls: 0, bumps: 0, bonus: 0, nextBonus: 10000, nextShop: 25000, crashCool: 0, shake: 0, nitro: 0, boost: 0, boostCap: 1, boostK: 1, extraPts: 0, nitroReq: false, evT: mr(25, 45), paused: false, free: !!tr.free, lap: !!tr.lap, trip: tr, tour: !!opts.tour, lastOpts: opts.tour ? { free: true } : opts });
  game.lastS = sOfT(player.t); for (const ev of events) ev.lastT = null;
  evEnd(); resetTraffic();
  showScreen(null);
  $('#hud').hidden = false; $('#touch').hidden = !isTouch();
  hud.limit.textContent = C.limit;
  hud.next.textContent = tr.free ? T.freeDrive : tr.to.name;
  if (!opts.tour) toast(tr.free ? T.freeHint : T.goTo + ' ' + tr.to.name);
  game.count = opts.tour ? 0 : 3; game.countN = 4; player.cruise = opts.tour ? player.cruise : 0;
  radioStart();
}
// 3, 2, 1, go: the car waits at the line, then sets off
function countdown(dt) {
  game.count -= dt;
  const n = Math.ceil(game.count), el = $('#count');
  if (n !== game.countN) {
    game.countN = n; el.hidden = false; el.textContent = n > 0 ? n : T.go;
    el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
    SND.cue(n > 0 ? 'count' : 'go'); vibrate(n > 0 ? 8 : [12, 30, 12]);
    if (n <= 0) { player.cruise = 40 / 3.6; setTimeout(() => { if (game.count <= 0) el.hidden = true; }, 800); }
  }
}
// the car radio: picks up where you left it; the button moves to the next station and then off
function radioStart() {
  if (!settings.music || !(C.radio || []).length || settings.station < 0) { SND.radio.stop(); radioLabel(); return; }
  if (SND.radio.current !== settings.station) SND.radio.play(settings.station);
  SND.radio.pause(false);
  radioLabel();
}
function radioLabel() {
  const i = settings.music ? SND.radio.current : -1, b = $('#btnRadio');
  $('#radioName').textContent = i >= 0 ? T['radio' + i] : T.radioOff; b.classList.toggle('on', i >= 0);
}
$('#btnRadio').onclick = () => {
  audioInit();
  if (!settings.music) { settings.music = 1; settings.station = Math.max(0, settings.station); saveSettings(); SND.apply(settings); SND.radio.play(settings.station); }
  else { const i = SND.radio.next(); settings.station = i == null ? settings.station : i; saveSettings(); }
  const b = $('#btnRadio'); b.classList.remove('tuning'); void b.offsetWidth; b.classList.add('tuning');
  setTimeout(() => { radioLabel(); toast(settings.station >= 0 && settings.music ? '\u266A ' + T['radio' + settings.station] : T.radioOff); }, 380);
};
const sizeOf = (k) => (k === 'truck' || k === 'bus' || k === 'coaster' ? 'truck' : k === 'pickup' || k === 'suv' ? 'van' : 'car');
// engine, road and wind follow the car every frame; the dashboard shows the gear the engine is in
function soundFrame() {
  const live = game.mode === 'drive' && !game.paused;
  const car = CARS[settings.car] || CARS[0];
  const d = SND.drive({ live, idle: !live, kind: car.kind, kmh: player.v * 3.6, vmax: car.vmax, gas: !!player.input.gas && game.count <= 0, brake: !!player.input.brake, brakeAmt: player.input.brakeAmt || 0, cruising: player.input.cruising, slip: player.slip });
  if (live) { hud.gear.textContent = d.gear; hud.rpm.style.width = Math.round(d.rpm * 100) + '%'; }
  if (!live) SND.horn(false);
}
function finishTrip(reason) {
  game.mode = 'done'; evEnd(); resetInputs(); SND.cue(reason === 'arrive' ? 'finish' : 'wreck'); SND.radio.pause(true); $('#count').hidden = true;
  $('#hud').hidden = true; $('#touch').hidden = true;
  const score = computeScore();
  const key = 'best:' + settings.dir + ':' + settings.trip;
  const best = store.get(key, 0); if (reason === 'arrive' && score > best) store.set(key, score);
  $('#rTitle').textContent = reason === 'arrive' ? T.arrived : T.wrecked;
  $('#rSub').textContent = reason === 'arrive' ? (game.dest ? game.dest.name : '') : T.wreckedSub;
  const rows = [
    [T.rTime, fmtTime(game.time)], [T.rDist, (game.dist / 1000).toFixed(1) + ' ' + T.km], [T.rAvg, fmt(game.time > 0 ? game.dist / game.time * 3.6 : 0) + ' ' + T.kmh],
    [T.rWeave, fmt(game.weaves)], [T.rRadar, fmt(game.radar)], [T.rCrash, fmt(game.crashes)], [T.rFines, fmt(game.fines) + ' ' + C.currency]
  ];
  if (game.extraPts) rows.push([T.rExtra, '+' + fmt(game.extraPts)]);
  if (C.tollsAt) rows.push([T.tollName, fmt(game.tolls) + ' ' + C.currency]);
  $('#rStats').innerHTML = rows.map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join('');
  $('#rScore').textContent = fmt(score);
  $('#rBest').textContent = reason === 'arrive' ? (score > best ? T.newBest : T.best + ' ' + fmt(best)) : '';
  const viol = game.radar + game.crashes;
  $('#rRate').textContent = reason !== 'arrive' ? T.rateBad : viol === 0 && game.weaves >= 5 ? T.rateTop : viol <= 2 ? T.rateMid : T.rateBad;
  showScreen('#result');
}
function computeScore() { return Math.max(0, Math.round(game.dist / 10 + game.weavePts + game.extraPts + game.bonus - game.radar * 250 - game.crashes * 400)); }
function tourEndShown() { return !$('#tourEnd').hidden; }
function togglePause() {
  if (game.mode !== 'drive' || tourEndShown()) return;
  game.paused = !game.paused;
  SND.radio.pause(game.paused); if (game.paused) { SND.siren(null); hud.beam.dataset.c = ''; }
  showScreen(game.paused ? '#pause' : null);
  if (tour) $('#tour').hidden = game.paused;
}
function toMenu() { evEnd(); SND.radio.stop(); $('#count').hidden = true; if (tour) { tour = null; $('#tour').hidden = true; } resetInputs(); renderTrips(); game.mode = 'menu'; game.paused = false; $('#hud').hidden = true; $('#touch').hidden = true; showScreen('#menu'); placeMenuCar(); }
function showScreen(sel) { document.querySelectorAll('.screen').forEach((s) => { s.hidden = ('#' + s.id) !== sel; }); }
const isTouch = () => matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

// ---------- per-frame ----------
const P = {}, Q = {};
function step(dt) {
  if (game.mode !== 'drive' || game.paused) return;
  if (game.count > 0) { countdown(dt); return; }
  game.time += dt;
  // keyboard, buttons and the stick all feed the same three amounts
  let gasAmt = keys.ArrowUp || keys.KeyW || touch.gas ? 1 : 0;
  let brakeAmt = keys.ArrowDown || keys.KeyS || touch.brake ? 1 : 0;
  let steerIn = (keys.ArrowRight || keys.KeyD || touch.right ? 1 : 0) - (keys.ArrowLeft || keys.KeyA || touch.left ? 1 : 0);
  if (stick.on) {
    // smooth out thumb jitter, and when the push is mostly up or down, ignore a little sideways drift
    const k = Math.min(1, dt * 22); stick.sx += (stick.x - stick.sx) * k; stick.sy += (stick.y - stick.sy) * k;
    const sx = Math.abs(stick.sx) < Math.abs(stick.sy) * 0.55 ? 0 : stick.sx;
    gasAmt = Math.max(gasAmt, pushAmt(stick.sy)); brakeAmt = Math.max(brakeAmt, pushAmt(-stick.sy));
    if (settings.control !== 'tilt' && Math.abs(sx) > 0.22 && !steerIn) steerIn = Math.sign(sx) * Math.min(1, (Math.abs(sx) - 0.22) / 0.45);
  }
  if (settings.control === 'tilt' && tilt.ok && !steerIn) steerIn = tilt.x;
  if (settings.control === 'wheel' && wheelIn.on && !steerIn) steerIn = wheelIn.x;
  const gas = gasAmt > 0, brake = brakeAmt > 0;
  const horn = keys.Space || keys.KeyH || touch.horn;
  // speed: the car cruises on its own; gas raises the cruise speed, brake lowers it
  const feel = 1.35 - 0.007 * settings.steerFeel; // light steering reacts faster
  let a = 0;
  if (gas) { a += player.accel * gasAmt * (1 - Math.pow(player.v / player.vmax, 2)); player.cruise = player.v; }
  if (brake) { a -= player.v > 0.5 ? (5 + 0.09 * settings.brakeFeel) * brakeAmt : 0; player.cruise = player.v; }
  if (gas || brake) a -= 0.25 + 0.0006 * player.v * player.v;
  else a += clamp((player.cruise - player.v) * 1.2, -2.5, player.accel * 0.6);
  // nitro: fire it for a burst; fired with the gauge in the gold part it pushes harder and pays points
  if (game.nitroReq) {
    game.nitroReq = false;
    if (game.boost <= 0 && game.nitro >= 0.25) {
      const perfect = game.nitro >= NITRO_SWEET[0] && game.nitro <= NITRO_SWEET[1];
      game.boost = 1.2 + game.nitro * 3; game.boostCap = perfect ? 1.25 : 1.15; game.boostK = perfect ? 1.3 : 1; game.nitro = 0;
      if (perfect) { game.extraPts += 150; toast(T.nitroPerfect, 'good'); vibrate([20, 30, 40]); } else vibrate(25);
      SND.nitro(perfect);
    }
  }
  // the cruise speed stays where it was, so the car eases back to it once the burst ends
  if (game.boost > 0) { game.boost -= dt; a += player.accel * 0.9 * game.boostK; }
  const dmgSlow = player.dmg > 60 ? 0.8 : 1;
  // past the top speed (after a boost, or once damage slows the car) ease back down instead of stopping dead
  const vCap = player.vmax * dmgSlow * (game.boost > 0 ? game.boostCap : 1);
  let nv = player.v + a * dt; if (nv > vCap) nv = Math.max(vCap, Math.min(nv, player.v) - 3 * dt);
  player.v = Math.max(0, nv);
  if (game.boost <= 0) player.cruise = Math.min(player.cruise, player.vmax * dmgSlow);
  // steering
  trackAt(player.t, player.d, P);
  // keys are on/off, so ease the input in and out to feel like turning a wheel
  const steer = Math.abs(steerIn) > 0.3 ? Math.sign(steerIn) : 0;
  player.steer += clamp(steerIn - player.steer, -dt * (steerIn ? 8 : 10) * feel, dt * (steerIn ? 8 : 10) * feel);
  let tgt = player.steer * (3.2 + Math.min(player.v, 30) * 0.13) * player.grip * feel * clamp(player.v / 6, 0, 1);
  // while steering, aim for the next lane over; let go and the car settles there, so a quick tap is a full lane change
  const lanePos = (player.d - MED - SH) / LW - 0.5;
  if (steer) {
    const lt = clamp(steer > 0 ? Math.ceil(lanePos + 0.05) : Math.floor(lanePos - 0.05), 0, LANES - 1);
    if (lt !== player.laneT && (stick.on || settings.control === 'tilt')) vibrate(10);
    player.laneT = lt;
  }
  if (Math.abs(player.steer) < 0.05 && player.v > 2) tgt += clamp((laneD(player.laneT) - player.d) * 1.1, -2.2, 2.2);
  player.lat += (tgt - player.lat) * Math.min(1, dt * 5.5);
  // curves only push you outward when you take them faster than the car's grip allows
  const need = Math.abs(P.k) * player.v * player.v, cap = 6.5 * player.grip;
  if (need > cap) player.lat -= Math.sign(P.k) * (need - cap) * 0.6 * dt;
  player.slip = need > cap ? (need - cap) / cap : Math.abs(player.lat) > 2.5 && player.v > 15 ? (Math.abs(player.lat) - 2.5) / 4 : 0;
  player.d += player.lat * dt;
  if (player.d < D_MIN || player.d > D_MAX) {
    player.d = clamp(player.d, D_MIN, D_MAX); player.lat *= -0.2;
    if (player.v > 8) { player.v *= 1 - 0.8 * dt; if (!game.tour) player.dmg += 4 * dt * player.tough; if (toastTimer <= 0) toast(T.scrape, 'bad'); vibrate(30); }
  }
  const prevT = player.t;
  player.t += player.v * dt;
  game.dist += player.v * dt;
  // traffic & collisions
  updateTraffic(dt, horn);
  if (game.crashCool > 0) game.crashCool -= dt;
  for (const c of SAME) {
    const dt2 = c.t - player.t, dd = c.d - player.d;
    const lenSum = (c.len + player.len) / 2, widSum = (c.wid + player.wid) / 2;
    if (Math.abs(dt2) < lenSum && Math.abs(dd) < widSum - 0.1 && game.crashCool <= 0) {
      game.crashCool = 1.2; if (!game.tour) { game.crashes++; game.fines += C.fines.crash; player.dmg += (8 + player.v * 0.35) * player.tough; } game.shake = 0.6; game.combo = 0;
      player.cruise = Math.min(player.cruise, player.v * 0.8);
      if (dt2 > 0) { player.v = Math.min(player.v, c.v) * 0.55; player.t = c.t - lenSum - 0.3; } else { c.v = Math.min(c.v, player.v) * 0.6; c.t = player.t - lenSum - 0.3; }
      player.lat = -Math.sign(dd || 1) * 3;
      if (Math.abs(dd) > 1) player.laneT = clamp(Math.round((player.d - MED - SH) / LW - 0.5 - Math.sign(dd) * 0.5), 0, LANES - 1);
      toast(T.crash, 'bad'); SND.crash(Math.abs(player.v - c.v) * 3.6 / 50 + 0.25); vibrate([60, 30, 90]); SND.otherHorn(dd * 2, Math.abs(dt2) + 3, C.horn);
    }
    // weaving: passing close
    if (!c.passed && dt2 < -lenSum) {
      c.passed = true;
      if (Math.abs(dd) < 6.5 && player.v > c.v + 3) SND.passBy(Math.sign(dd) || 1, sizeOf(c.kind), 1 - Math.abs(dd) / 7.5);
      if (Math.abs(dd) < 3.8 && player.v > c.v + 3 && player.v > 15) {
        game.weaves++; game.combo = game.comboT > 0 ? game.combo + 1 : 1; game.comboT = 3;
        const pts = 40 * game.combo; game.weavePts += pts;
        hud.weave.textContent = T.weave + (game.combo > 1 ? ' x' + game.combo : '') + '  +' + pts; hud.weave.classList.remove('pop'); void hud.weave.offsetWidth; hud.weave.classList.add('pop');
        SND.combo(game.combo); vibrate(game.combo >= 3 ? [20, 30, 20] : 12); game.nitro = Math.min(1, game.nitro + 0.1);
        if (Math.random() < 0.3) SND.otherHorn(dd, 8, C.horn);
      }
    } else if (c.passed && dt2 > lenSum) { c.passed = false; if (Math.abs(dd) < 6.5 && c.v > player.v + 3) SND.passBy(Math.sign(dd) || 1, sizeOf(c.kind), 1 - Math.abs(dd) / 7.5); }
  }
  if (game.comboT > 0) game.comboT -= dt;
  for (const c of ONC) {
    const ahead = c.t > player.t;
    if (c.ahead && !ahead) { const gap = Math.abs(c.d - player.d); if (gap < 16) SND.passBy(-1, sizeOf(c.kind), 1 - (gap - 3) / 15); }
    c.ahead = ahead;
  }
  // riding close behind a car fills the nitro slowly
  let draft = false;
  if (player.v > 14 && game.boost <= 0) for (const c of SAME) { const g = c.t - player.t - (c.len + player.len) / 2; if (g > 0 && g < 24 && Math.abs(c.d - player.d) < 1.3) { draft = true; break; } }
  if (draft) game.nitro = Math.min(1, game.nitro + dt * 0.06);
  const hornTap = horn && !game.hornWas; game.hornWas = horn;
  const evTxt = roadEvent(dt, hornTap);
  // events
  const sNow = sOfT(player.t); const moved = player.t - prevT;
  let warnTxt = '';
  for (const ev of events) {
    const ahead = aheadDist(sNow, ev.s);
    if (ev.type === 'radar' && ahead < 350) warnTxt = T.radarAhead + ' ' + Math.round(ahead) + ' ' + T.meters;
    if (moved > 0 && ahead + moved >= L && !(ev.lastT != null && Math.abs(player.t - ev.lastT) < 40)) { // just passed it
      ev.lastT = player.t;
      const kmh = player.v * 3.6;
      if (ev.type === 'radar') {
        if (kmh > C.limit + C.tolerance && !game.tour) { game.radar++; game.fines += C.fines.radar; toast(T.flash + ' ' + Math.round(kmh) + ' ' + T.kmh + ' · ' + C.fines.radar + ' ' + C.currency, 'bad'); flash(); SND.cue('flash'); vibrate([60, 40, 60]); }
        else { toast(T.radarOk, 'good'); SND.cue('ok'); }
      } else if (ev.type === 'bump') {
        if (kmh > 35) { if (!game.tour) player.dmg += (kmh - 35) * 0.22 * player.tough; game.shake = 0.5; game.bumps++; toast(T.bumpHit, 'bad'); SND.bump((kmh - 35) / 15); vibrate(80); } else toast(T.bumpOk, 'good');
      } else if (ev.type === 'toll') {
        game.tolls += C.tollFee; toast(T.tollName + ' · ' + C.tollFee + ' ' + C.currency); SND.cue('toll');
      }
    }
  }
  if (!warnTxt) warnTxt = evTxt;
  hud.warn.textContent = warnTxt; hud.warn.hidden = !warnTxt;
  // distance milestones
  if (game.dist >= game.nextBonus) { game.bonus += 500; game.nextBonus += 10000; toast(T.bonus, 'good'); SND.cue('bonus'); vibrate([30, 40, 30, 40, 60]); }
  if (game.free && game.dist >= game.nextShop) { game.nextShop += 25000; player.dmg = 0; toast(T.workshop, 'good'); }
  // horn
  SND.horn(horn, C.horn, CARS[settings.car].kind);
  Object.assign(player.input, { gas, brake, brakeAmt, cruising: !gas && !brake && player.v > 2 });
  player.brakeMat.color.set(brake ? 0xff2a1a : 0x550000);
  // destination
  if (!game.free) {
    const remain = game.tripLen - (player.t - game.startT);
    hud.remain.textContent = (Math.max(0, remain) / 1000).toFixed(1) + ' ' + T.km;
    if (remain <= 0) { finishTrip('arrive'); return; }
  } else {
    hud.remain.textContent = (game.dist / 1000).toFixed(1) + ' ' + T.km;
  }
  if (player.dmg >= 100) { player.dmg = 100; finishTrip('wreck'); return; }
  if (tour) tourCheck({ gas, brake, horn });
  // hud
  const kmh = Math.round(player.v * 3.6);
  hud.speed.textContent = kmh; hud.speed.closest('.speedo').classList.toggle('over', kmh > C.limit + C.tolerance);
  hud.time.textContent = fmtTime(game.time); hud.score.textContent = fmt(computeScore()); hud.viol.textContent = game.radar + game.crashes;
  hud.dmg.style.width = player.dmg + '%';
  const sweet = game.boost <= 0 && game.nitro >= NITRO_SWEET[0] && game.nitro <= NITRO_SWEET[1];
  const nShow = game.boost > 0 ? Math.min(1, game.boost / 4) : game.nitro;
  hud.nitro.style.setProperty('--n', nShow.toFixed(3)); hud.nitroBtn.style.setProperty('--n', nShow.toFixed(3));
  hud.nitro.classList.toggle('sweet', sweet); hud.nitro.classList.toggle('on', game.boost > 0);
  hud.nitroBtn.classList.toggle('sweet', sweet); hud.nitroBtn.classList.toggle('on', game.boost > 0); hud.nitroBtn.classList.toggle('ready', game.boost <= 0 && game.nitro >= 0.25);
  if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) hud.toast.className = 'toast'; }
}
function flash() { const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }

const fxEl = document.querySelector('#fx');
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(); let camInit = false; let orbit = 0; let camRoll = 0; let nitroFov = 0;
const tmpEuler = new THREE.Euler();
function render(dt) {
  // player
  trackAt(player.t, player.d, P);
  const yaw = yawOf(P.fx, P.fz) - Math.atan2(player.lat, Math.max(player.v, 4)) * 0.8;
  player.group.position.set(P.x, P.y, P.z);
  // pitch from slope
  trackAt(player.t + 3, player.d, Q); const pitch = Math.atan2(Q.y - P.y, 3);
  player.group.rotation.set(0, 0, 0); player.group.rotateY(yaw); player.group.rotateX(pitch); player.group.rotateZ(clamp(-player.lat * 0.025, -0.07, 0.07));
  if (headlight.intensity > 0) { trackAt(player.t + 1.8, player.d, Q); headlight.position.set(Q.x, Q.y + 0.75, Q.z); trackAt(player.t + 26, player.d, Q); headlight.target.position.set(Q.x, Q.y, Q.z); }
  drawWeather(dt);
  sun.target.position.set(P.x, P.y, P.z); sun.position.set(P.x + SUN_DIR.x * 400, P.y + SUN_DIR.y * 400, P.z + SUN_DIR.z * 400);
  let si = 0; const setShadow = (x, y, z, yw, w, l) => { if (si >= MAXS) return; tmpQ.setFromAxisAngle(UP, yw); tmpM.compose(tmpV.set(x, y + 0.04, z), tmpQ, tmpS.set(w * 1.3, 1, l * 1.15)); shadows.setMatrixAt(si++, tmpM); };
  setShadow(P.x, P.y, P.z, yaw, player.wid, player.len);
  for (const c of SAME) {
    trackAt(c.t, c.d, Q);
    c.mesh.position.set(Q.x, Q.y, Q.z);
    const dy = c.tl !== c.lane ? Math.sign(laneD(c.tl) - c.d) * 0.08 : 0;
    c.mesh.rotation.set(0, yawOf(Q.fx, Q.fz) - dy, 0);
    if (Math.abs(c.t - player.t) < 600) setShadow(Q.x, Q.y, Q.z, c.mesh.rotation.y, c.wid, c.len);
  }
  for (const c of ONC) { trackAt(c.t, c.d, Q); c.mesh.position.set(Q.x, Q.y, Q.z); c.mesh.rotation.set(0, yawOf(-Q.fx, -Q.fz), 0); }
  updateMetro(dt);
  shadows.count = si; shadows.instanceMatrix.needsUpdate = true;
  // camera
  if (game.mode === 'drive' || game.mode === 'done') {
    const dist = [6.5, 9, 13][settings.cam], hgt = [2.4, 3.4, 5.2][settings.cam];
    trackAt(player.t - dist, player.d * 0.85 + laneD(0) * 0.15, Q);
    const want = new THREE.Vector3(Q.x, Q.y + hgt, Q.z);
    trackAt(player.t + 14, player.d, Q); const look = new THREE.Vector3(Q.x, Q.y + 1.2, Q.z);
    if (!camInit || camPos.distanceTo(want) > 60) { camPos.copy(want); camLook.copy(look); camInit = true; }
    camPos.lerp(want, Math.min(1, dt * 8)); camLook.lerp(look, Math.min(1, dt * 10));
    camera.position.copy(camPos);
    if (game.shake > 0) { game.shake -= dt; camera.position.x += (Math.random() - 0.5) * game.shake; camera.position.y += (Math.random() - 0.5) * game.shake; }
    camera.lookAt(camLook);
    camRoll += (clamp(player.lat * 0.006, -0.03, 0.03) - camRoll) * Math.min(1, dt * 5);
    camera.rotateZ(camRoll);
    nitroFov += ((game.boost > 0 ? 9 : 0) - nitroFov) * Math.min(1, dt * (game.boost > 0 ? 6 : 2));
    camera.fov = (62 + Math.min(14, player.v * 0.18) + nitroFov) * (camera.aspect < 0.8 ? 0.8 : 1); camera.updateProjectionMatrix();
  } else {
    orbit += dt * 0.12;
    const r = 11;
    camera.position.set(P.x + Math.sin(orbit) * r, P.y + 3.2, P.z + Math.cos(orbit) * r);
    camera.lookAt(P.x, P.y + 0.9, P.z);
    camera.fov = 50; camera.updateProjectionMatrix(); camInit = false;
  }
  if (window.__cam) { camera.position.fromArray(window.__cam[0]); camera.lookAt(new THREE.Vector3().fromArray(window.__cam[1])); camera.fov = 55; camera.updateProjectionMatrix(); }
  scene.userData.sky.position.copy(camera.position);
  // flag wave
  if (flagMesh) {
    const pa = flagMesh.geometry.attributes.position; const base = flagMesh.userData.base; const tt = performance.now() / 1000;
    for (let i = 0; i < pa.count; i++) { const x = base[i * 3]; pa.setZ(i, Math.sin(x * 0.12 - tt * 2.4) * x * 0.06 + Math.sin(base[i * 3 + 1] * 0.2 + tt) * 0.4); }
    pa.needsUpdate = true;
  }
  if (wheel) wheel.rotation.z += dt * 0.02;
  if (game.mode === 'drive') drawMini(P.x, P.z);
  fxEl.style.setProperty('--spd', game.mode === 'drive' ? clamp(Math.max((player.v * 3.6 - 90) / 90, game.boost > 0 ? 0.8 : 0), 0, 1).toFixed(2) : 0);
  renderer.render(scene, camera);
}

function placeMenuCar() {
  DIR = settings.dir;
  const tr = tripList()[Math.min(settings.trip, tripList().length - 1)];
  player.t = tOfS(tr.from.s) + 30; player.d = laneD(Math.min(1, LANES - 1)); player.v = 0; player.lat = 0;
  trafficLevel = settings.traffic; resetTraffic();
}

function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
  // upright phone: lift the picture so the car sits above the stick
  if (h > w * 1.2 && isTouch()) camera.setViewOffset(w, h, 0, h * 0.11, w, h); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

let last = performance.now();
const STEP = 1 / 120; let stepAcc = 0;
function watchSpeed(ms) {
  if (!settings.autoQ || game.mode !== 'drive' || game.paused || document.hidden || ms > 400) { autoQ.t = autoQ.slow = autoQ.all = 0; return; }
  autoQ.all++; if (ms > 26) autoQ.slow++; autoQ.t += ms;
  if (autoQ.t < 3000) return;
  // more than a quarter of frames slow for three seconds: step down once, then measure again
  if (autoQ.slow / autoQ.all > 0.25 && autoQ.step < AUTO_SCALE.length) {
    autoQ.step++; applyQuality();
    if (!autoQ.told) { autoQ.told = true; toast(T.autoLow); }
  }
  autoQ.t = autoQ.slow = autoQ.all = 0;
}
function loop(now) {
  watchSpeed(now - last);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  // physics runs in even steps so a slow or uneven frame rate drives the same
  stepAcc += dt; while (stepAcc >= STEP) { step(STEP); stepAcc -= STEP; }
  soundFrame();
  if (game.mode === 'menu' && !game.paused) { updateTrafficIdle(dt); }
  render(dt);
  requestAnimationFrame(loop);
}
function updateTrafficIdle(dt) {
  // traffic keeps flowing behind the menu
  for (const c of SAME) { c.t += c.v * dt; if (c.t - player.t > 1200) { c.t = player.t - mr(200, 300); c.passed = true; if (Math.abs(c.d - player.d) < 2.6) { c.lane = c.tl = (c.lane + 1) % LANES; if (Math.abs(laneD(c.lane) - player.d) < 2.6) c.lane = c.tl = (c.lane + 1) % LANES; c.d = laneD(c.lane); } } }
  for (const c of ONC) { c.t -= c.vt * dt; if (c.t - player.t < -250) c.t = player.t + mr(900, 1300); }
}

// ---------- menu UI ----------
function renderTrips() {
  DIR = settings.dir;
  const trips = tripList();
  const el = $('#trips');
  el.innerHTML = trips.map((tr, i) => {
    const title = tr.free ? T.freeDrive : tr.lap ? T.fullLap : `${tr.from.name} <i>${T.to}</i> ${tr.to.name}`;
    const sub = tr.free ? T.freeSub : (tr.len / 1000).toFixed(1) + ' ' + T.km;
    const best = store.get('best:' + settings.dir + ':' + i, 0);
    return `<button class="trip${i === settings.trip ? ' sel' : ''}" data-i="${i}" type="button"><span class="tt">${title}</span><span class="ts">${sub}${best ? ' · ' + T.best + ' ' + fmt(best) : ''}</span></button>`;
  }).join('');
  el.querySelectorAll('.trip').forEach((b) => b.addEventListener('click', () => { settings.trip = +b.dataset.i; saveSettings(); renderTrips(); placeMenuCar(); }));
}
function segmented(sel, key, after) {
  const el = $(sel);
  el.querySelectorAll('button').forEach((b) => {
    b.classList.toggle('sel', String(settings[key]) === b.dataset.v);
    b.onclick = () => { const v = b.dataset.v; settings[key] = isNaN(+v) ? v : +v; saveSettings(); segmented(sel, key, after); if (after) after(); };
  });
}
function syncSettingsUI() {
  segmented('#segDir', 'dir', () => { settings.trip = Math.min(settings.trip, tripList().length - 1); renderTrips(); placeMenuCar(); });
  segmented('#segTraffic', 'traffic', placeMenuCar);
  segmented('#segCam', 'cam');
  segmented('#segTime', 'time', applyTime);
  segmented('#segWx', 'weather', applyTime);
  segmented('#segHorn', 'hornSide', applyControls);
  segmented('#segHornSize', 'hornSize', applyControls);
  segmented('#segQual', 'quality', applyQuality);
  segmented('#segFx', 'fx', applyControls);
  segmented('#segMini', 'mini', applyControls);
  segmented('#segSound', 'sound', () => SND.apply(settings));
  segmented('#segHornStyle', 'hornStyle', () => { SND.apply(settings); SND.horn(true, C.horn, (CARS[settings.car] || CARS[0]).kind); setTimeout(() => SND.horn(false), 600); });
  segmented('#segMusic', 'music', () => { SND.apply(settings); if (game.mode === 'drive') radioStart(); });
  segmented('#segVib', 'vib', () => { SND.apply(settings); vibrate([20, 40, 20]); });
  segmented('#segAutoQ', 'autoQ', applyQuality);
  $('#vibRow').hidden = !SND.canVibrate;
  for (const [id, key] of [['#rSteer', 'steerFeel'], ['#rBrake', 'brakeFeel'], ['#rEngine', 'volEngine'], ['#rFx', 'volFx'], ['#rHorn', 'volHorn'], ['#rMusic', 'volMusic']]) {
    const el = $(id); el.value = settings[key];
    el.oninput = () => { settings[key] = +el.value; saveSettings(); SND.apply(settings); };
    el.onchange = () => { if (key === 'volFx') SND.cue('ok'); if (key === 'volHorn') SND.otherHorn(0, 4, C.horn, [[0, 0.25]]); };
  }
  document.querySelectorAll('#ctlModes .mode').forEach((b) => {
    b.classList.toggle('sel', b.dataset.v === settings.control); b.setAttribute('aria-pressed', b.dataset.v === settings.control);
    b.onclick = () => { settings.control = b.dataset.v; saveSettings(); if (settings.control === 'tilt') askTilt(); syncSettingsUI(); };
  });
  const noteKey = { stick: 'T_C_STICK_D', onehand: 'T_C_ONE_D', tilt: 'T_C_TILT_D', lanes: 'T_C_LANES_D', wheel: 'T_C_WHEEL_D' }[settings.control];
  $('#modeNote').innerHTML = S['page.' + noteKey] + (settings.control === 'tilt' && !tilt.ok && isTouch() ? '<br>' + (window.DeviceOrientationEvent ? S['page.T_TILTPERM'] : S['page.T_NOTILT']) : '');
  $('#langList').innerHTML = Object.entries(LANGS).map(([k, l]) => `<button type="button" lang="${k}" dir="${l.dir}" data-v="${k}" class="${k === LANG ? 'sel' : ''}">${l.name}</button>`).join('');
  $('#langList').querySelectorAll('button').forEach((b) => b.onclick = () => switchLang(b.dataset.v));
  applyControls();
}
// settings screen: opened from the menu or the pause screen, and goes back to where it came from
let setFrom = '#menu';
function openSettings(from) {
  setFrom = from; syncSettingsUI(); showScreen('#settings'); showTab(store.get('tab', 'ctl'));
}
function showTab(k) {
  document.querySelectorAll('#settings .tabs button').forEach((b) => { b.classList.toggle('sel', b.dataset.tab === k); b.setAttribute('aria-selected', b.dataset.tab === k); });
  document.querySelectorAll('#settings .panel').forEach((p) => { p.hidden = p.dataset.panel !== k; });
  store.set('tab', k);
}
document.querySelectorAll('#settings .tabs button').forEach((b) => b.onclick = () => showTab(b.dataset.tab));
$('#setClose').onclick = () => showScreen(setFrom);
// stat bars on a fixed scale so the two cities compare fairly
const bar = (v, lo, hi) => clamp(Math.round(1 + 4 * (v - lo) / (hi - lo)), 1, 5);
function carStats(c) {
  return [[T.stSpeed, bar(c.vmax, 140, 300)], [T.stAccel, bar(c.accel, 3.5, 8.5)], [T.stGrip, bar(c.grip, 0.8, 1.25)], [T.stTough, bar(1 / (c.tough || 1), 1 / 1.5, 1 / 0.55)]];
}
function renderGarage() {
  if (settings.car >= CARS.length) settings.car = 0;
  $('#carPick').innerHTML = CARS.map((c, i) => `<button type="button" class="pick${i === settings.car ? ' sel' : ''}" data-i="${i}" aria-pressed="${i === settings.car}">
    <b>${c.name}</b><span class="en">${c.sub}</span>
    <span class="bars">${carStats(c).map(([k, n]) => `<span class="st"><span>${k}</span><i style="--n:${n}"></i></span>`).join('')}</span></button>`).join('');
  $('#carPick').querySelectorAll('.pick').forEach((b) => b.onclick = () => { settings.car = +b.dataset.i; saveSettings(); renderGarage(); buildPlayer(); });
  const cur = CARS[settings.car];
  $('#carPros').innerHTML = `<span class="pro">+ ${cur.pros}</span><span class="con">− ${cur.cons}</span>`;
  const fixed = CARS[settings.car].fixedColor;
  $('#colors').innerHTML = C.colors.map((c) => `<button type="button" class="sw${c === settings.color ? ' sel' : ''}" style="--sw:#${c.toString(16).padStart(6, '0')}" data-c="${c}" aria-label="color"${fixed ? ' disabled' : ''}></button>`).join('');
  $('#colors').querySelectorAll('.sw').forEach((b) => b.onclick = () => { settings.color = +b.dataset.c; saveSettings(); renderGarage(); buildPlayer(); });
  $('#colorNote').hidden = !fixed;
  $('#plate').value = settings.plate;
}
$('#plate').addEventListener('input', (e) => { settings.plate = e.target.value.slice(0, 12); saveSettings(); drawPlate(); });
$('#btnStart').onclick = () => { if (settings.control === 'tilt') askTilt(); startTrip(); };
$('#btnGarage').onclick = () => { $('#garage').hidden = !$('#garage').hidden; };
$('#btnSettings').onclick = () => { $('#garage').hidden = true; openSettings('#menu'); };
$('#btnPauseSet').onclick = () => openSettings('#pause');
$('#btnPause').onclick = togglePause;
$('#btnResume').onclick = togglePause;
$('#btnQuit').onclick = toMenu;
$('#btnAgain').onclick = () => startTrip(game.lastOpts || {});
$('#btnMenu').onclick = toMenu;

// ---------- welcome + guided tour ----------
let tour = null;
const TT = C.tour;
function tourBody(st) { return isTouch() ? (st.touch || st.body) : (st.keys || st.body); }
function startTour() {
  showScreen(null);
  startTrip({ free: true, traffic: 0, tour: true });
  tour = { i: -1 };
  $('#tour').hidden = false;
  nextTourStep();
}
function nextTourStep() {
  tour.i++;
  if (tour.i >= TT.steps.length) { endTour(); return; }
  const st = TT.steps[tour.i];
  tour.done = false; tour.v0 = player.v; tour.d0 = player.d; tour.t0 = performance.now();
  $('#tourStep').textContent = (tour.i + 1) + ' / ' + TT.steps.length;
  $('#tourTitle').textContent = st.title;
  $('#tourBody').innerHTML = tourBody(st);
  $('#tourDots').innerHTML = TT.steps.map((_, i) => `<i class="${i < tour.i ? 'past' : i === tour.i ? 'now' : ''}"></i>`).join('');
  $('#tourNext').hidden = !!st.wait;
  $('#tourTry').hidden = !st.wait;
  $('#tourTry').textContent = TT.tryIt;
  $('#tourTry').classList.remove('ok');
  placeTour();
}
function tourTarget() {
  const st = TT.steps[tour.i]; if (!st) return null;
  const sel = isTouch() ? (st.targetTouch || st.target) : st.target;
  if (!sel) return null;
  const el = document.querySelector(sel);
  return el && el.offsetParent !== null ? el : null;
}
function placeTour() {
  if (!tour) return;
  const hole = $('#tourHole'), card = $('#tourCard');
  const el = tourTarget();
  const vw = innerWidth, vh = innerHeight;
  if (el) {
    const r = el.getBoundingClientRect(); const pad = 8;
    Object.assign(hole.style, { left: (r.left - pad) + 'px', top: (r.top - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (r.height + pad * 2) + 'px' });
    hole.hidden = false;
    const cw = Math.min(360, vw - 32); card.style.width = cw + 'px';
    const ch = card.offsetHeight || 200;
    let left = clamp(r.left + r.width / 2 - cw / 2, 16, vw - cw - 16);
    let top = r.top + r.height / 2 < vh / 2 ? r.bottom + 18 : r.top - ch - 18;
    top = clamp(top, 16, vh - ch - 16);
    Object.assign(card.style, { left: left + 'px', top: top + 'px' });
  } else {
    hole.hidden = true;
    const cw = Math.min(380, vw - 32); card.style.width = cw + 'px';
    Object.assign(card.style, { left: (vw - cw) / 2 + 'px', top: Math.max(16, vh * 0.5 - (card.offsetHeight || 200) / 2) + 'px' });
  }
}
addEventListener('resize', () => placeTour());
function tourCheck(inp) {
  if (!tour || tour.done || game.paused) return;
  const st = TT.steps[tour.i]; if (!st || !st.wait) return;
  if (performance.now() - tour.t0 < 600) return;
  let ok = false;
  if (st.wait === 'gas') ok = player.v * 3.6 > 45;
  if (st.wait === 'steer') ok = Math.abs(player.d - tour.d0) > 2.6;
  if (st.wait === 'brake') ok = inp.brake && (player.v < tour.v0 - 3 || player.v < 1);
  if (st.wait === 'horn') ok = inp.horn;
  if (ok) {
    tour.done = true; $('#tourTry').textContent = TT.nice; $('#tourTry').classList.add('ok'); SND.cue('ok');
    const cur = tour, ci = tour.i; setTimeout(() => { if (tour === cur && tour.i === ci) nextTourStep(); }, 900);
  }
}
function endTour() {
  tour = null; $('#tour').hidden = true; store.set('toured', 1);
  game.paused = true; resetInputs(); $('#touch').hidden = true; showScreen('#tourEnd');
}
function skipTour() {
  tour = null; $('#tour').hidden = true; store.set('toured', 1); game.tour = false; toMenu();
}
$('#tourNext').onclick = nextTourStep;
$('#tourSkip').onclick = skipTour;
$('#btnTour').onclick = startTour;
$('#wTour').onclick = () => { store.set('welcomed', 1); startTour(); };
$('#wSkip').onclick = () => { store.set('welcomed', 1); showScreen('#menu'); };
$('#teDrive').onclick = () => {
  showScreen(null); game.paused = false; game.tour = false; $('#touch').hidden = !isTouch(); game.lastOpts = { free: true };
  Object.assign(game, { time: 0, dist: 0, weaves: 0, combo: 0, weavePts: 0, radar: 0, crashes: 0, fines: 0, tolls: 0, bumps: 0, bonus: 0, nextBonus: 10000, nextShop: 25000, nitro: 0, boost: 0, boostCap: 1, boostK: 1, extraPts: 0, nitroReq: false, evT: mr(25, 45) });
  player.dmg = 0;
};
$('#teMenu').onclick = () => { game.tour = false; toMenu(); };

// ---------- boot ----------
async function boot() {
  try { await Promise.race([Promise.all([document.fonts.load(`80px Lalezar`), document.fonts.load(`600 40px 'IBM Plex Sans Arabic'`)]), new Promise((r) => setTimeout(r, 2500))]); } catch (e) { /* fonts optional */ }
  const status = $('#loading');
  const stage = (msg) => new Promise((r) => { status.textContent = msg; setTimeout(r, 16); });
  await stage(T.loadRoad); buildRoad(); buildTerrain();
  await stage(T.loadCity); buildScenery(); buildMetro(); buildVerge(); buildLandmarks(); buildSigns(); buildEvents();
  prepMini(); buildPlayer(); placeMenuCar(); applyQuality(); applyTime();
  renderTrips(); renderGarage(); syncSettingsUI();
  resize(); status.hidden = true; $('#menuBody').hidden = false;
  if (!store.get('welcomed', 0)) showScreen('#welcome');
  requestAnimationFrame(loop);
  window.__game = { scene, trackAt, game, player, L, LMS, settings, startTrip, keys, step, SAME, startTour, nextTourStep, touch, evStart, ev, hud };
}
boot();
})();
