import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, Button, View, Pressable } from 'react-native';
import {useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import { Link } from "expo-router";
import indexStyles from '../styles/index-styles';

export default function App() {
  const [recording, setRecording] = useState(null); // this is the recording object
  const [recordingUri, setRecordingUri] = useState(null); // the recorded file location
  const [playback, setPlayback] = useState(null); // the playback object so we can hear the recording
  const [permissionResponse, requestPermission] = Audio.usePermissions(); // ask permission to record audio
  
  const startRecording = async () => {
    try {
      // request permission to use the mic
      if (permissionResponse.status !== 'granted') {
        console.log('Requesting permissions.');
        await requestPermission();
      }
      console.log('Permission is ', permissionResponse.status);

      // set some device specific values
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets_HIGH_QUALITY
      );
      setRecording(recording);
      console.log('...recording');
    }
    catch (errorEvent) {
      console.error('Failed to startRecording(): ', errorEvent);
    }
  }

  const stopRecording = async() => {
    try{
      await recording.stopAndUnloadAsync(); //actually stop the recording

      const uri = recording.getURI();
      setRecordingUri(uri);

      setRecording(undefined); //clear the recording object

      console.log('Recording stopped and stored at', uri);
    } catch (error) {
      console.error('Failed to stopRecording(): ', error);
    }
  }

  const playRecording = async() => {
    const { sound } = await Audio.Sound.createAsync({ uri: recordingUri, });
    setPlayback(sound);
    // Attempt to set the volume higher
    await sound.setVolumeAsync(1.0); // You can try values slightly higher than 1.0, but be cautious of distortion
    await sound.replayAsync();
    console.log('Playing recording from ', recordingUri);
  }


  return (
    <View style={styles.container}>
      
        
          <Link style={indexStyles.Home} href={"/"}>
            <Pressable  >
            <Text>Home</Text>
            </Pressable>
          </Link>
       
      <Button
        title={recording ? 'Stop Recording' : 'Start Recording'}
        onPress={recording ? stopRecording : startRecording}
      />
      {
        recordingUri && (
          <Button
            title="Play Last Recording"
            onPress={playRecording}
          />
        )
      }
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
