const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(700);
  const r = await p.evaluate(()=>{
    const cv=document.createElement('canvas'); cv.width=900; cv.height=1600; const c=cv.getContext('2d'); const out={};
    for (const art of ['puppet','moth']) { let top=1e9;
      for (const boss of [false,true]) for (const t of [0,1,2]) { c.clearRect(0,0,900,1600); drawEnemy(c,{art,boss},450,1400,1,-1,{t}); const d=c.getImageData(0,0,900,1600).data;
        for(let y=0;y<1600;y++){let f=0;for(let x=0;x<900;x++){ if(d[(y*900+x)*4+3]>40){f=1;break;} } if(f){ if(y<top)top=y; break; } } }
      out[art]=1400-top; }
    return out; });
  console.log(JSON.stringify(r)); await b.close();
})();
