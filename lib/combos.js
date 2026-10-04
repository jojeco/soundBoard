// Pure, dependency-free "Combos" logic (saved sound sequences). Mirrors the
// lib/soundPrefs.js / lib/prefsStore.js conventions on purpose: CommonJS,
// `var`/`function`, no React or AsyncStorage import, never throws, mutators
// return NEW objects but return the SAME reference when nothing changed
// (required for lib/prefsStore.js's reference-equality bail-out).
//
// Combos live under their OWN AsyncStorage key (@soundboard/combos/v1, see
// lib/comboStorage.js) in their OWN store instance (see hooks/useCombos.js),
// reusing lib/prefsStore.js#createPrefsStore UNCHANGED. This file never
// touches lib/soundPrefs.js's {version, favorites, stats} shape — every
// mutator there (toggleFavorite, recordPlay, forgetSound, pruneByPrefix,
// clearRecents) rebuilds that object as exactly those three keys, so a new
// field tacked onto it would be silently wiped on the next favorite toggle
// or play. Keeping combos in a separate key/store avoids that entirely.

var COMBOS_VERSION = 1;
var MAX_STEPS = 20;
var MAX_COMBOS = 30;
var MIN_DELAY_MS = 0;
var MAX_DELAY_MS = 5000;
var DEFAULT_DELAY_MS = 300;
var MAX_NAME_LENGTH = 40;
var DELAY_STEP_MS = 100;

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function defaultCombos() {
  return { version: COMBOS_VERSION, combos: [] };
}

// Non-finite/non-number -> DEFAULT_DELAY_MS; else round to integer, clamp to
// [MIN_DELAY_MS, MAX_DELAY_MS].
function clampDelay(ms) {
  if (typeof ms !== "number" || !isFinite(ms)) return DEFAULT_DELAY_MS;
  var rounded = Math.round(ms);
  if (rounded < MIN_DELAY_MS) return MIN_DELAY_MS;
  if (rounded > MAX_DELAY_MS) return MAX_DELAY_MS;
  return rounded;
}

// String(name ?? ""), trim, collapse internal whitespace, cut to
// MAX_NAME_LENGTH; empty -> "Combo".
function sanitizeName(name) {
  var str = String(name == null ? "" : name)
    .trim()
    .replace(/\s+/g, " ");
  if (str.length === 0) return "Combo";
  return str.slice(0, MAX_NAME_LENGTH);
}

// Step or null. soundId must be a non-empty string; delayMs via clampDelay.
function normalizeStep(raw) {
  if (!isPlainObject(raw)) return null;
  if (typeof raw.soundId !== "string" || raw.soundId.length === 0) return null;
  return { soundId: raw.soundId, delayMs: clampDelay(raw.delayMs) };
}

// Normalizes a raw steps array: each entry via normalizeStep, nulls dropped,
// output capped at MAX_STEPS valid steps (keeps scanning past a dropped
// entry rather than slicing the raw array first, so a bad entry doesn't
// bump a later good one out of the cap).
function normalizeStepsArray(rawSteps) {
  var list = Array.isArray(rawSteps) ? rawSteps : [];
  var out = [];
  for (var i = 0; i < list.length && out.length < MAX_STEPS; i++) {
    var step = normalizeStep(list[i]);
    if (step) out.push(step);
  }
  return out;
}

// Combo or null (null when raw isn't even an object). `index` is the
// position in the raw combos array, used to synthesize a legacy id.
function normalizeCombo(raw, index) {
  if (!isPlainObject(raw)) return null;
  var id = typeof raw.id === "string" && raw.id.length > 0 ? raw.id : "combo-legacy-" + index;
  var name = sanitizeName(raw.name);
  var steps = normalizeStepsArray(raw.steps);
  var createdAt = typeof raw.createdAt === "number" && isFinite(raw.createdAt) ? raw.createdAt : 0;
  return { id: id, name: name, steps: steps, createdAt: createdAt };
}

// Tolerates null, non-objects, arrays, missing `combos` key, unknown
// `version`, duplicate ids (keeps the first). Never throws. Caps at
// MAX_COMBOS valid combos.
function normalizeCombos(raw) {
  var rawCombos = isPlainObject(raw) && Array.isArray(raw.combos) ? raw.combos : [];
  var combos = [];
  var seenIds = {};
  for (var i = 0; i < rawCombos.length && combos.length < MAX_COMBOS; i++) {
    var combo = normalizeCombo(rawCombos[i], i);
    if (!combo) continue;
    if (seenIds[combo.id]) continue;
    seenIds[combo.id] = true;
    combos.push(combo);
  }
  return { version: COMBOS_VERSION, combos: combos };
}

