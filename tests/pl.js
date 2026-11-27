const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const errs=[];
  for (const vp of [{width:1280,height:800},{width:390,height:800}]) {
    const p = await b.newPage({viewport:vp}); p.on('pageerror',e=>errs.push(''+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_/.test(m.text()))errs.push(m.text())});
    await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
    await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(500);
    const t=vp.width>500?'d':'m';
    await p.evaluate(`S.seen.prologue=1; S.login={last:dayNo(),n:1}; S.shards=99999; saveState(); window._mk=(ts)=>ts.map((tier,i)=>{const ik=Object.keys(IDENTS).filter(k=>IDENTS[k].tier===tier)[i%5]; return {ik,sid:IDENTS[ik].key?IDENTS[ik].key.replace(/\\d+$/,''):ik.replace(/\\d+$/,''),tier,isNew:i%3===0,frag:i%4===1?3:0,sync:1+(i%4)}}); go('gacha')`); await p.waitForTimeout(700);
    console.log(t,'sid sample', await p.evaluate('JSON.stringify(_mk([3,2,1]).map(x=>x.ik+"/"+x.sid))'));
    await p.evaluate(`pullMany=()=>_mk([1,1,2,1,1,1,3,1,2,1])`);
    await p.click('[data-act=pull][data-n="10"]'); 
    for (const ms of [900, 2000, 2200, 1500, 2200, 3500, 3500]) { await p.waitForTimeout(ms); }
    await p.screenshot({path:`pl_${t}_end.png`});
    // re-run with screenshots at stages
    await p.click('[data-act=gok]').catch(()=>{}); await p.waitForTimeout(400);
    await p.evaluate(`pullMany=()=>_mk([3])`);
    await p.click('[data-act=pull][data-n="1"]');
    await p.waitForTimeout(1800); await p.screenshot({path:`pl_${t}_intro.png`});
    await p.waitForTimeout(1500); await p.screenshot({path:`pl_${t}_burst.png`});
    await p.waitForTimeout(1200); await p.screenshot({path:`pl_${t}_warn.png`});
    await p.waitForTimeout(1500); await p.screenshot({path:`pl_${t}_one.png`});
    console.log(t,'ok visible', await p.evaluate('!!document.querySelector(".pok:not([hidden])")'));
    await p.click('[data-act=gok]').catch(e=>errs.push('gok '+e)); await p.waitForTimeout(400);
    // skip test
    await p.evaluate(`pullMany=()=>_mk([1,1,1,1,2,1,1,1,1,3])`);
    await p.click('[data-act=pull][data-n="10"]'); await p.waitForTimeout(600); await p.click('[data-act=pskip]'); await p.waitForTimeout(800);
    console.log(t,'after skip: flipped', await p.evaluate('document.querySelectorAll(".pc.flip").length+" ok "+!!document.querySelector(".pok:not([hidden])")'));
    await p.screenshot({path:`pl_${t}_skip.png`});
    await p.click('[data-act=gok]'); await p.waitForTimeout(300);
    await p.close();
  }
  console.log('errors',errs); await b.close();
})();
