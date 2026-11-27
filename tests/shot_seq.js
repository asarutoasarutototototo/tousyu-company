const { chromium } = require('playwright');
(async()=>{
  const [,, file, prefix, times, extra] = process.argv;
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/'+file+(extra||''));
  let last=0;
  for (const t of times.split(',').map(Number)) { await p.waitForTimeout(t-last); last=t; await p.screenshot({path:prefix+'_'+t+'.png'}); }
  console.log('errors:',errs.slice(0,8));
  await b.close();
})();
