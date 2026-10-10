window.CITY = {
  id: 'amman', seed: 11, hills: true, lanes: 3, limit: 80, tolerance: 10, currency: 'د.أ',
  fines: { radar: 30, crash: 50 }, tripHop: 3,
  origin: [31.962, 35.900],
  horn: [415, 520],
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
      colors: [0xeadfca, 0xddcfb2, 0xf1e9d8, 0xd4c4a3, 0xe5d7ba, 0xcbb894], tanks: true, tree: 'mix', treeP: 0.5 },
    old: { rows: 6, w: [8, 13], d: [8, 12], h: [6, 15], setback: 8, rowGap: 15, jitter: 3, spacing: [10, 15], skew: 0.3,
      colors: [0xeadfca, 0xddcfb2, 0xd4c4a3, 0xc9a77c, 0xbfa07a, 0xe9e2d4], tanks: true, tree: 'cypress', treeP: 0.2 },
    tower: { rows: 4, w: [12, 20], d: [12, 18], h: [10, 24], setback: 12, rowGap: 26, jitter: 4, spacing: [18, 30], skew: 0.1,
      colors: [0xeadfca, 0xddcfb2, 0xf1e9d8, 0xd4c4a3], tanks: true, tree: 'mix', treeP: 0.4,
      tallP: 0.3, tw: [22, 34], th: [40, 170], tallColors: [0x7fa3bd, 0x9bb7c9, 0x5f7f97, 0xc9d3db] }
  },
  radars: [0.08, 0.3, 0.55, 0.8],
  bumps: [0.18, 0.43, 0.68, 0.9],
  landmarks: [
    { ar: 'دوار الداخلية', en: 'Interior Circle', lat: 31.9693, lon: 35.9078, build: 'fountain', clear: 30 },
    { ar: 'بوليفارد العبدلي', en: 'Abdali Boulevard', lat: 31.9625, lon: 35.9080, build: 'towers', clear: 100 },
    { ar: 'مسجد الملك عبدالله', en: 'King Abdullah I Mosque', lat: 31.9617, lon: 35.9137, build: 'mosqueBlue', clear: 50 },
    { ar: 'جبل القلعة', en: 'Amman Citadel', lat: 31.9540, lon: 35.9345, build: 'citadel', clear: 120 },
    { ar: 'سارية رغدان', en: 'Raghadan Flagpole', lat: 31.9573, lon: 35.9458, build: 'flagpole', clear: 20, h: 126 },
    { ar: 'المدرج الروماني', en: 'Roman Theatre', lat: 31.9516, lon: 35.9394, build: 'theatre', clear: 60 },
    { ar: 'شارع الرينبو', en: 'Rainbow Street', lat: 31.9512, lon: 35.9290, build: 'oldHouses', clear: 70 },
    { ar: 'جسر عبدون', en: 'Abdoun Bridge', lat: 31.9455, lon: 35.8960, build: 'cableBridge', clear: 140 },
    { ar: 'الدوار السابع', en: '7th Circle', lat: 31.9520, lon: 35.8705, build: 'fountain', clear: 30 },
    { ar: 'الصويفية', en: 'Sweifieh', lat: 31.9585, lon: 35.8640, build: 'shops', clear: 140 },
    { ar: 'مكة مول', en: 'Mecca Mall', lat: 31.9775, lon: 35.8460, build: 'mall', clear: 110, ink: '#7a1f2b' },
    { ar: 'شارع الجاردنز', en: 'Gardens Street', lat: 31.9845, lon: 35.8800, build: 'shops', clear: 140 }
  ],
  cars: [
    { name: 'هيونداي إلنترا', en: 'Hyundai Elantra', kind: 'taxi', fixedColor: 0xf2c12e, vmax: 175, accel: 4.6, grip: 1.05, tough: 1.0,
      pros: 'متوازنة وبتحشّر بسهولة', cons: 'ما بتتميّز بإشي' },
    { name: 'تويوتا بريوس', en: 'Toyota Prius', kind: 'hatch', vmax: 165, accel: 3.8, grip: 1.22, tough: 1.3,
      pros: 'ثابتة بالكوع وبتلف بسهولة', cons: 'تسارعها بطيء وبتخرب بسرعة' },
    { name: 'تويوتا هايلكس', en: 'Toyota Hilux', kind: 'pickup', vmax: 160, accel: 4.0, grip: 0.82, tough: 0.55,
      pros: 'تقيلة، الضربات والمطبات ما بتأثر فيها كثير', cons: 'بطيئة ولفّتها صعبة' }
  ],
  colors: [0xf2f2ee, 0xb9bec4, 0x1d1f22, 0xb3202a, 0x4a6b3a, 0x24365c],
  traffic: [
    { kind: 'taxi', colors: [0xf2c12e], speed: [70, 100], wild: 0.5 },
    { kind: 'taxi', colors: [0xf2c12e], speed: [70, 100], wild: 0.5 },
    { kind: 'sedan', colors: [0xf2f2ee, 0xb9bec4, 0x6b6f75, 0x1d1f22, 0x8c1c24, 0x2c4a7a], speed: [65, 95] },
    { kind: 'sedan', colors: [0xf2f2ee, 0xb9bec4, 0x6b6f75, 0x1d1f22], speed: [65, 95] },
    { kind: 'coaster', colors: [0xf4f4f0], extra: { stripe: 0x1f6e43 }, speed: [60, 85], wild: 1 },
    { kind: 'pickup', colors: [0xf2f2ee, 0x9aa0a6], speed: [55, 85] },
    { kind: 'bus', colors: [0xf4f4f0], extra: { stripe: 0x0b7a3b }, speed: [50, 70] },
    { kind: 'truck', colors: [0xe8e4da, 0x2b5b8f], extra: { cargo: 0xd9d2c3 }, speed: [50, 70] }
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
    ground: ['#b9a27a', '#a48c63', '#a39a88'], asphalt: '#3d3d40', median: '#8c8a85', lineEdge: '#f0f0f0', lineLane: '#e8e8e8',
    barrier: 0xb8b3a8, pole: 0x8d9196, tanks: [0x222222, 0x2b2b2b, 0xe8e8e8, 0x2f5d9a, 0xd8d8d0],
    treeDark: 0x3e5a33, treeLight: 0x7d8a5a, signColor: '#0d6b3d', warnColor: '#a8740a', radarColor: 0x2b2b2b,
    miniRoad: '#f1e6d0', miniDot: '#7ed09b', miniDest: '#ff4d5e', miniMe: '#ce1126'
  },
  text: {
    stSpeed: 'سرعة', stAccel: 'تسارع', stGrip: 'ثبات', stTough: 'تحمّل',
    meters: 'م', km: 'كم', kmh: 'كم/س', to: 'على', bumpSign: 'مطب', tollName: '', tollPrice: '',
    freeDrive: 'سواقة حرة', freeSub: 'بلا نهاية، صيانة كل 25 كم', freeHint: 'سوق براحتك، كل 25 كم في صيانة', fullLap: 'لفّة كاملة',
    goTo: 'يلا على', arrived: 'وصلنا!', wrecked: 'السيارة خربت', wreckedSub: 'بدها ونش',
    rTime: 'الوقت', rDist: 'المسافة', rAvg: 'معدل السرعة', rWeave: 'تحشيرات', rRadar: 'رادار', rCrash: 'حوادث', rFines: 'المخالفات',
    newBest: 'رقم قياسي جديد', best: 'أحسن نتيجة',
    rateTop: 'معلّم سواقة!', rateMid: 'مش بطال', rateBad: 'بدك دروس سواقة',
    scrape: 'حكّيت بالحاجز!', crash: 'ضربت سيارة!', radarAhead: 'رادار بعد', flash: 'صوّرك الرادار!', radarOk: 'مرقت عالرادار تمام',
    bumpHit: 'مطب! خفّف شوي', bumpOk: 'نزلت عالمطب بهدوء', bonus: '+500 كل 10 كم', workshop: 'صيانة: رجعت السيارة جديدة',
    weave: 'تحشيرة', loadRoad: 'بنرسم الشارع...', loadCity: 'بنبني عمّان...'
  },
  tour: {
    tryIt: 'جرّبها هلأ', nice: 'تمام!',
    steps: [
      { wait: 'gas', title: 'دوس بنزين', target: '.speedo', targetTouch: '[data-hold=gas]',
        keys: 'اضغط مطوّل على <kbd>↑</kbd> أو <kbd>W</kbd> وخلّي السرعة تطلع فوق 45.', touch: 'اضغط مطوّل على زر <b>بنزين</b> وخلّي السرعة تطلع فوق 45.' },
      { wait: 'steer', title: 'غيّر المسرب', targetTouch: '.steer',
        keys: 'استعمل <kbd>←</kbd> و<kbd>→</kbd> (أو <kbd>A</kbd> و<kbd>D</kbd>) وانقل لمسرب ثاني.', touch: 'استعمل الأسهم اللي عاليسار وانقل لمسرب ثاني.' },
      { wait: 'brake', title: 'البريك', targetTouch: '[data-hold=brake]',
        keys: 'اضغط <kbd>↓</kbd> أو <kbd>S</kbd> وخفّف السرعة.', touch: 'اضغط على زر <b>بريك</b> وخفّف السرعة.' },
      { wait: 'horn', title: 'الزامور', targetTouch: '[data-hold=horn]',
        keys: 'اضغط <kbd>Space</kbd>. السيارة اللي قدامك بتوسّعلك إذا المسرب اللي جنبها فاضي.', touch: 'اضغط على زر <b>زامور</b>. السيارة اللي قدامك بتوسّعلك إذا المسرب اللي جنبها فاضي.' },
      { title: 'العداد', target: '.speedo', body: 'الرقم الكبير سرعتك، والدائرة الحمرا الحد المسموح. إذا صار الرقم أحمر يعني الرادار رح يصوّرك. قبل كل رادار بتطلعلك إشارة صفرا.' },
      { title: 'وين رايحين', target: '.trip-hud', body: 'هون اسم وجهتك وقديش ضايل للوصول. بالسواقة الحرة بتشوف قديش سقت.' },
      { title: 'النقاط والمخالفات', target: '.stats', body: 'النقاط بتزيد مع المسافة والتحشيرات، والرادار والحوادث بنقصوا منها. إذا الضرر وصل للآخر السيارة بتخرب.' },
      { title: 'الخريطة', target: '#mini', body: 'النقطة الحمرا إنت، والنقاط الخضرا المعالم. وجهتك بتبيّن أكبر.' },
      { title: 'التحشيرة', body: 'مرّ جنب السيارات من قريب وإنت أسرع منها لتاخذ نقاط. كذا وحدة ورا بعض بتضاعف النقاط.' },
      { title: 'الاستراحة', target: '#btnPause', keys: 'من هون بتوقّف اللعبة وبتغيّر الكاميرا والصوت. <kbd>C</kbd> بتغيّر الكاميرا و<kbd>P</kbd> بتوقّف.', touch: 'من هون بتوقّف اللعبة وبتغيّر الكاميرا ومكان الزامور والصوت.' }
    ]
  },
  page: {
    title: 'لفّة عمّان', name: 'لفّة عمّان', eyebrow: 'Amman · عمّان', alt: 'Driving through Amman',
    blurb: 'من العبدلي للقلعة لجبل عمّان، بين الطلعات والنزلات. انتبه عالرادار والمطبات، وحشّر بين السيارات بس بدون ما تضرب.',
    T_NEXT: 'رايحين على', T_KMH: 'كم/س', T_TIME: 'الوقت', T_SCORE: 'النقاط', T_VIOL: 'مخالفات', T_DMG: 'الضرر', T_PAUSE: 'وقّف',
    T_HORN: 'زامور', T_BRAKE: 'بريك', T_GAS: 'بنزين', T_DIR: 'الاتجاه', T_CW: 'مع عقارب الساعة', T_CCW: 'عكس عقارب الساعة',
    T_TRIP: 'المشوار', T_TRAFFIC: 'أزمة السير', T_TR0: 'فاضية', T_TR1: 'عادية', T_TR2: 'أزمة', T_GO: 'يلا نطلع',
    T_GARAGE: 'الكراج', T_SETTINGS: 'الإعدادات', T_CARS: 'السيارة', T_COLOR: 'اللون', T_FIXEDCOLOR: 'التكسي لونه أصفر وبس',
    T_PLATE: 'النمرة', T_CAM: 'الكاميرا', T_CAM0: 'قريبة', T_CAM1: 'عادية', T_CAM2: 'بعيدة', T_HORNSIDE: 'مكان الزامور',
    T_LEFT: 'يسار', T_RIGHT: 'يمين', T_SOUND: 'الصوت', T_ON: 'شغّال', T_OFF: 'مسكّر',
    T_KEYS: 'السواقة بالأسهم أو <kbd>WASD</kbd> · الزامور <kbd>Space</kbd> · الكاميرا <kbd>C</kbd> · وقوف <kbd>P</kbd>',
    T_MAPNOTE: 'الطريق مرسوم بشكل تقريبي على أماكن حقيقية بعمّان. الزامور بخلّي السيارة اللي قدامك توسّعلك.',
    T_PAUSED: 'استراحة', T_RESUME: 'كمّل', T_QUIT: 'رجوع للقائمة', T_AGAIN: 'عيدها', T_NEWTRIP: 'مشوار ثاني',
    T_HOWTO: 'كيف ألعب؟', T_R1: 'وصّل مشوارك', T_R1S: 'اختار مشوار بين معالم عمّان، من العبدلي للقلعة لمكة مول، ووصل لآخره.',
    T_R2: 'حشّر وجمّع نقاط', T_R2S: 'كل ما تتجاوز سيارة من قريب وبسرعة بتاخذ نقاط، وإذا ورا بعض بتتضاعف.',
    T_R3: 'انتبه للمخالفات', T_R3S: 'الرادار بصوّر فوق 90 كم/س، والمطبات والحوادث بتخرّب السيارة.',
    T_WTOUR: 'جولة تعليمية', T_WSKIP: 'بعرف أسوق، بدي ألعب', T_TSKIP: 'تخطّي الجولة', T_TNEXT: 'التالي',
    T_TEND: 'جاهز!', T_TENDS: 'خلصت الجولة. بدك تختار مشوار ولا تكمّل سواقة حرة؟', T_TEMENU: 'اختار مشوار', T_TEDRIVE: 'كمّل سواقة حرة',
    T_QUALITY: 'الرسومات', T_QHIGH: 'عالية', T_QLOW: 'سريعة',
    otherLabel: 'جرّب دبي',
    tokens: {
      ground: '#cbb48c', ink: '#2b2118', muted: '#6f6253', panel: 'rgba(246,240,229,0.94)', 'panel-solid': '#fbf7ef', chip: '#ece2cf',
      line: '#dccfb7', accent: '#0b6e3a', 'on-accent': '#ffffff', hud: 'rgba(28,24,20,0.72)', 'hud-ink': '#fbf5ea', 'accent-hud': '#8fe0ab',
      bad: '#c8102e', good: '#0b7a3b', flagbar: 'linear-gradient(90deg,#111 0 30%,#f4efe6 30% 60%,#0b7a3b 60% 88%,#ce1126 88%)'
    }
  }
};
