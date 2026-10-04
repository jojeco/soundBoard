import React, { useRef, useState, useEffect } from "react";
import { Alert, Pressable, Text, View, ImageBackground, ScrollView } from "react-native";
import { Link } from "expo-router";
import { Audio } from "expo-av";
import indexStyles from "../styles/index-styles";
import soundBoardStyles from "../styles/soundBoard-styles";
import soundPrefsStyles from "../styles/soundPrefs-styles";
import soundPrefsLib from "../lib/soundPrefs";
import useSoundPrefs from "../hooks/useSoundPrefs";
import useCombos from "../hooks/useCombos";
import SoundButton from "../components/SoundButton";
import ComboPanel from "../components/ComboPanel";
import comboLib from "../lib/combos";
import BackgroundImage from "../assets/Background.jpg";
import homePng from "../assets/HomeLogo.png";

const { builtinId, SORT_MODES } = soundPrefsLib;
const { resolveSteps, buildSchedule, createComboRunner } = comboLib;

const SORT_LABELS = {
  default: "Default",
  favorites: "Favorites",
  mostPlayed: "Most Played",
  recent: "Recent",
};

export default function App() {
  // A ref (not state) so playSound can always unload the *latest* sound
  // synchronously; nothing in the render output depends on it.
  const soundRef = useRef(null);
  const { ready, sortMode, setSortMode, toggleFavorite, recordPlay, isFavorite, getPlayCount, sort, recentlyPlayed, clearRecents, hasRecents } =
    useSoundPrefs();

  // Combo playback state: the active runner, every Audio.Sound a combo has
  // spawned (so stopAll can unload them even mid-sequence), and which combo
  // (if any) is currently playing.
  const runnerRef = useRef(null);
  const comboSoundsRef = useRef([]);
  const [playingComboId, setPlayingComboId] = useState(null);
  const { ready: combosReady, combos, createCombo, updateCombo, deleteCombo } = useCombos();

  const sounds = [
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

  // Plays the sound. Fixes the previous leak by unloading any
  // already-held sound before loading the new one.
  const playSound = async (soundResource, id) => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    const { sound: newSound } = await Audio.Sound.createAsync(soundResource);
    soundRef.current = newSound;
    if (id) recordPlay(id);
    await newSound.playAsync();
  };

  // Plays a saved (or draft-preview) combo: builds the step schedule from
  // the live `sounds` list, wires a runner that layers each step's own
  // Audio.Sound instance (so overlapping steps don't cut each other off),
  // and tracks the playing id so the Premade screen/ComboPanel can show it.
  // NOTE: combo playback does NOT call recordPlay for any step — play
  // counts/recents stay a measure of manual single-sound taps, not combo
  // playback.
  const playCombo = async (combo) => {
    await stopAll();
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
    // Guards against two playCombo() calls racing past the `await stopAll()`
    // above (e.g. rapid combo switching): whichever runner loses this
    // assignment is still cancelled, not left to keep firing underneath.
    if (runnerRef.current) runnerRef.current.cancel();
    runnerRef.current = runner;
    setPlayingComboId(combo.id);
    runner.start();
  };

  // Stops any playing combo (cancelling its runner + unloading every sound
  // it spawned) and then runs the existing single-sound stop logic.
  const stopAll = async () => {
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
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setPlayingComboId(null);
  };

  // Unmount cleanup: cancels any running combo and its timers so nothing
  // keeps firing after the screen is gone.
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []);

  const confirmClearRecents = () => {
    Alert.alert(
      "Clear recents?",
      "This clears the recently-played list. Favorites and play counts are kept.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: clearRecents },
      ]
    );
  };

  const orderedSounds = ready ? sort(sounds) : sounds;
  const recent = ready ? recentlyPlayed(sounds, 5) : [];

  return (
    <ImageBackground source={BackgroundImage} style={indexStyles.background}>
      <View style={soundBoardStyles.gridContainer}>
        <View source={homePng} style={soundBoardStyles.Home}>
          <Link href={"/"}>
            <Text style={soundBoardStyles.homeText}>Home</Text>
          </Link>
        </View>

        <View style={soundPrefsStyles.sortBar}>
          {SORT_MODES.map((mode) => (
            <Pressable
              key={mode}
              onPress={() => setSortMode(mode)}
              style={[
                soundPrefsStyles.sortChip,
                mode === sortMode ? soundPrefsStyles.sortChipActive : {},
              ]}
            >
              <Text
                style={[
                  soundPrefsStyles.sortChipText,
                  mode === sortMode ? soundPrefsStyles.sortChipTextActive : {},
                ]}
              >
                {SORT_LABELS[mode]}
              </Text>
            </Pressable>
          ))}
        </View>

        {ready && recent.length > 0 ? (
          <View style={soundPrefsStyles.recentSection}>
            <Text style={soundPrefsStyles.recentTitle}>Recently played</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={soundPrefsStyles.recentRow}
              contentContainerStyle={{ alignItems: "center", paddingHorizontal: 6 }}
            >
              {recent.map((s) => (
                <SoundButton
                  key={"recent-" + s.id}
                  label={s.name}
                  labelStyle={soundPrefsStyles.recentChipText}
                  favorite={isFavorite(s.id)}
                  onPress={() => playSound(s.source, s.id)}
                  onLongPress={() => toggleFavorite(s.id)}
                  style={soundPrefsStyles.recentChip}
                  pressedStyle={soundPrefsStyles.recentChipPressed}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {ready && hasRecents ? (
          <Pressable style={soundPrefsStyles.clearRecentsButton} onPress={confirmClearRecents}>
            <Text style={soundPrefsStyles.clearRecentsText}>Clear recents</Text>
          </Pressable>
        ) : null}

        {combosReady ? (
          <ComboPanel
            combos={combos}
            sounds={sounds}
            playingComboId={playingComboId}
            onPlay={playCombo}
            onStop={stopAll}
            onCreate={createCombo}
            onUpdate={updateCombo}
            onDelete={deleteCombo}
          />
        ) : null}

        <View style={soundBoardStyles.gridLayout}>
          {orderedSounds.map((soundResource) => (
            <SoundButton
              key={soundResource.id}
              label={soundResource.name}
              favorite={isFavorite(soundResource.id)}
              playCount={getPlayCount(soundResource.id)}
              onPress={() => playSound(soundResource.source, soundResource.id)}
              onLongPress={() => toggleFavorite(soundResource.id)}
              style={soundBoardStyles.soundButton}
              pressedStyle={soundBoardStyles.SBP}
            />
          ))}
        </View>

        <Pressable style={soundPrefsStyles.stopButton} onPress={stopAll}>
          <Text style={soundPrefsStyles.stopButtonText}>Stop</Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}
