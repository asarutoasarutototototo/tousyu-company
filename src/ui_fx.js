'use strict';
/* ============================================================
   演出強化: リザルト / ボス戦導入 / 章クリア(レベル上限解放) / レベルアップ
   ============================================================ */
const FXRM = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
/* 汎用: 最前面の粒子キャンバス */
function fxCanvas(z, guard) {
  const cv = document.createElement('canvas'); cv.className = 'fxtop'; cv.style.zIndex = z || 70; $('#app').appendChild(cv);
  const c = cv.getContext('2d'), dpr = Math.min(1.5, window.devicePixelRatio || 1);
  const fit = () => { cv.width = Math.max(1, innerWidth * dpr); cv.height = Math.max(1, innerHeight * dpr); }; fit(); window.addEventListener('resize', fit);
  const o = { ps: [], dpr, emit: null, endAt: 0, stop() { o.dead = true; cv.remove(); window.removeEventListener('resize', fit); },
    burst(x, y, col, n, sp) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, s = (1.5 + Math.random() * (sp || 8)) * dpr; o.ps.push({ x: x * dpr, y: y * dpr, vx: Math.cos(a) * s, vy: Math.sin(a) * s - dpr, a: 1, da: .01 + Math.random() * .02, col, s: (1 + Math.random() * 2.4) * dpr, g: .07 * dpr }); } } };
  function loop(now) {
    if (o.dead || !cv.isConnected || (guard && !guard())) { o.stop(); return; }
    c.clearRect(0, 0, cv.width, cv.height); if (o.emit) o.emit(o, now, cv.width, cv.height);
    c.globalCompositeOperation = 'lighter';
    for (let i = o.ps.length - 1; i >= 0; i--) {
      const q = o.ps[i]; q.x += q.vx; q.y += q.vy; q.vy += q.g; q.vx *= .99; q.a -= q.da; if (q.a <= 0) { o.ps.splice(i, 1); continue; }
      c.globalAlpha = Math.max(0, Math.min(1, q.a)); c.fillStyle = q.col; c.beginPath(); c.arc(q.x, q.y, q.s, 0, 6.283); c.fill();
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    if (o.endAt && now > o.endAt && !o.ps.length) { o.stop(); return; } requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop); return o;
}
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------- リザルト ---------- */
function resultFx(win, r, retreat) {
  const box = r.querySelector('.rbox'); if (!box) return; const rm = FXRM();
  const h = box.querySelector('h2'); if (h) { const t = h.textContent; h.innerHTML = [...t].map((ch, i) => `<span class="rl" style="animation-delay:${.12 + i * .07}s">${ch}</span>`).join(''); h.setAttribute('aria-label', t); }
  const bg = document.createElement('div'); bg.className = win ? 'rrays' : 'rdark'; r.insertBefore(bg, r.firstChild); box.classList.add('rin');
  box.querySelectorAll(':scope > .stt b').forEach(b => {
    const v = +String(b.textContent).replace(/,/g, ''); if (!isFinite(v) || v <= 0 || rm) return; const T = 900, t0 = performance.now() + 450; b.textContent = '0';
    (function f(now) { const p = Math.min(1, Math.max(0, (now - t0) / T)); b.textContent = Math.round(v * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(performance.now());
  });
  let k = 0;
  box.querySelectorAll('.rew span, .gdrop span').forEach(s => { const d = .95 + (k++) * .17; s.classList.add('rchip'); s.style.animationDelay = d + 's'; setTimeout(() => { if (r.isConnected && !r.hidden) SFX.play('count'); }, d * 1000); });
  box.querySelectorAll('.stars > span').forEach((s, i) => { const d = 1.4 + i * .32, on = s.style.opacity === '1'; s.classList.add('rchip'); s.style.animationDelay = d + 's'; setTimeout(() => { if (r.isConnected && !r.hidden) SFX.play(on ? 'stamp' : 'count'); }, d * 1000); });
  if (win && !rm) {
    const fx = fxCanvas(70, () => { const q = $('#result'); return q && !q.hidden && q.isConnected && q.innerHTML; });
    const t0 = performance.now(); fx.endAt = t0 + 6000;
    fx.emit = (o, now, W, H) => { if (now - t0 > 5500) return; for (let i = 0; i < 2; i++) o.ps.push({ x: Math.random() * W, y: H + 10, vx: (Math.random() - .5) * 1.2 * o.dpr, vy: -(1.2 + Math.random() * 3.2) * o.dpr, a: 1, da: .004 + Math.random() * .005, col: Math.random() < .3 ? '#fff4d0' : '#ffb347', s: (1 + Math.random() * 2.2) * o.dpr, g: -.004 * o.dpr }); };
    const w = innerWidth, hh = innerHeight; setTimeout(() => { if (fx && !fx.dead) fx.burst(w / 2, hh * .3, '#ffd479', 60, 9); }, 350);
  }
}

/* ---------- ボス戦の導入 ---------- */
function bossIntroFx(spec, B) {
  return new Promise(res => {
    const rm = FXRM(), boss = B.side('E').find(u => u.boss) || B.side('E')[0], nm = boss ? boss.name : 'BOSS';
    const ov = document.createElement('div'); ov.className = 'bossin';
    ov.innerHTML = `<div class="bi-bar t"></div><div class="bi-bar b"></div><div class="bi-str s1"></div><div class="bi-str s2"></div><div class="bi-warn">WARNING</div><div class="bi-name"><small>BOSS BATTLE</small><b>${esc(nm)}</b><em>${esc(spec.title || '')}</em></div>`;
    $('#app').appendChild(ov); let done = false;
    const end = () => { if (done) return; done = true; ov.classList.add('out'); setTimeout(() => { ov.remove(); res(); }, 350); };
    ov.addEventListener('click', end);
    if (rm) { ov.classList.add('rm'); setTimeout(end, 900); return; }
    SFX.play('warn'); setTimeout(() => SFX.play('warn'), 700);
    setTimeout(() => { if (done) return; ov.classList.add('hit'); SFX.play('slam'); }, 1250);
    setTimeout(end, 2900);
  });
}

/* ---------- 章クリア(レベル上限解放) ---------- */
function chapterClearFx(ch, from, to) {
  return new Promise(res => {
    const rm = FXRM(), ov = document.createElement('div'); ov.className = 'chapfx';
    ov.innerHTML = `<div class="rrays" style="opacity:.8"></div><div class="cf-box"><div class="eyebrow" style="letter-spacing:.5em">CHAPTER CLEAR</div><h2>${[...'章クリア'].map((c, i) => `<span class="rl" style="animation-delay:${.2 + i * .12}s">${c}</span>`).join('')}</h2><p class="cf-n">${esc(ch.n)}</p><div class="cf-cap"><small>レベル上限</small><b id="cfcap">Lv${from}</b><span class="cf-up">▲ +${to - from}</span></div><small class="cf-tip">タップで続ける</small></div>`;
    $('#app').appendChild(ov); let done = false;
    SFX.play('chap'); const fx = rm ? null : fxCanvas(81, () => ov.isConnected);
    if (fx) { fx.endAt = performance.now() + 5000; setTimeout(() => fx.burst(innerWidth / 2, innerHeight * .4, '#ffd479', 120, 10), 500); setTimeout(() => fx.burst(innerWidth / 2, innerHeight * .55, '#fff4d0', 70, 7), 1900); }
    const capEl = ov.querySelector('#cfcap'), t0 = performance.now() + 1400;
    (function f(now) { if (!ov.isConnected) return; const p = Math.min(1, Math.max(0, (now - t0) / 800)); capEl.textContent = 'Lv' + Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); else capEl.classList.add('done'); })(performance.now());
    setTimeout(() => { if (!done) SFX.play('stamp'); }, 2300);
    const end = () => { if (done) return; done = true; ov.classList.add('out'); if (fx) fx.endAt = 1; setTimeout(() => { ov.remove(); res(); }, 350); };
    ov.addEventListener('click', end); setTimeout(end, rm ? 1500 : 4200);
  });
}

/* ---------- レベルアップ ---------- */
function lvUpFx(lv) {
  const p = $('.bigport'); if (!p || FXRM()) return; const b = p.getBoundingClientRect();
  p.classList.add('lvup'); setTimeout(() => p.classList.remove('lvup'), 900); SFX.play('lvup');
  const t = document.createElement('div'); t.className = 'lvtxt'; t.style.left = (b.left + b.width / 2) + 'px'; t.style.top = (b.top + b.height * .35) + 'px'; t.innerHTML = `LEVEL UP<b>Lv${lv}</b>`; $('#app').appendChild(t); setTimeout(() => t.remove(), 1400);
  const fx = fxCanvas(75); fx.endAt = performance.now() + 1500; fx.burst(b.left + b.width / 2, b.top + b.height * .55, '#ffd479', 46, 5);
  const t0 = performance.now(); fx.emit = (o, now) => { if (now - t0 > 700) return; o.ps.push({ x: (b.left + Math.random() * b.width) * o.dpr, y: (b.bottom - 6) * o.dpr, vx: 0, vy: -(1 + Math.random() * 2.6) * o.dpr, a: 1, da: .012, col: '#ffe9a8', s: (1 + Math.random() * 1.8) * o.dpr, g: 0 }); };
}
(function () {
  ['rlv', 'rlvn'].forEach(k => { const f = ACT[k]; if (!f) return; ACT[k] = function (d) { const sid = ROS_SID, a = sLv(sid); f.call(this, d); if (sLv(sid) > a) lvUpFx(sLv(sid)); }; });
})();
