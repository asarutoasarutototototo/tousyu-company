'use strict';
/* ============ 追加機能: 編成プリセット / 掃討 / 図鑑 ============ */
const PRESET_N = 3;
function presets() { if (!Array.isArray(S.presets)) S.presets = []; while (S.presets.length < PRESET_N) S.presets.push(null); return S.presets; }
function dexState() {
  const d = S.dex = S.dex || {}; d.en = d.en || {}; d.gift = d.gift || {}; d.claim = d.claim || {};
  { STAGES.forEach(st => { if (S.cleared[st.id]) st.en.forEach(e => { const r = d.en[e.k] = d.en[e.k] || { s: 0, d: 0 }; r.s = Math.max(r.s, 1); r.d = Math.max(r.d, 1); }); }); }
  return d;
}
/* 戦闘終了時に記録(ui_battle.finish から呼ぶ) */
function dexRecord(B, spec) {
  try {
    const d = dexState();
    B.units.filter(u => u.side === 'E').forEach(u => { const r = d.en[u.key] = d.en[u.key] || { s: 0, d: 0 }; r.s++; if (!u.alive) r.d++; });
    ((spec && spec.battle && spec.battle.gifts) || []).forEach(g => { d.gift[g] = 1; });
  } catch (e) { console.error(e); }
}

/* ---------- 編成プリセット ---------- */
const _scrForm = SCREENS.form;
SCREENS.form = function (a) {
  _scrForm(a);
  const ps = presets();
  const rows = ps.map((p, i) => {
    const nm = p ? p.team.map(s => SINNERS[s] ? SINNERS[s].n : '').join('・') : '— 未保存 —';
    return `<div class="prow"><b>枠${i + 1}</b><span class="pn">${esc(nm)}</span><button class="btn sm" data-act="pset" data-i="${i}">保存</button><button class="btn sm pri" data-act="pload" data-i="${i}" ${p ? '' : 'disabled'}>呼出</button><button class="btn sm" data-act="pclr" data-i="${i}" aria-label="削除" ${p ? '' : 'disabled style="visibility:hidden"'}>✕</button></div>`;
  }).join('');
  const h = $('#scr .sec-h'); if (h) h.insertAdjacentHTML('afterend', `<div class="panel pad presets"><div class="eyebrow">編成プリセット(出撃順・装備中の人格を保存)</div>${rows}</div>`);
};
Object.assign(ACT, {
  pset(d) { const i = +d.i; presets()[i] = { team: S.team.slice(), eq: Object.assign({}, S.equipped) }; saveState(); SFX.play('ok'); toast(`枠${i + 1}に保存しました`); go('form', null, true); },
  pload(d) {
    const i = +d.i, p = presets()[i]; if (!p) return;
    const team = p.team.filter(s => SINNERS[s]); if (!team.length) return;
    for (const s of team) { const ik = p.eq && p.eq[s]; if (ik && S.owned[ik] && IDENTS[ik]) S.equipped[s] = ik; }
    S.team = team.slice(0, 6); saveState(); SFX.play('ok'); toast(`枠${i + 1}を呼び出しました`); go('form', null, true);
  },
  pclr(d) { presets()[+d.i] = null; saveState(); SFX.play('back'); go('form', null, true); }
});

/* ---------- 掃討(クリア済みステージの即時周回) ---------- */
function sweepOk(st) {
  if (!S.cleared[st.id]) return '未クリアのステージです';
  const avg = S.team.reduce((a, s) => a + sLv(s), 0) / Math.max(1, S.team.length);
  if (avg < st.lv) return `編成の平均Lvが推奨(${st.lv})に届いていません`;
  return '';
}
const _scrStory = SCREENS.story;
SCREENS.story = function (a) {
  _scrStory(a);
  const sel = STAGES.find(s => s.id === STORY_SEL); const b = $('#scr [data-act=stgo]'); if (!sel || !b || !S.cleared[sel.id]) return;
  const why = sweepOk(sel), tk = S.tickets || 0, can = n => !why && S.oil >= STAGE_OIL * n && tk >= n;
  b.parentElement.insertAdjacentHTML('beforeend', `<button class="btn" data-act="sweep" data-st="${sel.id}" data-n="1" ${can(1) ? '' : 'disabled'} title="${esc(why)}">掃討×1 (券1)</button><button class="btn" data-act="sweep" data-st="${sel.id}" data-n="5" ${can(5) ? '' : 'disabled'} title="${esc(why)}">掃討×5 (券5)</button><span class="sub" style="font-size:11px;align-self:center">${why ? esc(why) : `戦闘なしで報酬獲得(掃討券1枚+灯油${STAGE_OIL}/回)`} / 所持券 ${tk}枚 — 採掘「掃討券の坑道」で入手</span>`);
};
Object.assign(ACT, {
  sweep(d) {
    const st = STAGES.find(s => s.id === d.st), n = +d.n; if (!st) return;
    const why = sweepOk(st); if (why) { toast(why); return; }
    if ((S.tickets || 0) < n) { toast('掃討券が足りません'); return; }
    if (S.oil < STAGE_OIL * n) { toast('灯油が足りません'); return; }
    S.tickets -= n; regenOil(); S.oil -= STAGE_OIL * n; S.oilT = Date.now();
    const rw = stageRewards(st, false); let exp = 0, ups = 0;
    for (let i = 0; i < n; i++) { S.thread += rw.thread; S.shards += rw.shards; const g = gainStageExp(st, false); exp += g.exp; ups += g.ups; }
    const gds = []; for (let i = 0; i < n; i++) gds.push(...gearDrop({ lv: st.lv, boss: !!st.boss })); bump('win', n); saveState(); refreshRes(); SFX.play('ok');
    modal(`<h3>掃討完了 ×${n}</h3>${gearDropHtml(gds)}<p style="text-align:center;font-size:12px;color:var(--dim)">掃討券 −${n}(残り ${S.tickets}枚)</p><div class="rew" style="justify-content:center"><span>糸 +${rw.thread * n}</span><span>星屑 +${rw.shards * n}</span><span>経験値 +${exp}</span></div><p style="text-align:center;font-size:12px;color:var(--dim)">プレイヤーLv ${S.pl.lv} / 通算クリア ${S.clears}回${ups ? `<br><b style="color:var(--lamp)">レベルアップ ×${ups}!灯油が全回復しました</b>` : ''}</p><div class="acts"><button class="btn pri" data-m="x">閉じる</button></div>`, () => { closeModal(); go('story', { st: st.id }); });
  }
});

