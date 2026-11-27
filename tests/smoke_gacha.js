const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1200);
  await p.click('[data-act=start]').catch(()=>{}); await p.waitForTimeout(300);
  await p.evaluate(()=>{S.shards=999999;saveState();go('gacha')});
  for(const n of [1,10,10]){
    const before=await p.evaluate(()=>[S.shards,Object.keys(S.owned).length]);
    await p.click(`[data-act=pull][data-n="${n}"]`);
    for(let i=0;i<40;i++){ await p.waitForTimeout(400); const sk=await p.$('.pskip'); if(sk) await sk.click({timeout:500}).catch(()=>{});
      const cl=await p.$('.pull [data-act],.pull button:not(.pskip)'); if(cl) await cl.click({timeout:500}).catch(()=>{});
      if(!(await p.$('.pull'))) break; }
    const left=!!(await p.$('.pull'));
    const after=await p.evaluate(()=>[S.shards,Object.keys(S.owned).length]);
    console.log('pull',n,'overlay left',left,'shards',before[0],'->',after[0],'owned',before[1],'->',after[1]);
    await p.evaluate(()=>{document.querySelectorAll('.pull').forEach(e=>e.remove());go('gacha')});
  }
  console.log('errors',JSON.stringify(errs.slice(0,8))); await b.close();
})();
