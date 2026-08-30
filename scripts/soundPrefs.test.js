// Plain-Node test for lib/soundPrefs.js. No npm packages required — run with
// `node scripts/soundPrefs.test.js`.
const assert = require("node:assert");
const soundPrefs = require("../lib/soundPrefs");

const {
  PREFS_VERSION,
  defaultPrefs,
  builtinId,
  customId,
  normalizePrefs,
  parsePrefs,
  serializePrefs,
  isFavorite,
  toggleFavorite,
  recordPlay,
  getPlayCount,
  getLastPlayed,
  SORT_MODES,
  sortSounds,
  getRecentlyPlayed,
} = soundPrefs;

let passed = 0;
function check(description, condition) {
  assert.ok(condition, description);
  passed++;
}

// --- defaultPrefs / normalizePrefs ---------------------------------------

check("defaultPrefs has correct version", defaultPrefs().version === PREFS_VERSION);
check("defaultPrefs has empty favorites", Object.keys(defaultPrefs().favorites).length === 0);
check("defaultPrefs has empty stats", Object.keys(defaultPrefs().stats).length === 0);

check("normalizePrefs(null) returns defaults", normalizePrefs(null).version === PREFS_VERSION);
check(
  "normalizePrefs(undefined) returns defaults",
  Object.keys(normalizePrefs(undefined).favorites).length === 0
);
check("normalizePrefs('garbage string') returns defaults", (() => {
  const p = normalizePrefs("garbage string");
  return p.version === PREFS_VERSION && Object.keys(p.favorites).length === 0;
})());
check("normalizePrefs(42) returns defaults", normalizePrefs(42).version === PREFS_VERSION);
check("normalizePrefs([]) (array) returns defaults", (() => {
  const p = normalizePrefs([]);
  return p.version === PREFS_VERSION;
})());
check("normalizePrefs tolerates wrong-typed favorites", (() => {
  const p = normalizePrefs({ favorites: "nope", stats: {} });
  return Object.keys(p.favorites).length === 0;
})());
check("normalizePrefs tolerates wrong-typed stats", (() => {
  const p = normalizePrefs({ favorites: {}, stats: "nope" });
  return Object.keys(p.stats).length === 0;
})());
check("normalizePrefs ignores unknown version, forces current", (() => {
  const p = normalizePrefs({ version: 999, favorites: {}, stats: {} });
  return p.version === PREFS_VERSION;
})());
check("normalizePrefs drops falsy favorite flags", (() => {
  const p = normalizePrefs({ favorites: { a: true, b: false, c: 0 } });
  return p.favorites.a === true && !("b" in p.favorites) && !("c" in p.favorites);
})());
check("normalizePrefs drops malformed stat entries", (() => {
  const p = normalizePrefs({ stats: { a: "nope", b: { playCount: 2, lastPlayedAt: 100 } } });
  return !("a" in p.stats) && p.stats.b.playCount === 2;
})());

// --- builtinId / customId -------------------------------------------------

check("builtinId slugifies name", builtinId("Rizz") === "builtin:rizz");
check("builtinId slugifies spaces/punctuation", builtinId("Death Noise!") === "builtin:death-noise");
check("customId stringifies db id", customId(7) === "custom:7");

// --- parsePrefs / serializePrefs round-trip -------------------------------

check("parsePrefs('') returns defaults", parsePrefs("").version === PREFS_VERSION);
check("parsePrefs(null) returns defaults", parsePrefs(null).version === PREFS_VERSION);
check("parsePrefs('{not json') returns defaults on corrupt input", (() => {
  const p = parsePrefs("{not json");
  return p.version === PREFS_VERSION && Object.keys(p.favorites).length === 0;
})());
check("serializePrefs -> parsePrefs round-trip preserves favorites", (() => {
  const original = toggleFavorite(defaultPrefs(), "builtin:rizz");
  const roundTripped = parsePrefs(serializePrefs(original));
  return isFavorite(roundTripped, "builtin:rizz") === true;
})());
check("serializePrefs -> parsePrefs round-trip preserves stats", (() => {
  const original = recordPlay(defaultPrefs(), "builtin:rizz", 12345);
  const roundTripped = parsePrefs(serializePrefs(original));
  return getPlayCount(roundTripped, "builtin:rizz") === 1 && getLastPlayed(roundTripped, "builtin:rizz") === 12345;
})());

// --- toggleFavorite --------------------------------------------------------

check("toggleFavorite turns favorite on", (() => {
  const p = toggleFavorite(defaultPrefs(), "builtin:rizz");
  return isFavorite(p, "builtin:rizz") === true;
})());
check("toggleFavorite turns favorite back off", (() => {
  let p = toggleFavorite(defaultPrefs(), "builtin:rizz");
  p = toggleFavorite(p, "builtin:rizz");
  return isFavorite(p, "builtin:rizz") === false;
})());
check("toggleFavorite does not mutate input prefs", (() => {
  const original = defaultPrefs();
  const originalFavoritesRef = original.favorites;
  toggleFavorite(original, "builtin:rizz");
  return original.favorites === originalFavoritesRef && Object.keys(original.favorites).length === 0;
})());
check("isFavorite is false for unknown id", isFavorite(defaultPrefs(), "builtin:nope") === false);

// --- recordPlay --------------------------------------------------------

