const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  const errs=[]; p.on('pageerror',e=>errs.push(''+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  const cd=async()=>{ for(let i=0;i<8;i++){ if(await p.$('#dialog:not([hidden])')){ await p.click('#dialog .dbox'); await p.waitForTimeout(120); await p.click('#dialog .dbox').catch(()=>{}); await p.waitForTimeout(120);} } };
  await p.click('[data-act=start]'); await p.waitForTimeout(500);
  await p.click('[data-act=go][data-to=story]'); await p.waitForTimeout(700); await cd();
  await p.click('[data-act=stgo]'); await p.waitForTimeout(500); await cd();
  await p.waitForSelector('#bwrap:not([hidden]) #stage'); await p.waitForTimeout(1500);
  await p.click('[data-b=go]'); await p.waitForTimeout(500); if (await p.$('#qbox [data-q=auto]')) await p.click('#qbox [data-q=auto]');
  let got=0, i=0;
  for(let t=0;t<400 && got<14;t++){
    const st = await p.evaluate(`(function(){const v=CURRENT_BATTLE.view; const u=v.clashUI; return u&&u.A&&u.A.flips? Math.round(u.A.rev*100):-1})()`);
    if(st>=0){ await p.screenshot({path:`coin_${String(got).padStart(2,'0')}.png`, clip:{x:0,y:0,width:700,height:260}}); got++; } else await p.waitForTimeout(40);
  }
  console.log('frames',got,errs); await b.close();
})();
