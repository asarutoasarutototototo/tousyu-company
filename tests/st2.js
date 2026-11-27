const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(''+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1200);
  const r = await p.evaluate(()=>{
    const cnt={planSteal:0, stolen:0, usedAlready:0, slotUsed:0, other:0, planned:0};
    const ex=[];
    for(let g=0;g<60;g++){
      const team=SINNER_KEYS.slice(0,4).map(k=>({sid:k,ik:k+'1',lv:30,sync:1}));
      const B=buildBattle({team,supports:[],gifts:[],enemies:[{k:'hound',lv:25},{k:'moth',lv:25},{k:'shade',lv:25}]},{seed:g+1});
      B.manual=true;
      for(let t=0;t<4&&!B.over;t++){
        B.startTurn();
        B.alive('A').forEach(a=>a.slots.forEach(s=>B.setSkill(a,s.i,'s1')));
        B.autoTargets();
        // random retarget to enemy slots to stress
        const es=[]; B.alive('E').forEach(e=>e.slots.forEach(s=>{if(!s.canceled)es.push([e,s])}));
        B.alive('A').forEach(a=>a.slots.forEach(s=>{ if(Math.random()<.6&&es.length){const [e,x]=es[Math.floor(Math.random()*es.length)]; s.target={u:e.id,s:x.i};} }));
        // wrap runAction
        const orig=B.runAction.bind(B);
        B.runAction=function(act){
          const u=act.u, sl=act.slot; let st=null, ts=null, tu=null;
          if(u.isAlly && !sl.used && !sl.canceled && u.alive && sl.skill && sl.target && sl.target.s!=null){ tu=B.U(sl.target.u); ts=tu&&tu.slots[sl.target.s]; if(ts) st=B.clashState(u,sl,tu,ts); }
          const before=B.ev.length; orig(act);
          if(st==='steal'){ cnt.planSteal++; const evs=B.ev.slice(before).filter(e=>e.t==='clash'); const c=evs[0]; if(c&&c.steal&&c.b.u===tu.id&&c.b.s===ts.i) cnt.stolen++; else cnt.other++, ex.push(JSON.stringify({a:c&&[c.a,c.b,c.steal]})); }
        };
        B.resolve(); B.runAction=orig;
      }
    }
    return {cnt,ex:ex.slice(0,3)};
  });
  console.log(JSON.stringify(r), errs); await b.close();
})();
