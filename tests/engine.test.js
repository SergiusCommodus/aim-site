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
// Debt payoff: $10,000 at 12% with $500 a month takes 23 months (n = -ln(1 - rB/P) / ln(1 + r) = 22.4)
const d1 = A.debtPlan([{ name: "Card", balance: 10000, rate: 12, min: 500 }], 0, "avalanche");
assert.strictEqual(d1.months, 23, "single debt months");
close(d1.totalInterest, 22 * 500 + (d1.series[22].balance * 1.01) - 10000, 1e-6, "single debt interest");
// Avalanche never pays more interest than snowball, and payments that do not cover interest are flagged
const mix = [{ name: "Card", balance: 4000, rate: 24.9, min: 120 }, { name: "Auto", balance: 12000, rate: 6.9, min: 380 }, { name: "Store card", balance: 900, rate: 18, min: 35 }];
const av = A.debtPlan(mix, 300, "avalanche"), sb = A.debtPlan(mix, 300, "snowball");
assert.ok(av.totalInterest <= sb.totalInterest + 1e-9, "avalanche interest is lowest");
assert.strictEqual(sb.debts[0].name, "Store card", "snowball clears the smallest balance first");
assert.strictEqual(av.debts[0].name, "Card", "avalanche clears the highest rate first");
assert.strictEqual(A.debtPlan([{ balance: 10000, rate: 24, min: 150 }], 0).feasible, false, "payment below interest never pays off");
// Projection: $500 a month at 6% for 30 years grows to $502,257.52 (future value of an ordinary annuity)
const pj = A.projection({ start: 0, monthly: 500, ret: 6, years: 30, expenses: 4000, swr: 4 });
close(pj.end, 502257.52, 0.01, "annuity future value");
close(pj.target, 1200000, 1e-9, "independence target is 25 times yearly spending");
console.log("All engine tests passed");
