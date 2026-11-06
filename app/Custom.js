import React, { useEffect, useRef, useState } from "react";
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
import * as FileSystem from "expo-file-system";
import styles from "../styles/Stylesheet";
import BackgroundImage from "../assets/Background.jpg";
import homePng from "../assets/HomeLogo.png";
import soundBoardStyles from "../styles/soundBoard-styles";
import soundPrefsStyles from "../styles/soundPrefs-styles";
import indexStyles from "../styles/index-styles";
import useSoundPrefs from "../hooks/useSoundPrefs";
import soundPrefsLib from "../lib/soundPrefs";
import recordingFilesLib from "../lib/recordingFiles";
import SoundButton from "../components/SoundButton";

const { customId } = soundPrefsLib;
const { RECORDINGS_SUBDIR, buildRecordingPath, isManagedRecording, planMigration } = recordingFilesLib;

// Copies a just-recorded file (expo-av writes to the app's cache folder,
// which iOS/Android can purge under storage pressure) into the app's own
// documents/recordings/ folder so it survives a cache purge. If the copy
// throws for any reason, logs the error and returns the original uri so a
// failed copy never loses the recording outright.
async function persistRecording(uri) {
  try {
    await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + RECORDINGS_SUBDIR, {
      intermediates: true,
    });
    const destination = buildRecordingPath(FileSystem.documentDirectory, uri, Date.now());
    await FileSystem.copyAsync({ from: uri, to: destination });
    return destination;
  } catch (error) {
    console.log("Error persisting recording:", error);
    return uri;
  }
}

