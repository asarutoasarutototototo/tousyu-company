'use strict';
/* ============================================================
   追加機能2: 深夜モード(高難度) / 灯具(装備) / プレイ記録
   ============================================================ */
/* ---------- 深夜モード ---------- */
const HARD_LV = 4, HARD_HP = 1.6, HARD_OIL = 9;
function hardRewards(st, rw, hf) {
  return { thread: rw.thread * 2, shards: rw.shards * 2 + (hf ? (st.boss ? 200 : 80) : 0), first: rw.first, hf: !!hf };
}
function hardToggle(hard) {
  return `<div class="tabs" style="margin:10px 0 4px"><button class="tab ${hard ? '' : 'on'}" data-act="hardsw" data-h="0">通常</button><button class="tab ${hard ? 'on' : ''}" data-act="hardsw" data-h="1" style="${hard ? 'background:#ff6a7a;border-color:#ffc0c8' : ''}">深夜(高難度)</button></div>${hard ? `<p style="font-size:12px;color:#ff9aa6;margin:0 0 6px">敵Lv+${HARD_LV}・敵HP×${HARD_HP}。報酬(糸・星屑)2倍、初回クリアで星屑ボーナス、灯具が2個ドロップ(高レア率UP)。灯油${HARD_OIL}。</p>` : ''}`;
}
Object.assign(ACT, { hardsw(d) { SFX.play('ui'); STORY_HARD = d.h === '1'; go('story'); } });

