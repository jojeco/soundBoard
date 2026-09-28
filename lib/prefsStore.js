// Tiny framework-agnostic store that fans a single prefs value out to any
// number of subscribers. Exists so hooks/useSoundPrefs.js can back every
// mounted screen (app/soundBoard.js "Premade" + app/Custom.js) with ONE
// shared prefs object instead of each screen keeping its own useState copy —
// see NEXT.md for the bug this fixes (stale screens undo each other's
// clearRecents/toggleFavorite/recordPlay writes).
//
// CommonJS on purpose, same convention as lib/soundPrefs.js: this repo has no
// `"type": "module"` in package.json, so Node treats `.js` as CJS. Do NOT use
// ESM `export` syntax here — consumers do
// `import prefsStore from "./prefsStore"` + destructure for safe interop.
//
// No React import, no AsyncStorage import: load/save are injected so this
// file stays pure and independently testable with plain Node (see
// scripts/prefsStore.test.js).

function createPrefsStore(options) {
  var load = options.load;
  var save = options.save;

  // Optional pre-load value (the hook passes defaultPrefs()) so consumers
  // never see a null prefs object before load() resolves.
  var prefs = options.initial !== undefined ? options.initial : null;
  var ready = false;
  // `state` is only ever reassigned when prefs/ready actually change, so
  // getState() returns the SAME reference across calls when nothing changed
  // — required for useSyncExternalStore (and any manual subscriber) to avoid
  // re-rendering / re-subscribing on every call.
  var state = { prefs: prefs, ready: ready };
  var listeners = [];
  var loadPromise = null;

  function setState(nextPrefs, nextReady) {
    prefs = nextPrefs;
    ready = nextReady;
    state = { prefs: prefs, ready: ready };
  }

  function notify() {
    // Snapshot the listener list so a listener unsubscribing mid-notify
    // (e.g. a screen unmounting while another screen's update is in flight)
    // can't skip or double-call a sibling.
    var current = listeners.slice();
    for (var i = 0; i < current.length; i++) {
      current[i]();
    }
  }

  function getState() {
    return state;
  }

  function subscribe(listener) {
    listeners.push(listener);
    return function unsubscribe() {
      var index = listeners.indexOf(listener);
      if (index !== -1) listeners.splice(index, 1);
    };
  }

  // Loads exactly once no matter how many times init() is called (e.g. once
  // per mounted screen): the first call kicks off load() and caches the
  // in-flight/resolved promise; every later call just returns it.
  function init() {
    if (loadPromise) return loadPromise;
    loadPromise = load().then(function (loaded) {
      setState(loaded, true);
      notify();
      return loaded;
    });
    return loadPromise;
  }

  // Pre-load writes are dropped (matches the previous per-screen behavior,
  // where an update before the load effect resolved was just overwritten by
  // it). Once ready, a no-op update (fn returns the same reference back) is
  // skipped entirely: no notify, no save.
  function update(fn) {
    if (!ready) return;
    var next = fn(prefs);
    if (next === prefs) return;
    setState(next, true);
    notify();
    save(next);
  }

  return {
    getState: getState,
    subscribe: subscribe,
    init: init,
    update: update,
  };
}

module.exports = { createPrefsStore: createPrefsStore };
