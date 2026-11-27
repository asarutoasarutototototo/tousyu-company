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
  const seqs=[['s1',{key:'s1'},2],['s2',{key:'s2'},3],['s3',{key:'s3'},4],['ego',{key:'ego',ego:1},5],['guard',{key:'def',kind:'guard'},2],['evade',{key:'def',kind:'evade'},3],['counter',{key:'def',kind:'counter'},2]];
  for (const ch of [0,1]) for (const [n,sk,nC] of seqs){
    await p.evaluate(`(function(){const v=CURRENT_BATTLE.view; const u=v.vus[${ch}]; window.__done=false; window.__r=(async()=>{ for(let ci=0;ci<${nC};ci++){ const def=imgSkillDef(u.u.look, ${JSON.stringify(sk)}, ci, ${nC}, 0); const pl=v.play1(u,def); await pl.done; await v.wait(60);} window.__done=true;})(); })()`);
    let i=0; while(i<14 && !(await p.evaluate('window.__done'))){ await p.screenshot({path:`seq/${ch}_${n}_${String(i).padStart(2,'0')}.png`, clip:{x:0,y:130,width:700,height:400}}); i++; }
    await p.waitForTimeout(600);
  }
  console.log('errors:',errs.slice(0,10)); await b.close();
})();
