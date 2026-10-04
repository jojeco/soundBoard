// Plain-Node test for lib/combos.js. No npm packages required — run with
// `node scripts/combos.test.js`.
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const combos = require("../lib/combos");
const soundPrefs = require("../lib/soundPrefs");

const {
  COMBOS_VERSION,
  MAX_STEPS,
  MAX_COMBOS,
  DEFAULT_DELAY_MS,
  MAX_NAME_LENGTH,
  defaultCombos,
  clampDelay,
  sanitizeName,
  normalizeStep,
  normalizeCombo,
  normalizeCombos,
  parseCombos,
  serializeCombos,
  makeComboId,
  createCombo,
  updateCombo,
  deleteCombo,
  addStep,
  removeStep,
  moveStep,
  setStepDelay,
  nudgeStepDelay,
  resolveSteps,
  buildSchedule,
  scheduleDuration,
  comboSummary,
  createComboRunner,
} = combos;

let passed = 0;
function check(description, condition) {
  assert.ok(condition, description);
  passed++;
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const SOUNDS = [
  { id: "builtin:vine", name: "Vine" },
  { id: "builtin:record", name: "Record" },
  { id: "builtin:fail", name: "Fail" },
  { id: "builtin:rizz", name: "Rizz" },
  { id: "builtin:pew", name: "Pew" },
  { id: "builtin:ack", name: "ack" },
];

// === 2. Migration / old-install safety =====================================

check("parseCombos(null) -> defaults", deepEqual(parseCombos(null), defaultCombos()));
check("parseCombos('') -> defaults", deepEqual(parseCombos(""), defaultCombos()));
check("parseCombos('not json') -> defaults", deepEqual(parseCombos("not json"), defaultCombos()));
check("parseCombos('[]') -> defaults", deepEqual(parseCombos("[]"), defaultCombos()));

// 2b: a hand-built pre-feature PREFS blob fed to parseCombos must not throw
// and must yield empty combos; the same string fed to soundPrefs.parsePrefs
// must still work correctly — proves combos code doesn't corrupt the prefs
// format.
const legacyPrefsBlob =
  '{"version":1,"favorites":{"builtin:vine":true},"stats":{"builtin:vine":{"playCount":3,"lastPlayedAt":1700000000000}}}';

check(
  "parseCombos on a pre-feature prefs blob does not throw and yields empty combos",
  deepEqual(parseCombos(legacyPrefsBlob), defaultCombos())
);

const prefsFromSameBlob = soundPrefs.parsePrefs(legacyPrefsBlob);
check(
  "the SAME string fed to soundPrefs.parsePrefs still gives favorites['builtin:vine'] === true",
  prefsFromSameBlob.favorites["builtin:vine"] === true
);
check(
  "the SAME string fed to soundPrefs.parsePrefs still gives playCount 3",
  prefsFromSameBlob.stats["builtin:vine"].playCount === 3
);

// 2c: a hand-built "future/partial" combos blob gets repaired.
const partialBlob = {
  version: 7,
  combos: [
    { name: "Has no id", steps: [{ soundId: "builtin:vine", delayMs: -50 }] },
    {
      id: "combo-2",
      steps: [
        { soundId: 42, delayMs: 100 }, // non-string soundId: dropped
        { soundId: "builtin:record", delayMs: 99999 }, // clamp to 5000
        { soundId: "builtin:fail", delayMs: "abc" }, // non-number: default 300
      ],
    },
    { id: "combo-2", name: "Duplicate id, dropped", steps: [] }, // dup: keep first
  ],
};
const repaired = normalizeCombos(partialBlob);

check("unknown version is normalized to 1", repaired.version === 1);
check("missing id becomes combo-legacy-<i>", repaired.combos[0].id === "combo-legacy-0");
check("missing name becomes 'Combo'", repaired.combos[1].name === "Combo");
check("delay -50 clamps to 0", repaired.combos[0].steps[0].delayMs === 0);
check("non-string soundId step is dropped", repaired.combos[1].steps.length === 2);
check("delay 99999 clamps to 5000", repaired.combos[1].steps[0].delayMs === 5000);
check("non-number delay 'abc' becomes DEFAULT_DELAY_MS (300)", repaired.combos[1].steps[1].delayMs === 300 && DEFAULT_DELAY_MS === 300);
check("duplicate combo id keeps the first", repaired.combos.length === 2 && repaired.combos[1].id === "combo-2");
check("normalizeCombos never throws on a weird nested blob", typeof repaired === "object");

// 2d: round trip.
const roundTripSource = { version: 1, combos: [{ id: "combo-a", name: "A", steps: [{ soundId: "builtin:vine", delayMs: 200 }], createdAt: 5 }] };
check(
  "parseCombos(serializeCombos(s)) deep-equals normalizeCombos(s)",
  deepEqual(parseCombos(serializeCombos(roundTripSource)), normalizeCombos(roundTripSource))
);

// Extra migration-safety checks: wrong types / missing keys.
check("normalizeCombos(undefined) -> defaults", deepEqual(normalizeCombos(undefined), defaultCombos()));
check("normalizeCombos('string') -> defaults", deepEqual(normalizeCombos("string"), defaultCombos()));
check("normalizeCombos({}) (missing combos key) -> empty combos", deepEqual(normalizeCombos({}), defaultCombos()));
check("normalizeCombos({combos: 'not-array'}) -> empty combos", deepEqual(normalizeCombos({ combos: "not-array" }), defaultCombos()));
check("normalizeCombo(null, 0) -> null", normalizeCombo(null, 0) === null);
check("normalizeCombo('x', 0) -> null", normalizeCombo("x", 0) === null);
check("normalizeStep(null) -> null", normalizeStep(null) === null);
check("normalizeStep({soundId:''}) -> null (empty soundId)", normalizeStep({ soundId: "" }) === null);
check("clampDelay(NaN) -> DEFAULT_DELAY_MS", clampDelay(NaN) === DEFAULT_DELAY_MS);
check("clampDelay('x') -> DEFAULT_DELAY_MS", clampDelay("x") === DEFAULT_DELAY_MS);
check("clampDelay(1.6) rounds to 2", clampDelay(1.6) === 2);
check("sanitizeName('  a   b  ') collapses whitespace", sanitizeName("  a   b  ") === "a b");
check("sanitizeName('') -> 'Combo'", sanitizeName("") === "Combo");
check("sanitizeName(null) -> 'Combo'", sanitizeName(null) === "Combo");
check("sanitizeName cuts to MAX_NAME_LENGTH", sanitizeName("x".repeat(100)).length === MAX_NAME_LENGTH);

// === 3. Model ===============================================================

(function () {
  const empty = defaultCombos();
  const before = JSON.stringify(empty);
  const { state, id } = createCombo(empty, "My Combo", [{ soundId: "builtin:vine", delayMs: 100 }], 1000);
  check("createCombo appends a combo", state.combos.length === 1);
  check("createCombo returns a non-null id", typeof id === "string" && id.length > 0);
  check("createCombo input is not mutated", JSON.stringify(empty) === before);

  // Fill to MAX_COMBOS, then verify the cap.
  let full = defaultCombos();
  for (let i = 0; i < MAX_COMBOS; i++) {
    full = createCombo(full, "C" + i, [], 2000 + i).state;
  }
  check("state reaches MAX_COMBOS combos", full.combos.length === MAX_COMBOS);
  const atCap = createCombo(full, "Overflow", [], 9999);
  check("createCombo at MAX_COMBOS returns the same reference", atCap.state === full);
  check("createCombo at MAX_COMBOS returns id === null", atCap.id === null);
})();

(function () {
  const seeded = createCombo(defaultCombos(), "Seed", [{ soundId: "builtin:vine", delayMs: 10 }], 1).state;
  const id = seeded.combos[0].id;

  const beforeUpdate = JSON.stringify(seeded);
  const updated = updateCombo(seeded, id, { name: "Renamed" });
  check("updateCombo renames", updated.combos[0].name === "Renamed");
  check("updateCombo on unknown id returns the same reference", updateCombo(seeded, "nope", { name: "x" }) === seeded);
  check("updateCombo does not mutate its input", JSON.stringify(seeded) === beforeUpdate);

  const beforeDelete = JSON.stringify(seeded);
  const deleted = deleteCombo(seeded, id);
  check("deleteCombo removes the combo", deleted.combos.length === 0);
  check("deleteCombo on unknown id returns the same reference", deleteCombo(seeded, "nope") === seeded);
  check("deleteCombo does not mutate its input", JSON.stringify(seeded) === beforeDelete);
})();

check("makeComboId is deterministic for the same now", makeComboId(12345, []) === makeComboId(12345, []));
check("makeComboId resolves one collision with -2", makeComboId(1, [makeComboId(1, [])]) === makeComboId(1, []) + "-2");
check(
  "makeComboId resolves two collisions with -3",
  makeComboId(1, [makeComboId(1, []), makeComboId(1, []) + "-2"]) === makeComboId(1, []) + "-3"
);

// Step helpers: bounds, no-ops, immutability.
(function () {
  let steps = [];
  for (let i = 0; i < MAX_STEPS; i++) {
    steps = addStep(steps, "builtin:vine");
  }
  check("addStep fills up to MAX_STEPS", steps.length === MAX_STEPS);
  const atCap = addStep(steps, "builtin:record");
  check("addStep at MAX_STEPS is a no-op (same reference)", atCap === steps);

  const before = JSON.stringify(steps);
  addStep(steps, "builtin:record");
  check("addStep does not mutate its input", JSON.stringify(steps) === before);
})();

(function () {
  const steps = [
    { soundId: "builtin:vine", delayMs: 0 },
    { soundId: "builtin:record", delayMs: 100 },
  ];
  check("removeStep out-of-range (negative) is a no-op", removeStep(steps, -1) === steps);
  check("removeStep out-of-range (too high) is a no-op", removeStep(steps, 5) === steps);
  check("removeStep removes the right entry", removeStep(steps, 0)[0].soundId === "builtin:record");

  check("moveStep at the left edge is a no-op", moveStep(steps, 0, -1) === steps);
  check("moveStep at the right edge is a no-op", moveStep(steps, 1, 1) === steps);
  const moved = moveStep(steps, 0, 1);
  check("moveStep swaps adjacent entries", moved[0].soundId === "builtin:record" && moved[1].soundId === "builtin:vine");

  check("setStepDelay out-of-range is a no-op", setStepDelay(steps, 9, 500) === steps);
  check("setStepDelay clamps and applies", setStepDelay(steps, 1, 99999)[1].delayMs === 5000);

  check("nudgeStepDelay out-of-range is a no-op", nudgeStepDelay(steps, 9, 100) === steps);
  check("nudgeStepDelay adds and clamps", nudgeStepDelay(steps, 1, 50)[1].delayMs === 150);
  check("nudgeStepDelay never goes below 0", nudgeStepDelay(steps, 0, -1000)[0].delayMs === 0);

  const before = JSON.stringify(steps);
  removeStep(steps, 0);
  moveStep(steps, 0, 1);
  setStepDelay(steps, 1, 1);
  nudgeStepDelay(steps, 1, 1);
  check("none of the step helpers mutate their input", JSON.stringify(steps) === before);
})();

// === 4. Schedule ============================================================

(function () {
  const combo = {
    id: "c1",
    name: "Test",
    steps: [
      { soundId: "builtin:vine", delayMs: 0 },
      { soundId: "builtin:record", delayMs: 400 },
      { soundId: "builtin:fail", delayMs: 800 },
    ],
    createdAt: 0,
  };
  const resolved = resolveSteps(combo, SOUNDS);
  check("resolveSteps keeps all steps when every soundId is known", resolved.length === 3);
  const schedule = buildSchedule(resolved);
  check("buildSchedule cumulative at values are [0,400,1200]", deepEqual(schedule.map((s) => s.at), [0, 400, 1200]));
  check("scheduleDuration returns the last at", scheduleDuration(schedule) === 1200);
  check("scheduleDuration of an empty schedule is 0", scheduleDuration([]) === 0);

  const comboWithUnknown = {
    id: "c2",
    name: "Partial",
    steps: [
      { soundId: "builtin:vine", delayMs: 0 },
      { soundId: "builtin:does-not-exist", delayMs: 100 },
      { soundId: "builtin:fail", delayMs: 200 },
    ],
    createdAt: 0,
  };
  const resolvedPartial = resolveSteps(comboWithUnknown, SOUNDS);
  check("resolveSteps drops unknown soundIds", resolvedPartial.length === 2);
  check(
    "resolveSteps keeps order/delays of the remaining steps",
    resolvedPartial[0].soundId === "builtin:vine" && resolvedPartial[1].soundId === "builtin:fail" && resolvedPartial[1].delayMs === 200
  );

  const bigCombo = {
    id: "c3",
    name: "Big",
    steps: SOUNDS.map((s) => ({ soundId: s.id, delayMs: 10 })).concat([{ soundId: SOUNDS[0].id, delayMs: 10 }]),
    createdAt: 0,
  };
  check("comboSummary truncates after 4 names with +N", comboSummary(bigCombo, SOUNDS).indexOf(" +3") !== -1);
  check("comboSummary on an empty combo returns '(empty)'", comboSummary({ id: "e", name: "Empty", steps: [], createdAt: 0 }, SOUNDS) === "(empty)");
  check(
    "comboSummary on a combo whose only step is unresolvable returns '(empty)'",
    comboSummary({ id: "e2", name: "E2", steps: [{ soundId: "nope", delayMs: 0 }], createdAt: 0 }, SOUNDS) === "(empty)"
  );
})();

// === 5. Runner (fake clock) =================================================

function makeFakeClock() {
  let now = 0;
  let timers = [];
  let nextId = 1;
  function setTimer(fn, delay) {
    const id = nextId++;
    timers.push({ id, fn, at: now + delay, seq: id });
    return id;
  }
  function clearTimer(id) {
    timers = timers.filter((t) => t.id !== id);
  }
  function advance(ms) {
    now += ms;
    for (;;) {
      const due = timers.filter((t) => t.at <= now).sort((a, b) => a.at - b.at || a.seq - b.seq);
      if (due.length === 0) break;
      const next = due[0];
      timers = timers.filter((t) => t.id !== next.id);
      next.fn();
    }
  }
  return { setTimer, clearTimer, advance };
}

(function () {
  const playCalls = [];
  const stepCalls = [];
  let doneCalls = 0;
  const clock = makeFakeClock();
  const schedule = [
    { at: 0, index: 0, soundId: "a", sound: { id: "a" } },
    { at: 400, index: 1, soundId: "b", sound: { id: "b" } },
    { at: 1200, index: 2, soundId: "c", sound: { id: "c" } },
  ];
  const runner = createComboRunner({
    schedule,
    play: (sound, index) => playCalls.push({ sound: sound.id, index }),
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    onStep: (index) => stepCalls.push(index),
    onDone: () => doneCalls++,
  });

  check("isRunning() is false before start()", runner.isRunning() === false);
  runner.start();
  check("isRunning() is true right after start()", runner.isRunning() === true);

  clock.advance(0);
  check("play is called in schedule order at t=0", playCalls.length === 1 && playCalls[0].sound === "a");

  clock.advance(400);
  check("play is called at t=400", playCalls.length === 2 && playCalls[1].sound === "b");
  check("onStep gets the right index for step 1", stepCalls[1] === 1);
  check("onDone has not fired yet (last step pending)", doneCalls === 0);

  clock.advance(800); // now at 1200
  check("play is called at t=1200 (last step)", playCalls.length === 3 && playCalls[2].sound === "c");
  check("onDone fires exactly once after the last step", doneCalls === 1);
  check("isRunning() is false after completion", runner.isRunning() === false);

  // Double start() after completion behaves like a fresh run (not "already
  // running"), but double start() WHILE running is a no-op — covered below.
})();

(function () {
  const playCalls = [];
  let doneCalls = 0;
  const clock = makeFakeClock();
  const schedule = [
    { at: 0, index: 0, soundId: "a", sound: { id: "a" } },
    { at: 500, index: 1, soundId: "b", sound: { id: "b" } },
  ];
  const runner = createComboRunner({
    schedule,
    play: (sound) => playCalls.push(sound.id),
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    onDone: () => doneCalls++,
  });

  runner.start();
  runner.start(); // double start while running: no-op
  clock.advance(0);
  check("double start() while running does not double-play step 0", playCalls.filter((s) => s === "a").length === 1);

  runner.cancel();
  check("cancel() mid-run sets isRunning() to false", runner.isRunning() === false);
  clock.advance(500);
  check("cancel() mid-run prevents the later step from playing", playCalls.indexOf("b") === -1);
  check("cancel() mid-run never calls onDone", doneCalls === 0);

  // cancel() is idempotent.
  runner.cancel();
  check("cancel() is idempotent (no throw, still not running)", runner.isRunning() === false);
})();

(function () {
  let doneCalls = 0;
  const clock = makeFakeClock();
  const runner = createComboRunner({
    schedule: [],
    play: () => {
      throw new Error("play should never be called for an empty schedule");
    },
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    onDone: () => doneCalls++,
  });
  runner.start();
  check("start() on an empty schedule calls onDone synchronously", doneCalls === 1);
  check("start() on an empty schedule leaves isRunning() false", runner.isRunning() === false);
})();

// === 6. UI-reuse smoke checks (lib-level pieces the UI is expected to call) =

check("resolveSteps/buildSchedule/comboSummary/createComboRunner are all exported", typeof resolveSteps === "function" && typeof buildSchedule === "function" && typeof comboSummary === "function" && typeof createComboRunner === "function");
check("addStep/removeStep/moveStep/nudgeStepDelay are all exported", typeof addStep === "function" && typeof removeStep === "function" && typeof moveStep === "function" && typeof nudgeStepDelay === "function");

// === 7. Module shape ========================================================

check("COMBOS_VERSION is 1", COMBOS_VERSION === 1);

// Check lib/combos.js's OWN source (not this test file's) for the CJS-only,
// no-react/no-RN/no-AsyncStorage constraint from the spec.
const combosSource = fs.readFileSync(path.join(__dirname, "../lib/combos.js"), "utf8");
check("lib/combos.js has no ESM import/export statements", !/^\s*(import|export)\b/m.test(combosSource));
check("lib/combos.js has no require() calls (no react/react-native/AsyncStorage)", !/require\(/.test(combosSource));
check("lib/combos.js uses module.exports", /module\.exports\s*=/.test(combosSource));

console.log(`combos.test.js: ${passed} assertions passed`);
