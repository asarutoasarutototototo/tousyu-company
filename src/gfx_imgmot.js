/* ============================================================
   画像キャラのモーション台本
   場面(スキル1/2/3・EGO・防御/回避/反撃・被弾・混乱・パニック・死亡)と
   スキルの強さ(コイン進行)に合わせて、コマ画像を連結して再生する。
   ============================================================ */
const IMOT = {
  rei: {
    appr: 'run', dash: 'n_dash', match: 'match',
    s1: ['n_slide', 'slashA', 'n_blade'], s2: ['n_wind2', 'arc', 'n_arc', 'slashB'], s3: ['n_reach', 'n_burst', 'erupt', 'n_vortex', 'pillar'], ego: ['n_cast', 'n_burst', 'vortex', 'n_vortex', 'n_sphere', 'pillar'],
    wind: { s1: 'n_wind1', s2: 'n_wind2', s3: 'n_jump', ego: 'n_cast' },
    win: { guard: ['n_guard', 'n_vortex'], evade: ['n_jump', 'n_slide'], counter: ['n_wind2', 'n_blade'] },
    clash: { guard: 'n_guard', evade: 'n_jump', counter: 'n_wind1' },
    hit: ['n_hurt', 'n_crawl'], stag: 'n_kneel', panic: 'n_panic', dead: 'n_dead', weak: 'n_hurt', unease: 'i4'
  },
  kuro: {
    appr: 'slide', dash: null,
    s1: ['s1_1', 's1_2'], s2: ['s2_1', 's2_2', 's2_3'], s3: ['s3_1', 's3_2', 's3_3', 's3_4'], ego: ['s3_1', 's3_2', 's2_3', 's3_3', 's3_4'],
    wind: { s1: 'stand', s2: 'stand', s3: 'stand', ego: 'stand' },
    win: { guard: ['guard', 'counter1'], evade: ['evade', 'counter2'], counter: ['counter1', 'counter2'] },
    clash: { guard: 'guard', evade: 'evade', counter: 'counter1' },
    hit: ['hit', 'hit'], stag: 'stag', panic: 'panic', dead: 'dead', weak: null, unease: null
  }
};
IMOT.ren = {
  appr: 'run', dash: 'lunge', match: 'cast',
  s1: ['point', 'slashA'], s2: ['ribbon1', 'ribbon2', 'burstA'], s3: ['jump', 'burstA', 'burstB', 'ribbon2'], ego: ['cast', 'ribbon2', 'burstB', 'ego1', 'ego2'],
  wind: { s1: 'cast', s2: 'lunge', s3: 'cast', ego: 'cast' },
  win: { guard: ['guard', 'ribbon1'], evade: ['jump', 'lunge'], counter: ['ribbon1', 'slashA'] },
  clash: { guard: 'guard', evade: 'jump', counter: 'slashA' },
  hit: ['hit', 'crawl'], stag: 'stag', panic: 'panic', dead: 'dead', weak: 'crawl', unease: null
};
IMOT.aka = {
  appr: 'slide', dash: null, match: 'wind',
  s1: ['m1', 'm4'], s2: ['m2', 'm3', 'm7'], s3: ['n4', 'n3', 'n1', 'n6'], ego: ['m5', 'n4', 'n2', 'n5', 'n6'],
  wind: { s1: 'wind', s2: 'wind', s3: 'i2', ego: 'i2' },
  win: { guard: ['wind', 'm2'], evade: ['i2', 'n4'], counter: ['m7', 'slashA'] },
  clash: { guard: 'wind', evade: 'i2', counter: 'm1' },
  hit: ['hit', 'stag'], stag: 'stag', panic: 'panic', dead: 'dead', weak: null, unease: 'i3'
};
IMOT.rai = {
  appr: 'slide', dash: null, match: 'match',
  s1: ['s1_1', 's1_2'], s2: ['s2_1', 's2_2', 's2_3'], s3: ['s3_1', 's3_2', 's3_3', 's3_4'], ego: ['s3_1', 's3_2', 's2_3', 's3_3', 's3_4'],
  wind: { s1: 'stand', s2: 'stand', s3: 'stand', ego: 'stand' },
  win: { guard: ['guard', 'counter1'], evade: ['evade', 'counter2'], counter: ['counter1', 'counter2'] },
  clash: { guard: 'guard', evade: 'evade', counter: 'counter1' },
  hit: ['hit', 'hit'], stag: 'stag', panic: 'panic', dead: 'dead', weak: null, unease: null
};
IMOT.tetsu = {
  appr: 'run', dash: 'dash', match: 'wind',
  s1: ['lungeUp', 'swingA'], s2: ['lowSwing', 'spinA', 'arcRed'], s3: ['swingA', 'whirl', 'arcRed', 'slam'], ego: ['wind', 'spinA', 'whirl', 'arcRed', 'slam'],
  wind: { s1: 'i2', s2: 'wind', s3: 'wind', ego: 'wind' },
  win: { guard: ['guard', 'lowSwing'], evade: ['dash', 'lungeUp'], counter: ['wind', 'swingA'] },
  clash: { guard: 'guard', evade: 'dash', counter: 'wind' },
  hit: ['hit', 'hit'], stag: 'i4', panic: 'wind', dead: 'hit', weak: 'i3', unease: 'i2'
};
IMOT.nagi = {
  appr: 'run', dash: 'dash', match: 'stance',
  s1: ['thrust', 'swingA'], s2: ['stance', 'arcRed', 'spinA'], s3: ['swingA', 'spinB', 'spinC', 'burstRed'], ego: ['stance', 'arcRed', 'spinA', 'spinC', 'burstRed'],
  wind: { s1: 'stance', s2: 'stance', s3: 'stance', ego: 'stance' },
  win: { guard: ['guard', 'thrust'], evade: ['dash', 'arcRed'], counter: ['stance', 'swingA'] },
  clash: { guard: 'guard', evade: 'dash', counter: 'stance' },
  hit: ['hit', 'hit'], stag: 'stag', panic: 'panic', dead: 'dead', weak: null, unease: null
};
const _IE = { out: p => 1 - Math.pow(1 - p, 3), io: p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2 };
function isImgUnit(u) { return !!(u && u.isAlly && u.look && u.look.img); }
/* 1コイン分の攻撃定義(play1 互換): ci番目のコイン / 全nCコイン */
function imgSkillDef(look, sk, ci, nC, seed) {
  const M = IMOT[look.img], key = sk && sk.key || 's1';
  const kind = sk && ['guard', 'evade', 'counter'].includes(sk.kind) ? sk.kind : null;
  const st = kind ? M.win[kind] : (sk && sk.ego ? M.ego : (M[key] || M.s1)), S = st.length;
  const idx = nC <= 1 ? S - 1 : Math.round(ci * (S - 1) / (nC - 1)), main = st[idx];
  let wind = ci === 0 ? (kind ? 'stand' : (sk && sk.ego ? M.wind.ego : M.wind[key] || 'stand')) : st[Math.round(Math.max(0, ci - 1) * (S - 1) / Math.max(1, nC - 1))];
  const last = ci >= nC - 1, finale = last && (key === 's3' || (sk && sk.ego)), strong = idx >= S - 1 && S > 1;
  const dur = (key === 's1' ? 560 : key === 's2' ? 620 : 700) * (finale ? 1.5 : last ? 1.15 : 1), hit = .4;
  const reach = 40 + 22 * idx + (finale ? 40 : 0), dir = (ci + (seed || 0)) % 2 ? 1 : -1;
  const fr = wind !== main ? [[0, wind], [hit * .9, main]] : [[0, main]];
  if (last && main !== 'stand') fr.push([finale ? .9 : .86, 'stand']); /* 最後のコインは、決めの後に構えへ戻してから離脱 */
  return {
    dur, hit, fr, heavy: strong || finale, launch: finale, ang: dir * (.35 + .1 * (idx % 3)), img: 1,
    f: p => {
      const a = _IE.out(Math.min(1, p / hit)), rec = p > hit ? (p - hit) / (1 - hit) : 0, pulse = p >= hit ? Math.exp(-(p - hit) * 11) : 0;
      const hop = key === 's3' || (sk && sk.ego) ? 26 : 10;
      return { dx: reach * a * (1 - .5 * rec), dy: -hop * Math.sin(Math.PI * Math.min(1, p / .7)) - (finale ? 40 * pulse : 0), sx: 1 + (strong ? .12 : .06) * pulse, sy: 1 - (strong ? .06 : .03) * pulse, rot: (p < hit ? -.06 * a : -.06 * (1 - rec)) * (idx % 2 ? -1 : 1) };
    }
  };
}
/* 打ち合い(クラッシュ)中の構え */
function imgClashDef(look, sk) {
  const M = IMOT[look.img], kind = sk && ['guard', 'evade', 'counter'].includes(sk.kind) ? sk.kind : null, key = sk && sk.key || 's1';
  const main = kind ? M.clash[kind] : (sk && sk.ego ? M.ego[0] : (M[key] || M.s1)[0]), wind = 'stand';
  const hit = .45;
  return {
    dur: 520, hit, img: 1, fr: [[0, wind], [.18, main]], heavy: false,
    f: p => {
      const a = _IE.out(Math.min(1, p / hit)), rec = p > hit ? (p - hit) / (1 - hit) : 0;
      if (kind === 'evade') return { dx: -46 * Math.sin(Math.PI * Math.min(1, p / .8)), dy: -18 * Math.sin(Math.PI * Math.min(1, p)), al: 1 - .35 * Math.sin(Math.PI * Math.min(1, p / .8)), sx: 1, sy: 1, rot: .08 * Math.sin(Math.PI * p) };
      if (kind === 'guard') return { dx: 14 * a - 10 * rec, dy: 0, sx: 1 + .05 * Math.sin(p * 30) * (1 - rec), sy: 1, rot: 0 };
      return { dx: 36 * a * (1 - .6 * rec), dy: -12 * Math.sin(Math.PI * Math.min(1, p / .7)), sx: 1, sy: 1, rot: -.05 * a };
    }
  };
}
/* 今表示するコマ */
function imgFrame(view, v) {
  const M = IMOT[v.u.look.img], d = v.d;
  if (v.die > 0 || v.dead) return M.dead;
  const mv = v.mv;
  if (mv && mv.def && mv.def.fr) { let id = mv.def.fr[0][1]; for (const q of mv.def.fr) if (mv.p >= q[0]) id = q[1]; return id; }
  if (v.frOv && view.clock < v.frUntil) return v.frOv;
  if (d) {
    if (d.panic > 0) return M.panic;
    if (d.stag > 0) return M.stag;
    if (M.weak && d.hp / (v.u.maxHp || 1) < .3 && d.alive) return M.weak;
    if (M.unease && d.sp != null && d.sp <= -20) return M.unease;
  }
  return 'stand';
}
