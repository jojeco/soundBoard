import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from "expo-router";
import indexStyles from '../styles/index-styles';

export default function App() {




  
  return (
    <View style={indexStyles.background}>
      
        <View style={indexStyles.buttonContainer}>
            <Link style={indexStyles.linkStyle}href={"/soundBoard"}>
              <View style={indexStyles.pressableStyle}>
                <Text style={indexStyles.textStyle}>Premade SoundBoard</Text>
              </View>
            </Link>
        </View>
        <View style={indexStyles.buttonContainer}>
            <Link style={indexStyles.linkStyle} href={"/CreateSoundBoard"}>          
              <View style={indexStyles.pressableStyle}>
                <Text style={indexStyles.textStyle}>Create SoundBoard</Text>
              </View>
            </Link>
        </View>

    </View>
  );
}

