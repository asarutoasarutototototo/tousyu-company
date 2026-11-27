'use strict';
/* ============================================================
   LAMPWARDEN COMPANY — gfx_motion.js
   モーション定義: 武器別スイング(キーフレーム) / 接近スタイル / 敵モーション
   ============================================================ */
/* K(進行p, 手x, 手y, 武器角, 体dx, 体dy, 体傾き, 縦伸縮, 追加) */
function K(p, hx, hy, ang, dx, dy, rot, sy, o) { return Object.assign({ p, hx, hy, ang, dx: dx || 0, dy: dy || 0, rot: rot || 0, sy: sy == null ? 1 : sy, sx: 1 }, o || {}); }
const KI = p => K(p, 78, -300, -1.05, 0, 0, 0, 1);
function kfSample(kf, p) {
  if (p <= kf[0].p) return kf[0];
  for (let i = 0; i < kf.length - 1; i++) {
    const a = kf[i], b = kf[i + 1];
    if (p <= b.p) { const q = (p - a.p) / (b.p - a.p), e = (b.e || ease.io)(q), r = {}; for (const k in a) if (k !== 'p' && k !== 'e') r[k] = a[k] + (b[k] - a[k]) * e; return r; }
  }
  return kf[kf.length - 1];
}
const NORM = a => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; };

/* ---- スイング定義 ----
   dur:全体ms  hit:命中する進行度  ang:命中エフェクトの傾き  trail:軌跡を描く区間  heavy:フィニッシュ向き  fall:命中後の演出 */
