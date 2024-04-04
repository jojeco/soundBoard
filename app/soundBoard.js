import React, { useState, useEffect } from "react";
import { Pressable, Text, View, Alert, ImageBackground, Image, TouchableOpacity} from "react-native";
import { Link } from "expo-router";
import { Audio } from "expo-av";
import indexStyles from "../styles/index-styles";
import soundBoardStyles from "../styles/soundBoard-styles";
import * as SQLite from "expo-sqlite";
import BackgroundImage from "../assets/Background.jpg";
import homePng from "../assets/HomeLogo.png";


const db = SQLite.openDatabase("soundboard.db");

export default function App() {
  const [sound, setSound] = useState(null);

  const sounds = [
    {name: "Rizz", source: require("../Sounds/rizz-sounds.mp3")},
    {name: "Record", source: require("../Sounds/record-scratch-2.mp3")},
    {name: "Pew", source: require("../Sounds/pew_pew.mp3")},
    {name: "Vine", source:   require("../Sounds/vine-boom.mp3")},
    {name: "ack", source: require("../Sounds/ack.mp3")},
    {name: "Galaxy", source: require("../Sounds/galaxy-meme.mp3")},
    {name: "Fail", source: require("../Sounds/spongebob-fail.mp3")},
    {name: "Death Noise", source: require("../Sounds/Fortnite-Death-Noise.mp3")},
    {name: "Downer", source: require("../Sounds/downer_noise.mp3")},

  ];

  // Plays the sound
  const playSound = async (soundResource) => {
    const { sound: newSound } = await Audio.Sound.createAsync(soundResource);
    setSound(newSound);
    await newSound.playAsync();
  };

  //Stops the Sound
  const stopSound = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
  };

  return (
    <ImageBackground source={BackgroundImage} style={indexStyles.background}>
      

      <View style={soundBoardStyles.gridContainer}>
        <View source={homePng} style={soundBoardStyles.Home}>
          <Link href={"/"}>
            <Text style={soundBoardStyles.homeText}>Home</Text>
          </Link>
        </View>
        
        <View style={soundBoardStyles.gridLayout}>
          {sounds.map((soundResource, index) => (
            <Pressable
              key={index}
              onPress={() => playSound(soundResource.source)}
              style={({ pressed }) => [
                soundBoardStyles.soundButton,
                pressed ? soundBoardStyles.SBP : {}, // Dynamically changes style when pressed
              ]}
            >
              <Text>{soundResource.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ImageBackground>
  );
}
