const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const W=+process.env.W||1280,H=+process.env.H||720;
  const p = await b.newPage({viewport:{width:W,height:H}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(900);
  await p.click('[data-act=start]'); await p.waitForTimeout(400);
  const stage = process.env.STAGE||'1-5';
  await p.evaluate((id)=>{ const st=STAGES.find(s=>s.id===id); runStage(st); }, stage);
  await p.waitForSelector('#bwrap:not([hidden]) #stage'); await p.waitForTimeout(2600);
  await p.screenshot({path:'mo_plan.png'});
  await p.click('[data-b=go]'); await p.waitForTimeout(400); if (await p.$('#qbox')) await p.click('#qbox [data-q=auto]');
  const N=+process.env.N||26;
  for (let i=0;i<N;i++){ await p.waitForTimeout(+process.env.DT||420); await p.screenshot({path:`mo_${String(i).padStart(2,'0')}.png`}); }
  console.log('errors:',errs.slice(0,10));
  await b.close();
})();