/* ---------- 図鑑 ---------- */
let DEX_TAB = 'en', DEX_SID = SINNER_KEYS[0];
const DEX_REWARD = [[50, 100], [100, 300]];
function dexStats() {
  const d = dexState(), ek = Object.keys(ENEMIES), ik = Object.keys(IDENTS);
  return {
    en: [ek.filter(k => d.en[k] && d.en[k].s).length, ek.length],
    id: [ik.filter(k => S.owned[k]).length, ik.length],
    gift: [GIFT_KEYS.filter(k => d.gift[k]).length, GIFT_KEYS.length]
  };
}
function scrCodex() {
  setScene('plain', 'library'); setTop('図鑑', true);
  const d = dexState(), stt = dexStats(), TABN = { en: '敵', id: '人格', gift: 'ギフト' };
  const tabs = Object.keys(TABN).map(k => `<button class="tab ${k === DEX_TAB ? 'on' : ''}" data-act="dtab" data-t="${k}">${TABN[k]} ${stt[k][0]}/${stt[k][1]}</button>`).join('');
  const pct = Math.floor(stt[DEX_TAB][0] / stt[DEX_TAB][1] * 100);
  const ms = DEX_REWARD.map(([p, sh]) => { const id = DEX_TAB + p, got = d.claim[id], ok = pct >= p; return `<button class="btn sm ${ok && !got ? 'pri' : ''}" data-act="dclaim" data-t="${DEX_TAB}" data-p="${p}" ${ok && !got ? '' : 'disabled'}>${p}% 達成 ✦${sh}${got ? ' (受取済)' : ''}</button>`; }).join(' ');
  let body = '';
  if (DEX_TAB === 'en') {
    body = `<div class="dexg">${Object.keys(ENEMIES).map(k => {
      const e = ENEMIES[k], r = d.en[k];
      if (!r || !r.s) return `<div class="dcard unk"><div class="q">？</div><b>？？？</b><span class="sub">未遭遇</span></div>`;
      const rt = ['slash', 'pierce', 'blunt'].map(t => TYPE[t].n[0] + rtName(e.rt[t] || 1).slice(1)).join(' ');
      const rs = Object.entries(e.rs || {}).map(([s, v]) => (SIN[s] ? SIN[s].n : s) + '×' + v).join(' ') || '—';
      const ps = (e.pass || []).map(p => PASS[p] ? PASS[p].n : '').filter(Boolean).join('・') || '—';
      return `<div class="dcard ${e.boss ? 'boss' : ''}"><canvas width="208" height="192" data-art="${e.art}" data-k="${k}" data-boss="${e.boss ? 1 : 0}"></canvas><b>${esc(e.n)}${e.boss ? ' <span class="tag" style="color:#ff8a8a;border-color:#ff8a8a">BOSS</span>' : ''}</b><span class="sub">HP ${e.hp} / 遭遇${r.s} 撃破${r.d}</span><span class="sub">耐性 ${rt}</span><span class="sub">罪属性 ${esc(rs)}</span><span class="sub">${esc(ps)}</span></div>`;
    }).join('')}</div>`;
  } else if (DEX_TAB === 'id') {
    const st = SINNER_KEYS.map(k => `<button class="tab ${k === DEX_SID ? 'on' : ''}" data-act="dsid" data-sid="${k}">${esc(SINNERS[k].n)}</button>`).join('');
    const list = IDENT_LIST[DEX_SID].slice().sort((a, b) => IDENTS[a].tier - IDENTS[b].tier);
    body = `<div class="tabs">${st}</div><div class="dexg">${list.map(k => {
      const id = IDENTS[k], own = S.owned[k];
      return own ? `<div class="dcard"><canvas width="124" height="124" data-pk="${k}" data-m="face"></canvas><b>${esc(id.n)}</b><span class="sub">${'★'.repeat(id.tier)} / 同調${own}${S.equipped[DEX_SID] === k ? ' / 装備中' : ''}</span></div>`
        : `<div class="dcard unk"><div class="q">${'★'.repeat(id.tier)}</div><b>${esc(id.n)}</b><span class="sub">未入手</span></div>`;
    }).join('')}</div>`;
  } else {
    body = `<div class="dexg">${GIFT_KEYS.map(k => {
      const g = GIFTS[k], on = d.gift[k];
      return on ? `<div class="dcard"><div class="q" style="color:var(--lamp)">${g.g}</div><b>${esc(g.n)}</b><span class="sub">${'★'.repeat(g.t)}</span><span class="sub">${esc(g.d)}</span></div>` : `<div class="dcard unk"><div class="q">？</div><b>？？？</b><span class="sub">${'★'.repeat(g.t)}</span></div>`;
    }).join('')}</div>`;
  }
  scr(`<div class="sec-h"><h2>図鑑</h2><span class="eyebrow">CODEX</span></div><div class="tabs">${tabs}</div><div class="panel pad" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px"><span class="eyebrow">収集率 ${pct}%</span>${ms}</div>${body}`);
}
Object.assign(ACT, {
  dtab(d) { SFX.play('ui'); DEX_TAB = d.t; go('codex'); },
  dsid(d) { SFX.play('ui'); DEX_SID = d.sid; go('codex'); },
  dclaim(d) {
    const dx = dexState(), id = d.t + d.p, r = DEX_REWARD.find(x => x[0] === +d.p); if (!r || dx.claim[id]) return;
    const st = dexStats()[d.t]; if (Math.floor(st[0] / st[1] * 100) < +d.p) return;
    dx.claim[id] = 1; S.shards += r[1]; saveState(); refreshRes(); SFX.play('ok'); toast(`星屑 +${r[1]}`); go('codex');
  }
});
SCREENS.codex = scrCodex; BACK.codex = 'home';

