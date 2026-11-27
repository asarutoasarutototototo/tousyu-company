'use strict';
/* ============================================================
   LAMPWARDEN COMPANY — gfx_battle.js  (戦闘ビュー v2)
   配置・カメラ・モーション再生・コインクラッシュ演出・攻撃処理
   描画系は gfx_btl_draw.js
   ============================================================ */
const FONT = (w, s) => `${w} ${s}px Oswald, "Zen Kaku Gothic New", "Hiragino Sans", "Noto Sans JP", sans-serif`;
const REST_Z = .82, REST_X = 640, REST_Y = 392;
/* 味方の配置(ワールド座標)。前列は手前(y大)・後列は半歩ずらして重なりを避ける */
function allySpots(n) {
  const T = {
    1: [[400, 596]],
    2: [[470, 606], [300, 560]],
    3: [[500, 610], [340, 562], [180, 610]],
    4: [[520, 612], [390, 560], [260, 612], [130, 560]],
    5: [[540, 614], [425, 558], [310, 614], [195, 558], [80, 614]],
    6: [[540, 616], [340, 616], [140, 616], [440, 552], [240, 552], [40, 552]]
  };
  return T[Math.max(1, Math.min(6, n))].map(q => [q[0] - 45, q[1]]);
}
function enemySpots(n) {
  const T = {
    1: [[930, 584]],
    2: [[860, 604], [1070, 556]],
    3: [[780, 556], [960, 604], [1140, 556]],
    4: [[700, 556], [880, 604], [1060, 556], [1240, 604]],
    5: [[640, 604], [800, 556], [960, 604], [1120, 556], [1250, 604]]
  };
  return T[Math.max(1, Math.min(5, n))];
}
const ENEMY_SC = { moth: .58, hound: .7, puppet: .54, shade: .5, armor: .5, chorus: .5, clock: .44 };
/* 実測した絵の頭頂高(プレート・ダメージ表示の基準) */
const ENEMY_TOP = { moth: 600, hound: 240, puppet: 520, shade: 560, armor: 530, chorus: 555, clock: 570 };
const ENEMY_APPR = { moth: 'flutter', hound: 'leap', puppet: 'jerk', shade: 'glide', armor: 'stomp', chorus: 'glide', clock: 'glide' };
const ENEMY_COL = { moth: '#c9a8ff', hound: '#ff6b6b', puppet: '#e6c27a', shade: '#9a7bff', armor: '#ffb347', chorus: '#ff9ac0', clock: '#f0c44f' };
const w2sx = (x, cam, z) => (x - cam.fx) * z + BW / 2;
const w2sy = (y, cam, z) => (y - cam.fy) * z + BH / 2;

