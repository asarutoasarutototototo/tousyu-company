const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(''+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1200);
  const r = await p.evaluate((DELTA)=>{
    const DD=DELTA; const out=[]; const T=['rei','kuro','ren','aka','rai'];
    for (const k of [1,3,6,12,20,40,60,80]) for (const s of [1,5]) {
      const st=STAGES.find(x=>x.id===`${k}-${s}`); const cap=Math.min(410,10+5*(k-1));
      let win=0,turns=0,nan=0,N=12;
      for(let g=0;g<N;g++){
        const B=buildBattle({team:T.map(sid=>({sid,ik:sid+'3',lv:cap-Math.min(cap-1,DD),sync:1})),supports:[],gifts:[],plBonus:0,lvBonus:0,enemies:st.en.map(e=>({k:e.k,lv:e.lv}))},{seed:g+1});
        let guard=0; while(!B.over&&guard++<40){B.startTurn();const ev=B.resolve();for(const e of ev) if(e.S&&e.S.some(x=>isNaN(x.hp)))nan++;}
        if(B.result==='win')win++; turns+=B.turn;
      }
      out.push(`${st.id} cap${cap} enLv${st.en[0].lv} win ${win}/${N} avgT ${(turns/N).toFixed(1)} nan${nan}`);
    }
    return out;
  }, +process.env.D||0);
  console.log(r.join('\n')); console.log(errs); await b.close();
})();
