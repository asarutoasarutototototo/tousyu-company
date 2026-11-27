const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  const errs=[]; p.on('pageerror',e=>errs.push(''+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(500);
  await p.evaluate(`S.seen.prologue=1; S.team=['rei']; S.lv.rei=40; saveState(); launchBattle({title:'',theme:'station',boss:false,battle:{team:teamSpec(),supports:[],gifts:[],enemies:[{k:'hound',lv:1},{k:'moth',lv:1},{k:'puppet',lv:1}]}},{onResult:()=>{}})`);
  await p.waitForTimeout(2500);
  await p.evaluate(`(()=>{const B=CURRENT_BATTLE.B;B.units.filter(u=>u.side==='E').forEach(u=>{u.hp=u.maxHp=99999});B.alive('A')[0].slotsN=6;B.turn=6;})()`);
  await p.evaluate(`document.querySelector('[data-b=go]').click()`); await p.waitForTimeout(400); { const q=await p.$('[data-q=auto]'); if(q) await q.click({force:true}).catch(()=>{}); }
  await p.waitForFunction(`CURRENT_BATTLE.B.turn>=7 && document.querySelector('[data-b=go]')`,null,{timeout:90000}).catch(e=>console.log('to')); await p.waitForTimeout(1200);
  await p.screenshot({path:'g1.png'});
  console.log(await p.evaluate(`CURRENT_BATTLE.B.turn+' '+CURRENT_BATTLE.B.alive('A').map(u=>u.slotsN)`), errs); await b.close();
})();
