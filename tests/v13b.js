const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:390,height:844}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(500);
  const r=await p.evaluate(()=>{ const out=[];
    for(const f of [5,10,15,20,25,30,50]){const fl=towerFloor(f);const B=buildBattle({team:SINNER_KEYS.slice(0,3).map(s=>({sid:s,ik:s+'3',lv:25,sync:1})),supports:[],gifts:[],enemies:fl.en},{seed:f});let g=0;while(!B.over&&g++<25){B.startTurn();B.resolve();}out.push(f+':'+(B.result||'?'));}
    for(let i=0;i<5;i++){const fl=MIRROR_FLOORS[i];const run={floor:i,step:1};const B=buildBattle({team:[{sid:'rei',ik:'rei3',lv:30,sync:4}],supports:[],gifts:[],enemies:[{k:fl.boss,lv:fl.lv}]},{seed:i});let g=0;while(!B.over&&g++<25){B.startTurn();B.resolve();}out.push('m'+i+':'+(B.result||'?'));}
    return out.join(' ');});
  console.log(r);
  await p.evaluate(`go('shop')`); await p.waitForTimeout(400); await p.screenshot({path:'v13_shop_m.png'});
  console.log('errors',errs); await b.close();
})();
