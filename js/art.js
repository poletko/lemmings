'use strict';
// Drawing in a hand-inked night style: wobbly "boiling" outlines (lines jitter a few times per second like
// hand-drawn animation), dark moonlit palettes, crooked shapes. Terrain is a pixel texture with ink rims.
const Art = (() => {
  const { W, H, EMPTY, DIRT, STEEL, BRICK } = Sim;
  const INK = '#0c0710';
  const THEMES = {
    // graveyard hill
    meadow: { sky: ['#070818', '#1d1a3c', '#3a2c55'], hill: ['#1a1830', '#121022', '#0b0a16'], top: [0x34503e, 0x2a4232, 0x4a6a4c], earth: [0x3a2a30, 0x2a1d24], stone: 0x5c4e58, moon: '#efe6c6', glow: 'rgba(230,220,170,', deco: 'graves' },
    // frosty night
    snow: { sky: ['#050b1c', '#16284a', '#3b5578'], hill: ['#1b2840', '#121c30', '#0a1222'], top: [0xc7d2e4, 0xa9b6cc, 0xe4ebf5], earth: [0x2a3246, 0x1f2638], stone: 0x56607a, moon: '#e9f0ff', glow: 'rgba(200,220,255,', deco: 'pines' },
    // crypt / cave
    cave: { sky: ['#06040a', '#120a18', '#1e1226'], hill: ['#1a1022', '#120a18', '#0a060e'], top: [0x3c5634, 0x2e4428, 0x56743e], earth: [0x382236, 0x281828], stone: 0x5e4a62, moon: null, glow: 'rgba(160,255,140,', deco: 'cave' },
    // pumpkin night
    dusk: { sky: ['#0d0618', '#2a1230', '#5a2430'], hill: ['#24122a', '#180c1e', '#0e0712'], top: [0x3e4a2a, 0x313c22, 0x56603a], earth: [0x45282a, 0x331d20], stone: 0x6a4a44, moon: '#ffb860', glow: 'rgba(255,160,80,', deco: 'pumpkins' },
    // Christmas night: snowy pines with candle lights, presents, a star
    christmas: { sky: ['#050a1e', '#15204c', '#2c2f62'], hill: ['#18213c', '#101830', '#0a1022'], top: [0xe8eef8, 0xc8d4e6, 0xffffff], earth: [0x3e2a36, 0x2c1e2a], stone: 0x7a4050, moon: '#fff2c8', glow: 'rgba(255,230,160,', deco: 'xmas', snow: 1, trees: false },
    // deep winter: snowmen, birches, falling snow
    winter: { sky: ['#03060f', '#0e1c33', '#2d4060'], hill: ['#22304a', '#18243a', '#0e1828'], top: [0xdfe8f4, 0xbccadc, 0xf4f8ff], earth: [0x2c3448, 0x20283a], stone: 0x6a7890, moon: '#dfe9ff', glow: 'rgba(190,210,255,', deco: 'snowmen', snow: 1, water: ['rgba(30,60,90,0.85)', '#9ec0e0'] },
    // Easter night: painted eggs in the grass, bunnies, fireflies
    easter: { sky: ['#0b0a20', '#2a1e4a', '#4a3466'], hill: ['#1e2c2a', '#16221f', '#0d1614'], top: [0x5e9858, 0x4a7c44, 0x8cc866], earth: [0x4a3428, 0x382820], stone: 0xc89ab8, moon: '#fff0d8', glow: 'rgba(255,220,240,', deco: 'eggs', flies: 1 },
    // beach at night: sea on the horizon, palms, sandy ground with shells
    beach: { sky: ['#040818', '#10204a', '#2c3a6a'], hill: ['#2a2638', '#201c2c', '#16131f'], top: [0xd8c08a, 0xc0a874, 0xeedcaa], earth: [0xa88a5a, 0x8c7048], stone: 0xf0e0d0, moon: '#fff6dc', glow: 'rgba(255,240,200,', deco: 'beach', trees: false, hillAmp: 0.35, sand: 0xd2b47a, water: ['rgba(20,50,90,0.86)', '#8ac0e8'] },
    // swimming pool at night: tiled ground, lit pool hall, diving tower
    pool: { sky: ['#050816', '#121a38', '#22305a'], hill: ['#1a2236', '#141a2c', '#0c1020'], top: [0xe0eef4, 0xb8d0dc, 0xffffff], earth: [0x4aa8c8, 0x3a90b0], stone: 0x2a6a88, moon: '#f4f0e0', glow: 'rgba(120,230,255,', deco: 'pool', trees: false, hillAmp: 0.25, pattern: 'tiles', water: ['rgba(40,170,210,0.7)', '#bff4ff'] },
    // school at midnight: brick walls, clock tower, wooden floors
    school: { sky: ['#08061a', '#1c1638', '#33284e'], hill: ['#20182c', '#181222', '#100c18'], top: [0x7a5a3a, 0x684a30, 0x9a7a52], earth: [0x8a3a2a, 0x702e22], stone: 0xd8d0c0, moon: '#f8eed0', glow: 'rgba(255,230,170,', deco: 'school', trees: false, hillAmp: 0.3, pattern: 'bricks' },
  };
  const px = (rgb, a = 255) => ((a << 24) | ((rgb & 0xff) << 16) | (rgb & 0xff00) | ((rgb >> 16) & 0xff)) >>> 0;
  const shade = (rgb, f) => {
    const r = Math.min(255, Math.max(0, ((rgb >> 16) & 255) * f)), g = Math.min(255, Math.max(0, ((rgb >> 8) & 255) * f)), b = Math.min(255, Math.max(0, (rgb & 255) * f));
    return (r << 16) | (g << 8) | b;
  };
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const vnoise = (x, y, s) => {
    const fx = x / s, fy = y / s, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };

  // ---------- ink toolkit ----------
  let boil = 0;
  const setTime = t => { boil = Math.floor(t * 6) % 3; };
  const jit = (seed, amp) => (hash(seed | 0, boil * 977 + 13) - 0.5) * 2 * amp;
  // wobbly path through points (flat array), smoothed with quadratic curves
  function trace(ctx, pts, closed, amp, seed, seg = 6) {
    const out = [], n = pts.length / 2, m = closed ? n : n - 1;
    let k = 0;
    for (let i = 0; i < m; i++) {
      const ax = pts[i * 2], ay = pts[i * 2 + 1], b = (i + 1) % n, bx = pts[b * 2], by = pts[b * 2 + 1];
      const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / seg));
      for (let s = 0; s < steps; s++) { const f = s / steps; out.push(ax + (bx - ax) * f + jit(seed + k, amp), ay + (by - ay) * f + jit(seed + k + 500, amp)); k++; }
    }
    if (!closed) out.push(pts[(n - 1) * 2] + jit(seed + k, amp), pts[(n - 1) * 2 + 1] + jit(seed + k + 500, amp));
    const L = out.length / 2;
    ctx.beginPath();
    if (closed) {
      ctx.moveTo((out[0] + out[(L - 1) * 2]) / 2, (out[1] + out[(L - 1) * 2 + 1]) / 2);
      for (let i = 0; i < L; i++) { const j = (i + 1) % L; ctx.quadraticCurveTo(out[i * 2], out[i * 2 + 1], (out[i * 2] + out[j * 2]) / 2, (out[i * 2 + 1] + out[j * 2 + 1]) / 2); }
      ctx.closePath();
    } else {
      ctx.moveTo(out[0], out[1]);
      for (let i = 1; i < L - 1; i++) ctx.quadraticCurveTo(out[i * 2], out[i * 2 + 1], (out[i * 2] + out[i * 2 + 2]) / 2, (out[i * 2 + 1] + out[i * 2 + 3]) / 2);
      ctx.lineTo(out[(L - 1) * 2], out[(L - 1) * 2 + 1]);
    }
  }
  function shape(ctx, pts, fill, lw, amp, seed, opt = {}) {
    const seg = opt.seg || Math.max(1.5, amp * 8);
    trace(ctx, pts, opt.open ? false : true, amp, seed, seg);
    if (fill && !opt.open) { ctx.fillStyle = fill; ctx.fill(); }
    if (lw) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = opt.ink || INK; ctx.lineWidth = lw; ctx.stroke();
      if (opt.double !== false) {   // second, thinner sketch stroke
        trace(ctx, pts, opt.open ? false : true, amp * 1.4, seed + 211, seg);
        ctx.globalAlpha *= 0.55; ctx.lineWidth = lw * 0.55; ctx.stroke(); ctx.globalAlpha /= 0.55;
      }
    }
  }
  const line = (ctx, pts, lw, amp, seed, ink) => shape(ctx, pts, null, lw, amp, seed, { open: true, ink, double: false });
  function ellPts(cx, cy, rx, ry, n = 12, rot = 0) {
    const p = [];
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const x = Math.cos(a) * rx, y = Math.sin(a) * ry; p.push(cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)); }
    return p;
  }
  const ell = (ctx, cx, cy, rx, ry, fill, lw, amp, seed, opt) => shape(ctx, ellPts(cx, cy, rx, ry, opt && opt.n || 12, opt && opt.rot || 0), fill, lw, amp, seed, opt);
  // wobbly rounded rectangle for UI (screen px)
  function inkRect(ctx, x, y, w, h, r, fill, stroke, lw = 2, seed = 7) {
    r = Math.min(r, w / 2, h / 2);
    const p = [];
    const corner = (cx, cy, a0) => { for (let i = 0; i <= 3; i++) { const a = a0 + i / 3 * Math.PI / 2; p.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } };
    corner(x + w - r, y + r, -Math.PI / 2); corner(x + w - r, y + h - r, 0); corner(x + r, y + h - r, Math.PI / 2); corner(x + r, y + r, Math.PI);
    const amp = Math.max(0.6, Math.min(2.2, Math.min(w, h) * 0.012));
    shape(ctx, p, fill, stroke ? lw : 0, amp, seed + Math.round(x * 3 + y * 7), { ink: stroke, seg: Math.max(10, Math.min(w, h) / 4) });
  }
  // spiral curl (for hills, smoke, hat tips)
  function curlPts(cx, cy, r0, turns, dir = 1, n = 24) {
    const p = [];
    for (let i = 0; i <= n; i++) { const f = i / n, a = dir * f * turns * Math.PI * 2, r = r0 * (1 - f * 0.85); p.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    return p;
  }

  // ---------- terrain ----------
  function brickColor(x, y) {
    const row = Math.floor(y / 2), off = row % 2 ? 5 : 0;
    const edge = (x + off) % 10 === 0 || y % 2 === 0;
    return px(edge ? 0x3a2010 : shade(0xb07a3e, 0.85 + hash(x, y) * 0.3));
  }
  function makeTerrain(game, themeName) {
    const th = THEMES[themeName] || THEMES.meadow;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const cx = cv.getContext('2d');
    const img = cx.createImageData(W, H);
    const d32 = new Uint32Array(img.data.buffer);
    const base = new Uint32Array(W * H);
    const m = game.T.m;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, v = m[i];
      if (v === EMPTY) continue;
      let c;
      if (v === STEEL) {
        const gx = x % 16, gy = y % 16;
        c = 0x3c3c4c;
        if (gx === 0 || gy === 0) c = 0x14121c;
        else if (gx === 1 || gy === 1) c = 0x5a5a6c;
        if ((gx === 4 || gx === 12) && (gy === 4 || gy === 12)) c = 0x7a7a8c;
        else if ((gx === 5 || gx === 13) && (gy === 5 || gy === 13)) c = 0x1a1822;
        if ((gx + gy) % 9 === 0 && hash(x >> 3, y >> 3) > 0.6) c = shade(c, 0.8);   // scratches
        c = shade(c, 0.9 + hash(x, y) * 0.15);
      } else if (v === BRICK) { base[i] = brickColor(x, y); continue; }
      else {
        let depth = 0;
        while (depth < 9 && y - depth - 1 >= 0 && m[(y - depth - 1) * W + x] !== EMPTY) depth++;
        const n = vnoise(x, y, 7) * 0.6 + vnoise(x, y, 2.5) * 0.4;
        const topH = 2 + Math.floor(vnoise(x, 3, 3) * 4) + (hash(x, 1) > 0.8 ? 2 : 0);   // ragged grass teeth
        if (depth < topH && y - depth - 1 >= 0) c = th.top[depth === 0 ? 2 : (n > 0.5 ? 1 : 0)];
        else if (th.pattern === 'tiles') {   // pool tiles with pale grout
          const gx = x % 8, gy = y % 8;
          c = gx === 0 || gy === 0 ? 0xd8eef4 : shade(hash(x >> 3, y >> 3) > 0.85 ? th.stone : th.earth[(x >> 3) % 2], 0.92 + hash(x, y) * 0.12);
        } else if (th.pattern === 'bricks') {   // school bricks
          const row = y >> 2, off = row % 2 ? 6 : 0, edge = (x + off) % 12 === 0 || y % 4 === 0;
          c = edge ? 0x3a2a26 : shade(th.earth[hash((x + off) / 12 | 0, row) > 0.5 ? 0 : 1], 0.85 + hash(x, y) * 0.25);
        } else {
          c = shade(n > 0.5 ? th.earth[0] : th.earth[1], 0.85 + n * 0.3);
          // pen hatching: short diagonal strokes in patches
          if ((x + y) % 5 === 0 && vnoise(x, y, 11) > 0.55) c = shade(c, 0.62);
          if (hash(Math.floor(x / 3), Math.floor(y / 3)) > 0.972) c = shade(th.stone, 0.8 + hash(x, y) * 0.3);
        }
      }
      base[i] = px(c);
    }
    const t = { cv, cx, img, d32, base, th, theme: themeName, game };
    for (let i = 0; i < W * H; i++) if (m[i] !== EMPTY) d32[i] = colorAt(t, i);
    cx.putImageData(img, 0, 0);
    return t;
  }
  // ink rim: solid pixels near air get ink; thickness 1–2 px varying along the edge like a pen line
  function colorAt(t, i) {
    const m = t.game.T.m, x = i % W, y = (i / W) | 0;
    if (m[i] === EMPTY) return 0;
    if (m[i] === BRICK) return t.base[i] || brickColor(x, y);   // thin planks: no ink rim or they vanish
    const r = hash(x >> 2, y >> 2) > 0.45 ? 2 : 1;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r + 1) continue;
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
      if (m[yy * W + xx] === EMPTY) return px(0x0c0710);
    }
    if (m[i] === BRICK) return t.base[i] || brickColor(x, y);
    if (!t.base[i]) t.base[i] = px(shade(t.th.sand || 0xc8a86a, 0.8 + hash(x, y) * 0.35));   // poured sand
    return t.base[i];
  }
  function updateTerrain(t, game) {
    const ch = game.T.changes;
    if (!ch.length) return;
    const seen = new Set();
    for (const i of ch) {
      const x = i % W, y = (i / W) | 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
        seen.add(yy * W + xx);
      }
    }
    for (const j of seen) t.d32[j] = colorAt(t, j);
    ch.length = 0;
    t.cx.putImageData(t.img, 0, 0);
  }

  // ---------- night background ----------
  const bgCache = {};
  function tree(c, x, y, h, seed) {
    // crooked dead tree with curling branch tips (filled silhouette strokes)
    const branch = (x0, y0, ang, len, w, depth, s) => {
      const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
      const mx = (x0 + x1) / 2 + (hash(s, 1) - 0.5) * len * 0.5, my = (y0 + y1) / 2 + (hash(s, 2) - 0.5) * len * 0.3;
      c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke();
      if (depth <= 0) {
        const p = curlPts(x1 + Math.cos(ang) * 2, y1 + Math.sin(ang) * 2, 2.5, 1.2, hash(s, 3) > 0.5 ? 1 : -1, 10);
        c.lineWidth = Math.max(0.5, w * 0.7); c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.stroke();
        return;
      }
      const k = 2 + (hash(s, 4) > 0.6 ? 1 : 0);
      for (let i = 0; i < k; i++) branch(x1, y1, ang + (hash(s, 5 + i) - 0.5) * 1.6, len * (0.6 + hash(s, 9 + i) * 0.2), w * 0.62, depth - 1, s * 7 + i + 1);
    };
    c.lineCap = 'round';
    branch(x, y, -Math.PI / 2 + (hash(seed, 0) - 0.5) * 0.4, h * 0.45, h * 0.09, 3, seed);
  }
  // ---------- holiday / place decorations (drawn on the middle hill layer, c = bg context) ----------
  function sea(c, th, mx) {
    const hz = 196;
    const g = c.createLinearGradient(0, hz, 0, H);
    g.addColorStop(0, '#1a3060'); g.addColorStop(1, '#08142c');
    c.fillStyle = g; c.fillRect(0, hz, W, H - hz);
    c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, hz); c.lineTo(W, hz); c.stroke();
    for (let i = 0; i < 26; i++) {   // moon path on the water
      const y = hz + 3 + i * 3.2, w = 6 + i * 1.6 + hash(i, 5) * 10;
      c.fillStyle = `rgba(255,240,200,${0.5 - i * 0.016})`; c.fillRect(mx - w / 2 + (hash(i, 6) - 0.5) * 8, y, w, 1);
    }
    c.strokeStyle = 'rgba(160,200,255,0.25)'; c.lineWidth = 0.7;
    for (let i = 0; i < 30; i++) { const x = hash(i, 7) * W, y = hz + 6 + hash(i, 8) * 60; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 4, y - 2, x + 8, y); c.stroke(); }
  }
  function palm(c, x, y, h, seed) {
    c.lineCap = 'round'; c.lineWidth = 3;
    const tx = x + (hash(seed, 1) - 0.3) * 18, ty = y - h;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (tx - x) * 0.2, y - h * 0.6, tx, ty); c.stroke();
    c.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI + i / 5 * Math.PI + (hash(seed, i) - 0.5) * 0.3, l = 14 + hash(seed, i + 9) * 8;
      c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(a) * l * 0.6, ty + Math.sin(a) * l * 0.6 - 5, tx + Math.cos(a) * l, ty + Math.sin(a) * l * 0.5 + 6); c.stroke();
    }
  }
  function building(c, th, kind) {
    c.save();
    c.fillStyle = th.hill[1]; c.strokeStyle = 'rgba(0,0,0,0.7)'; c.lineWidth = 1.2;
    if (kind === 'school') {
      const x0 = 120, y0 = 132, w = 300, h = 120;
      c.beginPath(); c.rect(x0, y0, w, h); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(x0 - 8, y0); c.lineTo(x0 + w / 2, y0 - 30); c.lineTo(x0 + w + 8, y0); c.closePath(); c.fill(); c.stroke();
      // clock tower at midnight
      const tx = x0 + w / 2;
      c.beginPath(); c.rect(tx - 18, y0 - 70, 36, 50); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(tx - 24, y0 - 70); c.lineTo(tx, y0 - 100); c.lineTo(tx + 24, y0 - 70); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#efe2b0'; c.beginPath(); c.arc(tx, y0 - 48, 11, 0, 7); c.fill(); c.stroke();
      c.strokeStyle = '#1a1020'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(tx, y0 - 48); c.lineTo(tx, y0 - 57); c.moveTo(tx, y0 - 48); c.lineTo(tx + 1, y0 - 54); c.stroke();
      for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) {
        const lit = hash(i, r + 40) > 0.72, wx = x0 + 14 + i * 32, wy = y0 + 14 + r * 34;
        c.fillStyle = lit ? 'rgba(255,214,120,0.85)' : '#141020'; c.fillRect(wx, wy, 16, 20);
        c.fillStyle = th.hill[1]; c.fillRect(wx + 7.5, wy, 1, 20); c.fillRect(wx, wy + 9.5, 16, 1);
      }
      // flag pole and pencil fence
      c.strokeStyle = '#0a0812'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(480, 250); c.lineTo(480, 150); c.stroke();
      c.fillStyle = '#7a2a3a'; c.beginPath(); c.moveTo(480, 152); c.quadraticCurveTo(492, 156, 502, 152); c.lineTo(502, 166); c.quadraticCurveTo(492, 170, 480, 166); c.fill();
      for (let x = 0; x < W; x += 9) { c.fillStyle = ['#c89a30', '#4a7ac0', '#b04040'][(x / 9) % 3 | 0]; c.beginPath(); c.moveTo(x, 262); c.lineTo(x + 3.5, 252); c.lineTo(x + 7, 262); c.lineTo(x + 7, 290); c.lineTo(x, 290); c.fill(); }
    } else {   // pool hall with big windows, diving tower and string lights
      const x0 = 330, y0 = 150, w = 280, h = 100;
      c.beginPath(); c.moveTo(x0, y0 + h); c.lineTo(x0, y0 + 20); c.quadraticCurveTo(x0 + w / 2, y0 - 30, x0 + w, y0 + 20); c.lineTo(x0 + w, y0 + h); c.closePath(); c.fill(); c.stroke();
      for (let i = 0; i < 7; i++) { c.fillStyle = 'rgba(120,230,255,0.55)'; c.fillRect(x0 + 14 + i * 38, y0 + 34, 26, 44); c.fillStyle = th.hill[1]; c.fillRect(x0 + 26 + i * 38, y0 + 34, 1.5, 44); }
      c.strokeStyle = '#0a0812'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(90, 250); c.lineTo(90, 150); c.moveTo(120, 250); c.lineTo(120, 150); c.moveTo(84, 150); c.lineTo(150, 150); c.moveTo(84, 190); c.lineTo(140, 190); c.stroke();
      for (let k = 0; k < 9; k++) { c.lineWidth = 1; c.beginPath(); c.moveTo(90, 160 + k * 10); c.lineTo(120, 160 + k * 10); c.stroke(); }
      c.strokeStyle = 'rgba(0,0,0,0.8)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, 110); c.quadraticCurveTo(160, 150, 320, 112); c.quadraticCurveTo(480, 150, 640, 110); c.stroke();
      for (let i = 0; i < 26; i++) {
        const x = i / 25 * 640, seg = x < 320 ? x / 320 : (x - 320) / 320, y = (x < 320 ? 110 : 112) + Math.sin(seg * Math.PI) * 19;
        c.fillStyle = ['#ff6a5a', '#ffd25a', '#6ae0ff', '#a8ff6a'][i % 4]; c.beginPath(); c.arc(x, y + 2, 1.6, 0, 7); c.fill();
      }
      // beach ball and lifebuoy
      c.fillStyle = '#e04040'; c.beginPath(); c.arc(250, 244, 6, 0, 7); c.fill(); c.fillStyle = '#f4f0e0'; c.beginPath(); c.arc(250, 244, 6, -0.6, 0.6); c.lineTo(250, 244); c.fill();
      c.strokeStyle = '#e8e0d0'; c.lineWidth = 3.5; c.beginPath(); c.arc(300, 230, 7, 0, 7); c.stroke(); c.strokeStyle = '#d04040'; c.beginPath(); c.arc(300, 230, 7, 0, 0.8); c.arc(300, 230, 7, 3.14, 3.94); c.stroke();
    }
    c.restore();
  }
  function decorate(c, th, yAt) {
    const fill = th.hill[1];
    if (th.deco === 'xmas') {
      for (let i = 0; i < 9; i++) {   // decorated pines
        const x = 30 + i * 70 + hash(i, 61) * 30, y = yAt(x) + 3, h = 30 + hash(i, 62) * 26;
        c.fillStyle = fill;
        for (let k = 0; k < 3; k++) { const yy = y - k * h * 0.28, ww = h * (0.36 - k * 0.09); c.beginPath(); c.moveTo(x, yy - h * 0.45); c.lineTo(x + ww, yy); c.lineTo(x - ww, yy); c.closePath(); c.fill(); }
        c.fillStyle = 'rgba(240,245,255,0.5)'; for (let k = 0; k < 3; k++) { const yy = y - k * h * 0.28, ww = h * (0.36 - k * 0.09); c.fillRect(x - ww, yy - 1.2, ww * 2, 1.2); }
        for (let k = 0; k < 7; k++) {
          const a = hash(i * 9 + k, 63), yy = y - a * h * 0.8, ww = h * 0.3 * (1 - a * 0.85), xx = x + (hash(i, k + 70) - 0.5) * ww * 1.6;
          c.fillStyle = ['#ff5a4a', '#ffd84a', '#6ad0ff', '#fff4c0'][k % 4]; c.beginPath(); c.arc(xx, yy, 1.1, 0, 7); c.fill();
        }
        c.fillStyle = '#ffe680'; c.beginPath();
        for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 1.3 : 3; c.lineTo(x + Math.cos(a) * r, y - h * 1.0 + Math.sin(a) * r); }
        c.fill();
      }
      for (let i = 0; i < 6; i++) {   // presents
        const x = 50 + hash(i, 64) * (W - 100), y = yAt(x) + 3, w = 7 + hash(i, 65) * 6, h = 6 + hash(i, 66) * 5;
        c.fillStyle = ['#8a2a3a', '#2a5a3a', '#3a3a7a'][i % 3]; c.fillRect(x - w / 2, y - h, w, h);
        c.fillStyle = '#e8c860'; c.fillRect(x - 0.6, y - h, 1.2, h); c.fillRect(x - w / 2, y - h * 0.55, w, 1.2);
        c.beginPath(); c.arc(x - 1.6, y - h - 1, 1.6, 0, 7); c.arc(x + 1.6, y - h - 1, 1.6, 0, 7); c.fill();
      }
    } else if (th.deco === 'snowmen') {
      for (let i = 0; i < 6; i++) {   // birches
        const x = 20 + i * 110 + hash(i, 81) * 50, y = yAt(x) + 3, h = 50 + hash(i, 82) * 30;
        c.strokeStyle = '#c8d0dc'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 2, y - h); c.stroke();
        c.strokeStyle = '#1a1a24'; c.lineWidth = 1; for (let k = 0; k < 6; k++) { const yy = y - hash(i, k) * h; c.beginPath(); c.moveTo(x - 1, yy); c.lineTo(x + 1.5, yy); c.stroke(); }
        c.strokeStyle = '#c8d0dc'; c.lineWidth = 0.8; for (let k = 0; k < 4; k++) { const yy = y - h * (0.55 + k * 0.12); c.beginPath(); c.moveTo(x + 1, yy); c.lineTo(x + (k % 2 ? 10 : -10), yy - 8); c.stroke(); }
      }
      for (let i = 0; i < 4; i++) {   // snowmen
        const x = 70 + i * 150 + hash(i, 83) * 40, y = yAt(x) + 2;
        c.fillStyle = '#d8e2ee'; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 0.8;
        for (const [dy, r] of [[-6, 6.5], [-16, 4.8], [-23.5, 3.5]]) { c.beginPath(); c.arc(x, y + dy, r, 0, 7); c.fill(); c.stroke(); }
        c.fillStyle = '#1a1220'; c.fillRect(x - 4, y - 28.5, 8, 1.4); c.fillRect(x - 2.6, y - 34, 5.2, 5.6);
        c.fillStyle = '#e07a2a'; c.beginPath(); c.moveTo(x, y - 23.5); c.lineTo(x + 5, y - 23); c.lineTo(x, y - 22.5); c.fill();
        c.strokeStyle = '#2a1a14'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x - 4, y - 16); c.lineTo(x - 11, y - 21); c.moveTo(x + 4, y - 16); c.lineTo(x + 11, y - 20); c.stroke();
      }
    } else if (th.deco === 'eggs') {
      for (let i = 0; i < 4; i++) {
        const x = 40 + i * 170 + hash(i, 41) * 60;
        tree(c, x, yAt(x) + 3, 44 + hash(i, 42) * 24, 300 + i);
      }
      for (let i = 0; i < 12; i++) {   // painted eggs
        const x = 20 + hash(i, 91) * (W - 40), y = yAt(x) + 2, col = ['#e88aa8', '#8ad0e8', '#f0d070', '#a8e08a', '#c8a0f0'][i % 5];
        c.fillStyle = col; c.beginPath(); c.ellipse(x, y - 4, 3.2, 4.4, (hash(i, 92) - 0.5) * 0.6, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(x - 3, y - 5, 6, 1); c.fillStyle = 'rgba(80,40,90,0.6)'; c.fillRect(x - 2.6, y - 3, 5.2, 0.8);
      }
      for (let i = 0; i < 3; i++) {   // bunny silhouettes
        const x = 120 + i * 190 + hash(i, 93) * 40, y = yAt(x) + 3;
        c.fillStyle = '#0d0a14';
        c.beginPath(); c.ellipse(x, y - 5, 6, 4.5, 0, 0, 7); c.fill(); c.beginPath(); c.arc(x + 5, y - 9, 3, 0, 7); c.fill();
        c.beginPath(); c.ellipse(x + 4, y - 15, 1.1, 4, -0.2, 0, 7); c.fill(); c.beginPath(); c.ellipse(x + 6.5, y - 15, 1.1, 4, 0.25, 0, 7); c.fill();
        c.fillStyle = '#e8e0f0'; c.beginPath(); c.arc(x - 6, y - 6, 1.6, 0, 7); c.fill();
      }
      for (let i = 0; i < 40; i++) { const x = hash(i, 94) * W, y = yAt(x) + 2 + hash(i, 95) * 4; c.fillStyle = ['#f0c0d8', '#fff0a0', '#c0d8ff'][i % 3]; c.fillRect(x, y, 1.4, 1.4); }
    } else if (th.deco === 'beach') {
      c.strokeStyle = fill;
      for (let i = 0; i < 4; i++) { const x = 30 + i * 180 + hash(i, 96) * 50; palm(c, x, yAt(x) + 4, 60 + hash(i, 97) * 30, 400 + i); }
      for (let i = 0; i < 5; i++) {   // sandcastles and starfish
        const x = 60 + hash(i, 98) * (W - 120), y = yAt(x) + 3;
        c.fillStyle = fill;
        if (i % 2) { c.fillRect(x - 6, y - 7, 12, 7); c.fillRect(x - 7, y - 10, 3, 3); c.fillRect(x - 1.5, y - 12, 3, 5); c.fillRect(x + 4, y - 10, 3, 3); }
        else { c.fillStyle = '#c86a50'; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 1.2 : 3.4; c.lineTo(x + Math.cos(a) * r, y - 3 + Math.sin(a) * r); } c.fill(); }
      }
    }
  }
  function background(ctx, theme, S) {
    const key = theme + S.toFixed(3);
    let bg = bgCache[key];
    if (!bg) {
      for (const k in bgCache) delete bgCache[k];
      const th = THEMES[theme] || THEMES.meadow;
      bg = document.createElement('canvas'); bg.width = Math.ceil(W * S); bg.height = Math.ceil(H * S);
      const c = bg.getContext('2d'); c.scale(S, S);
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, th.sky[0]); gr.addColorStop(0.6, th.sky[1]); gr.addColorStop(1, th.sky[2]);
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      if (th.deco === 'cave') {
        // hanging roots and stalactites, glowing mushrooms far away
        c.fillStyle = th.hill[0]; c.strokeStyle = INK; c.lineWidth = 1;
        for (let x = -10; x < W + 20; x += 18 + hash(x, 4) * 14) {
          const h = 14 + hash(x, 5) * 50;
          c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 6, h * 0.6, x + 9 + (hash(x, 6) - 0.5) * 6, h); c.quadraticCurveTo(x + 13, h * 0.5, x + 20, 0); c.fill(); c.stroke();
        }
        c.strokeStyle = '#2a1a2a'; c.lineWidth = 0.8;
        for (let i = 0; i < 14; i++) { const x = hash(i, 21) * W, l = 20 + hash(i, 22) * 70; c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 8, l * 0.3, x - 8, l * 0.7, x + 3, l); c.stroke(); }
        for (let i = 0; i < 30; i++) {
          const x = hash(i, 1) * W, y = 60 + hash(i, 2) * 260;
          const g = c.createRadialGradient(x, y, 0, x, y, 6); g.addColorStop(0, th.glow + '0.5)'); g.addColorStop(1, th.glow + '0)');
          c.fillStyle = g; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill();
          c.fillStyle = th.glow + '0.9)'; c.beginPath(); c.arc(x, y, 0.6 + hash(i, 3) * 0.6, 0, 7); c.fill();
        }
      } else {
        // stars
        for (let i = 0; i < 120; i++) { c.fillStyle = `rgba(255,250,230,${0.2 + hash(i, 9) * 0.6})`; const s = hash(i, 10) > 0.93 ? 1.2 : 0.6; c.fillRect(hash(i, 7) * W, hash(i, 8) * 200, s, s); }
        // big moon with glow and sketched craters
        const mx = theme === 'dusk' ? 470 : 500, my = theme === 'dusk' ? 120 : 92, mr = theme === 'dusk' ? 56 : 48;
        const g = c.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 3);
        g.addColorStop(0, th.glow + '0.35)'); g.addColorStop(1, th.glow + '0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        boil = 0;
        ell(c, mx, my, mr, mr, th.moon, 1.4, 0.8, 99, { n: 20 });
        c.fillStyle = 'rgba(0,0,0,0.08)';
        for (let i = 0; i < 6; i++) { const a = hash(i, 31) * 6.28, r = hash(i, 32) * mr * 0.7; ell(c, mx + Math.cos(a) * r, my + Math.sin(a) * r, 3 + hash(i, 33) * 7, 3 + hash(i, 33) * 6, 'rgba(60,40,30,0.12)', 0.5, 0.5, 40 + i, { double: false }); }
        // thin swirly clouds across the moon
        c.strokeStyle = 'rgba(20,14,30,0.85)'; c.lineCap = 'round';
        for (let k = 0; k < 3; k++) {
          const y = my - 20 + k * 22, x0 = mx - 120 + k * 30, len = 140 + k * 20;
          c.lineWidth = 3 - k * 0.6;
          c.beginPath(); c.moveTo(x0, y);
          for (let x = 0; x <= len; x += 6) c.lineTo(x0 + x, y + Math.sin(x * 0.05 + k) * 3);
          c.stroke();
          const p = curlPts(x0 + len + 4, y - 4, 6, 1.1, 1, 16);
          c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.stroke();
        }
        // hill layers with ink edges; the far one ends in a curling spiral peak
        const amp = th.hillAmp || 1;
        if (th.deco === 'beach') sea(c, th, mx);
        for (let L = 0; L < 3; L++) {
          const pts = [];
          const base = 210 + L * 34 + (1 - amp) * 40;
          for (let x = -10; x <= W + 10; x += 10) pts.push(x, base - (vnoise(x + L * 777, L, 110) * (90 - L * 20) + vnoise(x, L + 5, 30) * 12) * amp);
          if (L === 1 && (th.deco === 'pool' || th.deco === 'school')) building(c, th, th.deco);
          c.fillStyle = th.hill[L];
          c.beginPath(); c.moveTo(-10, H);
          for (let i = 0; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
          c.lineTo(W + 10, H); c.closePath(); c.fill();
          c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 1.2; c.stroke();
          if (L === 0 && amp >= 1) {
            // curly hill tip
            const hx = 150, hy = base - vnoise(hx + L * 777, L, 110) * 90 - vnoise(hx, L + 5, 30) * 12;
            c.fillStyle = th.hill[0]; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 1.2;
            c.beginPath(); c.moveTo(hx - 30, hy + 20); c.quadraticCurveTo(hx - 6, hy - 10, hx + 4, hy - 42); c.quadraticCurveTo(hx + 26, hy - 66, hx + 30, hy - 48);
            c.quadraticCurveTo(hx + 30, hy - 36, hx + 18, hy - 40); c.quadraticCurveTo(hx + 10, hy - 30, hx + 22, hy - 10); c.lineTo(hx + 34, hy + 20); c.closePath(); c.fill(); c.stroke();
          }
          if (L === 1) {
            c.strokeStyle = th.hill[1];
            c.fillStyle = th.hill[1];
            if (th.trees !== false) for (let i = 0; i < 4; i++) {
              const x = 40 + i * 170 + hash(i, 41) * 60, idx = Math.round((x + 10) / 10) * 2;
              tree(c, x, (pts[idx + 1] || base) + 3, 50 + hash(i, 42) * 30, 100 + i);
            }
            const yAt = x => (pts[Math.round((x + 10) / 10) * 2 + 1] || base);
            decorate(c, th, yAt);
            if (th.deco === 'graves') for (let i = 0; i < 9; i++) {
              const x = 20 + i * 72 + hash(i, 51) * 30, idx = Math.round((x + 10) / 10) * 2, y = (pts[idx + 1] || base) + 4, tilt = (hash(i, 52) - 0.5) * 0.4;
              c.save(); c.translate(x, y); c.rotate(tilt);
              c.beginPath(); c.moveTo(-4, 0); c.lineTo(-4, -8); c.arc(0, -8, 4, Math.PI, 0); c.lineTo(4, 0); c.fill();
              if (hash(i, 53) > 0.5) { c.fillRect(-0.6, -18, 1.2, 8); c.fillRect(-3, -15, 6, 1.2); }
              c.restore();
            }
            if (th.deco === 'pines') for (let i = 0; i < 14; i++) {
              const x = hash(i, 61) * W, idx = Math.round((x + 10) / 10) * 2, y = (pts[idx + 1] || base) + 3, h = 14 + hash(i, 62) * 18;
              c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + h * 0.28, y); c.lineTo(x - h * 0.28, y); c.closePath(); c.fill();
              c.fillStyle = 'rgba(220,230,255,0.35)'; c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + h * 0.1, y - h * 0.6); c.lineTo(x - h * 0.1, y - h * 0.6); c.fill(); c.fillStyle = th.hill[1];
            }
            if (th.deco === 'pumpkins') for (let i = 0; i < 7; i++) {
              const x = 30 + hash(i, 71) * (W - 60), idx = Math.round((x + 10) / 10) * 2, y = (pts[idx + 1] || base) + 2;
              const gl = c.createRadialGradient(x, y - 3, 0, x, y - 3, 12); gl.addColorStop(0, 'rgba(255,140,40,0.45)'); gl.addColorStop(1, 'rgba(255,140,40,0)');
              c.fillStyle = gl; c.fillRect(x - 12, y - 15, 24, 24);
              c.fillStyle = '#c45a14'; c.beginPath(); c.ellipse(x, y - 3, 4.5, 3.4, 0, 0, 7); c.fill();
              c.fillStyle = '#ffd04a'; c.fillRect(x - 2.4, y - 4.4, 1.3, 1.3); c.fillRect(x + 1.1, y - 4.4, 1.3, 1.3); c.fillRect(x - 2, y - 2, 4, 0.9);
              c.fillStyle = th.hill[1];
            }
          }
        }
      }
      bgCache[key] = bg;
    }
    ctx.drawImage(bg, 0, 0, W, H);
  }
  // live layer: twinkles and bats
  function nightLife(ctx, theme, t) {
    const th = THEMES[theme] || THEMES.meadow;
    if (th.snow) {   // falling snow
      ctx.fillStyle = 'rgba(240,246,255,0.75)';
      for (let i = 0; i < 70; i++) {
        const sp = 8 + hash(i, 1) * 14, x = (hash(i, 2) * W + Math.sin(t * 0.8 + i) * 8 + t * 4) % W, y = (hash(i, 3) * H + t * sp) % H, r = 0.5 + hash(i, 4) * 0.8;
        ctx.fillRect(x, y, r, r);
      }
    }
    if (th.flies) for (let i = 0; i < 16; i++) {   // fireflies
      const x = hash(i, 11) * W + Math.sin(t * 0.7 + i * 3) * 20, y = 150 + hash(i, 12) * 120 + Math.cos(t * 0.9 + i) * 10, a = (Math.sin(t * 3 + i * 5) + 1) / 2;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 4); g.addColorStop(0, `rgba(230,255,140,${0.8 * a})`); g.addColorStop(1, 'rgba(230,255,140,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 4, y - 4, 8, 8);
    }
    if (theme !== 'cave') {
      for (let i = 0; i < 12; i++) {
        const a = (Math.sin(t * (1 + hash(i, 3)) + i * 7) + 1) / 2;
        if (a < 0.7) continue;
        ctx.strokeStyle = `rgba(255,250,220,${(a - 0.7) * 2.5})`; ctx.lineWidth = 0.5;
        const x = hash(i, 81) * W, y = hash(i, 82) * 180;
        ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x + 2, y); ctx.moveTo(x, y - 2); ctx.lineTo(x, y + 2); ctx.stroke();
      }
    }
    for (let i = 0; i < 3; i++) {
      const period = 14 + i * 5, p = ((t + i * 6) % period) / period;
      if (p > 0.6) continue;
      const f = p / 0.6, x = -20 + f * (W + 40), y = 40 + i * 30 + Math.sin(f * 12 + i) * 10, flap = Math.sin(t * 18 + i) * 0.8;
      ctx.save(); ctx.translate(i % 2 ? W - x : x, y); ctx.scale(i % 2 ? -1 : 1, 1);
      ctx.fillStyle = '#05030a';
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-3, -3 - flap * 3, -7, -1 - flap * 4); ctx.quadraticCurveTo(-5, 0, -6, 1.5); ctx.quadraticCurveTo(-3, 0.5, 0, 1.5);
      ctx.quadraticCurveTo(3, 0.5, 6, 1.5); ctx.quadraticCurveTo(5, 0, 7, -1 - flap * 4); ctx.quadraticCurveTo(3, -3 - flap * 3, 0, 0);
      ctx.fill(); ctx.beginPath(); ctx.arc(0, 0.5, 1.2, 0, 7); ctx.fill();
      ctx.restore();
    }
  }
  function vignette(ctx) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function water(ctx, game, t, theme) {
    for (const w of game.water) {
      const top = w.y, wave = x => top + Math.sin(x * 0.18 + t * 2) * 1.2 + Math.sin(x * 0.07 - t) * 0.8;
      const th = THEMES[theme] || {}, wc = th.water || (theme === 'snow' ? ['rgba(30,60,90,0.85)', '#9ec0e0'] : ['rgba(22,60,48,0.86)', '#7ac09a']);
      ctx.fillStyle = wc[0];
      ctx.beginPath(); ctx.moveTo(w.x0, H);
      for (let x = w.x0; x <= w.x1; x += 2) ctx.lineTo(x, wave(x));
      ctx.lineTo(w.x1, H); ctx.fill();
      const pts = [];
      for (let x = w.x0; x <= w.x1; x += 4) pts.push(x, wave(x));
      if (pts.length >= 4) line(ctx, pts, 0.9, 0.25, 300 + w.x0, wc[1]);
      // bubbles
      for (let i = 0; i < 4; i++) {
        const p = ((t * 0.5 + i * 0.37) % 1), x = w.x0 + 6 + hash(i, w.x0) * (w.x1 - w.x0 - 12), y = H - p * (H - top);
        ctx.strokeStyle = `rgba(160,230,190,${0.6 * (1 - p)})`; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(x + Math.sin(p * 9) * 2, y, 1 + p, 0, 7); ctx.stroke();
      }
    }
  }

  // ---------- hatch (patched balloon) & haunted house ----------
  function hatch(ctx, h, open, t) {
    const x = h.x, y = h.y - 12, sway = Math.sin(t * 1.2 + x) * 1.2;
    ctx.save();
    line(ctx, [x - 10, y - 12, x - 7 + sway, y - 30], 0.7, 0.3, 11);
    line(ctx, [x + 10, y - 12, x + 7 + sway, y - 30], 0.7, 0.3, 12);
    // balloon: dark plum with stitched patches
    ctx.save(); ctx.translate(sway, 0);
    shape(ctx, [x - 16, y - 44, x - 10, y - 56, x, y - 59, x + 11, y - 55, x + 16, y - 42, x + 10, y - 31, x + 4, y - 28, x - 4, y - 28, x - 11, y - 32], '#3e1e3a', 1.2, 0.6, 21);
    shape(ctx, [x - 9, y - 50, x - 2, y - 52, x - 1, y - 44, x - 8, y - 43], '#5a2a3e', 0.6, 0.4, 22, { double: false });
    for (let i = 0; i < 4; i++) line(ctx, [x - 9 + i * 2.2, y - 53 + i * 0.5, x - 8 + i * 2.2, y - 50 + i * 0.5], 0.4, 0.2, 30 + i, '#d8c8a0');
    shape(ctx, [x + 4, y - 40, x + 11, y - 42, x + 12, y - 35, x + 5, y - 34], '#2a3a4a', 0.6, 0.4, 23, { double: false });
    line(ctx, [x, y - 58, x - 2, y - 44, x - 1, y - 29], 0.5, 0.4, 24);
    ctx.restore();
    // basket
    shape(ctx, [x - 13, y - 13, x + 13, y - 13, x + 11, y, x - 11, y], '#4a2e1a', 1, 0.5, 25);
    for (let k = -1; k <= 1; k++) line(ctx, [x - 11, y - 6 + k * 3.5, x + 11, y - 6 + k * 3.5], 0.4, 0.3, 26 + k, '#2a170c');
    // trapdoors
    ctx.fillStyle = '#2a170c';
    const a = open * 1.35;
    for (const s of [-1, 1]) { ctx.save(); ctx.translate(x + s * 10, y); ctx.rotate(s * a); ctx.fillRect(s > 0 ? -10 : 0, -0.5, 10, 2); ctx.restore(); }
    ctx.restore();
  }
  function house(ctx, e, t, glow) {
    const x = e.x, y = e.y + 1;
    // window light glow
    const gl = ctx.createRadialGradient(x, y - 10, 0, x, y - 10, 34);
    gl.addColorStop(0, `rgba(255,170,60,${0.25 + glow * 0.25})`); gl.addColorStop(1, 'rgba(255,170,60,0)');
    ctx.fillStyle = gl; ctx.fillRect(x - 34, y - 44, 68, 50);
    // leaning walls and crooked roof
    shape(ctx, [x - 13, y, x - 12, y - 19, x + 11, y - 21, x + 13, y], '#3a3046', 1.1, 0.5, 41);
    shape(ctx, [x - 17, y - 17, x - 2, y - 33, x + 6, y - 38, x + 4, y - 32, x + 17, y - 20], '#1e1626', 1.1, 0.5, 42);
    line(ctx, curlPts(x + 7, y - 40, 2.5, 1.1, -1, 10), 0.8, 0.2, 43);
    // chimney + curly smoke
    shape(ctx, [x + 8, y - 26, x + 9, y - 33, x + 13, y - 32, x + 12, y - 23], '#2a2030', 0.8, 0.3, 44);
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.35 + i / 3) % 1;
      ctx.globalAlpha = 0.6 * (1 - p);
      line(ctx, curlPts(x + 11 + p * 8, y - 36 - p * 18, 2 + p * 3, 1, i % 2 ? 1 : -1, 12), 0.6, 0.15, 45 + i, '#8a8098');
    }
    ctx.globalAlpha = 1;
    // glowing door + windows
    const fl = 0.75 + Math.sin(t * 7) * 0.08 + Math.sin(t * 13) * 0.05 + glow * 0.2;
    shape(ctx, [x - 5, y, x - 5, y - 9, x - 3, y - 13, x, y - 14, x + 3, y - 13, x + 5, y - 9, x + 5, y], `rgba(255,${150 + glow * 60},50,${fl})`, 0.9, 0.3, 46);
    shape(ctx, [x - 11, y - 15, x - 6, y - 15.5, x - 6, y - 11, x - 11, y - 10.5], `rgba(255,200,80,${fl})`, 0.7, 0.25, 47);
    shape(ctx, [x + 6, y - 16, x + 10, y - 16.5, x + 10, y - 12, x + 6, y - 11.5], `rgba(255,200,80,${fl})`, 0.7, 0.25, 48);
    line(ctx, [x - 8.5, y - 15, x - 8.5, y - 11], 0.4, 0.1, 49); line(ctx, [x + 8, y - 16, x + 8, y - 12], 0.4, 0.1, 50);
    // pumpkin by the door
    ell(ctx, x + 9, y - 2.4, 3, 2.4, '#c45a14', 0.6, 0.2, 51, { n: 10 });
    ctx.fillStyle = `rgba(255,220,80,${fl})`; ctx.fillRect(x + 7.8, y - 3.4, 0.9, 0.9); ctx.fillRect(x + 9.6, y - 3.4, 0.9, 0.9); ctx.fillRect(x + 8, y - 1.8, 2.2, 0.6);
  }

  // ---------- creature: pale little ghost-sprite with hollow eyes and a crooked hat ----------
  const BODY = '#e3d8bc', BODY_D = '#a99c80', HAT = '#5e2f7a', BAND = '#e08a32', LIMB = '#cbbd9c';
  function creature(ctx, c, tick, hl) {
    const x = c.x, y = c.y, d = c.dir, a = c.anim, sd = c.id * 97;
    const A = 0.16, LW = 0.5;
    ctx.save();
    ctx.translate(x + 0.5, y + 1);
    if (hl) {
      const g = ctx.createRadialGradient(0, -6, 1, 0, -6, 10);
      g.addColorStop(0, hl + 'aa'); g.addColorStop(1, hl + '00');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -6, 10, 0, 7); ctx.fill();
      ell(ctx, 0, -5.5, 6.2, 7.6, null, 0.7, 0.35, sd + 1, { ink: hl, double: false });
    }
    if (c.st === 'splat') {
      const k = Math.min(1, c.t / 6);
      ell(ctx, 0, -1, 3 + 2.5 * k, 2.4 - 1.3 * k, BODY, LW, A, sd + 2);
      ctx.fillStyle = '#ffe9a0';
      for (let i = 0; i < 3; i++) { const an = c.t * 0.3 + i * 2.1; ctx.fillRect(Math.cos(an) * 4 - 0.4, -6 + Math.sin(an) * 1.5, 0.9, 0.9); }
      ctx.restore(); return;
    }
    if (c.st === 'drown') {
      ctx.translate(0, Math.min(8, c.t * 0.5));
      ctx.strokeStyle = 'rgba(160,230,190,0.9)'; ctx.lineWidth = 0.4;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(Math.sin(c.t + i * 2) * 2, -8 - ((c.t * 0.6 + i * 3) % 9), 0.9, 0, 7); ctx.stroke(); }
    }
    if (c.st === 'exit') { const k = 1 - c.t / 18; ctx.globalAlpha = Math.max(0, k); ctx.scale(k, k); }
    const st = c.st, walking = st === 'walk';
    // floater: tattered bat-wing umbrella
    if (st === 'float') {
      const sw = Math.sin(a * 0.25) * 0.15;
      ctx.save(); ctx.rotate(sw);
      line(ctx, [0, -8, 0, -15], 0.4, 0.1, sd + 3, LIMB);
      shape(ctx, [-8, -14.5, -6, -17.5, -3, -19, 0, -19.5, 3, -19, 6, -17.5, 8, -14.5, 6, -15.5, 4, -14.2, 2, -15.5, 0, -14.3, -2, -15.5, -4, -14.2, -6, -15.5],
        '#4e2a62', LW, A, sd + 4, { seg: 2 });
      line(ctx, curlPts(0, -6.8, 0.9, 0.6, d, 6), 0.4, 0.05, sd + 5);
      ctx.restore();
    }
    if (st === 'balloon') {
      const sw = Math.sin(a * 0.15) * 1.2;
      line(ctx, [d * 1.5, -7, d * 1.5 + sw * 0.5, -14, d * 1 + sw, -20], 0.35, 0.05, sd + 60, '#d8d0c0');
      ell(ctx, d * 1 + sw, -25, 4.5, 5.4, '#c8402e', LW, A, sd + 61, { n: 12 });
      ell(ctx, d * 1 + sw - 1.5, -27, 1, 1.6, 'rgba(255,220,200,0.6)', 0, 0, sd + 62, { n: 6 });
    }
    if (st === 'glide' || (c.glider && st !== 'glide' && st !== 'splat')) {
      const big = st === 'glide';
      ctx.save(); if (!big) { ctx.translate(-d * 3.5, -6); ctx.scale(0.35, 0.35); ctx.translate(0, 12); }
      shape(ctx, [-11, -13, -6, -17, 0, -18.5, 6, -17, 11, -13, 6, -14.5, 0, -14, -6, -14.5], '#3e6a3a', LW, A, sd + 63, { seg: 2 });
      line(ctx, [-9, -14, 9, -14.5], 0.35, 0.05, sd + 64, '#1e3a1e');
      ctx.restore();
    }
    if (st === 'jet') {
      shape(ctx, [-d * 2.5, -9, -d * 5.5, -9, -d * 5.5, -3, -d * 2.5, -3], '#6a6a7a', LW, A, sd + 65, { seg: 1.5 });
      const fl = 2.5 + Math.sin(a * 1.7) * 1.2;
      shape(ctx, [-d * 3, -3, -d * 5, -3, -d * 4, -3 + fl * 1.4], '#ffb040', 0, 0.1, sd + 66, { double: false, seg: 1 });
      ell(ctx, -d * 4, -2 + fl * 0.3, 0.8, fl * 0.4, '#fff0a0', 0, 0.05, sd + 67, { n: 6 });
    }
    if (st === 'swim') {
      ctx.translate(0, 2);
      ctx.strokeStyle = 'rgba(200,240,255,0.8)'; ctx.lineWidth = 0.4;
      ctx.beginPath(); ctx.moveTo(-6, -1.5); ctx.quadraticCurveTo(-3, -2.5 + Math.sin(a * 0.4), 0, -1.5); ctx.quadraticCurveTo(3, -0.5, 6, -1.5); ctx.stroke();
    }
    if (st === 'climb') ctx.rotate(-d * 0.25);
    if (st === 'plant' || st === 'aim') ctx.translate(0, 0.6);
    const danceB = c.dance ? Math.abs(Math.sin(a * 0.35)) * -1.5 : 0;
    ctx.translate(0, danceB);
    const bob = walking ? (a % 8 < 4 ? -0.5 : 0) : 0;
    // stick legs with pointy boots
    const fa = walking ? Math.sin(a * 0.8) * 1.6 : (st === 'climb' ? Math.sin(a * 0.5) * 1 : 0);
    for (const s of [-1, 1]) {
      const fx = s * 1.2 + s * fa * d * 0.5;
      line(ctx, [s * 1, -2.2 + bob, fx, -0.6], 0.5, 0.08, sd + 6 + s, LIMB);
      shape(ctx, [fx - 0.9, -1.1, fx + d * 1.6, -0.9, fx + d * 2.1, -1.7, fx + d * 1.4, -0.1, fx - 0.9, -0.1], c.climber ? '#b0642a' : '#4a3a5a', 0.3, 0.06, sd + 8 + s, { double: false, seg: 1 });
    }
    ctx.translate(0, bob);
    const squash = st === 'dig' ? (a % 6 < 3 ? 0.3 : 0) : 0;
    ctx.translate(0, squash);
    // body
    ell(ctx, 0, -5, 3.3, 3.9 - squash, BODY, LW, A, sd + 10, { n: 10 });
    ctx.globalAlpha *= 0.5;
    ell(ctx, -d * 1.6, -4.2, 1.3, 2.4, BODY_D, 0, A, sd + 11, { n: 8 });
    ctx.globalAlpha = st === 'exit' ? Math.max(0, 1 - c.t / 18) : 1;
    if (c.slider) line(ctx, [-2.6, -2.6, 2.6, -2.6], 0.7, 0.05, sd + 68, '#e0e0f0');   // slider's scarf
    if (c.floater && st !== 'float') shape(ctx, [-d * 3.2, -8, -d * 4.2, -3, -d * 3.4, -2.8], '#4e2a62', 0.35, 0.08, sd + 12, { double: false, seg: 1 });
    // hollow eyes
    const ey = -5.6, wide = st === 'fall' || st === 'drown' ? 1.25 : 1;
    const blink = (a + c.id * 37) % 90 < 3;
    if (blink) { line(ctx, [d * 0.1, ey, d * 1.4, ey], 0.4, 0.05, sd + 13); line(ctx, [d * 2.0, ey, d * 3.0, ey], 0.4, 0.05, sd + 14); }
    else {
      ell(ctx, d * 0.8, ey, 0.85 * wide, 1.25 * wide, '#120a14', 0, 0.08, sd + 15, { n: 8 });
      ell(ctx, d * 2.4, ey, 0.7 * wide, 1.1 * wide, '#120a14', 0, 0.08, sd + 16, { n: 8 });
      ctx.fillStyle = '#fff6d8'; ctx.fillRect(d * 0.8 + 0.1, ey - 0.6, 0.35, 0.35); ctx.fillRect(d * 2.4 + 0.1, ey - 0.5, 0.3, 0.3);
    }
    if (c.swimmer) { line(ctx, [-d * 3, ey, d * 3.4, ey], 0.35, 0.05, sd + 69, '#3a8ad0'); ell(ctx, d * 0.8, ey, 1.2, 1.5, null, 0.35, 0.04, sd + 70, { ink: '#3a8ad0', n: 7, double: false }); ell(ctx, d * 2.5, ey, 1.05, 1.35, null, 0.35, 0.04, sd + 71, { ink: '#3a8ad0', n: 7, double: false }); }
    if (st === 'block') { line(ctx, [d * -0.2, ey - 2, d * 1.4, ey - 1.3], 0.4, 0.05, sd + 17); line(ctx, [d * 3.1, ey - 2, d * 1.9, ey - 1.3], 0.4, 0.05, sd + 18); }
    // stitched grin
    const mx = d * 1.5, my = -3.2;
    line(ctx, [mx - 1.1, my, mx + 1.1, my + 0.15], 0.3, 0.05, sd + 19);
    for (let i = 0; i < 3; i++) line(ctx, [mx - 0.8 + i * 0.8, my - 0.35, mx - 0.8 + i * 0.8, my + 0.45], 0.22, 0.03, sd + 20 + i);
    // crooked witch hat with band and curled tip
    const tip = walking ? Math.sin(a * 0.4) * 0.4 : 0;
    shape(ctx, [-3.6, -7.7, 3.6, -7.7, 2.2, -8.6, 0.8, -11.5, -d * 0.4, -13.2 + tip, -d * 1.8, -13.6 + tip, -1.6, -9], HAT, LW, A, sd + 24, { seg: 1.5 });
    line(ctx, [-2.4, -8.6, 2.2, -8.6], 0.6, 0.06, sd + 25, BAND);
    line(ctx, curlPts(-d * 2.4, -13.2 + tip, 0.7, 0.7, -d, 6), 0.35, 0.04, sd + 26);
    // arms / tools
    const arm = (x1, y1, x2, y2, k = 0) => line(ctx, [x1, y1, (x1 + x2) / 2, (y1 + y2) / 2 + 0.3, x2, y2], 0.5, 0.08, sd + 30 + k, LIMB);
    if (st === 'block') { arm(-3, -4.5, -6.2, -5.8, 1); arm(3, -4.5, 6.2, -5.8, 2); }
    else if (st === 'fall') { arm(-3, -5, -4.5, -8.5 + Math.sin(a) * 0.6, 1); arm(3, -5, 4.5, -8.5 - Math.sin(a) * 0.6, 2); }
    else if (st === 'float') { arm(-2.5, -6, -0.6, -8.5, 1); arm(2.5, -6, 0.6, -8.5, 2); }
    else if (st === 'climb') { const k = Math.sin(a * 0.5); arm(d * 2.5, -5, d * 4, -8 + k, 1); arm(d * 2.5, -4, d * 4, -5 - k, 2); }
    else if (st === 'shrug') { arm(-3, -4.5, -4.8, -7, 1); arm(3, -4.5, 4.8, -7, 2); }
    else if (st === 'build') {
      const k = (c.t % 10) / 10;
      arm(d * 2.5, -4, d * (3.5 + k * 2), -2 - k, 1);
      shape(ctx, [d * (2 + k * 2), -3.4 - k, d * (5 + k * 2), -3.4 - k, d * (5 + k * 2), -2.2 - k, d * (2 + k * 2), -2.2 - k], '#7a4e2a', 0.3, 0.05, sd + 40, { double: false, seg: 1 });
    } else if (st === 'bash') {
      const k = (a % 6) / 6;
      arm(d * 2.5, -5, d * (3.5 + k * 2.5), -5, 1);
      ell(ctx, d * (4 + k * 2.5), -5, 1, 1, BODY, 0.35, 0.05, sd + 41, { n: 6, double: false });
      ctx.fillStyle = 'rgba(120,90,80,0.8)'; for (let i = 0; i < 3; i++) ctx.fillRect(d * (6 + hash(a, i) * 3), -8 + hash(i, a) * 7, 0.8, 0.8);
    } else if (st === 'dig') {
      const k = a % 6 < 3 ? 1 : 0;
      line(ctx, [d * 2.5, -6.5 - k, d * 1.5, 0.3 - k], 0.5, 0.05, sd + 42, '#4a2e1a');
      shape(ctx, [d * 1.5 - 1.2, 0 - k, d * 1.5 + 1.2, 0 - k, d * 1.5, 1.8 - k], '#8a8a98', 0.3, 0.05, sd + 43, { double: false, seg: 1 });
      ctx.fillStyle = 'rgba(120,90,80,0.8)'; for (let i = 0; i < 3; i++) ctx.fillRect((hash(a, i) - 0.5) * 9, -2 - hash(i, a) * 4, 0.8, 0.8);
    } else if (st === 'mine') {
      const k = (c.t % 4) / 4, an = -1.4 + k * 2.2;
      ctx.save(); ctx.translate(d * 1.5, -6); ctx.scale(d, 1); ctx.rotate(an);
      line(ctx, [0, 0, 5, 0], 0.5, 0.05, sd + 44, '#4a2e1a');
      ctx.strokeStyle = '#8a8a98'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(5, 0, 2.2, -1.2, 1.2); ctx.stroke();
      ctx.restore();
    } else if (st === 'jump') {
      arm(-3, -5, -4.8, -9, 1); arm(3, -5, 4.8, -9, 2);
      if (c.vx0 > 2.2) line(ctx, [-d * 6, 2, d * 1, -6, d * 6, -13], 0.6, 0.05, sd + 45, '#b08a50');   // vaulting pole
    } else if (st === 'glide') { arm(-2.5, -6, -7, -13, 1); arm(2.5, -6, 7, -13, 2); }
    else if (st === 'balloon') { arm(d * 2, -6, d * 1.5, -9, 1); arm(-d * 2.5, -4.5, -d * 4, -3, 2); }
    else if (st === 'jet') { arm(-2.5, -5, -d * 4.5, -6, 1); arm(2.5, -5, d * 4.5, -4, 2); line(ctx, [-d * 5, -6, -d * 9, -6], 0.3, 0.1, sd + 46, 'rgba(255,255,255,0.5)'); }
    else if (st === 'swim') { const k = Math.sin(a * 0.3) * 2; arm(d * 2.5, -4, d * 5, -2 + k, 1); arm(-d * 2.5, -4, -d * 4, -2 - k, 2); }
    else if (st === 'hang') { const k = c.t % 4 < 2 ? 1 : 0; arm(-2, -7, -2 + k, -12, 1); arm(2, -7, 2 - k, -12, 2); }
    else if (st === 'stack' || st === 'plat') {
      const k = (c.t % 10) / 10;
      arm(d * 2.5, -4, d * (3.5 + k * 2), -2 - k, 1);
      shape(ctx, [d * (2 + k * 2), -3.4 - k, d * (5 + k * 2), -3.4 - k, d * (5 + k * 2), -2.2 - k, d * (2 + k * 2), -2.2 - k], st === 'stack' ? '#8a8aa0' : '#7a4e2a', 0.3, 0.05, sd + 40, { double: false, seg: 1 });
    } else if (st === 'pour') {
      arm(d * 2.5, -4.5, d * 4, -6, 1); arm(d * 2.5, -3.5, d * 4.5, -4, 2);
      ctx.save(); ctx.translate(d * 5, -6); ctx.rotate(d * 0.9);
      shape(ctx, [-2, -2, 2, -2, 1.5, 2, -1.5, 2], '#6a7a9a', 0.35, 0.05, sd + 47, { double: false, seg: 1 }); ctx.restore();
    } else if (st === 'aim') {
      const w = c.weapon;
      if (w === 'bazooka') { line(ctx, [-d * 3, -7.5, d * 6, -6.5], 1.6, 0.05, sd + 48, '#4a5a3a'); arm(d * 2, -4.5, d * 3, -6, 1); }
      else if (w === 'mortar') { line(ctx, [d * 3, 0, d * 6, -6], 2, 0.05, sd + 48, '#3a3a44'); arm(d * 2.5, -4, d * 5, -5, 1); }
      else { const k = Math.min(1, c.t / 9); line(ctx, [-d * (3 - k * 6), -8 + k, d * (5 + k * 4), -7.5 + k], 0.45, 0.05, sd + 48, '#9a7a4a'); arm(d * 2, -5, -d * 2 + k * d * 6, -8, 1); }
    } else if (st === 'laser') {
      arm(d * 2.5, -4.5, d * 4.5, -6.5, 1);
      shape(ctx, [d * 3.5, -7.5, d * 6.5, -8.5, d * 6.5, -6.5, d * 3.5, -6], '#7a8aa0', 0.3, 0.05, sd + 49, { double: false, seg: 1 });
      if (c.beam) { ctx.strokeStyle = `rgba(255,80,120,${0.6 + Math.sin(a * 2) * 0.3})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(d * 6.5, -8); ctx.lineTo(d * (3 + c.beam * 0.707), -3 - c.beam * 0.707); ctx.stroke(); }
    } else if (st === 'fence') {
      const k = (a % 6) / 6;
      arm(d * 2.5, -5, d * (3.5 + k * 2), -6, 1);
      line(ctx, [d * (3.5 + k * 2), -6, d * (10 + k * 2), -8.5], 0.6, 0.05, sd + 50, '#d0d8e8');
    } else if (st === 'play') {
      const k = Math.sin(a * 0.5);
      shape(ctx, [d * 2, -6.5, d * (5 + k), -6.5, d * (5 + k), -2.5, d * 2, -2.5], '#a03a4a', 0.35, 0.05, sd + 51, { double: false, seg: 1 });
      arm(d * 2.5, -4.5, d * 2.5, -3.5, 1); arm(-d * 2.5, -4.5, d * (5 + k), -4.5, 2);
      ctx.fillStyle = '#ffe9a0'; ctx.font = '5px serif'; ctx.textAlign = 'center';
      for (let i = 0; i < 2; i++) { const p = ((a * 0.04 + i * 0.5) % 1); ctx.globalAlpha = 1 - p; ctx.fillText(i ? '♫' : '♪', d * 3 + Math.sin(p * 6 + i) * 3, -12 - p * 10); }
      ctx.globalAlpha = 1;
    } else if (st === 'plant') {
      arm(d * 2.5, -4, d * 4, -1, 1);
      ell(ctx, d * 4.5, -1.5, 2, 1.7, '#d0601a', 0.35, 0.05, sd + 52, { n: 8, double: false });
    } else if (c.dance) { const k = Math.sin(a * 0.35) * 1.5; arm(-3, -5, -5, -9 + k, 1); arm(3, -5, 5, -9 - k, 2); }
    else if (st === 'fall' && c.sliding) { arm(-2.5, -5, -5, -8, 1); arm(2.5, -5, 5, -8, 2); }
    else if (walking) {
      const k = Math.sin(a * 0.8) * 0.8; arm(-2.8, -4.4, -3.6, -2.5 + k, 1); arm(2.8, -4.4, 3.6, -2.5 - k, 2);
      if (c.runner) { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.4; ctx.beginPath(); for (let i = 0; i < 3; i++) { ctx.moveTo(-d * (5 + i), -3 - i * 2); ctx.lineTo(-d * (8 + i * 2), -3 - i * 2); } ctx.stroke(); }
    }
    ctx.restore();
  }

  // ---------- flying things: rockets, shells, spears, bombs, sand, explosions (world coords) ----------
  const booms = [];
  function boom(x, y, r, t) { booms.push({ x, y, r, t0: t }); }
  function props(ctx, game, t) {
    for (const b of game.bombs) {
      const fl = Math.sin(t * 20) > 0;
      ell(ctx, b.x, b.y - 3, 3.6, 3, '#d0601a', 0.6, 0.15, 77, { n: 10 });
      ctx.fillStyle = '#ffd04a'; ctx.fillRect(b.x - 1.8, b.y - 4.2, 1, 1); ctx.fillRect(b.x + 0.8, b.y - 4.2, 1, 1);
      line(ctx, [b.x, b.y - 6, b.x + 1.5, b.y - 9], 0.5, 0.05, 78, '#4a3a2a');
      if (fl) { ctx.fillStyle = '#fff4a0'; ctx.beginPath(); ctx.arc(b.x + 1.5, b.y - 9.5, 1.3, 0, 7); ctx.fill(); }
      ctx.font = '7px "Mystery Quest", serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe9a0'; ctx.lineWidth = 2; ctx.strokeStyle = '#000';
      const n = String(Math.ceil(b.t / Sim.HZ)); ctx.strokeText(n, b.x, b.y - 15); ctx.fillText(n, b.x, b.y - 15);
    }
    for (const s of game.shots) {
      const d = Math.sign(s.vx) || 1;
      if (s.kind === 'rocket') {
        shape(ctx, [s.x - d * 5, s.y - 1.3, s.x + d * 2, s.y - 1.3, s.x + d * 4, s.y, s.x + d * 2, s.y + 1.3, s.x - d * 5, s.y + 1.3], '#8a9a7a', 0.4, 0.1, 79, { double: false, seg: 2 });
        ell(ctx, s.x - d * 7, s.y, 2.5 + Math.sin(t * 40), 1.2, '#ffb040', 0, 0.1, 80, { n: 6 });
      } else if (s.kind === 'shell') ell(ctx, s.x, s.y, 2.2, 2.2, '#2a2a34', 0.5, 0.1, 81, { n: 8 });
      else { const a = Math.atan2(s.vy, s.vx); line(ctx, [s.x - Math.cos(a) * 9, s.y - Math.sin(a) * 9, s.x, s.y], 0.6, 0.05, 82, '#9a7a4a'); }
    }
    if (game.grains.length) { ctx.fillStyle = '#d8b878'; for (const g of game.grains) ctx.fillRect(g.x, g.y, 2, 2); }
    for (let i = booms.length - 1; i >= 0; i--) {
      const b = booms[i], k = (t - b.t0) / 0.45;
      if (k > 1 || k < 0) { booms.splice(i, 1); continue; }
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * (0.8 + k));
      g.addColorStop(0, `rgba(255,240,180,${0.9 * (1 - k)})`); g.addColorStop(0.5, `rgba(255,140,40,${0.7 * (1 - k)})`); g.addColorStop(1, 'rgba(255,80,20,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * (0.8 + k), 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(30,20,30,${0.6 * (1 - k)})`; ctx.lineWidth = 1;
      for (let j = 0; j < 6; j++) { const an = j * 1.05 + b.x; ctx.beginPath(); ctx.arc(b.x + Math.cos(an) * b.r * (0.6 + k), b.y + Math.sin(an) * b.r * (0.6 + k) - k * 6, 2 + k * 2, 0, 7); ctx.stroke(); }
    }
  }

  // ---------- skill icons (screen px) ----------
  function skillIcon(ctx, skill, cx, cy, s) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s / 20, s / 20);
    const L = 1.5, A = 0.35, sd = skill.length * 31;
    const body = (x, y, r = 4) => ell(ctx, x, y, r, r * 1.1, BODY, L, A, sd + x * 3 + y, { n: 9 });
    const hat = (x, y) => shape(ctx, [x - 3.5, y, x + 3.5, y, x + 1, y - 3, x - 1.5, y - 6.5], HAT, 1, 0.3, sd + 9, { seg: 2, double: false });
    switch (skill) {
      case 'climber':
        shape(ctx, [4, -10, 10, -10, 10, 10, 4, 10], '#4a2e2a', L, A, sd);
        body(-1, 1); hat(-1, -3.5); line(ctx, [2, -1, 5, -6], L, 0.2, sd + 1); line(ctx, [2, 3, 5, 0], L, 0.2, sd + 2);
        break;
      case 'floater':
        shape(ctx, [-10, -3, -7, -8, 0, -10, 7, -8, 10, -3, 7, -4.5, 4, -3, 2, -4.5, 0, -3, -2, -4.5, -4, -3, -7, -4.5], '#2a1a34', L, A, sd, { seg: 3 });
        line(ctx, [0, -3, 0, 2], L, 0.2, sd + 1); body(0, 6, 3.5);
        break;
      case 'blocker':
        body(0, 3); hat(0, -1); line(ctx, [-4, 1, -10, -1], L, 0.3, sd + 1); line(ctx, [4, 1, 10, -1], L, 0.3, sd + 2);
        ell(ctx, 0, -8, 3, 3, null, 2, 0.3, sd + 3, { ink: '#e04040', double: false });
        break;
      case 'builder':
        for (let i = 0; i < 4; i++) shape(ctx, [-10 + i * 4, 6 - i * 4, -2 + i * 4, 6 - i * 4, -2 + i * 4, 9 - i * 4, -10 + i * 4, 9 - i * 4], '#8a5a30', 1.2, 0.3, sd + i, { double: false });
        break;
      case 'basher':
        shape(ctx, [2, -10, 10, -10, 10, 10, 2, 10], '#4a2e2a', L, A, sd);
        body(-4, 1); hat(-4, -3); ell(ctx, 2, 0, 2.5, 2.5, BODY, 1.2, 0.3, sd + 2, { n: 7 });
        line(ctx, [5, -5, 8, -7], L, 0.2, sd + 3); line(ctx, [5, 5, 8, 7], L, 0.2, sd + 4);
        break;
      case 'digger':
        shape(ctx, [-10, 4, 10, 4, 10, 10, -10, 10], '#4a2e2a', L, A, sd);
        line(ctx, [0, -10, 0, 3], 2, 0.3, sd + 1, '#6a4a2a');
        shape(ctx, [-3.5, 2, 3.5, 2, 0, 8], '#9a9aa8', 1.2, 0.3, sd + 2, { double: false });
        line(ctx, [-3, -10, 3, -10], 1.6, 0.2, sd + 3);
        break;
      case 'miner':
        shape(ctx, [-10, 10, 10, 10, 10, -2], '#4a2e2a', L, A, sd);
        line(ctx, [-7, 7, 3, -5], 2.2, 0.3, sd + 1, '#6a4a2a');
        ctx.strokeStyle = '#9a9aa8'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(3, -5, 5, -2.6, 0.9); ctx.stroke();
        break;
      case 'runner':
        body(3, 0); hat(3, -4);
        for (let i = 0; i < 3; i++) line(ctx, [-10, -4 + i * 4, -3, -4 + i * 4], 1.3, 0.2, sd + i, '#e0e0f0');
        shape(ctx, [0, 6, 6, 6, 8, 8, 0, 9], '#d04030', 1, 0.2, sd + 5, { double: false });
        break;
      case 'jumper': case 'hopper': case 'vaulter': {
        if (skill === 'vaulter') line(ctx, [-9, 10, 9, -10], 1.8, 0.2, sd + 7, '#c09a5a');
        const pts = skill === 'hopper' ? [-10, 9, -6, 0, -2, 9, 2, 0, 6, 9] : [-10, 9, -6, -8, 4, -8, 10, 9];
        line(ctx, pts, 1.2, 0.2, sd + 1, '#e0e0f0');
        body(skill === 'hopper' ? 2 : 0, -4, 3.2);
        if (skill === 'jumper') shape(ctx, [-3, 4, 3, 4, 3, 10, -3, 10], '#4a2e2a', 1, 0.2, sd + 3, { double: false });
        break; }
      case 'slider':
        shape(ctx, [-10, -10, -3, -10, -3, 10, -10, 10], '#4a2e2a', L, A, sd);
        body(2, 0); line(ctx, [-1, -2, 1.5, 0.5], 1.6, 0.1, sd + 2, '#e0e0f0');
        line(ctx, [5, -8, 5, -2], 1.2, 0.2, sd + 3, '#e0e0f0'); line(ctx, [8, -6, 8, 0], 1.2, 0.2, sd + 4, '#e0e0f0');
        break;
      case 'glider':
        shape(ctx, [-11, -2, -6, -8, 0, -10, 6, -8, 11, -2, 0, -5], '#3e6a3a', L, A, sd, { seg: 3 });
        line(ctx, [-9, -3, 9, -3.5], 1, 0.1, sd + 1, '#1e3a1e'); body(0, 6, 3.4);
        break;
      case 'balloon':
        ell(ctx, 0, -4, 6, 7, '#c8402e', L, A, sd, { n: 12 }); line(ctx, [0, 3, 1, 8], 1, 0.2, sd + 1, '#e0d8c8');
        ell(ctx, -2, -7, 1.4, 2.2, 'rgba(255,220,200,0.6)', 0, 0, sd + 2, { n: 6 });
        break;
      case 'jetpack':
        shape(ctx, [-5, -8, 3, -8, 3, 4, -5, 4], '#6a6a7a', L, A, sd);
        shape(ctx, [-4, 4, 2, 4, -1, 11], '#ffb040', 1, 0.3, sd + 1, { double: false });
        line(ctx, [5, -6, 10, -6], 1.2, 0.2, sd + 2, '#e0e0f0'); line(ctx, [5, -1, 9, -1], 1.2, 0.2, sd + 3, '#e0e0f0');
        break;
      case 'swimmer':
        ctx.fillStyle = '#2a6aa0'; ctx.fillRect(-11, 2, 22, 9);
        line(ctx, [-11, 2, -6, 0, -1, 2, 4, 0, 9, 2, 11, 1], 1.4, 0.2, sd + 1, '#bfe8ff');
        body(0, -2, 3.6); ell(ctx, 1.5, -3, 3.6, 1.6, null, 1.2, 0.1, sd + 3, { ink: '#3a8ad0', double: false });
        break;
      case 'bomber':
        ell(ctx, 0, 2, 7, 6, '#d0601a', L, A, sd, { n: 12 });
        line(ctx, [0, -4, 3, -9], 1.2, 0.2, sd + 1, '#4a3a2a'); ell(ctx, 3.5, -9.5, 2, 2, '#fff4a0', 0, 0, sd + 2, { n: 6 });
        ctx.fillStyle = '#ffd04a'; ctx.fillRect(-3.5, 0, 2, 2); ctx.fillRect(1.5, 0, 2, 2); ctx.fillRect(-3, 4, 6, 1.4);
        break;
      case 'bazooka':
        line(ctx, [-10, 2, 6, -2], 4, 0.2, sd, '#4a5a3a'); line(ctx, [-10, 2, 6, -2], 1, 0.1, sd + 1);
        ell(ctx, 9, -3, 3, 2.5, '#ffb040', 0.8, 0.2, sd + 2, { n: 7 });
        break;
      case 'mortar':
        line(ctx, [-4, 8, 2, -2], 4.5, 0.2, sd, '#3a3a44');
        ctx.strokeStyle = '#e0e0f0'; ctx.setLineDash([2, 2]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(3, -4); ctx.quadraticCurveTo(7, -14, 10, 4); ctx.stroke(); ctx.setLineDash([]);
        ell(ctx, 10, 6, 2.2, 2.2, '#2a2a34', 0.8, 0.1, sd + 2, { n: 7 });
        break;
      case 'laser':
        shape(ctx, [2, -10, 10, -10, 10, 10, 2, 10], '#4a2e2a', L, A, sd);
        shape(ctx, [-10, 6, -3, 3, -3, 7, -9, 9], '#7a8aa0', 1, 0.2, sd + 1, { double: false });
        ctx.strokeStyle = '#ff5078'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3, 4); ctx.lineTo(8, -8); ctx.stroke();
        break;
      case 'fencer':
        shape(ctx, [-10, 10, 10, 10, 10, -6, 0, 0], '#4a2e2a', L, A, sd);
        line(ctx, [-9, 4, 8, -8], 1.6, 0.1, sd + 1, '#d0d8e8'); line(ctx, [-6, 0, -3, 6], 1.6, 0.1, sd + 2, '#c09a3a');
        break;
      case 'spearer':
        shape(ctx, [6, -10, 11, -10, 11, 10, 6, 10], '#4a2e2a', L, A, sd);
        line(ctx, [-10, 1, 6, 1], 1.6, 0.1, sd + 1, '#9a7a4a'); shape(ctx, [6, -1.5, 9, 1, 6, 3.5], '#c0c8d8', 0.8, 0.1, sd + 2, { double: false });
        break;
      case 'stacker':
        for (let i = 0; i < 4; i++) shape(ctx, [-3, 8 - i * 5, 5, 8 - i * 5, 5, 11 - i * 5, -3, 11 - i * 5], '#8a8aa0', 1.1, 0.3, sd + i, { double: false });
        line(ctx, [-9, -6, -9, 6], 1.2, 0.2, sd + 6, '#e0e0f0'); line(ctx, [-11, -3, -9, -6, -7, -3], 1.2, 0.2, sd + 7, '#e0e0f0');
        break;
      case 'platformer':
        for (let i = 0; i < 3; i++) shape(ctx, [-11 + i * 7.5, 3, -4 + i * 7.5, 3, -4 + i * 7.5, 7, -11 + i * 7.5, 7], '#8a5a30', 1.1, 0.3, sd + i, { double: false });
        line(ctx, [-6, -5, 6, -5], 1.2, 0.2, sd + 6, '#e0e0f0'); line(ctx, [3, -8, 6, -5, 3, -2], 1.2, 0.2, sd + 7, '#e0e0f0');
        break;
      case 'filler':
        shape(ctx, [-10, -8, -2, -8, -3, 0, -9, 0], '#6a7a9a', L, A, sd);
        for (let i = 0; i < 6; i++) { ctx.fillStyle = '#d8b878'; ctx.fillRect(-1 + i * 1.4, -4 + i * 2, 2, 2); }
        shape(ctx, [-2, 10, 10, 10, 6, 4, 2, 4], '#d8b878', 1, 0.3, sd + 2, { double: false });
        break;
      case 'attractor':
        shape(ctx, [-8, -4, 2, -4, 2, 6, -8, 6], '#a03a4a', L, A, sd);
        for (let i = 0; i < 3; i++) line(ctx, [-6 + i * 3, -4, -6 + i * 3, 6], 0.8, 0.1, sd + i, '#2a1018');
        ctx.fillStyle = '#ffe9a0'; ctx.font = '9px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♪', 7, -6); ctx.fillText('♫', 5, 6);
        break;
      case 'shimmier':
        shape(ctx, [-11, -11, 11, -11, 11, -6, -11, -6], '#4a2e2a', L, A, sd);
        body(0, 4, 3.4); line(ctx, [-2, 1, -3, -6], 1.3, 0.1, sd + 2); line(ctx, [2, 1, 3, -6], 1.3, 0.1, sd + 3);
        line(ctx, [6, -2, 10, -2], 1.1, 0.2, sd + 4, '#e0e0f0');
        break;
    }
    ctx.restore();
  }

  return { THEMES, INK, props, boom, makeTerrain, updateTerrain, background, nightLife, vignette, water, hatch, house, creature, skillIcon, inkRect, shape, line, ell, curlPts, setTime };
})();
