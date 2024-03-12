import React, { useState, useEffect } from 'react';
import { Pressable, Text, View, Alert } from 'react-native';
import { Link } from "expo-router";
import { Audio } from 'expo-av';
import indexStyles from '../styles/index-styles';
import CreateSoundStyles from '../styles/CreateSoundStyles';
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
        (_, result) => console.log('Table created successfully'),
        (_, error) => {
          console.log('Error creating table', error);
          return false; // To stop transaction on error
        }
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
    const { sound: newSound } = await Audio.Sound.createAsync({ uri: uri });
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
    if (recording) {
      Alert.alert("Recording in progress", "Please stop the current recording before starting a new one.");
      return;
    }

    if (recordedSounds.length >= 9) {
      Alert.alert("Limit Reached", "Maximum 9 recordings allowed. Delete an existing recording first.");
      return;
    }

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert("Permissions Required", "Please enable audio recording permissions in settings.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert("Recording Error", "Failed to start recording, please try again later.");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    if (uri) {
      db.transaction(tx => {
        tx.executeSql('INSERT INTO recordings (uri) VALUES (?);', [uri], (_, result) => {
          updateRecordedSounds();
        },
        (_, error) => {
          console.error('Error inserting recording into database', error);
          return false; // To stop transaction on error
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
      tx.executeSql('DELETE FROM recordings WHERE id = ?;', [id], (_, result) => {
        updateRecordedSounds();
      },
      (_, error) => {
        console.error('Error deleting recording from database', error);
        return false; // To stop transaction on error
      });
    });
  };

  return (
    <View style={CreateSoundStyles.background}>
      <View style={indexStyles.recordingButton}>
        <Link href={"/"}>
          <Text>Home</Text>
        </Link>
      </View>
      <Pressable onPress={startRecording} style={indexStyles.recordingButton}>
        <Text>Start Recording</Text>
      </Pressable>
      <Pressable onPress={stopRecording} style={indexStyles.recordingButton}>
        <Text>Stop Recording</Text>
      </Pressable>

      <View style={CreateSoundStyles.gridContainer}>
        <View style={CreateSoundStyles.gridLayout}>
          {recordedSounds.map((recording, index) => (
            <Pressable
              key={recording.id}
              onPress={() => playSound(recording.uri)}
              onLongPress={() => deleteRecording(recording.id)} // Long press to delete
              style={({ pressed }) => [
                CreateSoundStyles.soundButton,
                pressed ? CreateSoundStyles.soundButtonPressed : {},
              ]}>
              <Text>Play {index + 1}</Text>
            </Pressable>
          ))}
        </View>

        {sound && (
          <Pressable
            onPress={stopSound}
            style={({ pressed }) => [
              CreateSoundStyles.soundButton,
              pressed ? CreateSoundStyles.soundButtonPressed : {},
            ]}>
            <Text style={CreateSoundStyles.buttonText}>Stop Sound</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
