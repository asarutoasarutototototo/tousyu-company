const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(500);
  await p.evaluate(`S.seen.prologue=1; S.team=['rei','kuro','ren','aka','rai']; for(const k of S.team)S.lv[k]=14; saveState(); launchBattle({title:'t',theme:'station',boss:false,battle:{team:teamSpec(),supports:[],gifts:[],enemies:[{k:'hound',lv:14},{k:'moth',lv:14}]}},{onResult:()=>{}})`).catch(e=>console.log('ev',e.message));
  await p.waitForTimeout(2500);
  for(let t=0;t<7;t++){
    await p.screenshot({path:`grow_${t}.png`});
    const info=await p.evaluate(`(()=>{const B=CURRENT_BATTLE.B;return {turn:B.turn,slots:B.alive('A').map(u=>u.slotsN),ev:B.log?B.log.length:0}})()`);
    console.log(JSON.stringify(info));
    await p.evaluate(`document.querySelector('[data-b=go]')&&document.querySelector('[data-b=go]').click()`); await p.waitForTimeout(400); const q=await p.$('[data-q=auto]'); if(q) await q.click({force:true}).catch(()=>{});
    await p.waitForTimeout(12000);
  }
  console.log('errors',errs.slice(0,5)); await b.close();
})();
