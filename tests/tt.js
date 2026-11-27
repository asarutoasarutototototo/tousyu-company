const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  const errs=[]; p.on('pageerror',e=>errs.push(''+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]'); await p.waitForTimeout(500);
  await p.click('[data-act=go][data-to=tower]'); await p.waitForTimeout(600); await p.screenshot({path:'tt_tower.png'});
  await p.click('[data-act=tgo]'); await p.waitForTimeout(3500); await p.screenshot({path:'tt_tower_b.png'});
  console.log('after tower',errs);
  await p.reload(); await p.waitForTimeout(1500);
  await p.click('[data-act=start]'); await p.waitForTimeout(500);
  await p.click('[data-act=go][data-to=train]'); await p.waitForTimeout(500);
  await p.click('[data-act=trk][data-k=gatekeeper]').catch(()=>{}); await p.waitForTimeout(300); await p.screenshot({path:'tt_train.png'});
  await p.click('[data-act=trgo]'); await p.waitForTimeout(3500); await p.screenshot({path:'tt_train_b.png'});
  console.log('after train',errs); await b.close();
})();
