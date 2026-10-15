// Plain-Node test for lib/recordingFiles.js. No npm packages required — run
// with `node scripts/recordingFiles.test.js`.
const assert = require("node:assert");
const recordingFiles = require("../lib/recordingFiles");

const { RECORDINGS_SUBDIR, getExtension, buildRecordingPath, isManagedRecording } =
  recordingFiles;

let passed = 0;
function check(description, condition) {
  assert.ok(condition, description);
  passed++;
}

// --- getExtension ----------------------------------------------------------

check(
  "getExtension returns .m4a for an m4a uri",
  getExtension("file:///cache/sound.m4a") === ".m4a"
);
check(
  "getExtension returns .caf for a caf uri",
  getExtension("file:///cache/sound.caf") === ".caf"
);
check(
  "getExtension returns .3gp for a 3gp uri",
  getExtension("file:///cache/sound.3gp") === ".3gp"
);
check(
  "getExtension falls back to .m4a when there is no extension",
  getExtension("file:///cache/sound") === ".m4a"
);
check(
  "getExtension ignores a query string",
  getExtension("file:///cache/sound.caf?token=abc123") === ".caf"
);
check(
  "getExtension falls back to .m4a for a query string with no extension",
  getExtension("file:///cache/sound?token=abc123") === ".m4a"
);
check("getExtension tolerates null", getExtension(null) === ".m4a");
check("getExtension tolerates undefined", getExtension(undefined) === ".m4a");

// --- buildRecordingPath -----------------------------------------------------

check(
  "buildRecordingPath joins baseDir, recordings subdir, rec-<now>, and extension",
  buildRecordingPath("file:///docs/", "file:///cache/sound.m4a", 12345) ===
    "file:///docs/recordings/rec-12345.m4a"
);
check(
  "buildRecordingPath preserves the source extension",
  buildRecordingPath("file:///docs/", "file:///cache/sound.caf", 1) ===
    "file:///docs/recordings/rec-1.caf"
);
check(
  "buildRecordingPath falls back to .m4a when the source has no extension",
  buildRecordingPath("file:///docs/", "file:///cache/sound", 1) ===
    "file:///docs/recordings/rec-1.m4a"
);
check(
  "buildRecordingPath ignores a query string on the source uri",
  buildRecordingPath("file:///docs/", "file:///cache/sound.3gp?x=1", 7) ===
    "file:///docs/recordings/rec-7.3gp"
);

// --- isManagedRecording ------------------------------------------------------

check(
  "isManagedRecording is true for a path under baseDir + recordings/",
  isManagedRecording("file:///docs/", "file:///docs/recordings/rec-1.m4a") === true
);
check(
  "isManagedRecording is false for a cache path",
  isManagedRecording("file:///docs/", "file:///cache/sound.m4a") === false
);
check(
  "isManagedRecording is false for a path outside the recordings folder",
  isManagedRecording("file:///docs/", "file:///docs/other/rec-1.m4a") === false
);
check(
  "isManagedRecording is false for a path under a different baseDir",
  isManagedRecording("file:///docs/", "file:///elsewhere/recordings/rec-1.m4a") === false
);
check(
  "isManagedRecording tolerates null/undefined",
  isManagedRecording(null, null) === false && isManagedRecording(undefined, undefined) === false
);
check(
  "isManagedRecording is false when baseDir is empty (e.g. web)",
  isManagedRecording(null, "recordings/rec-1.m4a") === false
);
check(
  "isManagedRecording rejects traversal out of the recordings folder",
  isManagedRecording("file:///docs/", "file:///docs/recordings/../secret.db") === false
);
check(
  "RECORDINGS_SUBDIR is the expected literal",
  RECORDINGS_SUBDIR === "recordings/"
);

console.log(`recordingFiles.test.js: ${passed} assertions passed`);
