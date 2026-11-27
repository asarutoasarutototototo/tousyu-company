'use strict';
/* ============================================================
   LAMPWARDEN COMPANY — gfx_char.js
   灯守キャラクターの手続き描画(レイヤー分割・セル調シェーディング)
   座標: 足元中心が原点、上が -y。スプライトは 460x660。
   ============================================================ */
const TAU = Math.PI * 2;
const SPW = 400, SPH = 700, SPO = [200, 660]; // スプライト寸法(論理)・足元原点
function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgba(h, a) { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; }
function mixc(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
const dark = (h, t) => mixc(h, '#05040a', t), light = (h, t) => mixc(h, '#ffffff', t);
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const ease = { out: t => 1 - Math.pow(1 - t, 3), in: t => t * t * t, io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); } };
const lerp = (a, b, t) => a + (b - a) * t;
function hash(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
function srand(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* ---------- 形状ヘルパ(セル調: 全体光 + 縁取り + リム) ---------- */
function shp(c, pathFn, fill, o) {
  o = o || {};
  c.save();
  c.beginPath(); pathFn(c); c.fillStyle = fill; c.fill();
  if (o.sh !== 0) {
    c.save(); c.clip();
    const g = c.createLinearGradient(-80, 0, 110, 0);
    g.addColorStop(0, 'rgba(255,248,235,' + (o.hl == null ? .12 : o.hl) + ')'); g.addColorStop(.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(6,3,18,' + (o.sh == null ? .5 : o.sh) + ')');
    c.fillStyle = g; c.fillRect(-320, -720, 640, 800);
    if (o.ao !== 0) { const g2 = c.createLinearGradient(0, -700, 0, 0); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(.75, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,.28)'); c.fillStyle = g2; c.fillRect(-320, -720, 640, 800); }
    if (o.rim) {
      const g3 = c.createLinearGradient(10, 0, 100, 0); g3.addColorStop(0, rgba(o.rim, 0)); g3.addColorStop(1, rgba(o.rim, .95));
      c.strokeStyle = g3; c.lineWidth = o.rw || 7; c.lineJoin = 'round'; c.beginPath(); pathFn(c); c.stroke();
    }
    c.restore();
  }
  if (o.ow !== 0) { c.lineWidth = o.ow || 2.6; c.strokeStyle = o.out || '#0d0b14'; c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath(); pathFn(c); c.stroke(); }
  c.restore();
}
const P = {
  poly: pts => c => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); },
  ell: (x, y, rx, ry, rot) => c => c.ellipse(x, y, rx, ry, rot || 0, 0, TAU),
  rr: (x, y, w, h, r) => c => { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
};
function capsule(c, x1, y1, x2, y2, w1, w2) {
  const a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2, dx = Math.cos(a), dy = Math.sin(a);
  c.moveTo(x1 + dx * w1, y1 + dy * w1); c.lineTo(x2 + dx * w2, y2 + dy * w2);
  c.arc(x2, y2, w2, a, a + Math.PI); c.lineTo(x1 - dx * w1, y1 - dy * w1); c.arc(x1, y1, w1, a + Math.PI, a + TAU); c.closePath();
}

/* ============================================================
   ここから: 滑らか描画エンジン v2
   - 紫寄りの影色 / 色付き輪郭 / 3段ぼかし影 / リムライト
   - テーパー曲線の腕・脚、1.5倍超解像の事前描画
   ============================================================ */
const SS = 1.5;                                   // 事前描画の超解像倍率
const shd = (f, t) => mixc(f, '#26143f', t);      // 影色(紫寄り)
const olc = f => mixc(dark(f, .5), '#1a1030', .3); // 輪郭色(塗り色から派生)
const shdH = f => mixc(dark(f, .5), '#2a1244', .18);   // 色相を保った影色(髪・瞳)
const skinSh = f => mixc(dark(f, .12), '#b0465f', .42); // 肌の影(暖色)
const HS = 1.32;                                  // 頭の拡大率
function headT(c, f) { c.save(); c.translate(0, -416); c.scale(HS, HS); c.translate(0, 416); f(); c.restore(); }

/* Catmull-Rom → ベジェ。pts を滑らかに通る */
function smoothThru(c, pts, move) {
  const n = pts.length;
  if (move) c.moveTo(pts[0][0], pts[0][1]); else c.lineTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
}
/* 中心線 pts と各点の半幅 ws から、滑らかに先細る腕/脚/眉の輪郭を作る */
function limb(pts, ws) {
  const n = pts.length, Lp = [], Rp = [], nr = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const d = Math.hypot(tx, ty) || 1; tx /= d; ty /= d;
    nr.push([tx, ty]);
    Lp.push([pts[i][0] - ty * ws[i], pts[i][1] + tx * ws[i]]);
    Rp.push([pts[i][0] + ty * ws[i], pts[i][1] - tx * ws[i]]);
  }
  return c => {
    smoothThru(c, Lp, true);
    const e = pts[n - 1], t = nr[n - 1], aN = Math.atan2(t[0], -t[1]);
    c.arc(e[0], e[1], ws[n - 1], aN, aN - Math.PI, true);
    smoothThru(c, Rp.slice().reverse(), false);
    const s = pts[0], t0 = nr[0], a0 = Math.atan2(-t0[0], t0[1]);
    c.arc(s[0], s[1], ws[0], a0, a0 - Math.PI, true);
    c.closePath();
  };
}
/* コミック調の斜線ハーフトーン / かすれ質感 */
let HATCH = null, GRUNGE = null;
function hatchPat(c) {
  if (!HATCH) { const t = mkCanvas(7, 7), g = t.getContext('2d'); g.strokeStyle = 'rgba(14,6,28,.7)'; g.lineWidth = 1.1; g.lineCap = 'round'; g.beginPath();
    g.moveTo(-1, 8); g.lineTo(8, -1); g.moveTo(-8, 8); g.lineTo(1, -1); g.moveTo(6, 15); g.lineTo(15, 6); g.stroke(); HATCH = t; }
  return c.createPattern(HATCH, 'repeat');
}
function grungeLayer(c, a) {
  if (!GRUNGE) { const t = mkCanvas(256, 256), g = t.getContext('2d'), r = srand(77);
    for (let i = 0; i < 520; i++) { g.fillStyle = r() < .55 ? 'rgba(0,0,0,' + (.08 + r() * .14) + ')' : 'rgba(255,255,255,' + (.05 + r() * .1) + ')'; g.beginPath(); g.arc(r() * 256, r() * 256, .4 + r() * 1.3, 0, TAU); g.fill(); }
    g.lineCap = 'round'; for (let i = 0; i < 26; i++) { const x = r() * 256, y = r() * 256, an = r() * TAU, l = 8 + r() * 34; g.strokeStyle = r() < .6 ? 'rgba(0,0,0,.16)' : 'rgba(255,255,255,.1)'; g.lineWidth = .6 + r() * .6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(an) * l, y + Math.sin(an) * l); g.stroke(); }
    GRUNGE = t; }
  c.save(); c.globalCompositeOperation = 'source-atop'; c.globalAlpha = a; c.fillStyle = c.createPattern(GRUNGE, 'repeat'); c.fillRect(-400, -800, 800, 840); c.restore();
}
/* 右上からの光と左下の冷たい影を全体にかぶせる */
function lightLayer(c) {
  c.save(); c.globalCompositeOperation = 'source-atop';
  const g = c.createLinearGradient(120, -640, -120, 0); g.addColorStop(0, 'rgba(255,248,236,.18)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(60,70,150,.15)');
  c.fillStyle = g; c.fillRect(-400, -800, 800, 840); c.restore();
}
/* 影つき図形: ベース→全体グラデ→3段ぼかし影(右下)→左上ハイライト→リム→色付き輪郭 */
function sh2(c, pathFn, fill, o) {
  o = o || {};
  const sh = o.sh == null ? .5 : o.sh, n = o.lite ? 2 : 4, sd = o.sd == null ? 9 : o.sd, bc = o.base || fill;
  const BIG = 1600;
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  c.beginPath(); pathFn(c); c.fillStyle = fill; c.fill();
  c.save(); c.clip();
  if (o.g !== 0) {
    const g = c.createLinearGradient(-90, -520, 90, 0);
    g.addColorStop(0, 'rgba(255,246,232,' + (o.gl == null ? .1 : o.gl) + ')'); g.addColorStop(.55, 'rgba(0,0,0,0)'); g.addColorStop(1, rgba(shd(bc, .85), .22));
    c.fillStyle = g; c.fillRect(-BIG / 2, -BIG / 2, BIG, BIG);
  }
  if (sh > 0 && o.hatch === true && !o.lite && sd >= 7) {
    c.beginPath(); c.rect(-BIG, -BIG, BIG * 2, BIG * 2); c.save(); c.translate((o.dx == null ? -1 : o.dx) * sd * .92, (o.dy == null ? -.6 : o.dy) * sd * .92); pathFn(c); c.restore();
    c.globalAlpha = o.ha == null ? .55 : o.ha; c.fillStyle = hatchPat(c); c.fill('evenodd'); c.globalAlpha = 1;
  }
  if (sh > 0) {
    const col = o.scol || shd(bc, .62), a = 1 - Math.pow(1 - sh, 1 / n), dx = o.dx == null ? -1 : o.dx, dy = o.dy == null ? -.6 : o.dy;
    for (let i = 1; i <= n; i++) {
      const f = i / n * sd;
      c.beginPath(); c.rect(-BIG, -BIG, BIG * 2, BIG * 2);
      c.save(); c.translate(dx * f, dy * f); pathFn(c); c.restore();
      c.fillStyle = rgba(col, a); c.fill('evenodd');
    }
  }
  if (o.hl !== 0 && !o.lite) {
    c.beginPath(); c.rect(-BIG, -BIG, BIG * 2, BIG * 2); c.save(); c.translate(3, 2); pathFn(c); c.restore();
    c.fillStyle = rgba(light(bc, .6), o.hla == null ? .2 : o.hla); c.fill('evenodd');
  }
  if (o.rim) {
    c.beginPath(); c.rect(-BIG, -BIG, BIG * 2, BIG * 2); c.save(); c.translate(-(o.rw || 3.2), 0); pathFn(c); c.restore();
    c.fillStyle = rgba(o.rim, o.ra == null ? .8 : o.ra); c.fill('evenodd');
  }
  c.restore();
  if (o.ow !== 0) { c.lineWidth = o.ow || 1.4; c.strokeStyle = rgba(o.out || olc(bc), o.oa == null ? .85 : o.oa); c.beginPath(); pathFn(c); c.stroke(); }
  c.restore();
}
/* きらめき・グロー */
function star4p(c, x, y, r, fat) { fat = fat || .2; c.moveTo(x, y - r); c.quadraticCurveTo(x + r * fat, y - r * fat, x + r, y); c.quadraticCurveTo(x + r * fat, y + r * fat, x, y + r); c.quadraticCurveTo(x - r * fat, y + r * fat, x - r, y); c.quadraticCurveTo(x - r * fat, y - r * fat, x, y - r); c.closePath(); }
function star4(c, x, y, r, fat) { c.beginPath(); star4p(c, x, y, r, fat); }
function bloom(c, x, y, r, col, a) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
function sparkle(c, x, y, r, col, a) { bloom(c, x, y, r * 2.2, col || '#ffffff', .5 * a); c.fillStyle = rgba('#ffffff', a); star4(c, x, y, r); c.fill(); }
function bez(p0, p1, p2, p3, t) { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; }
/* 曲線ストローク(折り目・髪の筋など) */
function line2(c, pts, col, w, a) { c.save(); c.strokeStyle = rgba(col, a == null ? 1 : a); c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); smoothThru(c, pts, true); c.stroke(); c.restore(); }
function glossArc(c, pts, col, w, a) { line2(c, pts, col, w, a * .55); line2(c, pts, '#ffffff', w * .45, a * .7); }

