// Pure, dependency-free sound preferences logic (favorites, play stats, sorting).
// CommonJS on purpose: this repo has no `"type": "module"` in package.json, so
// Node treats `.js` as CJS. Do NOT use ESM `export` syntax here — consumers
// (prefsStorage.js) do `import soundPrefs from "./soundPrefs"` + destructure
// for safe interop instead of relying on named ESM exports.

var PREFS_VERSION = 1;

function defaultPrefs() {
  return { version: PREFS_VERSION, favorites: {}, stats: {} };
}

function slug(name) {
  return String(name == null ? "" : name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function builtinId(name) {
  return "builtin:" + slug(name);
}

function customId(dbId) {
  return "custom:" + dbId;
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeFavorites(rawFavorites) {
  var favorites = {};
  if (!isPlainObject(rawFavorites)) return favorites;
  var keys = Object.keys(rawFavorites);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (rawFavorites[key]) favorites[key] = true;
  }
  return favorites;
}

function normalizeStats(rawStats) {
  var stats = {};
  if (!isPlainObject(rawStats)) return stats;
  var keys = Object.keys(rawStats);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var entry = rawStats[key];
    if (!isPlainObject(entry)) continue;
    var playCount =
      typeof entry.playCount === "number" && isFinite(entry.playCount) && entry.playCount >= 0
        ? Math.floor(entry.playCount)
        : 0;
    var lastPlayedAt =
      typeof entry.lastPlayedAt === "number" && isFinite(entry.lastPlayedAt)
        ? entry.lastPlayedAt
        : null;
    if (playCount === 0 && lastPlayedAt === null) continue;
    stats[key] = { playCount: playCount, lastPlayedAt: lastPlayedAt };
  }
  return stats;
}

// Tolerates null, non-objects, missing keys, wrong types, unknown version.
// Always returns a valid prefs object; never throws.
function normalizePrefs(raw) {
  if (!isPlainObject(raw)) return defaultPrefs();
  return {
    version: PREFS_VERSION,
    favorites: normalizeFavorites(raw.favorites),
    stats: normalizeStats(raw.stats),
  };
}

function parsePrefs(jsonString) {
  if (typeof jsonString !== "string" || jsonString.length === 0) {
    return defaultPrefs();
  }
  try {
    var parsed = JSON.parse(jsonString);
    return normalizePrefs(parsed);
  } catch (e) {
    return defaultPrefs();
  }
}

function serializePrefs(prefs) {
  return JSON.stringify(normalizePrefs(prefs));
}

function isFavorite(prefs, id) {
  var normalized = normalizePrefs(prefs);
  return !!normalized.favorites[id];
}

function toggleFavorite(prefs, id) {
  var normalized = normalizePrefs(prefs);
  var favorites = Object.assign({}, normalized.favorites);
  if (favorites[id]) {
    delete favorites[id];
  } else {
    favorites[id] = true;
  }
  return {
    version: PREFS_VERSION,
    favorites: favorites,
    stats: normalized.stats,
  };
}

function recordPlay(prefs, id, now) {
  var normalized = normalizePrefs(prefs);
  var when = typeof now === "number" ? now : Date.now();
  var existing = normalized.stats[id];
  var prevCount = existing && typeof existing.playCount === "number" ? existing.playCount : 0;
  var stats = Object.assign({}, normalized.stats);
  stats[id] = { playCount: prevCount + 1, lastPlayedAt: when };
  return {
    version: PREFS_VERSION,
    favorites: normalized.favorites,
    stats: stats,
  };
}

function getPlayCount(prefs, id) {
  var normalized = normalizePrefs(prefs);
  var entry = normalized.stats[id];
  return entry && typeof entry.playCount === "number" ? entry.playCount : 0;
}

function getLastPlayed(prefs, id) {
  var normalized = normalizePrefs(prefs);
  var entry = normalized.stats[id];
  return entry && typeof entry.lastPlayedAt === "number" ? entry.lastPlayedAt : null;
}

var SORT_MODES = ["default", "favorites", "mostPlayed", "recent"];

function sortSounds(sounds, prefs, mode) {
  var list = Array.isArray(sounds) ? sounds : [];
  var normalized = normalizePrefs(prefs);
  var indexed = list.map(function (item, index) {
    return { item: item, index: index };
  });

  function byOriginalIndex(a, b) {
    return a.index - b.index;
  }

  if (mode === "favorites") {
    indexed.sort(function (a, b) {
      var aFav = normalized.favorites[a.item.id] ? 1 : 0;
      var bFav = normalized.favorites[b.item.id] ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      return byOriginalIndex(a, b);
    });
  } else if (mode === "mostPlayed") {
    indexed.sort(function (a, b) {
      var aCount = getPlayCount(normalized, a.item.id);
      var bCount = getPlayCount(normalized, b.item.id);
      if (aCount !== bCount) return bCount - aCount;
      return byOriginalIndex(a, b);
    });
  } else if (mode === "recent") {
    indexed.sort(function (a, b) {
      var aPlayed = getLastPlayed(normalized, a.item.id);
      var bPlayed = getLastPlayed(normalized, b.item.id);
      var aNever = aPlayed === null;
      var bNever = bPlayed === null;
      if (aNever !== bNever) return aNever ? 1 : -1; // never-played last
      if (!aNever && aPlayed !== bPlayed) return bPlayed - aPlayed;
      return byOriginalIndex(a, b);
    });
  } else {
    // "default" or any unrecognized mode: original order.
    indexed.sort(byOriginalIndex);
  }

  return indexed.map(function (entry) {
    return entry.item;
  });
}

function getRecentlyPlayed(sounds, prefs, limit) {
  var list = Array.isArray(sounds) ? sounds : [];
  var normalized = normalizePrefs(prefs);
  var played = list.filter(function (item) {
    return getLastPlayed(normalized, item.id) !== null;
  });
  var sorted = sortSounds(played, normalized, "recent");
  var max = typeof limit === "number" && limit >= 0 ? limit : sorted.length;
  return sorted.slice(0, max);
}

module.exports = {
  PREFS_VERSION: PREFS_VERSION,
  defaultPrefs: defaultPrefs,
  builtinId: builtinId,
  customId: customId,
  normalizePrefs: normalizePrefs,
  parsePrefs: parsePrefs,
  serializePrefs: serializePrefs,
  isFavorite: isFavorite,
  toggleFavorite: toggleFavorite,
  recordPlay: recordPlay,
  getPlayCount: getPlayCount,
  getLastPlayed: getLastPlayed,
  SORT_MODES: SORT_MODES,
  sortSounds: sortSounds,
  getRecentlyPlayed: getRecentlyPlayed,
};
