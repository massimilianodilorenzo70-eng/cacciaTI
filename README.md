# cacciaTI

App web installabile (PWA), a uso personale, che mostra giorno per giorno
quali specie sono cacciabili in Canton Ticino secondo il Regolamento sulla
caccia (RT 922.110), e tiene un registro personale degli abbattimenti per
escludere automaticamente i capi già presi dalle quote stagionali.

Tutto funziona offline. I dati del registro restano solo sul telefono:
nessun server, nessun account, nessuna condivisione con l'Ufficio della
caccia e della pesca o con altri.

`https://massimilianodilorenzo70-eng.github.io/cacciaTI/`

**Non sostituisce in alcun caso il testo ufficiale del regolamento né le
comunicazioni dell'Ufficio della caccia e della pesca, che restano l'unico
riferimento vincolante.**

## Installazione sul telefono

**Android (Chrome):** apri l'URL sopra; l'app stessa propone di installarsi
con un banner "Installa cacciaTI sul telefono". In alternativa, menu (⋮) →
"Aggiungi a schermata Home".

**iPhone (Safari):** apri l'URL, tocca Condividi (il quadrato con la
freccia) → "Aggiungi alla schermata Home". Safari non permette
l'installazione automatica proposta dal banner, solo questo passaggio manuale.

Una volta installata si apre come un'app a schermo intero, con icona propria,
e si aggiorna da sola quando pubblichi una versione nuova (non serve
disinstallare/reinstallare).

## Le tre schede

**Giornata** — Regole per la data scelta (di default oggi), divise per
caccia alta/bassa/acquatica:
- Un riquadro "Aperto ora", chiuso di default, con il riepilogo di tutto
  ciò che è cacciabile in questo preciso momento, in qualsiasi tipo di
  caccia — utile senza dover girare tra le tre schede.
- Ogni categoria mostra stato, orari, quota residua, un riquadro "Dove si
  può cacciare" con le zone/distretti aperti o chiusi per specie (art. 44),
  e per camoscio/capriolo il contingente ufficiale letto in automatico dal
  sito del Cantone, con una barra che cambia colore (verde/arancio/rosso)
  in base a quanto ne resta.
- Se il contingente ufficiale risulta CHIUSO sul sito, prevale sempre sulla
  scheda, anche quando il regolamento da solo direbbe che è ancora aperta.
