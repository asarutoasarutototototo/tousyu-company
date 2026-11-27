const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:800}});
  const errs=[]; p.on('pageerror',e=>errs.push(''+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(600);
  await p.evaluate(`S.seen.prologue=1; S.team=['rei','kuro']; for(const k of S.team)S.lv[k]=30; saveState();
   const o=Battle.prototype.startTurn; Battle.prototype.startTurn=function(){ const r=o.apply(this,arguments); const A=this.alive('A'),E=this.alive('E'); if(this.turn===1&&A.length>1){ A[0].slots[0].spd=9; A[1].slots[0].spd=6; E[0].slots[0].spd=3; E[1].slots[0].spd=7; E[0].slots[0].target={u:A[0].id,s:0}; E[1].slots[0].target={u:A[0].id,s:0}; } return r; };
   launchBattle({title:'t',theme:'station',battle:{team:teamSpec(),supports:[],gifts:[],enemies:[{k:'hound',lv:10},{k:'moth',lv:10}]}},{onResult:()=>({html:'',buttons:[]})})`);
  await p.waitForTimeout(2500);
  const ids=await p.evaluate(`CURRENT_BATTLE.B.units.map(u=>u.id)`);
  await p.evaluate(`(()=>{const B=CURRENT_BATTLE.B,A=B.alive('A')[0]; B.setSkill(A,0,'def'); CURRENT_BATTLE.refreshSlots(); CURRENT_BATTLE.renderArrows();})()`);
  await p.waitForTimeout(300);
  const sl=await p.$(`.slot[data-u="${ids[0]}"][data-i="0"]`), chip=await p.$(`.chip[data-e="${ids[2]}"][data-s="0"]`);
  const a=await sl.boundingBox(), c=await chip.boundingBox();
  await p.mouse.move(a.x+a.width/2,a.y+a.height/2); await p.mouse.down(); await p.mouse.move(a.x+a.width/2,a.y-60,{steps:4}); await p.mouse.move(c.x+c.width/2,c.y+c.height/2,{steps:12}); await p.waitForTimeout(400);
  await p.screenshot({path:'ev2_drag.png'}); await p.mouse.up(); await p.waitForTimeout(400);
  console.log('dtarget', await p.evaluate(`JSON.stringify(CURRENT_BATTLE.B.alive('A')[0].slots[0].dtarget)`));
  await p.screenshot({path:'ev2_set.png'});
  await p.evaluate(`document.querySelector('[data-b=go]').click()`); await p.waitForTimeout(500); { const q=await p.$('[data-q=auto]'); if(q) await q.click({force:true}).catch(()=>{}); }
  await p.waitForTimeout(9000);
  console.log(await p.evaluate(`JSON.stringify(CURRENT_BATTLE.B.ev.filter(e=>e.t==='clash'||e.t==='atk').map(e=>[e.t,e.a,e.b,e.steal]))`), errs); await b.close();
})();
