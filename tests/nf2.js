const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:390,height:800},isMobile:true,hasTouch:true});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(600);
  await p.evaluate(`S.cleared['1-1']=1;S.cleared['1-2']=1;S.owned['rei2']=1;saveState();
   const B=buildBattle({team:teamSpec(),supports:[],gifts:['g_amulet'],enemies:[{k:'moth',lv:1}]}); B.units.filter(u=>u.side==='E').forEach(u=>u.alive=false); dexRecord(B,{battle:{gifts:['g_amulet']}}); go('codex')`);
  await p.waitForTimeout(900); await p.screenshot({path:'nf_m1.png'});
  console.log(await p.evaluate(`JSON.stringify(dexStats())`), await p.evaluate(`document.documentElement.scrollWidth`));
  await p.click('[data-act=dtab][data-t=id]'); await p.waitForTimeout(800); await p.screenshot({path:'nf_m2.png'});
  await p.evaluate(`go('form')`); await p.waitForTimeout(500); console.log('formW', await p.evaluate(`document.documentElement.scrollWidth`));
  await p.evaluate(`go('story',{st:'1-1'})`); await p.waitForTimeout(500); console.log('storyW', await p.evaluate(`document.documentElement.scrollWidth`));
  console.log('errors',errs.slice(0,6)); await b.close();
})();
