'use strict';
/* ============================================================
   LAMPWARDEN COMPANY — audio.js  (WebAudio 合成: BGM + SE)
   ============================================================ */
const Snd = (() => {
  let ac = null, master, mus, sfx, comp, on = true, mood = 'menu', timer = null, step = 0, noiseBuf = null, drone = null, vol = { m: .5, s: .8 };
  const PENT = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22];
  const hz = (n, base) => (base || 55) * Math.pow(2, n / 12);
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ac.destination);
    master = ac.createGain(); master.gain.value = on ? .75 : 0; master.connect(comp);
    mus = ac.createGain(); mus.gain.value = vol.m; mus.connect(master);
    sfx = ac.createGain(); sfx.gain.value = vol.s; sfx.connect(master);
    const n = ac.sampleRate * 1.5; noiseBuf = ac.createBuffer(1, n, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    startDrone(); loop();
  }
  function setOn(v) { on = v; if (master) master.gain.setTargetAtTime(v ? .75 : 0, ac.currentTime, .05); }
  function isOn() { return on; }
  function tone(f, t0, dur, type, v, dest, f2, a) {
    if (!ac) return; const o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + (a || .005)); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur); o.connect(g); g.connect(dest || sfx); o.start(t0); o.stop(t0 + dur + .05);
  }
  function noise(t0, dur, v, hp, lp, dest) {
    if (!ac) return; const s = ac.createBufferSource(); s.buffer = noiseBuf; const g = ac.createGain(), f1 = ac.createBiquadFilter(), f2 = ac.createBiquadFilter();
    f1.type = 'highpass'; f1.frequency.value = hp || 200; f2.type = 'lowpass'; f2.frequency.value = lp || 8000;
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur); s.connect(f1); f1.connect(f2); f2.connect(g); g.connect(dest || sfx); s.start(t0, Math.random()); s.stop(t0 + dur + .05);
  }
  function startDrone() {
    const t = ac.currentTime; drone = [];
    [[0, .09], [7, .05], [12, .035]].forEach(([n, v]) => { const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter(), l = ac.createOscillator(), lg = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = hz(n, 55); f.type = 'lowpass'; f.frequency.value = 380; g.gain.value = v; l.frequency.value = .07 + n * .01; lg.gain.value = 120; l.connect(lg); lg.connect(f.frequency); o.connect(f); f.connect(g); g.connect(mus); o.start(t); l.start(t); drone.push(g); });
  }
  function loop() {
    if (!ac) return; const t = ac.currentTime + .05, M = { menu: { bpm: 54, p: .55, dr: 1 }, battle: { bpm: 100, p: .8, dr: 1.4 }, boss: { bpm: 112, p: .9, dr: 1.8 }, calm: { bpm: 44, p: .4, dr: .7 } }[mood] || { bpm: 54, p: .5, dr: 1 };
    const spb = 60 / M.bpm / 2; drone.forEach((g, i) => g.gain.setTargetAtTime([.09, .05, .035][i] * M.dr, ac.currentTime, .8));
    if (Math.random() < M.p) { const n = PENT[(Math.random() * PENT.length) | 0]; tone(hz(n + 12, 110), t, 2.4, 'sine', .07, mus); tone(hz(n + 24, 110), t, 1.2, 'triangle', .025, mus); }
    if (mood === 'battle' || mood === 'boss') {
      if (step % 4 === 0) { tone(90, t, .3, 'sine', .22, mus, 40); noise(t, .06, .05, 2000, 9000, mus); }
      if (step % 4 === 2 && mood === 'boss') tone(70, t, .25, 'sawtooth', .06, mus, 35);
      if (step % 8 === 6) noise(t, .12, .04, 5000, 12000, mus);
    }
    step++; timer = setTimeout(loop, spb * 1000);
  }
  function setMood(m) { mood = m; }
  const S = {
    click() { if (!ac) return; const t = ac.currentTime; tone(880, t, .08, 'square', .05, null, 1200); },
    hover() { if (!ac) return; tone(1500, ac.currentTime, .03, 'sine', .02); },
    back() { if (!ac) return; const t = ac.currentTime; tone(600, t, .1, 'triangle', .06, null, 300); },
    coin(h) { if (!ac) return; const t = ac.currentTime; tone(h ? 1568 : 988, t, .35, 'sine', .08, null, null, .002); tone(h ? 2349 : 1318, t + .01, .25, 'triangle', .04); },
    flip() { if (!ac) return; const t = ac.currentTime; for (let i = 0; i < 4; i++) tone(1200 + i * 200, t + i * .06, .05, 'square', .02); },
    clash() { if (!ac) return; const t = ac.currentTime; noise(t, .18, .22, 1500, 10000); tone(1800, t, .25, 'square', .06, null, 700); tone(2400, t, .2, 'triangle', .05, null, 1000); },
    hit(big) { if (!ac) return; const t = ac.currentTime; noise(t, .12 + big * .1, .22 + big * .15, 200, 6000); tone(150, t, .18, 'sine', .3 + big * .2, null, 50); },
    slash() { if (!ac) return; const t = ac.currentTime; noise(t, .16, .1, 3000, 14000); tone(1400, t, .12, 'sawtooth', .03, null, 300); },
    crit() { if (!ac) return; const t = ac.currentTime; tone(1200, t, .3, 'square', .06, null, 2400); noise(t, .2, .2, 800, 9000); },
    stagger() { if (!ac) return; const t = ac.currentTime; tone(220, t, .6, 'sawtooth', .16, null, 55); noise(t, .45, .3, 100, 4000); tone(880, t + .05, .5, 'sine', .08, null, 440); },
    ego() { if (!ac) return; const t = ac.currentTime; for (let i = 0; i < 5; i++) tone(hz(i * 5, 110), t + i * .09, 1.4, 'sawtooth', .05, null, hz(i * 5 + 12, 110)); noise(t, 1.2, .12, 400, 3000); tone(60, t + .5, 1.2, 'sine', .35, null, 30); },
    panic() { if (!ac) return; const t = ac.currentTime; tone(400, t, .6, 'sawtooth', .12, null, 90); tone(430, t, .6, 'sawtooth', .1, null, 95); noise(t, .5, .2, 600, 9000); },
    heal() { if (!ac) return; const t = ac.currentTime; [0, 4, 7, 12].forEach((n, i) => tone(hz(n + 36, 110), t + i * .06, .5, 'sine', .05)); },
    die() { if (!ac) return; const t = ac.currentTime; tone(300, t, .8, 'sawtooth', .1, null, 40); noise(t, .6, .2, 100, 3000); },
    win() { if (!ac) return; const t = ac.currentTime; [0, 4, 7, 12, 16, 19].forEach((n, i) => { tone(hz(n + 36, 110), t + i * .11, 1.2, 'triangle', .09); tone(hz(n + 48, 110), t + i * .11, .9, 'sine', .04); }); },
    lose() { if (!ac) return; const t = ac.currentTime; [12, 8, 5, 0].forEach((n, i) => tone(hz(n + 24, 110), t + i * .25, 1.4, 'sawtooth', .06, null, hz(n + 22, 110))); },
    pull() { if (!ac) return; const t = ac.currentTime; for (let i = 0; i < 12; i++) tone(500 + i * 90, t + i * .05, .2, 'sine', .04); noise(t + .5, .5, .1, 2000, 12000); },
    rare() { if (!ac) return; const t = ac.currentTime; [0, 7, 12, 19, 24].forEach((n, i) => tone(hz(n + 36, 110), t + i * .08, 1.6, 'triangle', .08)); noise(t, .8, .12, 3000, 14000); tone(55, t, 1.2, 'sine', .3, null, 28); },
    buy() { if (!ac) return; const t = ac.currentTime; tone(1568, t, .1, 'square', .05); tone(2093, t + .08, .2, 'square', .05); },
    deny() { if (!ac) return; const t = ac.currentTime; tone(160, t, .15, 'square', .08); tone(130, t + .1, .2, 'square', .08); },
    levelup() { if (!ac) return; const t = ac.currentTime; [0, 7, 12].forEach((n, i) => tone(hz(n + 48, 110), t + i * .07, .4, 'triangle', .06)); },
    turn() { if (!ac) return; const t = ac.currentTime; tone(110, t, .5, 'sine', .15, null, 55); noise(t, .1, .06, 1000, 5000); },
    swap() { if (!ac) return; const t = ac.currentTime; tone(700, t, .05, 'square', .03); }
  };
  return { init, setOn, isOn, setMood, S, get ac() { return ac; } };
})();
