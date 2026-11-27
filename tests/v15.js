const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(500);
  const r=await p.evaluate(()=>{
    S.owned.rei3=4; S.owned.rei6=4; S.owned.rei1=4; S.shards=100000;
    // force pulls until duplicates at MAX
    let fr=0; for(let i=0;i<30;i++){ const o=pullMany(10); o.forEach(x=>{if(x.frag)fr++}); }
    const tot={...S.frag};
    // engine pass filtering
    const mk=(ik,sy)=>makeAlly('rei',ik,5,sy,emptyPerm()).pass.length;
    const pl=[IDENTS.rei1.pass.length,IDENTS.rei5.pass.length,IDENTS.rei6.pass.length,mk('rei6',1),mk('rei6',2),mk('rei6',3),mk('rei6',4),mk('rei5',1),mk('rei5',4),mk('rei1',1),mk('rei1',2)];
    return {fr,tot,pl};
  });
  console.log(JSON.stringify(r));
  await p.evaluate(`S.frag.rei=120; S.owned={rei1:1,rei2:2}; ['kuro','ren','aka','rai','tetsu','nagi'].forEach(s=>S.owned[s+'1']=1); S.equipped.rei='rei2'; go('roster',{sid:'rei'}); document.querySelector('.fragline').scrollIntoView()`); await p.waitForTimeout(600);
  await p.screenshot({path:'v15_ros.png'});
  const r2=await p.evaluate(`(()=>{const a=S.frag.rei;ACT.fragx({ik:'rei5'});return [a,S.frag.rei,!!S.owned.rei5]})()`);
  await p.waitForTimeout(400); await p.evaluate(`ACT.rtab({t:'pass'})`);await p.waitForTimeout(300);
  await p.evaluate(`document.querySelector('.tabs').scrollIntoView()`); await p.screenshot({path:'v15_pass.png'});
  console.log(JSON.stringify(r2),'errors',errs); await b.close();
})();
