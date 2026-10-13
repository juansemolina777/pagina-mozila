"""Genera tienda/catalogo.js (público) a partir de los datos privados de admin/.

El catálogo público NO incluye el costo ni los enlaces del proveedor:
solo nombre, marca, género y el precio de Mercado Libre (si está cargado).

Uso:  python tools/build_tienda.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def read_js(path, var):
    text = path.read_text(encoding="utf-8")
    m = re.search(r"window\.%s\s*=\s*(.*);\s*$" % var, text, re.S)
    return json.loads(m.group(1))


perfumes = read_js(ROOT / "admin/data/perfumes.js", "PERFUMES")
ml = read_js(ROOT / "admin/data/ml-prices.js", "ML_PRICES")
img_dir = ROOT / "tienda/img"

out = []
for p in perfumes:
    price = ml.get(str(p["id"]))
    out.append({
        "id": p["id"],
        "n": p["q"],
        "b": p["b"],
        "g": p["g"],
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
