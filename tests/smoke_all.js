// Full smoke test: run from src/ :  node ../tests/smoke_all.js
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|ERR_|Failed to load resource/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+process.cwd()+'/test_full.html'); await p.waitForTimeout(1500);
  await p.click('[data-act=start]').catch(()=>{}); await p.waitForTimeout(300);
  const visit = async(tag)=> p.evaluate(()=>{
    const res=[]; const names=Object.keys(SCREENS);
    for(const n of names){ let ok=true,len=0,err=null; try{ go(n); len=$('#scr').innerHTML.length; }catch(e){ok=false;err=String(e)}
      res.push(n+':'+(ok&&len>200?'ok':'BAD('+len+(err?' '+err:'')+')')); }
    return res.join(' ');
  });
  console.log('FRESH', await visit());
  // rich state
  await p.evaluate(()=>{ STAGES.forEach(s=>S.cleared[s.id]=1); S.thread=999999;S.shards=999999;S.oil=999;S.lux=S.lux||0; saveState(); });
  console.log('RICH ', await visit());
  console.log('stages', await p.evaluate(()=>STAGES.length), 'chars', await p.evaluate(()=>SINNER_KEYS.join(',')));
  // headless battle across all stages
  const r = await p.evaluate(()=>{
    const bad=[], sum={win:0,lose:0,stuck:0}; 
    for(const st of STAGES){ for(const hard of [false,true]){
      try{ const B=buildBattle({team:teamSpec(),supports:supportIds(),gifts:[],enemies:st.en.map(e=>({k:e.k,lv:e.lv}))},{seed:7});
        let g=0,nan=false; while(!B.over&&g++<60){B.startTurn();const ev=B.resolve(); for(const e of ev){ if(e.S&&e.S.some(s=>isNaN(s.hp)||isNaN(s.sp)))nan=true; }}
        if(!B.over){sum.stuck++;bad.push(st.id+' stuck');} else B.result==='win'?sum.win++:sum.lose++; if(nan)bad.push(st.id+' NaN');
      }catch(e){bad.push(st.id+' EXC '+e)} if(!hard)break; } }
    return {sum,bad:bad.slice(0,15)};
  });
  console.log('BATTLES', JSON.stringify(r));
  // gacha via UI
  await p.evaluate(()=>go('gacha')); await p.waitForTimeout(300);
  for(const n of [1,10]){ await p.click(`[data-act=pull][data-n="${n}"]`); await p.waitForTimeout(500);
    for(let i=0;i<30;i++){ const sk=await p.$('.pull [data-pc=skip], .pull .skip, [data-act=pskip]'); if(sk){await sk.click().catch(()=>{});} await p.waitForTimeout(200);
      const done=await p.evaluate(()=>!document.querySelector('.pull, .reveal, .pcin')); if(done)break; if(i===20)await p.mouse.click(640,360); }
    console.log('pull',n,'overlay left:',await p.evaluate(()=>!!document.querySelector('.pull, .reveal, .pcin')));
    await p.evaluate(()=>{document.querySelectorAll('.pull,.reveal,.pcin').forEach(e=>e.remove()); go('gacha')}); }
  // gear / mina / record / idle
  await p.evaluate(()=>go('gear')); await p.waitForTimeout(300);
  await p.evaluate(()=>go('mina')); await p.waitForTimeout(300);
  await p.evaluate(()=>go('record')); await p.waitForTimeout(300);
  await p.evaluate(()=>go('idle')); await p.waitForTimeout(300);
  // UI battle: stage 1-1 to completion
  await p.evaluate(()=>{ delete S.cleared['1-1']; S.seen['pre:1-1']=1; saveState(); go('story',{st:'1-1'}); }); await p.waitForTimeout(500);
  await p.click('[data-act=stgo]').catch(e=>console.log('stgo?',String(e).slice(0,60))); await p.waitForTimeout(500);
  for(let i=0;i<3;i++){ if(await p.$('#dialog:not([hidden])')){ await p.click('#dialog .dbox').catch(()=>{}); await p.waitForTimeout(200);} }
  await p.waitForSelector('#bwrap:not([hidden])',{timeout:8000}).catch(()=>console.log('no battle'));
  for(let i=0;i<60;i++){ await p.waitForTimeout(1000);
    const st=await p.evaluate(()=>({res:!!document.querySelector('#result:not([hidden]) [data-r]'),btn:!![...document.querySelectorAll('[data-b]')].find(x=>x.dataset.b==='go'&&!x.disabled)}));
    if(st.res)break; if(st.btn) await p.click('[data-b=go]').catch(()=>{}); }
  console.log('battle result shown:', await p.evaluate(()=>!!document.querySelector('#result [data-r]')));
  console.log('errors:', JSON.stringify(errs.slice(0,10)));
  await b.close();
})();