/* ---------- 髪(頭部座標系 / headT 内で描く) ---------- */
// 前髪ノード: 右→左 [x, y, 'v'=生え際の谷 | 't'=毛先]
const FRINGE = {
  short:    [[40,-466,'v'],[38,-436,'t'],[33,-486,'v'],[27,-462,'t'],[20,-488,'v'],[10,-466,'t'],[1,-490,'v'],[-8,-464,'t'],[-17,-488,'v'],[-26,-466,'t'],[-33,-486,'v'],[-38,-438,'t'],[-40,-466,'v']],
  sidepart: [[40,-466,'v'],[39,-436,'t'],[33,-484,'v'],[24,-464,'t'],[14,-490,'v'],[2,-468,'t'],[-8,-496,'v'],[-20,-470,'t'],[-30,-488,'v'],[-38,-440,'t'],[-40,-466,'v']],
  spike:    [[40,-466,'v'],[44,-432,'t'],[34,-486,'v'],[28,-460,'t'],[20,-490,'v'],[12,-464,'t'],[4,-492,'v'],[-4,-462,'t'],[-12,-490,'v'],[-20,-466,'t'],[-28,-486,'v'],[-44,-434,'t'],[-40,-466,'v']],
  wild:     [[40,-466,'v'],[46,-428,'t'],[34,-486,'v'],[27,-458,'t'],[19,-492,'v'],[9,-460,'t'],[0,-494,'v'],[-10,-464,'t'],[-18,-492,'v'],[-28,-460,'t'],[-34,-486,'v'],[-46,-430,'t'],[-40,-466,'v']],
  bob:      [[40,-466,'v'],[44,-414,'t'],[35,-480,'v'],[26,-470,'t'],[16,-482,'v'],[6,-471,'t'],[-4,-482,'v'],[-14,-472,'t'],[-24,-482,'v'],[-34,-470,'t'],[-36,-478,'v'],[-44,-414,'t'],[-40,-466,'v']],
  long:     [[40,-466,'v'],[48,-396,'t'],[36,-482,'v'],[30,-466,'t'],[20,-488,'v'],[10,-468,'t'],[2,-492,'v'],[-8,-466,'t'],[-18,-488,'v'],[-28,-468,'t'],[-36,-480,'v'],[-48,-398,'t'],[-40,-466,'v']],
  hood:     [[38,-470,'v'],[34,-462,'t'],[22,-484,'v'],[8,-470,'t'],[-8,-486,'v'],[-24,-466,'t'],[-34,-480,'v'],[-38,-470,'v']]
};
FRINGE.pony = FRINGE.long; FRINGE.twin = FRINGE.long;
function fringe(c, W, yA, top, nodes) {
  const cy = (top - .25 * yA) / .75;
  c.moveTo(-W, yA); c.bezierCurveTo(-W - 6, cy, W + 6, cy, W, yA);
  let pv = nodes[0], pt = null;
  for (let i = 1; i < nodes.length; i++) {
    const n = nodes[i];
    if (n[2] === 't') { c.quadraticCurveTo(pv[0] + (n[0] - pv[0]) * .12, pv[1] + (n[1] - pv[1]) * .7, n[0], n[1]); pt = n; }
    else if (pt) { c.quadraticCurveTo(pt[0] + (n[0] - pt[0]) * .55, pt[1] + (n[1] - pt[1]) * .18, n[0], n[1]); pv = n; pt = null; }
    else { c.lineTo(n[0], n[1]); pv = n; }
  }
  c.closePath();
}
/* とがった髪束の冠(spike/wild の後ろ髪): angs=[角度(度), 長さ, 曲がり] */
function crown(c, cx, cy, rx, ry, list) {
  const P = (th, r) => [cx + Math.cos(th) * rx * r, cy - Math.sin(th) * ry * r];
  let first = true;
  list.forEach(s => {
    const th = s[0] * Math.PI / 180, d = .2 + s[1] * .0012;
    const b0 = P(th + d, 1.02), tip = P(th + (s[2] || 0), 1 + s[1] / ry * .95), b1 = P(th - d, 1.02);
    if (first) { c.moveTo(b0[0], b0[1]); first = false; } else c.lineTo(b0[0], b0[1]);
    c.quadraticCurveTo(lerp(b0[0], tip[0], .25), lerp(b0[1], tip[1], .75), tip[0], tip[1]);
    c.quadraticCurveTo(lerp(b1[0], tip[0], .45), lerp(b1[1], tip[1], .2), b1[0], b1[1]);
  });
  c.lineTo(cx + rx * .8, cy + 30); c.lineTo(cx - rx * .8, cy + 30); c.closePath();
}
function hairBackPath(hs) {
  switch (hs) {
    case 'long': return c => {
      c.moveTo(-38, -468); c.bezierCurveTo(-48, -520, 48, -520, 38, -468);
      c.bezierCurveTo(54, -436, 68, -366, 60, -300); c.quadraticCurveTo(58, -268, 49, -238);
      c.quadraticCurveTo(45, -266, 38, -284); c.quadraticCurveTo(33, -256, 24, -230);
      c.quadraticCurveTo(21, -262, 15, -294); c.bezierCurveTo(6, -300, -6, -300, -15, -294);
      c.quadraticCurveTo(-19, -258, -26, -228); c.quadraticCurveTo(-31, -262, -38, -284);
      c.quadraticCurveTo(-47, -262, -52, -236); c.quadraticCurveTo(-62, -268, -64, -300);
      c.bezierCurveTo(-70, -366, -54, -436, -38, -468); c.closePath(); };
    case 'bob': return c => {
      c.moveTo(-40, -468); c.bezierCurveTo(-50, -528, 50, -528, 40, -468);
      c.bezierCurveTo(54, -446, 54, -412, 44, -392); c.quadraticCurveTo(24, -378, 0, -382); c.quadraticCurveTo(-24, -378, -44, -392);
      c.bezierCurveTo(-54, -412, -54, -446, -40, -468); c.closePath(); };
    case 'spike': return c => crown(c, 0, -470, 44, 50, [[198, 38, .05], [166, 52, .1], [136, 44, .08], [108, 56, .1], [84, 44, -.06], [58, 52, -.1], [30, 46, -.08], [4, 38, -.05]]);
    case 'wild': return c => crown(c, 0, -466, 46, 52, [[206, 40, .08], [182, 56, .12], [156, 50, .1], [130, 62, .12], [104, 50, .06], [80, 64, -.04], [54, 52, -.1], [30, 60, -.12], [6, 46, -.1], [-16, 34, -.08]]);
    case 'pony': return c => {
      c.moveTo(-40, -468); c.bezierCurveTo(-46, -524, 46, -524, 40, -468); c.lineTo(36, -442); c.lineTo(-36, -442); c.closePath();
      c.moveTo(30, -504); c.bezierCurveTo(70, -530, 108, -490, 94, -420);
      c.bezierCurveTo(88, -372, 72, -338, 78, -296); c.bezierCurveTo(64, -318, 48, -332, 46, -366);
      c.bezierCurveTo(44, -402, 52, -426, 40, -450); c.bezierCurveTo(46, -472, 42, -490, 30, -504); c.closePath(); };
    case 'twin': return c => {
      c.moveTo(-40, -468); c.bezierCurveTo(-46, -524, 46, -524, 40, -468); c.lineTo(36, -442); c.lineTo(-36, -442); c.closePath();
      [-1, 1].forEach(s => { c.moveTo(s * 34, -496); c.bezierCurveTo(s * 80, -510, s * 104, -462, s * 92, -392); c.bezierCurveTo(s * 86, -352, s * 72, -330, s * 74, -304); c.bezierCurveTo(s * 60, -318, s * 50, -340, s * 52, -372); c.bezierCurveTo(s * 54, -404, s * 52, -426, s * 40, -444); c.bezierCurveTo(s * 46, -466, s * 44, -484, s * 34, -496); c.closePath(); }); };
    case 'hood': return c => { c.moveTo(-44, -466); c.bezierCurveTo(-54, -540, 54, -540, 44, -466); c.bezierCurveTo(56, -430, 58, -402, 46, -384); c.quadraticCurveTo(0, -372, -46, -384); c.bezierCurveTo(-58, -402, -56, -430, -44, -466); c.closePath(); };
    default: return c => { c.moveTo(-40, -466); c.bezierCurveTo(-48, -526, 48, -526, 40, -466); c.lineTo(38, -440); c.lineTo(-38, -440); c.closePath(); };
  }
}
/* 髪の描画: part='back'|'front' (根元は深く、毛先はアクセント色へ溶けるグラデ) */
const HY1 = { long: -236, pony: -296, twin: -306, bob: -384 };
function hairFill(c, L, part) {
  const hair = L.hair, g = c.createLinearGradient(0, part === 'back' ? -520 : -516, 0, part === 'back' ? (HY1[L.hs] || -436) : -446);
  g.addColorStop(0, mixc(hair, '#1a1f4a', .24)); g.addColorStop(.4, hair); g.addColorStop(1, mixc(light(hair, .18), L.acc, .4));
  return g;
}
function drawHair(c, L, part) {
  const hair = L.hair, hs = L.hs, ac = L.acc, ol = mixc(hair, '#3a2440', .5), hsc = mixc(dark(hair, .35), '#2f3a7a', .3);
  let sd0 = 7; for (const ch of hair + hs) sd0 = (sd0 * 31 + ch.charCodeAt(0)) >>> 0; const rg = srand(sd0);
  const base = { base: hair, scol: hsc, out: ol, ow: 1.1, oa: .75, rim: ac, ra: .75 };
  if (part === 'back') {
    const pf = hairBackPath(hs);
    sh2(c, pf, hairFill(c, L, 'back'), { ...base, sh: .55, sd: 11, rw: 3.6 });
    c.save(); c.beginPath(); pf(c); c.clip();
    const flow = {
      long: [[[-40, -440], [-54, -370], [-48, -300]], [[34, -440], [50, -370], [46, -300]], [[-18, -330], [-22, -290], [-24, -250]], [[18, -330], [22, -290], [24, -254]], [[-48, -420], [-62, -350], [-58, -290]], [[44, -420], [58, -350], [56, -290]]],
      bob: [[[-40, -440], [-46, -415], [-40, -396]], [[40, -440], [46, -415], [40, -396]], [[-30, -450], [-36, -420], [-30, -394]], [[30, -450], [36, -420], [30, -394]]],
      pony: [[[44, -490], [78, -470], [76, -380]], [[40, -440], [58, -380], [72, -310]], [[52, -480], [88, -440], [84, -350]]],
      twin: [[[-44, -490], [-86, -450], [-74, -330]], [[44, -490], [86, -450], [74, -330]], [[-40, -440], [-62, -390], [-68, -320]], [[40, -440], [62, -390], [68, -320]]]
    }[hs];
    if (flow) flow.forEach(p => { line2(c, p, shdH(hair), 1.4, .5); line2(c, p.map(q => [q[0] + 3, q[1]]), light(hair, .6), 1.1, .34); });
    if (flow) for (let i = 0; i < 12; i++) { const p = flow[i % flow.length], j = (rg() - .5) * 16; line2(c, p.map(q => [q[0] + j, q[1] + (rg() - .5) * 8]), rg() < .5 ? hsc : light(hair, .72), .8, .14 + rg() * .2); }
    // 後ろ髪の艶(縦の光帯)
    if (flow) { const p = flow[0]; glossArc(c, p.map(q => [q[0] + 7, q[1] + 6]), light(hair, .75), 5, .42); }
    c.restore();
    if (hs === 'pony') sh2(c, P.ell(36, -496, 6, 9, .5), L.trim, { sh: .3, ow: 1.2, lite: true });
    if (hs === 'twin') [-1, 1].forEach(s => sh2(c, P.ell(s * 36, -494, 6, 9, -s * .5), L.trim, { sh: .3, ow: 1.2, lite: true }));
    return;
  }
  if (hs === 'hood') { sh2(c, c => fringe(c, 38, -470, -508, FRINGE.hood), dark(L.coat, .1), { sh: .4, rim: ac, ra: .5 }); return; }
  const nodes = FRINGE[hs] || FRINGE.short, W = 40, yA = -464, top = hs === 'long' || hs === 'bob' || hs === 'pony' || hs === 'twin' ? -516 : -512;
  const pf = c => fringe(c, W, yA, top, nodes);
  sh2(c, pf, hairFill(c, L, 'front'), { ...base, sh: .5, sd: 8, rw: 3.2 });
  c.save(); c.beginPath(); pf(c); c.clip();
  nodes.filter(n => n[2] === 't').forEach((n, i) => {
    const sx = n[0] * .32 + (hs === 'sidepart' ? -10 : 0), sy = -508;
    for (let k = 0; k < 6; k++) {
      const j = (rg() - .5) * 8, dk = k % 3 === 0;
      line2(c, [[sx + j, sy + k], [lerp(sx, n[0], .6) + j * 1.5, lerp(sy, n[1], .55)], [n[0] + j * .5, n[1] - 2 - k * 1.6]], dk ? hsc : light(hair, .55 + rg() * .3), dk ? 1.2 : .8, dk ? .5 : .2 + rg() * .22);
    }
  });
  // 天使の輪(2本の艶帯)
  glossArc(c, [[-30, -492], [-12, -507], [10, -508], [28, -494]], light(hair, .75), 7, .8);
  c.restore();
  // ほつれ毛
  if (hs !== 'spike' && hs !== 'wild') { [[-1, 0], [1, 0], [-1, 1], [1, 1]].forEach(([sg, k]) => { const y0 = -468 + k * 10; line2(c, [[sg * 38, y0], [sg * (46 + rg() * 4), y0 + 16], [sg * (43 + rg() * 5), y0 + 36 + rg() * 8]], hair, .9, .55); line2(c, [[sg * 37, y0 + 2], [sg * (44 + rg() * 3), y0 + 18], [sg * (41 + rg() * 3), y0 + 30]], light(hair, .6), .7, .4); }); }
  // 髪飾り(X字のヘアピン)ときらめき
  if (!L.hat && hs !== 'spike' && hs !== 'wild' && hs !== 'hood') {
    const px = -29, py = -487; bloom(c, px, py, 11, '#cfe6ff', .5);
    [[[-1, -1], [1, 1]], [[1, -1], [-1, 1]]].forEach(([a, b2]) => sh2(c, limb([[px + a[0] * 5.4, py + a[1] * 5.4], [px + b2[0] * 5.4, py + b2[1] * 5.4]], [1.9, 1.9]), L.trim, { lite: true, g: 0, sd: 2, ow: .9, rim: '#ffffff', rw: 1, ra: .7 }));
  }
  sparkle(c, 21, -499, 3.6, '#ffffff', .9); sparkle(c, -22, -502, 2.2, '#ffffff', .7);
}

