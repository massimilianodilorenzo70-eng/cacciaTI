#!/usr/bin/env python3
"""
fetch_contingente.py
Legge la pagina pubblica dell'Ufficio della caccia e della pesca del Canton
Ticino sullo stato dei contingenti di camoscio e capriolo, ed estrae stato
(APERTO/CHIUSO) e percentuale per categoria.

Riconoscimento PER NOME: ogni riquadro della pagina contiene il titolo della
categoria (es. "Maschio adulto"), lo stato e la barra con la percentuale; la
specie è il titolo di sezione che lo precede ("Camoscio" / "Capriolo").
L'ordine dei riquadri sulla pagina quindi non conta più.

Progettato per fallire in modo visibile: se una categoria attesa manca, compare
due volte o ha dati non validi, lo script esce con errore SENZA scrivere il
file, così l'app continua a mostrare l'ultimo dato buono (con il suo orario)
invece di un dato sbagliato spacciato per attuale.
"""

import datetime
import json
import re
import sys
import unicodedata
from pathlib import Path

import requests
from bs4 import BeautifulSoup

URL = "https://www4.ti.ch/dt/da/ucp/gestione-caccia-alta-camoscio"
SOURCE_LABEL = "Ufficio della caccia e della pesca, Repubblica e Cantone Ticino"
OUT_PATH = Path(__file__).resolve().parent.parent / "data" / "contingente_alta.json"

# (specie, categoria) normalizzate -> chiave usata in regolamento_2026.json
CATEGORY_MAP = {
    ("camoscio", "maschio adulto"): "camoscio_maschio_adulto",
    ("camoscio", "femmina adulta"): "camoscio_femmina_adulta",
    ("camoscio", "anzelli"): "camoscio_anzelli",
    ("capriolo", "maschio adulto"): "capriolo_maschio_adulto",
    ("capriolo", "femmina adulta"): "capriolo_femmina_adulta",
}


def norm(text):
    """Minuscolo, senza accenti, spazi compattati."""
    text = unicodedata.normalize("NFKD", text or "")
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return " ".join(text.lower().split())


def fetch_html():
    headers = {
        "User-Agent": "cacciaTI-app/1.0 (uso personale non commerciale; "
                      "https://github.com/massimilianodilorenzo70-eng/cacciaTI)"
    }
    resp = requests.get(URL, timeout=25, headers=headers)
    resp.raise_for_status()
    return resp.text


def parse(html):
    """Restituisce (items, avvisi, errori)."""
    soup = BeautifulSoup(html, "html.parser")
    root = soup.find("main") or soup

    found = {}      # chiave -> item
    warnings = []
    errors = []

    for strong in root.find_all("strong"):
        status = strong.get_text(strip=True).upper()
        if status not in ("APERTO", "CHIUSO"):
            continue

        box = strong.find_parent(class_=re.compile(r"frame-box-info"))
        title = box.find("h3") if box else None
        species_h2 = strong.find_previous("h2")
        label = norm(title.get_text(" ")) if title else ""
        species = norm(species_h2.get_text(" ")) if species_h2 else ""

        # percentuale: testo della barra (es. "50%"), in ripiego la larghezza
        percent = None
        bar = box.find(class_=re.compile(r"progress-bar")) if box else None
        if bar:
            m = re.search(r"(\d{1,3})\s*%", bar.get_text(" "))
            if not m:
                m = re.search(r"width\s*:\s*(\d{1,3})\s*%", bar.get("style", ""))
            if m:
                percent = int(m.group(1))

        key = CATEGORY_MAP.get((species, label))
        where = f"'{species or '?'}' / '{label or '?'}'"

        if key is None:
            warnings.append(f"Riquadro non riconosciuto, ignorato: {where} = {status} {percent}%")
            continue
        if key in found:
            errors.append(f"Categoria presente due volte sulla pagina: {where}")
            continue
        if percent is None or not 0 <= percent <= 100:
            errors.append(f"Percentuale mancante o non valida per {where}: {percent}")
            continue

        found[key] = {
            "contingenteKey": key,
            "label": f"{species.capitalize()} – {label}",
            "status": status,
            "percent": percent,
        }

    missing = [k for k in CATEGORY_MAP.values() if k not in found]
    if missing:
        errors.append(f"Categorie attese non trovate: {missing}")

    # ordine stabile nel file, indipendente dall'ordine sulla pagina
    items = [found[k] for k in CATEGORY_MAP.values() if k in found]
    return items, warnings, errors


def main():
    try:
        html = fetch_html()
        items, warnings, errors = parse(html)
    except Exception as e:
        print(f"Errore durante il recupero/parsing della pagina: {e}", file=sys.stderr)
        sys.exit(1)

    for w in warnings:
        print("ATTENZIONE:", w, file=sys.stderr)

    if errors:
        for e in errors:
            print("ERRORE:", e, file=sys.stderr)
        print("Non scrivo il file: meglio un dato vecchio dichiarato tale che uno sbagliato.",
              file=sys.stderr)
        print("Per capire cosa è cambiato, lancia il workflow 'Diagnostica pagina contingente'.",
              file=sys.stderr)
        sys.exit(1)

    out = {
        "source": URL,
        "sourceLabel": SOURCE_LABEL,
        "fetchedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "items": items,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Scritto:", json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
