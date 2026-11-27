const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(500);
  await p.evaluate(`S.seen.prologue=1; S.team=['rei','kuro']; S.lv.rei=12; S.lv.kuro=12; saveState(); launchBattle({title:'t',theme:'station',boss:false,battle:{team:teamSpec(),supports:[],gifts:[],enemies:[{k:'hound',lv:6},{k:'moth',lv:6},{k:'puppet',lv:6}]}},{onResult:()=>{}})`);
  await p.waitForTimeout(2500);
  await p.evaluate(`(()=>{const B=CURRENT_BATTLE.B; const u=B.alive('A')[0]; B.res.pride=10; u.sp=5; B.setSkill(u,0,'ego'); CURRENT_BATTLE.refreshSlots&&CURRENT_BATTLE.refreshSlots(); CURRENT_BATTLE.startTurn();})()`); await p.waitForTimeout(400); await p.click('[data-q=auto]').catch(()=>{});
  for(let i=0;i<9;i++){ await p.waitForTimeout(1000); await p.screenshot({path:`v16_${i}.png`}); }
  console.log('errors',errs.slice(0,5)); await b.close();
})();
