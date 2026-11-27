const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  const errs=[]; p.on('pageerror',e=>errs.push(''+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  const cd=async()=>{ for(let i=0;i<8;i++){ if(await p.$('#dialog:not([hidden])')){ await p.click('#dialog .dbox'); await p.waitForTimeout(120); await p.click('#dialog .dbox').catch(()=>{}); await p.waitForTimeout(120);} } };
  await p.click('[data-act=start]'); await p.waitForTimeout(500);
  await p.click('[data-act=go][data-to=story]'); await p.waitForTimeout(700); await cd();
  await p.click('[data-act=stgo]'); await p.waitForTimeout(500); await cd();
  await p.waitForSelector('#bwrap:not([hidden]) #stage'); await p.waitForTimeout(2000);
  for (const [n,js] of [['n',''],['low','v.vus[0].d.sp=-25;v.vus[1].d.sp=-25;v.vus[0].spv=-25;v.vus[1].spv=-25'],['pan','v.vus[0].d.panic=1;v.vus[1].d.panic=1']]){
    await p.evaluate(`(function(){const v=CURRENT_BATTLE.view;${js}})()`); await p.waitForTimeout(600);
    await p.screenshot({path:`ex_${n}.png`, clip:{x:0,y:560,width:520,height:160}});
  }
  console.log(errs); await b.close();
})();
