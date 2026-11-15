// Plain-Node test for lib/soundSources.js. No npm packages required — run
// with `node scripts/soundSources.test.js`.
const assert = require("node:assert");
const soundSources = require("../lib/soundSources");

const { customSoundEntries, mergeSoundSources } = soundSources;

let passed = 0;
function check(description, condition) {
  assert.ok(condition, description);
  passed++;
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// === customSoundEntries =====================================================

check("customSoundEntries(null) -> []", deepEqual(customSoundEntries(null), []));
check("customSoundEntries(undefined) -> []", deepEqual(customSoundEntries(undefined), []));
check("customSoundEntries('x') -> []", deepEqual(customSoundEntries("x"), []));
check("customSoundEntries([]) -> []", deepEqual(customSoundEntries([]), []));

check(
  "customSoundEntries skips a null row",
  deepEqual(customSoundEntries([null, { id: 1, name: "A", filePath: "/a.m4a" }]), [
    { id: "custom:1", name: "A", source: { uri: "/a.m4a" } },
  ])
);
check(
  "customSoundEntries skips a non-object row",
  deepEqual(customSoundEntries(["nope", { id: 2, name: "B", filePath: "/b.m4a" }]), [
    { id: "custom:2", name: "B", source: { uri: "/b.m4a" } },
  ])
);
check(
  "customSoundEntries skips a row with a missing filePath",
  deepEqual(customSoundEntries([{ id: 3, name: "C" }]), [])
);
check(
  "customSoundEntries skips a row with an empty-string filePath",
  deepEqual(customSoundEntries([{ id: 4, name: "D", filePath: "" }]), [])
);
check(
  "customSoundEntries skips a row with a non-string filePath",
  deepEqual(customSoundEntries([{ id: 5, name: "E", filePath: 123 }]), [])
);

check(
  "customSoundEntries produces the right {id, name, source} shape",
  deepEqual(customSoundEntries([{ id: 7, name: "Horn", filePath: "/recordings/horn.m4a" }]), [
    { id: "custom:7", name: "Horn", source: { uri: "/recordings/horn.m4a" } },
  ])
);

check(
  "customSoundEntries falls back to 'Recording' when name is missing",
  customSoundEntries([{ id: 8, filePath: "/r.m4a" }])[0].name === "Recording"
);
check(
  "customSoundEntries falls back to 'Recording' when name is empty string",
  customSoundEntries([{ id: 9, name: "", filePath: "/r.m4a" }])[0].name === "Recording"
);
check(
  "customSoundEntries falls back to 'Recording' when name is null",
  customSoundEntries([{ id: 10, name: null, filePath: "/r.m4a" }])[0].name === "Recording"
);

// === mergeSoundSources =======================================================

const BUILTINS = [
  { id: "builtin:vine", name: "Vine" },
  { id: "builtin:fail", name: "Fail" },
];
const CUSTOMS = [
  { id: "custom:1", name: "Horn" },
  { id: "custom:2", name: "Boop" },
];

check(
  "mergeSoundSources puts builtins first, customs after",
  deepEqual(mergeSoundSources(BUILTINS, CUSTOMS).map((s) => s.id), [
    "builtin:vine",
    "builtin:fail",
    "custom:1",
    "custom:2",
  ])
);

check(
  "mergeSoundSources keeps only the first occurrence of a duplicate id",
  deepEqual(
    mergeSoundSources(
      [{ id: "builtin:vine", name: "First" }],
      [{ id: "builtin:vine", name: "Second" }]
    ),
    [{ id: "builtin:vine", name: "First" }]
  )
);

check("mergeSoundSources(null, null) -> []", deepEqual(mergeSoundSources(null, null), []));
check("mergeSoundSources(undefined, undefined) -> []", deepEqual(mergeSoundSources(undefined, undefined), []));
check(
  "mergeSoundSources tolerates a garbage entry without throwing",
  deepEqual(mergeSoundSources([null, { id: "builtin:vine", name: "Vine" }], [undefined]), [
    { id: "builtin:vine", name: "Vine" },
  ])
);

console.log(`soundSources.test.js: ${passed} assertions passed`);
