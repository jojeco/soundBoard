// Pure, dependency-free helpers for validating and de-duplicating custom
// sound names. CommonJS on purpose, same convention as lib/recordingFiles.js
// and lib/soundSources.js: this repo has no `"type": "module"` in
// package.json. No Expo imports, so plain Node can test it.

var MAX_SOUND_NAME_LENGTH = 40;

// "" for null/undefined, trims, collapses internal whitespace runs to a
// single space, and cuts to MAX_SOUND_NAME_LENGTH (trimmed again after the
// cut, in case the cut lands right after a space).
function normalizeSoundName(raw) {
  var str = raw == null ? "" : String(raw);
  str = str.trim().replace(/\s+/g, " ");
  if (str.length > MAX_SOUND_NAME_LENGTH) {
    str = str.slice(0, MAX_SOUND_NAME_LENGTH).trim();
  }
  return str;
}

// Returns `base` if it doesn't collide (case-insensitive, after normalizing)
// with anything in `existingNames`; otherwise "base 2", "base 3", ... — the
// first free one. Shortens base rather than overflowing MAX_SOUND_NAME_LENGTH.
function uniqueSoundName(base, existingNames) {
  var names = Array.isArray(existingNames) ? existingNames : [];
  var taken = {};
  for (var i = 0; i < names.length; i++) {
    taken[normalizeSoundName(names[i]).toLowerCase()] = true;
  }
  var baseNorm = normalizeSoundName(base);
  if (!taken[baseNorm.toLowerCase()]) return baseNorm;
  var n = 2;
  while (true) {
    var suffix = " " + n;
    var maxBaseLen = MAX_SOUND_NAME_LENGTH - suffix.length;
    var truncatedBase = baseNorm.length > maxBaseLen ? baseNorm.slice(0, maxBaseLen).trim() : baseNorm;
    var candidate = truncatedBase + suffix;
    if (!taken[candidate.toLowerCase()]) return candidate;
    n++;
  }
}

// Never fails: a blank/whitespace-only name becomes "New Sound", then
// de-duplicated the same way any other name would be.
function validateNewSoundName(raw, existingNames) {
  var normalized = normalizeSoundName(raw);
  if (!normalized) normalized = "New Sound";
  return { name: uniqueSoundName(normalized, existingNames) };
}

// Renaming a sound to its own current name (including a capitals-only
// change) is allowed — `currentName` is excluded from the duplicate check.
function validateRename(raw, existingNames, currentName) {
  var normalized = normalizeSoundName(raw);
  if (!normalized) return { ok: false, error: "Name can't be empty" };
  var currentNorm = normalizeSoundName(currentName).toLowerCase();
  var normalizedLower = normalized.toLowerCase();
  var names = Array.isArray(existingNames) ? existingNames : [];
  for (var i = 0; i < names.length; i++) {
    var otherNorm = normalizeSoundName(names[i]).toLowerCase();
    if (otherNorm === currentNorm) continue; // the sound's own current name
    if (otherNorm === normalizedLower) {
      return { ok: false, error: "A sound with that name already exists" };
    }
  }
  return { ok: true, name: normalized };
}

module.exports = {
  MAX_SOUND_NAME_LENGTH: MAX_SOUND_NAME_LENGTH,
  normalizeSoundName: normalizeSoundName,
  uniqueSoundName: uniqueSoundName,
  validateNewSoundName: validateNewSoundName,
  validateRename: validateRename,
};