/* ---------- 顔(頭部座標) ---------- */
const FACE = c => {
  c.moveTo(-31, -466); c.bezierCurveTo(-32, -488, -17, -497, 0, -497); c.bezierCurveTo(17, -497, 32, -488, 31, -466);
  c.bezierCurveTo(30, -448, 19, -430, 5, -418.5); c.quadraticCurveTo(0, -412.5, -5, -418.5);
  c.bezierCurveTo(-19, -430, -30, -448, -31, -466); c.closePath();
};
const EYE_X = [-12.5, 14.5];
function eyeArt(c, x, side, expr, L, t, blink) {
  const y = -455, ink = '#3a2748';
  c.save(); c.translate(x, y);
  const w = 12, h = expr === 'atk' ? 9.2 : expr === 'panic' ? 14 : 10.8;
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (blink || expr === 'hurt' || expr === 'dead') {
    c.strokeStyle = ink; c.beginPath();
    if (expr === 'hurt') { c.lineWidth = 3; c.moveTo(side * 8.5, -6); c.lineTo(-side * 5.5, 0); c.lineTo(side * 8.5, 6); }
    else if (expr === 'dead') { c.lineWidth = 2.6; c.moveTo(-6, -6); c.lineTo(6, 6); c.moveTo(6, -6); c.lineTo(-6, 6); }
    else { c.lineWidth = 2.6; c.moveTo(-w, .5); c.quadraticCurveTo(0, 6.4, w, .5); c.moveTo(side * w * .9, 1); c.quadraticCurveTo(side * (w + 2.5), -.5, side * (w + 5), -3); }
    c.stroke(); c.restore(); return;
  }
  c.rotate(-side * (expr === 'atk' ? .13 : .06));
  const top = c => { c.moveTo(-w, 2); c.bezierCurveTo(-w * .5, -h * 1.1, w * .62, -h * 1.12, w, .2); };
  const lid = c => { top(c); c.bezierCurveTo(w * .6, h * .9, -w * .5, h, -w, 2); c.closePath(); };
  c.save(); c.beginPath(); lid(c); c.clip();
  let g = c.createLinearGradient(0, -h, 0, h); g.addColorStop(0, '#d9c9dc'); g.addColorStop(.3, '#fffafa'); g.addColorStop(1, '#fbeaf0');
  c.fillStyle = g; c.fillRect(-w - 2, -h - 2, 2 * w + 4, 2 * h + 4);
  g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, 'rgba(190,150,175,.5)'); g.addColorStop(.28, 'rgba(190,150,175,0)'); g.addColorStop(.72, 'rgba(190,150,175,0)'); g.addColorStop(1, 'rgba(190,150,175,.5)'); c.fillStyle = g; c.fillRect(-w - 2, -h - 2, 2 * w + 4, 2 * h + 4);
  const ec = expr === 'panic' ? '#ff3b4d' : L.eye;
  g = c.createLinearGradient(0, -h, 0, h); g.addColorStop(0, shdH(ec)); g.addColorStop(.38, ec); g.addColorStop(.78, light(ec, .3)); g.addColorStop(1, light(ec, .6));
  c.fillStyle = g; c.beginPath(); c.ellipse(1.2, 1, 10.8, h, 0, 0, TAU); c.fill();
  c.strokeStyle = rgba(dark(ec, .72), .85); c.lineWidth = 1.4; c.stroke();
  c.strokeStyle = rgba(light(ec, .65), .2); c.lineWidth = .9;
  for (let i = 0; i < 12; i++) { const a = i * TAU / 12; c.beginPath(); c.moveTo(1.2 + Math.cos(a) * 4.8, 1.4 + Math.sin(a) * 6.8); c.lineTo(1.2 + Math.cos(a) * 9.6, 1 + Math.sin(a) * h * .95); c.stroke(); }
  c.fillStyle = '#1b0f24'; c.beginPath(); c.ellipse(1.2, 1.4, 4.2, 6.4, 0, 0, TAU); c.fill();
  g = c.createRadialGradient(1.4, h * .66, 0, 1.4, h * .66, 8.5); g.addColorStop(0, rgba(light(ec, .85), .95)); g.addColorStop(1, rgba(light(ec, .85), 0));
  c.fillStyle = g; c.fillRect(-w, 0, 2 * w, h);
  c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(-w * .62, h * .6); c.quadraticCurveTo(0, h * 1.02, w * .62, h * .58); c.stroke();
  if (expr === 'panic') { c.strokeStyle = '#1a0610'; c.lineWidth = 1.5; c.beginPath(); for (let a = 0; a < 14; a += .3) { const r = a * .55; c.lineTo(1.2 + Math.cos(a + t * 6) * r, 1 + Math.sin(a + t * 6) * r); } c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.97)'; c.beginPath(); c.ellipse(-2.6, -4.8, 3.2, 3.6, -.3, 0, TAU); c.fill();
  c.beginPath(); c.arc(4.6, 5.2, 1.6, 0, TAU); c.fill(); c.beginPath(); c.arc(-.4, 4.2, .9, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,.9)'; star4(c, 3.8, -1.4, 2.7); c.fill();
  g = c.createLinearGradient(0, -h, 0, -h + 10); g.addColorStop(0, rgba(shdH(ec), .9)); g.addColorStop(1, rgba(shdH(ec), 0));
  c.fillStyle = g; c.fillRect(-w, -h, 2 * w, 13);
  c.restore();
  // 二重まぶた・まつ毛(濃い紫褐色)
  c.strokeStyle = rgba(skinSh(L.skin), .4); c.lineWidth = 1; c.beginPath(); c.moveTo(-w * .6, -h * .98); c.bezierCurveTo(-w * .3, -h * 1.38, w * .3, -h * 1.4, w * .62, -h * 1.02); c.stroke();
  c.strokeStyle = ink; c.lineWidth = 1.5; c.beginPath(); top(c); c.stroke();
  c.lineWidth = 2.4; c.beginPath(); if (side < 0) { c.moveTo(-w, 2); c.bezierCurveTo(-w * .9, -h * .5, -w * .62, -h * .84, -w * .3, -h * .9); } else { c.moveTo(w, .2); c.bezierCurveTo(w * .9, -h * .55, w * .62, -h * .86, w * .3, -h * .92); } c.stroke();
  c.lineWidth = 1.3; c.beginPath(); c.moveTo(side * w * .94, side < 0 ? 1.4 : .4); c.quadraticCurveTo(side * (w + 1.6), -1.8, side * (w + 3.8), -5.6); c.stroke();
  c.lineWidth = 1; c.beginPath(); c.moveTo(side * w * .74, -h * .6); c.lineTo(side * (w * .74 + 1.8), -h * .6 - 3.6); c.moveTo(side * w * .5, -h * .84); c.lineTo(side * (w * .5 + 1.2), -h * .84 - 3.8); c.stroke();
  c.strokeStyle = rgba(ink, .38); c.lineWidth = 1; c.beginPath(); if (side < 0) { c.moveTo(-w, 2); c.bezierCurveTo(-w * .75, h * .62, -w * .5, h * .9, -w * .2, h * .97); } else { c.moveTo(w, .2); c.bezierCurveTo(w * .75, h * .58, w * .5, h * .88, w * .2, h * .95); } c.stroke();
  c.restore();
}
function faceArt(c, L, expr, t, blink, part) {
  const brow = (pts) => { c.fillStyle = dark(L.hair, .5); c.beginPath(); limb(pts.map(p => [p[0], p[1] - 2.6]), [.9, 2, .5])(c); c.fill(); };
  if (part === 'brow') {
    if (L.mask === 1 || L.hat === 'horn') return;
    if (expr === 'atk') { brow([[-24, -477], [-14, -474], [-5, -468]]); brow([[26, -477], [17, -474], [7, -468]]); }
    else if (expr === 'hurt' || expr === 'panic') { brow([[-23, -467], [-14, -471], [-5, -477]]); brow([[25, -467], [16, -471], [7, -477]]); }
    else { brow([[-23, -472], [-14, -477], [-5, -473]]); brow([[25, -472], [16, -477], [8, -473]]); }
    return;
  }
  // 前髪が額に落とす影
  c.save(); c.beginPath(); FACE(c); c.clip();
  let g = c.createLinearGradient(0, -498, 0, -460); g.addColorStop(0, rgba(skinSh(L.skin), .6)); g.addColorStop(1, rgba(skinSh(L.skin), 0));
  c.fillStyle = g; c.fillRect(-40, -500, 80, 44);
  bloom(c, -7, -452, 24, '#fff4ea', .3); bloom(c, 3, -441, 6, '#ffffff', .32);
  c.restore();
  // 頬の赤み
  [[-20, -438], [24, -438]].forEach(p => { c.save(); c.translate(p[0], p[1]); c.scale(1, .55); const r = c.createRadialGradient(0, 0, 0, 0, 0, 11); r.addColorStop(0, 'rgba(255,104,138,.42)'); r.addColorStop(1, 'rgba(255,104,138,0)'); c.fillStyle = r; c.beginPath(); c.arc(0, 0, 11, 0, TAU); c.fill(); c.restore(); });
  if (L.mask !== 1) EYE_X.forEach((x, i) => eyeArt(c, x, i ? 1 : -1, expr, L, t, blink));
  if (L.mask !== 2) {
    c.strokeStyle = rgba(shd(L.skin, .75), .85); c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(2.6, -442); c.quadraticCurveTo(3.2, -438.6, .4, -437.6); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(1.8, -444, 1.2, 2, 0, 0, TAU); c.fill();
    c.strokeStyle = '#5a2a3a'; c.lineWidth = 2.1; c.beginPath();
    if (expr === 'atk') {
      c.fillStyle = '#4a1020'; c.beginPath(); c.moveTo(-6.5, -429.5); c.quadraticCurveTo(0, -433.5, 7.5, -430); c.quadraticCurveTo(1, -420, -6.5, -429.5); c.fill();
      c.fillStyle = '#c4586e'; c.beginPath(); c.ellipse(1, -424.2, 3.2, 1.6, 0, 0, TAU); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-5, -429.6); c.quadraticCurveTo(0.6, -432, 6.4, -430); c.stroke();
    } else if (expr === 'hurt') { c.moveTo(-5.5, -427); c.quadraticCurveTo(-2.7, -430.5, 0, -427); c.quadraticCurveTo(2.7, -423.5, 5.5, -427); c.stroke(); }
    else if (expr === 'panic') { c.moveTo(-8, -426); c.lineTo(-4, -430); c.lineTo(0, -426); c.lineTo(4, -430); c.lineTo(8, -426); c.stroke(); }
    else if (expr === 'dead') { c.moveTo(-5, -427); c.lineTo(5, -427); c.stroke(); }
    else { c.fillStyle = '#7a2438'; c.beginPath(); c.moveTo(-5, -430); c.quadraticCurveTo(1, -428.4, 6.6, -430.2); c.quadraticCurveTo(2, -422.6, -5, -430); c.fill(); c.fillStyle = '#e8728a'; c.beginPath(); c.ellipse(1.4, -425.6, 2.7, 1.2, 0, 0, TAU); c.fill(); c.fillStyle = '#fffafa'; c.beginPath(); c.moveTo(-4.2, -429.6); c.quadraticCurveTo(1, -428.2, 5.8, -429.8); c.quadraticCurveTo(1, -427, -4.2, -429.6); c.fill(); c.strokeStyle = 'rgba(181,71,95,.9)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(-5, -430); c.quadraticCurveTo(1, -428.4, 6.6, -430.2); c.stroke(); }
  }
  if (L.mask === 1) { // 目元の仮面
    const mk = c => { c.moveTo(-32, -466); c.bezierCurveTo(-18, -482, 18, -482, 32, -466); c.bezierCurveTo(35, -456, 32, -446, 26, -441); c.bezierCurveTo(18, -437, 9, -441, 4, -448); c.quadraticCurveTo(0, -451, -4, -448); c.bezierCurveTo(-9, -441, -18, -437, -26, -441); c.bezierCurveTo(-32, -446, -35, -456, -32, -466); c.closePath(); };
    sh2(c, mk, '#efe9f5', { sh: .4, sd: 5, rim: L.acc, ra: .6, ow: 1.8 });
    EYE_X.forEach((x, i) => {
      c.save(); c.translate(x, -455); const w = 9, h = 6;
      c.fillStyle = '#120a1c'; c.beginPath(); c.moveTo(-w, 1.5); c.bezierCurveTo(-w * .5, -h * 1.3, w * .6, -h * 1.3, w, -.5); c.bezierCurveTo(w * .6, h * 1.1, -w * .5, h * 1.1, -w, 1.5); c.fill();
      const r = c.createRadialGradient(1, 0, 0, 1, 0, 5.5); r.addColorStop(0, '#fff'); r.addColorStop(.35, light(L.eye, .3)); r.addColorStop(1, rgba(L.eye, 0)); c.fillStyle = r; c.beginPath(); c.arc(1, 0, 5.5, 0, TAU); c.fill();
      c.restore();
    });
    line2(c, [[-28, -471], [-14, -477], [0, -474], [14, -477], [28, -471]], L.acc, 1.6, .85);
    sh2(c, P.ell(0, -475, 3.2, 3.8), L.acc, { sh: .3, ow: 1.2 });
  }
  if (L.mask === 2) { // 医療マスク
    const mk = c => { c.moveTo(-29, -443); c.bezierCurveTo(-10, -448, 10, -448, 29, -443); c.bezierCurveTo(28, -426, 12, -416, 0, -413.5); c.bezierCurveTo(-12, -416, -28, -426, -29, -443); c.closePath(); };
    line2(c, [[-29, -443], [-33, -448], [-34, -456]], '#dfe6e4', 1.4, .9); line2(c, [[29, -443], [33, -448], [34, -456]], '#dfe6e4', 1.4, .9);
    sh2(c, mk, '#e9efee', { sh: .35, sd: 6, ow: 1.8, g: 0 });
    for (let i = 0; i < 3; i++) line2(c, [[-24, -437 + i * 7], [0, -432 + i * 7 + (i === 2 ? 2 : 0)], [24, -437 + i * 7]], '#5b7573', 1.2, .4);
  }
}
const FSPR = {};
function faceSprite(L, key, expr, blink, part) {
  const k = key + ':' + expr + ':' + (blink ? 1 : 0) + ':' + (part || 'm');
  if (FSPR[k]) return FSPR[k];
  const h = L.h || 1, x0 = -58 * h, y0 = -548 * h, w = 116 * h, hh = 142 * h;
  const cv = mkCanvas(Math.ceil(w * SS), Math.ceil(hh * SS)), c = cv.getContext('2d');
  c.scale(SS, SS); c.translate(-x0, -y0); c.scale(h, h);
  headT(c, () => faceArt(c, L, expr, 0, blink, part));
  return FSPR[k] = trim({ cv, x: x0, y: y0, w: cv.width / SS, h: cv.height / SS });
}

