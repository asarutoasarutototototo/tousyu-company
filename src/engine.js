'use strict';
/* ============================================================
   LAMPWARDEN COMPANY — engine.js
   コインクラッシュ戦闘エンジン(DOM非依存)
   ============================================================ */
const BAL = {
  kA: 2.6, kE: 5.0, hpLvA: .08, hpLvE: .11, pwLvA: .065, pwLvE: .075,
  stag: 1.5, spHit: 18, burn: 4, bleed: 2, rupt: 2, tremor: 6, crit: 1.5,
  roundSp: 2, roundLose: 1, panicSp: -45, spMax: 45
};
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function emptyPerm() { return { hp: 0, dmg: 0, def: 0, heads: 0, clash: 0, spStart: 0, regen: 0, resAll: 0, res: {}, spGuard: 0, spd: 0 }; }
function addPerm(p, m) {
  if (!m) return p;
  if (m.hpPct) p.hp += m.hpPct / 100; if (m.dmgPct) p.dmg += m.dmgPct / 100; if (m.defPct) p.def += m.defPct / 100;
  if (m.heads) p.heads += m.heads; if (m.clash) p.clash += m.clash; if (m.spStart) p.spStart += m.spStart;
  if (m.regen) p.regen += m.regen / 100; if (m.resAll) p.resAll += m.resAll; if (m.spGuard) p.spGuard += m.spGuard; if (m.spd) p.spd += m.spd;
  if (m.res) for (const k in m.res) p.res[k] = (p.res[k] || 0) + m.res[k];
  return p;
}
function buildPerm(supIds, giftKeys) {
  const p = emptyPerm();
  (supIds || []).forEach(s => SUP[s] && addPerm(p, SUP[s].m));
  (giftKeys || []).forEach(g => GIFTS[g] && addPerm(p, GIFTS[g].m));
  return p;
}
const lvMA = lv => 1 + BAL.pwLvA * (lv - 1);
const lvME = lv => 1 + BAL.pwLvE * (lv - 1);

function makeAlly(sid, identKey, lv, sync, perm, st, mast) {
  const sd = SINNERS[sid], id = IDENTS[identKey];
  const hp0 = sd.hp * (1 + BAL.hpLvA * (lv - 1)) * (1 + .05 * ((sync || 1) - 1)) * (1 + .04 * (id.tier - 1));
  const maxHp = Math.round(hp0 * (1 + perm.hp));
  const u = {
    side: 'A', sid, ik: identKey, key: identKey, name: sd.n, ident: id.n, lv, sync: sync || 1, tier: id.tier,
    maxHp, hp: maxHp, sp: 0, spd: [sd.spd[0], sd.spd[1] + (id.tier === 3 ? 1 : 0)], slotsN: id.slots,
    thr: [.3], thrIdx: 0, stag: 0, panic: 0, st: {}, kit: id.kit, ego: EGOS[sid], pass: (Array.isArray(id.pass) ? id.pass : [id.pass]).filter((p, i, a) => (sync || 1) >= passReqSync(i, a.length)), perm, mods: {},
    look: id.look, sinc: id.sin, type: id.type, alive: true, slots: [], bound: false, boundNext: false, rt: Object.assign({}, sd.rt || {}), rs: {}, isAlly: true, mast: mast || {}, cb: 0
  };
  if (st) { u.hp = clamp(Math.round(st.hpFrac * maxHp), st.hpFrac > 0 ? 1 : 0, maxHp); u.sp = st.sp || 0; if (u.hp <= 0) u.alive = false; }
  else u.sp = clamp(perm.spStart, -45, 45);
  return u;
}
function makeEnemy(key, lv, hpMul) {
  const d = ENEMIES[key];
  const maxHp = Math.round(d.hp * (1 + BAL.hpLvE * (lv - 1)) * (hpMul || 1));
  return {
    side: 'E', key, art: d.art, name: d.n, lv, boss: !!d.boss, sc: d.sc || 1, pal: d.pal || null, maxHp, hp: maxHp, sp: 0,
    spd: d.spd, slotsN: d.slots, thr: d.thr.slice(), thrIdx: 0, stag: 0, panic: 0, st: {}, skills: d.skills, pass: (d.pass || []).slice(),
    perm: emptyPerm(), mods: {}, rt: d.rt, rs: d.rs, alive: true, slots: [], bound: false, boundNext: false, isAlly: false
  };
}

class Battle {
  constructor(allies, enemies, opt) {
    opt = opt || {};
    this.rng = opt.rng || Math.random;
    this.units = allies.concat(enemies); this.units.forEach((u, i) => u.id = i);
    this.turn = 0; this.over = false; this.result = null; this.ev = [];
    this.res = {}; SIN_KEYS.forEach(s => this.res[s] = 0);
    const perm = allies[0] ? allies[0].perm : emptyPerm();
    SIN_KEYS.forEach(s => { this.res[s] = clamp((perm.res[s] || 0) + (perm.resAll || 0), 0, 20); });
    if (opt.res) SIN_KEYS.forEach(s => { if (opt.res[s]) this.res[s] = opt.res[s]; });
    this.stat = { dmg: 0, taken: 0, clashW: 0, clashL: 0, stag: 0, ego: 0, panic: 0 };
  }
  /* ---------- 基本 ---------- */
  r() { return this.rng(); }
  ri(a, b) { return a + Math.floor(this.r() * (b - a + 1)); }
  U(i) { return this.units[i]; }
  side(s) { return this.units.filter(u => u.side === s); }
  alive(s) { return this.units.filter(u => u.side === s && u.alive); }
  foes(u) { return this.alive(u.side === 'A' ? 'E' : 'A'); }
  friends(u) { return this.alive(u.side); }
  snap(u) { return { hp: u.hp, sp: u.sp, stag: u.stag, panic: u.panic, ti: u.thrIdx, alive: u.alive, st: Object.keys(u.st).map(k => [k, u.st[k].p, u.st[k].c]) }; }
  push(e) { e.S = this.units.map(u => this.snap(u)); e.R = Object.assign({}, this.res); this.ev.push(e); return e; }
  ref(a) { return { u: a.u.id, s: a.slot.i }; }

