const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const errs=[];
  for (const vp of [{width:1280,height:900},{width:390,height:800}]) {
    const p = await b.newPage({viewport:vp}); p.on('pageerror',e=>errs.push(''+e));
    await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1200);
    await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(500);
    await p.evaluate(`S.seen.prologue=1; S.login={last:dayNo(),n:1}; S.rec={b:12,w:9,l:3,turns:61,dmg:48210,maxDmg:5400,stag:14,cw:33,hardW:1,sort:{rei:12,kuro:9,ren:4}}; S.hard={'1-1':1}; for(let i=0;i<25;i++)gearDrop({lv:80,hard:true,boss:true}); saveState(); go('record')`); await p.waitForTimeout(600);
    if(vp.width<500) await p.screenshot({path:'rc_m.png'}); else await p.screenshot({path:'rc_d.png'});
    for (const sc of ['record','gear','home','story']) { await p.evaluate(`go('${sc}')`); await p.waitForTimeout(500); const w=await p.evaluate('document.documentElement.scrollWidth-innerWidth'); console.log(vp.width, sc, 'overflowX', w); }
    await p.evaluate(`go('gear')`); await p.waitForTimeout(500); if(vp.width<500) await p.screenshot({path:'gm.png'});
    await p.close();
  }
  console.log(errs); await b.close();
})();
