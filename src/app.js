/* AIM web app. Vanilla JS, data saved to this browser. */
(function () {
  "use strict";
  var M = AIM.money, P = AIM.pct, R = AIM.ratio, num = AIM.num;
  var KEY = "aim.workspace.v1", LEAD = "aim.lead.v1";
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
          { id: uid(), name: "Subscriptions", amount: 85, kind: "Fixed" }, { id: uid(), name: "Groceries", amount: 620, kind: "Variable" },
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
        { id: uid(), name: "Vehicle", type: "Other asset", value: 21000 }, { id: uid(), name: "Auto loan", type: "Liability", value: 14800 },
        { id: uid(), name: "Credit card balance", type: "Liability", value: 1200 }
      ],
      opps: opps, history: [], lessonsDone: ["cap", "coc"], welcomed: false
    };
    var nw = netWorthOf(ws).total;
    for (var j = 11; j >= 1; j--) ws.history.push({ month: addMonths(NOW, -j), value: Math.round(nw * Math.pow(0.986, j) + (j % 3 === 0 ? -1800 : 900)) });
    ws.history.push({ month: NOW, value: Math.round(nw) });
    return ws;
  }
  function emptyWs(name) {
    return { v: 1, sample: false, created: new Date().toISOString(), settings: { name: name || "", minDscr: 1.25, minCoc: 8, reserveMonths: 6 },
      budget: { income: [], expenses: [], goals: [] }, accounts: [], opps: [], history: [], lessonsDone: [], welcomed: true };
  }

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
    return { settings: st.settings, budget: st.budget, opps: st.opps, cash: cash, reserve: reserve, available: Math.max(0, cash - reserve), netWorth: nw.total, ownedEquity: nw.ownedEquity };
  }
  function scoreOf(o, c) { return AIM.score(o.type, o.inputs, c || ctx()); }
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

  /* ---------- state ---------- */
  var st = store(KEY), lead = store(LEAD), ui = { tab: "analysis", filter: "All", compare: [], chatOpp: null, chat: [], lesson: null, oppId: null };
  function canStore() { try { localStorage.setItem("aim.probe", "1"); localStorage.removeItem("aim.probe"); return true; } catch (e) { return false; } }
  var cameFromDemo = location.hash === "#welcome";
  var allowed = !!lead || cameFromDemo || !canStore() || !!(st && st.unlocked);
  if (!st && allowed) { st = seed(lead && lead.name ? lead.name.split(" ")[0] : ""); }
  if (st && cameFromDemo) { st.unlocked = true; if (lead && lead.name && !st.settings.name) st.settings.name = lead.name.split(" ")[0]; }
  if (st) store(KEY, st);
  var saveT;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { store(KEY, st); }, 150); }
  window.addEventListener("pagehide", function () { if (st) store(KEY, st); });

  /* ---------- icons ---------- */
  var I = {
    dash: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
    opps: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 1v5M12 18v5M1 12h5M18 12h5"/>',
    cmp: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    budget: '<path d="M3 7h18v13H3zM3 7l3-4h12l3 4M15 13h3"/>',
    nw: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
    bot: '<path d="M4 5h16v11H8l-4 4zM8 10h.01M12 10h.01M16 10h.01"/>',
    learn: '<path d="M2 7l10-4 10 4-10 4zM6 9v6c3 2 9 2 12 0V9"/>',
    set: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>'
  };
  function ic(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[k] + "</svg>"; }
  var NAV = [["dashboard", "Dashboard", "dash"], ["opportunities", "Opportunities", "opps"], ["compare", "Compare", "cmp"], ["sep"], ["budget", "Budget and goals", "budget"], ["networth", "Net worth", "nw"], ["sep"], ["aimbot", "AIMBot", "bot"], ["learn", "AIM Learning", "learn"], ["settings", "Settings", "set"]];

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
    var legend = series.length > 1 ? '<div class="legend">' + series.map(function (s) { return '<span><i style="background:' + s.color + '"></i>' + esc(s.name) + "</span>"; }).join("") + "</div>" : "";
    return '<div class="cwrap" id="' + id + '" style="min-height:' + (o.h || 230) + 'px"></div>' + legend;
  }
  function drawChart(id, cfg) {
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
        marks += s.values.map(function (v, i) { var x = xc(i) - gw / 2 + si * (bw + 2); return '<path d="' + roundBar(x, y(0), bw, y(v), 4) + '" fill="' + s.color + '"/>'; }).join("");
      });
    } else {
      series.forEach(function (s) {
        var pts = s.values.map(function (v, i) { return xc(i).toFixed(1) + "," + y(v).toFixed(1); });
        if (o.area) marks += '<path d="M' + xc(0) + "," + y(lo) + "L" + pts.join("L") + "L" + xc(n - 1) + "," + y(lo) + 'Z" fill="' + s.color + '" opacity=".08"/>';
        marks += '<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + s.color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
        var li = n - 1; marks += '<circle cx="' + xc(li) + '" cy="' + y(s.values[li]) + '" r="4.5" fill="' + s.color + '" stroke="var(--paper)" stroke-width="2"/>';
      });
    }
    el.innerHTML = '<svg class="chart" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(o.label || "Chart") + '">' + g + zero + yl + xl + marks +
      '<line class="xh" y1="' + T + '" y2="' + (T + ih) + '" stroke="var(--faint)" stroke-dasharray="3 3" opacity="0"/><circle class="xd" r="5" fill="var(--navy)" stroke="var(--paper)" stroke-width="2" opacity="0"/>' +
      '<rect x="' + L + '" y="' + T + '" width="' + iw + '" height="' + ih + '" fill="transparent"/></svg><div class="tip" hidden></div>';
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
  function bindCharts() {
    Object.keys(pendingCharts).forEach(function (id) { chartReg[id] = pendingCharts[id]; drawChart(id, pendingCharts[id]); });
    pendingCharts = {};
  }
  var rzT;
  window.addEventListener("resize", function () { clearTimeout(rzT); rzT = setTimeout(function () { Object.keys(chartReg).forEach(function (id) { if (document.getElementById(id)) drawChart(id, chartReg[id]); else delete chartReg[id]; }); }, 150); });
  function dial(sc) {
    var c = 2 * Math.PI * 46, f = sc.total / 100, col = { Strong: "var(--good)", Workable: "var(--navy)", Marginal: "var(--warn)", Weak: "var(--bad)" }[sc.grade];
    return '<svg class="dial" viewBox="0 0 112 112" role="img" aria-label="AIM Score ' + sc.total + ' of 100"><circle cx="56" cy="56" r="46" fill="none" stroke="var(--tint)" stroke-width="10"/>' +
      '<circle cx="56" cy="56" r="46" fill="none" stroke="' + col + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + (c * f).toFixed(1) + " " + c.toFixed(1) + '" transform="rotate(-90 56 56)"/>' +
      '<text x="56" y="58" text-anchor="middle" style="font:600 30px var(--mono);fill:var(--ink)">' + sc.total + '</text><text x="56" y="78" text-anchor="middle" style="font:500 10px var(--mono);letter-spacing:.1em;fill:var(--muted)">AIM SCORE</text></svg>';
  }
  function gradePill(sc) { var k = { Strong: "good", Workable: "neutral", Marginal: "warn", Weak: "bad" }[sc.grade]; return '<span class="pill ' + k + '"><i></i>' + sc.grade + "</span>"; }
  function statusPill(s) { return '<span class="pill ' + (s === "Owned" ? "good" : s === "Passed" ? "warn" : "neutral") + '">' + esc(s) + "</span>"; }
  function signed(v, el) { return '<span class="' + (v < 0 ? "dn" : "") + '">' + M(v) + "</span>"; }

  /* ---------- shell ---------- */
  var root = document.getElementById("app");
  function route() { var h = (location.hash || "").replace("#", ""); if (!h || h === "welcome") return { v: "dashboard" }; if (h.indexOf("opp-") === 0) return { v: "opp", id: h.slice(4) }; return { v: h }; }
  function go(h) { if (location.hash === "#" + h) render(); else location.hash = h; }

  var lastRoute = "";
  function focusKey(el) {
    if (!el || el === document.body) return null;
    if (el.id) return "#" + el.id;
    var parts = Object.keys(el.dataset || {}).map(function (k) { return "[data-" + k.replace(/[A-Z]/g, function (c) { return "-" + c.toLowerCase(); }) + '="' + el.dataset[k] + '"]'; });
    return parts.length ? el.tagName.toLowerCase() + parts.join("") : null;
  }
  function render() {
    if (!st || !allowed) return renderGate();
    var fk = focusKey(document.activeElement);
    var r = route(), view = VIEWS[r.v] ? r.v : "dashboard";
    var cur = view === "opp" ? "opportunities" : view;
    var first = (st.settings.name || "").trim();
    $("#wsSlot").innerHTML = (st.sample ? '<span class="sample">Sample data</span>' : "") + '<span class="who"><span class="wsname">' + esc(first ? first + "'s workspace" : "Your workspace") + '</span><span class="av" aria-hidden="true">' + esc((first || "A").charAt(0).toUpperCase()) + "</span></span>";
    root.innerHTML = '<div class="app"><nav class="rail" aria-label="App">' + NAV.map(function (n) {
      if (n[0] === "sep") return '<div class="sep"></div>';
      return '<a href="#' + n[0] + '"' + (cur === n[0] ? ' aria-current="page"' : "") + ">" + ic(n[2]) + "<span>" + n[1] + "</span></a>";
    }).join("") + '<div class="foot">AIM gives analysis and education, not investment, tax, or legal advice.</div></nav><main class="main" id="main">' + VIEWS[view](r) + "</main></div>";
    bindCharts();
    if (VIEWS[view].after) VIEWS[view].after(r);
    var rk = location.hash + "|" + ui.tab + "|" + ui.lesson;
    if (rk !== lastRoute) { lastRoute = rk; window.scrollTo(0, 0); }
    else if (fk) { try { var f = document.querySelector(fk); if (f) f.focus({ preventScroll: true }); } catch (e) { } }
  }
  function later() { setTimeout(render, 0); }
  function renderGate() {
    $("#wsSlot").innerHTML = "";
    root.innerHTML = '<div class="wrap"><div class="card gate"><span class="tag">Private beta</span><h1>Request a demo to open AIM</h1><p>AIM is in private beta. Tell us a little about what you invest in and your workspace opens right away, loaded with a sample portfolio you can edit.</p><div class="actions"><a class="btn" href="demo.html">Request a demo</a><a class="btn ghost" href="index.html">Back to the site</a></div></div></div>';
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
    if (!st.welcomed) h += '<div class="banner"><span><b>Welcome to AIM' + (first ? ", " + esc(first) : "") + ".</b> This workspace is loaded with a sample portfolio so you can see every feature. Edit anything, or start empty from Settings.</span><button class=\"btn sm ghost\" data-act=\"welcomed\">Got it</button></div>";
    h += '<div class="ph"><div><h1>' + greet + (first ? ", " + esc(first) : "") + '</h1><p>Here is what you own, what you are considering, and what needs attention.</p></div><div class="actions"><button class="btn" data-act="new-opp">New analysis</button></div></div>';
    h += '<div class="grid g4" style="margin-bottom:18px">' +
      '<div class="card kpi hero"><small>Net worth</small><strong>' + M(nw.total) + "</strong><span>" + (prev != null ? '<span class="' + (nw.total >= prev ? "up" : "dn") + '">' + (nw.total >= prev ? "+" : "") + M(nw.total - prev) + "</span> since last month" : "Record a snapshot to track change") + "</span></div>" +
      '<div class="card kpi"><small>Cash available to invest</small><strong>' + M(c.available) + "</strong><span>After your " + M(c.reserve) + " reserve</span></div>" +
      '<div class="card kpi"><small>Monthly free cash flow</small><strong>' + signed(b.fcf) + "</strong><span>" + M(b.income) + " in, " + M(b.expenses) + " out</span></div>" +
      '<div class="card kpi"><small>Savings rate</small><strong>' + P(b.savingsRate, 0) + "</strong><span>Of monthly income</span></div></div>";
    h += '<div class="grid split"><div class="stack">';
    h += '<section class="card"><header><h2>Needs your attention</h2><span class="muted" style="font-size:13px">' + att.length + " items</span></header>" + (att.length ? att.map(function (a) {
      return '<div class="att"><span class="flag" style="padding:0;border:0"><span class="sev ' + a.sev + '"></span></span><div><b>' + esc(a.title) + "</b><p>" + esc(a.text) + "</p></div>" + (a.go ? '<a class="btn sm ghost" href="#' + a.go + '">Open</a>' : "<span></span>") + "</div>";
    }).join("") : '<div class="empty">Nothing urgent. Your numbers are on track.</div>') + "</section>";
    h += '<section class="card"><header><h2>Opportunities you are evaluating</h2><a class="btn sm link" href="#opportunities">See all</a></header>' + (evals.length ? '<div class="tw"><table><thead><tr><th>Opportunity</th><th class="r">Cash needed</th><th class="r">Cash flow / mo</th><th class="r">Cash on cash</th><th class="r">Score</th></tr></thead><tbody>' + evals.map(function (x) {
      return '<tr class="click" data-go="opp-' + x.o.id + '"><td><div class="oname"><b>' + esc(x.o.name) + "</b><span>" + TYPE[x.o.type] + (x.o.location ? " · " + esc(x.o.location) : "") + '</span></div></td><td class="n">' + M(x.sc.r.cash) + '</td><td class="n">' + signed(x.sc.r.cfMonth) + '</td><td class="n">' + P(x.sc.r.coc) + '</td><td class="r"><span class="score ' + gradeClass(x.sc.grade) + '">' + x.sc.total + "</span></td></tr>";
    }).join("") + "</tbody></table></div>" : '<div class="empty">No deals in progress. <button class="btn sm link" data-act="new-opp">Start an analysis</button></div>') + "</section>";
    h += "</div><div class=\"stack\">";
    if (hist.length > 1) h += '<section class="card"><header><h2>Net worth trend</h2><a class="btn sm link" href="#networth">Details</a></header><div class="body">' + chart("nwc", hist.map(function (x) { return ymLabel(x.month).slice(0, 3); }), [{ name: "Net worth", color: "var(--c1)", values: hist.map(function (x) { return x.value; }) }], { area: true, h: 200, label: "Net worth over the last year", maxLabels: 6 }) + "</div></section>";
    h += '<section class="card"><header><h2>Owned assets</h2></header>' + (owned.length ? owned.map(function (o) {
      var pf = ownedPerf(o), e = ownedEquity(o), last = pf.rows[pf.rows.length - 1];
      return '<div class="att" style="grid-template-columns:1fr auto"><div><b>' + esc(o.name) + '</b><p>Equity ' + M(e.equity) + (last ? " · " + ymLabel(last.a.month) + " cash flow " + M(last.cf) + " vs plan " + M(last.plan) : "") + '</p></div><a class="btn sm ghost" href="#opp-' + o.id + '">Open</a></div>';
    }).join("") : '<div class="empty">Mark an analysis as Owned to track it here.</div>') + "</section>";
    h += '<section class="card"><header><h2>Savings goals</h2><a class="btn sm link" href="#budget">Edit</a></header><div class="body" style="padding-block:4px">' + (st.budget.goals.length ? st.budget.goals.map(goalRow).join("") : '<div class="empty">No goals yet.</div>') + "</div></section>";
    h += "</div></div>";
    return h;
  };
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
    var c = ctx(), list = st.opps.filter(function (o) { return ui.filter === "All" || o.status === ui.filter; });
    var counts = { All: st.opps.length }; st.opps.forEach(function (o) { counts[o.status] = (counts[o.status] || 0) + 1; });
    var h = '<div class="ph"><div><h1>Opportunities</h1><p>Every deal you have analyzed, from first look to ownership.</p></div><div class="actions"><button class="btn" data-act="new-opp">New analysis</button></div></div>';
    h += '<div class="chips" style="margin-bottom:16px" role="group" aria-label="Filter by status">' + ["All", "Evaluating", "Owned", "Passed"].map(function (f) { return '<button class="chip" data-act="filter" data-v="' + f + '" aria-pressed="' + (ui.filter === f) + '">' + f + " " + (counts[f] || 0) + "</button>"; }).join("") + "</div>";
    if (!list.length) return h + '<div class="card empty">No opportunities here yet. <button class="btn sm link" data-act="new-opp">Start an analysis</button></div>';
    h += '<div class="card tw"><table><thead><tr><th>Opportunity</th><th>Status</th><th class="r">Price</th><th class="r">Cash needed</th><th class="r">Cash flow / yr</th><th class="r">Cash on cash</th><th class="r">DSCR</th><th class="r">Score</th></tr></thead><tbody>' +
      list.map(function (o) {
        var sc = scoreOf(o, c), r = sc.r;
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
    var tabs = [["analysis", "Analysis"], ["scenarios", "Scenarios and risk"]].concat(o.status === "Owned" ? [["ownership", "Ownership"]] : []).concat([["report", "Report"]]);
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
      '<div class="parts">' + sc.parts.map(function (p) { return '<div class="part"><small>' + p.label + "</small><b>" + Math.round(p.pts) + "/" + p.max + '</b><div class="meter"><i style="width:' + (p.pts / p.max * 100).toFixed(0) + '%"></i></div></div>'; }).join("") + "</div></section>";
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
        "<tr><td>Cash on cash</td><td class=\"n\">" + P(r.coc) + '</td><td class="n">' + P(r.ltr.coc) + "</td></tr></tbody></table></div></section>";
    }
    h += '<section class="card"><header><h2>' + (o.type === "business" ? "Earnings and cash flow" : "Annual operating statement") + '</h2></header><div class="tw"><table><tbody>' + r.lines.map(function (l) { return "<tr" + (l[2] ? ' class="' + l[2] + '"' : "") + "><td>" + l[0] + '</td><td class="n">' + M(l[1]) + "</td></tr>"; }).join("") + "</tbody></table></div></section>";
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
    var gap = r.cash - c.available, b = AIM.budget(st.budget);
    h += '<div class="stack"><section class="card"><header><h2>Can you afford it?</h2></header><div class="body"><div class="mgrid" style="grid-template-columns:1fr 1fr;border:1px solid var(--line);border-radius:6px"><div class="m"><small>Cash needed</small><strong>' + M(r.cash) + '</strong></div><div class="m" style="border-right:0"><small>Available after reserve</small><strong>' + M(c.available) + "</strong></div></div><p style=\"margin-top:14px\">" +
      (gap <= 0 ? "You can fund this and still keep your full " + M(c.reserve) + " emergency reserve. " + M(-gap) + " would remain available." : "You are " + M(gap) + " short after holding back your reserve." + (b.fcf > 0 ? " At your current " + M(b.fcf) + " of monthly free cash flow, you close the gap in about <b>" + Math.ceil(gap / b.fcf) + " months</b>." : "")) + "</p></div></section>";
    var all = AIM.score(o.type, o.inputs, c);
    h += '<section class="card"><header><h2>Risk flags</h2></header>' + (all.flags.length ? all.flags.map(flagRow).join("") : '<div class="empty">No flags at these assumptions.</div>') + "</section></div></div>";
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
    return '<div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:12px"><button class="btn sm" data-act="copy-report" data-id="' + o.id + '">Copy summary</button></div><article class="card doc"><span class="eyebrow">AIM investment summary · ' + new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) + "</span><h2>" + esc(t.title) + '</h2><p class="muted" style="margin-top:6px">' + esc(t.sub) + '</p><div style="display:flex;gap:12px;align-items:center;margin-top:16px">' + gradePill(t.score) + '<span class="num">AIM Score ' + t.score.total + "/100</span></div>" +
      "<h3>Thesis</h3><p>" + esc(t.thesis) + "</p><h3>Recommendation</h3><p>" + esc(t.rec) + "</p>" +
      '<h3>Key numbers</h3><div class="mgrid" style="grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--line);border-radius:6px">' + t.metrics.map(function (m) { return '<div class="m"><small>' + m[0] + "</small><strong>" + m[1] + "</strong></div>"; }).join("") + "</div>" +
      "<h3>Assumptions that matter most</h3><ul>" + t.drivers.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul>" +
      "<h3>Risks</h3>" + (t.flags.length ? "<ul>" + t.flags.map(function (f) { return "<li><b>" + esc(f.title) + ".</b> " + esc(f.detail) + "</li>"; }).join("") + "</ul>" : "<p>No flags at the current assumptions.</p>") +
      "<h3>Next steps</h3><ul>" + t.next.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul>" +
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
    var h = '<div class="ph"><div><h1>Budget and goals</h1><p>Your monthly cash flow funds every future purchase. Changes here update readiness across AIM.</p></div></div>';
    h += '<div class="grid g4" style="margin-bottom:18px"><div class="card kpi"><small>Monthly income</small><strong>' + M(b.income) + '</strong></div><div class="card kpi"><small>Monthly expenses</small><strong>' + M(b.expenses) + "</strong><span>" + M(b.fixed) + ' fixed</span></div><div class="card kpi hero"><small>Free cash flow</small><strong>' + M(b.fcf) + "</strong><span>" + P(b.savingsRate, 0) + ' savings rate</span></div><div class="card kpi"><small>Emergency reserve</small><strong>' + M(c.reserve) + "</strong><span>" + st.settings.reserveMonths + " months · " + (c.cash >= c.reserve ? '<span class="up">Funded</span>' : '<span class="dn">Short ' + M(c.reserve - c.cash) + "</span>") + "</span></div></div>";
    function listCard(title, key, kind) {
      var arr = st.budget[key];
      return '<section class="card"><header><h2>' + title + '</h2><button class="btn sm ghost" data-act="add-line" data-k="' + key + '">Add</button></header><div class="tw"><table><tbody>' + (arr.length ? arr.map(function (x) {
        return '<tr><td><input value="' + esc(x.name) + '" data-line="' + key + '" data-id="' + x.id + '" data-k="name" aria-label="Name"></td>' + (kind ? '<td style="width:120px"><select data-line="' + key + '" data-id="' + x.id + '" data-k="kind" aria-label="Type"><option' + (x.kind === "Fixed" ? " selected" : "") + ">Fixed</option><option" + (x.kind === "Variable" ? " selected" : "") + ">Variable</option></select></td>" : "") +
          '<td style="width:140px"><div class="inwrap pre"><span class="u">$</span><input type="number" value="' + x.amount + '" data-line="' + key + '" data-id="' + x.id + '" data-k="amount" aria-label="Monthly amount" style="text-align:right"></div></td><td style="width:44px"><button class="x" data-act="del-line" data-k="' + key + '" data-id="' + x.id + '" aria-label="Remove">×</button></td></tr>';
      }).join("") : '<tr><td class="empty">Nothing added yet.</td></tr>') + "</tbody></table></div></section>";
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
    h += '<section class="card chat"><div class="msgs" id="msgs" aria-live="polite">' + ui.chat.map(function (m) { return '<div class="msg ' + (m.me ? "me" : "bot") + '">' + (m.me ? esc(m.html) : m.html) + "</div>"; }).join("") + '</div><div class="chips" style="padding:0 12px 10px">' + ["What drives this deal?", "What should I offer?", "Am I ready to buy it?", "What are the risks?", "Show the downside", "Compare my deals", "Explain DSCR"].map(function (s) { return '<button class="chip" data-act="ask" data-q="' + esc(s) + '">' + s + "</button>"; }).join("") + '</div><form class="composer" id="botForm"><label for="botIn" class="sr">Message</label><input id="botIn" autocomplete="off" placeholder="Ask about your numbers"><button class="btn" type="submit">Send</button></form></section>';
    return h;
  };
  VIEWS.aimbot.after = function () { var m = $("#msgs"); if (m) m.scrollTop = m.scrollHeight; };
  function ask(q) {
    if (!q.trim()) return;
    var opp = st.opps.filter(function (o) { return o.id === ui.chatOpp; })[0] || null;
    ui.chat.push({ me: true, html: q }); ui.chat.push({ me: false, html: LEARN.answer(q, ctx(), opp) });
    render(); var i = $("#botIn"); if (i) i.focus();
  }

  VIEWS.learn = function () {
    var L = LEARN.LESSONS, done = st.lessonsDone || [];
    if (ui.lesson) {
      var l = L.filter(function (x) { return x.id === ui.lesson; })[0], ex = l.ex(ctx());
      return '<div style="margin-bottom:6px"><button class="btn sm link" style="padding-left:0" data-act="lesson" data-id="">← All lessons</button></div><article class="card doc"><span class="eyebrow">' + l.track + " · " + l.mins + " min</span><h2>" + l.title + '</h2><div class="prose" style="margin-top:18px">' + l.body.map(function (p) { return "<p>" + p + "</p>"; }).join("") + '</div><h3>Formula</h3><div class="formula">' + l.formula + "</div>" + (ex ? "<h3>With your numbers</h3><p>" + esc(ex) + "</p>" : "") +
        '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:26px">' + (done.indexOf(l.id) < 0 ? '<button class="btn" data-act="lesson-done" data-id="' + l.id + '">Mark complete</button>' : '<span class="pill good">Completed</span>') + (l.open ? '<a class="btn ghost" href="#' + (l.open === "budget" ? "budget" : "opportunities") + '">Try it in AIM</a>' : "") + "</div></article>";
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
    var h = '<div class="ph"><div><h1>Settings</h1><p>Your targets drive every AIM Score, target price, and risk flag.</p></div></div><div class="grid g2" style="align-items:start"><section class="card"><header><h2>Profile and targets</h2></header><div class="body"><div class="fg">' +
      '<div class="f full"><label for="s-name">First name</label><input id="s-name" value="' + esc(s.name) + '" data-set="name"></div>' +
      '<div class="f"><label for="s-coc">Minimum cash on cash</label><div class="inwrap post"><input id="s-coc" type="number" step="0.5" value="' + s.minCoc + '" data-set="minCoc"><span class="u">%</span></div></div>' +
      '<div class="f"><label for="s-dscr">Minimum DSCR</label><input id="s-dscr" type="number" step="0.05" value="' + s.minDscr + '" data-set="minDscr"></div>' +
      '<div class="f"><label for="s-res">Emergency reserve</label><div class="inwrap post"><input id="s-res" type="number" step="1" value="' + s.reserveMonths + '" data-set="reserveMonths"><span class="u">mos</span></div></div></div></div></section>';
    h += '<section class="card"><header><h2>Workspace</h2></header><div class="body" style="display:flex;flex-direction:column;gap:14px"><p class="muted" style="font-size:14px">Your workspace is saved in this browser on this device. It is not sent to AIM servers during the beta.</p>' +
      '<div class="confirm" id="resetRow"><button class="btn ghost" data-act="ask-reset" data-v="sample">Reload the sample portfolio</button><button class="btn ghost" data-act="ask-reset" data-v="empty">Start an empty workspace</button></div><div id="confirmSlot"></div></div></section></div>';
    return h;
  };

  /* ---------- modal ---------- */
  function modal(html) { var d = document.createElement("div"); d.className = "scrim"; d.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + "</div>"; document.body.appendChild(d); d.addEventListener("click", function (e) { if (e.target === d || e.target.closest("[data-close]")) d.remove(); }); var f = d.querySelector("input,button"); if (f) f.focus(); return d; }
  function toast(t) { var d = document.createElement("div"); d.className = "toast"; d.setAttribute("role", "status"); d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2200); }
  function newOpp() {
    var d = modal('<header><h2>New analysis</h2><button class="x" data-close aria-label="Close">×</button></header><form id="newForm"><div class="body"><fieldset style="padding:0;border:0"><legend class="sr">Type</legend><div class="types">' +
      [["rental", "Long term rental", "Single family, duplex, small multifamily"], ["str", "Short term rental", "Vacation homes and Airbnb style units"], ["business", "Business", "Laundromats, services, routes, and more"]].map(function (t, i) { return '<label><input type="radio" name="t" value="' + t[0] + '"' + (i === 0 ? " checked" : "") + ' class="sr"><b>' + t[1] + "</b><span>" + t[2] + "</span></label>"; }).join("") +
      '</div></fieldset><div class="f"><label for="nName">Name</label><input id="nName" required placeholder="123 Main St or the business name"></div><div class="f"><label for="nLoc">Location</label><input id="nLoc" placeholder="City, state"></div><p class="muted" style="font-size:13px">AIM starts you with typical assumptions. Replace them with real numbers as you get them.</p></div><footer><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn" type="submit">Create analysis</button></footer></form>');
    $("#newForm", d).addEventListener("submit", function (e) {
      e.preventDefault(); var t = $("input[name=t]:checked", d).value, n = $("#nName", d).value.trim();
      if (!n) { $("#nName", d).focus(); return; }
      var o = { id: uid(), type: t, name: n, location: $("#nLoc", d).value.trim(), status: "Evaluating", created: NOW, notes: "", inputs: Object.assign({}, AIM.DEFAULTS[t]) };
      st.opps.unshift(o); save(); d.remove(); ui.tab = "analysis"; go("opp-" + o.id);
    });
  }

  /* ---------- events ---------- */
  function findOpp() { var r = route(); return r.v === "opp" ? st.opps.filter(function (o) { return o.id === r.id; })[0] : null; }
  var refreshT;
  function refreshResults() {
    clearTimeout(refreshT); refreshT = setTimeout(function () { var o = findOpp(), el = $("#results"); if (o && el) { el.innerHTML = results(o); bindCharts(); } }, 120);
  }
  document.addEventListener("input", function (e) {
    var t = e.target, o, d = t.dataset;
    if (d.field && (o = findOpp())) { o.inputs[d.field] = t.tagName === "SELECT" ? t.value : num(t.value); save(); refreshResults(); return; }
    if (d.meta && (o = findOpp())) { if (d.meta !== "status") { o[d.meta] = t.value; save(); } return; }
    if (d.line) { var x = st.budget[d.line].filter(function (i) { return i.id === d.id; })[0]; if (x) { x[d.k] = d.k === "amount" ? num(t.value) : t.value; save(); } return; }
    if (d.goal) { var g = st.budget.goals.filter(function (i) { return i.id === d.goal; })[0]; if (g) { g[d.k] = d.k === "name" ? t.value : num(t.value); save(); } return; }
    if (d.acct) { var a = st.accounts.filter(function (i) { return i.id === d.acct; })[0]; if (a) { a[d.k] = d.k === "value" ? num(t.value) : t.value; save(); } return; }
    if (d.set) { st.settings[d.set] = d.set === "name" ? t.value : num(t.value); save(); return; }
    if (d.actId && (o = findOpp())) { var ac = o.owned.actuals.filter(function (i) { return i.id === d.actId; })[0]; if (ac) { ac[d.k] = d.k === "revenue" || d.k === "expenses" ? num(t.value) : t.value; save(); } return; }
    if (d.own && (o = findOpp())) { o.owned[d.own] = d.own === "value" ? num(t.value) : t.value; save(); return; }
  });
  document.addEventListener("change", function (e) {
    var t = e.target, d = t.dataset, o;
    if (t.id === "botOpp") { ui.chatOpp = t.value || ""; return; }
    if (d.meta === "status" && (o = findOpp())) {
      o.status = t.value; if (o.status === "Owned" && !o.owned) o.owned = { since: NOW, value: AIM.run(o.type, o.inputs).inputs.price, actuals: [] };
      save(); toast("Marked as " + o.status); render(); return;
    }
    if (d.line || d.goal || d.acct || d.actId || d.own || d.set) later();
  });
  document.addEventListener("submit", function (e) { if (e.target.id === "botForm") { e.preventDefault(); var i = $("#botIn"); ask(i.value); } });
  document.addEventListener("click", function (e) {
    var tr = e.target.closest("tr[data-go]"); if (tr && !e.target.closest("a,button,input,select")) { go(tr.dataset.go); return; }
    var b = e.target.closest("[data-act]"); if (!b) return; var a = b.dataset.act, o = findOpp();
    switch (a) {
      case "new-opp": newOpp(); break;
      case "welcomed": st.welcomed = true; save(); render(); break;
      case "filter": ui.filter = b.dataset.v; render(); break;
      case "tab": ui.tab = b.dataset.v; render(); break;
      case "dup": var src = st.opps.filter(function (x) { return x.id === b.dataset.id; })[0], cp = JSON.parse(JSON.stringify(src)); cp.id = uid(); cp.name = src.name + " (copy)"; cp.status = "Evaluating"; delete cp.owned; st.opps.unshift(cp); save(); toast("Duplicated"); go("opp-" + cp.id); break;
      case "del":
        var dm = modal('<header><h2>Delete this analysis?</h2><button class="x" data-close aria-label="Close">×</button></header><div class="body"><p>' + esc(o.name) + ' and any logged months will be removed from this workspace. This cannot be undone.</p></div><footer><button class="btn ghost" data-close>Keep it</button><button class="btn danger" id="yesDel">Delete</button></footer>');
        $("#yesDel", dm).addEventListener("click", function () { st.opps = st.opps.filter(function (x) { return x.id !== o.id; }); save(); dm.remove(); toast("Deleted"); go("opportunities"); });
        break;
      case "add-actual": var last = (o.owned.actuals || []).map(function (x) { return x.month; }).sort().pop(); var p = ownedPerf(o); o.owned.actuals.push({ id: uid(), month: last ? addMonths(last, 1) : NOW, revenue: Math.round(p.planRev), expenses: Math.round(p.planExp), note: "" }); save(); render(); break;
      case "del-actual": o.owned.actuals = o.owned.actuals.filter(function (x) { return x.id !== b.dataset.id; }); save(); render(); break;
      case "copy-report":
        var txt = reportPlain(st.opps.filter(function (x) { return x.id === b.dataset.id; })[0]);
        try { navigator.clipboard.writeText(txt).then(function () { toast("Summary copied"); }, function () { fallbackCopy(txt); }); } catch (err) { fallbackCopy(txt); }
        break;
      case "cmp": var id = b.dataset.id, i = ui.compare.indexOf(id); if (i >= 0) ui.compare.splice(i, 1); else { if (ui.compare.length >= 3) ui.compare.shift(); ui.compare.push(id); } render(); break;
      case "add-line": st.budget[b.dataset.k].push(b.dataset.k === "income" ? { id: uid(), name: "New income", amount: 0 } : { id: uid(), name: "New expense", amount: 0, kind: "Variable" }); save(); render(); break;
      case "del-line": st.budget[b.dataset.k] = st.budget[b.dataset.k].filter(function (x) { return x.id !== b.dataset.id; }); save(); render(); break;
      case "add-goal": st.budget.goals.push({ id: uid(), name: "New goal", target: 10000, saved: 0, monthly: 250 }); save(); render(); break;
      case "del-goal": st.budget.goals = st.budget.goals.filter(function (x) { return x.id !== b.dataset.id; }); save(); render(); break;
      case "add-acct": st.accounts.push({ id: uid(), name: "New account", type: "Cash", value: 0 }); save(); render(); break;
      case "del-acct": st.accounts = st.accounts.filter(function (x) { return x.id !== b.dataset.id; }); save(); render(); break;
      case "snapshot": var v = Math.round(netWorthOf(st).total), hh = st.history.filter(function (x) { return x.month === NOW; })[0]; if (hh) hh.value = v; else st.history.push({ month: NOW, value: v }); save(); toast("Recorded " + M(v) + " for " + ymLabel(NOW)); render(); break;
      case "ask": ask(b.dataset.q); break;
      case "lesson": ui.lesson = b.dataset.id || null; render(); break;
      case "lesson-done": st.lessonsDone = (st.lessonsDone || []).concat([b.dataset.id]); save(); toast("Lesson complete"); render(); break;
      case "ask-reset":
        var kind = b.dataset.v; $("#confirmSlot").innerHTML = '<div class="banner" style="margin:0"><span>' + (kind === "sample" ? "Replace everything with the sample portfolio?" : "Clear every opportunity, account, and goal?") + ' This cannot be undone.</span><span class="confirm"><button class="btn sm ghost" data-act="cancel-reset">Cancel</button><button class="btn sm danger" data-act="do-reset" data-v="' + kind + '">Yes, continue</button></span></div>'; break;
      case "cancel-reset": $("#confirmSlot").innerHTML = ""; break;
      case "do-reset": var nm = st.settings.name; st = b.dataset.v === "sample" ? seed(nm) : emptyWs(nm); if (b.dataset.v === "sample") st.welcomed = true; ui.compare = []; ui.chat = []; ui.chatOpp = null; store(KEY, st); toast(b.dataset.v === "sample" ? "Sample portfolio loaded" : "Workspace cleared"); go("dashboard"); break;
    }
  });
  function fallbackCopy(t) { var ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); toast("Summary copied"); } catch (e) { toast("Select the summary text to copy it"); } ta.remove(); }
  window.addEventListener("hashchange", function () { if (location.hash !== "#learn") ui.lesson = null; render(); });

  render();
  if (cameFromDemo) { try { history.replaceState(null, "", location.pathname + location.search + "#dashboard"); } catch (e) { } }
})();