  /* ---------- 修正値 ---------- */
  condOk(u, c) {
    if (!c) return true;
    if (c.sp) { const [op, v] = c.sp; if (op === '>=' ? !(u.sp >= v) : !(u.sp <= v)) return false; }
    if (c.hp) { const [op, v] = c.hp, f = u.hp / u.maxHp; if (op === '>=' ? !(f >= v) : !(f <= v)) return false; }
    if (c.st) { const [k, op, n] = c.st, v = u.st[k] ? u.st[k].p : 0; if (op === '>=' ? !(v >= n) : !(v <= n)) return false; }
    return true;
  }
  getMod(u, key) {
    let v = (u.perm[key] || 0) + (u.mods[key] || 0);
    for (const pk of u.pass) { const P = PASS[pk]; if (P && P.on === 'always' && P.mod && P.mod[key] && this.condOk(u, P.cond)) v += P.mod[key]; }
    return v;
  }
  stP(u, k) { return u.st[k] ? u.st[k].p : 0; }
  headsProb(u) { if (u.panic > 0) return .05; return clamp(.5 + u.sp / 100 + this.getMod(u, 'heads') + Math.min(.3, this.stP(u, 'ardor') * .015), .05, .95); }
  /* 熟練度5ごとにそのスキルの合戦威力+1 */
  mastPow(u, sk) {
    if (!u.mast || !sk || !u.kit) return 0;
    const key = Object.keys(u.kit).find(k => u.kit[k] === sk) || (sk.ego ? 'ego' : null);
    return key ? Math.floor((u.mast[key] || 0) / 5) : 0;
  }
  clashPow(u, foe, sk) {
    let b = this.getMod(u, 'clash') + Math.min(4, Math.floor(this.stP(u, 'dawn') / 2)) + this.mastPow(u, sk);
    if (foe) b += Math.trunc((u.lv - foe.lv) / 3);
    return b;
  }
  flip(u) { return this.r() < this.headsProb(u); }
  dmgMulBonus(u) {
    let m = 1 + this.getMod(u, 'dmg');
    m -= Math.min(.5, this.stP(u, 'feeble') * .04);
    m += Math.min(.45, this.stP(u, 'charge') * .03);
    m += Math.min(.4, this.stP(u, 'frenzy') * .02);
    m += u.cb || 0;
    return Math.max(.2, m);
  }

  /* ---------- ステータス・SP・回復 ---------- */
  addStatus(u, k, p, c, quiet) {
    if (!u.alive || !ST[k]) return;
    const cur = u.st[k] || (u.st[k] = { p: 0, c: 0 });
    const pcap = (k === 'vuln' || k === 'feeble') ? 15 : 30;
    cur.p = Math.min(pcap, cur.p + p); cur.c = Math.min(9, cur.c + c);
    if (!quiet) this.push({ t: 'status', u: u.id, k, p, c });
  }
  rmStatus(u, k) { delete u.st[k]; }
  adjSp(u, d, quiet) {
    if (!u.alive || d === 0) return;
    if (d < 0 && u.perm.spGuard) d = Math.round(d * (1 - Math.min(.8, u.perm.spGuard)));
    if (u.panic > 0 && d < 0) return;
    const before = u.sp; u.sp = clamp(u.sp + d, -45, BAL.spMax);
    if (!quiet && u.sp !== before) this.push({ t: 'sp', u: u.id, d: u.sp - before });
    if (u.sp <= BAL.panicSp && u.panic === 0 && u.isAlly) this.doPanic(u);
  }
  doPanic(u) {
    u.panic = 2; this.stat.panic++;
    u.slots.forEach(s => { if (!s.used) s.canceled = true; });
    this.push({ t: 'panic', u: u.id });
  }
  heal(u, v, quiet) {
    if (!u.alive) return; const b = u.hp; u.hp = Math.min(u.maxHp, u.hp + Math.round(v));
    if (!quiet && u.hp > b) this.push({ t: 'heal', u: u.id, v: u.hp - b });
  }
  pop(u, text, color) { this.push({ t: 'pop', u: u.id, text, color }); }

  /* ---------- 効果適用 ---------- */
  resolveTo(to, owner, tgt, src) {
    switch (to) {
      case 'self': return [owner];
      case 'tgt': return tgt ? [tgt] : [];
      case 'src': return src ? [src] : [];
      case 'allies': return this.friends(owner);
      case 'allE': return this.foes(owner);
      case 'rndE': { const f = this.foes(owner); return f.length ? [f[this.ri(0, f.length - 1)]] : []; }
      case 'rndA': { const f = this.friends(owner); return f.length ? [f[this.ri(0, f.length - 1)]] : []; }
    }
    return [];
  }
  applyFx(f, owner, tgt, src, sk) {
    const targets = this.resolveTo(f.to, owner, tgt, src);
    for (const t of targets) {
      if (!t.alive && f.k !== 'res') continue;
      switch (f.k) {
        case 'st': this.addStatus(t, f.s, f.p, f.c); break;
        case 'cnt': { const s = t.st[f.s]; if (s) { s.c = Math.min(9, s.c + f.c); this.push({ t: 'status', u: t.id, k: f.s, p: 0, c: f.c }); } break; }
        case 'sp': this.adjSp(t, f.v); break;
        case 'heal': this.heal(t, f.pct ? t.maxHp * f.v / 100 : f.v); break;
        case 'mod': t.mods[f.key] = (t.mods[f.key] || 0) + f.v; break;
        case 'burst': this.burst(t, owner); break;
        case 'bind': t.boundNext = true; this.push({ t: 'pop', u: t.id, text: '拘束', color: '#c9b8ff' }); break;
        case 'res': if (owner.isAlly) { const sin = f.sin === 'own' ? owner.sinc : f.sin; this.res[sin] = Math.min(20, this.res[sin] + f.v); this.push({ t: 'res', sin, v: f.v }); } break;
      }
    }
  }
  burst(t, owner) {
    const s = t.st.tremor; if (!s || !t.alive) return;
    const dmg = Math.round(s.p * BAL.tremor * lvMA(owner.lv) / 1.3);
    s.c = Math.ceil(s.c / 2); if (s.c <= 0) delete t.st.tremor;
    this.dealRaw(t, dmg, owner, { k: 'burst' });
  }
  fireHook(u, hook, ctx) {
    if (!u.alive && hook !== 'kill') return;
    ctx = ctx || {};
    for (const pk of u.pass) {
      const P = PASS[pk]; if (!P || P.on !== hook || !P.fx) continue;
      if (P.cond && !this.condOk(u, P.cond)) continue;
      if (P.ch && this.r() > P.ch) continue;
      if (hook !== 'hit' && hook !== 'damaged') this.pop(u, P.n, '#ffd479');
      for (const f of P.fx) this.applyFx(f, u, ctx.tgt, ctx.src);
    }
  }

