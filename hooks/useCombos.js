import { useEffect, useCallback, useSyncExternalStore } from "react";
import { loadCombos, saveCombos } from "../lib/comboStorage";
import combosLib from "../lib/combos";
import prefsStoreLib from "../lib/prefsStore";

const { createPrefsStore } = prefsStoreLib;

const {
  defaultCombos,
  createCombo: libCreateCombo,
  updateCombo: libUpdateCombo,
  deleteCombo: libDeleteCombo,
} = combosLib;

// One module-level store, shared by every mounted screen that uses combos.
// Reuses the generic lib/prefsStore.js pub/sub store UNCHANGED — combos live
// under their own AsyncStorage key (@soundboard/combos/v1) and their own
// store instance, separate from the favorites/stats store in
// hooks/useSoundPrefs.js. See lib/combos.js header for why they're kept apart.
const store = createPrefsStore({
  load: loadCombos,
  save: saveCombos,
  initial: defaultCombos(),
});

export default function useCombos() {
  useEffect(() => {
    store.init();
  }, []);

  const { prefs: combosState, ready } = useSyncExternalStore(store.subscribe, store.getState);

  // Returns the new combo's id, or null if MAX_COMBOS was already reached.
  const createCombo = useCallback((name, steps) => {
    let newId = null;
    store.update((current) => {
      const result = libCreateCombo(current, name, steps, Date.now());
      newId = result.id;
      return result.state;
    });
    return newId;
  }, []);

  const updateCombo = useCallback((id, patch) => {
    store.update((current) => libUpdateCombo(current, id, patch));
  }, []);

  const deleteCombo = useCallback((id) => {
    store.update((current) => libDeleteCombo(current, id));
  }, []);

  return {
    ready,
    combos: combosState.combos,
    createCombo,
    updateCombo,
    deleteCombo,
  };
}