/* ---------- 帽子・フード(頭部座標) ---------- */
function drawHat(c, L) {
  const ac = L.acc, ro = { rim: ac, ra: .6 };
  switch (L.hat) {
    case 'top':
      sh2(c, P.ell(0, -499, 55, 10), dark(L.coat, .5), ro);
      sh2(c, c => { c.moveTo(-31, -500); c.bezierCurveTo(-33, -540, -29, -560, -27, -570); c.quadraticCurveTo(0, -577, 27, -570); c.bezierCurveTo(29, -560, 33, -540, 31, -500); c.quadraticCurveTo(0, -493, -31, -500); c.closePath(); }, dark(L.coat, .55), ro);
      sh2(c, c => { c.moveTo(-32, -520); c.quadraticCurveTo(0, -513, 32, -520); c.lineTo(32, -507); c.quadraticCurveTo(0, -500, -32, -507); c.closePath(); }, L.trim, { sh: .35, sd: 3 });
      sh2(c, P.ell(18, -513, 5, 6), ac, { sh: .3, ow: 1.4 });
      break;
    case 'beret':
      sh2(c, c => { c.moveTo(-44, -488); c.bezierCurveTo(-54, -524, -10, -548, 34, -534); c.bezierCurveTo(60, -524, 58, -498, 40, -490); c.bezierCurveTo(10, -478, -24, -478, -44, -488); c.closePath(); }, dark(L.coat, .2), ro);
      sh2(c, P.ell(-1, -537, 3.6, 4.8), L.trim, { sh: .3, ow: 1.4 });
      line2(c, [[-30, -500], [-8, -526], [20, -530]], shd(L.coat, .6), 1.3, .5);
      break;
    case 'chef':
      sh2(c, c => { c.moveTo(-34, -522); c.bezierCurveTo(-78, -540, -64, -592, -26, -586); c.bezierCurveTo(-18, -616, 18, -616, 26, -586); c.bezierCurveTo(64, -592, 78, -540, 34, -522); c.closePath(); }, '#f6f2e8', { sh: .4, sd: 10, rim: ac, ra: .5 });
      line2(c, [[-14, -586], [-18, -552], [-14, -526]], '#a79f90', 1.3, .5); line2(c, [[14, -588], [18, -552], [14, -526]], '#a79f90', 1.3, .5);
      sh2(c, c => { c.moveTo(-33, -524); c.quadraticCurveTo(0, -518, 33, -524); c.lineTo(32, -496); c.quadraticCurveTo(0, -490, -32, -496); c.closePath(); }, '#f2eee2', { sh: .35, sd: 4, rim: ac, ra: .5 });
      break;
    case 'crown': {
      const cr = c => { c.moveTo(-35, -502); c.lineTo(-43, -550); c.quadraticCurveTo(-30, -532, -21, -528); c.lineTo(-9, -560); c.quadraticCurveTo(-3, -536, 0, -530); c.quadraticCurveTo(3, -536, 9, -560); c.lineTo(21, -528); c.quadraticCurveTo(30, -532, 43, -550); c.lineTo(35, -502); c.quadraticCurveTo(0, -494, -35, -502); c.closePath(); };
      sh2(c, cr, '#e4c46a', { sh: .4, sd: 6, rim: '#fff3b0', ra: .8 });
      [[-9, -560], [9, -560], [-43, -550], [43, -550]].forEach(p => sh2(c, P.ell(p[0], p[1] - 2, 3, 3), ac, { sh: .2, ow: 1.2 }));
      sh2(c, P.ell(0, -512, 4.4, 4.4), ac, { sh: .3, ow: 1.4 });
      break; }
    case 'horn':
      sh2(c, c => { c.moveTo(-41, -468); c.bezierCurveTo(-46, -534, 46, -534, 41, -468); c.lineTo(38, -462); c.quadraticCurveTo(0, -480, -38, -462); c.closePath(); }, '#9aa3bd', { sh: .55, sd: 9, rim: '#e8f0ff', ra: .7 });
      [-1, 1].forEach(s => sh2(c, c => { c.moveTo(s * 36, -498); c.bezierCurveTo(s * 72, -508, s * 84, -552, s * 64, -582); c.bezierCurveTo(s * 66, -544, s * 50, -526, s * 30, -516); c.closePath(); }, '#e6e0cc', { sh: .5, sd: 5, rim: ac, ra: .6 }));
      sh2(c, c => { c.moveTo(-5.5, -506); c.lineTo(5.5, -506); c.bezierCurveTo(6, -490, 5, -466, 3.5, -452); c.lineTo(-3.5, -452); c.bezierCurveTo(-5, -466, -6, -490, -5.5, -506); c.closePath(); }, '#7f88a2', { sh: .4, sd: 3, ow: 1.5 });
      break;
  }
}
function drawHood(c, L) {
  const outer = c => { c.moveTo(-52, -436); c.bezierCurveTo(-70, -534, 70, -534, 52, -436); c.lineTo(44, -406); c.quadraticCurveTo(0, -396, -44, -406); c.closePath(); };
  const hole = c => { c.moveTo(26, -422); c.bezierCurveTo(38, -440, 40, -478, 24, -492); c.bezierCurveTo(10, -502, -10, -502, -24, -492); c.bezierCurveTo(-40, -478, -38, -440, -26, -422); c.bezierCurveTo(-12, -412, 12, -412, 26, -422); c.closePath(); };
  const both = c => { outer(c); hole(c); };
  sh2(c, both, dark(L.coat, .05), { sh: .5, sd: 10, rim: L.acc, ra: .6 });
  c.save(); c.beginPath(); hole(c); c.lineWidth = 2.4; c.strokeStyle = rgba(dark(L.coat, .6), .9); c.stroke(); c.restore();
  line2(c, [[-46, -450], [-40, -420], [-30, -408]], L.trim, 1.6, .8); line2(c, [[46, -450], [40, -420], [30, -408]], L.trim, 1.6, .8);
}

