#!/usr/bin/env python3
"""
fetch_contingente.py
Legge la pagina pubblica dell'Ufficio della caccia e della pesca del Canton
Ticino sullo stato dei contingenti di camoscio e capriolo, ed estrae stato
(APERTO/CHIUSO) e percentuale per categoria.

Progettato per fallire in modo visibile: se la pagina cambia struttura e le
categorie attese non vengono trovate, lo script esce con errore SENZA
scrivere/aggiornare il file dati, così l'app continua a mostrare l'ultimo
dato buono conosciuto (con il suo orario) invece di un dato sbagliato
spacciato per attuale.
"""

import datetime
import json
import re
import sys
from pathlib import Path

import requests
from bs4 import BeautifulSoup

URL = "https://www4.ti.ch/dt/da/ucp/gestione-caccia-alta-camoscio"
SOURCE_LABEL = "Ufficio della caccia e della pesca, Repubblica e Cantone Ticino"
OUT_PATH = Path(__file__).resolve().parent.parent / "data" / "contingente_alta.json"

# (specie in minuscolo, etichetta categoria in minuscolo) -> chiave usata in regolamento_2026.json
CATEGORY_MAP = {
    ("camoscio", "maschio adulto"): "camoscio_maschio_adulto",
    ("camoscio", "femmina adulta"): "camoscio_femmina_adulta",
    ("camoscio", "anzelli"): "camoscio_anzelli",
    ("capriolo", "maschio adulto"): "capriolo_maschio_adulto",
    ("capriolo", "femmina adulta"): "capriolo_femmina_adulta",
}

SPECIES_LINES = {"camoscio", "capriolo"}
CATEGORY_LINES = {"maschio adulto", "femmina adulta", "anzelli"}


def fetch_lines():
    headers = {
        "User-Agent": "cacciaTI-app/1.0 (uso personale non commerciale; "
                      "https://github.com/massimilianodilorenzo70-eng/cacciaTI)"
    }
    resp = requests.get(URL, timeout=25, headers=headers)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "header", "footer"]):
        tag.decompose()
    text = soup.get_text("\n")
    lines = [l.strip() for l in text.split("\n")]
    return [l for l in lines if l]


def parse(lines):
    items = []
    current_species = None
    i = 0
    while i < len(lines):
        low = lines[i].lower()
        if low in SPECIES_LINES:
            current_species = low
        elif current_species and low in CATEGORY_LINES:
            key = CATEGORY_MAP.get((current_species, low))
            if key:
                status, percent = None, None
                for j in range(i + 1, min(i + 6, len(lines))):
                    cand = lines[j]
                    if status is None and cand.upper() in ("APERTO", "CHIUSO"):
                        status = cand.upper()
                    m = re.match(r"^(\d{1,3})\s*%$", cand)
                    if percent is None and m:
                        percent = int(m.group(1))
                    if status is not None and percent is not None:
                        break
                if status is not None and percent is not None:
                    items.append({"contingenteKey": key, "status": status, "percent": percent})
        i += 1
    return items


def main():
    try:
        lines = fetch_lines()
        items = parse(lines)
    except Exception as e:
        print(f"Errore durante il recupero/parsing della pagina: {e}", file=sys.stderr)
        sys.exit(1)

    expected = set(CATEGORY_MAP.values())
    found = {it["contingenteKey"] for it in items}
    missing = expected - found
    if missing:
        print(f"Categorie non trovate (la pagina potrebbe aver cambiato struttura): {missing}",
              file=sys.stderr)
        print("Non scrivo il file: meglio un dato vecchio dichiarato tale che uno sbagliato.",
              file=sys.stderr)
        print(f"\n--- DIAGNOSTICA: {len(lines)} righe di testo estratte dalla pagina ---",
              file=sys.stderr)
        has_camoscio = any("camoscio" in l.lower() for l in lines)
        has_capriolo = any("capriolo" in l.lower() for l in lines)
        print(f"Contiene la parola 'camoscio' da qualche parte? {has_camoscio}", file=sys.stderr)
        print(f"Contiene la parola 'capriolo' da qualche parte? {has_capriolo}", file=sys.stderr)
        print("\nPrime 60 righe estratte:", file=sys.stderr)
        for l in lines[:60]:
            print(f"  | {l}", file=sys.stderr)
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