/* ---------- 灯具(装備) ---------- */
const GEAR_MAX = 150, GEAR_UP_MAX = 5;
const GEAR_SLOT = { w: '刃', a: '鎧', c: '護符' };
const GEAR_RAR = [{ n: '★1', c: '#b8b8c8' }, { n: '★2', c: '#7ed36f' }, { n: '★3', c: '#6cf0ff' }, { n: '★4', c: '#ffb347' }];
const GEAR_BASE = { w: ['灯芯の短刃', '燭台の長刃', '鐘守の剣', '夜明けの太刀'], a: ['煤けた外套', '綴じ糸の胴着', '鐘守の鎧', '暁の聖衣'], c: ['錆びた鈴', '硝子の灯具', '銀糸の護符', '星屑の首飾り'] };
const GEAR_PRE = ['古びた', '静かな', '燃える', '祝福の', '夜更けの', '綻びた', '澄んだ', '燻る'];
function gearState() { S.gear = S.gear || { items: {}, eq: {}, seq: 0 }; return S.gear; }
function gearMod(it) {
  const k = 1 + .12 * it.u, r = it.r - 1;
  if (it.s === 'w') return { dmg: [2, 3.5, 5, 7][r] * k / 100 };
  if (it.s === 'a') return { hp: [4, 7, 10, 14][r] * k / 100, def: [1, 2, 3, 4][r] * k / 100 };
  return { spStart: Math.round([2, 4, 6, 9][r] * k), clash: it.r === 4 ? 1 : 0 };
}
function gearStatText(it) {
  const m = gearMod(it), a = [];
  if (m.dmg) a.push(`与ダメ +${(m.dmg * 100).toFixed(1)}%`); if (m.hp) a.push(`HP +${(m.hp * 100).toFixed(1)}%`); if (m.def) a.push(`防御 +${(m.def * 100).toFixed(1)}%`);
  if (m.spStart) a.push(`SP初期 +${m.spStart}`); if (m.clash) a.push(`クラッシュ威力 +${m.clash}`);
  return a.join(' / ');
}
const gearName = it => `${it.n}${it.u ? ' +' + it.u : ''}`;
function gearOwner(id) { const eq = gearState().eq; for (const sid in eq) for (const sl in eq[sid]) if (eq[sid][sl] === id) return sid; return null; }
function gearTotals(sid) {
  const g = gearState(), e = g.eq[sid], t = { dmg: 0, hp: 0, def: 0, spStart: 0, clash: 0 }; if (!e) return null;
  for (const sl in e) { const it = g.items[e[sl]]; if (!it) continue; const m = gearMod(it); for (const k in m) t[k] += m[k]; }
  const st = gearSet(sid); if (st) for (const k in st.b) t[k] += st.b[k];
  return t;
}
/* セット効果: 同じ名前の冠(古びた/燃える…)の灯具を2〜3個装備すると追加ボーナス */
const gearPre = it => GEAR_PRE.find(p => it.n.startsWith(p)) || '';
const GEAR_SET_B = { 2: { dmg: .015, hp: .015 }, 3: { dmg: .04, hp: .04, def: .02 } };
function gearSet(sid) {
  const g = gearState(), e = g.eq[sid]; if (!e) return null; const c = {};
  for (const sl in e) { const it = g.items[e[sl]]; if (it) { const p = gearPre(it); if (p) c[p] = (c[p] || 0) + 1; } }
  let best = null; for (const p in c) if (c[p] >= 2 && (!best || c[p] > best.n)) best = { p, n: c[p], b: GEAR_SET_B[c[p]] };
  return best;
}
const gearScrap = it => Math.round((it.r * it.r * 20 + lvCap() * it.r * 1.5) * (1 + .4 * it.u));
const gearUpCost = it => Math.round(lvCost(Math.max(lvCap(), 10)) * (it.u + 1) * it.r * .15 / 10) * 10;
function gearRoll(lv, o) {
  const p = Math.min(1, (lv || 1) / 250); let w = [70 - 40 * p, 25 + 10 * p, 5 + 25 * p, 5 * p];
  if (o.boss) { w[2] += 10; w[3] += 3; } if (o.hard) { w[2] += 10; w[3] += 6; }
  const tot = w.reduce((a, b) => a + b, 0); let x = Math.random() * tot, r = 0; while (r < 3 && x >= w[r]) { x -= w[r]; r++; }
  return r + 1;
}
function gearMake(slot, rar) {
  const g = gearState(), id = 'g' + (++g.seq);
  g.items[id] = { id, s: slot, r: rar, u: 0, lock: 0, n: GEAR_PRE[(Math.random() * GEAR_PRE.length) | 0] + GEAR_BASE[slot][rar - 1] };
  return g.items[id];
}
/* ドロップ抽選。戻り値: 入手した灯具の配列(所持上限なら糸に換金) */
function gearDrop(o) {
  o = o || {}; const g = gearState(); let n = 0;
  if (o.lux) n = Math.random() < .25 ? 1 : 0;
  else if (o.hard) n = o.boss ? 3 : 2;
  else n = o.boss ? 1 : (Math.random() < .45 ? 1 : 0);
  const out = [];
  for (let i = 0; i < n; i++) {
    const slot = 'wac'[(Math.random() * 3) | 0], rar = gearRoll(o.lv, o);
    if (Object.keys(g.items).length >= GEAR_MAX) { const it = { r: rar, u: 0 }; const th = gearScrap(it); S.thread += th; out.push({ full: 1, th, r: rar, s: slot }); }
    else out.push(gearMake(slot, rar));
  }
  return out;
}
function gearDropHtml(list) {
  if (!list || !list.length) return '';
  return `<div class="gdrop">${list.map(it => it.full ? `<span style="color:var(--dim)">所持上限のため ${GEAR_RAR[it.r - 1].n} ${GEAR_SLOT[it.s]} を糸 +${it.th} に換金</span>` : `<span style="color:${GEAR_RAR[it.r - 1].c}">灯具獲得: ${GEAR_RAR[it.r - 1].n} ${esc(it.n)} <small>(${GEAR_SLOT[it.s]})</small></span>`).join('')}</div>`;
}
let GEAR_SID = SINNER_KEYS[0], GEAR_F = 'all', GEAR_SCROLL = 0;
function gearRefresh() { const l = $('.gl'); if (l) GEAR_SCROLL = l.scrollTop; go('gear', null, true); }
const gearSorted = f => Object.values(gearState().items).filter(it => f === 'all' || it.s === f).sort((a, b) => b.r - a.r || b.u - a.u || (+b.id.slice(1)) - (+a.id.slice(1)));
function scrGear() {
  setScene('plain', 'library'); setTop('灯具', true);
  const g = gearState(), sid = GEAR_SID, tot = gearTotals(sid) || {}, all = Object.keys(g.items).length;
  const chars = SINNER_KEYS.map(k => { const id = sIdent(k), e = g.eq[k] || {}, c = Object.keys(e).filter(s => g.items[e[s]]).length; return `<button class="gchar ${k === sid ? 'on' : ''}" data-act="gsid" data-sid="${k}" style="--sin:${SIN[id.sin].c}"><canvas width="124" height="124" data-pk="${id.key}" data-m="face"></canvas><span>${esc(SINNERS[k].n)}</span><i>${c}/3</i></button>`; }).join('');
  const slots = ['w', 'a', 'c'].map(sl => { const it = g.items[(g.eq[sid] || {})[sl]]; return it ? `<button class="row grow" data-act="gitem" data-id="${it.id}" style="border-color:${GEAR_RAR[it.r - 1].c}"><span class="no" style="color:${GEAR_RAR[it.r - 1].c}">${GEAR_SLOT[sl]}</span><span class="nm">${esc(gearName(it))} <small style="color:${GEAR_RAR[it.r - 1].c}">${GEAR_RAR[it.r - 1].n}</small><div class="sub">${gearStatText(it)}</div></span></button>` : `<div class="row grow empty"><span class="no" style="color:var(--dim)">${GEAR_SLOT[sl]}</span><span class="nm" style="color:var(--dim)">未装備</span></div>`; }).join('');
  const sum = [tot.dmg ? `与ダメ +${(tot.dmg * 100).toFixed(1)}%` : '', tot.hp ? `HP +${(tot.hp * 100).toFixed(1)}%` : '', tot.def ? `防御 +${(tot.def * 100).toFixed(1)}%` : '', tot.spStart ? `SP初期 +${tot.spStart}` : '', tot.clash ? `クラッシュ威力 +${tot.clash}` : ''].filter(Boolean).join(' / ') || '装備による補正なし';
  const tabs = [['all', 'すべて'], ['w', '刃'], ['a', '鎧'], ['c', '護符']].map(([k, n]) => `<button class="tab ${GEAR_F === k ? 'on' : ''}" data-act="gf" data-f="${k}">${n}</button>`).join('');
  const list = gearSorted(GEAR_F).map(it => { const ow = gearOwner(it.id), c = GEAR_RAR[it.r - 1].c; return `<button class="row grow" data-act="gitem" data-id="${it.id}"><span class="no" style="color:${c};min-width:70px">${GEAR_RAR[it.r - 1].n} ${GEAR_SLOT[it.s]}</span><span class="nm">${esc(gearName(it))}<div class="sub">${gearStatText(it)}${ow ? ` / <b style="color:var(--lamp)">${esc(SINNERS[ow].n)}</b>が装備中` : ''}</div></span><span>${it.lock ? '🔒' : ''}</span></button>`; }).join('') || '<p style="color:var(--dim);padding:10px">灯具がありません。ステージ・採掘・掃討でドロップします。</p>';
  scr(`<div class="sec-h"><h2>灯具</h2><span class="eyebrow">LAMP GEAR / 所持 ${all}/${GEAR_MAX}</span></div>
  <div class="gchars">${chars}</div>
  <div class="two" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">
  <div class="panel cut pad"><div class="eyebrow">${esc(SINNERS[sid].n)} の装備</div><div class="list" style="margin-top:8px">${slots}</div><p style="font-size:13px;margin:10px 0 6px"><b style="color:var(--lamp)">合計</b> ${sum}</p>${(() => { const st = gearSet(sid); return st ? `<p style="font-size:13px;margin:0 0 6px;color:#9be39b">セット効果「${esc(st.p)}」×${st.n}: 与ダメ +${(st.b.dmg * 100).toFixed(1)}% / HP +${(st.b.hp * 100).toFixed(1)}%${st.b.def ? ' / 防御 +' + (st.b.def * 100).toFixed(1) + '%' : ''}</p>` : '<p style="font-size:12px;margin:0 0 6px;color:var(--dim)">同じ冠名(例:「燃える」)の灯具を2個で小・3個で大のセット効果。</p>'; })()}
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="gbest">おまかせ装備</button><button class="btn" data-act="gstrip">全部外す</button></div>
  <p style="font-size:12px;color:var(--dim);margin:10px 0 0">刃=与ダメージ / 鎧=HP・防御 / 護符=SP初期値(★4はクラッシュ威力+1)。装備は出撃時のみ有効で、鏡面螺旋以外の戦闘に反映されます。強化は+${GEAR_UP_MAX}まで(糸消費)。</p></div>
  <div class="panel cut pad"><div class="tabs">${tabs}</div><div class="list gl" style="max-height:min(56vh,460px);overflow:auto">${list}</div><div style="margin-top:8px"><button class="btn" data-act="gbulk">★1〜★2の未装備をまとめて分解</button></div></div></div>`);
  const l = $('.gl'); if (l) l.scrollTop = GEAR_SCROLL;
}
function gearModal(id) {
  const g = gearState(), it = g.items[id]; if (!it) { closeModal(); return; }
  const ow = gearOwner(id), c = GEAR_RAR[it.r - 1].c, up = it.u < GEAR_UP_MAX ? (() => { const nx = Object.assign({}, it, { u: it.u + 1 }); return gearStatText(nx); })() : '';
  const mine = ow === GEAR_SID;
  modal(`<div class="eyebrow">${GEAR_SLOT[it.s]} / ${GEAR_RAR[it.r - 1].n}</div><h3 style="color:${c}">${esc(gearName(it))}</h3><p style="margin:4px 0">${gearStatText(it)}</p>${up ? `<p style="font-size:12px;color:var(--dim);margin:0 0 4px">強化後: ${up}</p>` : '<p style="font-size:12px;color:var(--lamp);margin:0 0 4px">最大強化済み</p>'}<p style="font-size:12px;color:var(--dim)">${ow ? `${esc(SINNERS[ow].n)}が装備中` : '未装備'}</p>
  <div class="acts" style="justify-content:flex-start"><button class="btn pri" data-m="eq">${mine ? `${esc(SINNERS[GEAR_SID].n)}から外す` : `${esc(SINNERS[GEAR_SID].n)}に装備`}</button>${up ? `<button class="btn" data-m="up" ${S.thread < gearUpCost(it) ? 'disabled' : ''}>強化 (糸 ${gearUpCost(it)})</button>` : ''}<button class="btn" data-m="lock">${it.lock ? '保護を解除' : '保護する'}</button><button class="btn" data-m="scrap" ${it.lock || ow ? 'disabled' : ''}>分解 (糸 +${gearScrap(it)})</button><button class="btn" data-m="x">閉じる</button></div>`, k => {
    if (k === 'x') { closeModal(); return; }
    if (k === 'eq') {
      g.eq[GEAR_SID] = g.eq[GEAR_SID] || {};
      if (mine) delete g.eq[GEAR_SID][it.s]; else { if (ow) delete g.eq[ow][it.s]; g.eq[GEAR_SID][it.s] = id; }
      SFX.play('pick'); saveState(); closeModal(); gearRefresh(); return;
    }
    if (k === 'up') { const cost = gearUpCost(it); if (S.thread < cost || it.u >= GEAR_UP_MAX) return; S.thread -= cost; it.u++; SFX.play('ok'); saveState(); refreshRes(); gearRefresh(); gearModal(id); return; }
    if (k === 'lock') { it.lock = it.lock ? 0 : 1; SFX.play('ui'); saveState(); gearRefresh(); gearModal(id); return; }
    if (k === 'scrap') { if (it.lock || ow) return; S.thread += gearScrap(it); delete g.items[id]; SFX.play('ok'); saveState(); refreshRes(); closeModal(); gearRefresh(); }
  });
}
Object.assign(ACT, {
  gsid(d) { SFX.play('ui'); GEAR_SID = d.sid; gearRefresh(); },
  gf(d) { SFX.play('ui'); GEAR_F = d.f; GEAR_SCROLL = 0; go('gear', null, true); },
  gitem(d) { SFX.play('ui'); const l = $('.gl'); if (l) GEAR_SCROLL = l.scrollTop; gearModal(d.id); },
  gstrip() { const g = gearState(); delete g.eq[GEAR_SID]; SFX.play('back'); saveState(); gearRefresh(); },
  gbest() {
    const g = gearState(); g.eq[GEAR_SID] = g.eq[GEAR_SID] || {}; let n = 0;
    ['w', 'a', 'c'].forEach(sl => {
      const cur = g.items[g.eq[GEAR_SID][sl]], sc = it => it.r * 10 + it.u;
      const best = Object.values(g.items).filter(it => it.s === sl && !gearOwner(it.id)).sort((a, b) => sc(b) - sc(a))[0];
      if (best && (!cur || sc(best) > sc(cur))) { g.eq[GEAR_SID][sl] = best.id; n++; }
    });
    SFX.play(n ? 'ok' : 'deny'); toast(n ? `${n}箇所を更新しました` : '付け替えできる灯具がありません'); saveState(); gearRefresh();
  },
  gbulk() {
    const g = gearState(), t = Object.values(g.items).filter(it => it.r <= 2 && !it.lock && !gearOwner(it.id));
    if (!t.length) { toast('分解できる灯具がありません'); return; }
    const th = t.reduce((a, it) => a + gearScrap(it), 0);
    modal(`<h3>まとめて分解</h3><p>★1〜★2・未装備・保護なしの灯具 <b>${t.length}</b> 個を分解し、糸 <b>${th}</b> を得ます。</p><div class="acts"><button class="btn" data-m="x">やめる</button><button class="btn pri" data-m="ok">分解する</button></div>`, k => {
      if (k === 'ok') { t.forEach(it => delete g.items[it.id]); S.thread += th; SFX.play('ok'); saveState(); refreshRes(); toast(`${t.length}個を分解(糸 +${th})`); }
      closeModal(); if (k === 'ok') gearRefresh();
    });
  }
});
SCREENS.gear = scrGear; BACK.gear = 'home';

