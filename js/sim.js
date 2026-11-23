'use strict';
// Simulation: destructible pixel terrain + creatures. No DOM, so node tests can run it (tools/test.js).
const Sim = (() => {
  const W = 640, H = 360, HZ = 25;
  const STEP_UP = 6, STEP_DOWN = 3, SAFE_FALL = 60, FALL_SPEED = 3, FLOAT_OPEN = 14;
  const BODY = 10;                       // creature height in px (feet row = y)
  const EMPTY = 0, DIRT = 1, STEEL = 2, BRICK = 3;
  // classic tools first, then the tribe tools (movement, air, water, weapons, terrain makers, helpers)
  const SKILLS = ['climber', 'floater', 'blocker', 'builder', 'basher', 'digger', 'miner',
    'runner', 'jumper', 'hopper', 'vaulter', 'slider', 'glider', 'balloon', 'jetpack', 'swimmer',
    'bomber', 'bazooka', 'mortar', 'laser', 'fencer', 'spearer', 'stacker', 'platformer', 'filler', 'attractor', 'shimmier'];
  const FLAGS = { climber: 1, floater: 1, runner: 1, slider: 1, glider: 1, swimmer: 1 };   // permanent abilities
  const GROUND_STATES = new Set(['walk', 'build', 'bash', 'dig', 'mine', 'shrug', 'stack', 'plat', 'pour', 'aim', 'laser', 'fence', 'play', 'plant']);
  const ALIVE_STATES = new Set([...GROUND_STATES, 'fall', 'float', 'climb', 'block', 'jump', 'glide', 'balloon', 'jet', 'swim', 'hang']);
  // ground state each tool switches to (or a special start)
  const WORK = { blocker: 'block', builder: 'build', basher: 'bash', digger: 'dig', miner: 'mine', stacker: 'stack', platformer: 'plat', filler: 'pour',
    bazooka: 'aim', mortar: 'aim', spearer: 'aim', laser: 'laser', fencer: 'fence', attractor: 'play', bomber: 'plant' };
  const JUMPS = { jumper: [2.5, -4.5, 0], hopper: [1.5, -4, 12], vaulter: [2.4, -7, 0] };   // [vx, vy, extra hops]
  const G_JUMP = 0.5;
  const EXTRA = 3;   // every level also offers each of the other tools, this many times

  class Terrain {
    constructor() { this.m = new Uint8Array(W * H); this.changes = []; }
    get(x, y) {
      if (x < 0 || x >= W) return STEEL;  // world sides act as walls
      if (y < 0 || y >= H) return EMPTY;
      return this.m[y * W + x];
    }
    solid(x, y) { return this.get(x, y) !== EMPTY; }
    diggable(x, y) { const v = this.get(x, y); return v === DIRT || v === BRICK; }
    clear(x, y) {
      if (x < 0 || x >= W || y < 0 || y >= H) return;
      const i = y * W + x, v = this.m[i];
      if (v === DIRT || v === BRICK) { this.m[i] = EMPTY; this.changes.push(i); }
    }
    sand(x, y) {
      if (x < 0 || x >= W || y < 0 || y >= H) return;
      const i = y * W + x;
      if (this.m[i] === EMPTY) { this.m[i] = DIRT; this.changes.push(i); }
    }
    brick(x, y) {
      if (x < 0 || x >= W || y < 0 || y >= H) return;
      const i = y * W + x;
      if (this.m[i] === EMPTY) { this.m[i] = BRICK; this.changes.push(i); }
    }
    // level building
    paint(op) {
      const [kind] = op, m = this.m;
      const put = (x, y, mat) => { if (x >= 0 && x < W && y >= 0 && y < H) m[y * W + x] = mat; };
      if (kind === 'r') {
        const [, x, y, w, h, mat = DIRT] = op;
        for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) put(i, j, mat);
      } else if (kind === 'e') {
        const [, cx, cy, rx, ry, mat = DIRT] = op;
        for (let j = Math.floor(cy - ry); j <= cy + ry; j++) for (let i = Math.floor(cx - rx); i <= cx + rx; i++) {
          const dx = (i - cx) / rx, dy = (j - cy) / ry;
          if (dx * dx + dy * dy <= 1) put(i, j, mat);
        }
      } else if (kind === 'p') {
        const [, pts, mat = DIRT] = op;
        let y0 = H, y1 = 0;
        for (let k = 1; k < pts.length; k += 2) { y0 = Math.min(y0, pts[k]); y1 = Math.max(y1, pts[k]); }
        const n = pts.length / 2;
        for (let j = Math.max(0, Math.floor(y0)); j <= Math.min(H - 1, y1); j++) {
          const yy = j + 0.5, xs = [];
          for (let a = 0; a < n; a++) {
            const b = (a + 1) % n, ax = pts[a * 2], ay = pts[a * 2 + 1], bx = pts[b * 2], by = pts[b * 2 + 1];
            if ((ay <= yy && by > yy) || (by <= yy && ay > yy)) xs.push(ax + (yy - ay) / (by - ay) * (bx - ax));
          }
          xs.sort((p, q) => p - q);
          for (let k = 0; k + 1 < xs.length; k += 2) for (let i = Math.ceil(xs[k] - 0.5); i < xs[k + 1] - 0.5; i++) put(i, j, mat);
        }
      }
    }
  }

  function canAssign(c, skill) {
    if (!ALIVE_STATES.has(c.st)) return false;
    if (FLAGS[skill]) return !c[skill];
    if (!GROUND_STATES.has(c.st)) return false;
    if (skill === 'blocker') return true;
    if (WORK[skill]) return c.st !== WORK[skill];
    return SKILLS.includes(skill);
  }

  class Game {
    // level: see js/levels.js; skills: {skill: count} – one SHARED pool: both players may use any tool
    // (an array of per-player objects is still accepted and merged).
    constructor(level, skills) {
      this.lv = level;
      this.T = new Terrain();
      for (const op of level.terrain) this.T.paint(op);
      this.T.changes.length = 0;
      this.water = level.water || [];
      this.hatches = level.hatches.map(h => ({ x: h.x, y: h.y, dir: h.dir || 1 }));
      this.exits = level.exits.map(e => ({ x: e.x, y: e.y - 1 }));
      const src = skills || level.skills, pool = {};
      for (const o of Array.isArray(src) ? src : [src]) for (const k in o) pool[k] = (pool[k] || 0) + o[k];
      this.featured = SKILLS.filter(k => pool[k] !== undefined);   // the level's own tools
      if (level.allTools !== false) for (const k of SKILLS) if (pool[k] === undefined) pool[k] = EXTRA;   // every other tool too, a few of each
      this.pool = pool;
      this.skills = [pool, pool];   // both players draw from the same counts
      this.cs = [];
      this.tick = 0;
      this.spawned = 0; this.saved = 0; this.dead = 0;
      this.nextId = 1;
      this.timeLeft = level.time * HZ;
      this.events = [];
      this.shots = [];                  // flying rockets, shells and spears {kind, x, y, vx, vy}
      this.bombs = [];                  // planted pumpkin bombs {x, y, t}
      this.grains = [];                 // falling sand {x, y, d} (2x2 px)                 // {type, x, y, p} for sound/effects, drained by the frontend
      this.over = false;
    }
    get count() { return this.lv.count; }
    get need() { return this.lv.need; }
    alive() { return this.cs.filter(c => ALIVE_STATES.has(c.st) || c.st === 'exit' || c.st === 'splat' || c.st === 'drown'); }
    emit(type, c, p) { this.events.push({ type, x: c ? c.x : 0, y: c ? c.y : 0, p }); }
    inWater(x, y) { return this.water.some(w => x >= w.x0 && x < w.x1 && y >= w.y + 2); }

    // ---------- player actions ----------
    pick(px, py, skill, radius = 9) {
      let best = null, bd = 1e9;
      for (const c of this.cs) {
        if (!ALIVE_STATES.has(c.st)) continue;
        const dx = c.x - px, dy = (c.y - BODY / 2) - py;
        const d = dx * dx + dy * dy * 0.6;
        if (d > radius * radius) continue;
        // prefer creatures the skill can be used on, then walkers
        const score = d + (skill && !canAssign(c, skill) ? 1000 : 0) + (c.st === 'walk' ? 0 : 20);
        if (score < bd) { bd = score; best = c; }
      }
      return best;
    }
    assign(player, c, skill) {
      const pool = this.skills[player];
      if (!c || !pool || !(pool[skill] > 0) || !canAssign(c, skill)) return false;
      if (skill === 'blocker' && this.cs.some(b => b !== c && b.st === 'block' && Math.abs(b.x - c.x) < 8 && Math.abs(b.y - c.y) < BODY)) return false;
      let ceil = -1;
      if (skill === 'shimmier') { ceil = this.ceilAbove(c.x, c.y); if (ceil < 0) return false; }
      pool[skill]--;
      if (FLAGS[skill]) c[skill] = true;
      else if (JUMPS[skill]) { const [vx, vy, hops] = JUMPS[skill]; c.hops = hops; this.startJump(c, vx, vy); }
      else if (skill === 'balloon') { c.st = 'balloon'; c.t = 0; c.work = 80; }
      else if (skill === 'jetpack') { c.st = 'jet'; c.t = 0; c.work = 100; }
      else if (skill === 'shimmier') { c.st = 'hang'; c.t = 0; c.y = ceil + BODY + 2; }
      else {
        c.st = WORK[skill];
        c.t = 0; c.work = { stacker: 8, filler: 90, attractor: 150, laser: 0 }[skill] ?? 12;
        c.weapon = skill; c.j = 0; c.y0 = c.y;
      }
      this.emit('assign', c, { player, skill });
      return true;
    }
    release(c) {
      if (!c || c.st !== 'block') return false;
      c.st = 'walk'; c.t = 0;
      this.emit('release', c);
      return true;
    }

    // ---------- step ----------
    step() {
      if (this.over) return;
      this.tick++;
      if (this.timeLeft > 0) this.timeLeft--;
      const lv = this.lv;
      if (this.tick >= 40 && this.spawned < lv.count && (this.tick - 40) % lv.rate === 0) {
        const h = this.hatches[this.spawned % this.hatches.length];
        this.cs.push({ id: this.nextId++, x: h.x, y: h.y, dir: h.dir, st: 'fall', t: 0, fall: 0, climber: false, floater: false, work: 0, anim: 0, hops: 0 });
        this.spawned++;
        this.emit('spawn', h);
      }
      const blockers = this.cs.filter(c => c.st === 'block');
      const players = this.cs.filter(c => c.st === 'play');
      for (const c of this.cs) {
        c.anim++;
        switch (c.st) {
          case 'walk': this.walk(c, blockers, players); if (c.runner && c.st === 'walk' && !c.dance) this.walk(c, blockers, players); break;
          case 'jump': this.jump(c); break;
          case 'glide': this.glide(c); break;
          case 'balloon': this.balloon(c); break;
          case 'jet': this.jet(c); break;
          case 'swim': this.swim(c); break;
          case 'hang': this.hang(c); break;
          case 'stack': this.stack(c); break;
          case 'plat': this.plat(c); break;
          case 'pour': this.pour(c); break;
          case 'aim': this.aim(c); break;
          case 'laser': this.laser(c); break;
          case 'fence': this.fence(c); break;
          case 'play': if (--c.work <= 0) this.toWalk(c); else if (!this.T.solid(c.x, c.y + 1)) this.toFall(c); break;
          case 'plant': if (++c.t >= 8) { this.bombs.push({ x: c.x, y: c.y, t: 70 }); this.emit('plant', c); this.toWalk(c); } break;
          case 'fall': case 'float': this.fall(c); break;
          case 'climb': this.climb(c); break;
          case 'build': this.build(c); break;
          case 'bash': this.bash(c); break;
          case 'dig': this.dig(c); break;
          case 'mine': this.mine(c); break;
          case 'block': if (!this.T.solid(c.x, c.y + 1)) this.toFall(c); break;
          case 'shrug': if (++c.t > 18) this.toWalk(c); break;
          case 'exit': if (++c.t > 16) { c.st = 'saved'; this.saved++; this.emit('saved', c); } break;
          case 'splat': case 'drown': if (++c.t > 20) { c.st = 'dead'; this.dead++; } break;
        }
        if (ALIVE_STATES.has(c.st)) {
          if (c.y >= H + 8) { c.st = 'dead'; this.dead++; this.emit('lost', c); }
          else if (c.st !== 'swim' && this.inWater(c.x, c.y)) {
            if (c.swimmer && c.st !== 'hang' && c.st !== 'balloon' && c.st !== 'jet') { c.st = 'swim'; c.t = 0; c.y = this.waterAt(c.x).y + 3; c.fall = 0; this.emit('splash', c); }
            else if (c.st !== 'hang' && c.st !== 'balloon' && c.st !== 'jet') { c.st = 'drown'; c.t = 0; this.emit('drown', c); }
          }
        }
      }
      this.stepShots(); this.stepBombs(); this.stepGrains();
      if (this.tick % 50 === 0) this.cs = this.cs.filter(c => c.st !== 'dead' && c.st !== 'saved');
      // end of level
      const live = this.cs.filter(c => ALIVE_STATES.has(c.st) || c.st === 'exit' || c.st === 'splat' || c.st === 'drown');
      const moving = live.filter(c => c.st !== 'block');
      if (this.timeLeft <= 0) this.over = true;
      else if (this.spawned >= lv.count && moving.length === 0) {
        if (live.length === 0 || this.saved >= lv.need) {
          this.endWait = (this.endWait || 0) + 1;
          if (this.endWait > HZ) this.over = true;
        }
      }
    }
    toWalk(c) { c.st = 'walk'; c.t = 0; }
    toFall(c) { c.st = 'fall'; c.t = 0; c.fall = 0; }
    checkExit(c) {
      for (const e of this.exits) if (Math.abs(c.x - e.x) <= 3 && Math.abs(c.y - e.y) <= 4) {
        c.st = 'exit'; c.t = 0; c.x = e.x; c.y = e.y; return true;
      }
      return false;
    }
    walk(c, blockers, players) {
      const T = this.T;
      if (this.checkExit(c)) return;
      c.dance = false;
      if (players) for (const m of players) if (Math.abs(m.x - c.x) <= 40 && Math.abs(m.y - c.y) < 14) { c.dance = true; return; }
      for (const b of blockers) {
        if (b !== c && Math.abs(b.y - c.y) < BODY && (b.x - c.x) * c.dir > 0 && Math.abs(b.x - c.x) <= 5) { c.dir = -c.dir; return; }
      }
      const nx = c.x + c.dir;
      if (T.solid(nx, c.y)) {
        let h = 1;
        while (h <= STEP_UP && T.solid(nx, c.y - h)) h++;
        if (h > STEP_UP) {
          if (c.climber) { c.st = 'climb'; c.t = 0; } else c.dir = -c.dir;
          return;
        }
        c.x = nx; c.y -= h;
      } else {
        c.x = nx;
        let d = 0;
        while (d < STEP_DOWN && !T.solid(c.x, c.y + 1)) { c.y++; d++; }
        if (!T.solid(c.x, c.y + 1)) { this.toFall(c); c.fall = d; }
      }
      this.checkExit(c);
    }
    fall(c) {
      const T = this.T;
      // slider: rubs down a wall face, so the drop never counts as a fall
      c.sliding = c.slider && c.st === 'fall' && (T.solid(c.x - 1, c.y - 2) || T.solid(c.x + 1, c.y - 2) || T.solid(c.x - 2, c.y - 2) || T.solid(c.x + 2, c.y - 2));
      const speed = c.st === 'float' ? 1 : c.sliding ? 2 : FALL_SPEED;
      for (let i = 0; i < speed; i++) {
        if (T.solid(c.x, c.y + 1)) {
          if (c.st === 'fall' && c.fall > SAFE_FALL) { c.st = 'splat'; c.t = 0; this.emit('splat', c); }
          else { this.toWalk(c); this.emit('land', c); this.checkExit(c); }
          return;
        }
        c.y++; if (c.sliding) c.fall = 0; else c.fall++;
      }
      if (c.st === 'fall' && c.glider && c.fall > 8) { c.st = 'glide'; c.t = 0; this.emit('float', c); }
      else if (c.st === 'fall' && c.floater && c.fall > FLOAT_OPEN) { c.st = 'float'; this.emit('float', c); }
    }
    // ---------- tribe tools ----------
    waterAt(x) { return this.water.find(w => x >= w.x0 && x < w.x1); }
    ceilAbove(x, y) {   // row of a ceiling 1..16 px above the head, or -1
      for (let k = BODY + 1; k <= BODY + 16; k++) if (this.T.solid(x, y - k)) return y - k;
      return -1;
    }
    land(c) {
      if (c.fall > SAFE_FALL) { c.st = 'splat'; c.t = 0; this.emit('splat', c); return; }
      if (c.hops > 0 && c.st === 'jump') { c.hops--; this.startJump(c, Math.abs(c.vx0), c.vy0); return; }
      this.toWalk(c); this.emit('land', c); this.checkExit(c);
    }
    startJump(c, vx, vy) {
      c.st = 'jump'; c.t = 0; c.vx = vx * c.dir; c.vy = vy; c.vx0 = vx; c.vy0 = vy; c.ax = 0; c.ay = 0; c.fall = 0;
      this.emit('jump', c);
    }
    // ballistic hop: moves pixel by pixel, bumps on walls and ceilings, lands on anything solid
    jump(c) {
      const T = this.T;
      c.t++;
      c.vy += G_JUMP;
      c.ax += c.vx; c.ay += c.vy;
      let dx = Math.trunc(c.ax), dy = Math.trunc(c.ay);
      c.ax -= dx; c.ay -= dy;
      while (dx || dy) {
        if (dx && (Math.abs(dx) >= Math.abs(dy) || !dy)) {
          const nx = c.x + Math.sign(dx);
          if (T.solid(nx, c.y - 4) || T.solid(nx, c.y - BODY + 2)) { c.ax = 0; dx = 0; if (c.vy >= 0) c.vx = 0; continue; }   // rising: keep trying
          c.x = nx; dx -= Math.sign(dx);
          let h = 0;
          while (h < 4 && T.solid(c.x, c.y - h)) h++;
          if (h) { c.y -= h; if (c.vy > 0) { this.land(c); return; } }
        } else {
          if (dy < 0) {
            if (T.solid(c.x, c.y - BODY)) { c.vy = 0; c.ay = 0; dy = 0; continue; }
            c.y--; dy++;
          } else {
            if (T.solid(c.x, c.y + 1)) { this.land(c); return; }
            c.y++; c.fall++; dy--;
          }
        }
      }
      if (c.vy > 0 && T.solid(c.x, c.y + 1)) this.land(c);
    }
    glide(c) {   // leaf glider: 2 px forward, 1 px down per tick, turns at walls, lands softly
      const T = this.T;
      c.t++;
      for (let i = 0; i < 2; i++) {
        const nx = c.x + c.dir;
        if (T.solid(nx, c.y) || T.solid(nx, c.y - 6)) { c.dir = -c.dir; break; }
        c.x = nx;
      }
      if (T.solid(c.x, c.y + 1)) { c.fall = 0; this.land(c); return; }
      c.y++;
      if (T.solid(c.x, c.y + 1)) { c.fall = 0; this.land(c); }
    }
    balloon(c) {   // rises up to 80 px drifting forward, then the balloon pops and it floats down
      const T = this.T;
      c.t++;
      if (c.work <= 0 || T.solid(c.x, c.y - BODY - 8) || c.y < BODY + 12) { c.st = 'float'; c.fall = 0; this.emit('pop', c); return; }
      c.y--; c.work--;
      if (c.t % 2 === 0) { const nx = c.x + c.dir; if (!T.solid(nx, c.y) && !T.solid(nx, c.y - 6)) c.x = nx; }
    }
    jet(c) {   // rocket pack: short climb, then flies level for 4 s (200 px), falls when it runs out or hits a wall
      const T = this.T;
      c.t++;
      if (c.t <= 8 && !T.solid(c.x, c.y - BODY - 1)) c.y--;
      for (let i = 0; i < 2; i++) {
        const nx = c.x + c.dir;
        let h = 0;
        while (h <= STEP_UP && T.solid(nx, c.y - h)) h++;
        if (h > STEP_UP || T.solid(nx, c.y - BODY + 1)) { this.toFall(c); return; }
        c.x = nx; c.y -= h;
      }
      if (--c.work <= 0) { if (T.solid(c.x, c.y + 1)) this.toWalk(c); else this.toFall(c); }
    }
    swim(c) {
      const T = this.T;
      c.t++;
      if (c.t % 2) return;
      const nx = c.x + c.dir;
      if (T.solid(nx, c.y) || T.solid(nx, c.y - 2)) {
        let h = 1;
        while (h <= 12 && T.solid(nx, c.y - h)) h++;
        if (h > 12) { c.dir = -c.dir; return; }
        c.x = nx; c.y -= h;
        if (T.solid(c.x, c.y + 1)) { this.toWalk(c); this.checkExit(c); } else this.toFall(c);
        return;
      }
      c.x = nx;
      const w = this.waterAt(c.x);
      if (!w) { this.toFall(c); return; }
      c.y = w.y + 3;
    }
    hang(c) {   // hand over hand along the ceiling; drops when the ceiling ends
      const T = this.T;
      c.t++;
      if (c.t % 2) return;
      const nx = c.x + c.dir;
      for (let r = 0; r <= BODY - 2; r++) if (T.solid(nx, c.y - r)) { c.dir = -c.dir; return; }
      const top = c.y - BODY - 2;
      let ceil = -1;
      for (const k of [0, -1, 1, -2, 2, 3]) if (T.solid(nx, top + k) && !T.solid(nx, top + k + 1)) { ceil = top + k; break; }
      if (ceil < 0) { c.x = nx; this.toFall(c); return; }
      c.x = nx; c.y = ceil + BODY + 2;
      if (T.solid(c.x, c.y + 1)) this.toWalk(c);
    }
    stack(c) {   // a 3 px wide wall rising from the floor in front, 8 bricks = 16 px
      const T = this.T;
      c.t++;
      if (c.t % 10 !== 0) return;
      const r = (8 - c.work) * 2;
      for (let k = 3; k <= 5; k++) { T.brick(c.x + c.dir * k, c.y - r); T.brick(c.x + c.dir * k, c.y - r - 1); }
      this.emit('brick', c);
      if (--c.work <= 0) { c.st = 'shrug'; c.t = 0; this.emit('shrug', c); }
    }
    plat(c) {   // flat bridge: 12 planks of 8 px at floor level, moving 4 px each
      const T = this.T;
      c.t++;
      if (c.t % 10 !== 0) return;
      for (let i = 1; i <= 8; i++) { T.brick(c.x + c.dir * i, c.y + 1); T.brick(c.x + c.dir * i, c.y + 2); }
      this.emit('brick', c);
      for (let k = 1; k <= 4; k++) for (let r = 0; r < BODY - 1; r++) if (T.solid(c.x + c.dir * k, c.y - r)) { this.toWalk(c); return; }
      c.x += c.dir * 4;
      if (--c.work <= 0) { c.st = 'shrug'; c.t = 0; this.emit('shrug', c); }
    }
    pour(c) {   // pours 90 grains of sand forward that pile up and become ground
      c.t++;
      const sx = c.x + c.dir * 4, sy = c.y - 9;
      if (this.T.solid(sx, sy) || this.T.solid(sx + 1, sy)) { this.toWalk(c); return; }
      this.grains.push({ x: sx, y: sy, d: c.t % 2 ? 1 : -1, h: 4 + (c.t * 7) % 18, hd: c.dir });
      if (c.t % 10 === 0) this.emit('pour', c);
      if (--c.work <= 0) this.toWalk(c);
    }
    aim(c) {   // bazooka, mortar, spear: wind up, fire, walk on
      if (++c.t < 10) return;
      const d = c.dir, k = c.weapon;
      if (k === 'bazooka') this.shots.push({ kind: 'rocket', x: c.x + d * 4, y: c.y - 5, vx: d * 5, vy: 0, g: 0 });
      else if (k === 'mortar') this.shots.push({ kind: 'shell', x: c.x + d * 3, y: c.y - 8, vx: d * 3, vy: -5, g: 0.3 });
      else this.shots.push({ kind: 'spear', x: c.x + d * 4, y: c.y - 1, vx: d * 5, vy: 0, g: 0, y0: c.y - 1 });
      this.emit('shoot', c, { kind: k });
      this.toWalk(c);
    }
    laser(c) {   // burns a diagonal tunnel up and forward, up to 90 px, stops at steel
      const T = this.T;
      c.t++; c.work += 3;
      const L = c.work, cx = Math.round(c.x + c.dir * (3 + L * 0.707)), cy = Math.round(c.y - 3 - L * 0.707), R = 6;
      for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) if (i * i + j * j <= R * R && T.get(cx + i, cy + j) === STEEL) { this.emit('clang', c); this.toWalk(c); return; }
      for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) if (i * i + j * j <= R * R) T.clear(cx + i, cy + j);
      c.beam = L;
      if (c.t % 4 === 0) this.emit('zap', c);
      if (L >= 90 || cy < 0 || cx < 0 || cx >= W) { c.beam = 0; this.toWalk(c); }
    }
    fence(c) {   // sword basher: tunnels forward and gently upward (1 px up every 2 px)
      const T = this.T;
      c.t++;
      if (c.t % 2) return;
      const feet = j => c.y0 - Math.floor(j / 2);
      for (let k = 1; k <= 4; k++) { const f = feet(c.j + k); for (let r = 0; r <= BODY; r++) if (T.get(c.x + c.dir * k, f - r) === STEEL) { this.emit('clang', c); this.toWalk(c); return; } }
      for (let k = 1; k <= 4; k++) { const f = feet(c.j + k); for (let r = 0; r <= BODY; r++) T.clear(c.x + c.dir * k, f - r); }
      if (c.t % 8 === 0) this.emit('dig', c);
      c.j++; c.x += c.dir; c.y = feet(c.j);
      let d = 0;
      while (d < 4 && !T.solid(c.x, c.y + 1)) { c.y++; d++; }   // nothing to climb into yet: stay on the floor
      if (d) c.y0 = c.y + Math.floor(c.j / 2);
      if (!T.solid(c.x, c.y + 1)) { this.toFall(c); return; }
      let more = false;
      for (let k = 1; k <= 14 && !more; k++) { const f = feet(c.j + k); for (let r = 0; r < BODY; r++) if (T.diggable(c.x + c.dir * k, f - r)) { more = true; break; } }
      if (!more || c.j > 120) this.toWalk(c);
    }
    explode(x, y, R) {
      const T = this.T;
      for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) if (i * i + j * j <= R * R) T.clear(Math.round(x + i), Math.round(y + j));
      this.events.push({ type: 'boom', x, y, p: { r: R } });
    }
    stepShots() {
      const T = this.T;
      for (const s of this.shots) {
        s.vy += s.g;
        const n = Math.max(1, Math.ceil(Math.max(Math.abs(s.vx), Math.abs(s.vy))));
        for (let i = 0; i < n && !s.done; i++) {
          s.x += s.vx / n; s.y += s.vy / n;
          const x = Math.round(s.x), y = Math.round(s.y);
          if (x < -10 || x > W + 10 || y > H + 10) { s.done = true; break; }
          if (!T.solid(x, y)) continue;
          s.done = true;
          if (s.kind === 'spear') {   // sticks in the wall: a 24 px plank pointing back at the thrower
            const d = Math.sign(s.vx), yy = s.y0;
            for (let k = 1; k <= 24; k++) { T.brick(x - d * k, yy); T.brick(x - d * k, yy + 1); }
            this.events.push({ type: 'thunk', x, y: yy });
          } else if (s.kind === 'rocket') this.explode(x + Math.sign(s.vx) * 5, y, 11); else this.explode(x, y, 13);
        }
      }
      this.shots = this.shots.filter(s => !s.done);
    }
    stepBombs() {
      for (const b of this.bombs) {
        if (!this.T.solid(b.x, b.y + 1) && b.y < H) b.y = Math.min(H, b.y + 2);
        if (--b.t <= 0) { this.explode(b.x, b.y - 1, 16); b.done = true; }
      }
      this.bombs = this.bombs.filter(b => !b.done);
    }
    stepGrains() {
      const T = this.T, free = (x, y) => !T.solid(x, y) && !T.solid(x + 1, y);
      for (const g of this.grains) {
        for (let s = 0; s < 3 && !g.done; s++) {
          if (g.y >= H) { g.done = true; break; }
          for (let k = 0; k < 2 && g.h > 0; k++) { g.h--; if (free(g.x + g.hd, g.y) && free(g.x + g.hd, g.y + 1)) g.x += g.hd; else g.h = 0; }   // flung forward from the bucket
          if (free(g.x, g.y + 2)) { g.y++; continue; }
          let moved = false;
          for (const d of [g.d * 2, -g.d * 2]) if (free(g.x + d, g.y + 2) && free(g.x + d, g.y + 1) && free(g.x + d, g.y)) { g.x += d; g.y++; moved = true; break; }
          if (!moved) { for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) T.sand(g.x + i, g.y + j); g.done = true; }
        }
      }
      this.grains = this.grains.filter(g => !g.done);
    }
    climb(c) {
      const T = this.T;
      c.t++;
      if (c.t % 2) return;
      if (T.solid(c.x, c.y - BODY) || c.y < BODY + 2) { c.dir = -c.dir; this.toFall(c); return; }
      if (!T.solid(c.x + c.dir, c.y + 1)) { this.toFall(c); return; }  // wall vanished
      c.y--;
      if (!T.solid(c.x + c.dir, c.y)) { c.x += c.dir; this.toWalk(c); }
    }
    build(c) {
      const T = this.T;
      c.t++;
      if (c.t % 10 !== 0) return;
      for (let i = 1; i <= 8; i++) { T.brick(c.x + c.dir * i, c.y); T.brick(c.x + c.dir * i, c.y - 1); }
      this.emit('brick', c);
      const nx = c.x + c.dir * 4, ny = c.y - 2;
      let blocked = false;
      for (let r = 0; r < BODY; r++) if (T.solid(nx, ny - r) || T.solid(c.x + c.dir, ny - r)) { blocked = true; break; }
      if (blocked) { this.toWalk(c); return; }
      c.x = nx; c.y = ny;
      if (--c.work <= 0) { c.st = 'shrug'; c.t = 0; this.emit('shrug', c); }
    }
    bash(c) {
      const T = this.T;
      c.t++;
      if (c.t % 2) return;
      for (let k = 1; k <= 4; k++) for (let r = 0; r < BODY; r++) {
        if (T.get(c.x + c.dir * k, c.y - r) === STEEL) { this.emit('clang', c); this.toWalk(c); return; }
      }
      for (let k = 1; k <= 4; k++) for (let r = 0; r < BODY; r++) T.clear(c.x + c.dir * k, c.y - r);
      if (c.t % 8 === 0) this.emit('dig', c);
      c.x += c.dir;
      if (!T.solid(c.x, c.y + 1)) { this.toFall(c); return; }
      let more = false;
      for (let k = 1; k <= 14 && !more; k++) for (let r = 0; r < BODY; r++) if (T.diggable(c.x + c.dir * k, c.y - r)) { more = true; break; }
      if (!more) this.toWalk(c);
    }
    dig(c) {
      const T = this.T;
      c.t++;
      if (c.t % 3) return;
      for (let dx = -4; dx <= 4; dx++) if (T.get(c.x + dx, c.y + 1) === STEEL) { this.emit('clang', c); this.toWalk(c); return; }
      for (let dx = -4; dx <= 4; dx++) T.clear(c.x + dx, c.y + 1);
      if (c.t % 12 === 0) this.emit('dig', c);
      c.y++;
      if (!T.solid(c.x, c.y + 1)) this.toFall(c);
    }
    mine(c) {
      const T = this.T;
      c.t++;
      if (c.t % 4) return;
      for (let k = 0; k <= 5; k++) for (let r = -1; r < BODY - 1; r++) {
        if (T.get(c.x + c.dir * k, c.y - r) === STEEL) { this.emit('clang', c); this.toWalk(c); return; }
      }
      for (let k = 0; k <= 5; k++) for (let r = -1; r < BODY - 1; r++) T.clear(c.x + c.dir * k, c.y - r);
      if (c.t % 12 === 0) this.emit('dig', c);
      c.x += c.dir * 2; c.y += 1;
      if (!T.solid(c.x, c.y + 1)) this.toFall(c);
    }
  }

  // Scripted player for tests / demo: rules = [{skill|release, at:[x0,y0,x1,y1], dir?, st?, n?, after?, delay?}]
  class Autopilot {
    constructor(game, rules) {
      this.g = game;
      this.rules = rules.map(r => ({ ...r, left: r.n || 1, doneAt: null }));
    }
    step() {
      const g = this.g;
      for (const r of this.rules) {
        if (r.left <= 0) continue;
        if (r.after !== undefined) {
          const dep = this.rules[r.after];
          if (dep.doneAt === null || g.tick < dep.doneAt + (r.delay || 0)) continue;
        }
        const [x0, y0, x1, y1] = r.at;
        for (const c of g.cs) {
          if (c.x < x0 || c.x > x1 || c.y < y0 || c.y > y1) continue;
          if (r.dir && c.dir !== r.dir) continue;
          if (r.st && c.st !== r.st) continue;
          let ok;
          if (r.release) ok = g.release(c);
          else {
            const p = r.player !== undefined ? r.player : g.skills.findIndex(s => s[r.skill] > 0);
            ok = p >= 0 && g.assign(p, c, r.skill);
          }
          if (ok) { r.left--; if (r.left <= 0) r.doneAt = g.tick; break; }
        }
      }
    }
  }

  return { W, H, HZ, BODY, SKILLS, FLAGS, EXTRA, EMPTY, DIRT, STEEL, BRICK, Terrain, Game, Autopilot, canAssign, ALIVE_STATES };
})();
if (typeof module !== 'undefined') module.exports = Sim;
