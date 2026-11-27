// 自動計画の勝率(エンジン変更の影響確認): node ../tests/winrate.js
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1200);
  const r = await p.evaluate(()=>{
    const T=['rei','kuro','ren','aka','rai','tetsu','nagi']; let w=0,n=0,turns=0,steal=0,clash=0;
    for(let g=0; g<300; g++){
      const st=STAGES[[5,15,33,48,70,95,130,180][g%8]];
      const B=buildBattle({team:T.slice(0,4+g%3).map(sid=>({sid,ik:sid+'3',lv:st.lv+4,sync:1})),supports:[],gifts:[],enemies:st.en.map(e=>({k:e.k,lv:st.lv}))},{seed:g+101});
      let guard=0; while(!B.over&&guard++<30){ B.startTurn(); const ev=B.resolve(); for(const e of ev){ if(e.t==='clash'){ clash++; if(e.steal) steal++; } } }
      n++; if(B.result==='win') w++; turns+=B.turn;
    }
    return {n,win:w,avgTurns:+(turns/n).toFixed(2),clash,steal};
  });
  console.log(JSON.stringify(r)); await b.close();
})();
