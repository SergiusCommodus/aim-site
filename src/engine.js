/* AIM financial engine. Pure functions, no DOM. The model calculates; the UI and AIMBot only explain. */
var AIM = (function () {
  "use strict";

  function num(v, d) { v = +v; return isFinite(v) ? v : (d || 0); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var Fin = {
    pmt: function (loan, ratePct, years) {
      var r = ratePct / 1200, n = Math.round(years * 12);
      if (loan <= 0 || n <= 0) return 0;
      return r === 0 ? loan / n : loan * r / (1 - Math.pow(1 + r, -n));
    },
    balance: function (loan, ratePct, years, months) {
      if (loan <= 0) return 0;
      var r = ratePct / 1200, n = Math.round(years * 12), p = Fin.pmt(loan, ratePct, years);
      months = Math.min(months, n);
      if (r === 0) return Math.max(0, loan - p * months);
      return Math.max(0, loan * Math.pow(1 + r, months) - p * (Math.pow(1 + r, months) - 1) / r);
    },
    npv: function (rate, flows) {
      var s = 0;
      for (var t = 0; t < flows.length; t++) s += flows[t] / Math.pow(1 + rate, t);
      return s;
    },
    irr: function (flows) {
      var lo = -0.99, hi = 2, flo = Fin.npv(lo, flows), fhi = Fin.npv(hi, flows);
      if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) return null;
      for (var i = 0; i < 120; i++) {
        var mid = (lo + hi) / 2, fm = Fin.npv(mid, flows);
        if (fm * flo > 0) { lo = mid; flo = fm; } else { hi = mid; }
      }
      return (lo + hi) / 2;
    },
    /* largest x in [lo,hi] where ok(x) holds; ok must be true at low x and false at high x */
    maxWhere: function (ok, lo, hi) {
      if (!ok(lo)) return null;
      if (ok(hi)) return hi;
      for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; }
      return lo;
    },
    /* smallest x in [lo,hi] where ok(x) holds; ok false at low x, true at high x */
    minWhere: function (ok, lo, hi) {
      if (!ok(hi)) return null;
      if (ok(lo)) return lo;
      for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (ok(m)) hi = m; else lo = m; }
      return hi;
    }
  };

  /* ---------- Long term rental ---------- */
  var RENTAL_DEFAULTS = {
    price: 285000, closing: 8500, repairs: 6000, down: 25, rate: 7, term: 30,
    rent: 2450, other: 0, vacancy: 6, rentGrowth: 3,
    taxes: 4100, insurance: 1700, hoa: 0, utilities: 0, otherExp: 0,
    mgmt: 8, maint: 5, capex: 5, expGrowth: 3, appreciation: 3
  };

  function rental(raw) {
    var i = {}; for (var k in RENTAL_DEFAULTS) i[k] = num(raw[k], RENTAL_DEFAULTS[k]);
    var downAmt = i.price * i.down / 100, loan = i.price - downAmt;
    var pm = Fin.pmt(loan, i.rate, i.term), ds = pm * 12;
    var gross = (i.rent + i.other) * 12, vac = gross * i.vacancy / 100, egi = gross - vac;
    var mgmt = egi * i.mgmt / 100, maint = gross * i.maint / 100, capex = gross * i.capex / 100;
    var fixed = i.taxes + i.insurance + (i.hoa + i.utilities + i.otherExp) * 12;
    var opex = fixed + mgmt + maint + capex, noi = egi - opex, cf = noi - ds;
    var cash = downAmt + i.closing + i.repairs;
    var beDen = gross * (1 - i.mgmt / 100);
    var beOcc = beDen > 0 ? (fixed + maint + capex + ds) / beDen : Infinity;

    /* five year hold */
    var years = [], bal = loan, flows = [-cash];
    for (var y = 1; y <= 5; y++) {
      var g = Math.pow(1 + i.rentGrowth / 100, y - 1), e = Math.pow(1 + i.expGrowth / 100, y - 1);
      var gy = gross * g, egiY = gy * (1 - i.vacancy / 100);
      var opY = fixed * e + egiY * i.mgmt / 100 + gy * (i.maint + i.capex) / 100;
      var noiY = egiY - opY, cfY = noiY - ds;
      bal = Fin.balance(loan, i.rate, i.term, y * 12);
      var val = i.price * Math.pow(1 + i.appreciation / 100, y);
      years.push({ year: y, noi: noiY, cf: cfY, balance: bal, value: val, equity: val - bal });
      flows.push(cfY);
    }
    var last = years[4], saleNet = last.value * 0.94 - last.balance;
    flows[5] += saleNet;
    var irr = Fin.irr(flows);

    return {
      type: "rental", inputs: i, loan: loan, downAmt: downAmt, pmt: pm, ds: ds,
      gross: gross, vacancyLoss: vac, egi: egi, mgmtCost: mgmt, maintCost: maint, capexCost: capex,
      fixed: fixed, opex: opex, noi: noi, cfYear: cf, cfMonth: cf / 12, cash: cash,
      cap: i.price > 0 ? noi / i.price : 0, coc: cash > 0 ? cf / cash : 0, dscr: ds > 0 ? noi / ds : Infinity,
      beOcc: beOcc, onePct: i.price > 0 ? i.rent / i.price : 0, grm: gross > 0 ? i.price / gross : 0,
      yieldOnPrice: i.price > 0 ? noi / i.price : 0, projection: years, irr: irr, saleNet: saleNet,
      revenueLabel: "Rent", lines: [
        ["Gross scheduled rent", gross], ["Vacancy", -vac], ["Effective gross income", egi, "sub"],
        ["Property taxes", -i.taxes], ["Insurance", -i.insurance], ["HOA, utilities, other", -(i.hoa + i.utilities + i.otherExp) * 12],
        ["Management", -mgmt], ["Repairs and maintenance", -maint], ["Capital reserve", -capex],
        ["Net operating income", noi, "sub"], ["Debt service", -ds], ["Cash flow", cf, "total"]
      ]
    };
  }

  /* ---------- Short term rental ---------- */
  var SEASONS = {
    flat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    beach: [0.72, 0.85, 1.12, 1.18, 1.08, 1.22, 1.3, 1.22, 0.8, 0.82, 0.78, 0.91],
    mountain: [1.25, 1.22, 1.05, 0.7, 0.68, 1.02, 1.18, 1.12, 0.86, 1.02, 0.78, 1.12],
    urban: [0.82, 0.86, 1.02, 1.06, 1.1, 1.12, 1.08, 1.04, 1.06, 1.08, 0.92, 0.84]
  };
  var STR_DEFAULTS = {
    price: 340000, closing: 9500, furnishing: 22000, repairs: 4000, down: 25, rate: 7.25, term: 30,
    adr: 245, occupancy: 62, avgStay: 3.5, cleanFee: 140, cleanCost: 110, platform: 3, mgmt: 0,
    supplies: 6, taxes: 5200, insurance: 3400, hoa: 380, utilities: 310, internet: 80, otherExp: 60,
    maint: 5, capex: 5, ltrRent: 2300, season: "beach"
  };

  function str(raw) {
    var i = {}; for (var k in STR_DEFAULTS) i[k] = k === "season" ? (raw[k] || STR_DEFAULTS[k]) : num(raw[k], STR_DEFAULTS[k]);
    function core(occ, adr) {
      var nights = 365 * occ / 100, stays = i.avgStay > 0 ? nights / i.avgStay : 0;
      var rentRev = adr * nights, cleanRev = i.cleanFee * stays, gross = rentRev + cleanRev;
      var platform = gross * i.platform / 100, mgmt = gross * i.mgmt / 100;
      var cleaning = i.cleanCost * stays, supplies = i.supplies * nights;
      var fixed = i.taxes + i.insurance + (i.hoa + i.utilities + i.internet + i.otherExp) * 12;
      var maint = gross * i.maint / 100, capex = gross * i.capex / 100;
      var opex = platform + mgmt + cleaning + supplies + fixed + maint + capex;
      return { nights: nights, stays: stays, rentRev: rentRev, cleanRev: cleanRev, gross: gross, platform: platform, mgmtCost: mgmt,
        cleaning: cleaning, supplies: supplies, fixed: fixed, maintCost: maint, capexCost: capex, opex: opex, noi: gross - opex };
    }
    var downAmt = i.price * i.down / 100, loan = i.price - downAmt;
    var pm = Fin.pmt(loan, i.rate, i.term), ds = pm * 12;
    var c = core(i.occupancy, i.adr), cf = c.noi - ds;
    var cash = downAmt + i.closing + i.furnishing + i.repairs;
    var beOcc = Fin.minWhere(function (o) { return core(o, i.adr).noi - ds >= 0; }, 0, 100);
    var beAdr = Fin.minWhere(function (a) { return core(i.occupancy, a).noi - ds >= 0; }, 0, 5000);

    var prof = SEASONS[i.season] || SEASONS.flat, dim = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var mean = prof.reduce(function (a, m, k) { return a + m * dim[k]; }, 0) / 365; /* day weighted so months add up to the annual figure */
    var monthly = prof.map(function (m, idx) {
      var occ = clamp(i.occupancy * m / mean, 0, 100), n = dim[idx] * occ / 100, st = i.avgStay > 0 ? n / i.avgStay : 0;
      return { month: idx, occ: occ, revenue: i.adr * n + i.cleanFee * st };
    });

    var ltr = rental({ price: i.price, closing: i.closing, repairs: i.repairs, down: i.down, rate: i.rate, term: i.term,
      rent: i.ltrRent, vacancy: 5, taxes: i.taxes, insurance: i.insurance * 0.6, hoa: i.hoa, utilities: 0, otherExp: 0, mgmt: 8, maint: 5, capex: 5 });

    return {
      type: "str", inputs: i, loan: loan, downAmt: downAmt, pmt: pm, ds: ds, gross: c.gross, egi: c.gross, opex: c.opex, noi: c.noi,
      cfYear: cf, cfMonth: cf / 12, cash: cash, cap: i.price > 0 ? c.noi / i.price : 0, coc: cash > 0 ? cf / cash : 0,
      dscr: ds > 0 ? c.noi / ds : Infinity, beOcc: beOcc == null ? Infinity : beOcc / 100, beAdr: beAdr, nights: c.nights, stays: c.stays,
      revpar: c.gross / 365, yieldOnPrice: i.price > 0 ? c.noi / i.price : 0, monthly: monthly, ltr: ltr, revenueLabel: "Bookings",
      lines: [
        ["Nightly revenue", c.rentRev], ["Cleaning fees collected", c.cleanRev], ["Gross booking revenue", c.gross, "sub"],
        ["Platform fees", -c.platform], ["Management", -c.mgmtCost], ["Cleaning and turnover", -c.cleaning], ["Supplies", -c.supplies],
        ["Taxes, insurance, HOA", -(i.taxes + i.insurance + i.hoa * 12)], ["Utilities, internet, other", -(i.utilities + i.internet + i.otherExp) * 12],
        ["Repairs and maintenance", -c.maintCost], ["Capital reserve", -c.capexCost],
        ["Net operating income", c.noi, "sub"], ["Debt service", -ds], ["Cash flow", cf, "total"]
      ]
    };
  }

  /* ---------- Small business acquisition ---------- */
  var BIZ_DEFAULTS = {
    price: 425000, revenue: 610000, cogs: 128000, opex: 386000, ownerComp: 62000, addbacks: 14000, da: 18000, interest: 0,
    buyerSalary: 55000, capexReserve: 12000, down: 10, sellerPct: 10, sellerRate: 6, sellerTerm: 5,
    bankRate: 10.5, bankTerm: 10, closing: 18000, workingCapital: 25000,
    concentration: 4, recurring: 15, ownerHours: 30, employees: 6, leaseYears: 8, equipmentAge: 7
  };

  function business(raw) {
    var i = {}; for (var k in BIZ_DEFAULTS) i[k] = num(raw[k], BIZ_DEFAULTS[k]);
    var netProfit = i.revenue - i.cogs - i.opex;
    var sde = netProfit + i.ownerComp + i.addbacks + i.da + i.interest;
    var ebitda = sde - i.buyerSalary;
    var equity = i.price * i.down / 100, seller = i.price * i.sellerPct / 100, bank = Math.max(0, i.price - equity - seller);
    var dsBank = Fin.pmt(bank, i.bankRate, i.bankTerm) * 12, dsSeller = Fin.pmt(seller, i.sellerRate, i.sellerTerm) * 12, ds = dsBank + dsSeller;
    var avail = sde - i.buyerSalary - i.capexReserve, cf = avail - ds;
    var cash = equity + i.closing + i.workingCapital;
    return {
      type: "business", inputs: i, netProfit: netProfit, sde: sde, ebitda: ebitda, equity: equity, sellerNote: seller, bankLoan: bank,
      dsBank: dsBank, dsSeller: dsSeller, ds: ds, pmt: ds / 12, avail: avail, noi: avail, cfYear: cf, cfMonth: cf / 12, cash: cash,
      coc: cash > 0 ? cf / cash : 0, dscr: ds > 0 ? avail / ds : Infinity, multiple: sde > 0 ? i.price / sde : Infinity,
      ebitdaMultiple: ebitda > 0 ? i.price / ebitda : Infinity, grossMargin: i.revenue > 0 ? (i.revenue - i.cogs) / i.revenue : 0,
      sdeMargin: i.revenue > 0 ? sde / i.revenue : 0, payback: cf > 0 ? cash / cf : Infinity,
      yieldOnPrice: i.price > 0 ? ebitda / i.price : 0, gross: i.revenue, revenueLabel: "Revenue",
      lines: [
        ["Revenue", i.revenue], ["Cost of goods sold", -i.cogs], ["Gross profit", i.revenue - i.cogs, "sub"],
        ["Operating expenses as reported", -i.opex], ["Reported net profit", netProfit, "sub"],
        ["Add back owner compensation", i.ownerComp], ["Add back discretionary and one time", i.addbacks],
        ["Add back depreciation and interest", i.da + i.interest], ["Seller discretionary earnings", sde, "sub"],
        ["Your salary as operator", -i.buyerSalary], ["Capital reserve", -i.capexReserve],
        ["Bank loan payments", -dsBank], ["Seller note payments", -dsSeller], ["Cash flow after debt", cf, "total"]
      ]
    };
  }


  /* ---------- Loan schedule and financing options ---------- */
  function amortization(loan, ratePct, years) {
    var rows = [], r = ratePct / 1200, p = Fin.pmt(loan, ratePct, years), b = loan, n = Math.round(years * 12);
    for (var y = 1; y <= Math.ceil(n / 12) && b > 0.005; y++) {
      var int = 0, prin = 0;
      for (var m = 0; m < 12 && (y - 1) * 12 + m < n; m++) { var it = b * r, pr = Math.min(b, p - it); int += it; prin += pr; b -= pr; }
      rows.push({ year: y, payment: int + prin, interest: int, principal: prin, balance: Math.max(0, b) });
    }
    return rows;
  }
  function financing(type, inputs, settings) {
    var base = run(type, inputs).inputs, downs = type === "business" ? [10, 15, 20, 25, 30] : [15, 20, 25, 30, 40];
    if (downs.indexOf(Math.round(base.down)) < 0) downs = downs.concat([base.down]).sort(function (a, b) { return a - b; });
    return downs.map(function (d) {
      var r = run(type, Object.assign({}, base, { down: d }));
      return { down: d, current: Math.abs(d - base.down) < 1e-9, cash: r.cash, pmt: r.pmt, cfYear: r.cfYear, coc: r.coc, dscr: r.dscr, meets: r.dscr >= settings.minDscr && r.coc >= settings.minCoc / 100 };
    });
  }

  /* ---------- Due diligence checklists ---------- */
  var CHECKLISTS = {
    rental: ["Verify rent with signed leases or market comparables", "Get a property tax estimate at your purchase price, not the seller's", "Get an insurance quote, including flood and wind if needed",
      "Order a home inspection", "Get roof, HVAC, and water heater ages", "Review the title report and survey", "Confirm zoning and rental permits", "Lock financing terms with a lender", "Estimate repairs with a contractor walkthrough", "Walk the neighborhood at night and on a weekend"],
    str: ["Confirm short term rentals are legal here, including HOA rules", "Pull 12 months of comparable listing data for occupancy and nightly rate", "Get a short term rental insurance quote",
      "Price furnishing and setup", "Line up a cleaner and a backup cleaner", "Check local lodging tax registration", "Order a home inspection", "Lock financing terms with a lender", "Run the long term rental fallback case"],
    business: ["Get three years of tax returns and match them to the profit and loss", "Get 12 months of bank statements and match deposits to revenue", "Verify each add back with documents",
      "Review customer concentration and any contracts", "Review the lease and confirm it can be assigned or renewed", "Get an equipment list with ages and condition", "Interview key employees, with the seller's permission",
      "Confirm licenses and permits transfer", "Agree on a training and transition period", "Have an attorney and a CPA review the deal", "Get SBA or bank loan prequalification"]
  };

  var MODELS = { rental: rental, str: str, business: business };
  var DEFAULTS = { rental: RENTAL_DEFAULTS, str: STR_DEFAULTS, business: BIZ_DEFAULTS };
  function run(type, inputs) { return MODELS[type](inputs || {}); }

  /* ---------- Scenarios ---------- */
  var SCENARIOS = {
    rental: [
      { key: "base", name: "Base case", f: function (i) { return i; } },
      { key: "down", name: "Downside", note: "Rent down 5%, vacancy up 4 pts, repairs up 3 pts, rate up 1 pt",
        f: function (i) { return Object.assign({}, i, { rent: i.rent * 0.95, vacancy: i.vacancy + 4, maint: i.maint + 3, rate: i.rate + 1 }); } },
      { key: "up", name: "Upside", note: "Rent up 5%, vacancy down 2 pts",
        f: function (i) { return Object.assign({}, i, { rent: i.rent * 1.05, vacancy: Math.max(0, i.vacancy - 2) }); } }
    ],
    str: [
      { key: "base", name: "Base case", f: function (i) { return i; } },
      { key: "down", name: "Downside", note: "Occupancy down 12 pts, nightly rate down 8%",
        f: function (i) { return Object.assign({}, i, { occupancy: Math.max(0, i.occupancy - 12), adr: i.adr * 0.92 }); } },
      { key: "up", name: "Upside", note: "Occupancy up 6 pts, nightly rate up 5%",
        f: function (i) { return Object.assign({}, i, { occupancy: Math.min(100, i.occupancy + 6), adr: i.adr * 1.05 }); } }
    ],
    business: [
      { key: "base", name: "Base case", f: function (i) { return i; } },
      { key: "down", name: "Downside", note: "Revenue down 10%, wages and costs up 3%, rate up 2 pts",
        f: function (i) { return Object.assign({}, i, { revenue: i.revenue * 0.9, cogs: i.cogs * 0.9 * 1.03, opex: i.opex * 1.03, bankRate: i.bankRate + 2 }); } },
      { key: "up", name: "Upside", note: "Revenue up 8%",
        f: function (i) { return Object.assign({}, i, { revenue: i.revenue * 1.08, cogs: i.cogs * 1.08 }); } }
    ]
  };
  function scenarios(type, inputs) {
    var base = run(type, inputs).inputs;
    return SCENARIOS[type].map(function (s) { var r = run(type, s.f(base)); return { key: s.key, name: s.name, note: s.note || "", r: r }; });
  }

  /* ---------- Sensitivity: realistic swing for each driver ---------- */
  var DRIVERS = {
    rental: [
      ["rent", "Monthly rent", "pct", 5], ["vacancy", "Vacancy", "pts", 3], ["price", "Purchase price", "pct", 5],
      ["rate", "Interest rate", "pts", 1], ["taxes", "Property taxes", "pct", 10], ["insurance", "Insurance", "pct", 20],
      ["maint", "Repairs and maintenance", "pts", 3], ["mgmt", "Management fee", "pts", 2]
    ],
    str: [
      ["occupancy", "Occupancy", "pts", 8], ["adr", "Nightly rate", "pct", 8], ["price", "Purchase price", "pct", 5],
      ["rate", "Interest rate", "pts", 1], ["cleanCost", "Cleaning cost", "pct", 15], ["insurance", "Insurance", "pct", 20],
      ["mgmt", "Management fee", "pts", 10], ["taxes", "Property taxes", "pct", 10]
    ],
    business: [
      ["revenue", "Revenue", "pct", 10], ["cogs", "Cost of goods", "pct", 10], ["opex", "Operating expenses", "pct", 7],
      ["price", "Purchase price", "pct", 10], ["bankRate", "Bank rate", "pts", 2], ["buyerSalary", "Your salary", "pct", 15],
      ["addbacks", "Seller add backs", "pct", 50]
    ]
  };
  function sensitivity(type, inputs) {
    var base = run(type, inputs), i = base.inputs;
    return DRIVERS[type].map(function (d) {
      function at(sign) {
        var c = Object.assign({}, i), v = i[d[0]];
        c[d[0]] = d[2] === "pct" ? v * (1 + sign * d[3] / 100) : Math.max(0, v + sign * d[3]);
        if (type === "business" && d[0] === "revenue") c.cogs = i.cogs * (1 + sign * d[3] / 100);
        return run(type, c).cfYear;
      }
      var up = at(1), dn = at(-1);
      return { key: d[0], label: d[1], swing: (d[2] === "pct" ? "±" + d[3] + "%" : "±" + d[3] + " pts"), up: up - base.cfYear, down: dn - base.cfYear, impact: Math.abs(up - dn) / 2 };
    }).sort(function (a, b) { return b.impact - a.impact; });
  }

  /* ---------- Target price ---------- */
  function targetPrice(type, inputs, settings) {
    var i = run(type, inputs).inputs, minD = settings.minDscr, minC = settings.minCoc / 100;
    function ok(p) { var r = run(type, Object.assign({}, i, { price: p })); return r.dscr >= minD && r.coc >= minC; }
    var p = Fin.maxWhere(ok, 1000, i.price * 3);
    return p == null ? null : Math.floor(p / 1000) * 1000;
  }

  /* ---------- Risk flags ---------- */
  function flags(r, ctx) {
    var out = [], i = r.inputs, s = ctx.settings;
    function add(sev, cat, title, detail, action) { out.push({ sev: sev, cat: cat, title: title, detail: detail, action: action }); }
    if (r.cfYear < 0) add("high", "risk", "Negative cash flow", "The deal loses money each month at these terms.", "Lower the price, raise the down payment, or verify a higher rent.");
    if (r.dscr < 1) add("high", "risk", "Income does not cover the loan", "Debt coverage is below 1.0, so the property cannot pay its own mortgage.", "Most lenders will decline this. Renegotiate or pass.");
    else if (r.dscr < s.minDscr) add("med", "risk", "Thin debt coverage", "Coverage is " + r.dscr.toFixed(2) + ", under your " + s.minDscr.toFixed(2) + " target.", "Reduce leverage or negotiate the price down.");
    if (r.coc < s.minCoc / 100 && r.cfYear >= 0) add("med", "risk", "Below your return target", "Cash on cash return is under your " + s.minCoc + "% minimum.", "See the target price for the number that meets your criteria.");
    if (ctx.available != null && r.cash > ctx.available) add("med", "risk", "Not enough free cash", "This needs more cash than you have after keeping your emergency reserve.", "Build savings first or look for a seller note or partner.");
    if (r.type === "rental") {
      if (i.vacancy < 5) add("med", "assumption", "Aggressive vacancy", "Vacancy under 5% assumes almost no turnover.", "Use 5% to 8% unless the rent roll proves otherwise.");
      if (i.maint + i.capex < 10) add("med", "assumption", "Light repair budget", "Repairs plus capital reserve is under 10% of rent.", "Older homes often need 10% to 15%.");
      if (i.mgmt === 0) add("info", "assumption", "No management cost", "You are pricing your own time at zero.", "Model 8% to 10% so the deal still works if you hire out.");
      if (r.beOcc > 0.85) add("med", "risk", "High break even occupancy", "You need " + Math.round(r.beOcc * 100) + "% occupancy just to break even.", "Look for a lower price or more rent.");
    }
    if (r.type === "str") {
      if (i.occupancy > 75) add("med", "assumption", "Aggressive occupancy", "Few markets sustain more than 75% booked nights all year.", "Check comparable listings and use their trailing average.");
      if (i.mgmt === 0) add("info", "assumption", "Self managed", "No management fee is modeled. Full service hosts charge 20% to 30%.", "Run a 25% management case before you buy.");
      if (r.beOcc > 0.6) add("med", "risk", "High break even occupancy", "You need " + Math.round(r.beOcc * 100) + "% booked nights to break even.", "A weak season could push this negative.");
      if (r.ltr && r.ltr.cfYear > r.cfYear) add("info", "risk", "Long term rental pays more", "A standard lease beats the short term plan at these assumptions.", "Compare the two strategies before furnishing.");
    }
    if (r.type === "business") {
      if (i.concentration > 20) add("high", "risk", "Customer concentration", "One customer is " + i.concentration + "% of revenue.", "Ask for customer contracts and an earnout tied to retention.");
      if (i.recurring < 20) add("info", "risk", "Low recurring revenue", "Most revenue must be won again each year.", "Look for contracts, memberships, or routes.");
      if (i.ownerHours > 50) add("med", "risk", "Owner dependent", "The seller works " + i.ownerHours + " hours a week in the business.", "Budget for a manager or a long transition period.");
      if (i.leaseYears < 5) add("med", "risk", "Short lease", "Only " + i.leaseYears + " years remain on the lease.", "Make a new lease a condition of closing.");
      if (i.equipmentAge > 12) add("med", "risk", "Aging equipment", "Equipment averages " + i.equipmentAge + " years old.", "Raise the capital reserve or negotiate a price credit.");
      if (r.multiple > 3.5) add("med", "assumption", "Rich valuation", "Price is " + r.multiple.toFixed(1) + "x earnings. Small main street deals often trade at 2x to 3.5x.", "Ask what justifies the premium.");
      if (i.addbacks > r.sde * 0.2) add("med", "assumption", "Heavy add backs", "Add backs are a large share of earnings.", "Verify each one against bank statements and tax returns.");
    }
    return out;
  }

  /* ---------- AIM Score ---------- */
  function score(type, inputs, ctx) {
    var r = run(type, inputs), s = ctx.settings;
    var down = run(type, SCENARIOS[type][1].f(r.inputs));
    var fl = flags(r, ctx);
    var parts = [
      { key: "return", label: "Return", max: 30, pts: 30 * clamp(r.coc / (s.minCoc / 100 * 1.5), 0, 1) },
      { key: "coverage", label: "Debt coverage", max: 25, pts: 25 * clamp((r.dscr - 1) / 0.5, 0, 1) },
      { key: "resilience", label: "Downside resilience", max: 20, pts: 20 * clamp((down.dscr - 0.9) / 0.5, 0, 1) },
      { key: "liquidity", label: "Fits your cash", max: 15, pts: ctx.available == null ? 15 : 15 * clamp(ctx.available / Math.max(1, r.cash), 0, 1) },
      { key: "assumptions", label: "Assumption quality", max: 10, pts: Math.max(0, 10 - 2.5 * fl.filter(function (f) { return f.cat === "assumption" && f.sev !== "info"; }).length - 1 * fl.filter(function (f) { return f.cat === "assumption" && f.sev === "info"; }).length) }
    ];
    var total = Math.round(parts.reduce(function (a, p) { return a + p.pts; }, 0));
    var grade = total >= 80 ? "Strong" : total >= 65 ? "Workable" : total >= 50 ? "Marginal" : "Weak";
    return { total: total, grade: grade, parts: parts, r: r, down: down, flags: fl };
  }

  function recommendation(sc, tgt) {
    var r = sc.r;
    if (sc.total >= 80) return "There is room for error at these terms. Verify the income figures, then move to an offer.";
    if (sc.total >= 65) return "Works on paper, but the margin is modest." + (tgt && tgt < r.inputs.price ? " Offering near " + money(tgt) + " would meet your targets." : " Tighten the weakest assumption before you commit.");
    if (sc.total >= 50) return (tgt ? "Your criteria are met at about " + money(tgt) + ". " : "") + "Renegotiate or verify better income before going further.";
    return (tgt ? "At this price the deal misses your targets. It only works near " + money(tgt) + "." : "No price in a reasonable range gets this deal to your targets.") + " Pass unless the terms change.";
  }

  /* ---------- Personal finance ---------- */
  function budget(b) {
    var income = (b.income || []).reduce(function (a, x) { return a + num(x.amount); }, 0);
    var expenses = (b.expenses || []).reduce(function (a, x) { return a + num(x.amount); }, 0);
    var fixed = (b.expenses || []).filter(function (x) { return x.kind === "Fixed"; }).reduce(function (a, x) { return a + num(x.amount); }, 0);
    var fcf = income - expenses;
    return { income: income, expenses: expenses, fixed: fixed, variable: expenses - fixed, fcf: fcf, savingsRate: income > 0 ? fcf / income : 0 };
  }

  /* Debt payoff with rollover. The total monthly payment (all minimums plus extra) stays fixed, so each paid off
     balance frees its minimum for the next target. Avalanche targets the highest rate, snowball the smallest balance. */
  function debtPlan(list, extra, method) {
    var ds = (list || []).map(function (d, i) { return { i: i, name: d.name || "Debt " + (i + 1), start: Math.max(0, num(d.balance)), bal: Math.max(0, num(d.balance)), rate: Math.max(0, num(d.rate)), min: Math.max(0, num(d.min)), interest: 0, paidOff: null }; })
      .filter(function (d) { return d.bal > 0.005; });
    extra = Math.max(0, num(extra));
    var pay = ds.reduce(function (a, d) { return a + d.min; }, 0) + extra, total = 0, month = 0;
    function owed() { return ds.reduce(function (a, d) { return a + d.bal; }, 0); }
    var series = [{ month: 0, balance: owed() }];
    while (month < 600 && ds.some(function (d) { return d.bal > 0.005; })) {
      month++;
      var active = ds.filter(function (d) { return d.bal > 0.005; }), pool = pay;
      active.forEach(function (d) { var it = d.bal * d.rate / 1200; d.bal += it; d.interest += it; total += it; });
      active.forEach(function (d) { var p = Math.min(d.min, d.bal, pool); d.bal -= p; pool -= p; });
      active.filter(function (d) { return d.bal > 0.005; }).sort(method === "snowball"
        ? function (a, b) { return a.bal - b.bal || b.rate - a.rate; }
        : function (a, b) { return b.rate - a.rate || a.bal - b.bal; })
        .forEach(function (d) { if (pool <= 0) return; var p = Math.min(pool, d.bal); d.bal -= p; pool -= p; });
      ds.forEach(function (d) { if (d.bal <= 0.005 && d.paidOff == null) { d.bal = 0; d.paidOff = month; } });
      series.push({ month: month, balance: owed() });
    }
    var done = ds.every(function (d) { return d.paidOff != null; });
    return { method: method === "snowball" ? "snowball" : "avalanche", payment: pay, extra: extra, feasible: done, months: done ? month : null, totalInterest: done ? total : null,
      debts: ds.slice().sort(function (a, b) { return (a.paidOff == null ? 1e9 : a.paidOff) - (b.paidOff == null ? 1e9 : b.paidOff); }), series: series };
  }

  /* Investment projection with end of month contributions. Returns are real (after inflation), so the
     independence target is today's yearly spending divided by the safe withdrawal rate. */
  function projection(o) {
    var bal = Math.max(0, num(o.start)), m = Math.max(0, num(o.monthly)), r = num(o.ret, 0) / 1200, yrs = clamp(Math.round(num(o.years, 30)), 1, 60);
    var swr = num(o.swr, 4), target = swr > 0 ? num(o.expenses) * 12 / (swr / 100) : 0, contrib = bal, fi = target > 0 && bal >= target ? 0 : null;
    var pts = [{ year: 0, balance: bal, contributed: contrib, growth: 0 }];
    for (var k = 1; k <= yrs * 12; k++) {
      bal = bal * (1 + r) + m; contrib += m;
      if (fi == null && target > 0 && bal >= target) fi = k;
      if (k % 12 === 0) pts.push({ year: k / 12, balance: bal, contributed: contrib, growth: bal - contrib });
    }
    var b2 = bal, mm = yrs * 12;
    while (fi == null && target > 0 && mm < 1200) { mm++; b2 = b2 * (1 + r) + m; if (b2 >= target) fi = mm; }
    return { target: target, fiMonth: fi, fiYears: fi == null ? null : fi / 12, end: bal, contributed: contrib, points: pts, monthlyIncomeAtEnd: bal * swr / 100 / 12 };
  }

  function money(v, opts) {
    if (v == null || !isFinite(v)) return "n/a";
    var neg = v < 0, a = Math.abs(v), s;
    if (opts && opts.compact && a >= 1e6) s = "$" + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + "M";
    else if (opts && opts.compact && a >= 1e4) s = "$" + Math.round(a / 1e3) + "K";
    else s = "$" + Math.round(a).toLocaleString("en-US");
    return (neg ? "−" : "") + s;
  }
  function pct(v, d) { if (v == null || !isFinite(v)) return "n/a"; return (v < 0 ? "−" : "") + Math.abs(v * 100).toFixed(d == null ? 1 : d) + "%"; }
  function ratio(v) { if (v == null) return "n/a"; if (!isFinite(v)) return "No debt"; return v.toFixed(2); }

  return { Fin: Fin, run: run, amortization: amortization, financing: financing, CHECKLISTS: CHECKLISTS, DEFAULTS: DEFAULTS, SEASONS: SEASONS, scenarios: scenarios, sensitivity: sensitivity, targetPrice: targetPrice,
    flags: flags, score: score, recommendation: recommendation, budget: budget, debtPlan: debtPlan, projection: projection, money: money, pct: pct, ratio: ratio, clamp: clamp, num: num };
})();
if (typeof module !== "undefined") module.exports = AIM;