/* ---------- ステージ★評価 ---------- */
const STAR_SHARDS = [0, 30, 50];
function starTurnLimit(st) { return st.boss ? 9 : 6; }
function starConds(st) { return ['クリア', '全員生存で勝利', `${starTurnLimit(st)}ターン以内に勝利`]; }
function starHtmlSmall(mask) { return [1, 2, 4].map(b => (mask & b) ? '★' : '☆').join(''); }
function stageStars(st, B) {
  S.stars = S.stars || {};
  const got = (B.side('A').every(u => u.alive) ? 2 : 0) | (B.turn <= starTurnLimit(st) ? 4 : 0) | 1;
  const old = S.stars[st.id] || 0, add = got & ~old; let sh = 0;
  [1, 2, 4].forEach((b, i) => { if (b !== 1 && (add & b)) sh += STAR_SHARDS[i] * (st.boss ? 2 : 1); });
  S.stars[st.id] = old | got; S.shards += sh;
  const cells = [1, 2, 4].map((b, i) => `<span style="opacity:${(got & b) ? 1 : .45};color:${(got & b) ? 'var(--lamp)' : 'var(--dim)'}">${(got & b) ? '★' : '☆'} ${starConds(st)[i]}${(add & b) && b !== 1 ? ' <b>(初達成 ✦+' + STAR_SHARDS[i] * (st.boss ? 2 : 1) + ')</b>' : ''}</span>`).join('');
  return { got, add, shards: sh, html: `<div class="stars">${cells}</div>` };
}
(function () {
  const prev = SCREENS.story;
  SCREENS.story = function (a) {
    prev(a);
    S.stars = S.stars || {};
    $$('#scr [data-act=stsel]').forEach(b => { const st = STAGES.find(s => s.id === b.dataset.st); if (st) b.querySelector('.sub').insertAdjacentHTML('beforeend', ` <span style="color:var(--lamp)">${starHtmlSmall(S.stars[st.id] || 0)}</span>`); });
    const sel = STAGES.find(s => s.id === STORY_SEL), rw = $('#scr .rew'); if (!sel || !rw) return;
    const m = S.stars[sel.id] || 0, mul = sel.boss ? 2 : 1;
    rw.insertAdjacentHTML('afterend', `<div class="stars stl"><div class="eyebrow">★評価(初達成で星屑)</div>${starConds(sel).map((c, i) => `<span style="color:${(m & [1, 2, 4][i]) ? 'var(--lamp)' : 'var(--dim)'}">${(m & [1, 2, 4][i]) ? '★' : '☆'} ${c}${i ? ` ✦${STAR_SHARDS[i] * mul}` : ''}</span>`).join('')}</div>`);
  };
})();

/* ---------- 戦闘結果: 個人別ダメージ集計 ---------- */
function dmgTable(B) {
  const us = B.side('A'); if (!us.length) return '';
  const mx = Math.max(1, ...us.map(u => u.dealt || 0)), top = us.reduce((a, u) => (u.dealt || 0) > ((a && a.dealt) || 0) ? u : a, null);
  return `<div class="dtab">${us.map(u => `<div class="dr"><span class="dn">${esc(u.name)}${u === top && (u.dealt || 0) > 0 ? ' <b style="color:var(--lamp)">MVP</b>' : ''}</span><span class="db"><i style="width:${Math.round((u.dealt || 0) / mx * 100)}%"></i></span><span class="dv num">${u.dealt || 0}</span></div>`).join('')}</div>`;
}

