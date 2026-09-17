/* app.js — controller: carica i dati, gestisce le viste e le interazioni */

(() => {
  let regData = null;
  let selectedDate = new Date();
  let prefs = Storage.getPrefs();
  let selectedHunt = null; // 'alta' | 'bassa' | 'acquatica' — scelto dall'utente o dedotto alla prima apertura
  let contingenteData = null; // dati ufficiali camoscio/capriolo, se disponibili

  const HUNT_LABELS = { alta: "Caccia alta", bassa: "Caccia bassa", acquatica: "Caccia acquatica" };

  // Cronologia versioni — dalla più recente alla più vecchia.
  // Ad ogni nuova versione: aggiungere una voce qui, in cima all'elenco.
  const CHANGELOG = [
    { v: "3.6", text: "Nuova sezione \u00abI miei fucili\u00bb in Info: registra arma e calibro una volta sola, sia a canna rigata (con avviso se sotto i 7 mm / .270\" previsti dalla legge) sia a canna liscia \u2014 sovrapposto, doppietta o semiautomatico, calibro da 12 a 20 (con avviso se fuori range). In fase di registrazione di un abbattimento puoi indicare l'arma usata, il tipo di munizione e il peso della palla (grani o grammi), tutto facoltativo. Le statistiche mostrano anche il riepilogo per arma." },
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
      summary.textContent = "Aperto ora — vale solo per la data di oggi";
      list.innerHTML = `<div class="aperto-ora-empty">Stai guardando un'altra data. Tocca «Oggi» in alto per vedere cosa è aperto in questo momento.</div>`;
      return;
    }

    const aperte = results.filter(r =>
      r.category.windows && r.category.windows.length > 0 && r.nowOpen && isOpenNow(r));

    summary.textContent = aperte.length === 0 ? "Aperto ora — nessuna al momento" : `Aperto ora (${aperte.length})`;

    if (aperte.length === 0) {
      list.innerHTML = `<div class="aperto-ora-empty">Nessuna specie è cacciabile in questo preciso momento.</div>`;
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

    let sectionResults = results.filter(r =>
      r.category.huntType === selectedHunt && r.category.windows && r.category.windows.length > 0
    );
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
      const banner = document.createElement("div");
      banner.className = "info-box";
      banner.innerHTML = `<b>Nessuna categoria aperta</b> in ${HUNT_LABELS[selectedHunt].toLowerCase()} il ${formatDateCH(iso)}.`;
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
      if (!query && !speciesList.some(isOpenNow)) continue;

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
      return r.nowOpen
        ? { label: "Sbloccata · aperta ora", cls: "status-unlocked" }
        : { label: "Sbloccata · aperta oggi", cls: "status-unlocked", sub: "Fuori orario in questo momento" };
    }
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
        <span>Orario: ${r.hoursToday}</span>
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
    for (const k of sorted) {
      const cat = regData.categories.find(c => c.id === k.categoryId);
      const item = document.createElement("div");
      item.className = "log-item";
      item.innerHTML = `
        <div class="info">
          <div class="date">${k.date}</div>
          <div class="sp">${cat ? cat.speciesLabel : k.categoryId}</div>
          <div class="cat">${cat ? cat.categoryLabel : ""}${k.note ? " — " + k.note : ""}</div>
        </div>
        <button class="del">Elimina</button>
      `;
      item.querySelector(".del").addEventListener("click", async () => {
        if (await showConfirm("Eliminare questo abbattimento dal registro?")) {
          Storage.deleteKill(k.id);
          renderRegistro();
          renderOggi();
          if (!document.getElementById("registroStatistiche").classList.contains("hidden")) renderStatistiche();
        }
      });
      listEl.appendChild(item);
    }
  }

  // ---------- Calibro minimo legale (7 mm / .270 pollici, art. 18 Legge sulla caccia TI) ----------
  // Verifica automatica solo quando il testo del calibro permette di stimare
  // un valore in millimetri; se non ci riesce non inventa nulla e non avvisa,
  // lascia solo il promemoria fisso del limite legale.

  const SOGLIA_CALIBRO_MM = 6.8; // un po' sotto 7 per non segnalare per errore il .270 Win (6,858 mm)
  const GAUGE_MIN = 12; // canna liscia: art. 18 Legge sulla caccia TI, "calibro 12 al massimo e 20 al minimo"
  const GAUGE_MAX = 20;

  function stimaCalibroInMm(testo) {
    if (!testo) return null;
    const m = testo.match(/(\d+(?:[.,]\d+)?)/);
    if (!m) return null;
    const n = parseFloat(m[1].replace(",", "."));
    if (!isFinite(n) || n <= 0) return null;
    if (n < 1) return n * 25.4;         // es. ".270" -> pollici
    if (n >= 100) return (n / 1000) * 25.4; // es. "300" (Win Mag) -> .300" -> pollici
    return n;                            // es. "7", "8", "9.3" -> già in mm
  }

  function calibroSottoMinimo(testoCalibro) {
    const mm = stimaCalibroInMm(testoCalibro);
    return mm !== null && mm < SOGLIA_CALIBRO_MM;
  }

  function stimaGauge(testo) {
    if (!testo) return null;
    const m = testo.match(/(\d+)/);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    return isFinite(n) && n > 0 ? n : null;
  }

  function gaugeFuoriRange(testoGauge) {
    const g = stimaGauge(testoGauge);
    return g !== null && (g < GAUGE_MIN || g > GAUGE_MAX);
  }

  // Vero se il calibro del fucile (rigato o liscio) risulta fuori dai limiti
  // legali ticinesi. Unico punto usato sia nel modulo "Aggiungi fucile" sia
  // in quello di registrazione, così il criterio resta identico ovunque.
  function calibroNonValido(gun) {
    return gun.tipoCanna === "liscia" ? gaugeFuoriRange(gun.caliber) : calibroSottoMinimo(gun.caliber);
  }

  function testoAvvisoCalibro(gun) {
    return gun.tipoCanna === "liscia"
      ? `Attenzione: il calibro ${gun.caliber} risulta fuori dal range ammesso per la canna liscia in ` +
        `Ticino (da ${GAUGE_MIN} a ${GAUGE_MAX}, art. 18 Legge sulla caccia). Verifica tu prima di usarlo.`
      : `Attenzione: il calibro ${gun.caliber} risulta sotto il minimo legale per la canna rigata in ` +
        `Ticino (7 mm o 270 millesimi di pollice, art. 18 Legge sulla caccia). Verifica tu prima di usarlo.`;
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
      el.innerHTML = `<div class="empty-state">Nessun fucile registrato.</div>`;
      return;
    }
    el.innerHTML = guns.map(g => `
      <div class="log-item" data-gun-id="${g.id}">
        <div class="info">
          <div class="sp">${g.name || descrizioneFucile(g)}</div>
          <div class="cat">${descrizioneFucile(g)}${calibroNonValido(g) ? " — calibro fuori norma" : ""}</div>
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

  function openGunModal() {
    document.getElementById("gunName").value = "";
    document.querySelectorAll("#gunBarrelTabs .subtab").forEach(b => b.classList.toggle("active", b.dataset.barrel === "rigata"));
    document.getElementById("gunRigataFields").hidden = false;
    document.getElementById("gunLisciaFields").hidden = true;
    document.getElementById("gunCaliber").value = "7x57";
    document.getElementById("gunCaliberAltro").hidden = true;
    document.getElementById("gunCaliberAltro").value = "";
    document.getElementById("gunAzioneLiscia").value = "Sovrapposto";
    document.getElementById("gunGauge").value = "12";
    document.getElementById("gunGaugeAltro").hidden = true;
    document.getElementById("gunGaugeAltro").value = "";
    document.getElementById("gunCaliberWarning").hidden = true;
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
    document.getElementById("addGunBtn").addEventListener("click", openGunModal);
    document.getElementById("gunModalCancel").addEventListener("click", () => {
      document.getElementById("gunModalBackdrop").classList.remove("active");
    });

    function aggiornaAvvisoCalibroFucile() {
      const warn = document.getElementById("gunCaliberWarning");
      const gun = fucileDalModulo();
      if (gun.caliber && calibroNonValido(gun)) {
        warn.hidden = false;
        warn.textContent = testoAvvisoCalibro(gun);
      } else {
        warn.hidden = true;
      }
    }

    document.querySelectorAll("#gunBarrelTabs .subtab").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#gunBarrelTabs .subtab").forEach(b => b.classList.toggle("active", b === btn));
        const liscia = btn.dataset.barrel === "liscia";
        document.getElementById("gunRigataFields").hidden = liscia;
        document.getElementById("gunLisciaFields").hidden = !liscia;
        aggiornaAvvisoCalibroFucile();
      });
    });

    document.getElementById("gunCaliber").addEventListener("change", (e) => {
      document.getElementById("gunCaliberAltro").hidden = e.target.value !== "__altro__";
      aggiornaAvvisoCalibroFucile();
    });
    document.getElementById("gunCaliberAltro").addEventListener("input", aggiornaAvvisoCalibroFucile);
    document.getElementById("gunGauge").addEventListener("change", (e) => {
      document.getElementById("gunGaugeAltro").hidden = e.target.value !== "__altro__";
      aggiornaAvvisoCalibroFucile();
    });
    document.getElementById("gunGaugeAltro").addEventListener("input", aggiornaAvvisoCalibroFucile);

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
  function popolaSelectArmi() {
    const sel = document.getElementById("modalGun");
    if (!sel) return;
    const guns = Storage.getGuns();
    sel.innerHTML = `<option value="">— non indicata —</option>` +
      guns.map(g => `<option value="${g.id}">${g.name ? g.name + " — " : ""}${descrizioneFucile(g)}</option>`).join("");
  }

  function aggiornaAvvisoCalibroModal() {
    const sel = document.getElementById("modalGun");
    const warn = document.getElementById("modalGunCaliberWarning");
    const gun = Storage.getGuns().find(g => g.id === sel.value);
    if (gun && calibroNonValido(gun)) {
      warn.hidden = false;
      warn.textContent = testoAvvisoCalibro(gun);
    } else {
      warn.hidden = true;
    }
  }

  // ---------- SOS: posizione GPS + SMS/chiamata al 1414 ----------

  function setupSOS() {
    const backdrop = document.getElementById("sosBackdrop");
    const status = document.getElementById("sosStatus");

    const showStatus = (text, cls) => {
      status.textContent = text;
      status.className = "sos-status" + (cls ? " " + cls : "");
    };

    document.getElementById("sosOpenBtn").addEventListener("click", () => {
      showStatus("", "");
      backdrop.classList.add("active");
    });
    document.getElementById("sosClose").addEventListener("click", () => {
      backdrop.classList.remove("active");
    });

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

    document.getElementById("sosSmsBtn").addEventListener("click", async () => {
      showStatus("Ricerca della posizione GPS in corso…", "");
      try {
        const pos = await getPosition();
        const lat = pos.coords.latitude.toFixed(5);
        const lon = pos.coords.longitude.toFixed(5);
        const acc = Math.round(pos.coords.accuracy);
        const alt = pos.coords.altitude != null ? Math.round(pos.coords.altitude) : null;
        const now = new Date();
        const ora = now.toLocaleString("it-CH", { dateStyle: "short", timeStyle: "short" });

        let testo = `EMERGENZA. Ho bisogno di soccorso. Posizione: ${lat}, ${lon}`;
        if (alt != null) testo += ` (quota indicativa ${alt} m)`;
        testo += `. Precisione GPS: circa ${acc} m. Ora: ${ora}.`;

        showStatus("Posizione trovata. Si apre ora l'app Messaggi: controlla il testo e invialo tu.", "ok");
        window.location.href = `sms:1414?body=${encodeURIComponent(testo)}`;
      } catch (err) {
        showStatus(geoErrorText(err), "err");
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

  function renderRegolamento() {
    renderChangelog();
    const box = document.getElementById("regInfoBox");
    const custom = Storage.getCustomRegolamento();
    box.innerHTML = `
      <b>Anno regolamento:</b> ${regData.regulationYear}${custom ? " (importato manualmente)" : " (incluso nell'app)"}<br>
      <b>Valido dal:</b> ${regData.validFrom}<br>
      <b>Fonte:</b> ${regData.source}
    `;
  }

  // ---------- Modale registrazione ----------

  function populateModalCategories(preselectId) {
    const sel = document.getElementById("modalCategory");
    sel.innerHTML = "";

    // Solo le specie del tipo di caccia selezionato in alto
    // (se si parte da una scheda, vale il tipo di caccia di quella categoria).
    const pre = preselectId ? regData.categories.find(c => c.id === preselectId) : null;
    const huntType = (pre && pre.huntType) || selectedHunt || "alta";

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

  function openModal(preselectId) {
    populateModalCategories(preselectId);
    document.getElementById("modalDate").value = RulesEngine.toISO(selectedDate);
    document.getElementById("modalNote").value = "";
    popolaSelectArmi();
    document.getElementById("modalGun").value = "";
    document.getElementById("modalGunCaliberWarning").hidden = true;

    const hasGuns = Storage.getGuns().length > 0;
    document.getElementById("modalGunFieldWrap").hidden = !hasGuns;
    document.getElementById("modalGunSuggest").hidden = hasGuns;
    document.getElementById("modalGunManageLink").textContent =
      hasGuns ? "Gestisci i miei fucili →" : "+ Aggiungi il tuo primo fucile →";

    document.getElementById("modalAmmoType").value = "";
    document.getElementById("modalBulletWeight").value = "";
    document.getElementById("modalBulletWeightUnit").value = "g";
    document.getElementById("modalBackdrop").classList.add("active");
  }

  function closeModal() {
    document.getElementById("modalBackdrop").classList.remove("active");
  }

  function saveModal() {
    const categoryId = document.getElementById("modalCategory").value;
    const date = document.getElementById("modalDate").value;
    const note = document.getElementById("modalNote").value.trim();
    if (!categoryId || !date) return;
    const gunId = document.getElementById("modalGun").value || null;
    const ammoType = document.getElementById("modalAmmoType").value || "";
    const bulletWeightRaw = document.getElementById("modalBulletWeight").value;
    const bulletWeight = bulletWeightRaw ? parseFloat(bulletWeightRaw) : null;
    const bulletWeightUnit = document.getElementById("modalBulletWeightUnit").value;
    Storage.addKill({ categoryId, date, note, gunId, ammoType, bulletWeight, bulletWeightUnit });
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
    if (name === "regolamento") renderRegolamento();
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
      renderOggi();
    });

    document.querySelectorAll(".tab-btn").forEach(b => {
      b.addEventListener("click", () => switchView(b.dataset.view));
    });

    document.getElementById("fabAdd").addEventListener("click", () => openModal(null));

    document.getElementById("modalGun").addEventListener("change", aggiornaAvvisoCalibroModal);
    document.getElementById("modalGunManageLink").addEventListener("click", () => {
      closeModal();
      switchView("regolamento");
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
        const parsed = JSON.parse(await file.text());
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

        if (toAdd.length === 0) {
          await showAlert(`Nessun abbattimento nuovo: tutti quelli del file (${duplicates}) sono già nel registro.`);
          return;
        }

        const year = String(regData.regulationYear || "");
        const otherYear = year ? toAdd.filter(k => !k.date.startsWith(year)).length : 0;
        const unknown = toAdd.filter(k => !regData.categories.some(c => c.id === k.categoryId)).length;

        let msg = `Abbattimenti nel file: ${valid.length}\nNuovi da aggiungere: ${toAdd.length}`;
        if (duplicates) msg += `\nGià presenti (saltati): ${duplicates}`;
        if (otherYear) msg += `\n\nATTENZIONE — con date fuori dal ${year}: ${otherYear}. Conterebbero comunque nelle quote di questa stagione.`;
        if (unknown) msg += `\nCategorie non presenti nel regolamento attuale: ${unknown}`;
        if (invalid) msg += `\nRighe non valide (ignorate): ${invalid}`;
        msg += "\n\nAggiungerli al registro?";
        if (!(await showConfirm(msg))) return;

        const now = new Date().toISOString();
        for (const k of toAdd) {
          log.push({
            id: k.id || "k_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
            categoryId: k.categoryId,
            date: k.date,
            note: typeof k.note === "string" ? k.note : "",
            createdAt: typeof k.createdAt === "string" ? k.createdAt : now,
          });
        }
        Storage.saveLog(log);
        renderRegistro();
        renderOggi();
        if (!document.getElementById("registroStatistiche").classList.contains("hidden")) renderStatistiche();
        await showAlert(`Abbattimenti aggiunti al registro: ${toAdd.length}`);
      } catch (err) {
        await showAlert("File non valido: " + err.message);
      } finally {
        e.target.value = "";
      }
    });

    setupRegistroSubtabs();
    setupSOS();
    setupGuns();
    renderGunsList();

    document.getElementById("exportLogBtn").addEventListener("click", () => {
      const log = Storage.getLog();
      const blob = new Blob([JSON.stringify(log, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cacciaTI_registro_${RulesEngine.toISO(new Date())}.json`;
      a.click();
      URL.revokeObjectURL(url);
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
          if (m) document.getElementById("appVersion").textContent = m[0];
        };
        reg.active.postMessage({ type: "GET_VERSION" }, [channel.port2]);
      });

      navigator.serviceWorker.register("sw.js").then((reg) => {
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
