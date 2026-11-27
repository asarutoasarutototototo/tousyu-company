const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:800}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(600);
  const r = await p.evaluate(`(()=>{
    for(const k of SINNER_KEYS)S.lv[k]=25;
    const B=buildBattle({team:teamSpec(),supports:[],gifts:[],enemies:[{k:'hound',lv:10},{k:'moth',lv:10}]});
    let g=0; while(!B.over&&g++<40){B.startTurn();B.resolve();}
    const sum=B.side('A').reduce((a,u)=>a+(u.dealt||0),0);
    const st=STAGES[0]; const a=stageStars(st,B); const b=stageStars(st,B);
    return {res:B.result,turn:B.turn,sum,statDmg:B.stat.dmg,a:[a.got,a.add,a.shards],b:[b.got,b.add,b.shards],tbl:dmgTable(B).length};
  })()`);
  console.log(JSON.stringify(r));
  await p.evaluate(`S.seen.prologue=1;S.cleared['1-1']=1;saveState();go('story',{st:'1-1'})`); await p.waitForTimeout(700); await p.screenshot({path:'nf3_story.png'});
  await p.evaluate(`go('lux')`); await p.waitForTimeout(700); await p.screenshot({path:'nf3_lux.png'});
  // save io round trip
  await p.evaluate(`S.shards=4242;S.tickets=9;saveState();showSettings()`); await p.waitForTimeout(300);
  await p.click('[data-m=saveio]'); await p.waitForTimeout(300);
  const code=await p.inputValue('#svout');
  await p.evaluate(`S.shards=1;S.tickets=0;saveState()`);
  await p.fill('#svin',code); await p.click('[data-m=load]'); await p.waitForTimeout(500);
  console.log('after import', await p.evaluate('S.shards+" "+S.tickets'), code.length);
  await p.evaluate(`showSaveIO()`); await p.fill('#svin','garbage'); await p.click('[data-m=load]'); console.log('msg', await p.textContent('#svmsg'));
  console.log('errors',errs.slice(0,6)); await b.close();
})();
