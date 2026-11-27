const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(500);
  await p.evaluate(`STAGES.forEach(s=>S.cleared[s.id]=1); S.shards=3000; S.oil=99; saveState(); go('home')`); await p.waitForTimeout(700);
  await p.screenshot({path:'v13_home.png'});
  await p.evaluate(`go('shop')`); await p.waitForTimeout(500);
  const r=await p.evaluate(()=>{S.owned.rei1=1;const a=S.shards;ACT.shopbuy({id:'syn'});ACT.shopbuy({id:'th1'});return [a,S.shards,S.owned.rei1,S.thread]});
  await p.waitForTimeout(400); await p.screenshot({path:'v13_shop.png'});
  await p.evaluate(`STORY_CH=5; go('story',null,true)`); await p.waitForTimeout(500); await p.screenshot({path:'v13_story.png'});
  await p.evaluate(`runStage(STAGES.find(s=>s.id==='5-5'))`); await p.waitForTimeout(3500); await p.screenshot({path:'v13_battle.png'});
  console.log(JSON.stringify(r),'errors',errs); await b.close();
})();
