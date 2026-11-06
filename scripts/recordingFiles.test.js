// Plain-Node test for lib/recordingFiles.js. No npm packages required — run
// with `node scripts/recordingFiles.test.js`.
const assert = require("node:assert");
const recordingFiles = require("../lib/recordingFiles");

const { RECORDINGS_SUBDIR, getExtension, buildRecordingPath, isManagedRecording, planMigration } =
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

// --- planMigration -----------------------------------------------------------

check(
  "planMigration returns [] for an empty baseDir (e.g. web)",
  planMigration("", [{ id: 1, filePath: "file:///cache/sound.caf" }], 500).length === 0
);
check(
  "planMigration returns [] for non-array rows",
  planMigration("file:///docs/", null, 500).length === 0
);
check(
  "planMigration skips a row that's already managed",
  planMigration(
    "file:///docs/",
    [{ id: 1, filePath: "file:///docs/recordings/rec-1.m4a" }],
    500
  ).length === 0
);
check(
  "planMigration skips a row with an empty/null filePath",
  planMigration("file:///docs/", [{ id: 1, filePath: null }, { id: 2, filePath: "" }], 500)
    .length === 0
);
check(
  "planMigration skips a row whose filePath contains ..",
  planMigration(
    "file:///docs/",
    [{ id: 1, filePath: "file:///docs/recordings/../secret.db" }],
    500
  ).length === 0
);

const onePlan = planMigration(
  "file:///docs/",
  [{ id: 7, filePath: "file:///cache/sound.caf" }],
  500
);
check("planMigration plans a cache row", onePlan.length === 1);
check("planMigration keeps the row's id", onePlan[0].id === 7);
check("planMigration's from is the original filePath", onePlan[0].from === "file:///cache/sound.caf");
check(
  "planMigration's to is under baseDir + recordings/ and keeps the source extension",
  onePlan[0].to === "file:///docs/recordings/rec-m500-0.caf"
);

const twoPlan = planMigration(
  "file:///docs/",
  [
    { id: 1, filePath: "file:///cache/a.caf" },
    { id: 2, filePath: "file:///cache/b.caf" },
  ],
  500
);
check(
  "planMigration gives two cache rows different `to` values",
  twoPlan[0].to !== twoPlan[1].to
);

const mixPlan = planMigration(
  "file:///docs/",
  [
    { id: 1, filePath: "file:///cache/a.caf" },
    { id: 2, filePath: "file:///docs/recordings/rec-1.m4a" }, // already managed
    { id: 3, filePath: "file:///cache/b.caf" },
  ],
  500
);
check("planMigration only plans the rows that need it", mixPlan.length === 2);
check(
  "planMigration preserves row order and indexes targets by planned position, not row index",
  mixPlan[0].id === 1 && mixPlan[1].id === 3 && mixPlan[1].to.endsWith("-1.caf")
);

console.log(`recordingFiles.test.js: ${passed} assertions passed`);
