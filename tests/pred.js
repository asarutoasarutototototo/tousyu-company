// predict() と実際の resolve() のマッチ結果を比較する
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1200);
  const r = await p.evaluate(()=>{
    const T=['rei','kuro','ren','aka','rai','tetsu','nagi']; const stat={total:0,ok:0,bad:0,steal:0,stealFromPair:0}; const ex=[];
    for (let g=0; g<120; g++){
      const st=STAGES[[3,12,30,60,100,150,200,250][g%8]];
      const B=buildBattle({team:T.slice(0,3+g%4).map(sid=>({sid,ik:sid+'3',lv:30,sync:1})),supports:[],gifts:[],enemies:st.en.map(e=>({k:e.k,lv:30}))},{seed:g+11,manual:true});
      let guard=0;
      while(!B.over&&guard++<6){
        B.startTurn();
        // ランダムな計画: 味方の攻撃スロットに任意の敵スキル/敵本体を指定
        for(const a of B.alive('A')) for(const s of a.slots){
          if(!s.skill) continue; const atk=s.skill.kind==='atk'||s.skill.ego; const foes=B.alive('E'); if(!foes.length) break;
          const e=foes[B.ri(0,foes.length-1)]; const es=e.slots.filter(x=>x.skill&&!x.canceled);
          if(atk){ if(Math.random()<.2||!es.length) s.target={u:e.id,s:null}; else s.target={u:e.id,s:es[B.ri(0,es.length-1)].i}; }
          else if(es.length&&Math.random()<.6){ const x=es[B.ri(0,es.length-1)]; s.dtarget={u:e.id,s:x.i}; }
        }
        const pred=B.predict(); const dump=B.units.map(u=>({id:u.id,A:u.isAlly,alive:u.alive,stag:u.stag,panic:u.panic,slots:u.slots.map(s=>({i:s.i,spd:s.spd,tie:+s.tie.toFixed(2),k:s.skill&&(s.skill.kind+(s.skill.ego?'/ego':'')),t:s.target&&(s.target.u+':'+s.target.s),d:s.dtarget&&(s.dtarget.u+':'+s.dtarget.s)}))}));
        const snap=new Map(); B.units.forEach(u=>u.slots.forEach(s=>snap.set(u.id+':'+s.i,{pre:pred.get(s)||null,tgt:s.target&&{...s.target},spd:s.spd})));
        // 事前チェック: 奪取のうち「相互指定の組」からの奪取
        for(const a of B.alive('A')) for(const s of a.slots){ const pr=pred.get(s); if(pr&&pr.k==='steal'){ stat.steal++; const ts=pr.p.slot, tu=pr.p.u; const was=(ts.target&&ts.target.u===a.id&&false); } }
        const ev=B.resolve();
        // 実際
        const act=new Map(); let anyStagBefore=false;
        for(const e of ev){ if(e.t==='clash'){ act.set(e.a.u+':'+e.a.s,{k:e.steal?'steal':'clash',p:e.b.u+':'+e.b.s}); act.set(e.b.u+':'+e.b.s,{k:'x',p:e.a.u+':'+e.a.s}); }
          else if(e.t==='atk'&&e.mode==='one'&&!e.aoe){ act.set(e.a.u+':'+e.a.s,{k:'one'}); } }
        for(const a of B.alive('A').concat(B.alive('E'))) {}
        for(const [key,v] of snap){ const pr=v.pre; if(!pr) continue; const ac=act.get(key); if(!ac) continue; // 行動しなかった(死亡/中断)は除外
          if(!(pr.k==='clash'||pr.k==='steal'||pr.k==='one')) continue; // 能動側のみ比較
          stat.total++;
          const predPartner=pr.p?(pr.p.u.id+':'+pr.p.slot.i):null;
          const okk = pr.k==='one' ? ac.k==='one' : ((ac.k==='clash'||ac.k==='steal'||ac.k==='x')&&ac.p===predPartner);
          if(okk) stat.ok++; else { stat.bad++; if(ex.length<14) ex.push({g,turn:B.turn,key,dump:(pr.k==='steal'&&ac.k==='one'&&!window.__d)?(window.__d=1,dump):undefined,evs:(window.__d===1&&pr.k==='steal'&&ac.k==='one')?ev.filter(e=>['clash','atk','stagger','stag','pop'].includes(e.t)).map(e=>JSON.stringify(e).slice(0,110)):undefined,pred:pr.k+(predPartner?'→'+predPartner:'')+(pr.why?'('+pr.why+')':''),act:JSON.stringify(ac)}); } }
      }
    }
    return {stat,ex};
  });
  console.log(JSON.stringify(r,null,1)); console.log('errors',errs); await b.close();
})();
