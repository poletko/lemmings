'use strict';
// Screens, players, HUD and the main loop.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  const { W, H, HZ } = Sim;
  const HUD_H = 48;                       // HUD height in world units
  const PCOL = ['#4fb8ff', '#ff9b3d'];    // player colours
  const PCOL_D = ['#8fd4ff', '#ffb877'];   // lighter variants for text on dark panels
  const hash = location.hash;

  // ---------- text ----------
  const STR = {
    sl: {
      title: 'TAPKAČI', sub: 'Reševanje v dvoje', join: 'Pritisni A', joined: 'Pripravljen', keyboard: 'tipkovnica',
      p: ['Igralec 1', 'Igralec 2'], cont: 'A – naprej', solo: 'en igralec', shared: 'Skupna orodja – vsak lahko uporabi katerokoli',
      lang: 'Y – English', music: 'X – glasba', on: 'vklj.', off: 'izklj.',
      kb1: 'P1 tipke: WASD kurzor · Space orodje · Q/E izbira · C sprosti · Shift natančno · F hitro · R račun',
      kb2: 'P2 tipke: puščice · Enter · Delete/PageDown · Backspace · desni Shift · End · PageUp račun',
      pad: 'Kontroler: palica = kurzor · A = uporabi · LB/RB ali križec = izbira · B = sprosti ustavljača · LT/X = natančno · Y = hitro · RT = račun · Start = premor',
      levels: 'Izberi stopnjo', locked: 'zaklenjeno', best: 'najboljše',
      level: 'Stopnja', save: 'Reši', of: 'od', time: 'Čas', ready: 'A – pripravljen', go: 'Oba pritisnita A!',
      tools: 'Orodja', home: 'Doma', out: 'Zunaj', need: 'potrebno',
      paused: 'Premor', resume: 'Nadaljuj', restart: 'Znova', menu: 'Izbira stopnje', musicItem: 'Glasba',
      win: 'Bravo!', lose: 'Skoraj!', winSub: 'Rešila sta jih dovolj.', loseSub: 'Premalo jih je prišlo domov.',
      next: 'A – naslednja stopnja', retry: 'A – poskusi znova', toMenu: 'B – izbira stopnje', again: 'Y – znova',
      allDone: 'Vse stopnje rešene! Odlično sodelovanje!', releaseHint: 'B nad ustavljačem ga sprosti',
      none: 'ni več', cant: 'ne gre',
      qTitle: 'Matematični odmor!', qSub: 'Vsak reši svoj račun. Pravilen odgovor = +1 orodje.', qReward: 'Nagrada: +1',
      qOk: 'Pravilno!', qWrong: 'Ni še prav – še', qAns: 'Pravilno je', qKeys: 'gor/dol številka · levo/desno premik · A potrdi',
      qOffer: 'račun za +1', qLater: 'kasneje', grade: { 2: '2. razred', 5: '4.–5. razred' }, gradeKey: 'LB/RB – kdor želi lažje račune (2. razred)', mathRow: 'Računi',
      afterTitle: 'Matematični odmor po stopnji', afterSub: 'Vsak reši svoj račun, potem gremo naprej.', afterNext: 'A – naprej', more: '+ še vsa ostala orodja, po ' + Sim.EXTRA + ' (LB/RB)',
      skill: { climber: 'Plezalec', floater: 'Padalec', blocker: 'Ustavljač', builder: 'Gradbenik', basher: 'Rovokop', digger: 'Kopač', miner: 'Rudar',
        runner: 'Tekač', jumper: 'Skakač', hopper: 'Žabec', vaulter: 'Palični skakač', slider: 'Drsalec', glider: 'Jadralec', balloon: 'Balonar',
        jetpack: 'Raketar', swimmer: 'Plavalec', bomber: 'Bombaš', bazooka: 'Bazukaš', mortar: 'Topničar', laser: 'Laserist', fencer: 'Mečevalec',
        spearer: 'Kopjanik', stacker: 'Zidar', platformer: 'Mostar', filler: 'Peskar', attractor: 'Godec', shimmier: 'Opica' },
    },
    en: {
      title: 'PITTERPATS', sub: 'A rescue for two', join: 'Press A', joined: 'Ready', keyboard: 'keyboard',
      p: ['Player 1', 'Player 2'], cont: 'A – continue', solo: 'one player', shared: 'Shared tools – either of you can use any of them',
      lang: 'Y – Slovenščina', music: 'X – music', on: 'on', off: 'off',
      kb1: 'P1 keys: WASD cursor · Space use · Q/E select · C release · Shift precise · F fast · R sum',
      kb2: 'P2 keys: arrows · Enter · Delete/PageDown · Backspace · right Shift · End · PageUp sum',
      pad: 'Controller: stick = cursor · A = use tool · LB/RB or d-pad = select · B = release stopper · LT/X = precise · Y = fast · RT = sum · Start = pause',
      levels: 'Choose a level', locked: 'locked', best: 'best',
      level: 'Level', save: 'Save', of: 'of', time: 'Time', ready: 'A – ready', go: 'Both press A!',
      tools: 'Tools', home: 'Home', out: 'Out', need: 'needed',
      paused: 'Paused', resume: 'Resume', restart: 'Restart', menu: 'Level select', musicItem: 'Music',
      win: 'Well done!', lose: 'So close!', winSub: 'You brought enough of them home.', loseSub: 'Not enough made it home.',
      next: 'A – next level', retry: 'A – try again', toMenu: 'B – level select', again: 'Y – restart',
      allDone: 'All levels solved! Great teamwork!', releaseHint: 'B over a stopper releases it',
      none: 'none left', cant: 'can\'t',
      qTitle: 'Maths break!', qSub: 'Each of you solves a sum. A right answer = +1 tool.', qReward: 'Reward: +1',
      qOk: 'Correct!', qWrong: 'Not yet – tries left:', qAns: 'The answer is', qKeys: 'up/down digit · left/right move · A confirm',
      qOffer: 'sum for +1', qLater: 'later', grade: { 2: 'Year 2', 5: 'Years 4–5' }, gradeKey: 'LB/RB – whoever wants easier sums (Year 2)', mathRow: 'Sums',
      afterTitle: 'Maths break after the level', afterSub: 'Each of you solves a sum, then we go on.', afterNext: 'A – continue', more: '+ all the other tools too, ' + Sim.EXTRA + ' of each (LB/RB)',
      skill: { climber: 'Climber', floater: 'Floater', blocker: 'Stopper', builder: 'Builder', basher: 'Basher', digger: 'Digger', miner: 'Miner',
        runner: 'Runner', jumper: 'Jumper', hopper: 'Hopper', vaulter: 'Pole Vaulter', slider: 'Slider', glider: 'Glider', balloon: 'Balloonist',
        jetpack: 'Jetpacker', swimmer: 'Swimmer', bomber: 'Bomber', bazooka: 'Bazooka', mortar: 'Mortar', laser: 'Laser', fencer: 'Fencer',
        spearer: 'Spearer', stacker: 'Stacker', platformer: 'Platformer', filler: 'Filler', attractor: 'Musician', shimmier: 'Monkey' },
    },
  };
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  let lang = load('tap-lang', 'sl');
  const tr = k => STR[lang][k];
  let unlocked = hash.includes('all') ? LEVELS.length - 1 : load('tap-unlocked', 0);
  const best = load('tap-best', {});

  // ---------- canvas ----------
  let Wc = 0, Hc = 0, dpr = 1, S = 1, ox = 0, oy = 0;
  function fit() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    Wc = innerWidth; Hc = innerHeight;
    cv.width = Math.round(Wc * dpr); cv.height = Math.round(Hc * dpr);
    cv.style.width = Wc + 'px'; cv.style.height = Hc + 'px';
    S = Math.min(Wc / W, Hc / (H + HUD_H));
    ox = Math.round((Wc - W * S) / 2); oy = Math.round((Hc - (H + HUD_H) * S) / 2);
  }
  addEventListener('resize', fit); fit();
  // 800 = logo (Eater), 700 = headings (Mystery Quest), else hand-written body text (Caveat Brush)
  const font = (px, w = 600) => w >= 800 ? `${px}px Eater, serif` : w >= 700 ? `${px}px "Mystery Quest", serif` : `${px * 1.12}px "Caveat Brush", "Trebuchet MS", sans-serif`;
  function text(str, x, y, px, col, align = 'center', w = 600, outline = null) {
    ctx.font = font(px, w); ctx.textAlign = align; ctx.textBaseline = 'middle';
    if (outline) { ctx.lineWidth = Math.max(2, px / 6); ctx.strokeStyle = outline; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y); }
    ctx.fillStyle = col; ctx.fillText(str, x, y);
  }
  function rrect(x, y, w, h, r, fill, stroke, lw = 2) {
    Art.inkRect(ctx, x, y, w, h, r, fill, stroke, lw);
  }

  // ---------- state ----------
  let scr = 'title', scrT = 0;
  const joined = [false, false];
  const coop = () => joined[0] && joined[1];
  let sel = 0;                // level select cursor
  let li = 0;                 // current level index
  let game = null, terr = null, auto = null;
  let fast = false, acc = 0;
  let ready = [false, false];
  let pauseSel = 0, pauseBy = 0;
  // maths break per player: offer = badge shown, qc = open card, held = card set aside (same question later)
  const qc = [null, null], held = [null, null], offer = [false, false], nextQ = [0, 0];
  let mathOn = load('tap-math', true);
  const QUIZ_FIRST = 12, QUIZ_EVERY = 60;   // seconds of level time: an offer early in every level, then again 60 s after each solved sum
  const players = [0, 1].map(i => ({ x: 0, y: 0, list: [], sel: 0, hover: null, msg: null, hold: 0, dx: 0, dy: 0 }));
  const floaters = [];        // floating texts in world coords
  let hudOff = 0, lastSel = 0; // tool bar scroll (27 tools do not fit) and which player changed tool last
  let titleCritters = [];

  // ---------- maths level per player: 2 = finished year 2, 5 = years 4–5 ----------
  // Chosen on the title screen every time: the player who wants the lower level (year 2) picks it with LB/RB,
  // the other one automatically gets years 4–5. Not remembered between runs.
  let lowGrade = -1;                               // controller slot with year-2 sums, -1 = nobody
  const gradeOf = i => lowGrade === i ? 2 : 5;
  const toggleLow = i => { lowGrade = lowGrade === i ? -1 : i; };
  function joinCheck() {
    for (let i = 0; i < 2; i++) if (!joined[i] && Ctl.pressed(i, 'a')) {
      joined[i] = true; Snd.init(); Snd.play('ready'); Ctl.rumble(i, 0.4, 0.4, 150);
      return true;
    }
    return false;
  }
  function anyPressed(btn) { for (let i = 0; i < 2; i++) if (joined[i] && Ctl.pressed(i, btn)) return i; return -1; }
  function go(s) { scr = s; scrT = 0; }

  function startLevel(i) {
    li = i;
    const lv = LEVELS[i];
    game = new Sim.Game(lv);   // one shared tool pool for both players
    terr = Art.makeTerrain(game, lv.theme);
    auto = hash.includes('auto') ? new Sim.Autopilot(game, lv.solution) : null;
    const solo = !coop();
    players.forEach((p, k) => {
      p.list = [...game.featured, ...Sim.SKILLS.filter(s => game.pool[s] !== undefined && !game.featured.includes(s))];   // level's own tools first
      p.sel = coop() && k === 1 ? Math.min(1, p.list.length - 1) : 0; p.hover = null; p.msg = null;
      p.x = solo ? W / 2 : (k === 0 ? W * 0.3 : W * 0.7); p.y = H * 0.45;
    });
    fast = false; acc = 0; floaters.length = 0; hudOff = 0; lastSel = 0;
    for (let k = 0; k < 2; k++) { qc[k] = held[k] = null; offer[k] = false; nextQ[k] = (QUIZ_FIRST + k * 5) * HZ; }
    ready = [false, false];
    go('intro');
  }
  const active = k => k === 0 ? (joined[0] || !joined[1]) : coop();
  // in solo the single joined player (whichever slot) drives cursor 0
  const ctlOf = k => (!coop() && k === 0) ? (joined[0] ? 0 : 1) : k;

  // ---------- update ----------
  function update(dt) {
    scrT += dt;
    if (Ctl.anyKey()) Snd.init();
    if (scr === 'title') updTitle(dt);
    else if (scr === 'select') updSelect();
    else if (scr === 'intro') updIntro();
    else if (scr === 'play') updPlay(dt);
    else if (scr === 'pause') updPause();
    else if (scr === 'result') updResult();
    else if (scr === 'after') updAfter(dt);
    const track = scr === 'title' || scr === 'select' ? 'title' : scr === 'after' ? 'quiz' : 'lvl' + (li % 4);
    Snd.music(fast && scr === 'play' ? 1.3 : 1, track);
  }
  function updTitle(dt) {
    if (joinCheck()) return;
    for (let i = 0; i < 2; i++) if (joined[i] && (Ctl.pressed(i, 'lb') || Ctl.pressed(i, 'rb') || Ctl.pressed(i, 'pl') || Ctl.pressed(i, 'pr'))) { toggleLow(i); Snd.play('move'); }
    if (anyPressed('y') >= 0) { lang = lang === 'sl' ? 'en' : 'sl'; store('tap-lang', lang); Snd.play('move'); }
    if (anyPressed('x') >= 0) { Snd.toggleMusic(); Snd.play('move'); }
    if ((anyPressed('a') >= 0 || anyPressed('start') >= 0) && scrT > 0.2) { Snd.play('pick'); sel = Math.min(unlocked, LEVELS.length - 1); go('select'); }
    for (const c of titleCritters) c.x += c.dir * dt * 26;
    titleCritters = titleCritters.filter(c => c.x > -20 && c.x < W + 20);
    if (Math.random() < dt * 0.8) titleCritters.push({ x: Math.random() < 0.5 ? -10 : W + 10, y: 318, dir: 0, anim: 0, id: Math.random() * 99 | 0, st: 'walk', t: 0 });
    for (const c of titleCritters) { if (!c.dir) c.dir = c.x < 0 ? 1 : -1; c.anim += dt * 25; }
  }
  const SEL_COLS = 10;   // level select grid: 10 columns × 5 rows of small numbered cards, details of the chosen one below
  function updSelect() {
    joinCheck();
    for (let i = 0; i < 2; i++) {
      if (!joined[i]) continue;
      const mv = (Ctl.repeat(i, 'right') ? 1 : 0) - (Ctl.repeat(i, 'left') ? 1 : 0) + ((Ctl.repeat(i, 'down') ? SEL_COLS : 0) - (Ctl.repeat(i, 'up') ? SEL_COLS : 0));
      if (mv) { const n = Math.max(0, Math.min(LEVELS.length - 1, sel + mv)); if (n !== sel) { sel = n; Snd.play('move'); } }
      if (Ctl.pressed(i, 'a') && scrT > 0.15) {
        if (sel <= unlocked) { Snd.play('pick'); startLevel(sel); } else Snd.play('deny');
        return;
      }
      if (Ctl.pressed(i, 'b')) { Snd.play('move'); go('title'); return; }
    }
  }
  function updIntro() {
    const wasCoop = coop();
    if (joinCheck() && wasCoop !== coop()) { startLevel(li); return; }
    for (let i = 0; i < 2; i++) if (joined[i] && Ctl.pressed(i, 'a') && scrT > 0.25 && !ready[i]) { ready[i] = true; Snd.play('ready'); }
    for (let i = 0; i < 2; i++) if (joined[i] && Ctl.pressed(i, 'b')) { go('select'); return; }
    if (joined.every((j, i) => !j || ready[i]) || auto) { go('play'); Snd.play('pick'); }
  }
  function updPlay(dt) {
    for (let i = 0; i < 2; i++) if (joined[i] && Ctl.pressed(i, 'start')) { pauseSel = 0; pauseBy = i; Snd.play('move'); go('pause'); return; }
    // players
    for (let k = 0; k < 2; k++) {
      if (!active(k)) continue;
      const i = ctlOf(k), p = players[k], c = Ctl.p[i];
      // maths card open: this player's controls go to the card, the game (and the partner) keep going
      if (qc[k]) {
        p.hover = null;
        if (Quiz.update(qc[k], dt, tr, res => {
          if (!res.ok) return;
          game.skills[k][res.reward] = (game.skills[k][res.reward] || 0) + 1;
          floaters.push({ x: p.x, y: p.y - 10, s: '+1 ' + res.rewardName, col: PCOL[k], t: 0 });
          Ctl.rumble(i, 0.3, 0.6, 200);
        })) { qc[k] = held[k] = null; offer[k] = false; nextQ[k] = game.tick + QUIZ_EVERY * HZ; }
        else if (!qc[k].done && (Ctl.pressed(i, 'b') || Ctl.pressed(i, 'm'))) { held[k] = qc[k]; qc[k] = null; Snd.play('move'); }
        continue;
      }
      if (offer[k] && mathOn && Ctl.pressed(i, 'm')) { openCard(k); continue; }
      const precise = c.x || c.lt > 0.4;
      const m = Math.min(1, Math.hypot(c.lx, c.ly));
      // progressive cursor: starts slow for precise aiming, speeds up the longer you hold a direction.
      // Turning sharply (or letting go) starts slow again.
      if (m > 0.1) {
        const ux = c.lx / m, uy = c.ly / m;
        if (p.hold > 0 && ux * p.dx + uy * p.dy < 0.5) p.hold = 0;
        p.dx = ux; p.dy = uy;
        p.hold += dt;
        const ramp = Math.min(1, p.hold / 1.4), sp = precise ? 30 : 30 + 330 * ramp * ramp;
        p.x += ux * sp * m * dt; p.y -= uy * sp * m * dt;
      } else p.hold = 0;
      p.x = Math.max(0, Math.min(W - 1, p.x)); p.y = Math.max(0, Math.min(H - 1, p.y));
      const n = p.list.length;
      if (n) {
        if (Ctl.pressed(i, 'lb') || Ctl.pressed(i, 'pl')) { p.sel = (p.sel + n - 1) % n; lastSel = k; Snd.play('move'); }
        if (Ctl.pressed(i, 'rb') || Ctl.pressed(i, 'pr')) { p.sel = (p.sel + 1) % n; lastSel = k; Snd.play('move'); }
      }
      const skill = p.list[p.sel];
      p.hover = game.pick(p.x, p.y, skill);
      if (Ctl.pressed(i, 'a') && skill) {
        if (!(game.skills[k][skill] > 0)) { Snd.play('deny'); say(p, tr('none')); }
        else if (p.hover && game.assign(k, p.hover, skill)) {
          Snd.play('assign', k); Ctl.rumble(i, 0.2, 0.5, 80);
          floaters.push({ x: p.hover.x, y: p.hover.y - 14, s: tr('skill')[skill], col: PCOL[k], t: 0 });
        } else if (p.hover) { Snd.play('deny'); say(p, tr('cant')); }
      }
      if (Ctl.pressed(i, 'b')) {
        const b = game.cs.filter(q => q.st === 'block').sort((a, b) => Math.hypot(a.x - p.x, a.y - 5 - p.y) - Math.hypot(b.x - p.x, b.y - 5 - p.y))[0];
        if (b && Math.hypot(b.x - p.x, b.y - 5 - p.y) < 14) { game.release(b); Snd.play('release'); }
      }
      if (Ctl.pressed(i, 'y')) { fast = !fast; Snd.play('fast'); }
      if (p.msg) { p.msg.t += dt; if (p.msg.t > 1) p.msg = null; }
    }
    // maths break
    if (mathOn && !auto) for (let k = 0; k < 2; k++) {
      if (active(k) && !offer[k] && game.tick >= nextQ[k] && players[k].list.length) { offer[k] = true; Snd.play('offer'); }
    }
    // simulation (in solo the game waits while the only player is solving – they chose when)
    acc += (!coop() && qc[0] ? 0 : dt) * (fast ? 3 : 1);
    let steps = 0;
    while (acc >= 1 / HZ && steps < 12) {
      acc -= 1 / HZ; steps++;
      if (auto) auto.step();
      game.step();
      for (const e of game.events) {
        if (e.type === 'assign') continue;
        if (e.type === 'dig' || e.type === 'brick') { if (!fast) Snd.play(e.type); continue; }
        Snd.play(e.type);
        if (e.type === 'boom') { Art.boom(e.x, e.y, e.p.r, performance.now() / 1000); for (let k = 0; k < 2; k++) if (joined[k]) Ctl.rumble(k, 0.6, 0.3, 160); }
        if (e.type === 'saved') floaters.push({ x: e.x, y: e.y - 18, s: '+1', col: '#fff36a', t: 0 });
        if (e.type === 'splat' || e.type === 'drown') for (let k = 0; k < 2; k++) if (joined[k]) Ctl.rumble(k, 0.5, 0.2, 120);
      }
      game.events.length = 0;
      if (game.tick === 12) Snd.play('open');
      if (game.over) { finish(); return; }
    }
    if (steps >= 12) acc = 0;
    Art.updateTerrain(terr, game);
    for (const f of floaters) f.t += dt;
    while (floaters.length && floaters[0].t > 1.2) floaters.shift();
  }
  function say(p, s) { p.msg = { s, t: 0 }; }
  function finish() {
    const won = game.saved >= game.need;
    const key = LEVELS[li].name.en;
    best[key] = Math.max(best[key] || 0, game.saved); store('tap-best', best);
    if (won && li + 1 > unlocked && li + 1 < LEVELS.length) { unlocked = li + 1; store('tap-unlocked', unlocked); }
    if (won && li === LEVELS.length - 1) { unlocked = LEVELS.length - 1; store('tap-unlocked', unlocked); }
    Snd.play(won ? 'win' : 'lose');
    resultWon = won;
    qc[0] = qc[1] = held[0] = held[1] = null;
    if (won && mathOn) {
      for (let k = 0; k < 2; k++) after[k] = active(k) ? Quiz.card({ ctl: ctlOf(k), slot: k, reward: null, tag: tr('grade')[gradeOf(ctlOf(k))] }, lang, terr.theme, k && after[0] ? after[0].text : null, gradeOf(ctlOf(k))) : null;
      afterDone[0] = afterDone[1] = false;
      go('after');
    } else go('result');
  }
  const after = [null, null], afterDone = [false, false];
  function updAfter(dt) {
    for (let k = 0; k < 2; k++) if (after[k] && !afterDone[k] && Quiz.update(after[k], dt, tr, () => {})) afterDone[k] = true;
    if ([0, 1].every(k => !after[k] || afterDone[k])) {   // everyone finished: A goes on, or by itself after a moment
      afterWait += dt;
      if ((afterWait > 0.4 && anyPressed('a') >= 0) || afterWait > 2.5) { afterWait = 0; Snd.play('pick'); go('result'); }
    } else afterWait = 0;
  }
  let afterWait = 0;
  function drawAfter(t) {
    const u = S, hp = { u, text, rrect, font, tr, PCOL, PCOL_D, keys: { close: '' } };
    ctx.fillStyle = 'rgba(10,6,18,0.6)'; ctx.fillRect(ox, oy, W * S, H * S);
    text(tr('afterTitle'), ox + W * u / 2, oy + 60 * u, 20 * u, '#ffb860', 'center', 700, '#0c0710');
    text(tr('afterSub'), ox + W * u / 2, oy + 84 * u, 10 * u, '#efe3c4', 'center', 600, '#0c0710');
    const cards = [0, 1].filter(k => after[k]), w = 260 * u, h = 140 * u, gap = 20 * u;
    cards.forEach((k, j) => {
      const x = ox + W * u / 2 - (cards.length * w + (cards.length - 1) * gap) / 2 + j * (w + gap);
      Quiz.draw(ctx, after[k], x, oy + 110 * u, w, h, hp);
    });
  }
  let resultWon = false;
  function updPause() {
    const items = 5;
    for (let i = 0; i < 2; i++) {
      if (!joined[i]) continue;
      if (Ctl.repeat(i, 'down')) { pauseSel = (pauseSel + 1) % items; Snd.play('move'); }
      if (Ctl.repeat(i, 'up')) { pauseSel = (pauseSel + items - 1) % items; Snd.play('move'); }
      if (Ctl.pressed(i, 'start') || Ctl.pressed(i, 'b')) { go('play'); return; }
      if (Ctl.pressed(i, 'a')) {
        Snd.play('pick');
        if (pauseSel === 0) go('play');
        else if (pauseSel === 1) startLevel(li);
        else if (pauseSel === 2) { sel = li; go('select'); }
        else if (pauseSel === 3) Snd.toggleMusic();
        else { mathOn = !mathOn; store('tap-math', mathOn); }
        return;
      }
    }
  }
  function updResult() {
    if (scrT < 0.6) return;
    for (let i = 0; i < 2; i++) {
      if (!joined[i]) continue;
      if (Ctl.pressed(i, 'a')) { Snd.play('pick'); startLevel(resultWon && li + 1 < LEVELS.length ? li + 1 : li); return; }
      if (Ctl.pressed(i, 'y')) { Snd.play('pick'); startLevel(li); return; }
      if (Ctl.pressed(i, 'b')) { Snd.play('move'); sel = Math.min(unlocked, LEVELS.length - 1); go('select'); return; }
    }
  }
  addEventListener('keydown', e => {
    if (e.code === 'KeyM') { Snd.init(); Snd.toggleMusic(); }
    const d = e.code.match(/^(Digit|Numpad)(\d)$/);
    if (d && (scr === 'play' || scr === 'after')) {
      const slot = coop() ? (d[1] === 'Digit' ? 0 : 1) : 0;
      Quiz.typeDigit(scr === 'after' ? after[slot] : qc[slot], +d[2]);
    }
  });
  function openCard(k) {
    if (held[k]) { qc[k] = held[k]; qc[k].t = 0.2; qc[k].top = players[k].y > H * 0.5; held[k] = null; Snd.play('pick'); return; }
    const p = players[k], reward = p.list[p.sel];
    if (!reward) return;
    const other = qc[1 - k] || held[1 - k];
    qc[k] = Quiz.card({ ctl: ctlOf(k), slot: k, reward, rewardName: tr('skill')[reward] }, lang, terr.theme, other && other.text, gradeOf(ctlOf(k)));
    qc[k].top = p.y > H * 0.5;
    Snd.play('pick');
  }
  const mathKey = k => Ctl.pads[ctlOf(k)] ? 'RT' : (coop() && k === 1 ? 'PageUp' : 'R');
  const laterKey = k => Ctl.pads[ctlOf(k)] ? 'B' : (coop() && k === 1 ? 'Backspace' : 'C');
  function drawMath(t) {
    if (!mathOn) return;
    const u = S, hp = { u, text, rrect, font, tr, PCOL, PCOL_D };
    for (let k = 0; k < 2; k++) {
      if (!active(k)) continue;
      const right = k === 1;
      if (qc[k]) {
        const w = 224 * u, h = 126 * u, x = right ? ox + W * u - w - 6 * u : ox + 6 * u;
        const y = qc[k].top ? oy + 6 * u : oy + H * u - h - 6 * u;   // away from where this player was working
        Quiz.draw(ctx, qc[k], x, y, w, h, Object.assign({ keys: { close: `${laterKey(k)} ${tr('qLater')}` } }, hp));
      } else if (offer[k]) {
        const label = `${mathKey(k)} · ${tr('qOffer')}`;
        ctx.font = font(8 * u, 600);
        const h = 20 * u, w = ctx.measureText(label).width + h + 14 * u;
        Quiz.badge(ctx, terr.theme, right ? ox + W * u - w - 6 * u : ox + 6 * u, oy + H * u - h - 6 * u, w, h, k, t, label, hp);
      }
    }
  }

  // ---------- draw ----------
  function draw(t) {
    Art.setTime(t);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#07050c'; ctx.fillRect(0, 0, Wc, Hc);
    if (scr === 'title') drawTitle(t);
    else if (scr === 'select') drawSelect(t);
    else {
      drawWorld(t);
      drawHud(t);
      if (scr === 'play' || scr === 'pause') drawMath(t);
      if (scr === 'intro') drawIntro(t);
      if (scr === 'pause') drawPause();
      if (scr === 'result') drawResult(t);
      if (scr === 'after') drawAfter(t);
    }
  }
  function worldXf() { ctx.setTransform(dpr * S, 0, 0, dpr * S, dpr * ox, dpr * oy); }
  function drawWorld(t) {
    worldXf();
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    Art.background(ctx, terr.theme, S * dpr);
    Art.nightLife(ctx, terr.theme, t);
    const open = Math.max(0, Math.min(1, (game.tick - 12) / 10));
    for (const h of game.hatches) Art.hatch(ctx, h, t, game.spawned >= game.count && game.tick > 40 + game.count * game.lv.rate + 40 ? Math.max(0, 1 - (game.tick - 40 - game.count * game.lv.rate - 40) / 10) : open);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(terr.cv, 0, 0);
    for (const e of game.exits) Art.house(ctx, e, t, game.cs.some(c => c.st === 'exit') ? 1 : 0);
    const hl = new Map();
    for (let k = 1; k >= 0; k--) if (active(k) && players[k].hover) hl.set(players[k].hover, PCOL[k]);
    for (const c of game.cs) if (c.st !== 'dead' && c.st !== 'saved') Art.creature(ctx, c, game.tick, hl.get(c));
    Art.props(ctx, game, t);
    Art.water(ctx, game, t, terr.theme);
    Art.vignette(ctx);
    // floating texts
    for (const f of floaters) {
      ctx.globalAlpha = Math.max(0, 1 - f.t / 1.2);
      ctx.font = font(7, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(f.s, f.x, f.y - f.t * 10);
      ctx.fillStyle = f.col; ctx.fillText(f.s, f.x, f.y - f.t * 10);
    }
    ctx.globalAlpha = 1;
    // stopper release hint
    const blockers = game.cs.filter(c => c.st === 'block');
    if (blockers.length && game.spawned >= game.count && !game.cs.some(c => Sim.ALIVE_STATES.has(c.st) && c.st !== 'block')) {
      ctx.font = font(9, 700); ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#000';
      const y = 20 + Math.sin(t * 4) * 2;
      ctx.strokeText(tr('releaseHint'), W / 2, y); ctx.fillStyle = '#fff36a'; ctx.fillText(tr('releaseHint'), W / 2, y);
    }
    // cursors
    if (scr === 'play' || scr === 'intro') for (let k = 0; k < 2; k++) if (active(k)) drawCursor(players[k], k, t);
    ctx.restore();
  }
  function drawCursor(p, k, t) {
    const col = PCOL[k], r = p.hover ? 5.5 : 7;
    ctx.save(); ctx.translate(p.x, p.y);
    for (const [lw, c] of [[2.6, 'rgba(0,0,0,0.6)'], [1.2, col]]) {
      ctx.lineWidth = lw; ctx.strokeStyle = c;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke();
      ctx.beginPath();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { ctx.moveTo(dx * (r - 2.5), dy * (r - 2.5)); ctx.lineTo(dx * (r + 3), dy * (r + 3)); }
      ctx.stroke();
    }
    if (coop()) {
      ctx.font = font(6, 700); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.strokeText('P' + (k + 1), r + 2, -r - 1); ctx.fillStyle = col; ctx.fillText('P' + (k + 1), r + 2, -r - 1);
    }
    if (p.msg) {
      ctx.globalAlpha = 1 - p.msg.t;
      ctx.font = font(6.5, 700); ctx.textAlign = 'center';
      ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.strokeText(p.msg.s, 0, r + 8); ctx.fillStyle = '#ff8080'; ctx.fillText(p.msg.s, 0, r + 8);
    }
    ctx.restore();
  }
  function drawHud(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const hx = ox, hy = oy + H * S, hw = W * S, hh = HUD_H * S, u = S;
    const g = ctx.createLinearGradient(0, hy, 0, hy + hh); g.addColorStop(0, '#1c1424'); g.addColorStop(1, '#0c0810');
    ctx.fillStyle = g; ctx.fillRect(hx, hy, hw, hh);
    Art.line(ctx, [hx, hy + u, hx + hw * 0.5, hy + 1.6 * u, hx + hw, hy + u], 2 * u, 1.2 * u, 3, '#3a2a48');
    // shared tool bar in the middle: both players pick from the same tools and counts.
    // A slot is framed in the colour of whoever has it selected (both → two frames).
    // Only VIS slots fit: the bar scrolls so the tool of whoever changed tool last stays visible.
    const list = players[0].list, n = list.length, VIS = Math.min(n, 9), slot = 38 * u, sh = 40 * u, sy = hy + 4 * u;
    const ls = players[active(lastSel) ? lastSel : 0].sel;
    if (ls < hudOff) hudOff = ls; else if (ls >= hudOff + VIS) hudOff = ls - VIS + 1;
    hudOff = Math.max(0, Math.min(n - VIS, hudOff));
    const x0 = hx + hw / 2 - VIS * slot / 2;
    if (hudOff > 0) text('‹', x0 - 7 * u, sy + sh / 2, 16 * u, '#ffb860', 'center', 700);
    if (hudOff + VIS < n) text('›', x0 + VIS * slot + 7 * u, sy + sh / 2, 16 * u, '#ffb860', 'center', 700);
    for (let j = hudOff; j < hudOff + VIS; j++) {
      const s = list[j], cnt = game.pool[s] || 0, x = x0 + (j - hudOff) * slot;
      if (j === game.featured.length && j > hudOff) Art.line(ctx, [x, sy + 4 * u, x, sy + sh - 4 * u], 1.4 * u, 0.3 * u, 9, '#ffb860');   // level tools | extras
      const by = [0, 1].filter(k => active(k) && players[k].sel === j);
      rrect(x + 2 * u, sy, slot - 4 * u, sh, 6 * u, by.length ? '#3d2f4a' : '#221a2a', by.length ? PCOL[by[0]] : '#4a3a58', by.length ? 3.2 * u : 1.2 * u);
      if (by.length === 2) rrect(x + 5.5 * u, sy + 3.5 * u, slot - 11 * u, sh - 7 * u, 4 * u, null, PCOL[1], 2.2 * u);
      ctx.globalAlpha = cnt ? 1 : 0.35;
      Art.skillIcon(ctx, s, x + slot / 2, sy + 15 * u, 21 * u);
      ctx.globalAlpha = 1;
      text(String(cnt), x + slot / 2, sy + 32 * u, 10 * u, by.length ? '#fff3d6' : (cnt ? '#d8ccb0' : '#6a5a70'), 'center', 700);
      if (coop()) for (const k of by) {   // little player tags on the top corners
        const tx = k === 0 ? x + 6 * u : x + slot - 6 * u;
        ctx.fillStyle = PCOL[k]; ctx.beginPath(); ctx.arc(tx, sy + 1 * u, 4.2 * u, 0, 7); ctx.fill();
        text(String(k + 1), tx, sy + 1.3 * u, 6 * u, '#0c0710', 'center', 700);
      }
    }
    // stats on the left
    const alive = game.cs.filter(c => Sim.ALIVE_STATES.has(c.st)).length;
    const secs = Math.ceil(game.timeLeft / HZ), mm = Math.floor(secs / 60), ss = String(secs % 60).padStart(2, '0');
    const homeCol = game.saved >= game.need ? '#8dff7a' : '#fff36a';
    text(`${tr('home')} ${game.saved}/${game.need}`, hx + 10 * u, hy + 14 * u, 11 * u, homeCol, 'left', 700);
    text(`${tr('out')} ${alive} · ${game.count - game.spawned} · ${mm}:${ss}`, hx + 10 * u, hy + 30 * u, 8.5 * u, secs < 30 ? '#ff8a7a' : '#d9c7a6', 'left', 600);
    if (fast) text('▶▶', hx + 10 * u, hy + 42 * u, 7 * u, '#8dd6ff', 'left', 700);
    // each player's current tool on the right
    const who = [0, 1].filter(active);
    who.forEach((k, r) => {
      const yy = who.length === 2 ? hy + (13 + r * 17) * u : hy + 22 * u, sk = players[k].list[players[k].sel];
      text(`${coop() ? 'P' + (k + 1) + ' · ' : ''}${sk ? tr('skill')[sk] + ' ' + (game.pool[sk] || 0) : ''}`, hx + hw - 10 * u, yy, 9 * u, coop() ? PCOL_D[k] : '#f5e6c8', 'right', 700);
    });
  }
  function panel(w, h) {
    const x = ox + (W * S - w) / 2, y = oy + (H * S - h) / 2;
    ctx.fillStyle = 'rgba(10,6,18,0.55)'; ctx.fillRect(ox, oy, W * S, H * S);
    rrect(x, y, w, h, 14 * S, 'rgba(26,18,34,0.96)', '#8a6ab0', 2.5 * S);
    return { x, y };
  }
  function drawIntro(t) {
    const u = S, lv = LEVELS[li];
    const { x, y } = panel(420 * u, 250 * u), cx = x + 210 * u;
    text(`${tr('level')} ${li + 1}`, cx, y + 20 * u, 10 * u, '#b89a7a', 'center', 600);
    text(lv.name[lang], cx, y + 40 * u, 20 * u, '#efe3c4', 'center', 700);
    wrap(lv.hint[lang], cx, y + 66 * u, 380 * u, 9.5 * u, '#cbb894');
    text(`${tr('save')} ${lv.need} ${tr('of')} ${lv.count} · ${tr('time')} ${Math.floor(lv.time / 60)}:${String(lv.time % 60).padStart(2, '0')}`, cx, y + 100 * u, 10 * u, '#efe3c4', 'center', 600);
    // shared tools (one row), then a ready mark per player
    text(coop() ? tr('shared') : tr('tools'), cx, y + 122 * u, 9.5 * u, '#ffb860', 'center', 700);
    const list = game.featured, n = list.length, sw = 44 * u;
    text(tr('more'), cx, y + 188 * u, 7 * u, '#9a8aa8', 'center', 600);
    list.forEach((s, j) => {
      const sx = cx - n * sw / 2 + j * sw + sw / 2;
      rrect(sx - 17 * u, y + 132 * u, 34 * u, 36 * u, 5 * u, '#2e2438', '#8a6ab0', 1.5 * u);
      Art.skillIcon(ctx, s, sx, y + 145 * u, 19 * u);
      text(String(game.pool[s]), sx, y + 161 * u, 8.5 * u, '#fff', 'center', 700);
      text(tr('skill')[s], sx, y + 175 * u, 6.5 * u, '#cbb894', 'center', 600);
    });
    (coop() ? [0, 1] : [0]).forEach((k, ci) => {
      const px = coop() ? x + (ci === 0 ? 120 : 300) * u : cx;
      const r = ready[coop() ? k : (joined[0] ? 0 : 1)];
      text((coop() ? `P${k + 1}: ` : '') + (r ? '✔ ' + tr('joined') : tr('ready')), px, y + 200 * u, 11 * u, r ? '#7ee07a' : PCOL_D[k], 'center', 700);
    });
    if (coop()) text(tr('go'), cx, y + 228 * u, 9 * u, '#b89a7a', 'center', 600);
  }
  function wrap(str, cx, y, maxW, px, col) {
    ctx.font = font(px, 500);
    const words = str.split(' '); let line = '', ly = y;
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { text(line, cx, ly, px, col, 'center', 500); line = w; ly += px * 1.3; }
      else line = test;
    }
    if (line) text(line, cx, ly, px, col, 'center', 500);
  }
  function drawPause() {
    const u = S, { x, y } = panel(240 * u, 196 * u), cx = x + 120 * u;
    text(tr('paused'), cx, y + 24 * u, 18 * u, '#efe3c4', 'center', 700);
    const items = [tr('resume'), tr('restart'), tr('menu'), `${tr('musicItem')}: ${Snd.musicOn ? tr('on') : tr('off')}`, `${tr('mathItem')}: ${mathOn ? tr('on') : tr('off')}`];
    items.forEach((s, i) => {
      const iy = y + 56 * u + i * 27 * u;
      if (i === pauseSel) rrect(x + 16 * u, iy - 11 * u, 208 * u, 22 * u, 8 * u, PCOL[pauseBy], null);
      text(s, cx, iy, 11 * u, i === pauseSel ? '#fff' : '#efe3c4', 'center', 600);
    });
  }
  function drawResult(t) {
    const u = S, { x, y } = panel(320 * u, 190 * u), cx = x + 160 * u;
    const won = resultWon, pct = Math.round(game.saved / game.count * 100);
    const last = won && li === LEVELS.length - 1;
    text(won ? tr('win') : tr('lose'), cx, y + 30 * u, 24 * u, won ? '#7ee07a' : '#ff6a5a', 'center', 700);
    text(last ? tr('allDone') : (won ? tr('winSub') : tr('loseSub')), cx, y + 58 * u, 9.5 * u, '#cbb894', 'center', 500);
    text(`${tr('home')}: ${game.saved} / ${game.count}  (${pct} %)`, cx, y + 86 * u, 13 * u, '#efe3c4', 'center', 700);
    text(`${tr('need')}: ${game.need}`, cx, y + 106 * u, 9.5 * u, '#b89a7a', 'center', 600);
    text(won && li + 1 < LEVELS.length ? tr('next') : tr('retry'), cx, y + 134 * u, 11 * u, '#efe3c4', 'center', 700);
    text(`${tr('again')}  ·  ${tr('toMenu')}`, cx, y + 160 * u, 9 * u, '#9a8a9a', 'center', 600);
  }
  function drawTitle(t) {
    ctx.setTransform(dpr * S, 0, 0, dpr * S, dpr * ox, dpr * oy);
    const VH = H + HUD_H;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, VH); ctx.clip();
    Art.background(ctx, 'meadow', S * dpr);
    Art.nightLife(ctx, 'meadow', t);
    ctx.fillStyle = '#2a1d24'; ctx.fillRect(0, 300, W, VH - 300);
    Art.shape(ctx, [-10, 322, 100, 318, 220, 323, 340, 317, 460, 322, 560, 318, 650, 321, 650, VH + 10, -10, VH + 10], '#2a1d24', 2, 1, 5);
    Art.line(ctx, [-10, 321, 100, 317, 220, 322, 340, 316, 460, 321, 560, 317, 650, 320], 3, 0.8, 6, '#34503e');
    for (const c of titleCritters) Art.creature(ctx, { ...c, anim: Math.floor(c.anim) }, 0, null);
    // logo
    const bob = Math.sin(t * 2) * 3;
    ctx.save(); ctx.translate(W / 2, 70 + bob); ctx.rotate(Math.sin(t * 1.3) * 0.02);
    // hand-lettered logo: every letter wobbles on its own (boiling like ink drawings)
    ctx.font = font(54, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const word = tr('title'), widths = [...word].map(ch => ctx.measureText(ch).width), tot = widths.reduce((a, b) => a + b, 0) + (word.length - 1) * 2;
    let lx = -tot / 2;
    const bf = Math.floor(t * 6) % 3;
    [...word].forEach((ch, i) => {
      const cxl = lx + widths[i] / 2, rot = Math.sin(i * 2.3 + bf * 1.7) * 0.07, dy = Math.sin(i * 1.9 + bf * 2.1) * 2 + Math.sin(t * 2 + i) * 1.5;
      ctx.save(); ctx.translate(cxl, dy); ctx.rotate(rot);
      ctx.lineWidth = 8; ctx.strokeStyle = '#0c0710'; ctx.lineJoin = 'round'; ctx.strokeText(ch, 0, 0);
      const lg = ctx.createLinearGradient(0, -28, 0, 28); lg.addColorStop(0, '#ffcf6a'); lg.addColorStop(1, '#e0601e');
      ctx.fillStyle = lg; ctx.fillText(ch, 0, 0);
      ctx.restore();
      lx += widths[i] + 2;
    });
    ctx.restore();
    text(tr('sub'), W / 2, 116, 18, '#c9b8ff', 'center', 700, '#0c0710');
    // join slots
    for (let i = 0; i < 2; i++) {
      const x = W / 2 + (i === 0 ? -150 : 10), y = 140;
      rrect(x, y, 140, 74, 12, joined[i] ? (i ? '#7a3a14' : '#14406a') : 'rgba(20,14,28,0.85)', PCOL[i], 2.5);
      text(tr('p')[i], x + 70, y + 18, 15, joined[i] ? '#fff' : PCOL_D[i], 'center', 700);
      const pad = Ctl.padName(i);
      text(joined[i] ? '✔ ' + tr('joined') : tr('join'), x + 70, y + 42, 14, joined[i] ? '#fff' : '#efe3c4', 'center', 700);
      text(pad || tr('keyboard'), x + 70, y + 61, 7.5, joined[i] ? '#eef' : '#9a8a9a', 'center', 500);
      if (joined[i]) text(`◀ ${tr('mathRow')}: ${tr('grade')[gradeOf(i)]} ▶`, x + 70, y + 84, 9, gradeOf(i) === 2 ? '#9ff0a0' : '#ffd08a', 'center', 700, '#0c0710');
    }
    if (joined[0] || joined[1]) text(tr('gradeKey'), W / 2, 256, 7, '#c8bcd8', 'center', 500);
    if (joined[0] || joined[1]) text(tr('cont') + (coop() ? '' : '  (' + tr('solo') + ')'), W / 2, 242, 12, '#fff', 'center', 700, '#0c0710');
    text(`${tr('lang')}   ·   ${tr('music')}: ${Snd.musicOn ? tr('on') : tr('off')}`, W / 2, 272, 9, '#fff', 'center', 600, '#0c0710');
    text(tr('pad'), W / 2, 340, 7, '#c8bcd8', 'center', 500);
    text(tr('kb1'), W / 2, 356, 7, '#c8bcd8', 'center', 500);
    text(tr('kb2'), W / 2, 370, 7, '#c8bcd8', 'center', 500);
    ctx.restore();
  }
  function drawSelect(t) {
    ctx.setTransform(dpr * S, 0, 0, dpr * S, dpr * ox, dpr * oy);
    const VH = H + HUD_H;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, VH); ctx.clip();
    Art.background(ctx, 'dusk', S * dpr);
    ctx.fillStyle = 'rgba(20,10,30,0.4)'; ctx.fillRect(0, 0, W, VH);
    text(tr('levels'), W / 2, 26, 20, '#ffb860', 'center', 700, '#0c0710');
    const rows = Math.ceil(LEVELS.length / SEL_COLS), gap = 6, cw = Math.min(70, (W - 40 - gap * (SEL_COLS - 1)) / SEL_COLS), ch = Math.min(52, (VH - 52 - 96 - (rows - 1) * gap) / rows);
    const gx = (W - cw * SEL_COLS - gap * (SEL_COLS - 1)) / 2, gy = 46;
    LEVELS.forEach((lv, i) => {
      const x = gx + (i % SEL_COLS) * (cw + gap), y = gy + Math.floor(i / SEL_COLS) * (ch + gap), on = i === sel, lock = i > unlocked;
      const th = Art.THEMES[lv.theme] || Art.THEMES.meadow;
      rrect(x, y, cw, ch, 8, lock ? 'rgba(16,12,20,0.85)' : th.hill[0], on ? '#ffb860' : '#4a3a58', on ? 3 : 1.4);
      text(String(i + 1), x + cw / 2, y + ch / 2 + 1, 17, lock ? '#777' : on ? '#ffb860' : '#efe3c4', 'center', 700, '#0c0710');
      const b = best[lv.name.en];
      if (b !== undefined && b >= lv.need) text('✔', x + cw - 8, y + 9, 8, '#7ee07a', 'center', 700);
      if (lock) text('🔒', x + 9, y + 9, 6, '#ccc', 'center', 600);
    });
    // details of the selected level
    const lv = LEVELS[sel], dy = gy + rows * (ch + gap) + 4, lock = sel > unlocked, b = best[lv.name.en];
    rrect(40, dy, W - 80, 62, 10, 'rgba(30,22,40,0.95)', '#8a6ab0', 1.6);
    text(`${sel + 1}. ${lv.name[lang]}`, W / 2, dy + 15, 13, lock ? '#bbb' : '#efe3c4', 'center', 700);
    if (lock) text('🔒 ' + tr('locked'), W / 2, dy + 40, 10, '#ccc', 'center', 600);
    else {
      const icons = Object.keys(lv.skills), iw = 22;
      icons.forEach((s, j) => Art.skillIcon(ctx, s, W / 2 - (icons.length - 1) * iw / 2 + j * iw, dy + 36, 17));
      text(`${tr('save')} ${lv.need}/${lv.count}` + (b !== undefined ? ` · ${tr('best')} ${b}` : ''), W / 2, dy + 54, 8, '#9a8a9a', 'center', 600);
    }
    text(`${tr('cont')}  ·  B ←`, W / 2, VH - 10, 9, '#fff', 'center', 600, '#0c0710');
    ctx.restore();
  }

  // ---------- loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    Ctl.update(dt);
    update(dt);
    draw(now / 1000);
    requestAnimationFrame(frame);
  }
  // dev shortcuts: #lv3 starts level 3 directly (joins P1), #coop joins both, #auto lets the scripted solution play
  if (hash.includes('select') && !/lv\d/.test(hash)) { joined[0] = true; go('select'); }
  const m = hash.match(/lv(\d+)/);
  if (m) {
    joined[0] = true; if (hash.includes('coop')) joined[1] = true;
    startLevel(Math.max(0, Math.min(LEVELS.length - 1, +m[1] - 1)));
    if (hash.includes('auto')) go('play');
    const ff = hash.match(/ff(\d+)/);   // #ff30 = fast-forward 30 s (screenshots / debugging)
    if (hash.includes('quiz')) { go('play'); for (let k = 0; k < 2; k++) if (active(k)) { offer[k] = true; if (!hash.includes('offer')) openCard(k); } }
    if (ff) { go('play'); for (let n = +ff[1] * HZ; n > 0 && !game.over; n--) { if (auto) auto.step(); game.step(); game.events.length = 0; } Art.updateTerrain(terr, game); if (hash.includes('stop')) Snd.music = () => {}; }
  }
  // dev/test hook (read-only): current screen and level, used by tools/harness.html
  window.__tap = { get scr() { return scr; }, get level() { return li; }, get coop() { return coop(); } };
  requestAnimationFrame(frame);
})();