/* ---------- 採掘の曜日ボーナス ---------- */
const LUX_DAYS = [
  { w: '日', t: '全ダンジョンの報酬 ×1.5', all: 1.5 }, { w: '月', t: '糸の洞窟 報酬 ×2', thread: 2 }, { w: '火', t: '星屑の礼拝堂 報酬 ×2', shard: 2 },
  { w: '水', t: '掃討券の坑道 券 ×2', ticket: 2 }, { w: '木', t: '糸の洞窟 報酬 ×2', thread: 2 }, { w: '金', t: '星屑の礼拝堂 報酬 ×2', shard: 2 }, { w: '土', t: '掃討券の坑道 券 ×2', ticket: 2 }
];
function luxMul(did) { const d = LUX_DAYS[new Date().getDay()]; return d.all || d[did] || 1; }
function luxReward(did, r) {
  const m = luxMul(did), o = {}; if (r.thread) o.thread = Math.floor(r.thread * m); if (r.shards) o.shards = Math.floor(r.shards * m); if (r.tickets) o.tickets = Math.floor(r.tickets * m); return o;
}
function luxRewardText(did, r) {
  const o = luxReward(did, r), m = luxMul(did), x = m > 1 ? ` <b style="color:var(--lamp)">×${m}</b>` : '';
  return (o.thread ? '糸 +' + o.thread : o.shards ? '星屑 +' + o.shards : '掃討券 +' + o.tickets) + x;
}

/* ---------- セーブデータの書き出し / 読み込み ---------- */
function showSaveIO() {
  let code = ''; try { code = 'LWC1:' + btoa(unescape(encodeURIComponent(JSON.stringify(S)))); } catch (e) { }
  modal(`<h3>セーブデータ</h3><p style="font-size:12px;color:var(--dim)">下のコードを保存しておくと、別の端末・ブラウザで読み込めます(読み込むと現在のデータは上書きされます)。</p>
  <div class="eyebrow">書き出し</div><textarea id="svout" readonly rows="4" style="width:100%;font-size:11px">${code}</textarea>
  <div class="acts" style="justify-content:flex-start"><button class="btn sm" data-m="copy">コピー</button></div>
  <div class="eyebrow" style="margin-top:10px">読み込み</div><textarea id="svin" rows="4" placeholder="LWC1:..." style="width:100%;font-size:11px"></textarea>
  <p id="svmsg" style="font-size:12px;color:var(--dim);min-height:18px"></p>
  <div class="acts"><button class="btn" data-m="x">閉じる</button><button class="btn pri" data-m="load">読み込む</button></div>`, (k) => {
    const msg = t => { const m = $('#svmsg'); if (m) m.textContent = t; };
    if (k === 'copy') { const t = $('#svout'); t.select(); try { navigator.clipboard.writeText(t.value).then(() => msg('コピーしました'), () => msg('選択しました。手動でコピーしてください')); } catch (e) { msg('選択しました。手動でコピーしてください'); } }
    else if (k === 'load') {
      try {
        let v = ($('#svin').value || '').trim(); if (!v.startsWith('LWC1:')) throw 0;
        const d = JSON.parse(decodeURIComponent(escape(atob(v.slice(5))))); if (!d || d.v !== 1 || !d.owned || !d.lv) throw 0;
        localStorage.setItem(SAVE_KEY, JSON.stringify(d)); MEMSAVE = JSON.stringify(d);
        if (!loadState()) throw 0; saveState(); toast('読み込みました'); go('home');
      } catch (e) { msg('読み込めませんでした。コードを確認してください'); }
    } else closeModal();
  });
  $('#modal').dataset.lock = 1;
}

/* ============ 絆 ============ */
const BOND_MAX = 10;
const bondNeed = l => 30 + 20 * l;               // Lv l → l+1 に必要なEXP
function bondInfo(sid) {
  S.bond = S.bond || {}; let x = S.bond[sid] || 0, l = 1;
  while (l < BOND_MAX && x >= bondNeed(l)) { x -= bondNeed(l); l++; }
  return { lv: l, cur: l >= BOND_MAX ? 0 : x, need: l >= BOND_MAX ? 0 : bondNeed(l) };
}
function bondBonus(sid) { return (bondInfo(sid).lv - 1) * .01; }
function bondGain(sid, n) {
  const a = bondInfo(sid).lv; S.bond[sid] = (S.bond[sid] || 0) + n; const b = bondInfo(sid).lv, msgs = [];
  for (let l = a + 1; l <= b; l++) { S.shards += 30 * l; msgs.push(`${SINNERS[sid].n} 絆Lv${l}!(星屑 +${30 * l})`); }
  return msgs;
}
const _dexRecord = dexRecord;
dexRecord = function (B, spec) {
  _dexRecord(B, spec);
  try {
    if (B.result !== 'win' && B.result !== 'lose') return;
    if (spec && /^訓練/.test(spec.title || '')) return;
    const msgs = []; B.side('A').forEach(u => { if (u.sid) msgs.push(...bondGain(u.sid, B.result === 'win' ? 8 : 3)); });
    msgs.forEach((m, i) => setTimeout(() => toast(m), 600 + i * 900));
  } catch (e) { console.error(e); }
};
const _lvStatHtml = lvStatHtml;
lvStatHtml = function (sid, id, lv) {
  const b = bondInfo(sid);
  return _lvStatHtml(sid, id, lv) + `<div class="panel pad bondbox"><div class="eyebrow">絆 BOND</div><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><b style="font-size:20px;color:var(--lamp)">Lv${b.lv}${b.lv >= BOND_MAX ? ' MAX' : ''}</b><span class="db" style="flex:1;min-width:120px"><i style="width:${b.need ? Math.round(b.cur / b.need * 100) : 100}%"></i></span><span class="num" style="font-size:12px;color:var(--dim)">${b.need ? b.cur + ' / ' + b.need : 'MAX'}</span></div><p style="font-size:12px;color:var(--dim);margin:6px 0 0">出撃して戦闘を終えると絆EXPが貯まります(勝利+8 / 敗北+3)。絆Lvが上がるごとに与ダメージ+1%(最大+9%)、レベルアップ時に星屑 +30×Lv。現在の補正: <b>+${Math.round(bondBonus(sid) * 100)}%</b></p></div>`;
};

