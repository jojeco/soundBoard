import React, { useState, useEffect } from 'react';
import { Pressable, Text, View, Alert } from 'react-native';
import { Link } from "expo-router";
import { Audio } from 'expo-av';
import indexStyles from '../styles/index-styles';
import soundBoardStyles from '../styles/soundBoard-styles';
import * as SQLite from "expo-sqlite";
const db = SQLite.openDatabase('soundboard.db');

export default function App() {
  const [sound, setSound] = useState(null);
  const [recording, setRecording] = useState(null);
  const [recordedSounds, setRecordedSounds] = useState([]);

  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS recordings (id INTEGER PRIMARY KEY AUTOINCREMENT, uri TEXT);',
        [],
        () => console.log('Table created successfully'),
        (_, error) => console.log('Error creating table', error)
      );
      tx.executeSql('SELECT * FROM recordings;', [], (_, { rows }) => {
        setRecordedSounds(rows._array);
      });
    });
  }, []);

  const playSound = async (uri) => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
    const { sound: newSound } = await Audio.Sound.createAsync({ uri });
    setSound(newSound);
    await newSound.playAsync();
  };

  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
  };

  const startRecording = async () => {
    if (recordedSounds.length >= 9) {
      Alert.alert("Limit Reached", "Maximum 9 recordings allowed. Delete an existing recording first.");
      return;
    }
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const newRecording = await Audio.Recording.createAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      setRecording(newRecording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    if (uri) {
      db.transaction(tx => {
        tx.executeSql('INSERT INTO recordings (uri) VALUES (?);', [uri], () => {
          updateRecordedSounds();
        });
      });
    }
  };

  const updateRecordedSounds = () => {
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM recordings;', [], (_, { rows }) => {
        setRecordedSounds(rows._array);
      });
    });
  };

  const deleteRecording = (id) => {
    db.transaction(tx => {
      tx.executeSql('DELETE FROM recordings WHERE id = ?;', [id], () => {
        updateRecordedSounds();
      });
    });
  };

  return (
    <View style={soundBoardStyles.background}>
      <View style={indexStyles.recordingButton}>
          <Link href={"/"}>
            <Text>Home</Text>
          </Link>
          <Pressable onPress={startRecording}>
            <Text>Start Recording</Text>
          </Pressable>
          <Pressable onPress={stopRecording}>
            <Text>Stop Recording</Text>
          </Pressable>
        </View>

        <View style={soundBoardStyles.gridContainer}>
          <View style={soundBoardStyles.gridLayout}>
            {recordedSounds.map((recording, index) => (
              <Pressable
                key={recording.id}
                onPress={() => playSound(recording.uri)}
                onLongPress={() => deleteRecording(recording.id)} // Long press to delete
                style={({ pressed }) => [
                  soundBoardStyles.soundButton,
                  pressed ? soundBoardStyles.soundButtonPressed : {},
                ]}>
                <Text>Play {index + 1}</Text>
              </Pressable>
            ))}
          </View>

          {sound && (
            <Pressable
              onPress={stopSound}
              style={({ pressed }) => [
                soundBoardStyles.soundButton,
                pressed ? soundBoardStyles.soundButtonPressed : {},
              ]}>
              <Text style={soundBoardStyles.buttonText}>Stop Sound</Text>
            </Pressable>
          )}
        </View>
    </View>
  );
}
