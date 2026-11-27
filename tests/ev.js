const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(''+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1200);
  const r = await p.evaluate(()=>{
    const out={};
    for (const spd of [2,5]) {
      const team=['rei'].map(k=>({sid:k,ik:k+'1',lv:30,sync:1}));
      const B=buildBattle({team,supports:[],gifts:[],enemies:[{k:'hound',lv:10},{k:'moth',lv:10}]},{seed:7});
      B.manual=true; B.startTurn();
      const A=B.alive('A')[0], [E1,E2]=B.alive('E');
      A.slots[0].spd=spd; E1.slots[0].spd=3; E2.slots[0].spd=4;
      B.setSkill(A,0,'def'); A.slots[0].dtarget={u:E1.id,s:0};
      E1.slots[0].target={u:A.id,s:0}; E2.slots[0].target={u:A.id,s:0};
      const ev=B.resolve();
      out['spd'+spd]=ev.filter(e=>e.t==='clash'||e.t==='atk').map(e=>e.t==='clash'?('clash '+(e.a.u===A.id?'A':e.a.u===E1.id?'E1':'E2')+'×'+(e.b.u===A.id?'A':e.b.u===E1.id?'E1':'E2')+(e.steal?' steal':'')):('atk '+(e.a.u===A.id?'A':e.a.u===E1.id?'E1':'E2'))).join(' | ');
    }
    // mastery clash power
    const team=[{sid:'rei',ik:'rei1',lv:30,sync:1,mast:{s1:0}}]; const B0=buildBattle({team,supports:[],gifts:[],enemies:[{k:'hound',lv:30}]}); const A0=B0.alive('A')[0];
    const p0=B0.clashPow(A0,B0.alive('E')[0],A0.kit.s1); A0.mast.s1=23; const p1=B0.clashPow(A0,B0.alive('E')[0],A0.kit.s1); const pr=B0.powerRange(A0,A0.kit.s1,B0.alive('E')[0]);
    out.mast=[p0,p1,pr];
    return out;
  });
  console.log(JSON.stringify(r,null,1), errs); await b.close();
})();