  /* ---------- ダメージ ---------- */
  calcDamage(u, tu, sk, power, o) {
    o = o || {};
    const k = u.isAlly ? BAL.kA * lvMA(u.lv) : BAL.kE * lvME(u.lv);
    let mult = 1;
    const tm = tu.rt[sk.type] || 1, sm = tu.rs[sk.sin] || 1;
    mult *= tm * sm;
    mult *= this.dmgMulBonus(u);
    mult *= 1 + Math.min(.6, this.stP(tu, 'vuln') * .04);
    mult *= 1 - Math.min(.3, this.stP(tu, 'shell') * .02);
    if (tu.stag > 0) mult *= BAL.stag;
    mult *= Math.max(.2, 1 - this.getMod(tu, 'def') - (o.defExtra || 0));
    let crit = false;
    if (u.st.poise && this.r() < Math.min(.7, u.st.poise.p * .08)) { crit = true; mult *= BAL.crit; u.st.poise.c--; if (u.st.poise.c <= 0) delete u.st.poise; }
    if (sk.exec && tu.hp / tu.maxHp < .5) mult *= 1 + sk.exec;
    if (o.mul) mult *= o.mul;
    /* レベル差補正: 格上には増加、格下(自分のレベルが低い)には大きく減少 */
    const d = u.lv - tu.lv; mult *= d >= 0 ? 1 + d / (d + 25) : Math.max(.15, 1 + d / (-d + 12));
    /* 熟練度: 1ptにつき与ダメージ+1% */
    if (o.mk && u.mast && u.mast[o.mk]) mult *= 1 + Math.min(1000, u.mast[o.mk]) / 100;
    const raw = power * k * mult;
    const dmg = Math.max(1, (tm < 1 ? Math.floor(raw) : Math.round(raw)));
    return { dmg, crit, tier: resTier(tm * sm) };
  }
  dealRaw(t, dmg, src, info) {
    if (!t.alive) return 0;
    dmg = Math.max(1, Math.round(dmg)); t.hp = Math.max(0, t.hp - dmg);
    if (src && src.isAlly !== t.isAlly) { this.stat.dmg += dmg; src.dealt = (src.dealt || 0) + dmg; } else if (t.isAlly) this.stat.taken += dmg;
    this.push({ t: 'dot', u: t.id, v: dmg, k: info && info.k });
    if (t.hp <= 0) this.kill(t, src); else this.checkStagger(t, src);
    return dmg;
  }
  checkStagger(u, src) {
    if (!u.alive || u.stag > 0) return;
    if (u.thrIdx < u.thr.length && u.hp / u.maxHp <= u.thr[u.thrIdx]) {
      u.thrIdx++; u.stag = 2; this.stat.stag++;
      u.slots.forEach(s => { if (!s.used) s.canceled = true; });
      this.push({ t: 'stagger', u: u.id, phase: u.thrIdx });
      if (src && src.alive) this.fireHook(src, 'stagger', { tgt: u });
    }
  }
  kill(u, killer) {
    if (!u.alive) return;
    u.alive = false; u.hp = 0; u.slots.forEach(s => { s.canceled = true; });
    this.push({ t: 'die', u: u.id });
    if (u.isAlly) this.friends(u).forEach(a => { this.adjSp(a, -6); this.fireHook(a, 'allyDown', {}); });
    else { this.alive('A').forEach(a => this.adjSp(a, 3)); if (killer && killer.alive) this.fireHook(killer, 'kill', { tgt: u }); }
    this.checkOver();
  }
  checkOver() {
    if (this.over) return true;
    if (!this.alive('E').length) { this.over = true; this.result = 'win'; }
    else if (!this.alive('A').length) { this.over = true; this.result = 'lose'; }
    return this.over;
  }

  /* 被弾処理(コイン命中) */
  hit(u, tu, sk, power, flip, ci, o) {
    o = o || {};
    if (tu.st.mikiri && this.r() < Math.min(.5, tu.st.mikiri.p * .06)) {
      const mk = tu.st.mikiri; mk.c--; if (mk.c <= 0) delete tu.st.mikiri;
      this.push({ t: 'coin', src: u.id, dst: tu.id, flip, power, dmg: 0, extra: 0, crit: false, tier: 'N', miss: 1, ci, sk: sk.n, sin: sk.sin, type: sk.type });
      return false;
    }
    const c = this.calcDamage(u, tu, sk, power, o);
    let dmg = c.dmg;
    tu.hp = Math.max(0, tu.hp - dmg);
    if (tu.isAlly) this.stat.taken += dmg; else { this.stat.dmg += dmg; u.dealt = (u.dealt || 0) + dmg; }
    let extra = 0;
    if (tu.st.rupture && tu.hp > 0) { extra = Math.round(tu.st.rupture.p * BAL.rupt * lvMA(u.lv) / 1.3); tu.st.rupture.c--; if (tu.st.rupture.c <= 0) delete tu.st.rupture; tu.hp = Math.max(0, tu.hp - extra); }
    let spLoss = 0;
    if (tu.isAlly && tu.panic === 0) { spLoss = Math.max(1, Math.round((dmg + extra) / tu.maxHp * BAL.spHit)); }
    if (tu.st.sink) { spLoss += tu.st.sink.p; tu.st.sink.c--; if (tu.st.sink.c <= 0) delete tu.st.sink; }
    this.push({ t: 'coin', src: u.id, dst: tu.id, flip, power, dmg, extra, crit: c.crit, tier: c.tier.k, ci, sk: sk.n, skk: sk.key, nC: sk.nC, sin: sk.sin, type: sk.type });
    if (spLoss && tu.alive) this.adjSp(tu, -spLoss);
    if (tu.st.shell) { tu.st.shell.c--; if (tu.st.shell.c <= 0) delete tu.st.shell; }
    if (tu.st.vuln) { tu.st.vuln.c--; if (tu.st.vuln.c <= 0) delete tu.st.vuln; }
    if (u.st.feeble) { u.st.feeble.c--; if (u.st.feeble.c <= 0) delete u.st.feeble; }
    if (u.st.bloodmoon && u.alive) this.heal(u, Math.round((dmg + extra) * Math.min(.3, u.st.bloodmoon.p * .02)));
    if (tu.st.grit && tu.hp > 0 && u.alive) { const g = tu.st.grit, d = Math.round(g.p * 2.5 * lvMA(tu.lv) / 1.3); g.c--; if (g.c <= 0) delete tu.st.grit; this.dealRaw(u, d, tu, { k: 'thorn' }); }
    if (tu.hp <= 0) { this.kill(tu, u); return true; }
    this.checkStagger(tu, u);
    this.fireHook(tu, 'damaged', { src: u });
    return false;
  }

