// Plain-Node test for lib/prefsStore.js. No npm packages required — run with
// `node scripts/prefsStore.test.js`.
const assert = require("node:assert");
const { createPrefsStore } = require("../lib/prefsStore");
const soundPrefs = require("../lib/soundPrefs");

const { defaultPrefs, recordPlay, clearRecents, getLastPlayed, getPlayCount } = soundPrefs;

let passed = 0;
function check(description, condition) {
  assert.ok(condition, description);
  passed++;
}

// Deferred promise helper so tests control exactly when `load()` resolves.
function deferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

// --- update() before init() resolves is a no-op ----------------------------

(function () {
  let saveCalls = 0;
  const load = deferred();
  const store = createPrefsStore({
    load: () => load.promise,
    save: () => {
      saveCalls++;
    },
  });

  store.init();
  store.update((current) => recordPlay(current, "a", 1));

  check("update() before ready is a no-op (ready stays false)", store.getState().ready === false);
  check("update() before ready never calls save()", saveCalls === 0);
})();

// --- init() called twice only calls load() once -----------------------------

(function () {
  let loadCalls = 0;
  const store = createPrefsStore({
    load: () => {
      loadCalls++;
      return Promise.resolve(defaultPrefs());
    },
    save: () => {},
  });

  store.init();
  store.init();
  store.init();

  check("init() called multiple times only calls load() once", loadCalls === 1);
})();

// --- after load resolves, ready is true and loaded prefs are exposed -------

async function testLoadResolves() {
  const preloaded = recordPlay(defaultPrefs(), "a", 100);
  const store = createPrefsStore({
    load: () => Promise.resolve(preloaded),
    save: () => {},
  });

  await store.init();

  const state = store.getState();
  check("after load resolves, ready is true", state.ready === true);
  check("after load resolves, loaded prefs are exposed", getLastPlayed(state.prefs, "a") === 100);
}

// --- update() notifies every subscriber and calls save() with new state ----

async function testUpdateNotifiesAndSaves() {
  let savedWith = null;
  const store = createPrefsStore({
    load: () => Promise.resolve(defaultPrefs()),
    save: (next) => {
      savedWith = next;
    },
  });
  await store.init();

  let notifiedA = 0;
  let notifiedB = 0;
  store.subscribe(() => {
    notifiedA++;
  });
  store.subscribe(() => {
    notifiedB++;
  });

  store.update((current) => recordPlay(current, "a", 200));

  check("update() notifies subscriber A", notifiedA === 1);
  check("update() notifies subscriber B", notifiedB === 1);
  check("update() calls save() with the new state", savedWith !== null && getLastPlayed(savedWith, "a") === 200);
  check("update() result is reflected in getState()", getLastPlayed(store.getState().prefs, "a") === 200);
}

// --- update() whose fn returns the same reference is a full no-op ----------

async function testNoOpUpdate() {
  let saveCalls = 0;
  const store = createPrefsStore({
    load: () => Promise.resolve(defaultPrefs()),
    save: () => {
      saveCalls++;
    },
  });
  await store.init();

  let notified = 0;
  store.subscribe(() => {
    notified++;
  });

  const before = store.getState();
  store.update((current) => current); // identity fn: same reference back

  check("no-op update() (same reference) does not notify", notified === 0);
  check("no-op update() (same reference) does not save", saveCalls === 0);
  check("no-op update() (same reference) leaves state reference unchanged", store.getState() === before);
}

// --- unsubscribe stops further notifications --------------------------------

async function testUnsubscribe() {
  const store = createPrefsStore({
    load: () => Promise.resolve(defaultPrefs()),
    save: () => {},
  });
  await store.init();

  let notified = 0;
  const unsubscribe = store.subscribe(() => {
    notified++;
  });

  store.update((current) => recordPlay(current, "a", 1));
  check("subscriber is notified before unsubscribing", notified === 1);

  unsubscribe();
  store.update((current) => recordPlay(current, "a", 2));
  check("unsubscribe() stops further notifications", notified === 1);
}

// --- two subscribers (simulating the two screens) both see the update ------
// This is the regression test for the actual bug: app/soundBoard.js and
// app/Custom.js each call useSoundPrefs(), and both must observe the same
// shared prefs after either one writes — e.g. clearing recents on one screen
// must be visible on the other, not silently undone by its stale copy.

async function testTwoScreensShareState() {
  const seeded = recordPlay(defaultPrefs(), "a", 500);
  const store = createPrefsStore({
    load: () => Promise.resolve(seeded),
    save: () => {},
  });
  await store.init();

  // Simulate "screen A" (e.g. app/soundBoard.js) and "screen B" (e.g.
  // app/Custom.js) each reading the store's snapshot after every notify,
  // the way useSyncExternalStore-driven subscribers would.
  let screenAPrefs = store.getState().prefs;
  let screenBPrefs = store.getState().prefs;
  store.subscribe(() => {
    screenAPrefs = store.getState().prefs;
  });
  store.subscribe(() => {
    screenBPrefs = store.getState().prefs;
  });

  check("both screens see the same initial lastPlayedAt", getLastPlayed(screenAPrefs, "a") === 500);

  // "Screen B" clears recents using the real clearRecents from soundPrefs.js.
  store.update((current) => clearRecents(current));

  check("screen A observes the clear", getLastPlayed(screenAPrefs, "a") === null);
  check("screen B observes the clear", getLastPlayed(screenBPrefs, "a") === null);
  check("the clear preserved playCount for both screens", getPlayCount(screenAPrefs, "a") === 1 && getPlayCount(screenBPrefs, "a") === 1);
  check("both screens see the exact same prefs object reference", screenAPrefs === screenBPrefs);
}

async function main() {
  await testLoadResolves();
  await testUpdateNotifiesAndSaves();
  await testNoOpUpdate();
  await testUnsubscribe();
  await testTwoScreensShareState();

  console.log(`prefsStore.test.js: ${passed} assertions passed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
