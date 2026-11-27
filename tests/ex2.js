const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); 
  for (const [n,w,h] of [['pc',1280,720],['mob',420,860]]) {
  const p = await b.newPage({viewport:{width:w,height:h}});
  const errs=[]; p.on('pageerror',e=>errs.push(''+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]'); await p.waitForTimeout(600);
  await p.screenshot({path:`x_${n}_home.png`});
  await p.click('[data-act=go][data-to=mission]'); await p.waitForTimeout(500);
  await p.click('[data-act=lclaim]'); await p.waitForTimeout(300);
  await p.screenshot({path:`x_${n}_mis.png`, fullPage:false});
  await p.click('[data-act=back]'); await p.waitForTimeout(400);
  await p.click('[data-act=go][data-to=gallery]'); await p.waitForTimeout(500);
  await p.click('[data-act=gplay][data-i="2"]'); await p.waitForTimeout(700);
  await p.screenshot({path:`x_${n}_gal.png`});
  await p.click('[data-act=gtab][data-sid=rei]'); await p.waitForTimeout(400); await p.click('[data-act=gfr][data-id=f_shout]'); await p.waitForTimeout(300);
  await p.screenshot({path:`x_${n}_gal2.png`});
  console.log(n,errs, await p.evaluate('JSON.stringify(S.ex)'));
  }
  await b.close();
})();
