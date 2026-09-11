/* rules-engine.js
 * Motore puro (nessun DOM, nessuno storage) che valuta, per una data e un'ora,
 * quali categorie di caccia sono aperte secondo il regolamento caricato e il
 * registro abbattimenti dell'utente.
 */

const RulesEngine = (() => {

  function pad(n) { return String(n).padStart(2, "0"); }

  function toISO(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function parseISO(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function nowHHMM(d) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function inDateWindow(iso, windows) {
    for (const w of windows) {
      if (w.dates) {
        if (w.dates.includes(iso)) return true;
      } else if (w.from && w.to) {
        if (iso >= w.from && iso <= w.to) return true;
      }
    }
    return false;
  }

  function weekdayOk(iso, dateObj, weekdays, extraAllowedDates) {
    if (!weekdays) return true;
    if (extraAllowedDates && extraAllowedDates.includes(iso)) return true; // es. apertura/chiusura fuori pattern
    return weekdays.includes(dateObj.getDay());
  }

  function excludedOk(iso, dateObj, excludedDates, excludedWeekdays) {
    if (excludedDates && excludedDates.includes(iso)) return false;
    if (excludedWeekdays && excludedWeekdays.includes(dateObj.getDay())) return false;
    return true;
  }

  function effectiveHourProfileKey(category, prefs) {
    if (category.huntType === "alta" && prefs && prefs.altitudeBelow400) {
      return "alta_sotto400";
    }
    return category.hourProfile;
  }

  function getHourWindowsForDate(data, hourProfileKey, iso) {
    const profile = data.hourProfiles[hourProfileKey];
    if (!profile) return null;
    for (const entry of profile) {
      if (iso >= entry.from && iso <= entry.to) return entry.windows;
    }
    return null;
  }

  function timeInWindows(hhmm, windows) {
    if (!windows) return false;
    return windows.some(([start, end]) => hhmm >= start && hhmm <= end);
  }

  function formatWindows(windows) {
    if (!windows) return "—";
    return windows.map(([s, e]) => `${s}–${e}`).join(" e ");
  }

  // --- Conteggi dal registro ---

  function seasonCountByCategory(log, categoryId) {
    return log.filter(k => k.categoryId === categoryId).length;
  }

  function seasonCountByGroup(log, categories, groupId) {
    const members = categories.filter(c => (c.groups || []).includes(groupId)).map(c => c.id);
    return log.filter(k => members.includes(k.categoryId)).length;
  }

  function todayCountByCategories(log, iso, categoryIds) {
    return log.filter(k => k.date === iso && categoryIds.includes(k.categoryId)).length;
  }

  // --- Valutazione di una singola categoria ---

  function evaluateCategory(data, category, log, dateObj, iso, nowTime, prefs) {
    const result = {
      category,
      dateOpen: false,
      hoursToday: null,
      nowOpen: false,
      quotaBlocked: false,
      quotaReason: null,
      requiresPriorMissing: false,
      dailyBlocked: false,
      dailyReason: null,
      remainingText: null,
    };

    if (!category.windows || category.windows.length === 0) {
      return result; // categoria non cacciabile (es. divieto assoluto)
    }

    const inWindow = inDateWindow(iso, category.windows);
    const wdOk = weekdayOk(iso, dateObj, category.weekdays, category.extraAllowedDates);
    const exOk = excludedOk(iso, dateObj, category.excludedDates, category.excludedWeekdays);
    result.dateOpen = inWindow && wdOk && exOk;

    const hourProfileKey = effectiveHourProfileKey(category, prefs);
    const hourWindows = getHourWindowsForDate(data, hourProfileKey, iso);
    result.hoursToday = formatWindows(hourWindows);
    if (nowTime) {
      result.nowOpen = result.dateOpen && timeInWindows(nowTime, hourWindows);
    } else {
      result.nowOpen = result.dateOpen;
    }

    // Quota individuale
    if (category.individualMax != null) {
      const count = seasonCountByCategory(log, category.id);
      const remaining = category.individualMax - count;
      if (remaining <= 0) {
        result.quotaBlocked = true;
        result.quotaReason = `Quota raggiunta (${count}/${category.individualMax})`;
      } else {
        result.remainingText = `${remaining}/${category.individualMax} rimasti`;
      }
    }

    // Quote di gruppo condivise
    if (!result.quotaBlocked && category.groups) {
      for (const groupId of category.groups) {
        const cap = data.groupCaps[groupId];
        if (!cap) continue;
        const count = seasonCountByGroup(log, data.categories, groupId);
        if (count >= cap.max) {
          result.quotaBlocked = true;
          result.quotaReason = `Quota di gruppo raggiunta — ${cap.label} (${count}/${cap.max})`;
          break;
        }
      }
    }

    // Prerequisiti nella stagione corrente
    if (category.requiresPriorThisSeason) {
      const missing = category.requiresPriorThisSeason.filter(
        reqId => seasonCountByCategory(log, reqId) === 0
      );
      if (missing.length > 0) {
        result.requiresPriorMissing = true;
      }
    }

    // Regole giornaliere (limite/die e incompatibilità/die)
    const daily = data.dailyRules;
    if (daily) {
      for (const rule of daily.maxPerDayGroups || []) {
        if (rule.members.includes(category.id)) {
          const todayCount = todayCountByCategories(log, iso, rule.members);
          if (todayCount >= rule.max) {
            result.dailyBlocked = true;
            result.dailyReason = rule.label;
          }
        }
      }
      for (const pair of daily.exclusionPairs || []) {
        if (pair.a.includes(category.id)) {
          const otherCount = todayCountByCategories(log, iso, pair.b);
          if (otherCount > 0) { result.dailyBlocked = true; result.dailyReason = pair.label; }
        }
        if (pair.b.includes(category.id)) {
          const otherCount = todayCountByCategories(log, iso, pair.a);
          if (otherCount > 0) { result.dailyBlocked = true; result.dailyReason = pair.label; }
        }
      }
    }

    return result;
  }

  function evaluateAll(data, log, dateObj, nowTime, prefs) {
    const iso = toISO(dateObj);
    return data.categories.map(cat => evaluateCategory(data, cat, log, dateObj, iso, nowTime, prefs));
  }

  function isFullyOpen(evalResult) {
    return evalResult.dateOpen && !evalResult.quotaBlocked &&
           !evalResult.requiresPriorMissing && !evalResult.dailyBlocked;
  }

  return {
    toISO, parseISO, nowHHMM,
    evaluateAll, evaluateCategory, isFullyOpen,
    seasonCountByCategory, seasonCountByGroup,
  };
})();
