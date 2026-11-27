const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1200);
  const r = await p.evaluate(()=>{
    const T=['rei','kuro','ren','aka','rai'], out=[]; 
    for (let g=0; g<40&&out.length<4; g++){
      const st=STAGES.find(x=>x.id===['3-3','3-5','6-4','12-2'][g%4]);
      const B=buildBattle({team:T.slice(0,2+g%4).map(sid=>({sid,ik:sid+'3',lv:30,sync:1})),supports:[],gifts:[],plBonus:0,lvBonus:0,enemies:st.en.map(e=>({k:e.k,lv:30}))},{seed:g+1});
      B.startTurn();
      B.alive('A').forEach(a=>a.slots.forEach(s=>{ if(!(s.skill&&s.skill.kind==='atk')||!s.target||s.target.s==null||out.length>=4) return; const tu=B.U(s.target.u), ts=tu.slots[s.target.s]; if(B.clashState(a,s,tu,ts)!=='prot') return;
        const pr=B.pairedSlot(ts,tu); const prU=B.U(ts.target.u);
        out.push({me:a.id+'.'+s.i+' spd'+s.spd+' ->'+tu.id+'.'+ts.i+' spd'+ts.spd, enemyTargets:ts.target.u+'.'+ts.target.s, thatAllyTarget: JSON.stringify(prU.slots[ts.target.s].target), thatAllySkill: prU.slots[ts.target.s].skill.kind});
      }));
    }
    return out;
  });
  console.log(JSON.stringify(r,null,1)); await b.close();
})();
