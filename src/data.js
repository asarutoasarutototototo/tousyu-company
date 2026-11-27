'use strict';
/* ============================================================
   NOCTURNE COMPANY — data.js
   罪の属性 / 状態異常 / 灯守 / アイデンティティ / EGO / 敵 / ステージ / ギフト
   ============================================================ */
const SIN_KEYS = ['wrath', 'lust', 'sloth', 'glut', 'greed', 'pride', 'envy'];
const SIN = {
  wrath: { n: '憤怒', c: '#ef4452', d: '#6e1520' },
  lust:  { n: '色欲', c: '#f472a8', d: '#70204c' },
  sloth: { n: '怠惰', c: '#f0c44f', d: '#6e5410' },
  glut:  { n: '暴食', c: '#7ed36f', d: '#2a6126' },
  greed: { n: '強欲', c: '#33d0c4', d: '#0f5f5a' },
  pride: { n: '傲慢', c: '#5b8cff', d: '#1c3794' },
  envy:  { n: '嫉妬', c: '#b46bff', d: '#4a2188' }
};
const TYPE = { slash: { n: '斬撃' }, pierce: { n: '突撃' }, blunt: { n: '打撃' } };
const RES_TIER = [
  { k: 'F', n: '致命', m: 2.0, c: '#ff4d5e' },
  { k: 'W', n: '弱点', m: 1.5, c: '#ffb347' },
  { k: 'N', n: '通常', m: 1.0, c: '#c9c4b8' },
  { k: 'I', n: '耐性', m: 0.5, c: '#6f7a99' }
];
function resTier(m) { return m >= 1.9 ? RES_TIER[0] : m >= 1.4 ? RES_TIER[1] : m >= 0.9 ? RES_TIER[2] : RES_TIER[3]; }

/* 状態異常 */
const ST = {
  burn:    { n: '灼熱', c: '#ff8a3d', g: '火', d: 'ターン終了時、威力×4のダメージを受ける。ターン終了でカウント-1。' },
  bleed:   { n: '出血', c: '#e0314b', g: '血', d: '攻撃コインを使うたび、威力×2のダメージを受ける。使用ごとにカウント-1。' },
  tremor:  { n: '振動', c: '#c9b8ff', g: '震', d: '「振動爆発」で威力×6のダメージ。爆発するとカウントが半分になる。' },
  rupture: { n: '亀裂', c: '#ff5fa2', g: '裂', d: '被弾するたび威力×2の追加ダメージ。被弾ごとにカウント-1。' },
  sink:    { n: '沈降', c: '#5b86e0', g: '沈', d: '被弾するたび威力と同じだけ正気度を失う。被弾ごとにカウント-1。' },
  vuln:    { n: '脆弱', c: '#ff7a7a', g: '脆', d: '威力×4%、受けるダメージが増加する(最大+60%)。' },
  feeble:  { n: '弱化', c: '#9aa3b8', g: '弱', d: '威力×4%、与えるダメージが減少する(最大-50%)。' },
  poise:   { n: '冴え', c: '#f5e6a8', g: '冴', buff: 1, d: '威力×8%の確率でクリティカル(+50%)。クリティカルでカウント-1。' },
  charge:  { n: '充電', c: '#6cf0ff', g: '電', buff: 1, d: '威力×3%与ダメージ増加(最大+45%)。スキル使用でカウント-1。' },
  /* 灯守ごとの固有バフ */
  shell:    { n: '晶殻', c: '#9fd8ff', g: '晶', buff: 1, uq: 'rei', d: '被ダメージを威力×2%軽減(最大-30%)。被弾ごとにカウント-1。' },
  bloodmoon:{ n: '血月', c: '#d4244a', g: '月', buff: 1, uq: 'kuro', d: '攻撃が命中するたび、与ダメージの威力×2%(最大30%)のHPを吸収。ターン終了でカウント-1。' },
  ardor:    { n: '恋慕', c: '#ff8fc0', g: '恋', buff: 1, uq: 'ren', d: 'コイン表確率が威力×1.5%上がる(最大+30%)。ターン終了時に正気度が威力分(最大6)回復し、カウント-1。' },
  dawn:     { n: '暁光', c: '#ffd95a', g: '暁', buff: 1, uq: 'aka', d: '合戦威力が威力÷2上がる(最大+4)。スキル使用でカウント-1。' },
  frenzy:   { n: '狂熱', c: '#ff9a2e', g: '狂', buff: 1, uq: 'rai', d: '与ダメージが威力×2%増加(最大+40%)。ターン終了時に最大HPの威力×0.6%を失う(HP1で止まる)。ターン終了でカウント-1。' },
  grit:     { n: '反骨', c: '#b8a58a', g: '骨', buff: 1, uq: 'tetsu', d: '被弾するたび、攻撃者に威力×2.5のダメージを返す。反撃ごとにカウント-1。ターン終了でもカウント-1。' },
  mikiri:   { n: '見切り', c: '#bfe3ff', g: '見', buff: 1, uq: 'nagi', d: '威力×6%(最大50%)の確率で被弾を無効化。無効化するとカウント-1。ターン終了でもカウント-1。' }
};

/* ---------- 効果テキスト ---------- */
const TOKEN_TXT = { tgt: '対象', self: '自身', rndE: 'ランダムな敵', allE: '敵全体', allies: '味方全体', rndA: 'ランダムな味方' };
function fxText(f) {
  const to = TOKEN_TXT[f.to] || '';
  switch (f.k) {
    case 'st': return `${to}に${ST[f.s].n}${f.p}/${f.c}`;
    case 'cnt': return `${to}の${ST[f.s].n}回数+${f.c}`;
    case 'sp': return `${to}の正気度${f.v > 0 ? '+' : ''}${f.v}`;
    case 'heal': return `${to}のHP${f.pct ? f.v + '%' : f.v}回復`;
    case 'res': return `${f.sin === 'own' ? '自属性' : SIN[f.sin].n}の資源+${f.v}`;
    case 'mod': return `${to}の${{ heads: 'コイン表確率', dmg: '与ダメージ', clash: '合戦威力', def: '被ダメージ' }[f.key]}${f.v > 0 ? '+' : ''}${f.key === 'clash' ? f.v : Math.round(f.v * 100) + '%'}(このターン)`;
    case 'burst': return `対象の振動を爆発`;
    case 'bind': return `対象を拘束(次ターン行動不能)`;
    default: return '';
  }
}
function trigText(t) { return { hit: '命中時', head: '表の時', tail: '裏の時', use: '使用時', win: '合戦勝利時' }[t] || ''; }

/* ---------- スキル生成 ---------- */
function mkSk(key, n, sin, type, base, cp, nC, fx, extra) {
  return Object.assign({ key, n, sin, type, base, cp, nC, fx: fx || [], kind: 'atk' }, extra || {});
}
function descSkill(sk) {
  const parts = [];
  const byCoin = {};
  (sk.fx || []).forEach(f => { const k = f.coin === 'last' ? `最後のコイン` : f.coin === '*' ? '全コイン' : f.coin === undefined ? '' : `コイン${f.coin + 1}`; (byCoin[k] = byCoin[k] || []).push(`${trigText(f.t)}${fxText(f)}`); });
  Object.keys(byCoin).forEach(k => parts.push(`${k ? k + ':' : ''}${byCoin[k].join('、')}`));
  if (sk.exec) parts.push(`対象HP50%未満で与ダメージ+${Math.round(sk.exec * 100)}%`);
  return parts.join(' / ');
}