/* ---------- 体(レイヤー別) ---------- */
function drawHand(c, L, rot) { // 垂らした手(後ろ腕用)
  const gl = L.glove || '#16131c';
  sh2(c, limb([[0, -4], [1, 6], [2, 14]], [9.2, 10.4, 7.2]), gl, { lite: true, sd: 5, rim: L.acc, ra: .6, g: 0 });
  line2(c, [[-2, 6], [-2, 13]], '#000', 1, .5); line2(c, [[3, 6], [3, 13]], '#000', 1, .5);
}
function drawBodyBack(c, L) {
  const ac = L.acc, coat = L.coat, trim = L.trim;
  const pants = dark(coat, .38), boot = dark(coat, .62), ro = { rim: ac, ra: .55 };
  // マント
  if (L.cape) {
    const cp = c => {
      c.moveTo(-36, -398); c.bezierCurveTo(-94, -372, -120, -250, -106, -76); c.quadraticCurveTo(-90, -100, -74, -62);
      c.quadraticCurveTo(-54, -100, -36, -78); c.quadraticCurveTo(-18, -56, 2, -92); c.quadraticCurveTo(22, -56, 42, -82);
      c.quadraticCurveTo(58, -100, 74, -58); c.quadraticCurveTo(92, -100, 108, -80); c.bezierCurveTo(124, -250, 94, -372, 36, -398); c.closePath(); };
    sh2(c, cp, dark(trim, .55), { sh: .6, sd: 14, rim: ac, ra: .45 });
    c.save(); c.beginPath(); cp(c); c.clip();
    line2(c, [[-84, -330], [-92, -220], [-84, -110]], shd(trim, .8), 2, .5); line2(c, [[-50, -360], [-58, -240], [-48, -130]], shd(trim, .8), 2, .4);
    line2(c, [[84, -330], [92, -220], [86, -110]], shd(trim, .8), 2, .5); line2(c, [[52, -360], [58, -240], [50, -130]], shd(trim, .8), 2, .4);
    line2(c, [[-100, -90], [-74, -66], [-54, -96]], trim, 2.4, .85); line2(c, [[56, -92], [74, -62], [102, -88]], trim, 2.4, .85);
    { const rg = srand(11); for (let i = 0; i < 12; i++) { const x = (rg() - .5) * 190, y = -340 + rg() * 220; c.fillStyle = rgba(light(trim, .6), .35 + rg() * .35); star4(c, x, y, 1.6 + rg() * 2.4); c.fill(); } }
    c.restore();
  }
  headT(c, () => drawHair(c, L, 'back'));
  // 後ろ腕(垂らす)
  sh2(c, limb([[-44, -390], [-60, -322], [-58, -256]], [16, 13.4, 10.6]), coat, { ...ro, sd: 7 });
  sh2(c, limb([[-59.5, -270], [-58.8, -259]], [11.6, 11.2]), trim, { lite: true, sd: 3, g: 0, hl: 0 });
  c.save(); c.translate(-58, -256); drawHand(c, L); c.restore();
  if (L.w === 'dual') { c.save(); c.translate(-56, -232); c.rotate(1.95); drawWeapon(c, 'dualB', L, false); c.restore(); }
  // 脚
  const leg = (hx, kx, ax) => {
    sh2(c, c => { c.moveTo(hx - 17, -262); c.bezierCurveTo(hx - 19, -214, kx - 16, -184, kx - 13, -150); c.bezierCurveTo(kx - 12, -124, ax - 11, -96, ax - 9.5, -60); c.lineTo(ax + 10, -60); c.bezierCurveTo(ax + 11, -96, kx + 13, -124, kx + 14, -150); c.bezierCurveTo(kx + 16, -184, hx + 19, -214, hx + 17, -262); c.closePath(); }, pants, { ...ro, sd: 8 });
    const bp = c => { c.moveTo(ax - 12.5, -86); c.bezierCurveTo(ax - 14, -66, ax - 14.5, -40, ax - 16, -12); c.quadraticCurveTo(ax - 17, 0, ax - 10, 0); c.lineTo(ax + 27, 0); c.bezierCurveTo(ax + 40, 0, ax + 40, -15, ax + 26, -20); c.bezierCurveTo(ax + 19, -24, ax + 14, -28, ax + 13, -40); c.bezierCurveTo(ax + 12.5, -62, ax + 13, -76, ax + 13.5, -86); c.closePath(); };
    sh2(c, bp, boot, { ...ro, sd: 8, ra: .65 });
    c.save(); c.beginPath(); bp(c); c.clip();
    c.fillStyle = 'rgba(8,4,16,.55)'; c.fillRect(ax - 30, -5, 90, 8);                                   // ソール
    line2(c, [[ax - 8, -76], [ax - 9, -50], [ax - 11, -24]], light(boot, .55), 2, .35);                  // 革のツヤ
    c.restore();
    c.fillStyle = 'rgba(255,255,255,.75)'; star4(c, ax + 20, -11, 3.4); c.fill();
    sh2(c, c => { c.moveTo(ax - 13.4, -90); c.quadraticCurveTo(ax, -86, ax + 14.4, -90); c.lineTo(ax + 14, -78); c.quadraticCurveTo(ax, -74, ax - 13, -78); c.closePath(); }, trim, { lite: true, g: 0, sd: 3, hl: 0 });
  };
  leg(-21, -28, -31); leg(22, 27, 30);
  // コート裾(2枚のパネル + 内側の裏地)
  if (L.skirt !== 0) {
    sh2(c, c => { c.moveTo(-4, -262); c.lineTo(-17, -118); c.quadraticCurveTo(0, -108, 19, -118); c.lineTo(4, -262); c.closePath(); }, dark(coat, .62), { sh: .3, ow: 1.4, g: 0 });
    const lp = c => { c.moveTo(-30, -268); c.bezierCurveTo(-36, -214, -58, -164, -76, -116); c.bezierCurveTo(-58, -102, -34, -104, -16, -118); c.bezierCurveTo(-8, -156, -2, -200, -2, -268); c.closePath(); };
    const rp = c => { c.moveTo(30, -268); c.bezierCurveTo(36, -214, 60, -164, 78, -116); c.bezierCurveTo(60, -102, 36, -104, 18, -118); c.bezierCurveTo(8, -156, 2, -200, 2, -268); c.closePath(); };
    [[lp, -1], [rp, 1]].forEach(([pf, s]) => {
      sh2(c, pf, coat, { ...ro, sd: 14, sh: .55 });
      c.save(); c.beginPath(); pf(c); c.clip();
      line2(c, [[s * 22, -262], [s * 34, -200], [s * 52, -140]], shd(coat, .7), 2.2, .55);
      line2(c, [[s * 12, -262], [s * 18, -200], [s * 28, -140]], shd(coat, .7), 1.8, .4);
      line2(c, [[s * 25 - 3, -262], [s * 37 - 3, -200], [s * 55 - 3, -140]], light(coat, .5), 1.4, .25);
      c.restore();
    });
    line2(c, [[-76, -116], [-60, -103], [-36, -105], [-16, -118]], trim, 3.6, .95); line2(c, [[78, -116], [62, -103], [38, -105], [18, -118]], trim, 3.6, .95);
    line2(c, [[-16, -118], [-8, -156], [-2, -200], [-2, -266]], trim, 1.8, .75); line2(c, [[18, -118], [8, -156], [2, -200], [2, -266]], trim, 1.8, .75);
  }
  if (L.skirt !== 0) { const hl = [[-76, -116], [-58, -102], [-34, -104], [-16, -118]], hr = [[78, -116], [60, -102], [36, -104], [18, -118]]; [hl, hr].forEach(h => { for (let i = 1; i <= 5; i++) { const p = bez(h[0], h[1], h[2], h[3], i / 6); c.fillStyle = rgba(light(trim, .55), .95); c.beginPath(); c.arc(p[0], p[1] + 3.6, 1.6, 0, TAU); c.fill(); } }); }
  // 胴
  const torso = c => { c.moveTo(-40, -402); c.bezierCurveTo(-52, -396, -54, -372, -48, -350); c.bezierCurveTo(-44, -326, -30, -300, -28, -260); c.lineTo(28, -260); c.bezierCurveTo(30, -300, 44, -326, 48, -350); c.bezierCurveTo(54, -372, 52, -396, 40, -402); c.quadraticCurveTo(0, -416, -40, -402); c.closePath(); };
  sh2(c, torso, coat, { ...ro, sd: 12, sh: .55 });
  c.save(); c.beginPath(); torso(c); c.clip();
  line2(c, [[-4, -404], [3, -346], [1, -284]], shd(coat, .8), 2.2, .75);
  line2(c, [[-30, -344], [-24, -316], [-20, -290]], shd(coat, .7), 1.8, .35); line2(c, [[32, -344], [26, -316], [22, -290]], shd(coat, .7), 1.8, .35);
  line2(c, [[-34, -380], [-18, -340], [-14, -300]], light(coat, .45), 1.6, .22);
  [-374, -348, -322].forEach(y => { sh2(c, P.ell(10, y, 3.4, 3.4), trim, { lite: true, g: 0, sd: 2, ow: 1 }); });
  c.restore();
  // 胸のチェーン(左肩→ボタン)と宝石
  { let pp = null; for (let i = 0; i <= 10; i++) { const t = i / 10, x = lerp(-30, 7, t), y = lerp(-398, -338, t) + Math.sin(Math.PI * t) * 13; if (pp) { c.strokeStyle = rgba(trim, .9); c.lineWidth = 1.1; c.beginPath(); c.moveTo(pp[0], pp[1]); c.lineTo(x, y); c.stroke(); } c.fillStyle = rgba(light(trim, .5), .95); c.beginPath(); c.arc(x, y, 1.7, 0, TAU); c.fill(); pp = [x, y]; } bloom(c, 7, -334, 10, ac, .55); sh2(c, c => star4p(c, 7, -333, 5, .35), ac, { lite: true, g: 0, sd: 2, ow: .9, out: trim }); }
  // 灯のエンブレム
  bloom(c, -22, -352, 15, ac, .38);
  sh2(c, P.ell(-22, -352, 7.5, 7.5), dark(coat, .3), { lite: true, g: 0, sd: 2, ow: 1.4, out: trim });
  c.fillStyle = ac; c.beginPath(); c.moveTo(-22, -359); c.quadraticCurveTo(-17.5, -353, -22, -346); c.quadraticCurveTo(-26.5, -353, -22, -359); c.fill();
  c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(-22.5, -351, 1.2, 2, 0, 0, TAU); c.fill();
  // ベルト
  sh2(c, c => { c.moveTo(-31, -284); c.bezierCurveTo(-10, -279, 10, -279, 31, -284); c.lineTo(31, -270); c.bezierCurveTo(10, -265, -10, -265, -31, -270); c.closePath(); }, trim, { lite: true, sd: 4, g: 0 });
  bloom(c, 0, -276, 13, ac, .45);
  sh2(c, P.ell(0, -276, 7, 7), ac, { lite: true, sd: 3, g: 0, rim: '#fff', ra: .5 });
  c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(-1.8, -278, 2, 1.4, -.5, 0, TAU); c.fill();
  lightLayer(c);
  // 首
  const neck = c => { c.moveTo(-10.5, -428); c.lineTo(-10.5, -400); c.quadraticCurveTo(0, -391, 10.5, -400); c.lineTo(10.5, -428); c.closePath(); };
  sh2(c, neck, dark(L.skin, .06), { scol: skinSh(L.skin), out: mixc(L.skin, '#b8626f', .6), hatch: false, sh: .7, sd: 8, g: 0, ow: .9, oa: .7 });
  c.save(); c.beginPath(); neck(c); c.clip(); c.fillStyle = rgba(skinSh(L.skin), .55); c.fillRect(-12, -430, 24, 20); c.restore();
  if (!L.scarf) {
    sh2(c, c => { c.moveTo(-11, -400); c.lineTo(11, -400); c.lineTo(0, -368); c.closePath(); }, '#f6f2ff', { lite: true, g: 0, sd: 3, ow: .9 });
    sh2(c, c => { c.moveTo(-2.6, -394); c.lineTo(2.6, -394); c.lineTo(3.6, -364); c.lineTo(0, -357); c.lineTo(-3.6, -364); c.closePath(); }, L.acc, { lite: true, g: 0, sd: 2, ow: .8 });
  }
  // 襟/スカーフ
  if (L.scarf) {
    sh2(c, c => { c.moveTo(-31, -414); c.bezierCurveTo(-20, -390, 20, -390, 31, -414); c.lineTo(38, -394); c.bezierCurveTo(16, -372, -16, -372, -38, -394); c.closePath(); }, L.scarf, { ...ro, sd: 6 });
    sh2(c, c => { c.moveTo(14, -388); c.bezierCurveTo(26, -392, 38, -390, 42, -386); c.bezierCurveTo(48, -350, 56, -320, 52, -298); c.lineTo(46, -308); c.lineTo(40, -294); c.bezierCurveTo(38, -320, 32, -350, 22, -372); c.closePath(); }, L.scarf, { ...ro, sd: 6 });
    line2(c, [[-24, -392], [0, -384], [24, -392]], shd(L.scarf, .7), 1.6, .5);
  } else {
    [-1, 1].forEach(s => sh2(c, c => { c.moveTo(s * 9, -396); c.quadraticCurveTo(s * 26, -400, s * 40, -406); c.lineTo(s * 33, -428); c.quadraticCurveTo(s * 22, -426, s * 17, -421); c.lineTo(s * 9, -408); c.closePath(); }, dark(coat, .12), { ...ro, sd: 5 }));
    line2(c, [[-38, -407], [-31, -426]], trim, 1.6, .85); line2(c, [[38, -407], [33, -426]], trim, 1.6, .85);
  }
  // 頭(耳・顔)
  headT(c, () => {
    const so = mixc(L.skin, '#b8626f', .6), sk = { scol: skinSh(L.skin), out: so, ow: .9, oa: .7 };
    sh2(c, P.ell(-30.5, -451, 3.8, 7, .1), mixc(L.skin, '#ff9aa8', .12), { ...sk, sh: .5, sd: 3, g: 0, hatch: false });
    sh2(c, P.ell(30.5, -451, 3.8, 7, -.1), mixc(L.skin, '#ff9aa8', .14), { ...sk, sh: .5, sd: 3, g: 0, hatch: false });
    sh2(c, FACE, L.skin, { ...sk, hatch: false, sh: .46, sd: 10, rim: ac, rw: 4, ra: .22, dy: -.9 });
    c.save(); c.beginPath(); FACE(c); c.clip(); bloom(c, 14, -430, 24, '#ff9aa8', .16); bloom(c, -16, -430, 22, '#ff9aa8', .1); bloom(c, 0, -470, 26, '#ffffff', .12); c.restore();
  });
}
function drawPauldron(c, L, s) {
  const pp = c => { c.moveTo(s * 30, -410); c.bezierCurveTo(s * 52, -419, s * 80, -409, s * 85, -382); c.bezierCurveTo(s * 87, -362, s * 77, -349, s * 64, -347); c.bezierCurveTo(s * 52, -362, s * 40, -374, s * 30, -380); c.closePath(); };
  const col = dark(L.coat, .1);
  sh2(c, pp, col, { rim: L.acc, ra: .7, sd: 9, sh: .55 });
  c.save(); c.beginPath(); pp(c); c.clip();
  line2(c, [[s * 34, -400], [s * 62, -402], [s * 80, -386]], L.trim, 2.6, .95);
  line2(c, [[s * 36, -386], [s * 56, -384], [s * 70, -366]], shd(col, .8), 1.8, .5);
  glossArc(c, [[s * 40, -408], [s * 60, -410], [s * 76, -400]], light(col, .5), 4, .4);
  c.restore();
  bloom(c, s * 68, -380, 10, L.acc, .55);
  sh2(c, P.ell(s * 68, -380, 3.2, 3.2), L.acc, { lite: true, g: 0, sd: 2, ow: 1.1 });
}
function drawBodyFront(c, L) {
  headT(c, () => {
    drawHair(c, L, 'front');
    if (L.hood) drawHood(c, L);
    drawHat(c, L);
  });
  drawPauldron(c, L, -1);
}

