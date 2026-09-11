/* app.js — controller: carica i dati, gestisce le viste e le interazioni */

(() => {
  let regData = null;
  let selectedDate = new Date();
  let prefs = Storage.getPrefs();
  let selectedHunt = null; // 'alta' | 'bassa' | 'acquatica' — scelto dall'utente o dedotto alla prima apertura
  let contingenteData = null; // dati ufficiali camoscio/capriolo, se disponibili

  const HUNT_LABELS = { alta: "Caccia alta", bassa: "Caccia bassa", acquatica: "Caccia acquatica" };
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
    const timeLabel = isNaN(fetchedAt.getTime())
      ? ""
      : fetchedAt.toLocaleString("it-CH", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    return `
      <div class="contingente-box ${isStale ? "stale" : ""}">
        <div class="cline">
          <span>Contingente ufficiale</span>
          <span class="cstatus ${statusCls.toLowerCase()}">${item.status} · ${item.percent}%</span>
        </div>
        <div class="cbar"><div class="cbar-fill ${statusCls === "chiuso" ? "chiuso" : ""}" style="width:${Math.min(item.percent, 100)}%"></div></div>
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

  function renderHuntTabs(results) {
    document.querySelectorAll(".hunt-tab").forEach(btn => {
      const ht = btn.dataset.hunt;
      const active = currentHuntTypeIsActive(ht, results);
      btn.classList.toggle("active", ht === selectedHunt);
      btn.innerHTML = HUNT_LABELS[ht] + (active ? '<span class="dot"></span>' : "");
    });
  }

  function renderOggi() {
    const container = document.getElementById("sectionsContainer");
    container.innerHTML = "";

    const iso = RulesEngine.toISO(selectedDate);
    const now = RulesEngine.toISO(new Date()) === iso ? RulesEngine.nowHHMM(new Date()) : null;
    const log = Storage.getLog();
    const results = RulesEngine.evaluateAll(regData, log, selectedDate, now, prefs);

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

    // raggruppa per specie
    const bySpecies = {};
    for (const r of sectionResults) {
      (bySpecies[r.category.speciesLabel] ||= []).push(r);
    }
    for (const speciesLabel of Object.keys(bySpecies)) {
      // le categorie appena sbloccate e aperte vanno in cima alla specie
      const list = bySpecies[speciesLabel].slice().sort((a, b) => isUnlockedOpen(b) - isUnlockedOpen(a));
      for (const r of list) {
        container.appendChild(renderCatCard(r));
      }
    }
  }

  function isUnlockedOpen(r) {
    return !!r.unlockedBy && r.dateOpen && !r.quotaBlocked && !r.requiresPriorMissing && !r.dailyBlocked;
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

  function statusFor(r) {
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

    const canRegister = r.dateOpen && !r.quotaBlocked && !r.requiresPriorMissing && !r.dailyBlocked;

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
      ${isUnlockedOpen(r) ? unlockBanner(r) : ""}
      ${st.sub ? `<div class="note">${st.sub}</div>` : ""}
      ${r.category.manualCheck ? `<div class="note">${r.category.manualCheck}</div>` : ""}
      ${r.category.note ? `<div class="note">${r.category.note}</div>` : ""}
      ${renderContingenteBox(r.category)}
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
      item.querySelector(".del").addEventListener("click", () => {
        if (confirm("Eliminare questo abbattimento dal registro?")) {
          Storage.deleteKill(k.id);
          renderRegistro();
          renderOggi();
        }
      });
      listEl.appendChild(item);
    }
  }

  // ---------- Vista REGOLAMENTO ----------

  function renderRegolamento() {
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
    for (const huntType of HUNT_ORDER) {
      const group = document.createElement("optgroup");
      group.label = HUNT_LABELS[huntType];
      for (const c of regData.categories) {
        if (c.huntType !== huntType || !c.windows || c.windows.length === 0) continue;
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = `${c.speciesLabel} — ${c.categoryLabel}`;
        group.appendChild(opt);
      }
      sel.appendChild(group);
    }
    if (preselectId) sel.value = preselectId;
  }

  function openModal(preselectId) {
    populateModalCategories(preselectId);
    document.getElementById("modalDate").value = RulesEngine.toISO(selectedDate);
    document.getElementById("modalNote").value = "";
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
    Storage.addKill({ categoryId, date, note });
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

  async function init() {
    if (!Storage.hasAckedDisclaimer()) {
      document.getElementById("disclaimerAck").addEventListener("click", () => {
        Storage.setAckedDisclaimer();
        document.getElementById("disclaimerGate").classList.add("hidden");
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
        alert("Regolamento importato correttamente.");
        renderRegolamento();
        renderOggi();
      } catch (err) {
        alert("File non valido: " + err.message);
      }
      e.target.value = "";
    });

    document.getElementById("resetRegBtn").addEventListener("click", async () => {
      if (!confirm("Ripristinare il regolamento incluso nell'app?")) return;
      Storage.clearCustomRegolamento();
      await loadRegData();
      renderRegolamento();
      renderOggi();
    });

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
