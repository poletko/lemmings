'use strict';
// Synthesized sounds and spooky music (WebAudio, no files).
const Snd = (() => {
  let ac = null, master, sfx, musicG, noise, musicOn = true, nextBeat = 0, beat = 0;
  try { musicOn = localStorage.getItem('tap-music') !== '0'; } catch (e) {}
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.gain.value = 0.6; master.connect(ac.destination);
    sfx = ac.createGain(); sfx.gain.value = 0.8; sfx.connect(master);
    musicG = ac.createGain(); musicG.gain.value = musicOn ? 0.2 : 0; musicG.connect(master);
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function tone(freq, vol, dur, type = 'square', delay = 0, slide = 0, out) {
    if (!ac) return;
    const t0 = ac.currentTime + delay;
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t0 + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(out || sfx); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function hiss(freq, vol, dur, delay = 0, type = 'bandpass') {
    if (!ac) return;
    const t0 = ac.currentTime + delay;
    const s = ac.createBufferSource(); s.buffer = noise;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = 1.2;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f).connect(g).connect(sfx); s.start(t0, Math.random() * 0.5, dur + 0.05);
  }
  let lastDig = 0;
  const play = {
    move() { tone(880, 0.05, 0.04, 'square'); },
    pick() { tone(660, 0.08, 0.06, 'square'); tone(990, 0.06, 0.08, 'square', 0.05); },
    deny() { tone(180, 0.1, 0.12, 'sawtooth'); },
    assign(p) { const b = p === 1 ? 523 : 659; tone(b, 0.12, 0.08, 'square'); tone(b * 1.5, 0.1, 0.12, 'square', 0.06); },
    release() { tone(700, 0.1, 0.15, 'triangle', 0, 1.6); },
    spawn() { tone(300, 0.08, 0.12, 'triangle', 0, 2.2); },
    saved() { tone(988, 0.1, 0.5, 'triangle'); tone(1319, 0.07, 0.6, 'sine', 0.08); },
    splat() { hiss(500, 0.4, 0.25, 0, 'lowpass'); tone(140, 0.2, 0.2, 'sine', 0, 0.4); },
    drown() { for (let i = 0; i < 4; i++) tone(400 + i * 120, 0.06, 0.06, 'sine', i * 0.06, 1.5); },
    lost() { tone(300, 0.1, 0.5, 'triangle', 0, 0.3); },
    float() { tone(1200, 0.04, 0.2, 'sine', 0, 0.6); },
    brick() { tone(1400, 0.035, 0.03, 'square'); },
    shrug() { tone(500, 0.08, 0.1, 'triangle'); tone(400, 0.08, 0.14, 'triangle', 0.1); },
    clang() { tone(1900, 0.12, 0.25, 'triangle'); tone(2800, 0.06, 0.2, 'sine'); },
    dig() { const n = performance.now(); if (n - lastDig < 90) return; lastDig = n; hiss(900, 0.12, 0.08); },
    land() {},
    open() { tone(200, 0.12, 0.4, 'sawtooth', 0, 1.5); hiss(2000, 0.1, 0.3); },
    win() { [587, 698, 880, 1175, 1109, 1175].forEach((f, i) => tone(f, 0.12, 0.35, 'triangle', i * 0.13)); },
    lose() { [440, 415, 392, 370, 349].forEach((f, i) => tone(f, 0.12, 0.4, 'sawtooth', i * 0.2, 0.97)); },
    ready() { tone(880, 0.1, 0.08, 'square'); tone(1320, 0.08, 0.12, 'square', 0.07); },
    offer() { tone(1568, 0.035, 0.5, 'sine'); tone(2093, 0.025, 0.6, 'sine', 0.12); },
    qok() { [784, 988, 1175].forEach((f, i) => tone(f, 0.08, 0.3, 'triangle', i * 0.08)); },
    qno() { tone(330, 0.08, 0.35, 'triangle', 0, 0.8); },
    fast() { tone(600, 0.07, 0.15, 'square', 0, 2); },
    boom() { hiss(300, 0.5, 0.5, 0, 'lowpass'); tone(90, 0.35, 0.4, 'sine', 0, 0.3); },
    jump() { tone(420, 0.06, 0.15, 'triangle', 0, 2.2); },
    pop() { hiss(3000, 0.2, 0.06); tone(900, 0.05, 0.08, 'square', 0, 0.5); },
    shoot() { hiss(1200, 0.2, 0.18); tone(220, 0.1, 0.15, 'sawtooth', 0, 0.5); },
    splash() { hiss(1600, 0.18, 0.25, 0, 'lowpass'); },
    thunk() { tone(260, 0.15, 0.08, 'square'); tone(180, 0.1, 0.12, 'triangle', 0.03); },
    zap() { tone(1800, 0.03, 0.08, 'sawtooth', 0, 0.4); },
    pour() { hiss(5000, 0.05, 0.2); },
    plant() { tone(1000, 0.04, 0.05, 'square'); tone(1000, 0.04, 0.05, 'square', 0.12); },
  };
  // ---- music: spooky little orchestra (music box, tuba, pizzicato, bone xylophone, theremin, choir, accordion) ----
  // Each track: step length in seconds and parts written as space-separated steps:
  // 'D4' note, 'F3+A3' chord, '.' rest, '-' hold previous. Drum parts use K kick, S snare, H hat, T tick, R rattle.
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const freq = n => { const m = n.match(/^([A-G])([#b]?)(-?\d)$/); const v = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12; return 440 * Math.pow(2, (v - 69) / 12); };
  function parse(str) {
    const toks = str.trim().split(/\s+/), ev = [];
    toks.forEach((t, i) => {
      if (t === '.' ) return;
      if (t === '-') { if (ev.length && ev[ev.length - 1].end === i) ev[ev.length - 1].end = i + 1; return; }
      ev.push({ step: i, end: i + 1, notes: t.split('+') });
    });
    return { len: toks.length, ev };
  }
  const TRACKS = {
    // D minor waltz, oom-pah-pah with music box melody and a theremin answering
    title: { step: 0.17, parts: [
      { inst: 'tuba', vol: 0.55, p: 'D2 . . . . . A1 . . . . . G2 . . . . . A1 . . . . . D2 . . . . . Bb1 . . . . . G1 . . . A1 . D2 . . . . .' },
      { inst: 'pizz', vol: 0.35, p: '. . F3+A3 . F3+A3 . . . F3+A3 . F3+A3 . . . G3+Bb3 . G3+Bb3 . . . G3+C#4 . E3+G3 . . . F3+A3 . F3+A3 . . . F3+Bb3 . F3+Bb3 . . . G3+Bb3 . E3+G3 . . . F3+A3 . F3+A3 .' },
      { inst: 'box', vol: 0.5, p: 'A4 - - D5 - E5 F5 - E5 D5 C#5 D5 G5 - - F5 E5 D5 C#5 - A4 - - - A4 - D5 - F5 A5 Bb5 - A5 - G5 F5 E5 - G5 F5 E5 C#5 D5 - - - . .' },
      { inst: 'theremin', vol: 0.18, p: '. . . . . . . . . . . . . . . . . . E5 - - - - - . . . . . . . . . . . . D6 - - - C#6 - D6 - - - - -' },
    ] },
    // E minor sneaking march: staccato tuba, bone xylophone, ticking drums
    lvl0: { step: 0.15, parts: [
      { inst: 'tuba', vol: 0.6, p: 'E2 . B1 . E2 . B1 . E2 . B1 . G2 . F#2 . C2 . G1 . C2 . G1 . B1 . F#2 . B1 . D#2 . E2 . B1 . E2 . B1 . E2 . B1 . G2 . F#2 . C2 . G1 . C2 . G1 . B1 . F#2 . B1 . . .' },
      { inst: 'bones', vol: 0.4, p: 'E5 . G5 . F#5 E5 D#5 E5 B4 . . . . . . . C5 . E5 . D#5 C5 B4 C5 D#5 . . . B4 . . . E5 G5 B5 . A5 G5 F#5 E5 D#5 . F#5 . B4 . . . C5 E5 G5 . F#5 E5 D#5 C5 B4 . D#5 . E5 . . .' },
      { inst: 'drum', vol: 0.5, p: 'K . T . S . T . K . T . S . T R K . T . S . T . K . T . S T T . K . T . S . T . K . T . S . T R K . T . S . T . K . R . S . K .' },
      { inst: 'choir', vol: 0.12, p: 'E4+G4+B4 - - - - - - - - - - - - - - - C4+E4+G4 - - - - - - - B3+D#4+F#4 - - - - - - - E4+G4+B4 - - - - - - - - - - - - - - - C4+E4+G4 - - - - - - - B3+D#4+F#4 - - - - - - -' },
    ] },
    // A minor music box lullaby with choir and a wailing theremin
    lvl1: { step: 0.19, parts: [
      { inst: 'box', vol: 0.4, p: 'A4 C5 E5 A5 C6 A5 E5 C5 F4 A4 C5 F5 A5 F5 C5 A4 D4 F4 A4 D5 F5 D5 A4 F4 E4 G#4 B4 E5 G#5 E5 B4 G#4' },
      { inst: 'choir', vol: 0.14, p: 'A3+C4+E4 - - - - - - - F3+A3+C4 - - - - - - - D3+F3+A3 - - - - - - - E3+G#3+B3 - - - - - - -' },
      { inst: 'theremin', vol: 0.2, p: 'E5 - - - - - - - F5 - - - E5 - - - D5 - - - - - - - G#4 - - - B4 - - -' },
      { inst: 'tuba', vol: 0.4, p: 'A1 - - - . . . . F1 - - - . . . . D2 - - - . . . . E2 - - - . . . .' },
    ] },
    // G minor graveyard tango: accordion, pizzicato bass, rattles
    lvl2: { step: 0.15, parts: [
      { inst: 'pizz', vol: 0.55, p: 'G2 . . G2 D2 . G2 . C3 . . C3 G2 . C3 . D2 . . D2 A1 . D2 . G2 . . G2 D2 . F#2 .' },
      { inst: 'accordion', vol: 0.22, p: 'D5 - - Eb5 D5 - C5 Bb4 Eb5 - - - D5 C5 Bb4 A4 A4 - - Bb4 A4 - G4 F#4 G4 - - - . . D5 .' },
      { inst: 'drum', vol: 0.45, p: 'K . . K S . R . K . . K S . R . K . . K S . R . K . . K S R R R' },
      { inst: 'bones', vol: 0.18, p: '. . . . . . . . . . . . . . G5 . . . . . . . . . . . . . . . . D6' },
    ] },
    // C minor creeping chromatic bass with clock ticks and bone xylophone
    lvl3: { step: 0.16, parts: [
      { inst: 'tuba', vol: 0.55, p: 'C2 . . C2 . . Eb2 . D2 . . D2 . . F2 . Eb2 . . Eb2 . . G2 . D2 . . D2 . . B1 .' },
      { inst: 'bones', vol: 0.35, p: 'G5 . Ab5 . G5 . Eb5 . F5 . G5 . F5 . D5 . Eb5 . F5 . Eb5 . C5 . D5 . Eb5 . D5 . B4 .' },
      { inst: 'drum', vol: 0.4, p: 'K T . T S T . T K T . T S T R T K T . T S T . T K T . T S T R R' },
      { inst: 'theremin', vol: 0.16, p: '. . . . . . . . . . . . . . . . C6 - - - B5 - - - Bb5 - - - A5 - Ab5 -' },
    ] },
    // maths break: tick-tock clock, slow chromatic bass, music box question marks
    quiz: { step: 0.25, parts: [
      { inst: 'drum', vol: 0.5, p: 'T . T . T . T . T . T . T . T R' },
      { inst: 'pizz', vol: 0.45, p: 'A2 . . . G#2 . . . G2 . . . F#2 . . .' },
      { inst: 'box', vol: 0.3, p: 'E5 . . A5 . . . . E5 . . G#5 . . . B5' },
    ] },
  };
  for (const k in TRACKS) for (const p of TRACKS[k].parts) Object.assign(p, parse(p.p));

  function env(g, t0, a, peak, dur, rel) {
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.setValueAtTime(peak, t0 + Math.max(a, dur)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(a, dur) + rel);
  }
  function osc(type, f, t0, t1, out, detune = 0) {
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t0); o.detune.value = detune;
    o.connect(out); o.start(t0); o.stop(t1 + 0.05); return o;
  }
  const lastF = {};
  const INST = {
    box(f, t0, dur, v) {   // music box / celesta: bright, ringing
      const g = ac.createGain(); g.connect(musicG);
      g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
      osc('triangle', f, t0, t0 + 1.4, g);
      const g2 = ac.createGain(); g2.connect(musicG); g2.gain.setValueAtTime(v * 0.25, t0); g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
      osc('sine', f * 4, t0, t0 + 0.3, g2);
    },
    pizz(f, t0, dur, v) {
      const g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
      lp.connect(g).connect(musicG);
      g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
      osc('triangle', f, t0, t0 + 0.3, lp); osc('sawtooth', f, t0, t0 + 0.08, lp);
    },
    tuba(f, t0, dur, v) {
      const g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(260, t0); lp.frequency.linearRampToValueAtTime(700, t0 + 0.05); lp.frequency.linearRampToValueAtTime(380, t0 + 0.2);
      lp.connect(g).connect(musicG);
      env(g, t0, 0.025, v, dur * 0.7, 0.12);
      osc('sawtooth', f, t0, t0 + dur + 0.2, lp);
    },
    bones(f, t0, dur, v) {   // hollow wooden/bone xylophone
      const g = ac.createGain(); g.connect(musicG);
      g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
      osc('sine', f, t0, t0 + 0.2, g); osc('sine', f * 3.93, t0, t0 + 0.05, g);
      noiseHit(t0, 4000, 0.15 * v, 0.02, 'bandpass');
    },
    theremin(f, t0, dur, v, key) {   // wobbly glide
      const g = ac.createGain(); g.connect(musicG);
      env(g, t0, 0.18, v, dur, 0.25);
      const o = ac.createOscillator(); o.type = 'sine';
      const from = lastF[key] || f;
      o.frequency.setValueAtTime(from, t0); o.frequency.exponentialRampToValueAtTime(f, t0 + 0.12);
      const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 5.5; lg.gain.value = f * 0.018;
      lfo.connect(lg).connect(o.frequency); lfo.start(t0); lfo.stop(t0 + dur + 0.4);
      o.connect(g); o.start(t0); o.stop(t0 + dur + 0.4);
      lastF[key] = f;
    },
    choir(f, t0, dur, v) {   // "oooh" pad
      const g = ac.createGain(), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = 1.4;
      bp.connect(g).connect(musicG);
      env(g, t0, 0.35, v, dur, 0.5);
      for (const d of [-9, 0, 8]) osc('sawtooth', f, t0, t0 + dur + 0.6, bp, d);
    },
    accordion(f, t0, dur, v) {
      const g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1700;
      lp.connect(g).connect(musicG);
      env(g, t0, 0.03, v, dur * 0.9, 0.08);
      osc('square', f, t0, t0 + dur + 0.1, lp, -6); osc('sawtooth', f, t0, t0 + dur + 0.1, lp, 7);
      const tr = ac.createOscillator(), tg = ac.createGain(); tr.frequency.value = 6; tg.gain.value = v * 0.25; tr.connect(tg).connect(g.gain); tr.start(t0); tr.stop(t0 + dur + 0.1);
    },
  };
  function noiseHit(t0, f, v, dur, type = 'highpass') {
    const s = ac.createBufferSource(); s.buffer = noise;
    const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f;
    const g = ac.createGain(); g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(fl).connect(g).connect(musicG); s.start(t0, Math.random() * 0.5, dur + 0.05);
  }
  function drum(ch, t0, v) {
    if (ch === 'K') { const g = ac.createGain(); g.connect(musicG); g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25); const o = ac.createOscillator(); o.frequency.setValueAtTime(110, t0); o.frequency.exponentialRampToValueAtTime(38, t0 + 0.2); o.connect(g); o.start(t0); o.stop(t0 + 0.3); }
    else if (ch === 'S') noiseHit(t0, 1600, v * 0.45, 0.12, 'bandpass');
    else if (ch === 'H') noiseHit(t0, 7000, v * 0.2, 0.04);
    else if (ch === 'T') { const g = ac.createGain(); g.connect(musicG); g.gain.setValueAtTime(v * 0.3, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05); osc('sine', 1900, t0, t0 + 0.06, g); }
    else if (ch === 'R') for (let i = 0; i < 4; i++) noiseHit(t0 + i * 0.025, 3000, v * 0.25, 0.02, 'bandpass');
  }
  let curTrack = null, stepIdx = 0;
  function music(speed, track = 'title') {
    if (!ac || !musicOn) return;
    const tr = TRACKS[track] || TRACKS.title;
    if (track !== curTrack) { curTrack = track; stepIdx = 0; nextBeat = ac.currentTime + 0.1; }
    const step = tr.step / speed;
    if (nextBeat < ac.currentTime) nextBeat = ac.currentTime + 0.05;
    while (nextBeat < ac.currentTime + 0.25) {
      for (let pi = 0; pi < tr.parts.length; pi++) {
        const p = tr.parts[pi], s = stepIdx % p.len;
        for (const e of p.ev) {
          if (e.step !== s) continue;
          if (p.inst === 'drum') { for (const n of e.notes) for (const ch of n) drum(ch, nextBeat, p.vol); continue; }
          for (const n of e.notes) INST[p.inst](freq(n), nextBeat, (e.end - e.step) * step, p.vol / Math.sqrt(e.notes.length), track + pi);
        }
      }
      nextBeat += step; stepIdx++;
    }
  }
  function toggleMusic() {
    musicOn = !musicOn;
    try { localStorage.setItem('tap-music', musicOn ? '1' : '0'); } catch (e) {}
    if (musicG) musicG.gain.value = musicOn ? 0.2 : 0;
    return musicOn;
  }
  // dev check: schedules every event of every track once (used by a headless smoke test)
  function selfTest() { for (const k in TRACKS) for (const [pi, p] of TRACKS[k].parts.entries()) for (const e of p.ev) { if (p.inst === 'drum') { for (const n of e.notes) for (const ch of n) drum(ch, ac.currentTime + 5, 0); } else for (const n of e.notes) INST[p.inst](freq(n), ac.currentTime + 5, 0.1, 0.0001, k + pi); } return true; }
  return { selfTest, init, play: (n, a) => play[n] && play[n](a), music, toggleMusic, get musicOn() { return musicOn; } };
})();
// Browsers unlock audio only on a real click / key press (gamepad buttons do not count).
for (const ev of ['pointerdown', 'keydown', 'touchstart']) addEventListener(ev, () => Snd.init(), { passive: true });