/* ---------- パッシブ ---------- */
const PASS = {
  ignite:    { n: '点火', d: 'ターン開始時、ランダムな敵に灼熱2/2。', on: 'turnStart', fx: [{ k: 'st', s: 'burn', p: 2, c: 2, to: 'rndE' }] },
  bloodfire: { n: '血に滾る炎', d: '敵を撃破した時、正気度+10・自身に充電2/2。', on: 'kill', fx: [{ k: 'sp', v: 10, to: 'self' }, { k: 'st', s: 'charge', p: 2, c: 2, to: 'self' }] },
  lamplight: { n: '灯火の導き', d: 'ターン開始時、自属性の資源+1。', on: 'turnStart', fx: [{ k: 'res', sin: 'own', v: 1 }] },
  steady:    { n: '平静', d: 'ターン開始時、正気度+3。', on: 'turnStart', fx: [{ k: 'sp', v: 3, to: 'self' }] },
  rhythm:    { n: 'リズム', d: '合戦ラウンドに勝利した時、自身に充電1/1。', on: 'clashWin', fx: [{ k: 'st', s: 'charge', p: 1, c: 1, to: 'self' }] },
  mend:      { n: '繕い', d: 'ターン終了時、HPを最大値の6%回復。', on: 'turnEnd', fx: [{ k: 'heal', v: 6, pct: 1, to: 'self' }] },
  venom:     { n: '毒牙', d: 'コイン命中時、12%で出血1/1を付与。', on: 'hit', ch: .12, fx: [{ k: 'st', s: 'bleed', p: 1, c: 1, to: 'tgt' }] },
  fissure:   { n: '亀裂の気配', d: 'コイン命中時、15%で亀裂1/1を付与。', on: 'hit', ch: .15, fx: [{ k: 'st', s: 'rupture', p: 1, c: 1, to: 'tgt' }] },
  sinker:    { n: '沈む足跡', d: 'コイン命中時、15%で沈降1/1を付与。', on: 'hit', ch: .15, fx: [{ k: 'st', s: 'sink', p: 1, c: 1, to: 'tgt' }] },
  shock:     { n: '震源', d: 'コイン命中時、15%で振動1/1を付与。', on: 'hit', ch: .15, fx: [{ k: 'st', s: 'tremor', p: 1, c: 1, to: 'tgt' }] },
  focus:     { n: '冴えの構え', d: 'ターン開始時、自身に冴え2/2。', on: 'turnStart', fx: [{ k: 'st', s: 'poise', p: 2, c: 2, to: 'self' }] },
  static:    { n: '静電気', d: 'ターン開始時、自身に充電2/2。', on: 'turnStart', fx: [{ k: 'st', s: 'charge', p: 2, c: 2, to: 'self' }] },
  drum:      { n: '鼓舞', d: 'ターン開始時、味方全員の正気度+2。', on: 'turnStart', fx: [{ k: 'sp', v: 2, to: 'allies' }] },
  reaper:    { n: '刈り取り', d: '敵を混乱させた時、正気度+8・HP5%回復。', on: 'stagger', fx: [{ k: 'sp', v: 8, to: 'self' }, { k: 'heal', v: 5, pct: 1, to: 'self' }] },
  gambler:   { n: '賭博師', d: 'ターン開始時、このターンのコイン表確率+10%。', on: 'turnStart', fx: [{ k: 'mod', key: 'heads', v: .1, to: 'self' }] },
  overflow:  { n: '奔流', d: 'EGO使用時、味方全員の正気度+6。', on: 'ego', fx: [{ k: 'sp', v: 6, to: 'allies' }] },
  echo:      { n: '残響', d: '合戦ラウンドに敗北した時、正気度+4。', on: 'clashLose', fx: [{ k: 'sp', v: 4, to: 'self' }] },
  sturdy:    { n: '堅牢', d: '被弾時、20%で自身に冴え1/1。', on: 'damaged', ch: .2, fx: [{ k: 'st', s: 'poise', p: 1, c: 1, to: 'self' }] },
  crown:     { n: '王冠の矜持', d: '正気度20以上の時、与ダメージ+20%。', on: 'always', cond: { sp: ['>=', 20] }, mod: { dmg: .2 } },
  tenacity:  { n: '不屈', d: 'HP50%以下の時、与ダメージ+15%。', on: 'always', cond: { hp: ['<=', .5] }, mod: { dmg: .15 } },
  laststand: { n: '背水', d: 'HP30%以下の時、コイン表確率+15%。', on: 'always', cond: { hp: ['<=', .3] }, mod: { heads: .15 } },
  bulwark:   { n: '防壁', d: 'HP50%以上の時、被ダメージ-8%。', on: 'always', cond: { hp: ['>=', .5] }, mod: { def: .08 } },
  sniper:    { n: '照準', d: 'コイン表確率+6%。', on: 'always', mod: { heads: .06 } },
  vendetta:  { n: '意趣返し', d: '被弾時、30%でそのターンの与ダメージ+8%。', on: 'damaged', ch: .3, fx: [{ k: 'mod', key: 'dmg', v: .08, to: 'self' }] },
  adrenal:   { n: 'アドレナリン', d: '合戦ラウンドに勝利した時、正気度+4。', on: 'clashWin', fx: [{ k: 'sp', v: 4, to: 'self' }] },
  mender:    { n: '手当て', d: 'ターン終了時、HP4%回復・正気度+2。', on: 'turnEnd', fx: [{ k: 'heal', v: 4, pct: 1, to: 'self' }, { k: 'sp', v: 2, to: 'self' }] },
  lastbreath:{ n: '最期の息', d: 'HP30%以下の時、与ダメージ+10%・被ダメージ-15%。', on: 'always', cond: { hp: ['<=', .3] }, mod: { dmg: .1, def: .15 } },
  aegis:     { n: '加護', d: 'ターン開始時、自身に冴え1/1・正気度+2。', on: 'turnStart', fx: [{ k: 'st', s: 'poise', p: 1, c: 1, to: 'self' }, { k: 'sp', v: 2, to: 'self' }] },
  windfall:  { n: '棚ぼた', d: '敵を撃破した時、自属性の資源+1・HP4%回復。', on: 'kill', fx: [{ k: 'res', sin: 'own', v: 1 }, { k: 'heal', v: 4, pct: 1, to: 'self' }] },
  overclock: { n: '過熱', d: '正気度10以上の時、与ダメージ+10%・コイン表確率+3%。', on: 'always', cond: { sp: ['>=', 10] }, mod: { dmg: .1, heads: .03 } },
  rally:     { n: '号令', d: '味方が倒れた時、自身に充電2/2・正気度+8。', on: 'allyDown', fx: [{ k: 'st', s: 'charge', p: 2, c: 2, to: 'self' }, { k: 'sp', v: 8, to: 'self' }] },
  ember_touch:{ n: '熾火', d: 'コイン命中時、12%で灼熱1/1を付与。', on: 'hit', ch: .12, fx: [{ k: 'st', s: 'burn', p: 1, c: 1, to: 'tgt' }] },
  ward:      { n: '護符の心得', d: 'ターン開始時、ランダムな味方に冴え1/1。', on: 'turnStart', fx: [{ k: 'st', s: 'poise', p: 1, c: 1, to: 'rndA' }] },
  tide:      { n: '満ち引き', d: '合戦ラウンドに勝利した時、HP3%回復。', on: 'clashWin', fx: [{ k: 'heal', v: 3, pct: 1, to: 'self' }] },
  predator:  { n: '捕食者', d: '敵を撃破した時、そのターンの与ダメージ+10%・HP6%回復。', on: 'kill', fx: [{ k: 'mod', key: 'dmg', v: .1, to: 'self' }, { k: 'heal', v: 6, pct: 1, to: 'self' }] },
  patience:  { n: '忍耐', d: '被弾時、25%で正気度+3。', on: 'damaged', ch: .25, fx: [{ k: 'sp', v: 3, to: 'self' }] },
  gleam:     { n: '閃き', d: 'コイン命中時、10%で自身に冴え1/1。', on: 'hit', ch: .1, fx: [{ k: 'st', s: 'poise', p: 1, c: 1, to: 'self' }] },
  riposte:   { n: '切り返し', d: '防御に成功した時、自身に充電1/1・正気度+3。', on: 'defWin', fx: [{ k: 'st', s: 'charge', p: 1, c: 1, to: 'self' }, { k: 'sp', v: 3, to: 'self' }] },
  surge:     { n: '高揚', d: 'EGO使用時、HP10%回復・自身に冴え2/2。', on: 'ego', fx: [{ k: 'heal', v: 10, pct: 1, to: 'self' }, { k: 'st', s: 'poise', p: 2, c: 2, to: 'self' }] },
  dusk:      { n: '黄昏', d: 'HP80%以上の時、与ダメージ+8%・コイン表確率+2%。', on: 'always', cond: { hp: ['>=', .8] }, mod: { dmg: .08, heads: .02 } },
  martyr:    { n: '殉教', d: '味方が倒れた時、残った味方全員の与ダメージ+10%(このターン)。', on: 'allyDown', fx: [{ k: 'mod', key: 'dmg', v: .1, to: 'allies' }] },
  insight:   { n: '洞察', d: 'ターン開始時、自属性の資源+1・コイン表確率+4%(このターン)。', on: 'turnStart', fx: [{ k: 'res', sin: 'own', v: 1 }, { k: 'mod', key: 'heads', v: .04, to: 'self' }] },
  echoing:   { n: '木霊', d: 'コイン命中時、10%で正気度+2。', on: 'hit', ch: .1, fx: [{ k: 'sp', v: 2, to: 'self' }] },
  bastion:   { n: '砦', d: 'ターン開始時、味方全員のHP2%回復。', on: 'turnStart', fx: [{ k: 'heal', v: 2, pct: 1, to: 'allies' }] },
  feast:     { n: '饗宴', d: '敵を撃破した時、味方全員の正気度+6。', on: 'kill', fx: [{ k: 'sp', v: 6, to: 'allies' }] },
  grudge:    { n: '怨念', d: '合戦ラウンドに敗北した時、そのターンの与ダメージ+12%。', on: 'clashLose', fx: [{ k: 'mod', key: 'dmg', v: .12, to: 'self' }] },
  second_wind:{ n: '二度目の風', d: '被弾時、15%でHP5%回復。', on: 'damaged', ch: .15, fx: [{ k: 'heal', v: 5, pct: 1, to: 'self' }] },
  focus2:    { n: '冴え渡る', d: '正気度20以上の時、コイン表確率+6%。', on: 'always', cond: { sp: ['>=', 20] }, mod: { heads: .06 } },
  resonate:  { n: '共鳴', d: 'EGO使用時、味方全員に充電2/2。', on: 'ego', fx: [{ k: 'st', s: 'charge', p: 2, c: 2, to: 'allies' }] },
  mercy:     { n: '慈悲', d: 'ターン終了時、ランダムな味方のHP5%回復。', on: 'turnEnd', fx: [{ k: 'heal', v: 5, pct: 1, to: 'rndA' }] },
  cb_atk1:   { n: '研ぎ澄まし', d: '与ダメージ+5%。', on: 'always', mod: { dmg: .05 } },
  cb_atk2:   { n: '武威', d: '与ダメージ+8%。ただし被ダメージ+3%。', on: 'always', mod: { dmg: .08, def: -.03 } },
  cb_atk3:   { n: '殺気', d: 'HP60%以上の時、与ダメージ+8%。', on: 'always', cond: { hp: ['>=', .6] }, mod: { dmg: .08 } },
  cb_atk4:   { n: '追い風', d: '合戦ラウンドに勝利した時、そのターンの与ダメージ+6%。', on: 'clashWin', fx: [{ k: 'mod', key: 'dmg', v: .06, to: 'self' }] },
  cb_clash1: { n: '踏み込み', d: '合戦威力+1。', on: 'always', mod: { clash: 1 } },
  cb_clash2: { n: '気迫', d: 'HP50%以上の時、合戦威力+1。', on: 'always', cond: { hp: ['>=', .5] }, mod: { clash: 1 } },
  cb_clash3: { n: '競り合い', d: '正気度10以上の時、合戦威力+1・与ダメージ+3%。', on: 'always', cond: { sp: ['>=', 10] }, mod: { clash: 1, dmg: .03 } },
  cb_clash4: { n: '勝ち気', d: '合戦ラウンドに敗北した時、そのターンの合戦威力+1。', on: 'clashLose', fx: [{ k: 'mod', key: 'clash', v: 1, to: 'self' }] },
  cb_heads1: { n: '勝負勘', d: 'コイン表確率+4%。', on: 'always', mod: { heads: .04 } },
  cb_heads2: { n: '度胸', d: 'HP50%以下の時、コイン表確率+6%。', on: 'always', cond: { hp: ['<=', .5] }, mod: { heads: .06 } },
  cb_def1:   { n: '頑強', d: '被ダメージ-5%。', on: 'always', mod: { def: .05 } },
  cb_mix1:   { n: '万全', d: '与ダメージ+4%・被ダメージ-3%。', on: 'always', mod: { dmg: .04, def: .03 } },
  cb_mix2:   { n: '昂り', d: '与ダメージ+5%・コイン表確率+3%。', on: 'always', mod: { dmg: .05, heads: .03 } },
  cb_mix3:   { n: '一点集中', d: '合戦威力+1・コイン表確率+2%。', on: 'always', mod: { clash: 1, heads: .02 } },
  cb_mix4:   { n: '先手必勝', d: 'ターン開始時、そのターンの与ダメージ+6%・合戦威力+1。', on: 'turnStart', fx: [{ k: 'mod', key: 'dmg', v: .06, to: 'self' }, { k: 'mod', key: 'clash', v: 1, to: 'self' }] },
  cb_mix5:   { n: '覇気', d: '与ダメージ+6%・合戦威力+1。', on: 'always', mod: { dmg: .06, clash: 1 } },
  e_swift:   { n: '俊敏', d: 'コイン表確率+5%。', on: 'always', mod: { heads: .05 } },
  e_brute:   { n: '剛腕', d: '与ダメージ+10%。', on: 'always', mod: { dmg: .1 } },
  e_tough:   { n: '頑丈', d: '被ダメージ-8%。', on: 'always', mod: { def: .08 } },
  e_pack:    { n: '群れの絆', d: 'ターン開始時、味方全員の与ダメージ+4%(このターン)。', on: 'turnStart', fx: [{ k: 'mod', key: 'dmg', v: .04, to: 'allies' }] },
  e_drain:   { n: '吸精', d: 'コイン命中時、20%で相手の正気度-3。', on: 'hit', ch: .2, fx: [{ k: 'sp', v: -3, to: 'tgt' }] },
  e_curse:   { n: '呪詛', d: 'コイン命中時、15%で相手に脆弱1/1。', on: 'hit', ch: .15, fx: [{ k: 'st', s: 'vuln', p: 1, c: 1, to: 'tgt' }] },
  e_mist:    { n: '霧の帳', d: '被弾時、30%で攻撃者に弱体1/1。', on: 'damaged', ch: .3, fx: [{ k: 'st', s: 'feeble', p: 1, c: 1, to: 'src' }] },
  e_shield:  { n: '鋼の心', d: 'ターン開始時、自身に冴え1/1。', on: 'turnStart', fx: [{ k: 'st', s: 'poise', p: 1, c: 1, to: 'self' }] },
  e_focus:   { n: '狙い澄まし', d: '合戦威力+1。', on: 'always', mod: { clash: 1 } },
  e_frenzy:  { n: '逆上', d: 'HP50%以下の時、与ダメージ+15%。', on: 'always', cond: { hp: ['<=', .5] }, mod: { dmg: .15 } },
  e_vamp:    { n: '吸血', d: 'コイン命中時、20%でHP3%回復。', on: 'hit', ch: .2, fx: [{ k: 'heal', v: 3, pct: 1, to: 'self' }] },
  e_ward:    { n: '守りの歌', d: 'ターン終了時、味方全員のHP3%回復。', on: 'turnEnd', fx: [{ k: 'heal', v: 3, pct: 1, to: 'allies' }] },
  e_thorn:   { n: '棘', d: '被弾時、40%で攻撃者に出血1/1。', on: 'damaged', ch: .4, fx: [{ k: 'st', s: 'bleed', p: 1, c: 1, to: 'src' }] },
  e_regen:   { n: 'ぬくもり', d: 'ターン終了時、HPを5%回復。', on: 'turnEnd', fx: [{ k: 'heal', v: 5, pct: 1, to: 'self' }] },
  e_guard:   { n: '硬い装甲', d: '被ダメージ-10%。', on: 'always', mod: { def: .1 } },
  e_ember:   { n: '燻り', d: 'ターン開始時、ランダムな敵に灼熱1/1。', on: 'turnStart', fx: [{ k: 'st', s: 'burn', p: 1, c: 1, to: 'rndE' }] },
  /* 灯守ごとの固有パッシブ(アイデンティティの段階で解放: ★1=1つ / ★2=2つ / ★3=3つ) */
  rei_a:  { n: '氷華の護り', d: 'ターン開始時、自身に晶殻2/2。', on: 'turnStart', fx: [{ k: 'st', s: 'shell', p: 2, c: 2, to: 'self' }] },
  rei_b:  { n: '割れた鏡', d: 'コイン命中時、20%で脆弱1/2を付与。', on: 'hit', ch: .2, fx: [{ k: 'st', s: 'vuln', p: 1, c: 2, to: 'tgt' }] },
  rei_c:  { n: '零度の矜持', d: '防御・回避・反撃に成功した時、HP4%回復・晶殻2/2。', on: 'defWin', fx: [{ k: 'heal', v: 4, pct: 1, to: 'self' }, { k: 'st', s: 'shell', p: 2, c: 2, to: 'self' }] },
  kuro_a: { n: '朱の嗜好', d: 'コイン命中時、20%で自身に血月1/2。', on: 'hit', ch: .2, fx: [{ k: 'st', s: 'bloodmoon', p: 1, c: 2, to: 'self' }] },
  kuro_b: { n: '亡霊の微笑', d: '敵を混乱させた時、HP8%回復・血月2/2。', on: 'stagger', fx: [{ k: 'heal', v: 8, pct: 1, to: 'self' }, { k: 'st', s: 'bloodmoon', p: 2, c: 2, to: 'self' }] },
  kuro_c: { n: '終わらぬ夜', d: 'HP50%以下の時、与ダメージ+12%・被ダメージ-8%。', on: 'always', cond: { hp: ['<=', .5] }, mod: { dmg: .12, def: .08 } },
  ren_a:  { n: 'ときめき', d: 'ターン開始時、自身に恋慕2/2。', on: 'turnStart', fx: [{ k: 'st', s: 'ardor', p: 2, c: 2, to: 'self' }] },
  ren_b:  { n: '甘い囁き', d: 'コイン命中時、20%で振動1/2を付与。', on: 'hit', ch: .2, fx: [{ k: 'st', s: 'tremor', p: 1, c: 2, to: 'tgt' }] },
  ren_c:  { n: '独り占め', d: '味方が倒れた時、自身に恋慕3/3・このターンの与ダメージ+10%。', on: 'allyDown', fx: [{ k: 'st', s: 'ardor', p: 3, c: 3, to: 'self' }, { k: 'mod', key: 'dmg', v: .1, to: 'self' }] },
  aka_a:  { n: '寝起きの一撃', d: 'ターン開始時、自身に暁光1/2。', on: 'turnStart', fx: [{ k: 'st', s: 'dawn', p: 1, c: 2, to: 'self' }] },
  aka_b:  { n: '重い剣', d: '充電が2以上の時、合戦威力+2。', on: 'always', cond: { st: ['charge', '>=', 2] }, mod: { clash: 2 } },
  aka_c:  { n: '金色の余韻', d: 'EGO使用時、自身に充電3/2・暁光2/2。', on: 'ego', fx: [{ k: 'st', s: 'charge', p: 3, c: 2, to: 'self' }, { k: 'st', s: 'dawn', p: 2, c: 2, to: 'self' }] },
  rai_a:  { n: '燃える笑い', d: 'コイン命中時、15%で灼熱1/2を付与。', on: 'hit', ch: .15, fx: [{ k: 'st', s: 'burn', p: 1, c: 2, to: 'tgt' }] },
  rai_b:  { n: '火遊び', d: 'ターン開始時、自身に狂熱1/2。', on: 'turnStart', fx: [{ k: 'st', s: 'frenzy', p: 1, c: 2, to: 'self' }] },
  rai_c:  { n: '焔の饗宴', d: '敵を撃破した時、自属性の資源+1・ランダムな敵に灼熱2/2。', on: 'kill', fx: [{ k: 'res', sin: 'own', v: 1 }, { k: 'st', s: 'burn', p: 2, c: 2, to: 'rndE' }] },
  tet_a:  { n: '傷だらけの背', d: '被弾時、30%で自身に反骨1/2。', on: 'damaged', ch: .3, fx: [{ k: 'st', s: 'grit', p: 1, c: 2, to: 'self' }] },
  tet_b:  { n: '黙って殴る', d: 'コイン命中時、15%で弱化1/2を付与。', on: 'hit', ch: .15, fx: [{ k: 'st', s: 'feeble', p: 1, c: 2, to: 'tgt' }] },
  tet_c:  { n: '折れない骨', d: 'HP50%以下の時、被ダメージ-12%。', on: 'always', cond: { hp: ['<=', .5] }, mod: { def: .12 } },
  nag_a:  { n: '呼吸', d: 'ターン開始時、自身に見切り3/2。', on: 'turnStart', fx: [{ k: 'st', s: 'mikiri', p: 3, c: 2, to: 'self' }] },
  nag_b:  { n: '残心', d: '敵を撃破した時、正気度+6・冴え2/2。', on: 'kill', fx: [{ k: 'sp', v: 6, to: 'self' }, { k: 'st', s: 'poise', p: 2, c: 2, to: 'self' }] },
  nag_c:  { n: '一刀の理', d: '防御・回避・反撃に成功した時、冴え2/2・正気度+4。', on: 'defWin', fx: [{ k: 'st', s: 'poise', p: 2, c: 2, to: 'self' }, { k: 'sp', v: 4, to: 'self' }] },
  /* 共通の追加パッシブ */
  wary:      { n: '警戒', d: 'ターン開始時、自身に冴え1/1。', on: 'turnStart', fx: [{ k: 'st', s: 'poise', p: 1, c: 1, to: 'self' }] },
  scavenger: { n: '拾い集め', d: '敵を撃破した時、HP8%回復。', on: 'kill', fx: [{ k: 'heal', v: 8, pct: 1, to: 'self' }] },
  /* 敵用 */
  e_scale:   { n: '鱗粉', d: '被弾時、攻撃者に沈降1/1。', on: 'damaged', ch: .5, fx: [{ k: 'st', s: 'sink', p: 1, c: 1, to: 'src' }] },
  e_rage:    { n: '激昂', d: 'ターン開始時、自身の与ダメージ+8%(このターン)。', on: 'turnStart', fx: [{ k: 'mod', key: 'dmg', v: .08, to: 'self' }] }
};

