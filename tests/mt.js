const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(''+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1200);
  const r = await p.evaluate(()=>{
    const T=['rei','kuro','ren','aka','rai'], cnt={}; const add=k=>cnt[k]=(cnt[k]||0)+1; const ex=[];
    for (const mode of ['rand','auto']) for (let g=0; g<60; g++){
      const st=STAGES.find(x=>x.id===['3-3','3-5','6-4','12-2'][g%4]);
      const B=buildBattle({team:T.slice(0,2+g%4).map(sid=>({sid,ik:sid+'3',lv:30,sync:1})),supports:[],gifts:[],plBonus:0,lvBonus:0,enemies:st.en.map(e=>({k:e.k,lv:30}))},{seed:g+1});
      let guard=0;
      while(!B.over&&guard++<12){
        B.startTurn();
        const es=[]; B.alive('E').forEach(e=>e.slots.forEach(s=>es.push({u:e,s})));
        if(mode==='rand') B.alive('A').forEach(a=>a.slots.forEach(s=>{ if(s.skill&&s.skill.kind==='atk'&&es.length){ const c=es[B.ri(0,es.length-1)]; s.target={u:c.u.id,s:c.s.i}; }}));
        const pre=[]; B.alive('A').forEach(a=>a.slots.forEach(s=>{ if(!(s.skill&&(s.skill.kind==='atk'||s.skill.ego))||!s.target||s.target.s==null) return; const tu=B.U(s.target.u), ts=tu&&tu.slots[s.target.s]; pre.push({u:a.id,i:s.i,st:ts?B.clashState(a,s,tu,ts):'none',spd:s.spd,tsp:ts?ts.spd:0}); }));
        const ev=B.resolve();
        const cl=ev.filter(e=>e.t==='clash');
        for(const q of pre){
          const hit=cl.some(c=>(c.a.u===q.u&&c.a.s===q.i)||(c.b.u===q.u&&c.b.s===q.i));
          let k=mode+':'+(hit?'clashed':'NO:'+q.st+(q.st==='slow'?(q.spd===q.tsp?'(tie)':'(lower)'):''));
          add(k);
          if(!hit&&['mutual','steal','def'].includes(q.st)&&ex.length<5) ex.push(JSON.stringify(q)+' turn'+B.turn);
        }
      }
    }
    return {cnt,ex};
  });
  console.log(JSON.stringify(r,null,1)); console.log(errs); await b.close();
})();
