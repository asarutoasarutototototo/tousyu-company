// BattleView.render の内訳計測
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:1280,height:720}}); const p = await ctx.newPage();
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1200);
  await p.click('[data-act=start]').catch(()=>{}); await p.waitForTimeout(300);
  const skip=async()=>{ for(let i=0;i<40;i++){ if(await p.$('#dialog:not([hidden])')){ await p.click('#dialog .dbox',{timeout:800,force:true}).catch(()=>{}); await p.waitForTimeout(300);} else if(i>3) break; else await p.waitForTimeout(150);} };
  await skip();
  await p.evaluate(()=>{ STAGES.forEach(s=>{if(s.ch<3)S.cleared[s.id]=1}); S.seen['pre:1-1']=1; S.oil=99; saveState(); go('story',{st:'1-3'}); }); await p.waitForTimeout(500); await skip();
  await p.click('[data-act=stgo]',{force:true}); await p.waitForTimeout(600); await skip();
  await p.waitForSelector('#bwrap:not([hidden]) .slot',{timeout:10000}); await p.waitForTimeout(1500);
  const r = await p.evaluate(async()=>{
    const V=CURRENT_BATTLE.view, P=BattleViewDraw.prototype, T={};
    const wrapM=(obj,name,label)=>{ const f=obj[name]; if(!f) return; obj[name]=function(...a){ const t0=performance.now(); try{return f.apply(this,a);} finally{ const d=performance.now()-t0; const r=T[label]||(T[label]={n:0,s:0}); r.n++; r.s+=d; } }; };
    wrapM(V,'drawUnits','drawUnits'); wrapM(V,'drawFx','drawFx'); wrapM(V,'drawPlates','drawPlates'); wrapM(V,'drawOverlay','drawOverlay'); wrapM(V,'update','update'); wrapM(V,'render','render');
    wrapM(V.bg,'draw','bg.draw'); wrapM(V.bg,'front','bg.front');
    const fe=window.finishFx; window.finishFx=function(...a){ const t0=performance.now(); try{return fe.apply(this,a);}finally{ const d=performance.now()-t0; const r=T.finishFx||(T.finishFx={n:0,s:0}); r.n++; r.s+=d; } };
    await new Promise(r=>setTimeout(r,3000));
    return Object.fromEntries(Object.entries(T).map(([k,v])=>[k,+(v.s/v.n).toFixed(2)+'ms x'+v.n]));
  });
  console.log(JSON.stringify(r,null,1)); await b.close();
})();