/* ---------- プレイ記録 ---------- */
const _dexRecord2 = dexRecord;
dexRecord = function (B, spec) {
  _dexRecord2(B, spec);
  try {
    if (B.result !== 'win' && B.result !== 'lose') return;
    const t = (spec && spec.title) || ''; if (/^訓練/.test(t)) return;
    const r = S.rec = S.rec || { b: 0, w: 0, l: 0, turns: 0, dmg: 0, maxDmg: 0, stag: 0, cw: 0, hardW: 0, sort: {} };
    r.b++; if (B.result === 'win') r.w++; else r.l++; r.turns += B.turn || 0;
    const d = (B.stat && B.stat.dmg) || 0; r.dmg += d; r.maxDmg = Math.max(r.maxDmg, d); r.stag += (B.stat && B.stat.stag) || 0; r.cw += (B.stat && B.stat.clashW) || 0;
    if (B.result === 'win' && /^【深夜】/.test(t)) r.hardW++;
    B.side('A').forEach(u => { if (u.sid) r.sort[u.sid] = (r.sort[u.sid] || 0) + 1; });
  } catch (e) { console.error(e); }
};
function scrRecord() {
  setScene('plain', 'library'); setTop('記録', true);
  const r = S.rec || { b: 0, w: 0, l: 0, turns: 0, dmg: 0, maxDmg: 0, stag: 0, cw: 0, hardW: 0, sort: {} };
  const dx = typeof dexStats === 'function' ? dexStats() : null, mins = Math.max(0, Math.floor((Date.now() - (S.started || Date.now())) / 60000));
  const hard = Object.keys(S.hard || {}).length, gi = Object.values(gearState().items), best = Math.max(0, ...SINNER_KEYS.map(k => r.sort[k] || 0));
  const cell = (t, v) => `<div><small>${t}</small><b>${v}</b></div>`;
  const bars = SINNER_KEYS.map(k => { const n = r.sort[k] || 0; return `<div class="rbar"><span>${esc(SINNERS[k].n)}</span><span class="db"><i style="width:${best ? Math.round(n / best * 100) : 0}%"></i></span><span class="num">${n}</span></div>`; }).join('');
  scr(`<div class="sec-h"><h2>記録</h2><span class="eyebrow">RECORD</span></div>
  <div class="two" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">
  <div class="panel cut pad"><div class="eyebrow">戦績</div><div class="rstt">${cell('戦闘数', r.b)}${cell('勝利', r.w)}${cell('敗北', r.l)}${cell('勝率', r.b ? Math.round(r.w / r.b * 100) + '%' : '—')}${cell('総ターン', r.turns)}${cell('累計与ダメージ', r.dmg.toLocaleString())}${cell('1戦の最大ダメージ', r.maxDmg.toLocaleString())}${cell('クラッシュ勝利', r.cw)}${cell('混乱させた数', r.stag)}</div></div>
  <div class="panel cut pad"><div class="eyebrow">進行</div><div class="rstt">${cell('クリア章', chaptersCleared() + '/' + CHAPTERS.length)}${cell('クリア済み', Object.keys(S.cleared).length + '/' + STAGES.length)}${cell('深夜クリア', hard)}${cell('レベル上限', 'Lv' + lvCap())}${cell('無限回廊 最高', ((S.tower && S.tower.best) || 0) + '階')}${cell('鏡面螺旋 最高', (S.mirror && S.mirror.best) || 0)}${cell('抽出回数', S.pulls || 0)}${cell('灯具', gi.length + '個(★4 ' + gi.filter(i => i.r === 4).length + ')')}${cell('図鑑', dx ? dx.en[0] + dx.id[0] + dx.gift[0] + '件' : '—')}${cell('プレイ時間', mins >= 60 ? Math.floor(mins / 60) + '時間' + (mins % 60) + '分' : mins + '分')}</div></div>
  <div class="panel cut pad"><div class="eyebrow">灯守ごとの出撃回数</div><div class="rbars">${bars}</div></div></div>`);
}
SCREENS.record = scrRecord; BACK.record = 'home';

