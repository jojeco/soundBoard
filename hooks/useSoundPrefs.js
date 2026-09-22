import { useEffect, useRef, useState, useCallback } from "react";
import { loadPrefs, savePrefs } from "../lib/prefsStorage";
import soundPrefs from "../lib/soundPrefs";

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

// Shared favorites/play-stats hook used by both soundboard screens.
export default function useSoundPrefs() {
  const [prefs, setPrefs] = useState(defaultPrefs());
  const [ready, setReady] = useState(false);
  const [sortMode, setSortMode] = useState("default");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadPrefs().then((loaded) => {
      if (!mountedRef.current) return;
      setPrefs(loaded);
      setReady(true);
    });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Never write default prefs over real data during the initial load — only
  // persist once `ready` is true, i.e. after the first load has resolved.
  useEffect(() => {
    if (!ready) return;
    savePrefs(prefs);
  }, [prefs, ready]);

  const toggleFavorite = useCallback((id) => {
    setPrefs((current) => togglePrefsFavorite(current, id));
  }, []);

  const recordPlay = useCallback((id) => {
    setPrefs((current) => recordPrefsPlay(current, id));
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
    setPrefs((current) => libClearRecents(current));
  }, []);

  // Drops one sound's favorite flag and stats (e.g. after it is deleted).
  const forgetSound = useCallback((id) => {
    setPrefs((current) => libForgetSound(current, id));
  }, []);

  // Drops favorites/stats under `prefix` whose id is not in `knownIds`.
  // Returns the same state object when nothing was dropped so React bails out
  // of the update (no re-render, no redundant save, no effect loops).
  const pruneByPrefix = useCallback((prefix, knownIds) => {
    setPrefs((current) => {
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
