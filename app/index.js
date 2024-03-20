import { StatusBar } from "expo-status-bar";
import { Text, View, ImageBackground } from "react-native";
import { Link } from "expo-router";
import indexStyles from "../styles/index-styles";
import BackgroundImage from "../assets/Background.jpg";

export default function App() {
  return (
    <ImageBackground source={BackgroundImage} style={indexStyles.background}>
      <View style={indexStyles.buttonContainer}>
        <Link style={indexStyles.linkStyle} href={"/soundBoard"}>
          <View style={indexStyles.pressableStyle}>
            <Text style={indexStyles.textStyle}>Premade</Text>
          </View>
        </Link>
      </View>
      <View style={indexStyles.buttonContainer}>
        <Link style={indexStyles.linkStyle} href={"/Custom"}>
          <View>
            <Text style={indexStyles.textStyle}>Custom</Text>
          </View>
        </Link>
      </View>
    </ImageBackground>
  );
}
