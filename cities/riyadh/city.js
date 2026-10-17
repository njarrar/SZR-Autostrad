window.CITY = {
  id: 'riyadh', seed: 37, hills: false, lanes: 4, limit: 100, tolerance: 20,
  // Saher tiers: [km/h over the limit, SAR]; a crash is fined like not keeping a safe distance
  fines: { radar: [[20, 800], [30, 1200], [40, 1500], [50, 3000]], crash: 300 }, tripHop: 3,
  origin: [24.70, 46.66],
  weather: 'dust', // what the weather setting brings: 'rain' or 'dust'
  horn: [300, 378],
  // the car radio: made-up stations, each with its own rhythm, maqam and lead sound
  radio: [
    { seed: 707, bpm: 100, rhythm: 'samri', maqam: 'bayati', root: 146.83, lead: 'oud', swing: 0.1, ghost: 0.12, chord2: 3 },
    { seed: 808, bpm: 120, rhythm: 'khaleeji', maqam: 'hijaz', root: 130.81, lead: 'synth', riq: true, chord2: 5 },
    { seed: 909, bpm: 84, rhythm: 'ardah', maqam: 'rast', root: 110, lead: 'rababa', sparse: true, chord2: 4 }
  ],
  defaultPlate: '4821 BDR',
  route: [
    [24.6320, 46.7175, 'old'], [24.6420, 46.7135, 'old'], [24.6540, 46.7070, 'mid'], [24.6640, 46.6975, 'mid'],
    [24.6760, 46.6905, 'tower'], [24.6900, 46.6870, 'tower'], [24.7110, 46.6772, 'tower'], [24.7330, 46.6625, 'tower'],
    [24.7555, 46.6455, 'tower'], [24.7610, 46.6300, 'mid'], [24.7650, 46.6085, 'mid'], [24.7560, 46.5885, 'villa'],
    [24.7385, 46.5785, 'mud'], [24.7190, 46.5950, 'villa'], [24.6960, 46.6200, 'villa'], [24.6740, 46.6450, 'villa'],
    [24.6520, 46.6700, 'mid'], [24.6360, 46.6950, 'old']
  ],
  // the Metro's blue line runs raised along Olaya beside King Fahd Road
  metro: { side: 1, off: 9, from: 0.1, to: 0.36, stations: [0.14, 0.2, 0.26, 0.32], station: 0xd9cdb6, metal: 0.15, stripe: 0x1f5fa8 },
  verge: { width: 10, zones: ['tower'] },
  fill: { count: 9000, pad: 1400, zone: 'villa', yaw: 0.3 },
  defaultZone: 'mid',
  zones: {
    // the old town: low mud and stone walls in the Najdi style
    old: { rows: 5, w: [9, 15], d: [9, 14], h: [6, 12], setback: 9, rowGap: 17, jitter: 3, spacing: [11, 17], skew: 0.06,
      colors: [0xc9a477, 0xbf9868, 0xd4b38a, 0xb88d5e, 0xd9be96, 0xe0cba8], tree: 'palm', treeP: 0.3 },
    mid: { rows: 4, w: [16, 26], d: [14, 22], h: [10, 22], setback: 12, rowGap: 30, jitter: 6, spacing: [22, 34],
      colors: [0xe8dcc4, 0xddd0b4, 0xf0e8d8, 0xcfc2a6, 0xe4d2ae], tallP: 0.16, tw: [22, 30], th: [40, 90], curtain: true,
      shapes: ['box', 'box', 'taper'], tallColors: [0x8fa9bf, 0x6d8ba3, 0xb8a98c, 0x5d7f99], tree: 'palm', treeP: 0.45 },
    // King Fahd Road: a wall of glass and stone towers with palms in the middle
    tower: { rows: 3, w: [18, 30], d: [18, 28], h: [24, 60], setback: 15, rowGap: 50, jitter: 9, spacing: [40, 64],
      colors: [0xd8c9a8, 0xc9b894, 0x8fa9bf, 0xe4d8c0, 0x7d98ad], tallP: 0.65, tw: [22, 38], th: [80, 210], crown: true, curtain: true,
      shapes: ['box', 'box', 'round', 'taper'], tallColors: [0x5f8fb0, 0x8fb3c9, 0xb8a98c, 0x4f7f8f, 0x6d8ba3, 0xc8b48c], tree: 'palm', treeP: 0.55 },
    // walled villas in beige and white
    villa: { rows: 3, w: [14, 20], d: [14, 20], h: [7, 11], setback: 12, rowGap: 25, jitter: 5, spacing: [21, 30],
      colors: [0xeee2c8, 0xf4ede0, 0xdccaa6, 0xe8d6b4, 0xf8f4ec], tree: 'palm', treeP: 0.55 },
    // Diriyah: mud brick in the old color of Wadi Hanifa
    mud: { rows: 4, w: [8, 14], d: [8, 13], h: [5, 11], setback: 10, rowGap: 16, jitter: 4, spacing: [12, 18], skew: 0.1,
      colors: [0xb98a5a, 0xc49868, 0xa97c50, 0xcda577], tree: 'palm', treeP: 0.7 }
  },
  radars: [0.07, 0.22, 0.38, 0.54, 0.7, 0.86],
  landmarks: [
    { lat: 24.6318, lon: 46.7141, build: 'masmak', clear: 70 },
    { lat: 24.6321, lon: 46.7124, build: 'najdiMosque', clear: 60 },
    { lat: 24.6459, lon: 46.7102, build: 'murabba', clear: 80 },
    { lat: 24.6577, lon: 46.7043, build: 'waterTower', clear: 50, view: 160 },
    { lat: 24.6654, lon: 46.6959, build: 'tvTower', clear: 50, view: 220 },
    { lat: 24.6906, lon: 46.6856, build: 'faisaliah', clear: 80, view: 260 },
    { lat: 24.7119, lon: 46.6753, build: 'kingdomCentre', clear: 90, view: 300 },
    { lat: 24.7591, lon: 46.6416, build: 'kafd', clear: 200, view: 300 },
    { lat: 24.7596, lon: 46.6291, build: 'mall', clear: 150, ink: '#0b5d3b' },
    { lat: 24.7658, lon: 46.6072, build: 'boulevard', clear: 120 },
    { lat: 24.7372, lon: 46.5777, build: 'diriyah', clear: 110 }
  ],
  // the cars you see most on Riyadh roads
  // Kids Mode: the three places little ones pick from, by landmark
  kids: ['kingdomCentre', 'masmak', 'tvTower'],
  cars: [
    { kind: 'suv', vmax: 205, accel: 5.0, grip: 0.86, tough: 0.55, role: 'vip' },
    { kind: 'pickup', vmax: 175, accel: 4.3, grip: 0.84, tough: 0.5, role: 'tough' },
    { kind: 'dtaxi', fixedColor: 0xf4f4f0, extra: { roof: 0x1d8a4e }, vmax: 185, accel: 4.6, grip: 1.0, tough: 1.0, role: 'taxi', paxCap: 4 },
    { kind: 'sedan', vmax: 170, accel: 3.9, grip: 1.18, tough: 1.25, role: 'weave' },
    { kind: 'coaster', fixedColor: 0xf4f4f0, extra: { stripe: 0x0b6e3a }, vmax: 155, accel: 3.8, grip: 0.92, tough: 0.45, role: 'bus', paxCap: 14 },
    { kind: 'f1', vmax: 320, accel: 9.5, grip: 1.45, tough: 1.6, role: 'race' }
  ],
  stickers: ['', 'ما شاء الله', 'هذا من فضل ربي', 'لا تسرع يا شيخ', 'عز الرياض', 'طويق', 'الله يحفظك'],
  // Haitham Mode: what people on the sidewalk say, and the street seller's cart
  walk: {
    bump: ['انتبه يا رجّال!', 'وش فيك؟', 'على هونك!', 'الله يهديك!', 'وين عيونك يا الحبيب؟'],
    kid: ['آسف عمي!', 'ما قصدت!', 'هههه'],
    vendor: ['تمر! تمر سكري!', 'قهوة! قهوة عربية!', 'تفضّل يا الطيب!', 'رطب! رطب طازج!'],
    cart: { body: 0x1f6e43, goods: 0x6b3a1e, shade: 0xe8dcc0 }, bin: 0x6b6f76
  },
  barks: {
    honk: ['وسّع يا شيخ!', 'هوّن هوّن!', 'ساهر قدامك خفف!', 'افسح الله يرضى عليك!', 'يا رجّال وش العجلة؟'],
    cut: ['يا ساتر وش ذا؟!', 'تفحيط ولا وش؟', 'كفو والله!', 'انتبه للمسار يا خوي!', 'شوي شوي يا ولد الحلال!'],
    pax: ['ودّني البوليفارد الله يعافيك', 'نزّلني عند برج المملكة', 'على الدرعية لو سمحت', 'يعطيك العافية يا كابتن!']
  },
  colors: [0xf4f3ef, 0x141414, 0x9aa0a6, 0xc8a979, 0x5a5f66, 0x1f3556, 0x6e1a22, 0x2e6b4a],
  traffic: [
    // white is king in the heat; black and silver come next
    { kind: 'suv', colors: [0xf4f3ef, 0xf4f3ef, 0x141414, 0x9aa0a6, 0xc8a979, 0x5a5f66, 0x1f3556], speed: [95, 135] },
    { kind: 'suv', colors: [0x141414, 0xf4f3ef, 0xb9bec4, 0x3a3d42, 0x6e1a22], speed: [95, 135] },
    { kind: 'pickup', colors: [0xf4f3ef, 0xf4f3ef, 0xb9bec4, 0x3a3d42, 0xc8a979], speed: [80, 110] },
    { kind: 'pickup', colors: [0xf4f3ef, 0x9aa0a6, 0x7a6a4e], speed: [80, 110], wild: 0.3 },
    { kind: 'sedan', colors: [0xf4f3ef, 0xb9bec4, 0x5a5f66, 0x1d1f22, 0x2c4a7a, 0x8c1c24, 0xa89f8e], speed: [85, 120] },
    { kind: 'sedan', colors: [0xf4f3ef, 0xd7dbe0, 0x22252a, 0x6b6f75], speed: [85, 120], wild: 0.2 },
    { kind: 'sports', colors: [0x141414, 0xf4f3ef, 0x2a7de1, 0xc0141c, 0x1d6b4a], speed: [115, 145], wild: 0.7 },
    { kind: 'dtaxi', colors: [0xf4f4f0], extra: { roof: 0x1d8a4e }, speed: [85, 115] },
    // city buses are maroon, the big intercity coaches are white with green
    { kind: 'bus', colors: [0x8b1e2d, 0x8b1e2d, 0xf4f4f0], extra: { stripe: 0x0b6e3a }, speed: [70, 90] },
    { kind: 'truck', colors: [0xf4f3ef, 0xb3261e, 0x2b5b8f, 0xd9822b, 0x2f6b3a], extra: { cargo: 0xe2ddd2 }, speed: [65, 85] }
  ],
  flag(g, w, h) {
    g.fillStyle = '#006c35'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.direction = 'rtl';
    g.font = `bold ${Math.round(h * 0.2)}px "Lalezar", "IBM Plex Sans Arabic", sans-serif`; g.fillText('لا إله إلا الله محمد رسول الله', w / 2, h * 0.47);
    // the sword under the words, its hilt to the right
    g.fillRect(w * 0.22, h * 0.66, w * 0.5, h * 0.035);
    g.beginPath(); g.moveTo(w * 0.22, h * 0.66); g.lineTo(w * 0.17, h * 0.677); g.lineTo(w * 0.22, h * 0.695); g.fill();
    g.fillRect(w * 0.72, h * 0.62, w * 0.02, h * 0.12); g.fillRect(w * 0.74, h * 0.665, w * 0.07, h * 0.026);
  },
  drawPlate(g, w, h, text) {
    // a Saudi plate: Arabic on top, Latin below, and the KSA strip on the right
    const AR = { A: 'ا', B: 'ب', J: 'ح', D: 'د', R: 'ر', S: 'س', X: 'ص', T: 'ط', E: 'ع', G: 'ق', K: 'ك', L: 'ل', Z: 'م', N: 'ن', H: 'هـ', U: 'و', V: 'ى' };
    const arText = String(text).toUpperCase().replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]).replace(/[A-Z]/g, (c) => AR[c] || c);
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.strokeStyle = '#111'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = '#111'; g.fillRect(w - 92, 6, 3, h - 12); g.fillRect(8, h / 2 - 1.5, w - 100, 3);
    g.textAlign = 'center'; g.font = 'bold 50px sans-serif'; g.fillText(arText, (w - 92) / 2, 54); g.fillText(String(text).toUpperCase(), (w - 92) / 2, 112);
    g.fillStyle = '#0b6e3a'; g.beginPath(); g.arc(w - 46, 34, 17, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#111'; g.font = 'bold 20px sans-serif'; g.fillText('السعودية', w - 46, 80); g.font = 'bold 22px sans-serif'; g.fillText('KSA', w - 46, 110);
  },
  look: {
    clouds: 0.15, cloudColor: '#f6efe2', exposure: 1.05, night: 0, fog: '#e0cba3', fogNear: 700, fogFar: 7000, skyTop: '#5b8cc2', sunGlow: '#ffd88f',
    skyLight: 0xd8e4f0, groundLight: 0xc2a578, hemi: 1.2, sunColor: 0xffe2b0, sun: 2.0, sunDir: [0.6, 0.5, -0.35],
    winLit: '#ffd58a', winGlass: '#3e4f60', windows: { floor: 3.5, bay: 2.8, size: 0.5 },
    // the pixel look snaps every colour to this palette, plus a few colours taken from the time of day
    pixelPalette: ['#1e1a17', '#2a221c', '#5a5652', '#7c5530', '#a97e52', '#c9a072', '#dcb486', '#e4d2ac', '#f2ede2', '#f8f5ee', '#cfc5b0', '#9a907e', '#5b8cc2', '#7ea6d0', '#a8c3dc', '#cfd5cf', '#3e4f60', '#4f6f84', '#6f8fa8', '#8aa6bd', '#4f6b33', '#6f8f45', '#e5b548', '#5f9fb8',
      '#2a2a30', '#45454e', '#6b6b72', '#9a9aa0', '#c4c4c2', '#e2e1dc',
      '#e0cba3', '#d8c9a8', '#b8b0a0', '#c2d0dc', '#e8e0d0', '#9fbcd2', '#c6b58e', '#d9c4a0', '#f6efe2', '#a9bccb',
      '#d6342c', '#7a1f1f', '#2a4a1c', '#4f6b2a'],
    ground: ['#d4b685', '#c9a974', '#ab9a7e'], asphalt: '#505156', median: '#a39a88', lineEdge: '#f2e7c4', lineLane: '#f2f2f2',
    paving: '#cdb894', kerb: ['#e8c22a', '#1c1c1c'], barrier: 0xcfc8b8, pole: 0xa8adb2, tanks: [0xe8e8e8, 0xd8d8d0],
    treeDark: 0x3e5a33, treeLight: 0x7d8a5a, signColor: '#0a6b45', warnColor: '#a8740a', radarColor: 0xdedede,
    miniRoad: '#f3e3c4', miniDot: '#6fd49a', miniDest: '#ff5a4a', miniMe: '#ffffff'
  },
  // what each guided tour step waits for and points at; the words live in lang/*.xml
  tour: [
    { wait: 'gas', target: '.speedo', targetTouch: '#stick' },
    { wait: 'steer', targetTouch: '#stick' },
    { wait: 'brake', targetTouch: '#stick' },
    { wait: 'horn', targetTouch: '.horn' },
    { target: '.speedo' },
    { target: '.trip-hud' },
    { target: '.stats' },
    { target: '#mini' },
    {},
    { target: '#btnPause' }
  ],
  // the card on the start page: its color in light and dark mode
  card: { color: '#0a6b45', dark: '#5fcf93' },
  page: {
    tokens: {
      ground: '#d9c39a', ink: '#2a2014', muted: '#6e5f49', panel: 'rgba(248,242,230,0.94)', 'panel-solid': '#fbf6ec', chip: '#efe3cb',
      line: '#ddcdb0', accent: '#0a6b45', 'on-accent': '#ffffff', hud: 'rgba(26,22,16,0.72)', 'hud-ink': '#fbf5ea', 'accent-hud': '#7fe0aa',
      bad: '#c8102e', good: '#0a7a45', flagbar: 'linear-gradient(90deg,#006c35 0 70%,#f4efe6 70% 76%,#006c35 76%)'
    }
  }
};
