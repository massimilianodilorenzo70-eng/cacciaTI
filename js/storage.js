/* storage.js
 * Persistenza locale (localStorage): registro abbattimenti, regolamento
 * eventualmente importato, preferenze utente. Nessun dato lascia il telefono.
 */

const Storage = (() => {
  const KEY_LOG = "cacciaTI_log_v1";
  const KEY_REGDATA = "cacciaTI_regolamento_v1";
  const KEY_PREFS = "cacciaTI_prefs_v1";
  const KEY_DISCLAIMER_ACK = "cacciaTI_disclaimer_ack_v1";
  const KEY_GUNS = "cacciaTI_guns_v1";

  function getLog() {
    try {
      return JSON.parse(localStorage.getItem(KEY_LOG)) || [];
    } catch (e) { return []; }
  }

  function saveLog(log) {
    localStorage.setItem(KEY_LOG, JSON.stringify(log));
  }

  function addKill(entry) {
    const log = getLog();
    entry.id = "k_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
    entry.createdAt = new Date().toISOString();
    log.push(entry);
    saveLog(log);
    return entry;
  }

  function deleteKill(id) {
    const log = getLog().filter(k => k.id !== id);
    saveLog(log);
  }

  function getCustomRegolamento() {
    try {
      const raw = localStorage.getItem(KEY_REGDATA);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function setCustomRegolamento(dataObj) {
    localStorage.setItem(KEY_REGDATA, JSON.stringify(dataObj));
  }

  function clearCustomRegolamento() {
    localStorage.removeItem(KEY_REGDATA);
  }

  function getPrefs() {
    try {
      return JSON.parse(localStorage.getItem(KEY_PREFS)) || { altitudeBelow400: false };
    } catch (e) { return { altitudeBelow400: false }; }
  }

  function savePrefs(prefs) {
    localStorage.setItem(KEY_PREFS, JSON.stringify(prefs));
  }

  function getGuns() {
    try {
      return JSON.parse(localStorage.getItem(KEY_GUNS)) || [];
    } catch (e) { return []; }
  }

  function saveGuns(guns) {
    localStorage.setItem(KEY_GUNS, JSON.stringify(guns));
  }

  function addGun(gun) {
    const guns = getGuns();
    gun.id = "g_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
    guns.push(gun);
    saveGuns(guns);
    return gun;
  }

  function deleteGun(id) {
    saveGuns(getGuns().filter(g => g.id !== id));
  }

  function hasAckedDisclaimer() {
    return localStorage.getItem(KEY_DISCLAIMER_ACK) === "1";
  }

  function setAckedDisclaimer() {
    localStorage.setItem(KEY_DISCLAIMER_ACK, "1");
  }

  return {
    getLog, saveLog, addKill, deleteKill,
    getCustomRegolamento, setCustomRegolamento, clearCustomRegolamento,
    getPrefs, savePrefs,
    getGuns, saveGuns, addGun, deleteGun,
    hasAckedDisclaimer, setAckedDisclaimer,
  };
})();