/* ---------- 水無月(準備中の灯守): 紹介ページ ---------- */
const MINA_POS = '19% 50%';  /* 立ち絵の人物が枠の中央に来る位置 */
function minaCard() {
  const c = EXTRA_CHARS.mina;
  return `<button class="scard wip ${ROS_SID === 'mina' ? 'on' : ''}" data-act="minaopen" style="--sin:#a99bd6"><img alt="" src="${IMGDATA.mina.stand}" style="object-position:${MINA_POS}"><span class="lvb">準備中</span><span class="meta"><b>${esc(c.n)}</b><small>${esc(c.tag)}</small></span></button>`;
}
function scrMina() {
  setScene('plain', 'menu'); setTop('水無月', true);
  const c = EXTRA_CHARS.mina, faces = ['f_a', 'f_b', 'f_n'].map(id => `<button class="gchip" data-act="minagal" data-id="${id}" style="padding:0;overflow:hidden;width:64px;height:64px"><img alt="" src="${IMGDATA.mina[id]}" style="width:100%;height:100%;object-fit:cover"></button>`).join('');
  scr(`<div class="sec-h"><h2>水無月</h2><span class="eyebrow">MINAZUKI / COMING SOON</span></div>
  <div class="gacha" style="grid-template-columns:minmax(0,320px) minmax(0,1fr);align-items:start">
    <div class="minaport"><img alt="水無月" src="${IMGDATA.mina.stand}" style="object-position:${MINA_POS}"></div>
    <div class="panel cut pad">
      <div class="eyebrow">${esc(c.r)}</div><h2 class="h-disp" style="font-size:32px;font-weight:400;margin:2px 0">${esc(c.n)}</h2>
      <div style="color:var(--dim);font-size:13px">${esc(c.tag)}</div>
      <p style="margin:12px 0 4px;color:var(--lamp)">${esc(c.quote)}</p><p style="margin:4px 0 12px;color:var(--dim);font-size:13px">${esc(c.bio)}</p>
      <dl class="kv"><dt>出撃</dt><dd>不可 (準備中)</dd><dt>属性</dt><dd>調整中</dd><dt>スキル</dt><dd>調整中</dd><dt>人格 / E.G.O</dt><dd>調整中</dd></dl>
      <div style="margin:12px 0 6px;font-size:12px;color:var(--dim)">表情</div><div class="chips">${faces}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn pri" data-act="minagal" data-id="stand">鑑賞室で全コマを見る</button><button class="btn" data-act="minaback">灯守一覧へ</button></div>
    </div>
  </div>`);
}
Object.assign(ACT, {
  minaopen() { SFX.play('ui'); go('mina'); },
  minaback() { SFX.play('back'); go('roster'); },
  minagal(d) { SFX.play('ui'); GAL.sid = 'mina'; go('gallery'); GAL.fr = d.id || 'stand'; galDraw(); }
});
SCREENS.mina = scrMina; BACK.mina = 'roster';

