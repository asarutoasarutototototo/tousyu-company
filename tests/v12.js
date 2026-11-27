const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(500);
  await p.evaluate(`STAGES.forEach(s=>S.cleared[s.id]=1); S.team=['rei','kuro','ren']; S.oil=99; saveState(); go('roster',{sid:'rei'}); ACT.rtab({t:'lv'});`); await p.waitForTimeout(600);
  await p.screenshot({path:'v12_lv.png',fullPage:true});
  await p.evaluate(`go('story'); STORY_CH=4; go('story',null,true)`); await p.waitForTimeout(600);
  await p.screenshot({path:'v12_story.png'});
  await p.evaluate(`runStage(STAGES.find(s=>s.id==='4-5'))`); await p.waitForTimeout(3500);
  await p.screenshot({path:'v12_battle.png'});
  console.log('errors',errs); await b.close();
})();