/* 控えにいる時、出撃メンバー全体に効く支援パッシブ */
const SUP = {
  sup_hp:    { n: '守りの灯', d: '出撃中の味方の最大HP+6%。', m: { hpPct: 6 } },
  sup_sp:    { n: '静かな祈り', d: '戦闘開始時、味方の正気度+5。', m: { spStart: 5 } },
  sup_dmg:   { n: '鼓動', d: '味方の与ダメージ+4%。', m: { dmgPct: 4 } },
  sup_heads: { n: '幸運の鈴', d: '味方のコイン表確率+2%。', m: { heads: 0.02 } },
  sup_def:   { n: '薄氷の盾', d: '味方の被ダメージ-4%。', m: { defPct: 4 } }
};
SUP.sup_clash = { n: '拍子木', d: '味方の合戦威力+1。', m: { clash: 1 } };
SUP.sup_regen = { n: '細い灯油', d: 'ターン終了時、味方のHPを2%回復。', m: { regen: 2 } };
SUP.sup_mind  = { n: '凪の心得', d: '味方の正気度の減少を10%軽減。', m: { spGuard: .1 } };
SUP.sup_all   = { n: '灯の備蓄', d: '戦闘開始時、全属性の資源+1。', m: { resAll: 1 } };
SUP.sup_spd   = { n: '駆け足', d: '味方の速度+1。', m: { spd: 1 } };
SUP.sup_guard = { n: '堅い心', d: '味方の正気度の減少を15%軽減。', m: { spGuard: .15 } };
SUP.sup_duo   = { n: '二重の灯', d: '味方の最大HP+4%・被ダメージ-2%。', m: { hpPct: 4, defPct: 2 } };
SUP.sup_edge  = { n: '研ぎ石', d: '味方の与ダメージ+2%・コイン表確率+1%。', m: { dmgPct: 2, heads: .01 } };
SUP.sup_aegis = { n: '星の外套', d: '味方の最大HP+3%・被ダメージ-3%。', m: { hpPct: 3, defPct: 3 } };
SUP.sup_vigor = { n: '奮い立つ灯', d: '味方の与ダメージ+3%・戦闘開始時に正気度+2。', m: { dmgPct: 3, spStart: 2 } };
SUP.sup_calm  = { n: '穏やかな夜', d: '戦闘開始時、味方の正気度+3。ターン終了時HP1%回復。', m: { spStart: 3, regen: 1 } };
SIN_KEYS.forEach(s => { SUP['sup_res_' + s] = { n: SIN[s].n + 'の種火', d: `戦闘開始時、${SIN[s].n}の資源+2。`, m: { res: { [s]: 2 } } }; });

/* ---------- ギフト ---------- */
const GIFTS = {
  g_amulet:  { n: '灯芯の護符', t: 1, d: '最大HP+8%', m: { hpPct: 8 }, g: '護' },
  g_bell:    { n: '空蝉の鈴', t: 1, d: 'コイン表確率+4%', m: { heads: .04 }, g: '鈴' },
  g_gloves:  { n: '擦り切れた手袋', t: 1, d: '与ダメージ+6%', m: { dmgPct: 6 }, g: '手' },
  g_mirror:  { n: '割れた鏡の盾', t: 1, d: '被ダメージ-6%', m: { defPct: 6 }, g: '鏡' },
  g_candle:  { n: '蝋燭の欠片', t: 1, d: '戦闘開始時、正気度+6', m: { spStart: 6 }, g: '蝋' },
  g_oil:     { n: '灯油瓶', t: 1, d: 'ターン終了時HP3%回復', m: { regen: 3 }, g: '油' },
  g_key:     { n: '錆びた鍵', t: 2, d: '合戦威力+1', m: { clash: 1 }, g: '鍵' },
  g_coin:    { n: '欠けた金貨', t: 2, d: 'コイン表確率+3%・与ダメージ+4%', m: { heads: .03, dmgPct: 4 }, g: '金' },
  g_mask:    { n: '笑う仮面', t: 2, d: '正気度が下がりにくくなる(-20%)', m: { spGuard: .2 }, g: '仮' },
  g_ember:   { n: '燻る残り火', t: 2, d: '戦闘開始時、全属性の資源+1', m: { resAll: 1 }, g: '炎' },
  g_tooth:   { n: '獣の牙', t: 2, d: '与ダメージ+8%・最大HP-4%', m: { dmgPct: 8, hpPct: -4 }, g: '牙' },
  g_ribbon:  { n: '誓いのリボン', t: 2, d: '最大HP+6%・被ダメージ-3%', m: { hpPct: 6, defPct: 3 }, g: '誓' },
  g_clock:   { n: '止まった懐中時計', t: 3, d: '速度+1・合戦威力+1', m: { spd: 1, clash: 1 }, g: '時' },
  g_crown:   { n: '無銘の王冠', t: 3, d: '与ダメージ+12%・コイン表確率+4%', m: { dmgPct: 12, heads: .04 }, g: '冠' },
  g_heart:   { n: '灯守の心臓', t: 3, d: '最大HP+15%・ターン終了時HP2%回復', m: { hpPct: 15, regen: 2 }, g: '心' },
  g_dawn:    { n: '夜明けの欠片', t: 3, d: '全属性の資源+2・正気度+8', m: { resAll: 2, spStart: 8 }, g: '暁' }
};
Object.assign(GIFTS, {
  g_thread:  { n: 'ほつれた糸', t: 1, d: '最大HP+5%・戦闘開始時、正気度+3', m: { hpPct: 5, spStart: 3 }, g: '糸' },
  g_whistle: { n: '古い笛', t: 1, d: 'コイン表確率+3%・戦闘開始時、正気度+3', m: { heads: .03, spStart: 3 }, g: '笛' },
  g_lantern: { n: '提灯の灯', t: 1, d: 'ターン終了時HP2%回復・被ダメージ-3%', m: { regen: 2, defPct: 3 }, g: '提' },
  g_pebble:  { n: '丸い小石', t: 1, d: '与ダメージ+4%・被ダメージ-3%', m: { dmgPct: 4, defPct: 3 }, g: '石' },
  g_scale:   { n: '天秤の欠片', t: 2, d: '合戦威力+1・被ダメージ-4%', m: { clash: 1, defPct: 4 }, g: '秤' },
  g_quill:   { n: '羽根ペン', t: 2, d: '与ダメージ+6%・戦闘開始時、正気度+5', m: { dmgPct: 6, spStart: 5 }, g: '筆' },
  g_thorn:   { n: '茨の指輪', t: 2, d: '与ダメージ+6%・ターン終了時HP2%回復', m: { dmgPct: 6, regen: 2 }, g: '茨' },
  g_bone:    { n: '白い骨笛', t: 2, d: '最大HP+8%・正気度が下がりにくくなる(-10%)', m: { hpPct: 8, spGuard: .1 }, g: '骨' },
  g_eye:     { n: '見開いた目', t: 3, d: 'コイン表確率+6%・与ダメージ+8%', m: { heads: .06, dmgPct: 8 }, g: '眼' },
  g_wing:    { n: '蛾の翅', t: 3, d: '速度+1・コイン表確率+4%・ターン終了時HP2%回復', m: { spd: 1, heads: .04, regen: 2 }, g: '翅' },
  g_grail:   { n: '空の聖杯', t: 3, d: '最大HP+12%・被ダメージ-6%・正気度+4', m: { hpPct: 12, defPct: 6, spStart: 4 }, g: '杯' },
  g_bandage: { n: '古い包帯', t: 1, d: '最大HP+4%・ターン終了時HP2%回復', m: { hpPct: 4, regen: 2 }, g: '包' },
  g_pin:     { n: '栞', t: 1, d: 'コイン表確率+2%・与ダメージ+3%・被ダメージ-2%', m: { heads: .02, dmgPct: 3, defPct: 2 }, g: '栞' },
  g_button:  { n: '外れたボタン', t: 1, d: '戦闘開始時、正気度+4・被ダメージ-2%', m: { spStart: 4, defPct: 2 }, g: '釦' },
  g_feather: { n: '白い羽根', t: 1, d: '与ダメージ+5%・戦闘開始時、正気度+2', m: { dmgPct: 5, spStart: 2 }, g: '羽' },
  g_compass: { n: '壊れた羅針盤', t: 2, d: 'コイン表確率+4%・合戦威力+1', m: { heads: .04, clash: 1 }, g: '針' },
  g_hourglass:{ n: '砂時計', t: 2, d: 'ターン終了時HP3%回復・最大HP+5%', m: { regen: 3, hpPct: 5 }, g: '砂' },
  g_weep:    { n: '泣く仮面', t: 2, d: '正気度が下がりにくくなる(-25%)・被ダメージ-3%', m: { spGuard: .25, defPct: 3 }, g: '泣' },
  g_fang:    { n: '折れた牙', t: 2, d: '与ダメージ+9%・コイン表確率+2%', m: { dmgPct: 9, heads: .02 }, g: '折' },
  g_lamp:    { n: '灯守の角灯', t: 3, d: '最大HP+10%・与ダメージ+6%・ターン終了時HP2%回復', m: { hpPct: 10, dmgPct: 6, regen: 2 }, g: '灯' },
  g_bell2:   { n: '夜明けの鐘', t: 3, d: '速度+1・戦闘開始時、正気度+6・合戦威力+1', m: { spd: 1, spStart: 6, clash: 1 }, g: '鐘' },
  g_blade:   { n: '無銘の短剣', t: 3, d: '与ダメージ+14%・コイン表確率+3%', m: { dmgPct: 14, heads: .03 }, g: '剣' },
  g_veil:    { n: '白紗', t: 3, d: '被ダメージ-10%・最大HP+8%・正気度が下がりにくい(-15%)', m: { defPct: 10, hpPct: 8, spGuard: .15 }, g: '紗' },
  g_star:    { n: '落ちた星', t: 3, d: '与ダメージ+10%・全属性の資源+1・合戦威力+1', m: { dmgPct: 10, resAll: 1, clash: 1 }, g: '星' }
});
const GIFT_KEYS = Object.keys(GIFTS);

