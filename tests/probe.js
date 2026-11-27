const fs=require('fs'),vm=require('vm');
vm.runInThisContext(['data.js','engine.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n')+'\nglobalThis.__A={buildBattle,mulberry32,STAGES};');
const A=globalThis.__A;
const st=A.STAGES.find(s=>s.id===(process.argv[2]||'1-5')), lv=+process.argv[3]||5;
const rng=A.mulberry32(7);
const team=['ash','miel','nemu','bell','gold','leonora'].map(sid=>({sid,ik:sid+1,lv,sync:1}));
const b=A.buildBattle({team,supports:[],gifts:[],enemies:st.en.map(e=>({k:e.k,lv:e.lv}))},{rng});
let prevD=0,prevT=0;
for(let t=0;t<14&&!b.over;t++){
  b.startTurn();
  b.resolve();
  const ae=b.alive('A').length;
  console.log('T'+b.turn,'dmgDealt',b.stat.dmg-prevD,'taken',b.stat.taken-prevT,'alliesAlive',ae,'enemyHP',b.side('E').map(e=>e.hp+'/'+e.maxHp).join(' '),'sp',b.side('A').map(a=>a.sp).join(','));
  prevD=b.stat.dmg;prevT=b.stat.taken;
}
console.log(b.result, 'ally maxHP', b.side('A').map(a=>a.maxHp).join(','));
