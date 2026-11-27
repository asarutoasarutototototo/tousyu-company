// 戦闘画面でマッチ奪いをドラッグ操作する(スクリーンショット: steal_*.png)
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1200);
  await p.click('[data-act=start]').catch(()=>{}); await p.waitForTimeout(300);
  const skip=async()=>{ for(let i=0;i<40;i++){ if(await p.$('#dialog:not([hidden])')){ await p.click('#dialog .dbox',{timeout:800,force:true}).catch(()=>{}); await p.waitForTimeout(300);} else if(i>3) break; else await p.waitForTimeout(150);} };
  await skip();
  await p.evaluate(()=>{ STAGES.forEach(s=>{if(s.ch<3)S.cleared[s.id]=1}); S.seen['pre:1-1']=1; S.oil=99; saveState(); go('story',{st:'1-3'}); }); await p.waitForTimeout(500); await skip();
  await p.click('[data-act=stgo]',{force:true}); await p.waitForTimeout(600); await skip();
  await p.waitForSelector('#bwrap:not([hidden]) .slot',{timeout:10000});
  await p.waitForTimeout(1500);
  // 準備: 味方0 のslot0=速度9で未設定、味方1 のslot0は敵スキルXと相互指定(X=速度3)
  const prep = await p.evaluate(()=>{
    const U=CURRENT_BATTLE, B=U.B; const A=B.alive('A')[0], Bb=B.alive('A')[1], E=B.alive('E').find(e=>e.slots.some(s=>s.skill));
    const X=E.slots.find(s=>s.skill); const sA=A.slots[0], sB=Bb.slots[0];
    for(const u of B.units) for(const s of u.slots){ s.tie=.9; if(s!==sA&&s!==sB&&s!==X) { s.spd=1; } }
    sA.spd=9; sB.spd=5; X.spd=3;
    B.setSkill(A,0,'s1'); B.setSkill(Bb,0,'s1');
    sX=X; X.target={u:Bb.id,s:0}; sB.target={u:E.id,s:X.i}; sA.target=null;
    U.renderIntents(); U.refreshSlots(); U.renderArrows();
    return {A:A.id,E:E.id,xi:X.i,sa:[A.id,0],bb:Bb.id};
  });
  await p.waitForTimeout(300);
  await p.screenshot({path:'steal_1_before.png'});
  const slot = await p.$(`.slot[data-u="${prep.A}"][data-i="0"]`), chip = await p.$(`.chip[data-e="${prep.E}"][data-s="${prep.xi}"]`);
  const sb = await slot.boundingBox(), cb = await chip.boundingBox();
  await p.mouse.move(sb.x+sb.width/2, sb.y+sb.height/2); await p.mouse.down();
  await p.mouse.move(sb.x+sb.width/2+20, sb.y-30, {steps:4}); await p.mouse.move(cb.x+cb.width/2, cb.y+cb.height/2, {steps:12}); await p.waitForTimeout(500);
  await p.screenshot({path:'steal_2_drag.png'});
  console.log('bubble:', await p.evaluate(()=>document.querySelector('#wrbub').innerText.replace(/\n/g,' / ')));
  console.log('chip tags:', await p.evaluate(()=>[...document.querySelectorAll('.chip')].map(c=>c.dataset.d+':'+c.dataset.dt).join(' | ')));
  await p.mouse.up(); await p.waitForTimeout(600);
  await p.screenshot({path:'steal_3_after.png'});
  console.log('toast:', await p.evaluate(()=>document.querySelector('#toast').innerText));
  console.log('pred A:', await p.evaluate(({A})=>{const B=CURRENT_BATTLE.B; const s=B.U(A).slots[0]; const r=B.predict(); return r.get(s).k+' / B:'+r.get(B.alive('A')[1].slots[0]).k;},prep));
  console.log('slot labels:', await p.evaluate(()=>[...document.querySelectorAll('.slot .to')].map(x=>x.textContent).join(' | ')));
  console.log('errors',JSON.stringify(errs.slice(0,6))); await b.close();
})();
