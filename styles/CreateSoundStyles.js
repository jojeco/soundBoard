import { StyleSheet } from "react-native";

const baseButtonStyle = {
  width: 80,
  height: 80,
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 10,
  padding: 10,
  margin: 10,
};

const baseButtonTextStyle = {
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: 'bold',
  textAlign: 'center',
};

export const CreateSoundStyles = StyleSheet.create({
  background: {
    backgroundColor: "#f0f0f0", // Changed to a more neutral shade for wider appeal
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gridContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: '90%', // Use percentage for better responsiveness across different screen sizes
    maxWidth: 600, // Maximum width to avoid stretching on larger screens
  },
  gridLayout: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    width: '100%',
  },
  Home: {
    ...baseButtonStyle,
    backgroundColor: "#4CAF50", // Using material design color for consistency
    position: "absolute",
    top: 20,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25, // Adjusted for perfect circle
  },
  homeText: {
    ...baseButtonTextStyle,
    fontSize: 16, // Keeping text size consistent with base style
  },
  soundButton: {
    ...baseButtonStyle, // Utilizing base button style for consistency
    backgroundColor: "#03A9F4", // Material design light blue for a fresh look
  },
  soundButtonPressed: { // Added pressed state style for visual feedback
    ...baseButtonStyle,
    backgroundColor: "#0288D1", // A slightly darker shade for the pressed state
  },
  buttonText: { // Ensured that all text within buttons uses this style
    ...baseButtonTextStyle,
  },
});

export default CreateSoundStyles;
