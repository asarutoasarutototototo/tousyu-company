'use strict';
/* ============================================================
   LAMPWARDEN COMPANY — ui_battle.js
   戦闘HUD・計画フェーズ(スキル選択/ターゲット指定/矢印/勝率)・リザルト
   ============================================================ */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function posIn(el, root) { let x = 0, y = 0, e = el; while (e && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x, y, w: el.offsetWidth, h: el.offsetHeight }; }
const KEYN = { s1: 'S1', s2: 'S2', s3: 'S3', def: 'DEF', ego: 'EGO' };
function coinsHtml(n) { let s = ''; for (let i = 0; i < n; i++) s += '<i></i>'; return s; }
function kindName(sk) { return sk.kind === 'guard' ? '防御' : sk.kind === 'evade' ? '回避' : sk.kind === 'counter' ? '反撃' : sk.ego ? 'E.G.O' + (sk.aoe === 'all' ? '・敵全体' : sk.aoe ? '・敵' + sk.aoe + '体' : '') : '攻撃'; }
function skillLine(sk, r) { return `威力${r ? r[0] + '〜' + r[1] : sk.base} コイン+${sk.cp} ×${sk.nC}`; }
const TYN = { slash: '斬', pierce: '突', blunt: '打' };
function rtBadges(u) { return ['slash', 'pierce', 'blunt'].map(t => { const m = (u.rt && u.rt[t]) || 1; return `<i class="rt ${m >= 2 ? 'w' : m < 1 ? 's' : ''}" title="${TYN[t]}撃への耐性 ${rtName(m)}">${TYN[t]}${m >= 2 ? '×2' : m < 1 ? '×½' : '×1'}</i>`; }).join(''); }