class BattleView {
  constructor(cv) {
    this.cv = cv; this.ctx = cv.getContext('2d'); this.Q = 1; this.vus = []; this.parts = []; this.fx = []; this.tw = []; this.anims = []; this.timers = []; this.banners = [];
    this.clock = 0; this.spd = 1; this.hold = 0; this.t = 0; this.resetCam(true); this.shake = 0; this.shakeV = 0; this.shakeA = 0; this.flash = 0; this.glitch = 0; this.dim = 0; this.speed = 0; this.spx = 640; this.spy = 360; this.hurt = 0;
    this.clashUI = null; this.cut = null; this.bg = null; this.battle = null; this.running = false; this.last = 0; this.onSync = null; this.R = {}; this.att = null; this.bossUI = null; this.planMode = false; this.tick = 0; this.chroma = 0;
    this.sfx = (n, a) => { if (typeof SFX !== 'undefined') SFX.play(n, a); };
    this.fit();
  }
  resetCam(now) { this.cam = { fx: REST_X, fy: REST_Y, z: REST_Z, tx: REST_X, ty: REST_Y, tz: REST_Z, kx: 0, ky: 0, pz: 0 }; }
  fit() { const r = this.cv.getBoundingClientRect(); const w = Math.max(r.width, r.height) || 1280; this.Q = clamp(w * (window.devicePixelRatio || 1) / BW, .75, 1.5); this.cv.width = Math.round(BW * this.Q); this.cv.height = Math.round(BH * this.Q); }
  setup(battle, theme) {
    this.battle = battle; this.bg = new Background(theme); this.vus = []; this.parts = []; this.fx = []; this.tw = []; this.anims = []; this.timers = []; this.banners = []; this.clashUI = null; this.cut = null; this.att = null; this.resetCam(true);
    const al = battle.side('A'), en = battle.side('E');
    const aS = allySpots(al.length), eS = enemySpots(en.length);
    const bossI = en.findIndex(e => e.boss);
    const order = en.map((e, i) => i); // 配置: ボスは中央・手前寄りに
    if (bossI >= 0) { const mid = en.length <= 2 ? 0 : 1; const t = order[mid]; order[mid] = order[bossI]; order[bossI] = t; }
    al.forEach((u, i) => { const sp = aS[i] || aS[aS.length - 1], crowd = al.length >= 5 ? .88 : al.length === 4 ? .94 : 1; this.vus[u.id] = this.mkVu(u, sp[0], sp[1], (sp[1] > 580 ? .5 : .45) * crowd, 1); });
    en.forEach((u, i) => { const slot = order.indexOf(i); const sp = eS[slot] || eS[0]; const sc = (ENEMY_SC[u.art] || .5) * u.sc * (u.boss ? .95 : 1) * (sp[1] > 580 ? 1 : .93); this.vus[u.id] = this.mkVu(u, sp[0], sp[1], sc, -1); });
    this.vus.forEach(v => { if (v) this.sync1(v, battle.snap(v.u)); });
    this.R = Object.assign({}, battle.res);
    const boss = en.find(e => e.boss); this.bossUI = boss ? this.vus[boss.id] : null;
    al.forEach(u => { if (!u.alive) { const v = this.vus[u.id]; v.alpha = 0; v.dead = true; } }); this.abort = false;
  }
  mkVu(u, x, y, sc, face) {
    const hh = u.isAlly ? 635 * sc * ((u.look && u.look.h) || 1) : (ENEMY_TOP[u.art] || ENEMY_H[u.art] || 440) * sc;
    const z = REST_Z;
    return {
      u, x, y, hx: x, hy: y, ox: 0, oy: 0, sc, face, t0: Math.random() * 10, mv: null, bl: null, cur: null, expr: 'n', exprT: 0, flash: 0, kneel: 0, alpha: 1, dead: false, glow: 0, d: null,
      frOv: null, frUntil: 0, hpv: u.hp, hpg: u.hp, spv: u.sp, jy: 0, lean: 0, sq: 0, hh, ghostOn: false, gT: 0, ghosts: [], trail: [], trailCol: '#fff', auraT: 0, die: 0, dizzy: 0, hitT: 0,
      sp: { x: 0, vx: 0, y: 0, vy: 0, r: 0, vr: 0, s: 0, vs: 0 },
      /* 画面座標(待機カメラ時)。UIオーバーレイ用 */
      px: (x - REST_X) * z + BW / 2, py: (y - REST_Y) * z + BH / 2, ph: hh * z, pw: Math.max(96, 250 * sc * z)
    };
  }
  sync1(v, s) { v.d = s; }
  syncEv(ev) { if (!ev.S) return; ev.S.forEach((s, i) => { if (this.vus[i]) this.vus[i].d = s; }); this.R = ev.R || this.R; if (this.onSync) this.onSync(ev); }
  vu(i) { return this.vus[i]; }
  setFr(v, id, ms) { v.frOv = id; v.frUntil = this.clock + ms; }
  /* ---------- 時間・トゥイーン ---------- */
  wait(ms) { return new Promise(res => this.timers.push({ at: this.clock + ms, res })); }
  tween(o, props, ms, ef) {
    return new Promise(res => { const from = {}; for (const k in props) from[k] = o[k]; this.tw.push({ o, from, to: props, t0: this.clock, d: Math.max(1, ms), e: ef || ease.out, res }); });
  }
  /* フレーム毎に fn(p) を呼ぶ汎用アニメ */
  anim(ms, fn, ef) { return new Promise(res => this.anims.push({ t0: this.clock, d: Math.max(1, ms), fn, e: ef || (p => p), res })); }
  start() { if (this.running) return; this.running = true; this.last = performance.now(); const loop = (ts) => { if (!this.running) return; const dt = Math.min(.05, (ts - this.last) / 1000); this.last = ts; this.frame(dt); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  stop() { this.running = false; }
  frame(dt) {
    let edt = dt; if (this.hold > 0) { this.hold -= dt * 1000; edt = dt * .06; }
    const gdt = edt * this.spd; this.t += edt; this.clock += gdt * 1000; this.tick++;
    for (let i = this.tw.length - 1; i >= 0; i--) { const w = this.tw[i], p = Math.min(1, (this.clock - w.t0) / w.d), e = w.e(p); for (const k in w.to) w.o[k] = w.from[k] + (w.to[k] - w.from[k]) * e; if (p >= 1) { this.tw.splice(i, 1); w.res(); } }
    if (this.anims.length) { const list = this.anims.slice(); for (const a of list) { const p = Math.min(1, (this.clock - a.t0) / a.d); a.fn(a.e(p)); if (p >= 1) { const ix = this.anims.indexOf(a); if (ix >= 0) this.anims.splice(ix, 1); a.res(); } } }
    for (let i = this.timers.length - 1; i >= 0; i--) { const w = this.timers[i]; if (this.clock >= w.at) { this.timers.splice(i, 1); w.res(); } }
    this.update(gdt, edt); this.render();
  }
  /* ---------- 姿勢(ポーズ・体の動き)の算出 ---------- */
  motion(v, pov) {
    const u = v.u, mv = v.mv, t = this.t + v.t0; let m;
    const KEYS = ['hx', 'hy', 'ang', 'dx', 'dy', 'rot', 'sx', 'sy'];
    if (u.isAlly) {
      const b = POSES.idle(t); m = { hx: b.hx, hy: b.hy, ang: b.ang, dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, al: 1 };
      if (mv && mv.S) {
        const p = pov == null ? mv.p : pov, s = kfSample(mv.S.kf, p);
        m.hx = s.hx; m.hy = s.hy; m.ang = s.ang; m.dx = s.dx; m.dy = s.dy; m.rot = s.rot; m.sy = s.sy; m.sx = s.sx == null ? 1 : s.sx;
        if (mv.S.extra) { const e = mv.S.extra(p); if (e.sx != null) m.sx = e.sx; }
      } else if (mv && mv.def && mv.def.f && mv.def.img) { const p = pov == null ? mv.p : pov, r = mv.def.f(p); m.dx = r.dx || 0; m.dy = r.dy || 0; m.rot = r.rot || 0; m.sx = r.sx == null ? 1 : r.sx; m.sy = r.sy == null ? 1 : r.sy; if (r.al != null) m.al = r.al; }
      else if (v.d && v.d.stag > 0 && !isImgUnit(u)) { const h = POSES.hurt; m.hx = lerp(m.hx, h.hx, .8); m.hy = lerp(m.hy, h.hy, .8); m.ang = lerp(m.ang, h.ang, .8); }
    } else {
      m = { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, al: 1 };
      if (mv && mv.def) { const p = pov == null ? mv.p : pov, r = mv.def.f(p); m.dx = r.dx || 0; m.dy = r.dy || 0; m.rot = r.rot || 0; m.sx = r.sx == null ? 1 : r.sx; m.sy = r.sy == null ? 1 : r.sy; if (r.alpha != null) m.al = r.alpha; }
    }
    if (pov == null && v.bl && v.bl.from && v.bl.t < 1) { const e = ease.io(v.bl.t), f = v.bl.from; for (const k of KEYS) if (m[k] != null && f[k] != null) m[k] = lerp(f[k], m[k], e); }
    return m;
  }
  /* 描画位置(足元)。ジャンプ・スプリング・体の動きを合成 */
  place(v, m) {
    const x = v.x + v.ox + v.sp.x + v.face * m.dx * v.sc;
    const y = v.y + v.oy + v.sp.y + m.dy * v.sc - v.jy;
    return { x, y };
  }
  update(dt, edt) {
    const cam = this.cam, k = 1 - Math.pow(.0006, edt * this.spd * .9);
    cam.fx += (cam.tx - cam.fx) * k; cam.fy += (cam.ty - cam.fy) * k; cam.z += (cam.tz - cam.z) * k;
    cam.kx *= Math.pow(.0009, dt); cam.ky *= Math.pow(.0009, dt); cam.pz *= Math.pow(.0016, dt);
    this.shake *= Math.pow(.02, dt); this.shakeV *= Math.pow(.004, dt); this.flash = Math.max(0, this.flash - dt * 3.2); this.glitch = Math.max(0, this.glitch - dt * 1.8); this.chroma = Math.max(0, this.chroma - dt * 3);
    this.speed = Math.max(0, this.speed - dt * 2.8); this.hurt = Math.max(0, this.hurt - dt * 1.7);
    const nSub = Math.max(1, Math.ceil(dt / .016)), h = dt / nSub;
    for (const v of this.vus) {
      if (!v) continue;
      v.flash = Math.max(0, v.flash - dt * 6); v.glow = Math.max(0, v.glow - dt * 1.2); v.hitT = Math.max(0, v.hitT - dt);
      if (v.exprT > 0) { v.exprT -= dt * 1000; if (v.exprT <= 0) v.expr = 'n'; }
      if (v.bl && v.bl.t < 1) v.bl.t = Math.min(1, v.bl.t + dt * 1000 / 120);
      // 受けた反動のスプリング
      const S = v.sp;
      for (let i = 0; i < nSub; i++) {
        S.vx += (-150 * S.x - 9 * S.vx) * h; S.x += S.vx * h; S.vy += (-130 * S.y - 9 * S.vy) * h; S.y += S.vy * h;
        S.vr += (-230 * S.r - 11 * S.vr) * h; S.r += S.vr * h; S.vs += (-300 * S.s - 12 * S.vs) * h; S.s += S.vs * h;
      }
      const d = v.d; if (!d) continue;
      const kk = 1 - Math.pow(.0008, dt); v.hpv += (d.hp - v.hpv) * kk * 1.4; v.spv += (d.sp - v.spv) * kk;
      if (Math.abs(v.hpv - d.hp) < .4) v.hpv = d.hp;
      if (v.hpg < v.hpv) v.hpg = v.hpv; else v.hpg += (v.hpv - v.hpg) * Math.min(1, dt * 2.2);
      v.dizzy += dt * (d.stag > 0 ? 1 : 0);
      // 現在の体の動き・軌跡・残像
      const m = this.motion(v); v.cur = m; const u = v.u, pl = this.place(v, m);
      const mv = v.mv, SW = mv && mv.S;
      if (u.isAlly && SW && SW.trail && mv.p >= SW.trail[0] - .001 && mv.lp <= SW.trail[1] + .05) {
        const p0 = Math.max(SW.trail[0], mv.lp), p1 = Math.min(SW.trail[1] + .05, mv.p), steps = 4;
        for (let i = 1; i <= steps; i++) {
          const mm = this.motion(v, lerp(p0, p1, i / steps)), q = this.place(v, mm), w = weaponTip(u.look, mm, q.x, q.y, v.sc, v.face);
          v.trail.push({ tx: w.tip[0], ty: w.tip[1], ix: lerp(w.tip[0], w.hand[0], .5), iy: lerp(w.tip[1], w.hand[1], .5), age: (steps - i) * dt / steps, col: v.trailCol });
        }
      }
      for (let i = v.trail.length - 1; i >= 0; i--) { const q = v.trail[i]; q.age += dt; if (q.age > .24) v.trail.splice(0, i + 1), i = -1; }
      if (v.trail.length > 40) v.trail.splice(0, v.trail.length - 40);
      const fastSwing = SW && SW.heavy && SW.trail && mv.p > SW.trail[0] - .1 && mv.p < SW.trail[1];
      const enemyMove = !u.isAlly && mv && mv.def && mv.p > .2 && mv.p < .72 && !mv.def.range;
      if (v.ghostOn || fastSwing || enemyMove) {
        v.gT -= dt; if (v.gT <= 0) { v.gT = .042; v.ghosts.push({ x: pl.x, y: pl.y, m: Object.assign({}, m), age: 0, life: .3, col: u.isAlly ? SIN[u.sinc].c : (ENEMY_COL[u.art] || '#fff'), rot: v.lean + v.sp.r, sq: v.sq, fr: isImgUnit(u) ? imgFrame(this, v) : null }); if (v.ghosts.length > 6) v.ghosts.shift(); }
      }
      for (let i = v.ghosts.length - 1; i >= 0; i--) { const g = v.ghosts[i]; g.age += dt; if (g.age >= g.life) v.ghosts.splice(i, 1); }
      // 状態異常オーラ
      v.auraT -= dt; if (v.auraT <= 0 && d.alive) {
        v.auraT = .09; const cx = v.x + v.sp.x, cy = v.y - v.hh * .4;
        d.st.forEach(s => {
          const k = s[0];
          if (k === 'burn') this.spark(cx + (Math.random() - .5) * 50, cy + 30, '#ff8a3d', 1, { vy: -60 - Math.random() * 40, life: .7, size: 4, g: -30, shape: 'ember' });
          if (k === 'bleed' && Math.random() < .5) this.spark(cx + (Math.random() - .5) * 40, cy, '#e0314b', 1, { vy: 40, life: .8, size: 3, g: 200, shape: 'drop' });
          if (k === 'tremor') this.spark(cx + (Math.random() - .5) * 60, cy + Math.random() * 40, '#c9b8ff', 1, { life: .3, size: 2, vx: (Math.random() - .5) * 120 });
          if (k === 'sink' && Math.random() < .5) this.spark(cx + (Math.random() - .5) * 50, cy - 40, '#5b86e0', 1, { vy: 50, life: .8, size: 3 });
          if (k === 'charge' && Math.random() < .6) this.spark(cx + (Math.random() - .5) * 50, cy, '#6cf0ff', 1, { vy: -20, life: .4, size: 2, shape: 'star' });
          if (k === 'poise' && Math.random() < .3) this.spark(cx + (Math.random() - .5) * 50, cy, '#f5e6a8', 1, { vy: -30, life: .5, size: 2 });
        });
        if (d.panic > 0) this.spark(cx + (Math.random() - .5) * 60, cy + (Math.random() - .5) * 80, '#ff3b4d', 1, { life: .3, size: 3, vx: (Math.random() - .5) * 200, shape: 'streak' });
      }
    }
    // 粒子
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i]; p.l -= dt; if (p.l <= 0) { this.parts.splice(i, 1); continue; }
      p.vy += (p.g || 0) * dt; const dr = Math.pow(p.dr == null ? .5 : p.dr, dt); p.vx *= dr; p.vy *= (p.g ? Math.pow(dr, .4) : dr); p.x += p.vx * dt; p.y += p.vy * dt; p.rot += (p.vr || 0) * dt;
      if (p.floor != null && p.y > p.floor && p.vy > 0) { p.y = p.floor; p.vy *= -.28; p.vx *= .6; }
    }
    for (let i = this.fx.length - 1; i >= 0; i--) { const f = this.fx[i]; f.age += dt; if (f.age >= f.dur) this.fx.splice(i, 1); }
    for (let i = this.banners.length - 1; i >= 0; i--) { const b = this.banners[i]; b.age += dt; if (b.age >= b.dur) this.banners.splice(i, 1); }
    if (this.cut) { this.cut.age += dt; if (this.cut.age >= this.cut.dur) this.cut = null; }
  }
  /* ---------- 粒子/FX生成 ---------- */
  spark(x, y, col, n, o) {
    o = o || {}; for (let i = 0; i < n; i++) {
      const a = o.ang != null ? o.ang + (Math.random() - .5) * (o.spread || 0) : Math.random() * TAU, s = (o.speed || 0) * (.4 + Math.random() * .8);
      this.parts.push({ x: x + (o.jx ? (Math.random() - .5) * o.jx : 0), y: y + (o.jy ? (Math.random() - .5) * o.jy : 0), vx: (o.vx || 0) + Math.cos(a) * s, vy: (o.vy || 0) + Math.sin(a) * s, l: (o.life || .5) * (.6 + Math.random() * .6), m: o.life || .5, size: o.size || 3, col, g: o.g || 0, dr: o.dr, add: o.add !== false, shape: o.shape || 'dot', rot: Math.random() * TAU, vr: (Math.random() - .5) * 10, grow: o.grow || 0, floor: o.floor });
    }
  }
  burst(x, y, col, n, speed, o) { this.spark(x, y, col, n, Object.assign({ speed, life: .55, size: 3.4, g: 260, dr: .25 }, o || {})); this.spark(x, y, '#ffffff', Math.ceil(n / 3), Object.assign({ speed: speed * .8, life: .3, size: 2.4, dr: .2 }, o || {})); }
  dust(x, y, n, dir, size) { this.spark(x, y - 2, '#b8b0c8', n, { vx: (dir || 0) * 50, vy: -14, speed: 60, life: .75, size: size || 9, add: false, shape: 'smoke', grow: 2.2, dr: .25 }); }
  addFx(f) { f.age = 0; this.fx.push(f); return f; }
  ring(x, y, col, r, dur) { this.addFx({ k: 'ring', x, y, col, r, dur: dur || .4 }); }
  star(x, y, r, col, dur, rot) { this.addFx({ k: 'star', x, y, r, col, dur: dur || .32, rot: rot == null ? Math.random() : rot }); }
  rays(x, y, col, n, len, dur) { const a = []; for (let i = 0; i < n; i++) a.push([Math.random() * TAU, .6 + Math.random() * .8]); this.addFx({ k: 'rays', x, y, col, a, len: len || 160, dur: dur || .3 }); }
  cres(x, y, ang, len, col, o) { o = o || {}; this.addFx({ k: 'cres', x, y, ang, len, w: o.w || 26, bulge: o.bulge == null ? .22 : o.bulge, col, dur: o.dur || .42, delay: o.delay || 0 }); }
  crack(x, y, col, r) {
    const segs = []; const nb = 7 + (Math.random() * 3 | 0);
    for (let i = 0; i < nb; i++) { let a = (i / nb) * TAU + (Math.random() - .5) * .5, px = 0, py = 0, len = r * (.55 + Math.random() * .6); const n = 3 + (Math.random() * 2 | 0); for (let j = 0; j < n; j++) { a += (Math.random() - .5) * .8; const l = len / n, nx = px + Math.cos(a) * l, ny = py + Math.sin(a) * l * .38; segs.push([px, py, nx, ny, 1 - j / n]); px = nx; py = ny; } }
    this.addFx({ k: 'crack', x, y, segs, col, dur: 1.1 });
  }
  slashFx(x, y, type, col, dir, big) { /* 互換用 */ this.hitFx(x, y, type, col, dir, big, 0); }
  num(vu, text, col, size, o) { o = o || {}; this.addFx({ k: 'num', x: vu.x + vu.sp.x * .5 + (o.dx || (Math.random() - .5) * 40), y: vu.y - vu.hh * (o.h || .62) + (o.dy || 0), text, col, size, dur: o.dur || 1.0, sub: o.sub, subc: o.subc, crit: o.crit, stroke: o.stroke || '#10060c' }); }
  coinPop(vu, heads, sin) { this.addFx({ k: 'coin', x: vu.x + vu.sp.x, y: vu.y - vu.hh - 22, heads, col: SIN[sin] ? SIN[sin].c : '#ffd479', dur: .8 }); }
  banner(text, col, dur, sub) { this.banners.push({ text, col: col || '#ffd479', dur: (dur || 1.2), age: 0, sub }); }
  kick(x, y, z) { this.cam.kx += x; this.cam.ky += y; this.cam.pz += z || 0; }
  kickShake(mag, ang) { this.shakeV = Math.max(this.shakeV, mag); this.shakeA = ang || 0; }
  /* ---------- イベント再生 ---------- */
  async play(events) {
    this.playing = true;
    for (const ev of events) { if (this.abort) break; await this.handle(ev); }
    this.playing = false;
    this.camReset();
  }
  camReset() { this.cam.tx = REST_X; this.cam.ty = REST_Y; this.cam.tz = REST_Z; }
  camTo(x, y, z) { this.cam.tx = clamp(x, 400, 880); this.cam.ty = clamp(y, REST_Y - 40, REST_Y + 60); this.cam.tz = z; }
  home(v, ms) { return this.approach(v, { x: v.hx, y: v.hy }, 'back', ms); }
  async handle(ev) {
    const B = this.battle;
    switch (ev.t) {
      case 'turnStart': this.syncEv(ev); this.banner('TURN ' + ev.turn, '#ffd479', 1.1); this.sfx('turn'); await this.wait(650); break;
      case 'resolveStart': this.syncEv(ev); this.sfx('resolve'); await this.wait(200); break;
      case 'pop': { this.syncEv(ev); const v = this.vus[ev.u]; this.addFx({ k: 'tag', x: v.x + v.sp.x, y: v.y - v.hh - 34, text: ev.text, col: ev.color || '#ffd479', dur: 1.1 }); await this.wait(140); break; }
      case 'status': { this.syncEv(ev); const v = this.vus[ev.u]; if (ev.p || ev.c) { const s = ST[ev.k]; const buff = s.buff; this.num(v, `${s.n} ${ev.p ? '+' + ev.p : ''}${ev.c ? '/' + ev.c : ''}`, s.c, 17, { h: .85, dy: -((this.tick % 3) * 14), dur: 1.1 }); this.burst(v.x + v.sp.x, v.y - v.hh * .5, s.c, 8, 120); this.ring(v.x, v.y, s.c, 70, .5); if (buff) this.spark(v.x, v.y, s.c, 8, { vy: -90, jx: 60, life: .9, size: 3, g: -30, shape: 'star' }); this.sfx(buff ? 'buff' : 'debuff'); await this.wait(90); } break; }
      case 'sp': { this.syncEv(ev); const v = this.vus[ev.u]; this.num(v, (ev.d > 0 ? '+' : '') + ev.d + ' SP', ev.d > 0 ? '#6cf0ff' : '#7f9aff', 16, { h: .95, dur: .9 }); await this.wait(70); break; }
      case 'heal': { this.syncEv(ev); const v = this.vus[ev.u]; this.num(v, '+' + ev.v, '#7ee08a', 22, { h: .75 }); this.burst(v.x + v.sp.x, v.y - v.hh * .5, '#7ee08a', 10, 90, { g: -40 }); this.spark(v.x, v.y, '#9cf5a8', 12, { jx: 70, vy: -110, life: 1, size: 3.4, g: -20, shape: 'star' }); this.ring(v.x, v.y, '#7ee08a', 90, .6); this.sfx('heal'); await this.wait(120); break; }
      case 'res': { this.syncEv(ev); await this.wait(0); break; }
      case 'dot': {
        this.syncEv(ev); const v = this.vus[ev.u]; const c = ev.k === 'burn' ? '#ff8a3d' : ev.k === 'bleed' ? '#ff4d6a' : ev.k === 'burst' ? '#c9b8ff' : '#ff9ac0';
        this.num(v, ev.v, c, 26, { h: .6, sub: ev.k === 'burn' ? '灼熱' : ev.k === 'bleed' ? '出血' : ev.k === 'burst' ? '振動爆発' : '', subc: c });
        v.flash = .6; this.burst(v.x + v.sp.x, v.y - v.hh * .5, c, 12, 150); this.kickShake(5, Math.random() * TAU); v.sp.vs -= 2.4; v.sp.vr -= 2;
        if (ev.k === 'burn') this.spark(v.x, v.y - v.hh * .4, '#ffb347', 14, { jx: 50, vy: -140, life: .7, size: 4, g: -60, shape: 'ember' });
        if (ev.k === 'bleed') this.spark(v.x, v.y - v.hh * .5, '#e0314b', 12, { speed: 150, life: .8, size: 3.4, g: 460, shape: 'drop' });
        if (ev.k === 'burst') { this.ring(v.x, v.y - v.hh * .5, c, 120, .5); this.star(v.x, v.y - v.hh * .5, 90, c, .4); }
        this.sfx(ev.k === 'burst' ? 'burst' : 'dot'); await this.wait(220); break;
      }
      case 'ego': await this.cutin(ev); break;
      case 'clash': await this.beginClash(ev); break;
      case 'round': await this.round(ev); break;
      case 'clashEnd': await this.endClash(ev); break;
      case 'atk': await this.beginOne(ev); break;
      case 'coin': await this.coinHit(ev); break;
      case 'atkEnd': await this.endAttack(ev); break;
      case 'fizzle': { await this.wait(30); break; }
      case 'stagger': await this.stagger(ev); break;
      case 'die': await this.die(ev); break;
      case 'panic': await this.panic(ev); break;
      case 'calm': case 'recover': { this.syncEv(ev); const v = this.vus[ev.u]; this.addFx({ k: 'tag', x: v.x + v.sp.x, y: v.y - v.hh - 34, text: ev.t === 'calm' ? '平静に戻った' : '体勢を立て直した', col: '#9fd0ff', dur: 1.1 }); this.ring(v.x, v.y, '#9fd0ff', 90, .6); this.spark(v.x, v.y - v.hh * .5, '#bfe0ff', 10, { jx: 70, vy: -90, life: .9, size: 3, g: -20, shape: 'star' }); this.tween(v, { kneel: 0 }, 260, ease.out); await this.wait(220); break; }
      case 'slotUp': { this.syncEv(ev); const v = this.vus[ev.u]; if (v) { this.addFx({ k: 'tag', x: v.x + v.sp.x, y: v.y - v.hh - 34, text: 'スロット+1 (' + ev.n + ')', col: '#ffd479', dur: 1 }); this.ring(v.x, v.y - v.hh * .5, '#ffd479', 70, .45); } break; }
      case 'turnEnd': this.syncEv(ev); await this.wait(120); break;
      case 'end': this.syncEv(ev); await this.wait(200); break;
      default: this.syncEv(ev);
    }
  }
  /* ---------- モーション再生 ---------- */
  /* v にスイング/敵モーションを再生。fit: 命中までの時間(ms)に合わせて全体を伸縮 */
  play1(v, def, fit) {
    const k = fit ? fit / (def.dur * def.hit) : 1, dur = def.dur * k;
    v.bl = { from: v.cur ? Object.assign({}, v.cur, { ang: v.cur.ang == null ? null : NORM(v.cur.ang) }) : null, t: 0 };
    const mv = v.mv = { def, S: def.kf ? def : null, p: 0, lp: 0 };
    let fired = false, hitRes; const hit = new Promise(r => hitRes = r);
    const done = this.anim(dur, p => { mv.lp = mv.p; mv.p = p; if (!fired && p >= def.hit) { fired = true; hitRes(); } }).then(() => { if (v.mv === mv) v.mv = null; hitRes(); });
    return { hit, done, dur };
  }
  /* ---------- 移動(接近・後退) ---------- */
  async approach(v, sp, style, ms) {
    const x0 = v.x, y0 = v.y, dx = sp.x - x0, dy = sp.y - y0, dist = Math.hypot(dx, dy), dir = Math.sign(dx) || v.face;
    if (dist < 6 && style !== 'back') { return; }
    const base = ms || clamp(150 + dist * .5, 170, 330);
    const col = v.u.isAlly ? SIN[v.u.sinc].c : (ENEMY_COL[v.u.art] || '#fff');
    const mid = () => v.hh * .42;
    v.ghostOn = style !== 'back' && style !== 'jerk' && style !== 'stomp';
    const imM = isImgUnit(v.u) ? IMOT[v.u.look.img] : null; if (imM && imM.dash && style !== 'back') this.setFr(v, imM.dash, 4000);
    const fin = () => { v.x = sp.x; v.y = sp.y; v.jy = 0; v.lean = 0; v.sq = 0; v.ghostOn = false; };
    try {
      switch (style) {
        case 'leap': {
          this.sfx('dash');
          await this.anim(90, p => { v.sq = .2 * p; v.lean = -.08 * p; });
          const H = 60 + Math.min(80, dist * .16);
          await this.anim(base * 1.3, p => { const e = ease.out(p * .8 + .2 * p); v.x = x0 + dx * e; v.y = y0 + dy * e; v.jy = 4 * H * p * (1 - p); v.sq = p < .2 ? .2 * (1 - p / .2) : 0; v.lean = .34 * Math.sin(Math.min(1, p * 1.2) * Math.PI) - (p > .8 ? 0 : 0); if (this.tick % 2 === 0) this.spark(v.x, v.y - v.jy - mid(), col, 1, { life: .3, size: 3, vx: -dir * 40, g: 60, shape: 'star' }); });
          fin(); v.sp.vs -= 3.2; v.sp.vy += 60; this.dust(v.x - dir * 10, v.y, 7, -dir, 11); this.ring(v.x, v.y, 'rgba(210,200,225,.6)', 80, .35); this.kickShake(4, Math.PI / 2); break;
        }
        case 'blink': {
          this.sfx('dash'); const oy = y0 - mid();
          this.ring(x0, oy, col, 60, .3); this.spark(x0, oy, col, 14, { speed: 170, life: .45, size: 3, shape: 'star', dr: .2 });
          await this.anim(70, p => { v.alpha = 1 - p; v.sq = .1 * p; });
          this.addFx({ k: 'streak', x0, y0: oy, x1: sp.x, y1: sp.y - mid(), col, dur: .36 });
          v.x = sp.x; v.y = sp.y; this.ring(sp.x, sp.y - mid(), '#ffffff', 80, .3); this.star(sp.x, sp.y - mid(), 80, col, .3);
          await this.anim(100, p => { v.alpha = p; v.lean = .22 * (1 - p); v.sq = .1 * (1 - p); });
          fin(); v.alpha = 1; break;
        }
        case 'slide': {
          this.sfx('dash');
          await this.anim(base, p => { const e = ease.out(p); v.x = x0 + dx * e; v.y = y0 + dy * e; const env = Math.min(1, p * 8) * (p > .78 ? (1 - p) / .22 : 1); v.sq = .3 * env; v.lean = .42 * env; this.spark(v.x - dir * 12, v.y - 2, '#ffd9a0', 1, { vx: -dir * 90, vy: -30 - Math.random() * 40, life: .3, size: 2.4, g: 220, shape: 'streak' }); if (this.tick % 2 === 0) this.dust(v.x - dir * 18, v.y, 1, -dir, 8); });
          fin(); v.sp.vx += dir * 120; this.dust(v.x, v.y, 5, -dir, 11); break;
        }
        case 'flutter': {
          await this.anim(base * 1.5, p => { const e = ease.io(p), env = 1 - p; v.x = x0 + dx * e; v.y = y0 + dy * e; v.jy = 26 * env + 22 * Math.sin(p * TAU * 2) * env + 30 * Math.sin(p * Math.PI) * env; v.lean = .12 * Math.sin(p * TAU * 2) * env; v.sq = -.05 * Math.sin(p * 40) * env; if (this.tick % 3 === 0) this.spark(v.x, v.y - v.jy - mid(), '#d8b8ff', 1, { vy: 25, life: .8, size: 2.6, g: 50, shape: 'dot' }); });
          fin(); break;
        }
        case 'jerk': {
          const n = 5; for (let i = 0; i < n; i++) { const a = i / n, b = (i + 1) / n; await this.anim(base * 1.4 / n, p => { const e = ease.out(p); v.x = x0 + dx * lerp(a, b, e); v.y = y0 + dy * lerp(a, b, e); v.jy = Math.sin(p * Math.PI) * 9; v.lean = (i % 2 ? .13 : -.1) * Math.sin(p * Math.PI); }); this.dust(v.x, v.y, 1, 0, 6); }
          fin(); break;
        }
        case 'glide': {
          await this.anim(base * 1.2, p => { const e = ease.io(p); v.x = x0 + dx * e; v.y = y0 + dy * e; v.alpha = 1 - .45 * Math.sin(p * Math.PI); v.jy = 8 + 8 * Math.sin(p * TAU * 1.5) * (1 - p); v.lean = .12 * Math.sin(p * Math.PI); if (this.tick % 2 === 0) this.spark(v.x - dir * 14, v.y - mid() + (Math.random() - .5) * 60, col, 1, { vx: -dir * 30, life: .6, size: 6, add: false, shape: 'smoke', grow: 1.6 }); });
          fin(); v.alpha = 1; break;
        }
        case 'stomp': {
          const n = 2; for (let i = 0; i < n; i++) { const a = i / n, b = (i + 1) / n; await this.anim(base * .75, p => { const e = ease.io(p); v.x = x0 + dx * lerp(a, b, e); v.y = y0 + dy * lerp(a, b, e); v.jy = Math.sin(p * Math.PI) * 22; v.lean = .1 * Math.sin(p * Math.PI); }); this.sfx('blunt', { big: false }); this.kickShake(6, Math.PI / 2); v.sp.vs -= 2.2; this.dust(v.x, v.y, 6, 0, 12); this.ring(v.x, v.y, 'rgba(210,190,160,.55)', 90, .35); }
          fin(); break;
        }
        case 'back': {
          if (dist > 6) { await this.anim(base, p => { const e = ease.io(p); v.x = x0 + dx * e; v.y = y0 + dy * e; v.jy = Math.sin(p * Math.PI) * 14; v.lean = -.14 * Math.sin(p * Math.PI); }); this.dust(x0, y0, 3, dir, 8); }
          fin(); break;
        }
        default: { // run
          this.sfx('dash');
          await this.anim(base, p => { const e = ease.io(p); v.x = x0 + dx * e; v.y = y0 + dy * e; const env = Math.min(1, p * 6) * (p > .85 ? (1 - p) / .15 : 1); v.lean = .26 * env; v.jy = Math.abs(Math.sin(p * Math.PI * 4)) * 8 * env; v.sq = .06 * env; if (this.tick % 2 === 0) this.dust(v.x - dir * 20, v.y, 1, -dir, 7); });
          fin(); v.sp.vx += dir * 110; v.sp.vr -= .5; this.dust(v.x - dir * 10, v.y, 4, -dir, 10); break;
        }
      }
    } finally { v.ghostOn = false; if (imM) v.frOv = null; }
  }
  /* ---------- 攻撃の共通処理 ---------- */
  stand(vu, tgt, gap) {
    const dir = tgt.hx > vu.hx ? 1 : -1, g = (vu.sc + tgt.sc) * gap;
    return { x: tgt.x + tgt.sp.x * .3 - dir * g, y: tgt.y + (vu.y - tgt.y) * .12, dir };
  }
  styleOf(v, seed) { return isImgUnit(v.u) ? IMOT[v.u.look.img].appr : v.u.isAlly ? pickApproach(v.u.look.w, seed) : (ENEMY_APPR[v.u.art] || 'run'); }
  isRanged(v) { return !v.u.isAlly && !!(EMV[v.u.art] && EMV[v.u.art].range); }
  async beginOne(ev) {
    const a = this.vus[ev.a.u], t = this.vus[ev.tu], sk = a.u.slots[ev.a.s].skill; const seed = strHash(a.u.name || a.u.key || 'x') + (this.tick % 7);
    this.att = { a, b: null, t, sk, seed, n: 0 };
    const ranged = this.isRanged(a);
    this.camTo((a.x + t.x) / 2, 392, ranged ? .88 : .95);
    if (ranged) { await this.anim(120, p => { a.sq = -.04 * p; }); a.sq = 0; return; }
    const sp = this.stand(a, t, a.u.isAlly ? 125 : 108);
    await this.approach(a, sp, this.styleOf(a, seed));
  }
  async beginClash(ev) {
    const a = this.vus[ev.a.u], b = this.vus[ev.b.u]; const sa = a.u.slots[ev.a.s], sb = b.u.slots[ev.b.s];
    const seed = strHash(a.u.name || 'a') + strHash(b.u.name || 'b') % 97;
    this.att = { a, b, t: null, sk: null, seed, n: 0, rn: 0 };
    // 打ち合いは両陣営の間(無人地帯)で行う。味方の隊列の中で起きないようにする
    const mx = clamp((a.hx + b.hx) / 2, 640, 690), my = clamp((a.hy + b.hy) / 2, 560, 600);
    const al = a.u.isAlly ? a : b, en = a.u.isAlly ? b : a;
    const gap = (al.sc + en.sc) * 96;
    this.camTo(mx, 398, .98);
    this.clashUI = { A: { v: a, sk: sa.skill, n: sa.skill.nC, flips: null, pw: null, rev: 0, lose: false }, B: { v: b, sk: sb.skill, n: sb.skill.nC, flips: null, pw: null, rev: 0, lose: false }, age: 0, w: 0, show: 0, midx: mx };
    this.sfx('clash'); if (isImgUnit(al.u)) this.matchCut = { img: al.u.look.img, t0: this.clock, dur: 1150, col: SIN[al.u.sinc] ? SIN[al.u.sinc].c : '#fff' };
    await Promise.all([
      this.approach(al, { x: mx - gap / 2, y: my }, this.styleOf(al, seed), 260),
      this.approach(en, { x: mx + gap / 2, y: my }, this.isRanged(en) ? 'glide' : this.styleOf(en, seed + 1), 260),
      this.tween(this.clashUI, { show: 1 }, 260, ease.out)
    ]);
    this.ring(mx, my - 100, '#ffffff', 130, .35); this.star(mx, my - 110, 150, '#ffffff', .3); this.flash = .22; this.kickShake(6, 0);
    if (ev.steal) this.num(al.u === a.u ? a : b, '奪取!', '#7ee0ff', 30, { sub: '速度で合戦を奪った', subc: '#bfefff', dy: -30, dur: 1.2 });
  }
  async round(ev) {
    this.syncEv(ev); const ui = this.clashUI; if (!ui) return;
    const a = ui.A.v, b = ui.B.v, at = this.att; at.rn++;
    ui.A.flips = ev.fa; ui.B.flips = ev.fb; ui.A.n = ev.fa.length; ui.B.n = ev.fb.length; ui.A.pw = null; ui.B.pw = null; ui.A.rev = 0; ui.B.rev = 0; ui.w = 0; ui.A.lose = ui.B.lose = false;
    const nmax = Math.max(ev.fa.length, ev.fb.length);
    this.sfx('flip', { n: nmax });
    // 打ち合いの構え(コインが回っている間、両者は身構える)
    a.glow = b.glow = .6;
    ui.A.tt = 480 + (ev.fa.length - 1) * 85; ui.B.tt = 480 + (ev.fb.length - 1) * 85; ease.lin = ease.lin || (t => t);
    await Promise.all([this.tween(ui.A, { rev: 1 }, ui.A.tt, ease.lin), this.tween(ui.B, { rev: 1 }, ui.B.tt, ease.lin)]);
    ui.A.pw = ev.pa; ui.B.pw = ev.pb; this.sfx('count');
    await this.wait(190);
    ui.w = ev.w; const mx = ui.midx, my = (a.y + b.y) / 2 - 118;
    const win = ev.w === 1 ? a : ev.w === 2 ? b : null, lose = ev.w === 1 ? b : ev.w === 2 ? a : null;
    // 両者の斬り合い(各自のモーションを命中時刻に合わせて同時再生)
    const mk = (v, i) => { if (isImgUnit(v.u)) { v.trailCol = '#fff'; return this.play1(v, imgClashDef(v.u.look, ui[i ? 'B' : 'A'].sk), 240); } if (v.u.isAlly) { const nm = CLASHSW[(at.seed + at.rn + i) % CLASHSW.length]; v.trailCol = SIN[(ui[i ? 'B' : 'A'].sk.sin)] ? SIN[ui[i ? 'B' : 'A'].sk.sin].c : '#fff'; return this.play1(v, SWING[nm], 240); } return this.play1(v, EMV[v.u.art] || EMV_DEF, 240); };
    const pa = mk(a, 0), pb = mk(b, 1);
    a.expr = b.expr = 'atk'; a.exprT = b.exprT = 380;
    await Promise.all([pa.hit, pb.hit]);
    this.sfx(win ? 'clashHit' : 'tie');
    const col = win ? (win.u.isAlly ? '#ffd479' : '#ff6b6b') : '#ffffff';
    this.clang(mx, my, col, !!win);
    this.hold = 80; this.kickShake(win ? 11 : 8, Math.random() * TAU); this.kick(win ? (win === a ? 6 : -6) * (a.u.isAlly ? 1 : -1) : 0, 0, .02); this.chroma = .35;
    if (win) {
      ev.w === 1 ? ui.B.lose = true : ui.A.lose = true; const d = win.x < lose.x ? 1 : -1;
      lose.sp.vx += d * 640; lose.sp.vr -= 3.6; lose.sp.vs -= 1.2; lose.flash = .5; win.sp.vx += d * 180; win.sp.vs += .6;
      this.burst(mx + d * 150, my - 6, '#9aa3b8', 14, 220, { shape: 'shard' });
    } else { a.sp.vx -= (a.x < b.x ? 1 : -1) * 320; b.sp.vx += (a.x < b.x ? 1 : -1) * 320; }
    await Promise.all([pa.done, pb.done]);
    ui.A.n = ev.na; ui.B.n = ev.nb; ui.A.flips = ui.B.flips = null; a.glow = b.glow = 0;
    await this.wait(80);
  }
  /* 金属音を伴う打ち合いの火花 */
  clang(x, y, col, win) {
    this.ring(x, y, '#ffffff', 100, .32); this.ring(x, y, col, 150, .45); this.star(x, y, 150, '#ffffff', .34); this.rays(x, y, col, 14, 190, .35);
    this.cres(x, y, -.6, 210, '#ffffff', { w: 16, bulge: .1, dur: .3 }); this.cres(x, y, .6, 210, col, { w: 16, bulge: -.1, dur: .3, delay: .02 });
    this.spark(x, y, '#fff3c0', 26, { speed: 520, life: .5, size: 2.6, shape: 'streak', g: 340, dr: .2 }); this.spark(x, y, col, 14, { speed: 300, life: .6, size: 3, g: 260, dr: .25 });
    this.flash = Math.max(this.flash, .2);
  }
  async endClash(ev) {
    const ui = this.clashUI; this.syncEv(ev);
    if (!ev.w) { this.addFx({ k: 'tag', x: ui.midx, y: 250, text: '相討ち', col: '#ffffff', dur: 1 }); await this.wait(200); await this.tween(ui, { show: 0 }, 200); this.clashUI = null; return; }
    const w = this.vus[ev.w.u]; const sk = w.u.slots[ev.w.s].skill; if (this.att) { this.att.sk = sk; this.att.n = 0; }
    this.addFx({ k: 'tag', x: w.x, y: w.y - w.hh - 34, text: w.u.isAlly ? 'CLASH WIN' : 'CLASH LOST', col: w.u.isAlly ? '#ffd479' : '#ff6b6b', dur: .9 });
    this.hold = 120; this.sfx(w.u.isAlly ? 'win' : 'lose'); this.ring(w.x, w.y - w.hh * .5, w.u.isAlly ? '#ffd479' : '#ff6b6b', 140, .5);
    await this.tween(ui, { show: 0 }, 180); this.clashUI = null; await this.wait(40);
  }
  /* ---------- コイン命中 ---------- */
  async coinHit(ev) {
    const src = this.vus[ev.src], dst = this.vus[ev.dst]; const big = ev.tier === 'F' || ev.crit;
    let at = this.att;
    if (!at || (at.a !== src && at.b !== src)) { at = this.att = { a: src, b: null, t: dst, sk: null, seed: strHash(src.u.name || 'x') + this.tick % 5, n: 0 }; if (!this.isRanged(src)) { const sp = this.stand(src, dst, 118); await this.approach(src, sp, 'run', 160); } }
    const sk = at.sk, ci = ev.ci == null ? at.n : ev.ci, nC = sk ? sk.nC : 1; at.n++;
    const col = SIN[ev.sin] ? SIN[ev.sin].c : '#ffffff';
    this.coinPop(src, ev.flip, ev.sin);
    let def;
    if (isImgUnit(src.u)) { def = imgSkillDef(src.u.look, sk, ci, nC, at.seed); src.glow = .9; }
    else if (src.u.isAlly) { const kind = sk && ['guard', 'evade', 'counter'].includes(sk.kind) ? sk.kind : null; def = SWING[pickSwing(src.u.look.w, ev.type, ci, nC, at.seed, kind)]; src.glow = .9; }
    else def = EMV[src.u.art] || EMV_DEF;
    src.trailCol = col; src.expr = 'atk'; src.exprT = 420;
    const last = ci >= nC - 1;
    const pl = this.play1(src, def);
    if (this.isRanged(src)) this.rangedCast(src, dst, ev, col, def);
    await pl.hit;
    if (this.isRanged(src)) await this.wait(190);
    this.syncEv(ev);
    this.impact(src, dst, ev, def, big, col);
    if (last) await pl.done; else await this.wait(Math.max(60, pl.dur * (1 - def.hit) * .4));
    src.glow = 0;
    await this.wait(24);
  }
  /* 遠距離攻撃(歌・歯車): 発射エフェクト */
  rangedCast(src, dst, ev, col, def) {
    const x0 = src.x, y0 = src.y - src.hh * .55, x1 = dst.x, y1 = dst.y - dst.hh * .55;
    const kind = src.u.art === 'chorus' ? 'note' : 'gear';
    this.ring(x0, y0, col, 90, .4);
    const f = this.addFx({ k: 'proj', x0, y0, x1, y1, col, kind, pp: 0, dur: .5 });
    this.tween(f, { pp: 1 }, 190, ease.in);
  }
  /* 命中の総合演出 */
  impact(src, dst, ev, def, big, col) {
    if (ev.miss) { dst.sp.vx += (src.hx < dst.hx ? 1 : -1) * 260; dst.sp.vr += .6; this.num(dst, '見切り', '#bfe3ff', 26, { sub: '無効', subc: '#bfe3ff' }); this.ring(dst.x, dst.y - dst.hh * .5, '#bfe3ff', 70, .3); return; }
    const dir = src.hx < dst.hx ? 1 : -1, heavy = !!def.heavy || big;
    const px = dst.x + dst.sp.x * .3, py = dst.y - dst.hh * (.5 + Math.random() * .1);
    const ang0 = def.ang != null ? def.ang : 0, ang = dir > 0 ? ang0 : Math.PI - ang0;
    this.hitFx(px, py, ev.type, col, dir, heavy, ang);
    this.skillFx(src, ev, px, py, col, dir, heavy, ang, dst.y);
    this.sinFx(px, py, ev.sin, big, dir, dst.y);
    this.react(dst, dir, big, ev.type, def);
    this.kick(dir * (heavy ? 14 : 6), heavy ? -3 : -1, heavy ? .035 : .012); this.kickShake(heavy ? 13 : 7, ang);
    this.hold = heavy ? 105 : 42; this.flash = Math.max(this.flash, big ? .2 : .06); if (big) this.chroma = .6;
    if (heavy) { this.speed = 1; this.spx = w2sx(px, this.cam, this.cam.z); this.spy = w2sy(py, this.cam, this.cam.z); }
    if (dst.u.isAlly) this.hurt = Math.min(1, this.hurt + (big ? .8 : .45));
    const T = RES_TIER.find(t => t.k === ev.tier) || RES_TIER[2];
    const sz = 24 + Math.min(26, ev.dmg / 9) + (ev.tier === 'F' ? 8 : ev.tier === 'W' ? 4 : ev.tier === 'I' ? -4 : 0);
    this.num(dst, ev.dmg, ev.crit ? '#ffe34a' : T.c, sz, { sub: ev.crit ? 'CRITICAL' : ev.tier === 'F' ? '致命' : ev.tier === 'W' ? '弱点' : ev.tier === 'I' ? '耐性' : '', subc: ev.crit ? '#ffe34a' : T.c, dx: (Math.random() - .5) * 50, crit: ev.crit });
    if (ev.extra) this.num(dst, '+' + ev.extra, ev.dmg ? '#ff5fa2' : '#fff', 18, { dy: 28, sub: '亀裂', subc: '#ff5fa2' });
    this.sfx(ev.type === 'pierce' ? 'pierce' : ev.type === 'blunt' ? 'blunt' : 'slash', { big, heads: ev.flip });
  }
  /* 被弾リアクション(スプリングで弾む) */
  react(dst, dir, big, type, def) {
    const k = big ? 1.6 : 1, P = dst.sp;
    P.vx += dir * (type === 'blunt' ? 640 : type === 'pierce' ? 430 : 520) * k;
    P.vr -= (3.4 + (type === 'blunt' ? 1.6 : 0)) * k;
    P.vs -= 2.6 * k;
    if ((def && def.launch) || (type === 'blunt' && big)) P.vy -= 560 * k;
    else P.vy -= 90 * k;
    dst.flash = .7; dst.expr = 'hurt'; dst.exprT = 300; dst.hitT = .25;
    if (isImgUnit(dst.u)) { const H = IMOT[dst.u.look.img].hit; this.setFr(dst, H[big ? 1 : 0], 420); dst.flash = .45; }
  }
  /* 属性別ヒットエフェクト */
  hitFx(x, y, type, col, dir, heavy, ang) {
    const L = heavy ? 290 : 210, floorY = y + 0;
    if (type === 'pierce') {
      const a = dir > 0 ? 0 : Math.PI, j = (Math.random() - .5) * .22;
      this.addFx({ k: 'lance', x, y, ang: a + j, len: heavy ? 340 : 250, col, dur: .34 });
      if (heavy) this.addFx({ k: 'lance', x, y, ang: a - j * 1.5 + .16, len: 260, col, dur: .36 });
      this.star(x, y, heavy ? 130 : 90, '#ffffff', .3); this.rays(x, y, col, heavy ? 12 : 7, heavy ? 190 : 130, .3); this.ring(x, y, col, heavy ? 120 : 80, .35);
      this.spark(x, y, col, heavy ? 22 : 12, { ang: a + Math.PI, spread: 1.0, speed: 420, life: .5, size: 3, shape: 'streak', g: 160, dr: .2 });
    } else if (type === 'blunt') {
      this.star(x, y, heavy ? 190 : 130, '#ffffff', .34); this.rays(x, y, col, heavy ? 16 : 10, heavy ? 240 : 170, .34);
      this.addFx({ k: 'smash', x, y, col, dur: .4, big: heavy });
      this.ring(x, y, col, heavy ? 190 : 130, .5); this.ring(x, y + 40, '#ffffff', heavy ? 240 : 150, .42);
      this.crack(x, y + (heavy ? 120 : 100), col, heavy ? 150 : 100);
      this.spark(x, y + 60, '#7c7488', heavy ? 18 : 9, { speed: 340, life: .9, size: 5, shape: 'debris', g: 760, dr: .3, add: false, floor: y + 110 });
      this.dust(x, y + 110, heavy ? 9 : 5, dir, 13);
    } else {
      this.cres(x, y, ang, L, col, { w: heavy ? 40 : 28, bulge: .2 * (dir > 0 ? 1 : -1) });
      if (heavy) this.cres(x, y, ang + (dir > 0 ? -1 : 1) * 1.15, L * .85, col, { w: 26, bulge: -.16 * (dir > 0 ? 1 : -1), delay: .05 });
      this.star(x, y, heavy ? 120 : 80, '#ffffff', .26); this.rays(x, y, col, heavy ? 10 : 6, heavy ? 170 : 120, .28);
      this.spark(x, y, '#ffffff', heavy ? 20 : 10, { ang: ang + (dir > 0 ? 0 : 0), spread: 1.3, speed: 400, life: .45, size: 2.8, shape: 'streak', g: 200, dr: .2 });
      this.spark(x, y, col, heavy ? 16 : 8, { speed: 280, life: .6, size: 3, g: 280, dr: .25 });
    }
  }
  /* スキルごとの固有エフェクト: 灯守×スキル(S1/S2/S3/防御/EGO)で演出を変える。敵は技名で変化 */
  skillFx(src, ev, x, y, col, dir, heavy, ang, gy) {
    const key = ev.skk || 'e', sid = src.u.sid || null, h = strHash(ev.sk || 'x');
    const v = sid ? ({ s1: 0, s2: 1, s3: 2, def: 3, ego: 4 }[key] || 0) : h % 5;
    const last = ev.ci != null && ev.nC ? ev.ci >= ev.nC - 1 : false, g = dir > 0 ? 1 : -1, fl = gy != null ? gy + 4 : y + 120;
    const cr = (da, L, c, w, b, d) => this.cres(x, y, ang + da * g, L, c, { w, bulge: (b || .2) * g, delay: d || 0 });
    const lc = (a, len, c) => this.addFx({ k: 'lance', x, y, ang: a, len, col: c, dur: .34 });
    const col2 = { rei: '#bfe6ff', kuro: '#ff3b5c', ren: '#ff8ec0', aka: '#ffd95a', rai: '#ff9a2e', tetsu: '#c8b8a0', nagi: '#ffd0d8' }[sid] || col;
    const S = sid || ['rei', 'kuro', 'ren', 'aka', 'rai', 'tetsu', 'nagi'][h % 7];
    const m = heavy || last ? 1.3 : 1;
    switch (S) {
      case 'rei':
        if (v === 0) { this.spark(x, y, '#d8f2ff', 9 * m, { speed: 300, life: .7, size: 3.2, shape: 'shard', g: 120, dr: .25 }); this.ring(x, y, col2, 70, .3); }
        else if (v === 1) { cr(.55, 190, col2, 22); cr(-.55, 190, col2, 22, -.2, .05); this.spark(x, y, '#ffffff', 10, { speed: 90, life: 1.1, size: 3, shape: 'star', g: -50, dr: .4 }); }
        else if (v === 2) { for (const a of [-1.9, -1.57, -1.25]) lc(a, 210, col2); this.addFx({ k: 'beam', x, y: fl, col: col2, dur: .5 }); this.spark(x, y, '#e8f8ff', 18, { speed: 340, life: .8, size: 4, shape: 'shard', g: 300, dr: .2 }); }
        else { this.ring(x, y, col2, 140, .5); this.addFx({ k: 'glass', x, y, col: col2, dur: .8, a: Array.from({ length: 9 }, (_, i) => [i / 9 * TAU, .5 + Math.random() * .5]) }); if (v === 4) this.addFx({ k: 'beam', x, y: fl, col: col2, dur: .8 }); }
        if (last && v < 3) this.addFx({ k: 'glass', x, y, col: col2, dur: .7, a: Array.from({ length: 7 }, (_, i) => [i / 7 * TAU, .4 + Math.random() * .4]) });
        break;
      case 'kuro':
        if (v === 0) { this.spark(x, y, '#c0152e', 10 * m, { speed: 260, life: .9, size: 4, shape: 'drop', g: 520, dr: .3, add: false, floor: fl }); cr(0, 200, col2, 26); }
        else if (v === 1) { cr(-.6, 190, col2, 20); cr(0, 220, col2, 26, .2, .04); cr(.6, 190, col2, 20, .2, .08); }
        else if (v === 2) { cr(0, 300, col2, 44); this.addFx({ k: 'clockring', x, y, col: '#d4244a', r: 110, dur: .8 }); this.spark(x, y, '#8c0f24', 20, { speed: 320, life: 1, size: 4.5, shape: 'drop', g: 540, add: false, floor: fl }); }
        else { this.ring(x, y, col2, 130, .5); this.spark(x, y, '#c0152e', 14, { speed: 240, life: .9, size: 4, shape: 'drop', g: 500, add: false, floor: fl }); if (v === 4) { this.addFx({ k: 'beam', x, y: fl, col: col2, dur: .9 }); this.crack(x, y + 110, col2, 130); } }
        break;
      case 'ren':
        if (v === 0) { lc(ang + .12, 220, col2); lc(ang - .12, 190, col2); this.spark(x, y, '#ffb0d4', 8, { speed: 170, life: 1.2, size: 4.4, shape: 'petal', g: 70, dr: .4 }); }
        else if (v === 1) { this.rays(x, y, col2, 14, 190, .4); this.spark(x, y, '#ff8ec0', 16, { speed: 220, life: 1.3, size: 5, shape: 'petal', g: 60, dr: .4 }); this.star(x, y, 110, '#ffd0e4', .3); }
        else if (v === 2) { for (let i = -2; i <= 2; i++) lc(ang + i * .26, 240 - Math.abs(i) * 24, col2); this.ring(x, y, col2, 110, .4); this.spark(x, y, '#ffd0e4', 14, { speed: 200, life: 1.2, size: 4, shape: 'petal', g: 60 }); }
        else { this.ring(x, y, col2, 150, .6); this.spark(x, y, '#ff8ec0', 22, { speed: 240, life: 1.5, size: 5, shape: 'petal', g: 70, dr: .45 }); if (v === 4) this.addFx({ k: 'beam', x, y: fl, col: col2, dur: .9 }); }
        break;
      case 'aka':
        if (v === 0) { cr(0, 230, col2, 30); this.spark(x, y, '#fff2a8', 10, { speed: 250, life: .8, size: 4, shape: 'diamond', g: 200 }); }
        else if (v === 1) { cr(.7, 220, col2, 26); cr(-.7, 220, col2, 26, -.2, .05); this.star(x, y, 120, '#ffffff', .3); }
        else if (v === 2) { this.rays(x, y, col2, 22, 320, .5); this.addFx({ k: 'clockring', x, y, col: col2, r: 120, dur: .85 }); this.star(x, y, 220, '#fff6c8', .5); }
        else { this.ring(x, y, col2, 150, .55); this.rays(x, y, col2, 16, 230, .45); if (v === 4) this.addFx({ k: 'beam', x, y: fl, col: col2, dur: .9 }); }
        break;
      case 'rai':
        if (v === 0) { this.spark(x, y, '#ff7a3d', 14 * m, { speed: 260, life: .9, size: 3.8, shape: 'ember', g: -120, dr: .3 }); this.ring(x, y, col2, 90, .35); }
        else if (v === 1) { this.ring(x, y, col2, 120, .4); this.ring(x - g * 60, y - 20, '#ffffff', 90, .5); this.ring(x + g * 70, y + 20, col2, 100, .55); this.spark(x, y, '#ffd27a', 22, { speed: 320, life: .9, size: 4, shape: 'ember', g: -100 }); }
        else if (v === 2) { this.addFx({ k: 'beam', x, y: fl, col: col2, dur: .8 }); this.ring(x, y, col2, 200, .6); this.star(x, y, 230, '#ffffff', .45); this.spark(x, y, '#ff9a2e', 30, { speed: 340, life: 1, size: 4.4, shape: 'ember', g: -140, dr: .3 }); }
        else { this.ring(x, y, col2, 180, .55); this.ring(x, y, '#ffffff', 120, .4); if (v === 4) { this.addFx({ k: 'beam', x, y: fl, col: col2, dur: 1 }); this.ring(x, y, col2, 260, .8); } }
        break;
      case 'tetsu':
        if (v === 0) { this.dust(x, y + 110, 5, dir, 12); this.spark(x, y + 60, '#7c7488', 7, { speed: 280, life: .8, size: 5, shape: 'debris', g: 740, add: false, floor: fl }); }
        else if (v === 1) { this.ring(x, y + 80, '#ffffff', 190, .5); this.ring(x, y + 100, col2, 250, .65); this.crack(x, y + 110, col2, 120); this.dust(x, y + 110, 8, dir, 14); }
        else if (v === 2) { this.crack(x, y + 110, col2, 210); this.addFx({ k: 'smash', x, y, col: col2, dur: .45, big: true }); this.spark(x, y + 60, '#7c7488', 16, { speed: 380, life: 1, size: 6, shape: 'debris', g: 780, add: false, floor: fl }); this.dust(x, y + 110, 10, dir, 15); }
        else { this.ring(x, y + 60, col2, 200, .6); this.crack(x, y + 110, col2, 160); if (v === 4) this.addFx({ k: 'beam', x, y: fl, col: col2, dur: .9 }); }
        break;
      case 'nagi':
        if (v === 0) { cr(.1, 210, col2, 12, .1); cr(-.15, 180, '#ffffff', 8, .1, .03); }
        else if (v === 1) { for (const a of [-.7, 0, .7]) cr(a, 200, col2, 11, .12, Math.abs(a) * .05); this.spark(x, y, '#ffffff', 8, { speed: 360, life: .4, size: 2.4, shape: 'streak' }); }
        else if (v === 2) { cr(.8, 260, col2, 16); cr(-.8, 260, col2, 16, -.2, .05); lc(ang, 260, '#ffffff'); this.star(x, y, 130, '#ffffff', .3); }
        else { this.ring(x, y, col2, 120, .4); for (let i = -2; i <= 2; i++) cr(i * .45, 210, col2, 9, .1, Math.abs(i) * .03); if (v === 4) this.addFx({ k: 'beam', x, y: fl, col: col2, dur: .8 }); }
        break;
    }
    if (last && v < 3) { this.ring(x, y, col2, heavy ? 150 : 110, .45); this.star(x, y, 100, '#ffffff', .24); }
  }
  /* 罪属性ごとの彩り */
  sinFx(x, y, sin, big, dir, gy) {
    const C = SIN[sin]; if (!C) return; const n = big ? 1.6 : 1, c = C.c, fl = (gy || y + 120) + 4;
    switch (sin) {
      case 'wrath': this.spark(x, y, '#ff7a3d', 12 * n, { speed: 220, life: .85, size: 3.6, g: -130, shape: 'ember', dr: .3 }); this.spark(x, y, '#ffd27a', 6 * n, { speed: 150, life: .55, size: 2.2, g: -60, shape: 'ember' }); break;
      case 'lust': this.spark(x, y, '#ff8ec0', 10 * n, { speed: 190, life: 1.2, size: 4.4, g: 70, shape: 'petal', dr: .4 }); this.spark(x, y, '#ffd0e4', 5 * n, { speed: 120, life: .7, size: 2.4, shape: 'star' }); break;
      case 'sloth': this.spark(x, y, '#f5d97a', 10 * n, { speed: 140, life: 1.1, size: 3, g: -20, dr: .5 }); this.addFx({ k: 'clockring', x, y, col: c, r: 74 * n, dur: .75 }); break;
      case 'glut': this.spark(x, y, '#8be07a', 12 * n, { speed: 250, life: .95, size: 4.2, g: 560, shape: 'drop', dr: .3, add: false, floor: fl }); this.spark(x, y, '#d6ffb8', 5 * n, { speed: 160, life: .5, size: 2.4 }); break;
      case 'greed': this.spark(x, y, '#ffe08a', 10 * n, { speed: 250, life: .85, size: 4.2, g: 220, shape: 'diamond', dr: .25 }); this.spark(x, y, '#ffffff', 6 * n, { speed: 170, life: .5, size: 3, shape: 'star' }); break;
      case 'pride': this.spark(x, y, '#bcd0ff', 9 * n, { speed: 160, life: 1.3, size: 5.5, g: 70, shape: 'feather', dr: .4 }); this.addFx({ k: 'beam', x, y: fl, col: c, dur: .55 }); break;
      case 'envy': this.spark(x, y, '#cf9bff', 12 * n, { speed: 190, life: 1.05, size: 3.6, g: -40, shape: 'wisp', dr: .35 }); this.spark(x, y, '#ffffff', 4 * n, { speed: 130, life: .5, size: 2.2 }); break;
    }
  }
  async beginEgoFlag() { }
  async endAttack(ev) {
    const at = this.att; if (!at) return;
    const list = [at.a, at.b].filter(Boolean);
    await Promise.all(list.map(v => this.home(v, 240)));
    this.att = null; this.camReset(); await this.wait(80);
  }
  /* ---------- 混乱 ---------- */
  async stagger(ev) {
    this.syncEv(ev); const v = this.vus[ev.u];
    this.hold = 280; this.flash = .55; this.kickShake(20, Math.random() * TAU); this.chroma = 1; this.sfx('stagger');
    const x = v.x + v.sp.x, y = v.y - v.hh * .5;
    this.ring(x, y, '#ffffff', 220, .65); this.ring(x, y, '#ffd479', 300, .85); this.star(x, y, 260, '#ffffff', .5);
    this.rays(x, y, '#ffd479', 22, 320, .5);
    this.burst(x, y, '#ffd479', 40, 440, { shape: 'shard', life: .95 }); this.burst(x, y, '#ffffff', 22, 300);
    this.addFx({ k: 'glass', x, y, col: '#ffd479', dur: 1.1, a: Array.from({ length: 12 }, (_, i) => [i / 12 * TAU + (Math.random() - .5) * .3, .55 + Math.random() * .7]) });
    this.addFx({ k: 'stag', x, y: Math.max(v.y - v.hh - 64, 190), dur: 1.7 });
    this.camTo(x, 385, 1.05);
    v.sp.vr -= 6; v.sp.vs -= 4; v.sp.vx += (v.face > 0 ? -1 : 1) * 380;
    this.tween(v, { kneel: 1 }, 300, ease.out);
    await this.wait(720);
    if (!this.att) this.camReset();
  }
  /* ---------- 撃破 ---------- */
  async die(ev) {
    this.syncEv(ev); const v = this.vus[ev.u]; v.dead = true;
    const x = v.x + v.sp.x, y = v.y - v.hh * .5, ally = v.u.isAlly, col = ally ? '#9fd0ff' : '#ffb347';
    this.hold = 200; this.kickShake(16, Math.random() * TAU); this.sfx('die'); this.flash = Math.max(this.flash, .35);
    this.burst(x, y, col, 50, 400, { life: 1, shape: 'shard' });
    this.ring(x, y, '#ffffff', 230, .65); this.ring(x, y, col, 320, .9); this.star(x, y, 240, '#ffffff', .5);
    this.addFx({ k: 'beam', x, y: v.y + 4, col, dur: 1.1 });
    v.flash = 1; v.ghostOn = false;
    const keep = isImgUnit(v.u);
    await this.anim(800, p => {
      v.die = p; v.alpha = keep ? 1 - .1 * ease.in(p) : 1 - ease.in(p); v.flash = Math.max(0, 1 - p * 2.2);
      if (this.tick % 2 === 0) this.spark(x + (Math.random() - .5) * v.hh * .5, v.y - Math.random() * v.hh, col, 2, { vy: -80 - Math.random() * 80, life: .9, size: 3, g: -20, shape: Math.random() < .5 ? 'star' : 'dot' });
    });
    v.alpha = keep ? .92 : 0;
  }
  async panic(ev) {
    this.syncEv(ev); const v = this.vus[ev.u]; this.glitch = 1; this.flash = .3; this.kickShake(13, Math.random() * TAU); this.chroma = .8; this.sfx('panic');
    v.expr = 'panic'; v.exprT = 2200;
    const x = v.x + v.sp.x, y = v.y - v.hh * .5;
    this.addFx({ k: 'tag', x, y: v.y - v.hh - 34, text: 'PANIC', col: '#ff3b4d', dur: 1.4 });
    this.burst(x, y, '#ff3b4d', 36, 360, { shape: 'streak' }); this.ring(x, y, '#ff3b4d', 180, .6); this.star(x, y, 150, '#ff6b7e', .4);
    this.addFx({ k: 'glass', x, y, col: '#ff3b4d', dur: .9, a: Array.from({ length: 8 }, (_, i) => [i / 8 * TAU, .6 + Math.random() * .5]) });
    v.sp.vr -= 4; v.sp.vs -= 3;
    await this.wait(600);
  }
  async cutin(ev) {
    const v = this.vus[ev.u]; this.sfx('ego'); this.hold = 60;
    this.cut = { age: 0, dur: 1.7 / Math.max(1, Math.min(this.spd, 2.5)), v, sk: ev, col: SIN[ev.sin].c, dk: SIN[ev.sin].d };
    await this.wait(1500 / Math.max(1, Math.min(this.spd, 2.5)));
    this.flash = .9; this.sfx('egoHit'); this.kickShake(14, 0); await this.wait(120);
  }
}
