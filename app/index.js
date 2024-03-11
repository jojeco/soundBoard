import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { Link } from "expo-router";
import indexStyles from '../styles/index-styles';

export default function App() {




  
  return (
    <View style={indexStyles.background}>

      <View style={indexStyles.buttonContainer}>

        <View style={indexStyles.recordingButton}>
          <Link href={"/soundBoard"}>
            <Text>Pre Made SoundBoard</Text>
          </Link>
        </View>
        <View style={indexStyles.recordingButton}>
          <Link href={"/CreateSoundBoard"}>
            <Text>Make Your Own</Text>
          </Link>
        </View>
        


      </View>

    </View>
  );
}

