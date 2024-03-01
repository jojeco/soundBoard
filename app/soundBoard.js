import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from "expo-router";
import indexStyles from '../styles/index-styles';
import soundBoardStyles from '../styles/soundBoard-styles';

export default function App() {




  
  return (
    <View style={soundBoardStyles.background}>
        
      <View style={soundBoardStyles.gridContainer}>
        <View style={soundBoardStyles.gridLayout}>
            <Pressable style={soundBoardStyles.soundButton}>
                <Text style={soundBoardStyles.SBStyles}>R1</Text>
            </Pressable>
            <Pressable style={soundBoardStyles.soundButton}>
                <Text style={soundBoardStyles.SBStyles}>R2</Text>   
            </Pressable>
            <Pressable style={soundBoardStyles.soundButton}>
                <Text style={soundBoardStyles.SBStyles}>R3</Text>
            </Pressable>
        </View>
        <View style={soundBoardStyles.gridLayout}>
            <Pressable style={soundBoardStyles.soundButton}>
                <Text style={soundBoardStyles.SBStyles}>R1</Text>
            </Pressable>
            <Pressable style={soundBoardStyles.soundButton}>
                <Text style={soundBoardStyles.SBStyles}>R2</Text>   
            </Pressable>
            <Pressable style={soundBoardStyles.soundButton}>
                <Text style={soundBoardStyles.SBStyles}>R3</Text>
            </Pressable>
        </View>
      </View>

    </View>
  );
}

/*<View style={soundBoardStyles.Home}>
          <Link href={"/"}>
            <Text style={soundBoardStyles.homeText}>H</Text>
          </Link>
        </View>*/