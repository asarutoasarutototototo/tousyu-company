const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:400,height:800}, hasTouch:true, isMobile:true, deviceScaleFactor:2}); const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(900);
  await p.click('[data-act=start]'); await p.waitForTimeout(400);
  await p.evaluate(()=>{ runStage(STAGES.find(s=>s.id==='1-1')); });
  await p.waitForSelector('.slot',{timeout:20000}); await p.waitForTimeout(800);
  const n0 = await p.evaluate(()=>CURRENT_BATTLE.unsetSlots().length);
  await p.screenshot({path:'dm_pre.png'}); console.log(await p.evaluate(()=>({slots:document.querySelectorAll('.slot').length, chips:document.querySelectorAll('.chip').length, hidden:document.querySelector('#bwrap').hidden, dlg:!document.querySelector('#dialog').hidden}))); const slots = await p.$$('.slot'); const sb = await slots[0].boundingBox(); const chips = await p.$$('.chip'); const cb = await chips[0].boundingBox();
  const cdp = await ctx.newCDPSession(p);
  const pt=(x,y)=>[{x,y,id:1}];
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pt(sb.x+sb.width/2,sb.y+sb.height/2)});
  for (let i=1;i<=12;i++){ const t=i/12; await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pt(sb.x+sb.width/2+(cb.x+cb.width/2-sb.x-sb.width/2)*t, sb.y+sb.height/2+(cb.y+cb.height/2-sb.y-sb.height/2)*t)}); await p.waitForTimeout(30); }
  await p.screenshot({path:'dm_mid.png'});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await p.waitForTimeout(300);
  const n1 = await p.evaluate(()=>CURRENT_BATTLE.unsetSlots().length);
  console.log('unset', n0, '->', n1, 'errors', errs);
  await b.close();
})();
