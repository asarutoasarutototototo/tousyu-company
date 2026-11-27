/* ============================================================
   画像キャラ(立ち絵・モーションを画像そのままで使うキャラ)
   F[フレーム名] = [キャラ身長(コマpx・立ち換算), アンカーx, アンカーy(足元)]  'c' = コマ中央
   ============================================================ */
const IMGCH = {
  rei: {
    F: {
      stand: [366, 192, 454],
      i2: [232, 'c', 275], i3: [232, 'c', 275], i4: [232, 'c', 275], i5: [232, 'c', 275], i6: [232, 'c', 275], i7: [232, 'c', 275], i8: [232, 'c', 275],
      lunge: [150, 'c', 178], dash: [150, 'c', 178], ring: [150, 'c', 178], crystal: [150, 'c', 178],
      slashA: [120, 'c', 205], slashB: [120, 'c', 205], erupt: [120, 'c', 205], vortex: [120, 'c', 205], shadow: [120, 'c', 205], burst: [120, 'c', 205], pillar: [120, 'c', 205],
      hit1: [215, 'c', 228], hit2: [215, 'c', 228], stag: [215, 'c', 228], crawl: [215, 'c', 228], dead: [215, 'c', 228], panic: [215, 'c', 228],
      crouch: [350, 'c', 455], arc: [350, 'c', 455], sit: [350, 'c', 455], vortex2: [350, 'c', 455]
    },
    FACE: { n: 'f_n', shout: 'f_shout', think: 'f_think', closed: 'f_closed', smile: 'f_smile' }
  },
  kuro: {
    F: {
      stand: [228, 140, 232],
      hit: [150, 'c', 228], evade: [150, 'c', 228], guard: [150, 'c', 228], counter1: [150, 'c', 228], counter2: [150, 'c', 228],
      s1_1: [125, 'c', 192], s1_2: [125, 'c', 192], s2_1: [125, 'c', 192], s2_2: [125, 'c', 192], s2_3: [125, 'c', 192],
      s3_1: [115, 'c', 195], s3_2: [115, 'c', 195], s3_3: [115, 'c', 195], s3_4: [115, 'c', 195],
      stag: [200, 'c', 196], dead: [170, 'c', 196], panic: [240, 'c', 214]
    },
    FACE: { n: 'f_n', smile: 'f_smile', angry: 'f_angry', sad: 'f_sad', void: 'f_void', mad: 'f_mad' }
  }
};
/* 零: 追加シート(n_*)は立ち絵と同スケール(人物高さ約214px)で自動配置。背景は切り抜き済み */
Object.keys(IMGMETA.rei).forEach(id => { if (id.startsWith('n_')) IMGCH.rei.F[id] = [214, 'c', IMGMETA.rei[id].h - 6]; });
/* 新規5人: コマ寸法から自動で配置(キャラ身長=コマ高×r、足元=コマ下端-m) */
(function () {
  const A = { ren: [.88, 14], aka: [.88, 8], rai: [.95, 6], tetsu: [.92, 8], nagi: [.92, 8] };
  const FACE = {
    ren: { n: 'f_n' }, tetsu: { n: 'f_n' }, nagi: { n: 'f_n' },
    aka: { n: 'f_n', sad: 'f_b', shout: 'f_c', closed: 'f_d', void: 'f_e' },
    rai: { n: 'f_n', mad: 'f_a', smile: 'f_b', angry: 'f_c', shout: 'f_d', closed: 'f_e' }
  };
  Object.keys(A).forEach(ch => {
    const F = {}; Object.keys(IMGMETA[ch]).forEach(id => { if (id.startsWith('f_')) return; const m = IMGMETA[ch][id]; F[id] = [m.h * A[ch][0], 'c', m.h - A[ch][1]]; });
    IMGCH[ch] = { F, FACE: FACE[ch] };
  });
})();
IMGCH.mina = { F: {}, FACE: { n: 'f_n', smoke: 'f_a', calm: 'f_b' } };
const IMGC = {};
function imgGet(ch, id) {
  const k = ch + '_' + id; let o = IMGC[k];
  if (!o) { const src = IMGDATA[ch] && IMGDATA[ch][id]; if (!src) return null; o = IMGC[k] = new Image(); o.src = src; }
  return o.complete && o.naturalWidth ? o : null;
}
function imgPreload() { Object.keys(IMGDATA).forEach(ch => Object.keys(IMGDATA[ch]).forEach(id => imgGet(ch, id))); }
function imgSpec(ch, id) {
  const D = IMGCH[ch], f = D.F[id], m = IMGMETA[ch][id]; if (!f || !m) return null;
  return { w: m.w, h: m.h, ch: f[0], ax: f[1] === 'c' ? m.w / 2 : f[1], ay: f[2] };
}
let IMG_OFF = null;
/* st: {fr, t, alpha, flash, tint, sx, sy, rot, pv, glow, ox, oy, z} */
function drawImgSinner(ctx, look, key, x, y, sc, facing, st) {
  const ch = look.img, fid = (st && st.fr) || 'stand';
  let sp = imgSpec(ch, fid), im = sp && imgGet(ch, fid);
  if (!im) { sp = imgSpec(ch, 'stand'); im = imgGet(ch, 'stand'); if (!im) return; }
  const H = 600 * sc * (look.h || 1) * (st.z || 1), k = H / sp.ch;
  let sx = st.sx || 1, sy = st.sy || 1;
  if (fid === 'stand') { const b = Math.sin((st.t || 0) * 1.7) * .008; sy *= 1 + b; sx *= 1 - b * .6; }
  ctx.save();
  ctx.translate(x + (st.ox || 0) * sc, y + (st.oy || 0) * sc);
  ctx.scale(facing * sx, sy);
  if (st.rot) { const pv = -(st.pv || 0) * sc * 1.6; ctx.translate(0, pv); ctx.rotate(st.rot); ctx.translate(0, -pv); }
  if (st.alpha != null) ctx.globalAlpha *= st.alpha;
  ctx.scale(k, k);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (st.flash || st.tint) {
    const nw = im.naturalWidth, nh = im.naturalHeight;
    if (!IMG_OFF || IMG_OFF.width < nw || IMG_OFF.height < nh) IMG_OFF = mkCanvas(Math.max(nw, IMG_OFF ? IMG_OFF.width : 0), Math.max(nh, IMG_OFF ? IMG_OFF.height : 0));
    const oc = IMG_OFF.getContext('2d'); oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalCompositeOperation = 'source-over'; oc.clearRect(0, 0, IMG_OFF.width, IMG_OFF.height);
    oc.drawImage(im, 0, 0); oc.globalCompositeOperation = 'source-atop';
    if (st.tint) { oc.fillStyle = st.tint; oc.fillRect(0, 0, nw, nh); }
    if (st.flash) { oc.fillStyle = `rgba(255,255,255,${st.flash})`; oc.fillRect(0, 0, nw, nh); }
    ctx.drawImage(IMG_OFF, 0, 0, nw, nh, -sp.ax, -sp.ay, sp.w, sp.h);
  } else {
    ctx.drawImage(im, -sp.ax, -sp.ay, sp.w, sp.h);
    if (st.glow) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= Math.min(.5, st.glow * .3); ctx.drawImage(im, -sp.ax, -sp.ay, sp.w, sp.h); }
  }
  ctx.restore();
}
function weaponTipImg(look, pose, x, y, scale, facing) {
  return { hand: [x + facing * 50 * scale, y - 190 * scale], tip: [x + facing * 220 * scale, y - 200 * scale] };
}
/* 肖像: mode full=全身, bust=バストアップ, face=顔  expr=表情キー */
function portraitImg(look, key, w, h, mode, expr) {
  const ch = look.img, D = IMGCH[ch], cv = mkCanvas(w, h), c = cv.getContext('2d');
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  if (mode === 'full') {
    const sp = imgSpec(ch, 'stand'), im = imgGet(ch, 'stand'); if (!im) return cv; cv._ok = 1;
    const s = (h - 10) / sp.ch; c.translate(w / 2, h - 6); c.scale(s, s); c.drawImage(im, -sp.ax, -sp.ay, sp.w, sp.h);
  } else {
    const id = D.FACE[expr || 'n'] || D.FACE.n, im = imgGet(ch, id), m = IMGMETA[ch][id]; if (!im) return cv; cv._ok = 1;
    const wantA = w / h; let sw = m.w, sh = m.h, sx = 0, sy = 0;
    const vis = mode === 'face' ? .78 : 1;
    if (sw / (sh * vis) > wantA) { sw = sh * vis * wantA; sx = (m.w - sw) / 2; } else { sh = sw / wantA; if (mode === 'face') sy = m.h * .04; }
    sh = Math.min(sh, m.h - sy);
    c.drawImage(im, sx * im.naturalWidth / m.w, sy * im.naturalHeight / m.h, sw * im.naturalWidth / m.w, sh * im.naturalHeight / m.h, 0, 0, w, h);
  }
  return cv;
}
function imgReady() {
  return new Promise(res => { const t0 = Date.now(); (function chk() { const all = Object.keys(IMGC).every(k => IMGC[k].complete); if (all || Date.now() - t0 > 4000) res(); else setTimeout(chk, 40); })(); });
}
if (typeof window !== 'undefined') imgPreload();
