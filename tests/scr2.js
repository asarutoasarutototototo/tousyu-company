const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch();
  for (const [n,vw,vh] of [['pc',1280,720],['mob',844,390]]){
  const p = await b.newPage({viewport:{width:vw,height:vh}, hasTouch:n==='mob'});
  const errs=[]; p.on('pageerror',e=>errs.push(''+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.screenshot({path:`s2_${n}_title.png`});
  await p.click('[data-act=start]'); await p.waitForTimeout(600);
  await p.screenshot({path:`s2_${n}_home.png`});
  const navs = await p.$$eval('[data-act=go]',e=>e.map(x=>x.dataset.to));
  console.log(n,navs.join(','));
  for (const t of [...new Set(navs)]){ if(t==='story')continue; try{ await p.click(`[data-act=go][data-to=${t}]`); await p.waitForTimeout(600); await p.screenshot({path:`s2_${n}_${t}.png`}); const bk=await p.$('[data-act=back],[data-act=home]'); if(bk){await bk.click();await p.waitForTimeout(400);} else {await p.click('[data-act=start]').catch(()=>{});} }catch(e){console.log('fail',t,e.message.slice(0,80));} }
  console.log(n,'errs',errs);
  }
  await b.close();
})();
