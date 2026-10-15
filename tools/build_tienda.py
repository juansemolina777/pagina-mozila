"""Genera tienda/catalogo.js (público) a partir de los datos privados de admin/.

El catálogo público NO incluye el costo ni los enlaces del proveedor:
solo nombre, marca, género, tipo, tamaño y el precio de venta: el de Mercado Libre
si está cargado, si no el precio de referencia en tiendas argentinas
(admin/data/precios-mercado.js).

Uso:  python tools/build_tienda.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

TIPOS = [
    (r"\b(EXTRAIT|EXDP)\b", "Extrait de Parfum"),
    (r"\bEDP\b|EAU DE PARFUM", "Eau de Parfum"),
    (r"\bEDT\b|EAU DE TOILETTE", "Eau de Toilette"),
    (r"\bEDC\b|EAU DE COLOGNE", "Eau de Cologne"),
    (r"\bPARFUM\b", "Parfum"),
    (r"BODY (MIST|SPLASH)", "Body Mist"),
    (r"BODY (CREAM|LOTION)", "Crema corporal"),
]


def read_js(path, var):
    text = path.read_text(encoding="utf-8")
    m = re.search(r"window\.%s\s*=\s*(.*);\s*$" % var, text, re.S)
    return json.loads(m.group(1))


def tipo(name):
    for pat, label in TIPOS:
        if re.search(pat, name):
            return label
    return None


def size_ml(name):
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*ML\b", name)
    return m.group(1).replace(",", ".") if m else None


perfumes = read_js(ROOT / "admin/data/perfumes.js", "PERFUMES")
ml_prices = read_js(ROOT / "admin/data/ml-prices.js", "ML_PRICES")
mercado_file = ROOT / "admin/data/precios-mercado.js"
mercado = read_js(mercado_file, "PRECIOS_MERCADO") if mercado_file.exists() else {}
img_dir = ROOT / "tienda/img"

out = []
for p in perfumes:
    price = ml_prices.get(str(p["id"])) or mercado.get(str(p["id"]))
    out.append({
        "id": p["id"],
        "n": p["q"],
        "b": p["b"],
        "g": p["g"],
        "t": tipo(p["n"]),
        "ml": size_ml(p["n"]),
        "ars": price["ars"] if price else None,
        "img": f"img/{p['id']}.jpg" if (img_dir / f"{p['id']}.jpg").exists() else None,
    })

dest = ROOT / "tienda/catalogo.js"
dest.write_text(
    "// Generado por tools/build_tienda.py — no editar a mano.\nwindow.CATALOGO = "
    + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n",
    encoding="utf-8",
)
print(f"{len(out)} perfumes, {sum(1 for o in out if o['ars'])} con precio, "
      f"{sum(1 for o in out if o['img'])} con foto -> {dest.relative_to(ROOT)}")
