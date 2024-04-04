import React, { useEffect, useState } from "react";
import { Link } from "expo-router";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  TextInput,
  ImageBackground,
  Alert,
} from "react-native";
import * as SQLite from "expo-sqlite";
import { Audio } from "expo-av";
import styles from "../styles/Stylesheet";
import BackgroundImage from "../assets/Background.jpg";
import homePng from "../assets/HomeLogo.png";
import soundBoardStyles from "../styles/soundBoard-styles";
import indexStyles from "../styles/index-styles";


export default function App() {
  const [db, setDb] = useState(null);
  const [sounds, setSounds] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [newRecordingName, setNewRecordingName] = useState("");
  const [recordUri, setRecordUri] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSound, setEditingSound] = useState(null);

  useEffect(() => {
    const db = SQLite.openDatabase("soundboard.db");
    setDb(db);
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists sounds (id integer primary key not null, name text, filePath text);",
        [],
        () => {
          console.log("Table created");
        },
        (_, error) => {
          console.log(error);
          return false;
        }
      );
    });
    fetchSounds(); // Fetch sounds when the app loads
  }, []);

  useEffect(() => {
    if (db) {
      fetchSounds();
    }
  }, [db]);

  async function toggleRecording() {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }

  async function startRecording() {
    console.log("Requesting permissions..");
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    console.log("Starting recording..");
    const { recording } = await Audio.Recording.createAsync(
      Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
    );
    setRecording(recording);
    setIsRecording(true);
    console.log("Recording started");
  }

  async function stopRecording() {
    console.log("Stopping recording..");
    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log("Recording stopped and stored at", uri);
      setRecordUri(uri);
      setIsRecording(false);
      setRecording(undefined);
      setModalVisible(true);
    } else {
      console.log("No active recording found.");
    }
  }

  function saveSoundToDb(name, filePath) {
    if (db) {
      db.transaction(
        (tx) => {
          tx.executeSql(
            "INSERT INTO sounds (name, filePath) VALUES (?, ?);",
            [name, filePath],
            (_, result) => {
              // Success callback
              console.log("Sound saved:", result);
            },
            (_, error) => {
              // Error callback
              console.log("Error saving sound:", error);
              return true; // Returning true rolls back the transaction on error
            }
          );
        },
        (error) => {
          console.log("Transaction Error:", error);
        },
        () => {
          console.log("Transaction Success:");
          fetchSounds(); // Refresh your sound list
        }
      );
    }
  }

  function fetchSounds() {
    if (db) {
      db.transaction((tx) => {
        tx.executeSql("select * from sounds", [], (_, { rows: { _array } }) => {
          setSounds(_array);
          console.log("Sounds fetched from DB", _array);
        });
      });
    }
  }

  async function playSound(filePath) {
    console.log("Loading Sound");
    const { sound } = await Audio.Sound.createAsync({ uri: filePath });
    await sound.playAsync();
  }

  function showOptions(id) {
    Alert.alert("Sound Options", "Choose an option", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: () => deleteSound(id),
        style: "destructive",
      },
      { text: "Rename", onPress: () => promptRenameSound(id) },
    ]);
  }

  function deleteSound(id) {
    db.transaction(
      (tx) => {
        tx.executeSql("delete from sounds where id = ?", [id]);
      },
      null,
      fetchSounds // Refresh the list after deleting
    );
  }

  function promptRenameSound(id) {
    const sound = sounds.find((sound) => sound.id === id);
    if (sound) {
      setEditingSound(sound);
      setNewRecordingName(sound.name);
      setEditModalVisible(true);
    }
  }

  function updateSoundName() {
    if (editingSound && newRecordingName.trim()) {
      db.transaction(
        (tx) => {
          tx.executeSql("update sounds set name = ? where id = ?", [
            newRecordingName,
            editingSound.id,
          ]);
        },
        null,
        () => {
          fetchSounds(); // Refresh the list after updating
          setEditModalVisible(false);
          setEditingSound(null);
          setNewRecordingName("");
        }
      );
    }
  }

  return (
    <ImageBackground source={BackgroundImage} style={styles.backgroundImage}>
      <View source={homePng} style={soundBoardStyles.Home}>
          <Link href={"/"}>
            <Text style={soundBoardStyles.homeText}>Home</Text>
          </Link>
        </View>
      <View style={styles.content}>
        <Text style={styles.title}>Soundscape</Text>
        <Pressable
          onPress={toggleRecording}
          style={[
            styles.button,
            isRecording ? styles.buttonRecording : styles.buttonNotRecording,
          ]}
        >
          <Text style={styles.buttonText}>
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Text>
        </Pressable>
        <ScrollView
          style={styles.listArea}
          contentContainerStyle={styles.flexRow}
        >
          {sounds.map(({ id, name, filePath }) => (
            <Pressable
              key={id}
              onPress={() => playSound(filePath)}
              onLongPress={() => showOptions(id)}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{name}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Name your sound:"
                value={newRecordingName}
                onChangeText={setNewRecordingName}
              />
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={() => {
                  if (recordUri) {
                    saveSoundToDb(newRecordingName || "New Sound", recordUri);
                    setModalVisible(!modalVisible);
                    setRecordUri(null);
                  }
                }}
              >
                <Text style={styles.textStyle}>Save</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        <Modal
          animationType="slide"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={() => {
            setEditModalVisible(!editModalVisible);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <TextInput
                style={styles.modalTextInput}
                placeholder="Rename your sound:"
                value={newRecordingName}
                onChangeText={setNewRecordingName}
              />
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={updateSoundName}
              >
                <Text style={styles.textStyle}>Update</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
}
