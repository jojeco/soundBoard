import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from "expo-router";
import indexStyles from '../styles/index-styles';

export default function App() {




  
  return (
    <View style={indexStyles.background}>

      <View style={indexStyles.buttonContainer}>
          <Link style={indexStyles.linkStyle}href={"/soundBoard"}>
              <Text style={indexStyles.textStyle}>Pre Made SoundBoard</Text>
            
          </Link>
        
        
          <Link style={indexStyles.linkStyle} href={"/CreateSoundBoard"}>
            <View style={indexStyles.textContainer}>
              <Text style={indexStyles.textStyle}>Create SoundBoard</Text>
            </View>
          </Link>
        


      </View>

    </View>
  );
}

