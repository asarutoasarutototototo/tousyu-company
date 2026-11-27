const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(''+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1200);
  const r = await p.evaluate(()=>{
    const out=[];
    const team=['rei','kuro'].map(k=>({sid:k,ik:k+'1',lv:30,sync:1}));
    const B=buildBattle({team,supports:[],gifts:[],enemies:[{k:'hound',lv:10},{k:'moth',lv:10}]});
    B.manual=true; B.startTurn();
    const [A1,A2]=B.alive('A'), [E1,E2]=B.alive('E');
    // set speeds
    A1.slots.forEach((s,i)=>{s.spd=9-i}); A2.slots.forEach((s,i)=>{s.spd=7-i});
    E1.slots.forEach((s,i)=>{s.spd=3+i}); E2.slots.forEach((s,i)=>{s.spd=2+i});
    out.push('slots '+A1.slots.length+' '+A2.slots.length+' '+E1.slots.length+' '+E2.slots.length);
    // enemies: E1 slot0 -> A2 slot0 ; A1 slot0 targets E1 slot0 (steal expected, spd 9 > 3)
    A1.slots.forEach(s=>B.setSkill(A1,s.i,'s1')); A2.slots.forEach(s=>B.setSkill(A2,s.i,'s1'));
    E1.slots.forEach(s=>{ if(!s.skill){ } });
    const e0=E1.slots[0]; out.push('E1s0 skill '+(e0.skill&&e0.skill.kind)+' target '+JSON.stringify(e0.target));
    e0.target={u:A2.id,s:0};
    A1.slots[0].target={u:E1.id,s:0}; A2.slots[0].target={u:E2.id,s:0};
    out.push('state '+B.clashState(A1,A1.slots[0],E1,e0));
    out.push('partner '+JSON.stringify(!!B.findPartner({u:A1,slot:A1.slots[0]})));
    const ev=B.resolve(); out.push(ev.filter(e=>e.t==='clash'||e.t==='atk').map(e=>e.t+(e.steal?'S':'')+(e.a?e.a.u+':'+e.a.i:'')+(e.b?'-'+e.b.u+':'+e.b.i:'')).join(' '));
    return out;
  });
  console.log(r.join('\n'), errs); await b.close();
})();
