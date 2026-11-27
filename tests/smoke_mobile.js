const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:390,height:780}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1200);
  await p.click('[data-act=start]').catch(()=>{}); await p.waitForTimeout(400);
  for(let i=0;i<30;i++){ if(await p.$('#dialog:not([hidden])')){ await p.click('#dialog .dbox',{force:true,timeout:800}).catch(()=>{}); await p.waitForTimeout(350);} else if(i>3)break; else await p.waitForTimeout(150); }
  const r=await p.evaluate(async()=>{ STAGES.forEach(s=>S.cleared[s.id]=1); const out=[]; for(const n of Object.keys(SCREENS)){ go(n); await new Promise(r=>setTimeout(r,150)); document.querySelectorAll('#dialog:not([hidden])').length&&(document.querySelector('#dialog').hidden=true);
      out.push(n+':'+(document.documentElement.scrollWidth-innerWidth)); } return out.join(' '); });
  console.log(r); console.log('errors',JSON.stringify(errs)); await b.close();
})();