export default function App() {
  const [db, setDb] = useState(null);
  const [sounds, setSounds] = useState([]);
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  const {
    ready,
    toggleFavorite,
    recordPlay,
    isFavorite,
    getPlayCount,
    sort,
    recentlyPlayed,
    clearRecents,
    forgetSound,
    pruneByPrefix,
    hasRecents,
  } = useSoundPrefs();
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const [newRecordingName, setNewRecordingName] = useState("");
  const [recordUri, setRecordUri] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSound, setEditingSound] = useState(null);
  // Ref (not state) so the latest sound can always be unloaded before the next one plays.
  const soundRef = useRef(null);
  // Ref (not state) so the migration sweep below runs at most once per mount.
  const migratedRef = useRef(false);

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

  useEffect(() => () => {
    if (soundRef.current) {
      soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
  }, []);

  // Drop favorites/stats for recorded sounds that no longer exist in the DB
  // (a reused rowid must not inherit a deleted sound's stats). Runs once per
  // successful fetch, and only after prefs have loaded and the DB has been read
  // at least once, so it can never prune against default/empty data mid-load.
  // pruneByPrefix keeps the same state object when nothing is dropped, so this
  // cannot loop.
  useEffect(() => {
    if (!ready || !soundsLoaded) return;
    pruneByPrefix("custom:", sounds.map((s) => customId(s.id)));
  }, [ready, soundsLoaded, sounds, pruneByPrefix]);

  // One-time sweep to migrate rows saved before the cache-purge fix out of
  // the cache folder (see migrateLegacyRecordings below). The ref guard plus
  // single pass per mount prevents a loop: a successful migration's
  // fetchSounds() returns rows with managed paths, so the next plan is empty.
  useEffect(() => {
    if (!db || !soundsLoaded || migratedRef.current) return;
    migratedRef.current = true;
    migrateLegacyRecordings(sounds);
  }, [db, soundsLoaded, sounds]);

  async function toggleRecording() {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }

  async function startRecording() {
    try {
      console.log("Requesting permissions..");
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Microphone access needed",
          "Allow microphone access in Settings to record sounds."
        );
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log("Starting recording..");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      console.log("Recording started");
    } catch (error) {
      console.log("Error starting recording:", error);
      Alert.alert(
        "Can't start recording",
        "Something went wrong starting the recorder. Please try again."
      );
    }
  }

  async function stopRecording() {
    console.log("Stopping recording..");
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log("Recording stopped and stored at", uri);
        setRecordUri(uri);
        if (uri) setModalVisible(true);
      } else {
        console.log("No active recording found.");
      }
    } catch (error) {
      console.log("Error stopping recording:", error);
      Alert.alert(
        "Can't stop recording",
        "Something went wrong saving the recording. Please try again."
      );
    } finally {
      // Resetting here even on the "no active recording" path recovers a
      // stuck isRecording with no recording object.
      setIsRecording(false);
      setRecording(undefined);
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
          setSoundsLoaded(true);
          console.log("Sounds fetched from DB", _array);
        });
      });
    }
  }

  // One-time sweep for rows saved before the cache-purge fix (persistRecording
  // above): their filePath still points at expo-av's cache folder, which the OS
  // can clear. Copies each into documents/recordings/ and repoints the DB row.
  // Never throws, shows an alert, or blocks the list from rendering — a row
  // whose cache file is already gone is simply left alone.
  async function migrateLegacyRecordings(rows) {
    const plan = planMigration(FileSystem.documentDirectory, rows, Date.now());
    if (plan.length === 0) return;
    try {
      await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + RECORDINGS_SUBDIR, {
        intermediates: true,
      });
    } catch (error) {
      console.log("Error creating recordings dir for migration:", error);
    }
    let updatedAny = false;
    for (const item of plan) {
      try {
        const info = await FileSystem.getInfoAsync(item.from);
        if (!info.exists) continue; // purged cache file can't be rescued; leave the row alone
        await FileSystem.copyAsync({ from: item.from, to: item.to });
        await new Promise((resolve) => {
          db.transaction(
            (tx) => {
              tx.executeSql("update sounds set filePath = ? where id = ?", [item.to, item.id]);
            },
            (error) => {
              console.log("Error updating migrated filePath:", error);
              FileSystem.deleteAsync(item.to, { idempotent: true }).catch(() => {});
              resolve();
            },
            () => {
              updatedAny = true;
              resolve();
            }
          );
        });
      } catch (error) {
        console.log("Error migrating legacy recording:", item.from, error);
      }
    }
    if (updatedAny) fetchSounds();
  }

  async function playSound(filePath, prefId) {
    console.log("Loading Sound");
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (error) {
        // May already be unloaded; ignore.
      }
      soundRef.current = null;
    }
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: filePath });
      // A concurrent tap may have stored its sound while this one loaded; unload it so it isn't leaked.
      if (soundRef.current) soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = sound;
      if (prefId) recordPlay(prefId);
      await sound.playAsync();
    } catch (error) {
      console.log("Error playing sound:", error);
      Alert.alert("Can't play sound", "This recording couldn't be loaded. The file may have been removed.");
    }
  }

  function showOptions(id, prefId) {
    const favoriteLabel = isFavorite(prefId) ? "Unfavorite" : "Favorite";
    Alert.alert("Sound Options", "Choose an option", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: () => deleteSound(id),
        style: "destructive",
      },
      { text: "Rename", onPress: () => promptRenameSound(id) },
      { text: favoriteLabel, onPress: () => toggleFavorite(prefId) },
    ]);
  }

  function deleteSound(id) {
    const target = sounds.find((sound) => sound.id === id);
    const filePath = target ? target.filePath : null;
    db.transaction(
      (tx) => {
        tx.executeSql("delete from sounds where id = ?", [id]);
      },
      null,
      () => {
        forgetSound(customId(id)); // Drop the deleted sound's favorite/stats
        if (filePath && isManagedRecording(FileSystem.documentDirectory, filePath)) {
          // Never delete paths outside the app's own recordings folder.
          // Errors here must never block refreshing the list.
          FileSystem.deleteAsync(filePath, { idempotent: true }).catch(() => {});
        }
        fetchSounds(); // Refresh the list after deleting
      }
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

  const prefItems = sounds.map((s) => ({ id: customId(s.id), dbSound: s }));
  const orderedSounds = ready ? sort(prefItems) : prefItems;
  const recent = ready ? recentlyPlayed(prefItems, 5) : [];

  function confirmClearRecents() {
    Alert.alert(
      "Clear recents?",
      "This clears the recently-played list. Favorites and play counts are kept.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: clearRecents },
      ]
    );
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
        {ready && recent.length > 0 ? (
          <View style={soundPrefsStyles.recentSection}>
            <Text style={soundPrefsStyles.recentTitle}>Recently played</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={soundPrefsStyles.recentRow}
              contentContainerStyle={{ alignItems: "center", paddingHorizontal: 6 }}
            >
              {recent.map(({ id: prefId, dbSound }) => (
                <SoundButton
                  key={"recent-" + prefId}
                  label={dbSound.name}
                  labelStyle={soundPrefsStyles.recentChipText}
                  favorite={isFavorite(prefId)}
                  onPress={() => playSound(dbSound.filePath, prefId)}
                  onLongPress={() => showOptions(dbSound.id, prefId)}
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
        <ScrollView
          style={styles.listArea}
          contentContainerStyle={styles.flexRow}
        >
          {orderedSounds.map(({ id: prefId, dbSound }) => (
            <SoundButton
              key={prefId}
              label={dbSound.name}
              labelStyle={styles.buttonText}
              favorite={isFavorite(prefId)}
              playCount={getPlayCount(prefId)}
              onPress={() => playSound(dbSound.filePath, prefId)}
              onLongPress={() => showOptions(dbSound.id, prefId)}
              style={styles.button}
              pressedStyle={styles.buttonRecording}
            />
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
                onPress={async () => {
                  if (recordUri) {
                    // Snapshot + clear state before the async copy so a
                    // double-tap can't save the same recording twice.
                    const uri = recordUri;
                    const name = newRecordingName || "New Sound";
                    setRecordUri(null);
                    setModalVisible(false);
                    setNewRecordingName("");
                    const persistedPath = await persistRecording(uri);
                    saveSoundToDb(name, persistedPath);
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
