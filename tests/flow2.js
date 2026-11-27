const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const W=+process.env.W||1280,H=+process.env.H||720;
  const p = await b.newPage({viewport:{width:W,height:H}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1000);
  const pre=process.env.PRE||'h';
  const shot=async(n,w=600)=>{await p.waitForTimeout(w);await p.screenshot({path:`${pre}_${n}.png`});};
  const clickDialog=async()=>{ for(let i=0;i<8;i++){ if(await p.$('#dialog:not([hidden])')){ await p.click('#dialog .dbox'); await p.waitForTimeout(120); await p.click('#dialog .dbox').catch(()=>{}); await p.waitForTimeout(150);} else break; } };
  const waitResult=async(max=120000)=>{ const t0=Date.now(); while(Date.now()-t0<max){ if(await p.$('#result:not([hidden]) [data-r]')) return true; await p.waitForTimeout(500);} return false; };
  await p.click('[data-act=start]'); await p.waitForTimeout(500);
  await p.click('[data-act=go][data-to=story]'); await p.waitForTimeout(900);
  await clickDialog(); await shot('story_after');
  await p.click('[data-act=stgo]'); await p.waitForTimeout(500); await clickDialog();
  await p.waitForSelector('#bwrap:not([hidden]) #stage'); await shot('battle_start',2200);
  await shot('battle_plan',1500);
  // 計画: 敵スキルチップを1つ選んで矢印を引く試験
  const chip=await p.$('.chip'); if(chip){ const a=await p.$('.slot'); if(a){await a.click(); await p.waitForTimeout(300); await shot('battle_menu',200);} }
  await p.keyboard.press('Escape');
  await p.click('[data-b=spd]'); await p.click('[data-b=spd]'); await p.click('[data-b=auto]');
  await shot('battle_auto',4000);
  const ok=await waitResult(); console.log('result shown:',ok); await shot('result',500);
  if(ok){ const btns=await p.$$('#result [data-r]'); console.log('buttons',btns.length); await btns[0].click(); await p.waitForTimeout(900); await shot('after_result',300); }
  console.log('S.cleared',await p.evaluate(()=>JSON.stringify(S.cleared)), 'thread',await p.evaluate(()=>S.thread),'oil',await p.evaluate(()=>S.oil));
  console.log('errors:',errs.slice(0,10));
  await b.close();
})();
