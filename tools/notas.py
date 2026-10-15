"""Extrae familia olfativa y notas (salida / corazón / fondo) de las fichas de tiendas
argentinas y cuenta en cuántas tiendas se vende cada perfume (popularidad).

Genera admin/data/notas.js. Solo se usan datos (familia y lista de notas);
las descripciones de la tienda se escriben aparte en build_tienda.py.

Uso:  python tools/notas.py <carpeta con <tienda>.json>
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from match_precios import (EXCLUDE, FLANKER, ROOT, STORES, build_ours, concentration,  # noqa: E402
                           has_phrase, norm, words)

PARTS = r"salida|cabeza|coraz[oó]n|base|fondo"
SECTION_RE = re.compile(r"notas?\s+de\s+(%s)\s*:?\s*(.*?)(?=notas?\s+de\s+(?:%s)|$)" % (PARTS, PARTS), re.I | re.S)


def plain(s):
    """Sin tildes, conservando puntuación."""
    import unicodedata
    s = unicodedata.normalize("NFD", s or "")
    return "".join(c for c in s if unicodedata.category(c) != "Mn")


def key_of(part):
    p = plain(part).lower()
    return {"cabeza": "salida", "base": "fondo"}.get(p, p)


def parse_notes(raw):
    """Devuelve solo las listas de notas; el resto del texto de la tienda se descarta."""
    out = {}
    for m in SECTION_RE.finditer(raw or ""):
        # La lista termina en el primer punto o salto de línea: lo que sigue es texto de la tienda.
        lista = re.split(r"\.(?:\s|$)|\n|\t", m.group(2).strip(), maxsplit=1)[0]
        notes = []
        for it in re.split(r"\s*(?:[,;/·]|\s[-–—]\s|\by\b|\be\b)\s*", lista):
            it = it.strip(" .:-–—").lower()
            # Un gerundio o participio indica que empezó la prosa de la tienda: se corta ahí.
            if re.search(r"\w(ando|iendo|adas|ados|idas|idos)\b|\bcon\b", it):
                break
            if 2 < len(it) <= 35 and len(it.split()) <= 5:
                notes.append(it[0].upper() + it[1:])
        if notes:
            k = key_of(m.group(1))
            out.setdefault(k, []).extend(n for n in notes[:12] if n not in out.get(k, []))
    return out


def loose_match(o, name_text, conc):
    if not any(has_phrase(name_text, f) for f in o["forms"]):
        return False
    w = words(name_text)
    if not o["model"] or not o["model"] <= w:
        return False
    if (EXCLUDE & w) - o["words"]:
        return False
    if (FLANKER & w) - o["words"] - set(" ".join(o["forms"]).split()):
        return False
    return not (o["conc"] and conc and o["conc"] != conc)


def main(folder):
    perfumes = json.loads(re.search(r"window\.PERFUMES\s*=\s*(.*);\s*$",
                                    (ROOT / "admin/data/perfumes.js").read_text(encoding="utf-8"), re.S).group(1))
    stores = {}
    for key in STORES:
        f = Path(folder) / f"{key}.json"
        if not f.exists():
            continue
        rows = []
        for r in json.loads(f.read_text(encoding="utf-8")):
            slug = re.sub(r"https?://[^/]+", " ", r.get("url", ""))
            t = norm(r["name"] + " " + slug + " " + " ".join(v.get("opt") or "" for v in r["variants"]))
            rows.append({"text": t, "conc": concentration(t), "familia": r.get("familia", ""),
                         "notas": r.get("notas", "")})
        stores[key] = rows

    result = {}
    for p in perfumes:
        o = build_ours(p)
        tiendas, info = 0, None
        for key, rows in stores.items():
            ms = [r for r in rows if loose_match(o, r["text"], r["conc"])]
            if ms:
                tiendas += 1
            for r in ms:
                notes = parse_notes(r["notas"])
                if notes and info is None:
                    fam = re.sub(r"(?i)^perfume\s+", "", plain(r["familia"]).strip()).strip(" .")
                    info = {"familia": fam.capitalize() if fam else None, **notes, "fuente": STORES[key]}
        if info or tiendas:
            result[str(p["id"])] = {**(info or {}), "tiendas": tiendas}

    dest = ROOT / "admin/data/notas.js"
    dest.write_text(
        "// Familia olfativa, notas y cantidad de tiendas argentinas que venden cada perfume.\n"
        "// Generado por tools/notas.py.\nwindow.NOTAS = "
        + json.dumps(result, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    con_notas = sum(1 for v in result.values() if "salida" in v or "corazon" in v or "fondo" in v)
    print(f"{con_notas} perfumes con notas, {len(result)} vendidos en al menos una tienda argentina")


if __name__ == "__main__":
    main(sys.argv[1])
