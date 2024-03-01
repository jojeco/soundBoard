import { StyleSheet } from "react-native";

export const indexStyles = StyleSheet.create({
    background: {
        backgroundColor: "#f0f0f0",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",       
    },
    buttonContainer: {
        flexDirection: "column",
        backgroundColor: "transparent",
        alignItems: "center",
        justifyContent: "center",
        borderColor: "black",
        borderWidth: 1,
    },
   
    recordingButton: {
        backgroundColor: "lightgreen",
        padding: 20,
        borderRadius: 10,
        margin: 10,
    },
    


 });
 export default indexStyles;