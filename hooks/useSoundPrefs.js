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
  };
}
