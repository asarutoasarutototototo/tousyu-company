const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(500);
  await p.evaluate(`S.lv.rei=7; go('roster',{sid:'rei'}); ACT.rtab({t:'lv'}); document.querySelector('.lvtab').scrollIntoView()`); await p.waitForTimeout(600);
  await p.screenshot({path:'v12_lv2.png'});
  await p.setViewportSize({width:390,height:844}); await p.waitForTimeout(400);
  await p.evaluate(`document.querySelector('.lvtab').scrollIntoView()`); await p.screenshot({path:'v12_lv_m.png'});
  // engine rule checks
  const r = await p.evaluate(()=>{
    const B=buildBattle({team:[{sid:'rei',ik:'rei1',lv:10,sync:1}],supports:[],gifts:[],enemies:[{k:'moth',lv:1}]},{seed:3});
    const a=B.alive('A')[0], e=B.alive('E')[0];
    return {cp:B.clashPow(a,e), cp2:B.clashPow(e,a), dmgMult:1+9/(9+25)};
  });
  console.log(JSON.stringify(r),'errors',errs); await b.close();
})();
