import { StyleSheet, Dimensions } from 'react-native';

// Gets the device's width to help with sizing and spacing
const { width: DEVICE_WIDTH } = Dimensions.get('window');

// Defines base styles for buttons and text to reuse
const baseButtonStyle = {
  width: 80,
  height: 60,
  justifyContent: 'center',
  alignItems: 'center',
  marginHorizontal: (DEVICE_WIDTH - (70 * 3)) / 6, // Calculates dynamic spacing based on device width
  borderRadius: 10,
};

const baseButtonTextStyle = {
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: 'bold',
  textAlign: 'center',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 20,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-around', 
    alignItems: 'center', 
    marginBottom: 20, 
  },

  button: {
    ...baseButtonStyle,
    backgroundColor: '#4CAF50', 
  },

  buttonText: {
    ...baseButtonTextStyle, 
  },

  buttonPressed: {
    backgroundColor: '#388E3C', 
  },

  buttonRecorded: {
    ...baseButtonStyle,
    backgroundColor: '#FFA07A', 
  },

  buttonDelete: {
    ...baseButtonStyle,
    backgroundColor: '#FF6347', 
  },

  buttonTextRecorded: {
    ...baseButtonTextStyle, 
  },
  
});

export default styles;