/* ---------- 武器(ローカル座標: 手元が原点、+x が先端) ---------- */
function steel(c, x0, x1) { const g = c.createLinearGradient(x0, -10, x1, 10); g.addColorStop(0, '#dfe6f2'); g.addColorStop(.5, '#aab4c8'); g.addColorStop(1, '#6a7490'); return g; }
/* gl=true: 輝き(エッジ発光)のみ描く */
function drawWeapon(c, type, L, gl) {
  const ac = L.acc, gold = '#cdaa52', goldH = '#fff0b0', INK = '#1c1830';
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  const body = f => { if (!gl) f(); };
  const edge = pf => { if (gl) { c.save(); c.shadowColor = ac; c.shadowBlur = 16; c.strokeStyle = rgba(ac, .95); c.lineWidth = 2.4; c.beginPath(); pf(c); c.stroke(); c.shadowBlur = 0; c.strokeStyle = rgba(light(ac, .65), .9); c.lineWidth = 1; c.beginPath(); pf(c); c.stroke(); c.restore(); } };
  const grip = (a, b, w) => body(() => {
    const lp = limb([[a, 0], [b, 0]], [w, w]);
    sh2(c, lp, dark(L.coat, .45), { g: 0, sh: .6, sd: 3, ow: 1.8, hl: .1 });
    c.save(); c.beginPath(); lp(c); c.clip(); c.strokeStyle = rgba(light(dark(L.coat, .45), .35), .55); c.lineWidth = 1.2;
    for (let x = a + 4; x < b; x += 6) { c.beginPath(); c.moveTo(x, -w); c.lineTo(x + 3, w); c.stroke(); } c.restore();
  });
  const pommel = (x, r) => body(() => sh2(c, P.ell(x, 0, r, r), gold, { g: 0, sh: .5, sd: 3, rim: goldH, rw: 1.8, ow: 1.8 }));
  const metal = (pf, col) => body(() => sh2(c, pf, col || '#8e97ad', { g: 0, sh: .55, sd: 7, rim: '#e8f0ff', rw: 2.4, ra: .7, ow: 2.2 }));
  const goldP = pf => body(() => sh2(c, pf, gold, { g: 0, sh: .5, sd: 4, rim: goldH, rw: 2, ra: .8, ow: 1.8 }));
  const blade = (pf, x0, x1, o) => {
    o = o || {};
    body(() => {
      c.beginPath(); pf(c); c.fillStyle = '#aab4c8'; c.fill();
      c.save(); c.clip();
      let g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#98a2ba'); g.addColorStop(.45, '#e6ecf8'); g.addColorStop(1, '#8e98b2');
      c.fillStyle = g; c.fillRect(x0 - 6, -70, x1 - x0 + 12, 140);
      c.fillStyle = 'rgba(255,255,255,.34)'; c.fillRect(x0 - 6, -70, x1 - x0 + 12, 70);
      c.fillStyle = 'rgba(28,40,86,.42)'; c.fillRect(x0 - 6, 0, x1 - x0 + 12, 70);
      if (o.fuller) { c.strokeStyle = 'rgba(40,52,90,.4)'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(o.fuller[0], 3); c.lineTo(o.fuller[1], 3); c.stroke(); }
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x1, 0); c.stroke();
      c.restore();
      c.strokeStyle = INK; c.lineWidth = o.ow || 2; c.beginPath(); pf(c); c.stroke();
    });
    edge(pf);
  };
  switch (type) {
    case 'greatsword': {
      grip(-36, 16, 4.6); pommel(-40, 6.5);
      goldP(c => { c.moveTo(10, -30); c.quadraticCurveTo(25, -33, 25, -9); c.lineTo(25, 9); c.quadraticCurveTo(25, 33, 10, 30); c.quadraticCurveTo(18, 0, 10, -30); c.closePath(); });
      body(() => sh2(c, P.ell(18, 0, 3.4, 3.4), ac, { g: 0, sh: .3, ow: 1.2 }));
      blade(c => { c.moveTo(25, -13); c.lineTo(148, -17); c.quadraticCurveTo(178, -12, 196, 0); c.quadraticCurveTo(178, 12, 148, 17); c.lineTo(25, 13); c.closePath(); }, 25, 196, { fuller: [40, 150] });
      break; }
    case 'rapier': {
      grip(-26, 12, 3.6); pommel(-30, 5);
      goldP(c => { c.moveTo(8, -24); c.quadraticCurveTo(36, -29, 36, 0); c.quadraticCurveTo(36, 29, 8, 24); c.quadraticCurveTo(17, 0, 8, -24); c.closePath(); });
      blade(c => { c.moveTo(14, -3.6); c.lineTo(192, -1.4); c.lineTo(208, 0); c.lineTo(192, 1.4); c.lineTo(14, 3.6); c.closePath(); }, 14, 208, { ow: 1.6 });
      break; }
    case 'hammer': {
      grip(-30, 126, 5);
      const hd = P.rr(116, -36, 64, 72, 8);
      metal(hd);
      body(() => { sh2(c, P.rr(116, -36, 10, 72, 3), L.trim, { g: 0, sh: .4, sd: 3, ow: 1.6 }); sh2(c, P.rr(170, -36, 10, 72, 3), L.trim, { g: 0, sh: .4, sd: 3, ow: 1.6 }); sh2(c, P.ell(148, 0, 10, 10), dark(L.coat, .3), { g: 0, sh: .4, sd: 3, ow: 1.6, out: ac }); sh2(c, P.ell(148, 0, 4.4, 4.4), ac, { g: 0, sh: .2, ow: 1 }); });
      edge(hd);
      break; }
    case 'cleaver': {
      grip(-26, 26, 4.5); pommel(-30, 5.4);
      blade(c => { c.moveTo(26, -26); c.lineTo(106, -30); c.quadraticCurveTo(122, 0, 106, 38); c.lineTo(26, 12); c.closePath(); }, 26, 122);
      body(() => { c.fillStyle = '#1b1624'; c.beginPath(); c.arc(46, -8, 5.5, 0, TAU); c.fill(); });
      break; }
    case 'flail': {
      grip(-26, 60, 5); pommel(-30, 6);
      body(() => {
        c.strokeStyle = '#1c1830'; c.lineWidth = 4.4; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(66 + i * 15, Math.sin((i + 1) * 1.4) * 7, 7.6, 3.8, i % 2 ? .3 : -.3, 0, TAU); c.stroke(); }
        c.strokeStyle = '#a3abc0'; c.lineWidth = 2.2; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(66 + i * 15, Math.sin((i + 1) * 1.4) * 7, 7.6, 3.8, i % 2 ? .3 : -.3, 0, TAU); c.stroke(); }
        c.save(); c.translate(164, 4);
        for (let i = 0; i < 8; i++) { const a = i * TAU / 8; sh2(c, P.poly([[Math.cos(a - .24) * 18, Math.sin(a - .24) * 18], [Math.cos(a) * 33, Math.sin(a) * 33], [Math.cos(a + .24) * 18, Math.sin(a + .24) * 18]]), '#e8d9a0', { g: 0, sh: .4, sd: 3, ow: 1.5 }); }
        sh2(c, P.ell(0, 0, 21, 21), gold, { g: 0, sh: .55, sd: 9, rim: goldH, rw: 2.6, ow: 2.2 });
        c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-7, -8, 5, 3.2, -.6, 0, TAU); c.fill();
        c.restore();
      });
      if (gl) edge(c => { c.arc(164, 4, 33, 0, TAU); });
      break; }
    case 'spear': {
      grip(-44, 190, 3.8); pommel(-48, 5);
      body(() => { const tg = c.createLinearGradient(140, 0, 180, 0); tg.addColorStop(0, rgba(ac, .15)); tg.addColorStop(1, rgba(ac, .95)); c.fillStyle = tg; c.beginPath(); c.moveTo(172, 0); c.bezierCurveTo(166, -14, 150, -24, 128, -26); c.bezierCurveTo(138, -14, 134, -6, 122, 2); c.bezierCurveTo(140, 0, 156, 8, 172, 4); c.closePath(); c.fill(); });
      body(() => sh2(c, P.poly([[174, -9], [190, -15], [190, 15], [174, 9]]), L.trim, { g: 0, sh: .4, sd: 3, ow: 1.8 }));
      blade(c => { c.moveTo(188, -12); c.quadraticCurveTo(224, -17, 262, 0); c.quadraticCurveTo(224, 17, 188, 12); c.closePath(); }, 188, 262, { ow: 2 });
      break; }
    case 'dual': {
      grip(-16, 12, 3.6); pommel(-20, 4.6);
      goldP(P.poly([[6, -17], [15, -17], [15, 17], [6, 17]]));
      blade(c => { c.moveTo(15, -9); c.lineTo(84, -12); c.lineTo(114, 0); c.lineTo(84, 10); c.lineTo(15, 9); c.closePath(); }, 15, 114);
      break; }
    case 'dualB': {
      blade(c => { c.moveTo(6, -8); c.lineTo(76, -10); c.lineTo(102, 0); c.lineTo(76, 8); c.lineTo(6, 8); c.closePath(); }, 6, 102);
      break; }
    case 'gauntlet': {
      const gp = c => { c.moveTo(-8, -22); c.lineTo(34, -27); c.quadraticCurveTo(58, -21, 60, 0); c.quadraticCurveTo(58, 22, 34, 27); c.lineTo(-8, 22); c.closePath(); };
      metal(gp, '#505a74');
      body(() => {
        [-1, 0, 1].forEach(i => sh2(c, P.poly([[52, i * 12 - 5], [78, i * 12], [52, i * 12 + 5]]), '#dfe6f2', { g: 0, sh: .4, sd: 2, ow: 1.5 }));
        for (let i = 0; i < 3; i++) sh2(c, P.ell(44, -12 + i * 12, 4, 4), gold, { g: 0, sh: .4, sd: 2, ow: 1.3, rim: goldH, rw: 1 });
        sh2(c, P.rr(2, -23, 8, 46, 3), L.trim, { g: 0, sh: .4, sd: 3, ow: 1.5 });
      });
      edge(gp);
      break; }
    case 'fan': {
      const fab = c => { c.moveTo(0, 0); c.arc(0, 0, 108, -.7, .7); c.closePath(); };
      body(() => {
        c.strokeStyle = '#3a2430'; c.lineWidth = 3.4; for (let i = 0; i < 6; i++) { const a = -.7 + i * 1.4 / 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 110, Math.sin(a) * 110); c.stroke(); }
        sh2(c, fab, L.trim, { g: 0, sh: .4, sd: 8, rim: ac, ra: .5, ow: 2.2 });
        c.save(); c.beginPath(); fab(c); c.clip();
        const rg = c.createRadialGradient(0, 0, 10, 0, 0, 108); rg.addColorStop(0, rgba(ac, .05)); rg.addColorStop(1, rgba(ac, .55)); c.fillStyle = rg; c.fillRect(0, -110, 120, 220);
        c.strokeStyle = 'rgba(60,30,50,.55)'; c.lineWidth = 1.4; for (let i = 0; i < 6; i++) { const a = -.7 + i * 1.4 / 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 110, Math.sin(a) * 110); c.stroke(); }
        c.fillStyle = rgba(ac, .6); for (let i = 0; i < 5; i++) { const a = -.5 + i * .25; c.beginPath(); c.arc(Math.cos(a) * 76, Math.sin(a) * 76, 6.6 - i % 2 * 2, 0, TAU); c.fill(); }
        c.restore();
        c.strokeStyle = '#d8c07a'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 108, -.7, .7); c.stroke();
        sh2(c, P.ell(0, 0, 5.5, 5.5), gold, { g: 0, sh: .4, sd: 2, ow: 1.5 });
      });
      edge(c => { c.arc(0, 0, 108, -.7, .7); });
      break; }
    case 'scalpel': {
      grip(-30, 54, 3.4);
      body(() => sh2(c, P.rr(44, -5.4, 12, 10.8, 3), gold, { g: 0, sh: .4, sd: 2, ow: 1.5 }));
      blade(c => { c.moveTo(56, -4.6); c.quadraticCurveTo(100, -9, 122, 2); c.quadraticCurveTo(100, 7, 56, 4.6); c.closePath(); }, 56, 122, { ow: 1.7 });
      break; }
    case 'dagger': {
      grip(-14, 8, 3.4); pommel(-18, 4.4);
      goldP(P.poly([[4, -15], [12, -15], [12, 15], [4, 15]]));
      blade(c => { c.moveTo(12, -8); c.lineTo(58, -8); c.lineTo(86, 0); c.lineTo(58, 8); c.lineTo(12, 8); c.closePath(); }, 12, 86);
      break; }
    case 'mace': {
      grip(-30, 100, 5); pommel(-34, 6.4);
      body(() => {
        for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + .3; sh2(c, P.poly([[122 + Math.cos(a - .3) * 24, Math.sin(a - .3) * 24], [122 + Math.cos(a) * 42, Math.sin(a) * 42], [122 + Math.cos(a + .3) * 24, Math.sin(a + .3) * 24]]), '#c8d0e8', { g: 0, sh: .4, sd: 3, ow: 1.6 }); }
        sh2(c, P.ell(122, 0, 27, 27), '#8e97ad', { g: 0, sh: .55, sd: 10, rim: '#e8f0ff', rw: 2.6, ow: 2.2 });
        c.strokeStyle = rgba(L.trim, .9); c.lineWidth = 3; c.beginPath(); c.ellipse(122, 0, 27, 9, 0, 0, TAU); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(112, -10, 6, 3.6, -.6, 0, TAU); c.fill();
      });
      edge(c => { c.arc(122, 0, 27, 0, TAU); });
      break; }
  }
  c.restore();
}
/* 武器腕(動的): 肩 S から手 H への2関節腕 + 武器。ang: 武器の向き(rad) */
function drawWeaponArm(c, L, hx, hy, ang, glow, wp) {
  const sx = 46, sy = -388, up = 64, fo = 62;
  let dx = hx - sx, dy = hy - sy, d = Math.hypot(dx, dy); const max = up + fo - 2; if (d > max) { dx *= max / d; dy *= max / d; hx = sx + dx; hy = sy + dy; d = max; }
  const a = (up * up + d * d - fo * fo) / (2 * up * d), base = Math.atan2(dy, dx), off = Math.acos(clamp(a, -1, 1));
  const ex = sx + Math.cos(base + off) * up, ey = sy + Math.sin(base + off) * up;
  const glove = L.glove || '#16131c';
  c.save();
  // 武器(手の後ろ)
  const wdraw = () => { c.save(); c.translate(hx, hy); c.rotate(ang); blit(c, wp.main); { const ga = Math.max(glow, .32); c.globalAlpha = Math.min(1, ga); blit(c, wp.glow); if (glow > 1) { c.globalAlpha = Math.min(1, glow - 1); blit(c, wp.glow); } } c.restore(); };
  if (L.w !== 'gauntlet') wdraw();
  // 袖(上腕〜前腕を滑らかに)
  sh2(c, limb([[sx, sy], [ex, ey], [hx, hy]], [16, 13.2, 10.6]), L.coat, { rim: L.acc, ra: .55, lite: true, sd: 7, sh: .55 });
  // カフス
  const q = (t) => [lerp(ex, hx, t), lerp(ey, hy, t)];
  sh2(c, limb([q(.64), q(.8)], [11.4, 11]), L.trim, { lite: true, g: 0, sd: 3, hl: 0 });
  // 手
  if (L.w === 'gauntlet') wdraw();
  else {
    c.save(); c.translate(hx, hy); c.rotate(ang);
    sh2(c, P.rr(-9.5, -10.5, 19, 21, 8), glove, { lite: true, sd: 5, rim: L.acc, ra: .6, g: 0 });
    line2(c, [[-3, -9], [-3, 9]], '#000', 1.1, .5); line2(c, [[3, -9], [3, 9]], '#000', 1.1, .5);
    sh2(c, P.ell(-2, -10.4, 6.4, 3.6, -.15), glove, { lite: true, sd: 2, g: 0, rim: L.acc, ra: .5 });
    c.restore();
  }
  c.restore();
}

