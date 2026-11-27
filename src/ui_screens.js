'use strict';
/* ============================================================
   LAMPWARDEN COMPANY — ui_screens.js
   メニュー画面群(タイトル/ホーム/物語/編成/灯守/抽出/採掘/鏡面螺旋)
   ============================================================ */
let CUR = 'title', CURARG = null;
const MS = { bg: null, theme: null, mode: 'plain', feat: null, t: 0, on: false, cv: null, c: null, fr: 0, last: 0 };

/* ---------- 背景シーン ---------- */
function setScene(mode, theme, feat) {
  if (!MS.cv) { MS.cv = $('#bgc'); MS.cv.width = 1280; MS.cv.height = 720; MS.c = MS.cv.getContext('2d'); }
  if (MS.theme !== theme) { MS.bg = new Background(theme); MS.theme = theme; }
  MS.mode = mode; MS.feat = feat || null;
  if (!MS.on) { MS.on = true; MS.last = performance.now(); requestAnimationFrame(sceneFrame); }
}
function sceneFrame(ts) {
  if (!MS.on) return; requestAnimationFrame(sceneFrame);
  if ($('#bgc').style.visibility === 'hidden') { MS.last = ts; return; }
  MS.fr++; if (MS.fr % 2) return;
  const dt = Math.min(.1, (ts - MS.last) / 1000); MS.last = ts; MS.t += dt;
  const c = MS.c, t = MS.t; c.setTransform(1, 0, 0, 1, 0, 0);
  const cam = { x: Math.sin(t * .15) * 30 };
  MS.bg.draw(c, t, cam);
  if (MS.mode === 'title') {
    SINNER_KEYS.forEach((sid, i) => {
      const nn = SINNER_KEYS.length, key = sid + '1', id = IDENTS[key], x = BW * (i + .5) / nn, y = 742 + (nn > 4 ? (i % 2) * 12 : 0), sc = nn > 4 ? .62 : .8;
      drawSinner(c, id.look, key, x, y, sc, 1, { t: t + i, pose: POSES.idle(t + i * .7), expr: 'n', glow: .35 });
    });
    const tg = c.createLinearGradient(0, 0, 0, 380); tg.addColorStop(0, 'rgba(4,3,10,.72)'); tg.addColorStop(1, 'rgba(4,3,10,0)'); c.fillStyle = tg; c.fillRect(0, 0, BW, 380);
  } else if (MS.mode === 'home' && MS.feat) {
    const sid = MS.feat, key = S.equipped[sid], id = IDENTS[key], sc = SIN[id.sin];
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(330, 420, 20, 330, 420, 360); g.addColorStop(0, rgba(sc.c, .38)); g.addColorStop(1, rgba(sc.c, 0)); c.fillStyle = g; c.fillRect(0, 0, 900, 720); c.restore();
    drawSinner(c, id.look, key, 330, 700, 1.02, 1, { t, pose: POSES.idle(t), expr: 'n', glow: .5 });
  }
  c.save(); c.fillStyle = BGTHEME[MS.theme].grade; c.globalCompositeOperation = 'overlay'; c.fillRect(0, 0, BW, BH); c.restore();
  const g = c.createRadialGradient(BW / 2, BH * .5, BH * .3, BW / 2, BH * .5, BW * .7); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.6)'); c.fillStyle = g; c.fillRect(0, 0, BW, BH);
  if (MS.mode !== 'title') { c.fillStyle = MS.mode === 'home' ? 'rgba(5,3,10,.25)' : 'rgba(5,3,10,.62)'; c.fillRect(0, 0, BW, BH); }
}

/* ---------- 汎用 ---------- */
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#toast').appendChild(t); setTimeout(() => t.remove(), 2800); }
function modal(html, acts) {
  const m = $('#modal'); m.hidden = false; m.innerHTML = `<div class="mbox">${html}</div>`;
  m.onclick = e => { if (e.target === m && !m.dataset.lock) closeModal(); const a = e.target.closest('[data-m]'); if (a && acts) { SFX.init(); acts(a.dataset.m, a); } };
}
function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; m.onclick = null; delete m.dataset.lock; }
function fillCanvases(root) {
  $$('canvas[data-pk]', root).forEach(cv => { const id = IDENTS[cv.dataset.pk]; if (!id) return; cv.getContext('2d').drawImage(portrait(id.look, cv.dataset.pk, cv.width, cv.height, cv.dataset.m || 'bust'), 0, 0); });
  $$('canvas[data-art]', root).forEach(cv => {
    const c = cv.getContext('2d'), e = { art: cv.dataset.art, boss: cv.dataset.boss === '1', pal: (ENEMIES[cv.dataset.k] || {}).pal }, w = cv.width, h = cv.height; c.clearRect(0, 0, w, h);
    const sc = Math.min(w / 340, h / ((ENEMY_H[e.art] || 440) + (e.art === 'moth' ? 170 : 110))); drawEnemy(c, e, w / 2, h - 10, sc, -1, { t: 1.2 });
  });
}
function resHtml() {
  regenOil();
  return `<div class="res pl" title="プレイヤーレベル: ステージ勝利で上昇。上がるたびに灯油全回復・全灯守のダメージ+1%(最大10%)"><i>PL</i><span class="num">${S.pl ? S.pl.lv : 1}</span></div><div class="res oil" title="灯油: ステージ挑戦に使用。時間で回復"><i>油</i><span class="num">${S.oil}</span><small>/${OIL_MAX}</small></div><div class="res thr" title="糸: 灯守の強化"><i>糸</i><span class="num">${S.thread}</span></div><div class="res shd" title="星屑: 抽出に使用"><i>星</i><span class="num">${S.shards}</span></div>`;
}
function setTop(title, back) {
  const t = $('#topbar'); t.hidden = false;
  t.innerHTML = (back ? `<button class="iconbtn" data-act="back" aria-label="戻る">←</button>` : '') + `<div class="ttl">${esc(title)}</div><div id="reswrap" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${resHtml()}</div><button class="iconbtn" data-act="help" aria-label="遊び方">?</button><button class="iconbtn" data-act="settings" aria-label="設定">⚙</button>`;
}
function refreshRes() { const w = $('#reswrap'); if (w) w.innerHTML = resHtml(); }
function dialog(lines) {
  return new Promise(res => {
    const d = $('#dialog'); d.hidden = false; let i = 0, tm = null, full = '', pos = 0;
    const show = () => {
      const ln = lines[i], k = ln.indexOf(':'), who = k > 0 && k < 14 ? ln.slice(0, k) : '', txt = k > 0 && k < 14 ? ln.slice(k + 1).trim() : ln;
      d.innerHTML = `<div class="dbox" tabindex="0"><div class="who">${esc(who)}</div><div class="txt"></div><div class="nx">▼</div></div>`; full = txt; pos = 0;
      const tx = $('.txt', d); clearInterval(tm); tm = setInterval(() => { pos++; tx.textContent = full.slice(0, pos); if (pos % 3 === 0) SFX.play('pick'); if (pos >= full.length) clearInterval(tm); }, 28);
    };
    d.onclick = () => { SFX.init(); if (pos < full.length) { clearInterval(tm); pos = full.length; $('.txt', d).textContent = full; return; } i++; if (i >= lines.length) { clearInterval(tm); d.hidden = true; d.onclick = null; d.innerHTML = ''; res(); } else show(); };
    show();
  });
}
function go(name, arg, keep) {
  const st = keep ? $('#scr').scrollTop : 0; CUR = name; CURARG = arg; closeModal(); $('#scr').scrollTop = 0;
  try { SCREENS[name](arg); } catch (e) { console.error(e); toast('画面の描画でエラーが発生しました'); }
  if (keep) $('#scr').scrollTop = st;
}
function scr(html, cls) { const s = $('#scr'); s.className = 'scr ' + (cls || ''); s.innerHTML = `<div class="wrap fade-in">${html}</div>`; fillCanvases(s); }
const BACK = { recall: 'home', trial: 'home', story: 'home', form: 'home', roster: 'home', gacha: 'home', lux: 'home', mirror: 'home', home: 'title' };

