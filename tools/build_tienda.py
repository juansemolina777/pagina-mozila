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


ARABES = {"AFNAN", "AL HARAMAIN", "AL WATANIAH", "ARABIYAT PRESTIGE", "ARD AL ZAAFARAN", "ARMAF",
          "DAR EL WARD", "EMPER", "FRAGRANCE WORLD", "FRENCH AVENUE", "LATTAFA", "MAISON ALHAMBRA",
          "MAISON ASRAR", "MARQUISA DUBAI", "MAWWAL", "MODYAFA", "NASMA", "NAYAAT", "ORIENTICA",
          "PARIS CORNER", "RASASI", "RAYHAAN", "ZIMAYA"}
NICHO = {"12 PARFUMEURS FRANCAIS", "ACQUA DI SARDEGNA", "AMOUAGE", "ATELIER DES ORS", "BOADICEA",
         "BOND NO 9", "BYREDO", "CHABAUD MAISON DE PARFUM", "CLIVE CHRISTIAN", "CREED", "DIPTYQUE",
         "ESSENTIAL PARFUMS", "EX NIHILO", "FREDERIC MALLE", "GOLDFIELD & BANKS", "GRITTI", "INITIO",
         "JO MALONE", "JULIETTE HAS A GUN", "KAJAL", "KILIAN", "LE LABO", "LIQUIDES IMAGINAIRES",
         "MAISON CRIVELLI", "MAISON MARGIELA", "MANCERA PARIS", "MATIERE PREMIERE", "MEMO PARIS",
         "MIZENSIR", "MONTALE", "NISHANE", "ORMONDE JAYNE", "PANTHEON ROMA", "PARFUMS DE MARLY",
         "PENHALIGON'S", "SOSPIRO", "STEPHANE HUMBERT LUCAS 777", "THAMEEN", "THE HOUSE OF OUD",
         "THOMAS KOSMALA", "TIZIANA TERENZI", "VERTUS", "XERJOFF"}

# Notas y familias que hacen a un perfume cálido (invierno) o fresco (verano).
CALIDAS = r"vainilla|ambar|oud|tabaco|cuero|canela|especias|tonka|chocolate|cacao|cafe|incienso|praline|miel|caramelo|pachuli|mirra|benjui|azafran|ron\b|whisky|castana|cardamomo|clavo"
FRESCAS = r"bergamota|limon|lima\b|mandarina|pomelo|toronja|marin|acuatic|\bsal\b|menta|hierbabuena|pepino|te verde|notas verdes|neroli|manzana verde|sandia|melon|ozon|citric|agua|jengibre|lavanda"
DULCES = r"vainilla|caramelo|praline|chocolate|cacao|miel|coco|almendra|tonka|azucar|frutos rojos|gourmand|malvavisco|cafe"
FAM_CALIDA = r"oriental|ambarad|gourmand|especiad|cuero|chipre"
FAM_FRESCA = r"citric|acuatic|fresc|verde|aromatic|marin"
# Si no hay notas, se usa el nombre del perfume como pista.
NOMBRE_CALIDO = r"\b(OUD|VANILLA|VANILLE|AMBER|AMBRE|TOBACCO|TABAC|LEATHER|ELIXIR|NIGHT|NOIR|INTENSE|CAFE|COFFEE|CHOCOLATE|CACAO|COCOA|CARAMEL|HONEY|SPICE|SPICY|TONKA|ABSOLU|OUDH|SAFFRON|WINTER|INCENSE|BRIOCHE|TIRAMISU)\b"
NOMBRE_FRESCO = r"\b(AQUA|ACQUA|OCEAN|MARINE|FRESH|ICE|ICED|SPORT|SUMMER|CITRUS|LIME|LEMON|NEROLI|COOL|SEA|BREEZE|MINT|BLUE|BLEU|FRAICHE|AQUATIC|MEDITERRANEO|MEDITERRANEAN|SPLASH|WATER|GREEN|VERDE)\b"
NOMBRE_DULCE = r"\b(VANILLA|VANILLE|CANDY|SWEET|CARAMEL|TIRAMISU|COCOA|COCOA|CHOCOLATE|BRIOCHE|HONEY|SUGAR|CANDIES|DESSERT|CREAM|PRALINE|MARSHMALLOW|COCO|COCONUT|CAKE|BONBON|DELIGHT)\b"