/* ---------- 灯守 ---------- */
const SINNERS = {
  rei: { n: '零', r: 'REI', sin: 'pride', type: 'slash', st: 'rupture', flv: 'vuln', uq: 'shell', ps: ['rei_a', 'rei_b', 'rei_c'], hp: 250, spd: [4, 7], tag: '遊撃 / 亀裂',
    quote: '「……また、始まったのね。」', bio: '灰銀の髪に、蒼い結晶の刃。眠たげな目のまま戦場へ降り、触れたものを結晶ごと断ち切る。',
    look: { img: 'rei', w: 'greatsword', h: 1.0 } },
  kuro: { n: '紅', r: 'BENI', sin: 'wrath', type: 'slash', st: 'bleed', flv: 'heal', uq: 'bloodmoon', ps: ['kuro_a', 'kuro_b', 'kuro_c'], hp: 280, spd: [3, 6], tag: '前衛 / 出血',
    quote: '「…まだ、終わっていない。」', bio: '血桜の散る戦場で、長い鎌を引きずる亡霊じみた少女。倒れるたびに笑い、紅い月を呼ぶ。',
    look: { img: 'kuro', w: 'greatsword', h: 1.04 } },
  ren: { n: '恋', r: 'REN', sin: 'lust', type: 'pierce', st: 'tremor', flv: 'sp', uq: 'ardor', ps: ['ren_a', 'ren_b', 'ren_c'], hp: 230, spd: [3, 6], tag: '魔術 / 振動',
    quote: '「ねえ、あたしだけを見てて？」', bio: '銀糸の髪に赤いリボン。ハートを刻んだ魔法の矢と光の帯を操り、愛に飢えたまま戦場を舞う少女。',
    look: { img: 'ren', w: 'greatsword', h: 0.94 } },
  aka: { n: '暁', r: 'AKATSUKI', sin: 'sloth', type: 'slash', st: 'charge', flv: 'vuln', uq: 'dawn', ps: ['aka_a', 'aka_b', 'aka_c'], hp: 300, spd: [2, 5], tag: '重斬 / 充電',
    quote: '「ボクの剣は、ちょっと重いよ。」', bio: '身の丈ほどもある黄金の大剣を引きずる、小柄な剣士。眠たげな顔のまま、夜ごと重い一撃を振り下ろす。',
    look: { img: 'aka', w: 'greatsword', h: 1.0 } },
  rai: { n: '雷', r: 'RAI', sin: 'greed', type: 'pierce', st: 'burn', flv: 'res', uq: 'frenzy', ps: ['rai_a', 'rai_b', 'rai_c'], hp: 260, spd: [4, 7], tag: '速攻 / 灼熱',
    quote: '「アハハ、もっと燃やそうよ！」', bio: '金の縁取りの外套を翻し、狂気じみた笑みで焔を撒く少女。追い詰められるほど、楽しそうに笑う。',
    look: { img: 'rai', w: 'greatsword', h: 1.02 } },
  tetsu: { n: '鉄', r: 'TETSU', sin: 'glut', type: 'blunt', st: 'sink', flv: 'feeble', uq: 'grit', ps: ['tet_a', 'tet_b', 'tet_c'], hp: 340, spd: [2, 5], tag: '前衛 / 沈降',
    quote: '「……やるなら、早くしろ。」', bio: '血の染みた釘バットを肩に担ぐ、寡黙な男。白いシャツの袖をまくり、ただ黙って敵を叩き潰す。',
    look: { img: 'tetsu', w: 'greatsword', h: 0.985 } },
  nagi: { n: '凪', r: 'NAGI', sin: 'envy', type: 'slash', st: 'poise', flv: 'exec', uq: 'mikiri', ps: ['nag_a', 'nag_b', 'nag_c'], hp: 240, spd: [4, 8], tag: '居合 / 冴え',
    quote: '「……斬るわ。」', bio: '長い外套の内に刀を隠した、冷静な女剣士。表情ひとつ変えず、紅い閃きだけを残して間合いを断つ。',
    look: { img: 'nagi', w: 'greatsword', h: 0.98 } }
};
const SINNER_KEYS = Object.keys(SINNERS);
/* 準備中の灯守(戦闘・編成・抽出などには登場しない。灯守一覧の紹介ページと鑑賞室のみ) */
const EXTRA_CHARS = {
  mina: { n: '水無月', r: 'MINAZUKI', tag: '格闘 / 準備中', wip: true,
    quote: '「……吸い終わるまで、待ってくれ。」', bio: '黒い長外套に紫煙をくゆらせる青年。気怠げな立ち姿のまま、次の瞬間には脚で夜ごと影を裂く。戦闘への参加に向け、スキルは現在調整中。',
    look: { img: 'mina', w: 'none', h: 1.0 } }
};
const GCH = Object.assign({}, SINNERS, EXTRA_CHARS);

