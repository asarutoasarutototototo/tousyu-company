const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(500);
  await p.evaluate(`go('roster')`); await p.waitForTimeout(800);
  for (const sid of ['rei','nagi']) {
    await p.evaluate(`go('roster',{sid:'${sid}'})`); await p.waitForTimeout(500);
    await p.screenshot({path:`ros_${sid}.png`, fullPage:true});
  }
  await p.evaluate(`ACT.rtab({t:'pass'})`); await p.waitForTimeout(400); await p.screenshot({path:'ros_pass.png', fullPage:true});
  console.log('errors',errs); await b.close();
})();
