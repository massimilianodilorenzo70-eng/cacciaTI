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

  function updateKill(id, patch) {
    const log = getLog();
    const i = log.findIndex(k => k.id === id);
    if (i === -1) return null;
    log[i] = { ...log[i], ...patch, id: log[i].id, createdAt: log[i].createdAt };
    log[i].editedAt = new Date().toISOString();
    saveLog(log);
    return log[i];
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

  // ---------- Foto degli abbattimenti (IndexedDB: localStorage è troppo
  // piccolo per delle immagini; qui le foto restano comunque solo sul
  // telefono, in un'area diversa pensata per file più grandi) ----------
  const PHOTO_DB_NAME = "cacciaTI_photos";
  const PHOTO_STORE = "photos";
  let photoDbPromise = null;

  function openPhotoDB() {
    if (photoDbPromise) return photoDbPromise;
    photoDbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(PHOTO_DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(PHOTO_STORE)) {
          req.result.createObjectStore(PHOTO_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return photoDbPromise;
  }

  async function savePhoto(id, blob) {
    const db = await openPhotoDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, "readwrite");
      tx.objectStore(PHOTO_STORE).put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getPhoto(id) {
    if (!id) return null;
    const db = await openPhotoDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(PHOTO_STORE, "readonly").objectStore(PHOTO_STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function deletePhoto(id) {
    if (!id) return;
    const db = await openPhotoDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, "readwrite");
      tx.objectStore(PHOTO_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  return {
    getLog, saveLog, addKill, updateKill, deleteKill,
    getCustomRegolamento, setCustomRegolamento, clearCustomRegolamento,
    getPrefs, savePrefs,
    getGuns, saveGuns, addGun, deleteGun,
    savePhoto, getPhoto, deletePhoto,
    hasAckedDisclaimer, setAckedDisclaimer,
  };
})();
