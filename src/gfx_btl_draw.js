'use strict';
/* ============================================================
   LAMPWARDEN COMPANY — gfx_btl_draw.js  (戦闘ビュー描画 v2)
   ユニット・残像・軌跡・HPプレート(混乱線)・FX・オーバーレイ
   ============================================================ */
const FONT2 = s => `${s}px "Dela Gothic One", "Zen Kaku Gothic New", "Hiragino Sans", "Noto Sans JP", sans-serif`;
function starPath(c, x, y, r, n, inner) { c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r * (inner || .45) : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }
function outText(c, s, x, y, size, fill, o) {
  o = o || {}; c.font = o.font || FONT(o.w || 700, size); c.textAlign = o.al || 'center'; c.lineJoin = 'round'; c.lineWidth = o.lw || 3.4; c.strokeStyle = o.stroke || '#08060e';
  c.strokeText(s, x, y); c.fillStyle = fill; c.fillText(s, x, y);
}
class BattleViewDraw {
  /* ---------- 全体 ---------- */
  render() {
    const c = this.ctx, Q = this.Q; if (!this.bg) return;
    c.setTransform(Q, 0, 0, Q, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, BW, BH);
    const cam = this.cam, t = this.t, z = cam.z + cam.pz, fx = cam.fx + cam.kx, fy = cam.fy + cam.ky;
    const sa = this.shakeV * Math.sin(t * 90), sx = (Math.random() - .5) * this.shake + Math.cos(this.shakeA) * sa, sy = (Math.random() - .5) * this.shake + Math.sin(this.shakeA) * sa;
    const bs = 1.05 + (z - REST_Z) * .5, par = { x: (fx - 640) * .5 };
    // 背景: 画面空間で地平線を軸にわずかに拡大(カメラが引いても余白が出ない)
    const bgT = () => { c.translate(BW / 2 + sx * .5, HORIZON + sy * .5); c.scale(bs, bs); c.translate(-BW / 2, -HORIZON); };
    c.save(); bgT(); this.bg.draw(c, t, par); c.restore();
    // ワールド: ユニット・粒子・FX
    c.save(); c.translate(BW / 2 + sx, BH / 2 + sy); c.scale(z, z); c.translate(-fx, -fy);
    this.drawUnits(c, t); this.drawFx(c);
    c.restore();
    c.save(); bgT(); this.bg.front(c, t, par); c.restore();
    // 画面空間: HPプレート
    if (!this.cut) this.drawPlates(c, fx, fy, z);
    finishFx(c, this.bg, t, this.flash * .55, this.chroma);
    if (this.glitch > 0) this.drawGlitch(c);
    this.drawOverlay(c);
  }
  /* ---------- ユニット ---------- */
  drawUnits(c, t) {
    const list = this.vus.filter(v => v && v.alpha > .01);
    list.sort((a, b) => a.y - b.y);
    // 影(ジャンプ中は小さく薄く)
    list.forEach(v => {
      const m = v.cur || { dx: 0, dy: 0 }, up = Math.max(0, v.jy - (m.dy || 0) * v.sc), ss = 1 / (1 + up / 240), wsh = v.u.isAlly ? 1 : (v.u.art === 'hound' ? 1.5 : 1.25);
      c.save(); c.globalAlpha = .6 * Math.min(1, v.alpha * 1.4) * ss; c.translate(v.x + v.sp.x * .6 + v.face * (m.dx || 0) * v.sc, v.y + 4); c.scale(1, .22);
      const R = 125 * v.sc * wsh * ss * (1 + v.sp.s * -.3), g = c.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill(); c.restore();
    });
    for (const v of list) this.drawUnit(c, v, t);
  }
  bodyDraw(c, v, x, y, st) {
    const u = v.u;
    if (u.isAlly) drawSinner(c, u.look, u.key, x, y, v.sc, v.face, st);
    else drawEnemy(c, u, x, y, v.sc, v.face, st);
  }
  drawUnit(c, v, t) {
    const u = v.u, d = v.d; if (!d) return;
    const m = v.cur || this.motion(v), tt = t + v.t0, kn = v.kneel, pl = this.place(v, m);
    const bob = u.isAlly ? Math.sin(tt * 1.7) * 2.2 : 0;
    const img = isImgUnit(u), rotF = m.rot + v.lean + v.sp.r + (img ? 0 : kn * .16 + (v.die ? (u.isAlly ? -v.die * .9 : v.die * .2) : 0));
    const sy = m.sy * (1 + v.sp.s) * (1 - v.sq) * (1 - (img ? 0 : kn * (u.isAlly ? .12 : .1))), sxs = m.sx * (1 - v.sp.s * .6) * (1 + v.sq * .5);
    const x = pl.x, y = pl.y + (img ? 0 : bob + kn * (u.isAlly ? 14 : 10) * v.sc + v.die * (u.isAlly ? 36 : -14) * v.sc);
    let tint = null, expr = v.expr;
    if (d.panic > 0) { tint = img ? null : `rgba(255,40,70,${.25 + .15 * Math.sin(t * 14)})`; if (expr === 'n') expr = 'panic'; }
    if (d.stag > 0) { tint = img ? null : (tint || 'rgba(255,220,140,.12)'); expr = 'hurt'; }
    if (kn && u.isAlly) expr = 'hurt';
    const pose = u.isAlly ? { hx: m.hx, hy: m.hy, ang: m.ang } : null;
    const fr = img ? imgFrame(this, v) : null, st = { fr, t: tt, flash: v.flash, alpha: v.alpha * (m.al == null ? 1 : m.al), expr, glow: v.glow, tint, sx: sxs, sy, rot: v.face * rotF, pose };
    // 残像
    if (v.ghosts.length) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const g of v.ghosts) { const a = (1 - g.age / g.life) * .42; this.bodyDraw(c, v, g.x, g.y, { t: tt, alpha: a, flash: 0, tint: rgba(g.col, .7), fr: g.fr, sx: g.m.sx, sy: g.m.sy * (1 - g.sq), rot: v.face * (g.m.rot + g.rot), pose: u.isAlly ? { hx: g.m.hx, hy: g.m.hy, ang: g.m.ang } : null, expr: 'n', glow: 0 }); }
      c.restore();
    }
    // 反射(濡れた床)
    if (this.bg.theme === 'station' || this.bg.theme === 'mirror' || this.bg.theme === 'title') {
      c.save(); c.globalAlpha = .1 * v.alpha; c.translate(0, v.y * 2 + 8); c.scale(1, -1);
      this.bodyDraw(c, v, x, v.y + (y - pl.y) * .3 - (v.jy), { fr, t: tt, expr, pose, sx: sxs, sy, rot: st.rot });
      c.restore();
    }
    this.bodyDraw(c, v, x, y, st);
    if (u.isAlly) this.drawTrail(c, v);
    if (d.stag > 0 && v.alpha > .3) this.drawDizzy(c, v, x, y);
  }
  /* 武器の軌跡(リボン) */
  drawTrail(c, v) {
    const tr = v.trail; if (tr.length < 2) return;
    c.save(); c.globalCompositeOperation = 'lighter';
    const pass = (k, a, colFn) => {
      for (let i = 1; i < tr.length; i++) {
        const p = tr[i - 1], q = tr[i]; if (q.age - p.age > .08) continue;
        const al = Math.max(0, 1 - q.age / .24) * a, tw = k;
        const ax = lerp(q.tx, q.ix, 1 - tw), ay = lerp(q.ty, q.iy, 1 - tw), bx = lerp(p.tx, p.ix, 1 - tw), by = lerp(p.ty, p.iy, 1 - tw);
        c.fillStyle = colFn(q, al); c.beginPath(); c.moveTo(p.tx, p.ty); c.lineTo(q.tx, q.ty); c.lineTo(ax, ay); c.lineTo(bx, by); c.closePath(); c.fill();
      }
    };
    pass(1, .5, (q, a) => rgba(q.col, a)); pass(.5, .85, (q, a) => rgba('#ffffff', a * .8));
    // 先端の輝線
    c.lineCap = 'round'; c.lineWidth = 3;
    for (let i = 1; i < tr.length; i++) { const p = tr[i - 1], q = tr[i]; if (q.age - p.age > .08) continue; c.strokeStyle = rgba('#ffffff', Math.max(0, 1 - q.age / .2) * .9); c.beginPath(); c.moveTo(p.tx, p.ty); c.lineTo(q.tx, q.ty); c.stroke(); }
    c.restore();
  }
  drawDizzy(c, v, x, y) {
    const R = 38 * (v.sc * 1.4 + .35), hy = y - v.hh * .98, n = 4;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const a = v.dizzy * 3.4 + i * TAU / n, sxp = x + Math.cos(a) * R, syp = hy + Math.sin(a) * R * .26, back = Math.sin(a) < 0, r = back ? 6 : 9;
      c.globalAlpha = back ? .55 : 1; glowDot(c, sxp, syp, r * 2.2, '#ffd479', .5); c.fillStyle = '#fff3c0'; starPath(c, sxp, syp, r, 5, .45); c.fill();
    }
    c.restore();
  }
  /* ---------- HPプレート(画面空間) ---------- */
  drawPlates(c, fx, fy, z) {
    const list = this.vus.filter(v => v && v.d && v.d.alive && v.alpha > .05 && !v.dead);
    // 奥から手前へ
    list.sort((a, b) => a.y - b.y);
    for (const v of list) {
      if (v.u.boss) continue;
      const sx = (v.x + v.sp.x * .4 - fx) * z + BW / 2, top = (v.y - v.hh - fy) * z + BH / 2 - 8;
      this.drawPlate(c, v, sx, top);
    }
  }
  drawPlate(c, v, x, top) {
    const u = v.u, d = v.d, ally = u.isAlly; c.save(); c.globalAlpha = Math.min(1, v.alpha * 1.3) * (this.clashUI && !(this.att && (this.att.a === v || this.att.b === v)) ? .5 : 1);
    const w = ally ? 104 : 120, h = ally ? 12 : 14, bx = x - w / 2;
    const ti = d.ti != null ? d.ti : u.thrIdx, nx = u.thr[ti], hasNx = !ally && nx != null && d.stag <= 0;
    let yb = top - 2; if (hasNx) { const rem = Math.max(0, Math.ceil(v.hpv - u.maxHp * nx)); outText(c, `混乱まで ${rem}`, x, yb - 1.5, 10.5, '#ffd479', { w: 700, lw: 3 }); yb -= 13; }
    const by = yb - h;
    this.hpBar(c, bx, by, w, h, v, { num: true });
    let ly = by - 6;
    if (!ally) {
      outText(c, `Lv${u.lv} ${u.name}`, x, by - 6, 12, '#efe9f5', { w: 500, lw: 3 }); ly = by - 20;
      if (d.st.length) { d.st.forEach((s, i) => { const ss = ST[s[0]], ix = bx + 8 + i * 26, iy = by - 30; c.fillStyle = rgba(ss.c, .95); c.beginPath(); c.arc(ix, iy, 8.5, 0, TAU); c.fill(); c.strokeStyle = '#08060e'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#10060c'; c.font = FONT(700, 10); c.textAlign = 'center'; c.fillText(ss.g, ix, iy + 3.6); outText(c, s[1], ix + 8, iy + 14, 9.5, '#fff', { lw: 3 }); }); ly = by - 46; }
    }
    if (d.stag > 0) this.stagLabel(c, x, ly - 2);
    else if (d.panic > 0) outText(c, 'PANIC', x, ly - 1, 14, '#ff3b4d', { lw: 4 });
    c.restore();
  }
  /* HPバー: 現在値・ダメージ遅延・混乱線(閾値)・次の混乱線までの区間 */
  hpBar(c, x, y, w, h, v, o) {
    o = o || {}; const u = v.u, d = v.d, mx = u.maxHp, f = clamp(v.hpv / mx, 0, 1), fg = clamp(v.hpg / mx, 0, 1), ti = d.ti != null ? d.ti : u.thrIdx;
    const t = this.t;
    c.fillStyle = 'rgba(8,6,14,.92)'; c.fillRect(x - 2, y - 2, w + 4, h + 4);
    c.fillStyle = 'rgba(255,255,255,.78)'; c.fillRect(x, y, w * fg, h);
    const g = c.createLinearGradient(x, 0, x + w, 0);
    if (u.isAlly) { g.addColorStop(0, '#2a9d8f'); g.addColorStop(1, '#7ee08a'); } else { g.addColorStop(0, '#a01a34'); g.addColorStop(1, '#ff7a4a'); }
    c.fillStyle = g; c.fillRect(x, y, w * f, h);
    c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(x, y, w * f, h * .38);
    // 混乱ゾーン(最後の混乱線より下は常に色が変わる) と 次の混乱線までの"削る区間"
    const nx = u.thr[ti];
    if (nx != null && f > nx) {
      const x0 = x + w * nx, x1 = x + w * f;
      c.save(); c.beginPath(); c.rect(x0, y, x1 - x0, h); c.clip();
      const off = (t * 22) % 10; c.strokeStyle = 'rgba(255,255,255,.34)'; c.lineWidth = 3;
      for (let sx = x0 - h - 10 + off; sx < x1 + h; sx += 10) { c.beginPath(); c.moveTo(sx, y + h); c.lineTo(sx + h, y); c.stroke(); }
      c.restore();
    }
    // 混乱線
    u.thr.forEach((th, i) => {
      const X = x + w * th, passed = i < ti, next = i === ti, near = next && f - th < .14 && f > th, pul = near ? .6 + .4 * Math.sin(t * 12) : 1;
      if (passed) { c.fillStyle = 'rgba(160,160,180,.55)'; c.fillRect(X - 1, y - 2, 2, h + 4); return; }
      c.save(); c.shadowColor = '#ffd479'; c.shadowBlur = next ? 7 * pul : 3;
      c.fillStyle = next ? `rgba(255,236,170,${pul})` : 'rgba(255,255,255,.85)'; c.fillRect(X - (next ? 1.5 : 1), y - 3, next ? 3 : 2, h + 6);
      c.beginPath(); c.moveTo(X - 4, y - 7); c.lineTo(X + 4, y - 7); c.lineTo(X, y - 1.5); c.closePath(); c.fillStyle = next ? '#ffd479' : '#ffffff'; c.fill(); c.restore();
    });
    if (o.num) {
      const hp = Math.ceil(v.hpv); c.save(); c.font = FONT(700, h >= 14 ? 11.5 : 10.5); c.textAlign = 'center';
      const s = `${hp}`, sub = ` / ${mx}`; const w1 = c.measureText(s).width; c.font = FONT(500, 9.5); const w2 = c.measureText(sub).width, tx = x + w / 2 - (w1 + w2) / 2;
      c.textAlign = 'left'; c.lineJoin = 'round'; c.lineWidth = 3; c.strokeStyle = '#08060e'; c.font = FONT(700, h >= 14 ? 11.5 : 10.5); c.strokeText(s, tx, y + h - 2.6); c.fillStyle = '#ffffff'; c.fillText(s, tx, y + h - 2.6);
      c.font = FONT(500, 9.5); c.strokeText(sub, tx + w1, y + h - 2.6); c.fillStyle = '#d8d0e8'; c.fillText(sub, tx + w1, y + h - 2.6); c.restore();
    }
  }
  stagLabel(c, x, y) { const a = .75 + .25 * Math.sin(this.t * 10); c.save(); c.font = FONT2(17); c.textAlign = 'center'; c.lineJoin = 'round'; c.lineWidth = 4; c.strokeStyle = '#2a0a0a'; c.strokeText('混乱', x, y); c.fillStyle = `rgba(255,214,110,${a})`; c.fillText('混乱', x, y); c.restore(); }
  /* ---------- 粒子・FX ---------- */
  drawFx(c) {
    for (const p of this.parts) {
      const a = Math.max(0, p.l / p.m); c.save(); c.globalAlpha = Math.min(1, a * 1.3); if (p.add) c.globalCompositeOperation = 'lighter'; c.fillStyle = p.col; c.translate(p.x, p.y);
      switch (p.shape) {
        case 'shard': c.rotate(p.rot); c.beginPath(); c.moveTo(-p.size, -p.size * .5); c.lineTo(p.size * 1.6, 0); c.lineTo(-p.size * .3, p.size); c.closePath(); c.fill(); break;
        case 'streak': { const L = Math.min(70, Math.hypot(p.vx, p.vy) * .055 + p.size * 2.5); c.rotate(Math.atan2(p.vy, p.vx)); c.strokeStyle = p.col; c.lineCap = 'round'; c.lineWidth = Math.max(1, p.size * .8 * (.4 + a * .6)); c.beginPath(); c.moveTo(-L, 0); c.lineTo(0, 0); c.stroke(); break; }
        case 'star': c.rotate(p.rot); starPath(c, 0, 0, p.size * 1.9 * (.5 + a * .5), 4, .28); c.fill(); break;
        case 'diamond': c.rotate(p.rot); c.beginPath(); c.moveTo(0, -p.size * 1.1); c.lineTo(p.size * .65, 0); c.lineTo(0, p.size * 1.1); c.lineTo(-p.size * .65, 0); c.closePath(); c.fill(); c.globalAlpha *= .6; c.fillStyle = '#ffffff'; c.fillRect(-p.size * .12, -p.size * .8, p.size * .24, p.size * 1.2); break;
        case 'petal': c.rotate(p.rot); c.scale(1, .35 + .65 * Math.abs(Math.cos(p.rot * 1.7))); c.beginPath(); c.ellipse(0, 0, p.size * 1.7, p.size * .8, 0, 0, TAU); c.fill(); break;
        case 'drop': c.beginPath(); c.arc(0, p.size * .3, p.size * .8, 0, TAU); c.moveTo(-p.size * .7, 0); c.lineTo(0, -p.size * 1.7); c.lineTo(p.size * .7, 0); c.fill(); break;
        case 'smoke': { c.globalAlpha = a * .36; const r = p.size * (1 + (1 - a) * p.grow); const g = c.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, p.col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); break; }
        case 'debris': c.rotate(p.rot * 2); c.fillStyle = p.col; c.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .7); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(-p.size / 2, 0, p.size, p.size * .2); break;
        case 'feather': c.rotate(p.rot); c.scale(1, .4 + .6 * Math.abs(Math.cos(p.rot * 1.3))); c.beginPath(); c.moveTo(-p.size * 2, 0); c.quadraticCurveTo(0, -p.size * .9, p.size * 2, 0); c.quadraticCurveTo(0, p.size * .9, -p.size * 2, 0); c.fill(); break;
        case 'wisp': { c.rotate(p.rot); c.strokeStyle = p.col; c.lineCap = 'round'; c.lineWidth = Math.max(1, p.size * .55 * a); c.beginPath(); c.arc(0, 0, p.size * 2.2, 0, 4.2); c.stroke(); break; }
        case 'ember': { const fl = .7 + .3 * Math.sin(p.rot * 6 + p.l * 22); glowDot(c, 0, 0, p.size * 2.6 * fl, p.col, .9); break; }
        default: c.beginPath(); c.arc(0, 0, p.size * (.4 + a * .6), 0, TAU); c.fill();
      }
      c.restore();
    }
    for (const f of this.fx) {
      const p = f.age / f.dur;
      switch (f.k) {
        case 'cres': this.fxCres(c, f, p); break;
        case 'lance': {
          const age = f.age - 0, e = ease.out(Math.min(1, p * 2.4)), L = f.len * e, a = 1 - ease.in(p);
          c.save(); c.translate(f.x, f.y); c.rotate(f.ang); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a;
          const g = c.createLinearGradient(-L, 0, 40, 0); g.addColorStop(0, rgba(f.col, 0)); g.addColorStop(.7, rgba(f.col, .9)); g.addColorStop(1, '#ffffff');
          c.fillStyle = g; c.beginPath(); c.moveTo(-L, -2); c.lineTo(40, 0); c.lineTo(-L, 2); c.closePath(); c.fill();
          c.globalAlpha = a * .5; c.beginPath(); c.moveTo(-L * .85, -13); c.lineTo(34, 0); c.lineTo(-L * .85, 13); c.closePath(); c.fill();
          c.globalAlpha = a; glowDot(c, 0, 0, 74 * (1 - p * .5), f.col, .9); c.restore(); break;
        }
        case 'star': { const r = f.r * (1 - p * .35), a = 1 - ease.in(p); c.save(); c.translate(f.x, f.y); c.rotate(f.rot + p * .6); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; glowDot(c, 0, 0, r * .9, f.col, .8); c.fillStyle = '#ffffff'; c.beginPath(); for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4, rr = i % 2 ? r * .13 : (i % 4 === 0 ? r : r * .55); c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } c.closePath(); c.fill(); c.restore(); break; }
        case 'rays': { c.save(); c.translate(f.x, f.y); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; const e = ease.out(p); f.a.forEach(r => { const r0 = f.len * .14 + e * f.len * .55 * r[1], r1 = r0 + f.len * .4 * (1 - p) * r[1]; c.strokeStyle = rgba(f.col, (1 - p) * .85); c.lineWidth = 1 + 2.4 * (1 - p); c.beginPath(); c.moveTo(Math.cos(r[0]) * r0, Math.sin(r[0]) * r0); c.lineTo(Math.cos(r[0]) * r1, Math.sin(r[0]) * r1); c.stroke(); }); c.restore(); break; }
        case 'crack': { const a = p < .55 ? 1 : 1 - (p - .55) / .45, e = ease.out(Math.min(1, p * 4)); c.save(); c.translate(f.x, f.y); c.lineCap = 'round'; f.segs.forEach(s => { if (s[4] > e + .2) return; c.strokeStyle = `rgba(10,6,16,${a * .9})`; c.lineWidth = 3.2 * s[4] + .8; c.beginPath(); c.moveTo(s[0] * e, s[1] * e); c.lineTo(s[2] * e, s[3] * e); c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(f.col, a * .7 * (1 - p * .5)); c.lineWidth = 1.2; c.stroke(); c.globalCompositeOperation = 'source-over'; }); c.restore(); break; }
        case 'smash': {
          c.save(); c.translate(f.x, f.y); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - p; glowDot(c, 0, 0, 130 * (.4 + p), f.col, .9);
          c.strokeStyle = '#ffffff'; c.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + .3, r0 = 30 + p * 100, r1 = r0 + 34 * (1 - p); c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke(); } c.restore(); break;
        }
        case 'ring': { const e = ease.out(p), a = 1 - p; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = f.col; c.globalAlpha = a * .9; c.lineWidth = 7 * (1 - p) + 1; c.beginPath(); c.ellipse(f.x, f.y, f.r * e, f.r * e * .75, 0, 0, TAU); c.stroke(); c.globalAlpha = a * .45; c.lineWidth = 2; c.beginPath(); c.ellipse(f.x, f.y, f.r * e * .78, f.r * e * .78 * .75, 0, 0, TAU); c.stroke(); c.restore(); break; }
        case 'clockring': { const e = ease.out(p), r = f.r * (.55 + .45 * e); c.save(); c.translate(f.x, f.y); c.scale(1, .8); c.rotate(p * 1.6); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - p) * .9; c.strokeStyle = f.col; c.lineWidth = 2.4; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); for (let i = 0; i < 12; i++) { const a = i * TAU / 12; c.lineWidth = i % 3 ? 1.4 : 3; c.beginPath(); c.moveTo(Math.cos(a) * r * .86, Math.sin(a) * r * .86); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.stroke(); } c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(p * 9) * r * .6, Math.sin(p * 9) * r * .6); c.stroke(); c.restore(); break; }
        case 'beam': { const a = Math.pow(1 - p, .8), w = 70 * (1 - p * .55), H = 430; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; const g = c.createLinearGradient(f.x - w, 0, f.x + w, 0); g.addColorStop(0, rgba(f.col, 0)); g.addColorStop(.35, rgba(f.col, .55)); g.addColorStop(.5, 'rgba(255,255,255,.95)'); g.addColorStop(.65, rgba(f.col, .55)); g.addColorStop(1, rgba(f.col, 0)); c.fillStyle = g; const gy = c.createLinearGradient(0, f.y - H, 0, f.y); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(1, 'rgba(0,0,0,1)'); c.beginPath(); c.moveTo(f.x - w, f.y); c.lineTo(f.x - w * .6, f.y - H); c.lineTo(f.x + w * .6, f.y - H); c.lineTo(f.x + w, f.y); c.closePath(); c.fill(); glowDot(c, f.x, f.y, 110 * (1 - p * .4), f.col, .8); c.restore(); break; }
        case 'streak': { const a = 1 - p, e = ease.out(Math.min(1, p * 3)); c.save(); c.globalCompositeOperation = 'lighter'; const dx = f.x1 - f.x0, dy = f.y1 - f.y0, ln = Math.hypot(dx, dy) || 1, nx = -dy / ln, ny = dx / ln, wd = 30 * (1 - p); const ex = f.x0 + dx * e, ey = f.y0 + dy * e; c.globalAlpha = a; c.fillStyle = rgba(f.col, .55); c.beginPath(); c.moveTo(f.x0, f.y0); c.lineTo(ex + nx * wd, ey + ny * wd); c.lineTo(ex - nx * wd, ey - ny * wd); c.closePath(); c.fill(); c.fillStyle = '#ffffff'; c.globalAlpha = a * .8; c.beginPath(); c.moveTo(f.x0, f.y0); c.lineTo(ex + nx * wd * .3, ey + ny * wd * .3); c.lineTo(ex - nx * wd * .3, ey - ny * wd * .3); c.closePath(); c.fill(); c.restore(); break; }
        case 'proj': {
          if (f.pp >= 1) break; const x = lerp(f.x0, f.x1, f.pp), y = lerp(f.y0, f.y1, f.pp) - Math.sin(f.pp * Math.PI) * 30;
          c.save(); c.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 6; i++) { const q = Math.max(0, f.pp - i * .045); glowDot(c, lerp(f.x0, f.x1, q), lerp(f.y0, f.y1, q) - Math.sin(q * Math.PI) * 30, 18 - i * 2, f.col, .5 - i * .07); }
          if (f.kind === 'note') { c.fillStyle = '#ffffff'; c.font = FONT(700, 34); c.textAlign = 'center'; c.shadowColor = f.col; c.shadowBlur = 14; c.fillText(f.pp < .5 ? '♪' : '♫', x, y + 10); for (let i = 1; i < 4; i++) { c.globalAlpha = .6 / i; c.strokeStyle = f.col; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 14 + i * 12 + f.pp * 18, -.9, .9); c.stroke(); } }
          else { glowDot(c, x, y, 40, f.col, .9); c.globalCompositeOperation = 'source-over'; gear(c, x, y, 13, 8, 5, '#c9a24a', '#fff0b0'); }
          c.restore(); break;
        }
        case 'glass': { const e = ease.out(Math.min(1, p * 3.2)), a = p < .5 ? 1 : 1 - (p - .5) / .5; c.save(); c.translate(f.x, f.y); c.lineCap = 'round'; c.globalAlpha = a; f.a.forEach((r, i) => { let x = 0, y = 0, an = r[0]; const L = 340 * r[1] * e, n = 6; c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); for (let j = 1; j <= n; j++) { an += Math.sin(i * 7.1 + j * 2.3) * .28; x += Math.cos(an) * L / n; y += Math.sin(an) * L / n; c.lineTo(x, y); } c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(f.col, .6); c.lineWidth = 5; c.stroke(); c.globalCompositeOperation = 'source-over'; }); c.restore(); break; }
        case 'num': {
          const rise = ease.out(Math.min(1, p * 2)) * 54, sc = p < .12 ? 1 + (1 - p / .12) * .9 : 1, a = p > .75 ? 1 - (p - .75) / .25 : 1;
          c.save(); c.translate(f.x, f.y - rise); c.scale(sc, sc); c.globalAlpha = a; c.textAlign = 'center'; c.font = FONT(700, f.size); c.lineJoin = 'round'; c.lineWidth = 6; c.strokeStyle = f.stroke; c.strokeText(f.text, 0, 0); c.fillStyle = f.col; c.fillText(f.text, 0, 0);
          if (f.crit) { c.globalCompositeOperation = 'lighter'; glowDot(c, 0, -f.size * .3, f.size * 1.6, '#ffe34a', .35); c.globalCompositeOperation = 'source-over'; }
          if (f.sub) { c.font = FONT(700, 13); c.lineWidth = 4; c.strokeText(f.sub, 0, 16); c.fillStyle = f.subc || '#fff'; c.fillText(f.sub, 0, 16); }
          c.restore(); break;
        }
        case 'tag': { const rise = ease.out(Math.min(1, p * 2.2)) * 20, a = p > .7 ? 1 - (p - .7) / .3 : Math.min(1, p * 8); c.save(); c.globalAlpha = a; c.textAlign = 'center'; c.font = FONT(700, 17); c.lineWidth = 5; c.strokeStyle = '#08060e'; c.strokeText(f.text, f.x, f.y - rise); c.fillStyle = f.col; c.fillText(f.text, f.x, f.y - rise); c.restore(); break; }
        case 'coin': { c.save(); c.globalAlpha = p > .8 ? 1 - (p - .8) / .2 : 1; drawCoinToss(c, f.x, f.y, 11, Math.min(1, p / .72), !!f.heads, f.col, false, 54); c.restore(); break; }
        case 'stag': {
          c.save(); const a = p < .1 ? p / .1 : p > .72 ? 1 - (p - .72) / .28 : 1, k = 1 + (1 - Math.min(1, p * 5)) * .7; c.globalAlpha = a; c.translate(f.x, f.y); c.scale(k, k); c.rotate(-.04 + Math.sin(p * 40) * .01 * (1 - p));
          c.textAlign = 'center'; c.font = FONT2(70); c.lineJoin = 'round'; c.lineWidth = 11; c.strokeStyle = '#3a0810'; c.strokeText('混乱', 0, 0);
          const g = c.createLinearGradient(0, -52, 0, 10); g.addColorStop(0, '#fff3c0'); g.addColorStop(1, '#ffb347'); c.fillStyle = g; c.fillText('混乱', 0, 0);
          c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * .5 * (1 - p); glowDot(c, 0, -22, 110, '#ffd479', .6); c.globalCompositeOperation = 'source-over'; c.globalAlpha = a;
          c.font = FONT(700, 20); c.lineWidth = 5; c.strokeText('S T A G G E R', 0, 28); c.fillStyle = '#ffe9b0'; c.fillText('S T A G G E R', 0, 28); c.restore(); break;
        }
      }
    }
  }
  /* 三日月型の斬撃 */
  fxCres(c, f, p) {
    if (f.delay && f.age < f.delay) return; const q = f.delay ? (f.age - f.delay) / (f.dur - f.delay) : p; if (q < 0 || q > 1) return;
    const reveal = ease.out(Math.min(1, q / .3)), fade = q < .3 ? 1 : 1 - ease.io((q - .3) / .7);
    const s1 = reveal, s0 = q < .16 ? 0 : ease.in(Math.min(1, (q - .16) / .6)) * s1 * .92;
    if (s1 - s0 < .02) return;
    const L = f.len, N = 22, B = f.bulge;
    const pt = s => [(s - .5) * L, -Math.sin(s * Math.PI) * B * L * .35];
    const poly = k => {
      const up = [], dn = [];
      for (let i = 0; i <= N; i++) {
        const s = s0 + (s1 - s0) * i / N, [x, y] = pt(s), [x2, y2] = pt(Math.min(1, s + .01)), dx = x2 - x, dy = y2 - y, ln = Math.hypot(dx, dy) || 1, nx = -dy / ln, ny = dx / ln;
        const qq = i / N, th = f.w * k * Math.pow(Math.sin(qq * Math.PI), .7) * (.35 + .65 * qq) * (1 - q * .25);
        up.push([x + nx * th * .65, y + ny * th * .65]); dn.push([x - nx * th * .35, y - ny * th * .35]);
      }
      c.beginPath(); up.forEach((v, i) => i ? c.lineTo(v[0], v[1]) : c.moveTo(v[0], v[1])); for (let i = dn.length - 1; i >= 0; i--) c.lineTo(dn[i][0], dn[i][1]); c.closePath();
    };
    c.save(); c.translate(f.x, f.y); c.rotate(f.ang); c.globalCompositeOperation = 'lighter';
    c.globalAlpha = fade * .55; c.fillStyle = f.col; poly(2.6); c.fill();
    c.globalAlpha = fade * .8; c.fillStyle = rgba(f.col, .9); poly(1.5); c.fill();
    c.globalAlpha = fade; c.fillStyle = '#ffffff'; poly(.7); c.fill();
    const [hx, hy] = pt(s1); c.globalAlpha = fade; glowDot(c, hx, hy, 46 * (1 - q * .6), f.col, .9);
    c.restore();
  }
  /* ---------- 画面空間のオーバーレイ ---------- */
  drawOverlay(c) {
    // 被ダメージの縁の赤
    if (this.hurt > .02) { const g = c.createRadialGradient(BW / 2, BH / 2, BH * .38, BW / 2, BH / 2, BW * .66); g.addColorStop(0, 'rgba(190,16,40,0)'); g.addColorStop(1, `rgba(190,16,40,${.5 * this.hurt})`); c.fillStyle = g; c.fillRect(0, 0, BW, BH); }
    // 集中線
    if (this.speed > .02) { const s = this.speed, cx = this.spx, cy = this.spy; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (let i = 0; i < 38; i++) { const a = Math.random() * TAU, r0 = 150 + Math.random() * 260, r1 = r0 + 120 + Math.random() * 340; c.strokeStyle = `rgba(255,255,255,${(.1 + Math.random() * .22) * s})`; c.lineWidth = 1 + Math.random() * 2.4; c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); c.stroke(); } c.restore(); }
    const ui = this.clashUI;
    if (ui && ui.show > .01) this.drawClashUI(c, ui);
    if (this.matchCut) this.drawMatchCut(c);
    this.drawBossBar(c);
    if (this.cut) this.drawCut(c);
    for (const b of this.banners) {
      const p = b.age / b.dur, a = p < .15 ? p / .15 : p > .75 ? 1 - (p - .75) / .25 : 1, off = (1 - ease.out(Math.min(1, p * 4))) * 140;
      c.save(); c.globalAlpha = a; const y = 300;
      const g = c.createLinearGradient(0, 0, BW, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.25, 'rgba(8,4,16,.82)'); g.addColorStop(.75, 'rgba(8,4,16,.82)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, y - 52, BW, 104);
      c.fillStyle = rgba(b.col, .9); c.fillRect(BW * .22, y - 53, BW * .56, 2); c.fillRect(BW * .22, y + 51, BW * .56, 2);
      c.textAlign = 'center'; c.font = FONT(700, 62); c.lineWidth = 7; c.strokeStyle = '#08060e'; c.strokeText(b.text, BW / 2 + off, y + 22); c.fillStyle = b.col; c.fillText(b.text, BW / 2 + off, y + 22);
      if (b.sub) { c.font = FONT(500, 18); c.fillStyle = '#d8d0e8'; c.fillText(b.sub, BW / 2, y + 46); }
      c.restore();
    }
  }
  /* ボスHPバー: 数値・混乱線・次の混乱線までの残り */
  drawBossBar(c) {
    const v = this.bossUI; if (!v || !v.d || !v.d.alive || this.cut) return; const u = v.u, d = v.d, w = 640, x = (BW - w) / 2, y = 30, ti = d.ti != null ? d.ti : u.thrIdx;
    c.save(); c.globalAlpha = this.clashUI ? .4 : 1;
    outText(c, u.name, x, y - 7, 21, '#f2ecff', { al: 'left', lw: 5 });
    outText(c, `Lv.${u.lv}   PHASE ${Math.min(u.thr.length, ti) + 1}/${u.thr.length + 1}`, x + w, y - 7, 15, '#c9a8ff', { al: 'right', w: 500, lw: 4 });
    this.hpBar(c, x, y, w, 20, v, { num: false });
    // 数値(大)
    const hp = Math.ceil(v.hpv); c.save(); c.font = FONT(700, 15); c.textAlign = 'center'; c.lineJoin = 'round'; c.lineWidth = 4; c.strokeStyle = '#08060e'; const tx = x + w / 2; c.strokeText(`${hp.toLocaleString()} / ${u.maxHp.toLocaleString()}`, tx, y + 15.5); c.fillStyle = '#ffffff'; c.fillText(`${hp.toLocaleString()} / ${u.maxHp.toLocaleString()}`, tx, y + 15.5); c.restore();
    // 混乱線のラベル
    u.thr.forEach((th, i) => { if (i < ti) return; const X = x + w * th, next = i === ti; outText(c, `混乱 ${Math.round(th * 100)}%`, X, y + 40, 11, next ? '#ffd479' : '#e8e0f4', { lw: 3.4 }); });
    const nx = u.thr[ti]; if (nx != null && d.stag <= 0) outText(c, `混乱まで ${Math.max(0, Math.ceil(v.hpv - u.maxHp * nx)).toLocaleString()}`, x, y + 40, 12, '#ffd479', { al: 'left', lw: 3.4 });
    if (d.stag > 0) this.stagLabel(c, BW / 2, y + 56);
    d.st.forEach((s, i) => { const ss = ST[s[0]], ix = x + 10 + i * 30, iy = y + 66; c.fillStyle = rgba(ss.c, .95); c.beginPath(); c.arc(ix, iy, 11, 0, TAU); c.fill(); c.strokeStyle = '#08060e'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#10060c'; c.font = FONT(700, 12); c.textAlign = 'center'; c.fillText(ss.g, ix, iy + 4); outText(c, s[1], ix + 10, iy + 17, 11, '#fff', { lw: 3 }); });
    c.restore();
  }
  drawGlitch(c) {
    const g = this.glitch; c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) { const y = Math.random() * BH, h = 6 + Math.random() * 26; c.fillStyle = `rgba(255,40,80,${.18 * g})`; c.fillRect(0, y, BW, h); c.fillStyle = `rgba(40,220,255,${.1 * g})`; c.fillRect(Math.random() * 30, y + 4, BW, h * .6); }
    c.restore(); c.fillStyle = `rgba(120,0,20,${.22 * g})`; c.fillRect(0, 0, BW, BH);
  }
  /* マッチ時の静止画カットイン(動きは後日差し替え予定) */
  drawMatchCut(c) {
    const mc = this.matchCut, p = (this.clock - mc.t0) / mc.dur; if (p >= 1) { this.matchCut = null; return; }
    const mid = IMOT[mc.img].match || 'match', im = imgGet(mc.img, mid), M = IMGMETA[mc.img][mid]; if (!im) return;
    const a = p < .15 ? p / .15 : p > .75 ? (1 - p) / .25 : 1, e = _IE.out(Math.min(1, p / .2));
    const h = 300, w = h * M.w / M.h, x = 36 - (1 - e) * 120, y = 128;
    c.save(); c.globalAlpha = a; c.shadowColor = mc.col; c.shadowBlur = 26;
    c.beginPath(); c.moveTo(x + 26, y); c.lineTo(x + w, y); c.lineTo(x + w - 26, y + h); c.lineTo(x, y + h); c.closePath();
    c.fillStyle = '#05030a'; c.fill(); c.shadowBlur = 0; c.save(); c.clip(); c.drawImage(im, x, y, w, h); c.restore();
    c.lineWidth = 3; c.strokeStyle = mc.col; c.beginPath(); c.moveTo(x + 26, y); c.lineTo(x + w, y); c.lineTo(x + w - 26, y + h); c.lineTo(x, y + h); c.closePath(); c.stroke();
    c.restore();
  }
  drawClashUI(c, ui) {
    const s = ui.show, y0 = 76;
    c.save(); c.globalAlpha = s;
    const g = c.createLinearGradient(0, y0 - 20, 0, y0 + 200); g.addColorStop(0, 'rgba(6,3,12,0)'); g.addColorStop(.25, 'rgba(6,3,12,.78)'); g.addColorStop(.85, 'rgba(6,3,12,.78)'); g.addColorStop(1, 'rgba(6,3,12,0)'); c.fillStyle = g; c.fillRect(0, y0 - 20, BW, 220);
    const side = (S, cx, dirn) => {
      const sk = S.sk, col = SIN[sk.sin] ? SIN[sk.sin].c : '#fff', v = S.v;
      // 名前タブ
      c.save(); c.translate(cx, y0 + 6); c.textAlign = 'center';
      c.fillStyle = rgba(col, .92); c.beginPath(); c.moveTo(-170, -14); c.lineTo(170, -14); c.lineTo(156, 12); c.lineTo(-156, 12); c.closePath(); c.fill();
      c.fillStyle = '#0a060e'; c.font = FONT(700, 16); c.fillText(`${v.u.name} / ${sk.n}`, 0, 5);
      // 威力レンジ
      c.font = FONT(500, 13); c.fillStyle = '#cfc6e0'; const pr = this.battle.powerRange(v.u, sk); c.fillText(`威力 ${pr[0]}-${pr[1]}   コイン${S.n}/${sk.nC}   (+${sk.cp})`, 0, 32);
      c.restore();
      // コイン列
      const n = S.n, gap = 40, x0 = cx - (n - 1) * gap / 2;
      for (let i = 0; i < n; i++) {
        const flips = S.flips, lost = (S.lose && i === n - 1 && S.pw != null);
        c.save(); c.globalAlpha = lost ? .4 : 1;
        if (flips) { const tt = S.tt || 600, k = clamp((S.rev * tt - i * 85) / 480, 0, 1); if (k <= 0) { c.restore(); continue; } drawCoinToss(c, x0 + i * gap, y0 + 74, 16, k, !!flips[i], col, lost, 78); }
        else drawCoin(c, x0 + i * gap, y0 + 74, 16, true, col, 1, lost);
        c.restore();
      }
      // 威力
      if (S.pw != null) { const win = (ui.w === 1 && S === ui.A) || (ui.w === 2 && S === ui.B); const lose = ui.w && !win; c.save(); c.textAlign = 'center'; c.font = FONT(700, win ? 64 : 52); c.lineWidth = 7; c.strokeStyle = '#08060e'; c.strokeText(S.pw, cx, y0 + 148); c.fillStyle = win ? '#fff3b0' : lose ? '#8a8aa0' : '#ffffff'; c.fillText(S.pw, cx, y0 + 148); if (win) { c.globalCompositeOperation = 'lighter'; glowDot(c, cx, y0 + 128, 70, col, .5); } c.restore(); }
    };
    const aL = ui.A.v.u.isAlly ? ui.A : ui.B, aR = ui.A.v.u.isAlly ? ui.B : ui.A;
    side(aL, 330, 1); side(aR, 950, -1);
    c.textAlign = 'center'; c.font = FONT(700, 34); c.lineWidth = 6; c.strokeStyle = '#08060e'; c.strokeText('VS', BW / 2, y0 + 92); c.fillStyle = '#ffd479'; c.fillText('VS', BW / 2, y0 + 92);
    c.restore();
  }
  drawCut(c) {
    const cu = this.cut, p = cu.age / cu.dur, v = cu.v, col = cu.col; const a = p < .1 ? p / .1 : p > .86 ? 1 - (p - .86) / .14 : 1;
    c.save(); c.globalAlpha = a;
    c.fillStyle = 'rgba(2,0,6,.78)'; c.fillRect(0, 0, BW, BH);
    // 斜めの帯
    c.save(); c.translate(BW / 2, BH / 2); c.rotate(-.12); const e = ease.out(Math.min(1, p * 4));
    const g = c.createLinearGradient(-BW, 0, BW, 0); g.addColorStop(0, rgba(col, 0)); g.addColorStop(.3, rgba(cu.dk, .95)); g.addColorStop(.7, rgba(cu.dk, .95)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(-BW, -150 * e, BW * 2, 300 * e);
    c.fillStyle = rgba(col, .95); c.fillRect(-BW, -152 * e, BW * 2, 4); c.fillRect(-BW, 148 * e, BW * 2, 4);
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(col, .35); c.lineWidth = 2; for (let i = 0; i < 14; i++) { const x = ((i * 190 + p * 1800) % (BW * 2)) - BW; c.beginPath(); c.moveTo(x, -140); c.lineTo(x - 60, 140); c.stroke(); } c.restore();
    // 巨大な罪の文字
    c.save(); c.globalAlpha = a * .18; c.font = FONT(700, 520); c.textAlign = 'center'; c.fillStyle = col; c.fillText(SIN[v.u.sinc].n[0], BW * .62, BH * .86); c.restore();
    // 肖像
    const pt = portrait(v.u.look, v.u.key, 520, 640, 'full'), px = lerp(-380, 120, ease.out(Math.min(1, p * 3.4)));
    c.save(); c.shadowColor = col; c.shadowBlur = 40; c.drawImage(pt, px, BH - 680, 520, 640); c.restore();
    // 技名
    c.textAlign = 'left'; const tx = lerp(1000, 560, ease.out(Math.min(1, p * 3))), ty = BH / 2 + 12;
    c.font = FONT(700, 16); c.fillStyle = col; c.fillText(`E.G.O  /  ${SIN[cu.sk.sin].n}  /  ${cu.sk.v === 'co' ? '侵蝕 CORROSION' : '覚醒 AWAKENING'}`, tx, ty - 58);
    c.font = FONT(700, 64); c.lineWidth = 8; c.strokeStyle = '#08060e'; c.strokeText(cu.sk.sk.replace('【侵蝕】', ''), tx, ty + 14); c.fillStyle = '#ffffff'; c.fillText(cu.sk.sk.replace('【侵蝕】', ''), tx, ty + 14);
    c.font = FONT(500, 22); c.fillStyle = '#e0d8f0'; c.fillText(`${v.u.name}  —  ${v.u.ident}`, tx, ty + 56);
    c.restore();
  }
}
for (const k of Object.getOwnPropertyNames(BattleViewDraw.prototype)) if (k !== 'constructor') BattleView.prototype[k] = BattleViewDraw.prototype[k];
/* コイントス: 真上(y軸正方向)へ打ち上がり、横軸まわりに回転(縦に潰れて見える)。
   k=0..1 が滞空。halfTurns が偶数なら表(heads)、奇数なら裏で着地するので、見た目と判定が必ず一致する。 */
function coinTossState(k, heads) {
  const N = 8 + (heads ? 0 : 1), kk = clamp(k, 0, 1), th = (1 - Math.pow(1 - kk, 1.7)) * N * Math.PI; // 終盤は回転が緩む
  const up = 4 * kk * (1 - kk);
  return { up, cos: Math.cos(th), land: kk >= 1 };
}
function drawCoinToss(c, x, y, r, k, finalHeads, col, lost, H) {
  const s = coinTossState(k, finalHeads), face = k >= 1 ? finalHeads : s.cos > 0, sy = k >= 1 ? 1 : Math.max(.1, Math.abs(s.cos)), h = (H == null ? 70 : H) * s.up;
  // 地面の影(高いほど小さく薄い)
  c.save(); c.globalAlpha = .38 * (1 - s.up * .7); c.fillStyle = '#000'; c.beginPath(); c.ellipse(x, y + r * 1.05, r * (1 - s.up * .35), r * .24 * (1 - s.up * .3), 0, 0, TAU); c.fill(); c.restore();
  c.save(); c.translate(0, -h);
  // 着地直後の小さなバウンド(潰れ→戻り)は呼び出し側のkでは表現せず、滞空中の拡大で奥行きを出す
  const zoom = 1 + s.up * .28;
  c.translate(x, y); c.scale(zoom, zoom); c.translate(-x, -y);
  if (k < 1 && sy < .3) { c.fillStyle = face ? '#8a6218' : '#3c4056'; c.fillRect(x - r, y - 1.6, r * 2, 3.2); }   // 縁(厚み)
  drawCoin(c, x, y, r, face, col, 1, lost && k >= 1, sy);
  if (k < 1) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = .55 * (1 - sy) ; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, y, r * .95, Math.max(1, r * .12), 0, 0, TAU); c.fill(); }
  c.restore();
}
function drawCoin(c, x, y, r, heads, col, sx, lost, sy) {
  c.save(); c.translate(x, y); c.scale(Math.max(.08, sx == null ? 1 : sx), sy == null ? 1 : sy);
  const g = c.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, r); if (heads) { g.addColorStop(0, '#fff6c8'); g.addColorStop(.5, '#e8c45a'); g.addColorStop(1, '#8a6218'); } else { g.addColorStop(0, '#9aa0b4'); g.addColorStop(.6, '#4a4f64'); g.addColorStop(1, '#22253a'); }
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.strokeStyle = heads ? '#4a3208' : '#0a0a14'; c.lineWidth = 2; c.stroke();
  c.strokeStyle = heads ? rgba(col, .9) : 'rgba(255,255,255,.18)'; c.lineWidth = 1.6; c.beginPath(); c.arc(0, 0, r * .68, 0, TAU); c.stroke();
  if (heads) { c.fillStyle = col; c.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; c.moveTo(Math.cos(a) * r * .5, Math.sin(a) * r * .5); c.lineTo(Math.cos(a + .6) * r * .18, Math.sin(a + .6) * r * .18); c.lineTo(Math.cos(a + Math.PI / 2) * r * .5, Math.sin(a + Math.PI / 2) * r * .5); } c.fill(); }
  else { c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-r * .3, -r * .3); c.lineTo(r * .3, r * .3); c.moveTo(r * .3, -r * .3); c.lineTo(-r * .3, r * .3); c.stroke(); }
  if (lost) { c.strokeStyle = '#ff4d5e'; c.lineWidth = 3; c.beginPath(); c.moveTo(-r, r); c.lineTo(r, -r); c.stroke(); }
  c.restore();
}
