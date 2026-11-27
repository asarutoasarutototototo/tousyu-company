const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(500);
  await p.evaluate(`S.seen.prologue=1; S.login={last:dayNo(),n:1}; S.thread=500000; STAGES.filter(s=>s.ch<=3).forEach(s=>S.cleared[s.id]=1); for(let i=0;i<30;i++)gearDrop({lv:60,hard:true,boss:true}); saveState(); go('home')`); await p.waitForTimeout(700);
  console.log('gear count', await p.evaluate('Object.keys(S.gear.items).length'));
  await p.evaluate(`go('gear')`); await p.waitForTimeout(700); await p.screenshot({path:'g1.png'});
  await p.click('.gl [data-act=gitem]'); await p.waitForTimeout(300); await p.screenshot({path:'g2.png'});
  await p.click('[data-m=eq]'); await p.waitForTimeout(400);
  await p.click('.gl [data-act=gitem] >> nth=3'); await p.waitForTimeout(300);
  await p.click('[data-m=up]').catch(()=>{}); await p.waitForTimeout(300); await p.click('[data-m=x]').catch(()=>{}); await p.waitForTimeout(200);
  await p.click('[data-act=gbest]'); await p.waitForTimeout(400);
  console.log('eq', await p.evaluate('JSON.stringify(gearTotals(GEAR_SID))'));
  await p.click('[data-act=gbulk]'); await p.waitForTimeout(300); await p.click('[data-m=ok]').catch(()=>{}); await p.waitForTimeout(400);
  console.log('after bulk', await p.evaluate('Object.keys(S.gear.items).length'));
  await p.screenshot({path:'g3.png'});
  // team spec gear
  console.log('teamSpec gm', await p.evaluate('JSON.stringify(teamSpec().find(t=>t.sid===GEAR_SID).gm)'));
  // hard mode
  await p.evaluate(`go('story',{st:'1-2'})`); await p.waitForTimeout(600);
  await p.click('[data-act=hardsw][data-h="1"]'); await p.waitForTimeout(500); await p.screenshot({path:'g4.png'});
  await p.evaluate(`SINNER_KEYS.forEach(k=>S.lv[k]=40); S.set.spd=3; saveState()`);
  await p.click('[data-act=stgo]'); await p.waitForTimeout(1500);
  await p.click('[data-b=auto]').catch(()=>{}); await p.click('[data-b=spd]').catch(()=>{}); await p.click('[data-b=spd]').catch(()=>{});
  console.log('battle enemies', await p.evaluate('CURRENT_BATTLE && CURRENT_BATTLE.B ? CURRENT_BATTLE.B.side("E").map(e=>"Lv"+e.lv+" hp"+e.maxHp).join(",") : "none"'));
  for(let i=0;i<150;i++){ await p.waitForTimeout(1000); if(await p.evaluate('!!document.querySelector("#result:not([hidden])")')) break; }
  console.log('result', (await p.evaluate('document.querySelector("#result")?.innerText||""')).replace(/\n+/g,' | ').slice(0,300));
  console.log('hard flags', await p.evaluate('JSON.stringify(S.hard)+" gear "+Object.keys(S.gear.items).length'));
  await p.screenshot({path:'g5.png'});
  await p.evaluate(`go('record')`); await p.waitForTimeout(600); await p.screenshot({path:'g6.png'});
  await p.evaluate(`go('home')`); await p.waitForTimeout(500); await p.screenshot({path:'g7.png'});
  console.log('errors',errs.slice(0,6)); await b.close();
})();