/* ============ デイリーログインボーナス ============ */
const LOGIN_REW = [
  { t: '星屑 ×100', s: 100 }, { t: '糸 ×300', th: 300 }, { t: '灯油 ×30', oil: 30 }, { t: '掃討券 ×2', tk: 2 },
  { t: '星屑 ×200', s: 200 }, { t: '糸 ×600', th: 600 }, { t: '星屑 ×500 + 掃討券 ×3', s: 500, tk: 3 }
];
function dayNo() { return Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000); }
function loginDue() { S.login = S.login || { last: -1, n: 0 }; return S.login.last !== dayNo(); }
function loginModal() {
  S.login = S.login || { last: -1, n: 0 }; const n = S.login.n % 7;
  modal(`<h3>ログインボーナス</h3><p style="text-align:center;font-size:12px;color:var(--dim)">7日で一巡します(いま ${n + 1}日目)</p><div class="lgrid">${LOGIN_REW.map((r, i) => `<div class="lcell ${i === n ? 'now' : i < n ? 'done' : ''}"><small>${i + 1}日目</small><b>${r.t}</b>${i < n ? '<span>✓</span>' : ''}</div>`).join('')}</div><div class="acts"><button class="btn pri" data-m="get">受け取る</button></div>`, k => {
    if (k !== 'get') return; const r = LOGIN_REW[n];
    if (r.s) S.shards += r.s; if (r.th) S.thread += r.th; if (r.tk) S.tickets = (S.tickets || 0) + r.tk;
    if (r.oil) { regenOil(); S.oil += r.oil; S.oilT = Date.now(); }
    S.login.last = dayNo(); S.login.n++; saveState(); refreshRes(); SFX.play('ok'); closeModal(); toast(`ログインボーナス: ${r.t}`);
  });
  $('#modal').dataset.lock = 1;
}
(function () {
  const prev = SCREENS.home; let shown = false;
  SCREENS.home = function (a) { prev(a); if (!shown && S.seen && S.seen.prologue && loginDue()) { shown = true; setTimeout(() => { if (CUR === 'home' && loginDue()) loginModal(); }, 500); } };
})();