function parseCombos(jsonString) {
  if (typeof jsonString !== "string" || jsonString.length === 0) {
    return defaultCombos();
  }
  try {
    var parsed = JSON.parse(jsonString);
    return normalizeCombos(parsed);
  } catch (e) {
    return defaultCombos();
  }
}

function serializeCombos(state) {
  return JSON.stringify(normalizeCombos(state));
}

// "combo-" + now.toString(36); on collision append "-2", "-3", etc.
// Deterministic, no Math.random.
function makeComboId(now, existingIds) {
  var ids = Array.isArray(existingIds) ? existingIds : [];
  var known = {};
  for (var i = 0; i < ids.length; i++) known[ids[i]] = true;
  var base = "combo-" + now.toString(36);
  if (!known[base]) return base;
  var n = 2;
  while (known[base + "-" + n]) n++;
  return base + "-" + n;
}

// Adds a normalized combo. At MAX_COMBOS, returns { state: <same ref>, id:
// null } without creating anything. Empty steps list is allowed.
function createCombo(state, name, steps, now) {
  var normalized = normalizeCombos(state);
  if (normalized.combos.length >= MAX_COMBOS) {
    return { state: state, id: null };
  }
  var existingIds = normalized.combos.map(function (c) {
    return c.id;
  });
  var id = makeComboId(now, existingIds);
  var combo = normalizeCombo({ id: id, name: name, steps: steps, createdAt: now }, normalized.combos.length);
  var combos = normalized.combos.concat([combo]);
  return { state: { version: COMBOS_VERSION, combos: combos }, id: id };
}

// `patch` may have `name`/`steps`, re-normalized. Unknown id -> same
// reference (the original `state` param, untouched).
function updateCombo(state, id, patch) {
  var normalized = normalizeCombos(state);
  var idx = -1;
  for (var i = 0; i < normalized.combos.length; i++) {
    if (normalized.combos[i].id === id) {
      idx = i;
      break;
    }
  }
  if (idx === -1) return state;
  var existing = normalized.combos[idx];
  var hasName = patch && Object.prototype.hasOwnProperty.call(patch, "name");
  var hasSteps = patch && Object.prototype.hasOwnProperty.call(patch, "steps");
  var updated = {
    id: existing.id,
    name: hasName ? sanitizeName(patch.name) : existing.name,
    steps: hasSteps ? normalizeStepsArray(patch.steps) : existing.steps,
    createdAt: existing.createdAt,
  };
  var combos = normalized.combos.slice();
  combos[idx] = updated;
  return { version: COMBOS_VERSION, combos: combos };
}

// Unknown id -> same reference.
function deleteCombo(state, id) {
  var normalized = normalizeCombos(state);
  var idx = -1;
  for (var i = 0; i < normalized.combos.length; i++) {
    if (normalized.combos[i].id === id) {
      idx = i;
      break;
    }
  }
  if (idx === -1) return state;
  var combos = normalized.combos.slice(0, idx).concat(normalized.combos.slice(idx + 1));
  return { version: COMBOS_VERSION, combos: combos };
}

// --- Pure step-list helpers (take/return Step[]; never mutate input) ------

// No-op (same reference) once at MAX_STEPS.
function addStep(steps, soundId, delayMs) {
  var list = Array.isArray(steps) ? steps : [];
  if (list.length >= MAX_STEPS) return list;
  var delay = delayMs === undefined ? DEFAULT_DELAY_MS : clampDelay(delayMs);
  return list.concat([{ soundId: String(soundId), delayMs: delay }]);
}

// No-op (same reference) when index is out of range.
function removeStep(steps, index) {
  var list = Array.isArray(steps) ? steps : [];
  if (index < 0 || index >= list.length) return list;
  return list.slice(0, index).concat(list.slice(index + 1));
}

// direction is -1 or +1. No-op (same reference) at the edges or an
// out-of-range index.
function moveStep(steps, index, direction) {
  var list = Array.isArray(steps) ? steps : [];
  var target = index + direction;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return list;
  var copy = list.slice();
  var tmp = copy[index];
  copy[index] = copy[target];
  copy[target] = tmp;
  return copy;
}

// No-op (same reference) when index is out of range.
function setStepDelay(steps, index, delayMs) {
  var list = Array.isArray(steps) ? steps : [];
  if (index < 0 || index >= list.length) return list;
  var copy = list.slice();
  copy[index] = { soundId: copy[index].soundId, delayMs: clampDelay(delayMs) };
  return copy;
}

// No-op (same reference) when index is out of range.
function nudgeStepDelay(steps, index, deltaMs) {
  var list = Array.isArray(steps) ? steps : [];
  if (index < 0 || index >= list.length) return list;
  var copy = list.slice();
  var current = copy[index];
  copy[index] = { soundId: current.soundId, delayMs: clampDelay(current.delayMs + deltaMs) };
  return copy;
}

