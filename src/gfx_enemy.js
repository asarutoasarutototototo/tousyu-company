'use strict';
/* ============================================================
   LAMPWARDEN COMPANY — gfx_enemy.js
   異形の敵(蛾・猟犬・人形・影法師・鎧・合唱・時計)の手続き描画
   原点=足元中心、左向きが基準(味方へ向かう)
   ============================================================ */
function glowDot(c, x, y, r, col, a) {
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a == null ? 1 : a)); g.addColorStop(.35, rgba(col, (a == null ? 1 : a) * .45)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore();
}
const ENPAL = {
  moth: { a: '#2b2342', b: '#b88cff', glow: '#e3c8ff' },
  hound: { a: '#4a2a24', b: '#c0553a', glow: '#ff5a3a' },
  puppet: { a: '#6b4e3a', b: '#e8dcc8', glow: '#f2c14a' },
  shade: { a: '#120f20', b: '#7a6cff', glow: '#9fb4ff' },
  armor: { a: '#4a3c36', b: '#c9a24a', glow: '#ffb347' },
  chorus: { a: '#e9e4d6', b: '#b46bff', glow: '#d6a8ff' },
  clock: { a: '#2a2640', b: '#e8c96a', glow: '#ffd979' }
};
function wob(t, s, a) { return Math.sin(t * s) * a; }

