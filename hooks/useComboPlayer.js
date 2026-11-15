import { useRef, useState, useEffect } from "react";
import { Audio } from "expo-av";
import comboLib from "../lib/combos";

const { resolveSteps, buildSchedule, createComboRunner } = comboLib;

// Combo-playback logic shared by both screens (moved out of
// app/soundBoard.js so app/Custom.js can reuse it for its own combos — see
// NEXT.md). `sounds` is the live merged builtin+custom source list; plain
// functions (not useCallback) so playCombo always closes over the current
// `sounds` the caller passed in, not a stale one.
export default function useComboPlayer(sounds) {
  // A ref (not state) so playCombo always cancels/replaces the *latest*
  // runner synchronously; nothing in the render output depends on it.
  const runnerRef = useRef(null);
  // Every Audio.Sound a combo has spawned, so stopCombo can unload them even
  // mid-sequence.
  const comboSoundsRef = useRef([]);
  const [playingComboId, setPlayingComboId] = useState(null);

  // Stops any playing combo (cancelling its runner + unloading every sound
  // it spawned).
  const stopCombo = async () => {
    if (runnerRef.current) {
      runnerRef.current.cancel();
      runnerRef.current = null;
    }
    const comboSounds = comboSoundsRef.current;
    comboSoundsRef.current = [];
    for (let i = 0; i < comboSounds.length; i++) {
      try {
        await comboSounds[i].unloadAsync();
      } catch (e) {
        // already unloaded/unloading — fine to ignore.
      }
    }
    setPlayingComboId(null);
  };

  // Plays a saved (or draft-preview) combo: builds the step schedule from
  // the live `sounds` list, wires a runner that layers each step's own
  // Audio.Sound instance (so overlapping steps don't cut each other off),
  // and tracks the playing id so the Premade screen/ComboPanel can show it.
  // NOTE: combo playback does NOT call recordPlay for any step — play
  // counts/recents stay a measure of manual single-sound taps, not combo
  // playback.
  const playCombo = async (combo) => {
    await stopCombo();
    const schedule = buildSchedule(resolveSteps(combo, sounds));
    // `play` is NOT awaited by the runner (createComboRunner fires it from a
    // timer callback), so every path must settle without throwing — an
    // unhandled rejection here would surface as an RN warning. It also races
    // the player getting stopped/replaced while Audio.Sound.createAsync is
    // still loading: if `runnerRef.current` no longer points at THIS runner
    // by the time the load resolves (Stop was tapped, the screen unmounted,
    // or another combo started), drop the sound instead of playing it late.
    const play = async (sound) => {
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(sound.source);
        if (runnerRef.current !== runner) {
          newSound.unloadAsync().catch(() => {});
          return;
        }
        comboSoundsRef.current = comboSoundsRef.current.concat([newSound]);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            newSound.unloadAsync().catch(() => {});
            comboSoundsRef.current = comboSoundsRef.current.filter((s) => s !== newSound);
          }
        });
        await newSound.playAsync();
      } catch (e) {
        // Load/play failed (or was unloaded out from under us) — nothing to
        // clean up, just don't let the rejection go unhandled.
      }
    };
    const runner = createComboRunner({
      schedule,
      play,
      setTimer: setTimeout,
      clearTimer: clearTimeout,
      onDone: () => setPlayingComboId(null),
    });
    // Guards against two playCombo() calls racing past the `await
    // stopCombo()` above (e.g. rapid combo switching): whichever runner
    // loses this assignment is still cancelled, not left to keep firing
    // underneath.
    if (runnerRef.current) runnerRef.current.cancel();
    runnerRef.current = runner;
    setPlayingComboId(combo.id);
    runner.start();
  };

  // Unmount cleanup: cancels any running combo and its timers so nothing
  // keeps firing after the screen is gone.
  useEffect(() => {
    return () => {
      stopCombo();
    };
  }, []);

  return { playingComboId, playCombo, stopCombo };
}
