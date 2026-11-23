// ---------- sound: engine, road, horns, effects and a car radio, all made live in Web Audio ----------
// Nothing here loads a sound file. Every sound is built from oscillators and noise.
const SND = (() => {
  let ac = null, out = null, comp = null, limiter = null, bus = {}, musicOut = null, musicLP = null, musicGain = null;
  let white = null, pink = null, tanhCurve = null;
  const vol = { engine: 0.7, horn: 0.8, fx: 0.8, music: 0.6 };
  let sfxOn = true, musicOn = true, gestured = false, appActive = true;
  const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
  const taper = (v) => clampN(v, 0, 1); // volumes stay linear so the mix sounds as before
  const now = () => ac.currentTime;
  // only write a value when it really changed, so we don't pile up automation events
  function set(p, v, tau, t) { if (Math.abs((p._last == null ? p.value : p._last) - v) < 1e-4 + Math.abs(v) * 1e-3) return; p._last = v; p.setTargetAtTime(v, t == null ? now() : t, tau || 0.05); }

  function make() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* ignore */ }
    ac = new Ctx({ latencyHint: 'interactive' });
    // master brickwall safety limiter before destination prevents digital clipping when SFX + horns + radio stack
    limiter = ac.createDynamicsCompressor();
    limiter.threshold.value = -1.5; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.001; limiter.release.value = 0.08;
    limiter.connect(ac.destination);
    comp = ac.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.2;
    out = ac.createGain(); out.gain.value = 0.9; out.connect(comp); comp.connect(limiter);
    for (const k of ['engine', 'horn', 'fx']) { bus[k] = ac.createGain(); bus[k].connect(out); }
    // the radio skips the SFX compressor so effects can't pump it, but still passes through the safety limiter
    musicGain = ac.createGain(); musicGain.gain.value = 0;
    musicLP = ac.createBiquadFilter(); musicLP.type = 'lowpass'; musicLP.frequency.value = 18000; musicLP.Q.value = 0.5;
    musicOut = ac.createGain(); musicOut.gain.value = 1;
    musicOut.connect(musicLP); musicLP.connect(musicGain); musicGain.connect(limiter);
    ac.onstatechange = () => { if (ac && ac.state === 'running' && wxKind && !wx) weather(wxKind); };
    // shared noise: two seconds of white, four of pink
    const sr = ac.sampleRate;
    white = ac.createBuffer(1, sr * 2, sr); { const d = white.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    pink = ac.createBuffer(1, sr * 4, sr); {
      const d = pink.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0527; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12; }
    }
    tanhCurve = new Float32Array(512); for (let i = 0; i < 512; i++) { const x = i / 255.5 - 1; tanhCurve[i] = Math.tanh(2.2 * x) / Math.tanh(2.2); }
    applyVolumes();
    return true;
  }
  function applyVolumes() {
    if (!ac) return;
    set(bus.engine.gain, sfxOn ? taper(vol.engine) : 0, 0.02);
    set(bus.horn.gain, sfxOn ? taper(vol.horn) : 0, 0.02);
    set(bus.fx.gain, sfxOn ? taper(vol.fx) : 0, 0.02);
    radio.level();
  }
  let unlockedOnce = false;
  // the first touch, click or key wakes the sound (iOS WebKit benefits from touchstart + 1-sample silent buffer)
  function unlock() {
    gestured = true;
    if (!ac && !make()) return;
    if (!unlockedOnce) {
      unlockedOnce = true;
      try { const b = ac.createBuffer(1, 1, ac.sampleRate), s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.start(0); } catch (e) { /* ignore */ }
    }
    if (appActive && ac.state !== 'running') ac.resume().catch(() => {});
    if (wxKind && !wx) weather(wxKind);
  }
  for (const ev of ['touchstart', 'pointerdown', 'touchend', 'keydown', 'click']) addEventListener(ev, unlock, { capture: true, passive: true });
  function setAppActive(on) {
    appActive = !!on;
    if (!ac) return;
    if (!appActive) ac.suspend().catch(() => {});
    else if (gestured && !document.hidden) ac.resume().catch(() => {});
  }
  // some phones leave the sound asleep after a call or a lock; keep nudging it while the page is in view
  setInterval(() => { if (ac && gestured && appActive && !document.hidden && ac.state !== 'running') ac.resume().catch(() => {}); }, 1000);
  document.addEventListener('visibilitychange', () => setAppActive(!document.hidden));
  addEventListener('pagehide', () => setAppActive(false));
  addEventListener('pageshow', () => setAppActive(true));

  function noiseSrc(buf, loop) { const s = ac.createBufferSource(); s.buffer = buf || white; s.loop = loop !== false; if (s.loop) s.loopStart = Math.random(); return s; }
  function filt(type, f, q, gain) { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; if (gain != null) b.gain.value = gain; return b; }
  function gainN(v) { const g = ac.createGain(); g.gain.value = v; return g; }
  function chain(...n) { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; }
  function stopAt(nodes, t) { for (const n of nodes) { try { n.stop(t); } catch (e) { /* ignore */ } } }
  // a short decaying burst of noise
  function burst(t, len, gain, nodes, dest, pow) {
    const s = noiseSrc(white, false); const g = gainN(0);
    g.gain.setValueAtTime(Math.max(0, gain), t); g.gain.setTargetAtTime(0, t, len / (pow || 3));
    let last = s; for (const n of nodes) { last.connect(n); last = n; } last.connect(g); g.connect(dest);
    s.start(t, Math.random() * 1.5); s.stop(t + len + 0.05);
  }
  // one note with a fast attack and an exponential fall
  function blip(freq, dur, wave, gain, dest, t) {
    if (!ac || !sfxOn) return;
    t = t == null ? now() : t;
    const peak = Math.max(0.0002, gain || 0.0002);
    const o = ac.createOscillator(); o.type = wave || 'triangle'; o.frequency.value = freq;
    const g = gainN(0); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || bus.fx); o.start(t); o.stop(t + dur + 0.02);
  }

  // ---------- engine ----------
  // each car has its own voice: base and top pitch, how hard the firing pulse chops,
  // how bright it gets, a short pipe echo and an optional gear whine
  const VOICES = {
    taxi:   { base: 30, span: 82, bite: 2, biteG: 0.32, fire: 2, fireWave: 'sine', depth: 0.38, lp: 700, lpSpan: 2300, peak: 380, peakQ: 1.2, peakG: 5, comb: 0.0021, vol: 0.085, rum: 0.022, rumF: 3, whine: 6, whineG: 0.026, gears: 5 },
    bmw:    { base: 34, span: 120, bite: 3, biteG: 0.3, fire: 3, fireWave: 'sawtooth', depth: 0.28, lp: 820, lpSpan: 3300, peak: 520, peakQ: 1.4, peakG: 5, comb: 0.0016, vol: 0.085, rum: 0.02, rumF: 3, whine: 6, whineG: 0.018, gears: 8 },
    hatch:  { base: 28, span: 70, bite: 2, biteG: 0.24, fire: 2, fireWave: 'sine', depth: 0.2, lp: 600, lpSpan: 1700, peak: 330, peakQ: 1, peakG: 3, comb: 0.0018, vol: 0.065, rum: 0.014, rumF: 3, whine: 11, whineG: 0.05, gears: 1 },
    pickup: { base: 17, span: 44, bite: 3, biteG: 0.44, fire: 3, fireWave: 'triangle', depth: 0.55, lp: 440, lpSpan: 1300, peak: 230, peakQ: 1.5, peakG: 6, comb: 0.0033, vol: 0.11, rum: 0.06, rumF: 7, whine: 4, whineG: 0.02, gears: 5 },
    suv:    { base: 20, span: 62, bite: 2, biteG: 0.4, fire: 2, fireWave: 'square', depth: 0.5, lp: 520, lpSpan: 1800, peak: 300, peakQ: 1.4, peakG: 6, comb: 0.0029, vol: 0.1, rum: 0.05, rumF: 4, whine: 0, whineG: 0, gears: 7 },
    sports: { base: 42, span: 175, bite: 1.5, biteG: 0.36, fire: 2.5, fireWave: 'sawtooth', depth: 0.3, lp: 900, lpSpan: 4200, peak: 700, peakQ: 1.6, peakG: 6, comb: 0.0012, vol: 0.085, rum: 0.02, rumF: 5, whine: 8, whineG: 0.02, gears: 7 },
    dtaxi:  { base: 28, span: 76, bite: 2, biteG: 0.3, fire: 2, fireWave: 'sine', depth: 0.32, lp: 650, lpSpan: 2100, peak: 360, peakQ: 1.2, peakG: 4, comb: 0.002, vol: 0.08, rum: 0.02, rumF: 3, whine: 7, whineG: 0.03, gears: 6 },
    sedan:  { base: 32, span: 92, bite: 2, biteG: 0.28, fire: 2, fireWave: 'triangle', depth: 0.24, lp: 680, lpSpan: 2500, peak: 420, peakQ: 1.1, peakG: 4, comb: 0.0019, vol: 0.075, rum: 0.016, rumF: 3, whine: 5, whineG: 0.022, gears: 6 },
    f1:     { base: 70, span: 300, bite: 1.2, biteG: 0.3, fire: 2, fireWave: 'sawtooth', depth: 0.22, lp: 1300, lpSpan: 5600, peak: 1100, peakQ: 1.8, peakG: 6, comb: 0.0009, vol: 0.08, rum: 0.012, rumF: 6, whine: 12, whineG: 0.03, gears: 8 },
    van:    { base: 22, span: 58, bite: 2.5, biteG: 0.38, fire: 2, fireWave: 'triangle', depth: 0.46, lp: 520, lpSpan: 1600, peak: 280, peakQ: 1.3, peakG: 5, comb: 0.0027, vol: 0.1, rum: 0.045, rumF: 5, whine: 6, whineG: 0.03, gears: 5 },
    boxer:  { base: 29, span: 108, bite: 1.5, biteG: 0.46, fire: 2, fireWave: 'triangle', depth: 0.56, lp: 740, lpSpan: 2800, peak: 340, peakQ: 1.7, peakG: 6, comb: 0.0024, vol: 0.095, rum: 0.048, rumF: 4, whine: 9, whineG: 0.028, gears: 6 },
    // kids mode race cars: a soft, round toy hum with no gear changes, in place of a screaming race engine
    toy:    { base: 52, span: 60, bite: 1, biteG: 0.12, fire: 1, fireWave: 'sine', depth: 0.3, lp: 380, lpSpan: 520, peak: 300, peakQ: 0.8, peakG: 2, comb: 0.0015, vol: 0.06, rum: 0.006, rumF: 3, whine: 0, whineG: 0, gears: 1, drive: 0.35 },
    coaster:{ base: 19, span: 48, bite: 2.5, biteG: 0.42, fire: 3, fireWave: 'triangle', depth: 0.52, lp: 460, lpSpan: 1400, peak: 250, peakQ: 1.4, peakG: 6, comb: 0.0031, vol: 0.105, rum: 0.055, rumF: 6, whine: 5, whineG: 0.025, gears: 6 }
  };
  let eng = null;
  function buildEngine(kind) {
    if (eng && eng.kind === kind) return;
    dropEngine();
    const V = VOICES[kind] || VOICES.taxi; const t = now();
    const saw = ac.createOscillator(); saw.type = 'sawtooth';
    const sub = ac.createOscillator(); sub.type = 'square';
    const hi = ac.createOscillator(); hi.type = 'sawtooth';
    const subG = gainN(V.biteG), hiG = gainN(0.15), drive = gainN(1);
    const shaper = ac.createWaveShaper(); shaper.curve = tanhCurve; shaper.oversample = '2x';
    const lp = filt('lowpass', V.lp, 1), pk = filt('peaking', V.peak, V.peakQ, V.peakG);
    // the firing pulse: a low wave pushes the level up and down at the cylinder rate
    const am = gainN(1 - V.depth / 2), lfo = ac.createOscillator(); lfo.type = V.fireWave; const lfoG = gainN(V.depth / 2);
    lfo.connect(lfoG); lfoG.connect(am.gain);
    saw.connect(drive); sub.connect(subG); subG.connect(drive); hi.connect(hiG); hiG.connect(drive);
    chain(drive, shaper, lp, pk, am);
    const rumble = noiseSrc(pink); const rbp = filt('bandpass', 80, 1.4); const rg = gainN(0);
    chain(rumble, rbp, rg, am);
    // a few milliseconds of echo give the hollow sound of an exhaust pipe; 55 Hz HPF cleans phone speaker mud
    const dry = gainN(0.8), dl = ac.createDelay(0.01); dl.delayTime.value = V.comb; const wet = gainN(0.3);
    const shift = gainN(1), duck = gainN(1), notch = filt('peaking', 2500, 1, 0), hp = filt('highpass', 55, 0.7), level = gainN(0);
    am.connect(dry); am.connect(dl); dl.connect(wet); dry.connect(shift); wet.connect(shift);
    chain(shift, duck, notch, hp, level, bus.engine);
    let whine = null, wBP = null, wG = null;
    if (V.whine) { whine = ac.createOscillator(); whine.type = 'triangle'; wBP = filt('bandpass', 1300, 1.2); wG = gainN(0); chain(whine, wBP, wG, shift); whine.start(t); }
    for (const o of [saw, sub, hi, lfo, rumble]) o.start(t);
    eng = { kind, V, saw, sub, hi, lfo, lp, drive, rbp, rg, shift, duck, notch, level, whine, wBP, wG, oscs: [saw, sub, hi, lfo, rumble, whine].filter(Boolean), gear: 1, rpm: 0.15, shiftT: 0, lastT: 0, crashUntil: 0 };
  }
  function dropEngine() {
    if (!eng) return;
    const e = eng; eng = null; const t = now();
    e.level.gain.cancelScheduledValues(t); e.level.gain.setValueAtTime(e.level.gain.value, t); e.level.gain.linearRampToValueAtTime(0, t + 0.08);
    stopAt(e.oscs, t + 0.2);
  }
  // pick a gear from the speed, and how far through that gear the engine has revved (0..1)
  function gearOf(kmh, vmaxKmh, gears, cur) {
    if (gears <= 1) return { gear: 1, rpm: clampN(0.12 + 0.88 * kmh / vmaxKmh, 0.12, 1) };
    const top = (g) => vmaxKmh * Math.pow(g / gears, 0.85);
    let g = cur || 1;
    while (g < gears && kmh > top(g)) g++;
    while (g > 1 && kmh < top(g - 1) - 3) g--;
    const lo = g === 1 ? 0 : top(g - 1) * 0.8, hiS = top(g);
    const idle = g === 1 ? 0.12 : 0.42;
    return { gear: g, rpm: clampN(idle + (1 - idle) * (kmh - lo) / (hiS - lo), 0.12, 1) };
  }
  function shiftDip(up) {
    const e = eng; if (!e) return; const t = now();
    const g = e.shift.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(up ? 0.24 : 0.55, t + 0.012); g.setValueAtTime(up ? 0.24 : 0.55, t + (up ? 0.08 : 0.055)); g.linearRampToValueAtTime(1, t + (up ? 0.16 : 0.11)); g._last = 1;
    // a dull knock from the gearbox
    burst(t, 0.06, up ? 0.05 : 0.03, [filt('lowpass', 700, 0.8)], bus.engine, 2.6);
  }

  // ---------- road, wind, city and tyres ----------
  let amb = null;
  function buildAmb() {
    if (amb) return; const t = now();
    const road = noiseSrc(white), roadG = gainN(0); chain(road, filt('lowpass', 260, 0.7), roadG, bus.fx);
    const wind = noiseSrc(white), windBP = filt('bandpass', 900, 0.5), windG = gainN(0); chain(wind, windBP, windG, bus.fx);
    const city = noiseSrc(pink), cityG = gainN(0.07), cityBreath = ac.createOscillator(); cityBreath.frequency.value = 0.05; const cbG = gainN(0.028); cityBreath.connect(cbG); cbG.connect(cityG.gain);
    const cityOut = gainN(0); chain(city, filt('bandpass', 350, 0.8), cityG, cityOut, bus.fx);
    const hiss = noiseSrc(white), hissG = gainN(0); chain(hiss, filt('highpass', 4000, 1), hissG, bus.fx);
    // tyre squeal: smooth dual-band resonant screech (sine-modulated, zero square-wave chatter)
    const sq = noiseSrc(white), sqBP = filt('bandpass', 2150, 7.5), sqBP2 = filt('bandpass', 3200, 6), sqG = gainN(0), chat = ac.createOscillator();
    chat.type = 'sine'; chat.frequency.value = 11; const chatG = gainN(140);
    chat.connect(chatG); chatG.connect(sqBP.frequency);
    sq.connect(sqBP); sq.connect(sqBP2); sqBP.connect(sqG); sqBP2.connect(sqG); sqG.connect(bus.fx);
    const oscs = [road, wind, city, cityBreath, hiss, sq, chat]; for (const o of oscs) o.start(t);
    amb = { roadG, windBP, windG, cityOut, hissG, sqG, oscs };
  }
  function dropAmb() { if (!amb) return; const a = amb; amb = null; const t = now(); for (const g of [a.roadG, a.windG, a.cityOut, a.hissG, a.sqG]) { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, 0.1); } stopAt(a.oscs, t + 0.8); }

  // called every frame while driving; returns the gear and engine speed so the dashboard can show them
  const dash = { gear: 1, rpm: 0 };
  function drive(s) {
    if (!ac || ac.state !== 'running') return dash;
    const t = now();
    if (wx && wx.duckG) set(wx.duckG.gain, s.live || s.idle ? 1 : 0.35, 0.25);
    if (!s.live || !sfxOn) {
      if (eng) { set(eng.level.gain, 0, 0.1); if (!s.live) dropEngine(); }
      if (amb) { set(amb.roadG.gain, 0, 0.2); set(amb.windG.gain, 0, 0.2); set(amb.hissG.gain, 0, 0.15); set(amb.sqG.gain, 0, 0.05); set(amb.cityOut.gain, s.idle && sfxOn ? 0.5 : 0, 0.4); }
      if (!s.live && !s.idle) dropAmb();
      return dash;
    }
    buildEngine(s.kind); buildAmb();
    const e = eng, V = e.V;
    if (t - e.lastT < 0.045) return dash; e.lastT = t; // 20 updates a second is plenty
    const kmh = s.kmh, g = gearOf(kmh, s.vmax, V.gears, e.gear);
    if (g.gear !== e.gear) { shiftDip(g.gear > e.gear); e.gear = g.gear; }
    // let the needle drop a little when coasting
    const rpm = s.gas ? g.rpm : Math.max(0.12, g.rpm - (s.brake ? 0.08 : 0.03));
    e.rpm += (rpm - e.rpm) * 0.5;
    const load = s.brake ? 0.15 : s.gas ? 1 : s.cruising ? 0.5 : 0.35;
    const c = 0.55 + 0.45 * load;
    const f = V.base + V.span * e.rpm;
    const boostK = s.boost ? 1.32 : 1;
    set(e.saw.frequency, f, 0.04); set(e.sub.frequency, f * V.bite, 0.04); set(e.hi.frequency, f * 2.01, 0.04);
    set(e.lfo.frequency, f * V.fire, 0.03);
    e.saw.detune.setTargetAtTime((Math.random() * 2 - 1) * 5 * (1 - e.rpm), t, 0.25); // a rough idle that smooths out higher up
    set(e.drive.gain, (0.6 + 2 * c) * (V.drive || 1) * boostK, 0.08);
    set(e.lp.frequency, Math.min(12000, (V.lp + e.rpm * V.lpSpan) * (0.72 + 0.28 * c) * boostK), 0.08);
    set(e.rbp.frequency, Math.max(70, f * V.rumF), 0.08); set(e.rg.gain, V.rum * (0.45 + e.rpm) * c, 0.1);
    if (e.whine) {
      const wf = Math.min(7500, f * V.whine);
      set(e.whine.frequency, wf, 0.05);
      if (e.wBP) set(e.wBP.frequency, Math.max(400, wf), 0.06);
      set(e.wG.gain, V.whineG * Math.max(0, e.rpm - 0.25) * 1.4 * (s.gas || V.gears <= 1 ? 1 : 0.4), 0.1);
    }
    set(e.level.gain, V.vol * (0.55 + 0.45 * e.rpm) * c / (0.7 + 0.5 * c) * 6, 0.08);
    const v = clampN(kmh / Math.max(60, s.vmax), 0, 1.3);
    set(amb.roadG.gain, 0.06 * v * (1 + 0.5 * Math.min(1.5, s.slip || 0)), 0.25);
    set(amb.windBP.frequency, 750 + 6.5 * Math.min(kmh, 320), 0.2);
    set(amb.windG.gain, Math.min(0.24 * Math.pow(Math.min(kmh, 300) / 260, 1.85), 0.24), 0.25);
    set(amb.cityOut.gain, 0.25, 0.4); set(amb.hissG.gain, 0.012 + 0.02 * v, 0.3);
    let sq = 0;
    if (s.brake && s.brakeAmt > 0.5 && kmh > 50) sq = 0.05 * v * s.brakeAmt;
    else if ((s.slip || 0) > 0.15 && kmh > 40) sq = 0.045 * Math.min(1, (s.slip - 0.15) / 0.6);
    set(amb.sqG.gain, sq, 0.05);
    dash.gear = e.gear; dash.rpm = e.rpm;
    return dash;
  }

  // ---------- horns ----------
  // a horn note: a chord of buzzy tones that start slightly sharp, a diaphragm rattle, and two bright peaks
  function hornVoice(freqs, dest, opts) {
    const t = now(); const sum = gainN(1 / freqs.length); const oscs = [];
    for (const f of freqs) {
      const o = ac.createOscillator(); o.type = opts.wave || 'sawtooth';
      o.frequency.setValueAtTime(f * 1.04, t); o.frequency.setTargetAtTime(f, t, 0.012);
      o.connect(sum); o.start(t); oscs.push(o);
    }
    const shaper = ac.createWaveShaper(); shaper.curve = tanhCurve;
    const buzz = gainN(0.97), lfo = ac.createOscillator(); lfo.frequency.value = 65; const lg = gainN(0.03); lfo.connect(lg); lg.connect(buzz.gain); lfo.start(t); oscs.push(lfo);
    const env = gainN(0);
    chain(sum, shaper, filt('peaking', opts.throat || 900, 2, 8), filt('peaking', opts.bell || 2800, 1.5, 6), filt('lowpass', opts.lp || 4500, 0.7), buzz, env, dest);
    env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(Math.max(0.0002, opts.gain), t + 0.008);
    // a click as the horn opens
    burst(t, 0.015, opts.gain * 1.2, [filt('highpass', 2500, 0.7)], dest, 2);
    return { oscs, env, t0: t, peak: Math.max(0.0002, opts.gain) };
  }
  function hornOff(h, at) {
    const t = Math.max(now(), at || 0);
    if (h.env.gain.cancelAndHoldAtTime) { try { h.env.gain.cancelAndHoldAtTime(t); } catch (e) { h.env.gain.cancelScheduledValues(t); } }
    else h.env.gain.cancelScheduledValues(t);
    const curV = Math.max(h.env.gain.value || h.peak || 0.08, 0.0001);
    h.env.gain.setValueAtTime(curV, t); h.env.gain.exponentialRampToValueAtTime(0.0001, t + 0.032);
    stopAt(h.oscs, t + 0.055);
  }
  // the player's horn sounds while held, and for at least a short honk on a quick tap.
  // the style comes from settings: the car's own horn, a deep one, a truck air horn, or a little tune
  const HORNS = {
    city: {},
    deep: { k: 0.68, throat: 560, bell: 1900, lp: 3200, gain: 0.12 },
    truck: { chord: [155, 196, 233], throat: 480, bell: 1500, lp: 3000, wave: 'square', gain: 0.14 },
    melody: { tune: [1, 1.122, 1.26, 1.335, 1.5, 1.335, 1.26, 1.122, 1], wave: 'sawtooth', gain: 0.1 }
  };
  let myHorn = null, hornStyle = 'city';
  function hornStop(at) {
    if (!myHorn) return;
    if (myHorn.tune) { clearInterval(myHorn.tune); if (myHorn.h) hornOff(myHorn.h, Math.max(at || 0, myHorn.h.t0 + 0.14)); } else hornOff(myHorn, at);
    myHorn = null;
  }
  function horn(on, chord, kind) {
    if (!ac || !sfxOn) { hornStop(); return; }
    if (on && !myHorn) {
      const H = HORNS[hornStyle] || HORNS.city;
      const k = ({ pickup: 0.85, suv: 0.82, sports: 1.12, f1: 1.2, bmw: 1.04, hatch: 1.06, sedan: 1.08 }[kind] || 1) * (H.k || 1);
      const notes = H.chord || (chord || [400, 500]).map((f) => f * k);
      const opts = { gain: H.gain || 0.11, wave: H.wave || (kind === 'hatch' ? 'square' : 'sawtooth'), throat: H.throat, bell: H.bell, lp: H.lp };
      if (H.tune) {
        // a tune plays its notes one after another for as long as the horn is held
        let i = 0; const me = myHorn = { h: null, tune: 0 };
        const play = () => { if (me.h) hornOff(me.h); me.h = hornVoice(notes.map((f) => f * H.tune[i++ % H.tune.length]), bus.horn, opts); };
        play(); me.tune = setInterval(play, 170);
      } else myHorn = hornVoice(notes, bus.horn, opts);
      duckEngine(1); radio.duck(1.2);
    } else if (!on && myHorn) hornStop(myHorn.tune ? 0 : myHorn.t0 + 0.16);
  }
  // a horn from another car: panned to its side and dulled with distance, with an echo off the buildings when far
  function placeAt(dx, dist, dest) {
    const pan = ac.createStereoPanner ? ac.createStereoPanner() : null;
    const lp = filt('lowpass', Math.max(1800, 5000 - 16 * dist), 0.7), hp = filt('highpass', Math.min(260, 160 + 0.8 * dist), 0.7);
    const g = gainN(1 / (1 + Math.pow(dist / 55, 1.05)));
    const head = chain(lp, hp, g);
    if (pan) { pan.pan.value = clampN(dx / 9, -0.9, 0.9); head.connect(pan); pan.connect(dest); } else head.connect(dest);
    if (dist > 30) { const d = ac.createDelay(0.1); d.delayTime.value = 0.035; const dg = gainN(0.5 * clampN((dist - 30) / 40, 0, 1)); g.connect(d); d.connect(dg); dg.connect(dest); }
    return lp;
  }
  function otherHorn(dx, dist, chord, pattern) {
    if (!ac || !sfxOn) return;
    dist = dist == null ? 20 : dist;
    const input = placeAt(dx || 0, dist, bus.horn);
    const base = (chord || [400, 500]).map((f) => f * (0.85 + Math.random() * 0.4));
    const notes = pattern || (Math.random() < 0.5 ? [[0, 0.12], [0.2, 0.28]] : [[0, 0.4]]);
    for (const [at, len] of notes) setTimeout(() => { if (!ac) return; const h = hornVoice(base, input, { gain: 0.08 }); hornOff(h, now() + len); }, at * 1000);
    duckEngine(1 / (1 + Math.pow(dist / 20, 1.5)));
  }
  // horns cut a little hole in the engine so they come through (never overriding a harder crash duck)
  function duckEngine(w) {
    if (!eng || w < 0.15) return; const t = now();
    if (t < (eng.crashUntil || 0)) return;
    eng.duck.gain.cancelScheduledValues(t); eng.duck.gain.setTargetAtTime(1 - 0.29 * w, t, 0.01); eng.duck.gain.setTargetAtTime(1, t + 0.25, 0.15); eng.duck.gain._last = 1;
    eng.notch.gain.cancelScheduledValues(t); eng.notch.gain.setTargetAtTime(-6 * w, t, 0.01); eng.notch.gain.setTargetAtTime(0, t + 0.25, 0.15); eng.notch.gain._last = 0;
  }

  // ---------- effects ----------
  function crash(i) {
    if (!ac || !sfxOn) return;
    i = clampN(i, 0.2, 1); const t = now();
    const o = ac.createOscillator(); o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(36, t + 0.28);
    const og = gainN(0); og.gain.setValueAtTime(0.25 + 0.28 * i, t); og.gain.setTargetAtTime(0, t + 0.02, 0.13); chain(o, og, bus.fx); o.start(t); o.stop(t + 0.5);
    // crunching metal: separate AM modulator node (modG) before envelope (cg) so LFO never fights envelope decay
    const n = noiseSrc(white), bp = filt('bandpass', 1400, 0.5), modG = gainN(0.7), cg = gainN(0);
    cg.gain.setValueAtTime(0.3 + 0.28 * i, t); cg.gain.setTargetAtTime(0, t + 0.05, 0.13);
    const shake = noiseSrc(white), slp = filt('lowpass', 90, 0.7), sg = gainN(0.45); chain(shake, slp, sg, modG.gain);
    chain(n, bp, modG, cg, bus.fx); n.start(t); shake.start(t); stopAt([n, shake], t + 0.7);
    if (i > 0.45) burst(t + 0.03, 0.8, 0.12 * i, [filt('highpass', 6500, 0.7)], bus.fx, 4); // glass
    if (eng) { eng.crashUntil = t + 0.5; const g = eng.duck.gain; g.cancelScheduledValues(t); g.setTargetAtTime(0.25, t, 0.01); g.setTargetAtTime(1, t + 0.1, 0.4); g._last = 1; }
    radio.duck(1.5);
  }
  function scrape(amt) { if (!ac || !sfxOn) return; const a = clampN(amt == null ? 0.7 : amt, 0.25, 1); burst(now(), 0.35, 0.13 * a, [filt('bandpass', 1200 + 500 * a, 1.3)], bus.fx, 1.4); }
  function bump(level) { if (!ac || !sfxOn) return; const L = clampN(level, 0, 4); burst(now(), 0.2 + 0.05 * L, 0.06 + 0.045 * L, [filt('lowpass', 950 - 130 * L, 0.8)], bus.fx, 2.5); }
  // a car going past: stays on the passing side (approaches, peaks beside you, recedes on same side)
  function passBy(side, size, closeness) {
    if (!ac || !sfxOn) return;
    const P = { car: [2200, 600, 0.7, 0.8], van: [1600, 400, 1.1, 1.5], truck: [900, 250, 2.0, 2] }[size] || [2200, 600, 0.7, 0.8];
    const t = now(), len = P[2], peak = 0.18 * clampN(closeness, 0.2, 1), s = side >= 0 ? 1 : -1;
    const n = noiseSrc(white), bp = filt('bandpass', P[0], P[3]), g = gainN(0.0001);
    bp.frequency.setValueAtTime(P[0], t); bp.frequency.exponentialRampToValueAtTime(P[1], t + len);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + len * 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    let last = chain(n, bp, g);
    if (ac.createStereoPanner) {
      const p = ac.createStereoPanner();
      p.pan.setValueAtTime(0.45 * s, t); p.pan.linearRampToValueAtTime(0.9 * s, t + len * 0.45); p.pan.linearRampToValueAtTime(0.35 * s, t + len);
      last.connect(p); last = p;
    }
    last.connect(bus.fx); n.start(t); n.stop(t + len + 0.05);
  }
  // nitro: full-duration rush of air + sub-thump ignition + rising turbine; perfect adds bright chord on top
  function nitro(perfect, dur) {
    if (!ac || !sfxOn) return; const t = now(), len = clampN(dur || 1.6, 1.0, 4.2);
    // ignition sub-thump
    const sub = ac.createOscillator(); sub.type = 'sine'; sub.frequency.setValueAtTime(92, t); sub.frequency.exponentialRampToValueAtTime(36, t + 0.24);
    const sg = gainN(0.0001); sg.gain.setValueAtTime(0.0001, t); sg.gain.exponentialRampToValueAtTime(perfect ? 0.24 : 0.18, t + 0.015); sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    chain(sub, sg, bus.fx); sub.start(t); sub.stop(t + 0.35);
    // sustained turbine rush matching boost duration
    const wn = noiseSrc(white), wbp = filt('bandpass', 1100, 0.7), wg = gainN(0.0001);
    wbp.frequency.setValueAtTime(900, t); wbp.frequency.exponentialRampToValueAtTime(2200, t + len * 0.55); wbp.frequency.exponentialRampToValueAtTime(1000, t + len);
    wg.gain.setValueAtTime(0.0001, t); wg.gain.exponentialRampToValueAtTime(0.18, t + 0.08); wg.gain.setValueAtTime(0.13, t + len * 0.78); wg.gain.exponentialRampToValueAtTime(0.0001, t + len);
    chain(wn, wbp, wg, bus.fx); wn.start(t); wn.stop(t + len + 0.05);
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(760, t + Math.min(1.1, len * 0.7));
    const g = gainN(0); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(1.3, len));
    chain(o, filt('lowpass', 1800, 1), g, bus.fx); o.start(t); o.stop(t + Math.min(1.4, len) + 0.05);
    if (perfect) [1319, 1661, 1976, 2637].forEach((f, i) => blip(f, 0.22, 'triangle', 0.07, null, t + 0.05 + i * 0.06));
  }
  // an ambulance siren with subtle Doppler pitch shift
  let sir = null;
  function siren(dx, dist, relV) {
    if (!ac) return;
    if (dx == null || !sfxOn) { if (sir) { const t = now(); sir.g.gain.cancelScheduledValues(t); sir.g.gain.setTargetAtTime(0, t, 0.08); stopAt([sir.o, sir.lfo], t + 0.6); sir = null; } return; }
    if (!sir) {
      const t = now(); const o = ac.createOscillator(); o.type = 'square'; o.frequency.value = 1000;
      const lfo = ac.createOscillator(); lfo.type = 'triangle'; lfo.frequency.value = 0.32; const lg = gainN(380); lfo.connect(lg); lg.connect(o.frequency);
      const lp = filt('lowpass', 2500, 0.7), g = gainN(0), pan = ac.createStereoPanner ? ac.createStereoPanner() : null;
      chain(o, filt('bandpass', 1100, 0.8), lp, g);
      if (pan) { g.connect(pan); pan.connect(bus.horn); } else g.connect(bus.horn);
      o.start(t); lfo.start(t); sir = { o, lfo, lp, g, pan };
    }
    const doppler = clampN(1 + (relV || 0) / 140, 0.88, 1.14);
    set(sir.o.frequency, 1000 * doppler, 0.12);
    set(sir.g.gain, 0.09 / (1 + Math.pow(dist / 40, 1.3)), 0.1);
    set(sir.lp.frequency, Math.max(900, 4200 - 20 * dist), 0.1);
    if (sir.pan) set(sir.pan.pan, clampN(dx / 9, -0.8, 0.8), 0.1);
  }
  // short tunes for game events
  const CUES = {
    radar: () => blip(960, 0.09, 'square', 0.05),
    radarFast: () => blip(1480, 0.08, 'square', 0.07),
    flash: () => { blip(1200, 0.25, 'sine', 0.15); radio.duck(1.5); },
    toll: () => { blip(1319, 0.08, 'triangle', 0.08); blip(1760, 0.12, 'triangle', 0.08, null, now() + 0.07); },
    bonus: () => [1047, 1319, 1568, 2093].forEach((f, i) => blip(f, 0.14, 'triangle', 0.08, null, now() + i * 0.055)),
    ok: () => { blip(784, 0.1, 'triangle', 0.07); blip(1047, 0.14, 'triangle', 0.07, null, now() + 0.08); },
    bad: () => { blip(330, 0.14, 'square', 0.05); blip(247, 0.18, 'square', 0.05, null, now() + 0.12); },
    count: () => blip(880, 0.16, 'triangle', 0.1),
    go: () => blip(1320, 0.3, 'triangle', 0.12),
    finish: () => [1047, 1319, 1568, 2093, 2637].forEach((f, i) => blip(f, 0.2, 'triangle', 0.08, null, now() + i * 0.08)),
    wreck: () => [440, 370, 311, 262].forEach((f, i) => blip(f, 0.22, 'square', 0.05, null, now() + i * 0.14)),
    paxPick: () => { [1175, 1568, 1976].forEach((f, i) => blip(f, 0.11, 'sine', 0.08, null, now() + i * 0.055)); },
    paxDrop: () => { [1047, 1319, 1568, 2093].forEach((f, i) => blip(f, 0.14, 'triangle', 0.09, null, now() + i * 0.05)); },
    refuel: () => { blip(880, 0.1, 'sine', 0.07); blip(1175, 0.15, 'sine', 0.08, null, now() + 0.09); },
    tick: () => blip(2400, 0.02, 'triangle', 0.03),
    click: () => blip(1500, 0.03, 'triangle', 0.025),
    // walking: a soft shoe on paving, and a sliding whistle for a banana peel
    step: () => burst(now(), 0.05, 0.035 + Math.random() * 0.015, [filt('bandpass', 600 + Math.random() * 300, 1.4)], bus.fx, 3),
    // a street dog: two rough barks
    bark: () => { const t0 = now(); for (const k of [0, 0.17]) { const t = t0 + k, o = ac.createOscillator(), g = gainN(0.0001); o.type = 'sawtooth'; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(240, t + 0.11); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.1, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.13); chain(o, filt('lowpass', 1600, 1), g, bus.fx); o.start(t); o.stop(t + 0.16); burst(t, 0.08, 0.05, [filt('bandpass', 1100, 1)], bus.fx, 3); } },
    slip: () => { const t = now(), o = ac.createOscillator(), g = gainN(0.0001); o.type = 'sine'; o.frequency.setValueAtTime(1400, t); o.frequency.exponentialRampToValueAtTime(260, t + 0.5); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.55); chain(o, g, bus.fx); o.start(t); o.stop(t + 0.6); },
    // kids mode: a sparkle for a star, and a springy boing for a soft bump
    star: () => { [1568, 2093, 2637].forEach((f, i) => blip(f, 0.12, 'sine', 0.07, null, now() + i * 0.045)); },
    boing: () => { const t = now(), o = ac.createOscillator(), g = gainN(0.0001), lfo = ac.createOscillator(), lg = gainN(40); o.type = 'triangle'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(420, t + 0.12); o.frequency.exponentialRampToValueAtTime(140, t + 0.5); lfo.frequency.value = 18; lfo.connect(lg); lg.connect(o.frequency); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.55); o.connect(g); g.connect(bus.fx); o.start(t); lfo.start(t); o.stop(t + 0.6); lfo.stop(t + 0.6); }
  };
  // near misses climb a semitone each step of the chain
  function combo(n) { if (!ac || !sfxOn) return; const f = 1245 * Math.pow(2, Math.min(7, n - 1) / 12); blip(f, 0.1, 'triangle', 0.08); blip(f * 1.5, 0.12, 'triangle', 0.06, null, now() + 0.09); }
  function cue(name) { if (!ac || !sfxOn) return; const c = CUES[name]; if (c) c(); }

  // ---------- radio: music made up on the spot ----------
  // a station has a rhythm, a maqam (scale, with quarter tones where the maqam has them), a tempo and a lead sound.
  // each station builds a short tune from its seed, repeats it with small changes, then writes a new one.
  const MAQAM = {
    hijaz: [0, 100, 400, 500, 700, 800, 1000], nahawand: [0, 200, 300, 500, 700, 800, 1100], bayati: [0, 150, 300, 500, 700, 800, 1000],
    ajam: [0, 200, 400, 500, 700, 900, 1100], kurd: [0, 100, 300, 500, 700, 800, 1000], rast: [0, 200, 350, 500, 700, 900, 1050], saba: [0, 150, 300, 400, 700, 800, 1000],
    // plain western scales for the African stations: the bright major, its bluesy cousin, and the five note scale
    major: [0, 200, 400, 500, 700, 900, 1100], mixo: [0, 200, 400, 500, 700, 900, 1000], penta: [0, 200, 400, 700, 900], minor: [0, 200, 300, 500, 700, 800, 1000]
  };
  // D = deep drum, T = sharp drum, k = soft hit, C = hand clap, . = rest; sixteen steps a bar
  const RHYTHM = {
    maqsum:  'D.T...T.D...T...', baladi: 'D.D...T.D...T...', saidi: 'D.T...D.D...T...',
    khaleeji: 'D..CT.C.D..CT.C.', fallahi: 'D.T.D.T.D.T.D.T.', chobi: 'D..TD.T.D..TD.TT',
    // Najd: samri leans on hand claps, ardah is the slow march of the big drums
    samri: 'D.C..CT.D.C..CT.', ardah: 'D...D...D.TTD...',
    // Kenya: benga runs fast on the hi hat, gengetone bounces; South Africa: the amapiano log drum (L) and kwaito's slow house beat
    benga: 'D.TkD.TkD.TkD.Tk', gengetone: 'D..TD.k.D.kTD.k.', amapiano: 'D..L..L.D.kL..L.', kwaito: 'D.k.T.k.D.k.T.kC'
  };
  const radio = (() => {
    let stations = [], cur = -1, timer = null, nextT = 0, step = 0, bar = 0, motif = null, barPhrase = null, chordDeg = 0, rng = Math.random, duckUntil = 0, level = 0, mixG = null;
    function seeded(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    const st = () => stations[cur];
    const hz = (deg, oct) => { const S = MAQAM[st().maqam] || MAQAM.hijaz; const n = S.length; const o = Math.floor(deg / n); const i = ((deg % n) + n) % n; return st().root * Math.pow(2, (S[i] + 1200 * (o + (oct || 0))) / 1200); };
    // a tune is eight beats of scale steps; null is a rest, and a note can hold over the next beat
    function newMotif() {
      const m = []; let d = Math.floor(rng() * 3);
      for (let i = 0; i < 8; i++) {
        if (i > 0 && rng() < 0.18) { m.push(null); continue; }
        d += [-2, -1, -1, 0, 1, 1, 2, 3][Math.floor(rng() * 8)] * (rng() < 0.8 ? 1 : 0);
        d = clampN(d, -2, 9); m.push(d);
      }
      m[7] = rng() < 0.6 ? 0 : 4; // land on the home note or the fifth
      return m;
    }
    function vary(m) { return m.map((d, i) => (d == null || i === 7 || rng() > 0.3 ? d : d + (rng() < 0.5 ? 1 : -1))); }
    // instruments
    function drum(type, t, accent) {
      const dest = mixG;
      if (type === 'D') {
        const o = ac.createOscillator(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.18);
        const g = gainN(0); g.gain.setValueAtTime(0.5 * accent, t); g.gain.setTargetAtTime(0, t + 0.01, 0.09); chain(o, g, dest); o.start(t); o.stop(t + 0.5);
        burst(t, 0.03, 0.08 * accent, [filt('lowpass', 900, 0.7)], dest, 2);
      } else if (type === 'T' || type === 'k') {
        const v = type === 'T' ? 0.22 : 0.08;
        burst(t, type === 'T' ? 0.07 : 0.04, v * accent, [filt('bandpass', 2600, 1.2)], dest, 3);
        const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(300, t + 0.03);
        const g = gainN(0); g.gain.setValueAtTime(v * 0.7 * accent, t); g.gain.setTargetAtTime(0, t, 0.015); chain(o, g, dest); o.start(t); o.stop(t + 0.1);
      } else if (type === 'C') {
        for (let i = 0; i < 3; i++) burst(t + i * 0.009, 0.05, 0.12 * accent, [filt('bandpass', 1200, 1.5)], dest, 3);
      } else if (type === 'L') { // the amapiano log drum tracks the current chord root cleanly
        const f0 = hz(chordDeg + (rng() < 0.3 ? 4 : 0), -1);
        const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f0 * 1.9, t); o.frequency.exponentialRampToValueAtTime(f0, t + 0.06);
        const o2 = ac.createOscillator(); o2.type = 'triangle'; o2.frequency.setValueAtTime(f0 * 2, t);
        const sh = filt('lowpass', 900, 4), g = gainN(0), g2 = gainN(0.25); o2.connect(g2); g2.connect(sh); o.connect(sh);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.42 * accent, t + 0.008); g.gain.setTargetAtTime(0, t + 0.05, 0.16);
        chain(sh, g, dest); o.start(t); o2.start(t); stopAt([o, o2], t + 0.8);
      } else if (type === 'r' || type === 's') { // riq jingles / amapiano crisp 16th shaker
        burst(t, type === 's' ? 0.03 : 0.05, (type === 's' ? 0.028 : 0.035) * accent, [filt('highpass', type === 's' ? 5800 : 7000, 0.7)], dest, 3);
      }
    }
    function bass(f, t, len) {
      const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = f / 2;
      const g = gainN(0); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.01); g.gain.setTargetAtTime(0, t + len * 0.6, len * 0.3);
      const lp = filt('lowpass', 500, 0.8); o.connect(lp); o2.connect(lp); chain(lp, g, mixG); o.start(t); o2.start(t); stopAt([o, o2], t + len + 0.3);
    }
    function lead(f, t, len, kind) {
      const g = gainN(0), dest = mixG; const oscs = [];
      if (kind === 'guitar' || kind === 'piano' || kind === 'marimba') {
        // benga and mbaqanga guitar picks bright and fast; amapiano keys ring soft; the marimba is a wooden knock
        const gt = kind === 'guitar', mb = kind === 'marimba';
        const o = ac.createOscillator(); o.type = gt ? 'sawtooth' : mb ? 'sine' : 'triangle'; o.frequency.value = f;
        const o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * (mb ? 4 : 2); o2.detune.value = gt ? 6 : 2;
        const lp = filt('lowpass', 2000, gt ? 3 : 1); lp.frequency.setValueAtTime(gt ? 4200 : 2600, t); lp.frequency.setTargetAtTime(gt ? 900 : 1200, t, gt ? 0.05 : 0.2);
        const og = gainN(mb ? 0.5 : 0.3); o2.connect(og); og.connect(lp); o.connect(lp); lp.connect(g);
        const v = gt ? 0.1 : mb ? 0.16 : 0.11, tail = gt ? 0.12 : mb ? 0.07 : 0.35;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.004); g.gain.setTargetAtTime(0, t + 0.01, tail);
        oscs.push(o, o2); len = Math.max(len, tail * 5);
      } else if (kind === 'qanun' || kind === 'oud') {
        // plucked strings: a bright attack that dulls quickly
        const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
        const o2 = ac.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * (kind === 'oud' ? 1 : 2); o2.detune.value = 4;
        const lp = filt('lowpass', kind === 'oud' ? 1800 : 3200, 2); lp.frequency.setValueAtTime(kind === 'oud' ? 2600 : 5200, t); lp.frequency.setTargetAtTime(kind === 'oud' ? 500 : 900, t, 0.08);
        const og = gainN(kind === 'oud' ? 0.6 : 0.35); o2.connect(og); og.connect(lp); o.connect(lp); lp.connect(g);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.004); g.gain.setTargetAtTime(0, t + 0.02, kind === 'oud' ? 0.22 : 0.16);
        oscs.push(o, o2); len = Math.max(len, 0.9);
      } else if (kind === 'nay') {
        // breathy flute: soft tone, a little air, and a vibrato that grows in
        const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        const o2 = ac.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2; const o2g = gainN(0.12); o2.connect(o2g); o2g.connect(g);
        const vib = ac.createOscillator(); vib.frequency.value = 5.2; const vg = gainN(0); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.012, t + len * 0.6);
        vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
        const air = noiseSrc(white); const ab = filt('bandpass', f * 2, 2); const ag = gainN(0.05); chain(air, ab, ag, g);
        o.connect(g);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.1, t + 0.06); g.gain.setValueAtTime(0.1, t + len * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.1);
        oscs.push(o, o2, vib, air);
      } else if (kind === 'rababa') {
        // the one string rababa of the desert: a bowed, nasal tone that swells and wavers
        const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 0.985, t); o.frequency.setTargetAtTime(f, t, 0.05);
        const vib = ac.createOscillator(); vib.frequency.value = 5.6; const vg = gainN(0); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.014, t + len * 0.5);
        vib.connect(vg); vg.connect(o.frequency);
        const nose = filt('bandpass', f * 3, 3), body = filt('lowpass', 2200, 0.8), ng = gainN(0.7);
        o.connect(body); o.connect(nose); nose.connect(ng); ng.connect(g); body.connect(g);
        const bow = noiseSrc(white); const bb = filt('bandpass', f * 4, 4); const bg = gainN(0.03); chain(bow, bb, bg, g);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.09); g.gain.setValueAtTime(0.07, t + len * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.12);
        oscs.push(o, vib, bow); len = Math.max(len, 0.35);
      } else {
        // a bright synth lead for the dance stations
        const o = ac.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(f * 0.97, t); o.frequency.setTargetAtTime(f, t, 0.02);
        const o2 = ac.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = f; o2.detune.value = 9;
        const vib = ac.createOscillator(); vib.frequency.value = 6; const vg = gainN(f * 0.008); vib.connect(vg); vg.connect(o.frequency);
        const lp = filt('lowpass', 2600, 3); o.connect(lp); o2.connect(lp); lp.connect(g);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.01); g.gain.setValueAtTime(0.06, t + len * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        oscs.push(o, o2, vib);
      }
      g.connect(dest); for (const o of oscs) o.start(t); stopAt(oscs, t + len + 0.2);
    }
    let pad = null;
    // diatonic maqam pad scheduled on exact lookahead time t
    function padOn(deg, at) {
      const t = at == null ? now() : at;
      if (pad) { const p = pad; p.g.gain.setTargetAtTime(0, t, 0.4); stopAt(p.oscs, t + 2); }
      const g = gainN(0); const lp = filt('lowpass', 700, 0.6); const oscs = [];
      const freqs = [
        [hz(deg, -1), -5], [hz(deg, -1), 6],
        [hz(deg + 2, -1), 2], [hz(deg + 4, -1), -2], [hz(deg, -2), 0]
      ];
      for (const [fr, d] of freqs) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.detune.value = d; o.connect(lp); o.start(t); oscs.push(o); }
      chain(lp, g, mixG); g.gain.setTargetAtTime(0.026, t, 0.6);
      pad = { g, oscs };
    }
    function padOff() { if (!pad) return; const t = now(); pad.g.gain.setTargetAtTime(0, t, 0.3); stopAt(pad.oscs, t + 1.5); pad = null; }
    // the scheduler looks a little ahead and books each sixteenth note on the audio clock
    function tick() {
      if (!ac || cur < 0 || ac.state !== 'running' || document.hidden || !appActive) return;
      const curT = now();
      // clamp catch-up after background tab suspension so we never burst hundreds of stacked notes
      if (nextT < curT - 0.1) nextT = curT + 0.02;
      const S = st(), sixteenth = 60 / S.bpm / 4;
      while (nextT < curT + 0.15) {
        const t = nextT, pat = RHYTHM[S.rhythm] || RHYTHM.maqsum, ch = pat[step % 16];
        const accent = step % 4 === 0 ? 1 : 0.8;
        if (step % 16 === 0) {
          if (bar % 8 === 0) motif = newMotif();
          barPhrase = (bar % 4 === 3) ? vary(motif) : motif;
          if (bar % 2 === 0) { chordDeg = bar % 4 === 2 ? (S.chord2 || 3) : 0; padOn(chordDeg, t); }
        }
        if (ch !== '.') drum(ch, t, accent);
        else if (S.ghost && rng() < S.ghost) drum('k', t, 0.6);
        if (S.riq && step % 2 === 0) drum('r', t, step % 4 === 0 ? 1 : 0.6);
        if (S.rhythm === 'amapiano') drum('s', t, step % 4 === 2 ? 0.95 : 0.45);
        if (ch === 'D') bass(hz(chordDeg + (step % 16 >= 8 && rng() < 0.35 ? 4 : 0), -1), t, sixteenth * 3);
        if (step % 2 === 0) {
          const phrase = barPhrase || motif;
          const beat = (step % 16) / 2, d = phrase[beat];
          if (d != null && !(S.sparse && bar % 2 === 1 && beat > 4)) {
            let len = sixteenth * 2;
            if (beat < 7 && phrase[beat + 1] == null) len *= 2;
            if (S.lead !== 'nay' && S.lead !== 'rababa' && rng() < 0.15 && beat < 7) { lead(hz(d + 1, 1), t, sixteenth * 0.6, S.lead); lead(hz(d, 1), t + sixteenth * 0.5, len, S.lead); }
            else lead(hz(d, 1), t, S.lead === 'nay' || S.lead === 'rababa' ? len * 1.6 : len, S.lead);
          }
        }
        nextT += sixteenth * (S.swing && step % 2 === 0 ? 1 + S.swing : S.swing && step % 2 === 1 ? 1 - S.swing : 1);
        step++; if (step % 16 === 0) bar++;
      }
    }
    // static between stations (routed through limiter with separate AM modulator node and safe non-zero ramp)
    function tune() {
      if (!ac || !musicOn || vol.music <= 0) return;
      const t = now(), pk = Math.max(0.0005, 0.09 * taper(vol.music) * 1.5);
      const n = noiseSrc(white), bp = filt('bandpass', 600, 3), modG = gainN(0.75), g = gainN(0.0001);
      bp.frequency.setValueAtTime(400 + Math.random() * 300, t); bp.frequency.exponentialRampToValueAtTime(2500 + Math.random() * 1500, t + 0.35); bp.frequency.exponentialRampToValueAtTime(900, t + 0.6);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + 0.05); g.gain.setValueAtTime(pk, t + 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      const crackle = ac.createOscillator(); crackle.type = 'square'; crackle.frequency.value = 23; const cg = gainN(0.25); crackle.connect(cg); cg.connect(modG.gain);
      chain(n, bp, modG, g, limiter); n.start(t); crackle.start(t); stopAt([n, crackle], t + 0.75);
      const wh = ac.createOscillator(); wh.frequency.setValueAtTime(1800, t); wh.frequency.exponentialRampToValueAtTime(700, t + 0.5); const wg = gainN(0); wg.gain.setValueAtTime(0.012 * taper(vol.music), t + 0.1); wg.gain.setTargetAtTime(0, t + 0.4, 0.06);
      chain(wh, wg, limiter); wh.start(t); wh.stop(t + 0.7);
    }
    function start(i) {
      if (!ac) return;
      const old = mixG; if (old) { const t = now(); old.gain.setTargetAtTime(0, t, 0.15); setTimeout(() => { try { old.disconnect(); } catch (e) { /* ignore */ } }, 1500); }
      padOff();
      cur = i;
      if (cur < 0) { clearInterval(timer); timer = null; level = 0; levelNow(); return; }
      mixG = gainN(0); mixG.connect(musicOut); mixG.gain.setTargetAtTime(1, now() + 0.4, 0.4);
      const S = st(); rng = seeded(S.seed + Math.floor(Math.random() * 1e6));
      step = 0; bar = 0; chordDeg = 0; nextT = now() + 0.45; motif = newMotif(); barPhrase = motif;
      if (!timer) timer = setInterval(tick, 25);
      level = 1; levelNow();
    }
    function levelNow() {
      if (!ac) return; const t = now();
      const ducked = t < duckUntil ? 0.45 : 1;
      const v = musicOn && cur >= 0 ? 0.55 * taper(vol.music) * ducked * level : 0;
      musicGain.gain.cancelScheduledValues(t); musicGain.gain.setTargetAtTime(v, t, ducked < 1 ? 0.05 : 0.3);
    }
    return {
      setStations(list) { stations = list || []; },
      // go to the next station; after the last one the radio turns off
      next() { if (!ac || !stations.length) return null; tune(); musicLP.frequency.setTargetAtTime(1200, now(), 0.05); musicLP.frequency.setTargetAtTime(18000, now() + 0.6, 0.2); const i = cur + 1 >= stations.length ? -1 : cur + 1; setTimeout(() => start(i), 350); return i; },
      play(i) { if (!ac || !stations.length) return; start(clampN(i, -1, stations.length - 1)); },
      tune,
      stop() { start(-1); },
      get current() { return cur; },
      duck(sec) { if (!ac) return; duckUntil = Math.max(duckUntil, now() + (sec || 1.2)); levelNow(); setTimeout(levelNow, (sec || 1.2) * 1000 + 30); },
      level: levelNow,
      // the radio dims while the game is paused
      pause(p) { level = p ? 0.25 : 1; levelNow(); }
    };
  })();

  // ---------- weather ----------
  // rain hiss with drops on the roof, or gusts of wind and sand
  let wx = null, wxKind = null, dripT = null;
  function weather(kind) {
    wxKind = kind;
    if (!ac) return;
    if (wx) { const w = wx; wx = null; w.g.gain.setTargetAtTime(0, now(), 0.4); stopAt(w.oscs, now() + 2); }
    clearInterval(dripT); dripT = null;
    if (!kind) return;
    const t = now(), g = gainN(0), duckG = gainN(1), oscs = [];
    if (kind === 'rain') {
      const n = noiseSrc(pink); chain(n, filt('highpass', 900, 0.5), filt('lowpass', 7000, 0.5), g); oscs.push(n);
      g.gain.setTargetAtTime(0.16, t, 0.8);
      dripT = setInterval(() => { if (!ac || !sfxOn || ac.state !== 'running' || document.hidden) return; for (let i = 0; i < 3; i++) if (Math.random() < 0.6) burst(now() + Math.random() * 0.2, 0.02, 0.02 + Math.random() * 0.03, [filt('bandpass', 2500 + Math.random() * 3000, 4)], duckG, 3); }, 220);
    } else {
      // separate AM modulator node (modG) before envelope gain (g) so wind gusts never clash with fade-in/out
      const n = noiseSrc(white), bp = filt('bandpass', 420, 0.7), modG = gainN(0.65);
      const lfo = ac.createOscillator(); lfo.frequency.value = 0.13; const lg = gainN(0.32); lfo.connect(lg); lg.connect(modG.gain);
      const lfo2 = ac.createOscillator(); lfo2.frequency.value = 0.21; const l2 = gainN(160); lfo2.connect(l2); l2.connect(bp.frequency);
      chain(n, bp, modG, g); oscs.push(n, lfo, lfo2); lfo.start(t); lfo2.start(t);
      const hiss = noiseSrc(white), hg = gainN(0.025); chain(hiss, filt('highpass', 5000, 0.7), hg, g); oscs.push(hiss);
      g.gain.setTargetAtTime(0.14, t, 0.8);
    }
    chain(g, duckG, bus.fx); for (const o of oscs) if (o.buffer) o.start(t);
    wx = { g, duckG, oscs };
  }

  // ---------- phone buzz ----------
  const VIB = [0, 0.6, 1, 1.5];
  let vibLevel = 2, lastVib = 0;
  // iPhones have no navigator.vibrate; the iOS app hands a buzz length to the phone's own haptics
  const iosHaptics = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.haptics;
  function vibrate(p) {
    if (!vibLevel || !gestured) return;
    const t = performance.now(); if (t - lastVib < 50) return; lastVib = t;
    const k = VIB[vibLevel];
    const pat = (Array.isArray(p) ? p : [p]).map((v, i) => (i % 2 ? v : clampN(Math.round(v * k), 8, 90)));
    // only trigger hardware vibration or native iOS haptics (never beep desktop speakers at 2400 Hz)
    try { if (navigator.vibrate) navigator.vibrate(pat); else if (iosHaptics) iosHaptics.postMessage(pat); } catch (e) { /* ignore */ }
  }

  return {
    unlock, setAppActive, drive, horn, weather, nitro, siren, otherHorn, crash, scrape, bump, passBy, cue, combo, blip: (f, d, v, w) => blip(f, d, w || 'sine', v), radio, vibrate,
    get ready() { return !!ac; },
    // settings: volumes are 0..100
    apply(s) {
      vol.engine = s.volEngine / 100; vol.horn = s.volHorn / 100; vol.fx = s.volFx / 100; vol.music = s.volMusic / 100;
      sfxOn = !!s.sound; musicOn = !!s.music; vibLevel = s.vib;
      hornStyle = s.hornStyle || 'city';
      if (!sfxOn) { hornStop(); siren(null); }
      applyVolumes();
    },
    canVibrate: !!(navigator.vibrate || iosHaptics)
  };
})();
