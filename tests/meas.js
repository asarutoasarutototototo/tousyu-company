const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(700);
  const r = await p.evaluate(()=>{
    const out={};
    for (const art of Object.keys(ART)) {
      const cv=document.createElement('canvas'); cv.width=900; cv.height=1000; const c=cv.getContext('2d');
      let top=1e9, l=1e9, rr=-1e9, bot=-1e9;
      for (const t of [0,.8,1.6,2.4]) { c.clearRect(0,0,900,1000); drawEnemy(c,{art,boss:false},450,800,1,-1,{t}); const d=c.getImageData(0,0,900,1000).data;
        for(let y=0;y<1000;y++){for(let x=0;x<900;x++){ if(d[(y*900+x)*4+3]>40){ if(y<top)top=y; if(y>bot)bot=y; if(x<l)l=x; if(x>rr)rr=x; } }} }
      out[art]={h:800-top, below:bot-800, w:rr-l, left:450-l, right:rr-450};
    }
    return out;
  });
  console.log(JSON.stringify(r)); await b.close();
})();
