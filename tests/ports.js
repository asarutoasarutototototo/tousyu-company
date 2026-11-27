const { chromium } = require('playwright');
(async()=>{
  const MODE=process.env.MODE||'bust', PW=+process.env.PW||420, PH=+process.env.PH||420, PER=+process.env.PER||4, KEYS=(process.env.KEYS||'').split(',').filter(Boolean);
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:PW*PER,height:PH*Math.ceil((KEYS.length||12)/PER)}, deviceScaleFactor:1});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(500);
  await p.evaluate(({MODE,PW,PH,PER,KEYS})=>{
    document.body.innerHTML=''; document.body.style.cssText='margin:0;background:#2a2438';
    let list = Object.entries(SINNERS); if (KEYS.length) list = list.filter(([k])=>KEYS.includes(k));
    list.forEach(([k,s],i)=>{ const cv = portrait(s.look,k,PW,PH,MODE); cv.style.cssText=`position:absolute;left:${(i%PER)*PW}px;top:${Math.floor(i/PER)*PH}px`; document.body.appendChild(cv); });
  },{MODE,PW,PH,PER,KEYS});
  await p.screenshot({path:process.env.OUT||'pt.png'}); console.log(errs.filter(e=>!/style/.test(e)));
  await b.close();
})();
