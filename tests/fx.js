const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const errs=[]; const vp=process.argv[2]==='m'?{width:390,height:800}:{width:1280,height:800}; const t=process.argv[2]==='m'?'m':'d';
  const p = await b.newPage({viewport:vp}); p.on('pageerror',e=>errs.push(''+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(500);
  await p.evaluate(`S.seen.prologue=1; S.login={last:dayNo(),n:1}; S.thread=900000; ['1-1','1-2','1-3','1-4'].forEach(i=>S.cleared[i]=1); SINNER_KEYS.forEach(k=>S.lv[k]=40); S.set.spd=3; saveState(); go('roster')`); await p.waitForTimeout(700);
  // level up fx
  await p.evaluate(`SINNER_KEYS.forEach(k=>S.lv[k]=9); S.thread=900000; go('roster')`); await p.waitForTimeout(500);
  console.log('lv before', await p.evaluate('sLv(ROS_SID)')); await p.click('[data-act=rlv]'); await p.waitForTimeout(350); await p.screenshot({path:`fx_${t}_lv.png`});
  console.log('lv after', await p.evaluate('sLv(ROS_SID)+" cap "+lvCap()'));
  await p.evaluate(`SINNER_KEYS.forEach(k=>S.lv[k]=30); saveState(); go('story',{st:'1-5'})`); await p.waitForTimeout(600);
  console.log('cap before', await p.evaluate('lvCap()'));
  await p.click('[data-act=stgo]');
  for(let i=0;i<12;i++){ await p.waitForTimeout(350); if(await p.evaluate('!!document.querySelector(".bossin")')) break; await p.mouse.click(640,740).catch(()=>{}); await p.evaluate('document.querySelector("#dialog")&&document.querySelector("#dialog").click()').catch(()=>{}); }
  await p.waitForTimeout(500); await p.screenshot({path:`fx_${t}_boss1.png`});
  await p.waitForTimeout(1000); await p.screenshot({path:`fx_${t}_boss2.png`});
  await p.waitForTimeout(2500);
  await p.click('[data-b=auto]').catch(()=>{}); await p.click('[data-b=spd]').catch(()=>{}); await p.click('[data-b=spd]').catch(()=>{});
  let seen=''; for(let i=0;i<150;i++){ await p.waitForTimeout(600); if(await p.evaluate('!!document.querySelector(".chapfx")')){seen='chap';break;} if(await p.evaluate('!!document.querySelector("#result:not([hidden]) .rbox")')){seen='result';break;} }
  console.log('first fx seen', seen);
  if(seen==='chap'){ await p.waitForTimeout(1300); await p.screenshot({path:`fx_${t}_chap1.png`}); await p.waitForTimeout(1500); await p.screenshot({path:`fx_${t}_chap2.png`}); await p.click('.chapfx').catch(()=>{}); await p.waitForTimeout(600); }
  await p.waitForTimeout(500); await p.screenshot({path:`fx_${t}_res0.png`}); await p.waitForTimeout(2500); await p.screenshot({path:`fx_${t}_res1.png`});
  console.log('cap after', await p.evaluate('lvCap()'), 'result text', (await p.evaluate('document.querySelector("#result h2")?.textContent')));
  await p.click('[data-r]').catch(()=>{}); await p.waitForTimeout(400);
  console.log('errors',errs); await b.close();
})();
