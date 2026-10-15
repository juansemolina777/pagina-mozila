"""Cruza el catálogo de Star Company con catálogos de tiendas argentinas y genera
admin/data/precios-mercado.js con el precio de referencia (mediana entre tiendas).

Uso:  python tools/match_precios.py <carpeta con <tienda>.json>

Cada <tienda>.json es una lista de {"name", "url", "variants": [{"opt", "price", "available"}]}.
Un producto solo se considera igual si coinciden marca, todas las palabras del modelo,
concentración (EDP/EDT/…) y tamaño en ml, y si la tienda no agrega palabras de otra
versión (Intense, Elixir, Black…). Se descartan testers, decants, sets y similares.
"""
import json
import re
import statistics
import sys
import unicodedata
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

STORES = {
    "perfumia": "Perfumia",
    "perfumistas": "Perfumistas",
    "lparfums": "LParfums",
    "cardales": "Perfumes Cardales",
    "juleriaque": "Juleriaque",
    "rouge": "Perfumerías Rouge",
}

# Productos que no son el frasco normal: si la tienda los menciona y nosotros no, no es el mismo.
EXCLUDE = {"tester", "decant", "set", "kit", "estuche", "miniatura", "mini", "body", "splash", "crema",
           "cream", "lotion", "locion", "deo", "desodorante", "deodorant", "gel", "shower", "refill",
           "recarga", "travel", "muestra", "sample", "pack", "combo", "coffret", "gift", "hair", "mist",
           "bruma", "vial", "roll", "oil", "aceite", "jabon", "soap", "bolsa", "bag", "blind", "box"}

# Palabras que identifican otra versión (flanker) del mismo perfume.
FLANKER = {"intense", "intenso", "elixir", "extreme", "absolu", "absolute", "sport", "noir", "black",
           "gold", "golden", "silver", "rouge", "red", "blue", "bleu", "night", "nuit", "fraiche", "fresh",
           "prive", "limited", "edition", "oud", "aqua", "acqua", "collector", "le", "la", "l", "parfum",
           "extrait", "cologne", "pure", "royal", "platinum", "white", "blanc", "rose", "pink", "green",
           "summer", "winter", "tobacco", "leather", "amber", "ambre", "vanilla", "vanille", "musk",
           "sweet", "dark", "light", "bright", "power", "edition", "infinite", "eternal", "elite",
           "max", "plus", "free", "candy", "glow", "silk", "velvet", "wood", "woods", "2", "3", "ii", "iii",
           "he", "she", "him", "her", "men", "man", "woman", "women", "homme", "femme", "girl", "boy"}

# Palabras genéricas que no cuentan como parte del nombre del perfume.
GENERIC = {"perf", "perfume", "perfumes", "fragancia", "eau", "de", "du", "des", "of", "the", "and", "y",
           "toilette", "spray", "vapo", "vaporisateur", "ml", "edp", "edt", "edc", "for", "pour", "por",
           "mujer", "hombre", "unisex", "uni", "fem", "masc", "original", "originales", "nuevo", "new",
           "productos", "producto", "tienda", "fl", "oz", "con", "y", "a", "en", "el", "los", "las", "un",
           "una", "exdp", "extrait"}

ALIASES = {
    "christian dior": ["dior"],
    "yves saint laurent": ["ysl", "saint laurent"],
    "dolce gabbana": ["d g", "dolce"],
    "giorgio armani": ["armani"],
    "carolina herrera": ["herrera"],
    "jean paul gaultier": ["gaultier", "jpg"],
    "paco rabanne": ["rabanne"],
    "maison alhambra": ["alhambra"],
    "lattafa": ["lattafa pride"],
    "calvin klein": ["ck"],
    "hugo boss": ["boss"],
    "mancera paris": ["mancera"],
}


def norm(s):
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    s = s.replace("&", " ").replace("'", "").replace("’", "")
    s = re.sub(r"eau\s+de\s+parfum", " edp ", s)
    s = re.sub(r"eau\s+de\s+toilette", " edt ", s)
    s = re.sub(r"eau\s+de\s+cologne", " edc ", s)
    s = re.sub(r"extrait\s+de\s+parfum|\bexdp\b|\bextrait\b", " extrait ", s)
    s = re.sub(r"(\d+(?:[.,]\d+)?)\s*ml\b", r" \1ml ", s)
    return re.sub(r"[^a-z0-9.]+", " ", s).strip()


