const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:800}});
  const errs=[]; p.on('pageerror',e=>errs.push(''+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(600);
  await p.evaluate(`S.seen.prologue=1; S.team=['rei','kuro']; for(const k of S.team)S.lv[k]=30; saveState(); const o=Battle.prototype.startTurn; Battle.prototype.startTurn=function(){ const r=o.apply(this,arguments); if(this.manual===undefined||true){ const A=this.alive('A'),E=this.alive('E'); if(A.length>1&&E.length>1&&this.turn===1){ A[0].slots[0].spd=9; A[1].slots[0].spd=6; E[0].slots[0].spd=3; E[1].slots[0].spd=7; E[0].slots[0].target={u:A[1].id,s:0}; E[1].slots[0].target={u:A[0].id,s:0}; } } return r; }; launchBattle({title:'t',theme:'station',battle:{team:teamSpec(),supports:[],gifts:[],enemies:[{k:'hound',lv:10},{k:'moth',lv:10}]}},{onResult:()=>({html:'',buttons:[]})})`);
  await p.waitForTimeout(2500);
  await p.evaluate(`window.__ids=CURRENT_BATTLE.B.units.map(u=>u.id)`);
  const ids=await p.evaluate('window.__ids');
  const sl=await p.$(`.slot[data-u="${ids[0]}"][data-i="0"]`), chip=await p.$(`.chip[data-e="${ids[2]}"][data-s="0"]`);
  const a=await sl.boundingBox(), c=await chip.boundingBox();
  console.log('chip text', (await chip.textContent()).trim().slice(0,40));
  await p.mouse.move(a.x+a.width/2,a.y+a.height/2); await p.mouse.down(); await p.mouse.move(a.x+a.width/2,a.y-60,{steps:4}); await p.mouse.move(c.x+c.width/2,c.y+c.height/2,{steps:12}); await p.waitForTimeout(300);
  await p.screenshot({path:'st3_drag.png'});
  await p.mouse.up(); await p.waitForTimeout(400);
  const A2=await p.$(`.slot[data-u="${ids[1]}"][data-i="0"]`); const ab=await A2.boundingBox(); const E2c=await p.$(`.chip[data-e="${ids[3]}"][data-s="0"]`); const eb=await E2c.boundingBox();
  await p.mouse.move(ab.x+ab.width/2,ab.y+ab.height/2); await p.mouse.down(); await p.mouse.move(ab.x+ab.width/2,ab.y-60,{steps:4}); await p.mouse.move(eb.x+eb.width/2,eb.y+eb.height/2,{steps:12}); await p.mouse.up(); await p.waitForTimeout(300);
  await p.screenshot({path:'st3_plan.png'});
  await p.evaluate(`document.querySelector('[data-b=go]').click()`); await p.waitForTimeout(500); { const q=await p.$('[data-q=auto]'); if(q) await q.click({force:true}).catch(()=>{}); }
  for(let i=0;i<40;i++){ if(await p.evaluate(`document.body.innerText.includes('奪取')`)){ await p.screenshot({path:'st3_steal.png'}); console.log('steal text seen'); break; } await p.waitForTimeout(250); }
  await p.waitForTimeout(6000); console.log(await p.evaluate(`JSON.stringify(CURRENT_BATTLE.B.ev.filter(e=>e.t==='clash').map(e=>[e.a,e.b,e.steal]))`));
  console.log('target set', await p.evaluate(`JSON.stringify(CURRENT_BATTLE.B.alive('A')[0].slots[0].target)+' state '+CURRENT_BATTLE.B.clashState(CURRENT_BATTLE.B.alive('A')[0],CURRENT_BATTLE.B.alive('A')[0].slots[0],CURRENT_BATTLE.B.alive('E')[0],CURRENT_BATTLE.B.alive('E')[0].slots[0])`));
  await p.screenshot({path:'st3_set.png'});
  console.log(errs); await b.close();
})();
