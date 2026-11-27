// usage: node pw.js url out.png [w h wait]  -- optional JS via env EVAL run after load
const { chromium } = require('playwright');
(async () => {
  const [url, out, w = 1280, h = 720, wait = 1500] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto(url); await p.waitForTimeout(+wait);
  if (process.env.EVAL) { const r = await p.evaluate(process.env.EVAL); if (r !== undefined) console.log('EVAL:', JSON.stringify(r)); await p.waitForTimeout(+(process.env.WAIT2 || 600)); }
  await p.screenshot({ path: out });
  console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close();
})();
