# Idee da sviluppare

Proposte per cacciaTI, da valutare. Spunta quando fatte.
(Branch non pubblicato: non finisce sul sito.)

## Fatte
- [x] **Torna al punto** — pulsante «🧭 Torna qui» su ogni voce del Registro con GPS (v3.65). Le voci senza coordinate non hanno il pulsante.
- [x] **Avviso sui nuovi regolamenti** — controllo automatico delle pagine UCP, avviso via issue/email (`controlla-ucp.yml`, nessun cambio all'app).
- [x] Spazio in fondo al Registro perché il «+» non copra i pulsanti dell'ultima voce.

## Prossime, in ordine di utilità
- [ ] **Promemoria registrazione online (12 ore)** per lepri, fagiano di monte e beccaccia.
  Decisioni: banner in Giornata e Registro con scadenza e conto alla rovescia, pulsanti «Apri lo sportello» e «Fatto», etichetta «Registrata online» nelle voci, campo facoltativo «ora del prelievo»; calendario `.ics` come seconda fase. Da chiarire: le 12 ore partono dal prelievo o dalla fine della giornata?
- [ ] **Conto alla rovescia alla chiusura** nel riquadro «Aperto ora» (arancione negli ultimi 15 minuti).
- [ ] **Scorciatoie sull'icona** (solo Android): «Segna punto» e «Registra abbattimento» (SOS escluso, ha il doppio tocco di sicurezza).

## Più lavoro
- [ ] Posizione a mano su una voce senza GPS (scelta sulla mappa).
- [ ] Ricerca e filtri nel Registro (stagione, specie, caccia, distretto) + esportazione CSV.
- [ ] Modalità uscita con allarme bandite (app aperta, consuma batteria).
- [ ] Foglio di controllo precompilato da stampare o salvare in PDF.
- [ ] Mappa del Registro con catture e punti su tessere swisstopo.

## Da valutare
- [ ] Diario delle uscite e degli avvistamenti.
- [ ] Condividere una cattura (senza coordinate di default).
- [ ] Alba e tramonto calcolati offline.
- [ ] Controllo arma/munizione per specie (richiede nuovi dati nel JSON del regolamento).
- [ ] Verifica su telefono vero di «Torna al punto» (bussola iPhone e Android, telefono in orizzontale).
- [ ] Controllare come `sw.js` gestisce gli aggiornamenti dei file senza cambio di `CACHE_NAME`.

## Manutenzione annuale
- [ ] Quando arriva un avviso dal controllo UCP: caricare il documento nuovo, convertirlo nel JSON (`data/regolamento_20XX.json`), verificare e pubblicare; aggiornare le date del `cron` del contingente; chiudere l'avviso.
- [ ] Entro fine 2027: decreti bandite e zone di tranquillità (il controllo UCP segnala i link nuovi).
