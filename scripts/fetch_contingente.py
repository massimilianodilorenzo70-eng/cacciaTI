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


# La pagina non espone "Camoscio"/"Capriolo"/"Maschio adulto" ecc. come testo
# semplice (probabilmente sono dentro icone), ma stato e percentuale sì, e
# compaiono sempre in questo ordine fisso — confermato dal contenuto reale
# osservato. Mappiamo quindi per POSIZIONE invece che per etichetta.
POSITIONAL_KEYS = [
    "camoscio_maschio_adulto",
    "camoscio_femmina_adulta",
    "camoscio_anzelli",
    "capriolo_maschio_adulto",
    "capriolo_femmina_adulta",
]


def parse(lines):
    pairs = []  # lista di (status, percent) nell'ordine di comparsa
    i = 0
    while i < len(lines):
        cand = lines[i]
        if cand.upper() in ("APERTO", "CHIUSO"):
            status = cand.upper()
            percent = None
            for j in range(i + 1, min(i + 3, len(lines))):
                m = re.match(r"^(\d{1,3})\s*%$", lines[j])
                if m:
                    percent = int(m.group(1))
                    break
            if percent is not None:
                pairs.append((status, percent))
        i += 1

    if len(pairs) != len(POSITIONAL_KEYS):
        return [], pairs  # numero inatteso: lascio decidere al chiamante

    items = [
        {"contingenteKey": key, "status": status, "percent": percent}
        for key, (status, percent) in zip(POSITIONAL_KEYS, pairs)
    ]
    return items, pairs


def main():
    try:
        lines = fetch_lines()
        items, pairs = parse(lines)
    except Exception as e:
        print(f"Errore durante il recupero/parsing della pagina: {e}", file=sys.stderr)
        sys.exit(1)

    if len(items) != len(POSITIONAL_KEYS):
        print(f"Attese {len(POSITIONAL_KEYS)} coppie stato/percentuale, trovate {len(pairs)}: {pairs}",
              file=sys.stderr)
        print("Non scrivo il file: meglio un dato vecchio dichiarato tale che uno sbagliato.",
              file=sys.stderr)
        print(f"\n--- DIAGNOSTICA: {len(lines)} righe di testo estratte dalla pagina ---",
              file=sys.stderr)
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
