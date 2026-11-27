const { chromium } = require('playwright');
(async()=>{
  const [,, file, out, w, h, extra] = process.argv;
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:+w||1800,height:+h||1000}});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/'+file+(extra||''));
  await p.waitForTimeout(+process.env.WAIT||800);
  await p.screenshot({path:out});
  console.log('errors:',errs.slice(0,8));
  await b.close();
})();
