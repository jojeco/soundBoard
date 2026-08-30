import React, { useRef } from "react";
import { Pressable, Text, View, ImageBackground } from "react-native";
import { Link } from "expo-router";
import { Audio } from "expo-av";
import indexStyles from "../styles/index-styles";
import soundBoardStyles from "../styles/soundBoard-styles";
import soundPrefsStyles from "../styles/soundPrefs-styles";
import soundPrefsLib from "../lib/soundPrefs";
import useSoundPrefs from "../hooks/useSoundPrefs";
import SoundButton from "../components/SoundButton";
import BackgroundImage from "../assets/Background.jpg";
import homePng from "../assets/HomeLogo.png";

const { builtinId, SORT_MODES } = soundPrefsLib;

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
  const { ready, sortMode, setSortMode, toggleFavorite, recordPlay, isFavorite, getPlayCount, sort } =
    useSoundPrefs();

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

  // Stops the sound
  const stopSound = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  const orderedSounds = ready ? sort(sounds) : sounds;

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

        <Pressable style={soundPrefsStyles.stopButton} onPress={stopSound}>
          <Text style={soundPrefsStyles.stopButtonText}>Stop</Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}
