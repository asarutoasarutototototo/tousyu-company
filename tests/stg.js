const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(900);
  await p.click('[data-act=start]'); await p.waitForTimeout(400);
  await p.evaluate(()=>{ runStage(STAGES.find(s=>s.id==='1-5')); });
  await p.waitForSelector('#bwrap:not([hidden]) #stage'); await p.waitForTimeout(2400);
  await p.evaluate(()=>{ const B=CURRENT_BATTLE.B, V=CURRENT_BATTLE.view; B.side('E').forEach((e,i)=>{ e.hp = e.boss ? Math.ceil(e.maxHp*.68) : (i===1? 12 : e.hp); const v=V.vus[e.id]; v.hpv=v.hpg=e.hp; V.sync1(v,B.snap(e)); }); B.side('A').forEach((u,i)=>{ if(i===2){ u.hp=Math.ceil(u.maxHp*.34); const v=V.vus[u.id]; v.hpv=v.hpg=u.hp; V.sync1(v,B.snap(u)); } }); });
  await p.waitForTimeout(500); await p.screenshot({path:'st_plan.png'});
  await p.click('[data-b=go]'); await p.waitForTimeout(400); if (await p.$('#qbox')) await p.click('#qbox [data-q=auto]');
  await p.click('[data-b=spd]');
  for (let i=0;i<40;i++){ await p.waitForTimeout(260); await p.screenshot({path:`sg_${String(i).padStart(2,'0')}.png`}); }
  console.log('errors:',errs.slice(0,10)); await b.close();
})();
