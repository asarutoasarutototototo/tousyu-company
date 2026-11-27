const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:800}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(600);
  await p.evaluate(`S.seen.prologue=1; S.cleared['1-1']=1; for(const k of SINNER_KEYS)S.lv[k]=12; S.oil=60; saveState(); go('story',{st:'1-1'})`); await p.waitForTimeout(600);
  console.log('disabled no ticket', await p.evaluate(`[...document.querySelectorAll('[data-act=sweep]')].map(b=>b.disabled)`));
  await p.evaluate(`go('lux')`); await p.waitForTimeout(700); await p.screenshot({path:'tk_lux.png'});
  console.log('rows', await p.evaluate(`LUX.find(d=>d.id==='ticket').rows.map(r=>r.r.tickets).join()`));
  // simulate ticket win via engine: grant directly through startLux result path
  await p.evaluate(`S.tickets=0; startLux('ticket',1)`); await p.waitForTimeout(2500);
  await p.evaluate(`const B=CURRENT_BATTLE.B; B.units.filter(u=>u.side==='E').forEach(u=>{u.hp=1}); `);
  await p.evaluate(`CURRENT_BATTLE.B.units.filter(u=>u.side==='A').forEach(u=>{u.mods=u.mods||{}})`);
  await p.close(); 
  const q = await b.newPage({viewport:{width:1280,height:800}}); await q.goto('file://'+process.cwd()+'/test_full.html'); await q.waitForTimeout(1200);
  await q.click('[data-act=start]',{force:true}); await q.waitForTimeout(500);
  await q.evaluate(`S.seen.prologue=1; S.cleared['1-1']=1; for(const k of SINNER_KEYS)S.lv[k]=12; S.oil=60; S.tickets=7; saveState(); go('story',{st:'1-1'})`); await q.waitForTimeout(600);
  await q.screenshot({path:'tk_story.png'});
  await q.click('[data-act=sweep][data-n="5"]'); await q.waitForTimeout(500);
  console.log('after sweep5', await q.evaluate('S.tickets+" oil "+S.oil+" clears "+S.clears'));
  await q.click('[data-m=x]'); await q.waitForTimeout(300);
  console.log('disabled now', await q.evaluate(`[...document.querySelectorAll('[data-act=sweep]')].map(b=>b.disabled)`));
  console.log('errors',errs.slice(0,6)); await b.close();
})();
