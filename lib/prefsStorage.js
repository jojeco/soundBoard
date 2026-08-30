// Thin AsyncStorage adapter around the pure lib/soundPrefs.js logic.
// This file is ESM (may use `import`) — it's only ever consumed by RN screens
// via Metro/babel, never by the plain-Node test script.
import AsyncStorage from "@react-native-async-storage/async-storage";
// lib/soundPrefs.js is CommonJS (module.exports = {...}), so import it as a
// default import and destructure — do NOT expect named ESM exports from it.
import soundPrefs from "./soundPrefs";

const { parsePrefs, serializePrefs, normalizePrefs, defaultPrefs } = soundPrefs;

export const STORAGE_KEY = "@soundboard/prefs/v1";

export async function loadPrefs() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw == null) return defaultPrefs();
    return normalizePrefs(parsePrefs(raw));
  } catch (error) {
    console.warn("prefsStorage: failed to load prefs, using defaults", error);
    return defaultPrefs();
  }
}

export async function savePrefs(prefs) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, serializePrefs(prefs));
  } catch (error) {
    console.warn("prefsStorage: failed to save prefs", error);
  }
}

export default { STORAGE_KEY, loadPrefs, savePrefs };