def _plain(s):
    import unicodedata
    s = unicodedata.normalize("NFD", s or "")
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower()


def secciones(p, info, tendencia):
    notas = _plain(" ".join(info.get("salida", []) + info.get("corazon", []) + info.get("fondo", [])))
    fam = _plain(info.get("familia") or "")
    nombre = p["n"]
    s = []
    if tendencia:
        s.append("tendencias")
    if notas or fam:
        calido = len(re.findall(CALIDAS, notas)) + (2 if re.search(FAM_CALIDA, fam) else 0)
        fresco = len(re.findall(FRESCAS, notas)) + (2 if re.search(FAM_FRESCA, fam) else 0)
        dulce = len(re.findall(DULCES, notas)) >= 2 or "gourmand" in fam
    else:
        calido = 2 if re.search(NOMBRE_CALIDO, nombre) else 0
        fresco = 2 if re.search(NOMBRE_FRESCO, nombre) else 0
        dulce = bool(re.search(NOMBRE_DULCE, nombre))
    if calido >= 2 and calido > fresco:
        s.append("invierno")
    if fresco >= 2 and fresco > calido:
        s.append("verano")
    if dulce:
        s.append("dulces")
    if p["b"] in ARABES:
        s.append("arabes")
    if p["b"] in NICHO:
        s.append("nicho")
    return s


def lista(items):
    items = [i.lower() for i in items[:4]]
    return items[0] if len(items) == 1 else ", ".join(items[:-1]) + " y " + items[-1]


def descripcion(p, t, ml, info, secs):
    para = {"F": "para mujer", "M": "para hombre", "U": "unisex"}[p["g"]]
    tipo_txt = t or "perfume"
    nombre = re.sub(r"\b(EDP|EDT|EDC|EXDP|EXTRAIT|PARFUM|EAU DE \w+|\d+(?:[.,]\d+)?\s*ML)\b", "", p["q"])
    nombre = re.sub(r"\s+", " ", nombre).strip().title()
    partes = [f"{nombre} es un {tipo_txt} {para} de {p['b'].title()}"]
    if info.get("familia"):
        partes[0] += f", de la familia {info['familia'].lower()}"
    partes[0] += "."
    if info.get("salida"):
        partes.append(f"Abre con notas de {lista(info['salida'])}.")
    if info.get("corazon"):
        partes.append(f"En el corazón aparecen {lista(info['corazon'])}.")
    if info.get("fondo"):
        partes.append(f"El fondo deja un rastro de {lista(info['fondo'])}.")
    if "invierno" in secs:
        partes.append("Cálido y envolvente, ideal para otoño, invierno y salidas de noche.")
    elif "verano" in secs:
        partes.append("Fresco y luminoso, ideal para primavera, verano y el día a día.")
    elif "dulces" in secs:
        partes.append("Una fragancia dulce que no pasa desapercibida.")
    if ml:
        partes.append(f"Frasco de {ml} ml.")
    return " ".join(partes)


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
notas_file = ROOT / "admin/data/notas.js"
notas = read_js(notas_file, "NOTAS") if notas_file.exists() else {}
# Tendencias: los 60 perfumes que más tiendas argentinas venden.
ranking = sorted((-v["tiendas"], int(k)) for k, v in notas.items() if v.get("tiendas", 0) >= 1)
tendencias = {i for _, i in ranking[:60]}  # empate: orden destacado del proveedor
img_dir = ROOT / "tienda/img"

out = []
for p in perfumes:
    price = ml_prices.get(str(p["id"])) or mercado.get(str(p["id"]))
    info = notas.get(str(p["id"]), {})
    t, ml = tipo(p["n"]), size_ml(p["n"])
    secs = secciones(p, info, p["id"] in tendencias)
    out.append({
        "id": p["id"],
        "n": p["q"],
        "b": p["b"],
        "g": p["g"],
        "t": t,
        "ml": ml,
        "s": secs,
        "fam": info.get("familia"),
        "no": {k: info[k] for k in ("salida", "corazon", "fondo") if info.get(k)} or None,
        "d": descripcion(p, t, ml, info, secs),
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
