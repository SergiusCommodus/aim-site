# Independent re-implementation of AIM's formulas, written from the finance definitions, not from the JS.
import json, subprocess, sys, math
cases = json.loads(subprocess.check_output(["node", "gen.js"]))
def pmt(P, ann, yrs):
    n = round(yrs * 12); r = ann / 1200
    if P <= 0 or n <= 0: return 0.0
    return P / n if r == 0 else P * r * (1 + r) ** n / ((1 + r) ** n - 1)
def bal(P, ann, yrs, k):
    # brute force month by month amortization
    p = pmt(P, ann, yrs); r = ann / 1200; b = P
    for _ in range(min(k, round(yrs * 12))): b = b + b * r - p
    return max(0.0, b)
def irr(fl):
    f = lambda x: sum(c / (1 + x) ** t for t, c in enumerate(fl))
    lo, hi = -0.99, 2.0
    if f(lo) * f(hi) > 0: return None
    for _ in range(200):
        m = (lo + hi) / 2
        if f(m) * f(lo) > 0: lo = m
        else: hi = m
    return (lo + hi) / 2
def rental(i):
    loan = i["price"] * (1 - i["down"] / 100); ds = pmt(loan, i["rate"], i["term"]) * 12
    gross = (i["rent"] + i["other"]) * 12; egi = gross * (1 - i["vacancy"] / 100)
    fixed = i["taxes"] + i["insurance"] + 12 * (i["hoa"] + i["utilities"] + i["otherExp"])
    opex = fixed + egi * i["mgmt"] / 100 + gross * (i["maint"] + i["capex"]) / 100
    noi = egi - opex; cash = i["price"] * i["down"] / 100 + i["closing"] + i["repairs"]
    # break even: occupancy o such that gross*o*(1-mgmt) - fixed - reserves - ds = 0
    be = (fixed + gross * (i["maint"] + i["capex"]) / 100 + ds) / (gross * (1 - i["mgmt"] / 100))
    fl = [-cash]
    for y in range(1, 6):
        g = gross * (1 + i["rentGrowth"] / 100) ** (y - 1); e = (1 + i["expGrowth"] / 100) ** (y - 1)
        eg = g * (1 - i["vacancy"] / 100); n_ = eg - (fixed * e + eg * i["mgmt"] / 100 + g * (i["maint"] + i["capex"]) / 100)
        fl.append(n_ - ds); cf5 = n_ - ds
    b5 = bal(loan, i["rate"], i["term"], 60); val = i["price"] * (1 + i["appreciation"] / 100) ** 5
    fl[5] += val * 0.94 - b5
    return dict(pmt=ds / 12, noi=noi, cf=noi - ds, cash=cash, cap=noi / i["price"], coc=(noi - ds) / cash, dscr=noi / ds if ds else None, beOcc=be, irr=irr(fl), bal5=b5, cf5=cf5)
def strm(i, occ=None, adr=None):
    occ = i["occupancy"] if occ is None else occ; adr = i["adr"] if adr is None else adr
    nights = 365 * occ / 100; stays = nights / i["avgStay"]; gross = adr * nights + i["cleanFee"] * stays
    opex = gross * (i["platform"] + i["mgmt"] + i["maint"] + i["capex"]) / 100 + i["cleanCost"] * stays + i["supplies"] * nights + i["taxes"] + i["insurance"] + 12 * (i["hoa"] + i["utilities"] + i["internet"] + i["otherExp"])
    loan = i["price"] * (1 - i["down"] / 100); ds = pmt(loan, i["rate"], i["term"]) * 12
    return gross, gross - opex, ds
def str_check(i):
    gross, noi, ds = strm(i)
    # break even occupancy solved in closed form: cash flow is linear in occupancy
    g0, n0, _ = strm(i, occ=0); g1, n1, _ = strm(i, occ=100)
    slope = (n1 - n0) / 100; be = (ds - n0) / slope if slope > 0 else None
    be = None if be is None or be > 100 else max(0, be) / 100
    a0 = strm(i, adr=0)[1]; a1 = strm(i, adr=1)[1]; sl = a1 - a0; beAdr = (ds - a0) / sl if sl > 0 else None
    if beAdr is not None and beAdr > 5000: beAdr = None
    if beAdr is not None: beAdr = max(0, beAdr)
    cash = i["price"] * i["down"] / 100 + i["closing"] + i["furnishing"] + i["repairs"]
    return dict(noi=noi, cf=noi - ds, cash=cash, beOcc=be, beAdr=beAdr, gross=gross)
def biz(i):
    sde = i["revenue"] - i["cogs"] - i["opex"] + i["ownerComp"] + i["addbacks"] + i["da"] + i["interest"]
    eq = i["price"] * i["down"] / 100; sn = i["price"] * i["sellerPct"] / 100; bank = max(0, i["price"] - eq - sn)
    ds = pmt(bank, i["bankRate"], i["bankTerm"]) * 12 + pmt(sn, i["sellerRate"], i["sellerTerm"]) * 12
    avail = sde - i["buyerSalary"] - i["capexReserve"]
    return dict(sde=sde, ds=ds, dscr=avail / ds if ds else None, cf=avail - ds, cash=eq + i["closing"] + i["workingCapital"], multiple=i["price"] / sde if sde > 0 else None)
bad = 0; worst = {}
def cmp(tag, k, a, b, tol=1e-6):
    global bad
    if a is None or b is None:
        if (a is None) != (b is None): bad += 1; print("MISMATCH", tag, k, a, b)
        return
    d = abs(a - b) / max(1, abs(b))
    worst[tag + "." + k] = max(worst.get(tag + "." + k, 0), d)
    if d > tol: bad += 1; print("MISMATCH", tag, k, a, b)
for c in cases:
    exp = rental(c["rental"])
    for k, v in exp.items(): cmp("rental", k, c["r"][k], v, 1e-5 if k == "irr" else 1e-7)
    exp = str_check(c["str"])
    for k, v in exp.items(): cmp("str", k, c["s"][k], v, 1e-6)
    exp = biz(c["biz"])
    for k, v in exp.items(): cmp("biz", k, c["b"][k], v)
print("cases:", len(cases), "mismatches:", bad)
print("worst relative error:", max(worst.values()))
sys.exit(1 if bad else 0)
