const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const W=+process.env.W||1280,H=+process.env.H||720;
  const p = await b.newPage({viewport:{width:W,height:H}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(900);
  const clickDialog=async()=>{ for(let i=0;i<8;i++){ if(await p.$('#dialog:not([hidden])')){ await p.click('#dialog .dbox'); await p.waitForTimeout(120); await p.click('#dialog .dbox').catch(()=>{}); await p.waitForTimeout(150);} else break; } };
  await p.click('[data-act=start]'); await p.waitForTimeout(500);
  await p.click('[data-act=go][data-to=story]'); await p.waitForTimeout(900); await clickDialog();
  await p.click('[data-act=stgo]'); await p.waitForTimeout(500); await clickDialog();
  await p.waitForSelector('#bwrap:not([hidden]) #stage'); await p.waitForTimeout(2600);
  console.log('unset before', await p.evaluate(()=>CURRENT_BATTLE.unsetSlots().length));
  // drag slot -> enemy chip
  const drag = async (si, sel, idx=0, shot) => {
    const slots = await p.$$('.slot'); const s = slots[si]; const sb = await s.boundingBox();
    const tg = (await p.$$(sel))[idx]; const tb = await tg.boundingBox();
    await p.mouse.move(sb.x+sb.width/2, sb.y+sb.height/2); await p.mouse.down(); await p.mouse.move(sb.x+sb.width/2+30, sb.y-60, {steps:6});
    await p.mouse.move(tb.x+tb.width/2, tb.y+tb.height/2, {steps:14});
    if (shot) { await p.waitForTimeout(250); await p.screenshot({path:shot}); }
    await p.mouse.up(); await p.waitForTimeout(250);
  };
  await drag(0, '.chip', 0, 'b_drag.png');
  await drag(3, '.hot', 1);
  await drag(5, '.chip', 1);
  console.log('unset after 3 drags', await p.evaluate(()=>CURRENT_BATTLE.unsetSlots().length));
  await p.screenshot({path:'b_set.png'});
  // start with unset -> modal
  await p.click('[data-b=go]'); await p.waitForTimeout(500); await p.screenshot({path:'b_modal.png'});
  console.log('modal', !!(await p.$('#qbox')));
  await p.click('#qbox [data-q=auto]'); 
  for (let i=0;i<24;i++){ await p.waitForTimeout(450); await p.screenshot({path:`bs_${String(i).padStart(2,'0')}.png`}); }
  console.log('errors:',errs.slice(0,10));
  await b.close();
})();