/* アイデンティティ: [名前, S1, S2, S3, 防御種別, パッシブ, 支援, 属性上書き, 見た目上書き] */
/* 灯守の耐性(受けるダメージ倍率)とスキルの属性 */
const ALLY_RT = {
  rei: { slash: 1, pierce: .5, blunt: 2 }, kuro: { slash: .5, pierce: 2, blunt: 1 }, ren: { slash: 2, pierce: 1, blunt: .5 },
  aka: { slash: .5, pierce: 1, blunt: 2 }, rai: { slash: 2, pierce: .5, blunt: 1 }, tetsu: { slash: 1, pierce: 2, blunt: .5 }, nagi: { slash: 1, pierce: .5, blunt: 2 }
};
const ALLY_TYPES = {
  rei: ['slash', 'slash', 'slash'], kuro: ['slash', 'slash', 'pierce'], ren: ['pierce', 'pierce', 'slash'], aka: ['slash', 'slash', 'blunt'],
  rai: ['pierce', 'blunt', 'blunt'], tetsu: ['blunt', 'blunt', 'pierce'], nagi: ['slash', 'slash', 'pierce']
};
Object.keys(SINNERS).forEach(k => { SINNERS[k].rt = ALLY_RT[k]; SINNERS[k].types = ALLY_TYPES[k]; });
const IDENT_DATA = {
  rei: [['夜更けの少女', '切断', '蒼の連閃', '晶華崩落', 'evade', 'fissure', 'sup_def'],
        ['結晶の剣姫', '蒼刃', '氷花の渦', '蒼穹断絶', 'guard', 'focus', 'sup_res_pride'],
        ['零時の執行者', '零距離', '刻の亀裂', '零の終焉', 'counter', 'crown', 'sup_clash'],
         ['雪原の斥候', '氷針', '霜の連射', '白嶺の雨', 'evade', 'sniper', 'sup_heads', { type: 'pierce', st: 'sink' }, null, 1],
         ['結晶の守人', '盾晶', '氷壁の抱擁', '蒼き城壁', 'guard', 'bulwark', 'sup_def', { type: 'blunt', st: 'feeble' }, null, 2],
         ['氷河の裁定者', '審判の刃', '砕氷', '絶対零度', 'counter', 'vendetta', 'sup_clash', { st: 'bleed' }, null, 3],
         ['霜夜の見習い', '霜刃', '凍て風', '白夜の祈り', 'guard', 'patience', 'sup_sp', { type: 'slash', st: 'sink' }, null, 1],
         ['蒼穹の舞姫', '舞氷', '蒼の旋回', '天穹の花', 'evade', 'dusk', 'sup_heads', { st: 'tremor' }, null, 2],
         ['永凍の女帝', '氷帝の笏', '凍土の裁き', '永久凍結', 'counter', 'predator', 'sup_all', { type: 'blunt', st: 'rupture' }, null, 3],
         ['凍夜の灯り番', '灯火の氷柱', '白息', '雪の静寂', 'guard', 'second_wind', 'sup_calm', { type: 'pierce', st: 'poise' }, null, 1],
         ['蒼氷の司祭', '祝氷', '氷環', '聖なる霜', 'counter', 'mercy', 'sup_aegis', { type: 'blunt', st: 'feeble' }, null, 2],
         ['終雪の剣聖', '終雪', '六花', '白銀世界', 'evade', 'focus2', 'sup_edge', { type: 'slash', st: 'sink' }, null, 3],
         ['月影の巡礼者', '月光', '影渡り', '満月の祈り', 'evade', 'lamplight', 'sup_sp', { type: 'pierce', st: 'tremor' }, null, 1],
         ['硝子の騎士', '硝子刃', '砕けた盾', '鏡面の誓い', 'guard', 'sturdy', 'sup_def', { type: 'slash', st: 'vuln' }, null, 2],
         ['時の氷像', '刻氷', '凍れる時', '永遠の零', 'counter', 'tenacity', 'sup_clash', { type: 'pierce', st: 'rupture' }, null, 3]],
  kuro: [['血桜の鎌使い', '桜散らし', '紅の弧', '血月の晩餐', 'guard', 'venom', 'sup_hp'],
         ['緋刃の亡霊', '朱鎌', '血染めの円舞', '紅蓮の簒奪', 'counter', 'reaper', 'sup_res_wrath'],
         ['朧月の葬送者', '散華', '紅月', '終わらぬ葬送', 'evade', 'bloodfire', 'sup_regen'],
         ['月下の傀儡師', '糸桜', '紅糸の舞', '傀儡の月', 'evade', 'adrenal', 'sup_sp', { type: 'pierce', st: 'tremor' }, null, 1],
         ['鎮魂の巫女', '祈りの鎌', '血の祝詞', '赤き鎮魂歌', 'guard', 'mender', 'sup_hp', { type: 'blunt', st: 'sink' }, null, 2],
         ['紅き満月', '満月斬', '血の潮', '月蝕', 'counter', 'lastbreath', 'sup_all', { st: 'burn' }, null, 3],
         ['血桜の学徒', '桜刃', '散り花', '夜桜の舞', 'evade', 'gleam', 'sup_calm', { st: 'bleed' }, null, 1],
         ['墓守の鎌', '葬鎌', '弔いの円', '黄泉返し', 'counter', 'riposte', 'sup_def', { type: 'blunt', st: 'sink' }, null, 2],
         ['紅月の死神', '紅月', '死の円舞', '満月の収穫', 'guard', 'surge', 'sup_hp', { type: 'slash', st: 'rupture' }, null, 3],
         ['桜守の少女', '桜枝', '花吹雪', '夜の花見', 'evade', 'echoing', 'sup_sp', { type: 'pierce', st: 'bleed' }, null, 1],
         ['血の説教師', '血誓', '贖罪の鎌', '聖餐', 'guard', 'bastion', 'sup_hp', { type: 'blunt', st: 'burn' }, null, 2],
         ['朱殷の巫女', '朱殷', '祓い', '黄泉の宴', 'counter', 'grudge', 'sup_vigor', { st: 'tremor' }, null, 3],
         ['血染めの人形師', '糸鋏', '血糸', '赤い劇場', 'evade', 'venom', 'sup_edge', { type: 'pierce', st: 'bleed' }, null, 1],
         ['紅の伶人', '紅笛', '魂寄せ', '紅葉狩り', 'guard', 'steady', 'sup_hp', { type: 'slash', st: 'sink' }, null, 2],
         ['血月の姫', '血月', '紅涙', '朔の夜', 'counter', 'reaper', 'sup_vigor', { type: 'slash', st: 'burn' }, null, 3]],
  ren: [['ハートの射手', '恋の矢', '紅縁の糸', '愛しき崩壊', 'guard', 'shock', 'sup_sp'],
        ['リボンの魔女', '結び目', '赤い輪舞', '永遠の約束', 'evade', 'lamplight', 'sup_res_lust'],
        ['愛に飢えた者', 'ねえ、見て', '愛の濁流', '全部、あたしのもの', 'counter', 'gambler', 'sup_mind'],
         ['薔薇の囚人', '棘の鎖', '赤い茨', '茨の檻', 'guard', 'bulwark', 'sup_def', { type: 'slash', st: 'bleed' }, null, 1],
         ['祈りの恋人', '口づけ', '愛の光', '永遠の誓い', 'counter', 'mender', 'sup_hp', { type: 'blunt', st: 'poise' }, null, 2],
         ['ハートの女王', '女王の命令', '愛の断頭台', 'ハート・フェイタル', 'evade', 'vendetta', 'sup_clash', { type: 'slash', st: 'rupture' }, null, 3],
         ['薔薇の射手', '矢羽', '恋の一矢', 'ハートブレイク', 'evade', 'insight', 'sup_edge', { type: 'pierce', st: 'bleed' }, null, 1],
         ['甘い毒の令嬢', '毒針', '甘噛み', '蜜の檻', 'guard', 'ember_touch', 'sup_mind', { type: 'pierce', st: 'burn' }, null, 2],
         ['愛欲の絶頂', '烙印', '紅蓮の接吻', '焦がれる夜', 'counter', 'martyr', 'sup_clash', { type: 'slash', st: 'burn' }, null, 3],
         ['夜会の見習い', '扇', 'ワルツ', '仮面舞踏会', 'evade', 'echoing', 'sup_heads', { type: 'pierce', st: 'tremor' }, null, 1],
         ['蜜蝋の貴婦人', '蝋涙', '蜜の抱擁', '溶ける夜', 'guard', 'mercy', 'sup_mind', { type: 'blunt', st: 'burn' }, null, 2],
         ['恋獄の主', '鎖', '愛の拷問', '愛欲の牢獄', 'counter', 'grudge', 'sup_clash', { type: 'slash', st: 'rupture' }, null, 3],
         ['夜の花屋', '摘花', '花束', '棘の花言葉', 'guard', 'drum', 'sup_calm', { type: 'pierce', st: 'poise' }, null, 1],
         ['薔薇十字の射手', '十字矢', '聖別の矢', '蕾の祈り', 'evade', 'gambler', 'sup_heads', { type: 'pierce', st: 'rupture' }, null, 2],
         ['愛執の魔女', '呪いの口付け', '恋の秘薬', '執着の果て', 'counter', 'laststand', 'sup_all', { type: 'slash', st: 'sink' }, null, 3]],
  aka: [['大剣の少女', '引きずり斬り', '黄金の弧', '暁の一撃', 'guard', 'sturdy', 'sup_hp'],
        ['金色の剣士', '旋風', '輪廻の斬閃', '天を割る剣', 'counter', 'tenacity', 'sup_def'],
        ['暁を呼ぶ者', '重ね斬り', '黄の渦', '夜明けの断罪', 'evade', 'crown', 'sup_all'],
         ['眠りの番人', '寝返り', '重たい欠伸', '惰眠の斬', 'guard', 'bulwark', 'sup_def', { type: 'blunt', st: 'sink' }, null, 1],
         ['黄金の騎士', '金の突き', '輝剣', '黄金騎士の誓い', 'counter', 'aegis', 'sup_hp', { type: 'pierce', st: 'poise' }, null, 2],
         ['暁の裁定', '天秤斬', '暁光の十字', '日輪', 'evade', 'overclock', 'sup_dmg', { st: 'rupture' }, null, 3],
         ['暁の寝坊助', 'あくび斬', '寝ぼけ突き', '二度寝', 'guard', 'patience', 'sup_regen', { type: 'blunt', st: 'poise' }, null, 1],
         ['朝焼けの大剣', '朝霧', '茜の一閃', '昇る太陽', 'counter', 'dusk', 'sup_dmg', { type: 'slash', st: 'rupture' }, null, 2],
         ['白日の聖剣', '白刃', '天照の剣', '黎明の審判', 'evade', 'rally', 'sup_all', { type: 'slash', st: 'burn' }, null, 3],
         ['朝寝の剣士', '朝刀', '目覚まし', '寝起きの一撃', 'guard', 'second_wind', 'sup_regen', { type: 'slash', st: 'poise' }, null, 1],
         ['茜空の守護者', '茜盾', '夕映え', '黄昏の守り', 'counter', 'bastion', 'sup_aegis', { type: 'blunt', st: 'vuln' }, null, 2],
         ['天道の担い手', '天道', '日蝕', '極光', 'evade', 'resonate', 'sup_all', { type: 'slash', st: 'burn' }, null, 3],
         ['日向の居眠り', '日だまり', 'ふあぁ', 'お昼寝の剣', 'guard', 'steady', 'sup_regen', { type: 'blunt', st: 'sink' }, null, 1],
         ['夕凪の騎士', '夕凪', '茜の盾', '日没の誓い', 'counter', 'rhythm', 'sup_def', { type: 'slash', st: 'bleed' }, null, 2],
         ['暁天の大剣', '暁天', '曙光', '日の出の裁き', 'evade', 'crown', 'sup_dmg', { type: 'slash', st: 'poise' }, null, 3]],
  rai: [['金の外套', '火の粉', '焔の連撃', '業火の外套', 'evade', 'ignite', 'sup_dmg'],
        ['狂笑の焔', '弾ける笑み', '黄金の焔', '燃え尽きるまで', 'counter', 'static', 'sup_res_greed'],
        ['灼熱の笑み', '蜃気楼', '陽炎の舞', 'まだ踊れる', 'guard', 'overflow', 'sup_clash'],
         ['火花の少女', '火花', '爆ぜる指', '花火', 'evade', 'adrenal', 'sup_dmg', { type: 'blunt', st: 'tremor' }, null, 1],
         ['黄金の道化', '道化の一撃', '狂宴のワルツ', '笑う焔', 'counter', 'windfall', 'sup_res_greed', { type: 'slash', st: 'bleed' }, null, 2],
         ['業火の指揮者', '指揮棒', '焔の交響曲', '灼熱の終幕', 'guard', 'overclock', 'sup_all', { type: 'slash' }, null, 3],
         ['導火線の少女', '導火線', '火種', '小さな爆発', 'evade', 'ember_touch', 'sup_res_greed', { type: 'blunt', st: 'burn' }, null, 1],
         ['金色の爆弾魔', '金爆', '連鎖爆破', '黄金の宴', 'guard', 'tide', 'sup_duo', { type: 'blunt', st: 'tremor' }, null, 2],
         ['焔の女王', '女王の火', '烈火の円舞', '万象焼却', 'counter', 'overclock', 'sup_heads', { type: 'slash', st: 'burn' }, null, 3],
         ['線香花火', '火の粉', 'ぱちぱち', '最期の閃光', 'evade', 'echoing', 'sup_spd', { type: 'pierce', st: 'burn' }, null, 1],
         ['黄金の仕掛け人', '導火', '連鎖', '大花火', 'guard', 'feast', 'sup_res_greed', { type: 'blunt', st: 'tremor' }, null, 2],
         ['業火の道化師', '炎の鞭', '笑う業火', '終幕の炎', 'counter', 'resonate', 'sup_vigor', { type: 'slash', st: 'burn' }, null, 3],
         ['雷鳴の見習い', '雷光', 'ビリビリ', '雷の悪戯', 'evade', 'static', 'sup_edge', { type: 'pierce', st: 'tremor' }, null, 1],
         ['稲妻の道化', '稲妻', '雷鳴の拍手', '大団円', 'guard', 'gambler', 'sup_spd', { type: 'blunt', st: 'burn' }, null, 2],
         ['雷帝の戯れ', '雷帝', '雷霆', '天罰の花火', 'counter', 'crown', 'sup_vigor', { type: 'slash', st: 'burn' }, null, 3]],
  tetsu: [['バットの男', '殴打', '振り下ろし', '血染めの一撃', 'guard', 'sinker', 'sup_hp'],
          ['路地裏の用心棒', '薙ぎ払い', '叩き潰し', '粉砕', 'counter', 'sturdy', 'sup_def'],
          ['沈黙の暴風', '一振り', '暴風の連打', '全てを砕く', 'evade', 'tenacity', 'sup_regen'],
         ['夜警の男', '警棒', '踏み込み', '夜警の一撃', 'guard', 'aegis', 'sup_hp', { st: 'vuln' }, null, 1],
         ['鉄の門番', '閂', '鉄槌', '鉄壁', 'counter', 'bulwark', 'sup_def', { st: 'rupture' }, null, 2],
         ['崩壊の巨人', '地鳴り', '崩し', '巨人の拳', 'evade', 'vendetta', 'sup_regen', { st: 'bleed' }, null, 3],
         ['夜勤の守衛', '懐中灯', '見回り', '夜明けの警鐘', 'guard', 'ward', 'sup_guard', { type: 'blunt', st: 'poise' }, null, 1],
         ['鋼のバッター', 'フルスイング', '場外弾', 'サヨナラ', 'counter', 'predator', 'sup_dmg', { type: 'blunt', st: 'vuln' }, null, 2],
         ['鉄屑の王', '鉄塊', '廃墟の咆哮', '崩落の王座', 'guard', 'martyr', 'sup_spd', { st: 'rupture' }, null, 3],
         ['バット磨き', '素振り', '手首返し', '夕暮れの特打', 'guard', 'bastion', 'sup_guard', { type: 'blunt', st: 'rupture' }, null, 1],
         ['廃材の職人', '鉄槌', '組み立て', '鉄屑の城', 'counter', 'second_wind', 'sup_duo', { type: 'blunt', st: 'vuln' }, null, 2],
         ['終末の四番', '終末打', '場外ホームラン', '世界の果て', 'evade', 'feast', 'sup_edge', { type: 'blunt', st: 'rupture' }, null, 3],
         ['夜道の用心棒', '護身棒', '牽制', '用心の一振り', 'guard', 'steady', 'sup_def', { type: 'blunt', st: 'feeble' }, null, 1],
         ['錆鉄の戦士', '錆斧', '鉄の咆哮', '不落の構え', 'counter', 'sturdy', 'sup_aegis', { type: 'blunt', st: 'rupture' }, null, 2],
         ['鉄血の将', '鉄血', '軍靴の響き', '総崩れ', 'evade', 'overflow', 'sup_all', { type: 'blunt', st: 'vuln' }, null, 3]],
  nagi: [['外套の剣客', '抜刀', '紅の太刀', '凪の斬', 'evade', 'focus', 'sup_heads'],
         ['緋の居合', '閃き', '紅い円環', '断ち切る刃', 'counter', 'rhythm', 'sup_dmg'],
         ['静寂の執行者', '刹那', '紅蓮の円舞', '終の一閃', 'guard', 'crown', 'sup_all'],
         ['雨の巡回者', '雨垂れ', '紅の筋', '雨上がり', 'guard', 'mender', 'sup_mind', { type: 'pierce', st: 'sink' }, null, 1],
         ['夜行の剣舞', '舞い斬り', '紅の舞扇', '夜明け前', 'counter', 'windfall', 'sup_dmg', { st: 'bleed' }, null, 2],
         ['無明の太刀', '無明', '朱の雫', '凪の彼方', 'evade', 'lastbreath', 'sup_all', { type: 'slash', st: 'rupture' }, null, 3],
         ['凪の見習い', '抜刀', '峰打ち', '無風の構え', 'guard', 'ward', 'sup_mind', { type: 'pierce', st: 'poise' }, null, 1],
         ['外套の暗殺者', '影斬', '紅の跡', '夜陰', 'evade', 'riposte', 'sup_edge', { type: 'slash', st: 'bleed' }, null, 2],
         ['嵐の前の凪', '静寂', '紅霧の太刀', '凪の終止符', 'counter', 'insight', 'sup_all', { type: 'slash', st: 'sink' }, null, 3],
         ['凪の弟子', '構え', '一文字', '静かな夜', 'guard', 'mercy', 'sup_calm', { type: 'slash', st: 'poise' }, null, 1],
         ['緋色の浪人', '緋刀', '朱雀', '落ち椿', 'counter', 'focus2', 'sup_heads', { type: 'slash', st: 'bleed' }, null, 2],
         ['凪ぎ果てる者', '虚', '無想', '終わりの凪', 'evade', 'grudge', 'sup_aegis', { type: 'pierce', st: 'sink' }, null, 3],
         ['夜雨の旅人', '雨笠', 'しとしと', '濡れ羽', 'evade', 'sinker', 'sup_sp', { type: 'pierce', st: 'sink' }, null, 1],
         ['紅椿の剣客', '椿', '散り椿', '紅の残像', 'guard', 'focus', 'sup_edge', { type: 'slash', st: 'bleed' }, null, 2],
         ['無風の極み', '無風', '凪の太刀', '静寂の果て', 'counter', 'echo', 'sup_vigor', { type: 'slash', st: 'poise' }, null, 3]]
};
const EGO_DATA = {
  rei: ['蒼晶の葬列', 'pride', 'all'], kuro: ['血月は終わらず', 'wrath'],
  ren: ['愛しき檻', 'lust', 2], aka: ['暁を割る剣', 'sloth'], rai: ['狂宴の火', 'greed', 'all'], tetsu: ['砕けぬ意志', 'glut'], nagi: ['凪の果て', 'envy', 3]
};

