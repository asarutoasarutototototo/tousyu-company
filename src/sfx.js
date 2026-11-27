'use strict';
/* ============================================================
   LAMPWARDEN COMPANY — sfx.js
   Web Audio による効果音とジェネレーティブBGM(外部ファイル不使用)
   ============================================================ */
const SFX = (() => {
  let ctx = null, master = null, sfxBus = null, bgmBus = null, verb = null, noiseBuf = null;
  let muted = false, vol = .8, mode = null, timer = null, nextT = 0, step = 0, bar = 0;
  const A = 55; const hz = n => A * Math.pow(2, n / 12);
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = muted ? 0 : vol;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; master.connect(comp); comp.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = .85; sfxBus.connect(master);
      bgmBus = ctx.createGain(); bgmBus.gain.value = .5; bgmBus.connect(master);
      // 簡易リバーブ
      const len = ctx.sampleRate * 2.4, imp = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      verb = ctx.createConvolver(); verb.buffer = imp; const vg = ctx.createGain(); vg.gain.value = .32; verb.connect(vg); vg.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      return true;
    } catch (e) { ctx = null; return false; }
  }
  function tone(f, d, type, v, o) {
    if (!ctx) return; o = o || {}; const t = (o.at != null ? o.at : ctx.currentTime), osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type || 'sine'; osc.frequency.setValueAtTime(f, t); if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + d);
    if (o.det) osc.detune.value = o.det;
    const a = o.atk || .005; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    let n = osc; if (o.lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; osc.connect(fl); n = fl; }
    n.connect(g); g.connect(o.dest || sfxBus); if (o.rev) { const rg = ctx.createGain(); rg.gain.value = o.rev; g.connect(rg); rg.connect(verb); }
    osc.start(t); osc.stop(t + d + .05);
  }
  function noise(d, v, o) {
    if (!ctx) return; o = o || {}; const t = (o.at != null ? o.at : ctx.currentTime), s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.fc || 2000, t); if (o.to) f.frequency.exponentialRampToValueAtTime(Math.max(40, o.to), t + d); f.Q.value = o.q || 1;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + (o.atk || .004)); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(o.dest || sfxBus); if (o.rev) { const rg = ctx.createGain(); rg.gain.value = o.rev; g.connect(rg); rg.connect(verb); }
    s.start(t, Math.random()); s.stop(t + d + .05);
  }
  const R = {
    ui() { tone(880, .06, 'triangle', .12); tone(1320, .08, 'sine', .08, { at: ctx.currentTime + .03 }); },
    ok() { tone(660, .08, 'triangle', .14); tone(990, .12, 'triangle', .12, { at: ctx.currentTime + .06 }); tone(1480, .18, 'sine', .08, { at: ctx.currentTime + .12, rev: .3 }); },
    back() { tone(520, .09, 'triangle', .12, { to: 340 }); },
    deny() { tone(180, .14, 'square', .1, { to: 120 }); },
    pick() { tone(1100, .05, 'sine', .1); },
    turn() { tone(220, .5, 'sawtooth', .08, { to: 440, lp: 900, rev: .5 }); noise(.4, .05, { fc: 1200, to: 4000, rev: .3 }); },
    resolve() { tone(110, .4, 'sawtooth', .12, { to: 55, lp: 500 }); noise(.25, .1, { type: 'lowpass', fc: 600 }); },
    dash() { noise(.16, .1, { fc: 600, to: 3200, q: .8 }); },
    clash() { tone(70, .4, 'sine', .3, { to: 40 }); noise(.3, .12, { fc: 900, to: 200, type: 'lowpass' }); },
    flip(a) { const n = (a && a.n) || 2; for (let i = 0; i < n * 2; i++) { const t = ctx.currentTime + i * .045; tone(1900 + Math.random() * 800, .09, 'sine', .07, { at: t, rev: .25 }); } },
    count() { tone(660, .08, 'triangle', .09); },
    clashHit() { [880, 1320, 2110, 3140].forEach((f, i) => tone(f, .55 - i * .08, 'triangle', .13 / (i + 1), { rev: .4 })); noise(.12, .2, { fc: 3500, q: .6 }); tone(90, .25, 'sine', .25, { to: 50 }); },
    tie() { tone(500, .3, 'triangle', .1, { rev: .3 }); tone(503, .3, 'triangle', .1); },
    win() { tone(784, .2, 'triangle', .14, { rev: .4 }); tone(1175, .35, 'triangle', .12, { at: ctx.currentTime + .09, rev: .5 }); },
    lose() { tone(300, .35, 'sawtooth', .09, { to: 150, lp: 700 }); },
    slash(a) { const big = a && a.big; noise(.14, big ? .3 : .2, { fc: 5200, to: 900, q: .9 }); tone(420, .1, 'sawtooth', .08, { to: 120, lp: 1500 }); if (big) tone(70, .25, 'sine', .25, { to: 40 }); if (a && a.heads) tone(1760, .12, 'sine', .05, { rev: .3 }); },
    pierce(a) { const big = a && a.big; noise(.09, .22, { fc: 6000, to: 2500, q: 1.4 }); tone(1500, .09, 'square', .06, { to: 500, lp: 3000 }); if (big) tone(80, .22, 'sine', .22, { to: 45 }); },
    blunt(a) { tone(140, .28, 'sine', .38, { to: 38 }); noise(.16, .2, { type: 'lowpass', fc: 700, to: 150 }); tone(330, .1, 'triangle', .08, { to: 120 }); },
    stagger() { tone(55, .9, 'sine', .45, { to: 28 }); noise(.7, .22, { type: 'highpass', fc: 5000, to: 1200, rev: .4 }); [1568, 2093, 2637].forEach((f, i) => tone(f, .6, 'triangle', .07, { at: ctx.currentTime + .04 * i, rev: .5 })); },
    die() { tone(260, .9, 'sawtooth', .12, { to: 40, lp: 800, rev: .5 }); noise(.8, .14, { fc: 2500, to: 200, rev: .5 }); },
    panic() { for (let i = 0; i < 4; i++) tone(180 + i * 37, .8, 'sawtooth', .08, { det: i * 14, lp: 1400, rev: .3 }); noise(.5, .16, { fc: 3000, q: 2, to: 800 }); },
    ego() { noise(1.3, .22, { fc: 200, to: 5200, q: .7, atk: .6, rev: .5 }); tone(110, 1.3, 'sawtooth', .14, { to: 440, lp: 1600, atk: .8 }); tone(220, 1.3, 'sawtooth', .08, { to: 880, lp: 2400, atk: .9 }); },
    egoHit() { tone(60, 1, 'sine', .55, { to: 28 }); noise(.6, .35, { fc: 2200, to: 300, rev: .7 }); [523, 784, 1047, 1568].forEach((f, i) => tone(f, 1.2, 'triangle', .1, { rev: .8, at: ctx.currentTime + i * .02 })); },
    buff() { tone(880, .1, 'triangle', .09); tone(1320, .16, 'triangle', .08, { at: ctx.currentTime + .07, rev: .3 }); },
    debuff() { tone(400, .16, 'sawtooth', .07, { to: 220, lp: 900 }); },
    heal() { [660, 880, 1320].forEach((f, i) => tone(f, .3, 'sine', .08, { at: ctx.currentTime + i * .07, rev: .5 })); },
    dot() { noise(.18, .14, { fc: 1500, to: 300 }); tone(160, .15, 'sine', .15, { to: 70 }); },
    burst() { tone(120, .5, 'sine', .35, { to: 35 }); noise(.4, .25, { fc: 1800, to: 200, rev: .4 }); },
    count() { tone(1400, .05, 'square', .035); },
    stamp() { tone(140, .3, 'sine', .3, { to: 50 }); noise(.12, .15, { fc: 1500, to: 300 }); tone(880, .25, 'triangle', .06, { at: ctx.currentTime + .03, rev: .4 }); },
    warn() { [0, .32].forEach(d => tone(520, .3, 'sawtooth', .09, { to: 380, at: ctx.currentTime + d, lp: 1800 })); },
    slam() { tone(90, .7, 'sine', .45, { to: 30 }); noise(.5, .3, { fc: 2500, to: 150, rev: .5 }); tone(55, .9, 'sawtooth', .12, { to: 40, lp: 600 }); },
    lvup() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .45, 'triangle', .09, { at: ctx.currentTime + i * .07, rev: .5 })); },
    chap() { [392, 523, 659, 784].forEach((f, i) => tone(f, .9, 'triangle', .1, { at: ctx.currentTime + i * .16, rev: .7 })); tone(1047, 1.6, 'sine', .1, { at: ctx.currentTime + .7, rev: .8 }); tone(65, 1.2, 'sine', .35, { to: 33, at: ctx.currentTime + .65 }); },
    charge(a) { const d = (a && a.d) || 2; noise(d, .1, { fc: 200, to: 8000, q: .8, atk: d * .85, rev: .4 }); tone(90, d, 'sawtooth', .06, { to: 900, lp: 2600, atk: d * .9 }); tone(180, d, 'triangle', .05, { to: 1800, atk: d * .9 }); },
    tick() { tone(1200, .07, 'square', .04); tone(1800, .1, 'sine', .05, { at: ctx.currentTime + .06 }); },
    flip(a) { const r = (a && a.rare) || 0; if (r === 0) { noise(.18, .1, { fc: 2600, to: 700 }); tone(740, .3, 'triangle', .07, { rev: .3 }); } else { R.reveal({ rare: r }); if (r >= 2) R.burst(); } },
    gacha() { noise(1.2, .12, { fc: 300, to: 6000, q: .6, atk: .8, rev: .4 }); tone(220, 1.2, 'sawtooth', .08, { to: 880, lp: 2000, atk: .8 }); },
    reveal(a) { const r = (a && a.rare) || 0; const base = [523, 659, 784][Math.min(2, r)]; [1, 1.25, 1.5, 2].forEach((m, i) => tone(base * m, .8, 'triangle', .1, { at: ctx.currentTime + i * .06, rev: .6 })); if (r >= 2) { tone(60, 1, 'sine', .4, { to: 30 }); noise(.5, .2, { fc: 4000, rev: .6 }); } },
    gift() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, .5, 'sine', .09, { at: ctx.currentTime + i * .08, rev: .5 })); },
    coin() { tone(1568, .1, 'triangle', .08); tone(2093, .22, 'sine', .08, { at: ctx.currentTime + .06, rev: .4 }); }
  };
  function play(n, a) { if (!ctx || muted) return; try { const f = R[n]; if (f) f(a); } catch (e) { } }
  /* ---------- BGM ---------- */
  const PROG = [[0, 3, 7, 10], [-4, 0, 3, 7], [3, 7, 10, 14], [-2, 2, 5, 9]];
  const PENT = [0, 3, 5, 7, 10, 12, 15, 17, 19];
  function sched() {
    if (!ctx || !mode) return;
    const bpm = mode === 'menu' ? 66 : mode === 'boss' ? 126 : 108, sp = 60 / bpm / 2;
    while (nextT < ctx.currentTime + .8) {
      const s = step % 16, chord = PROG[Math.floor(step / 16) % 4], t = nextT;
      if (s === 0) { // パッド
        chord.forEach((n, i) => { [0, 7].forEach(d => tone(hz(n + 12 + (i === 3 ? 12 : 0)), sp * 16 + .5, 'sawtooth', mode === 'menu' ? .028 : .022, { at: t, det: d ? 6 : -6, lp: 700 + (mode === 'menu' ? 0 : 300), atk: 1.6, dest: bgmBus, rev: .5 })); });
        tone(hz(chord[0] - 12), sp * 16, 'sine', .12, { at: t, atk: .4, dest: bgmBus });
      }
      const pr = mode === 'menu' ? .32 : .5;
      if (Math.random() < pr && (s % 2 === 0 || Math.random() < .3)) { const n = PENT[(Math.random() * PENT.length) | 0] + chord[0] + 24; tone(hz(n), 1.4, 'sine', .05, { at: t, dest: bgmBus, rev: .8 }); tone(hz(n) * 2.01, .5, 'sine', .018, { at: t, dest: bgmBus, rev: .6 }); }
      if (mode !== 'menu') {
        if (s % 4 === 0) { tone(120, .22, 'sine', .38, { at: t, to: 38, dest: bgmBus }); }
        if (s % 8 === 4) noise(.18, .1, { at: t, fc: 1800, q: .8, dest: bgmBus });
        if (s % 2 === 1) noise(.04, .028, { at: t, type: 'highpass', fc: 7000, dest: bgmBus });
        if (s % 2 === 0) tone(hz(chord[0] - 12 + (s % 8 === 6 ? 7 : 0)), sp * 1.8, 'triangle', .13, { at: t, lp: 400, dest: bgmBus });
        if (mode === 'boss' && s % 4 === 2) noise(.1, .06, { at: t, fc: 3200, q: 1.2, dest: bgmBus });
      }
      nextT += sp; step++;
    }
  }
  function bgm(m) {
    if (m === mode) return; mode = m; if (!ctx) return;
    clearInterval(timer); if (!m) return; nextT = ctx.currentTime + .1; step = 0; timer = setInterval(sched, 120); sched();
  }
  return {
    init, play, bgm, get muted() { return muted; },
    setMute(m) { muted = m; if (master) master.gain.setTargetAtTime(m ? 0 : vol, ctx.currentTime, .05); },
    setVol(v) { vol = v; if (master && !muted) master.gain.setTargetAtTime(v, ctx.currentTime, .05); },
    resumeMode() { const m = mode; mode = null; bgm(m); },
    suspend() { try { if (ctx && ctx.state === 'running') ctx.suspend(); } catch (e) { } },
    resume() { try { if (ctx && ctx.state === 'suspended') ctx.resume(); } catch (e) { } }
  };
})();
