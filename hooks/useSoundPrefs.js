import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { loadPrefs, savePrefs } from "../lib/prefsStorage";
import soundPrefs from "../lib/soundPrefs";
import prefsStoreLib from "../lib/prefsStore";

const { createPrefsStore } = prefsStoreLib;

const {
  defaultPrefs,
  toggleFavorite: togglePrefsFavorite,
  recordPlay: recordPrefsPlay,
  isFavorite: prefsIsFavorite,
  getPlayCount: prefsGetPlayCount,
  sortSounds,
  getRecentlyPlayed: prefsGetRecentlyPlayed,
  clearRecents: libClearRecents,
  forgetSound: libForgetSound,
  pruneByPrefix: libPruneByPrefix,
  hasRecents: libHasRecents,
} = soundPrefs;

// One store per module, shared by every mounted screen (app/soundBoard.js
// "Premade" and app/Custom.js). expo-router keeps the screen you navigate
// away from mounted with its own stale copy of prefs if each screen holds
// its own useState — a shared store fixes that: clearing recents (or any
// other write) on one screen is immediately visible on the other, and
// nothing stale gets saved back over it. See NEXT.md.
const store = createPrefsStore({
  load: loadPrefs,
  save: savePrefs,
  initial: defaultPrefs(),
});

// Shared favorites/play-stats hook used by both soundboard screens.
export default function useSoundPrefs() {
  const [sortMode, setSortMode] = useState("default");

  useEffect(() => {
    store.init();
  }, []);

  const { prefs, ready } = useSyncExternalStore(store.subscribe, store.getState);

  const toggleFavorite = useCallback((id) => {
    store.update((current) => togglePrefsFavorite(current, id));
  }, []);

  const recordPlay = useCallback((id) => {
    store.update((current) => recordPrefsPlay(current, id));
  }, []);

  const isFavorite = useCallback(
    (id) => prefsIsFavorite(prefs, id),
    [prefs]
  );

  const getPlayCount = useCallback(
    (id) => prefsGetPlayCount(prefs, id),
    [prefs]
  );

  const sort = useCallback(
    (sounds) => sortSounds(sounds, prefs, sortMode),
    [prefs, sortMode]
  );

  const recentlyPlayed = useCallback(
    (sounds, limit) => prefsGetRecentlyPlayed(sounds, prefs, limit),
    [prefs]
  );

  // Clears the recently-played list only; favorites and play counts stay.
  const clearRecents = useCallback(() => {
    store.update((current) => libClearRecents(current));
  }, []);

  // Drops one sound's favorite flag and stats (e.g. after it is deleted).
  const forgetSound = useCallback((id) => {
    store.update((current) => libForgetSound(current, id));
  }, []);

  // Drops favorites/stats under `prefix` whose id is not in `knownIds`.
  // Returns the same object reference when nothing was dropped so the store's
  // own reference-equality check bails out (no notify, no redundant save, no
  // effect loops).
  const pruneByPrefix = useCallback((prefix, knownIds) => {
    store.update((current) => {
      const next = libPruneByPrefix(current, prefix, knownIds);
      const same =
        Object.keys(next.favorites).length === Object.keys(current.favorites).length &&
        Object.keys(next.stats).length === Object.keys(current.stats).length;
      return same ? current : next;
    });
  }, []);

  const hasRecents = libHasRecents(prefs);

  return {
    prefs,
    ready,
    sortMode,
    setSortMode,
    toggleFavorite,
    recordPlay,
    isFavorite,
    getPlayCount,
    sort,
    recentlyPlayed,
    clearRecents,
    forgetSound,
    pruneByPrefix,
    hasRecents,
  };
}
