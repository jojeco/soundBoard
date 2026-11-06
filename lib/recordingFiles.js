// Pure, dependency-free helpers for where custom recordings live on disk.
// CommonJS on purpose: this repo has no `"type": "module"` in package.json, so
// Node treats `.js` as CJS. Do NOT use ESM `export` syntax here — same
// convention as lib/soundPrefs.js. No Expo imports, so plain Node can test it.

var RECORDINGS_SUBDIR = "recordings/";

// Extension (including the leading dot) from the last path segment of `uri`,
// ignoring any query string. Falls back to ".m4a" when there is none.
function getExtension(uri) {
  var str = String(uri == null ? "" : uri);
  var withoutQuery = str.split("?")[0];
  var segments = withoutQuery.split("/");
  var lastSegment = segments[segments.length - 1] || "";
  var dotIndex = lastSegment.lastIndexOf(".");
  if (dotIndex === -1) return ".m4a";
  return lastSegment.slice(dotIndex);
}

// Builds the destination path for a persisted recording: baseDir +
// "recordings/rec-<now>" + extension (derived from the original uri).
function buildRecordingPath(baseDir, uri, now) {
  var base = String(baseDir == null ? "" : baseDir);
  var ext = getExtension(uri);
  return base + RECORDINGS_SUBDIR + "rec-" + now + ext;
}

// True only when `path` lives under baseDir + "recordings/" — i.e. a file
// this app itself copied there via buildRecordingPath. Anything else
// (cache paths, paths outside the recordings folder) is false.
function isManagedRecording(baseDir, path) {
  var base = String(baseDir == null ? "" : baseDir);
  var p = String(path == null ? "" : path);
  if (!base) return false; // no documents dir (e.g. web) -> nothing is managed
  if (p.indexOf("..") !== -1) return false; // never follow traversal segments
  var prefix = base + RECORDINGS_SUBDIR;
  return p.indexOf(prefix) === 0;
}

// Rows saved before the cache-purge fix still point at expo-av's cache
// folder, which the OS can clear; plan a copy for each one into baseDir's
// recordings/ folder. `index` only counts planned items, keeping the "m"
// stamps unique within one pass without colliding with "rec-<ms>" names new
// recordings use.
function planMigration(baseDir, rows, now) {
  var base = String(baseDir == null ? "" : baseDir);
  if (!base || !Array.isArray(rows)) return [];
  var plan = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var filePath = row && row.filePath;
    if (!filePath) continue;
    if (isManagedRecording(base, filePath)) continue;
    if (String(filePath).indexOf("..") !== -1) continue;
    var to = buildRecordingPath(base, filePath, "m" + now + "-" + plan.length);
    plan.push({ id: row.id, from: filePath, to: to });
  }
  return plan;
}

module.exports = {
  RECORDINGS_SUBDIR: RECORDINGS_SUBDIR,
  getExtension: getExtension,
  buildRecordingPath: buildRecordingPath,
  isManagedRecording: isManagedRecording,
  planMigration: planMigration,
};
