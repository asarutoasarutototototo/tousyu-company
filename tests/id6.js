const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(500);
  await p.evaluate(`['rei','kuro','ren','aka','rai','tetsu','nagi'].forEach(s=>[1,2,3,4,5,6].forEach(t=>{S.owned[s+t]=1+(t%3)})); S.owned.kuro6=0; delete S.owned.kuro6; S.shards=5000; saveState();`);
  await p.evaluate(`go('roster',{sid:'rai'})`); await p.waitForTimeout(600);
  await p.evaluate(`ACT.ridn({ik:'rai5'})`); await p.waitForTimeout(600);
  await p.screenshot({path:'id6_ros.png'});
  await p.evaluate(`ACT.rtab({t:'pass'})`); await p.waitForTimeout(400); await p.screenshot({path:'id6_pass.png'});
  await p.evaluate(`go('gacha')`); await p.waitForTimeout(500);
  const r = await p.evaluate(`(()=>{const o=pullMany(10);return o.map(x=>x.ik+':'+x.tier).join(' ')})()`);
  console.log(r);
  await p.evaluate(`go('roster',{sid:'kuro'})`); await p.waitForTimeout(500);
  await p.setViewportSize({width:390,height:844}); await p.waitForTimeout(400); await p.screenshot({path:'id6_mob.png',fullPage:true});
  console.log('errors',errs); await b.close();
})();
