import { StyleSheet } from "react-native";

export const indexStyles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "105%",
    position: "absolute",
    alignContent: "center",
  },

  buttonContainer: {
    width: "40%",
    height: "5%",
    justifyContent: "center", // Distribute items evenly along the line
    alignItems: "center", // Align items to the start of the cross axis
    textAlign: "center",
    alignContent: "center",
    margin: 10,
    borderWidth: 1,
    borderColor: "red",
    borderRadius: 10,

  },

  textStyle: {
    color: "#000", // Text color for the button
    fontSize: 16, // Adjust text size as needed
    textAlign: "center",
    alignContent: "center",
    width: "100%",
    height: "100%",
  },

  linkStyle: {
    backgroundColor: "#4EC5F1",
    width: "100%",
    height: "100%",
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "black",
    borderRadius: 10,
    
  },
});
export default indexStyles;
