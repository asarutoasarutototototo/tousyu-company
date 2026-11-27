const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const W=+process.env.W||1280,H=+process.env.H||720;
  const p = await b.newPage({viewport:{width:W,height:H}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1000);
  const pre=process.env.PRE||'i';
  const shot=async(n,w=500)=>{await p.waitForTimeout(w);await p.screenshot({path:`${pre}_${n}.png`});};
  const waitResult=async(max=150000)=>{ const t0=Date.now(); while(Date.now()-t0<max){ if(await p.$('#result:not([hidden]) [data-r]')) return true; await p.waitForTimeout(500);} return false; };
  await p.click('[data-act=start]'); await p.waitForTimeout(400);
  await p.evaluate(()=>{S.cleared={'1-1':1,'1-2':1,'1-3':1};S.thread=20000;S.set.spd=4;saveState();go('home');});
  await shot('home2');
  // Lux
  await p.click('[data-act=go][data-to=lux]'); await shot('lux');
  await p.click('[data-act=luxgo][data-d=thread][data-i="0"]');
  await p.waitForSelector('#bwrap:not([hidden]) #stage'); await p.waitForTimeout(1800);
  if(!(await p.evaluate(()=>CURRENT_BATTLE.auto))) await p.click('[data-b=auto]'); const ok=await waitResult(); console.log('lux result',ok); await shot('lux_result');
  const btns=await p.$$('#result [data-r]'); await btns[btns.length-1].click(); await p.waitForTimeout(600);
  // Mirror
  await p.click('[data-act=back]'); await p.click('[data-act=go][data-to=mirror]'); await shot('mirror_intro');
  await p.click('[data-act=mstart]'); await shot('mirror_map');
  await p.click('[data-act=mnode]'); // first node
  await p.waitForSelector('#bwrap:not([hidden]) #stage',{timeout:8000}); await p.waitForTimeout(1800);
  if(!(await p.evaluate(()=>CURRENT_BATTLE.auto))) await p.click('[data-b=auto]'); const ok2=await waitResult(); console.log('mirror battle result',ok2); await shot('mirror_result');
  const b2=await p.$$('#result [data-r]'); await b2[0].click(); await p.waitForTimeout(800); await shot('mirror_gift');
  const gb=await p.$('#modal .gift'); if(gb){ await gb.click(); await p.waitForTimeout(800);} await shot('mirror_map2');
  // 事件/休息/商店を直接
  await p.evaluate(()=>{const r=S.mirror.run; mirrorEvent(r);}); await shot('m_event');
  await p.click('#modal [data-m="0"]'); await p.waitForTimeout(500);
  await p.evaluate(()=>{mirrorRest(S.mirror.run);}); await shot('m_rest');
  await p.click('#modal [data-m="heal"]'); await p.waitForTimeout(500);
  await p.evaluate(()=>{S.mirror.run.coin=300;mirrorShop(S.mirror.run);}); await shot('m_shop');
  await p.click('#modal [data-m="g0"]'); await p.waitForTimeout(300); await shot('m_shop2',200);
  await p.click('#modal [data-m="leave"]'); await p.waitForTimeout(500); await shot('mirror_map3');
  console.log('run', await p.evaluate(()=>JSON.stringify({step:S.mirror.run.step,floor:S.mirror.run.floor,gifts:S.mirror.run.gifts,coin:S.mirror.run.coin,hp:S.mirror.run.team.map(m=>+m.hpFrac.toFixed(2))})));
  console.log('errors:',errs.slice(0,10));
  await b.close();
})();
