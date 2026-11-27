const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const W=+process.env.W||400,H=+process.env.H||800;
  const ctx = await b.newContext({viewport:{width:W,height:H},hasTouch:true,isMobile:true,deviceScaleFactor:1});
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1000);
  const pre=process.env.PRE||'m';
  const shot=async(n,w=600)=>{await p.waitForTimeout(w);await p.screenshot({path:`${pre}_${n}.png`});};
  const ovf=async(n)=>{const r=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,wrapw:(document.querySelector('#scr')||{}).scrollWidth,scrcw:(document.querySelector('#scr')||{}).clientWidth}));console.log(n,JSON.stringify(r));};
  await shot('title'); await ovf('title');
  await p.tap('[data-act=start]'); await shot('home'); await ovf('home');
  await p.tap('[data-act=go][data-to=story]'); await p.waitForTimeout(500); 
  for(let i=0;i<4;i++){ if(await p.$('#dialog:not([hidden])')){ await p.tap('#dialog .dbox'); await p.waitForTimeout(150); await p.tap('#dialog .dbox').catch(()=>{});} }
  await shot('story'); await ovf('story');
  await p.tap('[data-act=back]'); await p.tap('[data-act=go][data-to=form]'); await shot('form'); await ovf('form');
  await p.tap('[data-act=back]'); await p.tap('[data-act=go][data-to=roster]'); await shot('roster'); await ovf('roster');
  await p.tap('[data-act=back]'); await p.tap('[data-act=go][data-to=gacha]'); await shot('gacha'); await ovf('gacha');
  await p.tap('[data-act=pull][data-n="10"]'); await p.waitForTimeout(4200); await shot('reveal',100);
  await p.tap('[data-act=gok]'); await p.waitForTimeout(300);
  await p.evaluate(()=>{S.cleared={'1-1':1,'1-2':1,'1-3':1};saveState();go('mirror');}); await p.tap('[data-act=mstart]'); await shot('mirror'); await ovf('mirror');
  await p.evaluate(()=>{go('lux');}); await shot('lux'); await ovf('lux');
  await p.evaluate(()=>{showHelp();}); await shot('help',200);
  await p.evaluate(()=>{closeModal();go('home');});
  await p.evaluate(()=>{S.mirror.run=null;go('story',{st:'1-1'});}); await p.waitForTimeout(300);
  await p.tap('[data-act=stgo]'); await p.waitForTimeout(500);
  for(let i=0;i<4;i++){ if(await p.$('#dialog:not([hidden])')){ await p.tap('#dialog .dbox'); await p.waitForTimeout(150); await p.tap('#dialog .dbox').catch(()=>{});} }
  await p.waitForSelector('#bwrap:not([hidden]) #stage'); await shot('battle',3500);
  console.log('errors:',errs.slice(0,10));
  await b.close();
})();
