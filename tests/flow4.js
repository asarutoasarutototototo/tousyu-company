const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(800);
  const shot=async(n,w=500)=>{await p.waitForTimeout(w);await p.screenshot({path:`j_${n}.png`});};
  await p.click('[data-act=start]'); await p.waitForTimeout(300);
  await p.evaluate(()=>{S.thread=5000;saveState();go('roster');});
  await p.click('[data-act=rlv]'); await p.waitForTimeout(300);
  console.log('lv ash', await p.evaluate(()=>S.lv.ash), 'thread', await p.evaluate(()=>S.thread));
  await p.click('[data-act=rtab][data-t=pass]'); await shot('roster_pass',300);
  await p.click('[data-act=rtab][data-t=st]'); await shot('roster_st',300);
  // settings
  await p.click('[data-act=settings]'); await shot('settings',200);
  await p.click('#modal [data-m=mute]'); await p.waitForTimeout(200); console.log('muted',await p.evaluate(()=>S.set.mute));
  await p.click('#modal [data-m=x]'); await p.waitForTimeout(200);
  // retreat flow
  await p.evaluate(()=>{go('story',{st:'1-1'});}); await p.waitForTimeout(500);
  for(let i=0;i<4;i++){ if(await p.$('#dialog:not([hidden])')){ await p.click('#dialog .dbox'); await p.waitForTimeout(150); await p.click('#dialog .dbox').catch(()=>{});} }
  const oil0=await p.evaluate(()=>S.oil);
  await p.click('[data-act=stgo]'); await p.waitForTimeout(400);
  for(let i=0;i<4;i++){ if(await p.$('#dialog:not([hidden])')){ await p.click('#dialog .dbox'); await p.waitForTimeout(150); await p.click('#dialog .dbox').catch(()=>{});} }
  await p.waitForSelector('#bwrap:not([hidden]) #stage'); await p.waitForTimeout(2500);
  await p.click('[data-b=quit]'); await shot('quit',300);
  await p.click('#qbox [data-q=yes]'); await p.waitForTimeout(1500); await shot('retreat',300);
  console.log('oil',oil0,'->',await p.evaluate(()=>S.oil));
  const rb=await p.$$('#result [data-r]'); console.log('retreat buttons',rb.length); await rb[rb.length-1].click(); await p.waitForTimeout(600);
  console.log('scr visible', await p.evaluate(()=>!$('#scr').hidden), 'CUR',await p.evaluate(()=>CUR));
  // mirror boss/floor transitions
  await p.evaluate(()=>{S.cleared['1-3']=1;mirrorStart();const r=S.mirror.run;r.step=4;saveState();go('mirror');}); await shot('mirror_boss_node',300);
  await p.evaluate(()=>{const r=S.mirror.run;r.team[2].hpFrac=0;mirrorAdvance(r,'boss');}); await shot('mirror_floor2',500);
  console.log('floor',await p.evaluate(()=>S.mirror.run.floor), 'cleared',await p.evaluate(()=>S.mirror.run.cleared));
  await p.evaluate(()=>{const r=S.mirror.run;r.floor=2;r.cleared=2;mirrorAdvance(r,'boss');}); await shot('mirror_end',500);
  await p.click('#modal [data-m=ok]'); await p.waitForTimeout(400);
  console.log('best',await p.evaluate(()=>S.mirror.best),'run',await p.evaluate(()=>S.mirror.run));
  // reset
  await p.click('[data-act=settings]'); await p.click('#modal [data-m=reset]'); await shot('reset_confirm',200);
  await p.click('#modal [data-m=yes]'); await p.waitForTimeout(500);
  console.log('after reset CUR',await p.evaluate(()=>CUR), 'cleared', await p.evaluate(()=>JSON.stringify(S.cleared)));
  console.log('errors:',errs.slice(0,10));
  await b.close();
})();
