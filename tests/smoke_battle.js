const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_|Failed to load/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1200);
  await p.click('[data-act=start]').catch(()=>{}); await p.waitForTimeout(300);
  const skipDlg=async()=>{ for(let i=0;i<40;i++){ if(await p.$('#dialog:not([hidden])')){ await p.click('#dialog .dbox',{timeout:800,force:true}).catch(()=>{}); await p.waitForTimeout(350);} else if(i>3) break; else await p.waitForTimeout(150);} };
  await skipDlg();
  await p.evaluate(()=>{S.seen['pre:1-1']=1;S.oil=99;saveState();go('story',{st:'1-1'})}); await p.waitForTimeout(500); await skipDlg();
  await p.click('[data-act=stgo]',{force:true}); await p.waitForTimeout(600); await skipDlg();
  await p.waitForSelector('#bwrap:not([hidden])',{timeout:10000});
  let done=false;
  for(let i=0;i<90&&!done;i++){ await p.waitForTimeout(1000);
    done=await p.evaluate(()=>!!document.querySelector('#result [data-r]'));
    if(!done){ const bt=await p.$$('[data-b]'); const names=await Promise.all(bt.map(x=>x.getAttribute('data-b')));
      for(const k of ['auto','go','start','fight','next']){ const i2=names.indexOf(k); if(i2>=0) await bt[i2].click({timeout:800}).catch(()=>{}); } } }
  console.log('result shown',done, 'cleared 1-1:', await p.evaluate(()=>!!S.cleared['1-1']));
  console.log('errors',JSON.stringify(errs.slice(0,8))); await b.close();
})();
