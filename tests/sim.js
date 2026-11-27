const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1200);
  const r = await p.evaluate(()=>{
    const out={};
    for (const sid of SINNER_KEYS){
      const uq=SINNERS[sid].uq, cnt={uq:0,ev:0,win:0,lose:0,turns:0,miss:0,thorn:0,frenzy:0}; let nan=0;
      for (let g=0; g<20; g++){
        const B=buildBattle({team:[{sid,ik:sid+'3',lv:20,sync:1}],supports:[],gifts:[],enemies:[{k:'hound',lv:18},{k:'moth',lv:18}]},{seed:g+1});
        let guard=0;
        while(!B.over && guard++<30){
          B.startTurn(); const ev=B.resolve();
          for(const e of ev){ if(e.t==='status'&&e.k===uq&&(e.p||e.c))cnt.uq++; if(e.t==='coin'&&e.miss)cnt.miss++; if(e.t==='dot'&&e.k==='thorn')cnt.thorn++; if(e.t==='dot'&&e.k==='frenzy')cnt.frenzy++;
            if(e.S&&e.S.some(s=>isNaN(s.hp)||isNaN(s.sp)))nan++; }
        }
        cnt.turns+=B.turn; if(B.result==='win')cnt.win++; else cnt.lose++;
      }
      cnt.nan=nan; out[sid]=cnt;
    }
    return out;
  });
  console.log(JSON.stringify(r)); console.log('errors:',errs.slice(0,6)); await b.close();
})();
