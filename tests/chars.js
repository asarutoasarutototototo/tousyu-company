const { chromium } = require('playwright');
(async()=>{
  const W=+process.env.W||1700, H=+process.env.H||1000, SC=+process.env.SC||0.7, PER=+process.env.PER||6, KEYS=(process.env.KEYS||'').split(',').filter(Boolean);
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:W,height:H}, deviceScaleFactor:+process.env.DPR||1});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE '+m.text()); });
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(600);
  const res = await p.evaluate(({W,H,SC,PER,KEYS,EXPR,POSE})=>{
    document.body.innerHTML=''; document.body.style.background='#2a2438';
    let list = Object.entries(SINNERS); if (KEYS.length) list = list.filter(([k])=>KEYS.includes(k));
    const cv = document.createElement('canvas'); cv.width=W; cv.height=H; document.body.appendChild(cv); cv.style.cssText='position:fixed;left:0;top:0';
    const c = cv.getContext('2d'); c.fillStyle='#2a2438'; c.fillRect(0,0,W,H);
    const rows = Math.ceil(list.length/PER), t0 = performance.now();
    list.forEach(([k,s],i)=>{ const cw=W/Math.min(PER,list.length); const x = cw*(i%PER)+cw/2-20, y = (H/rows)*(Math.floor(i/PER)+1)-12; const st={t:0, expr:EXPR||'n'}; if (POSE) st.pose=POSES[POSE]; drawSinner(c, s.look, k, x, y, SC, 1, st); });
    return {names:list.map(a=>a[0]).join(','), ms: Math.round(performance.now()-t0)};
  }, {W,H,SC,PER,KEYS,EXPR:process.env.EXPR,POSE:process.env.POSE});
  await p.screenshot({path:process.env.OUT||'ch_after.png'}); console.log(JSON.stringify(res), errs.filter(e=>!/reading 'style'/.test(e)));
  await b.close();
})();