/* ============ 週替わりの試練 ============ */
const TRIAL_BOSSES = ['gatekeeper', 'chorus', 'clock', 'mira', 'dawnclock'];
const TRIAL_DIFF = [{ n: '並', lv: 15, hp: 8, mul: 1 }, { n: '難', lv: 25, hp: 10, mul: 1.5 }, { n: '極', lv: 35, hp: 12, mul: 2 }];
const TRIAL_TURNS = 5, TRIAL_OIL = 10;
const TRIAL_TIERS = [{ p: 20, th: 300 }, { p: 40, s: 150 }, { p: 60, tk: 2 }, { p: 80, s: 300 }, { p: 100, tk: 3, s: 500 }];
function trialLv(i) { return Math.max(TRIAL_DIFF[i].lv, Math.round(lvCap() * [.5, .75, 1][i])); }
function weekNo() { return Math.floor((dayNo() + 3) / 7); }
function trialBoss() { return TRIAL_BOSSES[weekNo() % TRIAL_BOSSES.length]; }
function trialState() { const t = S.trial = S.trial || {}; if (t.wk !== weekNo()) { t.wk = weekNo(); t.best = [0, 0, 0]; t.claim = [0, 0, 0]; } return t; }
function trialRewText(r, m) { return [r.th && `糸 ${Math.floor(r.th * m)}`, r.s && `星屑 ${Math.floor(r.s * m)}`, r.tk && `券 ${Math.floor(r.tk * m)}`].filter(Boolean).join(' + '); }
function scrTrial() {
  setScene('plain', 'clock'); setTop('週替わりの試練', true);
  const t = trialState(), k = trialBoss(), e = ENEMIES[k];
  const left = 7 - ((dayNo() + 3) % 7);
  scr(`<div class="sec-h"><h2>週替わりの試練</h2><span class="eyebrow">TRIAL / 残り${left}日</span></div>
  <div class="panel pad" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:12px"><canvas width="208" height="192" data-art="${e.art}" data-k="${k}" data-boss="1" style="max-width:40%"></canvas><div style="flex:1;min-width:200px"><div class="eyebrow">今週の標的</div><h2 class="h-disp" style="font-weight:400;font-size:28px;margin:2px 0">${esc(e.n)}</h2><p style="font-size:13px;color:var(--dim)">${TRIAL_TURNS}ターン以内にどれだけ体力を削れるかを競います。削った割合に応じて報酬を獲得(各難度・週1回ずつ)。標的は毎週入れ替わります。出撃には灯油${TRIAL_OIL}が必要です。</p></div></div>
  <div class="two" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">${TRIAL_DIFF.map((d, i) => `<div class="panel cut pad"><div class="eyebrow">DIFFICULTY</div><h2 class="h-disp" style="font-weight:400;font-size:24px">${d.n} <small style="font-size:13px;color:var(--dim)">敵Lv${trialLv(i)}</small></h2><div class="dr" style="grid-template-columns:1fr 60px;margin:6px 0"><span class="db"><i style="width:${t.best[i]}%"></i></span><span class="num dv">${t.best[i]}%</span></div><div class="list">${TRIAL_TIERS.map((r, j) => `<div class="row" style="cursor:default;opacity:${t.best[i] >= r.p ? 1 : .5}"><span class="no">${r.p}%</span><span class="nm">${trialRewText(r, d.mul)}</span><span class="num">${t.claim[i] > j ? '✓' : ''}</span></div>`).join('')}</div><div class="acts" style="margin-top:10px"><button class="btn pri" data-act="trialgo" data-i="${i}" ${S.oil >= TRIAL_OIL ? '' : 'disabled'}>挑戦 (灯油${TRIAL_OIL})</button></div></div>`).join('')}</div>`);
}
SCREENS.trial = scrTrial; BACK.trial = 'home';
function startTrial(i) {
  const d = TRIAL_DIFF[i], k = trialBoss(), t = trialState();
  if (S.oil < TRIAL_OIL) { toast('灯油が足りません'); return; }
  regenOil(); S.oil -= TRIAL_OIL; S.oilT = Date.now(); saveState();
  launchBattle({ title: `試練「${ENEMIES[k].n}」(${d.n}) ${TRIAL_TURNS}ターン制`, theme: 'clock', boss: true, battle: { team: teamSpec(), supports: supportIds(), gifts: [], turnLimit: TRIAL_TURNS, enemies: [{ k, lv: trialLv(i), hpMul: d.hp }] } }, {
    onResult: (win, B, retreat) => {
      const boss = B.units.find(u => u.side === 'E'), pct = retreat ? 0 : win ? 100 : Math.min(99, Math.floor((boss.maxHp - boss.hp) / boss.maxHp * 100));
      const ts = trialState(); ts.best[i] = Math.max(ts.best[i], pct);
      let rs = [], got = { th: 0, s: 0, tk: 0 };
      TRIAL_TIERS.forEach((r, j) => { if (ts.claim[i] <= j && pct >= r.p) { ts.claim[i] = j + 1; got.th += Math.floor((r.th || 0) * d.mul); got.s += Math.floor((r.s || 0) * d.mul); got.tk += Math.floor((r.tk || 0) * d.mul); rs.push(r.p); } });
      S.thread += got.th; S.shards += got.s; S.tickets = (S.tickets || 0) + got.tk; if (win) bump('win'); saveState();
      return { html: `<div class="stt"><div><small>削った割合</small><b>${pct}%</b></div><div><small>今週の自己ベスト</small><b>${ts.best[i]}%</b></div></div>${rs.length ? `<div class="rew" style="justify-content:center">${got.th ? `<span>糸 +${got.th}</span>` : ''}${got.s ? `<span>星屑 +${got.s}</span>` : ''}${got.tk ? `<span>掃討券 +${got.tk}</span>` : ''}</div><p style="text-align:center;font-size:12px;color:var(--dim)">${rs.map(p => p + '%').join('・')} 達成報酬</p>` : '<p style="text-align:center;font-size:12px;color:var(--dim)">新しい達成報酬はありません</p>'}`, buttons: [{ t: 'もう一度', cls: 'pri', fn: () => startTrial(i) }, { t: '戻る', fn: () => go('trial') }] };
    }
  });
}
Object.assign(ACT, { trialgo(d) { SFX.play('ok'); startTrial(+d.i); } });

