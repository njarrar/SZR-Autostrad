window.CITY = {
  id: 'nairobi', order: 100, seed: 53, hills: true, lanes: 3, limit: 80, tolerance: 10,
  // Kenya drives on the left, and its road signs are in English
  drive: 'left', signs: 'en',
  // speeding fines grow with how far over you are: [km/h over, KSh]; a crash is fined as careless driving
  fines: { radar: [[10, 3000], [15, 6000], [20, 10000], [30, 20000]], crash: 5000 }, tripHop: 3,
  // fares count the same in every city; this turns them into shillings for the screen (a matatu seat is about 80 bob)
  fareMul: 10,
  origin: [-1.30, 36.80],
  weather: 'rain', // the short rains come in October
  horn: [392, 494],
  // the car radio: benga guitar, gengetone from the matatus, and taarab from the coast
  radio: [
    { seed: 1111, bpm: 138, rhythm: 'benga', maqam: 'major', root: 196, lead: 'guitar', ghost: 0.1, chord2: 4 },
    { seed: 1212, bpm: 104, rhythm: 'gengetone', maqam: 'minor', root: 110, lead: 'synth', ghost: 0.15, chord2: 5 },
    { seed: 1313, bpm: 96, rhythm: 'maqsum', maqam: 'hijaz', root: 146.83, lead: 'qanun', riq: true, swing: 0.08, chord2: 3 }
  ],
  defaultPlate: 'KDG 482Q',
  route: [
    [-1.2870, 36.8245, 'cbd'], [-1.2950, 36.8225, 'cbd'], [-1.3030, 36.8262, 'mid'], [-1.3120, 36.8222, 'mid'],
    [-1.3200, 36.8150, 'mid'], [-1.3310, 36.8020, 'park'], [-1.3430, 36.7880, 'park'], [-1.3555, 36.7705, 'leafy'],
    [-1.3520, 36.7480, 'leafy'], [-1.3300, 36.7400, 'leafy'], [-1.3100, 36.7550, 'leafy'], [-1.2990, 36.7640, 'mid'],
    [-1.2980, 36.7850, 'mid'], [-1.2965, 36.8075, 'tower'], [-1.2810, 36.8030, 'mid'], [-1.2670, 36.8045, 'tower'],
    [-1.2715, 36.8150, 'mid'], [-1.2800, 36.8215, 'cbd']
  ],
  verge: { width: 9, zones: ['cbd', 'park'] },
  fill: { count: 12000, pad: 1300, zone: 'mid', yaw: 0.2 },
  defaultZone: 'mid',
  zones: {
    // the CBD: concrete and glass office blocks, jacarandas along Uhuru Highway
    cbd: { rows: 4, w: [16, 26], d: [14, 22], h: [18, 40], setback: 9, rowGap: 28, jitter: 5, spacing: [18, 26],
      colors: [0xd9d0c0, 0xcfc4b0, 0xe6dfd2, 0xb9ad98, 0xd8c8a8], tallP: 0.4, tw: [20, 30], th: [55, 110], curtain: true, crown: true,
      shapes: ['box', 'box', 'round'], tallColors: [0x6f93ad, 0x8fa9bf, 0xb8a98c, 0x5d7f99], tree: ['jacaranda', 'jacaranda', 'olive'], treeP: 0.6 },
    // apartment blocks in cream, terracotta and pink, with balconies and tin roofed shops between them
    mid: { rows: 4, w: [12, 20], d: [12, 18], h: [8, 24], setback: 10, rowGap: 22, jitter: 5, spacing: [16, 26], skew: 0.12,
      colors: [0xe8dcc4, 0xd99a72, 0xe9c8b0, 0xf0e6d6, 0xc97b5a, 0xe2d39c], balcony: true, roof: true, tree: ['jacaranda', 'olive', 'acacia'], treeP: 0.55 },
    // the edge of the national park: open grass and flat topped acacias, a few low buildings
    park: { rows: 1, w: [8, 12], d: [8, 12], h: [4, 6], setback: 40, rowGap: 40, jitter: 20, spacing: [45, 80],
      colors: [0xd9c9a8, 0xc9b28a], roof: true, tree: 'acacia', treeP: 0.95 },
    // Karen and Langata: low houses with tin and tile roofs behind hedges and big trees
    leafy: { rows: 2, w: [12, 18], d: [12, 16], h: [4, 7], setback: 14, rowGap: 26, jitter: 8, spacing: [24, 36],
      colors: [0xf0e6d6, 0xe8dcc4, 0xd9c4a0, 0xf4efe4], roof: true, tree: ['jacaranda', 'olive', 'acacia', 'olive'], treeP: 0.85 },
    // Westlands and Upper Hill: new glass towers
    tower: { rows: 3, w: [18, 28], d: [16, 26], h: [20, 50], setback: 14, rowGap: 40, jitter: 8, spacing: [30, 48],
      colors: [0xd8d0c0, 0x8fa9bf, 0xe4d8c0, 0x7d98ad], tallP: 0.55, tw: [22, 32], th: [70, 150], crown: true, curtain: true,
      shapes: ['box', 'box', 'taper', 'round'], tallColors: [0x5f8fb0, 0x8fb3c9, 0x4f7f8f, 0x6d8ba3, 0xa9bccb], tree: ['jacaranda', 'olive'], treeP: 0.45 }
  },
  radars: [0.09, 0.3, 0.52, 0.76],
  // Kenya is famous for its speed bumps
  bumps: [0.2, 0.44, 0.66, 0.92],
  landmarks: [
    { lat: -1.2884, lon: 36.8233, build: 'kicc', clear: 90, view: 200 },
    { lat: -1.2910, lon: 36.8180, build: 'uhuruPark', clear: 30, view: 160 },
    { lat: -1.3045, lon: 36.8254, build: 'nyayoStadium', clear: 110, view: 200 },
    { lat: -1.3217, lon: 36.8148, build: 'wilson', clear: 90, view: 160 },
    { lat: -1.3420, lon: 36.7950, build: 'nationalPark', clear: 30, view: 260 },
    { lat: -1.3565, lon: 36.7710, build: 'bomas', clear: 70, view: 140 },
    { lat: -1.2985, lon: 36.7623, build: 'mall', clear: 150, ink: '#b5122b', color: 0xeee6d8 },
    { lat: -1.2990, lon: 36.8120, build: 'britam', clear: 80, view: 220 },
    { lat: -1.2660, lon: 36.8070, build: 'gtc', clear: 90, view: 220 },
    { lat: -1.2738, lon: 36.8145, build: 'museum', clear: 80, view: 140 }
  ],
  // Kids Mode: the three places little ones pick from, by landmark
  kids: ['nationalPark', 'kicc', 'nyayoStadium'],
  // the cars you see most on Nairobi roads
  cars: [
    { kind: 'suv', vmax: 195, accel: 4.8, grip: 0.88, tough: 0.55, role: 'vip' },
    { kind: 'van', fixedColor: 0x1d1d22, extra: { stripe: 0xf2c400, art: [0xe8302a, 0x1fa2d9, 0xf2c400, 0x2e9d4a, 0xe83e8c] }, vmax: 160, accel: 4.0, grip: 0.92, tough: 0.5, role: 'bus', paxCap: 14 },
    { kind: 'dtaxi', fixedColor: 0xf4f4f0, extra: { roof: 0xf4f4f0 }, vmax: 175, accel: 4.4, grip: 1.0, tough: 1.0, role: 'taxi', paxCap: 4 },
    { kind: 'sports', vmax: 225, accel: 6.2, grip: 1.12, tough: 1.1, role: 'weave' },
    { kind: 'pickup', vmax: 170, accel: 4.2, grip: 0.84, tough: 0.5, role: 'tough' },
    { kind: 'f1', fixedColor: 0xd40000, vmax: 320, accel: 9.5, grip: 1.45, tough: 1.6, role: 'race' }
  ],
  stickers: ['', 'Mungu Mbele', 'Hakuna Matata', 'Pole Pole', 'Nai Ni Yetu', 'Harambee', 'Sema Nini?'],
  // Haitham Mode: what people on the sidewalk say, and the street seller's cart
  walk: {
    bump: ['Ebu angalia mbele!', 'Aki wewe!', 'Pole pole bana!', 'Si uangalie?', 'Uko sawa kweli?'],
    kid: ['Sorry uncle!', 'Pole!', 'Hehe!'],
    vendor: ['Mahindi choma! Mahindi!', 'Smokie pasua!', 'Maji baridi, maji!', 'Samosa moto!'],
    cart: { body: 0x2e6b3a, goods: 0xe0b040, shade: 0xc8102e }, bin: 0x3f5f4a
  },
  barks: {
    honk: ['Songa mbele boss!', 'Fungua njia!', 'Haraka haraka!', 'Ebu toka hapo!', 'Si utembee?'],
    cut: ['Weuh! Umeona hiyo?', 'Aki wewe dere!', 'Pole pole dere!', 'Fiti sana!', 'Leta drift ingine!'],
    pax: ['Shukisha hapa stage, makanga!', 'Nishukishe KICC tafadhali', 'Tunaenda tao?', 'Asante sana dere!']
  },
  colors: [0xf4f3ef, 0x141414, 0x9aa0a6, 0x1f4e9c, 0x6e1a22, 0x2e6b4a, 0x5a5f66, 0xc8a979],
  traffic: [
    // matatus everywhere: black and white with loud art, and the plainer white ones with the yellow PSV band
    { kind: 'van', colors: [0x1d1d22, 0x1d1d22, 0xf4f4f0], extra: { stripe: 0xf2c400, art: [0xe8302a, 0x1fa2d9, 0xf2c400, 0x2e9d4a] }, speed: [75, 110], wild: 0.5 },
    { kind: 'van', colors: [0xf4f4f0, 0x1d1d22, 0x7a1f2b], extra: { stripe: 0xf2c400, art: [0xe83e8c, 0x6a3fa0, 0x1fa2d9, 0xf26b1d] }, speed: [75, 110], wild: 0.5 },
    { kind: 'van', colors: [0xf4f4f0, 0xf4f4f0, 0xd8dce0], extra: { stripe: 0xf2c400 }, speed: [75, 100] },
    { kind: 'hatch', colors: [0xf4f3ef, 0xf4f3ef, 0xb9bec4, 0x9aa0a6], speed: [70, 100] },
    { kind: 'sedan', colors: [0xf4f3ef, 0xb9bec4, 0x5a5f66, 0x1d1f22, 0x2c4a7a, 0x8c1c24], speed: [75, 105] },
    { kind: 'suv', colors: [0xf4f3ef, 0x141414, 0x9aa0a6, 0x2e3a4a, 0x6e1a22], speed: [80, 115] },
    { kind: 'pickup', colors: [0xf4f3ef, 0xb9bec4, 0x3a3d42, 0x7a6a4e], speed: [70, 100] },
    { kind: 'sports', colors: [0x1f4e9c, 0x1f4e9c, 0xf4f3ef, 0x141414], speed: [90, 125], wild: 0.6 },
    // city buses in green and the long distance coaches
    { kind: 'bus', colors: [0x1e7a3c, 0xf4f4f0, 0x1f5fa8], extra: { stripe: 0xf2c400 }, speed: [60, 85] },
    { kind: 'truck', colors: [0xf4f3ef, 0xb3261e, 0x2b5b8f, 0xd9822b], extra: { cargo: 0xe2ddd2 }, speed: [55, 80] }
  ],
  flag(g, w, h) {
    // black, red and green with white lines, and the Maasai shield in the middle
    const b = h / 3, f = h * 0.05;
    g.fillStyle = '#000'; g.fillRect(0, 0, w, b); g.fillStyle = '#bb0000'; g.fillRect(0, b, w, b); g.fillStyle = '#006600'; g.fillRect(0, 2 * b, w, b);
    g.fillStyle = '#fff'; g.fillRect(0, b - f, w, f); g.fillRect(0, 2 * b, w, f);
    g.fillStyle = '#bb0000'; g.beginPath(); g.ellipse(w / 2, h / 2, h * 0.14, h * 0.36, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#000'; g.beginPath(); g.ellipse(w / 2, h / 2, h * 0.05, h * 0.3, 0, 0, Math.PI * 2); g.fill();
  },
  drawPlate(g, w, h, text) {
    // a Kenyan rear plate: black letters on yellow, with the small flag on the left
    g.fillStyle = '#f6c915'; g.fillRect(0, 0, w, h); g.strokeStyle = '#111'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    const b = (h - 40) / 3; g.fillStyle = '#000'; g.fillRect(14, 20, 34, b); g.fillStyle = '#bb0000'; g.fillRect(14, 20 + b, 34, b); g.fillStyle = '#006600'; g.fillRect(14, 20 + 2 * b, 34, b);
    g.fillStyle = '#111'; g.textAlign = 'center'; const t = String(text).toUpperCase();
    let z = 86; g.font = `bold ${z}px sans-serif`; while (z > 40 && g.measureText(t).width > w - 90) { z -= 4; g.font = `bold ${z}px sans-serif`; }
    g.fillText(t, w / 2 + 22, h / 2 + z * 0.36);
  },
  look: {
    clouds: 0.45, cloudColor: '#f4f6f8', exposure: 1.05, night: 0, fog: '#c9d6dc', fogNear: 600, fogFar: 6000, skyTop: '#4f86c0', sunGlow: '#ffe6b0',
    skyLight: 0xd6e4f0, groundLight: 0x8a7a5a, hemi: 1.15, sunColor: 0xfff0d0, sun: 1.9, sunDir: [-0.5, 0.75, -0.3],
    winLit: '#ffd58a', winGlass: '#3e4f60', windows: { floor: 3.3, bay: 3, size: 0.5 },
    pixelPalette: ['#1c1a17', '#2c2620', '#4a3a2c', '#7a4a32', '#a4593a', '#c97b5a', '#d99a72', '#e8dcc4', '#f4f1ea', '#cfc6b4', '#9a907e', '#6b6560',
      '#4f86c0', '#7aa6d0', '#a8c6e0', '#c9d6dc', '#3e4f60', '#5f8fb0', '#8fa9bf', '#4f6b33', '#6f9a3e', '#9ab35a', '#b9a65c', '#d9c27a',
      '#2a2a30', '#45454e', '#6b6b72', '#9a9aa0', '#c4c4c2', '#e2e1dc', '#8a6fc0', '#a98ad8', '#6a4fa0',
      '#bb0000', '#006600', '#f2c400', '#e8302a', '#1fa2d9', '#e83e8c'],
    ground: ['#4f7f2e', '#6e9a3c', '#7d6a48'], asphalt: '#4d4e52', median: '#7d8a5a', lineEdge: '#f2e7a0', lineLane: '#f2f2f2',
    paving: '#b8ad98', kerb: ['#f2f2f0', '#1c1c1c'], barrier: 0xcfc8b8, pole: 0xa8adb2, tanks: [0x2a2a2a, 0x2a4a8a],
    treeDark: 0x2f5a2a, treeLight: 0x5f8a3a, jacaranda: [0x8a6fc0, 0x9a7ad0, 0x7a5fb0], roofs: [0x8a3b2a, 0x9a4a32, 0x6b7a86, 0x3f6b8a, 0x2f6e4a, 0xa9adb2, 0x7a2e24],
    signColor: '#0a6b3a', warnColor: '#c89a0a', radarColor: 0xdedede,
    miniRoad: '#e8f0dc', miniDot: '#6fd49a', miniDest: '#ff5a4a', miniMe: '#ffffff'
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
  card: { color: '#b5122b', dark: '#ff7a85' },
  page: {
    tokens: {
      ground: '#c9d3b4', ink: '#1d2014', muted: '#5a614b', panel: 'rgba(246,244,236,0.94)', 'panel-solid': '#f8f6ee', chip: '#e6e8d6',
      line: '#d2d6c0', accent: '#b5122b', 'on-accent': '#ffffff', hud: 'rgba(18,22,16,0.72)', 'hud-ink': '#f7f6ee', 'accent-hud': '#ff8a93',
      bad: '#c8102e', good: '#127a3a', flagbar: 'linear-gradient(90deg,#000 0 30%,#fff 30% 33%,#bb0000 33% 67%,#fff 67% 70%,#006600 70%)'
    }
  }
};