def concentration(t):
    toks = set(t.split())
    for c in ("extrait", "edp", "edt", "edc"):
        if c in toks:
            return c
    if "parfum" in toks:
        return "parfum"
    return None


def sizes(t):
    return {float(m.replace(",", ".")) for m in re.findall(r"(\d+(?:[.,]\d+)?)ml", t)}


def words(t):
    return {w for w in t.split() if not re.fullmatch(r"\d+(?:\.\d+)?ml", w)}


def brand_forms(brand):
    b = norm(brand)
    return [b] + ALIASES.get(b, [])


def has_phrase(text, phrase):
    return re.search(r"(?:^| )" + re.escape(phrase) + r"(?: |$)", text) is not None


def build_ours(p):
    t = norm(p["q"])
    forms = brand_forms(p["b"])
    model = words(t)
    for f in forms:
        model -= set(f.split())
    model -= GENERIC
    model -= {"edp", "edt", "edc", "parfum", "extrait"}
    sz = sizes(t)
    return {"text": t, "forms": forms, "model": model, "conc": concentration(t),
            "size": max(sz) if sz else None, "words": words(t)}


def candidates(store_rows):
    out = []
    for r in store_rows:
        slug = re.sub(r"https?://[^/]+", " ", r.get("url", ""))
        base = norm(r["name"] + " " + slug)
        for v in r["variants"]:
            if not v.get("price"):
                continue
            t = norm(base + " " + (v.get("opt") or ""))
            sz = sizes(norm(v.get("opt") or "")) or sizes(t)
            out.append({"text": t, "words": words(t), "conc": concentration(t), "sizes": sz,
                        "price": float(v["price"]), "available": v.get("available", True),
                        "url": r.get("url", "")})
    return out


def is_match(o, c):
    if not any(has_phrase(c["text"], f) for f in o["forms"]):
        return False
    if not o["model"] or not o["model"] <= c["words"]:
        return False
    if (EXCLUDE & c["words"]) - o["words"]:
        return False
    if (FLANKER & c["words"]) - o["words"] - set(" ".join(o["forms"]).split()):
        return False
    if o["conc"] and c["conc"] and o["conc"] != c["conc"]:
        return False
    if o["size"] is None or not c["sizes"]:
        return False
    return any(abs(s - o["size"]) <= 5 for s in c["sizes"]) and len(c["sizes"]) == 1


def main(folder):
    perfumes = json.loads(re.search(r"window\.PERFUMES\s*=\s*(.*);\s*$",
                                    (ROOT / "admin/data/perfumes.js").read_text(encoding="utf-8"), re.S).group(1))
    stores = {}
    for key in STORES:
        f = Path(folder) / f"{key}.json"
        if f.exists():
            stores[key] = candidates(json.loads(f.read_text(encoding="utf-8")))
    today = date.today().isoformat()
    result = {}
    for p in perfumes:
        o = build_ours(p)
        found = []
        for key, cands in stores.items():
            ms = [c for c in cands if is_match(o, c)]
            if not ms:
                continue
            avail = [c for c in ms if c["available"]] or ms
            best = min(avail, key=lambda c: c["price"])
            found.append({"tienda": STORES[key], "ars": round(best["price"]), "url": best["url"]})
        if found:
            result[str(p["id"])] = {"ars": round(statistics.median(f["ars"] for f in found)),
                                    "fuentes": found, "fecha": today}
    dest = ROOT / "admin/data/precios-mercado.js"
    dest.write_text(
        "// Precios de referencia en tiendas argentinas (mediana entre tiendas). Generado por tools/match_precios.py.\n"
        "window.PRECIOS_MERCADO = " + json.dumps(result, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8")
    by_store = {}
    for v in result.values():
        for f in v["fuentes"]:
            by_store[f["tienda"]] = by_store.get(f["tienda"], 0) + 1
    print(f"{len(result)} de {len(perfumes)} perfumes con precio de referencia")
    for k, n in sorted(by_store.items(), key=lambda x: -x[1]):
        print(f"  {k}: {n}")


if __name__ == "__main__":
    main(sys.argv[1])
