const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(500);
  await p.evaluate(`S.owned.nagi15=1; S.equipped.nagi='nagi15'; go('roster',{sid:'nagi'}); ACT.rtab({t:'pass'})`); await p.waitForTimeout(600);
  await p.evaluate(`document.querySelector('.tabs').scrollIntoView()`); await p.screenshot({path:'v14_pass.png'});
  await p.evaluate(`S.cleared['1-1']=1; bump('win',3); bump('pull',3); bump('lv',1); bump('dun',1); S.pulls=60; go('mission')`); await p.waitForTimeout(500);
  const before=await p.evaluate(`[S.thread,S.shards,claimable()]`);
  await p.screenshot({path:'v14_mis.png'});
  await p.evaluate(`ACT.claimall()`); await p.waitForTimeout(400);
  const after=await p.evaluate(`[S.thread,S.shards,claimable()]`);
  await p.screenshot({path:'v14_mis2.png'});
  await p.evaluate(`go('story',{id:'5-5'})`);await p.waitForTimeout(300);
  await p.evaluate(`STORY_CH=5; S.cleared['4-5']=1; STAGES.forEach(s=>S.cleared[s.id]=1); go('story',null,true)`); await p.waitForTimeout(500);
  await p.screenshot({path:'v14_story.png'});
  console.log(JSON.stringify([before,after]),'errors',errs); await b.close();
})();
