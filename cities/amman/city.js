window.CITY = {
  id: 'amman', seed: 11, hills: true, valley: 28, stone: true, lanes: 3, limit: 80, tolerance: 10,
  fines: { radar: 30, crash: 50 }, tripHop: 3,
  origin: [31.962, 35.900],
  weather: 'rain', // what the weather setting brings: 'rain' or 'dust'
  horn: [415, 520],
  // the car radio: made-up stations, each with its own rhythm, maqam and lead sound
  radio: [
    { seed: 101, bpm: 104, rhythm: 'maqsum', maqam: 'hijaz', root: 146.83, lead: 'qanun', riq: true, ghost: 0.15, chord2: 3 },
    { seed: 202, bpm: 118, rhythm: 'fallahi', maqam: 'bayati', root: 146.83, lead: 'nay', riq: true, sparse: true, chord2: 3 },
    { seed: 303, bpm: 98, rhythm: 'baladi', maqam: 'nahawand', root: 130.81, lead: 'synth', ghost: 0.2, swing: 0.08, chord2: 5 }
  ],
  defaultPlate: '12-34567',
  route: [
    [31.9690, 35.9070, 'stone'], [31.9640, 35.9105, 'tower'], [31.9600, 35.9220, 'old'], [31.9575, 35.9325, 'old'],
    [31.9590, 35.9445, 'old'], [31.9500, 35.9405, 'old'], [31.9490, 35.9300, 'old'], [31.9505, 35.9240, 'stone'],
    [31.9535, 35.9115, 'stone'], [31.9500, 35.9050, 'stone'], [31.9475, 35.8960, 'stone'], [31.9530, 35.8820, 'stone'],
    [31.9515, 35.8705, 'stone'], [31.9575, 35.8620, 'stone'], [31.9690, 35.8520, 'stone'], [31.9760, 35.8460, 'stone'],
    [31.9830, 35.8770, 'stone'], [31.9760, 35.8960, 'tower']
  ],
  fill: { count: 22000, pad: 1200, zone: 'stone' },
  defaultZone: 'stone',
  zones: {
    stone: { rows: 4, w: [12, 20], d: [12, 18], h: [9, 22], setback: 10, rowGap: 22, jitter: 4, spacing: [15, 26], skew: 0.15,
      colors: [0xefe9dc, 0xe6dcc6, 0xf4f0e6, 0xdcd0b6, 0xe9e1cd, 0xd6c8a8], tanks: true, balcony: true, tree: 'mix', treeP: 0.5 },
    old: { rows: 6, w: [8, 13], d: [8, 12], h: [6, 15], setback: 8, rowGap: 15, jitter: 3, spacing: [10, 15], skew: 0.3,
      colors: [0xebe3d0, 0xddd1b6, 0xd8caa9, 0xcdb48c, 0xc9b08a, 0xeee8db], tanks: true, balcony: true, tree: 'cypress', treeP: 0.2 },
    tower: { rows: 4, w: [12, 20], d: [12, 18], h: [10, 24], setback: 12, rowGap: 26, jitter: 4, spacing: [18, 30], skew: 0.1,
      colors: [0xefe9dc, 0xe6dcc6, 0xf4f0e6, 0xdcd0b6], tanks: true, balcony: true, tree: 'mix', treeP: 0.4,
      tallP: 0.07, tw: [20, 28], th: [30, 70], tallColors: [0xe4dccb, 0xd9ceb6, 0x8fa9bb] }
  },
  radars: [0.08, 0.3, 0.55, 0.8],
  bumps: [0.18, 0.43, 0.68, 0.9],
  landmarks: [
    { lat: 31.9693, lon: 35.9078, build: 'fountain', clear: 30 },
    { lat: 31.9625, lon: 35.9080, build: 'towers', clear: 100 },
    { lat: 31.9617, lon: 35.9137, build: 'mosqueBlue', clear: 50 },
    { lat: 31.9540, lon: 35.9345, build: 'citadel', clear: 120 },
    { lat: 31.9573, lon: 35.9458, build: 'flagpole', clear: 20, h: 126 },
    { lat: 31.9516, lon: 35.9394, build: 'theatre', clear: 60 },
    { lat: 31.9512, lon: 35.9290, build: 'oldHouses', clear: 70 },
    { lat: 31.9455, lon: 35.8960, build: 'cableBridge', clear: 140 },
    { lat: 31.9520, lon: 35.8705, build: 'fountain', clear: 30 },
    { lat: 31.9585, lon: 35.8640, build: 'shops', clear: 140 },
    { lat: 31.9775, lon: 35.8460, build: 'mall', clear: 110, ink: '#7a1f2b' },
    { lat: 31.9845, lon: 35.8800, build: 'shops', clear: 140 }
  ],
  cars: [
    { kind: 'taxi', fixedColor: 0xf2c12e, vmax: 175, accel: 4.6, grip: 1.05, tough: 1.0 },
    { kind: 'hatch', vmax: 165, accel: 3.8, grip: 1.22, tough: 1.3 },
    { kind: 'pickup', vmax: 160, accel: 4.0, grip: 0.82, tough: 0.55 }
  ],
  colors: [0xf2f2ee, 0xb9bec4, 0x1d1f22, 0xb3202a, 0x4a6b3a, 0x24365c],
  traffic: [
    { kind: 'taxi', colors: [0xf2c12e], speed: [70, 100], wild: 0.5 },
    { kind: 'taxi', colors: [0xf2c12e], speed: [70, 100], wild: 0.5 },
    // private cars: mostly silver, grey and dark colors, with some white, red, blue and green
    { kind: 'sedan', colors: [0xb9bec4, 0x8d9299, 0x5a5f66, 0x1d1f22, 0x8c1c24, 0x2c4a7a, 0xf2f2ee, 0x3c5a3f, 0xb8a98c], speed: [65, 95] },
    { kind: 'sedan', colors: [0xa7acb3, 0x6b6f75, 0x22252a, 0x6e1a22, 0x1f3556, 0xc9c2b2, 0x7a3b16], speed: [65, 95] },
    { kind: 'coaster', colors: [0xf4f4f0, 0xe6dcc4, 0xbcd2e0], extra: { stripe: 0x1f6e43 }, speed: [60, 85], wild: 1 },
    { kind: 'pickup', colors: [0xf2f2ee, 0x9aa0a6, 0x4a4e54, 0x9b2a24, 0x2b4a6e], speed: [55, 85] },
    // city buses are blue, the rapid bus line is green, a few older ones are cream
    { kind: 'bus', colors: [0x1f5fa8, 0x1f5fa8, 0x1d7a4f, 0xe9e2cf], extra: { stripe: 0xf4f4f0 }, speed: [50, 70] },
    { kind: 'truck', colors: [0xb3261e, 0x2b5b8f, 0x2f6b3a, 0xd9822b, 0xe8e4da], extra: { cargo: 0xd9d2c3 }, speed: [50, 70] }
  ],
  flag(g, w, h) {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h / 3); g.fillStyle = '#fff'; g.fillRect(0, h / 3, w, h / 3);
    g.fillStyle = '#007a3d'; g.fillRect(0, 2 * h / 3, w, h / 3);
    g.fillStyle = '#ce1126'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w / 2, h / 2); g.lineTo(0, h); g.closePath(); g.fill();
    const cx = w * 0.17, cy = h / 2, r1 = h * 0.085, r2 = r1 * 0.45; g.fillStyle = '#fff'; g.beginPath();
    for (let i = 0; i < 14; i++) { const a = -Math.PI / 2 + i * Math.PI / 7; const r = i % 2 ? r2 : r1; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    g.closePath(); g.fill();
  },
  drawPlate(g, w, h, text) {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.strokeStyle = '#111'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#111'; g.textAlign = 'center'; g.font = '600 20px sans-serif'; g.fillText('JORDAN', 50, 52); g.font = '600 24px sans-serif'; g.fillText('الأردن', 50, 88);
    g.fillRect(98, 14, 3, h - 28);
    g.font = 'bold 74px sans-serif'; g.fillText(text, 300, 92);
  },
  look: {
    clouds: 0.6, cloudColor: '#fbf7f0', exposure: 1.0, night: 0, fog: '#dccaa6', fogNear: 250, fogFar: 3200, skyTop: '#6f9fcf', sunGlow: '#ffd59a',
    skyLight: 0xcfe1f2, groundLight: 0xb59c73, hemi: 1.15, sunColor: 0xffe1b0, sun: 1.9, sunDir: [-0.7, 0.45, 0.25],
    winLit: '#ffd58a', winGlass: '#4a5966', windows: { floor: 3.4, bay: 3.4, size: 0.4 },
    ground: ['#b9a27a', '#a48c63', '#a39a88'], asphalt: '#56575b', median: '#8c8a85', lineEdge: '#f0f0f0', lineLane: '#e8e8e8',
    barrier: 0xb8b3a8, pole: 0x8d9196, tanks: [0x222222, 0x2b2b2b, 0xe8e8e8, 0x2f5d9a, 0xd8d8d0],
    treeDark: 0x3e5a33, treeLight: 0x7d8a5a, signColor: '#0d6b3d', warnColor: '#a8740a', radarColor: 0x2b2b2b,
    miniRoad: '#f1e6d0', miniDot: '#7ed09b', miniDest: '#ff4d5e', miniMe: '#ce1126'
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
  card: { color: '#0b6e3a', dark: '#4fc27f' },
  page: {
    tokens: {
      ground: '#cbb48c', ink: '#2b2118', muted: '#6f6253', panel: 'rgba(246,240,229,0.94)', 'panel-solid': '#fbf7ef', chip: '#ece2cf',
      line: '#dccfb7', accent: '#0b6e3a', 'on-accent': '#ffffff', hud: 'rgba(28,24,20,0.72)', 'hud-ink': '#fbf5ea', 'accent-hud': '#8fe0ab',
      bad: '#c8102e', good: '#0b7a3b', flagbar: 'linear-gradient(90deg,#111 0 30%,#f4efe6 30% 60%,#0b7a3b 60% 88%,#ce1126 88%)'
    }
  }
};