/* ---------- 共通HTML ---------- */
function scardHtml(sid, o) {
  o = o || {}; const id = sIdent(sid), sc = SIN[id.sin];
  return `<button class="scard ${o.on ? 'on' : ''}" data-act="${o.act || ''}" data-sid="${sid}" style="--sin:${sc.c}"><canvas width="264" height="352" data-pk="${id.key}" data-m="bust"></canvas><span class="lvb">Lv${sLv(sid)}</span>${o.badge ? `<span class="badge">${o.badge}</span>` : ''}<span class="meta"><b>${SINNERS[sid].n}</b><small>${esc(id.n)}</small></span></button>`;
}
const starsOf = t => '★'.repeat(t);
function skillCard(sk, key, sin, ik) {
  const mv = ik ? ((S.mast || {})[ik] || {})[key] || 0 : null;
  const sc = SIN[sk.sin || sin]; const label = key === 'def' ? (sk.kind === 'guard' ? 'GUARD' : sk.kind === 'evade' ? 'EVADE' : 'COUNTER') : key.toUpperCase();
  return `<div class="skill" style="--sin:${key === 'def' ? '#5b8cff' : sc.c}"><div class="ic"><span>${key === 'def' ? 'DEF' : key === 'ego' ? 'EGO' : key.toUpperCase()}</span><small>${SIN[sk.sin].n}</small></div><div><h4>${esc(sk.n)} <span class="tag">${kindName(sk)}</span> <span class="tag">${TYPE[sk.type].n}</span></h4><div class="coins num">威力 ${sk.base} / コイン威力 +${sk.cp} / コイン ${sk.nC}${sk.exec ? ' / 処刑+' + Math.round(sk.exec * 100) + '%' : ''}${sk.red ? ' / 被ダメ-' + Math.round(sk.red * 100) + '%' : ''}</div>${mv != null ? `<div class="mastery"><span>熟練度 ${mv}/1000</span><i><b style="width:${mv / 10}%"></b></i><span>与ダメージ +${mv}% / 合戦威力 +${Math.floor(mv / 5)}</span></div>` : ''}<p>${esc(descSkill(sk) || (sk.kind === 'guard' ? 'クラッシュに負けても被ダメージを軽減。勝利でSP+6。' : sk.kind === 'evade' ? 'クラッシュに勝つと全て回避しHP4%回復・SP+8。' : sk.kind === 'counter' ? 'クラッシュに勝つと追加ダメージ(×1.3)で反撃。' : ''))}</p></div></div>`;
}

