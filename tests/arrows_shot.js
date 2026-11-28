// 後半ステージの計画画面を撮影して、敵の矢印の見え方を確認する: node ../tests/arrows_shot.js [stageIndex] [w] [h]
const { chromium } = require('playwright');
(async()=>{
  const idx=+(process.argv[2]||80), W=+(process.argv[3]||1280), H=+(process.argv[4]||720);
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:W,height:H}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1200);
  await p.click('[data-act=start]').catch(()=>{}); await p.waitForTimeout(300);
  const skip=async()=>{ for(let i=0;i<40;i++){ if(await p.$('#dialog:not([hidden])')){ await p.click('#dialog .dbox',{timeout:800,force:true}).catch(()=>{}); await p.waitForTimeout(300);} else if(i>3) break; else await p.waitForTimeout(150);} };
  await skip();
  const id = await p.evaluate((idx)=>{ for(let i=0;i<idx;i++) S.cleared[STAGES[i].id]=1; S.seen['pre:1-1']=1; S.oil=99; saveState(); const st=STAGES[idx]; go('story',{st:st.id}); return st.id; }, idx); await p.waitForTimeout(500); await skip();
  await p.click('[data-act=stgo]',{force:true}).catch(e=>console.log('stgo?',String(e).slice(0,80))); await p.waitForTimeout(800); await skip();
  await p.waitForSelector('#bwrap:not([hidden]) .slot',{timeout:10000}); await p.waitForTimeout(1800);
  console.log('stage',id,'enemies',await p.evaluate(()=>CURRENT_BATTLE.B.alive('E').map(e=>e.slots.length).join(',')),'earr',await p.evaluate(()=>document.querySelectorAll('#arrows .earr').length));
  await p.screenshot({path:`arrows_${idx}.png`}); console.log('errors',errs); await b.close();
})();