/* ---------- 灯台の見張り(放置報酬) ---------- */
const IDLE_MAX_H = 12;
function idleCalc() {
  if (!S.idle) S.idle = { t: Date.now() };
  const h = Math.max(0, Math.min(IDLE_MAX_H, (Date.now() - S.idle.t) / 3600000)), base = lvCost(Math.max(lvCap(), 10));
  return { h, thread: Math.round(h * base * .35 / 10) * 10, shards: Math.floor(h * 8), gear: Math.floor(h / 4), full: h >= IDLE_MAX_H };
}
function scrIdle() {
  setScene('plain', 'clock'); setTop('灯台の見張り', true);
  const r = idleCalc(), pct = Math.round(r.h / IDLE_MAX_H * 100);
  scr(`<div class="sec-h"><h2>灯台の見張り</h2><span class="eyebrow">LIGHTHOUSE WATCH</span></div>
  <div class="panel cut pad" style="max-width:560px"><p style="color:var(--dim);font-size:13px;margin:0 0 10px">灯守たちが留守のあいだ灯台を見張り、糸と星屑を集めてくれます。最大${IDLE_MAX_H}時間分まで貯まり、4時間ごとに灯具も1個見つかります。報酬はクリアしたチャプターが進むほど増えます。</p>
  <div class="rbar" style="grid-template-columns:90px minmax(0,1fr) 60px"><span>貯まり具合</span><span class="db"><i style="width:${pct}%"></i></span><span class="num">${r.h.toFixed(1)}h</span></div>
  <div class="rew" style="margin:12px 0"><span>糸 +${r.thread}</span><span>星屑 +${r.shards}</span><span>灯具 ${r.gear}個</span></div>
  ${r.full ? `<p style="color:var(--lamp);font-size:13px;margin:0 0 8px">満タンです。受け取ると見張りが再開します。</p>` : ''}
  <button class="btn pri" data-act="idleclaim" ${r.h < .1 ? 'disabled' : ''}>報酬を受け取る</button></div>`);
}
Object.assign(ACT, {
  idleclaim() {
    const r = idleCalc(); if (r.h < .1) return;
    S.thread += r.thread; S.shards += r.shards; const gd = [];
    for (let i = 0; i < r.gear; i++) gd.push(...gearDrop({ lv: lvCap(), boss: true }));
    S.idle = { t: Date.now() }; SFX.play('ok'); saveState(); refreshRes();
    modal(`<h3>見張りの報告</h3><div class="rew" style="justify-content:center"><span>糸 +${r.thread}</span><span>星屑 +${r.shards}</span></div>${gearDropHtml(gd)}<div class="acts"><button class="btn pri" data-m="x">閉じる</button></div>`, () => { closeModal(); go('idle'); });
  }
});
SCREENS.idle = scrIdle; BACK.idle = 'home';

