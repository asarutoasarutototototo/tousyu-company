'use strict';
/* ============================================================
   LAMPWARDEN COMPANY — state.js
   セーブ・経済・編成・ガチャ・報酬
   ============================================================ */
const SAVE_KEY = 'lampwarden.save.v2';
let MEMSAVE = null;
function defaultState() {
  const owned = {}, equipped = {}, lv = {};
  SINNER_KEYS.forEach(id => { owned[id + '1'] = 1; equipped[id] = id + '1'; lv[id] = 1; });
  return {
    v: 1, owned, equipped, lv, team: SINNER_KEYS.slice(0, 6),
    frag: {}, tickets: 0, pl: { lv: 1, exp: 0 }, clears: 0, mast: {}, oil: OIL_MAX, oilT: Date.now(), thread: 500, shards: 1600, cleared: {}, pity: 0, pity3: 0, pulls: 0,
    mirror: { best: 0, runs: 0, run: null }, lux: {}, set: { mute: false, vol: .8, spd: 1, auto: false }, seen: {}, started: Date.now()
  };
}
let S = defaultState();
function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY); if (raw) { const d = JSON.parse(raw); if (d && d.v === 1) { S = Object.assign(defaultState(), d); SINNER_KEYS.forEach(id => { if (!S.owned[id + '1']) S.owned[id + '1'] = 1; if (!S.equipped[id] || !S.owned[S.equipped[id]]) S.equipped[id] = id + '1'; if (!S.lv[id]) S.lv[id] = 1; }); S.team = (S.team || []).filter(k => SINNER_KEYS.includes(k)); if (!S.team.length) S.team = SINNER_KEYS.slice(); if (S.mirror && S.mirror.run && S.mirror.run.team && S.mirror.run.team.some(m => !SINNERS[m.sid])) S.mirror.run = null; return true; } }
  } catch (e) { if (MEMSAVE) { try { S = Object.assign(defaultState(), JSON.parse(MEMSAVE)); } catch (e2) { } } }
  return false;
}
function saveState() {
  const raw = JSON.stringify(S); MEMSAVE = raw;
  try { localStorage.setItem(SAVE_KEY, raw); } catch (e) { }
}
function resetState() { S = defaultState(); saveState(); }
function regenOil() {
  const now = Date.now(), per = 25000;
  if (S.oil >= OIL_MAX) { S.oilT = now; return; }
  const n = Math.floor((now - S.oilT) / per);
  if (n > 0) { S.oil = Math.min(OIL_MAX, S.oil + n); S.oilT += n * per; if (S.oil >= OIL_MAX) S.oilT = now; }
}
const sLv = sid => S.lv[sid] || 1;
/* ---- プレイヤーレベル / 熟練度 / クリア数ボーナス ---- */
const plNeed = lv => 40 + 12 * lv;
const plBonus = () => Math.min(.10, ((S.pl && S.pl.lv) - 1) * .01 || 0);
const clearLvBonus = () => Math.floor((S.clears || 0) / 100);
const getMast = ik => Object.assign({}, (S.mast || {})[ik] || {});
function addMast(use) {
  S.mast = S.mast || {};
  for (const k in use) { const i = k.lastIndexOf(':'), ik = k.slice(0, i), key = k.slice(i + 1); const m = S.mast[ik] = S.mast[ik] || {}; m[key] = Math.min(1000, (m[key] || 0) + use[k]); }
}
/* ステージ勝利: 経験値付与。通算100クリアごとに全灯守のレベル+1 */
function gainStageExp(st, first) {
  S.pl = S.pl || { lv: 1, exp: 0 }; S.clears = (S.clears || 0) + 1;
  const exp = 10 + (first ? 10 : 0) + (st && st.boss ? 10 : 0); S.pl.exp += exp; let ups = 0;
  while (S.pl.exp >= plNeed(S.pl.lv)) { S.pl.exp -= plNeed(S.pl.lv); S.pl.lv++; ups++; S.oil = Math.max(S.oil, OIL_MAX); S.oilT = Date.now(); }
  return { exp, ups, lv: S.pl.lv, need: plNeed(S.pl.lv), cur: S.pl.exp, clears: S.clears, lvUp100: S.clears % 100 === 0 };
}
const sIdent = sid => IDENTS[S.equipped[sid]];
const sSync = ik => S.owned[ik] || 0;
function teamSpec() {
  return S.team.map(sid => ({ sid, ik: S.equipped[sid], lv: sLv(sid), sync: sSync(S.equipped[sid]) || 1, bond: typeof bondBonus === 'function' ? bondBonus(sid) : 0, gm: typeof gearTotals === 'function' ? gearTotals(sid) : null }));
}
function supportIds() {
  const out = []; SINNER_KEYS.forEach(sid => { if (!S.team.includes(sid)) { const id = sIdent(sid); if (id && id.sup) out.push(id.sup); } }); return out;
}
/* レベル上限: 初期10、章(ボス)クリアごとに+5。80章クリアで410 */
function chaptersCleared() { let n = 0; for (let k = 1; k <= CHAPTERS.length; k++) if (S.cleared[k + '-5']) n++; return n; }
function lvCap() { return Math.min(LV_MAX, 10 + 5 * chaptersCleared()); }
function levelUpMany(sid, n) { let c = 0; while (c < n && levelUp(sid)) c++; return c; }
function levelUp(sid) {
  const lv = sLv(sid); if (lv >= lvCap()) return false; const c = lvCost(lv);
  if (S.thread < c) return false; S.thread -= c; S.lv[sid] = lv + 1; saveState(); return true;
}
function powerOf(sid) { const id = sIdent(sid), lv = sLv(sid); return Math.round((SINNERS[sid].hp * (1 + BAL.hpLvA * (lv - 1)) / 4 + (4 + lv) * 12) * (1 + .05 * (sSync(id.key) - 1)) * (1 + .04 * (id.tier - 1))); }
function stageIndex(id) { return STAGES.findIndex(s => s.id === id); }
function stageUnlocked(id) { const i = stageIndex(id); if (i <= 0) return true; return !!S.cleared[STAGES[i - 1].id]; }
function nextStage() { for (const s of STAGES) if (!S.cleared[s.id]) return s; return STAGES[STAGES.length - 1]; }
function stageRewards(st, first) {
  const boss = !!st.boss; return { thread: Math.round(Math.max(70 + st.lv * 34, st.lv > 30 ? lvCost(st.lv) : 0) * (boss ? 1.6 : 1)), shards: first ? (boss ? 180 : 70) : (boss ? 40 : 15), first };
}
/* ---------- ガチャ ---------- */
function pullOne(forceMin) {
  let r = Math.random(), tier;
  S.pity++; S.pity3++;
  if (S.pity3 >= 40) { tier = 3; }
  else if (r < RATE.r3) tier = 3; else if (r < RATE.r3 + RATE.r2) tier = 2; else tier = 1;
  if (forceMin && tier < forceMin) tier = forceMin;
  if (tier === 3) S.pity3 = 0;
  const sid = SINNER_KEYS[(Math.random() * SINNER_KEYS.length) | 0], pool = IDENT_BY[sid][tier], ik = pool[(Math.random() * pool.length) | 0];
  const res = { ik, sid, tier, isNew: false, sync: 0, frag: 0 };
  if (!S.owned[ik]) { S.owned[ik] = 1; res.isNew = true; res.sync = 1; }
  else if (S.owned[ik] < 4) { S.owned[ik]++; res.sync = S.owned[ik]; }
  else { res.frag = FRAG_GAIN[tier]; S.frag = S.frag || {}; S.frag[sid] = (S.frag[sid] || 0) + res.frag; res.sync = 4; }
  S.pulls++;
  return res;
}
function pullMany(n) {
  const cost = PULL_COST * n; if (S.shards < cost) return null; S.shards -= cost;
  const out = []; let got2 = false;
  for (let i = 0; i < n; i++) { const last = (n >= 10 && i === n - 1 && !got2); const r = pullOne(last ? 2 : 0); if (r.tier >= 2) got2 = true; out.push(r); }
  saveState(); return out;
}
/* ---------- ミラー・ダンジョン(鏡面螺旋) ---------- */
function mirrorNew() {
  const team = S.team.map(sid => ({ sid, ik: S.equipped[sid], lv: Math.max(sLv(sid), 8), sync: sSync(S.equipped[sid]) || 1, hpFrac: 1, sp: 0 }));
  return { floor: 0, step: 0, team, gifts: [], coin: 0, nodes: null, phase: 'map', log: [], cleared: 0, seed: (Math.random() * 1e9) | 0 };
}
function giftPool(minTier, exclude) {
  return GIFT_KEYS.filter(k => GIFTS[k].t >= minTier && !(exclude || []).includes(k));
}
function pickGifts(run, n, tier) {
  const out = [];
  for (let i = 0; i < n; i++) {
    let t = tier || (Math.random() < .12 + run.floor * .1 ? 3 : Math.random() < .5 ? 2 : 1);
    let pool = GIFT_KEYS.filter(k => GIFTS[k].t === t && !run.gifts.includes(k) && !out.includes(k));
    if (!pool.length) pool = GIFT_KEYS.filter(k => !run.gifts.includes(k) && !out.includes(k));
    if (!pool.length) break; out.push(pool[(Math.random() * pool.length) | 0]);
  }
  return out;
}
/* 鏡の迷宮: 現在のレベル上限に応じて敵レベルが上がる */
function mirrorLv(f) { return Math.max(f.lv, Math.round(lvCap() * (f.lv / 28) * .95)); }
function mirrorGenNodes(run) {
  const f = MIRROR_FLOORS[run.floor], cols = [];
  const types = ['battle', 'battle', 'battle', 'elite', 'event', 'rest', 'shop'];
  for (let i = 0; i < 4; i++) {
    const n = 2 + (Math.random() < .45 ? 1 : 0), col = [];
    for (let k = 0; k < n; k++) {
      let t = types[(Math.random() * types.length) | 0];
      if (i === 0 && (t === 'rest' || t === 'shop')) t = 'battle';
      if (i === 3 && Math.random() < .5) t = 'rest';
      col.push(t);
    }
    if (!col.includes('battle') && !col.includes('elite')) col[0] = 'battle';
    cols.push(col);
  }
  cols.push(['boss']);
  return cols;
}
function mirrorEnemies(run, type) {
  const f = MIRROR_FLOORS[run.floor]; const lv = mirrorLv(f) + (type === 'elite' ? 2 : 0) + run.step;
  if (type === 'boss') { const b = f.boss; return [{ k: b, lv: mirrorLv(f) + 4 }, { k: f.pool[0], lv: mirrorLv(f) + 3 }, { k: f.pool[1], lv: mirrorLv(f) + 3 }]; }
  const n = type === 'elite' ? 4 : 3 + (Math.random() < .3 ? 1 : 0), out = [];
  for (let i = 0; i < n; i++) out.push({ k: f.pool[(Math.random() * f.pool.length) | 0], lv: lv + (i === 0 && type === 'elite' ? 1 : 0) });
  return out;
}
