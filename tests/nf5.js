const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(''+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(600);
  await p.evaluate(`S.seen.prologue=1; S.bond={rei:150}; saveState(); go('roster')`); await p.waitForTimeout(600);
  await p.evaluate(`ROS_TAB='lv'; go('roster')`); await p.waitForTimeout(700);
  await p.evaluate(`document.querySelector('.bondbox')&&document.querySelector('.bondbox').scrollIntoView()`); await p.waitForTimeout(300);
  await p.screenshot({path:'nf5.png'}); console.log(errs); await b.close();
})();
