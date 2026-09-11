# cacciaTI

App web installabile (PWA) che mostra, giorno per giorno, quali specie sono
cacciabili in Canton Ticino secondo il Regolamento sulla caccia (RT 922.110),
e tiene un registro personale degli abbattimenti per escludere automaticamente
i capi già presi dalle quote stagionali.

Tutto funziona offline e i dati restano solo sul telefono (nessun server,
nessun account).

   `https://massimilianodilorenzo70-eng.github.io/cacciaTI/`

## 2. Installarla sul telefono Android

1. Apri l'URL sopra con **Chrome** sul telefono.
2. Menu (⋮) → **"Aggiungi a schermata Home"** (o comparirà un banner
   automatico "Installa app").
3. Da quel momento si apre come un'app a schermo intero, con la sua icona, e
   funziona anche senza connessione.

## 3. Uso

- **Oggi**: elenco delle specie/categorie aperte adesso, per data selezionata.
  Interruttore "sotto i 400 mslm" per gli orari di caccia alta.
- **Registro**: tutti gli abbattimenti registrati, con i totali sulle quote di
  gruppo (es. camoscio, lepri). "Registra abbattimento" da qui o dal pulsante
  ➕ su ogni riga aperta in "Oggi".
- **Regolamento**: anno in vigore, fonte, e importazione di un nuovo
  regolamento.

## 4. Aggiornamento annuale del regolamento

Non serve toccare il codice. Quando esce il nuovo regolamento (di solito
inizio luglio), carica il PDF a Claude e chiedigli di convertirlo nello
stesso schema JSON di `data/regolamento_2026.json`. Poi, nell'app:
**Regolamento → Importa nuovo regolamento (JSON)** → seleziona il file.
Resta salvato sul telefono finché non lo sostituisci di nuovo.

## 5. Limiti noti (v1)

- Le regole di **zona/distretto** (art. 44 — moltissime eccezioni comunali e
  di quota altitudinale) non sono ancora modellate: l'app assume la
  situazione cantonale generale. Da aggiungere quando vuoi scendere nel
  dettaglio dei tuoi distretti di caccia.
- Alcune regole "a cavallo di due stagioni" o basate sulla misura delle corna
  (es. penalità camoscio) non sono calcolabili senza lo storico dell'anno
  precedente: l'app le segnala con un'etichetta gialla "verifica" invece di
  deciderle da sola.
- Gli orari di caccia alta sopra/sotto i 400 mslm si scelgono con
  l'interruttore in "Oggi"; non è (ancora) automatico in base alla posizione
  GPS.

## 6. Aggiornare i file dopo modifiche

Se in futuro modifichi `index.html`/`css`/`js`, apri `sw.js` e incrementa
`CACHE_NAME` (es. `cacciaTI-v2`), altrimenti i telefoni che hanno già
installato l'app continuano a usare i file vecchi dalla cache offline.
