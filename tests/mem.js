const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(600);
  console.log(await p.evaluate(()=>{ const cv=document.createElement('canvas'),c=cv.getContext('2d'); const [k,s]=Object.entries(SINNERS)[0]; drawSinner(c,s.look,k,0,0,1,1,{t:0}); const sp=SPR[k]; const o={}; for(const n of ['back','front','pauld']) o[n]=[sp[n].cv.width,sp[n].cv.height]; o.wm=[sp.wp.main.cv.width,sp.wp.main.cv.height]; o.keys=Object.keys(SPR).length; return JSON.stringify(o); }));
  await b.close();
})();
