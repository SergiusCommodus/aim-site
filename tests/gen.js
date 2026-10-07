// Emits engine outputs for random deals so an independent implementation can check them.
const A = require("../src/engine.js");
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const R = (a, b) => a + (b - a) * rnd();
const out = [];
for (let n = 0; n < 300; n++) {
  const rental = { price: R(80e3, 900e3), closing: R(0, 20e3), repairs: R(0, 40e3), down: R(5, 100), rate: R(0, 11), term: [15, 20, 30][n % 3],
    rent: R(600, 7000), other: R(0, 200), vacancy: R(0, 15), rentGrowth: R(0, 5), taxes: R(500, 12e3), insurance: R(300, 6e3), hoa: R(0, 400), utilities: R(0, 200), otherExp: R(0, 100),
    mgmt: R(0, 12), maint: R(0, 12), capex: R(0, 12), expGrowth: R(0, 5), appreciation: R(-2, 6) };
  const str = { price: R(100e3, 900e3), closing: R(0, 20e3), furnishing: R(0, 50e3), repairs: R(0, 20e3), down: R(10, 40), rate: R(3, 10), term: 30, adr: R(80, 600), occupancy: R(20, 90), avgStay: R(1.5, 7),
    cleanFee: R(0, 250), cleanCost: R(0, 200), platform: R(0, 16), mgmt: R(0, 30), supplies: R(0, 15), taxes: R(500, 10e3), insurance: R(500, 6e3), hoa: R(0, 600), utilities: R(0, 500), internet: R(0, 120), otherExp: R(0, 150), maint: R(0, 10), capex: R(0, 10), ltrRent: R(800, 5000), season: ["flat","beach","mountain","urban"][n % 4] };
  const biz = { price: R(100e3, 3e6), revenue: R(200e3, 4e6), closing: R(0, 50e3), workingCapital: R(0, 100e3), buyerSalary: R(0, 150e3), capexReserve: R(0, 50e3), down: R(5, 50), sellerPct: R(0, 30), sellerRate: R(0, 10), sellerTerm: R(1, 10), bankRate: R(5, 13), bankTerm: [7, 10, 25][n % 3],
    ownerComp: R(0, 150e3), addbacks: R(0, 50e3), da: R(0, 50e3), interest: R(0, 30e3) };
  biz.cogs = biz.revenue * R(0.05, 0.5); biz.opex = biz.revenue * R(0.2, 0.6);
  const r = A.run("rental", rental), s = A.run("str", str), b = A.run("business", biz);
  const debts = Array.from({ length: 1 + (n % 5) }, (_, k) => ({ name: "D" + k, balance: R(200, 40e3), rate: R(0, 29), min: R(25, 600) }));
  const extra = R(0, 800), method = n % 2 ? "snowball" : "avalanche", dp = A.debtPlan(debts, extra, method);
  const pin = { start: R(0, 400e3), monthly: R(0, 5000), ret: R(-2, 10), years: 1 + (n % 40), expenses: R(1500, 12e3), swr: R(3, 5) }, pj = A.projection(pin);
  out.push({ debts, extra, method, d: { months: dp.months, interest: dp.totalInterest, order: dp.debts.map(x => x.name) }, pin, p: { end: pj.end, target: pj.target, fiMonth: pj.fiMonth },
    rental, r: { pmt: r.pmt, noi: r.noi, cf: r.cfYear, cash: r.cash, cap: r.cap, coc: r.coc, dscr: isFinite(r.dscr) ? r.dscr : null, beOcc: r.beOcc, irr: r.irr, bal5: r.projection[4].balance, cf5: r.projection[4].cf },
    str, s: { noi: s.noi, cf: s.cfYear, cash: s.cash, beOcc: isFinite(s.beOcc) ? s.beOcc : null, beAdr: s.beAdr, gross: s.gross, ltrCf: s.ltr.cfYear },
    biz, b: { sde: b.sde, ds: b.ds, dscr: isFinite(b.dscr) ? b.dscr : null, cf: b.cfYear, cash: b.cash, multiple: isFinite(b.multiple) ? b.multiple : null } });
}
process.stdout.write(JSON.stringify(out));
