// Thin AsyncStorage adapter around the pure lib/combos.js logic. Mirrors
// lib/prefsStorage.js exactly, with its own storage key so combos never ride
// along with the prefs blob (see lib/combos.js header for why).
// This file is ESM (may use `import`) — it's only ever consumed by RN screens
// via Metro/babel, never by the plain-Node test script.
import AsyncStorage from "@react-native-async-storage/async-storage";
// lib/combos.js is CommonJS (module.exports = {...}), so import it as a
// default import and destructure — do NOT expect named ESM exports from it.
import combos from "./combos";

const { parseCombos, serializeCombos, defaultCombos } = combos;

export const COMBOS_STORAGE_KEY = "@soundboard/combos/v1";

export async function loadCombos() {
  try {
    const raw = await AsyncStorage.getItem(COMBOS_STORAGE_KEY);
    if (raw == null) return defaultCombos();
    return parseCombos(raw);
  } catch (error) {
    console.warn("comboStorage: failed to load combos, using defaults", error);
    return defaultCombos();
  }
}

export async function saveCombos(state) {
  try {
    await AsyncStorage.setItem(COMBOS_STORAGE_KEY, serializeCombos(state));
  } catch (error) {
    console.warn("comboStorage: failed to save combos", error);
  }
}

export default { COMBOS_STORAGE_KEY, loadCombos, saveCombos };