check("recordPlay increments play count from 0 to 1", (() => {
  const p = recordPlay(defaultPrefs(), "builtin:rizz", 1000);
  return getPlayCount(p, "builtin:rizz") === 1;
})());
check("recordPlay increments play count across calls", (() => {
  let p = recordPlay(defaultPrefs(), "builtin:rizz", 1000);
  p = recordPlay(p, "builtin:rizz", 2000);
  return getPlayCount(p, "builtin:rizz") === 2;
})());
check("recordPlay stores injected now as lastPlayedAt", (() => {
  const p = recordPlay(defaultPrefs(), "builtin:rizz", 54321);
  return getLastPlayed(p, "builtin:rizz") === 54321;
})());
check("recordPlay defaults now to Date.now() when omitted", (() => {
  const before = Date.now();
  const p = recordPlay(defaultPrefs(), "builtin:rizz");
  const after = Date.now();
  const played = getLastPlayed(p, "builtin:rizz");
  return played >= before && played <= after;
})());
check("recordPlay does not mutate input prefs", (() => {
  const original = defaultPrefs();
  recordPlay(original, "builtin:rizz", 1);
  return Object.keys(original.stats).length === 0;
})());
check("getPlayCount is 0 for never-played id", getPlayCount(defaultPrefs(), "builtin:nope") === 0);
check("getLastPlayed is null for never-played id", getLastPlayed(defaultPrefs(), "builtin:nope") === null);

// --- sortSounds ------------------------------------------------------------

const sample = [
  { id: "a", name: "A" },
  { id: "b", name: "B" },
  { id: "c", name: "C" },
];

check("SORT_MODES contains all four modes", (() => {
  return (
    SORT_MODES.length === 4 &&
    ["default", "favorites", "mostPlayed", "recent"].every((m) => SORT_MODES.includes(m))
  );
})());

check("sortSounds 'default' preserves original order", (() => {
  const sorted = sortSounds(sample, defaultPrefs(), "default");
  return sorted.map((s) => s.id).join(",") === "a,b,c";
})());

check("sortSounds 'default' on empty prefs works (no favorites/stats)", (() => {
  const sorted = sortSounds(sample, defaultPrefs(), "default");
  return sorted.length === 3;
})());

check("sortSounds 'favorites' pins favorite first, keeps relative order otherwise", (() => {
  const prefs = toggleFavorite(defaultPrefs(), "c");
  const sorted = sortSounds(sample, prefs, "favorites");
  return sorted.map((s) => s.id).join(",") === "c,a,b";
})());

check("sortSounds 'favorites' with no favorites falls back to original order", (() => {
  const sorted = sortSounds(sample, defaultPrefs(), "favorites");
  return sorted.map((s) => s.id).join(",") === "a,b,c";
})());

check("sortSounds 'mostPlayed' sorts descending by play count", (() => {
  let prefs = defaultPrefs();
  prefs = recordPlay(prefs, "b", 1);
  prefs = recordPlay(prefs, "b", 2);
  prefs = recordPlay(prefs, "c", 3);
  const sorted = sortSounds(sample, prefs, "mostPlayed");
  return sorted.map((s) => s.id).join(",") === "b,c,a";
})());

check("sortSounds 'mostPlayed' with empty prefs keeps stable original-index tie-break", (() => {
  const sorted = sortSounds(sample, defaultPrefs(), "mostPlayed");
  return sorted.map((s) => s.id).join(",") === "a,b,c";
})());

check("sortSounds 'recent' sorts descending by lastPlayedAt, never-played last", (() => {
  let prefs = defaultPrefs();
  prefs = recordPlay(prefs, "a", 100);
  prefs = recordPlay(prefs, "c", 200);
  const sorted = sortSounds(sample, prefs, "recent");
  return sorted.map((s) => s.id).join(",") === "c,a,b";
})());

check("sortSounds tie-break is deterministic (equal play counts keep original index order)", (() => {
  let prefs = defaultPrefs();
  prefs = recordPlay(prefs, "a", 5);
  prefs = recordPlay(prefs, "b", 5);
  prefs = recordPlay(prefs, "c", 5);
  const sorted = sortSounds(sample, prefs, "mostPlayed");
  return sorted.map((s) => s.id).join(",") === "a,b,c";
})());

check("sortSounds does not mutate the input array", (() => {
  const copy = sample.slice();
  const prefs = toggleFavorite(defaultPrefs(), "c");
  sortSounds(sample, prefs, "favorites");
  return sample.map((s) => s.id).join(",") === copy.map((s) => s.id).join(",");
})());

check("sortSounds returns a new array reference", sortSounds(sample, defaultPrefs(), "default") !== sample);

// --- getRecentlyPlayed -------------------------------------------------

check("getRecentlyPlayed excludes never-played items", (() => {
  const prefs = recordPlay(defaultPrefs(), "a", 100);
  const recent = getRecentlyPlayed(sample, prefs, 10);
  return recent.length === 1 && recent[0].id === "a";
})());

check("getRecentlyPlayed respects limit", (() => {
  let prefs = defaultPrefs();
  prefs = recordPlay(prefs, "a", 100);
  prefs = recordPlay(prefs, "b", 200);
  prefs = recordPlay(prefs, "c", 300);
  const recent = getRecentlyPlayed(sample, prefs, 2);
  return recent.length === 2 && recent.map((s) => s.id).join(",") === "c,b";
})());

check("getRecentlyPlayed with nothing played returns empty array", (() => {
  const recent = getRecentlyPlayed(sample, defaultPrefs(), 5);
  return recent.length === 0;
})());

console.log(`soundPrefs.test.js: ${passed} assertions passed`);
