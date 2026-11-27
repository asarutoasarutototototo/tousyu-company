/* ============================================================
   追加機能: 鑑賞室(全モーション/表情) ・ 任務(デイリー/実績) ・ ログインボーナス
   ============================================================ */
/* ---------- 進行カウンタ ---------- */
function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function exState() {
  let e = S.ex; if (!e) e = S.ex = { day: '', cnt: {}, claimed: {}, login: { last: '', streak: 0 }, ach: {} };
  if (e.day !== dayKey()) { e.day = dayKey(); e.cnt = {}; e.claimed = {}; }
  return e;
}
function bump(k, n) { const e = exState(); e.cnt[k] = (e.cnt[k] || 0) + (n == null ? 1 : n); saveState(); }
(function () {
  const _pm = pullMany, _lv = levelUp;
  pullMany = function (n) { const r = _pm(n); if (r) bump('pull', n); return r; };
  levelUp = function (sid) { const r = _lv(sid); if (r) bump('lv', 1); return r; };
})();

/* ---------- 任務の定義 ---------- */
const DAILY = [
  { id: 'win', t: '戦闘に3回勝利する', need: 3, k: 'win', rw: { thread: 400 } },
  { id: 'pull', t: '抽出を1回行う', need: 1, k: 'pull', rw: { shards: 160 } },
  { id: 'lv', t: '灯守を1回強化する', need: 1, k: 'lv', rw: { oil: 12 } },
  { id: 'pull3', t: '抽出を3回行う', need: 3, k: 'pull', rw: { thread: 300 } },
  { id: 'mir', t: '鏡面螺旋・採掘のどちらかを1回遊ぶ', need: 1, k: 'dun', rw: { thread: 300, shards: 60 } }
];
const DAILY_ALL = { shards: 300 };
const LOGIN_RW = [{ thread: 300 }, { shards: 160 }, { oil: 15 }, { thread: 600 }, { shards: 320 }, { oil: 25 }, { shards: 800, thread: 800 }];
const totalLv = () => SINNER_KEYS.reduce((a, s) => a + sLv(s), 0);
const ACHS = [
  { id: 'c1', t: '最初の一歩', d: 'ステージを1つクリア', v: () => Object.keys(S.cleared).length, need: 1, rw: { thread: 300 } },
  { id: 'c5', t: '街を歩く者', d: 'ステージを5つクリア', v: () => Object.keys(S.cleared).length, need: 5, rw: { shards: 300 } },
  { id: 'c10', t: '夜を越える者', d: 'ステージを10つクリア', v: () => Object.keys(S.cleared).length, need: 10, rw: { shards: 600 } },
  { id: 'c15', t: '灯守の証', d: '全ステージをクリア', v: () => Object.keys(S.cleared).length, need: STAGES.length, rw: { shards: 1600, thread: 1500 } },
  { id: 'p10', t: '引き当てる者', d: '抽出を累計10回', v: () => S.pulls || 0, need: 10, rw: { shards: 320 } },
  { id: 'p50', t: '星屑の旅人', d: '抽出を累計50回', v: () => S.pulls || 0, need: 50, rw: { shards: 800 } },
  { id: 'lv10', t: '鍛える手', d: '灯守のLv合計が10', v: totalLv, need: 10, rw: { thread: 600 } },
  { id: 'lv30', t: '研ぎ澄まされた刃', d: '灯守のLv合計が30', v: totalLv, need: 30, rw: { thread: 1600 } },
  { id: 'own', t: '二つの姿', d: 'アイデンティティを6つ所持', v: () => Object.keys(S.owned).length, need: 6, rw: { shards: 500 } },
  { id: 'own12', t: '百面相', d: 'アイデンティティを15個所持', v: () => Object.keys(S.owned).length, need: 15, rw: { shards: 900 } },
  { id: 'own30', t: '千変万化', d: 'アイデンティティを30個所持', v: () => Object.keys(S.owned).length, need: 30, rw: { shards: 2000 } },
  { id: 'p100', t: '星屑の海', d: '抽出を累計100回', v: () => S.pulls || 0, need: 100, rw: { shards: 1200 } },
  { id: 'lv100', t: '磨き抜かれた灯', d: '灯守のLv合計が100', v: totalLv, need: 100, rw: { thread: 3000 } },
  { id: 'lv180', t: '灯守の頂', d: '灯守のLv合計が180', v: totalLv, need: 180, rw: { shards: 1500, thread: 4000 } },
  { id: 'mir1', t: '鏡を覗く', d: '鏡面螺旋で1層クリア', v: () => (S.mirror && S.mirror.best) || 0, need: 1, rw: { shards: 200 } },
  { id: 'c20', t: '鏡の街を越えて', d: 'ステージを20クリア', v: () => Object.keys(S.cleared).length, need: 20, rw: { shards: 800, thread: 1000 } },
  { id: 'mir5', t: '夜明け前の鏡', d: '鏡面螺旋で5層クリア', v: () => (S.mirror && S.mirror.best) || 0, need: 5, rw: { shards: 1000 } },
  { id: 'own60', t: '六十の面影', d: 'アイデンティティを60個所持', v: () => Object.keys(S.owned).length, need: 60, rw: { shards: 3000 } },
  { id: 'p200', t: '星屑の大海', d: '抽出を累計200回', v: () => S.pulls || 0, need: 200, rw: { shards: 2000 } },
  { id: 'tw20', t: '回廊の登り手', d: '無限回廊で20階に到達', v: () => (S.tower && S.tower.best) || 0, need: 20, rw: { shards: 800 } },
  { id: 'tw50', t: '回廊の果て', d: '無限回廊で50階に到達', v: () => (S.tower && S.tower.best) || 0, need: 50, rw: { shards: 2500 } },
  { id: 'mir3', t: '鏡の奥へ', d: '鏡面螺旋で3層クリア', v: () => (S.mirror && S.mirror.best) || 0, need: 3, rw: { shards: 600 } }
];
function rwHtml(r) { return Object.entries(r).map(([k, v]) => `<span>${{ thread: '糸', shards: '星屑', oil: '灯油' }[k]} +${v}</span>`).join(''); }
function giveRw(r) { if (r.thread) S.thread += r.thread; if (r.shards) S.shards += r.shards; if (r.oil) S.oil = Math.min(OIL_MAX, S.oil + r.oil); saveState(); refreshRes(); }
function claimable() {
  const e = exState(); let n = 0;
  DAILY.forEach(m => { if ((e.cnt[m.k] || 0) >= m.need && !e.claimed[m.id]) n++; });
  ACHS.forEach(a => { if (!e.ach[a.id] && a.v() >= a.need) n++; });
  if (e.login.last !== dayKey()) n++;
  return n;
}

