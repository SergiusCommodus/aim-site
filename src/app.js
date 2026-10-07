/* AIM web app. Vanilla JS, data saved to this browser. */
(function () {
  "use strict";
  var M = AIM.money, P = AIM.pct, R = AIM.ratio, num = AIM.num;
  var KEY = "aim.workspace.v1", LEAD = "aim.lead.v1", VERSION = "Beta 1.0";
  var FEEDBACK_URL = "{{FORM_ENDPOINT}}"; if (FEEDBACK_URL.indexOf("{{") === 0) FEEDBACK_URL = "";
  var EMBEDDED = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function uid() { return Math.random().toString(36).slice(2, 9); }
  function store(k, v) { try { if (v === undefined) { var x = localStorage.getItem(k); return x ? JSON.parse(x) : null; } localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  var TYPE = { rental: "Long term rental", str: "Short term rental", business: "Business acquisition" };
  var TYPE_SHORT = { rental: "Rental", str: "Short term", business: "Business" };
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function ym(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
  function ymLabel(s) { var p = s.split("-"); return MON[+p[1] - 1] + " " + p[0]; }
  function addMonths(s, n) { var p = s.split("-"); var d = new Date(+p[0], +p[1] - 1 + n, 1); return ym(d); }
  function monthsBetween(a, b) { var x = a.split("-"), y = b.split("-"); return (+y[0] - +x[0]) * 12 + (+y[1] - +x[1]); }
  var NOW = ym(new Date());

  /* ---------- sample workspace ---------- */
  function seed(name) {
    var opps = [
      { id: uid(), type: "rental", name: "412 Maple St Duplex", status: "Evaluating", location: "Tampa, FL", created: NOW, notes: "Both units leased through spring. Seller will consider a 30 day close.",
        inputs: Object.assign({}, AIM.DEFAULTS.rental, { price: 279000, closing: 8400, repairs: 6000, down: 25, rate: 6.5, rent: 3250, vacancy: 6, taxes: 4300, insurance: 2150, mgmt: 8, maint: 6, capex: 5 }) },
      { id: uid(), type: "str", name: "Gulf Breeze Condo", status: "Evaluating", location: "Clearwater Beach, FL", created: NOW, notes: "Two bedroom, building allows short term rentals. HOA reserve study requested.",
        inputs: Object.assign({}, AIM.DEFAULTS.str, { mgmt: 0 }) },
      { id: uid(), type: "business", name: "Suds and Spin Laundromat", status: "Evaluating", location: "Brandon, FL", created: NOW, notes: "Broker listing. 42 machines, card payment system installed 2023.",
        inputs: Object.assign({}, AIM.DEFAULTS.business) },
      { id: uid(), type: "rental", name: "Oak Ave Single Family", status: "Owned", location: "Lakeland, FL", created: "2025-03", notes: "Purchased March 2025. Tenant renewed through June 2027.",
        inputs: Object.assign({}, AIM.DEFAULTS.rental, { price: 205000, closing: 6100, repairs: 3500, down: 20, rate: 6.25, rent: 2050, vacancy: 5, taxes: 3050, insurance: 1480, mgmt: 8, maint: 6, capex: 5 }),
        owned: { since: "2025-03", value: 224000, actuals: [] } },
      { id: uid(), type: "rental", name: "Riverside Fourplex", status: "Passed", location: "Tampa, FL", created: NOW, notes: "Passed. Seller would not move on price and two units need full rehabs.",
        inputs: Object.assign({}, AIM.DEFAULTS.rental, { price: 615000, rent: 4800, taxes: 9800, insurance: 5200, repairs: 60000, rate: 7.25 }) }
    ];
    var oak = opps[3];
    var pr = [2050, 2050, 2050, 2050, 0, 2050], pe = [612, 590, 655, 2140, 980, 640];
    for (var k = 6; k >= 1; k--) oak.owned.actuals.push({ id: uid(), month: addMonths(NOW, -k), revenue: pr[6 - k], expenses: pe[6 - k], note: k === 3 ? "HVAC compressor replaced" : k === 2 ? "Vacant, turnover and paint" : "" });
    var ws = {
      v: 1, sample: true, created: new Date().toISOString(),
      settings: { name: name || "", minDscr: 1.25, minCoc: 8, reserveMonths: 6 },
      budget: {
        income: [{ id: uid(), name: "Salary after tax", amount: 6400 }, { id: uid(), name: "Side business", amount: 900 }],
        expenses: [
          { id: uid(), name: "Rent", amount: 1850, kind: "Fixed" }, { id: uid(), name: "Car payment and insurance", amount: 610, kind: "Fixed" },
          { id: uid(), name: "Utilities and phone", amount: 265, kind: "Fixed" }, { id: uid(), name: "Health insurance", amount: 190, kind: "Fixed" },
          { id: uid(), name: "Subscriptions", amount: 85, kind: "Fixed" }, { id: uid(), name: "Student loan payment", amount: 160, kind: "Fixed" }, { id: uid(), name: "Groceries", amount: 620, kind: "Variable" },
          { id: uid(), name: "Dining out", amount: 340, kind: "Variable" }, { id: uid(), name: "Travel", amount: 250, kind: "Variable" },
          { id: uid(), name: "Everything else", amount: 380, kind: "Variable" }
        ],
        goals: [
          { id: uid(), name: "Next property down payment", target: 95000, saved: 52000, monthly: 1800 },
          { id: uid(), name: "Emergency fund top up", target: 28000, saved: 26500, monthly: 250 },
          { id: uid(), name: "Travel", target: 4000, saved: 1500, monthly: 200 }
        ]
      },
      accounts: [
        { id: uid(), name: "Checking", type: "Cash", value: 14200 }, { id: uid(), name: "High yield savings", type: "Cash", value: 102000 },
        { id: uid(), name: "Brokerage", type: "Investments", value: 46800 }, { id: uid(), name: "401(k)", type: "Retirement", value: 38500 },
        { id: uid(), name: "Vehicle", type: "Other asset", value: 21000 }, { id: uid(), name: "Auto loan", type: "Liability", value: 14800, rate: 6.9, min: 420 },
        { id: uid(), name: "Student loan", type: "Liability", value: 9800, rate: 5.5, min: 160 }, { id: uid(), name: "Credit card balance", type: "Liability", value: 1200, rate: 22.9, min: 45 }
      ],
      opps: opps, history: [], lessonsDone: ["cap", "coc"], welcomed: false, onb: {}, plan: planDefaults()
    };
    var today = new Date().toISOString();
    opps.forEach(function (o) { o.log = [{ date: today, text: "Analysis created" }]; });
    opps[3].log = [{ date: "2025-01-14T15:00:00.000Z", text: "Analysis created" }, { date: "2025-02-03T15:00:00.000Z", text: "Offer accepted at $205,000" }, { date: "2025-03-21T15:00:00.000Z", text: "Marked as Owned" }];
    opps[3].checks = AIM.CHECKLISTS.rental.map(function () { return true; });
    opps[4].log.push({ date: today, text: "Marked as Passed. Seller would not move on price." });
    opps[0].checks = [true, true, true, false, false, false, true];
    var nw = netWorthOf(ws).total;
    for (var j = 11; j >= 1; j--) ws.history.push({ month: addMonths(NOW, -j), value: Math.round(nw * Math.pow(0.986, j) + (j % 3 === 0 ? -1800 : 900)) });
    ws.history.push({ month: NOW, value: Math.round(nw) });
    return ws;
  }
  function planDefaults() { return { extra: 250, method: "avalanche", ret: 5, swr: 4, years: 30, monthly: null, start: null, spend: null }; }
  function plan() { st.plan = Object.assign(planDefaults(), st.plan || {}); return st.plan; }

  /* ---------- derived numbers ---------- */
  function ownedEquity(o) {
    var r = AIM.run(o.type, o.inputs), mo = Math.max(0, monthsBetween(o.owned.since || NOW, NOW)), i = r.inputs, bal;
    if (o.type === "business") bal = AIM.Fin.balance(r.bankLoan, i.bankRate, i.bankTerm, mo) + AIM.Fin.balance(r.sellerNote, i.sellerRate, i.sellerTerm, mo);
    else bal = AIM.Fin.balance(r.loan, i.rate, i.term, mo);
    var val = num(o.owned.value, i.price);
    return { value: val, balance: bal, equity: val - bal };
  }
  function netWorthOf(ws) {
    var assets = 0, liab = 0, byType = {};
    ws.accounts.forEach(function (a) { var v = num(a.value); if (a.type === "Liability") liab += v; else { assets += v; byType[a.type] = (byType[a.type] || 0) + v; } });
    var eq = 0;
    ws.opps.filter(function (o) { return o.status === "Owned" && o.owned; }).forEach(function (o) {
      var e = ownedEquity(o), k = o.type === "business" ? "Business equity" : "Real estate equity"; eq += e.equity; byType[k] = (byType[k] || 0) + e.equity;
    });
    return { total: assets + eq - liab, assets: assets + eq, liabilities: liab, ownedEquity: eq, byType: byType };
  }
  function ctx() {
    var b = AIM.budget(st.budget), cash = st.accounts.filter(function (a) { return a.type === "Cash"; }).reduce(function (s, a) { return s + num(a.value); }, 0);
    var reserve = b.expenses * st.settings.reserveMonths, nw = netWorthOf(st);
    return { settings: st.settings, budget: st.budget, opps: st.opps, accounts: st.accounts, plan: plan(), cash: cash, reserve: reserve, available: Math.max(0, cash - reserve), netWorth: nw.total, ownedEquity: nw.ownedEquity };
  }
  function scoreOf(o, c) { c = c || ctx(); if (o.status === "Owned") c = Object.assign({}, c, { available: null }); return AIM.score(o.type, o.inputs, c); }
  function logEvent(o, text) { o.log = o.log || []; o.log.push({ date: new Date().toISOString(), text: text }); }
  function onb(k) { st.onb = st.onb || {}; if (!st.onb[k]) { st.onb[k] = true; save(); } }
  function gradeClass(g) { return "s-" + g.toLowerCase(); }
  function ownedPerf(o) {
    var r = AIM.run(o.type, o.inputs), planRev = r.type === "business" ? r.inputs.revenue / 12 : r.egi / 12;
    var planExp = r.type === "business" ? (r.inputs.revenue - r.avail) / 12 : r.opex / 12;
    var rows = (o.owned.actuals || []).slice().sort(function (a, b) { return a.month < b.month ? -1 : 1; }).map(function (a) {
      var cf = num(a.revenue) - num(a.expenses) - r.pmt; return { a: a, cf: cf, plan: r.cfMonth, varc: cf - r.cfMonth };
    });
    var tot = rows.reduce(function (s, x) { return { cf: s.cf + x.cf, plan: s.plan + x.plan }; }, { cf: 0, plan: 0 });
    return { r: r, planRev: planRev, planExp: planExp, rows: rows, total: tot };
  }

  /* ---------- state: two workspaces, Demo (sample portfolio) and Live (the person's own numbers) ---------- */
  var DKEY = "aim.demo.v1", MKEY = "aim.mode.v1";
  function canStore() { try { localStorage.setItem("aim.probe", "1"); localStorage.removeItem("aim.probe"); return true; } catch (e) { return false; } }
  var STORAGE = canStore();
  var live = store(KEY), demo = store(DKEY), lead = store(LEAD), mode = store(MKEY);
  /* Earlier betas kept the sample portfolio in the main workspace. Move it to the demo slot so the real workspace starts clean. */
  if (live && live.sample && !live.setupDone) { if (!demo) demo = live; demo.sample = true; store(DKEY, demo); live = null; try { localStorage.removeItem(KEY); } catch (e) { } if (!mode) { mode = "demo"; store(MKEY, mode); } }
  /* Workspaces from before Beta 1.0 have no planner settings or debt terms. Fill in the sample loan terms so the planner works. */
  if (demo) {
    var SAMPLE_TERMS = { "Auto loan": [6.9, 420], "Credit card balance": [22.9, 45], "Student loan": [5.5, 160] }, patched = !demo.plan;
    (demo.accounts || []).forEach(function (a) { var t = SAMPLE_TERMS[a.name]; if (a.type === "Liability" && t && a.rate == null) { a.rate = t[0]; a.min = t[1]; patched = true; } });
    if (patched) { demo.plan = Object.assign(planDefaults(), demo.plan || {}); store(DKEY, demo); }
  }
  var leadFirst = lead && (lead.first_name || (lead.name || "").split(" ")[0]) || "";
  var ui = { tab: "analysis", filter: "All", compare: [], chatOpp: null, chat: [], lesson: null, oppId: null, plan: "debt" };
  var st = null;
  function wsKey() { return mode === "live" ? KEY : DKEY; }
  function setMode(m, quiet) {
    if (st) store(wsKey(), st);
    mode = m; store(MKEY, m);
    if (m === "demo") { if (!demo) { demo = seed(leadFirst); store(DKEY, demo); } st = demo; }
    else st = live;
    ui.compare = []; ui.chat = []; ui.chatOpp = null; ui.lesson = null;
    if (!quiet) toast(m === "demo" ? "Switched to the demo workspace" : "Switched to your workspace");
  }
  var saveT;
  function save() { clearTimeout(saveT); var k = wsKey(), s = st; saveT = setTimeout(function () { store(k, s); }, 150); }
  window.addEventListener("pagehide", function () { if (st) store(wsKey(), st); });
  var startHash = (location.hash || "").replace("#", ""), pendingImport = null;
  var importBad = false;
  if (startHash.indexOf("import=") === 0) { pendingImport = decodeShare(startHash.slice(7)); importBad = !pendingImport; startHash = ""; }
  if (startHash === "demo") setMode("demo", true);
  else if (startHash === "setup" || startHash === "start") { if (live) setMode("live", true); }
  else if (startHash === "welcome") setMode(live ? "live" : "demo", true);
  else if (mode === "live" && live) setMode("live", true);
  else if (mode === "demo") setMode("demo", true);
  else if (live) setMode("live", true);
  else if (pendingImport) setMode("demo", true);
  if (st) store(wsKey(), st);

  /* ---------- icons ---------- */
  var I = {
    dash: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
    opps: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 1v5M12 18v5M1 12h5M18 12h5"/>',
    cmp: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    budget: '<path d="M3 7h18v13H3zM3 7l3-4h12l3 4M15 13h3"/>',
    nw: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
    bot: '<path d="M4 5h16v11H8l-4 4zM8 10h.01M12 10h.01M16 10h.01"/>',
    learn: '<path d="M2 7l10-4 10 4-10 4zM6 9v6c3 2 9 2 12 0V9"/>',
    set: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    plan: '<path d="M4 19h16M6 15l4-4 3 3 5-6"/><circle cx="18" cy="8" r="1.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    send: '<path d="M4 12l16-8-6 16-2-7z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    demo: '<path d="M4 5h16v11H4zM9 20h6M12 16v4"/>',
    me: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'
  };
  function ic(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[k] + "</svg>"; }
  var NAV = [["dashboard", "Dashboard", "dash"], ["grp", "Invest"], ["opportunities", "Opportunities", "opps"], ["compare", "Compare", "cmp"], ["grp", "Money"], ["budget", "Budget and goals", "budget"], ["networth", "Net worth", "nw"], ["planner", "Planner", "plan"], ["grp", "Assist"], ["aimbot", "AIMBot", "bot"], ["learn", "AIM Learning", "learn"], ["sep"], ["settings", "Settings", "set"]];
  var NAV_TITLES = { dashboard: "Dashboard", opportunities: "Opportunities", compare: "Compare", budget: "Budget and goals", networth: "Net worth", planner: "Planner", aimbot: "AIMBot", learn: "AIM Learning", settings: "Settings" };

  /* ---------- charts ---------- */
  function niceStep(range, n) { var raw = range / n, mag = Math.pow(10, Math.floor(Math.log10(raw || 1))), f = raw / mag; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag; }
  function ticks(lo, hi, n) { if (lo === hi) { hi = lo + 1; } var s = niceStep(hi - lo, n || 4), a = Math.floor(lo / s) * s, b = Math.ceil(hi / s) * s, t = []; for (var v = a; v <= b + s / 2; v += s) t.push(+v.toFixed(6)); return t; }
  function roundBar(x, y0, w, y1, r) {
    var h = Math.abs(y1 - y0); r = Math.min(r, h, w / 2); if (h < 0.5) return "";
    if (y1 < y0) return "M" + x + "," + y0 + "V" + (y1 + r) + "Q" + x + "," + y1 + " " + (x + r) + "," + y1 + "H" + (x + w - r) + "Q" + (x + w) + "," + y1 + " " + (x + w) + "," + (y1 + r) + "V" + y0 + "Z";
    return "M" + x + "," + y0 + "V" + (y1 - r) + "Q" + x + "," + y1 + " " + (x + r) + "," + y1 + "H" + (x + w - r) + "Q" + (x + w) + "," + y1 + " " + (x + w) + "," + (y1 - r) + "V" + y0 + "Z";
  }
  /* series: [{name,color,values}], labels: [], kind: 'line' | 'bar' */
  var chartReg = {}, pendingCharts = {};
  function chart(id, labels, series, o) {
    o = o || {}; pendingCharts[id] = { labels: labels, series: series, o: o };
    var legend = series.length > 1 ? '<div class="legend">' + series.map(function (s) { return '<span><i class="' + (s.dash ? "dash" : "") + '" style="' + (s.dash ? "border-color:" : "background:") + s.color + '"></i>' + esc(s.name) + "</span>"; }).join("") + "</div>" : "";
    return '<div class="cwrap" id="' + id + '" style="min-height:' + (o.h || 230) + 'px"></div>' + legend;
  }
  function drawChart(id, cfg, animate) {
    var el = document.getElementById(id); if (!el) return;
    var labels = cfg.labels, series = cfg.series, o = cfg.o;
    var W = Math.max(260, Math.round(el.clientWidth || 600)), H = o.h || 230, L = 58, Rr = 14, T = 12, B = 28, iw = W - L - Rr, ih = H - T - B;
    var all = []; series.forEach(function (s) { all = all.concat(s.values); });
    var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
    if (o.kind === "bar" || o.zero) { lo = Math.min(0, lo); hi = Math.max(0, hi); }
    else { var pad = (hi - lo) * 0.15 || Math.abs(hi) * 0.1 || 1; lo -= pad; hi += pad; }
    var tk = ticks(lo, hi, 4); lo = tk[0]; hi = tk[tk.length - 1];
    function y(v) { return T + ih - (v - lo) / (hi - lo) * ih; }
    var n = labels.length, band = iw / n;
    function xc(i) { return o.kind === "bar" ? L + band * i + band / 2 : L + (n === 1 ? iw / 2 : iw * i / (n - 1)); }
    var g = '<g class="grid">' + tk.map(function (t) { return '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + y(t) + '" y2="' + y(t) + '"/>'; }).join("") + "</g>";
    var yl = tk.map(function (t) { return '<text x="' + (L - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + esc(M(t, { compact: true })) + "</text>"; }).join("");
    var maxL = Math.max(3, Math.min(o.maxLabels || 12, Math.floor(iw / 46))), every = Math.ceil(n / maxL);
    var xl = labels.map(function (l, i) { return i % every === 0 ? '<text x="' + xc(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(l) + "</text>" : ""; }).join("");
    var zero = lo < 0 && hi > 0 ? '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke="var(--line-2)" stroke-width="1.5"/>' : "";
    var marks = "";
    if (o.kind === "bar") {
      var gw = Math.min(band * 0.72, 26 * series.length + 2 * (series.length - 1)), bw = (gw - 2 * (series.length - 1)) / series.length;
      series.forEach(function (s, si) {
        marks += s.values.map(function (v, i) { var x = xc(i) - gw / 2 + si * (bw + 2); return '<path class="bar" style="--i:' + i + '" d="' + roundBar(x, y(0), bw, y(v), 4) + '" fill="' + s.color + '"/>'; }).join("");
      });
    } else {
      series.forEach(function (s) {
        var pts = s.values.map(function (v, i) { return xc(i).toFixed(1) + "," + y(v).toFixed(1); });
        if (o.area) marks += '<path class="area" d="M' + xc(0) + "," + y(lo) + "L" + pts.join("L") + "L" + xc(n - 1) + "," + y(lo) + 'Z" fill="' + s.color + '" fill-opacity=".08"/>';
        marks += '<polyline class="' + (s.dash ? "" : "ln") + '" points="' + pts.join(" ") + '" fill="none" stroke="' + s.color + '" stroke-width="2"' + (s.dash ? ' stroke-dasharray="5 4"' : "") + ' stroke-linejoin="round" stroke-linecap="round"/>';
        var li = n - 1; if (!s.dash) marks += '<circle class="dot" cx="' + xc(li) + '" cy="' + y(s.values[li]) + '" r="4.5" fill="' + s.color + '" stroke="var(--paper)" stroke-width="2"/>';
      });
    }
    el.innerHTML = '<svg class="chart" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(o.label || "Chart") + '">' + g + zero + yl + xl + marks +
      '<line class="xh" y1="' + T + '" y2="' + (T + ih) + '" stroke="var(--faint)" stroke-dasharray="3 3" opacity="0"/><circle class="xd" r="5" fill="var(--navy)" stroke="var(--paper)" stroke-width="2" opacity="0"/>' +
      '<rect x="' + L + '" y="' + T + '" width="' + iw + '" height="' + ih + '" fill="transparent"/></svg><div class="tip" hidden></div>';
    if (animate && !REDUCED) { $$("polyline.ln", el).forEach(function (p) { try { p.style.setProperty("--len", p.getTotalLength()); } catch (e) { } }); el.classList.add("enter"); setTimeout(function () { el.classList.remove("enter"); }, 1200); }
    var d = { labels: labels, series: series, W: W, H: H, xc: xc, y: y, n: n, band: band, kind: o.kind, fmt: o.fmt || function (v) { return M(v); } };
    var svg = el.querySelector("svg"), tip = el.querySelector(".tip"), xh = el.querySelector(".xh"), xd = el.querySelector(".xd");
    function move(e) {
      var rc = svg.getBoundingClientRect(), x = (e.clientX - rc.left) / rc.width * d.W, i;
      if (d.kind === "bar") i = Math.floor((x - (d.xc(0) - d.band / 2)) / d.band); else { i = 0; var best = 1e9; for (var k = 0; k < d.n; k++) { var dd = Math.abs(d.xc(k) - x); if (dd < best) { best = dd; i = k; } } }
      i = Math.max(0, Math.min(d.n - 1, i));
      var cx = d.xc(i);
      xh.setAttribute("x1", cx); xh.setAttribute("x2", cx); xh.setAttribute("opacity", d.kind === "bar" ? 0 : 1);
      if (d.kind !== "bar") { xd.setAttribute("cx", cx); xd.setAttribute("cy", d.y(d.series[0].values[i])); xd.setAttribute("opacity", 1); }
      tip.innerHTML = "<div>" + esc(d.labels[i]) + "</div>" + d.series.map(function (s) { return "<div>" + (d.series.length > 1 ? esc(s.name) + ": " : "") + "<b>" + esc(d.fmt(s.values[i])) + "</b></div>"; }).join("");
      var vals = d.series.map(function (s) { return s.values[i]; }), top = d.kind === "bar" ? d.y(Math.max.apply(null, vals.concat([0]))) : d.y(vals[0]);
      tip.hidden = false; tip.style.left = Math.max(60, Math.min(rc.width - 60, cx / d.W * rc.width)) + "px"; tip.style.top = (top / d.H * rc.height) + "px";
    }
    function leave() { tip.hidden = true; xh.setAttribute("opacity", 0); xd.setAttribute("opacity", 0); }
    svg.addEventListener("pointermove", move); svg.addEventListener("pointerleave", leave);
  }
  function bindCharts(animate) {
    Object.keys(pendingCharts).forEach(function (id) { chartReg[id] = pendingCharts[id]; drawChart(id, pendingCharts[id], animate); });
    pendingCharts = {};
  }
  var rzT;
  window.addEventListener("resize", function () { clearTimeout(rzT); rzT = setTimeout(function () { Object.keys(chartReg).forEach(function (id) { if (document.getElementById(id)) drawChart(id, chartReg[id]); else delete chartReg[id]; }); }, 150); });
  function dial(sc) {
    var c = 2 * Math.PI * 46, f = sc.total / 100, col = { Strong: "var(--good)", Workable: "var(--navy)", Marginal: "var(--warn)", Weak: "var(--bad)" }[sc.grade];
    return '<svg class="dial" viewBox="0 0 112 112" role="img" aria-label="AIM Score ' + sc.total + ' of 100"><circle cx="56" cy="56" r="46" fill="none" stroke="var(--tint)" stroke-width="10"/>' +
      '<circle class="arc" cx="56" cy="56" r="46" fill="none" stroke="' + col + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + (c * f).toFixed(1) + " " + c.toFixed(1) + '" transform="rotate(-90 56 56)"/>' +
      '<text x="56" y="58" text-anchor="middle" style="font:600 30px var(--mono);fill:var(--ink)">' + sc.total + '</text><text x="56" y="78" text-anchor="middle" style="font:500 10px var(--mono);letter-spacing:.1em;fill:var(--muted)">AIM SCORE</text></svg>';
  }
  function gradePill(sc) { var k = { Strong: "good", Workable: "neutral", Marginal: "warn", Weak: "bad" }[sc.grade]; return '<span class="pill ' + k + '"><i></i>' + sc.grade + "</span>"; }
  function statusPill(s) { return '<span class="pill ' + (s === "Owned" ? "good" : s === "Passed" ? "warn" : "neutral") + '">' + esc(s) + "</span>"; }
  function signed(v, el) { return '<span class="' + (v < 0 ? "dn" : "") + '">' + M(v) + "</span>"; }

  /* ---------- shell ---------- */
  var root = document.getElementById("app");
  function route() {
    var h = (location.hash || "").replace("#", "");
    if (!h || h === "welcome" || h === "demo" || h.indexOf("import=") === 0) return { v: "dashboard" };
    if (h === "setup" || h === "start") return { v: h };
    if (h.indexOf("opp-") === 0) return { v: "opp", id: h.slice(4) };
    return { v: h };
  }
  function go(h) { if (location.hash === "#" + h) render(); else location.hash = h; }

  var lastRoute = "";
  function focusKey(el) {
    if (!el || el === document.body) return null;
    if (el.id) return "#" + el.id;
    var parts = Object.keys(el.dataset || {}).map(function (k) { return "[data-" + k.replace(/[A-Z]/g, function (c) { return "-" + c.toLowerCase(); }) + '="' + el.dataset[k] + '"]'; });
    return parts.length ? el.tagName.toLowerCase() + parts.join("") : null;
  }
  function topbar() {
    var slot = $("#wsSlot"); if (!slot) return;
    if (!st || route().v === "setup") { slot.innerHTML = '<a class="tb-link" href="index.html">Back to the site</a>'; return; }
    var first = (st.settings.name || "").trim();
    slot.innerHTML = '<div class="modesw" role="group" aria-label="Workspace"><button data-act="mode" data-v="demo" aria-pressed="' + (mode === "demo") + '">' + ic("demo") + '<span>Demo</span></button><button data-act="mode" data-v="live" aria-pressed="' + (mode === "live") + '">' + ic("me") + "<span>" + (live ? "My workspace" : "Set up mine") + "</span></button></div>" +
      '<button class="tb-search" data-act="palette" aria-label="Search and commands">' + ic("search") + '<span>Search</span><kbd>' + (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl ") + "K</kbd></button>" +
      '<span class="who"><span class="av" aria-hidden="true">' + esc((first || (mode === "demo" ? "D" : "A")).charAt(0).toUpperCase()) + '</span><span class="wsname">' + esc(mode === "demo" ? "Demo workspace" : first ? first + "'s workspace" : "Your workspace") + "</span></span>";
  }
  try { if (localStorage.getItem("aim.rail") === "1") document.documentElement.classList.add("rail-collapsed"); } catch (e) { }
  var REDUCED = (function () { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } })();
  var shellBuilt = false, lastView = "", lastTab = "", lastMode = "";
  function buildShell() {
    root.innerHTML = '<div id="ribbonSlot"></div><div class="app"><nav class="rail" aria-label="App"><div class="ind" aria-hidden="true"></div>' + NAV.map(function (n) {
      if (n[0] === "sep") return '<div class="sep"></div>';
      if (n[0] === "grp") return '<div class="grp">' + n[1] + "</div>";
      return '<a href="#' + n[0] + '" data-nav="' + n[0] + '" data-tip="' + n[1] + '" class="tip-side">' + ic(n[2]) + "<span>" + n[1] + "</span></a>";
    }).join("") + (FEEDBACK_URL ? '<a href="#" data-act="feedback" data-tip="Send feedback" class="tip-side">' + ic("send") + "<span>Send feedback</span></a>" : "") +
      '<div class="foot"><span class="ver">AIM ' + VERSION + '</span>Analysis and education, not investment, tax, or legal advice.</div><button class="collapse" data-act="rail" aria-label="Collapse the sidebar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg><span>Collapse</span></button></nav><main class="main" id="main"></main></div>';
    shellBuilt = true;
  }
  function moveIndicator(cur) {
    var rail = $(".rail"), ind = rail && rail.querySelector(".ind"); if (!ind) return;
    $$(".rail a[data-nav]").forEach(function (a) { if (a.dataset.nav === cur) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    var on = rail.querySelector('a[data-nav="' + cur + '"]');
    if (!on) { ind.classList.remove("on"); return; }
    var top = on.offsetTop; ind.style.top = top + "px"; ind.style.height = on.offsetHeight + "px";
    if (!ind.classList.contains("on")) { ind.style.transition = "none"; ind.classList.add("on"); void ind.offsetHeight; ind.style.transition = ""; }
  }
  function render() {
    var r = route();
    if (r.v === "setup") { shellBuilt = false; return renderSetup(); }
    if (!st) { shellBuilt = false; return renderStart(); }
    var fk = focusKey(document.activeElement);
    var view = VIEWS[r.v] ? r.v : "dashboard";
    var cur = view === "opp" ? "opportunities" : view;
    topbar();
    document.title = (view === "opp" ? "Analysis" : NAV_TITLES[view] || "Dashboard") + " | AIM" + (mode === "demo" ? " Demo" : "");
    if (!shellBuilt) buildShell();
    var ribbon = mode === "demo" ? '<div class="ribbon" role="note"><span class="rb-tag">Demo mode</span><span class="rb-txt">You are exploring a sample portfolio. Edit anything; it stays in the demo and never touches your own workspace.</span><span class="rb-act"><button class="btn sm link light-link" data-act="ask-reset-demo">Reset demo</button><button class="btn sm light" data-act="mode" data-v="live">' + (live ? "Go to my workspace" : "Set up my workspace") + "</button></span></div>" : "";
    var noStore = !STORAGE ? '<div class="ribbon warnr" role="note"><span class="rb-txt">This browser is blocking storage, so changes last only until you close the tab. Download a backup from Settings to keep your work.</span></div>' : "";
    var rs = $("#ribbonSlot"); if (rs.innerHTML !== ribbon + noStore) rs.innerHTML = ribbon + noStore;
    document.documentElement.classList.toggle("has-ribbon", mode === "demo");
    var main = $("#main");
    var routeKey = location.hash.replace(/^#(welcome|demo|start)$/, "#dashboard") + "|" + mode + "|" + ui.lesson + "|" + ui.plan;
    var pageChanged = routeKey !== lastRoute, tabChanged = !pageChanged && ui.tab !== lastTab;
    main.innerHTML = VIEWS[view](r);
    moveIndicator(cur);
    bindCharts(pageChanged || tabChanged);
    if (VIEWS[view].after) VIEWS[view].after(r);
    if (pageChanged) { lastRoute = routeKey; lastTab = ui.tab; window.scrollTo(0, 0); enter(main); }
    else if (tabChanged) { lastTab = ui.tab; var tb = $("#tabBody"); if (tb) enter(tb); }
    else if (fk) { try { var f = document.querySelector(fk); if (f) f.focus({ preventScroll: true }); } catch (e) { } }
  }
  /* Arrival: children rise in with a short stagger, numbers count to their value, bars grow to their width. */
  function enter(el) {
    if (REDUCED) return;
    el.classList.remove("enter"); void el.offsetWidth;
    Array.prototype.forEach.call(el.children, function (c, i) { c.style.setProperty("--i", Math.min(i, 10)); });
    el.classList.add("enter");
    setTimeout(function () { el.classList.remove("enter"); }, 900);
    $$(".kpi > strong, .m > strong, .mini b, .rv strong, .sumrow b", el).forEach(countUp);
    $$(".bar-p i, .meter i, .hbt i, .alloc i, .tornado .bar i", el).forEach(function (i) { var w = i.style.width; if (!w) return; i.style.transition = "none"; i.style.width = "0"; requestAnimationFrame(function () { requestAnimationFrame(function () { i.style.transition = ""; i.style.width = w; }); }); });
    $$(".dial .arc", el).forEach(function (a) { var d = a.getAttribute("stroke-dasharray"); a.style.transition = "none"; a.setAttribute("stroke-dasharray", "0 " + d.split(" ")[1]); requestAnimationFrame(function () { requestAnimationFrame(function () { a.style.transition = ""; a.setAttribute("stroke-dasharray", d); }); }); });
  }
  function countUp(el) {
    while (el.childElementCount === 1 && el.firstElementChild.textContent === el.textContent) el = el.firstElementChild;
    var t = el.textContent, m = /(-?−?)([$]?)(\d[\d,]*)(\.\d+)?/.exec(t); if (!m || el.dataset.counting) return;
    var target = parseFloat(m[3].replace(/,/g, "") + (m[4] || "")), dec = m[4] ? m[4].length - 1 : 0, start = performance.now(), dur = 650;
    if (!isFinite(target) || target === 0) return;
    el.dataset.counting = "1";
    function fmt(v) { var s = v.toFixed(dec); var parts = s.split("."); parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","); return parts.join("."); }
    (function tick(now) {
      var p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = t.slice(0, m.index) + m[1] + m[2] + fmt(target * e) + t.slice(m.index + m[0].length);
      if (p < 1 && el.isConnected) requestAnimationFrame(tick); else { el.textContent = t; delete el.dataset.counting; }
    })(start);
  }
  function later() { setTimeout(render, 0); }

  /* ---------- start screen: choose the demo or set up a real workspace ---------- */
  function renderStart() {
    document.documentElement.classList.remove("has-ribbon"); topbar(); document.title = "Get started | AIM";
    var hi = leadFirst ? "Welcome, " + esc(leadFirst) + "." : "Welcome to AIM.";
    root.innerHTML = '<div class="start"><div class="start-in"><span class="eyebrow">AIM ' + VERSION + '</span><h1>' + hi + ' How do you want to start?</h1><p class="lede">Both open instantly. You can switch between them any time from the top bar.</p><div class="choose">' +
      '<button class="choice" data-act="mode" data-v="demo"><span class="ci">' + ic("demo") + '</span><b>Explore the demo</b><span>A fully modeled sample portfolio: a duplex, a beach condo, a laundromat, a rental already owned, a budget, debts, and goals. Nothing to enter.</span><span class="go">Open the demo ' + ic("arrow") + "</span></button>" +
      '<button class="choice primary" data-act="mode" data-v="live"><span class="ci">' + ic("me") + '</span><b>Set up my workspace</b><span>A guided five minute setup for your real income, spending, accounts, debts, and targets. Then analyze the deals you are actually looking at.</span><span class="go">Start setup ' + ic("arrow") + "</span></button></div>" +
      '<p class="fine">' + ic("shield") + 'Your workspace is saved in this browser, not on AIM servers. <label for="startRestore" class="linkish">Restore from a backup file</label><input id="startRestore" type="file" accept="application/json,.json" class="sr"></p><div id="restoreSlot"></div></div></div>';
    if (lastRoute !== "start") { lastRoute = "start"; enter(root.querySelector(".start-in")); }
  }

  /* ---------- guided setup for the live workspace ---------- */
  var SETUP_STEPS = ["About you", "Monthly cash flow", "What you own and owe", "Your targets", "Review"];
  var EXP_CATS = [["housing", "Housing, rent or mortgage", "Fixed"], ["utilities", "Utilities and phone", "Fixed"], ["transport", "Car payment, gas, and insurance", "Fixed"], ["health", "Health insurance and care", "Fixed"], ["debtpay", "Other debt payments", "Fixed"], ["groceries", "Groceries", "Variable"], ["fun", "Dining, entertainment, and travel", "Variable"], ["other", "Everything else", "Variable"]];
  var PRESETS = { conservative: ["Conservative", 10, 1.35, 9, "Higher return and coverage bars, nine months of reserves."], balanced: ["Balanced", 8, 1.25, 6, "Typical lender coverage and a solid return. A good default."], growth: ["Growth", 6, 1.15, 4, "Accepts thinner margins for appreciation or a business you will grow."] };
  function setupState() {
    if (!ui.setup) ui.setup = { step: 0, name: leadFirst, email: lead && lead.email || "", focus: lead && lead.interests ? lead.interests.slice() : [], pay: "", side: "", exp: {}, cash: "", invest: "", retire: "", other: "", debts: [{ id: uid(), name: "", balance: "", rate: "", min: "" }], preset: "balanced", minCoc: 8, minDscr: 1.25, reserveMonths: 6, err: "" };
    return ui.setup;
  }
  function setupBuild(S) {
    var ws = { v: 1, sample: false, setupDone: true, created: new Date().toISOString(), settings: { name: S.name.trim(), email: S.email.trim(), focus: S.focus, minDscr: num(S.minDscr, 1.25), minCoc: num(S.minCoc, 8), reserveMonths: num(S.reserveMonths, 6) },
      budget: { income: [], expenses: [], goals: [] }, accounts: [], opps: [], history: [], lessonsDone: [], welcomed: true, onb: { targets: true, budget: true }, plan: planDefaults() };
    if (num(S.pay) > 0) ws.budget.income.push({ id: uid(), name: "Take home pay", amount: num(S.pay) });
    if (num(S.side) > 0) ws.budget.income.push({ id: uid(), name: "Other income", amount: num(S.side) });
    EXP_CATS.forEach(function (c) { if (num(S.exp[c[0]]) > 0) ws.budget.expenses.push({ id: uid(), name: c[1], amount: num(S.exp[c[0]]), kind: c[2] }); });
    [["cash", "Checking and savings", "Cash"], ["invest", "Brokerage and investments", "Investments"], ["retire", "Retirement accounts", "Retirement"], ["other", "Home, vehicle, and other assets", "Other asset"]].forEach(function (a) { if (num(S[a[0]]) > 0) ws.accounts.push({ id: uid(), name: a[1], type: a[2], value: num(S[a[0]]) }); });
    S.debts.forEach(function (d) { if (num(d.balance) > 0) ws.accounts.push({ id: uid(), name: d.name.trim() || "Debt", type: "Liability", value: num(d.balance), rate: num(d.rate), min: num(d.min) }); });
    var b = AIM.budget(ws.budget), cash = num(S.cash), reserve = b.expenses * ws.settings.reserveMonths;
    if (cash < reserve) ws.budget.goals.push({ id: uid(), name: "Emergency reserve", target: Math.round(reserve), saved: Math.round(cash), monthly: Math.max(0, Math.round(b.fcf * 0.3)) });
    ws.budget.goals.push({ id: uid(), name: "Next investment down payment", target: 50000, saved: 0, monthly: Math.max(0, Math.round(b.fcf * 0.4)) });
    ws.history.push({ month: NOW, value: Math.round(netWorthOf(ws).total) });
    if (b.fcf > 0) ws.plan.extra = Math.round(Math.min(500, b.fcf * 0.2) / 25) * 25;
    return ws;
  }
  function renderSetup() {
    var S = setupState(), k = S.step, tot = SETUP_STEPS.length;
    document.documentElement.classList.remove("has-ribbon"); topbar(); document.title = "Set up your workspace | AIM";
    function inp(id, label, val, o) { o = o || {}; return '<div class="f' + (o.full ? " full" : "") + '"><label for="' + id + '">' + label + (o.hint ? " <em>" + o.hint + "</em>" : "") + "</label>" + (o.money ? '<div class="inwrap pre"><span class="u">$</span>' : o.unit ? '<div class="inwrap post">' : "") + '<input id="' + id + '" data-su="' + (o.key || id) + '"' + (o.type ? ' type="' + o.type + '"' : o.money || o.unit || o.numeric ? ' type="number" inputmode="decimal" min="0" step="any"' : "") + ' value="' + esc(val) + '"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : "") + (o.ac ? ' autocomplete="' + o.ac + '"' : "") + ">" + (o.unit ? '<span class="u">' + o.unit + "</span></div>" : o.money ? "</div>" : "") + "</div>"; }
    var body = "";
    if (k === 0) {
      body = '<h2>Let us start with you</h2><p class="muted">AIM uses this to greet you and to point you at the right tools.</p><div class="fg" style="margin-top:18px">' + inp("su-name", "First name", S.name, { key: "name", full: true, ac: "given-name", ph: "Your first name" }) + inp("su-email", "Email", S.email, { key: "email", full: true, type: "email", ac: "email", hint: "Optional, for beta updates", ph: "you@example.com" }) + "</div>" +
        '<p class="lbl">What do you want AIM to help with?</p><div class="focus">' + [["Long term rentals", "Buy and hold rentals"], ["Short term rentals", "Vacation and Airbnb style units"], ["Business acquisitions", "Buying a small business"], ["Budget and net worth", "Budget, debts, and long term wealth"]].map(function (f) {
          return '<label class="fopt"><input type="checkbox" data-su-focus="' + esc(f[0]) + '"' + (S.focus.indexOf(f[0]) >= 0 ? " checked" : "") + "><span><b>" + f[0] + "</b><small>" + f[1] + "</small></span></label>";
        }).join("") + "</div>";
    } else if (k === 1) {
      var bi = num(S.pay) + num(S.side), be = EXP_CATS.reduce(function (a, c) { return a + num(S.exp[c[0]]); }, 0);
      body = '<h2>Your monthly cash flow</h2><p class="muted">Rough monthly numbers are fine. Use take home pay, after taxes. You can refine every line later.</p><h3 class="sh">Income</h3><div class="fg">' + inp("su-pay", "Take home pay", S.pay, { key: "pay", money: true, ph: "0" }) + inp("su-side", "Other income", S.side, { key: "side", money: true, ph: "0", hint: "Side work, rent you collect" }) + '</div><h3 class="sh">Spending</h3><div class="fg">' +
        EXP_CATS.map(function (c) { return inp("su-exp-" + c[0], c[1], S.exp[c[0]] == null ? "" : S.exp[c[0]], { key: "exp." + c[0], money: true, ph: "0" }); }).join("") + '</div><div class="sumrow" id="suSum">' + setupSum(bi, be) + "</div>";
    } else if (k === 2) {
      body = '<h2>What you own and owe</h2><p class="muted">Current balances. AIM keeps your emergency reserve out of the money it counts as available to invest.</p><h3 class="sh">Assets</h3><div class="fg">' + inp("su-cash", "Checking and savings", S.cash, { key: "cash", money: true, ph: "0" }) + inp("su-invest", "Brokerage and investments", S.invest, { key: "invest", money: true, ph: "0" }) + inp("su-retire", "Retirement accounts", S.retire, { key: "retire", money: true, ph: "0", hint: "401(k), IRA" }) + inp("su-other", "Home, vehicle, other", S.other, { key: "other", money: true, ph: "0" }) + "</div>" +
        '<h3 class="sh">Debts <em>Car loans, student loans, credit cards. Rates power the debt payoff planner.</em></h3><div class="debts">' + S.debts.map(function (d, i) {
          return '<div class="drow"><div class="f"><label for="sd-n-' + d.id + '">Name</label><input id="sd-n-' + d.id + '" data-sd="' + d.id + '" data-k="name" value="' + esc(d.name) + '" placeholder="Auto loan"></div><div class="f"><label for="sd-b-' + d.id + '">Balance</label><div class="inwrap pre"><span class="u">$</span><input id="sd-b-' + d.id + '" type="number" min="0" step="any" data-sd="' + d.id + '" data-k="balance" value="' + esc(d.balance) + '" placeholder="0"></div></div><div class="f"><label for="sd-r-' + d.id + '">Rate</label><div class="inwrap post"><input id="sd-r-' + d.id + '" type="number" min="0" step="any" data-sd="' + d.id + '" data-k="rate" value="' + esc(d.rate) + '" placeholder="0"><span class="u">%</span></div></div><div class="f"><label for="sd-m-' + d.id + '">Min payment</label><div class="inwrap pre"><span class="u">$</span><input id="sd-m-' + d.id + '" type="number" min="0" step="any" data-sd="' + d.id + '" data-k="min" value="' + esc(d.min) + '" placeholder="0"></div></div><button class="x" data-act="su-del-debt" data-id="' + d.id + '" aria-label="Remove debt"' + (S.debts.length < 2 ? " disabled" : "") + ">×</button></div>";
        }).join("") + '</div><button class="btn sm ghost" data-act="su-add-debt">Add another debt</button>';
    } else if (k === 3) {
      body = '<h2>Your investment targets</h2><p class="muted">Every AIM Score, target price, and risk flag is measured against these. Pick a starting point, then adjust.</p><div class="presets">' + Object.keys(PRESETS).map(function (p) {
        var x = PRESETS[p]; return '<button class="preset" data-act="su-preset" data-v="' + p + '" aria-pressed="' + (S.preset === p) + '"><b>' + x[0] + "</b><span class=\"num\">" + x[1] + "% · " + x[2].toFixed(2) + " · " + x[3] + " mo</span><small>" + x[4] + "</small></button>";
      }).join("") + '</div><div class="fg g3f">' + inp("su-coc", "Minimum cash on cash", S.minCoc, { key: "minCoc", unit: "%" }) + inp("su-dscr", "Minimum debt coverage", S.minDscr, { key: "minDscr", numeric: true }) + inp("su-res", "Emergency reserve", S.reserveMonths, { key: "reserveMonths", unit: "mos" }) + '</div><p class="note">Cash on cash is the yearly cash a deal returns on the cash you put in. Debt coverage (DSCR) is net operating income divided by loan payments; most lenders want 1.20 to 1.25.</p>';
    } else {
      var ws = setupBuild(S), b = AIM.budget(ws.budget), nw = netWorthOf(ws), cash = num(S.cash), reserve = b.expenses * ws.settings.reserveMonths, debt = ws.accounts.filter(function (a) { return a.type === "Liability"; });
      body = '<h2>Review your workspace</h2><p class="muted">This is where you stand today. Go back to change anything, or open your workspace.</p><div class="review">' +
        [["Net worth", M(nw.total)], ["Monthly free cash flow", M(b.fcf)], ["Savings rate", P(b.savingsRate, 0)], ["Available to invest", M(Math.max(0, cash - reserve)), "after a " + M(reserve) + " reserve"], ["Debts", debt.length ? M(nw.liabilities) : "None", debt.length ? debt.length + " balance" + (debt.length > 1 ? "s" : "") : ""], ["Targets", ws.settings.minCoc + "% · " + ws.settings.minDscr.toFixed(2), "cash on cash · coverage"]].map(function (x) { return '<div class="rv"><small>' + x[0] + "</small><strong>" + x[1] + "</strong>" + (x[2] ? "<span>" + x[2] + "</span>" : "") + "</div>"; }).join("") +
        "</div>" + (b.income <= 0 ? '<p class="note warnn">You have not entered any income, so AIM cannot measure savings or readiness yet. You can add it later in Budget and goals.</p>' : "") + '<p class="lbl">Start with a first analysis? <em>Optional</em></p><div class="focus three">' + [["rental", "Long term rental"], ["str", "Short term rental"], ["business", "Business"]].map(function (t) { return '<label class="fopt"><input type="radio" name="sufirst" value="' + t[0] + '"' + (S.first === t[0] ? " checked" : "") + ' data-su-first="1"><span><b>' + t[1] + "</b></span></label>"; }).join("") + '<label class="fopt"><input type="radio" name="sufirst" value=""' + (!S.first ? " checked" : "") + ' data-su-first="1"><span><b>Not now</b></span></label></div>';
    }
    root.innerHTML = '<div class="setup"><div class="setup-in"><div class="sprog"><span class="eyebrow">Set up your workspace · Step ' + (k + 1) + " of " + tot + '</span><ol>' + SETUP_STEPS.map(function (t, i) { return '<li class="' + (i < k ? "done" : i === k ? "on" : "") + '"><span>' + (i < k ? "✓" : i + 1) + "</span>" + t + "</li>"; }).join("") + '</ol><div class="bar-p"><i style="width:' + ((k + 1) / tot * 100).toFixed(0) + '%"></i></div></div><form class="card scard" id="setupForm" novalidate><div class="body">' + body + (S.err ? '<p class="err" role="alert">' + esc(S.err) + "</p>" : "") + '</div><footer><span>' + (k > 0 ? '<button type="button" class="btn ghost" data-act="su-back">Back</button>' : '<button type="button" class="btn ghost" data-act="su-cancel">' + (demo || live ? "Cancel" : "Back") + "</button>") + "</span><span>" + (k > 0 && k < tot - 1 ? '<button type="button" class="btn link" data-act="su-skip">Skip for now</button>' : "") + '<button class="btn" type="submit">' + (k === tot - 1 ? "Open my workspace" : "Continue") + "</button></span></footer></form><p class=\"fine center\">" + ic("shield") + "Saved only in this browser. Nothing is sent to AIM servers.</p></div></div>";
    var f = root.querySelector("input:not([type=checkbox]):not([type=radio])"); if (!lastRoute.startsWith("setup" + k)) { lastRoute = "setup" + k; var sb = root.querySelector(".scard .body"); if (sb) enter(sb); if (f && k < 4) f.focus({ preventScroll: true }); window.scrollTo(0, 0); }
  }
  function setupSum(bi, be) { var f = bi - be; return '<div><small>Income</small><b class="num">' + M(bi) + '</b></div><div><small>Spending</small><b class="num">' + M(be) + '</b></div><div><small>Free cash flow</small><b class="num ' + (f < 0 ? "dn" : "up") + '">' + M(f) + "</b></div>"; }
  function setupNext(skip) {
    var S = setupState(); S.err = "";
    if (!skip && S.step === 0 && !S.name.trim()) { S.err = "Enter your first name to continue."; renderSetup(); var n = $("#su-name"); if (n) n.focus(); return; }
    if (!skip && S.step === 0 && S.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(S.email.trim())) { S.err = "That email does not look right. Fix it or leave it blank."; renderSetup(); return; }
    if (!skip && S.step === 3 && (num(S.minDscr) <= 0 || num(S.minCoc) < 0 || num(S.reserveMonths) < 0)) { S.err = "Targets must be positive numbers."; renderSetup(); return; }
    if (S.step < SETUP_STEPS.length - 1) { S.step++; lastRoute = ""; renderSetup(); return; }
    var ws = setupBuild(S), first = S.first;
    live = ws; store(KEY, live); ui.setup = null; setMode("live", true);
    if (first) { var o = { id: uid(), type: first, name: { rental: "My first rental", str: "My first short term rental", business: "My first business" }[first], location: "", status: "Evaluating", created: NOW, notes: "", inputs: Object.assign({}, AIM.DEFAULTS[first]) }; logEvent(o, "Analysis created"); st.opps.unshift(o); st.onb.deal = true; save(); toast("Workspace ready. Replace the starting assumptions with real numbers."); go("opp-" + o.id); }
    else { toast("Your workspace is ready"); go("dashboard"); }
  }

  /* ---------- views ---------- */
  var VIEWS = {};

  VIEWS.dashboard = function () {
    var c = ctx(), b = AIM.budget(st.budget), nw = netWorthOf(st), hist = st.history, prev = hist.length > 1 ? hist[hist.length - 2].value : null;
    var hr = new Date().getHours(), greet = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening", first = (st.settings.name || "").trim();
    var evals = st.opps.filter(function (o) { return o.status === "Evaluating"; }).map(function (o) { return { o: o, sc: scoreOf(o, c) }; }).sort(function (a, b) { return b.sc.total - a.sc.total; });
    var owned = st.opps.filter(function (o) { return o.status === "Owned" && o.owned; });
    var att = attention(c, evals, owned, b);
    var h = "";
    if (!st.welcomed && mode === "demo") h += '<div class="banner"><span><b>Welcome to the AIM demo' + (first ? ", " + esc(first) : "") + ".</b> Every module is loaded with a sample portfolio. Open a deal, change a number, and watch the score, target price, and risk flags update. When you are ready, set up your own workspace from the top bar.</span><button class=\"btn sm ghost\" data-act=\"welcomed\">Got it</button></div>";
    h += '<div class="ph"><div><h1>' + greet + (first ? ", " + esc(first) : "") + '</h1><p>Here is what you own, what you are considering, and what needs attention.</p></div><div class="actions"><button class="btn" data-act="new-opp">New analysis</button></div></div>';
    h += '<div class="grid g4" style="margin-bottom:18px">' +
      '<div class="card kpi hero"><small>Net worth</small><strong>' + M(nw.total) + "</strong><span>" + (prev != null ? '<span class="' + (nw.total >= prev ? "up" : "dn") + '">' + (nw.total >= prev ? "+" : "") + M(nw.total - prev) + "</span> since last month" : "Record a snapshot to track change") + "</span></div>" +
      '<div class="card kpi"><small>Cash available to invest</small><strong>' + M(c.available) + "</strong><span>After your " + M(c.reserve) + " reserve</span></div>" +
      '<div class="card kpi"><small>Monthly free cash flow</small><strong>' + signed(b.fcf) + "</strong><span>" + M(b.income) + " in, " + M(b.expenses) + " out</span></div>" +
      '<div class="card kpi"><small>Savings rate</small><strong>' + P(b.savingsRate, 0) + "</strong><span>Of monthly income</span></div></div>";
    var steps = [["targets", "Set your return targets", "settings"], ["budget", "Enter your real budget", "budget"], ["deal", "Analyze a deal of your own", "opportunities"], ["bot", "Ask AIMBot a question", "aimbot"], ["lesson", "Finish an AIM Learning lesson", "learn"]];
    var on = st.onb || {}, doneN = steps.filter(function (x) { return on[x[0]]; }).length;
    if (mode !== "demo" && !st.onbHidden && doneN < steps.length) h += '<section class="card" style="margin-bottom:18px"><header><h2>Get started</h2><span style="display:flex;gap:10px;align-items:center"><span class="muted num" style="font-size:13px">' + doneN + " of " + steps.length + '</span><button class="btn sm link" data-act="hide-onb">Hide</button></span></header><div class="onb">' + steps.map(function (x) {
      return '<a class="step' + (on[x[0]] ? " done" : "") + '" href="#' + x[2] + '"><span class="tick" aria-hidden="true">' + (on[x[0]] ? "✓" : "") + "</span><span>" + x[1] + '</span><span class="sr">' + (on[x[0]] ? "done" : "not done") + "</span></a>";
    }).join("") + "</div></section>";
    h += '<div class="grid split"><div class="stack">';
    h += '<section class="card"><header><h2>Needs your attention</h2><span class="muted" style="font-size:13px">' + att.length + " items</span></header>" + (att.length ? att.map(function (a) {
      return '<div class="att"><span class="flag" style="padding:0;border:0"><span class="sev ' + a.sev + '"></span></span><div><b>' + esc(a.title) + "</b><p>" + esc(a.text) + "</p></div>" + (a.go ? '<a class="btn sm ghost" href="#' + a.go + '">Open</a>' : "<span></span>") + "</div>";
    }).join("") : '<div class="empty">Nothing urgent. Your numbers are on track.</div>') + "</section>";
    h += '<section class="card"><header><h2>Opportunities you are evaluating</h2><a class="btn sm link" href="#opportunities">See all</a></header>' + (evals.length ? '<div class="tw"><table><thead><tr><th>Opportunity</th><th class="r">Cash needed</th><th class="r">Cash flow / mo</th><th class="r">Cash on cash</th><th class="r">Score</th></tr></thead><tbody>' + evals.map(function (x) {
      return '<tr class="click" data-go="opp-' + x.o.id + '"><td><div class="oname"><b>' + esc(x.o.name) + "</b><span>" + TYPE[x.o.type] + (x.o.location ? " · " + esc(x.o.location) : "") + '</span></div></td><td class="n">' + M(x.sc.r.cash) + '</td><td class="n">' + signed(x.sc.r.cfMonth) + '</td><td class="n">' + P(x.sc.r.coc) + '</td><td class="r"><span class="score ' + gradeClass(x.sc.grade) + '">' + x.sc.total + "</span></td></tr>";
    }).join("") + "</tbody></table></div>" : startDeal()) + "</section>";
    h += "</div><div class=\"stack\">";
    var debts = liabilities(), pl = plan();
    if (debts.length) {
      var dp = AIM.debtPlan(debtsOf(debts), pl.extra, pl.method), tot = debts.reduce(function (a, x) { return a + num(x.value); }, 0);
      h += '<section class="card"><header><h2>Debt payoff</h2><a class="btn sm link" href="#planner" data-act="plan-tab" data-v="debt">Plan</a></header><div class="body mini"><div><small>Total owed</small><b class="num">' + M(tot) + '</b></div><div><small>Debt free</small><b class="num">' + (dp.feasible ? ymLabel(addMonths(NOW, dp.months)) : "Not on track") + '</b></div><p class="muted">' + (dp.feasible ? "Paying " + M(dp.payment) + " a month with the " + dp.method + " method. Interest still to pay: " + M(dp.totalInterest) + "." : "Your payments do not cover the interest on every balance. Raise the payment in the planner.") + "</p></div></section>";
    }
    var pj = projOf();
    if (pj.target > 0) h += '<section class="card"><header><h2>Financial independence</h2><a class="btn sm link" href="#planner" data-act="plan-tab" data-v="fi">Plan</a></header><div class="body mini"><div><small>Your number</small><b class="num">' + M(pj.target, { compact: true }) + '</b></div><div><small>Reached in</small><b class="num">' + (pj.fiYears == null ? "Over 100 yrs" : pj.fiYears < 0.1 ? "Reached" : pj.fiYears.toFixed(1) + " yrs") + '</b></div><p class="muted">At ' + M(pj.monthly) + " invested a month and a " + pj.ret + "% real return, starting from " + M(pj.start) + ".</p></div></section>";
    if (hist.length > 1) h += '<section class="card"><header><h2>Net worth trend</h2><a class="btn sm link" href="#networth">Details</a></header><div class="body">' + chart("nwc", hist.map(function (x) { return ymLabel(x.month).slice(0, 3); }), [{ name: "Net worth", color: "var(--c1)", values: hist.map(function (x) { return x.value; }) }], { area: true, h: 200, label: "Net worth over the last year", maxLabels: 6 }) + "</div></section>";
    h += '<section class="card"><header><h2>Owned assets</h2></header>' + (owned.length ? owned.map(function (o) {
      var pf = ownedPerf(o), e = ownedEquity(o), last = pf.rows[pf.rows.length - 1];
      return '<div class="att" style="grid-template-columns:1fr auto"><div><b>' + esc(o.name) + '</b><p>Equity ' + M(e.equity) + (last ? " · " + ymLabel(last.a.month) + " cash flow " + M(last.cf) + " vs plan " + M(last.plan) : "") + '</p></div><a class="btn sm ghost" href="#opp-' + o.id + '">Open</a></div>';
    }).join("") : '<div class="empty">Mark an analysis as Owned to track it here.</div>') + "</section>";
    h += '<section class="card"><header><h2>Savings goals</h2><a class="btn sm link" href="#budget">Edit</a></header><div class="body" style="padding-block:4px">' + (st.budget.goals.length ? st.budget.goals.map(goalRow).join("") : '<div class="empty">No goals yet.</div>') + "</div></section>";
    h += "</div></div>";
    return h;
  };
  function startDeal() {
    return '<div class="starter"><p>Analyze a deal you are looking at. AIM fills in typical assumptions so you see results right away.</p><div class="starter-btns">' + [["rental", "Long term rental", "Duplex, single family"], ["str", "Short term rental", "Vacation or Airbnb"], ["business", "Business", "Laundromat, services"]].map(function (t) {
      return '<button class="sbtn" data-act="new-opp" data-type="' + t[0] + '"><b>' + t[1] + "</b><span>" + t[2] + "</span></button>";
    }).join("") + "</div></div>";
  }
  function liabilities() { return st.accounts.filter(function (a) { return a.type === "Liability" && num(a.value) > 0; }); }
  function debtsOf(list) { return list.map(function (a) { return { name: a.name, balance: num(a.value), rate: num(a.rate), min: num(a.min) }; }); }
  function projOf() {
    var pl = plan(), b = AIM.budget(st.budget), inv = st.accounts.filter(function (a) { return a.type === "Investments" || a.type === "Retirement"; }).reduce(function (s, a) { return s + num(a.value); }, 0);
    var start = pl.start == null ? inv : num(pl.start), monthly = pl.monthly == null ? Math.max(0, Math.round(b.fcf)) : num(pl.monthly), spend = pl.spend == null ? Math.round(b.expenses) : num(pl.spend);
    var r = AIM.projection({ start: start, monthly: monthly, ret: pl.ret, years: pl.years, expenses: spend, swr: pl.swr });
    r.start = start; r.monthly = monthly; r.spend = spend; r.ret = pl.ret; r.swr = pl.swr; r.years = pl.years; r.invested = inv;
    return r;
  }

  /* ---------- planner: debt payoff and financial independence ---------- */
  VIEWS.planner = function () {
    var tabs = [["debt", "Debt payoff"], ["fi", "Financial independence"]];
    var h = '<div class="ph"><div><h1>Planner</h1><p>Two long range plans built from your budget and balances: getting out of debt, and reaching financial independence.</p></div></div>';
    h += '<div class="tabs" role="tablist">' + tabs.map(function (t) { return '<button role="tab" aria-selected="' + (ui.plan === t[0]) + '" data-act="plan-tab" data-v="' + t[0] + '">' + t[1] + "</button>"; }).join("") + "</div>";
    return h + (ui.plan === "fi" ? planFi() : planDebt());
  };
  function planDebt() {
    var debts = liabilities(), pl = plan(), b = AIM.budget(st.budget);
    if (!debts.length) return '<div class="card empty"><p>No debts recorded. If you have a car loan, student loan, or card balance, add it to see your debt free date.</p><button class="btn sm" data-act="add-debt">Add a debt</button></div>';
    var list = debtsOf(debts), av = AIM.debtPlan(list, pl.extra, "avalanche"), sb = AIM.debtPlan(list, pl.extra, "snowball"), base = AIM.debtPlan(list, 0, pl.method), cur = pl.method === "snowball" ? sb : av;
    var tot = list.reduce(function (a, d) { return a + d.balance; }, 0), mins = list.reduce(function (a, d) { return a + d.min; }, 0), wrate = tot > 0 ? list.reduce(function (a, d) { return a + d.balance * d.rate; }, 0) / tot : 0;
    var h = '<div class="grid g4" style="margin-bottom:18px"><div class="card kpi"><small>Total owed</small><strong>' + M(tot) + "</strong><span>" + list.length + " balance" + (list.length > 1 ? "s" : "") + '</span></div><div class="card kpi"><small>Average rate</small><strong>' + wrate.toFixed(2) + '%</strong><span>Weighted by balance</span></div><div class="card kpi"><small>Monthly payment</small><strong>' + M(cur.payment) + "</strong><span>" + M(mins) + " minimums + " + M(pl.extra) + ' extra</span></div><div class="card kpi hero"><small>Debt free</small><strong>' + (cur.feasible ? ymLabel(addMonths(NOW, cur.months)) : "Not on track") + "</strong><span>" + (cur.feasible ? cur.months + " months, " + M(cur.totalInterest) + " interest" : "Payments do not cover interest") + "</span></div></div>";
    h += '<div class="grid split" style="align-items:start"><div class="stack"><section class="card"><header><h2>Your plan</h2></header><div class="body"><div class="fg one-sm"><div class="f"><label for="pl-extra">Extra each month <em>beyond minimums</em></label><div class="inwrap pre"><span class="u">$</span><input id="pl-extra" type="number" min="0" step="25" value="' + pl.extra + '" data-plan="extra"></div></div><div class="f"><span class="lbl2" id="pl-m-l">Method</span><div class="seg" role="group" aria-labelledby="pl-m-l">' + [["avalanche", "Avalanche"], ["snowball", "Snowball"]].map(function (m) { return '<button type="button" data-act="plan-method" data-v="' + m[0] + '" aria-pressed="' + (pl.method === m[0]) + '">' + m[1] + "</button>"; }).join("") + '</div></div></div><p class="note" style="margin-top:12px">' + (pl.method === "snowball" ? "Snowball pays the smallest balance first for quick wins, then rolls each freed payment into the next." : "Avalanche pays the highest rate first, which costs the least interest, then rolls each freed payment into the next.") + (b.fcf > 0 ? " Your budget frees up " + M(b.fcf) + " a month." : "") + "</p></div></section>";
    var n = Math.max(av.series.length, sb.series.length, base.series.length), labels = [], step = Math.max(1, Math.ceil(n / 60));
    function pick(sr) { var out = []; for (var i = 0; i < n; i += step) out.push(sr[Math.min(i, sr.length - 1)].balance); return out; }
    for (var i = 0; i < n; i += step) labels.push(ymLabel(addMonths(NOW, i)));
    var ser = [{ name: "Your plan, " + (pl.method === "snowball" ? "snowball" : "avalanche"), color: "var(--c1)", values: pick(cur.series) }];
    if (pl.extra > 0 && base.feasible !== false) ser.push({ name: "No extra payment", color: "var(--c3)", values: pick(base.series), dash: true });
    h += '<section class="card"><header><h2>Balance over time</h2></header><div class="body">' + chart("debtc", labels, ser, { h: 230, zero: true, label: "Total debt balance by month", maxLabels: 6 }) + "</div></section>";
    h += '<section class="card"><header><h2>Your debts</h2><button class="btn sm ghost" data-act="add-debt">Add debt</button></header><div class="tw"><table><thead><tr><th>Debt</th><th class="r">Balance</th><th class="r">Rate</th><th class="r">Min payment</th><th class="r">Paid off</th><th></th></tr></thead><tbody>' + debts.map(function (a) {
      var d = cur.debts.filter(function (x) { return x.name === a.name && Math.abs(x.start - num(a.value)) < 0.01; })[0];
      return '<tr><td><input value="' + esc(a.name) + '" data-acct="' + a.id + '" data-k="name" aria-label="Debt name"></td><td style="width:140px"><div class="inwrap pre"><span class="u">$</span><input type="number" min="0" value="' + num(a.value) + '" data-acct="' + a.id + '" data-k="value" aria-label="Balance" style="text-align:right"></div></td><td style="width:110px"><div class="inwrap post"><input type="number" min="0" step="0.1" value="' + num(a.rate) + '" data-acct="' + a.id + '" data-k="rate" aria-label="Interest rate" style="text-align:right"><span class="u">%</span></div></td><td style="width:130px"><div class="inwrap pre"><span class="u">$</span><input type="number" min="0" step="5" value="' + num(a.min) + '" data-acct="' + a.id + '" data-k="min" aria-label="Minimum payment" style="text-align:right"></div></td><td class="n">' + (d && d.paidOff != null ? ymLabel(addMonths(NOW, d.paidOff)) : "Not paid off") + '</td><td style="width:44px"><button class="x" data-act="del-acct" data-id="' + a.id + '" aria-label="Remove debt">×</button></td></tr>';
    }).join("") + "</tbody></table></div></section></div>";
    var rows = [["Avalanche", av], ["Snowball", sb], ["No extra payment", AIM.debtPlan(list, 0, pl.method)]];
    h += '<div class="stack"><section class="card"><header><h2>Compare methods</h2></header><div class="tw"><table><thead><tr><th></th><th class="r">Debt free</th><th class="r">Interest</th></tr></thead><tbody>' + rows.map(function (r) {
      return "<tr" + ((r[0].toLowerCase() === pl.method) ? ' class="sub"' : "") + "><td>" + r[0] + '</td><td class="n">' + (r[1].feasible ? ymLabel(addMonths(NOW, r[1].months)) : "Never") + '</td><td class="n">' + (r[1].feasible ? M(r[1].totalInterest) : "n/a") + "</td></tr>";
    }).join("") + "</tbody></table></div>" + (av.feasible && sb.feasible ? '<div class="body note">' + (Math.abs(sb.totalInterest - av.totalInterest) < 1 ? "Both methods cost the same here." : "Avalanche saves " + M(sb.totalInterest - av.totalInterest) + " in interest over snowball.") + (rows[2][1].feasible && pl.extra > 0 ? " Your extra " + M(pl.extra) + " a month saves " + M(rows[2][1].totalInterest - cur.totalInterest) + " and " + (rows[2][1].months - cur.months) + " months versus paying no extra." : "") + "</div>" : "") + "</section>";
    h += '<section class="card"><header><h2>Payoff order</h2></header><ol class="timeline">' + cur.debts.map(function (d) { return "<li><time>" + (d.paidOff != null ? ymLabel(addMonths(NOW, d.paidOff)) : "Not paid off") + "</time><span><b>" + esc(d.name) + "</b> · " + M(d.start) + " at " + d.rate + "% · " + M(d.interest) + " interest</span></li>"; }).join("") + "</ol></section>";
    h += '<section class="card"><div class="body note">Interest compounds monthly at each rate. The total payment stays the same as balances close, so each freed minimum speeds up the next debt. No extra payment means minimums only, still rolled forward as debts close. Actual lender terms, fees, and promotional rates can differ.</div></section></div></div>';
    return h;
  }
  function planFi() {
    var pj = projOf(), pl = plan(), b = AIM.budget(st.budget);
    var h = '<div class="grid g4" style="margin-bottom:18px"><div class="card kpi hero"><small>Your independence number</small><strong>' + M(pj.target) + "</strong><span>" + M(pj.spend * 12) + " a year at a " + pl.swr + '% withdrawal rate</span></div><div class="card kpi"><small>Reached in</small><strong>' + (pj.fiYears == null ? "Over 100 yrs" : pj.fiMonth === 0 ? "Reached" : pj.fiYears.toFixed(1) + " yrs") + "</strong><span>" + (pj.fiMonth ? ymLabel(addMonths(NOW, pj.fiMonth)) : pj.fiMonth === 0 ? "You are there today" : "Raise savings or return") + '</span></div><div class="card kpi"><small>In ' + pl.years + ' years</small><strong>' + M(pj.end) + "</strong><span>" + M(pj.end - pj.contributed) + ' from growth</span></div><div class="card kpi"><small>Monthly income it supports</small><strong>' + M(pj.monthlyIncomeAtEnd) + "</strong><span>In " + pl.years + " years, in today's dollars</span></div></div>";
    function fld(k, label, val, unit, hint, step) { return '<div class="f"><label for="pf-' + k + '">' + label + '</label><div class="inwrap ' + (unit === "$" ? "pre" : "post") + '">' + (unit === "$" ? '<span class="u">$</span>' : "") + '<input id="pf-' + k + '" type="number" step="' + (step || "any") + '" value="' + val + '" data-plan="' + k + '">' + (unit !== "$" ? '<span class="u">' + unit + "</span>" : "") + "</div>" + (hint ? '<small class="hint">' + hint + "</small>" : "") + "</div>"; }
    h += '<div class="grid split-r" style="align-items:start"><section class="card"><header><h2>Assumptions</h2><button class="btn sm link" data-act="plan-reset">Use my numbers</button></header><div class="body"><div class="fg">' +
      fld("start", "Invested today", Math.round(pj.start), "$", pl.start == null ? "from your accounts" : "", 1000) + fld("monthly", "Invested each month", Math.round(pj.monthly), "$", pl.monthly == null ? "your free cash flow" : "", 50) +
      fld("spend", "Spending in retirement", Math.round(pj.spend), "$", pl.spend == null ? "per month, from your budget" : "per month", 50) + fld("ret", "Return after inflation", pl.ret, "%", "", 0.5) + fld("swr", "Withdrawal rate", pl.swr, "%", "", 0.25) + fld("years", "Years to project", pl.years, "yrs", "", 1) +
      '</div><p class="note" style="margin-top:12px">Returns are real, after inflation, so every figure is in today\'s dollars. A 4% withdrawal rate means your portfolio needs to be 25 times your yearly spending. Markets do not return a steady rate, so treat this as a direction, not a promise.</p></div></section>';
    var pts = pj.points, labels = pts.map(function (p) { return p.year === 0 ? "Now" : "Yr " + p.year; });
    h += '<section class="card"><header><h2>Projected portfolio</h2></header><div class="body">' + chart("fic", labels, [{ name: "Portfolio", color: "var(--c1)", values: pts.map(function (p) { return p.balance; }) }, { name: "Your contributions", color: "var(--c2)", values: pts.map(function (p) { return p.contributed; }) }, { name: "Independence number", color: "var(--c3)", values: pts.map(function () { return pj.target; }), dash: true }], { h: 260, zero: true, label: "Projected portfolio by year", maxLabels: 8 }) + "</div></section></div>";
    var mil = pts.filter(function (p) { return p.year > 0 && (p.year % 5 === 0 || p.year === pl.years); });
    h += '<section class="card" style="margin-top:18px"><header><h2>Milestones</h2></header><div class="tw"><table><thead><tr><th>Year</th><th class="r">Portfolio</th><th class="r">Contributed</th><th class="r">Growth</th><th class="r">Progress</th><th class="r">Monthly income at ' + pl.swr + "%</th></tr></thead><tbody>" + mil.map(function (p) {
      return "<tr><td>" + ymLabel(addMonths(NOW, p.year * 12)) + ' <span class="muted" style="font-size:12.5px">year ' + p.year + '</span></td><td class="n">' + M(p.balance) + '</td><td class="n">' + M(p.contributed) + '</td><td class="n">' + M(p.growth) + '</td><td class="n">' + (pj.target > 0 ? P(Math.min(1, p.balance / pj.target), 0) : "n/a") + '</td><td class="n">' + M(p.balance * pl.swr / 100 / 12) + "</td></tr>";
    }).join("") + "</tbody></table></div></section>";
    var faster = AIM.projection({ start: pj.start, monthly: pj.monthly + 500, ret: pl.ret, years: pl.years, expenses: pj.spend, swr: pl.swr });
    if (pj.fiYears != null && faster.fiYears != null && pj.fiMonth > 0) h += '<div class="banner" style="margin-top:18px"><span><b>What moves the date:</b> investing ' + M(500) + " more a month gets you there in " + faster.fiYears.toFixed(1) + " years instead of " + pj.fiYears.toFixed(1) + ". Cutting retirement spending by 10% lowers your number to " + M(pj.target * 0.9) + ".</span></div>";
    return h;
  }

  function goalRow(g) {
    var p = g.target > 0 ? Math.min(1, g.saved / g.target) : 0, left = Math.max(0, g.target - g.saved), mo = g.monthly > 0 ? Math.ceil(left / g.monthly) : null;
    return '<div class="goal"><div class="top"><b>' + esc(g.name) + '</b><span class="num">' + M(g.saved) + " of " + M(g.target) + '</span></div><div class="bar-p" role="progressbar" aria-valuenow="' + Math.round(p * 100) + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + (p * 100).toFixed(1) + '%"></i></div><small>' + (left <= 0 ? "Reached" : mo ? "About " + mo + " months at " + M(g.monthly) + " a month, " + ymLabel(addMonths(NOW, mo)) : "Add a monthly amount to see a finish date") + "</small></div>";
  }
  function attention(c, evals, owned, b) {
    var out = [];
    evals.forEach(function (x) { var f = x.sc.flags.filter(function (f) { return f.sev === "high"; })[0] || x.sc.flags.filter(function (f) { return f.sev === "med" && f.cat === "risk"; })[0]; if (f) out.push({ sev: f.sev, title: x.o.name + ": " + f.title, text: f.action, go: "opp-" + x.o.id }); });
    owned.forEach(function (o) {
      var pf = ownedPerf(o), last = pf.rows[pf.rows.length - 1];
      if (last && last.cf < last.plan - Math.max(150, Math.abs(last.plan) * 0.25)) out.push({ sev: "med", title: o.name + ": " + ymLabel(last.a.month) + " came in under plan", text: "Cash flow was " + M(last.cf) + " against a plan of " + M(last.plan) + (last.a.note ? ". Note: " + last.a.note : "") + ".", go: "opp-" + o.id });
    });
    if (c.cash < c.reserve) out.push({ sev: "high", title: "Emergency reserve is short", text: "You hold " + M(c.cash) + " in cash against a " + M(c.reserve) + " target.", go: "budget" });
    var contrib = st.budget.goals.reduce(function (s, g) { return s + num(g.monthly); }, 0);
    if (contrib > b.fcf && b.income > 0) out.push({ sev: "med", title: "Goal contributions exceed free cash flow", text: "You plan to save " + M(contrib) + " a month but only free up " + M(b.fcf) + ".", go: "budget" });
    if (evals.length && evals[0].sc.total >= 50) out.push({ sev: "info", title: evals[0].o.name + " is your top opportunity", text: "Score " + evals[0].sc.total + ". Review its downside case before making an offer.", go: "opp-" + evals[0].o.id });
    var rank = { high: 0, med: 1, info: 2 };
    return out.sort(function (a, b) { return rank[a.sev] - rank[b.sev]; }).slice(0, 6);
  }

  VIEWS.opportunities = function () {
    var c = ctx(), q = (ui.q || "").toLowerCase(), list = st.opps.filter(function (o) { return (ui.filter === "All" || o.status === ui.filter) && (!q || (o.name + " " + (o.location || "") + " " + TYPE[o.type]).toLowerCase().indexOf(q) >= 0); });
    var scored = list.map(function (o) { return { o: o, sc: scoreOf(o, c) }; }), sort = ui.sort || "score";
    scored.sort(function (a, b) { return sort === "score" ? b.sc.total - a.sc.total : sort === "cf" ? b.sc.r.cfYear - a.sc.r.cfYear : sort === "cash" ? a.sc.r.cash - b.sc.r.cash : sort === "name" ? a.o.name.localeCompare(b.o.name) : 0; });
    var counts = { All: st.opps.length }; st.opps.forEach(function (o) { counts[o.status] = (counts[o.status] || 0) + 1; });
    var h = '<div class="ph"><div><h1>Opportunities</h1><p>Every deal you have analyzed, from first look to ownership.</p></div><div class="actions"><button class="btn ghost" data-act="csv" data-v="opps">Export CSV</button><button class="btn" data-act="new-opp">New analysis</button></div></div>';
    h += '<div class="toolbar"><div class="chips" role="group" aria-label="Filter by status">' + ["All", "Evaluating", "Owned", "Passed"].map(function (f) { return '<button class="chip" data-act="filter" data-v="' + f + '" aria-pressed="' + (ui.filter === f) + '">' + f + " " + (counts[f] || 0) + "</button>"; }).join("") + '</div><div class="tools"><label for="oppSearch" class="sr">Search</label><input id="oppSearch" type="search" placeholder="Search by name or place" value="' + esc(ui.q || "") + '"><label for="oppSort" class="sr">Sort</label><select id="oppSort">' + [["score", "Sort by score"], ["cf", "Sort by cash flow"], ["cash", "Sort by cash needed"], ["name", "Sort by name"], ["recent", "Sort by most recent"]].map(function (x) { return '<option value="' + x[0] + '"' + (sort === x[0] ? " selected" : "") + ">" + x[1] + "</option>"; }).join("") + "</select></div></div>";
    if (!st.opps.length) return h + '<div class="card">' + startDeal() + "</div>";
    if (!list.length) return h + '<div class="card empty">' + (q ? "Nothing matches that search." : "No opportunities with this status.") + "</div>";
    h += '<div class="card tw"><table><thead><tr><th>Opportunity</th><th>Status</th><th class="r">Price</th><th class="r">Cash needed</th><th class="r">Cash flow / yr</th><th class="r">Cash on cash</th><th class="r">DSCR</th><th class="r">Score</th></tr></thead><tbody>' +
      scored.map(function (x) {
        var o = x.o, sc = x.sc, r = sc.r;
        return '<tr class="click" data-go="opp-' + o.id + '"><td><div class="oname"><b>' + esc(o.name) + "</b><span>" + TYPE[o.type] + (o.location ? " · " + esc(o.location) : "") + "</span></div></td><td>" + statusPill(o.status) + '</td><td class="n">' + M(r.inputs.price) + '</td><td class="n">' + M(r.cash) + '</td><td class="n">' + signed(r.cfYear) + '</td><td class="n">' + P(r.coc) + '</td><td class="n">' + R(r.dscr) + '</td><td class="r"><span class="score ' + gradeClass(sc.grade) + '">' + sc.total + "</span></td></tr>";
      }).join("") + "</tbody></table></div>";
    return h;
  };

  /* ----- field definitions ----- */
  var F = {
    rental: [
      ["Purchase", [["price", "Purchase price", "$"], ["closing", "Closing costs", "$"], ["repairs", "Initial repairs", "$"]]],
      ["Financing", [["down", "Down payment", "%"], ["rate", "Interest rate", "%", 0.125], ["term", "Loan term", "yrs"]]],
      ["Income", [["rent", "Monthly rent", "$", 25, "/mo"], ["other", "Other income", "$", 5, "/mo"], ["vacancy", "Vacancy", "%", 0.5], ["rentGrowth", "Rent growth", "%", 0.5, "/yr"]]],
      ["Operating costs", [["taxes", "Property taxes", "$", 50, "/yr"], ["insurance", "Insurance", "$", 50, "/yr"], ["hoa", "HOA", "$", 5, "/mo"], ["utilities", "Utilities", "$", 5, "/mo"], ["otherExp", "Other costs", "$", 5, "/mo"], ["mgmt", "Management", "%", 0.5], ["maint", "Repairs", "%", 0.5, "of rent"], ["capex", "Capital reserve", "%", 0.5, "of rent"]]],
      ["Five year hold", [["appreciation", "Appreciation", "%", 0.5, "/yr"], ["expGrowth", "Expense growth", "%", 0.5, "/yr"]]]
    ],
    str: [
      ["Purchase", [["price", "Purchase price", "$"], ["closing", "Closing costs", "$"], ["furnishing", "Furnishing", "$"], ["repairs", "Initial repairs", "$"]]],
      ["Financing", [["down", "Down payment", "%"], ["rate", "Interest rate", "%", 0.125], ["term", "Loan term", "yrs"]]],
      ["Bookings", [["adr", "Average nightly rate", "$", 5], ["occupancy", "Occupancy", "%", 1], ["avgStay", "Average stay", "nts", 0.5], ["season", "Seasonality", "sel"]]],
      ["Per stay costs", [["cleanFee", "Cleaning fee charged", "$", 5], ["cleanCost", "Cleaning cost", "$", 5], ["platform", "Platform fee", "%", 0.5], ["mgmt", "Management", "%", 1], ["supplies", "Supplies", "$", 1, "/night"]]],
      ["Fixed costs", [["taxes", "Property taxes", "$", 50, "/yr"], ["insurance", "Insurance", "$", 50, "/yr"], ["hoa", "HOA", "$", 5, "/mo"], ["utilities", "Utilities", "$", 5, "/mo"], ["internet", "Internet and TV", "$", 5, "/mo"], ["otherExp", "Other costs", "$", 5, "/mo"], ["maint", "Repairs", "%", 0.5, "of revenue"], ["capex", "Capital reserve", "%", 0.5, "of revenue"]]],
      ["Compare", [["ltrRent", "Long term rent for the same unit", "$", 25, "/mo", true]]]
    ],
    business: [
      ["Deal", [["price", "Asking price", "$"], ["closing", "Closing costs", "$"], ["workingCapital", "Working capital", "$"]]],
      ["Seller financials, yearly", [["revenue", "Revenue", "$"], ["cogs", "Cost of goods sold", "$"], ["opex", "Operating expenses", "$"], ["ownerComp", "Owner pay in expenses", "$"], ["addbacks", "Discretionary and one time", "$"], ["da", "Depreciation", "$"], ["interest", "Interest expense", "$"]]],
      ["Your operation", [["buyerSalary", "Your salary", "$", 1000, "/yr"], ["capexReserve", "Capital reserve", "$", 500, "/yr"]]],
      ["Financing", [["down", "Down payment", "%"], ["bankRate", "Bank rate", "%", 0.25], ["bankTerm", "Bank term", "yrs"], ["sellerPct", "Seller note", "%", 1, "of price"], ["sellerRate", "Seller note rate", "%", 0.25], ["sellerTerm", "Seller note term", "yrs"]]],
      ["Quality review", [["concentration", "Largest customer", "%", 1, "of revenue"], ["recurring", "Recurring revenue", "%", 1], ["ownerHours", "Seller hours a week", "hrs"], ["employees", "Employees", "#"], ["leaseYears", "Lease years left", "yrs"], ["equipmentAge", "Equipment age", "yrs"]]]
    ]
  };
  function fieldHtml(o, d) {
    var k = d[0], u = d[2], v = o.inputs[k];
    if (u === "sel") return '<div class="f"><label for="in-' + k + '">' + d[1] + '</label><select id="in-' + k + '" data-field="' + k + '">' + [["flat", "Even"], ["beach", "Beach"], ["mountain", "Mountain"], ["urban", "City"]].map(function (s) { return '<option value="' + s[0] + '"' + (v === s[0] ? " selected" : "") + ">" + s[1] + "</option>"; }).join("") + "</select></div>";
    var pre = u === "$", post = !pre && u !== "#", step = d[3] || (u === "$" ? 500 : u === "%" ? 1 : 1);
    return '<div class="f' + (d[5] ? " full" : "") + '"><label for="in-' + k + '"><span>' + d[1] + "</span>" + (d[4] ? "<em>" + d[4] + "</em>" : "") + '</label><div class="inwrap ' + (pre ? "pre" : post ? "post" : "") + '">' + (pre ? '<span class="u">$</span>' : "") + '<input id="in-' + k + '" type="number" inputmode="decimal" step="' + step + '" min="0" value="' + esc(v) + '" data-field="' + k + '">' + (post ? '<span class="u">' + (u === "%" ? "%" : u) + "</span>" : "") + "</div></div>";
  }

  VIEWS.opp = function (r) {
    var o = st.opps.filter(function (x) { return x.id === r.id; })[0];
    if (!o) return '<div class="card empty">We could not find that opportunity in this workspace. <a href="#opportunities">Back to opportunities</a></div>';
    if (ui.oppId !== o.id) { ui.oppId = o.id; ui.tab = "analysis"; }
    if (ui.tab === "ownership" && o.status !== "Owned") ui.tab = "analysis";
    var tabs = [["analysis", "Analysis"], ["scenarios", "Scenarios and financing"]].concat(o.status === "Owned" ? [["ownership", "Ownership"]] : []).concat([["diligence", "Checklist and history"], ["report", "Report"]]);
    var h = '<div style="margin-bottom:6px"><a href="#opportunities" class="btn sm link" style="padding-left:0">← Opportunities</a></div>';
    h += '<div class="ph" style="align-items:center"><div style="min-width:0;flex:1"><span class="tag">' + TYPE[o.type] + '</span><div style="margin-top:8px"><label for="oppName" class="sr">Name</label><input id="oppName" class="title-in" value="' + esc(o.name) + '" data-meta="name"></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;align-items:center"><label for="oppLoc" class="sr">Location</label><input id="oppLoc" data-meta="location" value="' + esc(o.location || "") + '" placeholder="City, state" style="width:220px;padding:6px 9px;font-size:14px"></div></div>' +
      '<div class="actions" style="align-items:center"><label for="oppStatus" class="sr">Status</label><select id="oppStatus" class="status-sel" data-meta="status">' + ["Evaluating", "Owned", "Passed"].map(function (s) { return "<option" + (o.status === s ? " selected" : "") + ">" + s + "</option>"; }).join("") + '</select><button class="btn sm ghost" data-act="dup" data-id="' + o.id + '">Duplicate</button><button class="btn sm ghost" data-act="del" data-id="' + o.id + '">Delete</button></div></div>';
    h += '<div class="tabs" role="tablist">' + tabs.map(function (t) { return '<button role="tab" aria-selected="' + (ui.tab === t[0]) + '" data-act="tab" data-v="' + t[0] + '">' + t[1] + "</button>"; }).join("") + "</div>";
    h += '<div id="tabBody">' + TABS[ui.tab](o) + "</div>";
    return h;
  };
  VIEWS.opp.after = function () { };

  var TABS = {};
  TABS.analysis = function (o) {
    return '<div class="an"><form class="card inputs" id="inputs" onsubmit="return false" aria-label="Assumptions">' + F[o.type].map(function (g) {
      return "<fieldset><legend>" + g[0] + '</legend><div class="fg">' + g[1].map(function (d) { return fieldHtml(o, d); }).join("") + "</div></fieldset>";
    }).join("") + '<fieldset><legend>Notes</legend><textarea id="oppNotes" data-meta="notes" rows="3" style="clear:both">' + esc(o.notes || "") + '</textarea></fieldset></form><div class="stack" id="results">' + results(o) + "</div></div>";
  };
  function results(o) {
    var c = ctx(), sc = scoreOf(o, c), r = sc.r, tp = AIM.targetPrice(o.type, o.inputs, c.settings);
    var h = '<section class="card"><div class="verdict">' + dial(sc) + "<div>" + gradePill(sc) + '<h2 style="margin-top:8px">' + verdictTitle(sc) + "</h2><p>" + esc(AIM.recommendation(sc, tp)) + '</p><p class="tp">Most you should pay at your targets: <b>' + (tp == null ? "No workable price" : M(tp)) + "</b> · asking " + M(r.inputs.price) + "</p></div></div>" +
      '<div class="parts">' + sc.parts.map(function (p) { return '<div class="part"><small>' + p.label + "</small><b>" + Math.round(p.pts) + "/" + p.max + '</b><div class="meter"><i style="width:' + (p.pts / p.max * 100).toFixed(0) + '%"></i></div></div>'; }).join("") + '</div><div class="howscore"><button class="btn sm link" data-act="how-score">How the AIM Score works</button></div></section>';
    var m;
    if (o.type === "rental") m = [["Cash flow", M(r.cfMonth), "per month"], ["Cash on cash", P(r.coc), "year one"], ["Cap rate", P(r.cap), "unlevered"], ["DSCR", R(r.dscr), "target " + c.settings.minDscr.toFixed(2)], ["Cash to close", M(r.cash), "down, closing, repairs"], ["Mortgage", M(r.pmt), "per month"], ["Break even", P(r.beOcc, 0), "occupancy"], ["Five year return", r.irr == null ? "n/a" : P(r.irr), "annualized, after sale"]];
    else if (o.type === "str") m = [["Cash flow", M(r.cfMonth), "per month"], ["Cash on cash", P(r.coc), "year one"], ["Cap rate", P(r.cap), "unlevered"], ["DSCR", R(r.dscr), "target " + c.settings.minDscr.toFixed(2)], ["Cash to close", M(r.cash), "includes furnishing"], ["Break even", isFinite(r.beOcc) ? P(r.beOcc, 0) : "Not reachable", "occupancy"], ["Break even rate", r.beAdr == null ? "n/a" : M(r.beAdr), "per night"], ["Revenue per night", M(r.revpar), "available night"]];
    else m = [["Cash flow after debt", M(r.cfMonth), "per month, after your salary"], ["Cash on cash", P(r.coc), "year one"], ["SDE", M(r.sde), "seller discretionary earnings"], ["Price multiple", isFinite(r.multiple) ? r.multiple.toFixed(2) + "x" : "n/a", "of SDE"], ["DSCR", R(r.dscr), "target " + c.settings.minDscr.toFixed(2)], ["Cash to close", M(r.cash), "down, closing, working capital"], ["Payback", isFinite(r.payback) ? r.payback.toFixed(1) + " yrs" : "Never", "on your cash"], ["SDE margin", P(r.sdeMargin), "of revenue"]];
    h += '<section class="card"><header><h2>Key numbers</h2></header><div class="mgrid">' + m.map(function (x, i) { return '<div class="m"><small>' + x[0] + '</small><strong class="' + (i === 0 && r.cfYear < 0 ? "dn" : "") + '">' + x[1] + "</strong><span>" + x[2] + "</span></div>"; }).join("") + "</div></section>";
    h += '<section class="card"><header><h2>Risk flags</h2><span class="muted" style="font-size:13px">' + sc.flags.length + "</span></header>" + (sc.flags.length ? sc.flags.map(flagRow).join("") : '<div class="empty">No flags at these assumptions. Verify the inputs before you rely on them.</div>') + "</section>";
    if (o.type === "str") {
      h += '<section class="card"><header><h2>Monthly booking revenue</h2><span class="muted" style="font-size:13px">Seasonality applied</span></header><div class="body">' + chart("strm", MON, [{ name: "Revenue", color: "var(--c1)", values: r.monthly.map(function (x) { return x.revenue; }) }], { kind: "bar", h: 210, label: "Expected booking revenue by month", fmt: function (v) { return M(v); } }) + "</div></section>";
      h += '<section class="card"><header><h2>Short term or long term</h2></header><div class="tw"><table><thead><tr><th></th><th class="r">Short term</th><th class="r">Long term</th></tr></thead><tbody>' +
        [["Gross revenue", r.gross, r.ltr.gross], ["Net operating income", r.noi, r.ltr.noi], ["Cash flow per year", r.cfYear, r.ltr.cfYear], ["Cash to close", r.cash, r.ltr.cash]].map(function (x) { return "<tr><td>" + x[0] + '</td><td class="n">' + M(x[1]) + '</td><td class="n">' + M(x[2]) + "</td></tr>"; }).join("") +
        "<tr><td>Cash on cash</td><td class=\"n\">" + P(r.coc) + '</td><td class="n">' + P(r.ltr.coc) + '</td></tr></tbody></table></div><div class="body note">The long term case uses the same price and loan with 5% vacancy, 8% management, 10% of rent for repairs and reserves, no furnishing, and insurance at 60% of the short term quote.</div></section>';
    }
    h += '<section class="card"><header><h2>' + (o.type === "business" ? "Earnings and cash flow" : "Annual operating statement") + '</h2></header><div class="tw"><table><tbody>' + r.lines.map(function (l) { return "<tr" + (l[2] ? ' class="' + l[2] + '"' : "") + "><td>" + l[0] + '</td><td class="n">' + M(l[1]) + "</td></tr>"; }).join("") + "</tbody></table></div></section>";
    if (o.type !== "business" && r.loan > 0) {
      var am = AIM.amortization(r.loan, r.inputs.rate, r.inputs.term), shown = ui.allYears ? am : am.slice(0, 10);
      h += '<section class="card"><header><h2>Loan schedule</h2><span class="muted" style="font-size:13px">' + M(r.loan) + " at " + r.inputs.rate + "% for " + r.inputs.term + ' years</span></header><div class="tw"><table><thead><tr><th>Year</th><th class="r">Payments</th><th class="r">Interest</th><th class="r">Principal</th><th class="r">Balance</th></tr></thead><tbody>' +
        shown.map(function (y) { return "<tr><td>" + y.year + '</td><td class="n">' + M(y.payment) + '</td><td class="n">' + M(y.interest) + '</td><td class="n">' + M(y.principal) + '</td><td class="n">' + M(y.balance) + "</td></tr>"; }).join("") + "</tbody></table></div>" +
        (am.length > 10 ? '<div class="body" style="border-top:1px solid var(--line)"><button class="btn sm link" data-act="all-years">' + (ui.allYears ? "Show first 10 years" : "Show all " + am.length + " years") + "</button></div>" : "") + "</section>";
    }
    if (o.type === "business") {
      var bs = [[r.bankLoan, r.inputs.bankRate, r.inputs.bankTerm, "Bank loan"], [r.sellerNote, r.inputs.sellerRate, r.inputs.sellerTerm, "Seller note"]].filter(function (x) { return x[0] > 0; });
      if (bs.length) h += '<section class="card"><header><h2>Debt summary</h2></header><div class="tw"><table><thead><tr><th>Loan</th><th class="r">Amount</th><th class="r">Rate</th><th class="r">Term</th><th class="r">Yearly payments</th><th class="r">Total interest</th></tr></thead><tbody>' +
        bs.map(function (x) { var p = AIM.Fin.pmt(x[0], x[1], x[2]); return "<tr><td>" + x[3] + '</td><td class="n">' + M(x[0]) + '</td><td class="n">' + x[1] + '%</td><td class="n">' + x[2] + ' yrs</td><td class="n">' + M(p * 12) + '</td><td class="n">' + M(p * Math.round(x[2] * 12) - x[0]) + "</td></tr>"; }).join("") + "</tbody></table></div></section>";
    }
    if (o.type === "rental") {
      h += '<section class="card"><header><h2>Five year hold</h2><span class="muted" style="font-size:13px">Sale assumes 6% selling costs</span></header><div class="tw"><table><thead><tr><th>Year</th><th class="r">NOI</th><th class="r">Cash flow</th><th class="r">Loan balance</th><th class="r">Value</th><th class="r">Equity</th></tr></thead><tbody>' +
        r.projection.map(function (y) { return "<tr><td>" + y.year + '</td><td class="n">' + M(y.noi) + '</td><td class="n">' + signed(y.cf) + '</td><td class="n">' + M(y.balance) + '</td><td class="n">' + M(y.value) + '</td><td class="n">' + M(y.equity) + "</td></tr>"; }).join("") + "</tbody></table></div></section>";
    }
    return h;
  }
  function verdictTitle(sc) { return { Strong: "Meets your criteria", Workable: "Works with conditions", Marginal: "Marginal at this price", Weak: "Does not meet your criteria" }[sc.grade]; }
  function flagRow(f) { return '<div class="flag"><span class="sev ' + f.sev + '" title="' + (f.sev === "high" ? "High" : f.sev === "med" ? "Medium" : "Note") + '"></span><div><b>' + esc(f.title) + '</b> <span class="muted" style="font-size:12px">· ' + (f.sev === "high" ? "High" : f.sev === "med" ? "Medium" : "Note") + "</span><p>" + esc(f.detail) + '</p><p class="act">' + esc(f.action) + "</p></div></div>"; }

  TABS.scenarios = function (o) {
    var c = ctx(), sc = AIM.scenarios(o.type, o.inputs), sn = AIM.sensitivity(o.type, o.inputs), r = sc[0].r, max = Math.max.apply(null, sn.map(function (x) { return Math.max(Math.abs(x.up), Math.abs(x.down)); })) || 1;
    var rows = [["Cash flow per year", function (x) { return signed(x.cfYear); }], ["Cash on cash", function (x) { return P(x.coc); }], ["DSCR", function (x) { return R(x.dscr); }], [o.type === "business" ? "Earnings yield" : "Cap rate", function (x) { return P(x.yieldOnPrice); }]];
    var h = '<div class="grid g2" style="align-items:start"><div class="stack"><section class="card"><header><h2>Scenarios</h2></header><div class="tw"><table><thead><tr><th></th>' + sc.map(function (s) { return '<th class="r">' + s.name + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.map(function (row) { return "<tr><td>" + row[0] + "</td>" + sc.map(function (s) { return '<td class="n">' + row[1](s.r) + "</td>"; }).join("") + "</tr>"; }).join("") + '</tbody></table></div><div class="body" style="font-size:13px;color:var(--muted);border-top:1px solid var(--line)">' + sc.filter(function (s) { return s.note; }).map(function (s) { return "<div><b>" + s.name + ":</b> " + s.note + "</div>"; }).join("") + "</div></section>";
    h += '<section class="card"><header><h2>What moves this deal</h2><span class="muted" style="font-size:13px">Change in yearly cash flow</span></header><div class="body tornado">' + sn.map(function (x) {
      function bar(v, cls) { var w = Math.abs(v) / max * 50; return '<i class="' + cls + '" style="' + (v < 0 ? "right:50%" : "left:50%") + ";width:" + w.toFixed(1) + '%"></i>'; }
      return '<div class="row"><span>' + x.label + ' <span class="muted" style="font-size:12px">' + x.swing + '</span></span><div class="bar"><span class="mid"></span>' + bar(Math.min(x.up, x.down), "neg") + bar(Math.max(x.up, x.down), "pos") + '</div><span class="num" style="text-align:right">±' + M(x.impact) + "</span></div>";
    }).join("") + '<div class="legend"><span><i style="background:var(--c6)"></i>Unfavorable move</span><span><i style="background:var(--c1)"></i>Favorable move</span></div></div></section></div>';
    var fin = AIM.financing(o.type, o.inputs, c.settings);
    var finHtml = '<section class="card" style="margin-top:18px"><header><h2>Financing options</h2><span class="muted" style="font-size:13px">Same deal, different down payment</span></header><div class="tw"><table><thead><tr><th>Down</th><th class="r">Cash needed</th><th class="r">Payment / mo</th><th class="r">Cash flow / yr</th><th class="r">Cash on cash</th><th class="r">DSCR</th><th>Targets</th></tr></thead><tbody>' +
      fin.map(function (f) { return "<tr" + (f.current ? ' class="sub"' : "") + "><td>" + f.down + "%" + (f.current ? ' <span class="muted" style="font-size:12px">current</span>' : "") + '</td><td class="n">' + M(f.cash) + '</td><td class="n">' + M(f.pmt) + '</td><td class="n">' + signed(f.cfYear) + '</td><td class="n">' + P(f.coc) + '</td><td class="n">' + R(f.dscr) + "</td><td>" + (f.meets ? '<span class="pill good">Meets</span>' : '<span class="pill warn">Misses</span>') + "</td></tr>"; }).join("") + '</tbody></table></div><div class="body note">More cash down lowers the payment and raises coverage, but usually lowers your return on each dollar invested.</div></section>';
    var gap = r.cash - c.available, b = AIM.budget(st.budget);
    h += '<div class="stack">' + (o.status === "Owned" ? "" : '<section class="card"><header><h2>Can you afford it?</h2></header><div class="body"><div class="mgrid" style="grid-template-columns:1fr 1fr;border:1px solid var(--line);border-radius:6px"><div class="m"><small>Cash needed</small><strong>' + M(r.cash) + '</strong></div><div class="m" style="border-right:0"><small>Available after reserve</small><strong>' + M(c.available) + "</strong></div></div><p style=\"margin-top:14px\">" +
      (gap <= 0 ? "You can fund this and still keep your full " + M(c.reserve) + " emergency reserve. " + M(-gap) + " would remain available." : "You are " + M(gap) + " short after holding back your reserve." + (b.fcf > 0 ? " At your current " + M(b.fcf) + " of monthly free cash flow, you close the gap in about <b>" + Math.ceil(gap / b.fcf) + " months</b>." : "")) + "</p></div></section>");
    var all = scoreOf(o, c);
    h += '<section class="card"><header><h2>Risk flags</h2></header>' + (all.flags.length ? all.flags.map(flagRow).join("") : '<div class="empty">No flags at these assumptions.</div>') + "</section></div></div>" + finHtml;
    return h;
  };

  TABS.ownership = function (o) {
    var pf = ownedPerf(o), e = ownedEquity(o), rows = pf.rows;
    var h = '<div class="grid g4" style="margin-bottom:18px"><div class="card kpi"><small>Estimated value</small><strong>' + M(e.value) + '</strong><span>Edit below</span></div><div class="card kpi"><small>Loan balance</small><strong>' + M(e.balance) + "</strong><span>Since " + ymLabel(o.owned.since || NOW) + '</span></div><div class="card kpi hero"><small>Your equity</small><strong>' + M(e.equity) + '</strong><span>Value minus debt</span></div><div class="card kpi"><small>Cash flow vs plan</small><strong>' + signed(pf.total.cf - pf.total.plan) + "</strong><span>Over " + rows.length + " months logged</span></div></div>";
    h += '<div class="grid split-r" style="align-items:start"><section class="card"><header><h2>Owner details</h2></header><div class="body"><div class="fg"><div class="f"><label for="ownSince">Owned since</label><input id="ownSince" type="month" value="' + esc(o.owned.since || NOW) + '" data-own="since"></div><div class="f"><label for="ownVal">Current value</label><div class="inwrap pre"><span class="u">$</span><input id="ownVal" type="number" step="1000" value="' + esc(o.owned.value) + '" data-own="value"></div></div></div><p class="muted" style="font-size:13.5px;margin-top:14px">Plan figures come from the analysis tab: ' + M(pf.planRev) + " revenue and " + M(pf.planExp) + " operating costs a month, plus " + M(pf.r.pmt) + " in loan payments.</p></div></section>";
    h += '<section class="card"><header><h2>Monthly cash flow vs plan</h2></header><div class="body">' + (rows.length ? chart("ownc", rows.map(function (x) { return ymLabel(x.a.month).slice(0, 3); }), [{ name: "Actual", color: "var(--c1)", values: rows.map(function (x) { return x.cf; }) }, { name: "Plan", color: "var(--c2)", values: rows.map(function (x) { return x.plan; }) }], { kind: "bar", h: 220, label: "Actual versus planned monthly cash flow" }) : '<div class="empty">Log your first month below.</div>') + "</div></section></div>";
    h += '<section class="card" style="margin-top:18px"><header><h2>Monthly actuals</h2><button class="btn sm" data-act="add-actual">Add month</button></header><div class="tw"><table><thead><tr><th>Month</th><th class="r">' + pf.r.revenueLabel + '</th><th class="r">Operating costs</th><th class="r">Cash flow</th><th class="r">Plan</th><th class="r">Variance</th><th>Note</th><th></th></tr></thead><tbody>' +
      (rows.length ? rows.slice().reverse().map(function (x) {
        var a = x.a; return '<tr><td><input type="month" value="' + a.month + '" data-act-id="' + a.id + '" data-k="month" aria-label="Month" style="width:150px"></td><td class="r"><input type="number" value="' + a.revenue + '" data-act-id="' + a.id + '" data-k="revenue" aria-label="Revenue" style="width:110px;text-align:right"></td><td class="r"><input type="number" value="' + a.expenses + '" data-act-id="' + a.id + '" data-k="expenses" aria-label="Operating costs" style="width:110px;text-align:right"></td><td class="n">' + signed(x.cf) + '</td><td class="n">' + M(x.plan) + '</td><td class="n"><span class="' + (x.varc < 0 ? "dn" : "up") + '">' + (x.varc >= 0 ? "+" : "") + M(x.varc) + '</span></td><td><input value="' + esc(a.note || "") + '" data-act-id="' + a.id + '" data-k="note" aria-label="Note" placeholder="Add a note" style="min-width:160px"></td><td><button class="x" data-act="del-actual" data-id="' + a.id + '" aria-label="Remove month">×</button></td></tr>';
      }).join("") : '<tr><td colspan="8" class="empty">No months logged yet.</td></tr>') + "</tbody></table></div></section>";
    return h;
  };

  TABS.diligence = function (o) {
    var items = AIM.CHECKLISTS[o.type], checks = o.checks || [], custom = o.custom || [];
    var total = items.length + custom.length, done = items.filter(function (x, i) { return checks[i]; }).length + custom.filter(function (x) { return x.done; }).length;
    var h = '<div class="grid split" style="align-items:start"><section class="card"><header><h2>Due diligence checklist</h2><span class="muted num" style="font-size:13px">' + done + " of " + total + '</span></header><div class="body" style="padding-bottom:4px"><div class="bar-p"><i style="width:' + (total ? done / total * 100 : 0).toFixed(0) + '%"></i></div></div><ul class="checks">' +
      items.map(function (t, i) { return '<li><label><input type="checkbox" data-check="' + i + '"' + (checks[i] ? " checked" : "") + "><span>" + esc(t) + "</span></label></li>"; }).join("") +
      custom.map(function (x) { return '<li><label><input type="checkbox" data-custom="' + x.id + '"' + (x.done ? " checked" : "") + "><span>" + esc(x.text) + '</span></label><button class="x" data-act="del-check" data-id="' + x.id + '" aria-label="Remove item">×</button></li>'; }).join("") +
      '</ul><form class="composer" id="checkForm" style="border-top:1px solid var(--line)"><label for="checkIn" class="sr">New checklist item</label><input id="checkIn" placeholder="Add your own item"><button class="btn sm" type="submit">Add</button></form></section>';
    var log = (o.log || []).slice().reverse();
    h += '<section class="card"><header><h2>Decision history</h2></header><ol class="timeline">' + (log.length ? log.map(function (l) { return "<li><time>" + new Date(l.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + "</time><span>" + esc(l.text) + "</span></li>"; }).join("") : '<li class="empty">No history yet.</li>') +
      '</ol><form class="composer" id="logForm" style="border-top:1px solid var(--line)"><label for="logIn" class="sr">Add a note to the history</label><input id="logIn" placeholder="Log a call, offer, or decision"><button class="btn sm" type="submit">Log</button></form></section></div>';
    return h;
  };
  function reportText(o) {
    var c = ctx(), sc = scoreOf(o, c), r = sc.r, tp = AIM.targetPrice(o.type, o.inputs, c.settings), sn = AIM.sensitivity(o.type, o.inputs).slice(0, 3), scen = AIM.scenarios(o.type, o.inputs);
    var thesis = o.type === "business" ? M(r.inputs.price) + " acquisition at " + r.multiple.toFixed(2) + "x SDE of " + M(r.sde) + ", financed with " + r.inputs.down + "% down, a bank loan, and a " + r.inputs.sellerPct + "% seller note."
      : M(r.inputs.price) + " purchase with " + r.inputs.down + "% down at " + r.inputs.rate + "%, " + (o.type === "str" ? "operated as a short term rental at " + M(r.inputs.adr) + " a night and " + r.inputs.occupancy + "% occupancy." : "leased at " + M(r.inputs.rent) + " a month.");
    return {
      title: o.name, sub: TYPE[o.type] + (o.location ? " · " + o.location : ""), score: sc, thesis: thesis, rec: AIM.recommendation(sc, tp), tp: tp,
      metrics: [["Cash required", M(r.cash)], ["Cash flow per year", M(r.cfYear)], ["Cash on cash", P(r.coc)], ["DSCR", R(r.dscr)], [o.type === "business" ? "Earnings yield" : "Cap rate", P(r.yieldOnPrice)], ["Downside cash flow", M(scen[1].r.cfYear)]],
      drivers: sn.map(function (x) { return x.label + " (" + x.swing + "): about " + M(x.impact) + " a year"; }), flags: sc.flags,
      next: (sc.flags.length ? sc.flags.slice(0, 3).map(function (f) { return f.action; }) : ["Verify income with leases, statements, or tax returns."]).concat(["Confirm the three key assumptions above with documents.", tp && tp < r.inputs.price ? "Open negotiations near " + M(tp) + "." : "Prepare financing and an offer."])
    };
  }
  TABS.report = function (o) {
    var t = reportText(o);
    var items = AIM.CHECKLISTS[o.type], checks = o.checks || [], dn = items.filter(function (x, i) { return checks[i]; }).length + (o.custom || []).filter(function (x) { return x.done; }).length, tot = items.length + (o.custom || []).length;
    t.diligence = dn + " of " + tot + " checklist items complete";
    return '<div class="noprint" style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:12px">' + (EMBEDDED ? "" : '<button class="btn sm ghost" data-act="print">Print or save as PDF</button>') + '<button class="btn sm ghost" data-act="share" data-id="' + o.id + '">Copy share link</button><button class="btn sm" data-act="copy-report" data-id="' + o.id + '">Copy summary</button></div><article class="card doc"><span class="eyebrow">AIM investment summary · ' + new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) + "</span><h2>" + esc(t.title) + '</h2><p class="muted" style="margin-top:6px">' + esc(t.sub) + '</p><div style="display:flex;gap:12px;align-items:center;margin-top:16px">' + gradePill(t.score) + '<span class="num">AIM Score ' + t.score.total + "/100</span></div>" +
      "<h3>Thesis</h3><p>" + esc(t.thesis) + "</p><h3>Recommendation</h3><p>" + esc(t.rec) + "</p>" +
      '<h3>Key numbers</h3><div class="mgrid" style="grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--line);border-radius:6px">' + t.metrics.map(function (m) { return '<div class="m"><small>' + m[0] + "</small><strong>" + m[1] + "</strong></div>"; }).join("") + "</div>" +
      "<h3>Assumptions that matter most</h3><ul>" + t.drivers.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul>" +
      "<h3>Risks</h3>" + (t.flags.length ? "<ul>" + t.flags.map(function (f) { return "<li><b>" + esc(f.title) + ".</b> " + esc(f.detail) + "</li>"; }).join("") + "</ul>" : "<p>No flags at the current assumptions.</p>") +
      "<h3>Due diligence</h3><p>" + esc(t.diligence) + ".</p><h3>Next steps</h3><ul>" + t.next.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul>" +
      (o.notes ? "<h3>Notes</h3><p>" + esc(o.notes) + "</p>" : "") + '<p class="muted" style="font-size:12.5px;margin-top:28px">Prepared with AIM from the assumptions entered. Analysis and education only, not investment, tax, or legal advice.</p></article>';
  };
  function reportPlain(o) {
    var t = reportText(o);
    return [t.title + " (" + t.sub + ")", "AIM Score " + t.score.total + "/100, " + t.score.grade, "", "Thesis: " + t.thesis, "Recommendation: " + t.rec, "", "Key numbers:"].concat(t.metrics.map(function (m) { return "  " + m[0] + ": " + m[1]; }))
      .concat(["", "Assumptions that matter most:"]).concat(t.drivers.map(function (d) { return "  " + d; })).concat(["", "Risks:"]).concat(t.flags.length ? t.flags.map(function (f) { return "  " + f.title + ". " + f.detail; }) : ["  None at current assumptions."])
      .concat(["", "Next steps:"]).concat(t.next.map(function (n) { return "  " + n; })).join("\n");
  }

  VIEWS.compare = function () {
    var c = ctx(), cand = st.opps.filter(function (o) { return o.status !== "Passed"; });
    if (!ui.compare.length) ui.compare = cand.filter(function (o) { return o.status === "Evaluating"; }).slice(0, 3).map(function (o) { return o.id; });
    ui.compare = ui.compare.filter(function (id) { return st.opps.some(function (o) { return o.id === id; }); });
    var sel = ui.compare.map(function (id) { return st.opps.filter(function (o) { return o.id === id; })[0]; }).map(function (o) { return { o: o, sc: scoreOf(o, c), down: AIM.scenarios(o.type, o.inputs)[1].r }; });
    var h = '<div class="ph"><div><h1>Compare</h1><p>A rental, a short term rental, and a business on one framework. Pick up to three.</p></div></div>';
    h += '<div class="chips" style="margin-bottom:18px" role="group" aria-label="Choose opportunities">' + cand.map(function (o) { var on = ui.compare.indexOf(o.id) >= 0; return '<button class="chip" data-act="cmp" data-id="' + o.id + '" aria-pressed="' + on + '">' + esc(o.name) + "</button>"; }).join("") + "</div>";
    if (sel.length < 2) return h + '<div class="card empty">Choose at least two opportunities to compare.</div>';
    var rows = [
      ["Type", function (x) { return TYPE_SHORT[x.o.type]; }],
      ["Price", function (x) { return M(x.sc.r.inputs.price); }, function (x) { return -x.sc.r.inputs.price; }, 1],
      ["Cash required", function (x) { return M(x.sc.r.cash); }, function (x) { return -x.sc.r.cash; }],
      ["Cash flow per year", function (x) { return signed(x.sc.r.cfYear); }, function (x) { return x.sc.r.cfYear; }],
      ["Cash on cash", function (x) { return P(x.sc.r.coc); }, function (x) { return x.sc.r.coc; }],
      ["DSCR", function (x) { return R(x.sc.r.dscr); }, function (x) { return x.sc.r.dscr; }],
      ["Unlevered yield", function (x) { return P(x.sc.r.yieldOnPrice); }, function (x) { return x.sc.r.yieldOnPrice; }],
      ["Downside cash flow", function (x) { return signed(x.down.cfYear); }, function (x) { return x.down.cfYear; }],
      ["Fits your cash", function (x) { return x.sc.r.cash <= c.available ? "Yes" : "Short " + M(x.sc.r.cash - c.available); }, function (x) { return c.available - x.sc.r.cash; }],
      ["Risk flags", function (x) { return x.sc.flags.length; }, function (x) { return -x.sc.flags.length; }],
      ["AIM Score", function (x) { return '<span class="score ' + gradeClass(x.sc.grade) + '">' + x.sc.total + "</span>"; }, function (x) { return x.sc.total; }]
    ];
    h += '<div class="card tw"><table><thead><tr><th></th>' + sel.map(function (x) { return '<th class="r" style="white-space:normal;min-width:150px">' + esc(x.o.name) + "</th>"; }).join("") + "</tr></thead><tbody>" + rows.map(function (row) {
      var vals = row[2] ? sel.map(row[2]) : null, best = vals ? Math.max.apply(null, vals) : null;
      return "<tr><td>" + row[0] + "</td>" + sel.map(function (x, i) { return '<td class="n' + (vals && !row[3] && vals[i] === best && vals.filter(function (v) { return v === best; }).length === 1 ? " best" : "") + '">' + row[1](x) + "</td>"; }).join("") + "</tr>";
    }).join("") + "</tbody></table></div>";
    var top = sel.slice().sort(function (a, b) { return b.sc.total - a.sc.total; })[0];
    h += '<div class="banner" style="margin-top:18px"><span><b>Best use of your capital right now: ' + esc(top.o.name) + ".</b> It scores " + top.sc.total + " and returns " + P(top.sc.r.coc) + " on " + M(top.sc.r.cash) + ". Highlighted cells mark the leader in each row.</span><a class=\"btn sm\" href=\"#opp-" + top.o.id + '">Open</a></div>';
    return h;
  };

  VIEWS.budget = function () {
    var c = ctx(), b = AIM.budget(st.budget);
    var h = '<div class="ph"><div><h1>Budget and goals</h1><p>Your monthly cash flow funds every future purchase. Changes here update readiness across AIM.</p></div><div class="actions"><button class="btn ghost sm" data-act="csv" data-v="budget">Export CSV</button></div></div>';
    h += '<div class="grid g4" style="margin-bottom:18px"><div class="card kpi"><small>Monthly income</small><strong>' + M(b.income) + '</strong></div><div class="card kpi"><small>Monthly expenses</small><strong>' + M(b.expenses) + "</strong><span>" + M(b.fixed) + ' fixed</span></div><div class="card kpi hero"><small>Free cash flow</small><strong>' + M(b.fcf) + "</strong><span>" + P(b.savingsRate, 0) + ' savings rate</span></div><div class="card kpi"><small>Emergency reserve</small><strong>' + M(c.reserve) + "</strong><span>" + st.settings.reserveMonths + " months · " + (c.cash >= c.reserve ? '<span class="up">Funded</span>' : '<span class="dn">Short ' + M(c.reserve - c.cash) + "</span>") + "</span></div></div>";
    function listCard(title, key, kind) {
      var arr = st.budget[key];
      return '<section class="card"><header><h2>' + title + '</h2><button class="btn sm ghost" data-act="add-line" data-k="' + key + '">Add</button></header><div class="tw"><table><tbody>' + (arr.length ? arr.map(function (x) {
        return '<tr><td><input value="' + esc(x.name) + '" data-line="' + key + '" data-id="' + x.id + '" data-k="name" aria-label="Name"></td>' + (kind ? '<td style="width:120px"><select data-line="' + key + '" data-id="' + x.id + '" data-k="kind" aria-label="Type"><option' + (x.kind === "Fixed" ? " selected" : "") + ">Fixed</option><option" + (x.kind === "Variable" ? " selected" : "") + ">Variable</option></select></td>" : "") +
          '<td style="width:140px"><div class="inwrap pre"><span class="u">$</span><input type="number" value="' + x.amount + '" data-line="' + key + '" data-id="' + x.id + '" data-k="amount" aria-label="Monthly amount" style="text-align:right"></div></td><td style="width:44px"><button class="x" data-act="del-line" data-k="' + key + '" data-id="' + x.id + '" aria-label="Remove">×</button></td></tr>';
      }).join("") : '<tr><td class="empty">Nothing added yet.</td></tr>') + "</tbody></table></div></section>";
    }
    if (b.income > 0 || b.expenses > 0) {
      var base = Math.max(b.income, b.expenses) || 1, segs = [["Fixed", b.fixed, "var(--c1)"], ["Variable", b.variable, "var(--c2)"], ["Free cash flow", Math.max(0, b.fcf), "var(--c4)"]].filter(function (x) { return x[1] > 0; });
      var top = st.budget.expenses.slice().sort(function (x, y) { return num(y.amount) - num(x.amount); }).slice(0, 6), mx = top.length ? num(top[0].amount) || 1 : 1;
      h += '<section class="card" style="margin-bottom:18px"><header><h2>Where your money goes</h2><span class="muted" style="font-size:13px">Share of ' + (b.income >= b.expenses ? "income" : "spending") + '</span></header><div class="body"><div class="alloc tall" role="img" aria-label="Fixed, variable, and free cash flow as a share of income">' + segs.map(function (x) { return '<i style="width:' + (x[1] / base * 100).toFixed(2) + "%;background:" + x[2] + '" title="' + x[0] + '"></i>'; }).join("") + '</div><div class="legend" style="margin-top:10px">' + segs.map(function (x) { return '<span><i style="background:' + x[2] + '"></i>' + x[0] + " " + M(x[1]) + " · " + P(x[1] / base, 0) + "</span>"; }).join("") + "</div>" +
        (top.length ? '<div class="hbars">' + top.map(function (x) { return '<div class="hb"><span>' + esc(x.name) + '</span><div class="hbt"><i style="width:' + (num(x.amount) / mx * 100).toFixed(1) + '%"></i></div><span class="num">' + M(num(x.amount)) + (b.income > 0 ? ' <em>' + P(num(x.amount) / b.income, 0) + "</em>" : "") + "</span></div>"; }).join("") + "</div>" : "") +
        '<p class="note" style="margin-top:12px">' + (b.income <= 0 ? "Add your income to see your savings rate." : b.fcf < 0 ? "You spend " + M(-b.fcf) + " more than you bring in each month. Start with the largest variable lines." : b.savingsRate >= 0.2 ? "You keep " + P(b.savingsRate, 0) + " of your income. A savings rate above 20% builds investing capital quickly." : "You keep " + P(b.savingsRate, 0) + " of your income. Reaching 20% would add " + M(b.income * 0.2 - b.fcf) + " a month toward your goals.") + "</p></div></section>";
    }
    h += '<div class="grid g2" style="align-items:start"><div class="stack">' + listCard("Monthly income", "income") + listCard("Monthly expenses", "expenses", true) + "</div><div class=\"stack\">";
    h += '<section class="card"><header><h2>Savings goals</h2><button class="btn sm ghost" data-act="add-goal">Add goal</button></header><div class="body" style="padding-block:4px">' + (st.budget.goals.length ? st.budget.goals.map(function (g) {
      return goalRow(g) + '<div class="fg" style="grid-template-columns:2fr 1fr 1fr 1fr auto;margin:-2px 0 12px;align-items:end">' +
        '<div class="f"><label for="g-n-' + g.id + '">Goal</label><input id="g-n-' + g.id + '" value="' + esc(g.name) + '" data-goal="' + g.id + '" data-k="name"></div>' +
        ["target", "saved", "monthly"].map(function (k) { return '<div class="f"><label for="g-' + k + "-" + g.id + '">' + { target: "Target", saved: "Saved", monthly: "Monthly" }[k] + '</label><input id="g-' + k + "-" + g.id + '" type="number" value="' + g[k] + '" data-goal="' + g.id + '" data-k="' + k + '"></div>'; }).join("") +
        '<button class="x" data-act="del-goal" data-id="' + g.id + '" aria-label="Remove goal">×</button></div>';
    }).join("") : '<div class="empty">Add a goal like your next down payment.</div>') + "</div></section>";
    var evals = st.opps.filter(function (o) { return o.status === "Evaluating"; });
    h += '<section class="card"><header><h2>Investment readiness</h2></header><div class="body">' + (evals.length ? evals.map(function (o) {
      var r = AIM.run(o.type, o.inputs), gap = r.cash - c.available, p = Math.min(1, c.available / r.cash);
      return '<div class="goal"><div class="top"><b>' + esc(o.name) + '</b><span class="num">' + M(r.cash) + ' needed</span></div><div class="bar-p"><i style="width:' + (p * 100).toFixed(1) + '%;background:' + (gap <= 0 ? "var(--good)" : "var(--navy)") + '"></i></div><small>' + (gap <= 0 ? "Ready now, with your reserve intact." : "Short " + M(gap) + (b.fcf > 0 ? ", about " + Math.ceil(gap / b.fcf) + " months at your current savings." : ".")) + "</small></div>";
    }).join("") : '<div class="empty">Add an opportunity to see when you can afford it.</div>') + "</div></section></div></div>";
    return h;
  };

  var ATYPES = ["Cash", "Investments", "Retirement", "Other asset", "Liability"];
  VIEWS.networth = function () {
    var nw = netWorthOf(st), hist = st.history, owned = st.opps.filter(function (o) { return o.status === "Owned" && o.owned; });
    var cats = ["Cash", "Investments", "Retirement", "Real estate equity", "Business equity", "Other asset"], cols = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)", "var(--c6)"];
    var parts = cats.map(function (k, i) { return { k: k, v: Math.max(0, nw.byType[k] || 0), c: cols[i] }; }).filter(function (p) { return p.v > 0; }), tot = parts.reduce(function (s, p) { return s + p.v; }, 0) || 1;
    var h = '<div class="ph"><div><h1>Net worth</h1><p>Accounts, investments, and the equity in what you own, in one picture.</p></div><div class="actions"><button class="btn ghost" data-act="snapshot">Record ' + ymLabel(NOW) + "</button></div></div>";
    h += '<div class="grid g3" style="margin-bottom:18px"><div class="card kpi hero"><small>Net worth</small><strong>' + M(nw.total) + '</strong></div><div class="card kpi"><small>Total assets</small><strong>' + M(nw.assets) + '</strong><span>Includes ' + M(nw.ownedEquity) + ' of owned asset equity</span></div><div class="card kpi"><small>Liabilities</small><strong>' + M(nw.liabilities) + "</strong></div></div>";
    h += '<div class="grid split" style="align-items:start"><div class="stack">';
    if (hist.length > 1) h += '<section class="card"><header><h2>Trend</h2></header><div class="body">' + chart("nwt", hist.map(function (x) { return ymLabel(x.month); }), [{ name: "Net worth", color: "var(--c1)", values: hist.map(function (x) { return x.value; }) }], { area: true, h: 240, label: "Net worth by month", maxLabels: 6 }) + "</div></section>";
    h += '<section class="card"><header><h2>Accounts</h2><button class="btn sm ghost" data-act="add-acct">Add account</button></header><div class="tw"><table><thead><tr><th>Name</th><th>Type</th><th class="r">Balance</th><th></th></tr></thead><tbody>' + st.accounts.map(function (a) {
      return '<tr><td><input value="' + esc(a.name) + '" data-acct="' + a.id + '" data-k="name" aria-label="Account name"></td><td style="width:150px"><select data-acct="' + a.id + '" data-k="type" aria-label="Type">' + ATYPES.map(function (t) { return "<option" + (a.type === t ? " selected" : "") + ">" + t + "</option>"; }).join("") + '</select></td><td style="width:150px"><div class="inwrap pre"><span class="u">$</span><input type="number" value="' + a.value + '" data-acct="' + a.id + '" data-k="value" aria-label="Balance" style="text-align:right"></div></td><td style="width:44px"><button class="x" data-act="del-acct" data-id="' + a.id + '" aria-label="Remove">×</button></td></tr>';
    }).join("") + owned.map(function (o) { var e = ownedEquity(o); return '<tr><td><a href="#opp-' + o.id + '">' + esc(o.name) + '</a> <span class="muted" style="font-size:12.5px">linked</span></td><td>' + (o.type === "business" ? "Business equity" : "Real estate equity") + '</td><td class="n">' + M(e.equity) + "</td><td></td></tr>"; }).join("") + "</tbody></table></div></section></div>";
    h += '<div class="stack"><section class="card"><header><h2>Allocation</h2></header><div class="body"><div class="alloc" role="img" aria-label="Asset allocation">' + parts.map(function (p) { return '<i style="width:' + (p.v / tot * 100).toFixed(2) + "%;background:" + p.c + '" title="' + p.k + '"></i>'; }).join("") + '</div><div class="tw" style="margin-top:14px"><table><tbody>' +
      parts.map(function (p) { return '<tr><td><span class="legend" style="margin:0"><span><i style="background:' + p.c + '"></i>' + p.k + '</span></span></td><td class="n">' + M(p.v) + '</td><td class="n" style="width:70px">' + P(p.v / tot, 0) + "</td></tr>"; }).join("") + '</tbody></table></div><p class="muted" style="font-size:13px;margin-top:12px">' + (parts.length && parts.sort(function (a, b) { return b.v - a.v; })[0].v / tot > 0.5 ? "More than half your assets sit in one category. That is common early on, but watch the concentration." : "Your assets are spread across several categories.") + "</p></div></section></div></div>";
    return h;
  };

  VIEWS.aimbot = function () {
    var cands = st.opps.filter(function (o) { return o.status !== "Passed"; });
    if (ui.chatOpp === null && cands.length) ui.chatOpp = cands[0].id;
    if (!ui.chat.length) ui.chat.push({ me: false, html: "<p>I am AIMBot. I explain your numbers and test your assumptions. Every figure I quote comes from your AIM models, never from a guess.</p><p>Pick an opportunity above, then ask a question or tap a suggestion.</p>" });
    var h = '<div class="ph"><div><h1>AIMBot</h1><p>Ask about any deal, your budget, or a finance term.</p></div><div class="actions"><label for="botOpp" class="sr">Opportunity</label><select id="botOpp" style="width:auto;min-width:220px"><option value="">No opportunity selected</option>' + cands.map(function (o) { return '<option value="' + o.id + '"' + (ui.chatOpp === o.id ? " selected" : "") + ">" + esc(o.name) + "</option>"; }).join("") + "</select></div></div>";
    h += '<section class="card chat"><div class="msgs" id="msgs" aria-live="polite">' + ui.chat.map(function (m) { return '<div class="msg ' + (m.me ? "me" : "bot") + '">' + (m.me ? esc(m.html) : m.html) + "</div>"; }).join("") + '</div><div class="chips" style="padding:0 12px 10px">' + ["What drives this deal?", "What should I offer?", "Am I ready to buy it?", "What are the risks?", "Show the downside", "Compare my deals", "How do I pay off my debt?", "When can I retire?", "Explain DSCR"].map(function (s) { return '<button class="chip" data-act="ask" data-q="' + esc(s) + '">' + s + "</button>"; }).join("") + '</div><form class="composer" id="botForm"><label for="botIn" class="sr">Message</label><input id="botIn" autocomplete="off" placeholder="Ask about your numbers"><button class="btn" type="submit">Send</button></form></section>';
    return h;
  };
  VIEWS.aimbot.after = function () { var m = $("#msgs"); if (m) m.scrollTop = m.scrollHeight; };
  function ask(q) {
    if (!q.trim()) return;
    var opp = st.opps.filter(function (o) { return o.id === ui.chatOpp; })[0] || null;
    onb("bot"); ui.chat.push({ me: true, html: q }); ui.chat.push({ me: false, html: LEARN.answer(q, ctx(), opp) });
    render(); var i = $("#botIn"); if (i) i.focus();
  }

  VIEWS.learn = function () {
    var L = LEARN.LESSONS, done = st.lessonsDone || [];
    if (ui.lesson) {
      var l = L.filter(function (x) { return x.id === ui.lesson; })[0], ex = l.ex(ctx());
      return '<div style="margin-bottom:6px"><button class="btn sm link" style="padding-left:0" data-act="lesson" data-id="">← All lessons</button></div><article class="card doc"><span class="eyebrow">' + l.track + " · " + l.mins + " min</span><h2>" + l.title + '</h2><div class="prose" style="margin-top:18px">' + l.body.map(function (p) { return "<p>" + p + "</p>"; }).join("") + '</div><h3>Formula</h3><div class="formula">' + l.formula + "</div>" + (ex ? "<h3>With your numbers</h3><p>" + esc(ex) + "</p>" : "") +
        '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:26px">' + (done.indexOf(l.id) < 0 ? '<button class="btn" data-act="lesson-done" data-id="' + l.id + '">Mark complete</button>' : '<span class="pill good">Completed</span>') + (l.open ? '<a class="btn ghost" href="#' + (l.open === "budget" || l.open === "planner" ? l.open : "opportunities") + '">Try it in AIM</a>' : "") + "</div></article>";
    }
    var tracks = []; L.forEach(function (x) { if (tracks.indexOf(x.track) < 0) tracks.push(x.track); });
    var pctDone = done.filter(function (d) { return L.some(function (x) { return x.id === d; }); }).length / L.length;
    var h = '<div class="ph"><div><h1>AIM Learning</h1><p>Short lessons that use your own numbers, so each idea sticks.</p></div><div style="min-width:220px"><div class="goal" style="border:0;padding:0"><div class="top"><b>Progress</b><span class="num">' + Math.round(pctDone * 100) + '%</span></div><div class="bar-p"><i style="width:' + (pctDone * 100).toFixed(0) + '%"></i></div></div></div></div>';
    tracks.forEach(function (t) {
      h += '<h2 style="font-size:18px;margin:22px 0 12px">' + t + '</h2><div class="grid g3">' + L.filter(function (x) { return x.track === t; }).map(function (x) {
        var d = done.indexOf(x.id) >= 0; return '<button class="lesson' + (d ? " done" : "") + '" data-act="lesson" data-id="' + x.id + '"><h3>' + x.title + "</h3><p>" + x.summary + '</p><span class="meta"><span>' + x.mins + " min</span>" + (d ? '<span class="pill good">Done</span>' : "<span>Start</span>") + "</span></button>";
      }).join("") + "</div>";
    });
    return h;
  };

  VIEWS.settings = function () {
    var s = st.settings;
    var h = '<div class="ph"><div><h1>Settings</h1><p>Your targets drive every AIM Score, target price, and risk flag.</p></div></div><div class="grid g2" style="align-items:start"><div class="stack"><section class="card"><header><h2>Profile</h2></header><div class="body"><div class="fg">' +
      '<div class="f"><label for="s-name">First name</label><input id="s-name" value="' + esc(s.name) + '" data-set="name" autocomplete="given-name"></div>' +
      '<div class="f"><label for="s-email">Email <em>Optional</em></label><input id="s-email" type="email" value="' + esc(s.email || "") + '" data-set="email" autocomplete="email"></div></div></div></section>' +
      '<section class="card"><header><h2>Investment targets</h2></header><div class="body"><div class="presets compact">' + Object.keys(PRESETS).map(function (p) { var x = PRESETS[p], on = s.minCoc === x[1] && s.minDscr === x[2] && s.reserveMonths === x[3]; return '<button class="preset" data-act="set-preset" data-v="' + p + '" aria-pressed="' + on + '"><b>' + x[0] + '</b><span class="num">' + x[1] + "% · " + x[2].toFixed(2) + " · " + x[3] + " mo</span></button>"; }).join("") + '</div><div class="fg" style="margin-top:14px">' +
      '<div class="f"><label for="s-coc">Minimum cash on cash</label><div class="inwrap post"><input id="s-coc" type="number" step="0.5" min="0" value="' + s.minCoc + '" data-set="minCoc"><span class="u">%</span></div></div>' +
      '<div class="f"><label for="s-dscr">Minimum DSCR</label><input id="s-dscr" type="number" step="0.05" min="0" value="' + s.minDscr + '" data-set="minDscr"></div>' +
      '<div class="f"><label for="s-res">Emergency reserve</label><div class="inwrap post"><input id="s-res" type="number" step="1" min="0" value="' + s.reserveMonths + '" data-set="reserveMonths"><span class="u">mos</span></div></div></div></div></section></div>';
    h += '<div class="stack"><section class="card"><header><h2>' + (mode === "demo" ? "Demo workspace" : "Your workspace") + '</h2><span class="pill ' + (mode === "demo" ? "warn" : "good") + '">' + (mode === "demo" ? "Sample data" : "Live") + '</span></header><div class="body" style="display:flex;flex-direction:column;gap:16px">';
    if (mode === "demo") {
      h += '<p class="muted" style="font-size:14px">The demo is a separate workspace filled with sample data. Changes here never touch your own workspace.</p><div class="confirm"><button class="btn" data-act="mode" data-v="live">' + (live ? "Go to my workspace" : "Set up my workspace") + '</button><button class="btn ghost" data-act="ask-reset-demo">Reset the demo</button></div><div id="confirmSlot"></div>';
    } else {
      h += '<p class="muted" style="font-size:14px">Saved in this browser on this device. During the beta nothing is sent to AIM servers, so keep a backup if the data matters to you.</p>' +
        '<div><b style="font-size:14.5px">Backup and restore</b><p class="muted" style="font-size:13.5px;margin-top:4px">Keep a copy, or move your workspace to another browser or device.</p><div class="confirm" style="margin-top:10px">' + (EMBEDDED ? "" : '<button class="btn ghost sm" data-act="backup-dl">Download backup</button>') + '<button class="btn ghost sm" data-act="backup-copy">Copy backup</button><label class="btn ghost sm" for="restoreFile" style="cursor:pointer">Restore from file</label><input id="restoreFile" type="file" accept="application/json,.json" class="sr"></div><div id="restoreSlot"></div></div>' +
        '<div><b style="font-size:14.5px">Export</b><p class="muted" style="font-size:13.5px;margin-top:4px">Spreadsheet friendly CSV files of your deals and budget.</p><div class="confirm" style="margin-top:10px"><button class="btn ghost sm" data-act="csv" data-v="opps">Opportunities CSV</button><button class="btn ghost sm" data-act="csv" data-v="budget">Budget CSV</button></div></div>' +
        '<div><b style="font-size:14.5px">Start over</b><p class="muted" style="font-size:13.5px;margin-top:4px">Erase this workspace and run setup again. Download a backup first.</p><div class="confirm" style="margin-top:10px"><button class="btn ghost sm danger-ghost" data-act="ask-erase">Erase my workspace</button></div><div id="confirmSlot"></div></div>';
    }
    h += '</div></section><section class="card"><header><h2>Keyboard</h2></header><div class="body"><div class="keys"><span><kbd>' + (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl") + "</kbd><kbd>K</kbd> Search and commands</span><span><kbd>N</kbd> New analysis</span><span><kbd>G</kbd> then <kbd>D</kbd> Dashboard</span><span><kbd>?</kbd> Show shortcuts</span></div><p class=\"muted\" style=\"font-size:12.5px;margin-top:12px\">AIM " + VERSION + " · Carlisle Capital LLC</p></div></section></div></div>";
    return h;
  };

  /* ---------- modal ---------- */
  var lastFocus = null;
  function modal(html, cls) {
    lastFocus = document.activeElement;
    var d = document.createElement("div"); d.className = "scrim"; d.innerHTML = '<div class="modal' + (cls ? " " + cls : "") + '" role="dialog" aria-modal="true">' + html + "</div>"; document.body.appendChild(d);
    var h2 = d.querySelector("h2"); if (h2) { h2.id = "mt" + uid(); d.firstChild.setAttribute("aria-labelledby", h2.id); }
    d.addEventListener("click", function (e) { if (e.target === d || e.target.closest("[data-close]")) closeModal(d); });
    var f = d.querySelector("input,button:not([data-close]),button"); if (f) f.focus(); return d;
  }
  function closeModal(d) {
    d = d || $(".scrim"); if (!d || d.classList.contains("out")) return;
    if (REDUCED) d.remove(); else { d.classList.add("out"); setTimeout(function () { d.remove(); }, 150); }
    if (lastFocus && document.body.contains(lastFocus)) try { lastFocus.focus({ preventScroll: true }); } catch (e) { }
  }
  function toast(t, label, fn) {
    $$(".toast").forEach(function (x) { x.remove(); });
    var d = document.createElement("div"); d.className = "toast"; d.setAttribute("role", "status"); d.textContent = t;
    if (label) { var b = document.createElement("button"); b.textContent = label; b.addEventListener("click", function () { d.remove(); fn(); }); d.appendChild(b); }
    document.body.appendChild(d); setTimeout(function () { if (!d.isConnected) return; d.classList.add("out"); setTimeout(function () { d.remove(); }, 220); }, label ? 7000 : 2600);
  }
  function howScore() {
    var s = st.settings;
    modal('<header><h2>How the AIM Score works</h2><button class="x" data-close aria-label="Close">×</button></header><div class="body prose" style="font-size:14.5px"><p>The score sums five parts, 100 points in all. It always uses your own targets from Settings.</p><div class="tw"><table><tbody>' +
      [["Return", "30", "Full points at 1.5 times your " + s.minCoc + "% cash on cash target."], ["Debt coverage", "25", "Zero at 1.00, full at 1.50 or better."], ["Downside resilience", "20", "Coverage in the downside case. Zero at 0.90, full at 1.40."], ["Fits your cash", "15", "Cash available after your reserve, compared to cash needed. Not counted for assets you own."], ["Assumption quality", "10", "Loses points for assumptions that look optimistic, like very low vacancy or repairs."]].map(function (r) { return "<tr><td><b>" + r[0] + '</b></td><td class="n">' + r[1] + '</td><td style="font-size:13.5px;color:var(--muted)">' + r[2] + "</td></tr>"; }).join("") +
      '</tbody></table></div><p>80 and up is Strong, 65 to 79 Workable, 50 to 64 Marginal, and below 50 Weak. The score is a summary. The numbers behind it decide.</p></div><footer><button class="btn" data-close>Got it</button></footer>');
  }
  function shortcuts() {
    var k = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";
    modal('<header><h2>Keyboard shortcuts</h2><button class="x" data-close aria-label="Close">×</button></header><div class="body"><div class="tw"><table><tbody>' + [[k + " K", "Search and commands"], ["N", "New analysis"], ["G then D", "Dashboard"], ["G then O", "Opportunities"], ["G then B", "Budget and goals"], ["G then W", "Net worth"], ["G then P", "Planner"], ["G then A", "AIMBot"], ["?", "This list"], ["Esc", "Close a dialog"]].map(function (x) { return "<tr><td><kbd>" + x[0].split(" ").join("</kbd> <kbd>").replace("<kbd>then</kbd>", "then") + "</kbd></td><td>" + x[1] + "</td></tr>"; }).join("") + '</tbody></table></div></div><footer><button class="btn" data-close>Done</button></footer>');
  }
  function feedback() {
    var d = modal('<header><h2>Send feedback</h2><button class="x" data-close aria-label="Close">×</button></header><form id="fbForm"><div class="body"><div class="f"><label for="fbType">Type</label><select id="fbType"><option>Idea</option><option>Something is wrong</option><option>Question</option></select></div><div class="f"><label for="fbMsg">Message</label><textarea id="fbMsg" rows="5" required placeholder="What would make AIM more useful?"></textarea></div><p class="err" id="fbErr" style="color:var(--bad);font-size:13px"></p></div><footer><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn" type="submit">Send</button></footer></form>');
    $("#fbForm", d).addEventListener("submit", function (e) {
      e.preventDefault(); var msg = $("#fbMsg", d).value.trim(); if (!msg) { $("#fbErr", d).textContent = "Write a short message first."; return; }
      var body = { kind: "feedback", type: $("#fbType", d).value, message: msg, name: lead && lead.name || st.settings.name, email: lead && lead.email || st.settings.email, mode: mode, page: location.hash, version: VERSION, sent_at: new Date().toISOString() };
      fetch(FEEDBACK_URL, { method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(function (r) { if (!r.ok) throw 0; closeModal(d); toast("Thanks. Your feedback was sent."); })
        .catch(function () { $("#fbErr", d).textContent = "That did not send. Check your connection and try again."; });
    });
  }
  function download(name, text, type) { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: type || "application/json" })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function copyText(t, ok) { try { navigator.clipboard.writeText(t).then(function () { toast(ok); }, function () { fallbackCopy(t, ok); }); } catch (err) { fallbackCopy(t, ok); } }
  function fallbackCopy(t, ok) { var ta = document.createElement("textarea"); ta.value = t; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); toast(ok || "Copied"); } catch (e) { toast("Copy is blocked here. Select the text and copy it yourself."); } ta.remove(); }

  /* ---------- CSV export ---------- */
  function csvCell(v) { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function csv(rows) { return rows.map(function (r) { return r.map(csvCell).join(","); }).join("\n") + "\n"; }
  function exportCsv(kind) {
    var c = ctx(), rows, name;
    if (kind === "opps") {
      rows = [["Name", "Type", "Status", "Location", "Price", "Cash needed", "Cash flow per year", "Cash on cash %", "Cap rate or yield %", "DSCR", "AIM Score", "Grade", "Target price", "Risk flags"]].concat(st.opps.map(function (o) {
        var sc = scoreOf(o, c), r = sc.r, tp = AIM.targetPrice(o.type, o.inputs, c.settings);
        return [o.name, TYPE[o.type], o.status, o.location || "", Math.round(r.inputs.price), Math.round(r.cash), Math.round(r.cfYear), (r.coc * 100).toFixed(2), (r.yieldOnPrice * 100).toFixed(2), isFinite(r.dscr) ? r.dscr.toFixed(2) : "", sc.total, sc.grade, tp == null ? "" : Math.round(tp), sc.flags.map(function (f) { return f.title; }).join("; ")];
      })); name = "aim-opportunities";
    } else {
      var b = AIM.budget(st.budget);
      rows = [["Section", "Name", "Type", "Monthly amount"]].concat(st.budget.income.map(function (x) { return ["Income", x.name, "", num(x.amount)]; })).concat(st.budget.expenses.map(function (x) { return ["Expense", x.name, x.kind, num(x.amount)]; }))
        .concat([["Total", "Income", "", b.income], ["Total", "Expenses", "", b.expenses], ["Total", "Free cash flow", "", b.fcf], [], ["Goal", "Name", "Target", "Saved", "Monthly"]]).concat(st.budget.goals.map(function (g) { return ["Goal", g.name, num(g.target), num(g.saved), num(g.monthly)]; }));
      name = "aim-budget";
    }
    var text = csv(rows);
    if (EMBEDDED) copyText(text, "CSV copied. Paste it into a spreadsheet."); else { download(name + "-" + new Date().toISOString().slice(0, 10) + ".csv", text, "text/csv"); toast("CSV downloaded"); }
  }

  /* ---------- share links: the deal travels in the URL, nothing is uploaded ---------- */
  function encodeShare(o) { var j = JSON.stringify({ a: "aim", v: 1, t: o.type, n: o.name, l: o.location || "", i: o.inputs }); return btoa(unescape(encodeURIComponent(j))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function decodeShare(s) {
    try { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; var x = JSON.parse(decodeURIComponent(escape(atob(s))));
      if (!x || x.a !== "aim" || !AIM.DEFAULTS[x.t] || typeof x.i !== "object") return null;
      var clean = {}; Object.keys(AIM.DEFAULTS[x.t]).forEach(function (k) { if (x.i[k] != null) clean[k] = k === "season" ? String(x.i[k]) : num(x.i[k], AIM.DEFAULTS[x.t][k]); });
      return { type: x.t, name: String(x.n || "Shared analysis").slice(0, 120), location: String(x.l || "").slice(0, 120), inputs: Object.assign({}, AIM.DEFAULTS[x.t], clean) };
    } catch (e) { return null; }
  }
  function shareUrl(o) { return location.href.split("#")[0] + "#import=" + encodeShare(o); }
  function offerImport(x) {
    var r = AIM.run(x.type, x.inputs);
    var d = modal('<header><h2>Open a shared analysis</h2><button class="x" data-close aria-label="Close">×</button></header><div class="body"><p>Someone shared <b>' + esc(x.name) + "</b>, a " + TYPE[x.type].toLowerCase() + (x.location ? " in " + esc(x.location) : "") + '.</p><div class="mgrid" style="grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--line);border-radius:6px;margin-top:14px"><div class="m"><small>Price</small><strong>' + M(r.inputs.price) + '</strong></div><div class="m"><small>Cash flow / yr</small><strong>' + M(r.cfYear) + '</strong></div><div class="m" style="border-right:0"><small>Cash on cash</small><strong>' + P(r.coc) + '</strong></div></div><p class="muted" style="font-size:13.5px;margin-top:14px">It will be added to your ' + (mode === "demo" ? "demo" : "") + ' workspace and scored against your own targets.</p></div><footer><button class="btn ghost" data-close>Not now</button><button class="btn" id="doImport">Add to ' + (mode === "demo" ? "the demo" : "my workspace") + "</button></footer>");
    $("#doImport", d).addEventListener("click", function () {
      var o = { id: uid(), type: x.type, name: x.name, location: x.location, status: "Evaluating", created: NOW, notes: "", inputs: x.inputs };
      logEvent(o, "Imported from a shared link"); st.opps.unshift(o); save(); closeModal(d); toast("Added " + x.name); go("opp-" + o.id);
    });
  }

  /* ---------- command palette ---------- */
  function paletteItems() {
    var items = Object.keys(NAV_TITLES).map(function (k) { return { g: "Go to", t: NAV_TITLES[k], run: function () { go(k); } }; });
    items.push({ g: "Go to", t: "Debt payoff planner", run: function () { ui.plan = "debt"; go("planner"); } }, { g: "Go to", t: "Financial independence planner", run: function () { ui.plan = "fi"; go("planner"); } });
    st.opps.forEach(function (o) { items.push({ g: "Opportunities", t: o.name, s: TYPE[o.type] + " · " + o.status, run: function () { go("opp-" + o.id); } }); });
    items.push({ g: "Actions", t: "New long term rental analysis", run: function () { newOpp("rental"); } }, { g: "Actions", t: "New short term rental analysis", run: function () { newOpp("str"); } }, { g: "Actions", t: "New business analysis", run: function () { newOpp("business"); } },
      { g: "Actions", t: "Record this month's net worth", run: function () { snapshot(); } }, { g: "Actions", t: "Export opportunities as CSV", run: function () { exportCsv("opps"); } }, { g: "Actions", t: "Export budget as CSV", run: function () { exportCsv("budget"); } },
      { g: "Actions", t: mode === "demo" ? (live ? "Switch to my workspace" : "Set up my workspace") : "Switch to the demo", run: function () { switchMode(mode === "demo" ? "live" : "demo"); } }, { g: "Actions", t: "Keyboard shortcuts", run: shortcuts });
    LEARN.LESSONS.forEach(function (l) { items.push({ g: "Lessons", t: l.title, run: function () { ui.lesson = l.id; go("learn"); render(); } }); });
    return items;
  }
  function palette() {
    if ($(".scrim")) return;
    var all = paletteItems(), sel = 0, shown = all;
    var d = modal('<div class="pal"><div class="pal-in">' + ic("search") + '<label for="palIn" class="sr">Search</label><input id="palIn" autocomplete="off" placeholder="Search pages, deals, lessons, and actions" role="combobox" aria-expanded="true" aria-controls="palList"><kbd>Esc</kbd></div><ul id="palList" role="listbox"></ul></div>', "palm");
    var inp = $("#palIn", d), ul = $("#palList", d);
    function draw() {
      var g = "", html = "";
      shown.slice(0, 40).forEach(function (x, i) { if (x.g !== g) { g = x.g; html += '<li class="pg" role="presentation">' + esc(g) + "</li>"; } html += '<li role="option" id="po' + i + '" data-i="' + i + '" aria-selected="' + (i === sel) + '"><span>' + esc(x.t) + "</span>" + (x.s ? "<small>" + esc(x.s) + "</small>" : "") + "</li>"; });
      ul.innerHTML = html || '<li class="pg" role="presentation">No matches</li>'; inp.setAttribute("aria-activedescendant", "po" + sel);
      var on = ul.querySelector('[aria-selected="true"]'); if (on) on.scrollIntoView({ block: "nearest" });
    }
    function runAt(i) { var x = shown[i]; if (!x) return; closeModal(d); x.run(); }
    inp.addEventListener("input", function () { var q = inp.value.toLowerCase().trim().split(/\s+/); shown = all.filter(function (x) { var h = (x.t + " " + (x.s || "") + " " + x.g).toLowerCase(); return q.every(function (w) { return h.indexOf(w) >= 0; }); }); sel = 0; draw(); });
    inp.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { sel = Math.min(sel + 1, Math.min(shown.length, 40) - 1); draw(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
      else if (e.key === "Enter") { e.preventDefault(); runAt(sel); }
    });
    ul.addEventListener("click", function (e) { var li = e.target.closest("[data-i]"); if (li) runAt(+li.dataset.i); });
    draw();
  }

  var pendingRestore = null;
  function validWs(x) { return x && typeof x === "object" && Array.isArray(x.opps) && Array.isArray(x.accounts) && x.budget && Array.isArray(x.budget.income) && Array.isArray(x.budget.expenses) && x.settings; }
  function newOpp(type) {
    type = type || "rental";
    var d = modal('<header><h2>New analysis</h2><button class="x" data-close aria-label="Close">×</button></header><form id="newForm" novalidate><div class="body"><fieldset style="padding:0;border:0;margin:0"><legend class="sr">Type</legend><div class="types">' +
      [["rental", "Long term rental", "Single family, duplex, small multifamily"], ["str", "Short term rental", "Vacation homes and Airbnb style units"], ["business", "Business", "Laundromats, services, routes, and more"]].map(function (t) { return '<label><input type="radio" name="t" value="' + t[0] + '"' + (t[0] === type ? " checked" : "") + ' class="sr"><b>' + t[1] + "</b><span>" + t[2] + "</span></label>"; }).join("") +
      '</div></fieldset><div class="f"><label for="nName">Name</label><input id="nName" required aria-describedby="nErr" placeholder="123 Main St or the business name"></div><div class="f"><label for="nLoc">Location</label><input id="nLoc" placeholder="City, state"></div><p class="muted" style="font-size:13px">AIM starts you with typical assumptions. Replace them with real numbers as you get them.</p><p class="err" id="nErr" style="color:var(--bad);font-size:13px"></p></div><footer><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn" type="submit">Create analysis</button></footer></form>');
    $("#nName", d).focus();
    $("#newForm", d).addEventListener("submit", function (e) {
      e.preventDefault(); var t = $("input[name=t]:checked", d).value, n = $("#nName", d).value.trim();
      if (!n) { $("#nErr", d).textContent = "Give the analysis a name, like the address or business name."; $("#nName", d).focus(); return; }
      var o = { id: uid(), type: t, name: n, location: $("#nLoc", d).value.trim(), status: "Evaluating", created: NOW, notes: "", inputs: Object.assign({}, AIM.DEFAULTS[t]) };
      logEvent(o, "Analysis created"); onb("deal"); st.opps.unshift(o); save(); closeModal(d); ui.tab = "analysis"; go("opp-" + o.id);
    });
  }
  function snapshot() { var v = Math.round(netWorthOf(st).total), hh = st.history.filter(function (x) { return x.month === NOW; })[0]; if (hh) hh.value = v; else st.history.push({ month: NOW, value: v }); save(); toast("Recorded " + M(v) + " for " + ymLabel(NOW)); render(); }
  function switchMode(m) {
    if (m === "live" && !live) { ui.setup = null; go("setup"); return; }
    if (m === mode && st) { go("dashboard"); return; }
    setMode(m, !st); go("dashboard");
  }
  function readRestore(file, slot) {
    var rd = new FileReader(); rd.onload = function () {
      var x; try { x = JSON.parse(rd.result); if (x && x.workspace) x = x.workspace; } catch (err) { x = null; }
      if (!validWs(x)) { slot.innerHTML = '<p class="dn" style="font-size:13.5px;margin-top:8px">That file is not an AIM backup. Choose a file saved with Download backup.</p>'; return; }
      pendingRestore = x; slot.innerHTML = '<div class="banner" style="margin:10px 0 0"><span>Restore this backup (' + x.opps.length + " opportunities, " + x.accounts.length + " accounts) as your workspace?" + (live ? " Your current workspace will be replaced." : "") + '</span><span class="confirm"><button class="btn sm ghost" data-act="cancel-restore">Cancel</button><button class="btn sm danger" data-act="do-restore">Restore</button></span></div>';
    }; rd.readAsText(file);
  }

  /* ---------- events ---------- */
  function findOpp() { var r = route(); return r.v === "opp" && st ? st.opps.filter(function (o) { return o.id === r.id; })[0] : null; }
  var refreshT;
  function refreshResults() {
    clearTimeout(refreshT); refreshT = setTimeout(function () { var o = findOpp(), el = $("#results"); if (o && el) { el.innerHTML = results(o); bindCharts(); } }, 120);
  }
  document.addEventListener("input", function (e) {
    var t = e.target, o, d = t.dataset;
    if (d.su) { var S = setupState(); if (d.su.indexOf("exp.") === 0) S.exp[d.su.slice(4)] = t.value; else S[d.su] = t.value; if (d.su === "minCoc" || d.su === "minDscr" || d.su === "reserveMonths") S.preset = ""; var sum = $("#suSum"); if (sum) sum.innerHTML = setupSum(num(S.pay) + num(S.side), EXP_CATS.reduce(function (a, c) { return a + num(S.exp[c[0]]); }, 0)); return; }
    if (d.sd) { var dd = setupState().debts.filter(function (x) { return x.id === d.sd; })[0]; if (dd) dd[d.k] = t.value; return; }
    if (!st) return;
    if (t.id === "oppSearch") { ui.q = t.value; clearTimeout(refreshT); refreshT = setTimeout(render, 160); return; }
    if (d.set && d.set !== "name" && d.set !== "email") onb("targets");
    if (d.line || d.goal) onb("budget");
    if (d.field && (o = findOpp())) { o.inputs[d.field] = t.tagName === "SELECT" ? t.value : num(t.value); save(); refreshResults(); return; }
    if (d.meta && (o = findOpp())) { if (d.meta !== "status") { o[d.meta] = t.value; save(); } return; }
    if (d.line) { var x = st.budget[d.line].filter(function (i) { return i.id === d.id; })[0]; if (x) { x[d.k] = d.k === "amount" ? num(t.value) : t.value; save(); } return; }
    if (d.goal) { var g = st.budget.goals.filter(function (i) { return i.id === d.goal; })[0]; if (g) { g[d.k] = d.k === "name" ? t.value : num(t.value); save(); } return; }
    if (d.acct) { var a = st.accounts.filter(function (i) { return i.id === d.acct; })[0]; if (a) { a[d.k] = d.k === "name" || d.k === "type" ? t.value : num(t.value); save(); } return; }
    if (d.plan) { var pl = plan(); pl[d.plan] = t.value === "" ? (d.plan === "start" || d.plan === "monthly" || d.plan === "spend" ? null : pl[d.plan]) : num(t.value); if (d.plan === "years") pl.years = Math.max(1, Math.min(60, Math.round(num(t.value, 30)))); if (d.plan === "extra") pl.extra = Math.max(0, num(t.value)); save(); return; }
    if (d.set) { st.settings[d.set] = d.set === "name" || d.set === "email" ? t.value : num(t.value); save(); return; }
    if (d.actId && (o = findOpp())) { var ac = o.owned.actuals.filter(function (i) { return i.id === d.actId; })[0]; if (ac) { ac[d.k] = d.k === "revenue" || d.k === "expenses" ? num(t.value) : t.value; save(); } return; }
    if (d.own && (o = findOpp())) { o.owned[d.own] = d.own === "value" ? num(t.value) : t.value; save(); return; }
  });
  document.addEventListener("change", function (e) {
    var t = e.target, d = t.dataset, o;
    if (d.suFocus) { var S = setupState(), i = S.focus.indexOf(d.suFocus); if (t.checked && i < 0) S.focus.push(d.suFocus); if (!t.checked && i >= 0) S.focus.splice(i, 1); return; }
    if (d.suFirst) { setupState().first = t.value; return; }
    if ((t.id === "restoreFile" || t.id === "startRestore") && t.files && t.files[0]) { readRestore(t.files[0], $("#restoreSlot")); t.value = ""; return; }
    if (!st) return;
    if (t.id === "botOpp") { ui.chatOpp = t.value || ""; return; }
    if (t.id === "oppSort") { ui.sort = t.value; render(); return; }
    if (d.check != null && (o = findOpp())) { o.checks = o.checks || []; o.checks[+d.check] = t.checked; save(); later(); return; }
    if (d.custom && (o = findOpp())) { (o.custom || []).forEach(function (x) { if (x.id === d.custom) x.done = t.checked; }); save(); later(); return; }
    if (d.meta === "status" && (o = findOpp())) {
      o.status = t.value; logEvent(o, "Marked as " + o.status); if (o.status === "Owned" && !o.owned) o.owned = { since: NOW, value: AIM.run(o.type, o.inputs).inputs.price, actuals: [] };
      save(); toast("Marked as " + o.status); render(); return;
    }
    if (d.line || d.goal || d.acct || d.actId || d.own || d.set || d.plan) later();
  });
  document.addEventListener("submit", function (e) {
    var id = e.target.id;
    if (id === "setupForm") { e.preventDefault(); setupNext(false); return; }
    var o = findOpp();
    if (id === "botForm") { e.preventDefault(); var i = $("#botIn"); ask(i.value); }
    if (id === "checkForm" && o) { e.preventDefault(); var v = $("#checkIn").value.trim(); if (!v) return; o.custom = o.custom || []; o.custom.push({ id: uid(), text: v, done: false }); save(); render(); $("#checkIn").focus(); }
    if (id === "logForm" && o) { e.preventDefault(); var w = $("#logIn").value.trim(); if (!w) return; logEvent(o, w); save(); render(); $("#logIn").focus(); }
  });
  document.addEventListener("click", function (e) {
    var tr = e.target.closest("tr[data-go]"); if (tr && !e.target.closest("a,button,input,select")) { go(tr.dataset.go); return; }
    var b = e.target.closest("[data-act]"); if (!b) return; var a = b.dataset.act, o = findOpp(), S;
    switch (a) {
      case "mode": switchMode(b.dataset.v); break;
      case "rail": var col = !document.documentElement.classList.contains("rail-collapsed"); document.documentElement.classList.toggle("rail-collapsed", col); try { localStorage.setItem("aim.rail", col ? "1" : "0"); } catch (er) { } b.setAttribute("aria-label", col ? "Expand the sidebar" : "Collapse the sidebar"); setTimeout(function () { moveIndicator(route().v === "opp" ? "opportunities" : route().v); Object.keys(chartReg).forEach(function (id) { if (document.getElementById(id)) drawChart(id, chartReg[id]); }); }, 240); break;
      case "palette": palette(); break;
      case "su-back": S = setupState(); S.err = ""; S.step = Math.max(0, S.step - 1); lastRoute = ""; renderSetup(); break;
      case "su-skip": setupNext(true); break;
      case "su-cancel": ui.setup = null; if (st) go("dashboard"); else { location.hash = ""; render(); } break;
      case "su-add-debt": S = setupState(); S.debts.push({ id: uid(), name: "", balance: "", rate: "", min: "" }); renderSetup(); var nn = $("#sd-n-" + S.debts[S.debts.length - 1].id); if (nn) nn.focus(); break;
      case "su-del-debt": S = setupState(); if (S.debts.length > 1) S.debts = S.debts.filter(function (x) { return x.id !== b.dataset.id; }); renderSetup(); break;
      case "su-preset": S = setupState(); var pr = PRESETS[b.dataset.v]; S.preset = b.dataset.v; S.minCoc = pr[1]; S.minDscr = pr[2]; S.reserveMonths = pr[3]; renderSetup(); break;
      case "set-preset": var p2 = PRESETS[b.dataset.v]; st.settings.minCoc = p2[1]; st.settings.minDscr = p2[2]; st.settings.reserveMonths = p2[3]; onb("targets"); save(); toast(p2[0] + " targets applied"); render(); break;
      case "new-opp": newOpp(b.dataset.type); break;
      case "hide-onb": st.onbHidden = true; save(); render(); break;
      case "how-score": howScore(); break;
      case "feedback": e.preventDefault(); feedback(); break;
      case "csv": exportCsv(b.dataset.v); break;
      case "share": var so = st.opps.filter(function (x) { return x.id === b.dataset.id; })[0]; if (so) copyText(shareUrl(so), "Share link copied. Anyone with the link can open this analysis in AIM."); break;
      case "plan-tab": ui.plan = b.dataset.v; if (location.hash !== "#planner") { e.preventDefault(); go("planner"); } else render(); break;
      case "plan-method": plan().method = b.dataset.v; save(); render(); break;
      case "plan-reset": var pl0 = plan(); pl0.start = null; pl0.monthly = null; pl0.spend = null; save(); render(); break;
      case "add-debt": st.accounts.push({ id: uid(), name: "New debt", type: "Liability", value: 1000, rate: 8, min: 50 }); save(); render(); break;
      case "all-years": ui.allYears = !ui.allYears; var el = $("#results"); if (el && o) { el.innerHTML = results(o); bindCharts(); } break;
      case "print": window.print(); break;
      case "del-check": o.custom = (o.custom || []).filter(function (x) { return x.id !== b.dataset.id; }); save(); render(); break;
      case "backup-dl": download("aim-backup-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify({ app: "AIM", version: VERSION, saved_at: new Date().toISOString(), workspace: st }, null, 2)); toast("Backup downloaded"); break;
      case "backup-copy": copyText(JSON.stringify({ app: "AIM", version: VERSION, saved_at: new Date().toISOString(), workspace: st }), "Backup copied. Paste it into a text file to keep it."); break;
      case "cancel-restore": pendingRestore = null; $("#restoreSlot").innerHTML = ""; break;
      case "do-restore": if (pendingRestore) { var x = pendingRestore; x.sample = false; x.setupDone = true; x.plan = Object.assign(planDefaults(), x.plan || {}); delete x.unlocked; live = x; pendingRestore = null; store(KEY, live); if (st) store(wsKey(), st); mode = "live"; store(MKEY, mode); st = live; ui.compare = []; ui.chat = []; ui.chatOpp = null; toast("Workspace restored"); go("dashboard"); } break;
      case "welcomed": st.welcomed = true; save(); render(); break;
      case "filter": ui.filter = b.dataset.v; render(); break;
      case "tab": ui.tab = b.dataset.v; render(); break;
      case "dup": var src = st.opps.filter(function (x) { return x.id === b.dataset.id; })[0], cp = JSON.parse(JSON.stringify(src)); cp.id = uid(); cp.name = src.name + " (copy)"; cp.status = "Evaluating"; delete cp.owned; cp.log = []; logEvent(cp, "Duplicated from " + src.name); st.opps.unshift(cp); save(); toast("Duplicated"); go("opp-" + cp.id); break;
      case "del":
        var idx = st.opps.indexOf(o); st.opps.splice(idx, 1); save(); go("opportunities");
        toast("Deleted " + o.name, "Undo", function () { st.opps.splice(idx, 0, o); save(); go("opp-" + o.id); });
        break;
      case "add-actual": var last = (o.owned.actuals || []).map(function (x) { return x.month; }).sort().pop(); var pf = ownedPerf(o); o.owned.actuals.push({ id: uid(), month: last ? addMonths(last, 1) : NOW, revenue: Math.round(pf.planRev), expenses: Math.round(pf.planExp), note: "" }); save(); render(); break;
      case "del-actual": o.owned.actuals = o.owned.actuals.filter(function (x) { return x.id !== b.dataset.id; }); save(); render(); break;
      case "copy-report": copyText(reportPlain(st.opps.filter(function (x) { return x.id === b.dataset.id; })[0]), "Summary copied"); break;
      case "cmp": var id = b.dataset.id, i = ui.compare.indexOf(id); if (i >= 0) ui.compare.splice(i, 1); else { if (ui.compare.length >= 3) ui.compare.shift(); ui.compare.push(id); } render(); break;
      case "add-line": st.budget[b.dataset.k].push(b.dataset.k === "income" ? { id: uid(), name: "New income", amount: 0 } : { id: uid(), name: "New expense", amount: 0, kind: "Variable" }); onb("budget"); save(); render(); break;
      case "del-line": st.budget[b.dataset.k] = st.budget[b.dataset.k].filter(function (x) { return x.id !== b.dataset.id; }); save(); render(); break;
      case "add-goal": st.budget.goals.push({ id: uid(), name: "New goal", target: 10000, saved: 0, monthly: 250 }); save(); render(); break;
      case "del-goal": st.budget.goals = st.budget.goals.filter(function (x) { return x.id !== b.dataset.id; }); save(); render(); break;
      case "add-acct": st.accounts.push({ id: uid(), name: "New account", type: "Cash", value: 0 }); save(); render(); break;
      case "del-acct": var ra = st.accounts.filter(function (x) { return x.id === b.dataset.id; })[0], ri = st.accounts.indexOf(ra); st.accounts.splice(ri, 1); save(); render(); toast("Removed " + ra.name, "Undo", function () { st.accounts.splice(ri, 0, ra); save(); render(); }); break;
      case "snapshot": snapshot(); break;
      case "ask": ask(b.dataset.q); break;
      case "lesson": ui.lesson = b.dataset.id || null; render(); break;
      case "lesson-done": onb("lesson"); if ((st.lessonsDone || []).indexOf(b.dataset.id) < 0) st.lessonsDone = (st.lessonsDone || []).concat([b.dataset.id]); save(); toast("Lesson complete"); render(); break;
      case "ask-reset-demo":
        if (location.hash !== "#settings") { go("settings"); setTimeout(function () { var r0 = $('[data-act="ask-reset-demo"]', $("#main")); if (r0) r0.click(); }, 30); break; }
        $("#confirmSlot").innerHTML = '<div class="banner" style="margin:0"><span>Reset the demo to the original sample portfolio? Your own workspace is not affected.</span><span class="confirm"><button class="btn sm ghost" data-act="cancel-reset">Cancel</button><button class="btn sm danger" data-act="do-reset-demo">Reset demo</button></span></div>'; break;
      case "ask-erase": $("#confirmSlot").innerHTML = '<div class="banner" style="margin:10px 0 0"><span>Erase every opportunity, account, budget line, and goal in your workspace? This cannot be undone.</span><span class="confirm"><button class="btn sm ghost" data-act="cancel-reset">Cancel</button><button class="btn sm danger" data-act="do-erase">Erase and start over</button></span></div>'; break;
      case "cancel-reset": $("#confirmSlot").innerHTML = ""; break;
      case "do-reset-demo": demo = seed(leadFirst || (live && live.settings.name) || ""); demo.welcomed = true; store(DKEY, demo); if (mode === "demo") st = demo; ui.compare = []; ui.chat = []; ui.chatOpp = null; toast("Demo reset to the sample portfolio"); go("dashboard"); break;
      case "do-erase": try { localStorage.removeItem(KEY); } catch (er) { } live = null; st = null; ui.setup = null; mode = "demo"; store(MKEY, mode); if (demo) st = demo; toast("Workspace erased"); go("setup"); break;
    }
  });
  var gPending = 0;
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { var sc = $(".scrim"); if (sc) { closeModal(sc); e.preventDefault(); } return; }
    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { if (st) { e.preventDefault(); palette(); } return; }
    var tg = e.target, typing = tg && (tg.tagName === "INPUT" || tg.tagName === "TEXTAREA" || tg.tagName === "SELECT" || tg.isContentEditable);
    if (typing || e.metaKey || e.ctrlKey || e.altKey || !st || $(".scrim") || route().v === "setup") return;
    if (gPending && Date.now() - gPending < 1200) {
      gPending = 0; var dest = { d: "dashboard", o: "opportunities", c: "compare", b: "budget", w: "networth", p: "planner", a: "aimbot", l: "learn", s: "settings" }[e.key.toLowerCase()];
      if (dest) { e.preventDefault(); go(dest); } return;
    }
    if (e.key === "g" || e.key === "G") { gPending = Date.now(); return; }
    if (e.key === "n" || e.key === "N") { e.preventDefault(); newOpp(); return; }
    if (e.key === "?") { e.preventDefault(); shortcuts(); }
  });
  window.addEventListener("hashchange", function () {
    var h = location.hash;
    if (h.indexOf("#import=") === 0) {
      var x = decodeShare(h.slice(8)); try { history.replaceState(null, "", location.pathname + location.search + "#dashboard"); } catch (e) { }
      if (!st) setMode("demo", true);
      render(); if (x) offerImport(x); else toast("That share link is damaged or incomplete."); return;
    }
    if (h === "#demo") { if (mode !== "demo" || !st) setMode("demo", !st); try { history.replaceState(null, "", location.pathname + location.search + "#dashboard"); } catch (e) { } }
    if (h !== "#learn") ui.lesson = null; render();
  });

  render();
  if (/^#(welcome|demo|start|import=)/.test(location.hash)) { try { history.replaceState(null, "", location.pathname + location.search + (st ? "#dashboard" : "")); } catch (e) { } }
  if (pendingImport) { if (st) offerImport(pendingImport); }
  else if (importBad) toast("That share link is damaged or incomplete.");
})();
