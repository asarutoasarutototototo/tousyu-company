/* ============================================================
   追加モード: 無限回廊(階層攻略) ・ 訓練場(敵・Lvを選んで模擬戦)
   ============================================================ */
const TOWER_OIL = 5, TOWER_MILE = [5, 10, 15, 20, 30, 40, 50, 75, 100];
function towerSt() { if (!S.tower) S.tower = { best: 0, sel: 1, runs: 0 }; return S.tower; }
function towerFloor(f) {
  const boss = f % 5 === 0, lv = f <= 40 ? Math.max(1, Math.round(1 + (f - 1) * .7)) : Math.min(400, Math.round(28 + (f - 40) * 2)), pool = f >= 25 ? ['hound', 'puppet', 'shade', 'armor', 'ember_hound', 'silk_puppet', 'glass_shade', 'bell_knight', 'ash_wolf', 'thread_widow', 'prism_shade', 'bronze_sentinel', 'dawn_moth'] : f >= 12 ? ['moth', 'hound', 'puppet', 'shade', 'armor', 'ember_hound', 'silk_puppet', 'glass_shade', 'bell_knight', 'lantern_moth'] : f >= 4 ? ['moth', 'hound', 'puppet', 'shade', 'armor'] : ['moth', 'hound', 'puppet', 'shade'];
  let r = f * 9301 + 49297; const rnd = n => { r = (r * 9301 + 49297) % 233280; return Math.floor(r / 233280 * n); };
  const en = [];
  if (boss) { en.push({ k: ['gatekeeper', 'chorus', 'clock', 'mira', 'dawnclock'][(f / 5 - 1) % 5], lv }); en.push({ k: pool[rnd(pool.length)], lv: Math.max(1, lv - 2) }); en.push({ k: pool[rnd(pool.length)], lv: Math.max(1, lv - 2) }); }
  else { const n = f < 3 ? 2 : 3; for (let i = 0; i < n; i++) en.push({ k: pool[rnd(pool.length)], lv }); }
  const theme = ['station', 'library', 'clock', 'mirror', 'clock'][Math.floor((f - 1) / 5) % 5];
  return { f, boss, lv, en, theme, rw: { thread: Math.max(120 + 30 * f, lv > 30 ? Math.round(lvCost(lv) * .8) : 0) + (boss ? 400 + (lv > 30 ? lvCost(lv) : 0) : 0), shards: 20 + 6 * f + (boss ? 200 : 0) } };
}
function enemyCards(en) {
  return [...new Map(en.map(e => [e.k, e])).values()].map(e => { const d = ENEMIES[e.k]; return `<div class="ecard"><canvas width="208" height="192" data-art="${d.art}" data-k="${e.k}" data-boss="${d.boss ? 1 : 0}"></canvas>${esc(d.n)}<br>Lv${e.lv}<span class="epass">${['slash', 'pierce', 'blunt'].map(x => TYPE[x].n[0] + rtName(d.rt[x] || 1).slice(1)).join(' ')}<br>${(d.pass || []).map(p => PASS[p] ? PASS[p].n : '').join('・')}</span></div>`; }).join('');
}
function weakLines(en) {
  return [...new Set(en.map(e => e.k))].map(k => { const d = ENEMIES[k]; const w = Object.entries(d.rt).filter(x => x[1] > 1).map(x => TYPE[x[0]].n); const wr = Object.entries(d.rs).filter(x => x[1] > 1).map(x => SIN[x[0]].n); return `<div class="sub">${esc(d.n)}: 弱点 ${[...w, ...wr].join('・') || '—'}</div>`; }).join('');
}
function scrTower() {
  setScene('plain', 'clock'); setTop('無限回廊', true);
  const T = towerSt(); T.sel = Math.max(1, Math.min(T.sel, T.best + 1)); const fl = towerFloor(T.sel), first = T.sel > T.best, k = first ? 1 : .4;
  const nextMile = TOWER_MILE.find(m => m > T.best);
  scr(`<div class="sec-h"><h2>無限回廊</h2><span class="eyebrow">INFINITE CORRIDOR / 灯油 ${TOWER_OIL}</span></div>
  <div class="two" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)">
  <div class="panel cut pad"><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><button class="btn sm" data-act="tsel" data-d="-5" ${T.sel <= 1 ? 'disabled' : ''}>«</button><button class="btn sm" data-act="tsel" data-d="-1" ${T.sel <= 1 ? 'disabled' : ''}>‹</button>
  <div style="flex:1;text-align:center"><div class="eyebrow">FLOOR</div><div class="num" style="font-size:44px;font-family:var(--f-disp);line-height:1">${fl.f}${fl.boss ? ' <small style="font-size:14px;color:#ff8a8a">BOSS</small>' : ''}</div></div>
  <button class="btn sm" data-act="tsel" data-d="1" ${T.sel > T.best ? 'disabled' : ''}>›</button><button class="btn sm" data-act="tsel" data-d="5" ${T.sel > T.best ? 'disabled' : ''}>»</button></div>
  <div class="ecards" style="display:flex;gap:10px;flex-wrap:wrap;margin:14px 0">${enemyCards(fl.en)}</div>${weakLines(fl.en)}
  <div class="rew" style="margin-top:10px"><span>糸 +${Math.round(fl.rw.thread * k)}</span><span>星屑 +${Math.round(fl.rw.shards * k)}</span>${first ? '<span>(初踏破)</span>' : '<span>(再挑戦 ×0.4)</span>'}</div>
  <div style="margin-top:12px"><button class="btn pri big" data-act="tgo" ${S.oil < TOWER_OIL ? 'disabled' : ''}>${S.oil < TOWER_OIL ? '灯油が足りません' : '挑戦'}</button></div></div>
  <div class="panel pad"><dl class="kv"><dt>最高到達</dt><dd class="num">${T.best} 階</dd><dt>挑戦回数</dt><dd class="num">${T.runs}</dd><dt>次の節目</dt><dd class="num">${nextMile ? nextMile + ' 階' : '—'}</dd></dl>
  <p style="color:var(--dim);font-size:12px;margin-top:10px">5階ごとにボスが現れ、階が進むほど敵のレベルが上がります。節目の階(5・10・15・20…)を初めて踏破すると星屑のボーナスがあります。</p></div></div>`);
}
function startTower() {
  const T = towerSt(), fl = towerFloor(T.sel); if (S.oil < TOWER_OIL) { toast(`灯油が足りません (${TOWER_OIL}必要)`); return; }
  S.oil -= TOWER_OIL; S.oilT = Date.now(); T.runs++; saveState(); refreshRes();
  launchBattle({ title: `無限回廊 ${fl.f}階`, theme: fl.theme, boss: fl.boss, battle: { team: teamSpec(), supports: supportIds(), gifts: [], enemies: fl.en.map(e => ({ k: e.k, lv: e.lv })) } }, {
    onResult: win => {
      if (!win) return { html: '', buttons: [{ t: 'もう一度', cls: 'pri', fn: () => startTower() }, { t: '戻る', fn: () => go('tower') }] };
      const first = fl.f > T.best, k = first ? 1 : .4, th = Math.round(fl.rw.thread * k), sh = Math.round(fl.rw.shards * k);
      let mile = 0; if (first && TOWER_MILE.includes(fl.f)) mile = 300 + fl.f * 10;
      S.thread += th; S.shards += sh + mile; if (first) { T.best = fl.f; T.sel = fl.f + 1; } saveState(); bump('win'); refreshRes();
      const btns = []; if (first && S.oil >= TOWER_OIL) btns.push({ t: `次へ ${fl.f + 1}階`, cls: 'pri', fn: () => startTower() });
      btns.push({ t: '戻る', cls: btns.length ? '' : 'pri', fn: () => go('tower') });
      return { html: `<div class="rew" style="justify-content:center"><span>糸 +${th}</span><span>星屑 +${sh}</span>${mile ? `<span>節目ボーナス 星屑 +${mile}</span>` : ''}</div>`, buttons: btns };
    }
  });
}

