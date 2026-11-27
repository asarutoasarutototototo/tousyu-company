const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>{
    const out={};
    for(const sid of SINNER_KEYS){
      let aoe=0,atk=0,nan=0,hitTargets=new Set();
      for(let g=0;g<6;g++){
        const B=buildBattle({team:[{sid,ik:sid+'3',lv:20,sync:4}],supports:[],gifts:[],enemies:[{k:'hound',lv:15},{k:'moth',lv:15},{k:'puppet',lv:15}]},{seed:g+1});
        B.startTurn(); const u=B.alive('A')[0]; B.res[EGOS[sid].sin]=10; u.sp=5; 
        B.setSkill(u,0,'ego'); if(u.slots[1]) B.setSkill(u,1,'ego')||0;
        const ev=B.resolve();
        for(const e of ev){ if(e.t==='atk'){atk++; if(e.aoe)aoe++; hitTargets.add(e.tu);} if(e.S&&e.S.some(s=>isNaN(s.hp)))nan++; }
        let guard=0; while(!B.over&&guard++<20){B.startTurn();B.resolve();}
      }
      out[sid]={aoe:EGOS[sid].aw.aoe||0,atk,aoeEv:aoe,tg:hitTargets.size,nan};
    }
    return out;
  });
  console.log(JSON.stringify(r)); console.log('errors',errs); await b.close();
})();