/* ---------- スプライト(事前描画・超解像) ---------- */
const SPR = {};
function bake(h, bx0, by0, bx1, by1, fn) {
  const x0 = bx0 * h, y0 = by0 * h, w = (bx1 - bx0) * h, hh = (by1 - by0) * h;
  const cv = mkCanvas(Math.ceil(w * SS), Math.ceil(hh * SS)), c = cv.getContext('2d');
  c.scale(SS, SS); c.translate(-x0, -y0); c.scale(h, h); fn(c);
  return trim({ cv, x: x0, y: y0, w: cv.width / SS, h: cv.height / SS });
}
/* 透明余白を切り詰めてメモリを節約(論理座標は維持) */
function trim(s) {
  const cv = s.cv, w = cv.width, h = cv.height;
  let d; try { d = cv.getContext('2d').getImageData(0, 0, w, h).data; } catch (e) { return s; }
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) { const r = y * w * 4 + 3; for (let x = 0; x < w; x++) if (d[r + x * 4] > 4) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; } }
  if (x1 < 0) return s;
  x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(w - 1, x1 + 2); y1 = Math.min(h - 1, y1 + 2);
  const nw = x1 - x0 + 1, nh = y1 - y0 + 1; if (nw * nh > w * h * .92) return s;
  const n = mkCanvas(nw, nh); n.getContext('2d').drawImage(cv, -x0, -y0);
  return { cv: n, x: s.x + x0 / SS, y: s.y + y0 / SS, w: nw / SS, h: nh / SS };
}
function blit(c, s) { c.drawImage(s.cv, s.x, s.y, s.w, s.h); }
/* 外周のアクセント色グロー(シルエットの背後にぼかしを敷く) */
function addGlow(s, col, blur, a) {
  const pad = Math.ceil(blur * SS * 1.6), n = mkCanvas(s.cv.width + pad * 2, s.cv.height + pad * 2), c = n.getContext('2d');
  c.shadowColor = rgba(col, a); c.shadowBlur = blur * SS; c.drawImage(s.cv, pad, pad);
  c.shadowBlur = blur * SS * .5; c.drawImage(s.cv, pad, pad);
  c.shadowBlur = 0; c.shadowColor = 'transparent'; c.drawImage(s.cv, pad, pad);
  return { cv: n, x: s.x - pad / SS, y: s.y - pad / SS, w: n.width / SS, h: n.height / SS };
}
function sinnerSprite(look, key) {
  if (SPR[key]) return SPR[key];
  const h = look.h || 1;
  const wmk = (gl) => { const cv = mkCanvas(Math.ceil(370 * SS), Math.ceil(160 * SS)), c = cv.getContext('2d'); c.scale(SS, SS); c.translate(70, 80); drawWeapon(c, look.w, look, gl); return trim({ cv, x: -70, y: -80, w: cv.width / SS, h: cv.height / SS }); };
  return SPR[key] = {
    back: addGlow(bake(h, -160, -720, 160, 12, c => drawBodyBack(c, look)), mixc(look.acc, '#c4e4ff', .55), 14, .5),
    front: bake(h, -130, -735, 130, -320, c => drawBodyFront(c, look)),
    pauld: bake(h, 20, -430, 100, -330, c => drawPauldron(c, look, 1)),
    wp: { main: wmk(false), glow: wmk(true) }
  };
}
/* 攻撃ポーズ: p=0..1 でアイドル→振りかぶり→打撃→余韻 */
const POSES = {
  idle: (t) => ({ hx: 78 + Math.sin(t * 1.6) * 2, hy: -300 + Math.sin(t * 1.6) * 2, ang: -1.05 + Math.sin(t * 1.6) * .03 }),
  wind: { hx: 12, hy: -468, ang: -2.35 },
  strike: { hx: 128, hy: -330, ang: .35 },
  follow: { hx: 106, hy: -240, ang: 1.05 },
  guard: { hx: 70, hy: -392, ang: -1.45 },
  hurt: { hx: 40, hy: -270, ang: -.2 }
};
function poseLerp(a, b, t) { return { hx: lerp(a.hx, b.hx, t), hy: lerp(a.hy, b.hy, t), ang: lerp(a.ang, b.ang, t) }; }
/* きらめき(時間でまたたく星)と、ゆっくり漂う透明な結晶 */
const SHARDS = [[-76, -470, 14, .3, 0], [90, -424, 18, .9, 1.3], [-98, -334, 11, 2.1, 2.1], [98, -250, 15, 1.4, 3.2], [-64, -196, 10, .2, 4.1]];
function twinkle(c, L, t, h) {
  c.save(); c.scale(h, h);
  const tint = mixc(L.acc, '#a8d4ff', .6);
  SHARDS.forEach(([x, y, r, rot, ph]) => {
    c.save(); c.translate(x, y + Math.sin(t * .9 + ph) * 4); c.rotate(rot + Math.sin(t * .5 + ph) * .15);
    const g = c.createLinearGradient(-r, -r, r, r); g.addColorStop(0, 'rgba(240,250,255,.66)'); g.addColorStop(.5, rgba(tint, .26)); g.addColorStop(1, 'rgba(225,242,255,.5)');
    c.beginPath(); c.moveTo(0, -r); c.lineTo(r * .42, -r * .2); c.lineTo(r * .34, r * .7); c.lineTo(0, r); c.lineTo(-r * .4, r * .5); c.lineTo(-r * .36, -r * .3); c.closePath();
    c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = .9; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.moveTo(0, -r); c.lineTo(.5, r); c.moveTo(-r * .36, -r * .3); c.lineTo(r * .42, -r * .2); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(0, -r); c.lineTo(r * .42, -r * .2); c.lineTo(0, -r * .05); c.closePath(); c.fill();
    c.restore();
  });
  [[-70, -548, 0], [82, -506, 1.7], [-92, -392, 3.1], [98, -338, 4.4], [-40, -290, 5.2], [60, -180, 2.6]].forEach(p => {
    const k = Math.max(0, Math.sin(t * 1.9 + p[2])), a = k * k * k; if (a < .06) return;
    sparkle(c, p[0], p[1] - k * 6, 2.5 + 5.5 * a, light(L.acc, .55), .95 * a);
  });
  c.restore();
}
const OFFW = 520, OFFH = 714, OFFO = [190, 700];
/* 描画: x,y は足元。scale・向き(facing=1 右向き)。state: {t, pose:{...}, expr, kneel, alpha, flash, tint} */
function drawSinner(ctx, look, key, x, y, scale, facing, st) {
  if (look.img) return drawImgSinner(ctx, look, key, x, y, scale, facing, st);
  const sp = sinnerSprite(look, key), h = look.h || 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * scale * (st.sx || 1), scale * (st.sy || 1));
  if (st.rot) { const pv = -(st.pv || 0); ctx.translate(0, pv); ctx.rotate(st.rot); ctx.translate(0, -pv); }   // pv: 回転中心の高さ(宙返り用)
  if (st.alpha != null) ctx.globalAlpha = st.alpha;
  const t = st.t || 0, expr = st.expr || 'n', blink = Math.sin(t * .9) > .985;
  const draw = (cc) => {
    cc.imageSmoothingEnabled = true; cc.imageSmoothingQuality = 'high';
    blit(cc, sp.back);
    if (expr === 'panic') { cc.save(); cc.scale(h, h); headT(cc, () => faceArt(cc, look, 'panic', t, false)); cc.restore(); }
    else blit(cc, faceSprite(look, key, expr, blink && (expr === 'n' || expr === 'atk')));
    blit(cc, sp.front);
    cc.save(); cc.globalAlpha *= .82;
    if (expr === 'panic') { cc.scale(h, h); headT(cc, () => faceArt(cc, look, 'panic', t, false, 'brow')); } else blit(cc, faceSprite(look, key, expr, false, 'brow'));
    cc.restore();
    const p = st.pose || POSES.idle(t);
    cc.save(); cc.scale(h, h); drawWeaponArm(cc, look, p.hx, p.hy, p.ang, st.glow || 0, sp.wp); cc.restore();
    blit(cc, sp.pauld);
    twinkle(cc, look, t, h);
  };
  if (st.flash || st.tint) {
    const off = SPR._off || (SPR._off = mkCanvas(OFFW, OFFH)), oc = off.getContext('2d');
    oc.setTransform(1, 0, 0, 1, 0, 0); oc.clearRect(0, 0, OFFW, OFFH); oc.translate(OFFO[0], OFFO[1]);
    draw(oc);
    oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalCompositeOperation = 'source-atop';
    if (st.tint) { oc.fillStyle = st.tint; oc.fillRect(0, 0, OFFW, OFFH); }
    if (st.flash) { oc.fillStyle = `rgba(255,255,255,${st.flash})`; oc.fillRect(0, 0, OFFW, OFFH); }
    oc.globalCompositeOperation = 'source-over';
    ctx.drawImage(off, -OFFO[0], -OFFO[1]);
  } else draw(ctx);
  ctx.restore();
}
/* 武器軌跡用の手先位置(足元基準・ワールド) */
function weaponTip(look, pose, x, y, scale, facing) {
  if (look.img) return weaponTipImg(look, pose, x, y, scale, facing);
  const h = look.h || 1;
  const len = { greatsword: 196, rapier: 208, hammer: 180, cleaver: 122, flail: 197, spear: 262, dual: 114, gauntlet: 78, fan: 108, scalpel: 122, dagger: 86, mace: 164 }[look.w] || 120;
  const hx = pose.hx * h, hy = pose.hy * h, ax = hx + Math.cos(pose.ang) * len * h, ay = hy + Math.sin(pose.ang) * len * h;
  return { hand: [x + facing * hx * scale, y + hy * scale], tip: [x + facing * ax * scale, y + ay * scale] };
}

