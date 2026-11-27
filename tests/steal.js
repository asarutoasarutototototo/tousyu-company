// マッチ奪いの決定的テスト
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1200);
  const r = await p.evaluate(()=>{
    const res={};
    function mk(spdA, spdB, spdX){
      const B=buildBattle({team:['rei','kuro','ren'].map(sid=>({sid,ik:sid+'3',lv:30,sync:1})),supports:[],gifts:[],enemies:[{k:'ash_wolf',lv:30},{k:'thread_widow',lv:30}]},{seed:5,manual:true});
      B.startTurn();
      const A=B.alive('A')[0], Bb=B.alive('A')[1], E1=B.alive('E')[0], E2=B.alive('E')[1];
      // 全スロットを整理: Aのslot0, Bのslot0, E1のslot0 だけ使う。他は防御で無害化
      for(const u of B.units) for(const s of u.slots){ s.spd=1; s.tie=.9; }
      const sA=A.slots[0], sB=Bb.slots[0], sX=E1.slots[0];
      for(const s of [sA,sB]) { B.setSkill(s===sA?A:Bb, 0,'s1'); }
      sX.skill = sX.skill; sX.spd=spdX; sA.spd=spdA; sB.spd=spdB;
      // 他のスロットは無効化
      for(const u of B.units) for(const s of u.slots){ if(s!==sA&&s!==sB&&s!==sX){ s.canceled=true; } }
      sX.target={u:Bb.id,s:0}; sB.target={u:E1.id,s:0}; sA.target={u:E1.id,s:0};
      return {B,A,Bb,E1,sA,sB,sX};
    }
    // 1) A(7) > X(4)、B(5)↔X 相互。A が B より先 → 奪取成立
    { const c=mk(7,5,4); const pr=c.B.predict(); res.t1_pred=pr.get(c.sA).k+'/'+(pr.get(c.sB)||{}).k;
      const ev=c.B.resolve(); const cl=ev.filter(e=>e.t==='clash'); res.t1_clash=cl.map(e=>`${e.a.u}:${e.a.s}x${e.b.u}:${e.b.s}${e.steal?'S':''}`).join(',');
      res.t1_pop=ev.filter(e=>e.t==='pop'&&/マッチ/.test(e.text)).map(e=>e.text).join('|'); }
    // 2) A(5) > X(4) だが B(8) が A より先に動く → 奪えない(B↔X が先に成立)
    { const c=mk(5,8,4); const pr=c.B.predict(); res.t2_pred=pr.get(c.sA).k+(pr.get(c.sA).why?'('+pr.get(c.sA).why+')':'')+'/'+(pr.get(c.sB)||{}).k;
      const ev=c.B.resolve(); res.t2_clash=ev.filter(e=>e.t==='clash').map(e=>`${e.a.u}:${e.a.s}x${e.b.u}:${e.b.s}${e.steal?'S':''}`).join(','); }
    // 3) A(4) = X(4) → 速度不足
    { const c=mk(4,2,4); const pr=c.B.predict(); res.t3_pred=pr.get(c.sA).k+(pr.get(c.sA).why?'('+pr.get(c.sA).why+')':''); }
    // 4) 敵 E(9) が、相互指定中の味方 B(5) を狙っても奪えない(味方の合戦は守られる)
    { const c=mk(2,5,4); c.sX.spd=4; const ex=c.B.alive('E')[1].slots[0]; ex.spd=9; ex.target={u:c.Bb.id,s:0}; ex.canceled=false; const pr=c.B.predict(); res.t4_pred=(pr.get(c.sB)||{}).k+'/'+(pr.get(ex)||{}).k+(pr.get(ex)&&pr.get(ex).why?'('+pr.get(ex).why+')':''); }
    return res;
  });
  console.log(JSON.stringify(r,null,1)); console.log('errors',errs); await b.close();
})();
