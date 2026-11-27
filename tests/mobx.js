const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:390,height:800},deviceScaleFactor:1,hasTouch:true,isMobile:true});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}).catch(()=>{}); await p.waitForTimeout(400);
  await p.evaluate(`go('roster',{sid:'nagi'})`); await p.waitForTimeout(700); await p.screenshot({path:'mob_ros.png',fullPage:true});
  const ow=await p.evaluate('document.documentElement.scrollWidth'); console.log('scrollW',ow,'errs',errs);
  await b.close();
})();
