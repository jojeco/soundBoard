// Plain-Node test for lib/soundNames.js. No npm packages required — run
// with `node scripts/soundNames.test.js`.
const assert = require("node:assert");
const soundNames = require("../lib/soundNames");

const { MAX_SOUND_NAME_LENGTH, normalizeSoundName, uniqueSoundName, validateNewSoundName, validateRename } =
  soundNames;

let passed = 0;
function check(description, condition) {
  assert.ok(condition, description);
  passed++;
}

// --- normalizeSoundName ------------------------------------------------------

check("normalizeSoundName trims leading/trailing whitespace", normalizeSoundName("  Boing  ") === "Boing");
check(
  "normalizeSoundName collapses internal whitespace runs",
  normalizeSoundName("Air   Horn\tBlast") === "Air Horn Blast"
);
check("normalizeSoundName tolerates null", normalizeSoundName(null) === "");
check("normalizeSoundName tolerates undefined", normalizeSoundName(undefined) === "");
check("normalizeSoundName turns whitespace-only input into empty string", normalizeSoundName("   ") === "");

check("MAX_SOUND_NAME_LENGTH is 40", MAX_SOUND_NAME_LENGTH === 40);
const longName = "a".repeat(60);
const normalizedLong = normalizeSoundName(longName);
check("normalizeSoundName cuts to MAX_SOUND_NAME_LENGTH", normalizedLong.length === 40);
check(
  "normalizeSoundName trims again after cutting",
  normalizeSoundName("a".repeat(39) + "   " + "b".repeat(10)) === "a".repeat(39)
);

// --- uniqueSoundName ----------------------------------------------------------

check(
  "uniqueSoundName returns base unchanged when free",
  uniqueSoundName("Boing", ["Other"]) === "Boing"
);
check(
  "uniqueSoundName is case-insensitive when detecting a duplicate",
  uniqueSoundName("boing", ["Boing"]) === "boing 2"
);
check(
  "uniqueSoundName tries 2, then 3, ... until free",
  uniqueSoundName("New Sound", ["New Sound", "New Sound 2"]) === "New Sound 3"
);

const longBase = "a".repeat(40);
const suffixed = uniqueSoundName(longBase, [longBase]);
check(
  "uniqueSoundName shortens a 40-char base so the suffixed result still fits within 40",
  suffixed === "a".repeat(38) + " 2"
);

// --- validateNewSoundName -------------------------------------------------------

check(
  "validateNewSoundName turns an empty name into 'New Sound'",
  validateNewSoundName("", []).name === "New Sound"
);
check(
  "validateNewSoundName turns a whitespace-only name into 'New Sound'",
  validateNewSoundName("   ", []).name === "New Sound"
);
check(
  "validateNewSoundName de-dupes 'New Sound' into 'New Sound 2'",
  validateNewSoundName("", ["New Sound"]).name === "New Sound 2"
);
check(
  "validateNewSoundName de-dupes again into 'New Sound 3'",
  validateNewSoundName("", ["New Sound", "New Sound 2"]).name === "New Sound 3"
);
check(
  "validateNewSoundName trims and keeps a real name as-is when free",
  validateNewSoundName("  Air Horn  ", []).name === "Air Horn"
);

// --- validateRename -------------------------------------------------------------

const emptyResult = validateRename("   ", ["Boing"], "Boing");
check("validateRename rejects an empty name", emptyResult.ok === false);
check("validateRename's empty-name error matches", emptyResult.error === "Name can't be empty");

const dupResult = validateRename("Air Horn", ["Boing", "Air Horn"], "Boing");
check("validateRename rejects a duplicate name", dupResult.ok === false);
check(
  "validateRename's duplicate-name error matches",
  dupResult.error === "A sound with that name already exists"
);

const sameNameResult = validateRename("Boing", ["Boing", "Air Horn"], "Boing");
check("validateRename accepts renaming a sound to its own current name", sameNameResult.ok === true);

const capsResult = validateRename("BOING", ["Boing", "Air Horn"], "Boing");
check(
  "validateRename accepts a capitals-only change of a sound's own name",
  capsResult.ok === true && capsResult.name === "BOING"
);

console.log(`soundNames.test.js: ${passed} assertions passed`);
