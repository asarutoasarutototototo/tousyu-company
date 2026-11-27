const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const W=+process.env.W||1280,H=+process.env.H||720;
  const p = await b.newPage({viewport:{width:W,height:H}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.screenshot({path:'t_title.png'});
  const clickDialog=async()=>{ for(let i=0;i<8;i++){ if(await p.$('#dialog:not([hidden])')){ await p.click('#dialog .dbox'); await p.waitForTimeout(120); await p.click('#dialog .dbox').catch(()=>{}); await p.waitForTimeout(120);} } };
  await p.click('[data-act=start]'); await p.waitForTimeout(700); await p.screenshot({path:'t_home.png'});
  await p.click('[data-act=go][data-to=story]'); await p.waitForTimeout(900); await clickDialog();
  await p.click('[data-act=stgo]'); await p.waitForTimeout(500); await clickDialog();
  await p.waitForSelector('#bwrap:not([hidden]) #stage'); await p.waitForTimeout(2600);
  await p.screenshot({path:'t_b0.png'});
  await p.click('[data-b=go]'); await p.waitForTimeout(500);
  if (await p.$('#qbox [data-q=auto]')) await p.click('#qbox [data-q=auto]');
  const N=+process.env.N||40;
  for (let i=0;i<N;i++){ await p.waitForTimeout(+process.env.DT||350); await p.screenshot({path:`ts_${String(i).padStart(2,'0')}.png`}); }
  console.log('errors:',errs.slice(0,10));
  await b.close();
})();
