const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:800}});
  const errs=[]; p.on('pageerror',e=>errs.push(''+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(600);
  await p.evaluate(`S.seen.prologue=1; S.login={last:dayNo(),n:1}; for(const k of SINNER_KEYS)S.lv[k]=30; S.cleared['1-5']=1; S.oil=90; saveState(); startTrial(0)`);
  await p.waitForTimeout(2500);
  await p.evaluate(`CURRENT_BATTLE.B.turnLimit=1; const e=CURRENT_BATTLE.B.units.find(u=>u.side==='E'); e.hp=Math.round(e.maxHp*.5)`);
  for(let i=0;i<10;i++){ if(await p.$('.rbox')) break; await p.evaluate(`document.querySelector('[data-b=go]')&&document.querySelector('[data-b=go]').click()`); await p.waitForTimeout(400); const q=await p.$('[data-q=auto]'); if(q) await q.click({force:true}).catch(()=>{}); await p.waitForTimeout(5000); }
  await p.waitForTimeout(500); await p.screenshot({path:'nf6.png'});
  console.log(await p.evaluate(`JSON.stringify(S.trial)+' bond '+JSON.stringify(S.bond)+' sh '+S.shards+' th '+S.thread+' tk '+S.tickets`), errs); await b.close();
})();
