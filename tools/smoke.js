// Smoke test: runs the whole frontend (all scripts) in node with a fake DOM/canvas and drives it with
// key presses through title → level select → intro → play (+ maths card, pause) for every level, and a result screen.
// Any exception thrown in update/draw fails the test.  Usage: node tools/smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const noop = new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : k === 'width' || k === 'height' ? 100 : noop, apply: () => noop, construct: () => noop, set: () => true });
const handlers = {}, keys = new Set();
let rafCb = null, now = 0;
const ctx2d = new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'measureText' ? () => ({ width: 50 }) : k.startsWith('create') || k === 'getImageData' ? () => ({ addColorStop() {}, data: new Uint8ClampedArray(4 * 640 * 360) }) : (k === 'canvas' ? canvas : () => {})), set: (t, k, v) => { t[k] = v; return true; } });
const canvas = { getContext: () => ctx2d, width: 1280, height: 720, style: {}, addEventListener() {} };
const sandbox = {
  console, Math, JSON, Date, Array, Object, Set, Map, Uint8Array, Uint32Array, Uint8ClampedArray, Float32Array, String, Number, Boolean, Error, Promise, Symbol,
  performance: { now: () => now },
  location: { hash: process.env.SMOKE_WIN ? '#all-nopad-lv1-coop-auto-ff70' : '#all-nopad', protocol: 'file:' },
  document: { getElementById: () => canvas, createElement: () => canvas, fonts: { ready: Promise.resolve(), load: () => Promise.resolve() }, addEventListener() {} },
  navigator: { getGamepads: () => [] },
  localStorage: { getItem: () => null, setItem() {} },
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  addEventListener: (n, f) => (handlers[n] = handlers[n] || []).push(f),
  requestAnimationFrame: f => { rafCb = f; },
  ImageData: function (d, w, h) { this.data = d; this.width = w; this.height = h; },
  AudioContext: undefined, webkitAudioContext: undefined,
};
sandbox.window = sandbox; sandbox.self = sandbox;
vm.createContext(sandbox);
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
for (const m of html.matchAll(/<script src="([^"]+)"/g)) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', m[1]), 'utf8'), sandbox, { filename: m[1] });
const fire = (type, code) => (handlers[type] || []).forEach(f => f({ code, key: code, preventDefault() {} }));
function frames(n) { for (let i = 0; i < n; i++) { now += 1000 / 60; const f = rafCb; rafCb = null; if (!f) throw new Error('main loop stopped (no requestAnimationFrame)'); f(now); } }
function press(code, hold = 3) { fire('keydown', code); frames(hold); fire('keyup', code); frames(3); }
const step = (what, fn) => { try { fn(); } catch (e) { console.log('FAIL at', what + ':', e.stack.split('\n').slice(0, 3).join('\n  ')); process.exit(1); } };
if (process.env.SMOKE_WIN) {   // won level → maths break for both players → result screen
  const scrW = () => vm.runInContext('window.__tap.scr', sandbox);
  step('win → maths break', () => { for (let n = 0; n < 600 && scrW() !== 'after'; n++) frames(1); if (scrW() !== 'after') throw new Error('no maths break after a won level (screen ' + scrW() + ')'); });
  step('maths break: wrong answers until solved', () => { for (let n = 0; n < 4; n++) { press('Space'); press('Enter'); frames(10); } frames(330); });
  step('maths break → result', () => { if (scrW() !== 'result') throw new Error('maths break did not end (screen ' + scrW() + ')'); });
  console.log('SMOKE WIN OK'); process.exit(0);
}
step('title', () => { frames(30); press('Space'); frames(20); press('Enter'); frames(20); });
step('title → select', () => { press('Space'); frames(30); });
const LEVELS = vm.runInContext('LEVELS', sandbox);
const nLv = process.argv.includes('--quick') ? 1 : LEVELS.length;   // --quick: only the first level
const scr = () => vm.runInContext('window.__tap && window.__tap.scr', sandbox);
for (let i = 0; i < nLv; i++) {
  step(`L${i + 1} select → intro`, () => { if (scr() !== 'select') throw new Error('expected level select, got ' + scr()); press('Space'); frames(30); if (scr() !== 'intro') throw new Error('A on level select did not open the level (screen ' + scr() + ')'); });
  step(`L${i + 1} intro → play`, () => { press('Space'); press('Enter'); frames(60); });
  step(`L${i + 1} play`, () => { press('KeyD', 40); press('KeyE'); press('Space'); press('ArrowLeft', 30); press('Enter'); press('KeyF'); frames(240); });
  step(`L${i + 1} maths card`, () => { press('KeyR'); press('Digit4'); press('Space'); press('KeyC'); press('PageUp'); press('Numpad7'); press('Enter'); frames(120); });
  if (i === 1) {   // level 2 ends by itself after ~37 s when nobody helps: check the result screen and retry
    step('L2 run to end', () => { for (let n = 0; n < 160 && scr() !== 'result'; n++) frames(100); });   // ends when all are lost or time runs out
    step('L2 result → retry → select', () => {
      if (scr() !== 'result') throw new Error('expected the result screen after L2 ran out, got ' + scr());
      press('KeyF'); frames(60);                                   // Y = retry
      if (scr() !== 'intro') throw new Error('retry did not restart the level (screen ' + scr() + ')');
      press('KeyC'); frames(30);                                   // B = back to level select
    });
  } else step(`L${i + 1} pause → level select`, () => { press('Escape'); frames(10); press('KeyS'); press('KeyS'); press('Space'); frames(30); });
  step(`L${i + 1} next level`, () => { press('KeyD'); frames(10); });
}
// drawing pass: play every level's scripted solution and draw every creature pose, flying prop, background and tool icon
step('art: all tool icons', () => vm.runInContext(`for (const k of Sim.SKILLS) Art.skillIcon(ctx2dFake, k, 10, 10, 16)`, Object.assign(sandbox, { ctx2dFake: ctx2d })));
for (let i = 0; i < (process.argv.includes('--quick') ? 0 : LEVELS.length); i++) step(`L${i + 1} art pass`, () => vm.runInContext(`(() => {
  const lv = LEVELS[${i}], g = new Sim.Game(lv), ap = new Sim.Autopilot(g, lv.solution), terr = Art.makeTerrain(g, lv.theme);
  const states = new Set();
  Art.background(ctx2dFake, lv.theme, 1);
  while (!g.over) {
    ap.step(); g.step();
    for (const e of g.events) if (e.type === 'boom') Art.boom(e.x, e.y, e.p.r, g.tick / 25);
    g.events.length = 0;
    if (g.tick % 3) continue;
    Art.setTime(g.tick / 25); Art.updateTerrain(terr, g); Art.nightLife(ctx2dFake, lv.theme, g.tick / 25);
    for (const c of g.cs) if (c.st !== 'dead' && c.st !== 'saved') { Art.creature(ctx2dFake, c, g.tick, null); states.add(c.st); }
    Art.props(ctx2dFake, g, g.tick / 25); Art.water(ctx2dFake, g, g.tick / 25, lv.theme);
  }
  return states;
})()`, sandbox));
const win = require('child_process').spawnSync(process.execPath, [__filename], { env: { ...process.env, SMOKE_WIN: '1' }, encoding: 'utf8' });
if (win.status !== 0) { console.log(win.stdout + win.stderr); process.exit(1); }
console.log('SMOKE OK: all screens of', nLv, 'levels ran without errors' + (process.argv.includes('--quick') ? '' : ', and every level solution was drawn'));
