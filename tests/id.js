const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:900}}); const errs=[];
  p.on('pageerror',e=>errs.push(''+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(500);
  await p.evaluate(`S.seen.prologue=1; S.login={last:dayNo(),n:1}; S.idle={t:Date.now()-9*3600000}; STAGES.filter(s=>s.ch<=3).forEach(s=>S.cleared[s.id]=1); saveState(); go('home')`); await p.waitForTimeout(800);
  await p.screenshot({path:'id_home.png'});
  await p.evaluate(`go('idle')`); await p.waitForTimeout(500); await p.screenshot({path:'id_idle.png'});
  const t0=await p.evaluate('S.thread+","+S.shards+","+Object.keys(gearState().items).length');
  await p.click('[data-act=idleclaim]'); await p.waitForTimeout(500);
  console.log('before',t0,'after',await p.evaluate('S.thread+","+S.shards+","+Object.keys(gearState().items).length'));
  await p.click('[data-m=x]').catch(()=>{}); await p.waitForTimeout(400);
  // set effect
  const r=await p.evaluate(`(()=>{const g=gearState(); g.items={}; g.eq={}; const mk=(s,pre)=>{const it=gearMake(s,2); it.n=pre+GEAR_BASE[s][1]; return it.id}; const a=mk('w','燃える'),b=mk('a','燃える'),c=mk('c','静かな'); g.eq.rei={w:a,a:b,c:c}; const two=JSON.stringify(gearTotals('rei')); g.items[c].n='燃える'+GEAR_BASE.c[1]; return two+' | '+JSON.stringify(gearTotals('rei'))+' | '+JSON.stringify(gearSet('rei'))})()`);
  console.log(r);
  await p.evaluate(`GEAR_SID='rei'; go('gear')`); await p.waitForTimeout(600); await p.screenshot({path:'id_gear.png'});
  console.log('errors',errs); await b.close();
})();