/* ---------- 任務画面 ---------- */
function scrMission() {
  setScene('plain', 'station'); setTop('任務', true);
  const e = exState(), today = dayKey(), canLogin = e.login.last !== today;
  const yest = dayKey(new Date(Date.now() - 864e5)), nextStreak = e.login.last === yest ? e.login.streak + 1 : (canLogin ? 1 : e.login.streak);
  const slot = ((canLogin ? nextStreak : e.login.streak) - 1) % 7;
  const login = LOGIN_RW.map((r, i) => `<div class="lg ${i < slot || (i === slot && !canLogin) ? 'got' : i === slot ? 'now' : ''}"><b>${i + 1}</b><div class="rw">${rwHtml(r)}</div></div>`).join('');
  const dl = DAILY.map(m => { const c = Math.min(m.need, e.cnt[m.k] || 0), ok = c >= m.need, cl = !!e.claimed[m.id]; return `<div class="mrow ${cl ? 'done' : ''}"><div class="mt"><b>${esc(m.t)}</b><div class="bar2"><i style="width:${100 * c / m.need}%"></i></div><small>${c}/${m.need}</small></div><div class="rw">${rwHtml(m.rw)}</div><button class="btn sm ${ok && !cl ? 'pri' : ''}" data-act="mclaim" data-id="${m.id}" ${ok && !cl ? '' : 'disabled'}>${cl ? '受取済' : '受け取る'}</button></div>`; }).join('');
  const allOk = DAILY.every(m => e.claimed[m.id]), allCl = !!e.claimed.all;
  const ac = ACHS.map(a => { const v = Math.min(a.need, a.v()), ok = v >= a.need, cl = !!e.ach[a.id]; return `<div class="mrow ${cl ? 'done' : ''}"><div class="mt"><b>${esc(a.t)}</b><small>${esc(a.d)}</small><div class="bar2"><i style="width:${100 * v / a.need}%"></i></div><small>${v}/${a.need}</small></div><div class="rw">${rwHtml(a.rw)}</div><button class="btn sm ${ok && !cl ? 'pri' : ''}" data-act="aclaim" data-id="${a.id}" ${ok && !cl ? '' : 'disabled'}>${cl ? '達成済' : '受け取る'}</button></div>`; }).join('');
  const nClaim = claimable();
  scr(`<div class="sec-h"><h2>任務</h2><span class="eyebrow">MISSIONS</span><button class="btn ${nClaim ? 'pri' : ''}" style="margin-left:auto" data-act="claimall" ${nClaim ? '' : 'disabled'}>一括受け取り${nClaim ? ' (' + nClaim + ')' : ''}</button></div>
  <div class="panel pad"><div class="sec-h" style="margin:0 0 10px"><h3>灯守日誌 <small style="color:var(--dim);font-size:12px">ログインボーナス / 連続${e.login.streak}日</small></h3></div><div class="lgrid">${login}</div>
  <div style="margin-top:10px"><button class="btn ${canLogin ? 'pri' : ''}" data-act="lclaim" ${canLogin ? '' : 'disabled'}>${canLogin ? '今日の分を受け取る' : '本日は受取済'}</button></div></div>
  <div class="panel pad" style="margin-top:14px"><div class="sec-h" style="margin:0 0 10px"><h3>デイリー任務</h3><span class="eyebrow">毎日0時にリセット</span></div>${dl}
  <div class="mrow ${allCl ? 'done' : ''}"><div class="mt"><b>全ての任務を達成</b><small>${DAILY.length}つ全て受け取るとボーナス</small></div><div class="rw">${rwHtml(DAILY_ALL)}</div><button class="btn sm ${allOk && !allCl ? 'pri' : ''}" data-act="mclaim" data-id="all" ${allOk && !allCl ? '' : 'disabled'}>${allCl ? '受取済' : '受け取る'}</button></div></div>
  <div class="panel pad" style="margin-top:14px"><div class="sec-h" style="margin:0 0 10px"><h3>実績</h3></div>${ac}</div>`);
}
Object.assign(ACT, {
  claimall() {
    const e = exState(), tot = { thread: 0, shards: 0, oil: 0 }; let n = 0;
    const add = r => { for (const k in r) tot[k] = (tot[k] || 0) + r[k]; };
    const today = dayKey();
    if (e.login.last !== today) { const yest = dayKey(new Date(Date.now() - 864e5)); e.login.streak = e.login.last === yest ? e.login.streak + 1 : 1; e.login.last = today; add(LOGIN_RW[(e.login.streak - 1) % 7]); n++; }
    DAILY.forEach(m => { if (!e.claimed[m.id] && (e.cnt[m.k] || 0) >= m.need) { e.claimed[m.id] = 1; add(m.rw); n++; } });
    if (!e.claimed.all && DAILY.every(m => e.claimed[m.id])) { e.claimed.all = 1; add(DAILY_ALL); n++; }
    ACHS.forEach(a => { if (!e.ach[a.id] && a.v() >= a.need) { e.ach[a.id] = 1; add(a.rw); n++; } });
    if (!n) { toast('受け取れる報酬はありません'); return; }
    giveRw(tot); SFX.play('ok');
    toast(`${n}件を受け取りました:` + [tot.thread ? `糸+${tot.thread}` : '', tot.shards ? `星屑+${tot.shards}` : '', tot.oil ? `灯油+${tot.oil}` : ''].filter(Boolean).join(' '));
    go('mission', null, true);
  },
  lclaim() {
    const e = exState(), today = dayKey(); if (e.login.last === today) return;
    const yest = dayKey(new Date(Date.now() - 864e5)); e.login.streak = e.login.last === yest ? e.login.streak + 1 : 1; e.login.last = today;
    const r = LOGIN_RW[(e.login.streak - 1) % 7]; giveRw(r); SFX.play('ok'); toast(`${e.login.streak}日目のボーナスを受け取りました`); go('mission', null, true);
  },
  mclaim(d) {
    const e = exState(); if (d.id === 'all') { if (e.claimed.all || !DAILY.every(m => e.claimed[m.id])) return; e.claimed.all = 1; giveRw(DAILY_ALL); }
    else { const m = DAILY.find(x => x.id === d.id); if (!m || e.claimed[m.id] || (e.cnt[m.k] || 0) < m.need) return; e.claimed[m.id] = 1; giveRw(m.rw); }
    SFX.play('ok'); go('mission', null, true);
  },
  aclaim(d) { const e = exState(), a = ACHS.find(x => x.id === d.id); if (!a || e.ach[a.id] || a.v() < a.need) return; e.ach[a.id] = 1; giveRw(a.rw); SFX.play('ok'); toast(`実績「${a.t}」を達成`); go('mission', null, true); }
});

