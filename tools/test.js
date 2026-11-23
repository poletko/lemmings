'use strict';
// node tools/test.js [levelIndex] [-v] — plays every level with its scripted solution and checks the outcome.
// Also checks that doing nothing loses (so every level actually needs the players).
const Sim = require('../js/sim.js');
const LEVELS = require('../js/levels.js');

const only = process.argv.find(a => /^\d+$/.test(a));
const verbose = process.argv.includes('-v');
let fail = 0;

function run(lv, rules) {
  const g = new Sim.Game(lv);
  const ap = new Sim.Autopilot(g, rules);
  const log = [];
  while (!g.over && g.tick < lv.time * Sim.HZ + 10) {
    ap.step();
    g.step();
    for (const e of g.events) if (['assign', 'splat', 'drown', 'release', 'clang', 'lost'].includes(e.type)) {
      log.push(`t${g.tick} ${e.type} ${e.p ? (e.p.skill || '') : ''} @${e.x},${e.y}`);
    }
    g.events.length = 0;
  }
  const unused = ap.rules.filter(r => r.left > 0 && (r.n || 1) === 1).map(r => r.skill || 'release');
  return { g, log, unused };
}

LEVELS.forEach((lv, i) => {
  if (only !== undefined && +only !== i) return;
  const { g, log, unused } = run(lv, lv.solution);
  const ok = g.saved >= lv.need;
  const idle = run(lv, []).g;
  const idleOk = idle.saved < lv.need;
  const secs = (g.tick / Sim.HZ).toFixed(0);
  console.log(`${ok && idleOk ? 'PASS' : 'FAIL'} ${i + 1}. ${lv.name.en}: saved ${g.saved}/${lv.count} (need ${lv.need}) in ${secs}s of ${lv.time}s; idle saves ${idle.saved}${unused.length ? '; unused rules: ' + unused.join(',') : ''}`);
  if (!ok || !idleOk) fail++;
  if (verbose || !ok) console.log('   ' + log.slice(0, 40).join('\n   '));
});
process.exit(fail ? 1 : 0);
