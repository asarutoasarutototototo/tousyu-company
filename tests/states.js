const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  const clickDialog=async()=>{ for(let i=0;i<8;i++){ if(await p.$('#dialog:not([hidden])')){ await p.click('#dialog .dbox'); await p.waitForTimeout(120); await p.click('#dialog .dbox').catch(()=>{}); await p.waitForTimeout(120);} } };
  await p.click('[data-act=start]'); await p.waitForTimeout(500);
  await p.click('[data-act=go][data-to=story]'); await p.waitForTimeout(700); await clickDialog();
  await p.click('[data-act=stgo]'); await p.waitForTimeout(500); await clickDialog();
  await p.waitForSelector('#bwrap:not([hidden]) #stage'); await p.waitForTimeout(2500);
  const shots=[['hit_s',v=>{v.vus[0].flash=0;v.react(v.vus[0],-1,false,'slash',null)}],['hit_b',v=>{v.react(v.vus[1],-1,true,'blunt',null)}],['stag',v=>{v.vus[0].d.stag=1}],['panic',v=>{v.vus[0].d.stag=0;v.vus[0].d.panic=1}],['dead',v=>{v.vus[0].d.panic=0;v.vus[0].dead=true;v.vus[0].die=1}],
   ['weak',v=>{v.vus[0].dead=false;v.vus[0].die=0;v.vus[0].d.hp=20;}]];
  for (const [n,f] of shots){
    await p.evaluate(`(function(){const v=CURRENT_BATTLE.view; (${f.toString()})(v);})()`); await p.waitForTimeout(160);
    await p.screenshot({path:`st_${n}.png`, clip:{x:0,y:100,width:700,height:420}});
  }
  console.log('errors:',errs.slice(0,10)); await b.close();
})();
