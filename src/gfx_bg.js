'use strict';
/* ============================================================
   LAMPWARDEN COMPANY — gfx_bg.js
   背景(視差レイヤー・照明・霧・粒子)。論理サイズ 1280x720
   ============================================================ */
const BW = 1280, BH = 720, HORIZON = 372;
const BG_PAD = 120;

function skyline(c, w, baseY, hmin, hmax, col, seed, win, o) {
  o = o || {}; const r = srand(seed); let x = -20;
  while (x < w + 20) {
    const bw = 34 + r() * 90, bh = hmin + r() * (hmax - hmin), y = baseY - bh;
    c.fillStyle = col; c.fillRect(x, y, bw, bh + 4);
    const roof = r();
    if (roof < .25) { c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x + bw / 2, y - 20 - r() * 40); c.lineTo(x + bw + 3, y); c.fill(); }
    else if (roof < .4) { c.fillRect(x + bw * .3, y - 18 - r() * 28, 6, 40); c.fillRect(x + bw * .6, y - 10 - r() * 16, 10, 26); }
    else if (roof < .5 && o.spires) { c.beginPath(); c.moveTo(x + bw * .4, y); c.lineTo(x + bw * .5, y - 80 - r() * 90); c.lineTo(x + bw * .6, y); c.fill(); }
    if (win) { for (let wy = y + 12; wy < baseY - 8; wy += 15) for (let wx = x + 7; wx < x + bw - 9; wx += 13) if (r() < (o.wp || .12)) { c.fillStyle = rgba(win, .35 + r() * .5); c.fillRect(wx, wy, 5, 7); } c.fillStyle = col; }
    x += bw + r() * 6;
  }
}
function moonDisc(c, x, y, rad, col, glow) {
  const g = c.createRadialGradient(x, y, rad * .6, x, y, rad * 5); g.addColorStop(0, rgba(glow, .4)); g.addColorStop(.3, rgba(glow, .12)); g.addColorStop(1, rgba(glow, 0));
  c.fillStyle = g; c.fillRect(x - rad * 5, y - rad * 5, rad * 10, rad * 10);
  const d = c.createRadialGradient(x - rad * .3, y - rad * .3, rad * .1, x, y, rad); d.addColorStop(0, light(col, .5)); d.addColorStop(1, col);
  c.fillStyle = d; c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fill();
  const r = srand(7); c.fillStyle = rgba(dark(col, .35), .22); for (let i = 0; i < 9; i++) { const a = r() * TAU, rr = r() * rad * .7; c.beginPath(); c.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 4 + r() * rad * .15, 0, TAU); c.fill(); }
}
function lampPost(c, x, y, h, col, glowR) {
  c.fillStyle = '#07060b'; c.fillRect(x - 3, y - h, 6, h); c.fillRect(x - 9, y - 8, 18, 8); c.fillRect(x - 6, y - h - 4, 12, 6);
  c.beginPath(); c.moveTo(x - 10, y - h - 4); c.lineTo(x + 10, y - h - 4); c.lineTo(x + 6, y - h - 20); c.lineTo(x - 6, y - h - 20); c.closePath(); c.fillStyle = '#0b0912'; c.fill();
  c.fillStyle = rgba(col, .95); c.fillRect(x - 5, y - h - 18, 10, 14);
  const g = c.createRadialGradient(x, y - h - 11, 0, x, y - h - 11, glowR); g.addColorStop(0, rgba(col, .55)); g.addColorStop(.25, rgba(col, .2)); g.addColorStop(1, rgba(col, 0));
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - glowR, y - h - 11 - glowR, glowR * 2, glowR * 2); c.restore();
}
function floorBase(c, y0, top, bot, lineCol, vp) {
  const g = c.createLinearGradient(0, y0, 0, BH); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(-BG_PAD, y0, BW + BG_PAD * 2, BH - y0 + 4);
  c.strokeStyle = lineCol; c.lineWidth = 1.2;
  for (let i = -16; i <= 16; i++) { c.beginPath(); c.moveTo(vp + i * 24, y0); c.lineTo(vp + i * 150, BH + 10); c.stroke(); }
  for (let i = 0; i < 9; i++) { const yy = y0 + Math.pow(i / 9, 1.9) * (BH - y0); c.globalAlpha = .6; c.beginPath(); c.moveTo(-BG_PAD, yy); c.lineTo(BW + BG_PAD, yy); c.stroke(); c.globalAlpha = 1; }
}
function softBlob(c, x, y, rx, ry, col, a) { c.save(); c.translate(x, y); c.scale(1, ry / rx); const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore(); }

