const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:800}});
  const errs=[]; p.on('pageerror',e=>errs.push(''+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(600);
  await p.evaluate(`S.seen.prologue=1; S.shards=500; S.oil=0; saveState(); go('shop')`); await p.waitForTimeout(500);
  for(let i=0;i<6;i++){ await p.click('[data-act=shopbuy][data-id=oil]'); await p.waitForTimeout(250); }
  console.log(await p.evaluate('S.oil+" "+S.shards'), await p.evaluate(`document.querySelector('[data-id=oil]').closest('.mrow').innerText.replace(/\\n/g,' ')`), errs); await b.close();
})();