/* ---------- 鑑賞室 ---------- */
const FRLAB = {
  rei: { stand: '戦闘時立ち絵', i2: '待機・仕草1', i3: '待機・仕草2', i4: '待機・不安', i5: '待機・仕草4', i6: '待機・仕草5', i7: '待機・仕草6', i8: '待機・疲労', lunge: '突進', dash: '疾走', ring: '輪', crystal: '結晶', slashA: '斬撃A', slashB: '斬撃B', erupt: '噴出', vortex: '渦', shadow: '影', burst: '爆裂', pillar: '光柱', hit1: '被弾1', hit2: '被弾2', stag: '混乱時', crawl: '這う', dead: '死亡時', panic: 'パニック', b_dots: '吹き出し(…)', b_q: '吹き出し(？)', b_heart: '吹き出し(♥)', match: 'マッチ時(静止画)', crouch: '屈み', arc: '弧斬', sit: '座り', vortex2: '渦2', n_stand: '立ち(新)', n_cast: '詠唱', n_dash: '疾走(新)', n_guard: '防御(新)', n_reach: '手を伸ばす', n_wind1: '構え1', n_wind2: '構え2', n_slide: '低い滑走', n_blade: '結晶の大刃', n_burst: '結晶の閃光', n_vortex: '結晶の渦', n_arc: '大弧斬', n_kneel: 'ひざまずき', n_jump: '跳躍(新)', n_sphere: '結晶の繭', n_crawl: '這う(新)', n_hurt: '被弾(新)', n_dead: '死亡(新)', n_panic: 'パニック(新)' },
  kuro: { stand: '戦闘時立ち絵', hit: '被弾時', evade: '回避時', guard: '防御時', counter1: '反撃時(1)', counter2: '反撃時(2)', match: 'マッチ時(静止画)', s1_1: 'スキル1-1', s1_2: 'スキル1-2', s2_1: 'スキル2-1', s2_2: 'スキル2-2', s2_3: 'スキル2-3', s3_1: 'スキル3-1', s3_2: 'スキル3-2', s3_3: 'スキル3-3', s3_4: 'スキル3-4', stag: '混乱時', dead: '死亡時', panic: 'パニック時' }
};
FRLAB.ren = { stand: '戦闘時立ち絵', i2: '待機・手招き', lunge: '駆け出し', guard: 'ハートの盾', slashA: '光の斬撃', burstA: '紅の炸裂', burstB: '紫の炸裂', cast: '詠唱', point: '矢を放つ', ribbon1: 'リボン旋回1', ribbon2: 'リボン旋回2', crawl: 'ひざまずき', hit: '被弾時', ego1: 'E.G.O(翼)', jump: '跳躍', ego2: 'E.G.O(極光)', stag: '混乱時', dead: '死亡時', panic: 'パニック' };
FRLAB.aka = { stand: '戦闘時立ち絵', i2: '待機・構え', i3: '待機・つぶやき', wind: '大剣を掲げる', slashA: '斬り上げ', m1: '踏み込み斬り', m2: '大回し', m3: '円斬', m4: '突き', m5: '剣を立てる', m6: '輪斬・爆', m7: '三日月斬', n1: '横薙ぎ', n2: '閃光', n3: '紅の弧', n4: '疾走斬', n5: '地烈', n6: '業火の大剣', stag: '混乱時', hit: '被弾時', panic: 'パニック', dead: '死亡時' };
FRLAB.rai = { stand: '戦闘時立ち絵', hit: '被弾時', evade: '回避時', guard: '防御時', counter1: '反撃時(1)', counter2: '反撃時(2)', match: 'マッチ時(静止画)', s1_1: 'スキル1-1', s1_2: 'スキル1-2', s2_1: 'スキル2-1', s2_2: 'スキル2-2', s2_3: 'スキル2-3', s3_1: 'スキル3-1', s3_2: 'スキル3-2', s3_3: 'スキル3-3', s3_4: 'スキル3-4', stag: '混乱時', dead: '死亡時', panic: 'パニック時' };
FRLAB.tetsu = { stand: '戦闘時立ち絵', hit: '被弾時', dash: '駆け出し', guard: '防御', wind: '振りかぶり', swingA: '大振り', lungeUp: '踏み込み', arcRed: '紅の弧', spinA: '旋回', lowSwing: '低い薙ぎ', slam: '叩きつけ', whirl: '渦', i2: '待機1', i3: '待機2', i4: '待機3' };
FRLAB.nagi = { stand: '戦闘時立ち絵', hit: '被弾時', dash: '駆け出し', guard: '防御', thrust: '突き', swingA: '薙ぎ', stance: '居合の構え', arcRed: '紅の弧', spinA: '旋回1', spinB: '旋回2', spinC: '旋回3', burstRed: '紅の炸裂', stag: '混乱時', dead: '死亡時', panic: 'パニック' };
FRLAB.mina = { stand: '立ち絵(待機)', run: '疾走', dash: '低い踏み込み', leap: '跳躍', kick1: '飛び蹴り', kick2: '回し蹴り', kick3: '蹴り抜き', smash: '地面砕き', g1: '金・蹴り上げ', g2: '金・残像突進', g3: '金・爆裂', g4: '金・旋回', g5: '金・大旋回', g6: '金・着地' };
const EXLAB = { smoke: '紫煙', calm: '静観', n: '通常', shout: '叫び', think: '思案', closed: '閉眼', smile: '微笑', angry: '怒り', sad: '悲しみ', void: '虚無', mad: '狂気' };
let GAL = { sid: null, fr: 'stand', seq: null, tm: 0 };
function galSeqs(ch) {
  if (!IMOT[ch]) return [['疾走', ['stand', 'run', 'dash', 'leap']], ['蹴撃(紫)', ['leap', 'kick1', 'kick2', 'kick3', 'smash']], ['蹴撃(金)', ['g1', 'g2', 'g3', 'g4', 'g5', 'g6']]];
  const M = IMOT[ch], out = [];
  out.push(['スキル1', M.s1], ['スキル2', M.s2], ['スキル3', M.s3], ['E.G.O', M.ego], ['防御', M.win.guard], ['回避', M.win.evade], ['反撃', M.win.counter], ['被弾', [M.hit[0], M.hit[1]]]);
  out.push(['混乱→死亡', [M.stag, M.dead]], ['パニック', [M.panic]]);
  return out.map(([n, a]) => [n, a.filter(Boolean)]);
}
function galDraw() {
  const cv = $('#gview'); if (!cv) return; const ch = GCH[GAL.sid].look.img, ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
  const g = ctx.createRadialGradient(W / 2, H * .55, 20, W / 2, H * .55, W * .7); g.addColorStop(0, '#2a2347'); g.addColorStop(1, '#0a0716'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,200,120,.12)'; ctx.beginPath(); for (let x = 0; x < W; x += 40) { ctx.moveTo(x, H - 36); ctx.lineTo(x, H); } ctx.moveTo(0, H - 36); ctx.lineTo(W, H - 36); ctx.stroke();
  const id = GAL.fr, im = imgGet(ch, id), m = IMGMETA[ch][id]; if (!im || !m) return;
  const k = Math.min((W - 30) / m.w, (H - 30) / m.h); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(im, (W - m.w * k) / 2, (H - 12 - m.h * k), m.w * k, m.h * k);
  $('#glab').textContent = (FRLAB[ch][id] || (id.startsWith('f_') ? '表情: ' + (EXLAB[Object.keys(IMGCH[ch].FACE).find(x => IMGCH[ch].FACE[x] === id)] || id) : id));
}
function galStop() { clearInterval(GAL.tm); GAL.tm = 0; GAL.seq = null; }
function scrGallery() {
  setScene('plain', 'station'); setTop('鑑賞室', true);
  if (!GAL.sid || !GCH[GAL.sid]) GAL.sid = SINNER_KEYS[0]; galStop(); const s = GCH[GAL.sid], ch = s.look.img, ids = Object.keys(IMGMETA[ch]);
  GAL.fr = 'stand';
  const tabs = Object.keys(GCH).map(k => `<button class="tab ${k === GAL.sid ? 'on' : ''}" data-act="gtab" data-sid="${k}">${esc(GCH[k].n)}</button>`).join('');
  const frs = ids.filter(i => !i.startsWith('f_')).map(i => `<button class="gchip" data-act="gfr" data-id="${i}">${esc(FRLAB[ch][i] || i)}</button>`).join('');
  const exs = Object.entries(IMGCH[ch].FACE).map(([k, id]) => `<button class="gchip" data-act="gfr" data-id="${id}">${EXLAB[k] || k}</button>`).join('');
  const sq = galSeqs(ch).map(([n, a], i) => `<button class="gchip pl" data-act="gplay" data-i="${i}">▶ ${esc(n)}</button>`).join('');
  scr(`<div class="sec-h"><h2>鑑賞室</h2><span class="eyebrow">GALLERY</span></div><div class="tabs">${tabs}</div>
  <div class="gal"><div class="panel gl"><canvas id="gview" width="560" height="460"></canvas><div id="glab" class="glab"></div></div>
  <div class="gr"><div class="panel pad"><h4>${esc(s.n)} <small>${esc(s.r)} / ${esc(s.tag)}</small></h4><p style="color:var(--dim);font-size:13px">${esc(s.bio)}</p></div>
  <div class="panel pad"><h4>モーション再生</h4><div class="chips">${sq}</div></div>
  <div class="panel pad"><h4>コマ一覧 <small>タップで拡大</small></h4><div class="chips">${frs}</div></div>
  <div class="panel pad"><h4>表情差分</h4><div class="chips">${exs}</div></div></div></div>`);
  galDraw();
}
Object.assign(ACT, {
  gtab(d) { SFX.play('ui'); GAL.sid = d.sid; go('gallery'); },
  gfr(d) { galStop(); GAL.fr = d.id; SFX.play('pick'); galDraw(); },
  gplay(d) {
    galStop(); const ch = GCH[GAL.sid].look.img, a = galSeqs(ch)[+d.i][1]; let i = 0; SFX.play('ui');
    const step = () => { GAL.fr = a[i % a.length]; galDraw(); i++; if (i > a.length * 3 + 1) galStop(); };
    step(); GAL.tm = setInterval(step, 340);
  }
});
SCREENS.mission = scrMission; SCREENS.gallery = scrGallery; BACK.mission = 'home'; BACK.gallery = 'home';

