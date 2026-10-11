window.CITY = {
  id: 'dubai', seed: 23, hills: false, lanes: 5, limit: 100, tolerance: 20,
  fines: { radar: 600, crash: 500 }, tripHop: 2, tollFee: 4,
  origin: [25.16, 55.22],
  weather: 'dust', // what the weather setting brings: 'rain' or 'dust'
  horn: [330, 415],
  // the car radio: made-up stations, each with its own rhythm, maqam and lead sound
  radio: [
    { seed: 404, bpm: 92, rhythm: 'khaleeji', maqam: 'rast', root: 130.81, lead: 'oud', swing: 0.12, chord2: 3 },
    { seed: 505, bpm: 124, rhythm: 'chobi', maqam: 'nahawand', root: 110, lead: 'synth', riq: true, chord2: 5 },
    { seed: 606, bpm: 80, rhythm: 'maqsum', maqam: 'saba', root: 146.83, lead: 'nay', sparse: true, ghost: 0.1, chord2: 3 }
  ],
  defaultPlate: 'A 12345',
  route: [
    [25.2340, 55.3000, 'mid'], [25.2265, 55.2880, 'tower'], [25.2185, 55.2810, 'tower'], [25.2010, 55.2680, 'tower'],
    [25.1800, 55.2500, 'industrial'], [25.1530, 55.2290, 'mid'], [25.1170, 55.2010, 'mid'], [25.0990, 55.1790, 'tower'],
    [25.0820, 55.1560, 'tower'], [25.0880, 55.1530, 'tower'], [25.1000, 55.1640, 'villa'], [25.1200, 55.1820, 'villa'],
    [25.1360, 55.1960, 'villa'], [25.1600, 55.2120, 'villa'], [25.1850, 55.2300, 'villa'], [25.2050, 55.2460, 'villa'],
    [25.2320, 55.2660, 'mid'], [25.2390, 55.2820, 'mid']
  ],
  coast: [[25.060, 55.120], [25.090, 55.150], [25.118, 55.172], [25.140, 55.192], [25.170, 55.212], [25.205, 55.238], [25.240, 55.262], [25.262, 55.285]],
  metro: { side: -1, off: 9, from: 0.015, to: 0.47, stations: [0.06, 0.14, 0.22, 0.3, 0.38] },
  verge: { width: 14, zones: ['tower', 'mid', 'villa'] },
  fill: { count: 6000, pad: 1500, zone: 'villa', yaw: 0.6 },
  defaultZone: 'mid',
  zones: {
    tower: { rows: 3, w: [18, 30], d: [18, 30], h: [25, 60], setback: 16, rowGap: 55, jitter: 10, spacing: [45, 75],
      colors: [0xd8d2c4, 0xbfc6cc], tallP: 0.75, tw: [24, 42], th: [90, 320], crown: true, curtain: true,
      shapes: ['box', 'box', 'box', 'round', 'taper'],
      tallColors: [0x5f8fb0, 0x8fb3c9, 0xa8b4bf, 0x4f8f8f, 0xb8975a, 0x34495e, 0x6d8ba3], tree: 'palm', treeP: 0.45 },
    mid: { rows: 3, w: [20, 32], d: [20, 30], h: [15, 45], setback: 14, rowGap: 40, jitter: 8, spacing: [34, 52],
      colors: [0xd8cdb8, 0xc4c9cc, 0xe6dccb], tallP: 0.25, tw: [22, 32], th: [60, 140], crown: true, curtain: true,
      shapes: ['box', 'box', 'round', 'taper'], tallColors: [0x5f8fb0, 0x8fb3c9, 0xa8b4bf, 0x4f8f8f], tree: 'palm', treeP: 0.45 },
    industrial: { rows: 2, w: [30, 55], d: [25, 40], h: [8, 14], setback: 20, rowGap: 50, jitter: 8, spacing: [40, 65],
      colors: [0xb9b2a5, 0xa9a69f, 0xd1c7b3], tallP: 0.12, tw: [22, 30], th: [40, 90], tallColors: [0x9aa7b4, 0xc8d3dc], tree: 'palm', treeP: 0.15 },
    villa: { rows: 3, w: [14, 20], d: [14, 20], h: [6, 10], setback: 12, rowGap: 26, jitter: 6, spacing: [22, 32],
      colors: [0xe9dcc0, 0xf2ebdd, 0xdac7a2, 0xf6f2ea], tree: 'palm', treeP: 0.6 }
  },
  radars: [0.06, 0.2, 0.33, 0.5, 0.66, 0.85],
  tollsAt: [[25.1835, 55.2550], [25.1060, 55.1880]],
  landmarks: [
    { lat: 25.2355, lon: 55.3003, build: 'frame', clear: 80 },
    { lat: 25.2245, lon: 55.2865, build: 'wtc', clear: 60 },
    { lat: 25.2192, lon: 55.2818, build: 'museum', clear: 70 },
    { lat: 25.2172, lon: 55.2840, build: 'emiratesTowers', clear: 70 },
    { lat: 25.1972, lon: 55.2744, build: 'burjKhalifa', clear: 90 },
    { lat: 25.1181, lon: 55.2006, build: 'mall', clear: 230, ski: true, ink: '#6b4b1f' },
    { lat: 25.0790, lon: 55.1440, build: 'marina', clear: 220 },
    { lat: 25.0795, lon: 55.1225, build: 'ainDubai', clear: 140, sea: true },
    { lat: 25.1412, lon: 55.1853, build: 'burjAlArab', clear: 90, sea: true },
    { lat: 25.2340, lon: 55.2655, build: 'jumeirahMosque', clear: 50 }
  ],
  cars: [
    { kind: 'suv', vmax: 210, accel: 5.2, grip: 0.85, tough: 0.55 },
    { kind: 'sports', vmax: 300, accel: 8.5, grip: 1.25, tough: 1.5 },
    { kind: 'dtaxi', fixedColor: 0xe9dcc0, extra: { roof: 0xd2232a }, vmax: 190, accel: 4.8, grip: 1.0, tough: 1.0 }
  ],
  colors: [0xf4f3ef, 0x141414, 0xc9a24a, 0x5a5f66, 0xc0141c, 0xc8a979],
  traffic: [
    { kind: 'suv', colors: [0xf4f3ef, 0xf4f3ef, 0x141414, 0x9aa0a6, 0xc8a979], speed: [90, 130] },
    { kind: 'suv', colors: [0xf4f3ef, 0x141414], speed: [90, 130] },
    { kind: 'sedan', colors: [0xf4f3ef, 0xb9bec4, 0x5a5f66, 0x1d1f22, 0x2c4a7a], speed: [85, 120] },
    { kind: 'sports', colors: [0xc0141c, 0xf2c12e, 0x141414, 0x2a7de1, 0xf4f3ef], speed: [110, 140], wild: 0.6 },
    { kind: 'dtaxi', colors: [0xe9dcc0], extra: { roof: 0xd2232a }, speed: [85, 115] },
    { kind: 'dtaxi', colors: [0xe9dcc0], extra: { roof: 0x2e8b57 }, speed: [85, 115] },
    { kind: 'pickup', colors: [0xf4f3ef], speed: [75, 100] },
    { kind: 'bus', colors: [0xf4f4f0], extra: { stripe: 0xc8102e }, speed: [70, 90] },
    { kind: 'truck', colors: [0xf4f3ef, 0x2b5b8f], extra: { cargo: 0xe2ddd2 }, speed: [65, 85] }
  ],
  flag(g, w, h) {
    g.fillStyle = '#00843d'; g.fillRect(0, 0, w, h / 3); g.fillStyle = '#fff'; g.fillRect(0, h / 3, w, h / 3);
    g.fillStyle = '#000'; g.fillRect(0, 2 * h / 3, w, h / 3); g.fillStyle = '#c8102e'; g.fillRect(0, 0, w / 4, h);
  },
  drawPlate(g, w, h, text) {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.strokeStyle = '#111'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = '#c8102e'; g.textAlign = 'center'; g.font = 'bold 26px sans-serif'; g.fillText('DUBAI', 62, 56); g.font = 'bold 28px sans-serif'; g.fillText('دبي', 62, 92);
    g.fillStyle = '#111'; g.font = 'bold 76px sans-serif'; g.fillText(text, 310, 92);
  },
  look: {
    clouds: 0.3, cloudColor: '#f1b49a', exposure: 1.2, night: 0.8, fog: '#e3a98a', fogNear: 1400, fogFar: 11000, skyTop: '#26295a', sunGlow: '#ffb070',
    skyLight: 0x9aa3d6, groundLight: 0x6b5040, hemi: 1.55, sunColor: 0xffa26b, sun: 1.7, sunDir: [-0.8, 0.12, -0.45],
    winLit: '#ffd9a0', winGlass: '#2d3a4a', windows: { floor: 3.6, bay: 2.4, size: 0.7 },
    ground: ['#cdb38a', '#c4a77a', '#8d8478'], sand: '#e6d4ad', sea: '#1d5b78', asphalt: '#4a4b50', median: '#9a958c',
    lineEdge: '#f0e6c8', lineLane: '#f2f2f2', barrier: 0xc9c5bc, pole: 0xb0b4b8, tanks: [0xe8e8e8],
    treeDark: 0x3e5a33, treeLight: 0x6f8a4a, signColor: '#0a4f8f', warnColor: '#a8740a', radarColor: 0xdedede, tollColor: '#127a63',
    miniRoad: '#f4e2c4', miniDot: '#f2c46b', miniDest: '#ff6a5a', miniMe: '#ffffff'
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
  card: { color: '#b5822a', dark: '#e2b04f' },
  page: {
    tokens: {
      ground: '#1b1830', ink: '#f4ecdf', muted: '#b7aec2', panel: 'rgba(19,18,38,0.9)', 'panel-solid': '#2a2746', chip: 'rgba(255,255,255,0.09)',
      line: 'rgba(255,255,255,0.16)', accent: '#e2b04f', 'on-accent': '#1a1427', hud: 'rgba(14,12,30,0.7)', 'hud-ink': '#f7f0e4', 'accent-hud': '#f2c46b',
      bad: '#e0473a', good: '#1f9e7a', flagbar: 'linear-gradient(90deg,#c8102e 0 22%,#00843d 22% 48%,#f4f1ea 48% 74%,#111 74%)'
    }
  }
};