/* ============================================================
   抽出演出(強化版): 収束チャージ → 閃光 → 伏せカードが順にめくれる
   ★2以上は「めくる前に枠が色づく」予兆演出、★3は光芒・バナー・長めの溜め
   ============================================================ */
const PULL_C = { 1: '#8fd3ff', 2: '#d58bff', 3: '#ffc84a' };
function pullShow(out, n) {
  const top = Math.max(...out.map(r => r.tier)), tc = PULL_C[top] || PULL_C[1];
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const D = reduce ? 400 : { 1: 1500, 2: 2100, 3: 2900 }[top] || 1500;
  const ov = document.createElement('div'); ov.className = 'reveal pull';
  ov.innerHTML = '<canvas class="pfx"></canvas><div class="pstage"><div class="eyebrow" style="letter-spacing:.4em">EXTRACTION</div><div class="pcap">灯を、呼んでいる…</div></div><div class="pflash"></div><button class="pskip" data-act="pskip">SKIP ▸▸</button>';
  $('#app').appendChild(ov);
  const cv = ov.querySelector('.pfx'), c = cv.getContext('2d'), stage = ov.querySelector('.pstage'), dpr = Math.min(1.5, window.devicePixelRatio || 1);
  const fit = () => { cv.width = Math.max(1, ov.clientWidth * dpr); cv.height = Math.max(1, ov.clientHeight * dpr); }; fit(); window.addEventListener('resize', fit);
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), mix = (a, b, t) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`; };
  const rgba = (h, a) => { const x = hex(h); return `rgba(${x[0]},${x[1]},${x[2]},${a})`; };
  let alive = true, phase = 'intro', t0 = performance.now(), parts = [], rings = [], idx = 0, timer = 0, cardsEl = [];
  SFX.init(); SFX.play('charge', { d: D / 1000 });
  const burst = (x, y, col, cnt) => { for (let i = 0; i < cnt; i++) { const a = Math.random() * 6.283, sp = (2 + Math.random() * 9) * dpr; parts.push({ x: x * dpr, y: y * dpr, px: x * dpr, py: y * dpr, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5 * dpr, a: 1, da: .012 + Math.random() * .02, col, s: (1 + Math.random() * 2.4) * dpr, g: .08 * dpr }); } rings.push({ x: x * dpr, y: y * dpr, r: 6 * dpr, vr: (cnt > 40 ? 16 : 9) * dpr, a: 1, col }); };
  const flash = col => { const f = ov.querySelector('.pflash'); f.style.setProperty('--fc', col); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); };
  const banner = (t, col) => { const b = document.createElement('div'); b.className = 'pbanner'; b.style.setProperty('--bc', col); b.textContent = t; ov.appendChild(b); setTimeout(() => b.remove(), 1700); };
  const shake = a => { if (reduce) return; ov.style.transform = `translate(${(Math.random() - .5) * a}px,${(Math.random() - .5) * a}px)`; };
  function loop(now) {
    if (!alive || !ov.isConnected) { alive = false; window.removeEventListener('resize', fit); return; }
    const W = cv.width, H = cv.height, cx = W / 2, cy = H * .46; c.clearRect(0, 0, W, H);
    if (phase === 'intro') {
      const p = Math.min(1, (now - t0) / D), col = mix('#cfe6ff', tc, Math.max(0, (p - .45) / .55));
      const gr = (26 + 190 * p * p) * dpr, g = c.createRadialGradient(cx, cy, 0, cx, cy, gr * 2.4);
      g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.22, col.replace('rgb', 'rgba').replace(')', ',.65)')); g.addColorStop(1, col.replace('rgb', 'rgba').replace(')', ',0)')); c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (let k = 0, m = 2 + Math.round(p * 7); k < m; k++) { const a = Math.random() * 6.283, r0 = Math.max(W, H) * (.5 + Math.random() * .25); parts.push({ x: cx + Math.cos(a) * r0, y: cy + Math.sin(a) * r0, px: 0, py: 0, in: 1, a: .9, da: 0, col, s: (1 + Math.random() * 1.8) * dpr, k: .035 + Math.random() * .05 + p * .05 }); }
      if (top >= 2 && p > .6) shake((p - .6) * (top === 3 ? 14 : 7));
      const cap = stage.querySelector('.pcap'); if (cap) cap.style.opacity = (.5 + .5 * Math.sin(now / 160)) * (1 - p * .3);
      if (p >= 1) endIntro();
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const q = parts[i]; q.px = q.x; q.py = q.y;
      if (q.in) { q.x += (cx - q.x) * q.k; q.y += (cy - q.y) * q.k; if (Math.hypot(cx - q.x, cy - q.y) < 14 * dpr) { parts.splice(i, 1); continue; } if (!q.px) { q.px = q.x; q.py = q.y; } }
      else { q.x += q.vx; q.y += q.vy; q.vy += q.g; q.vx *= .985; q.a -= q.da; if (q.a <= 0) { parts.splice(i, 1); continue; } }
      c.strokeStyle = q.col; c.globalAlpha = Math.max(0, q.a); c.lineWidth = q.s; c.lineCap = 'round'; c.beginPath(); c.moveTo(q.px, q.py); c.lineTo(q.x, q.y); c.stroke();
    }
    for (let i = rings.length - 1; i >= 0; i--) { const q = rings[i]; q.r += q.vr; q.a -= .025; if (q.a <= 0) { rings.splice(i, 1); continue; } c.globalAlpha = q.a; c.strokeStyle = q.col; c.lineWidth = 3 * dpr; c.beginPath(); c.arc(q.x, q.y, q.r, 0, 6.283); c.stroke(); }
    c.globalAlpha = 1; requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  function endIntro() {
    if (phase !== 'intro') return; phase = 'cards'; ov.style.transform = ''; parts = parts.filter(q => !q.in);
    const W = ov.clientWidth, H = ov.clientHeight; flash(tc); burst(W / 2, H * .46, tc, top === 3 ? 140 : top === 2 ? 90 : 50); SFX.play('burst');
    const cards = out.map((r, i) => { const id = IDENTS[r.ik], sc = SIN[id.sin]; return `<div class="pc r${r.tier}" data-i="${i}" style="--sin:${sc.c};--tc:${PULL_C[r.tier]};animation-delay:${i * .05}s"><div class="pi"><div class="pback"><i></i><b>${starsOf(r.tier)}</b></div><div class="pfront"><canvas width="300" height="400" data-pk="${r.ik}" data-m="bust"></canvas>${r.isNew ? '<span class="nw">NEW</span>' : ''}<div class="meta"><span class="stars">${starsOf(r.tier)}</span><br><b>${SINNERS[r.sid].n}</b><br><small>${esc(id.n)}</small><br><small style="color:var(--lamp)">${r.frag ? '同調MAX → ' + SINNERS[r.sid].n + 'の欠片+' + r.frag : '同調 ' + r.sync + '/4'}</small></div></div></div></div>`; }).join('');
    stage.innerHTML = `${top >= 2 ? `<div class="prays" style="--rc:${tc}"></div>` : ''}<div class="eyebrow" style="letter-spacing:.4em">EXTRACTION</div>${n === 1 ? `<div class="one-reveal">${cards}</div>` : `<div class="rgrid">${cards}</div>`}<div class="psum" style="opacity:0"></div><button class="btn pri big pok" data-act="gok" hidden>OK</button>`;
    fillCanvases(ov); cardsEl = [...stage.querySelectorAll('.pc')]; timer = setTimeout(next, reduce ? 200 : 750);
  }
  function flip(i, fast) {
    const el = cardsEl[i]; if (!el || el.classList.contains('flip')) return; el.classList.add('warn', 'flip'); const r = out[i];
    if (!fast) {
      SFX.play('flip', { rare: r.tier - 1 }); const b = el.getBoundingClientRect(), o = ov.getBoundingClientRect(); burst(b.left + b.width / 2 - o.left, b.top + b.height / 2 - o.top, PULL_C[r.tier], r.tier === 3 ? 100 : r.tier === 2 ? 46 : 14);
      if (r.tier === 3) { flash(PULL_C[3]); banner('★★★  灯が、応えた', PULL_C[3]); shake(16); setTimeout(() => shake(0), 160); } else if (r.tier === 2 && n === 1) banner('★★  新たな灯', PULL_C[2]);
    }
  }
  function next() {
    if (!alive) return; if (idx >= out.length) { finish(); return; }
    const i = idx++, r = out[i], el = cardsEl[i]; if (el.classList.contains('flip')) { next(); return; }
    el.classList.add('warn'); if (r.tier >= 2) SFX.play('tick'); try { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { }
    const wait = reduce ? 80 : r.tier === 3 ? 1150 : r.tier === 2 ? 620 : n === 1 ? 500 : 230;
    timer = setTimeout(() => { flip(i); timer = setTimeout(next, reduce ? 80 : r.tier === 3 ? 1000 : r.tier === 2 ? 480 : 260); }, wait);
  }
  function finish() {
    if (ov.querySelector('.pok') == null || !ov.querySelector('.pok').hidden) return;
    const cnt = t => out.filter(r => r.tier === t).length, nw = out.filter(r => r.isNew).length;
    const sm = ov.querySelector('.psum'); sm.textContent = `★3 ×${cnt(3)}   ★2 ×${cnt(2)}   ★1 ×${cnt(1)}${nw ? `   /   NEW ×${nw}` : ''}`; sm.style.opacity = 1; sm.style.transition = 'opacity .5s';
    const ok = ov.querySelector('.pok'); ok.hidden = false; ok.style.animation = 'rin .5s ease both'; const sk = ov.querySelector('.pskip'); if (sk) sk.hidden = true;
  }
  ov.addEventListener('click', e => {
    if (e.target.closest('[data-act="gok"]')) { SFX.play('ok'); alive = false; clearTimeout(timer); window.removeEventListener('resize', fit); ov.remove(); go('gacha'); return; }
    if (e.target.closest('[data-act="pskip"]')) {
      SFX.play('ui'); clearTimeout(timer);
      if (phase === 'intro') endIntro(); idx = out.length; cardsEl.forEach((_, i) => flip(i, true)); finish(); return;
    }
    const pc = e.target.closest('.pc'); if (pc && phase === 'cards') { const i = +pc.dataset.i; if (!pc.classList.contains('flip')) { flip(i); } }
  });
}
