// ドラッグ中のフレーム間隔を、CSS要素を外しながら比較
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
  const css = async(txt)=>p.evaluate((txt)=>{ let s=document.getElementById('xv'); if(!s){ s=document.createElement('style'); s.id='xv'; document.head.appendChild(s);} s.textContent=txt; },txt);
  const run = async(label)=>{
    await p.evaluate(()=>{ window.__fr=[]; let last=performance.now(); window.__stop=false; const loop=ts=>{ window.__fr.push(ts-last); last=ts; if(!window.__stop) requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
    const slot = await p.$('.slot'); const sb = await slot.boundingBox(); const chips=await p.$$('.chip'); const cb=await chips[0].boundingBox(), cb2=await chips[chips.length-1].boundingBox();
    await p.mouse.move(sb.x+sb.width/2, sb.y+sb.height/2); await p.mouse.down();
    await p.mouse.move(cb.x+cb.width/2, cb.y+cb.height/2, {steps:25}); await p.mouse.move(cb2.x+cb2.width/2, cb2.y+cb2.height/2, {steps:25});
    await p.evaluate(()=>{ window.__stop=true; });
    const r = await p.evaluate(()=>{ const f=window.__fr.slice(3).sort((a,b)=>a-b); return {n:f.length,p50:+f[Math.floor(f.length*.5)].toFixed(1),p90:+f[Math.floor(f.length*.9)].toFixed(1)}; });
    await p.mouse.up(); await p.waitForTimeout(400);
    console.log(label.padEnd(36), JSON.stringify(r));
  };
  await css(''); await run('baseline drag');
  await b.close();
})();
