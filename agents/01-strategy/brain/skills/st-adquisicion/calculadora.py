#!/usr/bin/env python3
"""
calculadora.py — la calculadora de adquisición de ① Strategy (outbound e inbound).

Outbound: cuántos prospectos calificados hacen falta para cerrar `m` clientes con probabilidad `P`,
si cada prospecto convierte con tasa `c`. n = el menor entero tal que P(Binomial(n, c) >= m) >= P.

    python3 calculadora.py outbound --m 5 --c 0.01 --p 0.95 --semanas 4
    → n=913 · por semana 229 · por día hábil 46   (caso de referencia)

Inbound: de las ventas meta hacia atrás, por el embudo alcance → clic → lead → cliente.

    python3 calculadora.py inbound --ventas 10 --lead-cliente 0.10 --clic-lead 0.20 \
        --alcance-clic 0.01 --frecuencia 1.8 --cpm 4.5

Solo usa la biblioteca estándar.
"""
import argparse, math

AVISO = ("La probabilidad es una estimación estadística, no una garantía; los prospectos deben ser "
         "empresas calificadas y la tasa debe validarse con datos reales.")


def prob_al_menos(n, c, m):
    """P(Binomial(n, c) >= m), sumando el complemento en escala logarítmica."""
    if m <= 0:
        return 1.0
    if c <= 0:
        return 0.0
    if c >= 1:
        return 1.0 if n >= m else 0.0
    lc, lq = math.log(c), math.log1p(-c)
    menos = 0.0
    for k in range(0, m):
        if k > n:
            break
        lp = math.lgamma(n + 1) - math.lgamma(k + 1) - math.lgamma(n - k + 1) + k * lc + (n - k) * lq
        menos += math.exp(lp)
    return 1.0 - menos


def outbound(m, c, p, semanas):
    if not (0 < c <= 1) or not (0 < p < 1) or m < 1 or semanas <= 0:
        raise SystemExit("Entradas inválidas: m ≥ 1, 0 < c ≤ 1, 0 < P < 1, semanas > 0")
    lo, hi = m, m
    while prob_al_menos(hi, c, m) < p:
        hi *= 2
    while lo < hi:
        mid = (lo + hi) // 2
        if prob_al_menos(mid, c, m) >= p:
            hi = mid
        else:
            lo = mid + 1
    n = lo
    return {"n": n, "por_semana": math.ceil(n / semanas), "por_dia_habil": math.ceil(n / (semanas * 5))}


def inbound(ventas, lead_cliente, clic_lead, alcance_clic, frecuencia, cpm=None, cpc=None):
    leads = math.ceil(ventas / lead_cliente)
    clics = math.ceil(leads / clic_lead)
    alcance = math.ceil(clics / alcance_clic)
    impresiones = math.ceil(alcance * frecuencia)
    r = {"leads": leads, "clics": clics, "alcance": alcance, "impresiones": impresiones}
    if cpm is not None:
        r["presupuesto_por_cpm"] = round(impresiones / 1000 * cpm, 2)
    if cpc is not None:
        r["presupuesto_por_cpc"] = round(clics * cpc, 2)
    return r


def main():
    ap = argparse.ArgumentParser(description="Calculadora de adquisición")
    sub = ap.add_subparsers(dest="modo", required=True)
    o = sub.add_parser("outbound")
    o.add_argument("--m", type=int, required=True, help="clientes meta")
    o.add_argument("--c", type=float, required=True, help="conversión prospecto→cliente (0–1)")
    o.add_argument("--p", type=float, default=0.95, help="probabilidad objetivo (0–1)")
    o.add_argument("--semanas", type=float, required=True, help="plazo en semanas")
    i = sub.add_parser("inbound")
    i.add_argument("--ventas", type=float, required=True, help="ventas o clientes meta")
    i.add_argument("--lead-cliente", type=float, required=True)
    i.add_argument("--clic-lead", type=float, required=True)
    i.add_argument("--alcance-clic", type=float, required=True)
    i.add_argument("--frecuencia", type=float, default=1.0)
    i.add_argument("--cpm", type=float)
    i.add_argument("--cpc", type=float)
    a = ap.parse_args()
    if a.modo == "outbound":
        r = outbound(a.m, a.c, a.p, a.semanas)
        print(f"Prospectos necesarios: {r['n']} · por semana: {r['por_semana']} · por día hábil: {r['por_dia_habil']}")
        print(AVISO)
    else:
        r = inbound(a.ventas, a.lead_cliente, a.clic_lead, a.alcance_clic, a.frecuencia, a.cpm, a.cpc)
        print(" · ".join(f"{k}: {v}" for k, v in r.items()))


if __name__ == "__main__":
    main()