/* スキル生成: 属性テーマ(st)と風味(flv)から3種+防御を作る */
function themeFx(st, tier, slot, flv, sin, uq) {
  const buff = ST[st].buff, to = buff ? 'self' : 'tgt';
  const A = (p, c, coin, t) => ({ k: 'st', s: st, p, c, to, coin, t });
  const fx = [];
  const CN = (s, c, tt) => ({ k: 'cnt', s, c, to: ST[s].buff ? 'self' : 'tgt', coin: 'last', t: 'hit' });
  if (slot === 1) {
    fx.push(A(1 + (tier > 2 ? 1 : 0), 1, 0, 'hit')); fx.push(CN(st, 1));
  } else if (slot === 2) {
    fx.push(A(2, 2, 1, 'head')); fx.push(CN(st, 1));
    if (flv === 'sp') fx.push({ k: 'sp', v: 5, to: 'self', t: 'use' });
    if (flv === 'feeble') fx.push({ k: 'st', s: 'feeble', p: 2, c: 2, to: 'tgt', coin: 0, t: 'hit' });
    if (flv === 'vuln') fx.push({ k: 'st', s: 'vuln', p: 2, c: 2, to: 'tgt', coin: 0, t: 'hit' });
  } else {
    fx.push(A(3, tier > 1 ? 3 : 2, 'last', 'hit')); fx.push(CN(st, 2));
    if (st === 'tremor') fx.push({ k: 'burst', coin: 'last', t: 'hit', to: 'tgt' });
    if (flv === 'heal') fx.push({ k: 'heal', v: 8, pct: 1, to: 'self', coin: 'last', t: 'hit' });
    if (flv === 'res') fx.push({ k: 'res', sin: 'own', v: 1, t: 'use' });
    if (flv === 'vuln') fx.push({ k: 'st', s: 'vuln', p: 3, c: 2, to: 'tgt', coin: 0, t: 'hit' });
    if (flv === 'feeble') fx.push({ k: 'st', s: 'feeble', p: 3, c: 2, to: 'tgt', coin: 0, t: 'hit' });
  }
  if (uq) {
    const U = (p, c, coin, t) => ({ k: 'st', s: uq, p, c, to: 'self', coin, t });
    if (slot === 1) fx.push(U(1 + (tier > 2 ? 1 : 0), 2, 'last', 'hit'));
    else if (slot === 2) { fx.push(U(2, 2, 1, 'hit')); fx.push(CN(uq, 1)); }
    else { fx.push(U(3 + (tier > 2 ? 1 : 0), 3, 'last', 'hit')); fx.push(CN(uq, 2)); }
  }
  return fx;
}
function buildKit(sd, tier, row) {
  const ov = row[7] || {};
  const sin = ov.sin || sd.sin, st = ov.st || sd.st, flv = sd.flv;
  const TY = sd.types || [sd.type, sd.type, sd.type];
  const type = ov.type || TY[0], type2 = ov.type || TY[1], type3 = TY[2];
  const T = tier - 1;
  const s1 = mkSk('s1', row[1], sin, type, 4 + T, 2, tier >= 3 ? 3 : 2, themeFx(st, tier, 1, flv, sin, sd.uq));
  const s2 = mkSk('s2', row[2], sin, type2, 5 + T, tier >= 2 ? 3 : 2, tier >= 3 ? 4 : 3, themeFx(st, tier, 2, flv, sin, sd.uq));
  const s3 = mkSk('s3', row[3], sin, type3, 6 + T, 3, tier >= 3 ? 5 : 4, themeFx(st, tier, 3, flv, sin, sd.uq), flv === 'exec' ? { exec: .35 } : null);
  const kind = row[4];
  const def = kind === 'guard' ? mkSk('def', '防御', sin, type, 4 + T, 2, 1, [{ k: 'st', s: sd.uq, p: 2, c: 2, to: 'self', t: 'win' }, { k: 'cnt', s: sd.uq, c: 1, to: 'self', t: 'win' }], { kind: 'guard', red: .45 + T * .05 })
            : kind === 'evade' ? mkSk('def', '回避', sin, type, 3 + T, 3, 1, [{ k: 'st', s: sd.uq, p: 2, c: 2, to: 'self', t: 'win' }, { k: 'cnt', s: sd.uq, c: 1, to: 'self', t: 'win' }], { kind: 'evade' })
            : mkSk('def', '反撃', sin, type, 3 + T, 2, 2, [{ k: 'st', s: st, p: 1, c: 1, to: buff(st) ? 'self' : 'tgt', coin: 0, t: 'hit' }, { k: 'st', s: sd.uq, p: 2, c: 2, to: 'self', coin: 0, t: 'hit' }, { k: 'cnt', s: sd.uq, c: 1, to: 'self', coin: 'last', t: 'hit' }], { kind: 'counter' });
  return { s1, s2, s3, def };
  function buff(k) { return ST[k].buff; }
}
function buildEgo(sd, id) {
  const e = EGO_DATA[id], sin = e[1], T = 'ego';
  const st = sd.st, buff = ST[st].buff, to = buff ? 'self' : 'tgt';
  const fxA = [{ k: 'st', s: st, p: 4, c: 3, to, coin: 1, t: 'hit' }, { k: 'sp', v: 10, to: 'allies', t: 'use' }];
  const fxC = [{ k: 'st', s: st, p: 6, c: 4, to, coin: 1, t: 'hit' }, { k: 'sp', v: -8, to: 'self', t: 'use' }];
  fxA.push({ k: 'cnt', s: st, c: 2, to, coin: 'last', t: 'hit' }); fxC.push({ k: 'cnt', s: st, c: 2, to, coin: 'last', t: 'hit' });
  if (sd.uq) { fxA.push({ k: 'st', s: sd.uq, p: 4, c: 3, to: 'self', t: 'use' }); fxC.push({ k: 'st', s: sd.uq, p: 6, c: 4, to: 'self', t: 'use' }); fxA.push({ k: 'cnt', s: sd.uq, c: 2, to: 'self', t: 'use' }); fxC.push({ k: 'cnt', s: sd.uq, c: 2, to: 'self', t: 'use' }); }
  if (st === 'tremor') { fxA.push({ k: 'burst', coin: 'last', t: 'hit', to: 'tgt' }); fxC.push({ k: 'burst', coin: 'last', t: 'hit', to: 'tgt' }); }
  const aw = mkSk('ego', e[0], sin, sd.type, 8, 4, 5, fxA, Object.assign({ ego: 1, cost: { [sin]: 3 }, v: 'aw' }, e[2] ? { aoe: e[2] } : {}));
  const co = mkSk('ego', e[0] + '【侵蝕】', sin, sd.type, 9, 5, 6, fxC, Object.assign({ ego: 1, cost: { [sin]: 3 }, v: 'co' }, e[2] ? { aoe: e[2] } : {}));
  return { n: e[0], sin, cost: { [sin]: 3 }, aw, co };
}
const CB_POOL = Object.keys(PASS).filter(k => k.startsWith('cb_'));
function hashStr(t) { let h = 7; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return h; }
/* パッシブ: 基本1 + 灯守固有3 + 戦闘強化2 = 最大6。★1=2個 / ★2=4個 / ★3=6個 */
function passFull(sd, key, row) {
  const ps = sd.ps || [], h = hashStr(key), used = new Set([row[5]].concat(ps));
  const pick = off => { for (let j = 0; j < CB_POOL.length; j++) { const p = CB_POOL[(h + off * 5 + j * 3) % CB_POOL.length]; if (!used.has(p)) { used.add(p); return p; } } return CB_POOL[0]; };
  const xa = pick(1), xb = pick(2);
  return [row[5], ps[0], ps[1], xa, ps[2], xb].filter(Boolean);
}
/* 同調レベルによるパッシブ解放: n個のうち、基本は同調1、残りは同調2〜4で順に解放 */
function passReqSync(i, n) { return i === 0 ? 1 : Math.min(4, 2 + Math.floor((i - 1) * 3 / Math.max(1, n - 1))); }
const FRAG_GAIN = [0, 3, 10, 45], FRAG_COST = [0, 30, 100, 300];
function passFor(sd, key, row, tier) { return passFull(sd, key, row).slice(0, tier * 2); }
const IDENTS = {}, IDENT_BY = {}, IDENT_LIST = {}; SINNER_KEYS.forEach(id => { IDENT_LIST[id] = []; });
SINNER_KEYS.forEach(id => {
  const sd = SINNERS[id];
  IDENT_DATA[id].forEach((row, i) => {
    const tier = row[9] || (i + 1), key = id + (i + 1);
    const look = Object.assign({}, sd.look, row[8] || {});
    (IDENT_BY[id] = IDENT_BY[id] || {})[tier] = (IDENT_BY[id][tier] || []).concat(key); IDENT_LIST[id].push(key);
    IDENTS[key] = { key, sid: id, tier, n: row[0], look, kit: buildKit(sd, tier, row), pass: passFor(sd, key, row, tier), passFull: passFull(sd, key, row), sup: row[6],
      slots: tier === 3 ? 2 : (tier === 2 && (sd.spd[1] >= 7) ? 2 : 1), sin: (row[7] && row[7].sin) || sd.sin, type: (row[7] && row[7].type) || sd.type, st: (row[7] && row[7].st) || sd.st };
  });
});
const EGOS = {}; SINNER_KEYS.forEach(id => { EGOS[id] = buildEgo(SINNERS[id], id); });

/* ---------- 敵 ---------- */
function ES(n, sin, type, base, cp, nC, fx, w, extra) { return Object.assign(mkSk('e', n, sin, type, base, cp, nC, fx || [], {}), { w: w || 1 }, extra || {}); }
const eSt = (s, p, c, coin, t, to) => ({ k: 'st', s, p, c, coin, t: t || 'hit', to: to || 'tgt' });
const ENEMIES = {
  moth: { n: '灯喰らいの蛾', art: 'moth', hp: 330, spd: [2, 5], slots: 1, sc: 1.0, thr: [.5], rt: { slash: 1.5, pierce: 1, blunt: .75 }, rs: {}, pass: ['e_scale', 'e_swift'],
    skills: [ES('鱗粉', 'envy', 'pierce', 3, 2, 2, [eSt('sink', 1, 2, 0)], 3), ES('燈火啜り', 'envy', 'slash', 4, 2, 3, [eSt('sink', 2, 2, 1, 'head')], 2), ES('羽ばたき', 'envy', 'blunt', 3, 2, 2, [], 1)] },
  hound: { n: '錆び猟犬', art: 'hound', hp: 420, spd: [4, 7], slots: 1, sc: 1.0, thr: [.5], rt: { slash: .75, pierce: 1.5, blunt: 1 }, rs: { wrath: 1.25 }, pass: ['e_pack', 'e_brute'],
    skills: [ES('噛みつき', 'wrath', 'slash', 3, 2, 3, [eSt('bleed', 1, 2, 0)], 3), ES('飛びかかり', 'wrath', 'blunt', 4, 2, 2, [], 2), ES('引き裂き', 'wrath', 'slash', 4, 3, 3, [eSt('bleed', 2, 2, 2, 'hit')], 1)] },
  puppet: { n: '糸切れ人形', art: 'puppet', hp: 400, spd: [2, 6], slots: 1, sc: 1.0, thr: [.5], rt: { slash: 1, pierce: .75, blunt: 1.5 }, rs: { sloth: 1.25 }, pass: ['e_drain', 'e_tough'],
    skills: [ES('糸の鞭', 'sloth', 'slash', 3, 2, 3, [eSt('feeble', 1, 2, 0)], 3), ES('ぎこちない抱擁', 'sloth', 'blunt', 4, 2, 2, [eSt('rupture', 1, 2, 1)], 2), ES('傀儡の舞', 'sloth', 'pierce', 3, 3, 4, [], 1)] },
  shade: { n: '影法師', art: 'shade', hp: 300, spd: [3, 7], slots: 1, sc: 1.0, thr: [.5], rt: { slash: 1, pierce: 1, blunt: 1.5 }, rs: { pride: 1.5, envy: .5 }, pass: ['e_curse', 'e_swift'],
    skills: [ES('影の囁き', 'envy', 'pierce', 3, 2, 3, [eSt('sink', 2, 2, 0)], 3), ES('羨望の爪', 'envy', 'slash', 4, 2, 3, [eSt('vuln', 2, 2, 1, 'head')], 2), ES('成り代わり', 'envy', 'pierce', 3, 3, 3, [{ k: 'sp', v: -8, to: 'tgt', t: 'use' }], 1)] },
  armor: { n: '鐘守の鎧', art: 'armor', hp: 700, spd: [1, 4], slots: 1, sc: 1.15, thr: [.6, .3], rt: { slash: .75, pierce: .75, blunt: 1.5 }, rs: { greed: 1.25 }, pass: ['e_guard', 'e_shield'],
    skills: [ES('鐘突き', 'pride', 'blunt', 5, 2, 2, [eSt('vuln', 1, 2, 0)], 3), ES('錆の薙ぎ', 'pride', 'slash', 4, 3, 3, [eSt('rupture', 2, 2, 2, 'hit')], 2), ES('門閉じ', 'pride', 'blunt', 6, 3, 3, [], 1)] },
  ember_hound: { n: '燼の猟犬', art: 'hound', hp: 470, spd: [4, 8], slots: 1, sc: 1.0, thr: [.5], rt: { slash: .75, pierce: 1.5, blunt: 1 }, rs: { wrath: 1.25 }, pass: ['e_ember', 'e_pack'], pal: { a: '#3a1a18', b: '#ff8a3a', glow: '#ffd23a' },
    skills: [ES('火の粉噛み', 'wrath', 'slash', 3, 2, 3, [eSt('burn', 2, 2, 0)], 3), ES('燼の跳躍', 'wrath', 'blunt', 4, 2, 2, [], 2), ES('焼き裂き', 'wrath', 'slash', 4, 3, 3, [eSt('burn', 2, 2, 2, 'hit'), eSt('bleed', 1, 2, 2)], 1)] },
  silk_puppet: { n: '絹の人形', art: 'puppet', hp: 440, spd: [2, 6], slots: 1, sc: 1.0, thr: [.5], rt: { slash: 1.5, pierce: .75, blunt: 1 }, rs: { lust: 1.25 }, pass: ['e_drain', 'e_focus'], pal: { a: '#4a3a6b', b: '#f0d8ff', glow: '#c08aff' },
    skills: [ES('絹糸の罠', 'sloth', 'pierce', 3, 2, 3, [eSt('tremor', 2, 2, 0)], 3), ES('絡め取り', 'sloth', 'blunt', 4, 2, 2, [eSt('feeble', 2, 2, 1)], 2), ES('糸繰りの宴', 'sloth', 'slash', 4, 3, 3, [eSt('rupture', 2, 2, 2, 'hit')], 1)] },
  glass_shade: { n: '硝子の影', art: 'shade', hp: 360, spd: [3, 8], slots: 1, sc: 1.0, thr: [.5], rt: { slash: 1.5, pierce: .75, blunt: 1 }, rs: { glut: 1.5, envy: .5 }, pass: ['e_thorn', 'e_swift'], pal: { a: '#0e2a3a', b: '#6ae0ff', glow: '#b8f4ff' },
    skills: [ES('映し身', 'envy', 'pierce', 3, 2, 3, [eSt('sink', 2, 2, 0)], 3), ES('砕けた囁き', 'envy', 'slash', 4, 2, 3, [eSt('vuln', 2, 2, 1, 'head')], 2), ES('反射の爪', 'envy', 'pierce', 3, 3, 3, [{ k: 'sp', v: -8, to: 'tgt', t: 'use' }], 1)] },
  bell_knight: { n: '鐘守の騎士', art: 'armor', hp: 780, spd: [1, 5], slots: 1, sc: 1.15, thr: [.6, .3], rt: { slash: .75, pierce: .75, blunt: 1.5 }, rs: { lust: 1.25 }, pass: ['e_guard', 'e_focus'], pal: { a: '#2c3a4a', b: '#9ac4e8', glow: '#cfe8ff' },
    skills: [ES('蒼鐘の一打', 'pride', 'blunt', 5, 2, 2, [eSt('vuln', 2, 2, 0)], 3), ES('騎士の薙ぎ', 'pride', 'slash', 4, 3, 3, [eSt('rupture', 2, 2, 2, 'hit')], 2), ES('鳴り止まぬ鐘', 'pride', 'blunt', 6, 3, 3, [], 1)] },
  lantern_moth: { n: '提灯蛾', art: 'moth', hp: 380, spd: [2, 6], slots: 1, sc: 1.0, thr: [.5], rt: { slash: 1.5, pierce: 1, blunt: .75 }, rs: {}, pass: ['e_regen', 'e_curse'], pal: { a: '#3a2a14', b: '#ffcf6a', glow: '#fff0b0' },
    skills: [ES('灯の鱗粉', 'envy', 'pierce', 3, 2, 2, [eSt('burn', 1, 2, 0)], 3), ES('蜜吸い', 'envy', 'slash', 4, 2, 3, [eSt('sink', 2, 2, 1, 'head')], 2), ES('眩い羽ばたき', 'envy', 'blunt', 3, 2, 2, [eSt('feeble', 1, 2, 0)], 1)] },
  gatekeeper: { n: '錆びた門番ガレス', art: 'armor', boss: 1, hp: 1500, spd: [2, 6], slots: 2, sc: 1.65, thr: [.66, .33], rt: { slash: .75, pierce: 1, blunt: 1.5 }, rs: { greed: 1.5, glut: .75 }, pass: ['e_rage', 'e_guard', 'e_brute', 'e_frenzy', 'e_shield'], pal: { a: '#6b4a3a', b: '#c98a4a', glow: '#ff9a4a' },
    skills: [ES('門番の鐘撃', 'pride', 'blunt', 4, 2, 3, [eSt('vuln', 2, 2, 1)], 3), ES('錆の薙ぎ払い', 'pride', 'slash', 4, 2, 3, [eSt('rupture', 2, 2, 2, 'hit')], 3), ES('門を閉ざす者', 'pride', 'blunt', 5, 3, 3, [{ k: 'sp', v: -10, to: 'tgt', t: 'use' }], 2, { ph: 1 }), ES('崩落', 'wrath', 'blunt', 6, 3, 4, [eSt('bleed', 3, 3, 3, 'hit')], 2, { ph: 2 })] },
  chorus: { n: '仮面の合唱', art: 'chorus', boss: 1, hp: 2000, spd: [3, 7], slots: 2, sc: 1.55, thr: [.66, .33], rt: { slash: 1, pierce: 1.5, blunt: .75 }, rs: { envy: 1.5, lust: .75 }, pass: ['e_drain', 'e_curse', 'e_mist', 'e_ward', 'e_focus'], pal: { a: '#e9e4d6', b: '#b46bff', glow: '#d6a8ff' },
    skills: [ES('名を奪う歌', 'envy', 'pierce', 3, 2, 3, [eSt('sink', 3, 2, 0), { k: 'sp', v: -6, to: 'tgt', t: 'use' }], 3), ES('嘲笑のコーラス', 'envy', 'slash', 4, 2, 3, [eSt('vuln', 3, 2, 1, 'head')], 3), ES('空白の頁', 'envy', 'blunt', 5, 2, 3, [eSt('feeble', 3, 2, 2)], 2, { ph: 1 }), ES('終曲', 'envy', 'pierce', 6, 3, 4, [eSt('rupture', 3, 3, 3)], 2, { ph: 2 })] },
  clock: { n: '時計職人の残響', art: 'clock', boss: 1, hp: 2400, spd: [3, 8], slots: 3, sc: 1.7, thr: [.75, .5, .25], rt: { slash: 1, pierce: 1, blunt: 1.25 }, rs: { sloth: 1.5, pride: .75 }, pass: ['e_rage', 'e_swift', 'e_focus', 'e_frenzy', 'e_vamp'], pal: { a: '#2a2640', b: '#e8c96a', glow: '#ffd979' },
    skills: [ES('秒針の一閃', 'sloth', 'slash', 4, 2, 3, [eSt('bleed', 2, 3, 0)], 3), ES('歯車の巻き込み', 'sloth', 'blunt', 4, 2, 3, [eSt('rupture', 2, 3, 1)], 3), ES('止まる刻', 'sloth', 'pierce', 5, 3, 3, [{ k: 'bind', coin: 'last', t: 'hit', to: 'tgt' }], 1, { ph: 1 }), ES('終鐘', 'sloth', 'blunt', 6, 3, 4, [eSt('vuln', 3, 3, 3)], 3, { ph: 2 }), ES('時の暴走', 'wrath', 'slash', 6, 3, 5, [eSt('burn', 3, 3, 2)], 3, { ph: 3 })] }
};
ENEMIES.ash_wolf = { n: '灰の狼', art: 'hound', hp: 560, spd: [4, 9], slots: 1, sc: 1.0, thr: [.5], rt: { slash: .75, pierce: 1.25, blunt: 1.25 }, rs: { greed: 1.25, wrath: .75 }, pass: ['e_thorn', 'e_pack', 'e_brute'], pal: { a: '#3a3a40', b: '#c8c8d0', glow: '#e8f0ff' },
  skills: [ES('灰燼の牙', 'wrath', 'slash', 4, 2, 3, [eSt('bleed', 2, 2, 0)], 3), ES('遠吠え', 'wrath', 'blunt', 4, 2, 2, [{ k: 'sp', v: -6, to: 'tgt', t: 'use' }], 2), ES('群狼の裂爪', 'wrath', 'slash', 5, 3, 3, [eSt('rupture', 2, 2, 2, 'hit')], 1)] };