/* ---------- 肖像(UI用) ---------- */
const PORT = {};
function portrait(look, key, w, h, mode, expr) {
  const k = key + ':' + w + 'x' + h + ':' + (mode || 'bust') + ':' + (expr || '');
  if (look.img) { if (PORT[k]) return PORT[k]; const cv = portraitImg(look, key, w, h, mode, expr); if (cv._ok) PORT[k] = cv; return cv; }
  if (PORT[k]) return PORT[k];
  const cv = mkCanvas(w, h), c = cv.getContext('2d');
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  const sp = sinnerSprite(look, key), hh = look.h || 1, fs = faceSprite(look, key, 'n', false), fb = faceSprite(look, key, 'n', false, 'brow'), brw = () => { c.save(); c.globalAlpha = .82; blit(c, fb); c.restore(); };
  c.save();
  if (mode === 'full') {
    const s = Math.min(w / 400, h / 640); c.translate(w / 2, h - 6); c.scale(s, s);
    blit(c, sp.back); blit(c, fs); blit(c, sp.front); brw();
    c.save(); c.scale(hh, hh); const p = POSES.idle(0); drawWeaponArm(c, look, p.hx, p.hy, p.ang, 0, sp.wp); c.restore(); blit(c, sp.pauld);
  } else {
    const s = mode === 'face' ? w / 168 : w / 215;
    c.translate(w / 2, h * (mode === 'face' ? .57 : .60)); c.scale(s, s); c.translate(0, 466 * hh);
    blit(c, sp.back); blit(c, fs); blit(c, sp.front); brw(); blit(c, sp.pauld);
  }
  c.restore();
  return PORT[k] = cv;
}

/* 起動後にアイドル時間でキャラを順に事前描画(名簿を開いた時のカクつき防止) */
if (typeof window !== 'undefined') setTimeout(function () {
  try { const ks = Object.keys(SINNERS); let i = 0; (function step() { if (i >= ks.length) return; const k = ks[i++], sn = SINNERS[k]; if (sn.look.img) return step(); try { sinnerSprite(sn.look, k); faceSprite(sn.look, k, 'n', false); faceSprite(sn.look, k, 'n', false, 'brow'); } catch (e) {} setTimeout(step, 90); })(); } catch (e) {}
}, 1500);