const SWING = {
  slashDiag: { dur: 520, hit: .46, ang: -.75, trail: [.3, .7], kf: [KI(0), K(.28, 18, -440, -2.25, -12, 0, -.07, 1), K(.46, 132, -326, .45, 34, 0, .09, .96, { e: ease.in }), K(.62, 112, -246, 1.15, 30, 0, .1, .95), KI(1)] },
  chop: { dur: 680, hit: .52, ang: -1.25, heavy: 1, shake: 1, trail: [.38, .74], kf: [KI(0), K(.3, 8, -470, -2.45, -14, 0, -.08, 1), K(.42, 0, -484, -2.58, -16, -30, -.1, 1.03), K(.52, 136, -318, .5, 44, -4, .1, .92, { e: ease.in }), K(.66, 118, -248, 1.02, 38, 0, .12, .92), KI(1)] },
  slashRise: { dur: 560, hit: .46, ang: .7, trail: [.28, .72], kf: [KI(0), K(.28, 62, -186, 1.55, 6, 8, .08, .94), K(.46, 124, -332, -.2, 26, -12, -.04, 1.02, { e: ease.in }), K(.62, 98, -446, -1.65, 22, -26, -.1, 1.03), KI(1)] },
  sweepH: { dur: 600, hit: .5, ang: 0, heavy: 1, trail: [.26, .72], kf: [KI(0), K(.3, -12, -318, 3.15, -20, 0, -.06, 1), K(.5, 124, -322, .12, 46, 0, .09, .97, { e: ease.in }), K(.64, 136, -312, -.75, 52, 0, .11, .97), KI(1)] },
  thrust: { dur: 480, hit: .42, ang: 0, trail: [.3, .6], kf: [KI(0), K(.3, -8, -302, -.16, -22, 0, -.05, 1), K(.42, 178, -312, .0, 58, 0, .07, .97, { e: ease.in }), K(.58, 164, -310, .02, 52, 0, .06, .98), KI(1)] },
  dashStab: { dur: 520, hit: .4, ang: 0, trail: [.25, .6], kf: [KI(0), K(.22, -14, -296, -.1, -34, 0, -.1, .94), K(.4, 190, -306, .0, 92, -4, .12, .95, { e: ease.in }), K(.6, 176, -304, .05, 90, 0, .1, .96), KI(1)] },
  quickA: { dur: 330, hit: .46, ang: -.4, trail: [.25, .72], kf: [KI(0), K(.24, 30, -344, -1.4, -6, 0, -.03, 1), K(.46, 132, -318, .3, 24, 0, .05, .98, { e: ease.in }), K(.7, 100, -282, .9, 16, 0, .06, .98), KI(1)] },
  quickB: { dur: 330, hit: .46, ang: .5, trail: [.25, .72], kf: [KI(0), K(.24, 70, -230, 1.2, 4, 3, .04, .97), K(.46, 126, -326, -.3, 24, -2, -.04, 1.01, { e: ease.in }), K(.7, 104, -380, -1.0, 18, -4, -.06, 1.01), KI(1)] },
  backhand: { dur: 420, hit: .46, ang: .3, trail: [.22, .7], kf: [KI(0), K(.26, 120, -310, .35, 10, 0, .06, 1), K(.46, 20, -330, -2.7, -4, 0, -.08, 1, { e: ease.in }), K(.66, -4, -380, -3.2, -10, 0, -.1, 1), KI(1)] },
  leapSlam: { dur: 860, hit: .62, ang: -1.3, heavy: 1, shake: 2, trail: [.46, .8], kf: [KI(0), K(.14, 40, -330, -1.4, -10, 10, -.04, .9), K(.36, 10, -482, -2.5, 20, -112, -.1, 1.04), K(.5, 20, -502, -2.4, 36, -142, -.08, 1.04), K(.62, 142, -308, .62, 74, -4, .15, .9, { e: ease.in }), K(.76, 122, -248, 1.0, 68, 0, .13, .9), KI(1)] },
  spin: { dur: 780, hit: .52, ang: 0, heavy: 1, trail: [.2, .8], kf: [K(0, 78, -300, -1.05, 0, 0, 0, 1), K(.16, 30, -330, -1.9, -8, 0, -.05, .98), K(.52, 124, -320, 4.4, 40, -6, .06, 1), K(.8, 118, -310, 9.4, 52, 0, .08, 1), K(1, 78, -300, 11.52, 0, 0, 0, 1)], extra: p => ({ sx: Math.max(.16, Math.abs(Math.cos(Math.PI * 2.6 * Math.min(1, p / .88)))) * (p > .9 ? 1 : 1) }) },
  uppercut: { dur: 580, hit: .46, ang: 1.0, heavy: 1, launch: 1, shake: 1, trail: [.3, .7], kf: [KI(0), K(.28, 70, -180, 1.45, 10, 10, .1, .9), K(.46, 130, -360, -.6, 32, -22, -.1, 1.04, { e: ease.in }), K(.6, 108, -460, -1.5, 26, -40, -.12, 1.05), KI(1)] },
  punch: { dur: 370, hit: .42, ang: 0, shake: 1, trail: [.3, .6], kf: [KI(0), K(.24, 36, -332, .3, -12, 0, -.06, 1), K(.42, 194, -322, .0, 58, 0, .06, .97, { e: ease.in }), K(.6, 174, -320, 0, 50, 0, .05, .98), KI(1)] },
  flail: { dur: 940, hit: .62, ang: -1.0, heavy: 1, shake: 2, trail: [.12, .78], kf: [K(0, 78, -300, -1.05, 0, 0, 0, 1), K(.14, 40, -380, -1.9, -10, 0, -.06, 1), K(.46, 36, -470, 5.1, 6, -8, 0, 1.02), K(.62, 136, -318, 6.65, 46, -4, .1, .92, { e: ease.in }), K(.78, 118, -246, 7.3, 40, 0, .1, .92), K(1, 78, -300, 5.23, 0, 0, 0, 1)] },
  // 防御スキル勝利時の反撃
  guardBash: { dur: 440, hit: .42, ang: 0, shake: 1, trail: [.3, .6], kf: [KI(0), K(.26, 62, -380, -1.52, -10, 0, -.04, .98), K(.42, 112, -352, -1.3, 44, 0, .06, .96, { e: ease.in }), K(.62, 100, -340, -1.1, 36, 0, .04, .98), KI(1)] },
  evadeSlash: { dur: 520, hit: .5, ang: -.2, trail: [.3, .74], kf: [KI(0), K(.22, 38, -300, -1.0, -56, 0, -.14, .95), K(.5, 162, -314, .16, 62, 0, .1, .97, { e: ease.in }), K(.72, 138, -290, .7, 56, 0, .08, .98), KI(1)] },
  counterSlash: { dur: 420, hit: .44, ang: -.5, trail: [.26, .72], kf: [KI(0), K(.2, 90, -360, -1.9, -18, 0, -.08, 1), K(.44, 138, -322, .5, 40, 0, .1, .95, { e: ease.in }), K(.68, 112, -262, 1.1, 32, 0, .1, .95), KI(1)] }
};
/* クラッシュ中の打ち合い */
const CLASHSW = ['clashHi', 'clashLo', 'clashX'];
SWING.clashHi = { dur: 420, hit: .5, ang: -.8, kf: [KI(0), K(.3, 40, -440, -2.0, -14, 0, -.06, 1), K(.5, 124, -352, .1, 22, -4, .05, .98, { e: ease.in }), K(.75, 100, -320, -.4, 10, 0, .02, 1), KI(1)] };
SWING.clashLo = { dur: 420, hit: .5, ang: .6, kf: [KI(0), K(.3, 70, -220, 1.4, -10, 6, .05, .97), K(.5, 126, -312, .1, 24, -2, -.02, 1, { e: ease.in }), K(.75, 100, -300, -.2, 10, 0, 0, 1), KI(1)] };
SWING.clashX = { dur: 420, hit: .5, ang: 0, kf: [KI(0), K(.3, 8, -330, -2.9, -22, 0, -.1, 1), K(.5, 130, -322, -.05, 30, 0, .1, .96, { e: ease.in }), K(.75, 104, -310, .5, 14, 0, .04, 1), KI(1)] };