function rngHtml(p) { const r = p.rng; if (!r) return ''; return `<span class="rng">自 ${r.a[0]}〜${r.a[1]}${r.b ? ` / 敵 ${r.b[0]}〜${r.b[1]}` : ''}<br>${TYN[r.ty]}耐性 <b style="color:${r.rt >= 2 ? '#7ee08a' : r.rt < 1 ? '#ff8a7a' : '#fff'}">${rtName(r.rt)}</b></span>`; }
const WHY_SHORT = { '速度負け': '遅い', '同速は奪えない': '同速', '先に動く味方が合戦中': '先行', '味方が先に合戦': '奪われ', '相手は交戦済み': '交戦済', '相手が行動不能': '不能', '相手スキルが中断': '中断', '標的なし': '標的なし' };
const whyShort = w => WHY_SHORT[w] || '直接攻撃';
class BattleUI {
  constructor(spec, ctx) {
    this.spec = spec; this.ctx = ctx; this.view = null; this.B = null; this.phase = 'init'; this.sel = null; this.auto = !!S.set.auto; this.go = null; this.alive = true; this.lastRes = {}; this.cache = {};
  }
  build() {
    const wrap = $('#bwrap'); wrap.hidden = false;
    wrap.innerHTML = `<div id="stage"><canvas id="bcv"></canvas><div class="hud" id="hud">
      <div class="hud-top"><div class="turn"><small>TURN</small><span id="turnN">1</span></div><div class="stg">${esc(this.spec.title || '')}</div></div>
      <div class="hud-btns"><button class="btn sm" data-b="info">敵情報</button><button class="btn sm" data-b="log">ログ</button><button class="btn sm" data-b="spd">×1</button><button class="btn sm" data-b="auto">AUTO</button><button class="btn sm" data-b="snd">♪</button><button class="btn sm red" data-b="quit">撤退</button></div>
      <div class="intents" id="intents"></div><div id="hotspots"></div><svg class="arrows" id="arrows"></svg><svg class="arrows" id="dragsvg"></svg><div id="wrbub" hidden></div>
      <div class="cards" id="cards"></div>
      <div class="side" id="side"><div class="resbar" id="resbar"></div><div class="hint2" id="hint"><b>スロットを敵スキルへドラッグ</b>して標的を指定<br><b>自分の速度 &gt; 敵スキルの速度</b>なら、他と合戦中の敵スキルも<b>奪取</b>できます<br>敵本体へドラッグで直接攻撃 / タップでスキル変更<br>回避・防御も敵スキルを選べます</div><button class="btn pri startbtn" data-b="go"><span>戦闘開始</span><em id="unsetn"></em></button></div>
      <div class="menu" id="menu" hidden></div></div><div id="result" hidden></div></div>`;
    this.stage = $('#stage'); this.hud = $('#hud');
    this.view = new BattleView($('#bcv'));
    const sp = buildBattle(this.spec.battle, {}); sp.manual = true; this.B = sp; this.view.setup(sp, this.spec.theme || 'station');
    this.view.spd = S.set.spd || 1;
    this.fit(); this.buildCards(); this.updateBtns();
    this.onClick = e => this.click(e); this.stage.addEventListener('click', this.onClick); this.bindDrag();
    this.onResize = () => { this.fit(); this.view.fit(); if (this.phase === 'plan') this.renderArrows(); }; window.addEventListener('resize', this.onResize);
    this.onKey = e => { if (this.phase === 'plan' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.startTurn(); } if (e.key === 'Escape') this.closeMenu(); }; window.addEventListener('keydown', this.onKey);
    this.tickId = requestAnimationFrame(() => this.tick());
  }
  fit() {
    const w = $('#bwrap').clientWidth, h = $('#bwrap').clientHeight, st = this.stage.style;
    this.rot = h > w * 1.15;
    if (this.rot) { // 縦持ち: ステージを90°回して画面を使い切る
      const s = Math.min(h / 1280, w / 720); this.scale = s; st.left = '0px'; st.top = '0px';
      st.transform = `translate(${(w + 720 * s) / 2}px,${(h - 1280 * s) / 2}px) rotate(90deg) scale(${s})`;
    } else {
      const s = Math.min(w / 1280, h / 720); this.scale = s; st.transform = `scale(${s})`; st.left = ((w - 1280 * s) / 2) + 'px'; st.top = ((h - 720 * s) / 2) + 'px';
    }
  }
  destroy() {
    this.alive = false; if (this.view) this.view.stop(); cancelAnimationFrame(this.tickId);
    this.unbindDrag(); if (this.stage) this.stage.removeEventListener('click', this.onClick); window.removeEventListener('resize', this.onResize); window.removeEventListener('keydown', this.onKey);
    const w = $('#bwrap'); w.hidden = true; w.innerHTML = '';
    $('#scr').hidden = false; $('#topbar').hidden = false; $('#bgc').style.visibility = 'visible'; CURRENT_BATTLE = null;
  }
  /* ---------- カード ---------- */
  buildCards() {
    const cards = $('#cards'); cards.innerHTML = ''; this.prevHp = {};
    this.B.side('A').forEach((u, idx) => {
      const sc = SIN[u.sinc], el = document.createElement('div'); el.className = 'bcard'; el.dataset.u = u.id; el.style.setProperty('--sin', sc.c); el.style.setProperty('--sind', sc.d); el.style.setProperty('--i', idx);
      el.innerHTML = `<div class="rail"></div><div class="top"><div class="ptw"><canvas class="pt" width="120" height="120"></canvas><span class="sinb">${sc.n}</span></div><div class="info"><div class="nm"><b>${esc(u.name)}</b><span class="lv">Lv${u.lv}</span></div><div class="rtb">${rtBadges(u)}</div>
        <div class="bar hp"><i class="g"></i><i class="f"></i><i class="z"></i><span class="tls"></span><span class="hpn"></span></div>
        <div class="hpsub"><span class="tgt"></span></div>
        <div class="bar sp"><i></i><span class="spn"></span></div></div></div>
        <div class="stl"></div><div class="slots"></div>`;
      cards.appendChild(el);
      const cv = $('canvas.pt', el), pc = portrait(u.look, u.key, 120, 120, 'face'); cv.getContext('2d').drawImage(pc, 0, 0);
      this.prevHp[u.id] = u.hp;
    });
    $('#resbar').innerHTML = SIN_KEYS.map(k => `<div class="gem" data-k="${k}" style="--sin:${SIN[k].c}"><small>${SIN[k].n}</small><b>0</b></div>`).join('');
  }
  tick() {
    if (!this.alive) return; const v = this.view, B = this.B;
    $('#turnN').textContent = (B.turn || 1) + (B.turnLimit ? '/' + B.turnLimit : '');
    B.side('A').forEach(u => {
      const el = $(`.bcard[data-u="${u.id}"]`); if (!el) return; const vu = v.vus[u.id], d = vu.d; if (!d) return;
      const hp = Math.round(vu.hpv), ti = d.ti | 0, key = hp + '|' + Math.round(vu.spv) + '|' + d.stag + '|' + d.panic + '|' + d.alive + '|' + ti + '|' + d.st.map(s => s.join('.')).join();
      if (hp < (this.prevHp[u.id] || 0) - 0) { el.classList.remove('hurt'); void el.offsetWidth; el.classList.add('hurt'); }
      this.prevHp[u.id] = hp;
      if (this.cache[u.id] === key && Math.abs(vu.hpg - vu.hpv) < .5) return; this.cache[u.id] = key;
      $('.bar.hp i.f', el).style.width = (100 * clamp(vu.hpv / u.maxHp, 0, 1)) + '%'; $('.bar.hp i.g', el).style.width = (100 * clamp(vu.hpg / u.maxHp, 0, 1)) + '%';
      const th = u.thr.filter((t, i) => i >= ti);
      $('.bar.hp i.z', el).style.width = th.length ? (th[0] * 100) + '%' : '0%';
      const tls = $('.tls', el), sig = th.join(','); if (tls.dataset.sig !== sig) { tls.dataset.sig = sig; tls.innerHTML = th.map(t => `<b style="left:${t * 100}%"></b>`).join(''); }
      el.classList.toggle('near', !!th.length && d.alive && !d.stag && vu.hpv / u.maxHp - th[0] < .12);
      $('.tgt', el).textContent = !d.alive ? '' : d.stag > 0 ? '混乱中' : th.length ? `混乱まで ${Math.max(0, Math.ceil(vu.hpv - th[0] * u.maxHp))}` : '混乱済み';
      { /* 精神力・状態に応じて、名札の顔を表情差分に切り替え */
        const spv = vu.spv, FC = IMGCH[u.look.img].FACE, pk = (...ks) => ks.find(k => FC[k]) || 'n', ex = !d.alive ? 'n' : d.panic > 0 ? pk('mad', 'shout') : d.stag > 0 ? pk('sad', 'closed') : spv <= -15 ? pk('void', 'think') : spv >= 25 ? pk('smile') : 'n';
        if (el.dataset.ex !== ex) { el.dataset.ex = ex; const c2 = $('canvas.pt', el), ctx = c2.getContext('2d'); ctx.clearRect(0, 0, c2.width, c2.height); ctx.drawImage(portrait(u.look, u.key, 120, 120, 'face', ex), 0, 0); }
      }
      const sp = vu.spv, sb = $('.bar.sp i', el); sb.className = sp < 0 ? 'neg' : ''; sb.style.left = sp >= 0 ? '50%' : (50 + sp / 45 * 50) + '%'; sb.style.width = (Math.abs(sp) / 45 * 50) + '%';
      $('.hpn', el).innerHTML = `<b>${hp}</b><small>/${u.maxHp}</small>`; $('.spn', el).textContent = `SP ${Math.round(vu.spv)}`;
      el.classList.toggle('dead', !d.alive); el.classList.toggle('stag', d.stag > 0 && d.alive); el.classList.toggle('pan', d.panic > 0 && d.alive); el.dataset.st = d.panic > 0 ? 'パニック' : '混乱';
      $('.stl', el).innerHTML = d.st.map(s => `<span class="stic" title="${ST[s[0]].n} ${s[1]}/${s[2]}" style="background:${ST[s[0]].c}">${ST[s[0]].g}</span>`).join('');
    });
    // 資源
    const R = v.R || this.B.res, rv = this.phase === 'plan' ? this.B.reserved() : {};
    SIN_KEYS.forEach(k => { const g = $(`.gem[data-k="${k}"]`); if (!g) return; const val = (R[k] || 0), shown = val - (rv[k] || 0); const b = $('b', g); if (b.textContent !== String(shown)) { b.textContent = shown; if ((this.lastRes[k] || 0) < val) { g.classList.remove('pop'); void g.offsetWidth; g.classList.add('pop'); } } this.lastRes[k] = val; g.style.opacity = shown > 0 ? 1 : .55; });
    this.dragFrame();
    this.tickId = requestAnimationFrame(() => this.tick());
  }
  updateBtns() {
    const b = $('[data-b="spd"]'); if (b) b.textContent = '×' + (S.set.spd || 1);
    const a = $('[data-b="auto"]'); if (a) a.classList.toggle('on', this.auto);
    const s = $('[data-b="snd"]'); if (s) s.textContent = SFX.muted ? '🔇' : '♪';
  }
  /* ---------- 計画フェーズ ---------- */
  renderPlan() {
    const B = this.B; this.phase = 'plan'; this.sel = null; this.closeMenu(); this.pred = B.predict();
    $('#cards').classList.remove('low'); $('#side').classList.remove('hide');
    // スロット
    B.side('A').forEach(u => {
      const el = $(`.bcard[data-u="${u.id}"] .slots`); if (!el) return; el.innerHTML = '';
      if (!u.alive) return;
      u.slots.forEach(s => this.slotEl(u, s, el));
    });
    this.renderIntents(); this.renderArrows(); this.refreshStart();
  }
  slotEl(u, s, parent) {
    const sk = s.skill, sc = SIN[sk.sin], b = document.createElement('button'), atk = sk.kind === 'atk' || sk.ego;
    b.className = 'slot' + (sk.kind === 'guard' || sk.kind === 'evade' || sk.kind === 'counter' ? ' def' : '') + (sk.ego ? ' ego' : '') + (this.sel && this.sel.u === u.id && this.sel.i === s.i ? ' sel' : '') + (atk && !s.target ? ' unset' : '');
    b.dataset.u = u.id; b.dataset.i = s.i; b.style.setProperty('--sin', sc.c);
    b.title = (descSkill(sk) || kindName(sk)) + (atk ? '\n(敵スキル/敵本体へドラッグで標的指定)' : '');
    let to = '';
    if (atk) {
      if (!s.target) to = '<span class="to un">ドラッグ ⇢</span>';
      else {
        const tu = this.B.U(s.target.u), n = this.B.side('E').indexOf(tu) + 1, pr = this.pred && this.pred.get(s); let mk = s.target.s != null ? ' ⚔' : '', cl = '';
        if (pr && pr.k === 'steal') { mk = ' ⚔奪'; cl = ' stl'; } else if (pr && pr.k === 'pulled') { mk = ' ⚔引'; cl = ' pul'; } else if (pr && pr.k === 'one' && s.target.s != null) { mk = ' ✕' + whyShort(pr.why); cl = ' bad'; b.title += '\n※マッチ不成立: ' + (pr.why || '直接攻撃'); }
        to = `<span class="to${cl}">⇢ 敵${n}${mk}</span>`;
      }
    }
    b.innerHTML = `<span class="spd">${s.spd}</span><span class="t"><span class="nm">${esc(sk.n)}</span><span class="cn">${coinsHtml(sk.nC)}<em>${TYN[sk.type] || ''} ${this.B.powerRange(u, sk).join('-')}</em></span></span>${s.key !== s.dealt ? '<span class="sw">変更</span>' : ''}${to}`;
    if (u.panic > 0) b.disabled = true;
    parent.appendChild(b); return b;
  }
  refreshSlots() { this.pred = this.B.predict(); this.B.side('A').forEach(u => { const el = $(`.bcard[data-u="${u.id}"] .slots`); if (!el || !u.alive) return; el.innerHTML = ''; u.slots.forEach(s => this.slotEl(u, s, el)); }); this.refreshStart(); }
  unsetSlots() { const out = []; this.B.alive('A').forEach(u => u.slots.forEach(s => { const sk = s.skill; if (sk && (sk.kind === 'atk' || sk.ego) && !s.target && u.panic <= 0) out.push({ u, s }); })); return out; }
  refreshStart() { const n = this.unsetSlots().length, e = $('#unsetn'); if (e) { e.textContent = n ? `未設定 ${n}` : '準備OK'; e.className = n ? 'warn' : 'ok'; } }
  enemyAnchor(vu) { const top = vu.py - vu.ph - 96; return { x: vu.px, y: clamp(top, 170, 480) }; }
  renderIntents() {
    const B = this.B, root = $('#intents'), hot = $('#hotspots'); root.innerHTML = ''; hot.innerHTML = '';
    B.alive('E').forEach(e => {
      const vu = this.view.vus[e.id], a = this.enemyAnchor(vu);
      const hs = document.createElement('div'); hs.className = 'hot'; hs.dataset.e = e.id; hs.title = '敵' + (B.side('E').indexOf(e) + 1) + ' (ドラッグで直接攻撃)'; hs.style.cssText = `left:${vu.px - vu.pw / 2}px;top:${vu.py - vu.ph}px;width:${vu.pw}px;height:${vu.ph}px`; hot.appendChild(hs);
      if (e.stag > 0 || !e.slots.length) return;
      const box = document.createElement('div'); box.className = 'itn'; box.style.left = a.x + 'px'; box.style.top = a.y + 'px'; box.insertAdjacentHTML('beforeend', `<div class="en">敵${B.side('E').indexOf(e) + 1} <span class="rtb">${rtBadges(e)}</span></div>`);
      e.slots.forEach(s => {
        if (s.canceled || !s.skill) return; const sc = SIN[s.skill.sin];
        const c = document.createElement('button'); c.className = 'chip'; c.dataset.e = e.id; c.dataset.s = s.i; c.style.setProperty('--sin', sc.c); c.title = `${s.skill.n} [${TYN[s.skill.type] || ''}]  ${skillLine(s.skill, this.B.powerRange(e, s.skill))}  ${descSkill(s.skill)}`;
        c.innerHTML = `<span class="spd">${s.spd}</span><span><span class="nm">${esc(s.skill.n)}</span><span class="cn">${coinsHtml(s.skill.nC)} <em>${TYN[s.skill.type] || ''}</em> ${this.B.powerRange(e, s.skill).join('-')}</span></span>`;
        box.appendChild(c);
      });
      root.appendChild(box);
    });
  }
  renderArrows() {
    const B = this.B, svg = $('#arrows'); if (!svg) return; let h = '<defs>';
    SIN_KEYS.concat(['e']).forEach(k => { const c = k === 'e' ? '#ff4d5e' : SIN[k].c; h += `<marker id="mk-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`; });
    h += '</defs>'; const st = this.stage;
    const ctr = el => { const p = posIn(el, st); return { x: p.x + p.w / 2, y: p.y + p.h / 2, t: p.y, b: p.y + p.h, l: p.x, r: p.x + p.w }; };
    // 敵→味方(奪われた敵スキルは元の矢印を薄くし、奪った味方スキルへ向ける)
    const pred = B.predict(); this.pred = pred;
    B.alive('E').forEach(e => e.slots.forEach(s => {
      if (!s.target || s.canceled) return; const ce = $(`.chip[data-e="${e.id}"][data-s="${s.i}"]`); if (!ce) return;
      let tgt = s.target.s != null ? $(`.slot[data-u="${s.target.u}"][data-i="${s.target.s}"]`) : $(`.bcard[data-u="${s.target.u}"]`); if (!tgt) return;
      const pe = pred.get(s), moved = pe && pe.k === 'pulled' && pe.p && pe.p.u.isAlly && !(pe.p.u.id === s.target.u && pe.p.slot.i === s.target.s);
      const a = ctr(ce), b = ctr(tgt); h += `<path d="M${a.x} ${a.b} C${a.x} ${a.b + 130} ${b.x} ${b.t - 130} ${b.x} ${b.t - 4}" fill="none" stroke="#ff4d5e" stroke-width="2" stroke-dasharray="5 5" opacity="${moved ? .16 : .5}" marker-end="url(#mk-e)"/>`;
      if (moved) { const t2 = $(`.slot[data-u="${pe.p.u.id}"][data-i="${pe.p.slot.i}"]`); if (t2) { const b2 = ctr(t2); h += `<path d="M${a.x} ${a.b} C${a.x} ${a.b + 130} ${b2.x} ${b2.t - 130} ${b2.x} ${b2.t - 4}" fill="none" stroke="#7ee0ff" stroke-width="2.5" stroke-dasharray="2 5" opacity=".85" marker-end="url(#mk-e)"/>`; } }
    }));
    // 味方→敵
    B.alive('A').forEach(u => u.slots.forEach(s => {
      const sk = s.skill; if (!sk || !s.target || (sk.kind !== 'atk' && !sk.ego)) return;
      const se = $(`.slot[data-u="${u.id}"][data-i="${s.i}"]`); if (!se) return; const a = ctr(se);
      const tu = B.U(s.target.u); if (!tu || !tu.alive) return;
      let b, wr = null, tag = null; const vu = this.view.vus[tu.id];
      const pr = pred.get(s), pp = pr && pr.p && pr.k !== 'one' && pr.p.slot.skill ? pr.p : null;
      const ce = pp ? $(`.chip[data-e="${pp.u.id}"][data-s="${pp.slot.i}"]`) : null;
      if (ce) { const p = ctr(ce); b = { x: p.x - 66, y: p.y, end: 1 }; wr = B.estWin(u, sk, pp.u, pp.slot.skill, 120); tag = pr.k === 'steal' ? ['奪取', '#7ee0ff'] : pr.k === 'pulled' ? ['敵に引かれる', '#ffd479'] : null; }
      else { b = { x: vu.px, y: vu.py - vu.ph * .55 }; if (s.target.s != null && pr && pr.k === 'one' && pr.why) tag = ['✕ ' + pr.why, '#ff9a7a']; }
      const c = SIN[sk.sin].c, sel = this.sel && this.sel.u === u && this.sel.i === s.i;
      h += `<path d="M${a.x} ${a.t} C${a.x} ${a.t - 150} ${b.x - 50} ${b.y + 40} ${b.x} ${b.y}" fill="none" stroke="${c}" stroke-width="${sel ? 4.5 : 3}" opacity="${sel ? 1 : .85}" marker-end="url(#mk-${sk.sin})" style="filter:drop-shadow(0 0 4px ${c})"${tag && !ce ? ' stroke-dasharray="7 6"' : ''}/>`;
      if (wr != null) { const mx = (a.x + b.x) / 2 + 8, my = (a.t + b.y) / 2 - 24, col = wr >= .6 ? '#7ee08a' : wr >= .4 ? '#ffd479' : '#ff6b6b'; h += `<g transform="translate(${mx} ${my})"><rect x="-24" y="-13" width="48" height="22" fill="rgba(6,3,12,.92)" stroke="${col}" stroke-width="1.5"/><text class="wr" x="0" y="3" text-anchor="middle" fill="${col}">${Math.round(wr * 100)}%</text></g>`; }
      if (tag) { const tx = (a.x + b.x) / 2 + 8, ty = (a.t + b.y) / 2 - (wr != null ? 50 : 24), w = tag[0].length * 12 + 16; h += `<g transform="translate(${tx} ${ty})"><rect x="${-w / 2}" y="-11" width="${w}" height="20" fill="rgba(6,3,12,.92)" stroke="${tag[1]}" stroke-width="1.5"/><text class="wr" x="0" y="4" text-anchor="middle" fill="${tag[1]}" style="font-size:12px">${tag[0]}</text></g>`; }
    }));
    // 防御/回避 → 敵スキル(選択)
    B.alive('A').forEach(u => u.slots.forEach(s => {
      const sk = s.skill; if (!sk || !s.dtarget || (sk.kind === 'atk' || sk.ego)) return;
      const se = $(`.slot[data-u="${u.id}"][data-i="${s.i}"]`), ce = $(`.chip[data-e="${s.dtarget.u}"][data-s="${s.dtarget.s}"]`); if (!se || !ce) return;
      const a = ctr(se), p = ctr(ce), b = { x: p.x - 66, y: p.y };
      h += `<path d="M${a.x} ${a.t} C${a.x} ${a.t - 150} ${b.x - 50} ${b.y + 40} ${b.x} ${b.y}" fill="none" stroke="#7ec8ff" stroke-width="3" stroke-dasharray="3 6" opacity=".9" marker-end="url(#mk-e)" style="filter:drop-shadow(0 0 4px #7ec8ff)"/>`;
    }));
    svg.innerHTML = h;
    // ターゲットされているチップを強調
    $$('.chip').forEach(c => { c.classList.remove('targeted'); delete c.dataset.m; });
    B.alive('E').forEach(e => e.slots.forEach(s => {
      const c = $(`.chip[data-e="${e.id}"][data-s="${s.i}"]`), pe = pred.get(s); if (!c || !pe) return;
      if (pe.k === 'pulled' || pe.k === 'dsteal') c.dataset.m = pe.p && pe.p.u.isAlly ? '奪取' : '敵に引かれ';
      else if (pe.k === 'steal') c.dataset.m = '敵奪取';
      else if (pe.k === 'clash') c.dataset.m = '合戦';
      else if (pe.k === 'one') c.dataset.m = '直撃';
    }));
    B.alive('A').forEach(u => u.slots.forEach(s => { const t = s.dtarget || (s.target && s.target.u !== u.id ? s.target : null); if (t && t.s != null) { const c = $(`.chip[data-e="${t.u}"][data-s="${t.s}"]`); if (c) c.classList.add('targeted'); } }));
  }
  closeMenu() { const m = $('#menu'); if (m) m.hidden = true; }
  openMenu(u, s) {
    const B = this.B, m = $('#menu'); m.hidden = false;
    const keys = ['s1', 's2', 's3', 'def', 'ego']; let h = `<h5>${esc(u.name)} — スキルを選択</h5>`;
    keys.forEach(k => {
      const sk = k === 'ego' ? (u.sp >= 0 ? u.ego.aw : u.ego.co) : u.kit[k]; const can = B.canChoose(u, s, k), c = B.slotCost(u, s, k);
      const costTxt = k === 'ego' ? `<span class="cost">${SIN[u.ego.sin].n}-3</span>` : c.sin ? `<span class="cost">${SIN[c.sin].n}-1</span>` : k === s.dealt ? '<span class="cost">配布</span>' : '';
      h += `<button class="mopt ${s.key === k ? 'cur' : ''}" data-k="${k}" style="--sin:${k === 'def' ? '#5b8cff' : SIN[sk.sin].c}" ${can ? '' : 'disabled'}><span class="ic">${KEYN[k]}</span><span><b>${esc(sk.n)} ${costTxt}</b><small>${kindName(sk)}・${TYN[sk.type] || ''} / ${skillLine(sk, B.powerRange(u, sk))}${k === 'ego' ? (u.sp >= 0 ? ' / 覚醒' : ' / 侵蝕') : ''}<br>${esc(descSkill(sk))}</small></span></button>`;
    });
    m.innerHTML = h; const se = $(`.slot[data-u="${u.id}"][data-i="${s.i}"]`), p = posIn(se, this.stage);
    m.style.left = clamp(p.x - 40, 8, 1280 - 272) + 'px'; m.style.top = Math.max(60, p.y - m.offsetHeight - 8) + 'px';
  }
  click(e) {
    SFX.init();
    const t = e.target, B = this.B, bt = t.closest('[data-b]');
    if (bt) { this.btn(bt.dataset.b); return; }
    if (this.phase !== 'plan') return;
    if (this.suppressClick) { this.suppressClick = false; return; }
    const mo = t.closest('.mopt');
    if (mo && this.sel) { const u = B.U(this.sel.u), s = u.slots[this.sel.i]; if (B.setSkill(u, s.i, mo.dataset.k)) { SFX.play('pick'); this.refreshSlots(); this.sel = { u: u.id, i: s.i }; this.markSel(); this.renderArrows(); this.openMenu(u, s); } else SFX.play('deny'); return; }
    if (t.closest('#menu')) return;
    const sl = t.closest('.slot');
    if (sl) { const u = B.U(+sl.dataset.u), s = u.slots[+sl.dataset.i]; this.sel = { u: u.id, i: s.i }; SFX.play('ui'); this.markSel(); this.openMenu(u, s); this.renderArrows(); return; }
    this.sel = null; this.closeMenu(); this.markSel(); this.renderArrows();
  }
  markSel() { $$('.slot').forEach(b => b.classList.toggle('sel', !!this.sel && +b.dataset.u === this.sel.u && +b.dataset.i === this.sel.i)); }
  /* ---------- ドラッグで標的指定 ---------- */
  toStage(cx, cy) {
    const r = this.stage.getBoundingClientRect(), s = this.scale || 1;
    return this.rot ? { x: (cy - r.top) / s, y: (r.right - cx) / s } : { x: (cx - r.left) / s, y: (cy - r.top) / s };
  }
  bindDrag() {
    this.pd = e => this.onPD(e); this.pm = e => this.onPM(e); this.pu = e => this.onPU(e);
    this.stage.addEventListener('pointerdown', this.pd);
    window.addEventListener('pointermove', this.pm, { passive: false }); window.addEventListener('pointerup', this.pu); window.addEventListener('pointercancel', this.pu);
  }
  unbindDrag() { if (this.stage) this.stage.removeEventListener('pointerdown', this.pd); window.removeEventListener('pointermove', this.pm); window.removeEventListener('pointerup', this.pu); window.removeEventListener('pointercancel', this.pu); }
  onPD(e) {
    if (this.phase !== 'plan' || (e.pointerType === 'mouse' && e.button > 0)) return;
    const sl = e.target.closest('.slot'); if (!sl || sl.disabled) return;
    const u = this.B.U(+sl.dataset.u), s = u.slots[+sl.dataset.i]; if (!s) return;
    this.pend = { u, s, el: sl, x0: e.clientX, y0: e.clientY, id: e.pointerId, drag: false };
  }
  onPM(e) {
    const p = this.pend; if (!p || e.pointerId !== p.id) return;
    if (!p.drag) {
      if (Math.hypot(e.clientX - p.x0, e.clientY - p.y0) < 8) return;
      this.beginDrag(p);
    }
    e.preventDefault(); this.dragMove(e);
  }
  beginDrag(p) {
    p.drag = true; this.sel = { u: p.u.id, i: p.s.i }; this.closeMenu(); this.markSel(); SFX.play('pick');
    const sp = posIn(p.el, this.stage); p.sx = sp.x + sp.w / 2; p.sy = sp.y + 2; p.cx = p.sx; p.cy = p.sy - 30; p.tx = p.cx; p.ty = p.cy; p.over = null;
    p.el.classList.add('dragsrc'); this.stage.classList.add('dragging'); this.renderArrows(); this.markDragChips(p);
  }
  /* ドラッグ中: 各敵スキルに「奪取OK / 合戦 / 速度負け…」のタグを表示する */
  markDragChips(p) {
    const B = this.B, defk = p.s.skill.kind !== 'atk' && !p.s.skill.ego;
    $$('.chip').forEach(c => {
      const tu = B.U(+c.dataset.e), ts = tu && tu.slots[+c.dataset.s]; if (!ts) return; let cls = '', txt = '';
      if (defk) { const ok = ts.skill && ts.skill.kind === 'atk' && !ts.used && !ts.canceled && tu.stag <= 0 && B.stealable(p.u, p.s, tu, ts); cls = ok ? 'steal' : 'no'; txt = ok ? '奪取OK' : '速度負け'; }
      else { const pr = B.predictWith(p.s, { target: { u: tu.id, s: ts.i } }); if (!pr) return;
        if (pr.k === 'steal') { cls = 'steal'; txt = '奪取OK'; } else if (pr.k === 'clash') { cls = 'clash'; txt = '合戦'; } else if (pr.k === 'pulled') { cls = 'pull'; txt = '別の合戦'; } else { cls = 'no'; txt = whyShort(pr.why); } }
      c.dataset.d = cls; c.dataset.dt = txt;
    });
  }
  clearDragChips() { $$('.chip').forEach(c => { delete c.dataset.d; delete c.dataset.dt; }); }
  dragMove(e) {
    const p = this.pend, pt = this.toStage(e.clientX, e.clientY); p.px = pt.x; p.py = pt.y;
    const el = document.elementFromPoint(e.clientX, e.clientY), chip = el && el.closest('.chip'), hot = el && el.closest('.hot');
    const over = chip ? { k: 'chip', el: chip, e: +chip.dataset.e, s: +chip.dataset.s } : hot ? { k: 'hot', el: hot, e: +hot.dataset.e, s: null } : null;
    if (!p.over || !over || p.over.el !== over.el) { if (p.over) p.over.el.classList.remove('over'); if (over) { over.el.classList.add('over'); SFX.play('pick'); } p.over = over; p.wr = null; }
    if (over) {
      const q = posIn(over.el, this.stage);
      if (over.k === 'chip') { p.tx = q.x + 4; p.ty = q.y + q.h / 2; } else { p.tx = q.x + q.w / 2; p.ty = q.y + q.h * .45; }
      if (p.wr == null && p.s.skill.kind !== 'atk' && !p.s.skill.ego) { const tu = this.B.U(over.e), ts = over.s != null ? tu.slots[over.s] : null; const ok = ts && ts.skill && ts.skill.kind === 'atk' && !ts.used && !ts.canceled && tu.stag <= 0 && this.B.stealable(p.u, p.s, tu, ts); p.tsSpd = ts ? ts.spd : null; p.cs = 'dfn'; p.wr = !ts ? -5 : ok ? -3 : -4; p.rng = null; }
      else if (p.wr == null) {
        const B = this.B, tu = B.U(over.e), ts = over.s != null ? tu.slots[over.s] : null;
        const pr = B.predictWith(p.s, { target: { u: tu.id, s: ts ? ts.i : null } }), pp = pr && pr.p && pr.k !== 'one' && pr.p.slot.skill ? pr.p : null;
        let cs = 'none'; if (pr) { if (pr.k === 'steal') cs = 'steal'; else if (pr.k === 'clash') cs = 'mutual'; else if (pr.k === 'pulled') cs = 'pulled'; else if (ts) cs = /速度|同速/.test(pr.why || '') ? 'slow' : 'prot'; }
        p.tsSpd = ts ? ts.spd : null; p.why = pr && pr.why || '';
        p.rng = { a: B.powerRange(p.u, p.s.skill, tu), b: pp ? B.powerRange(pp.u, pp.slot.skill, p.u) : null, rt: tu.rt[p.s.skill.type] || 1, ty: p.s.skill.type }; p.cs = cs;
        p.wr = pp ? B.estWin(p.u, p.s.skill, pp.u, pp.slot.skill, 140) : (ts && pr && pr.k === 'one') ? -2 : -1;
      }
    } else { p.tx = pt.x; p.ty = pt.y; }
  }
  dragFrame() {
    const p = this.pend, svg = $('#dragsvg'), bub = $('#wrbub'); if (!svg) return;
    if (!p || !p.drag) { if (svg.innerHTML) { svg.innerHTML = ''; } if (bub && !bub.hidden) bub.hidden = true; return; }
    const k = .38; p.cx += (p.tx - p.cx) * k; p.cy += (p.ty - p.cy) * k;
    const c = SIN[p.s.skill.sin].c, a = { x: p.sx, y: p.sy }, b = { x: p.cx, y: p.cy }, snap = !!p.over;
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), lift = Math.min(170, 60 + L * .35);
    const c1 = { x: a.x, y: a.y - lift }, c2 = { x: b.x - dx * .25, y: b.y + (snap ? 50 : 30) + Math.min(60, L * .1) };
    // 矢じり
    const ang = Math.atan2(b.y - c2.y, b.x - c2.x), ah = 16, hx1 = b.x - Math.cos(ang - .45) * ah, hy1 = b.y - Math.sin(ang - .45) * ah, hx2 = b.x - Math.cos(ang + .45) * ah, hy2 = b.y - Math.sin(ang + .45) * ah;
    svg.innerHTML = `<g style="filter:drop-shadow(0 0 7px ${c})"><path d="M${a.x} ${a.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="9" stroke-linecap="round"/><path d="M${a.x} ${a.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${snap ? '0' : '2 9'}"/><path d="M${a.x} ${a.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/><polygon points="${b.x},${b.y} ${hx1},${hy1} ${hx2},${hy2}" fill="${snap ? '#fff' : c}"/><circle cx="${a.x}" cy="${a.y}" r="6" fill="${c}" stroke="#fff" stroke-width="2"/></g>`;
    if (snap && p.wr != null && p.wr >= 0) { const col = p.wr >= .6 ? '#7ee08a' : p.wr >= .4 ? '#ffd479' : '#ff6b6b'; bub.hidden = false; bub.style.left = (b.x + 14) + 'px'; bub.style.top = (b.y - 46) + 'px'; bub.style.color = col; bub.style.borderColor = col; bub.innerHTML = `<small>${p.cs === 'steal' ? '奪取 速度' + p.s.spd + '>' + p.tsSpd + '・勝率' : p.cs === 'pulled' ? '別の合戦に引かれる・勝率' : '勝率'}</small>${Math.round(p.wr * 100)}%${rngHtml(p)}`; }
    else if (snap && p.wr === -2) { bub.hidden = false; bub.style.left = (b.x + 14) + 'px'; bub.style.top = (b.y - 46) + 'px'; bub.style.color = '#ff9a7a'; bub.style.borderColor = '#ff9a7a'; bub.innerHTML = (p.cs === 'slow' ? `<small>${p.s.spd === p.tsSpd ? '同速は奪えない' : '速度不足'} ${p.s.spd}≦${p.tsSpd}</small>直接攻撃` : `<small>${esc(p.why || 'マッチ不可')}</small>直接攻撃`) + rngHtml(p); }
    else if (snap && (p.wr === -3 || p.wr === -4 || p.wr === -5)) { const m = { '-3': ['#7ee08a', '速度で先に回避 ' + p.s.spd + '>' + p.tsSpd, '奪取して使用'], '-4': ['#ffd479', '速度不足 ' + p.s.spd + '≦' + p.tsSpd, '受け身の防御'], '-5': ['#ff9a7a', '敵スキルを選択', '敵本体は不可'] }[p.wr]; bub.hidden = false; bub.style.left = (b.x + 14) + 'px'; bub.style.top = (b.y - 46) + 'px'; bub.style.color = m[0]; bub.style.borderColor = m[0]; bub.innerHTML = `<small>${m[1]}</small>${m[2]}`; }
    else if (snap && p.wr === -1) { bub.hidden = false; bub.style.left = (b.x + 14) + 'px'; bub.style.top = (b.y - 46) + 'px'; bub.style.color = '#ffd479'; bub.style.borderColor = '#ffd479'; bub.innerHTML = '<small>直接攻撃</small>' + rngHtml(p); }
    else bub.hidden = true;
  }
  onPU(e) {
    const p = this.pend; if (!p || (e && e.pointerId !== p.id)) return; this.pend = null;
    if (!p.drag) return;
    this.suppressClick = true; setTimeout(() => { this.suppressClick = false; }, 80);
    p.el.classList.remove('dragsrc'); this.stage.classList.remove('dragging'); if (p.over) p.over.el.classList.remove('over'); this.clearDragChips();
    const svg = $('#dragsvg'); if (svg) svg.innerHTML = ''; const bub = $('#wrbub'); if (bub) bub.hidden = true;
    this.sel = null; this.markSel();
    if (p.over && this.phase === 'plan') {
      const tu = this.B.U(p.over.e); const defk = p.s.skill.kind !== 'atk' && !p.s.skill.ego;
      if (defk) { if (tu && tu.alive && p.over.s != null) { p.s.dtarget = { u: tu.id, s: p.over.s }; SFX.play('ok'); this.refreshSlots(); this.renderArrows(); } else { SFX.play('deny'); toast('回避・防御は敵のスキルを選択してください'); this.renderArrows(); } return; }
      if (tu && tu.alive) { const was = this.B.predict(); p.s.target = { u: tu.id, s: p.over.s }; SFX.play(this.B.predict().get(p.s) && this.B.predict().get(p.s).k === 'steal' ? 'flip' : 'ok'); this.refreshSlots(); this.renderArrows(); this.notifyDisplaced(p, was); const sl = $(`.slot[data-u="${p.u.id}"][data-i="${p.s.i}"]`); if (sl) { sl.classList.add('assigned'); setTimeout(() => sl.classList.remove('assigned'), 500); } return; }
    }
    SFX.play('back'); this.renderArrows();
  }
  /* 奪取で合戦相手を失った味方スキルを知らせる */
  notifyDisplaced(p, was) {
    const now = this.B.predict(), me = now.get(p.s), out = [];
    this.B.alive('A').forEach(u => u.slots.forEach(s => { if (s === p.s) return; const a = was.get(s), b = now.get(s); if (a && b && (a.k === 'clash' || a.k === 'steal') && b.k === 'one') out.push(u.name + (b.why ? '(' + b.why + ')' : '')); }));
    if (me && me.k === 'steal') toast('マッチ奪い成立!' + (out.length ? ' 合戦を失う: ' + out.join('、') + ' → 標的を選び直せます' : ''));
    else if (out.length) toast('合戦が崩れました: ' + out.join('、'));
  }
  btn(k) {
    SFX.init();
    if (k === 'go') { if (this.phase === 'plan') this.startTurn(); }
    else if (k === 'spd') { const n = (S.set.spd || 1) === 1 ? 2 : (S.set.spd === 2 ? 4 : 1); S.set.spd = n; this.view.spd = n; saveState(); this.updateBtns(); SFX.play('ui'); }
    else if (k === 'auto') { this.auto = !this.auto; S.set.auto = this.auto; saveState(); this.updateBtns(); SFX.play('ui'); if (this.auto && this.phase === 'plan') setTimeout(() => { if (this.phase === 'plan') this.startTurn(); }, 500); }
    else if (k === 'snd') { SFX.setMute(!SFX.muted); S.set.mute = SFX.muted; saveState(); this.updateBtns(); }
    else if (k === 'quit') { this.confirmQuit(); }
    else if (k === 'info') { if (typeof showEnemyInfo === 'function') showEnemyInfo(this.B); }
    else if (k === 'log') { if (typeof showBattleLog === 'function') showBattleLog(this); }
  }
  confirmQuit() {
    if ($('#qbox')) return; const d = document.createElement('div'); d.id = 'qbox'; d.style.cssText = 'position:absolute;inset:0;z-index:20;background:rgba(3,2,8,.8);display:flex;align-items:center;justify-content:center';
    d.innerHTML = `<div class="mbox" style="width:420px"><h3>撤退しますか?</h3><p style="color:var(--dim)">戦闘は敗北扱いになり、消費した灯油は戻りません。</p><div class="acts"><button class="btn" data-q="no">続ける</button><button class="btn red" data-q="yes">撤退する</button></div></div>`;
    d.addEventListener('click', e => { const q = e.target.closest('[data-q]'); if (!q) return; e.stopPropagation(); d.remove(); if (q.dataset.q === 'yes') { this.retreat = true; this.view.abort = true; this.B.over = true; this.B.result = 'lose'; if (this.go) { const g = this.go; this.go = null; g(); } } });
    $('#stage').appendChild(d);
  }
  startTurn(force) {
    if (this.phase !== 'plan' || !this.go) return;
    const un = this.unsetSlots();
    if (un.length) {
      if (this.auto || force) this.B.autoTargets(m => un.some(x => x.s === m.s));
      else { this.askUnset(un); return; }
    }
    SFX.play('resolve'); const g = this.go; this.go = null; g();
  }
  askUnset(un) {
    if ($('#qbox')) return; SFX.play('deny');
    $$('.slot.unset').forEach(b => { b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); });
    const d = document.createElement('div'); d.id = 'qbox'; d.style.cssText = 'position:absolute;inset:0;z-index:20;background:rgba(3,2,8,.72);display:flex;align-items:center;justify-content:center';
    d.innerHTML = `<div class="mbox" style="width:460px"><h3>標的が未設定です</h3><p style="color:var(--dim)">未設定のスロットが <b style="color:var(--lamp)">${un.length}</b> 個あります。スロットを敵のスキル(または敵本体)へドラッグして標的を指定してください。</p><div class="acts"><button class="btn pri" data-q="back">設定に戻る</button><button class="btn" data-q="auto">自動で割り当てて開始</button></div></div>`;
    d.addEventListener('click', e => { const q = e.target.closest('[data-q]'); if (!q) return; e.stopPropagation(); d.remove(); if (q.dataset.q === 'auto') this.startTurn(true); });
    $('#stage').appendChild(d);
  }
  autoExtra() {
    const B = this.B;
    B.alive('A').forEach(u => u.slots.forEach(s => {
      if (u.panic > 0 || u.stag > 0) return;
      if (!u.slots.some(o => o.key === 'ego') && B.canChoose(u, s, 'ego') && Math.random() < .55) B.setSkill(u, s.i, 'ego');
      else if (B.canChoose(u, s, 's3') && s.key !== 's3' && Math.random() < .25) B.setSkill(u, s.i, 's3');
      else if (u.hp / u.maxHp < .35 && Math.random() < .4) B.setSkill(u, s.i, 'def');
    }));
    B.autoTargets();
  }
  plan() {
    return new Promise(res => {
      this.go = res; this.renderPlan();
      if (this.auto) setTimeout(() => { if (this.phase === 'plan' && this.go) { this.autoExtra(); this.startTurn(); } }, 750 / (S.set.spd || 1));
    });
  }
  hidePlan() {
    this.pend = null; this.phase = 'play'; this.closeMenu(); $('#cards').classList.add('low'); $('#side').classList.add('hide'); $('#arrows').innerHTML = ''; $('#intents').innerHTML = ''; $('#hotspots').innerHTML = '';
    $$('.slots').forEach(e => e.innerHTML = '');
  }
  /* ---------- 進行 ---------- */
  async run() {
    this.build(); const B = this.B, v = this.view; v.start();
    SFX.bgm(this.spec.boss ? 'boss' : 'battle');
    if (this.spec.boss && typeof bossIntroFx === 'function') { try { await bossIntroFx(this.spec, B); } catch (e) { console.error(e); } }
    else { v.banner(this.spec.title || 'BATTLE', this.spec.boss ? '#ff6b6b' : '#ffd479', 1.6, this.spec.boss ? 'BOSS BATTLE' : ''); await v.wait(1100); }
    try {
      while (!B.over && this.alive) {
        const ev = B.startTurn(); await v.play(ev); if (B.over || !this.alive) break;
        await this.plan(); if (!this.alive) return; if (this.retreat) break; this.hidePlan();
        const ev2 = B.resolve(); if (typeof pushBattleLog === 'function') pushBattleLog(this, B, ev2); await v.play(ev2); if (this.retreat) break;
        this.cache = {};
      }
      if (this.alive) await this.finish();
    } catch (err) {
      console.error(err); toast('戦闘処理でエラーが発生しました'); if (this.alive) { await this.finish(); }
    }
  }
  async finish() {
    const B = this.B, v = this.view, win = B.result === 'win' && !this.retreat; this.phase = 'end';
    this.hidePlan(); SFX.bgm(null);
    if (!this.retreat) { v.banner(win ? 'VICTORY' : 'DEFEAT', win ? '#ffd479' : '#ff4d5e', 2.2); SFX.play(win ? 'reveal' : 'lose', { rare: 1 }); await v.wait(1900); }
    if (B.use) { addMast(B.use); saveState(); }
    if (typeof dexRecord === 'function') { dexRecord(B, this.spec); saveState(); }
    const out = this.ctx.onResult ? this.ctx.onResult(win, B, this.retreat) : { html: '', buttons: [{ t: '戻る', cls: 'pri', fn: () => { } }] };
    if (out.fx && this.alive) { try { await out.fx(); } catch (e) { console.error(e); } }
    const r = $('#result'); r.hidden = false;
    const st = B.stat;
    r.innerHTML = `<div class="rbox ${win ? 'win' : 'lose'}"><h2>${win ? 'VICTORY' : this.retreat ? 'RETREAT' : B.timeUp ? 'TIME UP' : 'DEFEAT'}</h2>
      <p style="text-align:center;color:var(--dim)">${esc(this.spec.title || '')}</p>
      <div class="stt"><div><small>ターン</small><b>${B.turn}</b></div><div><small>与ダメージ</small><b>${st.dmg}</b></div><div><small>クラッシュ勝利</small><b>${st.clashW}</b></div><div><small>混乱させた数</small><b>${st.stag}</b></div></div>
      ${typeof dmgTable === 'function' ? dmgTable(B) : ''}${out.html || ''}<div class="acts">${out.buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-r="${i}">${esc(b.t)}</button>`).join('')}</div></div>`;
    if (typeof resultFx === 'function') { try { resultFx(win, r, this.retreat); } catch (e) { console.error(e); } }
    r.onclick = e => { const b = e.target.closest('[data-r]'); if (!b) return; SFX.init(); SFX.play('ok'); const btn = out.buttons[+b.dataset.r]; r.onclick = null; this.destroy(); if (btn.fn) btn.fn(); };
  }
}
let CURRENT_BATTLE = null;
function launchBattle(spec, ctx) {
  CURRENT_BATTLE = new BattleUI(spec, ctx); $('#scr').hidden = true; $('#topbar').hidden = true; $('#bgc').style.visibility = 'hidden';
  CURRENT_BATTLE.run(); return CURRENT_BATTLE;
}