- Le categorie sbloccate da un'unica cattura in questa stagione (es. il
  maschio di camoscio dopo la femmina non lattifera) vengono evidenziate;
  se lo sblocco richiede una verifica manuale (es. il peso dell'anzello) è
  segnalato con l'etichetta gialla "da verificare".
- Interruttore "sotto i 400 mslm" per gli orari di caccia alta, visibile
  solo quando serve. La quota non è rilevata dal GPS: per l'imprecisione
  dell'altitudine satellitare, specialmente in bosco o in valle stretta,
  si è scelto di lasciarla a conferma manuale.
- Riga **fase lunare e meteo del giorno** sotto la data: la fase lunare
  funziona offline; il meteo (temperatura min/max, vento, precipitazioni)
  richiede connessione e viene letto da Open-Meteo. Entrambi disattivabili
  da Impostazioni → Aspetto.
- Riquadro **"Dove mi trovo"**: con un tocco controlla se sei dentro, sul
  confine o vicino (entro 1 km) a una bandita cantonale o federale, con
  distanza e direzione, e se quella bandita riguarda il tipo di caccia
  selezionato. Mostra anche le zone di tranquillità per la fauna vicine.
  Tutti i confini sono dentro l'app, quindi funziona anche senza rete. Con
  la rete aggiunge distretto e comune e li confronta con il regolamento
  (art. 44). Due pulsanti aprono il punto sulla cartina della caccia del
  Cantone e sulla carta nazionale. È un aiuto, non un permesso: fanno stato
  i testi ufficiali e la segnaletica sul terreno.
- Sottoschede **Tardo autunnale** e **Invernale cinghiale**, già pronte per
  quando aprono le rispettive finestre di caccia.
- In **Caccia bassa** tre sottoschede: **Regole** (le specie, come in caccia
  alta), **Prove cani** e **Da sapere**. *Prove cani* dice se nella data scelta
  la prova è permessa (art. 38), con orario, il calendario di tutti i giorni di
  prova dell'anno (toccando un giorno si passa a quella data) e le regole sui
  cani. *Da sapere* raccoglie le scadenze della stagione (vigilia, apertura,
  cambio d'orario, chiusura, rientro, invio del foglio di controllo), gli
  obblighi (registrazione online entro 12 ore, alta visibilità, cane da ferma e
  da seguita…) e i divieti principali, ognuno con l'articolo di riferimento. I
  dati stanno nel file del regolamento (`proveCani` e `daSapere`), quindi si
  aggiornano ogni anno insieme al resto.
- **Tema scuro** attivabile dal pulsante ☀️/🌙 in alto a destra, utile
  all'alba e al crepuscolo.

**Registro catture** — tre sottoschede:
- *Elenco*: tutti gli abbattimenti registrati, con i totali sulle quote di
  gruppo che sommano più categorie insieme (es. camoscio: 3 capi totali di
  cui max 2 adulti; lepre comune+variabile: 2 capi totali). Le quote a
  singola categoria (es. cervo, fagiano di monte) sono invece già sulla
  scheda della categoria stessa, non ripetute qui.
- *Statistiche*: capi totali, per specie, per tipo di caccia, per arma
  usata, cronologia della stagione (primo/ultimo abbattimento, giorno più
  fruttuoso) e andamento giornaliero della stagione in grafico.
- Esporta/importa il registro in JSON — utile come backup o per passare i
  dati da un telefono all'altro; l'importazione salta automaticamente i
  doppioni e chiede conferma prima di aggiungere.
- **Torna al punto**: su ogni voce con posizione GPS (punti rapidi e
  abbattimenti) il pulsante 🧭 «Torna qui» mostra una freccia con la bussola
  del telefono, la distanza e il dislivello verso il punto. Funziona offline.
- "Registra abbattimento" da qui, dal pulsante ➕ su ogni scheda aperta in
  Giornata, o dal pulsante ➕ flottante: l'elenco delle specie proposte
  segue il tipo di caccia selezionato.

**Info** — In cima, cosa l'app calcola in automatico e cosa va invece
verificato di persona; poi anno del regolamento in vigore e fonte,
importazione di un regolamento nuovo, esportazione/importazione del
registro, e la cronologia di tutti gli aggiornamenti dell'app (elenco
chiuso di default, con le note di ogni versione).

## SOS

Icona rossa fissa in alto, visibile da qualsiasi scheda. Apre due azioni,
entrambe dipendenti dalla copertura di rete:
- **Invia SMS con la mia posizione al 1414** — prende le coordinate GPS e
  apre l'app Messaggi con testo e numero (Rega) già pronti; l'SMS è il
  canale di riserva raccomandato dalla Rega stessa quando il segnale non
  basta per una chiamata vocale.
- **Chiama il 1414 (Rega)** — apre direttamente la chiamata.

## Aggiornamento annuale del regolamento

Non serve toccare il codice. Quando esce il nuovo regolamento (di norma
inizio luglio), carica il PDF a Claude e chiedigli di convertirlo nello
stesso schema JSON di `data/regolamento_2026.json`. Poi, nell'app:
**Info → Importa nuovo regolamento (JSON)** → seleziona il file. Resta
salvato sul telefono finché non lo sostituisci di nuovo, o finché non tocchi
"Ripristina regolamento incluso nell'app".

## Contingente ufficiale camoscio/capriolo

Letto automaticamente ogni 4 ore, solo dal 5 al 17 settembre, da GitHub Actions
(`.github/workflows/update-contingente.yml`) dalla pagina dell'Ufficio della
caccia e della pesca, e riconosciuto **per nome** (titolo di ogni riquadro
sulla pagina), non per posizione — un eventuale riordino della pagina non fa
più scambiare i dati tra categorie. Se lo script non riconosce esattamente
le categorie attese, si ferma senza scrivere nulla, così l'app continua a
mostrare l'ultimo dato buono con il suo orario, invece di un dato sbagliato.

**Ogni anno, quando esce il nuovo calendario:** aggiorna le date nella riga
`cron` di `.github/workflows/update-contingente.yml` (adesso `5-17 9`,
cioè 5-17 settembre). Se non lo fai, l'anno dopo il workflow non parte da
solo; resta comunque lanciabile a mano da GitHub → Actions → Run workflow.

Il workflow manuale `diagnostica-pagina.yml` salva una copia della pagina
ufficiale in `debug/`, utile se un giorno il sito cambia struttura e lo
script smette di funzionare.

## Avviso sui nuovi regolamenti

Il workflow `.github/workflows/controlla-ucp.yml` (script
`scripts/controlla_ucp.py`) guarda ogni giorno in giugno-agosto e
ottobre-novembre, e una volta a settimana negli altri mesi, le pagine
dell'Ufficio della caccia e della pesca: «Basi legali» (cartella dell'anno
con regolamento e disposizioni), caccia alta (calendario), tardo autunnale
(PDF), cinghiale invernale (anno della stagione), bandite e zone di
tranquillità (decreti). Se trova una novità apre un **avviso (issue) su
GitHub**, che arriva anche per email; se non riesce a leggere una pagina apre
«Controllo regolamenti non funzionante». Non modifica l'app: dopo l'avviso
l'aggiornamento dei dati resta manuale (sezione precedente). Quando hai
finito, chiudi l'avviso. Lo stato noto è in `scripts/ucp_stato.json`.

## Contatore di aperture

L'app include GoatCounter (`cacciati.goatcounter.com`), un contatore di
visite anonimo: nessun dato personale, nessun cookie, solo il numero di
aperture nel tempo. Conta solo le aperture con connessione attiva.

## Limiti noti

- Le regole "a cavallo di due stagioni" (es. penalità camoscio sulla
  stagione successiva) o basate sulla misura delle corna non sono
  calcolabili senza lo storico della stagione precedente, che l'app non
  conserva: sono segnalate con l'etichetta gialla "da verificare" invece di
  essere decise in automatico.
- Le zone/distretti (art. 44) sono un riepilogo testuale per orientarsi
  rapidamente, non un confine geografico verificato via GPS: per i limiti
  esatti di una bandita o di un comparto vale sempre il testo ufficiale.

## Aggiornare i file dopo modifiche

Se in futuro modifichi `index.html`/`css`/`js`, apri `sw.js` e incrementa
`CACHE_NAME` (es. `cacciaTI-v3.3`), altrimenti i telefoni che hanno già
installato l'app continuano a usare i file vecchi dalla cache offline. Se
vuoi che la modifica compaia anche nella cronologia in-app, aggiungi una
voce in cima all'array `CHANGELOG` in `js/app.js`.

## Versione attuale

**v3.65** — vedi la cronologia completa nell'app, scheda Info →
"Cronologia aggiornamenti".
