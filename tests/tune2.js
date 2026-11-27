const { A, runStage } = require('./sim.js');
for (const [id, lvs] of [['3-5',[16,18]],['1-5',[5,6]],['2-5',[10,11]],['1-2',[2]],['2-1',[6]]]) {
  const st = A.STAGES.find(s => s.id === id);
  for (const lv of lvs) {
    let w = 0, T = 0, hp = 0, N = 50, al = 0;
    for (let i = 0; i < N; i++) { const r = runStage(st, lv, 900 + i); if (r.result === 'win') { w++; hp += r.hpFrac; al += r.alive; } T += r.turns; }
    console.log(`${id} lv${lv} win ${Math.round(w/N*100)}% turns ${(T/N).toFixed(1)} hpLeft ${(w?hp/w*100:0).toFixed(0)}% alive ${(w?al/w:0).toFixed(1)}`);
  }
}
// with defense & tier3
const st = A.STAGES.find(s => s.id === '3-5');
let w = 0; for (let i = 0; i < 50; i++) { if (runStage(st, 16, 77 + i, { tier: 3, defense: true }).result === 'win') w++; } console.log('3-5 lv16 tier3+def win', w * 2 + '%');
