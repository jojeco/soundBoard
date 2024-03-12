import { StyleSheet } from "react-native";

export const indexStyles = StyleSheet.create({
    background: {
        backgroundColor: "#C0E8D5",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",       
    },
    buttonContainer: {
        borderColor: "black",
        borderWidth: 1,
        width: "50%",
        height: "20%",
        margin : 10,
        padding: 10,
    },
    
    textStyle: {
        fontSize: 16,
        textAlign: "center",
        flex: 1,
    },
    pressableStyle: {     
        flex: 1,
        borderColor: "black",
        borderWidth: 1,
    },
    linkStyle: {
        backgroundColor: "lightgreen",
        flex: 1,
        textAlign: "center",
        borderColor: "black",
        borderWidth: 1,
      },
      Home: {
        backgroundColor: "lightgreen",
        alignContent: "center",
        justifyContent: "center",
        width: 50,
        top: 10,
        left: 10,
        position: "absolute",
        height: 50,
        borderRadius: 100,
        margin: 10,
        textAlign: "center",
    },
    textContainer: {
        flex: 1,
        textAlign: "center",
    },

 });
 export default indexStyles;