  /* ---------- スキル実行 ---------- */
  onUse(act) {
    const u = act.u, sk = act.slot.skill;
    if (u.isAlly && sk.kind === 'atk' && !sk.ego) { this.res[sk.sin] = Math.min(20, this.res[sk.sin] + 1); }
    for (const f of sk.fx) if (f.t === 'use') this.applyFx(f, u, null, null, sk);
  }
  afterSkill(u) {
    u.cb = 0;
    if (u.st.dawn) { u.st.dawn.c--; if (u.st.dawn.c <= 0) delete u.st.dawn; this.push({ t: 'status', u: u.id, k: 'dawn', p: 0, c: 0 }); }
    if (u.st.charge) { u.st.charge.c--; if (u.st.charge.c <= 0) delete u.st.charge; this.push({ t: 'status', u: u.id, k: 'charge', p: 0, c: 0 }); }
  }
  coinFx(u, tu, sk, i, flip) {
    for (const f of sk.fx) {
      if (f.t !== 'hit' && f.t !== 'head' && f.t !== 'tail') continue;
      const ok = f.coin === '*' || f.coin === i || (f.coin === 'last' && i === sk.nC - 1);
      if (!ok) continue;
      if (f.t === 'head' && !flip) continue; if (f.t === 'tail' && flip) continue;
      this.applyFx(f, u, tu, null, sk);
    }
  }
  hitSeq(act, tu, n, o) {
    o = o || {};
    const u = act.u, sk = act.slot.skill; let heads = 0;
    for (let i = 0; i < n; i++) {
      if (!u.alive || !tu.alive) break;
      const fl = this.flip(u); if (fl) heads++;
      const power = sk.base + heads * sk.cp + this.clashPow(u, tu, sk);
      const died = this.hit(u, tu, sk, power, fl, i, { mul: o.mul, defExtra: o.defExtra, mk: act.slot.key });
      if (!u.alive) break;
      // 出血
      if (u.st.bleed && u.alive) {
        const b = u.st.bleed; const d = Math.round(b.p * BAL.bleed * lvMA(tu.lv) / 1.3); b.c--; if (b.c <= 0) delete u.st.bleed;
        this.dealRaw(u, d, tu, { k: 'bleed' });
      }
      if (!u.alive) break;
      this.fireHook(u, 'hit', { tgt: tu });
      if (tu.alive || died) this.coinFx(u, tu, sk, i, fl);
      if (died) break;
    }
  }
  /* 合戦の成立判定: 'def'(防御スキル)/'mutual'(相互指定)/'steal'(速度で奪取)/'slow'(速度不足で単発)/'prot'(相互指定の組は奪えない) */
  mutualWith(ts, tuOwner, a, au) { return !!(ts.target && ts.target.u === au.id && (ts.target.s == null || ts.target.s === a.i)); }
  pairedSlot(ts, owner) {
    const t = ts.target; if (!t || t.s == null || t.u === owner.id) return null;
    const pu = this.U(t.u); if (!pu || !pu.alive || pu.stag > 0) return null;
    const ps = pu.slots[t.s]; if (!ps || ps.used || ps.canceled || !ps.skill) return null;
    return this.mutualWith(ps, pu, ts, owner) ? ps : null;
  }
  /* 行動順(速度が高い方が先、同速は tie の小さい方) */
  before(a, b) { return a.spd > b.spd || (a.spd === b.spd && a.tie < b.tie); }
  /* マッチ奪い: 速度が上回る攻撃スキルは、他と合戦する予定の敵スキルでも奪える。
     ただし、その合戦相手(味方)のほうが先に動く場合は先に合戦が成立するので奪えない。
     敵が味方の合戦を奪うことはできない(相互指定の組は守られる)。 */
  stealable(au, a, tu, ts) {
    if (!(a.spd > ts.spd)) return false;
    const ps = this.pairedSlot(ts, tu); if (!ps) return true;
    return !!au.isAlly && this.before(a, ps);
  }
  clashState(au, a, tu, ts) {
    if (!ts || !ts.skill || ts.used || ts.canceled || tu.stag > 0) return 'none';
    if (ts.skill.kind !== 'atk' && !ts.skill.ego) return 'def';
    if (this.mutualWith(ts, tu, a, au)) return 'mutual';
    if (!(a.spd > ts.spd)) return 'slow';
    return this.stealable(au, a, tu, ts) ? 'steal' : 'prot';
  }
  findPartner(act) {
    const u = act.u, tg = act.slot.target; if (!tg) return null;
    const tu = this.U(tg.u); if (!tu || !tu.alive || tu.stag > 0) return null;
    if (tg.s != null) {
      const ts = tu.slots[tg.s], stt = this.clashState(u, act.slot, tu, ts);
      if (stt === 'def' || stt === 'mutual' || stt === 'steal') return { u: tu, slot: ts, steal: stt === 'steal' };
    }
    { /* 防御スキル: 攻撃側スキルを指定している(dtarget)ものを優先し、次に出番の順 */
      const ds = tu.slots.filter(ts => !ts.used && !ts.canceled && ts.skill && ts.skill.kind !== 'atk' && !ts.skill.ego);
      const mine = ts => ts.dtarget && ts.dtarget.u === u.id && ts.dtarget.s === act.slot.i ? 0 : 1;
      ds.sort((a, b) => mine(a) - mine(b) || b.spd - a.spd);
      if (ds.length) return { u: tu, slot: ds[0] };
    }
    for (const ts of tu.slots) if (!ts.used && !ts.canceled && ts.skill && ts.target && ts.target.u === u.id && ts.target.s === act.slot.i) return { u: tu, slot: ts };
    /* 味方の攻撃: 指定スキルとマッチできない場合、同じ敵の他の(速度で奪える)攻撃スキルとマッチする */
    if (u.isAlly && tg.s != null) {
      const cand = tu.slots.filter(ts => ts !== tu.slots[tg.s] && !ts.used && !ts.canceled && ts.skill && (ts.skill.kind === 'atk' || ts.skill.ego) && this.stealable(u, act.slot, tu, ts));
      cand.sort((a, b) => ((b.target && b.target.u === u.id) - (a.target && a.target.u === u.id)) || b.spd - a.spd);
      if (cand.length) return { u: tu, slot: cand[0], steal: true, alt: true };
    }
    return null;
  }
  /* マッチ不成立の理由(味方が敵スキルを指定したのに合戦にならなかった場合) */
  nomatchReason(act) {
    const tg = act.slot.target; if (!tg || tg.s == null) return null;
    const tu = this.U(tg.u); if (!tu) return null;
    if (!tu.alive || tu.stag > 0) return '相手が行動不能';
    const ts = tu.slots[tg.s]; if (!ts || ts.canceled) return '相手スキルが中断';
    if (ts.used) { const by = ts.by != null ? this.U(ts.by) : null; return by && by.isAlly === act.u.isAlly ? '味方が先に合戦' : '相手は交戦済み'; }
    const st = this.clashState(act.u, act.slot, tu, ts);
    return st === 'slow' ? (act.slot.spd === ts.spd ? '同速は奪えない' : '速度負け') : st === 'prot' ? '先に動く味方が合戦中' : null;
  }
  /* 計画の予測: 速度順に「誰と誰が合戦になるか」だけを再現する(乱数・戦闘中の状態変化は無視)。
     戻り値 Map(slot → {k, p, why})。k: 'clash'(合戦) / 'steal'(奪取して合戦) / 'pulled'(別の合戦に引かれる)
     / 'dsteal'(回避・防御の奪取) / 'one'(直接攻撃)。p は合戦の相手 {u, slot} */
  predict() {
    const acts = []; this.units.forEach(u => { if (u.alive) u.slots.forEach(s => acts.push({ u, slot: s })); });
    acts.sort((a, b) => b.slot.spd - a.slot.spd || a.slot.tie - b.slot.tie);
    const saved = new Map(), out = new Map();
    const use = (s, by) => { if (!saved.has(s)) saved.set(s, [s.used, s.by]); s.used = true; if (by != null) s.by = by; };
    for (const act of acts) {
      const u = act.u, slot = act.slot, sk = slot.skill;
      if (slot.used || slot.canceled || !sk) continue;
      if (u.stag > 0 && !slot.pulled) continue;
      if (sk.kind !== 'atk' && !sk.ego) {
        const dt = slot.dtarget, du = dt && this.U(dt.u), ds = du && du.alive && !(du.stag > 0) ? du.slots[dt.s] : null;
        if (ds && ds.skill && ds.skill.kind === 'atk' && !ds.used && !ds.canceled && this.stealable(u, slot, du, ds)) {
          use(slot); use(ds, u.id); out.set(slot, { k: 'dsteal', p: { u: du, slot: ds } }); out.set(ds, { k: 'pulled', p: { u, slot } });
        } else use(slot);
        continue;
      }
      const tg = slot.target, tu = tg && this.U(tg.u); use(slot);
      if (!tu || !tu.alive) { out.set(slot, { k: 'one', why: '標的なし' }); continue; }
      const partner = this.findPartner(act);
      if (partner) {
        use(partner.slot, u.id);
        out.set(slot, { k: partner.steal ? 'steal' : 'clash', p: { u: partner.u, slot: partner.slot }, alt: !!partner.alt });
        const own = partner.slot.target && partner.slot.target.u === u.id && partner.slot.target.s === slot.i;
        out.set(partner.slot, { k: own ? 'clash' : 'pulled', p: { u, slot } });
      } else out.set(slot, { k: 'one', why: this.nomatchReason(act) || '' });
    }
    saved.forEach((v, s) => { s.used = v[0]; s.by = v[1]; });
    return out;
  }
  /* slot の標的を一時的に変えたときの予測結果(ドラッグ中のプレビュー用) */
  predictWith(slot, patch) {
    const keys = Object.keys(patch), old = keys.map(k => slot[k]); keys.forEach(k => { slot[k] = patch[k]; });
    try { return this.predict().get(slot) || null; } finally { keys.forEach((k, i) => { slot[k] = old[i]; }); }
  }
  retarget(act) {
    const tg = act.slot.target; let tu = tg && this.U(tg.u);
    if (!tu || !tu.alive) {
      const f = this.foes(act.u); if (!f.length) return null;
      tu = f[this.ri(0, f.length - 1)]; act.slot.target = { u: tu.id, s: null };
    }
    return tu;
  }
  runAction(act) {
    const u = act.u, slot = act.slot, sk = slot.skill;
    if (slot.used || slot.canceled || !u.alive || !sk) return;
    if (u.stag > 0 && !slot.pulled) { slot.canceled = true; return; }
    if (sk.kind !== 'atk' && !sk.ego) {
      /* 防御/回避スキルの能動使用: 選択した敵スキルより速度が上なら、そのスキルに対して先に使用(奪取)する */
      const dt = slot.dtarget, du = dt && this.U(dt.u), ds = du && du.alive && !(du.stag > 0) ? du.slots[dt.s] : null;
      if (ds && ds.skill && ds.skill.kind === 'atk' && !ds.used && !ds.canceled && this.stealable(u, slot, du, ds)) {
        slot.used = true; this.noteUse(u, slot); ds.used = true; ds.pulled = true; this.noteUse(du, ds);
        this.clash(act, { u: du, slot: ds }, true);
        this.afterSkill(u); this.checkOver(); return;
      }
      slot.used = true; if (sk.kind) this.push({ t: 'fizzle', u: u.id, i: slot.i }); return;
    }
    const tu = this.retarget(act); if (!tu) return;
    slot.used = true; this.noteUse(u, slot);
    if (sk.ego) {
      this.stat.ego++;
      this.alive(u.side).forEach(a => this.fireHook(a, 'ego', {}));
      this.push({ t: 'ego', u: u.id, sk: sk.n, sin: sk.sin, v: sk.v });
    }
    const partner = this.findPartner(act);
    if (!partner && u.isAlly) { const why = this.nomatchReason(act); if (why) this.push({ t: 'pop', u: u.id, text: 'マッチ不成立: ' + why, color: '#ffb0b0' }); }
    if (partner) { partner.slot.used = true; partner.slot.pulled = true; partner.slot.by = u.id; this.noteUse(partner.u, partner.slot); this.clash(act, partner, partner.steal); }
    else this.oneSided(act, tu);
    if (sk.aoe && u.alive && !this.over) this.aoeHits(act, tu);
    this.afterSkill(u);
    this.checkOver();
  }
  noteUse(u, slot) { if (!u.isAlly || !slot.key || slot.key === 'e') return; this.use = this.use || {}; const k = u.ik + ':' + slot.key; this.use[k] = (this.use[k] || 0) + 1; if (u.mast) u.mast[slot.key] = Math.min(1000, (u.mast[slot.key] || 0) + 1); }
  /* 多体攻撃(E.G.O): 主対象以外の敵にも、合戦なしで追加攻撃(威力80%) */
  aoeHits(act, prim) {
    const u = act.u, sk = act.slot.skill;
    let others = this.foes(u).filter(x => x !== prim && x.alive);
    const n = sk.aoe === 'all' ? others.length : Math.max(0, sk.aoe - 1);
    others = others.sort((a, b) => a.id - b.id).slice(0, n);
    for (const t2 of others) {
      if (!u.alive) break;
      this.push({ t: 'atk', a: this.ref(act), tu: t2.id, mode: 'one', aoe: 1 });
      this.hitSeq(act, t2, sk.nC, { mul: .8 });
      this.push({ t: 'atkEnd', u: u.id });
      if (this.checkOver()) break;
    }
  }
  oneSided(act, tu) {
    const u = act.u, sk = act.slot.skill;
    this.onUse(act);
    this.push({ t: 'atk', a: this.ref(act), tu: tu.id, mode: 'one' });
    this.hitSeq(act, tu, sk.nC);
    this.push({ t: 'atkEnd', u: u.id });
  }
  clash(A, B, steal) {
    const ua = A.u, ub = B.u, ska = A.slot.skill, skb = B.slot.skill;
    this.push({ t: 'clash', a: this.ref(A), b: this.ref(B), steal: steal ? 1 : 0 });
    this.onUse(A); this.onUse(B);
    let na = ska.nC, nb = skb.nC, guard = 0;
    while (na > 0 && nb > 0 && guard++ < 30) {
      let pa, pb, fa, fb, tries = 0;
      do {
        fa = []; fb = []; let ha = 0, hb = 0;
        for (let i = 0; i < na; i++) { const f = this.flip(ua); fa.push(f); if (f) ha++; }
        for (let i = 0; i < nb; i++) { const f = this.flip(ub); fb.push(f); if (f) hb++; }
        pa = ska.base + ha * ska.cp + this.clashPow(ua, ub, ska);
        pb = skb.base + hb * skb.cp + this.clashPow(ub, ua, skb);
        tries++;
      } while (pa === pb && tries < 3);
      let w;
      if (pa === pb) { w = 0; na--; nb--; } else if (pa > pb) { w = 1; nb--; } else { w = 2; na--; }
      if (w === 1) { this.stat.clashW += ua.isAlly ? 1 : 0; this.stat.clashL += ub.isAlly ? 1 : 0; this.adjSp(ua, BAL.roundSp, true); this.adjSp(ub, -BAL.roundLose, true); }
      if (w === 2) { this.stat.clashW += ub.isAlly ? 1 : 0; this.stat.clashL += ua.isAlly ? 1 : 0; this.adjSp(ub, BAL.roundSp, true); this.adjSp(ua, -BAL.roundLose, true); }
      this.push({ t: 'round', a: this.ref(A), b: this.ref(B), fa, fb, pa, pb, w, na, nb });
      ua.cb = Math.min(.5, (ua.cb || 0) + .05); ub.cb = Math.min(.5, (ub.cb || 0) + .05);
      if (w === 1) { this.fireHook(ua, 'clashWin', { tgt: ub }); this.fireHook(ub, 'clashLose', { tgt: ua }); }
      if (w === 2) { this.fireHook(ub, 'clashWin', { tgt: ua }); this.fireHook(ua, 'clashLose', { tgt: ub }); }
      if (!ua.alive || !ub.alive) break;
    }
    let W = null, L = null, n = 0;
    if (na > 0 && nb === 0) { W = A; L = B; n = na; } else if (nb > 0 && na === 0) { W = B; L = A; n = nb; }
    if (!W) { this.push({ t: 'clashEnd', w: null }); this.afterSkill(ua); this.afterSkill(ub); return; }
    this.push({ t: 'clashEnd', w: this.ref(W), l: this.ref(L), n });
    const wsk = W.slot.skill, lsk = L.slot.skill;
    for (const f of wsk.fx) if (f.t === 'win') this.applyFx(f, W.u, L.u, null, wsk);
    let mul = 1, defExtra = 0;
    if (wsk.kind === 'guard' || wsk.kind === 'evade') { mul = .8; this.adjSp(W.u, wsk.kind === 'evade' ? 8 : 6); if (wsk.kind === 'evade') this.heal(W.u, W.u.maxHp * .04); this.pop(W.u, wsk.kind === 'evade' ? '回避成功' : '防御成功', '#9fd0ff'); }
    if (wsk.kind === 'counter') { mul = 1.3; this.pop(W.u, '反撃', '#ffb347'); }
    if (['guard', 'evade', 'counter'].includes(wsk.kind)) this.fireHook(W.u, 'defWin', { tgt: L.u });
    if (lsk.kind === 'guard') { defExtra = lsk.red || .45; }
    this.hitSeq(W, L.u, n, { mul, defExtra });
    this.push({ t: 'atkEnd', u: W.u.id });
    if (W.u !== A.u) this.afterSkill(A.u); else this.afterSkill(B.u);
    this.afterSkill(W.u);
  }

