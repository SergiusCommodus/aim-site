/* AIM Learning lessons and AIMBot. AIMBot never invents numbers: every figure it quotes comes from the engine. */
var LEARN = (function () {
  "use strict";
  var M = AIM.money, P = AIM.pct, R = AIM.ratio;

  function first(ctx, type) { return ctx.opps.filter(function (o) { return !type || o.type === type; })[0]; }
  function debtList(ctx) { return (ctx.accounts || []).filter(function (a) { return a.type === "Liability" && +a.value > 0; }).map(function (a) { return { name: a.name, balance: +a.value || 0, rate: +a.rate || 0, min: +a.min || 0 }; }); }
  function projFor(ctx) {
    var pl = ctx.plan || {}, b = AIM.budget(ctx.budget), inv = (ctx.accounts || []).filter(function (a) { return a.type === "Investments" || a.type === "Retirement"; }).reduce(function (s, a) { return s + (+a.value || 0); }, 0);
    var start = pl.start == null ? inv : +pl.start, monthly = pl.monthly == null ? Math.max(0, Math.round(b.fcf)) : +pl.monthly, spend = pl.spend == null ? Math.round(b.expenses) : +pl.spend, ret = pl.ret == null ? 5 : +pl.ret;
    var r = AIM.projection({ start: start, monthly: monthly, ret: ret, years: pl.years || 30, expenses: spend, swr: pl.swr || 4 });
    r.start = start; r.monthly = monthly; r.spend = spend; r.ret = ret; return r;
  }

  var LESSONS = [
    { id: "cap", track: "Real estate", title: "Cap rate", mins: 4,
      summary: "How much a property earns relative to its price, before any loan.",
      body: ["Cap rate measures a property's yield as if you paid all cash. It strips out financing, so you can compare two buildings on equal terms no matter how each buyer pays for them.",
        "A higher cap rate means more income per dollar of price, but it often comes with more risk, an older building, or a weaker location. Compare cap rates to similar properties in the same market rather than to a fixed rule."],
      formula: "Cap rate = Net operating income ÷ Purchase price",
      ex: function (ctx) { var o = first(ctx, "rental"); if (!o) return ""; var r = AIM.run("rental", o.inputs); return o.name + " produces " + M(r.noi) + " of net operating income on a " + M(r.inputs.price) + " price, a cap rate of " + P(r.cap) + "."; }, open: "rental" },
    { id: "coc", track: "Real estate", title: "Cash on cash return", mins: 4,
      summary: "The return on the cash you actually put in.",
      body: ["Cash on cash return divides the first year's cash flow after the mortgage by the total cash you invested: down payment, closing costs, and initial repairs.",
        "It is the number most investors use to compare a deal to other uses of the same money. It ignores appreciation and loan paydown, so it understates the full return but shows what lands in your account."],
      formula: "Cash on cash = Annual cash flow ÷ Total cash invested",
      ex: function (ctx) { var o = first(ctx, "rental"); if (!o) return ""; var r = AIM.run("rental", o.inputs); return o.name + " needs " + M(r.cash) + " to close and returns " + M(r.cfYear) + " a year, which is " + P(r.coc) + " cash on cash."; }, open: "rental" },
    { id: "dscr", track: "Real estate", title: "Debt service coverage", mins: 5,
      summary: "Whether the income can pay the loan, the number lenders check first.",
      body: ["Debt service coverage ratio, or DSCR, compares net operating income to the annual loan payments. A ratio of 1.00 means the property earns exactly enough to pay the mortgage and nothing more.",
        "Most lenders want at least 1.20 to 1.25 on investment property. Below 1.00, the property cannot carry its own debt and you are paying it from your own pocket."],
      formula: "DSCR = Net operating income ÷ Annual debt service",
      ex: function (ctx) { var o = first(ctx, "rental"); if (!o) return ""; var r = AIM.run("rental", o.inputs); return o.name + " covers its loan " + R(r.dscr) + " times. Your target is " + ctx.settings.minDscr.toFixed(2) + "."; }, open: "rental" },
    { id: "reserves", track: "Real estate", title: "Vacancy, repairs, and reserves", mins: 5,
      summary: "The quiet costs that make most first deals look better than they are.",
      body: ["Every rental has empty months, broken water heaters, and a roof that eventually needs replacing. Good underwriting budgets for them before they happen.",
        "A common starting point is 5% to 8% vacancy, 5% to 8% of rent for repairs, and 5% to 10% for capital reserves. Older properties and lower rent areas usually need more."],
      formula: "Effective income = Gross rent × (1 − Vacancy)",
      ex: function (ctx) { var o = first(ctx, "rental"); if (!o) return ""; var i = AIM.run("rental", o.inputs).inputs; return o.name + " assumes " + i.vacancy + "% vacancy, " + i.maint + "% repairs, and " + i.capex + "% capital reserve."; }, open: "rental" },
    { id: "be", track: "Real estate", title: "Break even occupancy", mins: 3,
      summary: "How full the property must be just to cover every cost.",
      body: ["Break even occupancy is the share of potential rent you must collect to pay operating costs and the mortgage. The lower it is, the more room you have for bad months.",
        "Under 75% is comfortable for a long term rental. Above 85% means a single vacancy or a large repair puts you underwater for the year."],
      formula: "Break even = (Fixed costs + Reserves + Debt service) ÷ Gross potential income after management",
      ex: function (ctx) { var o = first(ctx, "rental"); if (!o) return ""; var r = AIM.run("rental", o.inputs); return o.name + " breaks even at " + P(r.beOcc, 0) + " occupancy."; }, open: "rental" },
    { id: "str", track: "Short term rentals", title: "Occupancy and nightly rate", mins: 5,
      summary: "The two numbers that drive almost every vacation rental.",
      body: ["Short term rental revenue is booked nights times the average nightly rate, plus cleaning fees. Small changes in either number move cash flow far more than they would on a long term lease.",
        "Use trailing twelve month data from comparable listings, not the peak season. Then test a weak year: AIM's downside case drops occupancy 12 points and rates 8%."],
      formula: "Revenue = 365 × Occupancy × Nightly rate + Cleaning fees",
      ex: function (ctx) { var o = first(ctx, "str"); if (!o) return ""; var r = AIM.run("str", o.inputs); return o.name + " books about " + Math.round(r.nights) + " nights a year at " + M(r.inputs.adr) + ", and breaks even at " + P(r.beOcc, 0) + " occupancy."; }, open: "str" },
    { id: "strltr", track: "Short term rentals", title: "Short term or long term", mins: 4,
      summary: "When furnishing and hosting is worth the extra work.",
      body: ["A short term rental can earn more, but it carries furnishing costs, cleaning, platform fees, higher insurance, and local rules that can change.",
        "Always model the same property as a long term rental. If the short term plan only wins by a small margin, the steadier lease is often the better business."],
      formula: "Premium = Short term cash flow − Long term cash flow",
      ex: function (ctx) { var o = first(ctx, "str"); if (!o) return ""; var r = AIM.run("str", o.inputs); return "For " + o.name + ", short term cash flow is " + M(r.cfYear) + " a year versus " + M(r.ltr.cfYear) + " as a long term rental."; }, open: "str" },
    { id: "sde", track: "Small business", title: "Seller discretionary earnings", mins: 6,
      summary: "What one owner operator actually takes home from a small business.",
      body: ["Seller discretionary earnings, or SDE, starts with reported profit and adds back the owner's pay, personal expenses run through the business, one time costs, depreciation, and interest.",
        "SDE is the standard way small businesses are priced. Once you own it, you still need to pay yourself or a manager, so AIM subtracts your salary before testing the loan."],
      formula: "SDE = Net profit + Owner pay + Add backs + Depreciation + Interest",
      ex: function (ctx) { var o = first(ctx, "business"); if (!o) return ""; var r = AIM.run("business", o.inputs); return o.name + " reports " + M(r.netProfit) + " of profit and " + M(r.sde) + " of SDE."; }, open: "business" },
    { id: "mult", track: "Small business", title: "Valuation multiples", mins: 4,
      summary: "Why most main street businesses sell for two to four times earnings.",
      body: ["Small businesses are usually priced as a multiple of SDE. Main street deals often trade between 2x and 3.5x. Recurring revenue, a strong manager, and clean books push the multiple up.",
        "A high multiple is not wrong by itself, but it shrinks your margin for error. Make sure the business can still cover its loans if revenue falls 10%."],
      formula: "Multiple = Purchase price ÷ SDE",
      ex: function (ctx) { var o = first(ctx, "business"); if (!o) return ""; var r = AIM.run("business", o.inputs); return o.name + " is priced at " + r.multiple.toFixed(2) + "x SDE."; }, open: "business" },
    { id: "addbacks", track: "Small business", title: "Verifying add backs", mins: 4,
      summary: "Where seller numbers most often get optimistic.",
      body: ["Add backs are expenses the seller says you will not have. Some are real, like a personal car on the books. Others are wishful, like wages for work that still needs doing.",
        "Ask for bank statements and three years of tax returns, and match every add back to a document. If an add back cannot be proven, take it out of the model."],
      formula: "Verified SDE = SDE − Unproven add backs",
      ex: function (ctx) { var o = first(ctx, "business"); if (!o) return ""; var i = AIM.run("business", o.inputs).inputs; return o.name + " claims " + M(i.addbacks) + " of discretionary and one time add backs."; }, open: "business" },
    { id: "efund", track: "Personal finance", title: "Your emergency reserve", mins: 3,
      summary: "Why AIM holds back cash before it tells you what you can buy.",
      body: ["An emergency reserve covers living costs if income stops. Three to six months of expenses is a common target. Owners of rentals or businesses usually want the higher end.",
        "AIM subtracts your reserve from your cash before measuring whether you can afford a deal, so a purchase never quietly spends your safety net."],
      formula: "Reserve = Monthly expenses × Months of coverage",
      ex: function (ctx) { return "Your reserve target is " + M(ctx.reserve) + ", which is " + ctx.settings.reserveMonths + " months of expenses."; }, open: "budget" },
    { id: "ready", track: "Personal finance", title: "Savings rate and readiness", mins: 4,
      summary: "How quickly your budget turns into your next down payment.",
      body: ["Savings rate is the share of income left after expenses. It is the single biggest lever on how soon you can buy an asset.",
        "Investment readiness compares the cash a deal needs with the cash you have after your reserve. When there is a gap, your monthly free cash flow tells you how long it takes to close."],
      formula: "Months to ready = (Cash needed − Available cash) ÷ Monthly free cash flow",
      ex: function (ctx) { var b = AIM.budget(ctx.budget); return "You save " + P(b.savingsRate, 0) + " of income, or " + M(b.fcf) + " a month, with " + M(ctx.available) + " available after your reserve."; }, open: "budget" },
    { id: "debt", track: "Planning", title: "Avalanche or snowball", mins: 4,
      summary: "Two ways to pay off several debts, and what each one costs.",
      body: ["Both methods pay every minimum, then send any extra money to one target debt. When that debt is gone, its payment rolls into the next one, so the total you pay each month never shrinks.",
        "Avalanche targets the highest interest rate first, which always costs the least interest. Snowball targets the smallest balance first, which closes accounts sooner and can keep you motivated. The gap between them is often smaller than people expect, so pick the one you will stick with."],
      formula: "Monthly interest = Balance × Annual rate ÷ 12",
      ex: function (ctx) { var d = debtList(ctx); if (!d.length) return ""; var pl = ctx.plan || {}, av = AIM.debtPlan(d, pl.extra || 0, "avalanche"), sb = AIM.debtPlan(d, pl.extra || 0, "snowball"); if (!av.feasible) return "Your current payments do not cover the interest on every balance, so neither method finishes. Raise the payment in the planner."; return "With " + M(pl.extra || 0) + " extra a month, avalanche clears your debts in " + av.months + " months with " + M(av.totalInterest) + " of interest. Snowball takes " + sb.months + " months and " + M(sb.totalInterest) + "."; }, open: "planner" },
    { id: "fi", track: "Planning", title: "Your independence number", mins: 5,
      summary: "How much you need invested to live on the returns, and how long it takes.",
      body: ["Financial independence means your investments can pay for your life. A common rule of thumb is the 4% withdrawal rate: a portfolio 25 times your yearly spending has historically lasted 30 years or more in most periods.",
        "Two levers move the date more than anything else: how much you invest each month and how much you plan to spend. Return matters too, but you control it least. AIM uses returns after inflation so every figure is in today's dollars."],
      formula: "Independence number = Yearly spending ÷ Withdrawal rate",
      ex: function (ctx) { var p = projFor(ctx); if (!(p.target > 0)) return ""; return "At " + M(p.spend) + " a month, your number is " + M(p.target) + ". Investing " + M(p.monthly) + " a month from " + M(p.start) + " at a " + p.ret + "% real return, you reach it in " + (p.fiYears == null ? "more than 100 years" : p.fiYears.toFixed(1) + " years") + "."; }, open: "planner" },
    { id: "tax", track: "Taxes", title: "Depreciation basics", mins: 4,
      summary: "Why rentals can show a tax loss while paying you cash.",
      body: ["The IRS lets owners of residential rentals deduct the cost of the building, not the land, over 27.5 years. That deduction lowers taxable income even though no cash leaves your account.",
        "Depreciation is usually recaptured when you sell, and rules on using losses depend on your income and involvement. Use this to understand your numbers, and confirm your situation with a tax professional."],
      formula: "Annual depreciation ≈ Building value ÷ 27.5",
      ex: function (ctx) { var o = first(ctx, "rental"); if (!o) return ""; var b = AIM.run("rental", o.inputs).inputs.price * 0.8; return "If 80% of " + o.name + "'s price is the building, depreciation would be about " + M(b / 27.5) + " a year."; }, open: "rental" }
  ];

  var GLOSSARY = [
    { re: /\bdscr\b|debt service coverage|debt coverage|coverage ratio/, id: "dscr" },
    { re: /cap rate|capitalization/, id: "cap" },
    { re: /cash on cash|coc\b/, id: "coc" },
    { re: /break ?even/, id: "be" },
    { re: /\bsde\b|seller discretionary|discretionary earnings/, id: "sde" },
    { re: /multiple|valuation/, id: "mult" },
    { re: /add ?backs?/, id: "addbacks" },
    { re: /vacancy|reserve for repairs|capex|capital reserve/, id: "reserves" },
    { re: /occupancy|nightly rate|\badr\b/, id: "str" },
    { re: /emergency|reserve/, id: "efund" },
    { re: /savings rate|readiness/, id: "ready" },
    { re: /depreciation|tax/, id: "tax" },
    { re: /\bnoi\b|net operating income/, id: "noi" },
    { re: /\birr\b|internal rate|annualized/, id: "irr" }
  ];
  var EXTRA = {
    noi: "Net operating income is everything the asset earns minus every operating cost, before the loan. It is the income the property or business produces on its own, no matter how it is financed.",
    irr: "Internal rate of return is the annualized return over a full hold, counting yearly cash flow, loan paydown, appreciation, and the sale. AIM models a five year hold with 6% selling costs."
  };

  function explain(id, ctx, opp) {
    var l = LESSONS.filter(function (x) { return x.id === id; })[0];
    var text = l ? l.body[0] : EXTRA[id];
    var out = "<p>" + text + "</p>";
    if (l && l.formula) out += "<p><b>" + l.formula + "</b></p>";
    if (opp) {
      var r = AIM.run(opp.type, opp.inputs);
      var v = { dscr: "Coverage on " + opp.name + " is <b>" + R(r.dscr) + "</b>.", cap: "Cap rate on " + opp.name + " is <b>" + P(r.cap) + "</b>.",
        coc: "Cash on cash on " + opp.name + " is <b>" + P(r.coc) + "</b>.", noi: "Net operating income on " + opp.name + " is <b>" + M(r.noi) + "</b> a year.",
        be: r.beOcc != null && opp.type !== "business" ? opp.name + " breaks even at <b>" + P(r.beOcc, 0) + "</b> occupancy." : "",
        irr: r.irr != null ? "The five year return on " + opp.name + " is <b>" + P(r.irr) + "</b> a year." : "",
        sde: opp.type === "business" ? opp.name + " has <b>" + M(r.sde) + "</b> of SDE." : "", mult: opp.type === "business" ? opp.name + " trades at <b>" + r.multiple.toFixed(2) + "x</b> SDE." : "" }[id];
      if (v) out += "<p>" + v + "</p>";
    } else if (l && l.ex) { var e = l.ex(ctx); if (e) out += "<p>" + e + "</p>"; }
    return out;
  }

  function list(items) { return "<ul>" + items.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>"; }

  function answer(q, ctx, opp) {
    var s = q.toLowerCase().trim();
    var asking = /^(what|whats|what's|explain|define|how does|how is|meaning|tell me about)\b|\bmean\b|\bdefinition\b/.test(s);
    var g = GLOSSARY.filter(function (x) { return x.re.test(s); })[0];
    if (g && asking) return explain(g.id, ctx, opp);

    var evals = ctx.opps.filter(function (o) { return o.status === "Evaluating"; });
    function need() { return "<p>Pick an opportunity in the menu above and I will answer using its numbers.</p>"; }

    if (/compare|which (deal|one|opportunity)|best (deal|opportunity|option)|rank/.test(s)) {
      if (!evals.length) return "<p>You have no opportunities under evaluation yet. Start one from Opportunities.</p>";
      var ranked = evals.map(function (o) { return { o: o, sc: AIM.score(o.type, o.inputs, ctx) }; }).sort(function (a, b) { return b.sc.total - a.sc.total; });
      return "<p>Ranked by AIM Score against your targets:</p>" + list(ranked.map(function (x) { return "<b>" + x.o.name + "</b>: " + x.sc.total + " (" + x.sc.grade + "), " + M(x.sc.r.cfYear) + " a year on " + M(x.sc.r.cash) + " invested"; })) +
        "<p>" + ranked[0].o.name + " leads. Check its downside case before acting.</p>";
    }
    if (/drive|matter|sensitiv|biggest|most impact|lever|assumption/.test(s)) {
      if (!opp) return need();
      var sn = AIM.sensitivity(opp.type, opp.inputs).slice(0, 3);
      return "<p>The three assumptions that move " + opp.name + " the most:</p>" + list(sn.map(function (x) { return "<b>" + x.label + "</b> (" + x.swing + ") changes yearly cash flow by about " + M(x.impact); })) + "<p>Verify these first. They matter more than everything else combined.</p>";
    }
    if (/risk|worry|red flag|concern|wrong|problem|issue/.test(s)) {
      if (!opp) return need();
      var f = AIM.score(opp.type, opp.inputs, ctx).flags;
      if (!f.length) return "<p>No risk flags on " + opp.name + " at current assumptions. That only means the inputs pass. The inputs still need to be verified.</p>";
      return "<p>Flags on " + opp.name + ":</p>" + list(f.map(function (x) { return "<b>" + x.title + ".</b> " + x.action; }));
    }
    if (/offer|what should i pay|price|negotiat|target|pay for/.test(s)) {
      if (!opp) return need();
      var t = AIM.targetPrice(opp.type, opp.inputs, ctx.settings), p = AIM.run(opp.type, opp.inputs).inputs.price;
      if (t == null) return "<p>No price in a reasonable range gets " + opp.name + " to a " + ctx.settings.minDscr.toFixed(2) + " coverage and " + ctx.settings.minCoc + "% return. The income or terms need to change.</p>";
      return "<p>At your targets of " + ctx.settings.minDscr.toFixed(2) + " coverage and " + ctx.settings.minCoc + "% cash on cash, the most you should pay for " + opp.name + " is about <b>" + M(t) + "</b>. The asking price is " + M(p) + (t >= p ? ", so the deal already meets your criteria." : ", a gap of " + M(p - t) + ".") + "</p>";
    }
    if (/ready|afford|enough (cash|money)|can i buy|down payment/.test(s)) {
      if (!opp) return need();
      var rr = AIM.run(opp.type, opp.inputs), b = AIM.budget(ctx.budget), gap = rr.cash - ctx.available;
      if (gap <= 0) return "<p>Yes. " + opp.name + " needs " + M(rr.cash) + " and you have " + M(ctx.available) + " available after your " + M(ctx.reserve) + " reserve. You would keep " + M(-gap) + " beyond it.</p>";
      return "<p>Not yet. " + opp.name + " needs " + M(rr.cash) + " and you have " + M(ctx.available) + " after your reserve, a gap of <b>" + M(gap) + "</b>." + (b.fcf > 0 ? " At " + M(b.fcf) + " a month of free cash flow, that is about " + Math.ceil(gap / b.fcf) + " months." : " Your budget has no free cash flow right now.") + "</p>";
    }
    if (/downside|worst|recession|stress|bad year|scenario/.test(s)) {
      if (!opp) return need();
      var sc = AIM.scenarios(opp.type, opp.inputs);
      return "<p>" + opp.name + " across three cases:</p>" + list(sc.map(function (x) { return "<b>" + x.name + "</b>: " + M(x.r.cfYear) + " a year, coverage " + R(x.r.dscr) + (x.note ? " (" + x.note.toLowerCase() + ")" : ""); }));
    }
    if (/summar|overview|thesis|tell me about|how does .* look|how is/.test(s)) {
      if (!opp) return need();
      var sc2 = AIM.score(opp.type, opp.inputs, ctx), t2 = AIM.targetPrice(opp.type, opp.inputs, ctx.settings);
      return "<p><b>" + opp.name + "</b> scores " + sc2.total + " (" + sc2.grade + "). It needs " + M(sc2.r.cash) + " and produces " + M(sc2.r.cfYear) + " a year, a " + P(sc2.r.coc) + " cash on cash return with " + R(sc2.r.dscr) + " coverage.</p><p>" + AIM.recommendation(sc2, t2) + "</p>";
    }
    if (/debt|pay ?off|credit card|student loan|car loan|avalanche|snowball|owe/.test(s)) {
      var dl = debtList(ctx); if (!dl.length) return "<p>You have no debts recorded. If you have any, add them in the Planner and I will build a payoff plan.</p>";
      var pl = ctx.plan || {}, av = AIM.debtPlan(dl, pl.extra || 0, "avalanche"), sb = AIM.debtPlan(dl, pl.extra || 0, "snowball"), tot = dl.reduce(function (a, d) { return a + d.balance; }, 0);
      if (!av.feasible) return "<p>You owe " + M(tot) + ". Your payments do not cover the interest on every balance, so the debt never gets paid off. Raise the extra payment in the Planner.</p>";
      return "<p>You owe <b>" + M(tot) + "</b> across " + dl.length + " balance" + (dl.length > 1 ? "s" : "") + ". Paying " + M(av.payment) + " a month:</p>" + list(["<b>Avalanche</b>: debt free in " + av.months + " months, " + M(av.totalInterest) + " of interest", "<b>Snowball</b>: debt free in " + sb.months + " months, " + M(sb.totalInterest) + " of interest"]) + "<p>Pay off " + av.debts[0].name + " first to save the most interest.</p>";
    }
    if (/retire|independen|\bfire\b|financial freedom|financially free|how long until|my number/.test(s)) {
      var pj = projFor(ctx); if (!(pj.target > 0)) return "<p>Add your monthly expenses in Budget and goals and I can work out your independence number.</p>";
      return "<p>Your independence number is <b>" + M(pj.target) + "</b>, " + 100 / (ctx.plan && ctx.plan.swr || 4) + " times " + M(pj.spend * 12) + " of yearly spending. Investing " + M(pj.monthly) + " a month from " + M(pj.start) + " at a " + pj.ret + "% return after inflation, you reach it in " + (pj.fiYears == null ? "more than 100 years" : "<b>" + pj.fiYears.toFixed(1) + " years</b>") + ".</p><p>The Planner shows how the date moves when you change savings or spending.</p>";
    }
    if (/budget|spend|expense|saving/.test(s)) {
      var bb = AIM.budget(ctx.budget);
      return "<p>You bring in " + M(bb.income) + " a month and spend " + M(bb.expenses) + ", leaving " + M(bb.fcf) + " of free cash flow. That is a " + P(bb.savingsRate, 0) + " savings rate.</p>";
    }
    if (/net worth|worth|wealth/.test(s)) return "<p>Your net worth is <b>" + M(ctx.netWorth) + "</b>, including " + M(ctx.ownedEquity) + " of equity in assets you own.</p>";
    if (g) return explain(g.id, ctx, opp);
    return "<p>I answer questions about your numbers. Try one of these:</p>" + list(["What drives this deal?", "What should I offer?", "Am I ready to buy it?", "What are the risks?", "How do I pay off my debt?", "When can I retire?", "Explain DSCR", "Compare my deals"]);
  }

  return { LESSONS: LESSONS, answer: answer };
})();
