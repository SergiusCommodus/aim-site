// Known answer tests for the AIM engine. Run: node tests/engine.test.js
const assert = require("assert"), A = require("../src/engine.js");
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, msg + ": got " + a + ", expected " + b);
// Mortgage payment: $200,000 at 6% for 30 years is $1,199.10 a month (standard amortization tables)
close(A.Fin.pmt(200000, 6, 30), 1199.10, 0.005, "payment");
// $300,000 at 7% for 30 years is $1,995.91
close(A.Fin.pmt(300000, 7, 30), 1995.91, 0.005, "payment 2");
// Zero rate loan is straight line
close(A.Fin.pmt(120000, 0, 10), 1000, 1e-9, "zero rate");
// Balance after 60 payments on $200,000 at 6% for 30 years is $186,108.71
close(A.Fin.balance(200000, 6, 30, 60), 186108.71, 0.05, "balance");
close(A.Fin.balance(200000, 6, 30, 360), 0, 0.01, "paid off");
// IRR of -100, 10, 10, 110 is exactly 10%
close(A.Fin.irr([-100, 10, 10, 110]), 0.10, 1e-9, "irr");
// Rental line items add up to cash flow, and DSCR equals NOI over debt service
const r = A.run("rental", {});
close(r.lines.filter(l => !l[2]).reduce((s, l) => s + l[1], 0), r.cfYear, 1e-6, "rental statement adds up");
close(r.dscr, r.noi / r.ds, 1e-12, "dscr");
close(r.cap, r.noi / r.inputs.price, 1e-12, "cap rate");
// At break even occupancy the rental's cash flow is zero
const be = A.run("rental", { vacancy: (1 - r.beOcc) * 100 });
close(be.cfYear, 0, 1e-6, "rental break even");
// Short term rental: months add to the year, and break even occupancy gives zero cash flow
const s = A.run("str", {});
close(s.monthly.reduce((a, m) => a + m.revenue, 0), s.gross, s.gross * 0.001, "seasonality sums to annual");
close(A.run("str", { occupancy: s.beOcc * 100 }).cfYear, 0, 0.01, "str break even occupancy");
close(A.run("str", { adr: s.beAdr }).cfYear, 0, 0.01, "str break even rate");
// Business: SDE definition and statement
const b = A.run("business", {});
close(b.sde, 610000 - 128000 - 386000 + 62000 + 14000 + 18000 + 0, 1e-9, "sde");
close(b.lines.filter(l => !l[2]).reduce((x, l) => x + l[1], 0) - (b.inputs.revenue - b.inputs.cogs - b.inputs.opex) + b.netProfit, b.cfYear, 1e-6, "business statement");
// Target price meets both targets and a slightly higher price does not
const S = { minDscr: 1.25, minCoc: 8 };
for (const t of ["rental", "str", "business"]) {
  const tp = A.targetPrice(t, {}, S), at = A.run(t, { price: tp }), above = A.run(t, { price: tp + 2000 });
  assert.ok(at.dscr >= 1.25 && at.coc >= 0.08, t + " target meets criteria");
  assert.ok(above.dscr < 1.25 || above.coc < 0.08, t + " target is the maximum");
}
console.log("All engine tests passed");