function artMoth(c, t, p, boss) {
  const fl = Math.sin(t * 7) * .42, hov = wob(t, 2, 8);
  c.translate(0, -150 + hov);
  // 光の鱗粉
  glowDot(c, 0, -120, 190, p.glow, .22);
  const wing = (sx, sy, big) => {
    c.save(); c.translate(0, -230); c.scale(sx, 1); c.rotate((big ? -.35 : .5) + fl * (big ? 1 : .8) * -1);
    const path = cc => { if (big) { cc.moveTo(0, 0); cc.bezierCurveTo(60, -140, 210, -190, 250, -110); cc.bezierCurveTo(270, -50, 200, 20, 110, 30); cc.bezierCurveTo(60, 36, 20, 20, 0, 0); } else { cc.moveTo(0, 0); cc.bezierCurveTo(70, 10, 170, 40, 160, 120); cc.bezierCurveTo(150, 170, 80, 150, 20, 60); cc.closePath(); } };
    const g = c.createLinearGradient(0, 0, 250, -60); g.addColorStop(0, rgba(p.a, .95)); g.addColorStop(.5, rgba(p.b, .75)); g.addColorStop(1, rgba(light(p.b, .5), .35));
    shp(c, path, g, { sh: .2, ow: 2.4, out: '#120a20', rim: p.glow, rw: 6 });
    c.save(); c.beginPath(); path(c); c.clip();
    c.strokeStyle = rgba('#120a20', .45); c.lineWidth = 2; for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(80 + i * 22, -60 + i * 20, 230 - i * 8, -130 + i * 36); c.stroke(); }
    if (big) { glowDot(c, 170, -90, 34, p.glow, .9); c.fillStyle = '#1a0f2e'; c.beginPath(); c.arc(170, -90, 14, 0, TAU); c.fill(); c.fillStyle = p.glow; c.beginPath(); c.arc(166, -94, 5, 0, TAU); c.fill(); glowDot(c, 110, 0, 20, p.glow, .7); }
    c.restore(); c.restore();
  };
  wing(-1, 1, true); wing(-1, 1, false);
  // 胴
  shp(c, P.ell(0, -200, 30, 84), p.a, { rim: p.b, sh: .55 });
  c.save(); c.strokeStyle = rgba(p.b, .4); c.lineWidth = 2.5; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(0, -260 + i * 22, 28 - Math.abs(i - 2.5) * 2, .2, Math.PI - .2); c.stroke(); } c.restore();
  // 脚
  c.strokeStyle = '#120a20'; c.lineWidth = 4; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-8, -230 + i * 24); c.quadraticCurveTo(-40, -200 + i * 24, -30 + wob(t, 3 + i, 5), -150 + i * 30); c.stroke(); }
  // 頭
  shp(c, P.ell(-6, -300, 28, 26), light(p.a, .06), { rim: p.b, sh: .5 });
  [[-18, -304], [6, -304]].forEach(e => { shp(c, P.ell(e[0], e[1], 11, 13), '#22103a', { ow: 1.8 }); glowDot(c, e[0], e[1], 22, p.glow, .85); });
  c.strokeStyle = p.b; c.lineWidth = 3; c.lineCap = 'round';
  [[-1, -1], [1, -1]].forEach((s, i) => { c.beginPath(); c.moveTo(-6 + i * 12, -322); c.bezierCurveTo(-30 + i * 70, -380 + wob(t, 3, 6), -50 + i * 110, -400, -44 + i * 90, -430 + wob(t, 2.5, 4)); c.stroke(); });
}
function artHound(c, t, p, boss) {
  const br = wob(t, 3, 3), tail = wob(t, 5, .3);
  glowDot(c, -80, -100, 160, p.glow, .12);
  // 尾
  c.save(); c.translate(116, -150); c.rotate(-.4 + tail); shp(c, c => { c.moveTo(0, 0); c.quadraticCurveTo(50, -40, 80, -10); c.quadraticCurveTo(50, -24, 0, 14); c.closePath(); }, p.a, { rim: p.b }); c.restore();
  // 後脚/前脚
  const leg = (x, ph, front) => {
    const sw = Math.sin(t * 3 + ph) * 8;
    shp(c, c => capsule(c, x, -140, x + (front ? -14 : 18) + sw, -78, 12, 8), p.a, { rim: p.b });
    shp(c, c => capsule(c, x + (front ? -14 : 18) + sw, -78, x + (front ? -26 : 6) + sw, -6, 8, 6), dark(p.a, .2), { rim: p.b });
    shp(c, c => { c.moveTo(x + (front ? -38 : -6) + sw, -4); c.lineTo(x + (front ? -14 : 18) + sw, -4); c.lineTo(x + (front ? -16 : 14) + sw, -14); c.lineTo(x + (front ? -34 : -4) + sw, -14); c.closePath(); }, '#2a1a16', { ow: 1.8 });
  };
  leg(90, 0, false); leg(-60, 1.6, true); leg(60, 3.2, false); leg(-90, 4.8, true);
  // 胴
  const body = cc => { cc.moveTo(-100, -170 + br); cc.bezierCurveTo(-60, -210, 40, -200, 110, -176); cc.bezierCurveTo(130, -150, 120, -120, 90, -108); cc.bezierCurveTo(30, -100, -40, -104, -96, -118); cc.bezierCurveTo(-116, -134, -116, -156, -100, -170); cc.closePath(); };
  shp(c, body, p.a, { rim: p.b, sh: .55 });
  c.save(); c.beginPath(); body(c); c.clip();
  c.strokeStyle = rgba('#1a0c0a', .8); c.lineWidth = 3.2; for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(-70 + i * 24, -192); c.quadraticCurveTo(-60 + i * 24, -150, -64 + i * 24, -110); c.stroke(); }
  c.fillStyle = rgba(p.b, .5); for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(-60 + i * 36, -190 + (i % 2) * 8, 5, 0, TAU); c.fill(); }
  c.restore();
  // 鎖
  c.strokeStyle = '#7a6a60'; c.lineWidth = 3; c.setLineDash([7, 4]); c.beginPath(); c.moveTo(-60, -170); c.quadraticCurveTo(0, -120 + wob(t, 2, 6), 70, -168); c.stroke(); c.setLineDash([]);
  // 頭(頭骨)
  c.save(); c.translate(-118, -178 + br); c.rotate(wob(t, 2, .05));
  shp(c, c => { c.moveTo(0, -24); c.bezierCurveTo(-30, -34, -58, -22, -92, -4); c.lineTo(-92, 8); c.lineTo(-20, 14); c.lineTo(10, 26); c.bezierCurveTo(26, 8, 24, -14, 0, -24); c.closePath(); }, '#cfc6b4', { rim: p.glow, sh: .5, out: '#1a0c0a' });
  shp(c, c => { c.moveTo(-86, 10); c.lineTo(-24, 20); c.lineTo(-18, 34); c.lineTo(-80, 24); c.closePath(); }, '#b0a692', { sh: .5, out: '#1a0c0a' });
  c.fillStyle = '#1a0c0a'; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-80 + i * 14, 12); c.lineTo(-74 + i * 14, 22); c.lineTo(-70 + i * 14, 12); c.fill(); }
  glowDot(c, -14, -8, 28, p.glow, .95); c.fillStyle = '#fff2e0'; c.beginPath(); c.arc(-14, -8, 4, 0, TAU); c.fill();
  shp(c, c => { c.moveTo(8, -20); c.lineTo(34, -48); c.lineTo(20, -8); c.closePath(); }, '#cfc6b4', { out: '#1a0c0a' });
  c.restore();
}
function artPuppet(c, t, p, boss) {
  const sw = wob(t, 1.6, .08), hov = wob(t, 2.4, 6);
  c.translate(0, hov);
  // 糸
  c.strokeStyle = rgba('#e8dcc8', .45); c.lineWidth = 1.5;
  [[-40, -330], [0, -440], [44, -330], [-70, -190], [70, -190]].forEach(a => { c.beginPath(); c.moveTo(a[0] + sw * 120, a[1]); c.lineTo(a[0] * .4 + wob(t, 1.3, 14), -900); c.stroke(); });
  c.save(); c.rotate(sw);
  // ドレス
  shp(c, c => { c.moveTo(-34, -300); c.lineTo(34, -300); c.bezierCurveTo(60, -220, 90, -120, 100, -50); c.quadraticCurveTo(0, -26, -100, -50); c.bezierCurveTo(-90, -120, -60, -220, -34, -300); c.closePath(); }, '#5a2a4a', { rim: p.glow, sh: .55 });
  c.strokeStyle = rgba('#f2c14a', .8); c.lineWidth = 3; c.beginPath(); c.moveTo(-100, -50); c.quadraticCurveTo(0, -26, 100, -50); c.stroke();
  c.strokeStyle = rgba('#2a1020', .6); c.lineWidth = 2; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 8, -290); c.lineTo(i * 28, -52); c.stroke(); }
  // 胴
  shp(c, P.rr(-30, -380, 60, 90, 14), p.a, { rim: p.glow, sh: .5 });
  c.strokeStyle = '#2a1a10'; c.lineWidth = 2; c.beginPath(); c.moveTo(-30, -336); c.lineTo(30, -336); c.stroke();
  // 腕(だらり)
  const arm = (s) => { const sa = wob(t, 2 + s, .12); c.save(); c.translate(s * 34, -366); c.rotate(sa + s * .12); shp(c, c => capsule(c, 0, 0, s * 8, 62, 9, 8), p.a, { rim: p.glow }); shp(c, P.ell(s * 8, 66, 9, 9), p.b, { ow: 1.8 }); c.translate(s * 8, 66); c.rotate(-sa * 2); shp(c, c => capsule(c, 0, 0, s * -6, 58, 8, 7), p.a, { rim: p.glow }); shp(c, c => { c.moveTo(s * -6 - 6, 58); c.lineTo(s * -6 + 6, 58); c.lineTo(s * -6 + s * 2, 82); c.lineTo(s * -6 - s * 6, 78); c.closePath(); }, p.b, { ow: 1.8 }); c.restore(); };
  arm(-1); arm(1);
  // 首・頭
  c.save(); c.translate(0, -388); c.rotate(wob(t, 1.9, .14));
  shp(c, P.rr(-6, -4, 12, 18, 3), p.a, { ow: 1.8 });
  shp(c, c => { c.moveTo(-28, -40); c.bezierCurveTo(-28, -84, 28, -84, 28, -40); c.bezierCurveTo(28, -10, 10, 8, 0, 10); c.bezierCurveTo(-10, 8, -28, -10, -28, -40); c.closePath(); }, p.b, { rim: p.glow, sh: .4 });
  c.strokeStyle = 'rgba(80,60,50,.5)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-6, -78); c.lineTo(2, -54); c.lineTo(-4, -40); c.stroke();
  [[-12, -40], [12, -40]].forEach(e => { c.fillStyle = '#1a0c10'; c.beginPath(); c.ellipse(e[0], e[1], 7, 9, 0, 0, TAU); c.fill(); glowDot(c, e[0], e[1], 16, p.glow, .7); });
  c.strokeStyle = '#a02a3a'; c.lineWidth = 3; c.beginPath(); c.moveTo(-14, -14); c.quadraticCurveTo(0, -4, 14, -14); c.stroke();
  c.fillStyle = 'rgba(220,60,80,.5)'; c.beginPath(); c.arc(-18, -26, 5, 0, TAU); c.arc(18, -26, 5, 0, TAU); c.fill();
  shp(c, c => { c.moveTo(-34, -52); c.bezierCurveTo(-40, -110, 40, -110, 34, -52); c.lineTo(30, -66); c.bezierCurveTo(10, -88, -10, -88, -30, -66); c.closePath(); }, '#2a1a10', { rim: p.glow });
  c.restore();
  c.restore();
}
function artShade(c, t, p, boss) {
  const sw = wob(t, 1.7, 10), hov = wob(t, 2.1, 7);
  c.translate(0, hov - 30);
  glowDot(c, 0, -240, 210, p.b, .18);
  // 裾の揺らぎ
  const body = cc => { cc.moveTo(-26, -420); cc.bezierCurveTo(-70, -340, -60, -200, -80, -40); for (let i = 0; i <= 6; i++) { const x = -80 + i * 26.6; cc.lineTo(x + wob(t, 3 + i, 4), -40 + (i % 2 ? 26 : -6) + wob(t, 2 + i, 6)); } cc.bezierCurveTo(60, -200, 70, -340, 26, -420); cc.closePath(); };
  const g = c.createLinearGradient(0, -420, 0, 0); g.addColorStop(0, '#2a2650'); g.addColorStop(.5, p.a); g.addColorStop(1, rgba(p.a, .1));
  shp(c, body, g, { rim: p.glow, sh: .4, ow: 0, rw: 9 });
  // 腕(長い)
  const arm = (s, ph) => { c.save(); c.translate(s * 44, -340); const a = wob(t, 1.5 + ph, .12) + s * .2; c.rotate(a); c.strokeStyle = '#0c0a18'; c.lineWidth = 15; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 34, 90, s * 18, 190); c.stroke(); c.strokeStyle = rgba(p.glow, .5); c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 34, 90, s * 18, 190); c.stroke(); c.fillStyle = '#0c0a18'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(s * 18, 190); c.lineTo(s * (18 + (i - 1.5) * 12), 236 + (i % 2) * 14); c.lineTo(s * (18 + (i - 1.5) * 12 + 6), 190); c.fill(); } c.restore(); };
  arm(-1, 0); arm(1, 2);
  // 仮面
  c.save(); c.translate(sw * .3, -438); c.rotate(wob(t, 1.4, .06));
  shp(c, c => { c.moveTo(-34, -40); c.bezierCurveTo(-36, -92, 36, -92, 34, -40); c.bezierCurveTo(34, -6, 12, 16, 0, 20); c.bezierCurveTo(-12, 16, -34, -6, -34, -40); c.closePath(); }, '#eceaf4', { rim: p.glow, sh: .45, out: '#0c0a18' });
  c.fillStyle = '#0c0a18'; c.beginPath(); c.ellipse(-14, -42, 8, 14, -.2, 0, TAU); c.ellipse(14, -42, 8, 14, .2, 0, TAU); c.fill();
  glowDot(c, -14, -40, 20, p.glow, .9); glowDot(c, 14, -40, 20, p.glow, .9);
  c.beginPath(); c.moveTo(-14, -6); c.quadraticCurveTo(0, 8, 14, -6); c.quadraticCurveTo(0, 2, -14, -6); c.fill();
  c.strokeStyle = p.b; c.lineWidth = 2; c.beginPath(); c.moveTo(-26, -66); c.lineTo(-8, -56); c.moveTo(26, -66); c.lineTo(8, -56); c.stroke();
  c.restore();
  // 煙
  for (let i = 0; i < 6; i++) { const a = t * .6 + i * 1.7, x = Math.sin(a) * 70, y = -100 - ((t * 40 + i * 70) % 320); c.save(); c.globalAlpha = .18 * (1 - ((-y - 100) / 320)); glowDot(c, x, y, 28, p.b, .6); c.restore(); }
}
function artArmor(c, t, p, boss) {
  const br = wob(t, 2.2, 3);
  glowDot(c, 0, -240, 220, p.glow, .12);
  // マント
  shp(c, c => { c.moveTo(-50, -400); c.bezierCurveTo(-110, -300, -120, -140, -100, -30); c.lineTo(-60, -44); c.lineTo(-30, -26); c.lineTo(10, -46); c.lineTo(50, -28); c.bezierCurveTo(40, -200, 20, -320, 40, -400); c.closePath(); }, '#2a1c1c', { rim: p.b, sh: .55 });
  if (boss) { // 背負う巨大な鐘
    c.save(); c.translate(70, -330 + br); c.rotate(wob(t, 1.5, .03));
    shp(c, c => { c.moveTo(-40, -40); c.bezierCurveTo(-48, -140, 48, -140, 40, -40); c.bezierCurveTo(70, -26, 80, 10, 74, 22); c.lineTo(-74, 22); c.bezierCurveTo(-80, 10, -70, -26, -40, -40); c.closePath(); }, '#9a6a34', { rim: '#ffd9a0', sh: .5, out: '#241408' });
    shp(c, P.ell(0, 26, 66, 9), '#241408', { ow: 0 }); shp(c, P.ell(0, 34, 14, 14), '#c9a24a', { ow: 2 });
    c.strokeStyle = rgba('#ffd9a0', .6); c.lineWidth = 3; c.beginPath(); c.arc(0, -52, 30, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.restore();
  }
  // 脚
  [[-34, 1], [34, -1]].forEach(a => { shp(c, c => { c.moveTo(a[0] - 20, -200); c.lineTo(a[0] + 20, -200); c.lineTo(a[0] + 18, -50); c.lineTo(a[0] - 18, -50); c.closePath(); }, p.a, { rim: p.b, sh: .55 }); shp(c, c => { c.moveTo(a[0] - 24, -56); c.lineTo(a[0] + 22, -56); c.lineTo(a[0] + 28, 0); c.lineTo(a[0] - 32, 0); c.closePath(); }, dark(p.a, .25), { rim: p.b }); shp(c, P.ell(a[0], -128, 22, 12), p.b, { ow: 2 }); });
  // 胴
  shp(c, c => { c.moveTo(-60, -400); c.lineTo(60, -400); c.lineTo(48, -210); c.lineTo(-48, -210); c.closePath(); }, p.a, { rim: p.b, sh: .55 });
  shp(c, c => { c.moveTo(-50, -380); c.lineTo(50, -380); c.lineTo(40, -300); c.lineTo(-40, -300); c.closePath(); }, light(p.a, .1), { rim: p.b, sh: .5 });
  c.strokeStyle = rgba(p.b, .8); c.lineWidth = 3; c.beginPath(); c.moveTo(-44, -330); c.lineTo(44, -330); c.moveTo(0, -396); c.lineTo(0, -210); c.stroke();
  glowDot(c, 0, -320, 34, p.glow, .55);
  c.fillStyle = rgba('#241408', .9); [[-30, -250], [30, -250], [0, -240]].forEach(r => { c.beginPath(); c.arc(r[0], r[1], 4, 0, TAU); c.fill(); });
  // 肩当て
  [[-1], [1]].forEach(a => { const s = a[0]; shp(c, c => { c.moveTo(s * 40, -410); c.bezierCurveTo(s * 96, -426, s * 110, -370, s * 92, -330); c.lineTo(s * 44, -350); c.closePath(); }, dark(p.a, .08), { rim: p.b, sh: .5 }); c.fillStyle = p.b; c.beginPath(); c.moveTo(s * 70, -420); c.lineTo(s * 82, -450); c.lineTo(s * 88, -416); c.fill(); });
  // 腕と得物
  const sx = -64, a1 = wob(t, 2, .05);
  c.save(); c.translate(sx, -380); c.rotate(.3 + a1); shp(c, c => capsule(c, 0, 0, -20, 96, 20, 16), p.a, { rim: p.b }); shp(c, c => capsule(c, -20, 96, 10, 176, 16, 14), dark(p.a, .12), { rim: p.b }); shp(c, P.ell(10, 184, 16, 16), '#2a1a16', { ow: 2 });
  c.translate(10, 184); c.rotate(-1.2); shp(c, P.rr(-6, -120, 12, 150, 4), '#3a2a22', { ow: 2 }); shp(c, c => { c.moveTo(-26, -150); c.lineTo(26, -150); c.lineTo(32, -110); c.lineTo(-32, -110); c.closePath(); }, '#8a6a40', { rim: '#ffd9a0', out: '#241408' }); c.restore();
  c.save(); c.translate(64, -380); c.rotate(-.2 - a1); shp(c, c => capsule(c, 0, 0, 24, 90, 20, 16), p.a, { rim: p.b }); shp(c, c => capsule(c, 24, 90, 8, 170, 16, 14), dark(p.a, .12), { rim: p.b }); c.restore();
  // 兜
  c.save(); c.translate(0, -418 + br);
  shp(c, c => { c.moveTo(-34, 0); c.bezierCurveTo(-42, -70, 42, -70, 34, 0); c.lineTo(26, 12); c.lineTo(-26, 12); c.closePath(); }, p.a, { rim: p.b, sh: .5 });
  c.fillStyle = '#0a0606'; c.beginPath(); c.moveTo(-26, -18); c.lineTo(26, -18); c.lineTo(22, -6); c.lineTo(-22, -6); c.closePath(); c.fill();
  glowDot(c, -12, -12, 22, p.glow, 1); glowDot(c, 12, -12, 22, p.glow, 1);
  c.fillStyle = p.b; c.beginPath(); c.moveTo(-6, -72); c.lineTo(0, -108); c.lineTo(6, -72); c.fill();
  if (boss) { shp(c, c => { c.moveTo(-34, -30); c.lineTo(-62, -66); c.lineTo(-30, -52); c.closePath(); }, '#e6d9b8', { ow: 2 }); shp(c, c => { c.moveTo(34, -30); c.lineTo(62, -66); c.lineTo(30, -52); c.closePath(); }, '#e6d9b8', { ow: 2 }); }
  c.restore();
}
function artChorus(c, t, p, boss) {
  const hov = wob(t, 1.8, 10);
  c.translate(0, hov - 40);
  glowDot(c, 0, -300, 260, p.b, .22);
  // 長衣
  const rob = cc => { cc.moveTo(-34, -330); cc.bezierCurveTo(-90, -230, -120, -100, -130, 10); for (let i = 0; i <= 8; i++) cc.lineTo(-130 + i * 32.5, 10 + (i % 2 ? 18 : -4) + wob(t, 2 + i, 4)); cc.bezierCurveTo(120, -100, 90, -230, 34, -330); cc.closePath(); };
  const g = c.createLinearGradient(0, -330, 0, 20); g.addColorStop(0, '#f6f2e8'); g.addColorStop(1, '#a89fc0');
  shp(c, rob, g, { rim: p.b, sh: .5 });
  c.save(); c.beginPath(); rob(c); c.clip(); c.strokeStyle = rgba('#5a4a80', .35); c.lineWidth = 2; for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * 8, -320); c.quadraticCurveTo(i * 26, -150, i * 34, 20); c.stroke(); } c.restore();
  // 手(指揮)
  [-1, 1].forEach((s, i) => { c.save(); c.translate(s * 40, -300); c.rotate(s * (.85 + wob(t, 2 + i, .18))); shp(c, c => capsule(c, 0, 0, 0, -110, 15, 10), '#efe9f5', { rim: p.b }); shp(c, c => { c.moveTo(-8, -110); c.lineTo(8, -110); c.lineTo(20, -150); c.lineTo(6, -140); c.lineTo(0, -158); c.lineTo(-6, -140); c.lineTo(-20, -150); c.closePath(); }, '#efe9f5', { ow: 1.8 }); c.restore(); });
  // 周回する仮面
  const masks = [['#eceaf4', 0], ['#e6d9f0', 1], ['#f0e4e4', 2], ['#dfe6f0', 3], ['#f2eee0', 4], ['#e4dcf0', 5]];
  masks.forEach((m, i) => { const a = t * .9 + i * TAU / 6, x = Math.cos(a) * 110, z = Math.sin(a), y = -380 + z * 20, sc = .75 + z * .25; if (z < 0) return drawMaskFace(c, x, y, sc, m[0], p, i, t, .75); });
  // 中央の大仮面
  drawMaskFace(c, 0, -400, 1.55, '#f4f0e6', p, 9, t, 1);
  masks.forEach((m, i) => { const a = t * .9 + i * TAU / 6, x = Math.cos(a) * 110, z = Math.sin(a), y = -380 + z * 20, sc = .75 + z * .25; if (z >= 0) drawMaskFace(c, x, y, sc, m[0], p, i, t, 1); });
}
function drawMaskFace(c, x, y, s, col, p, i, t, a) {
  c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = a;
  shp(c, c => { c.moveTo(-26, -34); c.bezierCurveTo(-28, -76, 28, -76, 26, -34); c.bezierCurveTo(26, -4, 10, 18, 0, 20); c.bezierCurveTo(-10, 18, -26, -4, -26, -34); c.closePath(); }, col, { rim: p.glow, sh: .45, out: '#1a1030', ow: 2.2 });
  c.fillStyle = '#1a1030';
  const k = i % 3;
  if (k === 0) { c.beginPath(); c.ellipse(-10, -34, 6, 8, 0, 0, TAU); c.ellipse(10, -34, 6, 8, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(0, -4, 7, 0, TAU); c.fill(); }
  else if (k === 1) { c.strokeStyle = '#1a1030'; c.lineWidth = 3; c.beginPath(); c.moveTo(-16, -34); c.quadraticCurveTo(-10, -42, -4, -34); c.moveTo(4, -34); c.quadraticCurveTo(10, -42, 16, -34); c.stroke(); c.beginPath(); c.moveTo(-12, -6); c.quadraticCurveTo(0, 12, 12, -6); c.quadraticCurveTo(0, 2, -12, -6); c.fill(); }
  else { c.beginPath(); c.moveTo(-18, -40); c.lineTo(-4, -32); c.lineTo(-18, -26); c.closePath(); c.moveTo(18, -40); c.lineTo(4, -32); c.lineTo(18, -26); c.closePath(); c.fill(); c.fillRect(-10, -8, 20, 4); }
  glowDot(c, -10, -34, 14, p.glow, .55 * a); glowDot(c, 10, -34, 14, p.glow, .55 * a);
  c.restore();
}
function artClock(c, t, p, boss) {
  const hov = wob(t, 1.5, 8);
  c.translate(0, hov - 30);
  glowDot(c, 0, -320, 300, p.glow, .2);
  // 後光の歯車
  c.save(); c.translate(0, -330); c.rotate(t * .25); gear(c, 0, 0, 190, 20, 14, rgba(p.b, .22), rgba(p.b, .5)); c.rotate(-t * .5); gear(c, 0, 0, 150, 16, 12, rgba(p.b, .16), rgba(p.b, .4)); c.restore();
  // 振り子の翼
  [-1, 1].forEach((s, i) => { c.save(); c.translate(s * 60, -360); c.rotate(s * (.5 + wob(t, 1.4 + i * .2, .22))); for (let k = 0; k < 4; k++) { c.save(); c.rotate(s * -k * .32); shp(c, c => { c.moveTo(0, 0); c.lineTo(s * 190, -12); c.lineTo(s * 220, 0); c.lineTo(s * 190, 12); c.closePath(); }, steel(c, 0, 220), { rim: p.glow, ow: 2.2 }); c.restore(); } c.restore(); });
  // 脚(ピストン)
  [-1, 1].forEach(s => { shp(c, c => capsule(c, s * 34, -200, s * 40, -90, 14, 11), p.a, { rim: p.b }); shp(c, c => capsule(c, s * 40, -90, s * 36, -10, 10, 8), '#8a7a50', { rim: p.glow }); shp(c, c => { c.moveTo(s * 20, -8); c.lineTo(s * 62, -8); c.lineTo(s * 72, 4); c.lineTo(s * 12, 4); c.closePath(); }, '#1a1620', { ow: 2 }); });
  // 外套
  shp(c, c => { c.moveTo(-60, -400); c.lineTo(60, -400); c.bezierCurveTo(80, -300, 96, -200, 100, -90); c.quadraticCurveTo(0, -60, -100, -90); c.bezierCurveTo(-96, -200, -80, -300, -60, -400); c.closePath(); }, p.a, { rim: p.b, sh: .5 });
  c.strokeStyle = rgba(p.b, .8); c.lineWidth = 3; c.beginPath(); c.moveTo(-100, -90); c.quadraticCurveTo(0, -60, 100, -90); c.stroke();
  // 時計盤の胸
  c.save(); c.translate(0, -330);
  shp(c, P.ell(0, 0, 72, 72), '#efe6c8', { rim: p.glow, sh: .4, out: '#241a08', ow: 4 });
  c.strokeStyle = '#241a08'; c.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = i * TAU / 12; c.beginPath(); c.moveTo(Math.sin(a) * 58, -Math.cos(a) * 58); c.lineTo(Math.sin(a) * 68, -Math.cos(a) * 68); c.stroke(); }
  const hand = (len, a, w) => { c.save(); c.rotate(a); c.strokeStyle = '#241a08'; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 8); c.lineTo(0, -len); c.stroke(); c.restore(); };
  hand(40, t * .3, 5); hand(58, t * 3.6, 3);
  c.fillStyle = p.b; c.beginPath(); c.arc(0, 0, 6, 0, TAU); c.fill(); glowDot(c, 0, 0, 90, p.glow, .35);
  c.restore();
  // 肩・腕
  [-1, 1].forEach((s, i) => { shp(c, c => { c.moveTo(s * 56, -410); c.bezierCurveTo(s * 120, -420, s * 130, -360, s * 108, -330); c.lineTo(s * 60, -350); c.closePath(); }, dark(p.a, .1), { rim: p.b }); c.save(); c.translate(s * 100, -340); c.rotate(s * (.3 + wob(t, 2 + i, .1))); shp(c, c => capsule(c, 0, 0, s * 16, 100, 14, 11), p.a, { rim: p.b }); shp(c, c => { c.moveTo(s * 16 - 12, 100); c.lineTo(s * 16 + 12, 100); c.lineTo(s * 16 + s * 6, 160); c.closePath(); }, steel(c, 0, 20), { ow: 2 }); c.restore(); });
  // 頭(天使環と仮面)
  c.save(); c.translate(0, -430);
  c.save(); c.translate(0, -52); c.scale(1, .3); c.strokeStyle = rgba(p.glow, .9); c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 44, 0, TAU); c.stroke(); c.restore();
  shp(c, c => { c.moveTo(-28, -10); c.bezierCurveTo(-30, -60, 30, -60, 28, -10); c.bezierCurveTo(28, 20, 10, 32, 0, 34); c.bezierCurveTo(-10, 32, -28, 20, -28, -10); c.closePath(); }, '#e8dcb0', { rim: p.glow, sh: .45, out: '#241a08' });
  c.fillStyle = '#241a08'; c.fillRect(-18, -16, 12, 4); c.fillRect(6, -16, 12, 4); glowDot(c, -12, -14, 16, p.glow, .9); glowDot(c, 12, -14, 16, p.glow, .9);
  c.strokeStyle = '#241a08'; c.lineWidth = 2; c.beginPath(); c.moveTo(-10, 12); c.lineTo(10, 12); c.stroke();
  c.restore();
}
function gear(c, x, y, r, n, th, fill, stroke) {
  c.save(); c.translate(x, y); c.beginPath();
  for (let i = 0; i < n; i++) { const a0 = i * TAU / n, a1 = a0 + TAU / n * .5; c.lineTo(Math.cos(a0 - .05) * r, Math.sin(a0 - .05) * r); c.lineTo(Math.cos(a0 + .05) * (r + th), Math.sin(a0 + .05) * (r + th)); c.lineTo(Math.cos(a1 - .05) * (r + th), Math.sin(a1 - .05) * (r + th)); c.lineTo(Math.cos(a1 + .05) * r, Math.sin(a1 + .05) * r); }
  c.closePath(); c.moveTo(r * .55, 0); c.arc(0, 0, r * .55, 0, TAU, true); c.fillStyle = fill; c.fill('evenodd'); c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); c.restore();
}
const ART = { moth: artMoth, hound: artHound, puppet: artPuppet, shade: artShade, armor: artArmor, chorus: artChorus, clock: artClock };
const EOFF = {};
/* 敵描画。facing=-1 が左向き(基準)。st:{t, flash, tint, alpha, sx, sy, rot} */
function drawEnemy(ctx, e, x, y, scale, facing, st) {
  const art = ART[e.art], pal = Object.assign({}, ENPAL[e.art], e.pal || {});
  ctx.save(); ctx.translate(x, y); ctx.scale(scale * (st.sx || 1) * (facing > 0 ? -1 : 1), scale * (st.sy || 1)); if (st.rot) ctx.rotate(st.rot);
  if (st.alpha != null) ctx.globalAlpha = st.alpha;
  if (st.flash || st.tint) {
    const W = 900, H = 1000, off = EOFF.c || (EOFF.c = mkCanvas(W, H)), oc = off.getContext('2d');
    oc.setTransform(1, 0, 0, 1, 0, 0); oc.clearRect(0, 0, W, H); oc.translate(W / 2, H - 120); art(oc, st.t || 0, pal, e.boss);
    oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalCompositeOperation = 'source-atop';
    if (st.tint) { oc.fillStyle = st.tint; oc.fillRect(0, 0, W, H); }
    if (st.flash) { oc.fillStyle = `rgba(255,255,255,${st.flash})`; oc.fillRect(0, 0, W, H); }
    oc.globalCompositeOperation = 'source-over'; ctx.drawImage(off, -W / 2, -(H - 120));
  } else art(ctx, st.t || 0, pal, e.boss);
  ctx.restore();
}
const ENEMY_H = { moth: 420, hound: 240, puppet: 430, shade: 470, armor: 520, chorus: 520, clock: 560 };
