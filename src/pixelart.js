// Pixel postcards: a small pixel picture of every landmark, drawn in code on a 96 by 64 grid with each city's own
// colours. The album shows them, and one slides in when you drive past a landmark. Every shape is filled pixel by
// pixel with no smoothing, so the pictures stay sharp when the page blows them up. A landmark you haven't passed yet
// shows as a dark shape against a dim sky.
const POSTCARD = (() => {
  const W = 96, H = 64, GY = 50; // GY: where the ground starts
  const PAL = {
    amman: {
      sky: ['#4a7fc0', '#6f9fcf', '#9fc0e0', '#cfdde8', '#e6dcc6'], sun: '#fff3c8', cloud: '#fbf7f0',
      far: ['#cbb995', '#b39f7b'], ground: ['#a89470', '#8b7a5b'], road: '#55545a', line: '#f2f2ee',
      stone: ['#fbf6ea', '#eee3cb', '#dac7a3', '#bea67f'], shade: '#9b8566', dark: '#3a3129', win: '#56636e',
      glass: ['#6e9bc0', '#88b0ce', '#5d82a0', '#c8d2dc'], gold: '#e5b83b', blue: '#1f6fb8', blue2: '#4a90d0',
      green: ['#7a9a4a', '#55722f'], water: '#2d96bd', foam: '#c8f0ff', white: '#ffffff', black: '#1c1a1f',
      red: '#c8102e', flag: '#007a3d', signs: ['#c8102e', '#007a3d', '#1f4e9c', '#f2a900'], tank: ['#1c1a1f', '#f4f4f4']
    },
    dubai: {
      sky: ['#26295a', '#41306a', '#743f76', '#c25e78', '#f0916f', '#ffb878'], sun: '#ffe2a0', cloud: '#f1b49a',
      far: ['#5b4569', '#7b5670'], ground: ['#c9a27a', '#a8825e'], road: '#3a3442', line: '#f2e6d0',
      stone: ['#f6ecd8', '#e8d6b4', '#cfb58c', '#b0966e'], shade: '#7a6050', dark: '#151724', win: '#ffd9a0',
      glass: ['#4f6f8f', '#7091b0', '#9ab8cf', '#2d3a4a'], gold: '#e5b548', silver: ['#f1f4f8', '#c8ced6', '#9aa4b0'],
      sea: ['#2f5f86', '#4a7aa0', '#e8a080'], green: ['#4f7a3e', '#2f5a3a'], white: '#fbf8f2', black: '#151724',
      red: '#ff3b30', glow: '#fde68a', sand: '#e8c99a'
    },
    riyadh: {
      sky: ['#5b8cc2', '#7ea6d0', '#a8c3dc', '#cfd5cf', '#e4d2ac'], sun: '#fff4d0', cloud: '#f6efe2',
      far: ['#d2bb92', '#bea47a'], ground: ['#d8bd8c', '#c1a271'], road: '#5a5652', line: '#f2eee4',
      mud: ['#dcb486', '#c9a072', '#a97e52', '#7c5530'], stone: ['#f2ede2', '#e2dccf', '#cfc5b0', '#b5aa92'],
      dark: '#2a221c', wood: '#5a3a1f', win: '#3e4f60', glass: ['#6f8fa8', '#8aa6bd', '#a9bccb', '#4f6f84'],
      gold: '#e5b548', teal: '#5f9fb8', green: ['#6f8f45', '#4f6b33'], white: '#f8f5ee', black: '#1e1a17',
      night: ['#151530', '#2a2350', '#4a2f66'], neon: ['#ff4fa3', '#4fd2ff', '#ffd36b', '#7cff8a', '#b06bff']
    }
  };
  // locked cards: the sky goes slate and everything on it turns to one dark shape
  const LOCK_SKY = ['#283041', '#2f3849', '#374153', '#404b5e'], LOCK_INK = '#161b25', LOCK_GROUND = '#1f2530';
  // 4x4 ordered dither, 0..15
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

  function kit(g, P, lock) {
    const ink = (c) => (lock && !K.raw ? LOCK_INK : c);
    const K = {
      P, lock,
      px(c, x, y) { g.fillStyle = ink(c); g.fillRect(x | 0, y | 0, 1, 1); },
      rect(c, x, y, w, h) { const x0 = Math.round(x), y0 = Math.round(y); g.fillStyle = ink(c); g.fillRect(x0, y0, Math.round(x + w) - x0, Math.round(y + h) - y0); },
      // scanline fill of a polygon given as [x, y, x, y, ...]
      poly(c, p) {
        g.fillStyle = ink(c);
        let y0 = H, y1 = 0;
        for (let i = 1; i < p.length; i += 2) { y0 = Math.min(y0, p[i]); y1 = Math.max(y1, p[i]); }
        for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
          const sy = y + 0.5, xs = [];
          for (let i = 0; i < p.length; i += 2) {
            const ax = p[i], ay = p[i + 1], bx = p[(i + 2) % p.length], by = p[(i + 3) % p.length];
            if ((ay <= sy && by > sy) || (by <= sy && ay > sy)) xs.push(ax + (sy - ay) / (by - ay) * (bx - ax));
          }
          xs.sort((a, b) => a - b);
          for (let k = 0; k + 1 < xs.length; k += 2) { const a = Math.round(xs[k]), b = Math.round(xs[k + 1]); if (b > a) g.fillRect(a, y, b - a, 1); }
        }
      },
      // filled ellipse; part 'top' keeps the upper half only (a dome)
      oval(c, cx, cy, rx, ry, part) {
        g.fillStyle = ink(c);
        for (let y = Math.floor(cy - ry); y < Math.ceil(cy + ry); y++) {
          const dy = (y + 0.5 - cy) / ry; if (Math.abs(dy) > 1) continue;
          if (part === 'top' && y + 0.5 > cy) continue;
          const hw = rx * Math.sqrt(1 - dy * dy), a = Math.round(cx - hw), b = Math.round(cx + hw);
          if (b > a) g.fillRect(a, y, b - a, 1);
        }
      },
      ring(c, cx, cy, r, n) { for (let k = 0; k < (n || Math.ceil(r * 7)); k++) { const a = k / (n || Math.ceil(r * 7)) * Math.PI * 2; K.px(c, Math.round(cx + Math.cos(a) * r - 0.5), Math.round(cy + Math.sin(a) * r - 0.5)); } },
      line(c, x0, y0, x1, y1) {
        x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
        const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
        let e = dx + dy; g.fillStyle = ink(c);
        for (;;) { g.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
      },
      // every other pixel, for shading and glass
      checker(c, x, y, w, h, odd) { g.fillStyle = ink(c); for (let j = Math.round(y); j < Math.round(y + h); j++) for (let i = Math.round(x); i < Math.round(x + w); i++) if (((i + j) & 1) === (odd ? 1 : 0)) g.fillRect(i, j, 1, 1); },
      // a grid of window dots
      wins(c, x, y, w, h, sx, sy, on) { g.fillStyle = ink(c); for (let j = Math.round(y); j < y + h; j += sy) for (let i = Math.round(x); i < x + w; i += sx) if (!on || on(i, j)) g.fillRect(i, j, 1, 1); },
      // sky bands that blend into each other through a dither
      sky(cols) {
        cols = lock ? LOCK_SKY : cols;
        const n = cols.length, band = GY / n;
        for (let y = 0; y < GY; y++) {
          const f = y / band, i = Math.min(n - 1, Math.floor(f)), fr = f - i;
          for (let x = 0; x < W; x++) {
            const next = i + 1 < n && fr > 0.55 && bay(x, y) < (fr - 0.55) / 0.45 * 16;
            g.fillStyle = next ? cols[i + 1] : cols[i]; g.fillRect(x, y, 1, 1);
          }
        }
      },
      sun(x, y, r) { if (!lock) { K.oval(P.sun, x, y, r, r); } },
      cloud(x, y, w) { if (lock) return; K.oval(P.cloud, x, y, w / 2, 2.2); K.oval(P.cloud, x - w * 0.15, y - 1.5, w * 0.25, 2); K.oval(P.cloud, x + w * 0.12, y - 2, w * 0.2, 2.2); },
      ground(c1, c2, y) {
        y = y == null ? GY : y; c1 = c1 || P.ground[0]; c2 = c2 || P.ground[1];
        if (lock) { g.fillStyle = LOCK_GROUND; g.fillRect(0, y, W, H - y); return; }
        g.fillStyle = c1; g.fillRect(0, y, W, H - y);
        for (let j = y; j < H; j++) for (let i = 0; i < W; i++) if (bay(i, j) < 3 + (j - y)) { g.fillStyle = c2; g.fillRect(i, j, 1, 1); }
      },
      road(y) { y = y == null ? 57 : y; K.rect(P.road, 0, y, W, H - y); for (let x = 2; x < W; x += 10) K.rect(P.line, x, y + 3, 5, 1); },
      // a row of small stepped points along a mud wall top, Najdi style
      merlons(c, x0, x1, y, step) { step = step || 3; for (let x = x0; x + 1 < x1; x += step) { K.rect(c, x, y - 1, 2, 1); K.px(c, x + 0.5, y - 2); } },
      palm(x, y, h) {
        const tr = P.wood || P.dark, gr = P.green;
        K.line(tr, x, y, x + 1, y - h); const tx = x + 1, ty = y - h;
        for (const [dx, dy] of [[-5, 2], [-4, -2], [0, -4], [4, -2], [5, 2], [-2, 3], [3, 3]]) K.line(gr[(dx + 5) % 2], tx, ty, tx + dx, ty + dy);
        K.px(gr[1], tx, ty);
      },
      // distant city: blocks of two tones along the horizon
      skyline(y, seed, tall) {
        let s = seed || 7; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
        for (let x = -2; x < W; x += 3 + Math.floor(rnd() * 5)) { const h = 3 + rnd() * (tall || 8), w = 3 + Math.floor(rnd() * 5); K.rect(P.far[Math.floor(rnd() * 2)], x, y - h, w, h + 1); }
      }
    };
    return K;
  }

  // ---------- shared pieces ----------
  const ammanHill = (K, top, seed) => {
    const P = K.P; let s = seed || 3; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    K.poly(P.far[1], [0, GY, 0, top + 6, 18, top, 40, top + 4, 62, top - 2, 80, top + 3, 96, top + 1, 96, GY]);
    for (let row = 0; row < 5; row++) {
      const y = top + 3 + row * 4;
      for (let x = -2 + (row % 2) * 3; x < W; x += 5 + Math.floor(rnd() * 3)) {
        if (rnd() < 0.15) continue;
        const w = 4 + Math.floor(rnd() * 2), h = 3 + Math.floor(rnd() * 2);
        K.rect(P.stone[Math.floor(rnd() * 3)], x, y, w, h); K.px(P.win, x + 1, y + 1); if (w > 4) K.px(P.win, x + 3, y + 1);
        if (rnd() < 0.4) K.px(P.tank[Math.floor(rnd() * 2)], x + 1, y - 1);
      }
    }
  };
  const glassTower = (K, c, x, y, w, h, cap) => {
    const P = K.P; K.rect(c, x, y, w, h);
    K.rect(P.glass[2], x + w - 2, y, 2, h); // the side in shade
    K.wins(P.glass[3], x + 1, y + 2, w - 3, h - 3, 2, 3);
    if (cap) K.rect(cap, x + 1, y - 2, w - 2, 2);
  };
  const shopRow = (K, seed, trees) => {
    const P = K.P; let s = seed; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    let x = -1, i = 0;
    while (x < W) {
      const w = 12 + Math.floor(rnd() * 6), h = 14 + Math.floor(rnd() * 14), y = GY + 2 - h;
      K.rect(P.stone[i % 2], x, y, w, h); K.rect(P.stone[2], x + w - 1, y, 1, h);
      K.wins(P.win, x + 2, y + 2, w - 4, h - 11, 3, 4);
      K.rect(P.signs[i % P.signs.length], x + 1, GY - 6, w - 3, 2);
      K.rect(P.dark, x + 2, GY - 3, w - 5, 5);
      if (trees && i % 2 === 1) { K.rect(P.dark, x + w - 1, GY - 4, 1, 6); K.oval(P.green[i % 2], x + w - 1, GY - 7, 3, 3); }
      x += w; i++;
    }
  };
  const fountain = (K, wide) => {
    const P = K.P;
    K.oval(P.green[1], 48, 58, wide ? 40 : 34, 7); K.oval(P.green[0], 48, 57, wide ? 36 : 30, 5.5);
    K.oval(P.stone[2], 48, 56, 22, 4.5); K.oval(P.stone[0], 48, 55.5, 20, 3.8); K.oval(P.water, 48, 55.5, 18, 3);
    K.checker(P.foam, 34, 54, 28, 2);
    K.rect(P.stone[1], 44, 50, 8, 5); K.rect(P.stone[0], 46, 39, 4, 12); K.rect(P.stone[2], 49, 39, 1, 12);
    K.oval(P.foam, 48, 36, 4, 4);
    for (const [dx, h] of [[-9, 8], [-5, 11], [5, 11], [9, 8]]) K.line(P.foam, 48 + dx * 0.3, 52, 48 + dx, 52 - h);
  };

  // ---------- one function per landmark, in each city's landmark order ----------
  const ART = {
    amman: [
      // 0 Interior Circle: the round fountain in the middle of the roundabout, houses on the hill behind
      (K) => { const P = K.P; K.sky(P.sky); K.sun(14, 10, 4); K.cloud(70, 9, 18); ammanHill(K, 22, 5); K.ground(); fountain(K); },
      // 1 Abdali Boulevard: the glass towers on a long podium
      (K) => {
        const P = K.P; K.sky(P.sky); K.cloud(20, 8, 16); ammanHill(K, 34, 9); K.ground();
        glassTower(K, P.glass[0], 30, 6, 13, 40, P.glass[3]); glassTower(K, P.glass[1], 50, 12, 12, 34, P.glass[3]);
        glassTower(K, P.glass[2], 14, 22, 10, 26, P.glass[3]); glassTower(K, P.glass[3], 66, 25, 11, 23, P.glass[0]);
        K.rect(P.stone[1], 6, 40, 82, 11); K.rect(P.stone[2], 6, 40, 82, 1); K.wins(P.glass[2], 8, 42, 78, 7, 2, 3); K.road();
      },
      // 2 King Abdullah I Mosque: the blue dome with gold ribs and two minarets
      (K) => {
        const P = K.P; K.sky(P.sky); K.cloud(76, 10, 16); ammanHill(K, 34, 11); K.ground();
        for (const x of [16, 78]) { K.rect(P.stone[0], x - 2, 6, 4, 42); K.rect(P.stone[2], x + 1, 6, 1, 42); K.rect(P.gold, x - 2, 14, 4, 2); K.poly(P.blue, [x - 2, 6, x + 2, 6, x, 0]); }
        K.rect(P.stone[0], 20, 40, 56, 10); K.rect(P.stone[2], 20, 40, 56, 1);
        K.rect(P.stone[1], 30, 32, 36, 9); K.wins(P.blue2, 32, 34, 32, 5, 3, 3);
        K.oval(P.blue, 48, 32, 17, 16, 'top'); K.checker(P.blue2, 34, 18, 10, 13);
        for (const dx of [-12, -6, 0, 6, 12]) K.line(P.gold, 48 + dx * 0.4, 17, 48 + dx, 31);
        K.rect(P.gold, 47, 12, 2, 4); K.px(P.gold, 47, 11);
      },
      // 3 Amman Citadel: the Temple of Hercules columns on the hilltop, the Umayyad dome beside them
      (K) => {
        const P = K.P; K.sky(P.sky); K.sun(80, 9, 4); K.cloud(30, 8, 20);
        K.poly(P.far[0], [0, GY, 4, 34, 22, 28, 74, 28, 92, 34, 96, GY]); K.ground();
        K.rect(P.stone[2], 6, 30, 84, 4); K.wins(P.shade, 7, 31, 82, 2, 3, 2);
        K.rect(P.stone[1], 10, 20, 14, 10); K.oval(P.stone[2], 17, 20, 7, 6, 'top'); K.rect(P.dark, 15, 25, 3, 5);
        K.rect(P.stone[0], 36, 26, 46, 3);
        for (let k = 0; k < 6; k++) { K.rect(P.stone[0], 39 + k * 8, 10, 3, 16); K.rect(P.stone[2], 41 + k * 8, 10, 1, 16); }
        K.rect(P.stone[1], 37, 8, 44, 3);
      },
      // 4 Raghadan Flagpole: the tall pole with the Jordan flag
      (K) => {
        const P = K.P; K.sky(P.sky); K.cloud(72, 30, 20); ammanHill(K, 34, 4); K.ground();
        K.rect(P.stone[3], 40, 46, 9, 4); K.rect('#d5d8dc', 43, 2, 2, 46);
        const fx = 45, fy = 5, fw = 40, fh = 20;
        K.rect(P.black, fx, fy, fw, 7); K.rect(P.white, fx, fy + 7, fw, 6); K.rect(P.flag, fx, fy + 13, fw, 7);
        K.poly(P.red, [fx, fy, fx + 18, fy + fh / 2, fx, fy + fh]);
        K.px(P.white, fx + 5, fy + 9); K.px(P.white, fx + 6, fy + 10); K.px(P.white, fx + 4, fy + 10); K.px(P.white, fx + 5, fy + 11); K.px(P.white, fx + 5, fy + 10);
      },
      // 5 Roman Theatre: the rows of stone seats cut into the hill, the stage and its columns in front
      (K) => {
        const P = K.P; K.sky(P.sky); K.cloud(18, 8, 18); ammanHill(K, 14, 21); K.ground();
        for (let k = 0; k < 12; k++) { const y = 18 + k * 2.6, hw = 46 - k * 2.4; K.rect(k % 2 ? P.stone[1] : P.stone[2], 48 - hw, y, hw * 2, 3); }
        K.rect(P.shade, 46, 18, 4, 31);
        K.rect(P.stone[0], 22, 48, 52, 4); for (let k = 0; k < 9; k++) K.rect(P.stone[0], 24 + k * 6, 42, 2, 6); K.rect(P.stone[1], 22, 41, 52, 1);
      },
      // 6 Rainbow Street: old stone houses stacked down the slope, coloured awnings at the bottom
      (K) => {
        const P = K.P; K.sky(P.sky); K.sun(84, 8, 4);
        ammanHill(K, 10, 31); ammanHill(K, 22, 17); K.ground();
        const cols = ['#c8102e', '#f2a900', '#007a3d', '#1f6fb8', '#8f3fb5', '#ef6c2c'];
        for (let k = 0; k < 6; k++) { const x = 4 + k * 15; K.rect(P.stone[0], x, 40, 13, 10); K.rect(cols[k], x + 1, 44, 11, 2); K.rect(P.dark, x + 3, 46, 4, 4); K.px(P.win, x + 9, 42); }
      },
      // 7 Abdoun Bridge: two Y shaped towers holding the deck with fans of cables over the valley
      (K) => {
        const P = K.P; K.sky(P.sky); K.cloud(48, 7, 22);
        K.poly(P.far[0], [0, 30, 20, 34, 40, 50, 56, 50, 76, 34, 96, 28, 96, GY, 0, GY]); ammanHill(K, 40, 12); K.ground();
        K.poly(P.green[1], [30, GY, 40, 46, 56, 46, 66, GY]);
        for (const px of [30, 66]) {
          K.rect(P.stone[1], px - 1, 30, 3, 20); K.line(P.stone[1], px, 30, px - 3, 10); K.line(P.stone[1], px + 1, 30, px + 4, 10); K.line(P.stone[2], px + 1, 30, px + 3, 12);
          for (let k = 1; k <= 6; k++) for (const s of [-1, 1]) K.line(P.white, px + 0.5, 12 + k * 2, px + s * k * 4.5, 26);
        }
        K.rect(P.stone[0], 0, 26, W, 3); K.rect(P.stone[3], 0, 29, W, 1);
      },
      // 8 7th Circle: the roundabout fountain with newer offices behind it
      (K) => {
        const P = K.P; K.sky(P.sky); K.cloud(22, 9, 18); K.cloud(74, 13, 14);
        for (const [x, w, h, c] of [[2, 16, 22, 0], [20, 12, 30, 3], [62, 14, 26, 2], [78, 16, 20, 1]]) {
          K.rect(P.stone[c], x, GY - h, w, h); K.wins(P.win, x + 2, GY - h + 2, w - 4, h - 4, 2, 3);
        }
        glassTower(K, P.glass[0], 36, 14, 10, 36, P.glass[3]); glassTower(K, P.glass[1], 48, 20, 11, 30, P.glass[3]);
        K.ground(); fountain(K, true);
      },
      // 9 Sweifieh: stone shop fronts with bright signs
      (K) => { const P = K.P; K.sky(P.sky); K.sun(82, 9, 4); K.cloud(28, 9, 16); ammanHill(K, 20, 14); shopRow(K, 4); K.ground(null, null, 52); K.road(); },
      // 10 Mecca Mall: the long white mall with its glass top and red name board
      (K) => {
        const P = K.P; K.sky(P.sky); K.cloud(70, 10, 18); ammanHill(K, 30, 8); K.ground();
        K.rect(P.stone[0], 4, 28, 88, 22); K.rect(P.stone[2], 4, 28, 88, 2); K.rect(P.stone[3], 4, 49, 88, 1);
        K.rect(P.glass[1], 30, 22, 36, 6); K.checker(P.glass[3], 30, 22, 36, 6);
        K.rect(P.white, 32, 33, 32, 7); for (let x = 35; x < 62; x += 4) K.rect(P.red, x, 35, 2 + (x % 3), 3);
        K.rect(P.glass[0], 14, 42, 68, 8); K.wins(P.glass[3], 15, 43, 66, 6, 3, 2); K.road();
      },
      // 11 Gardens Street: shops under green trees
      (K) => { const P = K.P; K.sky(P.sky); K.cloud(16, 8, 16); K.cloud(60, 12, 22); ammanHill(K, 18, 27); shopRow(K, 11, true); K.ground(null, null, 52); K.road(); }
    ],
    dubai: [
      // 0 Dubai Frame: two gold towers joined at the top by the glass bridge
      (K) => {
        const P = K.P; K.sky(P.sky); K.sun(48, 40, 6); K.skyline(GY, 3, 12); K.ground();
        K.rect(P.gold, 24, 8, 9, 42); K.rect(P.gold, 63, 8, 9, 42); K.rect(P.gold, 24, 6, 48, 7); K.rect(P.gold, 24, 46, 48, 4);
        K.rect(P.glass[2], 33, 8, 30, 3); K.checker('#c79a35', 25, 14, 7, 31); K.checker('#c79a35', 64, 14, 7, 31);
      },
      // 1 World Trade Centre: the cream tower with its grid of windows, on a wide base
      (K) => {
        const P = K.P; K.sky(P.sky); K.sun(76, 38, 5); K.skyline(GY, 9, 10); K.ground();
        K.rect(P.stone[0], 38, 4, 18, 40); K.rect(P.stone[2], 52, 4, 4, 40); K.wins(P.shade, 40, 6, 14, 36, 2, 2);
        K.rect(P.stone[1], 24, 40, 46, 10); K.wins(P.win, 26, 42, 42, 6, 3, 3); K.road();
      },
      // 2 Museum of the Future: the silver ring with lit calligraphy on its green mound
      (K) => {
        const P = K.P; K.sky(P.sky); K.sun(14, 36, 5); K.skyline(GY, 13, 14); K.ground();
        K.oval(P.green[1], 48, 54, 34, 7); K.oval(P.green[0], 48, 52, 30, 7);
        K.oval(P.silver[1], 48, 27, 20, 23); K.oval(P.silver[0], 46, 26, 18, 21);
        // the hole shows the sky behind, locked or not
        K.raw = true; K.oval(K.lock ? LOCK_SKY[3] : P.sky[3], 48, 27, 9, 12); K.oval(K.lock ? LOCK_SKY[2] : P.sky[2], 48, 25, 8, 9); K.raw = false;
        if (!K.lock) for (let k = 0; k < 26; k++) { const a = k / 26 * Math.PI * 2, r = k % 2 ? 14 : 16.5; K.rect(P.glow, 48 + Math.cos(a) * r * 0.86 - 1, 27 + Math.sin(a) * r - 0.5, 2 + (k % 3 === 0), 1); }
      },
      // 3 Emirates Towers: the two glass towers with sharp triangle tops
      (K) => {
        const P = K.P; K.sky(P.sky); K.sun(80, 40, 5); K.skyline(GY, 21, 8); K.ground();
        K.rect(P.glass[1], 28, 12, 14, 38); K.poly(P.glass[1], [28, 12, 42, 12, 34, 0]); K.rect(P.glass[0], 36, 12, 6, 38); K.poly(P.glass[0], [36, 12, 42, 12, 34, 0]);
        K.rect(P.glass[1], 54, 20, 12, 30); K.poly(P.glass[1], [54, 20, 66, 20, 60, 10]); K.rect(P.glass[0], 61, 20, 5, 30); K.poly(P.glass[0], [61, 20, 66, 20, 60, 10]);
        K.wins(P.win, 30, 14, 5, 34, 2, 3, (i, j) => (i * 7 + j) % 5 === 0); K.wins(P.win, 56, 22, 4, 26, 2, 3, (i, j) => (i * 3 + j) % 4 === 0);
        K.road();
      },
      // 4 Burj Khalifa: the stepped needle rising out of the city, red light on top
      (K) => {
        const P = K.P; K.sky(P.sky); K.sun(80, 42, 5); K.skyline(GY, 31, 14); K.ground();
        const st = [[22, 12], [17, 10], [13, 9], [9, 8], [6, 6], [4, 5]];
        let y = GY;
        st.forEach(([w, h], i) => { y -= h; K.rect(P.glass[2], 48 - w / 2, y, w, h); K.rect(P.glass[1], 48, y, w / 2, h); K.rect(P.silver[0], 48 - w / 2 - (i ? 0 : 1), y, w + (i ? 0 : 2), 1); });
        K.rect(P.silver[1], 47, 3, 2, y - 3); K.rect(P.silver[0], 47.5, 1, 1, 3); K.px(P.red, 47, 0); K.px(P.red, 48, 0);
      },
      // 5 Mall of the Emirates: the long mall with the ski slope rising beside it
      (K) => {
        const P = K.P; K.sky(P.sky); K.sun(16, 38, 5); K.skyline(GY, 41, 8); K.ground();
        K.poly(P.silver[1], [52, 36, 92, 14, 96, 14, 96, 26, 58, 44]); K.poly(P.silver[0], [52, 36, 92, 14, 94, 16, 54, 38]);
        K.rect(P.stone[0], 6, 34, 62, 16); K.rect(P.stone[2], 6, 34, 62, 2); K.rect(P.glass[2], 20, 30, 24, 4);
        K.rect(P.white, 20, 38, 26, 5); for (let x = 22; x < 44; x += 4) K.rect('#6b4b1f', x, 39, 2 + (x % 3 === 0), 3);
        K.rect(P.glass[0], 8, 44, 58, 6); K.wins(P.win, 9, 45, 56, 4, 3, 2); K.road();
      },
      // 6 Dubai Marina: the tall towers around the water, the twisted tower among them
      (K) => {
        const P = K.P; K.sky(P.sky); K.sun(48, 40, 6);
        for (const [x, w, h, c] of [[2, 10, 30, 0], [12, 9, 40, 2], [24, 10, 34, 1], [54, 11, 44, 0], [66, 9, 30, 2], [76, 10, 38, 1], [87, 9, 26, 0]]) glassTower(K, P.glass[c], x, 44 - h, w, h, P.glass[3]);
        for (let k = 0; k < 20; k++) { const off = Math.round(Math.sin(k * 0.45) * 2); K.rect(P.silver[1], 38 + off, 6 + k * 2, 11, 2); K.rect(P.glass[1], 40 + off, 6 + k * 2, 6, 1); }
        K.rect(P.sea[0], 0, 44, W, 20); K.checker(P.sea[1], 0, 46, W, 3); K.checker(P.sea[2], 40, 44, 16, 6, 1);
        K.rect(P.white, 14, 52, 10, 2); K.rect(P.white, 17, 49, 1, 3); K.rect(P.white, 64, 56, 12, 2); K.rect(P.white, 68, 52, 1, 4);
      },
      // 7 Ain Dubai: the great wheel with its cabins over the sea
      (K) => {
        const P = K.P; K.sky(P.sky); K.sun(16, 40, 6);
        K.rect(P.sea[0], 0, 44, W, 20); K.checker(P.sea[1], 0, 46, W, 4); K.rect(P.sand, 30, 48, 40, 4);
        for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; K.line(P.silver[1], 52, 24, 52 + Math.cos(a) * 21, 24 + Math.sin(a) * 21); }
        K.ring(P.silver[0], 52, 24, 21, 140); K.ring(P.silver[0], 52, 24, 20, 120);
        for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; K.rect(P.white, 51 + Math.cos(a) * 22.5, 23 + Math.sin(a) * 22.5, 2, 2); }
        K.oval(P.silver[0], 52, 24, 2, 2); K.line(P.silver[1], 52, 24, 44, 50); K.line(P.silver[1], 52, 24, 60, 50); K.line(P.silver[2], 53, 24, 61, 50);
      },
      // 8 Burj Al Arab: the white sail on its island in the sea
      (K) => {
        const P = K.P; K.sky(P.sky); K.sun(72, 40, 7);
        K.rect(P.sea[0], 0, 46, W, 18); K.checker(P.sea[1], 0, 48, W, 4); K.checker(P.sea[2], 60, 46, 22, 5, 1);
        K.oval(P.sand, 46, 47, 18, 3);
        K.rect(P.silver[2], 34, 4, 2, 42); K.rect(P.silver[1], 37, 2, 1, 44);
        K.poly(P.white, [36, 46, 36, 4, 40, 4, 52, 14, 58, 28, 57, 40, 54, 46]);
        K.poly(P.silver[0], [44, 46, 50, 16, 56, 28, 56, 40, 53, 46]);
        for (const y of [16, 26, 36]) K.line(P.silver[2], 37, y, 55, y + 4);
        K.oval(P.white, 56, 12, 4, 1.5); K.rect(P.glass[2], 48, 9, 6, 2);
      },
      // 9 Jumeirah Mosque: the cream mosque with its dome and two minarets among palms
      (K) => {
        const P = K.P; K.sky(P.sky); K.sun(82, 36, 5); K.ground();
        for (const x of [24, 72]) { K.rect(P.stone[0], x - 2, 12, 4, 38); K.rect(P.stone[2], x + 1, 12, 1, 38); K.poly(P.stone[0], [x - 2, 12, x + 2, 12, x, 6]); K.rect(P.stone[2], x - 2, 22, 4, 1); }
        K.rect(P.stone[0], 30, 36, 36, 14); K.rect(P.stone[2], 30, 36, 36, 1); for (let x = 33; x < 64; x += 5) K.rect(P.shade, x, 40, 2, 5);
        K.oval(P.stone[0], 48, 36, 10, 10, 'top'); K.checker(P.stone[1], 50, 28, 7, 8); K.oval(P.stone[0], 37, 36, 4, 4, 'top'); K.oval(P.stone[0], 59, 36, 4, 4, 'top');
        K.rect(P.gold, 47.5, 23, 1, 3);
        K.palm(8, 50, 16); K.palm(88, 50, 14);
      }
    ],
    riyadh: [
      // 0 Masmak Fort: the mud fort with round corner towers, a tall watchtower and the wooden gate
      (K) => {
        const P = K.P; K.sky(P.sky); K.sun(80, 10, 4); K.ground();
        K.rect(P.mud[1], 30, 10, 12, 30); K.merlons(P.mud[1], 30, 42, 10);
        K.rect(P.mud[1], 16, 28, 64, 22); K.merlons(P.mud[1], 16, 80, 28);
        for (const x of [12, 76]) { K.rect(P.mud[0], x, 20, 9, 30); K.rect(P.mud[2], x + 6, 20, 3, 30); K.rect(P.mud[2], x - 1, 20, 11, 1); K.merlons(P.mud[0], x, x + 9, 20); }
        K.rect(P.mud[2], 16, 36, 64, 1);
        for (let x = 24; x < 72; x += 6) if (Math.abs(x - 46) > 5) K.poly(P.dark, [x, 33, x + 2, 33, x + 1, 31]);
        K.rect(P.wood, 43, 40, 8, 10); K.rect(P.mud[3], 47, 40, 1, 10);
        K.palm(90, 50, 14);
      },
      // 1 Grand Mosque: the long mud coloured hall with its two square minarets
      (K) => {
        const P = K.P; K.sky(P.sky); K.cloud(30, 8, 16); K.ground();
        for (const x of [14, 82]) { K.rect(P.mud[1], x - 3, 10, 6, 40); K.rect(P.mud[2], x - 4, 10, 8, 2); K.rect(P.mud[1], x - 2, 4, 4, 6); K.poly(P.mud[2], [x - 3, 4, x + 3, 4, x, 0]); K.rect(P.mud[2], x + 2, 12, 1, 38); }
        K.rect(P.mud[0], 17, 32, 62, 18); K.merlons(P.mud[0], 17, 79, 32); K.rect(P.mud[2], 17, 37, 62, 1);
        for (let x = 22; x < 76; x += 5) K.rect(P.mud[3], x, 40, 2, 6);
      },
      // 2 Murabba Palace: the square mud palace with corner towers, the museum's curved wall beside it
      (K) => {
        const P = K.P; K.sky(P.sky); K.sun(16, 9, 4); K.ground();
        K.poly(P.stone[2], [56, GY, 56, 30, 74, 27, 96, 28, 96, GY]); K.rect(P.stone[3], 56, 30, 40, 1);
        K.rect(P.mud[1], 10, 30, 42, 20); K.merlons(P.mud[1], 10, 52, 30); K.rect(P.mud[2], 10, 38, 42, 1);
        for (const x of [6, 48]) { K.rect(P.mud[0], x, 24, 7, 26); K.rect(P.mud[2], x + 5, 24, 2, 26); K.merlons(P.mud[0], x, x + 7, 24); }
        for (let x = 17; x < 46; x += 6) K.rect(P.dark, x, 42, 2, 4);
        K.palm(60, 50, 13); K.palm(76, 50, 15); K.palm(90, 50, 12);
      },
      // 3 Water Tower: the white column holding up a wide cup with a blue band
      (K) => {
        const P = K.P; K.sky(P.sky); K.cloud(76, 10, 20); K.skyline(GY, 5, 7); K.ground();
        K.rect(P.white, 45, 20, 6, 30); K.rect(P.stone[2], 49, 20, 2, 30); K.rect(P.stone[3], 41, 48, 14, 2);
        K.poly(P.white, [28, 10, 68, 10, 51, 24, 45, 24]); K.poly(P.stone[1], [50, 10, 68, 10, 51, 24]);
        K.rect(P.teal, 28, 7, 40, 3); K.rect(P.white, 29, 5, 38, 2);
      },
      // 4 TV Tower: the tall concrete shaft, the round pod and the mast
      (K) => {
        const P = K.P; K.sky(P.sky); K.cloud(22, 26, 20); K.skyline(GY, 17, 6); K.ground();
        K.poly(P.stone[0], [43, GY, 46, 18, 50, 18, 53, GY]); K.poly(P.stone[2], [48, GY, 48, 18, 50, 18, 53, GY]);
        K.rect(P.stone[1], 40, 16, 16, 2); K.rect(P.glass[3], 39, 12, 18, 4); K.wins(P.glass[2], 40, 13, 16, 2, 2, 2); K.rect(P.stone[1], 41, 10, 14, 2);
        K.rect(P.stone[3], 47, 0, 2, 10);
      },
      // 5 Al Faisaliah: the glass pyramid tower with its golden globe under the spire
      (K) => {
        const P = K.P; K.sky(P.sky); K.cloud(76, 18, 18); K.skyline(GY, 25, 8); K.ground();
        K.poly('#c6b58e', [30, 46, 66, 46, 50, 12, 46, 12]); K.poly('#a8986f', [48, 46, 66, 46, 50, 12, 48, 12]);
        K.line(P.stone[1], 30, 46, 46, 8); K.line(P.stone[1], 66, 46, 50, 8);
        K.wins('#8f8160', 38, 22, 20, 22, 2, 3, (i) => Math.abs(i - 48) < 10);
        K.oval(P.gold, 48, 9, 4, 4); K.rect(P.white, 47, 1, 2, 5); K.rect(P.stone[2], 26, 44, 44, 6);
      },
      // 6 Kingdom Centre: the tall tower whose top opens in a curve, the Sky Bridge across it
      (K) => {
        const P = K.P; K.sky(P.sky); K.sun(16, 10, 4); K.skyline(GY, 33, 8); K.ground();
        const body = [32, 44, 32, 22, 34, 8, 40, 0, 42, 0, 48, 22, 54, 0, 56, 0, 62, 8, 64, 22, 64, 44];
        K.poly(P.glass[1], body); K.poly(P.glass[0], [52, 44, 52, 16, 54, 0, 56, 0, 62, 8, 64, 22, 64, 44]);
        K.wins(P.glass[3], 34, 22, 28, 20, 2, 3);
        K.rect(P.white, 41, 12, 14, 2); K.rect(P.stone[2], 20, 42, 56, 8); K.wins(P.win, 22, 44, 52, 4, 3, 2); K.road();
      },
      // 7 KAFD: the cluster of new towers led by the tall cut crystal tower
      (K) => {
        const P = K.P; K.sky(P.sky); K.cloud(80, 8, 16); K.ground();
        for (const [x, w, h, c] of [[4, 11, 26, 0], [16, 9, 34, 3], [62, 12, 30, 2], [76, 9, 38, 0], [86, 10, 22, 1]]) glassTower(K, P.glass[c], x, GY - h, w, h, P.glass[2]);
        K.oval(P.glass[0], 33, 34, 5, 16); K.rect(P.glass[0], 28, 34, 10, 16);
        K.rect(P.glass[2], 40, 10, 16, 40); K.rect(P.glass[1], 48, 10, 8, 40); K.poly(P.glass[2], [40, 10, 56, 10, 48, 0]); K.poly(P.glass[1], [48, 10, 56, 10, 48, 0]);
        K.wins(P.white, 42, 12, 12, 36, 3, 4);
      },
      // 8 Riyadh Park: the long mall with its glass entrance
      (K) => {
        const P = K.P; K.sky(P.sky); K.sun(80, 9, 4); K.skyline(GY, 37, 6); K.ground();
        K.rect(P.stone[0], 6, 30, 84, 20); K.rect(P.stone[2], 6, 30, 84, 2); K.rect(P.glass[1], 34, 24, 28, 6); K.checker(P.glass[3], 34, 24, 28, 6);
        K.rect(P.white, 34, 34, 28, 6); for (let x = 37; x < 60; x += 4) K.rect('#7a1f2b', x, 36, 2 + (x % 3 === 1), 3);
        K.rect(P.glass[0], 12, 42, 72, 8); K.wins(P.glass[3], 13, 43, 70, 6, 3, 2); K.palm(4, 50, 14); K.palm(92, 50, 13); K.road();
      },
      // 9 Boulevard City: the lit gate and bright shop signs at night
      (K) => {
        const P = K.P; K.sky(P.night);
        if (!K.lock) for (const [x, y] of [[10, 4], [30, 9], [70, 5], [86, 12], [52, 3], [20, 16]]) K.px(P.white, x, y);
        for (let k = 0; k < 6; k++) { const x = k * 16, h = 14 + (k * 7) % 12; K.rect('#3a3446', x, GY - h, 15, h); K.rect(P.neon[k % 5], x + 2, GY - h + 3, 11, 2); }
        K.ground('#3a3446', '#2a2436');
        for (let k = 0; k <= 40; k++) { const a = Math.PI * k / 40, x = 48 - Math.cos(a) * 22, y = GY - Math.sin(a) * 26; K.rect('#2a2340', x - 1.5, y - 1.5, 3, 3); K.px(P.neon[2], x, y - 1); }
        for (const x of [12, 84]) { K.rect('#6b6f75', x, 28, 1, 22); K.oval('#fff1c2', x + 0.5, 27, 2, 2); }
      },
      // 10 Diriyah: mud brick houses and towers stacked on the low hill by the wadi
      (K) => {
        const P = K.P; K.sky(P.sky); K.sun(84, 9, 4); K.ground();
        K.poly('#b0915f', [0, GY, 10, 36, 86, 34, 96, 44, 96, GY]);
        for (const [x, y, w, h, c] of [[8, 30, 14, 10, 1], [22, 26, 12, 14, 0], [40, 22, 16, 18, 1], [58, 28, 12, 12, 2], [70, 24, 14, 14, 0], [32, 34, 12, 8, 2]]) {
          K.rect(P.mud[c], x, y, w, h); K.merlons(P.mud[c], x, x + w, y); K.rect(P.mud[3], x + 2, y + 3, 1, 2); K.rect(P.mud[3], x + w - 4, y + 3, 1, 2);
        }
        for (const [x, y, h] of [[36, 12, 12], [62, 16, 12], [18, 20, 8]]) { K.rect(P.mud[0], x, y, 5, h); K.rect(P.mud[2], x + 3, y, 2, h); K.rect(P.mud[3], x - 1, y, 7, 1); }
        K.palm(4, 50, 10); K.palm(88, 52, 14); K.palm(78, 54, 11);
      }
    ]
  };

  const cache = new Map();
  // the picture for landmark idx of the given city, as a data URL; lock draws the dark shape instead
  function url(city, idx, lock) {
    const key = city + ':' + idx + ':' + (lock ? 1 : 0);
    if (cache.has(key)) return cache.get(key);
    const draw = ART[city] && ART[city][idx];
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    if (draw) draw(kit(g, PAL[city], !!lock));
    else { g.fillStyle = '#3a4250'; g.fillRect(0, 0, W, H); }
    const u = cv.toDataURL('image/png'); cache.set(key, u); return u;
  }
  return { url, W, H, has: (city, idx) => !!(ART[city] && ART[city][idx]) };
})();
