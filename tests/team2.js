const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  const clickDialog=async()=>{ for(let i=0;i<8;i++){ if(await p.$('#dialog:not([hidden])')){ await p.click('#dialog .dbox'); await p.waitForTimeout(120); await p.click('#dialog .dbox').catch(()=>{}); await p.waitForTimeout(120);} } };
  await p.click('[data-act=start]'); await p.waitForTimeout(500);
  await p.evaluate(`S.team=['rei','kuro','ren','aka','rai','tetsu']`); await p.click('[data-act=go][data-to=story]'); await p.waitForTimeout(700); await clickDialog();
  await p.click('[data-act=stgo]'); await p.waitForTimeout(500); await clickDialog();
  await p.waitForSelector('#bwrap:not([hidden]) #stage'); await p.waitForTimeout(3000);
  await p.screenshot({path:'team2.png'});
  console.log('errors',errs.slice(0,5)); await b.close();
})();
