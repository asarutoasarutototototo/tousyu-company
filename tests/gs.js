const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(''+e));
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1200);
  const r = await p.evaluate(()=>{
    const out={};
    for (let n=1;n<=7;n++){
      const team=SINNER_KEYS.slice(0,n).map(k=>({sid:k,ik:k+'1',lv:30,sync:1}));
      const B=buildBattle({team,supports:[],gifts:[],enemies:[{k:'hound',lv:60},{k:'moth',lv:60}]});
      const rows=[];
      for(let t=0;t<9&&!B.over;t++){B.startTurn(); rows.push(B.alive('A').map(u=>u.slots.length+':'+u.slotsN).join('/'));}
      out[n]=rows.join(' | ');
    }
    return out;
  });
  console.log(r, errs); await b.close();
})();
