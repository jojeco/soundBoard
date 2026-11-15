import React, { useRef, useEffect } from "react";
import { Alert, Pressable, Text, View, ImageBackground, ScrollView } from "react-native";
import { Link } from "expo-router";
import { Audio } from "expo-av";
import indexStyles from "../styles/index-styles";
import soundBoardStyles from "../styles/soundBoard-styles";
import soundPrefsStyles from "../styles/soundPrefs-styles";
import soundPrefsLib from "../lib/soundPrefs";
import useSoundPrefs from "../hooks/useSoundPrefs";
import useCombos from "../hooks/useCombos";
import useComboPlayer from "../hooks/useComboPlayer";
import useCustomSoundRows from "../hooks/useCustomSoundRows";
import SoundButton from "../components/SoundButton";
import ComboPanel from "../components/ComboPanel";
import BUILTIN_SOUNDS from "../lib/builtinSounds";
import soundSourcesLib from "../lib/soundSources";
import BackgroundImage from "../assets/Background.jpg";
import homePng from "../assets/HomeLogo.png";

const { SORT_MODES } = soundPrefsLib;
const { customSoundEntries, mergeSoundSources } = soundSourcesLib;

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

  const { ready: combosReady, combos, createCombo, updateCombo, deleteCombo } = useCombos();

  // Custom recordings merged in after the builtins so combos (on either
  // screen) can reference them too. The grid/sort/favorites/recently-played
  // strip below intentionally keep using BUILTIN_SOUNDS only — this merged
  // list is only handed to the combo player/panel.
  const customRows = useCustomSoundRows();
  const sounds = mergeSoundSources(BUILTIN_SOUNDS, customSoundEntries(customRows));
  const { playingComboId, playCombo, stopCombo } = useComboPlayer(sounds);

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

  // Stops any playing combo, then runs the existing single-sound stop logic.
  const stopAll = async () => {
    await stopCombo();
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
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

  const orderedSounds = ready ? sort(BUILTIN_SOUNDS) : BUILTIN_SOUNDS;
  const recent = ready ? recentlyPlayed(BUILTIN_SOUNDS, 5) : [];

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
            onPlay={async (combo) => {
              // Starting a combo also stops any manually-tapped single sound
              // still playing (soundRef), matching the pre-refactor behavior
              // where playCombo began with `await stopAll()`.
              await stopAll();
              await playCombo(combo);
            }}
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
