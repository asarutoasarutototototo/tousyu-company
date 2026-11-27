const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:800}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(600);
  await p.evaluate(`S.seen.prologue=1; S.seen['pre:1-5']=1; S.seen['ch2']=1; S.login={last:dayNo(),n:1}; for(const k of SINNER_KEYS)S.lv[k]=20; S.owned['kuro3']=1; saveState(); go('recall')`); await p.waitForTimeout(700);
  await p.screenshot({path:'nf7_recall.png'});
  await p.click('[data-act=recall][data-i="0"]'); await p.waitForTimeout(600); await p.screenshot({path:'nf7_dlg.png'});
  await p.click('#dialog'); await p.waitForTimeout(100);
  await p.evaluate(`document.querySelector('#dialog').hidden=true; go('form')`); await p.waitForTimeout(600);
  await p.click('[data-act=autoform]'); await p.waitForTimeout(400);
  console.log('autoform', await p.evaluate('S.team.join()+" eq kuro="+S.equipped.kuro'));
  await p.screenshot({path:'nf7_form.png'});
  await p.evaluate(`launchBattle({title:'t',theme:'station',battle:{team:teamSpec(),supports:[],gifts:[],enemies:[{k:'hound',lv:10},{k:'moth',lv:10}]}},{onResult:()=>({html:'',buttons:[]})})`); await p.waitForTimeout(2500);
  await p.click('[data-b=info]'); await p.waitForTimeout(400); await p.screenshot({path:'nf7_info.png'}); await p.click('[data-m=x]');
  for(let i=0;i<3;i++){ await p.evaluate(`document.querySelector('[data-b=go]').click()`); await p.waitForTimeout(400); const q=await p.$('[data-q=auto]'); if(q) await q.click({force:true}).catch(()=>{}); await p.waitForTimeout(9000); }
  await p.click('[data-b=log]'); await p.waitForTimeout(400); await p.screenshot({path:'nf7_log.png'});
  console.log('errors',errs.slice(0,6)); await b.close();
})();
