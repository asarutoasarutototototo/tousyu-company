const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:800}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]',{force:true}); await p.waitForTimeout(600);
  await p.evaluate(`S.seen.prologue=1; for(const k of SINNER_KEYS)S.lv[k]=25; S.cleared['1-5']=1;S.cleared['1-2']=1;S.cleared['1-3']=1; S.oil=90; saveState(); go('home')`); await p.waitForTimeout(1500);
  await p.screenshot({path:'nf4_login.png'});
  const sh0=await p.evaluate('S.shards'); await p.click('[data-m=get]'); await p.waitForTimeout(500);
  console.log('login', sh0,'->',await p.evaluate('S.shards+" n"+S.login.n+" due"+loginDue()'));
  await p.evaluate(`go('home')`); await p.waitForTimeout(1000); console.log('modal again?', await p.evaluate(`!document.querySelector('#modal').hidden`));
  await p.screenshot({path:'nf4_home.png'});
  await p.evaluate(`go('trial')`); await p.waitForTimeout(900); await p.screenshot({path:'nf4_trial.png'});
  // engine: bond + turn limit
  const r=await p.evaluate(`(()=>{ S.bond={rei:400}; const ts=teamSpec(); const B=buildBattle({team:ts,supports:[],gifts:[],turnLimit:2,enemies:[{k:'clock',lv:15,hpMul:8}]});
    let g=0; while(!B.over&&g++<9){B.startTurn();B.resolve();}
    return {bond:ts[0].bond, lv:bondInfo('rei').lv, res:B.result, turn:B.turn, tu:B.timeUp, hp:B.units.find(u=>u.side==='E').hp, mx:B.units.find(u=>u.side==='E').maxHp, perm:B.side('A')[0].perm.dmg, p2:B.side('A')[1].perm.dmg}})()`);
  console.log(JSON.stringify(r));
  await p.evaluate(`go('roster')`); await p.waitForTimeout(600);
  await p.evaluate(`ROS_TAB='lv'; go('roster')`); await p.waitForTimeout(800); await p.screenshot({path:'nf4_bond.png'});
  console.log('errors',errs.slice(0,6)); await b.close();
})();
