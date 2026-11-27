const vm=require('vm'),fs=require('fs');
const src=['data.js','engine.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n')+'\nglobalThis.__A={STAGES,CHAPTERS,ENEMIES,LUX,MIRROR_FLOORS,PASS};';
vm.runInThisContext(src); const A=globalThis.__A;
console.log(A.CHAPTERS.map(c=>c.id+' '+c.n+' '+c.theme+' '+c.lv).join('\n'));
console.log(A.STAGES.map(s=>s.id+':'+s.n+':'+s.lv+(s.boss?'B':'')+':'+s.en.map(e=>e.k+e.lv).join(',')).join('\n'));
console.log(Object.keys(A.ENEMIES).map(k=>k+'('+(A.ENEMIES[k].boss?'B':'')+A.ENEMIES[k].art+','+A.ENEMIES[k].hp+')').join(' '));
console.log(JSON.stringify(A.MIRROR_FLOORS).slice(0,600));

console.log(A.LUX.map(d=>d.id+': '+d.rows.map(r=>r.lv+'→'+JSON.stringify(r.r)+'['+r.en.length+']').join(' ')).join('\n'));
console.log(A.MIRROR_FLOORS.map(f=>f.n+' '+f.lv+' '+f.boss).join(' | '));
