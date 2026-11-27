const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1200);
  const r = await p.evaluate(()=>{
    const T=['rei','kuro','ren','aka','rai'], cnt={}; const add=k=>cnt[k]=(cnt[k]||0)+1; const ex=[];
    for (let g=0; g<80; g++){
      const st=STAGES.find(x=>x.id===['3-3','3-5','6-4','12-2'][g%4]);
      const B=buildBattle({team:T.slice(0,2+g%4).map(sid=>({sid,ik:sid+'3',lv:30,sync:1})),supports:[],gifts:[],plBonus:0,lvBonus:0,enemies:st.en.map(e=>({k:e.k,lv:30}))},{seed:g+1});
      let guard=0;
      while(!B.over&&guard++<12){
        B.startTurn();
        const pre=[]; B.alive('A').forEach(a=>a.slots.forEach(s=>{ if(!(s.skill&&(s.skill.kind==='atk'||s.skill.ego))||!s.target||s.target.s==null) return; const tu=B.U(s.target.u), ts=tu&&tu.slots[s.target.s]; pre.push({u:a.id,i:s.i,st:ts?B.clashState(a,s,tu,ts):'none',tu:tu.id,ts:s.target.s,spd:s.spd,tsp:ts?ts.spd:0,tt:ts&&ts.target?ts.target.u+':'+ts.target.s:null}); }));
        const ev=B.resolve();
        const cl=ev.filter(e=>e.t==='clash');
        for(const q of pre){
          const hit=cl.some(c=>(c.a.u===q.u&&c.a.s===q.i)||(c.b.u===q.u&&c.b.s===q.i));
          if(hit||q.st==='slow'||q.st==='none') continue;
          // why?
          const idxMine=ev.findIndex(e=>e.t==='atk'&&e.a&&e.a.u===q.u&&e.a.s===q.i);
          const pulledByOther=cl.some(c=>(c.a.u===q.tu&&c.a.s===q.ts)||(c.b.u===q.tu&&c.b.s===q.ts));
          const myUnitHit=ev.some(e=>e.t==='stagger'&&e.u===q.u);
          const tgtStag=ev.some(e=>e.t==='stagger'&&e.u===q.tu);
          const fizz=ev.some(e=>e.t==='fizzle');
          let why=(pulledByOther?'targetSlotTakenByOther ':'')+(myUnitHit?'myUnitStaggered ':'')+(tgtStag?'tgtStaggered ':'')+(idxMine<0?'noAtkEvent ':'');
          add(q.st+' -> '+(why||'UNKNOWN'));
          if(!why&&ex.length<4) ex.push({q,evs:ev.filter(e=>['atk','clash','stagger','die'].includes(e.t)).map(e=>e.t+(e.a?(e.a.u+'.'+e.a.s):'')+(e.b?'x'+e.b.u+'.'+e.b.s:'')+(e.steal?'S':'')+(e.u!=null?e.u:'')+(e.tu!=null?'>'+e.tu:'')+(e.mode?e.mode:'')).join(' ')});
        }
      }
    }
    return {cnt,ex};
  });
  console.log(JSON.stringify(r,null,1)); await b.close();
})();
