#!/usr/bin/env python3
"""
controlla_ucp.py
Controlla le pagine pubbliche dell'Ufficio della caccia e della pesca (UCP) del
Canton Ticino dove escono regolamenti, calendari e decreti, e apre un avviso
(issue) su GitHub quando compare qualcosa di nuovo: cartella/PDF dell'anno
nuovo in «Basi legali», stagione nuova del cinghiale invernale, nuovi PDF del
tardo autunnale, calendario della caccia alta cambiato, decreti di bandite e
zone di tranquillità cambiati.

NON modifica l'app: legge soltanto e avvisa. Aggiornare i dati dell'app resta
un passo manuale (vedi README, «Aggiornamento annuale del regolamento»).

Progettato per fallire in modo visibile: se una pagina non si legge o non
contiene più i segnali attesi, apre l'avviso «Controllo regolamenti non
funzionante» invece di restare in silenzio.

Uso:
  python scripts/controlla_ucp.py              # rete + issue (in GitHub Actions)
  python scripts/controlla_ucp.py --dry-run    # niente issue, stampa soltanto
  python scripts/controlla_ucp.py --from-dir CARTELLA --dry-run   # pagine HTML salvate in locale (nome-pagina.html)
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import urldefrag, urljoin

from bs4 import BeautifulSoup

BASE = "https://www4.ti.ch/dt/da/ucp/temi/caccia"
PAGES = {
    "basi-legali": f"{BASE}/basi-legali/basi-legali",
    "caccia-al-cinghiale": f"{BASE}/caccia/caccia-al-cinghiale",
    "caccia-tardo-autunnale": f"{BASE}/caccia/caccia-tardo-autunnale",
    "caccia-alta": f"{BASE}/caccia/caccia-alta",
    "bandite-2021-2026": f"{BASE}/caccia/bandite-2021-2026",
    "zone-tranquillita": f"{BASE}/caccia/pubblicazione-decreto-delle-zone-di-tranquillita-per-la-fauna-selvatica",
}
STATE_PATH = Path(__file__).resolve().parent / "ucp_stato.json"
UA = ("cacciaTI-app/1.0 (uso personale non commerciale; "
      "https://github.com/massimilianodilorenzo70-eng/cacciaTI)")
TITOLO_ERRORE = "Controllo regolamenti non funzionante"


class ErroreLettura(Exception):
    pass


def scarica(nome, from_dir):
    if from_dir:
        f = Path(from_dir) / f"{nome}.html"
        if not f.exists():
            raise ErroreLettura(f"{nome}: file locale mancante")
        return f.read_text(encoding="utf-8", errors="replace")
    import requests
    try:
        r = requests.get(PAGES[nome], timeout=30, headers={"User-Agent": UA})
        r.raise_for_status()
    except Exception as e:
        raise ErroreLettura(f"{nome}: pagina non raggiungibile ({e})")
    return r.text


def link_documenti(soup, pagina, schema):
    """Insieme dei link ai documenti (PDF) che corrispondono allo schema."""
    trovati = set()
    for a in soup.find_all("a", href=True):
        href = urldefrag(urljoin(PAGES[pagina], a["href"]))[0]
        if re.search(schema, href, re.I):
            trovati.add(href)
    return sorted(trovati)


def testo(soup):
    return " ".join(soup.get_text(" ").split())


def segnali(nome, html):
    """Estrae i segnali da controllare. Solleva ErroreLettura se mancano."""
    soup = BeautifulSoup(html, "html.parser")
    t = testo(soup)
    if nome == "basi-legali":
        docs = link_documenti(soup, nome, r"/leggi___regolamenti/")
        if not docs:
            raise ErroreLettura("basi-legali: nessun documento in leggi___regolamenti")
        anni = sorted({m for d in docs for m in re.findall(r"/leggi___regolamenti/(\d{4})/", d)})
        return {"documenti": docs, "anni": anni}
    if nome == "caccia-al-cinghiale":
        anni = sorted(set(re.findall(r"stagione venatoria (\d{4})", t)))
        if not anni:
            raise ErroreLettura("caccia-al-cinghiale: frase «stagione venatoria 20XX» non trovata")
        return {"stagioni": anni}
    if nome == "caccia-tardo-autunnale":
        docs = link_documenti(soup, nome, r"/fileadmin/.*\.pdf")
        if not docs:
            raise ErroreLettura("caccia-tardo-autunnale: nessun PDF trovato")
        return {"documenti": docs}
    if nome == "caccia-alta":
        cal = re.findall(r"Caccia alta (\d{4}): ([^;]*?)(?:;|\. )", t)
        if not cal:
            raise ErroreLettura("caccia-alta: calendario «Caccia alta 20XX: dal…» non trovato")
        return {"calendario": {anno: " ".join(d.split()) for anno, d in cal}}
    if nome in ("bandite-2021-2026", "zone-tranquillita"):
        docs = link_documenti(soup, nome, r"\.pdf")
        if not docs:
            raise ErroreLettura(f"{nome}: nessun decreto/PDF trovato")
        return {"documenti": docs}
    raise ErroreLettura(f"pagina sconosciuta: {nome}")


def descrivi_diff(vecchio, nuovo):
    righe = []
    for chiave in sorted(set(vecchio) | set(nuovo)):
        v, n = vecchio.get(chiave), nuovo.get(chiave)
        if v == n:
            continue
        if isinstance(n, list) and isinstance(v, list):
            for x in sorted(set(n) - set(v)):
                righe.append(f"- nuovo in «{chiave}»: {x}")
            for x in sorted(set(v) - set(n)):
                righe.append(f"- sparito da «{chiave}»: {x}")
        else:
            righe.append(f"- «{chiave}» prima: {v} — adesso: {n}")
    return "\n".join(righe)


def gh(*args):
    return subprocess.run(["gh", *args], check=True, capture_output=True, text=True).stdout


def apri_issue(titolo, corpo, dry_run):
    if dry_run:
        print(f"\n[DRY-RUN] ISSUE: {titolo}\n{corpo}\n")
        return
    esistenti = json.loads(gh("issue", "list", "--state", "open", "--limit", "100",
                              "--json", "title"))
    if any(i["title"] == titolo for i in esistenti):
        print(f"Avviso già aperto, non ne apro un altro: {titolo}")
        return
    gh("issue", "create", "--title", titolo, "--body", corpo)
    print(f"Avviso aperto: {titolo}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--from-dir")
    ap.add_argument("--state", default=str(STATE_PATH))
    args = ap.parse_args()
    state_path = Path(args.state)

    vecchio = json.loads(state_path.read_text(encoding="utf-8")) if state_path.exists() else None
    nuovo, errori = {}, []
    for nome in PAGES:
        try:
            nuovo[nome] = segnali(nome, scarica(nome, args.from_dir))
        except ErroreLettura as e:
            errori.append(str(e))

    if errori:
        corpo = ("Il controllo automatico delle pagine dell'Ufficio della caccia e della pesca "
                 "non è riuscito a leggere:\n\n" + "\n".join(f"- {e}" for e in errori) +
                 "\n\nProbabile causa: il sito è cambiato o non era raggiungibile. "
                 "Se si ripete, lo script `scripts/controlla_ucp.py` va aggiornato. "
                 "Nel frattempo controlla a mano la pagina «Basi legali» dell'Ufficio.")
        apri_issue(TITOLO_ERRORE, corpo, args.dry_run)
        print("ERRORI:\n" + "\n".join(errori), file=sys.stderr)

    if vecchio is None:
        if not errori and not args.dry_run:
            state_path.write_text(json.dumps(nuovo, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print("Primo avvio: stato iniziale registrato, nessun avviso.")
        return 1 if errori else 0

    for nome, segn in nuovo.items():
        diff = descrivi_diff(vecchio.get(nome, {}), segn)
        if not diff:
            continue
        titolo = f"UCP: novità su «{nome}»"
        corpo = (f"Il controllo automatico ha trovato una novità sulla pagina `{PAGES[nome]}`:\n\n{diff}\n\n"
                 "**Cosa fare:** controlla il documento sul sito dell'Ufficio. Se è un regolamento o un "
                 "calendario nuovo, caricalo a Claude per convertirlo nel JSON dell'app "
                 "(README, «Aggiornamento annuale del regolamento»). Poi chiudi questo avviso.")
        apri_issue(titolo, corpo, args.dry_run)
        vecchio[nome] = segn

    if not args.dry_run:
        state_path.write_text(json.dumps(vecchio, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return 1 if errori else 0


if __name__ == "__main__":
    sys.exit(main())
