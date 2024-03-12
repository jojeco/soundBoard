import { StyleSheet } from "react-native";

export const indexStyles = StyleSheet.create({
    background: {
        backgroundColor: "#C0E8D5",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",       
    },
    buttonGrid: {
        
        justifyContent: "center",
        alignItems: "center",
        alignContent: "center",
        width: 300, // You may adjust this width based on your needs
        borderWidth: 1,
        flexWrap: 'wrap', // This is not directly applicable here, see gridLayout for wrapping
        flexDirection: "row",
    },
    buttonContainer: {
        width: 100,
        height: 100,  
        justifyContent: "center", // Distribute items evenly along the line
        alignItems: "center", // Align items to the start of the cross axis
        textAlign: "center",
        alignContent: "center",
        
    
    },
    
    textStyle: {
        color: "#000", // Text color for the button
        fontSize: 16, // Adjust text size as needed
        textAlign: "center",
        alignContent: "center",
    },
    pressableStyle: {
        textAlign: "center",
        justifyContent: "center",
        alignItems: "center",
        
        width: "100%",
        height: "100%",
      },
    linkStyle: {
        backgroundColor: "lightgreen",
        width: "100%",
        height: "100%",

        textAlign: "center",
        justifyContent: "center",
        alignItems: "center",
        borderColor: "black",
        
       
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
   

 });
 export default indexStyles;