  /* ---------- ターン進行 ---------- */
  startTurn() {
    this.ev = []; this.turn++;
    this.units.forEach(u => { u.mods = {}; u.slots = []; u.bound = u.boundNext; u.boundNext = false; u.cb = 0; });
    this.growSlots();
    this.push({ t: 'turnStart', turn: this.turn });
    this.units.forEach(u => { if (u.alive) this.fireHook(u, 'turnStart', {}); });
    this.units.forEach(u => {
      if (!u.alive) return;
      const n = (u.stag > 0 || u.bound) ? 0 : u.slotsN;
      for (let i = 0; i < n; i++) u.slots.push({ i, spd: this.ri(u.spd[0], u.spd[1]) + (u.perm.spd || 0), skill: null, key: null, dealt: null, target: null, used: false, canceled: false, pulled: false, egoV: null, paid: 0, tie: this.r() });
      if (u.bound) this.push({ t: 'pop', u: u.id, text: '拘束', color: '#c9b8ff' });
    });
    this.alive('E').forEach(e => this.planEnemy(e));
    this.alive('A').forEach(a => this.dealSkills(a));
    if (this.manual) this.autoTargets(m => m.u.panic > 0); else this.autoTargets();
    return this.ev;
  }
  /* 出撃6人以下: 2ターン目以降、出撃順に1スロットずつ増加(合計7スロットで停止、1人でも最大7) */
  growSlots() {
    const live = this.side('A').filter(u => u.alive);
    if (this.side('A').length > 6 || this.turn <= 1) return;
    const total = live.reduce((s, u) => s + u.slotsN, 0);
    if (total >= 7) return;
    for (let k = 0; k < live.length; k++) {
      const u = live[(this.growPtr || 0) % live.length]; this.growPtr = (this.growPtr || 0) + 1;
      if (u.slotsN < 7) { u.slotsN++; this.push({ t: 'slotUp', u: u.id, n: u.slotsN }); return; }
    }
  }
  dealSkills(a) {
    a.slots.forEach(s => {
      const x = this.r() * 6; const k = x < 3 ? 's1' : x < 5 ? 's2' : 's3';
      s.dealt = k; s.key = k; s.skill = a.kit[k]; s.egoV = null;
    });
  }
  planEnemy(e) {
    const pool = e.skills.filter(s => !s.ph || s.ph <= e.thrIdx);
    const aSlots = []; this.alive('A').forEach(a => a.slots.forEach(s => aSlots.push({ u: a, s })));
    const taken = new Set();
    e.slots.forEach(s => {
      let tot = 0; pool.forEach(p => tot += p.w); let x = this.r() * tot, pick = pool[0];
      for (const p of pool) { x -= p.w; if (x <= 0) { pick = p; break; } }
      s.skill = pick; s.key = 'e';
      const cand = aSlots.filter(c => !c.u.stag);
      if (cand.length) {
        const wts = cand.map(c => taken.has(c.u.id + ':' + c.s.i) ? 1 : 4); let T = wts.reduce((a, b) => a + b, 0), y = this.r() * T, ch = cand[0];
        for (let i = 0; i < cand.length; i++) { y -= wts[i]; if (y <= 0) { ch = cand[i]; break; } }
        s.target = { u: ch.u.id, s: ch.s.i }; taken.add(ch.u.id + ':' + ch.s.i);
      } else { const al = this.alive('A'); if (al.length) s.target = { u: al[this.ri(0, al.length - 1)].id, s: null }; }
    });
  }
  autoTargets(only) {
    const eSlots = []; this.alive('E').forEach(e => { if (!e.stag) e.slots.forEach(s => { if (!s.canceled) eSlots.push({ u: e, s }); }); });
    const used = new Set();
    const mine = []; this.alive('A').forEach(a => a.slots.forEach(s => mine.push({ u: a, s })));
    mine.sort((a, b) => b.s.spd - a.s.spd || a.s.tie - b.s.tie);
    if (only) mine.forEach(m => { if (!only(m) && m.s.target && m.s.target.s != null) used.add(m.s.target.u + ':' + m.s.target.s); });
    /* 先に「相互指定」(敵スキルがこの味方スキルを狙っている)の組を確保し、速度奪取の横取りで潰れないようにする */
    const pre = new Set();
    for (const m of mine) {
      if (only && !only(m)) continue;
      if (m.u.panic > 0 || !m.s.skill || !(m.s.skill.kind === 'atk' || m.s.skill.ego)) continue;
      const c = eSlots.find(c => c.s.skill && c.s.skill.kind === 'atk' && !c.s.used && !used.has(c.u.id + ':' + c.s.i) && c.s.target && c.s.target.u === m.u.id && c.s.target.s === m.s.i);
      if (c) { m.s.target = { u: c.u.id, s: c.s.i }; used.add(c.u.id + ':' + c.s.i); pre.add(m); }
    }
    for (const m of mine) {
      if (only && !only(m)) continue;
      if (pre.has(m)) continue;
      if (m.u.panic > 0) { const f = this.alive('E'); const e = f[this.ri(0, f.length - 1)]; m.s.target = { u: e.id, s: null }; continue; }
      if (m.s.skill && m.s.skill.kind !== 'atk' && !m.s.skill.ego) {
        m.s.target = { u: m.u.id, s: null }; m.s.dtarget = null;
        const cands = eSlots.filter(c => c.s.skill && c.s.skill.kind === 'atk' && !c.s.used && !used.has(c.u.id + ':' + c.s.i) && c.s.target && c.s.target.u === m.u.id);
        cands.sort((a, b) => ((b.s.target.s === m.s.i) - (a.s.target.s === m.s.i)) || (b.s.spd - a.s.spd));
        const pick = cands.find(c => m.s.spd > c.s.spd) || cands[0];
        if (pick) { m.s.dtarget = { u: pick.u.id, s: pick.s.i }; used.add(pick.u.id + ':' + pick.s.i); }
        continue;
      }
      let best = null;
      let bestSc = -1;
      for (const c of eSlots) { if (used.has(c.u.id + ':' + c.s.i)) continue; const stt = this.clashState(m.u, m.s, c.u, c.s); if (stt !== 'mutual' && stt !== 'steal' && stt !== 'def') continue; const sc = (stt === 'mutual' ? 100 : 0) + c.s.spd; if (sc > bestSc) { bestSc = sc; best = c; } }
      if (best) { m.s.target = { u: best.u.id, s: best.s.i }; used.add(best.u.id + ':' + best.s.i); continue; }
      const en = this.alive('E').sort((a, b) => (b.stag > 0) - (a.stag > 0) || a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (en) m.s.target = { u: en.id, s: null };
    }
  }
  /* プレイヤー操作 */
  slotCost(u, s, key) {
    if (key === 'def') return { sin: null, v: 0 };
    if (key === 'ego') { const e = u.ego; return { sin: e.sin, v: 3 }; }
    if (key === s.dealt) return { sin: null, v: 0 };
    return { sin: u.kit[key].sin, v: 1 };
  }
  reserved(except) {
    const rv = {}; SIN_KEYS.forEach(k => rv[k] = 0);
    this.alive('A').forEach(a => a.slots.forEach(s => { if (s === except || !s.key) return; const c = this.slotCost(a, s, s.key); if (c.sin) rv[c.sin] += c.v; }));
    return rv;
  }
  canChoose(u, s, key) {
    if (u.panic > 0 || u.stag > 0) return false;
    if (key === s.key) return true;
    const c = this.slotCost(u, s, key); if (!c.sin) return true;
    const rv = this.reserved(s);
    if (key === 'ego') { if (s && u.slots.some(o => o !== s && o.key === 'ego')) return false; return this.res[c.sin] - rv[c.sin] >= c.v; }
    return this.res[c.sin] - rv[c.sin] >= c.v;
  }
  setSkill(u, i, key) {
    const s = u.slots[i]; if (!s || !this.canChoose(u, s, key)) return false;
    s.key = key;
    if (key === 'ego') { s.egoV = u.sp >= 0 ? 'aw' : 'co'; s.skill = u.ego[s.egoV]; } else { s.skill = u.kit[key]; s.egoV = null; }
    s.dtarget = null;
    if (s.skill.kind !== 'atk' && !s.skill.ego) { s.target = { u: u.id, s: null }; if (!this.manual) this.autoTargets(m => m.s === s); }
    else if (this.manual) { if (s.target && s.target.u === u.id) s.target = null; }
    else if (!s.target || s.target.u === u.id) this.autoTargets(m => m.s === s);
    return true;
  }
  commit() {
    this.alive('A').forEach(a => a.slots.forEach(s => {
      if (!s.key) return; const c = this.slotCost(a, s, s.key);
      if (c.sin) { if (this.res[c.sin] >= c.v) { this.res[c.sin] -= c.v; s.paid = c.v; } else { s.key = s.dealt; s.skill = a.kit[s.dealt]; s.egoV = null; } }
    }));
  }
  resolve() {
    this.ev = []; this.commit();
    this.push({ t: 'resolveStart' });
    const acts = [];
    this.units.forEach(u => { if (u.alive) u.slots.forEach(s => acts.push({ u, slot: s })); });
    acts.sort((a, b) => b.slot.spd - a.slot.spd || a.slot.tie - b.slot.tie);
    for (const act of acts) { if (this.over) break; this.runAction(act); }
    if (!this.over) this.endTurn();
    if (!this.over && this.turnLimit && this.turn >= this.turnLimit) { this.over = true; this.result = 'lose'; this.timeUp = true; }
    this.push({ t: 'turnEnd' });
    if (this.over) this.push({ t: 'end', r: this.result });
    return this.ev;
  }
  endTurn() {
    for (const u of this.units) {
      if (!u.alive) continue;
      if (u.stag > 0) { u.stag--; if (u.stag === 0) this.push({ t: 'recover', u: u.id }); }
      if (u.panic > 0) { u.panic--; if (u.panic === 0) { u.sp = 0; this.push({ t: 'calm', u: u.id }); } }
    }
    for (const u of this.units) {
      if (!u.alive) continue;
      const b = u.st.burn;
      if (b) { const d = Math.round(b.p * BAL.burn * lvMA(u.isAlly ? 5 : 8) / 1.3); b.c--; if (b.c <= 0) delete u.st.burn; this.dealRaw(u, d, null, { k: 'burn' }); if (this.checkOver()) return; }
      if (!u.alive) continue;
      if (u.st.ardor) this.adjSp(u, Math.min(6, u.st.ardor.p));
      if (u.st.frenzy) { const d = Math.min(u.hp - 1, Math.round(u.maxHp * u.st.frenzy.p * .006)); if (d > 0) this.dealRaw(u, d, null, { k: 'frenzy' }); }
      ['tremor', 'bloodmoon', 'ardor', 'frenzy', 'grit', 'mikiri'].forEach(k => { const s = u.st[k]; if (s) { s.c--; if (s.c <= 0) delete u.st[k]; } });
      ['vuln', 'feeble'].forEach(k => { const s = u.st[k]; if (s) { s.age = (s.age || 0) + 1; if (s.age >= 3) delete u.st[k]; } });
      this.fireHook(u, 'turnEnd', {});
      if (u.perm.regen) this.heal(u, u.maxHp * u.perm.regen);
      u.mods = {};
    }
    this.checkOver();
  }
  /* ---------- 勝率推定 ---------- */
  estWin(ua, ska, ub, skb, N) {
    N = N || 160; let w = 0, pa = this.headsProb(ua), pb = this.headsProb(ub);
    const ba = this.clashPow(ua, ub, ska), bb = this.clashPow(ub, ua, skb);
    for (let t = 0; t < N; t++) {
      let na = ska.nC, nb = skb.nC, g = 0;
      while (na > 0 && nb > 0 && g++ < 30) {
        let x = 0, y = 0, tr = 0, A, B;
        do { x = 0; y = 0; for (let i = 0; i < na; i++) if (Math.random() < pa) x++; for (let i = 0; i < nb; i++) if (Math.random() < pb) y++; A = ska.base + x * ska.cp + ba; B = skb.base + y * skb.cp + bb; tr++; } while (A === B && tr < 3);
        if (A === B) { na--; nb--; } else if (A > B) nb--; else na--;
      }
      if (na > 0 && nb === 0) w++;
    }
    return w / N;
  }
  powerRange(u, sk, foe) { const b = this.clashPow(u, foe || null, sk); return [sk.base + b, sk.base + sk.nC * sk.cp + b]; }
}

/* ---------- チーム生成 ---------- */
function buildBattle(spec, opt) {
  // spec: {team:[{sid,ik,lv,sync,st?}], supports:[ids], gifts:[keys], enemies:[{k,lv}]}
  const perm = buildPerm(spec.supports, spec.gifts);
  perm.dmg += spec.plBonus != null ? spec.plBonus : (typeof plBonus === 'function' ? plBonus() : 0);
  const lvB = spec.lvBonus != null ? spec.lvBonus : (typeof clearLvBonus === 'function' ? clearLvBonus() : 0);
  const allies = spec.team.map(t => makeAlly(t.sid, t.ik, t.lv + lvB, t.sync, (t.bond || t.gm) ? (() => { const q = Object.assign({}, perm, { dmg: perm.dmg + (t.bond || 0) }); const g = t.gm; if (g) { q.dmg += g.dmg || 0; q.hp += g.hp || 0; q.def += g.def || 0; q.spStart += g.spStart || 0; q.clash += g.clash || 0; } return q; })() : perm, t.st, t.mast ? Object.assign({}, t.mast) : (typeof getMast === 'function' ? getMast(t.ik) : {})));
  const enemies = spec.enemies.map(e => makeEnemy(e.k, e.lv, e.hpMul));
  const bt = new Battle(allies, enemies, opt); bt.turnLimit = spec.turnLimit || 0; return bt;
}
if (typeof module !== 'undefined') module.exports = { Battle, buildBattle, makeAlly, makeEnemy, mulberry32 };
