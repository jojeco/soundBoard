// Pure, dependency-free helpers for merging the builtin sound list with
// custom-recording DB rows into one combo-playable source list. CommonJS on
// purpose, same convention as lib/combos.js / lib/soundPrefs.js: this repo
// has no `"type": "module"` in package.json. Never throws.
//
// Builtin sounds use `source: require(...)`; custom ones use
// `source: { uri: filePath }`. Audio.Sound.createAsync accepts either, so one
// merged `{id, name, source}` list works for combo steps/playback and the
// combo editor's sound picker on both screens. See NEXT.md.

var soundPrefsLib = require("./soundPrefs");
var customId = soundPrefsLib.customId;

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Maps each DB row {id, name, filePath} to {id, name, source}. Skips rows
// that aren't objects or have an empty/non-string filePath.
function customSoundEntries(rows) {
  var list = Array.isArray(rows) ? rows : [];
  var out = [];
  for (var i = 0; i < list.length; i++) {
    var row = list[i];
    if (!isPlainObject(row)) continue;
    if (typeof row.filePath !== "string" || row.filePath.length === 0) continue;
    out.push({
      id: customId(row.id),
      name: String(row.name || "Recording"),
      source: { uri: row.filePath },
    });
  }
  return out;
}

// Builtins first, then customs. Keeps the first occurrence of a duplicate id.
function mergeSoundSources(builtins, customs) {
  var a = Array.isArray(builtins) ? builtins : [];
  var b = Array.isArray(customs) ? customs : [];
  var seen = {};
  var out = [];
  var all = a.concat(b);
  for (var i = 0; i < all.length; i++) {
    var item = all[i];
    if (!isPlainObject(item) || typeof item.id !== "string" || seen[item.id]) continue;
    seen[item.id] = true;
    out.push(item);
  }
  return out;
}

module.exports = {
  customSoundEntries: customSoundEntries,
  mergeSoundSources: mergeSoundSources,
};