ENEMIES.thread_widow = { n: '糸の未亡人', art: 'puppet', hp: 520, spd: [2, 7], slots: 1, sc: 1.0, thr: [.5], rt: { slash: 1.5, pierce: 1, blunt: .75 }, rs: { sloth: .75, lust: 1.25 }, pass: ['e_regen', 'e_drain', 'e_curse'], pal: { a: '#2a1018', b: '#ff5a6e', glow: '#ff8aa0' },
  skills: [ES('赤糸の絡み', 'sloth', 'pierce', 4, 2, 3, [eSt('sink', 2, 2, 0), eSt('tremor', 1, 2, 1)], 3), ES('喪の抱擁', 'sloth', 'blunt', 5, 2, 2, [eSt('feeble', 2, 2, 1)], 2), ES('糸車', 'sloth', 'slash', 4, 3, 3, [eSt('bleed', 2, 2, 2, 'hit')], 1)] };
ENEMIES.prism_shade = { n: '虹の影', art: 'shade', hp: 420, spd: [3, 9], slots: 1, sc: 1.0, thr: [.5], rt: { slash: 1, pierce: 1.5, blunt: .75 }, rs: { envy: .5, pride: 1.5 }, pass: ['e_curse', 'e_mist'], pal: { a: '#2a1a4a', b: '#ff9ae0', glow: '#9aeaff' },
  skills: [ES('七色の囁き', 'envy', 'pierce', 4, 2, 3, [eSt('sink', 2, 2, 0), { k: 'sp', v: -5, to: 'tgt', t: 'use' }], 3), ES('屈折', 'envy', 'slash', 4, 2, 3, [eSt('vuln', 3, 2, 1, 'head')], 2), ES('虹の裂け目', 'envy', 'pierce', 5, 3, 3, [eSt('rupture', 2, 2, 2, 'hit')], 1)] };
ENEMIES.bronze_sentinel = { n: '青銅の番兵', art: 'armor', hp: 920, spd: [1, 5], slots: 1, sc: 1.2, thr: [.6, .3], rt: { slash: .75, pierce: .75, blunt: 1.5 }, rs: { wrath: 1.25 }, pass: ['e_guard', 'e_thorn', 'e_shield'], pal: { a: '#4a3020', b: '#d9a05a', glow: '#ffd890' },
  skills: [ES('青銅の拳', 'pride', 'blunt', 6, 2, 2, [eSt('vuln', 2, 2, 0)], 3), ES('番兵の薙ぎ', 'pride', 'slash', 5, 3, 3, [eSt('rupture', 2, 2, 2, 'hit')], 2), ES('門前払い', 'pride', 'blunt', 7, 3, 3, [{ k: 'sp', v: -8, to: 'tgt', t: 'use' }], 1)] };
ENEMIES.dawn_moth = { n: '暁の蛾', art: 'moth', hp: 460, spd: [3, 8], slots: 1, sc: 1.0, thr: [.5], rt: { slash: 1.5, pierce: 1, blunt: .75 }, rs: { greed: 1.25 }, pass: ['e_scale', 'e_mist', 'e_vamp'], pal: { a: '#4a2a3a', b: '#ffb0c8', glow: '#fff0d0' },
  skills: [ES('暁の鱗粉', 'envy', 'pierce', 4, 2, 2, [eSt('burn', 2, 2, 0), eSt('sink', 1, 2, 1)], 3), ES('曙の羽ばたき', 'envy', 'blunt', 4, 2, 2, [eSt('feeble', 2, 2, 0)], 2), ES('朝焼けの吸血', 'envy', 'slash', 5, 2, 3, [eSt('sink', 2, 2, 1, 'head')], 2)] };
ENEMIES.dawnclock = { n: '夜明けの時計守', art: 'clock', boss: 1, hp: 3600, spd: [4, 9], slots: 3, sc: 1.75, thr: [.75, .5, .25], rt: { slash: 1, pierce: 1, blunt: 1.25 }, rs: { sloth: 1.5, wrath: .75, pride: 1.25 }, pass: ['e_rage', 'e_regen', 'e_brute', 'e_frenzy', 'e_focus', 'e_ward'], pal: { a: '#3a2a4a', b: '#ffb0c8', glow: '#ffe0a0' },
  skills: [ES('暁の秒針', 'sloth', 'slash', 5, 2, 3, [eSt('bleed', 3, 3, 0)], 3), ES('夜明けの歯車', 'sloth', 'blunt', 5, 2, 3, [eSt('rupture', 3, 3, 1)], 3), ES('刻の逆行', 'sloth', 'pierce', 5, 3, 3, [eSt('vuln', 3, 3, 2, 'hit'), { k: 'sp', v: -6, to: 'tgt', t: 'use' }], 2), ES('終焉の鐘', 'sloth', 'blunt', 7, 3, 4, [], 1)] };
ENEMIES.mira = { n: '鏡の女王ミラ', art: 'chorus', boss: 1, hp: 2800, spd: [3, 8], slots: 3, sc: 1.6, thr: [.75, .5, .25], rt: { slash: 1, pierce: 1.25, blunt: 1 }, rs: { envy: 1.5, lust: .75, pride: 1.25 }, pass: ['e_rage', 'e_thorn', 'e_curse', 'e_mist', 'e_ward', 'e_focus'], pal: { a: '#d8f0ff', b: '#5ab0ff', glow: '#bfe4ff' },
  skills: [ES('鏡割り', 'envy', 'slash', 4, 2, 3, [eSt('rupture', 2, 3, 0)], 3), ES('反転の囁き', 'envy', 'pierce', 4, 2, 3, [eSt('sink', 3, 2, 1, 'head'), { k: 'sp', v: -6, to: 'tgt', t: 'use' }], 3), ES('無数の自分', 'envy', 'pierce', 5, 3, 3, [eSt('vuln', 3, 3, 2, 'hit')], 2), ES('砕けた世界', 'envy', 'blunt', 6, 3, 4, [], 1)] };

