window.CITY = {
  id: 'johannesburg', order: 101, seed: 61, hills: true, lanes: 4, limit: 100, tolerance: 10,
  // South Africa drives on the left, and its road signs are in English
  drive: 'left', signs: 'en',
  // speeding fines grow with how far over you are: [km/h over, rand]; a crash is fined as reckless driving
  fines: { radar: [[10, 500], [15, 750], [20, 1000], [30, 1500], [40, 2500]], crash: 1000 }, tripHop: 3,
  // fares count the same in every city; this turns them into rand for the screen (a taxi seat is about R16)
  fareMul: 2,
  origin: [-26.18, 28.02],
  weather: 'rain', // spring brings the afternoon thunderstorms
  horn: [349, 440],
  // the car radio: amapiano with its log drum, kwaito, and Soweto jive guitar
  radio: [
    { seed: 2111, bpm: 113, rhythm: 'amapiano', maqam: 'minor', root: 110, lead: 'piano', ghost: 0.12, swing: 0.06, chord2: 5 },
    { seed: 2222, bpm: 104, rhythm: 'kwaito', maqam: 'mixo', root: 123.47, lead: 'synth', chord2: 4 },
    { seed: 2333, bpm: 132, rhythm: 'fallahi', maqam: 'major', root: 196, lead: 'guitar', ghost: 0.1, chord2: 4 }
  ],
  defaultPlate: 'JZ 21 KS GP',
  route: [
    [-26.2050, 28.0430, 'cbd'], [-26.1975, 28.0392, 'cbd'], [-26.1880, 28.0430, 'mid'], [-26.1700, 28.0452, 'leafy'],
    [-26.1480, 28.0502, 'leafy'], [-26.1280, 28.0560, 'leafy'], [-26.1090, 28.0560, 'tower'], [-26.1040, 28.0400, 'tower'],
    [-26.1250, 28.0250, 'leafy'], [-26.1480, 28.0000, 'leafy'], [-26.1780, 27.9800, 'mid'], [-26.2100, 27.9500, 'township'],
    [-26.2420, 27.9250, 'township'], [-26.2530, 27.9500, 'township'], [-26.2380, 27.9800, 'mid'], [-26.2380, 28.0050, 'mine'],
    [-26.2250, 28.0300, 'mid']
  ],
  fill: { count: 14000, pad: 1400, zone: 'leafy', yaw: 0.15 },
  defaultZone: 'mid',
  zones: {
    // the CBD: old concrete towers in brown and grey, packed close
    cbd: { rows: 4, w: [16, 26], d: [14, 22], h: [24, 50], setback: 11, rowGap: 28, jitter: 5, spacing: [20, 30],
      colors: [0xb9ad98, 0x9a8f80, 0xcfc4b0, 0x8a7f72, 0xd9d0c0], tallP: 0.45, tw: [20, 30], th: [60, 140], crown: true,
      shapes: ['box', 'box', 'round'], tallColors: [0x8a7f72, 0xa9a090, 0x6f8fa8, 0x7d756a], tree: 'jacaranda', treeP: 0.35 },
    // Braamfontein and Parktown: mid sized blocks under purple jacarandas
    mid: { rows: 4, w: [14, 22], d: [12, 18], h: [8, 22], setback: 10, rowGap: 22, jitter: 5, spacing: [18, 28], skew: 0.08,
      colors: [0xe6dccb, 0xd9c4a0, 0xc97b5a, 0xf0e8d8, 0xb5a58a], balcony: true, tree: ['jacaranda', 'jacaranda', 'olive'], treeP: 0.6 },
    // the northern suburbs: walled houses with red and grey tile roofs, a sea of jacarandas in October
    leafy: { rows: 3, w: [12, 18], d: [12, 16], h: [4, 8], setback: 13, rowGap: 24, jitter: 7, spacing: [20, 30],
      colors: [0xf4efe4, 0xe8dcc4, 0xf0e6d6, 0xd9c9a8], roof: true, tree: ['jacaranda', 'jacaranda', 'olive'], treeP: 0.9 },
    // Sandton: the new glass towers of the richest square mile in Africa
    tower: { rows: 3, w: [18, 30], d: [18, 28], h: [24, 60], setback: 15, rowGap: 46, jitter: 8, spacing: [34, 54],
      colors: [0xd8d0c0, 0x8fa9bf, 0xe4d8c0, 0x7d98ad], tallP: 0.6, tw: [22, 34], th: [80, 170], crown: true, curtain: true,
      shapes: ['box', 'box', 'taper', 'round'], tallColors: [0x6f8fa8, 0x9ab0c0, 0x4f6f84, 0xc2c8cc, 0x8aa6bd], tree: 'jacaranda', treeP: 0.4 },
    // Soweto: rows of small brick houses with tin roofs, some painted bright
    township: { rows: 6, w: [6, 9], d: [6, 9], h: [3, 4.2], setback: 8, rowGap: 11, jitter: 2, spacing: [9, 13],
      colors: [0xb5654a, 0xa85a40, 0xd9c4a0, 0xe8e2d6, 0x6fb0d0, 0xf2c418, 0x8fc06a, 0xe88a5a], roof: true, tree: 'olive', treeP: 0.2 },
    // the old mine belt: sheds and yards between the yellow mine dumps
    mine: { rows: 2, w: [20, 34], d: [16, 26], h: [7, 12], setback: 20, rowGap: 40, jitter: 10, spacing: [40, 70],
      colors: [0xa9adb2, 0x9a948a, 0xc4bca8], roof: true, tree: 'olive', treeP: 0.15 }
  },
  radars: [0.07, 0.24, 0.42, 0.6, 0.78, 0.92],
  landmarks: [
    { lat: -26.2054, lon: 28.0465, build: 'carlton', clear: 90, view: 200 },
    { lat: -26.1960, lon: 28.0402, build: 'mandelaBridge', clear: 60, view: 200 },
    { lat: -26.1905, lon: 28.0499, build: 'hillbrow', clear: 50, view: 160 },
    { lat: -26.1910, lon: 28.0560, build: 'ponte', clear: 60, view: 160 },
    { lat: -26.1068, lon: 28.0575, build: 'sandton', clear: 120, view: 300 },
    { lat: -26.1074, lon: 28.0520, build: 'mandelaStatue', clear: 60, view: 120 },
    { lat: -26.2462, lon: 27.9262, build: 'orlando', clear: 90, view: 180 },
    { lat: -26.2362, lon: 27.9818, build: 'fnb', clear: 140, view: 240 },
    { lat: -26.2356, lon: 28.0136, build: 'goldReef', clear: 80, view: 180 },
    { lat: -26.2260, lon: 28.0240, build: 'mineDump', clear: 120, view: 260 }
  ],
  // Kids Mode: the three places little ones pick from, by landmark
  kids: ['orlando', 'fnb', 'goldReef'],
  // the cars you see most on Johannesburg roads
  cars: [
    { kind: 'bmw', vmax: 230, accel: 6.0, grip: 1.12, tough: 1.0, role: 'weave' },
    { kind: 'van', fixedColor: 0xf4f4f0, extra: { stripe: 0xe8302a }, vmax: 160, accel: 4.0, grip: 0.92, tough: 0.5, role: 'bus', paxCap: 14 },
    { kind: 'pickup', vmax: 175, accel: 4.3, grip: 0.84, tough: 0.5, role: 'tough' },
    { kind: 'hatch', vmax: 175, accel: 4.0, grip: 1.2, tough: 1.25, role: 'weave' },
    { kind: 'suv', vmax: 190, accel: 4.6, grip: 0.86, tough: 0.6, role: 'vip' },
    { kind: 'f1', fixedColor: 0xd40000, vmax: 320, accel: 9.5, grip: 1.45, tough: 1.6, role: 'race' }
  ],
  stickers: ['', 'Sharp Sharp', 'Ubuntu', 'Proudly Jozi', 'Lekker!', 'Eish', 'Ayoba!'],
  // Haitham Mode: what people on the sidewalk say, and the street seller's cart
  walk: {
    bump: ['Eish! Watch where you\'re going!', 'Hayibo!', 'Yoh, careful my bru!', 'Look up, man!', 'Jislaaik!'],
    kid: ['Sorry, malume!', 'Eish, sorry!', 'Haha!'],
    vendor: ['Kota! Fresh kota!', 'Vetkoek, still hot!', 'Mielies! Mielies!', 'Cold drinks, sharp price!'],
    cart: { body: 0x1f5fa8, goods: 0xe0b040, shade: 0xf2c418 }, bin: 0x3a5a3a
  },
  barks: {
    honk: ['Move, my bru!', 'Eish, come on!', 'Sharp sharp, go!', 'Hayibo, drive!', 'The robot is green, ja!'],
    cut: ['Yoh! Did you see that?', 'Haibo!', 'Lekker moves, bru!', 'Eish, check your mirror!', 'Jislaaik, slow down!'],
    pax: ['Short left, driver!', 'Drop me by Bree, please', 'Sandton, sharp sharp', 'Ngiyabonga, driver!']
  },
  colors: [0xf4f3ef, 0x141414, 0x9aa0a6, 0x8c1c24, 0x1f3556, 0x2e6b4a, 0x5a5f66, 0xd9a52a],
  traffic: [
    // the white minibus taxis, everywhere, many with a stripe in the owner's colour
    { kind: 'van', colors: [0xf4f4f0, 0xf4f4f0, 0xeceae4], extra: { stripe: 0xe8302a }, speed: [80, 120], wild: 0.6 },
    { kind: 'van', colors: [0xf4f4f0, 0xf4f4f0, 0xd8dce0], extra: { stripe: 0x1f5fa8 }, speed: [80, 120], wild: 0.6 },
    { kind: 'van', colors: [0xf4f4f0, 0xd8dce0], speed: [80, 115], wild: 0.4 },
    { kind: 'hatch', colors: [0xf4f3ef, 0xb9bec4, 0x8c1c24, 0x1d1f22, 0x2c4a7a, 0xd9a52a], speed: [85, 115] },
    { kind: 'bmw', colors: [0x141414, 0xf4f3ef, 0x9aa0a6, 0x1f3556, 0x8c1c24], speed: [100, 135], wild: 0.5 },
    { kind: 'sedan', colors: [0xf4f3ef, 0xb9bec4, 0x5a5f66, 0x1d1f22, 0x2c4a7a], speed: [90, 120] },
    { kind: 'pickup', colors: [0xf4f3ef, 0xf4f3ef, 0xb9bec4, 0x3a3d42, 0x8c1c24], speed: [85, 115] },
    { kind: 'suv', colors: [0xf4f3ef, 0x141414, 0x9aa0a6, 0x5a5f66], speed: [90, 125] },
    // the red Rea Vaya buses and the blue Metrobus
    { kind: 'bus', colors: [0xc8102e, 0x1f5fa8], extra: { stripe: 0xf4f4f0 }, speed: [60, 85] },
    { kind: 'truck', colors: [0xf4f3ef, 0xb3261e, 0x2b5b8f, 0xd9822b, 0x2f6b3a], extra: { cargo: 0xe2ddd2 }, speed: [70, 95] }
  ],
  flag(g, w, h) {
    // the South African flag: red over blue, the green Y edged in white, and the black triangle edged in gold
    g.fillStyle = '#de3831'; g.fillRect(0, 0, w, h / 2); g.fillStyle = '#002395'; g.fillRect(0, h / 2, w, h / 2);
    const y = (pts, c) => { g.fillStyle = c; g.beginPath(); pts.forEach(([x, yy], i) => (i ? g.lineTo(x * w, yy * h) : g.moveTo(x * w, yy * h))); g.fill(); };
    y([[0, 0], [0.18, 0], [0.5, 0.36], [1, 0.36], [1, 0.64], [0.5, 0.64], [0.18, 1], [0, 1]], '#fff');
    y([[0, 0.06], [0.1, 0], [0.47, 0.4], [1, 0.4], [1, 0.6], [0.47, 0.6], [0.1, 1], [0, 0.94]], '#007a4d');
    y([[0, 0.18], [0.29, 0.5], [0, 0.82]], '#ffb612');
    y([[0, 0.25], [0.23, 0.5], [0, 0.75]], '#000');
  },
  drawPlate(g, w, h, text) {
    // a Gauteng plate: black letters on white, the province's skyline band along the top and GP at the end
    g.fillStyle = '#fbfbf6'; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#f2a900'); gr.addColorStop(0.5, '#3a8fd0'); gr.addColorStop(1, '#2e9d4a');
    g.fillStyle = gr; g.fillRect(6, 6, w - 12, 18);
    g.fillStyle = '#fbfbf6'; for (let x = 12; x < w - 12; x += 22) g.fillRect(x, 6, 10, 6 + (x * 7) % 10);
    g.strokeStyle = '#111'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = '#111'; g.textAlign = 'center'; const t = String(text).toUpperCase();
    let z = 78; g.font = `bold ${z}px sans-serif`; while (z > 36 && g.measureText(t).width > w - 40) { z -= 4; g.font = `bold ${z}px sans-serif`; }
    g.fillText(t, w / 2, h / 2 + 12 + z * 0.36);
  },
  look: {
    clouds: 0.3, cloudColor: '#f6f6f2', exposure: 1.05, night: 0, fog: '#d6dbd2', fogNear: 700, fogFar: 7000, skyTop: '#3f7fc8', sunGlow: '#ffe2a0',
    skyLight: 0xd8e4f0, groundLight: 0x9a8a5a, hemi: 1.15, sunColor: 0xfff0d0, sun: 2.0, sunDir: [0.4, 0.7, 0.4],
    winLit: '#ffd58a', winGlass: '#3e4f60', windows: { floor: 3.4, bay: 3, size: 0.5 },
    pixelPalette: ['#1c1a17', '#2c2620', '#4a3a2c', '#7a4a32', '#8b3a2b', '#b5654a', '#c97b5a', '#d9c4a0', '#e8dcc4', '#f4efe4', '#9a8f80', '#8a7f72',
      '#3f7fc8', '#6f9fd8', '#a8c6e6', '#d6dbd2', '#3e4f60', '#6f8fa8', '#9ab0c0', '#4f6b33', '#7a8f45', '#9aa060', '#b5a76a', '#d9c27a',
      '#2a2a30', '#45454e', '#6b6b72', '#9a9aa0', '#c4c4c2', '#e2e1dc', '#8a6fc0', '#a98ad8', '#6a4fa0',
      '#de3831', '#002395', '#007a4d', '#ffb612', '#e83e8c', '#1fa2d9'],
    ground: ['#7f9a4a', '#a8a868', '#8a8460'], asphalt: '#47484c', median: '#9a9a8a', lineEdge: '#f2d23a', lineLane: '#f2f2f2',
    paving: '#bfb6a4', kerb: ['#f2f2f0', '#c8102e'], barrier: 0xcfc8b8, pole: 0xa8adb2, tanks: [0x2a2a2a, 0x9aa0a6],
    treeDark: 0x2f5a2a, treeLight: 0x6a8a3a, jacaranda: [0x8a6fc0, 0x9a7ad0, 0x7a5fb0, 0xa98ad8], roofs: [0x8b3a2b, 0x4a4d52, 0x9aa0a6, 0x7a2e24, 0x5a6f7a, 0xa04a32],
    signColor: '#0a6b3a', warnColor: '#c89a0a', radarColor: 0xdedede,
    miniRoad: '#eef0dc', miniDot: '#6fd49a', miniDest: '#ff5a4a', miniMe: '#ffffff'
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
  card: { color: '#6a3fa0', dark: '#b893f0' },
  page: {
    tokens: {
      ground: '#d2cfe0', ink: '#1e1a26', muted: '#5e586c', panel: 'rgba(246,244,250,0.94)', 'panel-solid': '#f8f6fb', chip: '#e8e2f2',
      line: '#d8d2e4', accent: '#6a3fa0', 'on-accent': '#ffffff', hud: 'rgba(22,18,28,0.72)', 'hud-ink': '#f7f5fa', 'accent-hud': '#c4a4f4',
      bad: '#c8102e', good: '#127a3a', flagbar: 'linear-gradient(90deg,#007a4d 0 22%,#ffb612 22% 28%,#000 28% 44%,#fff 44% 48%,#de3831 48% 74%,#fff 74% 78%,#002395 78%)'
    }
  }
};