/* 武器ごとの手持ち */
const WSET = {
  greatsword: ['slashDiag', 'chop', 'sweepH', 'slashRise', 'leapSlam'],
  rapier: ['thrust', 'quickA', 'dashStab', 'quickB'],
  hammer: ['chop', 'leapSlam', 'sweepH', 'uppercut'],
  cleaver: ['chop', 'slashDiag', 'spin', 'sweepH'],
  flail: ['flail', 'sweepH', 'chop', 'slashDiag'],
  spear: ['thrust', 'sweepH', 'slashRise', 'dashStab'],
  dual: ['quickA', 'quickB', 'spin', 'slashDiag', 'backhand'],
  gauntlet: ['punch', 'uppercut', 'punch', 'chop'],
  fan: ['sweepH', 'slashRise', 'spin', 'quickA', 'backhand'],
  scalpel: ['quickA', 'quickB', 'dashStab', 'backhand'],
  dagger: ['quickA', 'quickB', 'backhand', 'dashStab'],
  mace: ['chop', 'sweepH', 'slashDiag', 'uppercut']
};
const SW_TYPE = {
  slash: ['slashDiag', 'chop', 'sweepH', 'slashRise', 'leapSlam', 'spin', 'quickA', 'quickB', 'backhand', 'flail'],
  pierce: ['thrust', 'dashStab', 'quickA', 'quickB', 'punch'],
  blunt: ['chop', 'leapSlam', 'sweepH', 'uppercut', 'flail', 'punch', 'spin']
};
const APPROACH = { greatsword: ['run', 'leap'], rapier: ['blink', 'run'], hammer: ['leap', 'run'], cleaver: ['run', 'leap'], flail: ['leap', 'run'], spear: ['run', 'leap'], dual: ['blink', 'run'], gauntlet: ['slide', 'run'], fan: ['blink', 'slide'], scalpel: ['blink', 'slide'], dagger: ['blink', 'slide'], mace: ['run', 'leap'] };
function strHash(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function pickSwing(weapon, type, ci, nC, seed, kind) {
  if (kind === 'guard') return 'guardBash';
  if (kind === 'evade') return 'evadeSlash';
  if (kind === 'counter') return 'counterSlash';
  const set = WSET[weapon] || WSET.greatsword, ok = SW_TYPE[type] || SW_TYPE.slash;
  let f = set.filter(n => ok.includes(n)); if (!f.length) f = ok.slice(0, 4);
  if (nC > 1 && ci === nC - 1) { const hv = f.filter(n => SWING[n].heavy); if (hv.length) return hv[(seed + ci) % hv.length]; }
  return f[(seed + ci) % f.length];
}
function pickApproach(weapon, seed) { const l = APPROACH[weapon] || ['run']; return l[seed % l.length]; }

/* ---- 敵モーション: p(0-1) -> {dx(前方+), dy, rot(前傾+), sx, sy} ---- */
const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
const EMV = {
  moth: { dur: 640, hit: .55, f: p => { const w = seg(p, 0, .3), d = seg(p, .3, .55), r = seg(p, .55, 1); const e = ease.io; return { dx: lerp(0, -28, e(w)) + lerp(0, 98, e(d)) - 70 * e(r), dy: lerp(0, -46, e(w)) + lerp(0, 52, e(d)) - 6 * e(r), rot: lerp(0, -.14, e(w)) + lerp(0, .38, e(d)) - .24 * e(r), sx: 1 + .16 * Math.sin(p * 46), sy: 1 }; } },
  hound: { dur: 560, hit: .5, f: p => { const c = seg(p, 0, .24), j = seg(p, .24, .56), r = seg(p, .56, 1); return { dx: lerp(0, -22, ease.io(c)) + lerp(0, 106, ease.out(j)) - 84 * ease.io(r), dy: -Math.sin(j * Math.PI) * 120 * (p < .56 ? 1 : 0), rot: lerp(0, -.1, c) + lerp(0, .3, j) - .2 * r, sx: 1, sy: p < .24 ? lerp(1, .8, c) : p < .56 ? lerp(.8, 1.12, j) : lerp(1.12, 1, r) }; } },
  puppet: { dur: 700, hit: .56, f: p => { const q = Math.floor(p * 7) / 7, a = Math.sin(Math.min(1, q / .6) * Math.PI * .5), r = seg(p, .6, 1); return { dx: 70 * a * (1 - r), dy: (Math.floor(p * 14) % 2 ? -4 : 3) * Math.sin(p * Math.PI), rot: (Math.floor(p * 14) % 2 ? .12 : -.1) * Math.sin(p * Math.PI), sx: 1, sy: 1 }; } },
  shade: { dur: 520, hit: .5, f: p => { const s = Math.sin(p * Math.PI); return { dx: 104 * Math.pow(s, .8), dy: -10 * s, rot: .06 * s, sx: 1 + .3 * s, sy: 1 - .12 * s, alpha: 1 - .35 * s }; } },
  armor: { dur: 820, hit: .6, f: p => { const w = seg(p, 0, .42), s = seg(p, .42, .6), r = seg(p, .6, 1); return { dx: lerp(0, -12, ease.io(w)) + lerp(0, 62, ease.in(s)) - 50 * ease.io(r), dy: -28 * Math.sin(s * Math.PI) * (p < .6 ? 1 : 0), rot: lerp(0, -.12, ease.io(w)) + lerp(0, .3, ease.in(s)) - .18 * ease.io(r), sx: 1, sy: 1 - .06 * Math.sin(s * Math.PI) }; } },
  chorus: { range: 1, dur: 760, hit: .5, f: p => { const s = Math.sin(p * Math.PI); return { dx: 0, dy: -26 * s, rot: -.05 * s, sx: 1 - .06 * s, sy: 1 + .12 * s }; } },
  clock: { range: 1, dur: 780, hit: .5, f: p => ({ dx: 0, dy: -16 * Math.sin(p * Math.PI), rot: 0, sx: Math.max(.2, Math.abs(Math.cos(p * Math.PI * 2.5))), sy: 1 + .04 * Math.sin(p * Math.PI) }) }
};
const EMV_DEF = { dur: 560, hit: .5, f: p => { const s = Math.sin(p * Math.PI); return { dx: 70 * s, dy: 0, rot: .1 * s, sx: 1, sy: 1 }; } };