/* ---------- テーマ別の静的レイヤー ---------- */
const BGTHEME = {
  station: { sky: ['#0a1020', '#18273a', '#33465c'], fog: '#7f97b5', warm: '#ffb45c', cool: '#8fb6ff', grade: 'rgba(30,60,110,.18)' },
  library: { sky: ['#140a1e', '#2a1840', '#4a2a5e'], fog: '#a67fc0', warm: '#ffc66e', cool: '#c79bff', grade: 'rgba(80,30,110,.2)' },
  clock: { sky: ['#0c0a12', '#2a1c14', '#5a3a1c'], fog: '#c79a5a', warm: '#ffc15a', cool: '#ffe3a8', grade: 'rgba(110,60,10,.2)' },
  mirror: { sky: ['#07050f', '#1a1040', '#3a1c70'], fog: '#9a7cff', warm: '#ff8fd0', cool: '#7fe0ff', grade: 'rgba(70,20,120,.22)' },
  title: { sky: ['#05060f', '#101a38', '#2b3a66'], fog: '#6f8ac0', warm: '#ffb45c', cool: '#9fc0ff', grade: 'rgba(20,40,100,.2)' },
  menu: { sky: ['#07060d', '#16122a', '#2a1f48'], fog: '#8f7cc0', warm: '#ffb45c', cool: '#9fb0ff', grade: 'rgba(40,20,90,.2)' }
};
function buildBgLayers(theme) {
  const T = BGTHEME[theme] || BGTHEME.station, W = BW + BG_PAD * 2;
  const mk = () => { const cv = mkCanvas(W, BH), c = cv.getContext('2d'); c.translate(BG_PAD, 0); return { cv, c }; };
  const L = { sky: mk(), far: mk(), mid: mk(), floor: mk(), near: mk() };
  // 空
  { const c = L.sky.c, g = c.createLinearGradient(0, 0, 0, HORIZON + 40); g.addColorStop(0, T.sky[0]); g.addColorStop(.6, T.sky[1]); g.addColorStop(1, T.sky[2]); c.fillStyle = g; c.fillRect(-BG_PAD, 0, W, HORIZON + 60);
    const r = srand(11); for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(255,255,255,${.15 + r() * .5})`; const s = r() < .1 ? 2 : 1; c.fillRect(r() * BW, r() * HORIZON * .8, s, s); }
    if (theme === 'station' || theme === 'title' || theme === 'menu') moonDisc(c, theme === 'title' ? 900 : 760, theme === 'title' ? 190 : 150, theme === 'title' ? 96 : 70, '#e9eefc', T.cool);
    if (theme === 'mirror') { const cx = 640, cy = 220; for (let i = 0; i < 14; i++) { c.strokeStyle = rgba(T.fog, .08 + i * .01); c.lineWidth = 2; c.beginPath(); for (let a = 0; a < 14; a += .1) { const rr = 6 + a * 18 + i * 3; c.lineTo(cx + Math.cos(a + i) * rr, cy + Math.sin(a + i) * rr * .5); } c.stroke(); } softBlob(c, cx, cy, 340, 220, T.cool, .35); }
    if (theme === 'clock') { softBlob(c, 640, 200, 520, 300, T.warm, .22); }
  }
  // 遠景
  { const c = L.far.c;
    if (theme === 'station' || theme === 'title' || theme === 'menu') {
      skyline(c, BW, HORIZON + 12, 40, 120, rgba('#0d1424', 1), 3, T.warm, { spires: 1, wp: .07 });
      softBlob(c, 640, HORIZON, 800, 120, T.fog, .22);
      skyline(c, BW, HORIZON + 26, 20, 80, '#0a0e1a', 8, T.warm, { wp: .1 });
      // 時計塔
      c.fillStyle = '#080b16'; c.fillRect(1010, HORIZON - 250, 54, 270); c.beginPath(); c.moveTo(1000, HORIZON - 250); c.lineTo(1037, HORIZON - 330); c.lineTo(1074, HORIZON - 250); c.fill();
      c.fillStyle = rgba(T.warm, .95); c.beginPath(); c.arc(1037, HORIZON - 215, 17, 0, TAU); c.fill(); c.strokeStyle = '#080b16'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(1037, HORIZON - 215); c.lineTo(1037, HORIZON - 228); c.moveTo(1037, HORIZON - 215); c.lineTo(1046, HORIZON - 211); c.stroke();
      const g = c.createRadialGradient(1037, HORIZON - 215, 0, 1037, HORIZON - 215, 90); g.addColorStop(0, rgba(T.warm, .4)); g.addColorStop(1, rgba(T.warm, 0)); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(937, HORIZON - 315, 200, 200); c.restore();
    }
    if (theme === 'library') {
      // 遠くのアーチ書架
      for (let i = 0; i < 9; i++) { const x = -60 + i * 160; c.fillStyle = '#0d0716'; c.beginPath(); c.moveTo(x, HORIZON + 20); c.lineTo(x, 130); c.arc(x + 70, 130, 70, Math.PI, 0); c.lineTo(x + 140, HORIZON + 20); c.closePath(); c.fill();
        const r = srand(40 + i); for (let row = 0; row < 11; row++) { let bx = x + 6; const by = 120 + row * 24; if (by > HORIZON - 4) break; while (bx < x + 132) { const bw = 5 + r() * 7, hue = r(); c.fillStyle = hue < .3 ? '#3a1f4f' : hue < .55 ? '#5a2a3a' : hue < .8 ? '#26334f' : '#4f3a1f'; c.fillRect(bx, by + 6, bw, 17); bx += bw + 1; } } }
      softBlob(c, 640, HORIZON, 800, 150, T.fog, .3);
    }
    if (theme === 'clock') {
      c.fillStyle = '#0a0806'; for (let i = 0; i < 7; i++) c.fillRect(-40 + i * 220, 0, 38, HORIZON + 30);
      c.fillStyle = rgba(T.warm, .08); for (let i = 0; i < 6; i++) c.fillRect(70 + i * 220, 0, 90, HORIZON + 30);
      softBlob(c, 640, HORIZON, 800, 130, T.fog, .24);
    }
    if (theme === 'mirror') {
      const r = srand(21); for (let i = 0; i < 26; i++) { const x = r() * BW, y = 30 + r() * (HORIZON - 60), s = 40 + r() * 120, a = r() * TAU; c.save(); c.translate(x, y); c.rotate(a); const g = c.createLinearGradient(-s, -s, s, s); g.addColorStop(0, rgba(T.cool, .05)); g.addColorStop(.5, rgba('#ffffff', .12)); g.addColorStop(1, rgba(T.warm, .06)); c.fillStyle = g; c.beginPath(); c.moveTo(-s * .5, -s * .3); c.lineTo(s * .6, -s * .5); c.lineTo(s * .3, s * .6); c.lineTo(-s * .4, s * .4); c.closePath(); c.fill(); c.strokeStyle = rgba('#ffffff', .22); c.lineWidth = 1.4; c.stroke(); c.restore(); }
      softBlob(c, 640, HORIZON, 800, 130, T.fog, .3);
    }
  }
  // 中景
  { const c = L.mid.c;
    if (theme === 'station' || theme === 'title' || theme === 'menu') {
      // 鉄骨アーチ
      c.strokeStyle = '#080a14'; c.lineWidth = 16;
      for (let i = 0; i < 4; i++) { const cx = 80 + i * 380; c.beginPath(); c.moveTo(cx - 170, HORIZON + 30); c.bezierCurveTo(cx - 170, 20, cx + 170, 20, cx + 170, HORIZON + 30); c.stroke(); c.lineWidth = 5; for (let k = 1; k < 8; k++) { const a = Math.PI * (k / 8), px = cx - Math.cos(a) * 170, py = HORIZON + 30 - Math.sin(a) * (HORIZON + 10); c.beginPath(); c.moveTo(px, py); c.lineTo(px + (k < 4 ? 28 : -28), py + 34); c.stroke(); } c.lineWidth = 16; }
      c.fillStyle = '#080a14'; c.fillRect(-BG_PAD, HORIZON - 10, W, 40);
      for (let i = 0; i < 9; i++) { const x = -40 + i * 170; c.fillStyle = '#0b0e1b'; c.fillRect(x, 90, 22, HORIZON - 70); c.fillStyle = '#080a14'; c.fillRect(x - 5, HORIZON - 30, 32, 30); }
      [140, 480, 820, 1160].forEach((x, i) => lampPost(c, x, HORIZON + 10, 190 - i % 2 * 30, T.warm, 150));
      // 垂れ幕
      c.fillStyle = 'rgba(10,12,24,.9)'; [[330, 6], [700, 6], [1060, 6]].forEach(p => { c.beginPath(); c.moveTo(p[0], 40); c.lineTo(p[0] + 40, 40); c.lineTo(p[0] + 40, 130); c.lineTo(p[0] + 20, 118); c.lineTo(p[0], 130); c.closePath(); c.fill(); });
    }
    if (theme === 'library') {
      for (let i = 0; i < 5; i++) { const x = -20 + i * 300; c.fillStyle = '#0a0612'; c.fillRect(x, 40, 56, HORIZON + 20); c.fillRect(x - 6, 40, 68, 14);
        const r = srand(70 + i); for (let row = 0; row < 12; row++) { const by = 70 + row * 26; if (by > HORIZON - 10) break; let bx = x + 62; while (bx < x + 240) { const bw = 5 + r() * 9, hue = r(); c.fillStyle = hue < .25 ? '#4a2563' : hue < .5 ? '#6a2a3f' : hue < .75 ? '#2a3d63' : '#6a4f25'; c.fillRect(bx, by + 4, bw, 20 - r() * 4); bx += bw + 1; } c.fillStyle = '#0a0612'; c.fillRect(x + 56, by + 24, 190, 3); } c.fillStyle = '#0a0612'; c.fillRect(x + 240, 40, 12, HORIZON + 20); }
      // ステンドグラス窓
      [[300, 170], [820, 170]].forEach(p => { c.fillStyle = '#0a0612'; c.beginPath(); c.moveTo(p[0] - 46, p[1] + 96); c.lineTo(p[0] - 46, p[1] - 20); c.arc(p[0], p[1] - 20, 46, Math.PI, 0); c.lineTo(p[0] + 46, p[1] + 96); c.closePath(); c.fill(); const cols = ['#8a4fe0', '#33b8c4', '#e0508a', '#e8b84a']; const r = srand(p[0]); for (let a = 0; a < 3; a++) for (let b = 0; b < 4; b++) { c.fillStyle = rgba(cols[(a + b + (r() * 2 | 0)) % 4], .75); c.fillRect(p[0] - 38 + a * 26, p[1] - 44 + b * 30, 22, 26); } c.save(); c.globalCompositeOperation = 'lighter'; softBlob(c, p[0], p[1] + 20, 120, 160, '#c79bff', .3); c.restore(); });
      // シャンデリア
      [[560, 70], [980, 90]].forEach(p => { c.strokeStyle = '#0a0612'; c.lineWidth = 3; c.beginPath(); c.moveTo(p[0], -10); c.lineTo(p[0], p[1]); c.stroke(); c.fillStyle = '#0a0612'; c.beginPath(); c.ellipse(p[0], p[1] + 8, 42, 9, 0, 0, TAU); c.fill(); for (let k = -2; k <= 2; k++) { const x = p[0] + k * 17; c.fillStyle = rgba(T.warm, .95); c.fillRect(x - 2, p[1] - 8, 4, 10); softBlob(c, x, p[1] - 8, 50, 50, T.warm, .5); } });
    }
    if (theme === 'clock') {
      // 巨大歯車(静的部分: 枠と柱)
      c.fillStyle = '#0a0806'; c.fillRect(-BG_PAD, HORIZON - 10, W, 40);
      for (let i = 0; i < 6; i++) { const x = 40 + i * 240; c.fillStyle = '#100c08'; c.fillRect(x, 0, 34, HORIZON + 10); c.strokeStyle = rgba(T.warm, .22); c.lineWidth = 2; c.strokeRect(x + 6, 10, 22, HORIZON - 20); }
      c.strokeStyle = '#0a0806'; c.lineWidth = 6; for (let i = 0; i < 12; i++) { const x = 100 + i * 100; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + wobS(i) * 20, 120 + (i % 3) * 60); c.stroke(); c.fillStyle = '#0a0806'; c.beginPath(); c.arc(x + wobS(i) * 20, 124 + (i % 3) * 60, 9, 0, TAU); c.fill(); }
      [[200, 150], [1020, 120]].forEach(p => { c.fillStyle = '#0a0806'; c.beginPath(); c.arc(p[0], p[1], 56, 0, TAU); c.fill(); c.strokeStyle = rgba(T.warm, .7); c.lineWidth = 4; c.beginPath(); c.arc(p[0], p[1], 50, 0, TAU); c.stroke(); });
    }
    if (theme === 'mirror') {
      const r = srand(33); for (let i = 0; i < 12; i++) { const x = 40 + i * 110 + r() * 40, w = 40 + r() * 50, h = 160 + r() * 200; c.save(); c.translate(x, HORIZON + 14); const g = c.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, rgba(T.cool, .0)); g.addColorStop(.6, rgba(T.cool, .12)); g.addColorStop(1, rgba(T.warm, .22)); c.fillStyle = g; c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w * .2, -h); c.lineTo(w * .3, -h * .9); c.lineTo(w / 2, 0); c.closePath(); c.fill(); c.strokeStyle = rgba('#fff', .3); c.lineWidth = 1.5; c.stroke(); c.restore(); }
    }
  }
  // 床
  { const c = L.floor.c;
    if (theme === 'station' || theme === 'title' || theme === 'menu') {
      floorBase(c, HORIZON + 6, '#161c2c', '#05070d', 'rgba(120,150,200,.16)', 640);
      // 線路
      c.strokeStyle = 'rgba(160,180,220,.35)'; c.lineWidth = 3; [[560, 340], [720, 940]].forEach(a => { c.beginPath(); c.moveTo(a[0] * .12 + 560, HORIZON + 6); c.lineTo(a[1] > 700 ? 1500 : -300, BH); c.stroke(); });
      softBlob(c, 640, 560, 520, 90, T.warm, .1);
    }
    if (theme === 'library') { floorBase(c, HORIZON + 6, '#2a1a20', '#080408', 'rgba(255,200,140,.14)', 640); softBlob(c, 640, 540, 560, 100, T.warm, .1); for (let i = 0; i < 3; i++) { c.strokeStyle = rgba(T.cool, .18); c.lineWidth = 2; c.beginPath(); c.ellipse(640, 520, 300 + i * 70, 56 + i * 12, 0, 0, TAU); c.stroke(); } }
    if (theme === 'clock') { floorBase(c, HORIZON + 6, '#241a10', '#070504', 'rgba(255,190,100,.16)', 640); c.strokeStyle = rgba(T.warm, .2); c.lineWidth = 2; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(640, 530, 240 + i * 90, 50 + i * 14, 0, 0, TAU); c.stroke(); } softBlob(c, 640, 540, 560, 100, T.warm, .14); }
    if (theme === 'mirror') {
      floorBase(c, HORIZON + 6, '#150c30', '#04030a', 'rgba(170,140,255,.2)', 640);
      const r = srand(5); for (let i = 0; i < 18; i++) { const x = r() * BW, y = HORIZON + 40 + r() * 280, s = 30 + r() * 100; c.save(); c.translate(x, y); c.scale(1, .28); c.rotate(r() * TAU); c.strokeStyle = rgba('#ffffff', .12 + r() * .1); c.lineWidth = 1.5; c.beginPath(); c.moveTo(-s, 0); c.lineTo(0, -s * .6); c.lineTo(s, 0); c.lineTo(0, s * .6); c.closePath(); c.stroke(); c.restore(); }
      softBlob(c, 640, 540, 600, 110, T.cool, .12);
    }
  }
  // 近景(両端の柱・鎖)
  { const c = L.near.c;
    const dkc = theme === 'library' ? '#07040b' : theme === 'clock' ? '#080604' : theme === 'mirror' ? '#05030c' : '#04060c';
    [[-40, 1], [BW - 22, -1]].forEach(a => { c.fillStyle = dkc; c.fillRect(a[0], -10, 62, BH + 20); c.fillStyle = rgba(T.cool, .12); c.fillRect(a[1] > 0 ? a[0] + 56 : a[0], 0, 6, BH); });
    c.strokeStyle = dkc; c.lineWidth = 3; [[210, 0], [1010, 0]].forEach(p => { c.beginPath(); c.moveTo(p[0], 0); for (let y = 0; y < 110; y += 10) c.lineTo(p[0] + (y % 20 ? 4 : -4), y); c.stroke(); });
  }
  return L;
}
function wobS(i) { return Math.sin(i * 12.9898) ; }

/* ---------- 背景オブジェクト ---------- */
class Background {
  constructor(theme) { this.theme = theme; this.T = BGTHEME[theme] || BGTHEME.station; this.L = buildBgLayers(theme); this.t = 0; this.parts = []; this.seed(); this.grain = this.mkGrain(); }
  mkGrain() { const cv = mkCanvas(200, 200), c = cv.getContext('2d'), id = c.createImageData(200, 200); const r = srand(99); for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 22; } c.putImageData(id, 0, 0); return cv; }
  seed() { const r = srand(5); for (let i = 0; i < 70; i++) this.parts.push({ x: r() * BW, y: r() * BH, z: .3 + r() * .9, s: 1 + r() * 2.4, v: 6 + r() * 18, ph: r() * 6, k: r() }); }
  draw(c, t, cam) {
    this.t = t; const cx = cam ? cam.x : 0, T = this.T;
    const L = this.L;
    const par = (layer, f, oy) => c.drawImage(layer.cv, -BG_PAD - cx * f, oy || 0);
    par(L.sky, .05); par(L.far, .18);
    // 動的な光芒 & 歯車
    this.dyn(c, t, cx);
    par(L.mid, .45); par(L.floor, .8);
    // 床の反射光
    c.save(); c.globalCompositeOperation = 'lighter';
    softBlob(c, 640 - cx * .8, 520 + Math.sin(t * .8) * 4, 560, 70, T.warm, .05 + .02 * Math.sin(t * 1.3)); c.restore();
    // 霧
    for (let i = 0; i < 4; i++) { const x = ((t * (6 + i * 3) + i * 400) % (BW + 800)) - 400 - cx * (.3 + i * .15); softBlob(c, x, HORIZON + 20 + i * 22, 460, 70 + i * 10, T.fog, .1 + i * .02); }
    this._after = () => { };
  }
  dyn(c, t, cx) {
    const T = this.T;
    if (this.theme === 'clock') {
      [[200, 150, 90, 1], [1020, 120, 110, -1], [640, 60, 150, 1]].forEach((p, i) => { c.save(); c.translate(p[0] - cx * .4, p[1]); c.rotate(t * .22 * p[3]); gear(c, 0, 0, p[2], 18, 16, 'rgba(30,18,8,.92)', rgba(T.warm, .6)); c.restore(); });
    }
    // 光芒
    c.save(); c.globalCompositeOperation = 'lighter';
    const n = this.theme === 'clock' || this.theme === 'library' ? 4 : 3;
    for (let i = 0; i < n; i++) { const x = 160 + i * 300 + Math.sin(t * .3 + i) * 40 - cx * .5, g = c.createLinearGradient(x, 0, x + 120, HORIZON + 80); g.addColorStop(0, rgba(i % 2 ? T.cool : T.warm, .14)); g.addColorStop(1, rgba(i % 2 ? T.cool : T.warm, 0)); c.fillStyle = g; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 70, 0); c.lineTo(x + 250, HORIZON + 90); c.lineTo(x + 40, HORIZON + 90); c.closePath(); c.fill(); }
    c.restore();
  }
  front(c, t, cam) {
    const cx = cam ? cam.x : 0, L = this.L, T = this.T;
    c.drawImage(L.near.cv, -BG_PAD - cx * 1.35, 0);
    // 粒子(塵・灰・ページ・火の粉)
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const p of this.parts) {
      const x = (p.x + Math.sin(t * .5 + p.ph) * 20 + t * p.v * .4) % (BW + 40), y = (p.y - t * p.v * (this.theme === 'clock' ? 1.2 : .5) + BH * 4) % BH;
      const a = (.25 + .35 * Math.sin(t * 1.4 + p.ph)) * p.z * .8;
      c.fillStyle = rgba(p.k < .5 ? T.warm : T.cool, Math.max(0, a)); c.beginPath(); c.arc(x - cx * p.z, y, p.s * p.z, 0, TAU); c.fill();
    }
    c.restore();
  }
}
/* 全画面の仕上げ: ビネット・色調・粒状ノイズ */
function finishFx(c, bg, t, flash, aberr) {
  const T = bg.T;
  c.save(); c.fillStyle = T.grade; c.globalCompositeOperation = 'overlay'; c.fillRect(0, 0, BW, BH); c.restore();
  const g = c.createRadialGradient(BW / 2, BH * .48, BH * .35, BW / 2, BH * .5, BW * .72); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.62)'); c.fillStyle = g; c.fillRect(0, 0, BW, BH);
  c.save(); c.globalAlpha = .55; c.globalCompositeOperation = 'overlay'; const ox = (Math.random() * 200) | 0, oy = (Math.random() * 200) | 0; c.fillStyle = c.createPattern(bg.grain, 'repeat'); c.translate(-ox, -oy); c.fillRect(0, 0, BW + 200, BH + 200); c.restore();
  if (flash > 0) { c.fillStyle = `rgba(255,255,255,${Math.min(1, flash)})`; c.fillRect(0, 0, BW, BH); }
}