/* ============ タイトル ============ */
function scrTitle() {
  setScene('title', 'title'); $('#topbar').hidden = true;
  scr(`<div class="title"><div class="logo"><small>灯と、夜の街</small><h1>灯守<span>カンパニー</span></h1><p>LAMPWARDEN COMPANY</p></div>
  <button class="btn pri big" data-act="start">夜へ出る</button><p class="hint">クリックで開始 / 音が出ます</p></div>`);
  $('#scr').className = 'scr';
}
/* ============ ホーム ============ */
function scrHome() {
  const feat = S.team[(Math.random() * S.team.length) | 0]; setScene('home', 'menu', feat); setTop('ノクターン街', true);
  const id = sIdent(feat), ns = nextStage(), cleared = Object.keys(S.cleared).length;
  const lockMir = !S.cleared['1-3'], lockLux = !S.cleared['1-2'];
  scr(`<div class="home"><div class="left"><div class="who">${SINNERS[feat].r} / ${esc(id.n)}</div><div class="quote">${esc(SINNERS[feat].quote)}</div></div>
  <div><div class="cont"><button class="btn pri" data-act="goStory" data-st="${ns.id}">▶ 続きから　${ns.id} ${esc(ns.n)}</button><span class="eyebrow">CLEARED ${cleared}/${STAGES.length}</span></div>
  <div class="menu-grid">
    ${mcard('story', '物語', '五つの幕を越えて、街の夜を明かす', '章', '#ffb347')}
    ${mcard('mirror', '鏡面螺旋', lockMir ? '1-3 クリアで解放' : 'ローグライク迷宮 / ギフトを集める', '鏡', '#b46bff', lockMir)}
    ${mcard('lux', '採掘', lockLux ? '1-2 クリアで解放' : '糸と星屑を集める周回迷宮', '掘', '#33d0c4', lockLux)}
    ${mcard('gacha', '抽出', 'アイデンティティを引き当てる', '抽', '#6cf0ff')}
    ${mcard('form', '編成', `出撃 ${S.team.length}/6 / 控えの支援効果`, '編', '#7ed36f')}
    ${mcard('roster', '灯守一覧', 'スキル・強化・E.G.O', '灯', '#f472a8')}
    ${mcard('mission', '任務', 'デイリー・実績・ログインボーナス', '任', '#ffd479', false, claimable())}
    ${mcard('tower', '無限回廊', '階層を登る・最高 ' + ((S.tower && S.tower.best) || 0) + '階', '塔', '#ff9a5a')}
    ${mcard('shop', '交換所', '星屑を糸・灯油・同調の欠片に交換', '換', '#e8c96a')}
    ${mcard('train', '訓練場', '敵とLvを選んで模擬戦', '練', '#6cf0ff')}
    ${mcard('trial', '週替わりの試練', S.cleared['1-5'] ? `今週の標的: ${ENEMIES[trialBoss()].n}` : '1-5 クリアで解放', '試', '#ff8a8a', !S.cleared['1-5'])}
    ${mcard('recall', '回想', '見たストーリーを読み返す', '想', '#e8b0ff')}
    ${mcard('codex', '図鑑', `敵・人格・ギフトの収集 ${(() => { const t = dexStats(); return t.en[0] + t.id[0] + t.gift[0]; })()}件`, '図', '#9fe0b0')}
    ${mcard('gear', '灯具', `刃・鎧・護符を装備して強化 (所持 ${Object.keys((S.gear && S.gear.items) || {}).length})`, '具', '#ffcf6a')}
    ${mcard('idle', '灯台の見張り', (() => { const r = idleCalc(); return r.h >= .1 ? `放置報酬 ${r.h.toFixed(1)}時間分 / 糸 ${r.thread}` : '離れている間も糸と星屑が貯まる'; })(), '見', '#9be39b', false, idleCalc().h >= 1 ? '!' : '')}
    ${mcard('record', '記録', 'プレイ記録・戦績・灯守ごとの出撃数', '録', '#a8c4ff')}
    ${mcard('gallery', '鑑賞室', '全モーション・表情差分を眺める', '鑑', '#8fb8ff')}
  </div></div></div>`);
  SFX.bgm('menu');
}
function mcard(act, t, sub, g, c, lock, badge) {
  return `<button class="mcard" data-act="${lock ? 'locked' : 'go'}" data-to="${act}" style="--c:${c};${lock ? 'filter:grayscale(.8) brightness(.7)' : ''}"><h3>${t}</h3><p>${sub}</p>${badge ? `<span class="badge">受取 ${badge}</span>` : ''}<span class="g">${g}</span></button>`;
}
/* ============ 物語 ============ */
let STORY_CH = 1, STORY_SEL = null, STORY_HARD = false;
function scrStory(arg) {
  setScene('plain', 'station'); setTop('物語', true);
  if (arg && arg.st) { const s = STAGES.find(x => x.id === arg.st); if (s) { STORY_CH = s.ch; STORY_SEL = s.id; } }
  if (!STORY_SEL || !stageUnlocked(STORY_SEL)) STORY_SEL = nextStage().id;
  const sel = STAGES.find(s => s.id === STORY_SEL); STORY_CH = sel.ch;
  const ch = CHAPTERS.find(c => c.id === STORY_CH);
  const tabs = chapNav(STORY_CH);
  const list = STAGES.filter(s => s.ch === STORY_CH).map(s => { const un = stageUnlocked(s.id); return `<button class="row ${s.id === STORY_SEL ? 'sel' : ''} ${un ? '' : 'lock'}" data-act="${un ? 'stsel' : 'locked'}" data-st="${s.id}"><span class="no">${s.id}</span><span class="nm">${esc(s.n)}${s.boss ? ' <span class="tag" style="color:#ff8a8a;border-color:#ff8a8a">BOSS</span>' : ''}<div class="sub">推奨 Lv${s.lv}</div></span>${S.cleared[s.id] ? '<span class="clr">CLEAR</span>' : un ? '' : '🔒'}</button>`; }).join('');
  if (!S.cleared[sel.id]) STORY_HARD = false;
  const hard = !!STORY_HARD, oilc = hard ? HARD_OIL : STAGE_OIL, first = !S.cleared[sel.id]; let rw = stageRewards(sel, first); if (hard) rw = hardRewards(sel, rw, !(S.hard && S.hard[sel.id]));
  const enemies = [...new Map(sel.en.map(e => [e.k, e])).values()].map(e => { const d = ENEMIES[e.k]; return `<div class="ecard"><canvas width="208" height="192" data-art="${d.art}" data-k="${e.k}" data-boss="${d.boss ? 1 : 0}"></canvas>${esc(d.n)}<br>Lv${e.lv + (hard ? HARD_LV : 0)}<span class="epass">${['slash', 'pierce', 'blunt'].map(t => TYPE[t].n[0] + rtName(d.rt[t] || 1).slice(1)).join(' ')}<br>${(d.pass || []).map(p => PASS[p] ? PASS[p].n : '').join('・')}</span></div>`; }).join('');
  const weak = [...new Set(sel.en.map(e => e.k))].map(k => { const d = ENEMIES[k]; const w = Object.entries(d.rt).filter(x => x[1] > 1).map(x => TYPE[x[0]].n); const wr = Object.entries(d.rs).filter(x => x[1] > 1).map(x => SIN[x[0]].n); return `<div class="sub">${esc(d.n)}: 弱点 ${[...w, ...wr].join('・') || '—'}</div>`; }).join('');
  const team = S.team.map(sid => { const id = sIdent(sid); return `<div class="mini" style="--sin:${SIN[id.sin].c}"><canvas width="124" height="124" data-pk="${id.key}" data-m="face"></canvas>Lv${sLv(sid)}</div>`; }).join('');
  scr(`<div class="sec-h"><h2>${esc(ch.n)}</h2><span class="eyebrow">STORY</span></div><div class="tabs">${tabs}</div>
  <div class="two"><div class="list">${list}</div>
  <div class="panel cut pad detail"><div class="eyebrow">STAGE ${sel.id} ${sel.boss ? '/ BOSS' : ''}</div><h2>${esc(sel.n)}</h2>
  ${S.cleared[sel.id] ? hardToggle(hard) : ''}<dl class="kv" style="margin-top:8px"><dt>推奨Lv</dt><dd class="num">${sel.lv + (hard ? HARD_LV : 0)}</dd><dt>消費</dt><dd class="num">灯油 ${oilc}</dd></dl>
  <div class="enemy-row">${enemies}</div>${weak}
  <div class="rew"><span>糸 +${rw.thread}</span><span>星屑 +${rw.shards}${first ? ' (初回)' : rw.hf ? ' (深夜初回)' : ''}</span><span>灯具ドロップ</span></div>
  <div class="eyebrow" style="margin-top:14px">編成</div><div class="team-strip">${team}</div>
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px"><button class="btn" data-act="go" data-to="form">編成を変更</button><button class="btn pri big" data-act="stgo" data-st="${sel.id}" ${S.oil < oilc ? 'disabled' : ''}>${hard ? '深夜に出撃' : '出撃'}</button></div></div></div>`);
  if (!S.seen.prologue) { S.seen.prologue = 1; saveState(); dialog(CHAPTERS[0].intro); }
}
async function startStage(id, hard) {
  const st = STAGES.find(s => s.id === id), oilc = hard ? HARD_OIL : STAGE_OIL; if (S.oil < oilc) { toast('灯油が足りません'); return; }
  if (S.team.length < 1) { toast('編成が空です'); return; }
  const ch = CHAPTERS.find(c => c.id === st.ch);
  if (!S.seen['ch' + ch.id] && st.id === ch.id + '-1') { S.seen['ch' + ch.id] = 1; if (ch.id > 1) await dialog(ch.intro); }
  if (st.story && !S.seen['pre:' + id]) { S.seen['pre:' + id] = 1; await dialog(st.story); }
  S.oil -= oilc; S.oilT = Date.now(); saveState();
  runStage(st, hard);
}
function runStage(st, hard) {
  const ch = CHAPTERS.find(c => c.id === st.ch);
  const spec = { title: `${hard ? '【深夜】' : ''}${st.id} ${st.n}`, theme: ch.theme, boss: !!st.boss, battle: { team: teamSpec(), supports: supportIds(), gifts: [], enemies: st.en.map(e => hard ? { k: e.k, lv: e.lv + HARD_LV, hpMul: HARD_HP } : { k: e.k, lv: e.lv }) } };
  launchBattle(spec, {
    onResult: (win, B, retreat) => {
      if (win) {
        const first = !S.cleared[st.id]; let rw = stageRewards(st, first); if (hard) { rw = hardRewards(st, rw, !(S.hard && S.hard[st.id])); S.hard = S.hard || {}; S.hard[st.id] = 1; } const gd = gearDrop({ lv: st.lv, boss: !!st.boss, hard: !!hard }); S.thread += rw.thread; S.shards += rw.shards; const capB = lvCap(); S.cleared[st.id] = 1; const capA = lvCap(); const gx = gainStageExp(st, first); const sr = stageStars(st, B); saveState(); bump('win'); refreshRes();
        const i = stageIndex(st.id), nx = STAGES[i + 1];
        const btns = [];
        if (!hard && nx && S.oil >= STAGE_OIL) btns.push({ t: `次へ ${nx.id}`, cls: 'pri', fn: () => { go('story', { st: nx.id }); } });
        btns.push({ t: 'ステージ選択', cls: nx ? '' : 'pri', fn: async () => { go('story', { st: st.id }); if (st.boss) { const ep = EPILOGUE[st.id]; if (ep && !S.seen['ep:' + st.id]) { S.seen['ep:' + st.id] = 1; saveState(); await dialog(ep); } } } });
        return { html: `<div class="rew" style="justify-content:center"><span>糸 +${rw.thread}</span><span>星屑 +${rw.shards}${first ? ' (初回)' : rw.hf ? ' (深夜初回)' : ''}</span><span>経験値 +${gx.exp}</span></div>${gearDropHtml(gd)}${sr.html}<p style="text-align:center;font-size:12px;color:var(--dim)">プレイヤーLv ${gx.lv}(${gx.cur}/${gx.need}) / 通算クリア ${gx.clears}回${gx.ups ? `<br><b style="color:var(--lamp)">レベルアップ!灯油が全回復し、全灯守のダメージ補正が +${Math.round(plBonus() * 100)}%(最大10%)になりました</b>` : ''}${gx.lvUp100 ? `<br><b style="color:var(--lamp)">通算${gx.clears}クリア!全灯守のレベルが+1されました</b>` : ''}</p>`, buttons: btns, fx: (st.boss && first && !hard && capA > capB) ? () => chapterClearFx(ch, capB, capA) : null };
      }
      return { html: `<p style="text-align:center;color:var(--dim)">${retreat ? '撤退した。' : '灯守たちは倒れた…。編成やレベルを見直そう。'}</p>`, buttons: [{ t: '再挑戦(灯油' + (hard ? HARD_OIL : STAGE_OIL) + ')', cls: 'pri', fn: () => { startStage(st.id, hard); } }, { t: '戻る', fn: () => go('story', { st: st.id }) }] };
    }
  });
}
const EPILOGUE = {
  '1-5': ['ガレス: 「……見事。通れ。だが、塔の頂に…夜明けは…」', 'ルーメン: 「門が開きました。次は歌う図書館です。」'],
  '2-5': ['合唱: 「ナ、マ、エ…ヲ…カエ…シ…」', '零: 「……貸し借りは、なしよ。」', 'ルーメン: 「最後の幕、時計塔へ向かいましょう。」'],
  '3-5': ['残響: 「…そうか。針は…進むのか。」', '——止まっていた時計が、夜の街に鐘を鳴らした。', 'ルーメン: 「夜明けです。ありがとう、指揮者さま。」', 'ルーメン: 「でも、鏡の向こうにはまだ——『鏡面螺旋』が口を開けています。」']
};
/* ============ 編成 ============ */
function scrForm() {
  setScene('plain', 'library'); setTop('編成', true);
  const seats = []; for (let i = 0; i < 6; i++) { const sid = S.team[i]; if (sid) { const id = sIdent(sid); seats.push(`<div class="seat full" style="--sin:${SIN[id.sin].c}"><canvas width="198" height="264" data-pk="${id.key}" data-m="bust"></canvas><div class="mv"><button data-act="seatmv" data-i="${i}" data-d="-1" aria-label="前へ">◀</button><button data-act="seatrm" data-i="${i}" aria-label="外す">✕</button><button data-act="seatmv" data-i="${i}" data-d="1" aria-label="後ろへ">▶</button></div></div>`); } else seats.push(`<div class="seat">${i + 1}</div>`); }
  const grid = SINNER_KEYS.map(sid => scardHtml(sid, { act: 'ftog', on: S.team.includes(sid), badge: S.team.includes(sid) ? S.team.indexOf(sid) + 1 : '' })).join('');
  const sup = supportIds().map(s => `<div><b>${esc(SUP[s].n)}</b> ${esc(SUP[s].d)}</div>`).join('') || '<div>控えの灯守がいません。</div>';
  const pw = S.team.reduce((a, s) => a + powerOf(s), 0);
  scr(`<div class="sec-h"><h2>編成</h2><span class="eyebrow">FORMATION / 最大6人</span></div>
  <div class="two" style="grid-template-columns:minmax(0,1fr) minmax(0,380px)"><div><div class="sgrid">${grid}</div></div>
  <div class="panel cut pad"><div class="eyebrow">出撃メンバー  総合戦力 <span class="num" style="color:var(--lamp)">${pw}</span></div><div class="seats" style="margin-top:8px">${seats.join('')}</div>
  <p style="font-size:12px;color:var(--dim);margin-bottom:10px">並びが戦闘時の配置(左が前列)。控えの灯守の「支援パッシブ」が出撃メンバー全員に効きます。</p>
  <div class="eyebrow">控えの支援パッシブ</div><div class="supbox" style="margin-top:6px">${sup}</div></div></div>`);
}
/* ============ 灯守一覧 ============ */
let ROS_SID = SINNER_KEYS[0], ROS_TAB = 'skill';
/* その灯守が付与できる状態(スキル・E.G.O・パッシブから抽出) */
function inflictable(id) {
  const out = new Map(), add = (f, src) => { if (f.k !== 'st') return; const self = f.to === 'self' || f.to === 'allies'; const o = out.get(f.s) || { k: f.s, self: false, foe: false, src: new Set() }; if (self) o.self = true; else o.foe = true; o.src.add(src); out.set(f.s, o); };
  const eg = EGOS[id.sid];
  [['S1', id.kit.s1], ['S2', id.kit.s2], ['S3', id.kit.s3], ['防御', id.kit.def], ['EGO', eg.aw], ['EGO', eg.co]].forEach(([n, sk]) => (sk.fx || []).forEach(f => add(f, n)));
  id.pass.forEach(pk => ((PASS[pk] || {}).fx || []).forEach(f => add(f, 'パッシブ')));
  return [...out.values()].sort((a, b) => (ST[b.k].uq ? 1 : 0) - (ST[a.k].uq ? 1 : 0));
}
function inflictHtml(id) {
  const list = inflictable(id);
  return `<div class="inflict"><div class="eyebrow">付与できる状態</div>${list.map(o => { const d = ST[o.k], tg = o.self && o.foe ? '自身/敵' : o.self ? '自身へ' : '敵へ'; return `<div class="ist" style="--c:${d.c}"><span class="gic">${d.g}</span><div><b>${esc(d.n)}</b> <span class="tag">${d.uq ? '固有 ' : ''}${d.buff ? '強化' : '弱体'}・${tg}</span><p>${esc(d.d)}</p></div></div>`; }).join('')}</div>`;
}
function lvStatHtml(sid, id, curLv) {
  const sd = SINNERS[sid], sy = sSync(id.key), k = BAL.kA, base = id.kit.s1.base, cp = id.kit.s1.cp;
  const hpAt = l => Math.round(sd.hp * (1 + BAL.hpLvA * (l - 1)) * (1 + .05 * (sy - 1)) * (1 + .04 * (id.tier - 1)));
  const lvs = [...new Set([1, 5, 10, 15, 20, 25, 30, curLv])].sort((a, b) => a - b);
  const rows = lvs.map(l => `<tr class="${l === curLv ? 'cur' : ''}"><td>Lv${l}${l === curLv ? ' <small>(現在)</small>' : ''}</td><td>${hpAt(l)}</td><td>×${lvMA(l).toFixed(2)}</td><td>${Math.round(base * k * lvMA(l))}〜${Math.round((base + id.kit.s1.nC * cp) * k * lvMA(l))}</td><td>${l >= LV_MAX ? 'MAX' : lvCost(l)}</td></tr>`).join('');
  const dif = [-12, -9, -6, -3, 0, 3, 6, 9, 12, 18, 24].map(d => `<tr class="${d === 0 ? 'cur' : ''}"><td>${d > 0 ? '+' : ''}${d}</td><td>${(Math.trunc(d / 3) > 0 ? '+' : '') + Math.trunc(d / 3)}</td><td>×${(d >= 0 ? 1 + d / (d + 25) : Math.max(.15, 1 + d / (-d + 12))).toFixed(2)}</td></tr>`).join('');
  return `<div class="lvtab"><p style="font-size:12px;color:var(--dim)">同調${sy}・★${id.tier}の「${esc(id.n)}」の値です(ギフトや編成の補正は含みません)。コイン威力は、S1のコイン1枚が裏〜全部表のときの基礎ダメージです。</p>
  <table class="lvt"><thead><tr><th>レベル</th><th>最大HP</th><th>与ダメージ倍率</th><th>S1の1コイン基礎ダメージ</th><th>強化に必要な糸</th></tr></thead><tbody>${rows}</tbody></table>
  <h4 style="margin:18px 0 6px">レベル差による補正</h4>
  <p style="font-size:12px;color:var(--dim)">自分のレベル − 相手のレベル = レベル差。<b>レベル差3ごとに合戦威力が+1</b>(低い側は-1)。レベルが上なら与ダメージが 1 + 差/(差+25) 倍に増え、<b>相手よりレベルが低い場合は 1 − 差/(差+12) 倍(最低×0.15)に減少</b>します。また、通算100クリアごとに全員のレベル+1の補正がかかります。</p>
  <table class="lvt"><thead><tr><th>レベル差</th><th>合戦威力</th><th>与ダメージ</th></tr></thead><tbody>${dif}</tbody></table>
  <h4 style="margin:18px 0 6px">速度と合戦</h4>
  <p style="font-size:12px;color:var(--dim)">自分のスキル速度が相手のスキル速度より高いと、相手のスキルを<b>奪取</b>して合戦できます。ただし、すでに互いを指定し合っている組(相互指定)は速度に関係なく合戦でき、第三者は奪えません。混乱中の相手とは合戦になりません。速度が足りない場合は直接攻撃になります。<br><b>回避・防御スキル</b>も敵のスキルを選択でき、自分の速度が選んだスキルより高ければ、そのスキルに先に使用(奪取)します。低い場合は、攻撃してきた順(速度の速い順)に受け身で回避します。<br><b>熟練度</b>は5ごとにそのスキルの合戦威力が+1されます。</p></div>`;
}
function scrRoster(arg) {
  setScene('plain', 'menu'); setTop('灯守一覧', true);
  if (arg && arg.sid) ROS_SID = arg.sid;
  const sid = ROS_SID, sd = SINNERS[sid], id = sIdent(sid), sc = SIN[id.sin], lv = sLv(sid);
  const grid = SINNER_KEYS.map(k => scardHtml(k, { act: 'rsel', on: k === sid })).join('');
  const idents = IDENT_LIST[sid].slice().sort((a, b) => IDENTS[a].tier - IDENTS[b].tier).map(ik => { const t = IDENTS[ik].tier, own = S.owned[ik], d = IDENTS[ik]; return `<button class="${S.equipped[sid] === ik ? 'on' : ''} ${own ? '' : 'no'}" data-act="${own ? 'ridn' : (((S.frag || {})[sid] || 0) >= FRAG_COST[t] ? 'fragx' : 'locked')}" data-ik="${ik}"><span class="stars">${starsOf(t)}</span> ${esc(d.n)}${own ? `<br><small style="color:var(--dim)">同調 ${own}/4</small>` : (((S.frag || {})[sid] || 0) >= FRAG_COST[t] ? `<br><small style="color:var(--lamp)">欠片${FRAG_COST[t]}で交換</small>` : `<br><small style="color:var(--dim)">未所持(欠片${FRAG_COST[t]}で交換可)</small>`)}</button>`; }).join('');
  const cost = lvCost(lv), can = S.thread >= cost && lv < lvCap();
  const hp = Math.round(sd.hp * (1 + BAL.hpLvA * (lv + clearLvBonus() - 1)) * (1 + .05 * (sSync(id.key) - 1)) * (1 + .04 * (id.tier - 1)));
  const kit = id.kit, eg = EGOS[sid];
  let body = '';
  if (ROS_TAB === 'skill') body = skillCard(kit.s1, 's1', null, id.key) + skillCard(kit.s2, 's2', null, id.key) + skillCard(kit.s3, 's3', null, id.key) + skillCard(kit.def, 'def', null, id.key) + `<p style="font-size:12px;color:var(--dim)">スロットごとに S1:S2:S3 = 3:2:1 の確率でスキルが配られます。別スキルへの変更は該当属性の資源を1消費します。</p>`;
  else if (ROS_TAB === 'pass') {
    const U = SUP[id.sup], all = id.passFull;
    body = all.map((pk, i) => { const P = PASS[pk], need = Math.floor(i / 2) + 1, inT = need <= id.tier, rq = passReqSync(i, id.pass.length), un = inT && sSync(id.key) >= rq; return `<div class="skill ${un ? '' : 'lockp'}" style="--sin:${sc.c}"><div class="ic"><span>PAS</span><small>${un ? (i === 0 ? '基本' : pk.startsWith('cb_') ? '戦闘強化' : '固有') : inT ? '同調' + rq + 'で解放' : '★' + need + '以上'}</small></div><div><h4>${esc(P.n)}</h4><p>${esc(P.d)}</p></div></div>`; }).join('')
      + `<div class="skill" style="--sin:#7ed36f"><div class="ic"><span>SUP</span><small>控え時</small></div><div><h4>${esc(U.n)}</h4><p>${esc(U.d)} (この灯守を出撃させない場合、出撃メンバー全員に効果)</p></div></div><p style="font-size:12px;color:var(--dim)">パッシブはアイデンティティの★が上がるほど増えます(★1:2個 / ★2:4個 / ★3:6個)。持っているパッシブは同調レベル(1〜4)が上がるごとに順に解放されます。戦闘強化は与ダメージ・合戦威力・コイン表確率などに効きます。</p>`;
  }
  else if (ROS_TAB === 'lv') body = lvStatHtml(sid, id, lv);
  else if (ROS_TAB === 'ego') body = skillCard(eg.aw, 'ego', null, id.key) + skillCard(eg.co, 'ego', null, id.key) + `<p style="font-size:12px;color:var(--dim)">E.G.Oは${SIN[eg.sin].n}の資源を3消費。SP0以上で「覚醒」、SP0未満で「侵蝕」(より強力だがSPを失う)。資源は属性スキルを使うたびに+1、チーム共有です。</p>`;
  else body = '';
  scr(`<div class="sec-h"><h2>灯守一覧</h2><span class="eyebrow">ROSTER</span></div>
  <div class="two" style="grid-template-columns:minmax(0,300px) minmax(0,1fr)"><div><div class="sgrid" style="grid-template-columns:repeat(3,1fr)">${grid}${minaCard()}</div></div>
  <div id="rdet"><div class="gacha" style="grid-template-columns:minmax(0,260px) minmax(0,1fr);align-items:start"><div class="bigport" style="--sin:${sc.c};--glow:${rgba(sc.c, .3)}"><canvas width="520" height="693" data-pk="${id.key}" data-m="full"></canvas><span class="gtag sinbadge" style="--sin:${sc.c}">${sc.n}</span></div>
  <div><div class="eyebrow">${sd.r}</div><h2 class="h-disp" style="font-size:30px;font-weight:400">${sd.n}</h2><div style="color:var(--dim);font-size:13px">${esc(id.n)} / ${TYPE[id.type].n} / ${sd.tag}</div><p style="margin:8px 0;font-size:13px">${esc(sd.bio)}</p><p style="font-size:13px;color:var(--lamp)">${esc(sd.quote)}</p>${inflictHtml(id)}
  <div class="fragline"><span class="fg">欠</span> ${esc(sd.n)}の欠片 <b>${(S.frag || {})[sid] || 0}</b><small>　同調MAXの人格を引くと増加(★1:+3 / ★2:+10 / ★3:+45)。未所持の人格と交換: ★1:30 / ★2:100 / ★3:300</small></div>
  <div class="ident-sw">${idents}</div>
  <div class="rtline">属性耐性(受けるダメージ): ${['slash', 'pierce', 'blunt'].map(t => `${TYPE[t].n} <b class="${(sd.rt[t] || 1) >= 2 ? 'w' : (sd.rt[t] || 1) < 1 ? 's' : ''}">${rtName(sd.rt[t] || 1)}</b>`).join(' / ')}</div>
  <div class="stat-big"><div><small>LEVEL</small><b>${lv}${clearLvBonus() ? `<em style="font-size:13px;color:var(--lamp);font-style:normal"> +${clearLvBonus()}</em>` : ''}</b></div><div><small>HP</small><b>${hp}</b></div><div><small>速度</small><b>${id.slots >= 2 ? '' : ''}${sd.spd[0]}-${sd.spd[1] + (id.tier === 3 ? 1 : 0)}</b></div><div><small>スロット</small><b>${id.slots}</b></div></div>
  <button class="btn pri" data-act="rlv" ${can ? '' : 'disabled'}>強化 Lv${lv}→${lv + 1}  糸 ${cost}</button> <button class="btn" data-act="rlvn" data-n="10" ${can ? '' : 'disabled'}>+10</button> <button class="btn" data-act="rlvn" data-n="999" ${can ? '' : 'disabled'}>上限まで</button> <span class="sub" style="font-size:12px;color:var(--dim)">現在の上限 Lv${lvCap()}${lvCap() >= LV_MAX ? '(最大)' : ' — 章のボスを倒すごとに+5'}</span></div></div>
  <div class="tabs" style="margin-top:16px">${[['skill', 'スキル'], ['pass', 'パッシブ'], ['ego', 'E.G.O'], ['lv', 'レベル別能力']].map(t => `<button class="tab ${ROS_TAB === t[0] ? 'on' : ''}" data-act="rtab" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>${body}</div></div>`);
}
/* ============ 抽出 ============ */
function scrGacha() {
  setScene('plain', 'mirror'); setTop('抽出', true);
  const feats = SINNER_KEYS.map(k => IDENTS[k + '3']);
  scr(`<div class="sec-h"><h2>抽出</h2><span class="eyebrow">EXTRACTION</span></div><div class="gacha"><div class="gbanner"><canvas id="gb" width="960" height="600"></canvas><div class="cap">夜明けの鏡<br><small style="font-size:.5em;letter-spacing:.2em;color:var(--lamp)">新たなアイデンティティを引き当てろ</small></div></div>
  <div class="panel cut pad"><div class="rates"><div>★★★ <b>${(RATE.r3 * 100).toFixed(0)}%</b>  /  ★★ <b>${(RATE.r2 * 100).toFixed(0)}%</b>  /  ★ <b>${((1 - RATE.r3 - RATE.r2) * 100).toFixed(0)}%</b></div><div>10連は★★以上を1つ保証。★★★は40回で必ず排出(あと <b>${Math.max(0, 40 - S.pity3)}</b> 回)。</div><div>所持済みは「同調」が上がり(最大4)、同調が最大(4)の人格をさらに引くと、その灯守の「欠片」(★1:3個 / ★2:10個 / ★3:45個)に変換されます。欠片は灯守一覧で、その灯守の未所持の人格と交換できます(★1:30 / ★2:100 / ★3:300)。</div></div>
  <div class="pullbtns"><button class="btn big" data-act="pull" data-n="1" ${S.shards < PULL_COST ? 'disabled' : ''}>1回 ✦${PULL_COST}</button><button class="btn pri big" data-act="pull" data-n="10" ${S.shards < PULL_COST * 10 ? 'disabled' : ''}>10連 ✦${PULL_COST * 10}</button></div>
  <p style="font-size:12px;color:var(--dim);margin-top:10px">累計 ${S.pulls} 回 / 星屑はステージ・採掘・鏡面螺旋で入手</p></div></div>`);
  const cv = $('#gb'), c = cv.getContext('2d'), g = c.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, '#1a1030'); g.addColorStop(1, '#07050c'); c.fillStyle = g; c.fillRect(0, 0, 960, 600);
  feats.forEach((id, i) => { const pc = portrait(id.look, id.key, 340, 520, 'full'); c.save(); c.shadowColor = SIN[id.sin].c; c.shadowBlur = 40; c.drawImage(pc, 130 + i * 400, 40 + (i === 1 ? -20 : 20), 340, 520); c.restore(); });
}
function doPull(n) {
  SFX.init(); const out = pullMany(n); if (!out) { toast('星屑が足りません'); return; }
  if (typeof pullShow === 'function') { pullShow(out, n); return; }
  const top = Math.max(...out.map(r => r.tier)); SFX.play('gacha');
  const ov = document.createElement('div'); ov.className = 'reveal';
  const cards = out.map((r, i) => { const id = IDENTS[r.ik], sc = SIN[id.sin]; return `<div class="rcard r${r.tier}" style="--sin:${sc.c};animation-delay:${.9 + i * .18}s"><canvas width="300" height="400" data-pk="${r.ik}" data-m="bust"></canvas>${r.isNew ? '<span class="nw">NEW</span>' : ''}<div class="meta"><span class="stars">${starsOf(r.tier)}</span><br><b>${SINNERS[r.sid].n}</b><br><small>${esc(id.n)}</small><br><small style="color:var(--lamp)">${r.frag ? '同調MAX → ' + SINNERS[r.sid].n + 'の欠片+' + r.frag : '同調 ' + r.sync + '/4'}</small></div></div>`; }).join('');
  ov.innerHTML = `<div class="eyebrow" style="letter-spacing:.4em">EXTRACTION</div>${n === 1 ? `<div class="one-reveal">${cards}</div>` : `<div class="rgrid">${cards}</div>`}<button class="btn pri big" data-act="gok" style="animation:rin .5s ease ${1 + out.length * .18}s both;opacity:0">OK</button>`;
  $('#app').appendChild(ov); fillCanvases(ov);
  setTimeout(() => SFX.play('reveal', { rare: top - 1 }), 900);
  ov.addEventListener('click', e => { if (e.target.closest('[data-act="gok"]')) { SFX.play('ok'); ov.remove(); go('gacha'); } });
}
/* ============ 採掘 ============ */
function scrLux() {
  setScene('plain', 'clock'); setTop('採掘', true);
  scr(`<div class="sec-h"><h2>採掘</h2><span class="eyebrow">LUXCAVATION / 灯油 8</span></div><div class="panel pad luxday"><b>本日(${LUX_DAYS[new Date().getDay()].w}曜)のボーナス</b>: ${LUX_DAYS[new Date().getDay()].t}</div><p style="font-size:12px;color:var(--dim);margin:0 0 10px">所持 掃討券 <b class="num" style="color:var(--lamp)">${S.tickets || 0}</b> 枚(クリア済みステージの掃討に1回1枚使います)</p><div class="two" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">${LUX.map(d => `<div class="panel cut pad"><div class="eyebrow">${{ thread: 'THREAD', shard: 'SHARD', ticket: 'TICKET' }[d.id]}</div><h2 class="h-disp" style="font-weight:400;font-size:26px">${d.n}</h2><p style="color:var(--dim);font-size:13px;margin:4px 0 10px">${d.d}</p><div class="list luxl">${d.rows.map((r, i) => `<button class="row ${r.lv > lvCap() ? 'lock' : ''}" data-act="${r.lv > lvCap() ? 'locked' : 'luxgo'}" data-d="${d.id}" data-i="${i}"><span class="no">${r.n}</span><span class="nm">${r.en.map(e => ENEMIES[e.k].n).filter((v, k, a) => a.indexOf(v) === k).join(' / ')}<div class="sub">${r.lv > lvCap() ? `上限Lv${r.lv}で解放(章を進めよう)` : luxRewardText(d.id, r.r)}</div></span><span class="num">${r.lv > lvCap() ? '🔒' : '▶'}</span></button>`).join('')}</div></div>`).join('')}</div>`);
}
function startLux(did, i) {
  const d = LUX.find(x => x.id === did), r0 = d.rows[i], r = Object.assign({}, r0, { r: luxReward(did, r0.r) }); if (r0.lv > lvCap()) { toast(`レベル上限が Lv${r0.lv} になると解放されます`); return; } if (S.oil < 8) { toast('灯油が足りません (8必要)'); return; }
  S.oil -= 8; S.oilT = Date.now(); saveState(); bump('dun');
  launchBattle({ title: `${d.n} ${r.n}`, theme: d.theme, battle: { team: teamSpec(), supports: supportIds(), gifts: [], enemies: r.en.map(e => ({ k: e.k, lv: e.lv })) } }, {
    onResult: win => {
      if (win) { bump('win'); if (r.r.thread) S.thread += r.r.thread; if (r.r.shards) S.shards += r.r.shards; if (r.r.tickets) S.tickets = (S.tickets || 0) + r.r.tickets; const gd = gearDrop({ lv: r0.lv, lux: true }); saveState(); return { html: `${gearDropHtml(gd)}<div class="rew" style="justify-content:center">${r.r.thread ? `<span>糸 +${r.r.thread}</span>` : ''}${r.r.shards ? `<span>星屑 +${r.r.shards}</span>` : ''}${r.r.tickets ? `<span>掃討券 +${r.r.tickets}</span>` : ''}</div>`, buttons: [{ t: 'もう一度', cls: 'pri', fn: () => startLux(did, i) }, { t: '戻る', fn: () => go('lux') }] }; }
      return { html: '', buttons: [{ t: '戻る', cls: 'pri', fn: () => go('lux') }] };
    }
  });
}
/* ============ 鏡面螺旋 ============ */
const NODE = { battle: ['⚔', '戦闘'], elite: ['☠', '精鋭'], event: ['✦', '事件'], rest: ['☾', '休息'], shop: ['◇', '商店'], boss: ['♛', 'BOSS'] };
function scrMirror() {
  setScene('plain', 'mirror'); setTop('鏡面螺旋', true);
  const run = S.mirror.run;
  if (!run) {
    scr(`<div class="sec-h"><h2>鏡面螺旋</h2><span class="eyebrow">MIRROR SPIRAL</span></div><div class="panel cut pad detail" style="max-width:760px">
    <p>鏡の向こうの迷宮。全3層、各層は4つの分岐と最奥のボスで構成されます。HPとSPは戦闘をまたいで引き継がれ、倒れた灯守は復帰しません。</p>
    <ul style="color:var(--dim);font-size:14px;margin:10px 0;padding-left:20px;display:grid;gap:4px"><li>戦闘後、<b style="color:var(--bone)">E.G.Oギフト</b>を1つ選んで入手(全員に効果)</li><li>精鋭は★2以上のギフトが確定。商店ではコインでギフトや回復を購入</li><li>事件ノードでは選択がHPやギフトを左右します</li><li>各層のボスは本編のボスが強化されて立ちはだかります</li></ul>
    <dl class="kv"><dt>最高到達</dt><dd class="num">${S.mirror.best} 層クリア</dd><dt>挑戦回数</dt><dd class="num">${S.mirror.runs}</dd><dt>編成</dt><dd>現在の出撃メンバー(Lv8補正)</dd></dl>
    <div style="margin-top:14px"><button class="btn pri big" data-act="mstart">潜る</button></div></div>`);
    return;
  }
  const f = MIRROR_FLOORS[run.floor]; if (!run.nodes) { run.nodes = mirrorGenNodes(run); saveState(); }
  const cols = run.nodes.map((col, ci) => `<div class="mcol">${col.map((t, ki) => { const done = ci < run.step, cur = ci === run.step, chosen = run.picked && run.picked[ci] === ki; return `<button class="node ${t} ${done && !chosen ? 'done' : ''}" ${cur ? `data-act="mnode" data-k="${ki}"` : 'disabled'} ${cur ? '' : 'aria-disabled="true"'}><b>${NODE[t][0]}</b>${NODE[t][1]}</button>`; }).join('')}</div>`).join('');
  const team = run.team.map(m => { const id = IDENTS[m.ik]; return `<div class="row" style="padding:6px 10px;gap:8px;--sin:${SIN[id.sin].c}"><div class="mini" style="width:40px"><canvas width="80" height="80" data-pk="${m.ik}" data-m="face" style="width:40px;height:40px"></canvas></div><div style="flex:1;min-width:0"><div class="nm" style="font-size:13px">${SINNERS[m.sid].n} <span class="num" style="color:var(--dim);font-size:11px">Lv${m.lv}</span></div><div class="hpline"><i style="width:${Math.round(m.hpFrac * 100)}%"></i></div></div><span class="num" style="font-size:12px;color:${m.hpFrac > 0 ? 'var(--dim)' : 'var(--blood)'}">${m.hpFrac > 0 ? Math.round(m.hpFrac * 100) + '%' : '戦闘不能'}</span></div>`; }).join('');
  const gifts = run.gifts.map(k => `<span class="tag" title="${esc(GIFTS[k].d)}" style="color:var(--lamp);border-color:var(--lamp)">${GIFTS[k].g} ${esc(GIFTS[k].n)}</span>`).join(' ') || '<span class="sub" style="color:var(--dim)">なし</span>';
  scr(`<div class="sec-h"><h2>${esc(f.n)}</h2><span class="eyebrow">FLOOR ${run.floor + 1}/3 / コイン ${run.coin}</span></div>
  <div class="two" style="grid-template-columns:minmax(0,1fr) minmax(0,300px)"><div><div class="panel cut pad"><div class="mmap">${cols}</div></div><div style="margin-top:12px"><div class="eyebrow">所持ギフト</div><div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">${gifts}</div></div></div>
  <div><div class="eyebrow" style="margin-bottom:6px">チーム</div><div class="list">${team}</div><div style="margin-top:12px"><button class="btn red sm" data-act="mgiveup">諦める</button></div></div></div>`);
}
function mirrorStart() {
  S.mirror.run = mirrorNew(); S.mirror.runs++; saveState(); bump('dun'); go('mirror');
}
function mirrorEnd(ok) {
  const run = S.mirror.run; const fl = run.cleared + (ok ? 0 : 0);
  const thread = 220 * fl + (ok ? 600 : 0) + run.step * 40, shards = 120 * fl + (ok ? 300 : 0);
  S.thread += thread; S.shards += shards; S.mirror.best = Math.max(S.mirror.best, fl); S.mirror.run = null; saveState();
  modal(`<h3>${ok ? '鏡面螺旋 踏破' : '迷宮から退却'}</h3><p style="color:var(--dim)">${fl}層を突破しました。</p><div class="rew"><span>糸 +${thread}</span><span>星屑 +${shards}</span></div><div class="acts"><button class="btn pri" data-m="ok">戻る</button></div>`, () => { closeModal(); go('mirror'); });
  $('#modal').dataset.lock = 1;
}
function mirrorNode(k) {
  const run = S.mirror.run, t = run.nodes[run.step][k]; run.picked = run.picked || {}; run.picked[run.step] = k;
  if (t === 'battle' || t === 'elite' || t === 'boss') mirrorBattle(run, t);
  else if (t === 'event') mirrorEvent(run);
  else if (t === 'rest') mirrorRest(run);
  else if (t === 'shop') mirrorShop(run);
}
function mirrorBattle(run, type) {
  const f = MIRROR_FLOORS[run.floor], alive = run.team.filter(m => m.hpFrac > 0);
  const team = run.team.map(m => ({ sid: m.sid, ik: m.ik, lv: m.lv, sync: m.sync, st: { hpFrac: m.hpFrac, sp: m.sp } }));
  const enemies = mirrorEnemies(run, type);
  launchBattle({ title: `${f.n} / ${NODE[type][1]}`, theme: f.theme, boss: type === 'boss', battle: { team, supports: supportIds(), gifts: run.gifts, enemies } }, {
    onResult: (win, B, retreat) => {
      B.side('A').forEach((u, i) => { run.team[i].hpFrac = u.alive ? clamp(u.hp / u.maxHp, .01, 1) : 0; run.team[i].sp = u.alive ? clamp(Math.round(u.sp * .5), -30, 30) : 0; });
      if (!win) { return { html: '<p style="text-align:center;color:var(--dim)">灯守たちは鏡の中へ飲み込まれた…。</p>', buttons: [{ t: '迷宮を出る', cls: 'pri', fn: () => mirrorEnd(false) }] }; }
      const coin = type === 'boss' ? 120 : type === 'elite' ? 90 : 55; run.coin += coin;
      saveState();
      return { html: `<div class="rew" style="justify-content:center"><span>コイン +${coin}</span></div>`, buttons: [{ t: 'ギフトを選ぶ', cls: 'pri', fn: () => mirrorGiftPick(run, type) }] };
    }
  });
}
function mirrorGiftPick(run, type) {
  const opts = pickGifts(run, 3, type === 'boss' ? 3 : type === 'elite' ? 2 : 0);
  if (!opts.length) { mirrorAdvance(run, type); return; }
  SFX.play('gift');
  modal(`<h3>E.G.Oギフトを選択</h3><p style="color:var(--dim);font-size:13px">選んだギフトは、この迷宮の間ずっと全員に効果があります。</p><div class="gifts">${opts.map(k => { const g = GIFTS[k]; return `<button class="gift t${g.t}" data-m="${k}"><div class="gi">${g.g}</div><b>${esc(g.n)}</b><small>${starsOf(g.t)}</small><p>${esc(g.d)}</p></button>`; }).join('')}</div><div class="acts"><button class="btn sm" data-m="skip">受け取らない</button></div>`,
    (k) => { if (k !== 'skip') { run.gifts.push(k); toast(`${GIFTS[k].n} を入手`); SFX.play('ok'); } closeModal(); mirrorAdvance(run, type); });
  $('#modal').dataset.lock = 1;
}
function mirrorAdvance(run, type) {
  if (type === 'boss') {
    run.cleared++; run.floor++; run.step = 0; run.nodes = null; run.picked = {};
    if (run.floor >= MIRROR_FLOORS.length) { mirrorEnd(true); return; }
    run.team.forEach(m => { if (m.hpFrac > 0) m.hpFrac = Math.min(1, m.hpFrac + .3); });
    toast('次の層へ。生存者のHPが少し回復した'); saveState(); go('mirror'); return;
  }
  run.step++; saveState(); go('mirror');
}
function mirrorEvent(run) {
  const ev = MIRROR_EVENTS[(Math.random() * MIRROR_EVENTS.length) | 0];
  modal(`<h3>${esc(ev.n)}</h3><p style="color:var(--dim)">${esc(ev.d)}</p><div class="list" style="margin-top:12px">${ev.ch.map((c, i) => `<button class="row" data-m="${i}"><span class="nm">${esc(c.t)}</span></button>`).join('')}</div>`, (i) => {
    const c = ev.ch[+i]; let msg = c.msg;
    if (c.r === 'heal') run.team.forEach(m => { if (m.hpFrac > 0) m.hpFrac = Math.min(1, m.hpFrac + .2); });
    else if (c.r === 'coin') run.coin += 60;
    else if (c.r === 'sp') run.team.forEach(m => { m.sp = Math.min(45, m.sp + 15); });
    else if (c.r === 'gift') { const g = pickGifts(run, 1, 0)[0]; if (g) { run.gifts.push(g); msg = `${GIFTS[g].n} を手に入れた。`; } else msg = '何も得られなかった。'; }
    else if (c.r === 'gamble') { if (run.coin >= 40 && Math.random() < .5) { run.coin += run.coin; msg = 'コインが倍になった!'; } else if (run.coin >= 40) { run.coin = 0; msg = 'すべて失った…。'; } else msg = '賭ける元手が足りなかった。'; }
    closeModal(); toast(msg); run.step++; saveState(); go('mirror');
  });
  $('#modal').dataset.lock = 1;
}
function mirrorRest(run) {
  modal(`<h3>休息の灯</h3><p style="color:var(--dim)">静かな灯が揺れている。どう過ごす?</p><div class="list" style="margin-top:12px"><button class="row" data-m="heal"><span class="nm">傷を癒す<div class="sub">生存者のHP+35%</div></span></button><button class="row" data-m="sp"><span class="nm">心を鎮める<div class="sub">生存者のSP+20</div></span></button></div>`, (k) => {
    run.team.forEach(m => { if (m.hpFrac > 0) { if (k === 'heal') m.hpFrac = Math.min(1, m.hpFrac + .35); else m.sp = Math.min(45, m.sp + 20); } });
    SFX.play('heal'); closeModal(); run.step++; saveState(); go('mirror');
  }); $('#modal').dataset.lock = 1;
}
function mirrorShop(run) {
  const stock = run.shop || (run.shop = { g: pickGifts(run, 3, 0), heal: 1 });
  const price = t => [0, 60, 100, 160][t];
  const draw = () => {
    modal(`<h3>鏡の商店</h3><p style="color:var(--dim)">所持コイン <b class="num" style="color:var(--lamp)">${run.coin}</b></p><div class="gifts">${stock.g.map((k, i) => { const g = GIFTS[k]; return k ? `<button class="gift t${g.t}" data-m="g${i}" ${run.coin < price(g.t) ? 'style="opacity:.45"' : ''}><div class="gi">${g.g}</div><b>${esc(g.n)}</b><small>${starsOf(g.t)} ✦${price(g.t)}</small><p>${esc(g.d)}</p></button>` : ''; }).join('')}</div>
    <div class="list" style="margin-top:10px"><button class="row" data-m="heal" ${stock.heal ? '' : 'style="opacity:.4"'}><span class="nm">応急処置<div class="sub">生存者のHP+30% / ✦40</div></span></button></div><div class="acts"><button class="btn pri" data-m="leave">店を出る</button></div>`, (k) => {
      if (k === 'leave') { run.shop = null; closeModal(); run.step++; saveState(); go('mirror'); return; }
      if (k === 'heal') { if (stock.heal && run.coin >= 40) { run.coin -= 40; stock.heal = 0; run.team.forEach(m => { if (m.hpFrac > 0) m.hpFrac = Math.min(1, m.hpFrac + .3); }); SFX.play('heal'); draw(); } else toast('購入できません'); return; }
      const i = +k.slice(1), g = stock.g[i]; if (!g) return; const p = price(GIFTS[g].t); if (run.coin < p) { toast('コインが足りません'); SFX.play('deny'); return; }
      run.coin -= p; run.gifts.push(g); stock.g[i] = null; SFX.play('coin'); draw();
    }); $('#modal').dataset.lock = 1;
  }; draw();
}
/* ============ 遊び方・設定 ============ */
function showHelp() {
  const sec = (h, p) => `<div style="margin-bottom:12px"><h4 style="margin:0 0 2px;color:var(--lamp);font-size:15px">${h}</h4><p style="font-size:13px;color:var(--dim)">${p}</p></div>`;
  modal(`<h3>遊び方</h3>${sec('1. 計画と解決', '各灯守は「スロット」ごとにスキルを持ちます。スロットを選んでスキルを変え、敵のスキル(チップ)を選ぶと矢印が引かれ、勝率が表示されます。敵本体を選ぶと直接攻撃です。「戦闘開始」で一斉に解決します。')}${sec('2. 速度', 'スロットの速度が高い順に行動します。速いスロットは、遅い相手スキルを引き込んでクラッシュさせられます。')}${sec('3. コインとクラッシュ', 'スキルは複数のコインを持ち、表の数だけ威力が上がります。クラッシュでは毎ラウンド全コインを振り、威力が低い側のコインが1枚割れます。コインが尽きた側の負けで、勝者の残りコインが敵に命中します。')}${sec('4. 正気度(SP)', 'SPが高いほどコインが表になりやすく(1ポイントで1%)、低いと裏が増えます。被弾やクラッシュ敗北で下がり、-45で「パニック」。2ターン操作不能で弱体化します。')}${sec('5. 混乱', 'HPが閾値を下回ると「混乱」。次のターン終了まで行動不能になり、被ダメージが1.5倍。敵の大技を止める最大のチャンスです。')}${sec('6. 資源とE.G.O', 'スキルを使うと同属性の資源が+1(チーム共有)。E.G.Oは資源3で発動する切り札で、SP0以上なら覚醒、未満なら侵蝕(より強力)。スキルの変更は資源1を消費します。')}${sec('7. 防御スキル', '防御=クラッシュ敗北時もダメージ軽減、回避=勝つと全回避、反撃=勝つとダメージ1.3倍。狙われた灯守は、防御スロットで割り込めます。')}${sec('8. 状態異常', '状態は灯守ごとに付与できるものが違い、固有の強化もあります。詳細は「灯守一覧」の各灯守の説明欄を見てください。')}${sec('9. 鏡面螺旋・採掘・抽出', '鏡面螺旋はHP持ち越しのローグライク。採掘は糸と星屑の周回。抽出でアイデンティティを増やし、控えの支援パッシブも活用しましょう。')}<div class="acts"><button class="btn pri" data-m="x">閉じる</button></div>`, () => closeModal());
}
function showSettings() {
  modal(`<h3>設定</h3><div class="list"><button class="row" data-m="mute"><span class="nm">サウンド: ${SFX.muted ? 'OFF' : 'ON'}</span></button>
  <div class="row"><span class="nm">音量</span><input id="vol" type="range" min="0" max="100" value="${Math.round((S.set.vol || .8) * 100)}" style="flex:1" aria-label="音量"></div>
  <button class="row" data-m="saveio"><span class="nm">セーブデータの書き出し / 読み込み<div class="sub">別の端末・ブラウザへ引き継げます</div></span></button>
  <button class="row" data-m="reset"><span class="nm" style="color:var(--blood)">データを初期化<div class="sub">進行状況をすべて消去します</div></span></button></div><div class="acts"><button class="btn pri" data-m="x">閉じる</button></div>`, (k) => {
    if (k === 'mute') { SFX.setMute(!SFX.muted); S.set.mute = SFX.muted; saveState(); showSettings(); }
    else if (k === 'saveio') showSaveIO();
    else if (k === 'reset') { modal(`<h3>本当に初期化しますか?</h3><p style="color:var(--dim)">この操作は元に戻せません。</p><div class="acts"><button class="btn" data-m="no">やめる</button><button class="btn red" data-m="yes">初期化する</button></div>`, (q) => { if (q === 'yes') { resetState(); closeModal(); go('title'); } else showSettings(); }); }
    else closeModal();
  });
  const v = $('#vol'); if (v) v.oninput = () => { S.set.vol = v.value / 100; SFX.setVol(S.set.vol); saveState(); };
}
/* ---------- スクリーン表 ---------- */
const SCREENS = { title: scrTitle, home: scrHome, story: scrStory, form: scrForm, roster: scrRoster, gacha: scrGacha, lux: scrLux, mirror: scrMirror };
/* ---------- アクション ---------- */
const ACT = {
  start() { SFX.init(); SFX.setMute(!!S.set.mute); SFX.setVol(S.set.vol || .8); SFX.play('ok'); go('home'); },
  go(d) { SFX.play('ui'); go(d.to); },
  goStory(d) { SFX.play('ui'); go('story', { st: d.st }); },
  back() { SFX.play('back'); go(BACK[CUR] || 'home'); },
  locked() { SFX.play('deny'); toast('まだ解放されていません'); },
  chap(d) { SFX.play('ui'); const c = +d.c; const f = STAGES.filter(s => s.ch === c).find(s => stageUnlocked(s.id)); if (!f) { toast('この幕はまだ解放されていません'); return; } STORY_SEL = (STAGES.filter(s => s.ch === c && stageUnlocked(s.id)).pop() || f).id; go('story'); },
  stsel(d) { SFX.play('ui'); STORY_SEL = d.st; go('story'); },
  stgo(d) { SFX.play('ok'); startStage(d.st, !!(STORY_HARD && S.cleared[d.st])); },
  ftog(d) {
    const sid = d.sid, i = S.team.indexOf(sid);
    if (i >= 0) { if (S.team.length <= 1) { toast('最低1人は出撃させてください'); return; } S.team.splice(i, 1); SFX.play('back'); }
    else { if (S.team.length >= 6) { toast('出撃は最大6人です。先に誰かを外してください'); SFX.play('deny'); return; } S.team.push(sid); SFX.play('pick'); }
    saveState(); go('form', null, true);
  },
  seatmv(d) { const i = +d.i, j = i + +d.d; if (j < 0 || j >= S.team.length) return; [S.team[i], S.team[j]] = [S.team[j], S.team[i]]; saveState(); SFX.play('pick'); go('form', null, true); },
  seatrm(d) { if (S.team.length <= 1) { toast('最低1人は出撃させてください'); return; } S.team.splice(+d.i, 1); saveState(); SFX.play('back'); go('form', null, true); },
  rsel(d) { ROS_SID = d.sid; SFX.play('pick'); go('roster', null, true); if (window.innerWidth <= 760) { const e = $('#rdet'); if (e) e.scrollIntoView({ block: 'start' }); } },
  rtab(d) { ROS_TAB = d.t; SFX.play('ui'); go('roster', null, true); },
  rlvn(d) { const n = levelUpMany(ROS_SID, +d.n); if (n) { SFX.play('ok'); toast(`${SINNERS[ROS_SID].n} が Lv${sLv(ROS_SID)} になった(+${n})`); refreshRes(); go('roster', null, true); } else { SFX.play('deny'); toast(sLv(ROS_SID) >= lvCap() ? 'レベル上限です(章を進めると解放)' : '糸が足りません'); } },
  rlv() { if (levelUp(ROS_SID)) { SFX.play('ok'); toast(`${SINNERS[ROS_SID].n} が Lv${sLv(ROS_SID)} になった`); refreshRes(); go('roster', null, true); } else { SFX.play('deny'); toast('糸が足りません'); } },
  fragx(d) { const d2 = IDENTS[d.ik]; if (!d2 || S.owned[d.ik]) return; const c = FRAG_COST[d2.tier]; if (((S.frag || {})[d2.sid] || 0) < c) { toast('欠片が足りません'); return; } S.frag[d2.sid] -= c; S.owned[d.ik] = 1; saveState(); SFX.play('ok'); toast(`${SINNERS[d2.sid].n}の欠片${c}個で「${d2.n}」を入手しました`); go('roster', null, true); },
  ridn(d) { S.equipped[ROS_SID] = d.ik; saveState(); SFX.play('ok'); go('roster', null, true); },
  pull(d) { doPull(+d.n); },
  luxgo(d) { SFX.play('ok'); startLux(d.d, +d.i); },
  mstart() { SFX.play('ok'); mirrorStart(); },
  mnode(d) { SFX.play('ok'); mirrorNode(+d.k); },
  mgiveup() { modal(`<h3>迷宮を出ますか?</h3><p style="color:var(--dim)">ここまでの到達度に応じた報酬を受け取ります。</p><div class="acts"><button class="btn" data-m="no">続ける</button><button class="btn red" data-m="yes">出る</button></div>`, (q) => { closeModal(); if (q === 'yes') mirrorEnd(false); }); },
  help() { SFX.init(); SFX.play('ui'); showHelp(); },
  settings() { SFX.init(); SFX.play('ui'); showSettings(); }
};
function initUI() {
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-act]'); if (!a) return; const fn = ACT[a.dataset.act]; if (!fn) return;
    if (a.closest('#bwrap')) return; SFX.init(); fn(a.dataset, a);
  });
  setInterval(() => { if (!$('#topbar').hidden) refreshRes(); }, 5000);
}