/* ---------- 交換所 ---------- */
const SHOP = [
  { id: 'oil', n: '灯油 +20', d: '灯油を20回復します。', cost: 10, lim: Infinity, g: '油', fn: () => { S.oil = Math.min(OIL_MAX, S.oil + 20); S.oilT = Date.now(); return '灯油を20回復しました'; } },
  { id: 'th1', n: '糸 +600', d: '強化に使う「糸」を600入手します。', cost: 80, lim: 3, g: '糸', fn: () => { S.thread += 600; return '糸を600入手しました'; } },
  { id: 'th2', n: '糸 +3000', d: '強化に使う「糸」を3000入手します。(お得)', cost: 350, lim: 1, g: '束', fn: () => { S.thread += 3000; return '糸を3000入手しました'; } },
  { id: 'syn', n: '同調の火種', d: '所持しているアイデンティティからランダムに1つ、同調を+1します(同調4未満)。', cost: 450, lim: 1, g: '欠', can: () => Object.keys(S.owned).some(k => S.owned[k] < 4), fn: () => {
    const c = Object.keys(S.owned).filter(k => S.owned[k] < 4), k = c[(Math.random() * c.length) | 0]; S.owned[k]++; return `「${IDENTS[k].n}」(${SINNERS[IDENTS[k].sid].n})の同調が ${S.owned[k]}/4 になりました`; } }
];
function scrShop() {
  setScene('plain', 'library'); setTop('交換所', true);
  const e = exState();
  const rows = SHOP.map(it => { const n = e.cnt['shop_' + it.id] || 0, left = it.lim - n, ok = left > 0 && S.shards >= it.cost && (!it.can || it.can()); return `<div class="mrow ${left <= 0 ? 'done' : ''}"><div class="mt"><b>${esc(it.n)}</b><small>${esc(it.d)}</small><small>${left === Infinity ? '交換回数 無制限' : '本日あと ' + left + ' 回'}</small></div><div class="rw"><span>星屑 ${it.cost}</span></div><button class="btn sm ${ok ? 'pri' : ''}" data-act="shopbuy" data-id="${it.id}" ${ok ? '' : 'disabled'}>${left <= 0 ? '売切' : '交換'}</button></div>`; }).join('');
  scr(`<div class="sec-h"><h2>交換所</h2><span class="eyebrow">EXCHANGE / 毎日0時に入荷</span></div><div class="panel pad">${rows}</div>`);
}
Object.assign(ACT, {
  shopbuy(d) {
    const it = SHOP.find(x => x.id === d.id), e = exState(), n = e.cnt['shop_' + it.id] || 0;
    if (!it || n >= it.lim || S.shards < it.cost || (it.can && !it.can())) return;
    S.shards -= it.cost; e.cnt['shop_' + it.id] = n + 1; const msg = it.fn(); saveState(); refreshRes(); SFX.play('ok'); toast(msg); go('shop', null, true);
  }
});
SCREENS.shop = scrShop; BACK.shop = 'home';