// Maps combo.steps to { soundId, delayMs, sound }, where `sound` comes from
// `sounds` (items have `.id`). DROPS any step whose soundId isn't found;
// keeps the order/delayMs of the rest.
function resolveSteps(combo, sounds) {
  var steps = combo && Array.isArray(combo.steps) ? combo.steps : [];
  var list = Array.isArray(sounds) ? sounds : [];
  var byId = {};
  for (var i = 0; i < list.length; i++) byId[list[i].id] = list[i];
  var out = [];
  for (var j = 0; j < steps.length; j++) {
    var step = steps[j];
    var sound = byId[step.soundId];
    if (!sound) continue;
    out.push({ soundId: step.soundId, delayMs: step.delayMs, sound: sound });
  }
  return out;
}

// [{at, index, soundId, sound}]. `at` is the cumulative sum of delayMs up to
// and including that step: delays [0,400,800] -> at=[0,400,1200].
function buildSchedule(resolvedSteps) {
  var list = Array.isArray(resolvedSteps) ? resolvedSteps : [];
  var schedule = [];
  var cumulative = 0;
  for (var i = 0; i < list.length; i++) {
    cumulative += list[i].delayMs;
    schedule.push({ at: cumulative, index: i, soundId: list[i].soundId, sound: list[i].sound });
  }
  return schedule;
}

function scheduleDuration(schedule) {
  var list = Array.isArray(schedule) ? schedule : [];
  if (list.length === 0) return 0;
  return list[list.length - 1].at;
}

// Short label like "Vine → Record → Fail", built from names resolved via
// `sounds`: first 4 names, then " +N" for the rest. Empty (after dropping
// unresolvable steps) -> "(empty)".
function comboSummary(combo, sounds) {
  var resolved = resolveSteps(combo, sounds);
  if (resolved.length === 0) return "(empty)";
  var names = resolved.map(function (s) {
    return s.sound.name;
  });
  var shown = names.slice(0, 4);
  var extra = names.length - shown.length;
  var label = shown.join(" → ");
  if (extra > 0) label += " +" + extra;
  return label;
}

// Pure/injected runner: no global setTimeout inside — the caller passes
// setTimeout/clearTimeout (or a fake clock in tests) via setTimer/clearTimer.
function createComboRunner(options) {
  var schedule = (options && options.schedule) || [];
  var play = options.play;
  var setTimer = options.setTimer;
  var clearTimer = options.clearTimer;
  var onStep = options.onStep;
  var onDone = options.onDone;
  var timers = [];
  var running = false;
  var remaining = 0;

  function fire(entry) {
    remaining--;
    play(entry.sound, entry.index);
    if (onStep) onStep(entry.index);
    if (remaining === 0) {
      running = false;
      timers = [];
      if (onDone) onDone();
    }
  }

  function start() {
    if (running) return;
    if (schedule.length === 0) {
      if (onDone) onDone();
      return;
    }
    running = true;
    remaining = schedule.length;
    timers = schedule.map(function (entry) {
      return setTimer(function () {
        fire(entry);
      }, entry.at);
    });
  }

  function cancel() {
    for (var i = 0; i < timers.length; i++) {
      clearTimer(timers[i]);
    }
    timers = [];
    running = false;
  }

  function isRunning() {
    return running;
  }

  return { start: start, cancel: cancel, isRunning: isRunning };
}

module.exports = {
  COMBOS_VERSION: COMBOS_VERSION,
  MAX_STEPS: MAX_STEPS,
  MAX_COMBOS: MAX_COMBOS,
  MIN_DELAY_MS: MIN_DELAY_MS,
  MAX_DELAY_MS: MAX_DELAY_MS,
  DEFAULT_DELAY_MS: DEFAULT_DELAY_MS,
  MAX_NAME_LENGTH: MAX_NAME_LENGTH,
  DELAY_STEP_MS: DELAY_STEP_MS,
  defaultCombos: defaultCombos,
  clampDelay: clampDelay,
  sanitizeName: sanitizeName,
  normalizeStep: normalizeStep,
  normalizeCombo: normalizeCombo,
  normalizeCombos: normalizeCombos,
  parseCombos: parseCombos,
  serializeCombos: serializeCombos,
  makeComboId: makeComboId,
  createCombo: createCombo,
  updateCombo: updateCombo,
  deleteCombo: deleteCombo,
  addStep: addStep,
  removeStep: removeStep,
  moveStep: moveStep,
  setStepDelay: setStepDelay,
  nudgeStepDelay: nudgeStepDelay,
  resolveSteps: resolveSteps,
  buildSchedule: buildSchedule,
  scheduleDuration: scheduleDuration,
  comboSummary: comboSummary,
  createComboRunner: createComboRunner,
};