/* ---------- 訓練場 ---------- */
let TR = { k: 'moth', lv: 5, n: 2 };
function scrTrain() {
  setScene('plain', 'station'); setTop('訓練場', true);
  const keys = Object.keys(ENEMIES), en = Array.from({ length: ENEMIES[TR.k].boss ? 1 : TR.n }, () => ({ k: TR.k, lv: TR.lv }));
  const ch = keys.map(k => `<button class="tab ${k === TR.k ? 'on' : ''}" data-act="trk" data-k="${k}">${esc(ENEMIES[k].n)}</button>`).join('');
  scr(`<div class="sec-h"><h2>訓練場</h2><span class="eyebrow">TRAINING / 消費なし・報酬なし</span></div>
  <div class="panel pad"><h4 style="margin-bottom:8px">相手を選ぶ</h4><div class="tabs">${ch}</div>
  <div style="display:flex;gap:18px;flex-wrap:wrap;align-items:center;margin:10px 0">
    <div>レベル <button class="btn sm" data-act="trlv" data-d="-5">-5</button> <button class="btn sm" data-act="trlv" data-d="-1">-1</button> <b class="num" style="display:inline-block;min-width:44px;text-align:center;font-size:22px">${TR.lv}</b> <button class="btn sm" data-act="trlv" data-d="1">+1</button> <button class="btn sm" data-act="trlv" data-d="5">+5</button> <button class="btn sm" data-act="trlv" data-d="50">+50</button> <button class="btn sm" data-act="trlv" data-d="-50">-50</button></div>
    <div>体数 ${[1, 2, 3].map(n => `<button class="btn sm ${TR.n === n && !ENEMIES[TR.k].boss ? 'pri' : ''}" data-act="trn" data-n="${n}" ${ENEMIES[TR.k].boss ? 'disabled' : ''}>${n}</button>`).join(' ')}</div></div>
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin:8px 0">${enemyCards(en)}</div>${weakLines(en)}
  <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn pri big" data-act="trgo">模擬戦を始める</button><button class="btn" data-act="go" data-to="form">編成を変更</button></div></div>`);
}
function startTrain() {
  const en = Array.from({ length: ENEMIES[TR.k].boss ? 1 : TR.n }, () => ({ k: TR.k, lv: TR.lv }));
  launchBattle({ title: `訓練 ${ENEMIES[TR.k].n} Lv${TR.lv}`, theme: ENEMIES[TR.k].boss ? 'clock' : 'station', boss: !!ENEMIES[TR.k].boss, battle: { team: teamSpec(), supports: supportIds(), gifts: [], enemies: en } }, {
    onResult: () => ({ html: '<p style="text-align:center;color:var(--dim)">訓練のため報酬はありません。</p>', buttons: [{ t: 'もう一度', cls: 'pri', fn: () => startTrain() }, { t: '戻る', fn: () => go('train') }] })
  });
}
Object.assign(ACT, {
  tsel(d) { const T = towerSt(); T.sel = Math.max(1, Math.min(T.best + 1, T.sel + (+d.d))); SFX.play('pick'); go('tower', null, true); },
  tgo() { SFX.play('ok'); startTower(); },
  trk(d) { TR.k = d.k; SFX.play('pick'); go('train', null, true); },
  trlv(d) { TR.lv = Math.max(1, Math.min(410, TR.lv + (+d.d))); SFX.play('pick'); go('train', null, true); },
  trn(d) { TR.n = +d.n; SFX.play('pick'); go('train', null, true); },
  trgo() { SFX.play('ok'); startTrain(); }
});
SCREENS.tower = scrTower; SCREENS.train = scrTrain; BACK.tower = 'home'; BACK.train = 'home';