/* ---------- ステージ ---------- */
const CHAPTERS = [
  { id: 1, n: '第一幕「霧の駅」', theme: 'station', lv: [1, 5], intro: ['案内灯ルーメン: 「ようこそ、指揮者さま。夜に沈んだ街ノクターンへ。」', 'ルーメン: 「灯守たちを率いて、消えた街灯を取り戻してください。」'] },
  { id: 2, n: '第二幕「歌う図書館」', theme: 'library', lv: [6, 10], intro: ['ルーメン: 「図書館は、奪った名前を歌にして閉じ込めています。」', 'ルーメン: 「正気度が尽きれば、貴方の灯守もその歌の一部になる……気をつけて。」'] },
  { id: 3, n: '第三幕「時計塔の頂」', theme: 'clock', lv: [11, 16], intro: ['ルーメン: 「夜明けが来ないのは、塔の時計が止まっているから。」', 'ルーメン: 「針を動かせば、街の夜は終わります。ご武運を。」'] }
  , { id: 4, n: '第四幕「鏡の裏通り」', theme: 'mirror', lv: [17, 22], intro: ['ルーメン: 「時計塔の先に、もう一つの街がありました。鏡に映った、夜のノクターンです。」', 'ルーメン: 「そこでは、灯りさえ逆さに燃えています。どうか、お気をつけて。」'] }
];
const E = (k, lv) => ({ k, lv });
const STAGES = [
  { id: '1-1', ch: 1, n: '霧の改札', lv: 1, en: [E('moth', 1), E('moth', 1)], story: ['改札の奥で、灯りを啜る羽音がする。'] },
  { id: '1-2', ch: 1, n: '錆びた線路', lv: 2, en: [E('hound', 2), E('hound', 2), E('moth', 2)] },
  { id: '1-3', ch: 1, n: '待合室の人形', lv: 3, en: [E('puppet', 3), E('puppet', 3), E('shade', 3)] },
  { id: '1-4', ch: 1, n: '駅長室', lv: 4, en: [E('armor', 4), E('hound', 4), E('hound', 4)] },
  { id: '1-5', ch: 1, n: '門番ガレス', lv: 5, boss: 1, en: [E('gatekeeper', 5), E('moth', 5), E('moth', 5)], story: ['ガレス: 「ここは通さぬ。夜は、終わらせぬ。」', 'アッシュ: 「なら、燃やして通る。」'] },
  { id: '2-1', ch: 2, n: '閲覧室', lv: 6, en: [E('shade', 6), E('shade', 6), E('shade', 6)] },
  { id: '2-2', ch: 2, n: '禁書の回廊', lv: 7, en: [E('puppet', 7), E('puppet', 7), E('hound', 7)] },
  { id: '2-3', ch: 2, n: '鐘楼書庫', lv: 8, en: [E('armor', 8), E('armor', 8), E('shade', 8)] },
  { id: '2-4', ch: 2, n: '灯の消えた書架', lv: 9, en: [E('moth', 9), E('moth', 9), E('moth', 9), E('shade', 9)] },
  { id: '2-5', ch: 2, n: '仮面の合唱', lv: 10, boss: 1, en: [E('chorus', 10), E('shade', 10), E('shade', 10)], story: ['合唱: 「ナマエ、ヲ、チョウダイ。」', 'シオン: 「……あげないよ。これは私のだ。」'] },
  { id: '3-1', ch: 3, n: '螺旋階段', lv: 11, en: [E('hound', 11), E('hound', 11), E('puppet', 11), E('moth', 11)] },
  { id: '3-2', ch: 3, n: '歯車の間', lv: 12, en: [E('armor', 12), E('puppet', 12), E('puppet', 12)] },
  { id: '3-3', ch: 3, n: '止まった振り子', lv: 13, en: [E('shade', 13), E('shade', 13), E('armor', 13), E('moth', 13)] },
  { id: '3-4', ch: 3, n: '鐘の裏側', lv: 14, en: [E('armor', 14), E('armor', 14), E('hound', 14), E('hound', 14)] },
  { id: '3-5', ch: 3, n: '時計職人の残響', lv: 16, boss: 1, en: [E('clock', 16), E('shade', 16), E('moth', 16)], story: ['残響: 「時は止まったまま。それが、一番やさしい。」', 'ルーメン: 「いいえ。夜明けは、必ず来ます。」'] }
  , { id: '4-1', ch: 4, n: '硝子の路地', lv: 17, en: [E('glass_shade', 17), E('glass_shade', 17), E('lantern_moth', 17), E('ember_hound', 17)] },
  { id: '4-2', ch: 4, n: '逆さの回廊', lv: 18, en: [E('silk_puppet', 18), E('silk_puppet', 18), E('glass_shade', 18)] },
  { id: '4-3', ch: 4, n: '燼の市場', lv: 19, en: [E('ember_hound', 19), E('ember_hound', 19), E('lantern_moth', 19), E('lantern_moth', 19)] },
  { id: '4-4', ch: 4, n: '鐘守の間', lv: 20, en: [E('bell_knight', 20), E('bell_knight', 20), E('silk_puppet', 20), E('glass_shade', 20)] },
  { id: '4-5', ch: 4, n: '鏡の女王ミラ', lv: 22, boss: 1, en: [E('mira', 22), E('bell_knight', 22), E('glass_shade', 22)], story: ['ミラ: 「あなたたちの影は、私のもの。灯りも、名前も、全部映してあげる。」', 'ルーメン: 「鏡は、割れるためにあります。——行きましょう。」'] }
];
/* 属性耐性: 敵は ×2.0 / ×1.0 / ×0.5 のいずれかに統一 */
Object.values(ENEMIES).forEach(e => { for (const t in e.rt) e.rt[t] = e.rt[t] >= 1.2 ? 2 : e.rt[t] <= .8 ? .5 : 1; });
function rtName(m) { return m >= 2 ? '×2.0' : m <= .5 ? '×0.5' : '×1.0'; }
const CHAPTER5 = { id: 5, n: '第五幕「夜明けの回廊」', theme: 'clock', lv: [23, 28], intro: ['ルーメン: 「鏡の街の向こうに、夜明けへ続く回廊があります。」', 'ルーメン: 「これが最後の道です。灯守たちと、どうか最後まで。」'] };
CHAPTERS.push(CHAPTER5);
STAGES.push(
  { id: '5-1', ch: 5, n: '朝焼けの回廊', lv: 23, en: [E('dawn_moth', 23), E('dawn_moth', 23), E('ash_wolf', 23), E('prism_shade', 23)] },
  { id: '5-2', ch: 5, n: '灰の庭', lv: 24, en: [E('ash_wolf', 24), E('ash_wolf', 24), E('thread_widow', 24)] },
  { id: '5-3', ch: 5, n: '虹の礼拝堂', lv: 25, en: [E('prism_shade', 25), E('prism_shade', 25), E('dawn_moth', 25), E('thread_widow', 25)] },
  { id: '5-4', ch: 5, n: '青銅の門', lv: 26, en: [E('bronze_sentinel', 26), E('bronze_sentinel', 26), E('ash_wolf', 26)] },
  { id: '5-5', ch: 5, n: '夜明けの時計守', lv: 28, boss: 1, en: [E('dawnclock', 28), E('bronze_sentinel', 28), E('prism_shade', 28)], story: ['時計守: 「夜が明ければ、君たちは皆、消えてしまう。それでも進むのか。」', 'ルーメン: 「消えません。朝は、灯りを奪うものではありませんから。」'] }
);
const LUX = [
  { id: 'thread', n: '糸の洞窟', d: '「糸」を集める鉱山。', theme: 'station', rows: [
    { n: 'Lv5', lv: 5, en: [E('puppet', 5), E('puppet', 5), E('puppet', 5)], r: { thread: 260 } },
    { n: 'Lv10', lv: 10, en: [E('puppet', 10), E('armor', 10), E('puppet', 10)], r: { thread: 520 } },
    { n: 'Lv15', lv: 15, en: [E('armor', 15), E('armor', 15), E('puppet', 15)], r: { thread: 900 } },
    { n: 'Lv20', lv: 20, en: [E('silk_puppet', 20), E('bell_knight', 20), E('silk_puppet', 20)], r: { thread: 1400 } },
    { n: 'Lv25', lv: 25, en: [E('bell_knight', 25), E('bell_knight', 25), E('silk_puppet', 25)], r: { thread: 2000 } },
    { n: 'Lv30', lv: 30, en: [E('bronze_sentinel', 30), E('thread_widow', 30), E('bronze_sentinel', 30)], r: { thread: 3000 } }] },
  { id: 'shard', n: '星屑の礼拝堂', d: '「星屑」が降る静かな礼拝堂。', theme: 'library', rows: [
    { n: 'Lv5', lv: 5, en: [E('shade', 5), E('shade', 5), E('moth', 5)], r: { shards: 120 } },
    { n: 'Lv10', lv: 10, en: [E('shade', 10), E('shade', 10), E('hound', 10)], r: { shards: 220 } },
    { n: 'Lv15', lv: 15, en: [E('shade', 15), E('moth', 15), E('moth', 15), E('hound', 15)], r: { shards: 360 } },
    { n: 'Lv20', lv: 20, en: [E('glass_shade', 20), E('lantern_moth', 20), E('ember_hound', 20), E('glass_shade', 20)], r: { shards: 520 } },
    { n: 'Lv25', lv: 25, en: [E('glass_shade', 25), E('glass_shade', 25), E('lantern_moth', 25), E('ember_hound', 25)], r: { shards: 740 } },
    { n: 'Lv30', lv: 30, en: [E('prism_shade', 30), E('dawn_moth', 30), E('ash_wolf', 30), E('prism_shade', 30)], r: { shards: 1000 } }] },
  { id: 'ticket', n: '掃討券の坑道', d: '「掃討券」を掘り出す坑道。難易度が上がるごとに入手枚数が1枚ずつ増える。', theme: 'clock', rows: [
    { n: 'Lv5', lv: 5, en: [E('puppet', 5), E('puppet', 5), E('puppet', 5)], r: { tickets: 1 } },
    { n: 'Lv10', lv: 10, en: [E('puppet', 10), E('armor', 10), E('puppet', 10)], r: { tickets: 2 } },
    { n: 'Lv15', lv: 15, en: [E('armor', 15), E('armor', 15), E('puppet', 15)], r: { tickets: 3 } },
    { n: 'Lv20', lv: 20, en: [E('silk_puppet', 20), E('bell_knight', 20), E('silk_puppet', 20)], r: { tickets: 4 } },
    { n: 'Lv25', lv: 25, en: [E('bell_knight', 25), E('bell_knight', 25), E('silk_puppet', 25)], r: { tickets: 5 } },
    { n: 'Lv30', lv: 30, en: [E('bronze_sentinel', 30), E('thread_widow', 30), E('bronze_sentinel', 30)], r: { tickets: 6 } }] }
];

/* 鏡面螺旋 */
const MIRROR_FLOORS = [
  { n: '第一層「硝子の回廊」', lv: 8, theme: 'mirror', pool: ['moth', 'hound', 'puppet', 'shade'], boss: 'gatekeeper' },
  { n: '第二層「反転の礼拝堂」', lv: 13, theme: 'mirror', pool: ['shade', 'puppet', 'armor', 'hound', 'glass_shade', 'silk_puppet'], boss: 'chorus' },
  { n: '第三層「砕けた時計塔」', lv: 18, theme: 'mirror', pool: ['armor', 'shade', 'hound', 'moth', 'bell_knight', 'ember_hound', 'lantern_moth'], boss: 'clock' },
  { n: '第四層「逆さの天蓋」', lv: 23, theme: 'mirror', pool: ['ash_wolf', 'thread_widow', 'prism_shade', 'bell_knight', 'dawn_moth', 'silk_puppet'], boss: 'mira' },
  { n: '第五層「夜明け前」', lv: 28, theme: 'mirror', pool: ['ash_wolf', 'thread_widow', 'prism_shade', 'bronze_sentinel', 'dawn_moth'], boss: 'dawnclock' }
];
const MIRROR_EVENTS = [
  { n: '泣いている鏡', d: '鏡の中の自分が、助けを求めている。', ch: [
    { t: '手を伸ばす', r: 'heal', msg: '鏡が静まり、全員のHPが20%回復した。' },
    { t: '見なかったことにする', r: 'coin', msg: '床に落ちていたコインを拾った(+60)。' }] },
  { n: '蝋燭の祭壇', d: '蝋燭が一本だけ灯っている。', ch: [
    { t: '祈る', r: 'sp', msg: '全員の正気度が+15された。' },
    { t: '蝋を持ち帰る', r: 'gift', msg: 'ギフトを一つ手に入れた。' }] },
  { n: '無人の賭場', d: '席には、誰もいない。', ch: [
    { t: '全額を賭ける', r: 'gamble', msg: '' },
    { t: '立ち去る', r: 'none', msg: '何も起こらなかった。' }] },
  { n: '傷だらけの旅人', d: '旅人は傷を負いながら笑っている。', ch: [
    { t: '手当てをする', r: 'heal', msg: '旅人は礼を言って消えた。全員のHPが20%回復した。' },
    { t: '話だけ聞く', r: 'coin', msg: '旅人から情報料をもらった(+60)。' }] },
  { n: '逆さの井戸', d: '覗き込むと、底から灯りが昇ってくる。', ch: [
    { t: '水を汲む', r: 'sp', msg: '冷たい水で頭が冴えた。全員の正気度が+15された。' },
    { t: '灯りを掬う', r: 'gift', msg: '井戸の底から、何かを引き上げた。' }] },
  { n: '紙細工の楽団', d: '誰もいない舞台で、楽器だけが鳴っている。', ch: [
    { t: '聴き入る', r: 'heal', msg: '穏やかな旋律に、全員のHPが20%回復した。' },
    { t: '楽器を拾う', r: 'coin', msg: '楽器の中から硬貨がこぼれた(+60)。' }] },
  { n: '終わらない双六', d: '盤の上に、駒が一つだけ残っている。', ch: [
    { t: '賽を振る', r: 'gamble', msg: '' },
    { t: '駒を進めずに去る', r: 'none', msg: '何も起こらなかった。' }] },
  { n: '眠る司書', d: '司書は机に突っ伏して、寝息を立てている。', ch: [
    { t: '本を借りる', r: 'gift', msg: '司書の机から、ギフトを一つ借りた。' },
    { t: '毛布をかける', r: 'sp', msg: '司書が微笑んだ気がした。全員の正気度が+15された。' }] },
  { n: '朽ちた灯台', d: '灯台の火は消えているのに、光だけが回っている。', ch: [
    { t: '階段を登る', r: 'gift', msg: '最上階で、ギフトを一つ見つけた。' },
    { t: '下で休む', r: 'heal', msg: '穏やかな光に包まれ、全員のHPが20%回復した。' }] },
  { n: '値札のない露店', d: '店主は何も言わず、こちらを見ている。', ch: [
    { t: '何かを買う', r: 'gamble', msg: '' },
    { t: '会釈して去る', r: 'coin', msg: '去り際に、店主がコインを握らせてくれた(+60)。' }] },
  { n: '歌う井戸端', d: '子どもたちの歌声が、水面から聞こえる。', ch: [
    { t: '一緒に歌う', r: 'sp', msg: '歌い終えると、全員の正気度が+15された。' },
    { t: '耳を傾ける', r: 'heal', msg: '歌が静まり、全員のHPが20%回復した。' }] }
];

/* ---------- 成長・経済 ---------- */
const LV_MAX = 410;
const lvCost = lv => lv <= 30 ? 50 + lv * 45 : 1400 + 30 * (lv - 30);
const PULL_COST = 160;
const OIL_MAX = 99, STAGE_OIL = 6;
const RATE = { r3: .04, r2: .22 };
