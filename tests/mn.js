const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const errs=[];
  for (const vp of [{width:1280,height:900},{width:390,height:800}]) {
    const p = await b.newPage({viewport:vp}); p.on('pageerror',e=>errs.push(''+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_/.test(m.text()))errs.push(m.text())});
    await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
    await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(500);
    await p.evaluate(`S.seen.prologue=1; S.login={last:dayNo(),n:1}; saveState(); go('roster')`); await p.waitForTimeout(900);
    const t=vp.width>500?'d':'m';
    await p.screenshot({path:`mn_ros_${t}.png`});
    console.log(t,'keys',await p.evaluate('SINNER_KEYS.length+" gch "+Object.keys(GCH).length'));
    await p.click('[data-act=minaopen]'); await p.waitForTimeout(700); await p.screenshot({path:`mn_prof_${t}.png`});
    await p.click('[data-act=minagal][data-id=stand]'); await p.waitForTimeout(900); await p.screenshot({path:`mn_gal_${t}.png`});
    await p.click('[data-act=gfr][data-id=g3]').catch(e=>errs.push('gfr '+e)); await p.waitForTimeout(300);
    await p.click('[data-act=gplay]').catch(e=>errs.push('gplay '+e)); await p.waitForTimeout(900);
    for (const sc of ['roster','mina','gallery','home']) { await p.evaluate(`go('${sc}')`); await p.waitForTimeout(400); console.log(t,sc,'overflowX',await p.evaluate('document.documentElement.scrollWidth-innerWidth')); }
    await p.close();
  }
  console.log('errors',errs); await b.close();
})();