/* ============ 戦闘: 敵情報 / ログ ============ */
function showEnemyInfo(B) {
  const es = B.units.filter(u => u.side === 'E');
  const rows = es.map(e => {
    const rt = ['slash', 'pierce', 'blunt'].map(t => `${TYPE[t].n}${rtName(e.rt[t] == null ? 1 : e.rt[t])}`).join(' ');
    const rs = Object.entries(e.rs || {}).map(([s, v]) => `${SIN[s] ? SIN[s].n : s}×${v}`).join(' ') || '—';
    const ps = (e.pass || []).map(p => PASS[p] ? `<li><b>${esc(PASS[p].n)}</b> ${esc(PASS[p].d || '')}</li>` : '').join('');
    return `<div class="einf ${e.alive ? '' : 'dead'}"><h4>${esc(e.name)} <small>Lv${e.lv} / HP ${Math.max(0, Math.round(e.hp))}/${e.maxHp}${e.alive ? '' : ' / 撃破'}</small></h4><div class="sub">物理耐性: ${rt}</div><div class="sub">罪属性耐性: ${esc(rs)}</div>${ps ? `<ul class="pl">${ps}</ul>` : ''}</div>`;
  }).join('');
  modal(`<h3>敵情報</h3><div class="einfs">${rows}</div><div class="acts"><button class="btn pri" data-m="x">閉じる</button></div>`, () => closeModal());
}
function buildLogLines(B, ev) {
  const nm = r => { const u = B.U(r.u); return u ? u.name : '?'; };
  const sk = r => { const u = B.U(r.u), s = u && u.slots[r.s]; return s && s.skill ? s.skill.n : '?'; };
  const out = []; let cur = null;
  const flush = () => { if (cur) { out.push(cur); cur = null; } };
  for (const e of ev) {
    if (e.t === 'clash') { flush(); cur = { c: 'cl', t: `${nm(e.a)}「${sk(e.a)}」 ⚔ ${nm(e.b)}「${sk(e.b)}」${e.steal ? ' <b class="stl">奪取</b>' : ''}`, d: 0 }; }
    else if (e.t === 'atk') { flush(); const u = B.U(e.tu); cur = { c: 'at', t: `${nm(e.a)}「${sk(e.a)}」→ ${u ? u.name : '?'}${e.aoe ? ' (追撃)' : ''}`, d: 0 }; }
    else if (e.t === 'clashEnd' && cur) { cur.t += e.w ? ` ➜ <b>${nm(e.w)}</b> 勝利` : ' ➜ 相殺'; }
    else if (e.t === 'coin' && cur) { cur.d += (e.dmg || 0) + (e.extra || 0); }
    else if (e.t === 'ego') { flush(); out.push({ c: 'eg', t: `<b>E.G.O</b> ${nm({ u: e.u })}「${esc(e.sk)}」`, d: 0 }); }
    else if (e.t === 'atkEnd') flush();
  }
  flush();
  return out.map(o => `<div class="ll ${o.c}">${o.t}${o.d ? ` <span class="num">${o.d}</span>` : ''}</div>`);
}
function pushBattleLog(ui, B, ev) {
  try { ui.logs = ui.logs || []; ui.logs.push({ turn: B.turn, lines: buildLogLines(B, ev) }); if (ui.logs.length > 6) ui.logs.shift(); } catch (e) { console.error(e); }
}
function showBattleLog(ui) {
  const L = (ui.logs || []).slice().reverse();
  modal(`<h3>戦闘ログ</h3><div class="blog">${L.length ? L.map(t => `<div class="lt"><div class="eyebrow">TURN ${t.turn}</div>${t.lines.join('') || '<div class="ll">—</div>'}</div>`).join('') : '<p style="color:var(--dim)">まだ解決されたターンがありません。</p>'}</div><div class="acts"><button class="btn pri" data-m="x">閉じる</button></div>`, () => closeModal());
}

/* ============ 回想(ストーリーログ) ============ */
function recallItems() {
  const it = [];
  CHAPTERS.forEach(ch => {
    const seen = ch.id === 1 ? !!S.seen.prologue : !!S.seen['ch' + ch.id];
    it.push({ h: ch.n, cid: ch.id, t: '導入', lines: ch.intro, ok: seen && !!ch.intro });
    STAGES.filter(s => s.ch === ch.id).forEach(st => {
      if (st.story) it.push({ cid: ch.id, t: `${st.id} ${st.n}`, lines: st.story, ok: !!S.seen['pre:' + st.id] });
      if (typeof EPILOGUE !== 'undefined' && EPILOGUE[st.id]) it.push({ cid: ch.id, t: `${st.id} ${st.n} — 終幕`, lines: EPILOGUE[st.id], ok: !!S.seen['ep:' + st.id] });
    });
  });
  return it;
}
let RECALL = [];
function scrRecall() {
  setScene('plain', 'library'); setTop('回想', true);
  RECALL = recallItems(); let lastH = '', h = '';
  RECALL.forEach((r, i) => {
    if (r.h && r.h !== lastH) { lastH = r.h; h += `<div class="eyebrow" style="margin:14px 0 6px">${esc(r.h)}</div>`; }
    h += r.ok ? `<button class="row" data-act="recall" data-i="${i}"><span class="no">▶</span><span class="nm">${esc(r.t)}<div class="sub">${esc((r.lines[0] || '').slice(0, 40))}…</div></span></button>` : `<div class="row" style="opacity:.4;cursor:default"><span class="no">？</span><span class="nm">${esc(r.t)}<div class="sub">未開放</div></span></div>`;
  });
  scr(`<div class="sec-h"><h2>回想</h2><span class="eyebrow">STORY LOG</span></div><div class="list" style="max-width:720px">${h}</div>`);
}
SCREENS.recall = scrRecall; BACK.recall = 'home';
Object.assign(ACT, { recall(d) { const r = RECALL[+d.i]; if (r && r.ok) { SFX.play('ok'); dialog(r.lines); } } });

/* ============ おまかせ編成 ============ */
function autoFormation() {
  const best = {};
  SINNER_KEYS.forEach(sid => {
    const ks = (IDENT_LIST[sid] || []).filter(k => S.owned[k]); if (!ks.length) return;
    ks.sort((a, b) => (IDENTS[b].tier - IDENTS[a].tier) || (S.owned[b] - S.owned[a]));
    best[sid] = ks[0]; S.equipped[sid] = ks[0];
  });
  const sc = sid => sLv(sid) * 2 + IDENTS[best[sid]].tier * 6 + (S.owned[best[sid]] || 1);
  S.team = Object.keys(best).sort((a, b) => sc(b) - sc(a)).slice(0, 6);
}
(function () {
  const prev = SCREENS.form;
  SCREENS.form = function (a) {
    prev(a);
    const pr = $('#scr .presets .eyebrow'); if (pr) pr.insertAdjacentHTML('afterend', `<div class="prow"><button class="btn sm pri" data-act="autoform">おまかせ編成</button><span class="sub" style="font-size:11px">各灯守の最高ランクの人格を装備し、強い順に最大6人を出撃させます</span></div>`);
  };
  Object.assign(ACT, { autoform() { autoFormation(); saveState(); SFX.play('ok'); toast('おまかせ編成を適用しました'); go('form', null, true); } });
})();

