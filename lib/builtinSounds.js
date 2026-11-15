// The 9 builtin premade sounds. Moved out of app/soundBoard.js unchanged so
// both screens (and combo playback/picker code) can share one list without
// app/Custom.js needing to import app/soundBoard.js. ESM (not CommonJS like
// lib/combos.js/lib/soundPrefs.js) because it uses require() on mp3 asset
// files — Metro's static-require handling needs that to stay recognizable,
// and this file is never imported by the plain-Node test scripts (which
// can't resolve .mp3 requires), unlike the pure lib/ modules.
import soundPrefsLib from "./soundPrefs";

const { builtinId } = soundPrefsLib;

const BUILTIN_SOUNDS = [
  { id: builtinId("Rizz"), name: "Rizz", source: require("../Sounds/rizz-sounds.mp3") },
  { id: builtinId("Record"), name: "Record", source: require("../Sounds/record-scratch-2.mp3") },
  { id: builtinId("Pew"), name: "Pew", source: require("../Sounds/pew_pew.mp3") },
  { id: builtinId("Vine"), name: "Vine", source: require("../Sounds/vine-boom.mp3") },
  { id: builtinId("ack"), name: "ack", source: require("../Sounds/ack.mp3") },
  { id: builtinId("Galaxy"), name: "Galaxy", source: require("../Sounds/galaxy-meme.mp3") },
  { id: builtinId("Fail"), name: "Fail", source: require("../Sounds/spongebob-fail.mp3") },
  { id: builtinId("Death Noise"), name: "Death Noise", source: require("../Sounds/Fortnite-Death-Noise.mp3") },
  { id: builtinId("Downer"), name: "Downer", source: require("../Sounds/downer_noise.mp3") },
];

export default BUILTIN_SOUNDS;
