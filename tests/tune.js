const { A, runStage } = require('./sim.js');
const ke = +process.argv[2] || 5, hpA = process.argv[3] ? +process.argv[3] : null, pwE = process.argv[4] ? +process.argv[4] : null;
A.BAL.kE = ke; if (hpA) A.BAL.hpLvA = hpA; if (pwE) A.BAL.pwLvE = pwE;
const pick = ['1-1','1-3','1-5','2-3','2-5','3-3','3-5'];
for (const st of A.STAGES.filter(s => pick.includes(s.id))) {
  const lv = st.lv;
  let w = 0, T = 0, hp = 0, N = 40, al = 0;
  for (let i = 0; i < N; i++) { const r = runStage(st, lv, 500 + i); if (r.result === 'win') { w++; hp += r.hpFrac; al += r.alive; } T += r.turns; }
  console.log(`${st.id} lv${lv} win ${Math.round(w/N*100)}% turns ${(T/N).toFixed(1)} hpLeft ${(w?hp/w*100:0).toFixed(0)}% alive ${(w?al/w:0).toFixed(1)}`);
}
