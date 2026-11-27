'use strict';
/* ============================================================
   LAMPWARDEN COMPANY — main.js  起動
   ============================================================ */
(function boot0() { imgReady().then(boot); })();
function boot() {
  try { loadState(); } catch (e) { console.warn(e); }
  regenOil();
  SFX.setMute(!!S.set.mute); SFX.setVol(S.set.vol || .8);
  initUI();
  // 最初の操作でオーディオを起動(自動再生制限対策)
  let audioOn = false;
  const unlock = () => { if (audioOn) return; audioOn = true; SFX.init(); SFX.setMute(!!S.set.mute); SFX.setVol(S.set.vol || .8); SFX.resumeMode(); };
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, unlock, { once: false, passive: true }));
  // キーボード: Enter/Space でボタン実行は標準動作。Esc でモーダル/戻る
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const m = $('#modal'); if (m && !m.hidden && !m.dataset.lock) { closeModal(); return; }
    if (CURRENT_BATTLE && !$('#bwrap').hidden) return;
    if (CUR !== 'title' && CUR !== 'home' && !$('#scr').hidden) ACT.back();
  });
  // 画面が隠れたらBGMを止め、戻ったら再開
  document.addEventListener('visibilitychange', () => { if (document.hidden) SFX.suspend(); else if (audioOn) SFX.resume(); });
  go('title');
}
