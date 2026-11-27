const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(600);
  const r = await p.evaluate(()=>{
    const cv=document.createElement('canvas'); cv.width=1280; cv.height=720; const c=cv.getContext('2d');
    const list=Object.entries(SINNERS); 
    let t0=performance.now(); list.forEach(([k,s])=>drawSinner(c,s.look,k,100,600,.6,1,{t:0}));
    const bake=performance.now()-t0;
    const N=200; t0=performance.now();
    for(let i=0;i<N;i++){ c.clearRect(0,0,1280,720); list.slice(0,6).forEach(([k,s],j)=>drawSinner(c,s.look,k,150+j*150,600,.6,1,{t:i*.05, glow:i%3?0:1, pose:POSES.strike})); }
    const per=(performance.now()-t0)/N;
    t0=performance.now(); for(let i=0;i<N;i++){ c.clearRect(0,0,1280,720); list.slice(0,6).forEach(([k,s],j)=>drawSinner(c,s.look,k,150+j*150,600,.6,1,{t:i*.05, flash:.5, expr:'hurt'})); }
    const perF=(performance.now()-t0)/N;
    let mem=0; for(const k in SPR){ const s=SPR[k]; if(!s||!s.back) continue; [s.back,s.front,s.pauld,s.wp.main,s.wp.glow].forEach(x=>mem+=x.cv.width*x.cv.height*4); }
    return {bakeAll12ms:+bake.toFixed(0), perFrame6units:+per.toFixed(2), perFrameFlash:+perF.toFixed(2), spriteMB:+(mem/1048576).toFixed(1)};
  });
  console.log(r); await b.close();
})();
