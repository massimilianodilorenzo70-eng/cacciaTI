/* app.js — controller: carica i dati, gestisce le viste e le interazioni */

(() => {
  let regData = null;
  let selectedDate = new Date();
  let prefs = Storage.getPrefs();
  let selectedHunt = null; // 'alta' | 'bassa' | 'acquatica' — scelto dall'utente o dedotto alla prima apertura
  let altaSubView = "stagione"; // 'stagione' | 'tardo' | 'invernale' — solo per Caccia alta
  let contingenteData = null; // dati ufficiali camoscio/capriolo, se disponibili

  const HUNT_LABELS = { alta: "Caccia alta", bassa: "Caccia bassa", acquatica: "Caccia acquatica" };

  // Cronologia versioni — dalla più recente alla più vecchia.
  // Ad ogni nuova versione: aggiungere una voce qui, in cima all'elenco.
  const CHANGELOG = [
    { v: "3.49", text: "Aggiornato il video dimostrativo con le nuove funzioni (bandite, distretto, cartina del Cantone). Aggiornata anche la descrizione di Cosa fa cacciaTI." },
    { v: "3.45", text: "Il pulsante della cartina del Cantone ora apre il geoportale con bandite cantonali, bandite federali e zone di tranquillit\u00e0 gi\u00e0 visibili. Per centrare sulla propria posizione basta toccare il pulsante posizione del geoportale." },
    { v: "3.44", text: "Confermato dall'Ufficio della caccia e della pesca: il Decreto bandite di caccia 2021-2026 e il Decreto delle zone di tranquillit\u00e0 restano in vigore, prorogati dal Consiglio di Stato fino all'aggiornamento del concetto bosco-selvaggina (fine 2027 circa) \u2014 non serve quindi un nuovo file dati. Corretto anche un refuso del regolamento venatorio: le bandite escluse dalla caccia da postazione fissa in Blenio, Riviera e Bellinzona sono la N. 67 Leggiuna e la N. 25 Piano di Magadino, non la N. 64 e la N. 48 come scritto prima." },
    { v: "3.43", text: "Luogo di cattura: tra le località proposte dalla posizione GPS non compaiono più i nomi di grandi aree che contengono il punto (catene montuose, regioni, valli lunghe), come \u00abAlpi Lepontine\u00bb ripetuto in tre lingue o \u00abSottoceneri\u00bb, che finivano sempre in cima come \u00abqui\u00bb. Restano i nomi di luogo veri e propri, dal più vicino." },
    { v: "3.42", text: "Nuovo riquadro \u00abDove mi trovo\u00bb nella schermata principale: con un tocco controlla se sei dentro, sul confine o vicino (entro 1 km) a una bandita cantonale o federale, con distanza e direzione, e se quella bandita riguarda la caccia che hai scelto in alto (alta, bassa o acquatica, o solo camoscio, marmotta o fagiano di monte). Mostra anche le zone di tranquillit\u00e0 per la fauna vicine, con le loro regole e se sono in vigore nella data scelta. Tutti i confini sono dentro l'app, quindi il controllo funziona anche senza rete. Con la rete aggiunge distretto e comune e li confronta con il regolamento (art. 44). Due pulsanti aprono il punto sulla cartina della caccia del Cantone e sulla carta nazionale. \u00c8 un aiuto, non un permesso: fanno stato i testi ufficiali e la segnaletica sul terreno." },
    { v: "3.41", text: "Messaggio SOS pi\u00f9 completo per la Rega: oltre a coordinate, precisione e ora, ora contiene anche le coordinate svizzere CH1903+/LV95 (quelle usate dai soccorsi) e la quota. Se c'\u00e8 rete, in pochi secondi aggiunge comune e localit\u00e0 pi\u00f9 vicina e, quando il GPS non d\u00e0 l'altitudine, la ricava dal modello del terreno; se la rete non risponde il messaggio parte comunque subito. Il testo compare anche sullo schermo, con un pulsante per copiarlo, cos\u00ec puoi dettarlo per telefono o riusarlo se l'app Messaggi non lo riempie da sola." },
    { v: "3.40", text: "Nuovo campo \u00abDistretto\u00bb nella registrazione di un abbattimento, separato dal luogo di cattura (che resta come va scritto sul foglio di controllo). Con la posizione GPS viene proposto insieme a comune e localit\u00e0, dai confini ufficiali swisstopo; senza GPS lo scegli dall'elenco. Compare nel dettaglio del registro. Come tutti i dati dell'app, coordinate, luogo e distretto restano solo sul tuo telefono e non vengono inviati a nessuno." },
    { v: "3.39", text: "Nuovo campo \u00abLuogo di cattura\u00bb (comune e localit\u00e0, come sul foglio di controllo). Dopo aver salvato la posizione GPS, l'app legge dalla carta nazionale svizzera (swisstopo) il comune e i nomi di luogo pi\u00f9 vicini, con distanza e direzione, e ti propone di compilare il campo: scegli tu quale usare, o scrivilo a mano. Senza rete le coordinate restano salvate e puoi compilare il luogo pi\u00f9 tardi, anche modificando l'abbattimento. Coordinate e luogo restano solo sul tuo telefono: non vengono inviati a nessuno." },
    { v: "3.38", text: "Riscritta la sezione \u00abCosa fa cacciaTI\u00bb: ora descrive tutte le funzioni, comprese sottoschede di caccia alta, foto e luogo GPS degli abbattimenti, statistiche, backup, SOS con doppio tocco e tema scuro." },
    { v: "3.37", text: "Nuovo campo \u00abLuogo\u00bb nella registrazione di un abbattimento: puoi salvare con un tocco la posizione GPS esatta, oppure continuare a scriverla a mano nelle note, o entrambe le cose. La posizione si rivede nel dettaglio del registro, con un link per aprirla nelle mappe, e si pu\u00f2 togliere in qualsiasi momento." },
    { v: "3.36", text: "Corretta la regola della femmina lattifera di cervo: puoi prelevarne 2 in stagione (non pi\u00f9 1), la prima libera, la seconda solo se il suo cerbiatto \u00e8 gi\u00e0 stato abbattuto lo stesso giorno, come previsto dalle Disposizioni al cacciatore 2026." },
    { v: "3.35", text: "Pi\u00f9 spazio tra le icone luna e SOS. Il riferimento normativo (RT 922.110) ora \u00e8 allineato in basso a destra, alla stessa altezza del fondo del pulsante \u00abOggi\u00bb, invece di stare subito sotto SOS." },
    { v: "3.34", text: "Il riferimento normativo (RT 922.110) si \u00e8 spostato sotto il pulsante SOS, allineato a destra, invece di stare nella riga stretta accanto al titolo: libera spazio in modo permanente, non solo durante l'etichetta \u00abNuovo\u00bb." },
    { v: "3.33", text: "Corretta l'intestazione: quando compariva l'etichetta \u00abNuovo\u00bb, su schermi stretti SOS e il resto andavano a capo su una seconda riga. Ora il riferimento normativo (RT 922.110) sparisce solo per i pochi secondi di \u00abNuovo\u00bb e poi torna al suo posto, invece di restare sempre nascosto sugli schermi stretti." },
    { v: "3.31", text: "Aggiunta una schermata d'avvio disegnata apposta (icona, nome dell'app su due righe centrate e credito), che compare per un istante appena apri l'app e sparisce da sola, prima ancora della manleva. Corretto anche un difetto: ricaricando l'app velocemente (es. trascina gi\u00f9 per aggiornare), per un attimo l'icona appariva enorme e il testo senza stile prima che il resto della grafica facesse in tempo a caricarsi." },
    { v: "3.29", text: "Il nome dello sviluppatore non compare pi\u00f9 in ogni schermata: resta solo nella manleva iniziale e nei crediti di Info, dove ora c'\u00e8 anche un pulsante per contattarlo via email (segnalazioni di bug, idee, richieste)." },
    { v: "3.28", text: "Aggiunto un tema scuro, utile all'alba o al crepuscolo per non abbagliarsi con lo schermo chiaro: un pulsante in alto accanto a SOS, o l'interruttore in Impostazioni \u00abAspetto\u00bb. Aperto/chiuso restano verde e rosso anche al buio, solo pi\u00f9 tenui." },
    { v: "3.27", text: "Quando l'app si aggiorna, accanto al numero che lampeggia compare per qualche secondo un'etichetta \u00abNuovo\u00bb, poi sparisce da sola." },
    { v: "3.26", text: "L'app controllava se c'era un aggiornamento nuovo solo quando tornava in primo piano dopo essere stata in sospeso, non alla prima apertura. Ora lo controlla subito ogni volta che apri l'app." },
    { v: "3.25", text: "Tolto il pulsante \u00abCondividi\u00bb nell'esportazione: la condivisione diretta dava errore (\u00abPermission denied\u00bb) su più dispositivi senza una causa risolvibile lato app. Resta \u00abEsporta\u00bb, che scarica il file normalmente." },
    { v: "3.23", text: "Un promemoria in Impostazioni avvisa quando non fai un backup da un po'. Le scritte ricordano anche che il file include sempre pure i fucili." },
    { v: "3.22", text: "Scegliendo una data diversa da oggi, le schede mostravano comunque \u00abAperta ora\u00bb, creando confusione su quale giorno si riferisse. Ora, guardando un'altra data, dicono chiaramente \u00abAperta il [quella data]\u00bb; su oggi resta invariato." },
    { v: "3.21", text: "Corretto un difetto nella gestione delle foto: se il primo tentativo di accesso al loro archivio falliva, restava bloccato per tutta la sessione senza più riprovare. Ora un nuovo tentativo riparte da capo alla chiamata successiva." },
    { v: "3.20", text: "Il modulo di esportazione ora dice chiaramente che il file include anche i fucili, non solo gli abbattimenti." },
    { v: "3.19", text: "Quando l'app si aggiorna a una versione nuova, il numero in alto lampeggia quattro volte per farlo notare, poi si ferma da solo." },
    { v: "3.18", text: "L'esportazione del registro include ora anche i tuoi fucili: importando il file su un altro telefono, l'abbinamento \u00abquale arma hai usato\u00bb su ogni abbattimento resta intatto invece di andare perso. Compatibile con i file esportati in precedenza." },
    { v: "3.17", text: "L'anteprima del video dimostrativo in Info era troppo grande (allungata dalle proporzioni verticali del video); ridotta a una vera miniatura, con il pulsante di schermo intero comunque disponibile durante la riproduzione." },
    { v: "3.16", text: "Aggiunto il video dimostrativo nella scheda Info, con un'anteprima cliccabile subito dopo la descrizione iniziale. Si scarica solo quando lo tocchi, non appesantisce l'installazione dell'app." },
    { v: "3.15", text: "La sottoscheda \u00abStagione in corso\u00bb si chiama ora \u00abSettembrina\u00bb (il nome tradizionale ticinese), per non creare confusione a novembre quando anche la tardo autunnale sar\u00e0 \u00abin corso\u00bb." },
    { v: "3.14", text: "Il messaggio \u00abnessuna categoria aperta\u00bb ora nomina la sottoscheda giusta (caccia tardo autunnale o invernale al cinghiale) invece di dire sempre \u00abcaccia alta\u00bb. Le note delle due caccia non ancora regolamentate spiegano meglio la situazione e invitano a ricontrollare anche qui in app, oltre che sul sito ufficiale." },
    { v: "3.13", text: "In Caccia alta, la caccia tardo autunnale e la caccia invernale al cinghiale hanno ora una sottoscheda propria (accanto a \u00abStagione in corso\u00bb), invece di comparire mescolate nell'elenco principale." },
    { v: "3.12", text: "Aggiunte in caccia alta le voci per la caccia tardo autunnale (cervo, capriolo, volpe) e per la caccia invernale al cinghiale, con l'avviso che il regolamento specifico di quest'anno non è ancora stato pubblicato dal Cantone." },
    { v: "3.11", text: "Il pulsante SOS ora richiede due tocchi per aprirsi: al primo compare un avviso che invita a toccare di nuovo entro pochi secondi, per evitare aperture accidentali (in tasca, nello zaino)." },
    { v: "3.10", text: "Il pulsante per aggiungere una foto ora propone anche la galleria, non solo la fotocamera in diretta: utile per allegare una foto gi\u00e0 scattata, magari registrando l'abbattimento in un secondo momento. Corretta anche l'anteprima nel modulo di registrazione, che prima ritagliava l'immagine per riempire il riquadro: ora la mostra intera mantenendo le proporzioni originali." },
    { v: "3.9", text: "Puoi allegare o scattare una foto a ogni abbattimento (compressa e salvata solo sul telefono), rivederla nel registro, e ora ogni abbattimento si pu\u00f2 anche modificare (non solo eliminare). L'esportazione del registro chiede se includere le foto." },
    { v: "3.8", text: "Nuova scheda \u00abImpostazioni\u00bb (icona a ingranaggio): regolamento in vigore, aggiornamento del regolamento, esporta/importa registro e i miei fucili sono ora qui invece che in Info, che resta per le sole letture (cosa fa l'app, cronologia aggiornamenti)." },
    { v: "3.7", text: "Nel modulo di registrazione, l'arma usata mostra ora solo i fucili adatti al tipo di caccia (canna rigata in caccia alta, canna liscia in bassa e acquatica). I campi munizione e peso della palla, che valgono solo per la carabina, compaiono solo in caccia alta." },
    { v: "3.6", text: "Nuova sezione \u00abI miei fucili\u00bb in Info: registra arma e calibro una volta sola, sia a canna rigata sia a canna liscia \u2014 sovrapposto, doppietta o semiautomatico. In fase di registrazione di un abbattimento puoi indicare l'arma usata, il tipo di munizione e il peso della palla (grani o grammi), tutto facoltativo. Le statistiche mostrano anche il riepilogo per arma." },
    { v: "3.5", text: "Nella schermata Giornata, una specie completamente chiusa nella data scelta non viene più mostrata (resta visibile solo cercandola nella casella di ricerca)." },
    { v: "3.4", text: "L'invito a installare l'app spiega ora anche che così i dati della stagione restano più al sicuro nel tempo. Aggiunta la richiesta di conservazione permanente dei dati, e nelle Statistiche due grafici: l'andamento della stagione e il confronto con le stagioni precedenti (quando ci sono capi di più di un anno nel registro)." },
    { v: "3.3", text: "Riscritta la spiegazione iniziale nella scheda Info, per descrivere meglio tutto ciò che l'app fa oggi (Aperto ora, zone, contingente, SOS, registro)." },
    { v: "3.2", text: "I messaggi di conferma (es. eliminare un abbattimento) ora usano una finestra propria dell'app, senza più mostrare il nome del sito prima del testo. Aggiunto un conteggio anonimo che distingue le aperture dall'icona (app installata) da quelle nel browser." },
    { v: "3.1", text: "Aggiunta una sezione SOS (icona rossa in alto): invia un SMS con le coordinate GPS al 1414 (Rega) o chiama direttamente. Funziona solo con copertura di rete." },
    { v: "3.0", text: "Nella scheda Info, \u00abCosa calcola l'app\u00bb ora è il primo box, subito visibile aprendo la scheda." },
    { v: "2.9", text: "Il contingente ufficiale CHIUSO ora prevale sempre sulla scheda, anche se il regolamento direbbe che \u00e8 ancora aperta. Aggiunto anche un riepilogo \u00abAperto ora\u00bb con tutto ci\u00f2 che \u00e8 cacciabile in questo momento, in qualsiasi tipo di caccia." },
    { v: "2.8", text: "La voce di menu \u00abOggi\u00bb è stata rinominata in \u00abGiornata\u00bb, perché resta sulla data scelta anche cambiando scheda." },
    { v: "2.7", text: "Aggiunto un contatore anonimo delle aperture dell'app, senza alcun dato personale, per sapere quante volte viene usata." },
    { v: "2.6", text: "Aggiunta questa cronologia degli aggiornamenti; la voce di menu è stata rinominata da \u00abRegolamento\u00bb a \u00abInfo\u00bb." },
    { v: "2.5", text: "Il contingente ufficiale cambia colore (verde, arancio o rosso) in base a quanto ne resta, come sul sito del Cantone." },
    { v: "2.4", text: "L'avviso \u00abresta solo sul telefono\u00bb compare anche nella finestra di registrazione di un abbattimento." },
    { v: "2.3", text: "Aggiunto l'avviso che i dati restano solo sul telefono, nella sezione Statistiche." },
    { v: "2.2", text: "Nuova sezione Statistiche nel Registro catture: capi totali, per specie, per tipo di caccia, cronologia della stagione." },
    { v: "2.1", text: "Aggiunte le zone di caccia per ogni specie (dove è aperto o chiuso) e chiarito cosa significa \u00aba settori\u00bb per il capriolo." },
    { v: "2.0", text: "L'app propone di installarsi sulla schermata Home, sia su Android sia su iPhone." },
    { v: "1.9", text: "Il contingente non si mostra più sulle categorie chiuse per data; avviso quando in un giorno non c'è nulla di aperto." },
    { v: "1.8", text: "Si può importare il registro abbattimenti da un file esportato in precedenza." },
    { v: "1.7", text: "Corretto l'allineamento dei pulsanti nella scheda Regolamento." },
    { v: "1.6", text: "Nella schermata Oggi, ogni specie mostra prima le categorie aperte e poi quelle chiuse." },
    { v: "1.4", text: "La voce \u00absotto i 400 mslm\u00bb compare solo con la caccia alta selezionata." },
    { v: "1.3", text: "Il pulsante \u00ab+\u00bb per registrare un abbattimento mostra solo le specie del tipo di caccia selezionato." },
    { v: "1.2", text: "Registrando una femmina non lattifera, il maschio corrispondente si sblocca in automatico e viene messo in evidenza." },
    { v: "1.1", text: "Numero di versione nell'intestazione; l'app si aggiorna da sola, senza dover ricaricare due volte." },
  ];
  const HUNT_ORDER = ["alta", "bassa", "acquatica"];

  // ---------- Caricamento dati ----------

  async function loadRegData() {
    const custom = Storage.getCustomRegolamento();
    if (custom) { regData = custom; return; }
    const res = await fetch("data/regolamento_2026.json");
    regData = await res.json();
  }

  async function loadContingenteData() {
    try {
      const res = await fetch("data/contingente_alta.json", { cache: "no-store" });
      if (!res.ok) { contingenteData = null; return; }
      contingenteData = await res.json();
    } catch (e) {
      contingenteData = null;
    }
  }

  // Vero se il contingente ufficiale di questa categoria risulta CHIUSO sul sito
  // del Cantone: in tal caso prevale sempre sulle date del regolamento, anche se
  // secondo quelle la categoria sarebbe ancora aperta.
  function contingenteChiuso(category) {
    if (!category.contingenteKey) return false;
    const item = contingenteFor(category.contingenteKey);
    return !!item && item.status !== "APERTO";
  }

  // Unico punto che decide se una categoria è davvero aperta in questo momento:
  // regolamento + registro personale + contingente ufficiale, tutti d'accordo.
  function isOpenNow(r) {
    return r.dateOpen && !r.quotaBlocked && !r.requiresPriorMissing && !r.dailyBlocked
      && !contingenteChiuso(r.category);
  }

  function contingenteFor(key) {
    if (!contingenteData || !contingenteData.items) return null;
    return contingenteData.items.find(it => it.contingenteKey === key) || null;
  }

  function renderContingenteBox(category) {
    if (!category.contingenteKey) return "";
    const item = contingenteFor(category.contingenteKey);
    if (!item) {
      return `
        <div class="contingente-box stale">
          <div class="cline"><span>Contingente ufficiale</span><span>non disponibile</span></div>
          <div class="csource">Verifica sul
            <a href="${(contingenteData && contingenteData.source) || "https://www4.ti.ch/dt/da/ucp/gestione-caccia-alta-camoscio"}" target="_blank" rel="noopener">sito ufficiale</a>
          </div>
        </div>`;
    }
    const fetchedAt = new Date(contingenteData.fetchedAt);
    const hoursSince = (Date.now() - fetchedAt.getTime()) / 3_600_000;
    const isStale = hoursSince > 48 || isNaN(hoursSince);
    const statusCls = item.status === "APERTO" ? "aperto" : "chiuso";
    // Colore graduale come sul sito ufficiale: la barra passa da verde ad
    // arancio a rosso mano a mano che il contingente si avvicina all'esaurimento
    // (qui interpretato come "percentuale rimasta" — più è basso, più si è vicini alla chiusura).
    const livelloCls = item.status !== "APERTO" ? ""
      : item.percent > 60 ? "livello-alto"
      : item.percent > 25 ? "livello-medio"
      : "livello-basso";
    const timeLabel = isNaN(fetchedAt.getTime())
      ? ""
      : fetchedAt.toLocaleString("it-CH", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    return `
      <div class="contingente-box ${isStale ? "stale" : ""}">
        <div class="cline">
          <span>Contingente ufficiale</span>
          <span class="cstatus ${statusCls.toLowerCase()} ${livelloCls}">${item.status} · ${item.percent}%</span>
        </div>
        <div class="cbar"><div class="cbar-fill ${statusCls === "chiuso" ? "chiuso" : livelloCls}" style="width:${Math.min(item.percent, 100)}%"></div></div>
        <div class="csource">
          ${isStale ? "Dato non aggiornato di recente — verifica sul " : "Fonte: "}
          <a href="${contingenteData.source}" target="_blank" rel="noopener">${isStale ? "sito ufficiale" : contingenteData.sourceLabel}</a>
          ${timeLabel ? ` · letto il ${timeLabel}` : ""}
        </div>
      </div>`;
  }

  // ---------- Vista OGGI ----------

  function currentHuntTypeIsActive(huntType, evalResults) {
    return evalResults.some(r => r.category.huntType === huntType && r.dateOpen);
  }

  // Riepilogo di tutto ciò che è aperto ORA (in questo istante), in qualsiasi
  // tipo di caccia — utile per un colpo d'occhio senza girare tra le tre schede.
  function renderApertoOra(results, isToday) {
    const list = document.getElementById("apertoOraList");
    const summary = document.getElementById("apertoOraSummary");
    if (!list || !summary) return;

    if (!isToday) {
      summary.textContent = "Aperto oggi — vale solo per la data di oggi";
      list.innerHTML = `<div class="aperto-ora-empty">Stai guardando un'altra data. Tocca «Oggi» in alto per vedere cosa è aperto oggi.</div>`;
      return;
    }

    // Tutto ciò che è cacciabile in un momento qualsiasi della giornata odierna,
    // non solo nell'istante esatto in cui si guarda il telefono: gli orari
    // precisi restano indicati su ogni singola scheda.
    const aperte = results.filter(r => r.category.windows && r.category.windows.length > 0 && isOpenNow(r));

    summary.textContent = aperte.length === 0 ? "Aperto oggi — nessuna categoria" : `Aperto oggi (${aperte.length})`;

    if (aperte.length === 0) {
      list.innerHTML = `<div class="aperto-ora-empty">Nessuna specie è cacciabile oggi.</div>`;
      return;
    }

    const perTipo = {};
    for (const r of aperte) {
      (perTipo[r.category.huntType] ||= []).push(r);
    }
    list.innerHTML = HUNT_ORDER.filter(ht => perTipo[ht]).map(ht => `
      <div class="aperto-ora-group">
        <div class="aperto-ora-tipo">${HUNT_LABELS[ht]}</div>
        ${perTipo[ht].map(r => `<div class="aperto-ora-riga">${r.category.speciesLabel} — ${r.category.categoryLabel}${r.unlockManual ? ' <span class="aperto-ora-verifica">(da verificare)</span>' : ""}</div>`).join("")}
      </div>
    `).join("");
  }

  function renderHuntTabs(results) {
    document.querySelectorAll("#huntTabs .hunt-tab").forEach(btn => {
      const ht = btn.dataset.hunt;
      const active = currentHuntTypeIsActive(ht, results);
      btn.classList.toggle("active", ht === selectedHunt);
      btn.innerHTML = HUNT_LABELS[ht] + (active ? '<span class="dot"></span>' : "");
    });

    // La scelta "sotto i 400 mslm" riguarda solo gli orari di caccia alta
    const altitude = document.querySelector(".altitude-toggle");
    if (altitude) altitude.style.display = selectedHunt === "alta" ? "" : "none";

    // Le sottoschede (tardo autunnale, invernale cinghiale) esistono solo dentro Caccia alta
    const subTabs = document.getElementById("altaSubTabs");
    subTabs.hidden = selectedHunt !== "alta";
    subTabs.querySelectorAll(".subtab").forEach(b => b.classList.toggle("active", b.dataset.sub === altaSubView));
    renderDoveSono();
  }

  function renderOggi() {
    const container = document.getElementById("sectionsContainer");
    container.innerHTML = "";

    const iso = RulesEngine.toISO(selectedDate);
    const now = RulesEngine.toISO(new Date()) === iso ? RulesEngine.nowHHMM(new Date()) : null;
    const log = Storage.getLog();
    const results = RulesEngine.evaluateAll(regData, log, selectedDate, now, prefs);

    renderApertoOra(results, now !== null);

    if (selectedHunt === null) {
      // alla primissima apertura, seleziona la caccia effettivamente in corso oggi, se c'è
      selectedHunt = HUNT_ORDER.find(ht => currentHuntTypeIsActive(ht, results)) || "alta";
    }

    renderHuntTabs(results);

    const query = (document.getElementById("searchInput").value || "").trim().toLowerCase();

    let sectionResults = results.filter(r => r.category.huntType === selectedHunt);
    if (selectedHunt === "alta") {
      if (altaSubView === "tardo") {
        sectionResults = sectionResults.filter(r => r.category.subCategory === "tardo");
      } else if (altaSubView === "invernale") {
        sectionResults = sectionResults.filter(r => r.category.subCategory === "invernale");
      } else {
        sectionResults = sectionResults.filter(r => !r.category.subCategory);
      }
    }
    if (query) {
      sectionResults = sectionResults.filter(r =>
        r.category.speciesLabel.toLowerCase().includes(query) ||
        r.category.categoryLabel.toLowerCase().includes(query)
      );
    }

    if (sectionResults.length === 0) {
      container.innerHTML = `<div class="empty-state">Nessuna specie corrisponde alla ricerca.</div>`;
      return;
    }

    // Se nel giorno scelto non c'è nulla di aperto, lo dice chiaramente in cima
    const anyOpen = sectionResults.some(isOpenNow);
    if (!anyOpen) {
      const nomeSezione = selectedHunt === "alta" && altaSubView === "tardo" ? "caccia tardo autunnale"
        : selectedHunt === "alta" && altaSubView === "invernale" ? "caccia invernale al cinghiale"
        : selectedHunt === "alta" ? "caccia settembrina"
        : HUNT_LABELS[selectedHunt].toLowerCase();
      const banner = document.createElement("div");
      banner.className = "info-box";
      banner.innerHTML = `<b>Nessuna categoria aperta</b> in ${nomeSezione} il ${formatDateCH(iso)}.`;
      container.appendChild(banner);
    }

    // Le specie restano nell'ordine del regolamento; dentro ogni specie
    // prima le categorie sbloccate, poi le aperte, poi le chiuse.
    const openRank = (r) => {
      if (!isOpenNow(r)) return 2;
      return r.unlockedBy ? 0 : 1;
    };
    const bySpecies = {};
    for (const r of sectionResults) {
      (bySpecies[r.category.speciesLabel] ||= []).push(r);
    }
    for (const speciesLabel of Object.keys(bySpecies)) {
      const speciesList = bySpecies[speciesLabel];
      // Specie completamente chiusa in questa data (nessuna categoria aperta,
      // né sbloccata né "da verificare"): non la mostro, per non riempire la
      // pagina di schede tutte "Chiusa". Durante una ricerca invece resta
      // visibile comunque, perché lì l'intento è cercare proprio quella specie.
      const inSottoschedaSpeciale = selectedHunt === "alta" && altaSubView !== "stagione";
      if (!query && !inSottoschedaSpeciale && !speciesList.some(isOpenNow)) continue;

      const list = speciesList
        .map((r, i) => ({ r, i }))
        .sort((a, b) => (openRank(a.r) - openRank(b.r)) || (a.i - b.i))
        .map(x => x.r);
      for (const r of list) {
        container.appendChild(renderCatCard(r));
      }
    }
  }

  function isUnlockedOpen(r) {
    return !!r.unlockedBy && isOpenNow(r);
  }

  function formatDateCH(iso) {
    const [y, m, d] = (iso || "").split("-");
    return d ? `${d}.${m}.${y}` : "";
  }

  function unlockBanner(r) {
    const k = r.unlockedBy;
    const src = regData.categories.find(c => c.id === k.categoryId);
    const what = src ? `${src.speciesLabel.toLowerCase()} – ${src.categoryLabel.toLowerCase()}` : "il capo richiesto";
    return `<div class="unlock-banner">✓ Sbloccata: hai registrato ${what} il ${formatDateCH(k.date)}</div>`;
  }

  // Dove si può cacciare questa specie (art. 44 del regolamento)
  function renderZoneBox(category) {
    const z = (regData.zones || {})[category.speciesLabel.toLowerCase()];
    if (!z) return "";
    const righe = [];
    if (z.chiuso) righe.push(`<div class="zona-chiuso">${z.chiuso}</div>`);
    if (z.aperto) righe.push(`<div><b>Aperto:</b> ${z.aperto}</div>`);
    if (z.condizioni) righe.push(`<div><b>Condizioni:</b> ${z.condizioni}</div>`);
    if (righe.length === 0) return "";
    return `<details class="zona-box">
      <summary>Dove si può cacciare${z.chiuso ? " — attenzione, zone chiuse" : ""}</summary>
      ${righe.join("")}
    </details>`;
  }

  function statusFor(r) {
    // Se la data scelta non è oggi, non esiste un "adesso" reale con cui
    // confrontare l'orario: lo dico esplicitamente con la data invece di
    // scrivere "ora", che altrimenti sembrerebbe riferirsi al momento attuale.
    const isToday = RulesEngine.toISO(selectedDate) === RulesEngine.toISO(new Date());
    const dataScelta = formatDateCH(RulesEngine.toISO(selectedDate));

    // Il contingente ufficiale chiuso prevale su tutto il resto: anche se il
    // regolamento direbbe che è ancora aperta, sul terreno non lo è più.
    if (contingenteChiuso(r.category)) {
      return { label: "Chiusa (contingente ufficiale)", cls: "status-closed",
        sub: "Il contingente ufficiale di questa categoria risulta chiuso sul sito del Cantone." };
    }
    if (!r.dateOpen) return { label: "Chiusa", cls: "status-closed" };
    if (r.requiresPriorMissing) return { label: "Chiusa", cls: "status-closed", sub: r.category.lockedText || "Condizione stagionale non ancora soddisfatta" };
    if (r.quotaBlocked) return { label: "Chiusa", cls: "status-closed", sub: r.quotaReason };
    if (r.dailyBlocked) return { label: "Chiusa oggi", cls: "status-closed", sub: r.dailyReason };
    if (r.unlockManual) return { label: "Aperta — verifica", cls: "status-check", sub: r.category.unlockManualText };
    if (r.category.manualCheck) return { label: "Aperta — verifica", cls: "status-check" };
    if (r.unlockedBy) {
      if (!isToday) return { label: `Sbloccata · aperta il ${dataScelta}`, cls: "status-unlocked" };
      return r.nowOpen
        ? { label: "Sbloccata · aperta ora", cls: "status-unlocked" }
        : { label: "Sbloccata · aperta oggi", cls: "status-unlocked", sub: "Fuori orario in questo momento" };
    }
    if (!isToday) return { label: `Aperta il ${dataScelta}`, cls: "status-open" };
    if (r.nowOpen) return { label: "Aperta ora", cls: "status-open" };
    return { label: "Aperta oggi", cls: "status-open", sub: "Fuori orario in questo momento" };
  }

  function renderCatCard(r) {
    const st = statusFor(r);
    const card = document.createElement("div");
    card.className = isUnlockedOpen(r) ? "cat-card unlocked" : "cat-card";

    const canRegister = isOpenNow(r);

    card.innerHTML = `
      <div class="row1">
        <div class="titles">
          <div class="species">${r.category.speciesLabel}</div>
          <div class="category">${r.category.categoryLabel}</div>
        </div>
        <span class="status-pill ${st.cls}">${st.label}</span>
      </div>
      <div class="meta-row">
        <span>Orario: ${r.hoursToday || "da definire"}</span>
        ${r.remainingText ? `<span>${r.remainingText}</span>` : ""}
      </div>
      ${renderZoneBox(r.category)}
      ${isUnlockedOpen(r) ? unlockBanner(r) : ""}
      ${st.sub ? `<div class="note">${st.sub}</div>` : ""}
      ${r.category.manualCheck ? `<div class="note">${r.category.manualCheck}</div>` : ""}
      ${r.category.note ? `<div class="note">${r.category.note}</div>` : ""}
      ${r.dateOpen ? renderContingenteBox(r.category) : ""}
      <button class="reg-btn" ${canRegister ? "" : "disabled"}>Registra abbattimento</button>
    `;
    card.querySelector(".reg-btn").addEventListener("click", () => openModal(r.category.id));
    return card;
  }

  // ---------- Vista REGISTRO ----------

  // Carica le miniature dopo aver disegnato l'elenco: la lettura da IndexedDB
  // è asincrona, quindi le schede compaiono subito e le foto un istante dopo.
  async function caricaAnteprimeFoto(container) {
    const imgs = container.querySelectorAll(".log-photo-thumb[data-photo-id]");
    for (const img of imgs) {
      try {
        const blob = await Storage.getPhoto(img.dataset.photoId);
        if (blob) {
          img.src = URL.createObjectURL(blob);
          img.addEventListener("click", () => {
            document.getElementById("photoLightboxImg").src = img.src;
            document.getElementById("photoLightbox").classList.add("active");
          });
        }
      } catch (e) { /* miniatura non disponibile, il resto della riga resta comunque */ }
    }
  }

  function renderRegistro() {
    const capsBox = document.getElementById("capsSummary");
    const log = Storage.getLog();
    capsBox.innerHTML = "";
    for (const [groupId, cap] of Object.entries(regData.groupCaps)) {
      const count = RulesEngine.seasonCountByGroup(log, regData.categories, groupId);
      const chip = document.createElement("span");
      chip.className = "cap-chip";
      chip.textContent = `${cap.label}: ${count}/${cap.max}`;
      capsBox.appendChild(chip);
    }

    const listEl = document.getElementById("logList");
    listEl.innerHTML = "";
    const sorted = [...log].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    if (sorted.length === 0) {
      listEl.innerHTML = `<div class="empty-state">Nessun abbattimento registrato.</div>`;
      return;
    }
    const guns = Storage.getGuns();
    for (const k of sorted) {
      const cat = regData.categories.find(c => c.id === k.categoryId);

      // Dettagli facoltativi (foto, arma, munizione, peso), mostrati solo se presenti.
      const righeDettagli = [];
      if (k.photoId) righeDettagli.push(`<div class="log-photo-row"><img class="log-photo-thumb" data-photo-id="${k.photoId}" alt="Foto dell'abbattimento"></div>`);
      if (k.gunId) {
        const gun = guns.find(g => g.id === k.gunId);
        righeDettagli.push(`<div><b>Arma:</b> ${gun ? (gun.name ? gun.name + " — " : "") + descrizioneFucile(gun) : "(eliminata dall'elenco)"}</div>`);
      }
      if (k.ammoType) righeDettagli.push(`<div><b>Munizione:</b> ${k.ammoType}</div>`);
      if (k.bulletWeight) righeDettagli.push(`<div><b>Peso palla:</b> ${k.bulletWeight} ${k.bulletWeightUnit === "gr" ? "grani" : "grammi"}</div>`);
      if (k.district) righeDettagli.push(`<div><b>Distretto:</b> ${escapeHtmlLuogo(k.district)}</div>`);
      if (k.place) righeDettagli.push(`<div><b>Luogo:</b> ${escapeHtmlLuogo(k.place)}</div>`);
      if (k.coords) {
        const { lat, lon, acc } = k.coords;
        righeDettagli.push(
          `<div><b>Posizione GPS:</b> ${lat.toFixed(5)}, ${lon.toFixed(5)}` +
          (acc ? ` (±${Math.round(acc)} m)` : "") +
          ` — <a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank" rel="noopener">apri nelle mappe</a></div>`
        );
      }
      const etichetta = righeDettagli.length === 1 && k.photoId ? "Foto" : "Dettagli";
      const dettagli = righeDettagli.length > 0
        ? `<details class="log-extra"><summary>${etichetta}</summary>${righeDettagli.join("")}</details>`
        : "";

      const item = document.createElement("div");
      item.className = "log-item";
      item.innerHTML = `
        <div class="info">
          <div class="date">${k.date}</div>
          <div class="sp">${cat ? cat.speciesLabel : k.categoryId}</div>
          <div class="cat">${cat ? cat.categoryLabel : ""}${k.note ? " — " + k.note : ""}</div>
          ${dettagli}
        </div>
        <div class="log-actions">
          <button class="edit">Modifica</button>
          <button class="del">Elimina</button>
        </div>
      `;
      item.querySelector(".edit").addEventListener("click", () => openModalForEdit(k.id));
      item.querySelector(".del").addEventListener("click", async () => {
        if (await showConfirm("Eliminare questo abbattimento dal registro?")) {
          if (k.photoId) Storage.deletePhoto(k.photoId);
          Storage.deleteKill(k.id);
          renderRegistro();
          renderOggi();
          if (!document.getElementById("registroStatistiche").classList.contains("hidden")) renderStatistiche();
        }
      });
      listEl.appendChild(item);
    }
    caricaAnteprimeFoto(listEl);
  }

  function descrizioneFucile(g) {
    return g.tipoCanna === "liscia" ? `${g.azione} — canna liscia, calibro ${g.caliber}` : g.caliber;
  }

  // ---------- Finestre di conferma/avviso personalizzate ----------
  // Sostituiscono confirm()/alert() del browser, che mostrano sempre il nome
  // del sito prima del messaggio ("massimilianodilorenzo70-eng.github.io dice").
  // Con una finestra nostra il testo è pulito e coerente con il resto dell'app.

  function showConfirm(message) {
    return new Promise((resolve) => {
      const backdrop = document.getElementById("confirmBackdrop");
      document.getElementById("confirmMessage").textContent = message;
      const cancelBtn = document.getElementById("confirmCancelBtn");
      const okBtn = document.getElementById("confirmOkBtn");
      cancelBtn.hidden = false;
      backdrop.classList.add("active");

      function onOk() { cleanup(true); }
      function onCancel() { cleanup(false); }
      function cleanup(result) {
        backdrop.classList.remove("active");
        okBtn.removeEventListener("click", onOk);
        cancelBtn.removeEventListener("click", onCancel);
        resolve(result);
      }
      okBtn.addEventListener("click", onOk);
      cancelBtn.addEventListener("click", onCancel);
    });
  }

  function showAlert(message) {
    return new Promise((resolve) => {
      const backdrop = document.getElementById("confirmBackdrop");
      document.getElementById("confirmMessage").textContent = message;
      const cancelBtn = document.getElementById("confirmCancelBtn");
      const okBtn = document.getElementById("confirmOkBtn");
      cancelBtn.hidden = true;
      backdrop.classList.add("active");

      function onOk() {
        backdrop.classList.remove("active");
        okBtn.removeEventListener("click", onOk);
        cancelBtn.hidden = false; // ripristina per il prossimo showConfirm
        resolve();
      }
      okBtn.addEventListener("click", onOk);
    });
  }

  // ---------- I miei fucili ----------

  function renderGunsList() {
    const el = document.getElementById("gunsList");
    if (!el) return;
    const guns = Storage.getGuns();
    if (guns.length === 0) {
      el.innerHTML = `<div class="empty-state-compact">Nessun fucile registrato.</div>`;
      return;
    }
    el.innerHTML = guns.map(g => `
      <div class="log-item" data-gun-id="${g.id}">
        <div class="info">
          <div class="sp">${g.name || descrizioneFucile(g)}</div>
          <div class="cat">${descrizioneFucile(g)}</div>
        </div>
        <button class="del" data-gun-id="${g.id}">Elimina</button>
      </div>`).join("");

    el.querySelectorAll("button.del").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (await showConfirm("Eliminare questo fucile dall'elenco?")) {
          Storage.deleteGun(btn.dataset.gunId);
          renderGunsList();
        }
      });
    });
  }

  function tipoCannaSelezionato() {
    return document.querySelector("#gunBarrelTabs .subtab.active").dataset.barrel;
  }

  function openGunModal(tipoPreferito) {
    const barrel = tipoPreferito || "rigata";
    document.getElementById("gunName").value = "";
    document.querySelectorAll("#gunBarrelTabs .subtab").forEach(b => b.classList.toggle("active", b.dataset.barrel === barrel));
    document.getElementById("gunRigataFields").hidden = barrel !== "rigata";
    document.getElementById("gunLisciaFields").hidden = barrel === "rigata";
    document.getElementById("gunCaliber").value = "7x57";
    document.getElementById("gunCaliberAltro").hidden = true;
    document.getElementById("gunCaliberAltro").value = "";
    document.getElementById("gunAzioneLiscia").value = "Sovrapposto";
    document.getElementById("gunGauge").value = "12";
    document.getElementById("gunGaugeAltro").hidden = true;
    document.getElementById("gunGaugeAltro").value = "";
    document.getElementById("gunModalBackdrop").classList.add("active");
  }

  // Il fucile "in bozza" così com'è impostato ora nel modulo, indipendentemente
  // da rigata/liscia — usato sia per l'avviso live sia per il salvataggio.
  function fucileDalModulo() {
    const name = document.getElementById("gunName").value.trim();
    if (tipoCannaSelezionato() === "liscia") {
      const gaugeSel = document.getElementById("gunGauge");
      const caliber = gaugeSel.value === "__altro__" ? document.getElementById("gunGaugeAltro").value.trim() : gaugeSel.value;
      return { name, tipoCanna: "liscia", azione: document.getElementById("gunAzioneLiscia").value, caliber };
    }
    const calSel = document.getElementById("gunCaliber");
    const caliber = calSel.value === "__altro__" ? document.getElementById("gunCaliberAltro").value.trim() : calSel.value;
    return { name, tipoCanna: "rigata", caliber };
  }

  function setupGuns() {
    document.getElementById("addGunBtn").addEventListener("click", () => openGunModal());
    document.getElementById("gunModalCancel").addEventListener("click", () => {
      document.getElementById("gunModalBackdrop").classList.remove("active");
    });

    document.querySelectorAll("#gunBarrelTabs .subtab").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#gunBarrelTabs .subtab").forEach(b => b.classList.toggle("active", b === btn));
        const liscia = btn.dataset.barrel === "liscia";
        document.getElementById("gunRigataFields").hidden = liscia;
        document.getElementById("gunLisciaFields").hidden = !liscia;
      });
    });

    document.getElementById("gunCaliber").addEventListener("change", (e) => {
      document.getElementById("gunCaliberAltro").hidden = e.target.value !== "__altro__";
    });
    document.getElementById("gunGauge").addEventListener("change", (e) => {
      document.getElementById("gunGaugeAltro").hidden = e.target.value !== "__altro__";
    });

    document.getElementById("gunModalSave").addEventListener("click", () => {
      const gun = fucileDalModulo();
      if (!gun.caliber) return;
      Storage.addGun(gun);
      document.getElementById("gunModalBackdrop").classList.remove("active");
      renderGunsList();
      popolaSelectArmi();
    });
  }

  // Popola il menu "Arma usata" nel modulo di registrazione con i fucili salvati.
  // In caccia alta si usano armi a canna rigata; in caccia bassa e acquatica
  // a canna liscia. Il menu mostra solo i fucili pertinenti al tipo scelto.
  function fucileAdattoAHuntType(gun, huntType) {
    return huntType === "alta" ? gun.tipoCanna !== "liscia" : gun.tipoCanna === "liscia";
  }

  function popolaSelectArmi(huntType) {
    const sel = document.getElementById("modalGun");
    if (!sel) return;
    const guns = Storage.getGuns().filter(g => fucileAdattoAHuntType(g, huntType));
    sel.innerHTML = `<option value="">— non indicata —</option>` +
      guns.map(g => `<option value="${g.id}">${g.name ? g.name + " — " : ""}${descrizioneFucile(g)}</option>`).join("");
    return guns;
  }

  // ---------- SOS: posizione GPS + SMS/chiamata al 1414 ----------

  // Posizione GPS: usata sia dall'SOS sia dal campo "Luogo" del modulo di
  // registrazione, quindi sta qui fuori e non dentro una delle due.
  function getPosition() {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Questo telefono/browser non supporta la localizzazione."));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true, timeout: 20000, maximumAge: 0,
      });
    });
  }

  function geoErrorText(err) {
    if (err.code === err.PERMISSION_DENIED) {
      return "Permesso di localizzazione negato. Abilitalo nelle impostazioni del telefono per usare questa funzione.";
    }
    if (err.code === err.TIMEOUT) {
      return "Non riesco a ottenere la posizione in tempo (segnale GPS debole). Riprova, oppure chiama direttamente.";
    }
    return "Non riesco a ottenere la posizione. Riprova, oppure chiama direttamente.";
  }

  // Messaggio per la Rega. Le coordinate WGS84, quelle svizzere LV95 e l'ora
  // si calcolano sul telefono, senza rete: quelle ci sono sempre. Comune,
  // località e quota dal modello del terreno arrivano dai servizi
  // swisstopo e sono un di più: se la rete non risponde entro pochi secondi
  // il messaggio parte lo stesso, perché in emergenza l'attesa costa più
  // del dettaglio mancante.
  const SOS_EXTRA_MS = 4000;

  async function quotaDaModelloTerreno(E, N) {
    const url = `https://api3.geo.admin.ch/rest/services/height?easting=${E.toFixed(1)}&northing=${N.toFixed(1)}&sr=2056`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const d = await r.json();
    const h = parseFloat(d.height);
    return isFinite(h) ? Math.round(h) : null;
  }

  async function componiMessaggioSOS(pos) {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const acc = Math.round(pos.coords.accuracy);
    const { E, N } = wgs84ToLv95(lat, lon);
    const ora = new Date().toLocaleString("it-CH", { dateStyle: "short", timeStyle: "short" });

    let quota = pos.coords.altitude != null ? Math.round(pos.coords.altitude) : null;
    let comune = null, vicino = null;

    // Tutto in parallelo, con un tetto di tempo complessivo.
    const extra = Promise.all([
      comune === null ? comuneDaCoordinate(E, N).catch(() => null) : null,
      toponimiVicini(E, N).catch(() => []),
      quota == null ? quotaDaModelloTerreno(E, N).catch(() => null) : null,
    ]);
    const scaduto = Symbol("scaduto");
    const esito = await Promise.race([
      extra,
      new Promise((res) => setTimeout(() => res(scaduto), SOS_EXTRA_MS)),
    ]);
    if (esito !== scaduto) {
      comune = esito[0];
      const t = esito[1] && esito[1][0];
      if (t) vicino = t.d < 25 ? t.nome : `${t.nome} (${descriviDistanza(t)})`;
      if (quota == null && esito[2] != null) quota = esito[2];
    }

    let testo = "EMERGENZA. Ho bisogno di soccorso.";
    if (comune || vicino) {
      testo += ` Luogo: ${[comune, vicino].filter(Boolean).join(" – ")}.`;
    }
    testo += ` Posizione: ${lat.toFixed(5)}, ${lon.toFixed(5)}` +
      ` (CH1903+/LV95: ${Math.round(E)}, ${Math.round(N)}).`;
    if (quota != null) testo += ` Quota: circa ${quota} m.`;
    testo += ` Precisione GPS: circa ${acc} m. Ora: ${ora}.`;
    return testo;
  }

  function setupSOS() {
    const backdrop = document.getElementById("sosBackdrop");
    const status = document.getElementById("sosStatus");

    const showStatus = (text, cls) => {
      status.textContent = text;
      status.className = "sos-status" + (cls ? " " + cls : "");
    };

    // Un solo tocco non basta: serve un secondo tocco entro pochi secondi,
    // così un urto accidentale al pulsante (in tasca, nello zaino) non apre
    // subito la schermata di emergenza.
    let sosArmato = false;
    let sosArmTimer = null;
    const sosArmHint = document.getElementById("sosArmHint");
    const SOS_ARM_MS = 4000;

    document.getElementById("sosOpenBtn").addEventListener("click", () => {
      if (!sosArmato) {
        sosArmato = true;
        sosArmHint.classList.remove("hidden");
        clearTimeout(sosArmTimer);
        sosArmTimer = setTimeout(() => {
          sosArmato = false;
          sosArmHint.classList.add("hidden");
        }, SOS_ARM_MS);
        return;
      }
      clearTimeout(sosArmTimer);
      sosArmato = false;
      sosArmHint.classList.add("hidden");
      showStatus("", "");
      backdrop.classList.add("active");
    });
    document.getElementById("sosClose").addEventListener("click", () => {
      backdrop.classList.remove("active");
    });

    document.getElementById("sosSmsBtn").addEventListener("click", async () => {
      showStatus("Ricerca della posizione GPS in corso…", "");
      mostraTestoSOS("");
      try {
        const pos = await getPosition();
        showStatus("Posizione trovata. Cerco anche comune, località e quota…", "");
        const testo = await componiMessaggioSOS(pos);
        mostraTestoSOS(testo);
        showStatus("Si apre ora l'app Messaggi: controlla il testo e invialo tu.", "ok");
        window.location.href = `sms:1414?body=${encodeURIComponent(testo)}`;
      } catch (err) {
        showStatus(geoErrorText(err), "err");
      }
    });

    // Il testo resta anche sullo schermo: se l'app Messaggi non lo riempie da
    // sola, o se si finisce per telefonare, si può leggere e dettare.
    function mostraTestoSOS(testo) {
      const wrap = document.getElementById("sosTextWrap");
      document.getElementById("sosText").textContent = testo;
      wrap.hidden = !testo;
    }

    document.getElementById("sosCopyBtn").addEventListener("click", async () => {
      const testo = document.getElementById("sosText").textContent;
      if (!testo) return;
      try {
        await navigator.clipboard.writeText(testo);
        showStatus("Testo copiato.", "ok");
      } catch (e) {
        showStatus("Non riesco a copiare: seleziona il testo a mano.", "err");
      }
    });

    document.getElementById("sosCallBtn").addEventListener("click", () => {
      window.location.href = "tel:1414";
    });
  }

  // ---------- Sottotab Registro: Elenco / Statistiche ----------

  function setupRegistroSubtabs() {
    document.querySelectorAll("#registroSubtabs .subtab").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#registroSubtabs .subtab").forEach(
          (b) => b.classList.toggle("active", b === btn));
        const wantStats = btn.dataset.sub === "statistiche";
        document.getElementById("registroElenco").classList.toggle("hidden", wantStats);
        document.getElementById("registroStatistiche").classList.toggle("hidden", !wantStats);
        if (wantStats) renderStatistiche();
      });
    });
  }

  // ---------- Grafici: andamento cumulato e confronto tra stagioni ----------
  // SVG disegnato a mano, nessuna libreria esterna, coerente con il resto
  // dell'app. I colori sono fissi (non CSS var) per essere sicuri che
  // rendano uguali su tutti i browser dei telefoni.

  function giorniTra(isoA, isoB) {
    return Math.round((new Date(isoB + "T00:00:00") - new Date(isoA + "T00:00:00")) / 86400000);
  }

  // Serie cumulata: un punto per ogni cattura, più un punto iniziale (0
  // capi) e uno finale che prolunga la linea fino a xEndIso.
  function serieCumulata(dateOrdinate, conteggioPerData, xStartIso, xEndIso) {
    const totalDays = Math.max(1, giorniTra(xStartIso, xEndIso));
    let cum = 0;
    const pts = [{ x: 0, y: 0 }];
    for (const d of dateOrdinate) {
      if (d < xStartIso || d > xEndIso) continue;
      cum += conteggioPerData.get(d);
      pts.push({ x: giorniTra(xStartIso, d), y: cum });
    }
    if (pts[pts.length - 1].x < totalDays) pts.push({ x: totalDays, y: cum });
    return { points: pts, totalDays, totale: cum };
  }

  // Disegna una o più serie sullo stesso grafico (per il confronto tra anni).
  function disegnaGraficoLinee(serie) {
    const W = 300, H = 132, padL = 26, padR = 10, padT = 12, padB = 20;
    const maxX = Math.max(1, ...serie.map(s => s.totalDays));
    const maxY = Math.max(1, ...serie.map(s => Math.max(...s.points.map(p => p.y))));
    const xOf = (x) => padL + (x / maxX) * (W - padL - padR);
    const yOf = (y) => H - padB - (y / maxY) * (H - padT - padB);

    const step = maxY <= 4 ? 1 : Math.ceil(maxY / 4);
    const griglia = [];
    for (let v = 0; v <= maxY; v += step) {
      griglia.push(`<line x1="${padL}" y1="${yOf(v).toFixed(1)}" x2="${W - padR}" y2="${yOf(v).toFixed(1)}" stroke="#CBC4AC" stroke-width="1"/>`);
      griglia.push(`<text x="${padL - 5}" y="${(yOf(v) + 3).toFixed(1)}" font-size="9" fill="#565A44" text-anchor="end">${v}</text>`);
    }

    const linee = serie.map(s => {
      const d = s.points.map((p, i) => `${i === 0 ? "M" : "L"}${xOf(p.x).toFixed(1)},${yOf(p.y).toFixed(1)}`).join(" ");
      const last = s.points[s.points.length - 1];
      return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round"/>` +
        `<circle cx="${xOf(last.x).toFixed(1)}" cy="${yOf(last.y).toFixed(1)}" r="3" fill="${s.color}"/>`;
    }).join("");

    return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img">${griglia.join("")}${linee}</svg>`;
  }

  function renderGraficoStagione(datesAsc, byDate, oggiIso, year) {
    const xStart = datesAsc[0];
    const xEnd = oggiIso.startsWith(year) && oggiIso > datesAsc[datesAsc.length - 1] ? oggiIso : datesAsc[datesAsc.length - 1];
    const s = serieCumulata(datesAsc, byDate, xStart, xEnd);
    const svg = disegnaGraficoLinee([{ points: s.points, totalDays: s.totalDays, color: "#2E4A29" }]);
    return `
      <div class="section-title">Andamento della stagione</div>
      <div class="chart-box">
        ${svg}
        <div class="chart-xlabels"><span>${formatDateCH(xStart)}</span><span>${formatDateCH(xEnd)}</span></div>
      </div>`;
  }

  function renderConfrontoStagioni(log, currentYear) {
    const byYear = new Map(); // anno -> Map(data -> conteggio)
    for (const k of log) {
      const y = k.date.slice(0, 4);
      if (!byYear.has(y)) byYear.set(y, new Map());
      const m = byYear.get(y);
      m.set(k.date, (m.get(k.date) || 0) + 1);
    }
    const anni = [...byYear.keys()].sort();
    if (anni.length < 2) return ""; // niente da confrontare con una sola stagione

    const palette = ["#93711F", "#8B3A2C", "#565A44", "#5B7A6E"];
    let idxPassati = 0;
    const oggiIso = RulesEngine.toISO(new Date());

    const serie = anni.map(y => {
      const mappa = byYear.get(y);
      const dateOrd = [...mappa.keys()].sort();
      const xEnd = (y === currentYear && oggiIso.startsWith(y) && oggiIso > dateOrd[dateOrd.length - 1])
        ? oggiIso : dateOrd[dateOrd.length - 1];
      const s = serieCumulata(dateOrd, mappa, dateOrd[0], xEnd);
      const color = y === currentYear ? "#2E4A29" : palette[idxPassati++ % palette.length];
      return { anno: y, color, points: s.points, totalDays: s.totalDays, totale: s.totale };
    });

    const svg = disegnaGraficoLinee(serie);
    const legenda = serie.map(s =>
      `<span class="chart-legend-item"><span class="chart-dot" style="background:${s.color}"></span>${s.anno}: ${s.totale} cap${s.totale === 1 ? "o" : "i"}</span>`
    ).join("");

    return `
      <div class="section-title">Confronto con le stagioni precedenti</div>
      <div class="chart-box">
        ${svg}
        <div class="chart-xlabels"><span>Giorno 0 di ciascuna stagione</span><span>→</span></div>
        <div class="chart-legend">${legenda}</div>
      </div>
      <div class="note">L'asse orizzontale allinea ogni stagione al suo primo abbattimento, non al calendario:
      così si vede se stai andando più veloce o più lento rispetto agli anni scorsi, indipendentemente
      da quando è iniziata la caccia.</div>`;
  }

  // ---------- Vista REGISTRO: statistiche stagionali ----------

  function renderStatistiche() {
    const panel = document.getElementById("registroStatistiche");
    const log = Storage.getLog();
    const year = String(regData.regulationYear || "");
    const season = year ? log.filter(k => k.date.startsWith(year)) : log;
    const outOfSeason = log.length - season.length;

    if (season.length === 0) {
      panel.innerHTML = `<div class="empty-state">Nessun abbattimento registrato` +
        `${year ? " per la stagione " + year : ""}.</div>` +
        `<div class="privacy-note">🔒 Questi dati restano solo sul tuo telefono: non vengono inviati né ` +
        `condivisi in alcun modo con l'Ufficio della caccia e della pesca né con altri.</div>`;
      return;
    }

    const catById = new Map(regData.categories.map(c => [c.id, c]));
    const bySpecies = new Map();   // speciesLabel -> conteggio
    const byHunt = new Map();      // huntType -> conteggio
    const byDate = new Map();      // data -> conteggio

    for (const k of season) {
      const cat = catById.get(k.categoryId);
      const sp = cat ? cat.speciesLabel : k.categoryId;
      const ht = cat ? cat.huntType : null;
      bySpecies.set(sp, (bySpecies.get(sp) || 0) + 1);
      if (ht) byHunt.set(ht, (byHunt.get(ht) || 0) + 1);
      byDate.set(k.date, (byDate.get(k.date) || 0) + 1);
    }

    const speciesSorted = [...bySpecies.entries()].sort((a, b) => b[1] - a[1]);
    const maxSpeciesCount = speciesSorted[0][1];
    const huntSorted = [...byHunt.entries()].sort((a, b) => b[1] - a[1]);
    const dateSorted = [...byDate.entries()].sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]));
    const datesAsc = [...byDate.keys()].sort();
    const bestDay = dateSorted[0];

    const bar = (label, count, max) => `
      <div class="stat-bar-row">
        <div class="stat-bar-label">${label}</div>
        <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${Math.max(6, Math.round(count / max * 100))}%"></div></div>
        <div class="stat-bar-count">${count}</div>
      </div>`;

    panel.innerHTML = `
      <div class="stats-highlights">
        <div class="stat-box"><div class="num">${season.length}</div><div class="lbl">cap${season.length === 1 ? "o" : "i"} totali</div></div>
        <div class="stat-box"><div class="num">${bySpecies.size}</div><div class="lbl">specie diverse</div></div>
        <div class="stat-box"><div class="num">${byDate.size}</div><div class="lbl">giorni di caccia</div></div>
      </div>

      <div class="section-title">Per specie</div>
      <div class="stats-bars">
        ${speciesSorted.map(([sp, count]) => bar(sp, count, maxSpeciesCount)).join("")}
      </div>

      ${huntSorted.length > 1 ? `
      <div class="section-title">Per tipo di caccia</div>
      <div class="stats-bars">
        ${huntSorted.map(([ht, count]) => bar(HUNT_LABELS[ht] || ht, count, season.length)).join("")}
      </div>` : ""}

      ${(() => {
        const guns = Storage.getGuns();
        const byGun = new Map();
        for (const k of season) {
          if (!k.gunId) continue;
          const g = guns.find(x => x.id === k.gunId);
          const label = g ? (g.name ? g.name + " — " + g.caliber : g.caliber) : null;
          if (!label) continue;
          byGun.set(label, (byGun.get(label) || 0) + 1);
        }
        if (byGun.size === 0) return "";
        const sorted = [...byGun.entries()].sort((a, b) => b[1] - a[1]);
        const maxGun = sorted[0][1];
        return `
      <div class="section-title">Per arma</div>
      <div class="stats-bars">
        ${sorted.map(([label, count]) => bar(label, count, maxGun)).join("")}
      </div>`;
      })()}

      <div class="section-title">Cronologia</div>
      <div class="info-box">
        <b>Primo abbattimento:</b> ${formatDateCH(datesAsc[0])}<br>
        <b>Ultimo abbattimento:</b> ${formatDateCH(datesAsc[datesAsc.length - 1])}<br>
        <b>Giorno più fruttuoso:</b> ${formatDateCH(bestDay[0])} (${bestDay[1]} cap${bestDay[1] === 1 ? "o" : "i"})
      </div>
      ${outOfSeason ? `<div class="note">Escluse dal conteggio ${outOfSeason} voci con data fuori dalla stagione ${year}.</div>` : ""}

      ${renderGraficoStagione(datesAsc, byDate, RulesEngine.toISO(new Date()), year)}
      ${renderConfrontoStagioni(log, year)}

      <div class="privacy-note">
        🔒 Questi dati restano solo sul tuo telefono: non vengono inviati né condivisi in alcun
        modo con l'Ufficio della caccia e della pesca né con altri.
      </div>
    `;
  }

  // ---------- Vista REGOLAMENTO ----------

  function renderChangelog() {
    const el = document.getElementById("changelogList");
    if (!el || el.dataset.rendered) return;
    el.dataset.rendered = "1";
    el.innerHTML = CHANGELOG.map(e => `
      <div class="changelog-row"><b>v${e.v}</b> — ${e.text}</div>
    `).join("");
  }

  function renderInfo() {
    renderChangelog();
  }

  // Promemoria gentile: se sono passati molti giorni o si sono accumulati
  // parecchi abbattimenti dall'ultimo backup, lo ricorda qui — senza essere
  // invadente, sparisce da solo appena fai un'esportazione o condivisione.
  function aggiornaPromemoriaBackup() {
    const banner = document.getElementById("backupReminder");
    if (!banner) return;
    const log = Storage.getLog();
    if (log.length === 0) { banner.hidden = true; return; }

    const lastAt = localStorage.getItem("cacciaTI_last_backup_at");
    const lastCount = parseInt(localStorage.getItem("cacciaTI_last_backup_count") || "0", 10);
    const nuovi = Math.max(0, log.length - lastCount);
    const giorni = lastAt ? (Date.now() - new Date(lastAt).getTime()) / 86400000 : Infinity;

    if (!lastAt) {
      banner.hidden = false;
      banner.textContent = "Non hai ancora mai fatto un backup del registro. Vale la pena farlo ora, prima di rischiare di perderlo se il telefono si rompe o si perde.";
    } else if (nuovi >= 3 || giorni >= 14) {
      banner.hidden = false;
      banner.textContent = `Non fai un backup da un po': ${nuovi} abbattiment${nuovi === 1 ? "o" : "i"} nuov${nuovi === 1 ? "o" : "i"} non ancora esportat${nuovi === 1 ? "o" : "i"}. Vale la pena farlo ora.`;
    } else {
      banner.hidden = true;
    }
  }

  function renderImpostazioni() {
    const box = document.getElementById("regInfoBox");
    const custom = Storage.getCustomRegolamento();
    box.innerHTML = `
      <b>Anno regolamento:</b> ${regData.regulationYear}${custom ? " (importato manualmente)" : " (incluso nell'app)"}<br>
      <b>Valido dal:</b> ${regData.validFrom}<br>
      <b>Fonte:</b> ${regData.source}
    `;
    renderGunsList();
    aggiornaPromemoriaBackup();
  }

  // ---------- Modale registrazione ----------

  function huntTypeDelModulo(preselectId) {
    const pre = preselectId ? regData.categories.find(c => c.id === preselectId) : null;
    return (pre && pre.huntType) || selectedHunt || "alta";
  }

  function populateModalCategories(preselectId) {
    const sel = document.getElementById("modalCategory");
    sel.innerHTML = "";

    // Solo le specie del tipo di caccia selezionato in alto
    // (se si parte da una scheda, vale il tipo di caccia di quella categoria).
    const huntType = huntTypeDelModulo(preselectId);

    document.querySelector("#modalBackdrop h3").textContent =
      `Registra abbattimento — ${HUNT_LABELS[huntType] || ""}`;

    for (const c of regData.categories) {
      if (c.huntType !== huntType || !c.windows || c.windows.length === 0) continue;
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.speciesLabel} — ${c.categoryLabel}`;
      sel.appendChild(opt);
    }
    if (preselectId) sel.value = preselectId;
  }

  // ---------- Foto dell'abbattimento ----------
  // Stato del modulo di registrazione: se si sta modificando un abbattimento
  // esistente (editingKillId), e la foto scelta/rimossa in questa sessione.
  let editingKillId = null;
  let currentPhotoBlob = null;
  let currentPhotoRemoved = false;

  // Ridimensiona e comprime la foto prima di salvarla: le foto dirette dalla
  // fotocamera possono pesare diversi MB, troppo per tenerne più di una
  // manciata sul telefono. Restano comunque ben leggibili per rivedere il capo.
  function comprimiImmagine(file, maxLato = 1280, qualita = 0.72) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxLato) { height = Math.round(height * maxLato / width); width = maxLato; }
        else if (height > maxLato) { width = Math.round(width * maxLato / height); height = maxLato; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob); else reject(new Error("Compressione non riuscita"));
        }, "image/jpeg", qualita);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Immagine non valida")); };
      img.src = url;
    });
  }

  function nascondiAnteprimaFoto() {
    const img = document.getElementById("modalPhotoPreview");
    if (img.src && img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
    img.src = "";
    document.getElementById("modalPhotoPreviewWrap").hidden = true;
    document.getElementById("modalPhotoAddBtn").hidden = false;
  }

  function mostraAnteprimaFoto(blob) {
    const img = document.getElementById("modalPhotoPreview");
    if (img.src && img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
    img.src = URL.createObjectURL(blob);
    document.getElementById("modalPhotoPreviewWrap").hidden = false;
    document.getElementById("modalPhotoAddBtn").hidden = true;
  }

  function resetPhotoUI() {
    currentPhotoBlob = null;
    currentPhotoRemoved = false;
    nascondiAnteprimaFoto();
    document.getElementById("modalPhotoStatus").hidden = true;
  }

  function setupPhoto() {
    const apri = () => document.getElementById("modalPhotoInput").click();
    document.getElementById("modalPhotoAddBtn").addEventListener("click", apri);
    document.getElementById("modalPhotoChangeBtn").addEventListener("click", apri);

    document.getElementById("modalPhotoRemoveBtn").addEventListener("click", () => {
      currentPhotoBlob = null;
      currentPhotoRemoved = true;
      nascondiAnteprimaFoto();
    });

    document.getElementById("modalPhotoInput").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      e.target.value = "";
      if (!file) return;
      const status = document.getElementById("modalPhotoStatus");
      status.hidden = false;
      status.textContent = "Sto preparando la foto…";
      try {
        const blob = await comprimiImmagine(file);
        currentPhotoBlob = blob;
        currentPhotoRemoved = false;
        mostraAnteprimaFoto(blob);
        status.hidden = true;
      } catch (err) {
        status.textContent = "Non sono riuscito a leggere questa immagine. Riprova con un'altra foto.";
      }
    });
  }

  // ---------- Luogo di cattura dalle coordinate (carta nazionale swisstopo) ----------
  // Il foglio di controllo chiede "il comune e il luogo di cattura" (art. 29
  // RALCC). Dalle coordinate GPS si leggono, dai servizi ufficiali della
  // Confederazione (geo.admin.ch): il comune dai confini comunali ufficiali e
  // i nomi di luogo più vicini dalla carta nazionale (swissNAMES3D). È solo
  // una proposta: l'utente sceglie, o scrive a mano. Serve la connessione.

  function escapeHtmlLuogo(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // WGS84 -> LV95 (formule approssimate ufficiali swisstopo, errore ~1 m).
  function wgs84ToLv95(lat, lon) {
    const p = (lat * 3600 - 169028.66) / 10000;
    const l = (lon * 3600 - 26782.5) / 10000;
    const E = 2600072.37 + 211455.93 * l - 10938.51 * l * p - 0.36 * l * p * p - 44.54 * l * l * l;
    const N = 1200147.07 + 308807.95 * p + 3745.25 * l * l + 76.63 * p * p
      - 194.56 * l * l * p + 119.79 * p * p * p;
    return { E, N };
  }

  const GEO_IDENTIFY = "https://api3.geo.admin.ch/rest/services/api/MapServer/identify";

  // Con mapExtent 0,0,100,100 e imageDisplay 100,100,100 un pixel vale
  // un metro: la tolleranza diventa così il raggio di ricerca in metri.
  async function geoIdentify(E, N, layer, raggioM) {
    const params = new URLSearchParams({
      geometryType: "esriGeometryPoint",
      geometry: `${E.toFixed(1)},${N.toFixed(1)}`,
      sr: "2056",
      layers: "all:" + layer,
      tolerance: String(raggioM),
      mapExtent: "0,0,100,100",
      imageDisplay: "100,100,100",
      returnGeometry: raggioM > 0 ? "true" : "false",
      geometryFormat: "geojson",
      lang: "it",
      limit: "50",
    });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const r = await fetch(`${GEO_IDENTIFY}?${params}`, { signal: ctrl.signal });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      return Array.isArray(data.results) ? data.results : [];
    } finally {
      clearTimeout(timer);
    }
  }

  function attrLuogo(f) { return f.properties || f.attributes || {}; }

  // Distanza (m) dal punto al tratto AB, con il punto più vicino.
  function distSegmento(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    const x = ax + t * dx, y = ay + t * dy;
    return { d: Math.hypot(x - px, y - py), x, y };
  }

  function puntoInAnello(px, py, anello) {
    let dentro = false;
    for (let i = 0, k = anello.length - 1; i < anello.length; k = i++) {
      const [xi, yi] = anello[i], [xk, yk] = anello[k];
      if ((yi > py) !== (yk > py) && px < (xk - xi) * (py - yi) / (yk - yi) + xi) dentro = !dentro;
    }
    return dentro;
  }

  // Distanza dal punto alla geometria del nome (punto, linea o area): 0 se
  // il punto sta dentro l'area che porta quel nome.
  function distanzaDaGeometria(g, px, py) {
    const nessuno = { d: Infinity, x: px, y: py };
    if (!g || !g.coordinates) return nessuno;
    const c = g.coordinates;
    const daLinee = (linee) => {
      let best = nessuno;
      for (const linea of linee) {
        for (let i = 0; i < linea.length; i++) {
          const a = linea[i], b = linea[i + 1] || linea[i];
          const r = distSegmento(px, py, a[0], a[1], b[0], b[1]);
          if (r.d < best.d) best = r;
        }
      }
      return best;
    };
    switch (g.type) {
      case "Point": return { d: Math.hypot(c[0] - px, c[1] - py), x: c[0], y: c[1] };
      case "MultiPoint": return daLinee(c.map((p) => [p]));
      case "LineString": return daLinee([c]);
      case "MultiLineString": return daLinee(c);
      case "Polygon":
      case "MultiPolygon": {
        const poligoni = g.type === "Polygon" ? [c] : c;
        let best = nessuno;
        for (const pol of poligoni) {
          if (puntoInAnello(px, py, pol[0]) && !pol.slice(1).some((buco) => puntoInAnello(px, py, buco))) {
            return { d: 0, x: px, y: py };
          }
          const r = daLinee(pol);
          if (r.d < best.d) best = r;
        }
        return best;
      }
      default: return nessuno;
    }
  }

  function direzioneCardinale(dx, dy) {
    const nomi = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
    const ang = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
    return nomi[Math.round(ang / 45) % 8];
  }

  // I distretti di caccia ticinesi coincidono con gli 8 distretti politici.
  const DISTRETTI_TI = ["Bellinzona", "Blenio", "Leventina", "Locarno", "Lugano", "Mendrisio", "Riviera", "Vallemaggia"];

  function normalizzaDistretto(nome) {
    if (!nome) return "";
    const pulito = String(nome).replace(/^distretto\s+(di\s+)?/i, "").trim().toLowerCase();
    return DISTRETTI_TI.find((d) => d.toLowerCase() === pulito) || "";
  }

  // Imposta la tendina; un valore non in elenco (vecchi dati) si aggiunge
  // come opzione, per non perderlo modificando l'abbattimento.
  function impostaDistrettoModulo(valore) {
    const sel = document.getElementById("modalDistrict");
    if (valore && ![...sel.options].some((o) => o.value === valore)) {
      const o = document.createElement("option");
      o.value = valore;
      o.textContent = valore;
      sel.appendChild(o);
    }
    sel.value = valore || "";
  }

  async function distrettoDaCoordinate(E, N) {
    const ris = await geoIdentify(E, N, "ch.swisstopo.swissboundaries3d-bezirk-flaeche.fill", 0);
    for (const f of ris) {
      const a = attrLuogo(f);
      const d = normalizzaDistretto(a.name || a.label || a.bezirksname);
      if (d) return d;
    }
    return "";
  }

  async function comuneDaCoordinate(E, N) {
    const ris = await geoIdentify(E, N, "ch.swisstopo.swissboundaries3d-gemeinde-flaeche.fill", 0);
    for (const f of ris) {
      const a = attrLuogo(f);
      const nome = a.gemname || a.label || a.name;
      if (nome) return String(nome).trim();
    }
    return null;
  }

  // Nomi di luogo più vicini: si allarga il raggio a gradini finché se ne
  // trovano almeno 4 diversi, così nei posti isolati non si resta a mani
  // vuote e in quelli ricchi di nomi non si superano i 50 risultati del servizio.
  // swissNAMES3D contiene anche nomi di grandi aree (catene montuose, regioni,
  // valli lunghe) che «contengono» il punto e finivano sempre in cima come
  // «qui», spesso ripetuti in tre lingue (Alpi Lepontine, Alpes Lépontines,
  // Lepontinische Alpen, Sottoceneri…). Non sono un luogo di cattura: si
  // scartano per categoria e, per sicurezza, per estensione.
  const TOPONIMI_ESCLUSI = /gebirge|grossraum|landschaftsname|gebiet|region|massiv/i;
  const TOPONIMO_MAX_ESTENSIONE = 3000; // m: aree più grandi non sono una località

  function estensioneGeometria(g) {
    if (!g || !g.coordinates || g.type === "Point") return 0;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const visita = (c) => {
      if (typeof c[0] === "number") {
        if (c[0] < x0) x0 = c[0]; if (c[0] > x1) x1 = c[0];
        if (c[1] < y0) y0 = c[1]; if (c[1] > y1) y1 = c[1];
      } else c.forEach(visita);
    };
    visita(g.coordinates);
    return Math.hypot(x1 - x0, y1 - y0);
  }

  async function toponimiVicini(E, N) {
    const migliori = new Map();
    const giaVisti = new Set(); // stesso oggetto con il nome in più lingue
    for (const raggio of [150, 500, 1500]) {
      const ris = await geoIdentify(E, N, "ch.swisstopo.swissnames3d", raggio);
      for (const f of ris) {
        const a = attrLuogo(f);
        const nome = (a.name || a.label || "").trim();
        if (!nome) continue;
        if (TOPONIMI_ESCLUSI.test(String(a.objektart || a.objektklasse || ""))) continue;
        if (/^(Polygon|MultiPolygon)$/.test(f.geometry && f.geometry.type) &&
            estensioneGeometria(f.geometry) > TOPONIMO_MAX_ESTENSIONE) continue;
        const chiave = f.featureId != null ? `id:${f.featureId}` : `g:${JSON.stringify(f.geometry).slice(0, 200)}`;
        const prec = migliori.get(nome);
        if (!prec && giaVisti.has(chiave)) continue;
        const r = distanzaDaGeometria(f.geometry, E, N);
        if (!isFinite(r.d)) continue;
        giaVisti.add(chiave);
        if (!prec || r.d < prec.d) migliori.set(nome, { nome, d: r.d, dx: r.x - E, dy: r.y - N });
      }
      if (migliori.size >= 4) break;
    }
    return [...migliori.values()].sort((a, b) => a.d - b.d).slice(0, 5);
  }

  function descriviDistanza(t) {
    if (t.d < 25) return "qui";
    const m = t.d < 1000 ? `${Math.round(t.d / 10) * 10} m` : `${(t.d / 1000).toFixed(1).replace(".", ",")} km`;
    return `${m} a ${direzioneCardinale(t.dx, t.dy)}`;
  }

  // Finestra di proposta: comune + scelta fra i nomi di luogo più vicini.
  async function proponiLuogo(coords) {
    if (!coords) return;
    const backdrop = document.getElementById("placeBackdrop");
    const stato = document.getElementById("placeStatus");
    const opzioni = document.getElementById("placeOptions");
    const piede = document.getElementById("placeFooter");
    const btnUsa = document.getElementById("placeUse");
    const btnAnnulla = document.getElementById("placeCancel");

    stato.textContent = "Cerco comune e località sulla carta nazionale…";
    opzioni.innerHTML = "";
    piede.innerHTML = "";
    btnUsa.hidden = true;
    btnAnnulla.textContent = "Annulla";
    backdrop.classList.add("active");

    let chiusa = false;
    const chiudi = () => {
      chiusa = true;
      backdrop.classList.remove("active");
      btnUsa.onclick = null;
      btnAnnulla.onclick = null;
    };
    btnAnnulla.onclick = chiudi;

    const { E, N } = wgs84ToLv95(coords.lat, coords.lon);
    let comune, toponimi, distretto;
    try {
      [comune, toponimi, distretto] = await Promise.all([
        comuneDaCoordinate(E, N),
        toponimiVicini(E, N),
        distrettoDaCoordinate(E, N).catch(() => ""), // se manca, il resto vale comunque
      ]);
    } catch (e) {
      if (chiusa) return;
      stato.textContent = "Non riesco a leggere la carta nazionale, probabilmente manca la connessione. " +
        "Le coordinate restano salvate: puoi compilare il luogo più tardi con «compila il luogo», " +
        "anche aprendo «Modifica» sull'abbattimento.";
      btnAnnulla.textContent = "Chiudi";
      return;
    }
    if (chiusa) return;

    if (!comune) {
      stato.textContent = "Questa posizione non risulta in un comune svizzero. Scrivi il luogo a mano.";
      btnAnnulla.textContent = "Chiudi";
      return;
    }

    stato.innerHTML = `Comune: <b>${escapeHtmlLuogo(comune)}</b>` +
      (distretto ? ` · Distretto: <b>${escapeHtmlLuogo(distretto)}</b>` : "") +
      `.<br>Scegli la località da riportare:`;

    const scelte = toponimi.map((t) => ({ testo: `${comune} – ${t.nome}`, nome: t.nome, dettaglio: descriviDistanza(t) }));
    scelte.push({ testo: comune, nome: "Solo il comune", dettaglio: "la località la scrivi tu" });
    scelte.forEach((s, i) => {
      const riga = document.createElement("div");
      riga.className = "altitude-toggle";
      riga.style.marginBottom = "8px";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "placeChoice";
      input.id = "placeChoice" + i;
      input.value = s.testo;
      if (i === 0) input.checked = true;
      const label = document.createElement("label");
      label.htmlFor = input.id;
      const b = document.createElement("b");
      b.textContent = s.nome;
      label.appendChild(b);
      label.appendChild(document.createTextNode(` — ${s.dettaglio}`));
      riga.appendChild(input);
      riga.appendChild(label);
      opzioni.appendChild(riga);
    });

    const avvisi = [];
    if (coords.acc && coords.acc > 30) {
      avvisi.push(`Precisione GPS di circa ±${Math.round(coords.acc)} m: se possibile aggiorna la posizione all'aperto prima di scegliere.`);
    }
    avvisi.push("I nomi vengono dalla carta nazionale: il più vicino non è per forza quello che usi tu. Controlla prima di scriverlo sul foglio di controllo.");
    piede.innerHTML = avvisi.map(escapeHtmlLuogo).join("<br>") +
      `<br><a href="https://map.geo.admin.ch/?lang=it&E=${Math.round(E)}&N=${Math.round(N)}&zoom=10&crosshair=marker" target="_blank" rel="noopener">Verifica sulla carta nazionale</a>`;

    btnUsa.hidden = false;
    btnUsa.onclick = () => {
      const scelta = opzioni.querySelector('input[name="placeChoice"]:checked');
      if (scelta) document.getElementById("modalPlace").value = scelta.value;
      if (distretto) impostaDistrettoModulo(distretto);
      chiudi();
    };
  }

  // Posizione del capo abbattuto: facoltativa e alternativa alle note scritte
  // a mano. Tenuta in memoria qui finché il modulo è aperto, poi salvata
  // nell'abbattimento insieme al resto.
  // ---------- Dove mi trovo: bandite di caccia e distretto ----------
  // I confini delle bandite cantonali sono dentro l'app (data/bandite_cantonali.json)
  // e il controllo si fa sul telefono, quindi funziona anche senza rete. Il
  // distretto e il comune invece arrivano da swisstopo e servono la rete: se
  // manca, la parte sulle bandite resta valida lo stesso.
  // L'app non dice mai «qui puoi cacciare»: segnala dentro/vicino/sul confine,
  // perché per i confini esatti fa stato la descrizione del decreto e il GPS
  // in montagna sbaglia di parecchi metri.

  let banditeData = null;     // bandite cantonali
  let federaliData = null;    // bandite federali (inventario UFAM)
  let tranquillitaData = null; // zone di tranquillità per la fauna selvatica
  let doveStato = null; // { E, N, acc, ora, distretto, comune, rete: 'ok'|'no'|'attesa' }
  const DOVE_RAGGIO_VICINE = 1000; // m
  const DOVE_MARGINE_MIN = 25;     // m: sotto questa distanza dal confine è sempre «da verificare»

  async function caricaJson(url) {
    try {
      const res = await fetch(url);
      return res.ok ? await res.json() : null;
    } catch (e) {
      return null;
    }
  }

  async function loadBanditeData() {
    [banditeData, federaliData, tranquillitaData] = await Promise.all([
      banditeData || caricaJson("data/bandite_cantonali.json"),
      federaliData || caricaJson("data/bandite_federali.json"),
      tranquillitaData || caricaJson("data/zone_tranquillita.json"),
    ]);
  }

  const TIPO_BANDITA = {
    totale: "Bandita totale",
    alta: "Bandita di caccia alta",
    bassa: "Bandita di caccia bassa",
    camoscio: "Bandita camoscio",
    marmotta: "Bandita marmotta",
    fagiano: "Bandita fagiano di monte",
    camoscio_fagiano: "Bandita camoscio e fagiano di monte",
    fed_integrale: "Bandita federale, protezione integrale",
    fed_parziale: "Bandita federale, protezione parziale",
    fed_danni: "Bandita federale, perimetro danni della selvaggina",
  };

  // Cosa vieta la bandita per il tipo di caccia scelto in alto.
  // null = non riguarda questa caccia; specie vuota = vietata tutta questa caccia.
  function divietoBandita(tipo, hunt) {
    switch (tipo) {
      case "totale": return { specie: [], testo: "vietata ogni caccia" };
      // Bandite federali: valgono per ogni tipo di caccia. Nella protezione
      // parziale e nel perimetro danni la scheda federale può ammettere
      // determinate specie o abbattimenti ordinati dal Cantone: l'app non
      // lo decide, lo segnala in giallo da verificare.
      case "fed_integrale": return { specie: [], testo: "vietata ogni caccia" };
      case "fed_parziale": return { specie: ["scheda"], testo: "caccia ammessa solo per le specie indicate nella scheda federale: verifica" };
      case "fed_danni": return { specie: ["scheda"], testo: "possibili abbattimenti ordinati dal Cantone per danni della selvaggina: verifica" };
      case "alta": return hunt === "alta" ? { specie: [], testo: "vietata la caccia alta" } : null;
      case "bassa": return hunt === "bassa" ? { specie: [], testo: "vietata la caccia bassa" } : null;
      case "camoscio": return hunt === "alta" ? { specie: ["Camoscio"], testo: "vietata la caccia al camoscio" } : null;
      case "marmotta": return hunt === "alta" ? { specie: ["Marmotta"], testo: "vietata la caccia alla marmotta" } : null;
      case "fagiano": return hunt === "bassa" ? { specie: ["Fagiano di monte"], testo: "vietata la caccia al fagiano di monte" } : null;
      case "camoscio_fagiano":
        if (hunt === "alta") return { specie: ["Camoscio"], testo: "vietata la caccia al camoscio" };
        if (hunt === "bassa") return { specie: ["Fagiano di monte"], testo: "vietata la caccia al fagiano di monte" };
        return null;
      default: return null;
    }
  }

  // Distanza dal confine (anche stando dentro) e se il punto è dentro.
  function posizioneRispettoBandita(b, E, N) {
    let dentro = false;
    let best = { d: Infinity, x: E, y: N };
    for (const pol of b.poligoni) {
      if (puntoInAnello(E, N, pol[0]) && !pol.slice(1).some((buco) => puntoInAnello(E, N, buco))) dentro = true;
      for (const anello of pol) {
        for (let i = 0; i < anello.length - 1; i++) {
          const a = anello[i], c = anello[i + 1];
          const r = distSegmento(E, N, a[0], a[1], c[0], c[1]);
          if (r.d < best.d) best = r;
        }
      }
    }
    return { dentro, d: best.d, dir: direzioneCardinale(best.x - E, best.y - N) };
  }

  function banditeVicine(lista, E, N) {
    if (!lista) return [];
    const r = DOVE_RAGGIO_VICINE;
    const out = [];
    for (const b of lista) {
      const [e0, n0, e1, n1] = b.bbox;
      if (E < e0 - r || E > e1 + r || N < n0 - r || N > n1 + r) continue;
      const p = posizioneRispettoBandita(b, E, N);
      if (p.dentro || p.d <= r) out.push({ b, ...p });
    }
    // prima quelle in cui sei dentro, poi le più vicine
    return out.sort((x, y) => (y.dentro - x.dentro) || (x.d - y.d));
  }

  // Link corto del geoportale con bandite cantonali, federali e zone di
  // tranquillità già accese. La versione mobile ignora i parametri
  // tree_group_layers_ nell'URL lungo, ma il link corto funziona.
  // Non è centrato sulla posizione: l'utente tocca il pulsante posizione
  // del geoportale per centrarsi.
  function linkCartinaCantone(/* E, N non usati */) {
    return "https://map.geo.ti.ch/s/ObAF";
  }
  function linkCartaNazionale(E, N) {
    return `https://map.geo.admin.ch/?lang=it&E=${Math.round(E)}&N=${Math.round(N)}&zoom=10&crosshair=marker` +
      `&layers=ch.bafu.bundesinventare-jagdbanngebiete,ch.bafu.wrz-wildruhezonen_portal`;
  }

  function metri(d) {
    return d < 1000 ? `${Math.round(d / 5) * 5} m` : `${(d / 1000).toFixed(1).replace(".", ",")} km`;
  }

  function rigaBandita(v, hunt, margine) {
    const b = v.b;
    const div = divietoBandita(b.tipo, hunt);
    const sulConfine = v.d <= margine;
    let cls, stato;
    if (v.dentro && !sulConfine) {
      cls = div && div.specie.length === 0 ? "dove-dentro" : "dove-verifica";
      stato = `Sei <b>dentro</b>`;
    } else if (sulConfine) {
      cls = "dove-verifica";
      stato = `Sei <b>sul confine</b>, ${v.dentro ? "appena dentro" : "appena fuori"} (${metri(v.d)}) — da verificare`;
    } else {
      cls = "dove-vicina";
      stato = `Confine a <b>${metri(v.d)}</b> verso ${v.dir}`;
    }
    const desc = b.scheda
      ? `<div class="dove-desc"><a href="${b.scheda}" target="_blank" rel="noopener">Scheda federale della zona n. ${b.n} (PDF, serve la rete)</a></div>`
      : b.desc
      ? `<details class="dove-desc"><summary>Confine secondo il decreto</summary><div>${escapeHtmlLuogo(b.desc)}</div></details>`
      : "";
    return `<div class="dove-bandita ${cls}">
      <div class="dove-nome">${escapeHtmlLuogo(b.nome)} <span class="dove-tipo">· ${TIPO_BANDITA[b.tipo] || b.tipo}${b.distretto ? " · " + escapeHtmlLuogo(b.distretto) : ""}</span></div>
      <div>${stato}${div ? ` — ${div.testo}` : ""}</div>
      ${desc}
    </div>`;
  }

  // Zone di tranquillità: limitano l'accesso (divieto, obbligo di restare sui
  // sentieri, cani al guinzaglio…) in certi periodi dell'anno. Non sono
  // bandite di caccia, ma valgono anche per il cacciatore: si segnala se la
  // data scelta cade nel periodo di protezione.
  function zonaInVigore(z, data) {
    if (z.periodi === "annuale") return true;
    const md = (data.getMonth() + 1) * 100 + data.getDate();
    return z.periodi.some(([m1, g1, m2, g2]) => {
      const da = m1 * 100 + g1, a = m2 * 100 + g2;
      return da <= a ? md >= da && md <= a : md >= da || md <= a; // periodo a cavallo di capodanno
    });
  }

  function rigaZonaTranquillita(v, margine) {
    const z = v.b;
    const attiva = zonaInVigore(z, selectedDate);
    const regola = [z.disposizione, z.regola].filter(Boolean).join(". ") || "Disposizioni particolari: vedi il decreto";
    const sulConfine = v.d <= margine;
    let cls = "dove-vicina", stato;
    if (v.dentro && !sulConfine) {
      stato = "Sei <b>dentro</b>";
      if (attiva) cls = /divieto di accesso/i.test(regola) ? "dove-dentro" : "dove-verifica";
    } else if (sulConfine) {
      stato = `Sei <b>sul confine</b>, ${v.dentro ? "appena dentro" : "appena fuori"} (${metri(v.d)})`;
      if (attiva) cls = "dove-verifica";
    } else {
      stato = `Confine a <b>${metri(v.d)}</b> verso ${v.dir}`;
    }
    const quando = attiva ? `<b>in vigore il ${formatDateCH(RulesEngine.toISO(selectedDate))}</b>` : "non in vigore nella data scelta";
    return `<div class="dove-bandita ${cls}">
      <div class="dove-nome">${escapeHtmlLuogo(z.nome)} <span class="dove-tipo">· Zona di tranquillità${z.vincolante ? "" : " (raccomandata)"}</span></div>
      <div>${stato}</div>
      <div class="dove-nota">${escapeHtmlLuogo(regola)} — ${escapeHtmlLuogo(z.periodoTesto)}, ${quando}</div>
    </div>`;
  }

  // Distretto: confronta con l'art. 44 (regData.zones) le specie del tipo di
  // caccia scelto. È un aiuto alla lettura, non un'interpretazione: dove il
  // testo pone limiti che l'app non può verificare, lo dice e mostra il testo.
  function statoDistrettoSpecie(z, distretto, comune) {
    const cont = (t, parola) => !!t && !!parola &&
      new RegExp("(^|[^\\p{L}])" + parola.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^\\p{L}])", "iu").test(t);
    // le condizioni contano solo se nominano questo distretto
    const cond = z.condizioni && cont(z.condizioni, distretto) ? z.condizioni : "";
    const aperta = cond ? { cls: "status-check", label: "Aperta, con condizioni", testo: cond }
      : { cls: "status-open", label: "Aperta", testo: "" };
    if (z.chiuso && /distrett/i.test(z.chiuso) && cont(z.chiuso, distretto)) {
      return { cls: "status-closed", label: "Chiusa nel distretto", testo: z.chiuso };
    }
    if (z.aperto) {
      if (cont(z.aperto, distretto)) {
        // il pezzo di frase che nomina il distretto (le virgole dentro le parentesi non spezzano)
        const pezzi = z.aperto.split(/[;,.](?![^(]*\))|\s+e\s+(?![^(]*\))/);
        const pezzo = (pezzi.find((t) => cont(t, distretto)) || "").trim();
        if (/esclus|solo|sopra|sotto|a sinistra|a destra/i.test(pezzo)) {
          return { cls: "status-check", label: "Aperta in parte", testo: pezzo };
        }
      } else if (!/^(tutt|resto del territorio)/i.test(z.aperto.trim())) {
        return { cls: "status-closed", label: "Chiusa nel distretto", testo: `Il distretto di ${distretto} non è tra quelli aperti. ${z.aperto}` };
      }
    }
    if (z.chiuso && !/distrett/i.test(z.chiuso)) {
      if (!comune) return { cls: "status-check", label: "Chiusa in alcuni comuni", testo: z.chiuso };
      if (cont(z.chiuso, comune)) return { cls: "status-check", label: "Verifica: il tuo comune è citato", testo: z.chiuso };
    }
    return aperta;
  }

  function renderDistrettoDove(hunt) {
    const s = doveStato;
    if (s.rete === "attesa") return `<div class="dove-nota">Cerco distretto e comune sulla carta nazionale…</div>`;
    if (!s.distretto) {
      return `<div class="dove-nota">Distretto non disponibile${s.rete === "no" ? " senza rete" : ""}: il controllo delle bandite qui sopra vale comunque, perché è fatto sul telefono.</div>`;
    }
    const zones = (regData && regData.zones) || {};
    const specie = [...new Set(regData.categories.filter((c) => c.huntType === hunt).map((c) => c.speciesLabel))];
    const righe = [];
    for (const sp of specie) {
      const z = zones[sp.toLowerCase()];
      if (!z) continue;
      const st = statoDistrettoSpecie(z, s.distretto, s.comune);
      if (!st) continue;
      righe.push(`<div class="dove-specie"><span>${sp}</span><span class="status-pill ${st.cls}">${st.label}</span></div>` +
        (st.testo ? `<div class="dove-nota">${escapeHtmlLuogo(st.testo)}</div>` : ""));
    }
    const generale = hunt === "alta" && s.distretto === "Bellinzona" ? zones._caccia_alta
      : hunt === "acquatica" ? zones._caccia_acquatica : "";
    return `<div class="dove-sotto">Distretto: <b>${s.distretto}</b>${s.comune ? ` · Comune: <b>${escapeHtmlLuogo(s.comune)}</b>` : ""}</div>` +
      (generale ? `<div class="dove-nota dove-avviso">${escapeHtmlLuogo(generale)}</div>` : "") +
      (righe.length ? righe.join("") : `<div class="dove-nota">Nessuna limitazione per distretto indicata per ${HUNT_LABELS[hunt].toLowerCase()}.</div>`);
  }

  function renderDoveSono() {
    const box = document.getElementById("doveContent");
    if (!box) return;
    const hunt = selectedHunt || "alta";
    const nomeCaccia = HUNT_LABELS[hunt].toLowerCase();
    const fonte = banditeData
      ? `<div class="dove-fonte">Bandite cantonali dal Geoportale Ticino (${escapeHtmlLuogo(banditeData.decreto)}, dati aggiornati al ${formatDateCH(banditeData.dataMutazione)})` +
        (federaliData ? `; bandite federali dall'inventario UFAM (revisione ${escapeHtmlLuogo(federaliData.revisione)})` : "") +
        (tranquillitaData ? `; zone di tranquillità dal Geoportale Ticino (<a href="${tranquillitaData.link}" target="_blank" rel="noopener">decreto</a>)` : "") +
        `. Non comprende il limite dei 50 m da abitazioni e strutture. Fanno stato i testi ufficiali e la segnaletica sul terreno.</div>`
      : `<div class="dove-fonte">Confini delle bandite non caricati: riapri l'app con la rete almeno una volta.</div>`;

    let corpo = "";
    if (!doveStato || (doveStato.E === undefined && !doveStato.errore)) {
      corpo = `<div class="dove-nota">Controlla se sei dentro o vicino a una bandita cantonale o federale che riguarda la ${nomeCaccia}, o a una zona di tranquillità, e cosa dice il regolamento per il distretto in cui ti trovi. Bandite e zone si controllano anche senza rete.</div>`;
    } else if (doveStato.errore) {
      corpo = `<div class="dove-nota dove-avviso">${escapeHtmlLuogo(doveStato.errore)}</div>`;
    } else {
      const { E, N, acc } = doveStato;
      const margine = Math.max(DOVE_MARGINE_MIN, acc || 0);
      const vicine = [
        ...banditeVicine(banditeData && banditeData.bandite, E, N),
        ...banditeVicine(federaliData && federaliData.bandite, E, N),
      ].sort((x, y) => (y.dentro - x.dentro) || (x.d - y.d));
      const pertinenti = vicine.filter((v) => divietoBandita(v.b.tipo, hunt));
      const altre = vicine.filter((v) => !divietoBandita(v.b.tipo, hunt));
      const zoneTr = banditeVicine(tranquillitaData && tranquillitaData.zone, E, N);
      const ora = doveStato.ora.toLocaleTimeString("it-CH", { hour: "2-digit", minute: "2-digit" });

      corpo += `<div class="dove-sotto">Posizione delle ${ora}, precisione ±${Math.round(acc)} m${acc > 50 ? " — <b>bassa</b>, riprova all'aperto" : ""}</div>`;
      corpo += `<div class="dove-titolo">Bandite che riguardano la ${nomeCaccia}</div>`;
      corpo += pertinenti.length
        ? pertinenti.map((v) => rigaBandita(v, hunt, margine)).join("")
        : `<div class="dove-bandita dove-libera">Nessuna bandita, cantonale o federale, della ${nomeCaccia} entro ${metri(DOVE_RAGGIO_VICINE)}.</div>`;
      if (altre.length) {
        corpo += `<details class="dove-altre"><summary>Altre bandite vicine, non riguardano la ${nomeCaccia} (${altre.length})</summary>${altre.map((v) => rigaBandita(v, hunt, margine)).join("")}</details>`;
      }
      corpo += `<div class="dove-titolo">Zone di tranquillità per la fauna</div>`;
      corpo += zoneTr.length
        ? zoneTr.map((v) => rigaZonaTranquillita(v, margine)).join("")
        : `<div class="dove-nota">Nessuna zona di tranquillità entro ${metri(DOVE_RAGGIO_VICINE)}.</div>`;
      corpo += `<div class="dove-titolo">Distretto e regolamento (art. 44)</div>` + renderDistrettoDove(hunt);
      corpo += `<a class="btn secondary dove-link" href="${linkCartinaCantone(E, N)}" target="_blank" rel="noopener">Apri qui la cartina della caccia del Cantone</a>`;
      corpo += `<a class="btn secondary dove-link" href="${linkCartaNazionale(E, N)}" target="_blank" rel="noopener">Apri qui la carta nazionale</a>`;
    }
    const inCorso = doveStato && doveStato.cerca;
    box.innerHTML = corpo +
      `<button class="btn dove-btn" id="doveBtn" ${inCorso ? "disabled" : ""}>${inCorso ? "Cerco la posizione…" : doveStato && !doveStato.errore ? "Aggiorna la posizione" : "Controlla la mia posizione"}</button>` +
      fonte;
    document.getElementById("doveBtn").addEventListener("click", controllaDoveSono);
  }

  async function controllaDoveSono() {
    doveStato = { ...(doveStato && !doveStato.errore ? doveStato : {}), cerca: true };
    renderDoveSono();
    let pos;
    try {
      pos = await getPosition();
    } catch (err) {
      doveStato = { errore: err && err.code ? geoErrorText(err).replace(", oppure chiama direttamente", "") : "Non riesco a ottenere la posizione." };
      renderDoveSono();
      return;
    }
    if (!banditeData || !federaliData || !tranquillitaData) await loadBanditeData();
    const { E, N } = wgs84ToLv95(pos.coords.latitude, pos.coords.longitude);
    doveStato = { E, N, acc: pos.coords.accuracy || 0, ora: new Date(), distretto: "", comune: "", rete: "attesa" };
    renderDoveSono();
    const mio = doveStato;
    const [distretto, comune] = await Promise.all([
      distrettoDaCoordinate(E, N).catch(() => null),
      comuneDaCoordinate(E, N).catch(() => null),
    ]);
    if (doveStato !== mio) return; // nel frattempo è partita un'altra ricerca
    doveStato.distretto = distretto || "";
    doveStato.comune = comune || "";
    doveStato.rete = distretto === null && comune === null ? "no" : "ok";
    renderDoveSono();
  }

  let posizioneModulo = null;

  function impostaPosizioneModulo(coords) {
    posizioneModulo = coords;
    const info = document.getElementById("modalGpsInfo");
    const btn = document.getElementById("modalGpsBtn");
    if (coords) {
      info.hidden = false;
      info.innerHTML = `📍 Posizione salvata: ${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}` +
        (coords.acc ? ` (±${Math.round(coords.acc)} m)` : "") +
        ` — <a href="#" id="modalGpsFill">compila il luogo</a> · <a href="#" id="modalGpsRemove">rimuovi</a>`;
      btn.textContent = "📍 Aggiorna la posizione";
      const compila = document.getElementById("modalGpsFill");
      if (compila) {
        compila.addEventListener("click", (e) => {
          e.preventDefault();
          proponiLuogo(posizioneModulo);
        });
      }
      const rimuovi = document.getElementById("modalGpsRemove");
      if (rimuovi) {
        rimuovi.addEventListener("click", (e) => {
          e.preventDefault();
          impostaPosizioneModulo(null);
        });
      }
    } else {
      info.hidden = true;
      info.textContent = "";
      btn.textContent = "📍 Salva la posizione attuale";
    }
  }

  function openModal(preselectId) {
    editingKillId = null;
    resetPhotoUI();
    populateModalCategories(preselectId);
    document.getElementById("modalDate").value = RulesEngine.toISO(selectedDate);
    document.getElementById("modalNote").value = "";
    document.getElementById("modalPlace").value = "";
    document.getElementById("modalDistrict").value = "";
    impostaPosizioneModulo(null);
    const huntType = huntTypeDelModulo(preselectId);
    const gunsAdatti = popolaSelectArmi(huntType);
    document.getElementById("modalGun").value = "";

    const hasGuns = gunsAdatti.length > 0;
    document.getElementById("modalGunFieldWrap").hidden = !hasGuns;
    document.getElementById("modalGunSuggest").hidden = hasGuns;
    document.getElementById("modalGunSuggest").textContent = huntType === "alta"
      ? "Non hai ancora registrato un fucile a canna rigata. Aggiungine uno per trovarlo pronto qui la prossima volta."
      : "Non hai ancora registrato un fucile a canna liscia. Aggiungine uno per trovarlo pronto qui la prossima volta.";
    document.getElementById("modalGunManageLink").textContent =
      hasGuns ? "Gestisci i miei fucili →" : "+ Aggiungi il tuo primo fucile →";

    document.getElementById("modalAmmoType").value = "";
    document.getElementById("modalBulletWeight").value = "";
    document.getElementById("modalBulletWeightUnit").value = "g";
    // Munizione a palla e peso hanno senso solo per la carabina: in caccia
    // bassa e acquatica, dove si usa la canna liscia, restano nascosti.
    document.getElementById("modalBulletFields").hidden = huntType !== "alta";
    document.getElementById("modalBackdrop").classList.add("active");
  }

  // Riapre il modulo già compilato per correggere un abbattimento esistente:
  // specie, arma, note e foto comprese. Al salvataggio aggiorna la voce
  // invece di crearne una nuova.
  async function openModalForEdit(killId) {
    const k = Storage.getLog().find(x => x.id === killId);
    if (!k) return;
    editingKillId = killId;

    populateModalCategories(k.categoryId);
    document.getElementById("modalTitle").textContent = "Modifica abbattimento";
    document.getElementById("modalCategory").value = k.categoryId;
    document.getElementById("modalDate").value = k.date;
    document.getElementById("modalNote").value = k.note || "";
    document.getElementById("modalPlace").value = k.place || "";
    impostaDistrettoModulo(k.district || "");
    impostaPosizioneModulo(k.coords || null);

    const huntType = huntTypeDelModulo(k.categoryId);
    const gunsAdatti = popolaSelectArmi(huntType);
    const hasGuns = gunsAdatti.length > 0;
    document.getElementById("modalGunFieldWrap").hidden = !hasGuns;
    document.getElementById("modalGunSuggest").hidden = hasGuns;
    document.getElementById("modalGunManageLink").textContent =
      hasGuns ? "Gestisci i miei fucili →" : "+ Aggiungi il tuo primo fucile →";
    document.getElementById("modalGun").value = k.gunId || "";

    document.getElementById("modalBulletFields").hidden = huntType !== "alta";
    document.getElementById("modalAmmoType").value = k.ammoType || "";
    document.getElementById("modalBulletWeight").value = k.bulletWeight != null ? k.bulletWeight : "";
    document.getElementById("modalBulletWeightUnit").value = k.bulletWeightUnit || "g";

    resetPhotoUI();
    if (k.photoId) {
      try {
        const blob = await Storage.getPhoto(k.photoId);
        if (blob) mostraAnteprimaFoto(blob);
      } catch (e) { /* la foto non si carica: si può comunque continuare */ }
    }

    document.getElementById("modalBackdrop").classList.add("active");
  }

  function closeModal() {
    document.getElementById("modalBackdrop").classList.remove("active");
  }

  async function saveModal() {
    const categoryId = document.getElementById("modalCategory").value;
    const date = document.getElementById("modalDate").value;
    const note = document.getElementById("modalNote").value.trim();
    if (!categoryId || !date) return;
    const gunId = document.getElementById("modalGun").value || null;

    // Munizione e peso della palla valgono solo per la carabina (canna rigata):
    // se il campo è nascosto (caccia bassa/acquatica) non si salva nulla.
    const bulletFieldsVisibili = !document.getElementById("modalBulletFields").hidden;
    const ammoType = bulletFieldsVisibili ? (document.getElementById("modalAmmoType").value || "") : "";
    const bulletWeightRaw = bulletFieldsVisibili ? document.getElementById("modalBulletWeight").value : "";
    const bulletWeight = bulletWeightRaw ? parseFloat(bulletWeightRaw) : null;
    const bulletWeightUnit = document.getElementById("modalBulletWeightUnit").value;

    const entry = { categoryId, date, note, gunId, ammoType, bulletWeight, bulletWeightUnit };
    // coords: presente solo se una posizione è stata salvata. In modifica,
    // toglierla deve davvero rimuoverla dall'abbattimento, non lasciare la
    // vecchia: per questo si assegna sempre, anche a null.
    entry.coords = posizioneModulo || null;
    entry.place = document.getElementById("modalPlace").value.trim();
    entry.district = document.getElementById("modalDistrict").value || "";

    // Foto: si tocca IndexedDB solo se qualcosa è davvero cambiato in questa
    // sessione del modulo, per non riscrivere inutilmente una foto invariata.
    const existingPhotoId = editingKillId
      ? (Storage.getLog().find(k => k.id === editingKillId) || {}).photoId
      : null;

    if (currentPhotoBlob) {
      const photoId = existingPhotoId || ("p_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7));
      await Storage.savePhoto(photoId, currentPhotoBlob);
      entry.photoId = photoId;
    } else if (currentPhotoRemoved && existingPhotoId) {
      await Storage.deletePhoto(existingPhotoId);
      entry.photoId = null;
    }

    if (editingKillId) {
      Storage.updateKill(editingKillId, entry);
    } else {
      Storage.addKill(entry);
    }

    if (!document.getElementById("registroStatistiche").classList.contains("hidden")) renderStatistiche();
    closeModal();
    renderOggi();
    renderRegistro();
  }

  // ---------- Navigazione ----------

  function switchView(name) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.getElementById("view-" + name).classList.add("active");
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.view === name));
    if (name === "oggi") renderOggi();
    if (name === "registro") renderRegistro();
    if (name === "impostazioni") renderImpostazioni();
    if (name === "regolamento") renderInfo();
  }

  // ---------- Init ----------

  // ---------- Invito a installare l'app ----------
  // Android/Chrome: usa il prompt nativo del browser (evento beforeinstallprompt).
  // iPhone/iPad: Safari non ha un prompt, quindi mostra come fare a mano.
  // Non compare se l'app è già installata; "Non ora" lo nasconde per 14 giorni.

  const KEY_INSTALL_SNOOZE = "cacciaTI_install_snooze_until";
  const INSTALL_SNOOZE_DAYS = 14;
  let deferredInstall = null;
  let installWanted = false;

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function installSnoozed() {
    return Date.now() < Number(localStorage.getItem(KEY_INSTALL_SNOOZE) || 0);
  }

  function hideInstallBanner() {
    document.getElementById("installBanner").classList.add("hidden");
  }

  function showInstallBanner() {
    installWanted = true;
    if (isStandalone() || installSnoozed()) return;
    if (!Storage.hasAckedDisclaimer()) return; // prima la manleva, poi l'invito
    document.getElementById("installBanner").classList.remove("hidden");
  }

  function setupInstallPrompt() {
    const btn = document.getElementById("installBtn");

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();          // al posto della barra del browser mostriamo il nostro invito
      deferredInstall = e;
      btn.hidden = false;
      showInstallBanner();
    });

    window.addEventListener("appinstalled", () => {
      deferredInstall = null;
      hideInstallBanner();
    });

    if (isIOS() && !isStandalone()) {
      document.getElementById("installHint").textContent =
        "Tocca Condividi (il quadrato con la freccia in su) e poi «Aggiungi alla schermata Home»: " +
        "così i dati della tua stagione restano più al sicuro nel tempo.";
      btn.hidden = true;
      setTimeout(showInstallBanner, 1200);
    }

    btn.addEventListener("click", async () => {
      if (!deferredInstall) return;
      deferredInstall.prompt();
      const choice = await deferredInstall.userChoice;
      deferredInstall = null;
      hideInstallBanner();
      if (!choice || choice.outcome !== "accepted") {
        localStorage.setItem(KEY_INSTALL_SNOOZE, String(Date.now() + INSTALL_SNOOZE_DAYS * 86400000));
      }
    });

    document.getElementById("installLater").addEventListener("click", () => {
      localStorage.setItem(KEY_INSTALL_SNOOZE, String(Date.now() + INSTALL_SNOOZE_DAYS * 86400000));
      hideInstallBanner();
    });
  }

  // Segnala a GoatCounter se l'app è aperta dall'icona (installata) o dal
  // browser, con due "pagine" finte. Nel pannello: la riga /app-installata,
  // guardata su mese/anno, indica quanto viene usata l'app installata.
  // Conta le aperture, non le persone: per le persone distinte guarda la
  // colonna "visitatori unici" di quella riga.
  function segnalaModalitaUso() {
    if (typeof window.goatcounter === "undefined" || !window.goatcounter.count) return;
    const path = isStandalone() ? "/app-installata" : "/nel-browser";
    // piccolo ritardo: lascia caricare lo script del contatore
    setTimeout(() => {
      try { window.goatcounter.count({ path, title: path, event: false }); } catch (e) {}
    }, 1500);
  }

  // Chiede al browser di non cancellare i dati dell'app sotto pressione di
  // spazio. Silenzioso: se il browser non supporta la richiesta (es. Safari
  // su iPhone) non succede nulla di visibile, semplicemente non si applica —
  // su iPhone la protezione arriva dall'aver installato l'app, non da qui.
  function chiediConservazionePersistente() {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
  }

  async function init() {
    setupInstallPrompt(); // subito, per non perdere l'evento del browser
    segnalaModalitaUso();
    chiediConservazionePersistente();

    if (!Storage.hasAckedDisclaimer()) {
      document.getElementById("disclaimerAck").addEventListener("click", () => {
        Storage.setAckedDisclaimer();
        document.getElementById("disclaimerGate").classList.add("hidden");
        if (installWanted) showInstallBanner();
      });
    } else {
      document.getElementById("disclaimerGate").classList.add("hidden");
    }

    await loadRegData();
    loadContingenteData().then(renderOggi); // aggiorna la vista quando arriva (non blocca l'avvio)
    loadBanditeData().then(renderDoveSono); // confini bandite, per il controllo offline della posizione

    const dateInput = document.getElementById("dateInput");
    dateInput.value = RulesEngine.toISO(selectedDate);
    dateInput.addEventListener("change", () => {
      if (dateInput.value) {
        selectedDate = RulesEngine.parseISO(dateInput.value);
        renderOggi();
      }
    });

    document.getElementById("todayBtn").addEventListener("click", () => {
      selectedDate = new Date();
      dateInput.value = RulesEngine.toISO(selectedDate);
      renderOggi();
    });

    document.getElementById("altitudeToggle").checked = !!prefs.altitudeBelow400;
    document.getElementById("altitudeToggle").addEventListener("change", (e) => {
      prefs.altitudeBelow400 = e.target.checked;
      Storage.savePrefs(prefs);
      renderOggi();
    });

    document.getElementById("searchInput").addEventListener("input", renderOggi);

    document.getElementById("huntTabs").addEventListener("click", (e) => {
      const btn = e.target.closest(".hunt-tab");
      if (!btn) return;
      selectedHunt = btn.dataset.hunt;
      altaSubView = "stagione"; // si riparte sempre dalla stagione in corso
      renderOggi();
    });

    document.getElementById("altaSubTabs").addEventListener("click", (e) => {
      const btn = e.target.closest(".subtab");
      if (!btn) return;
      altaSubView = btn.dataset.sub;
      renderOggi();
    });

    document.querySelectorAll(".tab-btn").forEach(b => {
      b.addEventListener("click", () => switchView(b.dataset.view));
    });

    document.getElementById("fabAdd").addEventListener("click", () => openModal(null));

    document.getElementById("modalGunManageLink").addEventListener("click", () => {
      const huntType = huntTypeDelModulo(document.getElementById("modalCategory").value);
      const hasGuns = Storage.getGuns().some(g => fucileAdattoAHuntType(g, huntType));
      closeModal();
      switchView("impostazioni");
      document.getElementById("gunsSection").scrollIntoView({ block: "start" });
      // nessun fucile adatto ancora: apre subito il modulo, già sul tipo di canna giusto
      if (!hasGuns) openGunModal(huntType === "alta" ? "rigata" : "liscia");
    });
    document.getElementById("modalCancel").addEventListener("click", closeModal);
    document.getElementById("modalSave").addEventListener("click", saveModal);
    document.getElementById("modalBackdrop").addEventListener("click", (e) => {
      if (e.target.id === "modalBackdrop") closeModal();
    });

    document.getElementById("importFile").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!parsed.categories || !parsed.hourProfiles) throw new Error("formato non valido");
        Storage.setCustomRegolamento(parsed);
        regData = parsed;
        await showAlert("Regolamento importato correttamente.");
        renderRegolamento();
        renderOggi();
      } catch (err) {
        await showAlert("File non valido: " + err.message);
      }
      e.target.value = "";
    });

    document.getElementById("resetRegBtn").addEventListener("click", async () => {
      if (!(await showConfirm("Ripristinare il regolamento incluso nell'app?"))) return;
      Storage.clearCustomRegolamento();
      await loadRegData();
      renderRegolamento();
      renderOggi();
    });

    document.getElementById("importLogFile").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const parsedRaw = JSON.parse(await file.text());
        // Formato nuovo: { abbattimenti: [...], fucili: [...] }. Formato vecchio
        // (file esportati prima di questa funzione): un semplice array di abbattimenti.
        const isNewFormat = parsedRaw && !Array.isArray(parsedRaw) && Array.isArray(parsedRaw.abbattimenti);
        const parsed = isNewFormat ? parsedRaw.abbattimenti : parsedRaw;
        const gunsNelFile = isNewFormat && Array.isArray(parsedRaw.fucili) ? parsedRaw.fucili : [];
        if (!Array.isArray(parsed)) throw new Error("il file non contiene un registro abbattimenti");

        const isValid = (k) => k && typeof k.categoryId === "string" && /^\d{4}-\d{2}-\d{2}$/.test(k.date || "");
        const valid = parsed.filter(isValid);
        const invalid = parsed.length - valid.length;
        if (valid.length === 0) throw new Error("nessun abbattimento valido trovato");

        // Unisce al registro attuale saltando i doppioni (stesso id, oppure stessa categoria + data + note)
        const log = Storage.getLog();
        const sig = (k) => `${k.categoryId}|${k.date}|${(k.note || "").trim()}`;
        const ids = new Set(log.map(k => k.id));
        const sigs = new Set(log.map(sig));
        const toAdd = [];
        for (const k of valid) {
          if ((k.id && ids.has(k.id)) || sigs.has(sig(k))) continue;
          toAdd.push(k);
          if (k.id) ids.add(k.id);
          sigs.add(sig(k));
        }
        const duplicates = valid.length - toAdd.length;

        // Fucili nel file: aggiunge solo quelli il cui id non esiste già qui
        // (capita se importi due volte lo stesso file, o lo stesso fucile è
        // già stato ricreato a mano). Mantenendo l'id originale, l'abbinamento
        // "quale arma hai usato" sugli abbattimenti importati resta intatto.
        const gunsEsistenti = Storage.getGuns();
        const gunIdEsistenti = new Set(gunsEsistenti.map(g => g.id));
        const nuoviFucili = gunsNelFile.filter(g => g && typeof g.id === "string" && !gunIdEsistenti.has(g.id));
        const gunIdValidi = new Set([...gunIdEsistenti, ...nuoviFucili.map(g => g.id)]);

        if (toAdd.length === 0 && nuoviFucili.length === 0) {
          await showAlert(`Nessun abbattimento nuovo: tutti quelli del file (${duplicates}) sono già nel registro.`);
          return;
        }

        const year = String(regData.regulationYear || "");
        const otherYear = year ? toAdd.filter(k => !k.date.startsWith(year)).length : 0;
        const unknown = toAdd.filter(k => !regData.categories.some(c => c.id === k.categoryId)).length;
        const conFoto = toAdd.filter(k => k.photoDataUrl).length;

        let msg = `Abbattimenti nel file: ${valid.length}\nNuovi da aggiungere: ${toAdd.length}`;
        if (duplicates) msg += `\nGià presenti (saltati): ${duplicates}`;
        if (conFoto) msg += `\nCon foto: ${conFoto}`;
        if (nuoviFucili.length) msg += `\nFucili nuovi da importare: ${nuoviFucili.length}`;
        if (otherYear) msg += `\n\nATTENZIONE — con date fuori dal ${year}: ${otherYear}. Conterebbero comunque nelle quote di questa stagione.`;
        if (unknown) msg += `\nCategorie non presenti nel regolamento attuale: ${unknown}`;
        if (invalid) msg += `\nRighe non valide (ignorate): ${invalid}`;
        msg += "\n\nAggiungere al registro?";
        if (!(await showConfirm(msg))) return;

        if (nuoviFucili.length) {
          Storage.saveGuns([...gunsEsistenti, ...nuoviFucili]);
        }

        const now = new Date().toISOString();
        for (const k of toAdd) {
          const entry = {
            id: k.id || "k_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
            categoryId: k.categoryId,
            date: k.date,
            note: typeof k.note === "string" ? k.note : "",
            place: typeof k.place === "string" ? k.place : "",
            district: typeof k.district === "string" ? k.district : "",
            createdAt: typeof k.createdAt === "string" ? k.createdAt : now,
            // Se il fucile usato esiste qui (già presente, o appena importato
            // insieme a questo registro), il collegamento si mantiene;
            // altrimenti resta vuoto, come già faceva prima.
            gunId: (k.gunId && gunIdValidi.has(k.gunId)) ? k.gunId : null,
            ammoType: typeof k.ammoType === "string" ? k.ammoType : "",
            bulletWeight: typeof k.bulletWeight === "number" ? k.bulletWeight : null,
            bulletWeightUnit: k.bulletWeightUnit === "gr" ? "gr" : "g",
            ...(k.coords && typeof k.coords.lat === "number" && typeof k.coords.lon === "number"
              ? { coords: k.coords } : {}),
          };
          if (k.photoDataUrl) {
            try {
              const blob = await (await fetch(k.photoDataUrl)).blob();
              const photoId = "p_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
              await Storage.savePhoto(photoId, blob);
              entry.photoId = photoId;
            } catch (e) { /* la foto non si importa, il resto dell'abbattimento sì */ }
          }
          log.push(entry);
        }
        Storage.saveLog(log);
        renderRegistro();
        renderOggi();
        renderGunsList();
        if (!document.getElementById("registroStatistiche").classList.contains("hidden")) renderStatistiche();
        let riepilogo = `Abbattimenti aggiunti al registro: ${toAdd.length}`;
        if (nuoviFucili.length) riepilogo += `\nFucili aggiunti: ${nuoviFucili.length}`;
        await showAlert(riepilogo);
      } catch (err) {
        await showAlert("File non valido: " + err.message);
      } finally {
        e.target.value = "";
      }
    });

    setupRegistroSubtabs();
    setupSOS();
    setupGuns();

    // Tema scuro: il pulsante in alto e l'interruttore in Impostazioni fanno
    // la stessa cosa e restano sincronizzati tra loro.
    (function setupTema() {
      const KEY = "cacciaTI_theme_v1";
      const btn = document.getElementById("themeToggleBtn");
      const checkbox = document.getElementById("darkModeToggle");

      function applica(scuro) {
        document.documentElement.setAttribute("data-theme", scuro ? "dark" : "light");
        btn.textContent = scuro ? "☀️" : "🌙";
        checkbox.checked = scuro;
        localStorage.setItem(KEY, scuro ? "dark" : "light");
      }

      applica(localStorage.getItem(KEY) === "dark");

      btn.addEventListener("click", () => {
        applica(document.documentElement.getAttribute("data-theme") !== "dark");
      });
      checkbox.addEventListener("change", () => applica(checkbox.checked));
    })();
    setupPhoto();

    document.getElementById("modalGpsBtn").addEventListener("click", async () => {
      const btn = document.getElementById("modalGpsBtn");
      const testoOriginale = btn.textContent;
      btn.disabled = true;
      btn.textContent = "📍 Ricerca posizione…";
      try {
        const pos = await getPosition();
        impostaPosizioneModulo({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          acc: pos.coords.accuracy,
        });
        // Subito dopo, la proposta di comune e località dalla carta nazionale.
        proponiLuogo(posizioneModulo);
      } catch (err) {
        btn.textContent = testoOriginale;
        await showAlert(geoErrorText(err));
      } finally {
        btn.disabled = false;
      }
    });

    // Video dimostrativo in Info: schermo intero automatico all'avvio,
    // una X per chiuderlo prima che finisca, e torna da sola alla miniatura
    // in ogni caso (fine naturale, X, tasto Indietro/Esc del telefono).
    const demoVideo = document.querySelector(".demo-video");
    const demoWrap = document.querySelector(".demo-video-wrap");
    const demoClose = document.querySelector(".demo-video-close");
    if (demoVideo && demoWrap) {
      demoVideo.addEventListener("playing", () => {
        if (document.fullscreenElement) return; // già a schermo intero, non richiederlo di nuovo
        try {
          if (demoWrap.requestFullscreen) demoWrap.requestFullscreen().catch(() => {});
          else if (demoVideo.webkitEnterFullscreen) demoVideo.webkitEnterFullscreen(); // iPhone/Safari: ha già un pulsante nativo per chiudere
          else if (demoVideo.webkitRequestFullscreen) demoVideo.webkitRequestFullscreen();
        } catch (e) { /* se lo schermo intero non parte, il video continua comunque a riprodursi normalmente */ }
      });
      demoVideo.addEventListener("ended", () => {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else if (demoVideo.webkitExitFullscreen) demoVideo.webkitExitFullscreen();
      });
      if (demoClose) {
        demoClose.addEventListener("click", () => {
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        });
      }
      // qualunque sia il modo in cui si esce dallo schermo intero (X, Esc,
      // tasto Indietro, fine naturale), il video si ferma invece di
      // continuare a riprodursi in piccolo sullo sfondo.
      document.addEventListener("fullscreenchange", () => {
        if (!document.fullscreenElement) demoVideo.pause();
      });
    }
    document.getElementById("photoLightbox").addEventListener("click", () => {
      document.getElementById("photoLightbox").classList.remove("active");
    });
    renderGunsList();

    // Costruisce il file di backup (registro + fucili), riusato sia da
    // "Esporta" (scarica) sia da "Condividi" (menu nativo del telefono).
    async function costruisciFileBackup() {
      const includiFoto = document.getElementById("exportIncludiFoto").checked;
      const log = Storage.getLog();
      let daEsportare = log;
      if (includiFoto) {
        daEsportare = await Promise.all(log.map(async (k) => {
          if (!k.photoId) return k;
          try {
            const blob = await Storage.getPhoto(k.photoId);
            if (!blob) return k;
            const photoDataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(blob);
            });
            return { ...k, photoDataUrl };
          } catch (e) {
            return k; // se la foto non si legge, il resto dell'abbattimento si esporta comunque
          }
        }));
      } else {
        daEsportare = log.map(({ photoId, ...resto }) => resto);
      }
      const testo = JSON.stringify({ abbattimenti: daEsportare, fucili: Storage.getGuns() }, null, 2);
      const nomeFile = `cacciaTI_registro_${RulesEngine.toISO(new Date())}.json`;
      return new File([testo], nomeFile, { type: "application/json" });
    }

    // Segna che un backup è stato fatto ora, per il promemoria più sotto.
    function segnaBackupFatto() {
      localStorage.setItem("cacciaTI_last_backup_at", new Date().toISOString());
      localStorage.setItem("cacciaTI_last_backup_count", String(Storage.getLog().length));
    }

    document.getElementById("exportLogBtn").addEventListener("click", () => {
      document.getElementById("exportIncludiFoto").checked = true;
      document.getElementById("exportOptionsBackdrop").classList.add("active");
    });

    document.getElementById("exportOptionsCancel").addEventListener("click", () => {
      document.getElementById("exportOptionsBackdrop").classList.remove("active");
    });

    document.getElementById("exportOptionsConfirm").addEventListener("click", async () => {
      document.getElementById("exportOptionsBackdrop").classList.remove("active");
      const file = await costruisciFileBackup();
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      segnaBackupFatto();
      aggiornaPromemoriaBackup();
    });

    renderOggi();

    if ("serviceWorker" in navigator) {
      // Se c'era già un service worker, l'arrivo di uno nuovo = nuova versione:
      // ricarica una sola volta in automatico (niente doppio "aggiorna").
      const hadController = !!navigator.serviceWorker.controller;
      let reloading = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!hadController || reloading) return;
        reloading = true;
        window.location.reload();
      });

      // Mostra nell'intestazione la versione del service worker attivo
      // (il numero di CACHE_NAME in sw.js: unico punto da aggiornare).
      navigator.serviceWorker.ready.then((reg) => {
        if (!reg.active) return;
        const channel = new MessageChannel();
        channel.port1.onmessage = (e) => {
          const m = String(e.data || "").match(/v\d+(\.\d+)*$/);
          if (!m) return;
          const versionEl = document.getElementById("appVersion");
          versionEl.textContent = m[0];

          // Se l'app è appena stata aggiornata (versione diversa dall'ultima
          // vista su questo telefono), il numero lampeggia per farlo notare.
          // Non lampeggia al primissimo avvio in assoluto, quando non c'è
          // ancora nessuna versione precedente salvata con cui confrontare.
          const KEY = "cacciaTI_last_seen_version";
          const precedente = localStorage.getItem(KEY);
          if (precedente && precedente !== m[0]) {
            versionEl.classList.remove("version-blink");
            void versionEl.offsetWidth; // forza il riavvio dell'animazione
            versionEl.classList.add("version-blink");
            versionEl.addEventListener("animationend", () => {
              versionEl.classList.remove("version-blink");
            }, { once: true });

            const badge = document.getElementById("appVersionBadge");
            badge.hidden = false;
            requestAnimationFrame(() => badge.classList.add("show"));
            setTimeout(() => {
              badge.classList.remove("show");
              setTimeout(() => { badge.hidden = true; }, 700); // aspetta la fine della dissolvenza
            }, 8000);
          }
          localStorage.setItem(KEY, m[0]);

          // Tocco sul numero di versione → apre la scheda Info e la cronologia
          versionEl.addEventListener("click", () => {
            switchView("regolamento");
            const box = document.querySelector(".changelog-box");
            if (box) { box.open = true; box.scrollIntoView({ behavior: "smooth", block: "start" }); }
          });
        };
        reg.active.postMessage({ type: "GET_VERSION" }, [channel.port2]);
      });

      navigator.serviceWorker.register("sw.js").then((reg) => {
        // Controlla un aggiornamento appena l'app si apre (non solo quando
        // torna in primo piano dopo essere stata in sospeso): così un
        // aggiornamento nuovo si vede già alla prima apertura, invece di
        // aspettare che l'app venga messa in background e ripresa.
        reg.update().catch(() => {});

        // L'app installata spesso viene "ripresa" dallo sfondo senza ricaricarsi:
        // quando torna in primo piano, controlla se è uscita una versione nuova.
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") reg.update().catch(() => {});
        });
      }).catch(() => {});
    }
  }

  init();
})();
