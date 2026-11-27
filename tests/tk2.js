const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:800}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(600);
  await p.evaluate(`S.seen.prologue=1; S.cleared['1-2']=1; for(const k of SINNER_KEYS)S.lv[k]=30; S.oil=60; S.tickets=0; saveState(); startLux('ticket',2)`);
  await p.waitForTimeout(2500);
  for(let i=0;i<30;i++){ if(await p.$('.rbox')) break; await p.evaluate(`document.querySelector('[data-b=go]')&&document.querySelector('[data-b=go]').click()`); await p.waitForTimeout(400); const q=await p.$('[data-q=auto]'); if(q) await q.click({force:true}).catch(()=>{}); await p.waitForTimeout(6000); }
  await p.waitForTimeout(500); await p.screenshot({path:'tk_win.png'});
  console.log('tickets', await p.evaluate('S.tickets'), errs); await b.close();
})();
