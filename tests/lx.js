const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(''+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(500);
  await p.evaluate(`S.seen.prologue=1; S.login={last:dayNo(),n:1}; STAGES.filter(s=>s.ch<=12).forEach(s=>S.cleared[s.id]=1); saveState(); go('lux')`); await p.waitForTimeout(700);
  console.log(await p.evaluate(`[...document.querySelectorAll('.luxl, .lux-list, [class*=lux]')].slice(0,8).map(e=>e.className+' '+e.scrollHeight+'/'+e.clientHeight+' '+getComputedStyle(e).overflowY).join('\\n')`));
  await p.evaluate(`document.querySelectorAll('.luxl').forEach(e=>e.scrollTop=1e5)`); await p.waitForTimeout(300);
  await p.screenshot({path:'lx2.png'}); console.log(errs); await b.close();
})();