/* ============ 章ナビ(80章対応) ============ */
function chapterState(c) { const first = STAGES.find(s => s.ch === c); return { cleared: !!S.cleared[c + '-5'], open: !!first && stageUnlocked(first.id) }; }
function chapNav(cur) {
  const ch = CHAPTERS.find(c => c.id === cur), latest = nextStage().ch;
  return `<div class="chnav"><button class="btn sm" data-act="chap" data-c="${Math.max(1, cur - 1)}" ${cur <= 1 ? 'disabled' : ''}>◀</button><button class="btn chpick" data-act="chpick">${esc(ch.n)} <small>(${cur}/${CHAPTERS.length}) ▼</small></button><button class="btn sm" data-act="chap" data-c="${Math.min(CHAPTERS.length, cur + 1)}" ${!chapterState(cur + 1).open ? 'disabled' : ''}>▶</button><button class="btn sm" data-act="chap" data-c="${latest}">最新章へ</button></div><div class="sub" style="margin:4px 0 8px;font-size:12px">レベル上限 <b class="num" style="color:var(--lamp)">Lv${lvCap()}</b> / 章のボスを倒すと +5(最大 Lv${LV_MAX})</div>`;
}
function chapterPicker(onPick) {
  const cells = CHAPTERS.map(c => { const s = chapterState(c.id); return `<button class="cpc ${s.cleared ? 'clr' : s.open ? 'now' : 'lk'}" data-m="c${c.id}" ${s.open || s.cleared ? '' : 'disabled'}>${c.id}</button>`; }).join('');
  modal(`<h3>章を選ぶ</h3><p style="font-size:12px;color:var(--dim);margin:0 0 6px">緑=クリア済み / 橙=挑戦中 / 灰=未解放</p><div class="cpgrid">${cells}</div><div class="acts"><button class="btn" data-m="x">閉じる</button></div>`, k => { closeModal(); if (k && k[0] === 'c' && k !== 'x') onPick(+k.slice(1)); });
}
Object.assign(ACT, { chpick() { SFX.play('ui'); chapterPicker(c => ACT.chap({ c })); } });

/* 回想も章ごとに表示 */
let RECALL_CH = 0;
SCREENS.recall = function () {
  setScene('plain', 'library'); setTop('回想', true);
  if (!RECALL_CH) RECALL_CH = Math.min(CHAPTERS.length, nextStage().ch);
  RECALL = recallItems(); const ch = CHAPTERS.find(c => c.id === RECALL_CH); let h = '';
  RECALL.forEach((r, i) => {
    if (r.cid !== RECALL_CH) return;
    h += r.ok ? `<button class="row" data-act="recall" data-i="${i}"><span class="no">▶</span><span class="nm">${esc(r.t)}<div class="sub">${esc((r.lines[0] || '').slice(0, 40))}…</div></span></button>` : `<div class="row" style="opacity:.4;cursor:default"><span class="no">？</span><span class="nm">${esc(r.t)}<div class="sub">未開放</div></span></div>`;
  });
  scr(`<div class="sec-h"><h2>回想</h2><span class="eyebrow">STORY LOG</span></div><div class="chnav"><button class="btn sm" data-act="rcc" data-d="-1" ${RECALL_CH <= 1 ? 'disabled' : ''}>◀</button><button class="btn chpick" data-act="rcpick">${esc(ch.n)} <small>(${RECALL_CH}/${CHAPTERS.length}) ▼</small></button><button class="btn sm" data-act="rcc" data-d="1" ${RECALL_CH >= CHAPTERS.length ? 'disabled' : ''}>▶</button></div><div class="list" style="max-width:720px;margin-top:10px">${h || '<p style="color:var(--dim)">この章に回想はありません。</p>'}</div>`);
};
Object.assign(ACT, {
  rcc(d) { SFX.play('ui'); RECALL_CH = Math.max(1, Math.min(CHAPTERS.length, RECALL_CH + (+d.d))); go('recall', null, true); },
  rcpick() { SFX.play('ui'); chapterPicker(c => { RECALL_CH = c; go('recall', null, true); }); }
});
/* 新章のボス戦後の終幕 */
(function () {
  const OUT = ['「……見事だ。進むがいい。」', '「灯が……まだ、燃えている……」', '「夜は、まだ、終わらない。だが——」', '「行け。お前の灯が尽きるまで。」', '「悪くない夜だった。」'];
  for (let k = 6; k <= CHAPTERS.length; k++) { const st = STAGES.find(s => s.id === k + '-5'), nx = CHAPTERS.find(c => c.id === k + 1); if (!st) continue; EPILOGUE[st.id] = [`${st.n}: ${OUT[k % OUT.length]}`, `ルーメン: 「${nx ? nx.n.replace(/^第.+幕/, '') + 'へ向かいましょう。' : '——夜明けです。ありがとう、指揮者さま。'}」`]; }
})();
