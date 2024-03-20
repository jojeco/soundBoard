import { StyleSheet, Dimensions } from "react-native";

// Calculate button width based on screen size for a dynamic grid
const numColumns = 2; // Number of columns in the grid
const screenWidth = Dimensions.get("window").width;
const buttonWidth = (screenWidth - 30 * (numColumns + 1)) / numColumns; // 30 is the total horizontal padding/margin

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%", // Ensures content uses the full width
    padding: 30,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 60,
    fontFamily: "monospace",
  },
  flexRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    width: "100%",
  },
  input: {
    borderColor: "#4630EB",
    borderRadius: 4,
    borderWidth: 1,
    height: 48,
    padding: 8,
    margin: 8,
    width: "80%",
  },
  button: {
    backgroundColor: "#rgba(16,145,49,1)",
    borderRadius: 10,
    padding: 10,
    margin: 10,
    width: buttonWidth, // Set button width based on screen size for a dynamic grid
    alignItems: "center",
  },
  buttonRecording: {
    backgroundColor: "#FF6347", // Tomato color when recording
  },
  buttonNotRecording: {
    backgroundColor: "rgba(16,145,49,1)", // Green color when not recording
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  itemStyle: {
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: "black",
    backgroundColor: "white",
    padding: 10,
    margin: 8,
    width: buttonWidth, // Adjust item width for grid layout to match button width
    alignItems: "center",
  },
  itemText: {
    fontSize: 24,
  },
  listArea: {
    backgroundColor: "#578bc721",
    width: "100%",
    padding: 20,
    margin: 50,
    borderRadius: 20,
  },
  sectionHeading: {
    fontSize: 18,
    marginBottom: 8,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
    height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTextInput: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    width: "80%",
    borderRadius: 5,
  },
  buttonClose: {
    backgroundColor: "rgba(16,145,49,1)",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  backgroundImage: {
    flex: 1,
    justifyContent: "center",
    resizeMode: "cover",
  },
});
