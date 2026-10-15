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

module.exports = {
  RECORDINGS_SUBDIR: RECORDINGS_SUBDIR,
  getExtension: getExtension,
  buildRecordingPath: buildRecordingPath,
  isManagedRecording: isManagedRecording,
};
