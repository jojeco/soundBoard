import { StyleSheet } from "react-native";

const baseButtonStyle = {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        padding: 10,
        margin : 10,    
  };
  
  const baseButtonTextStyle = {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  };

export const soundBoardStyles = StyleSheet.create({
    // background styles
    background: {
        backgroundColor: "lightgrey",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",       
    },
    // gridstyles
    gridContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        alignContent: "center",
        width: 370, // You may adjust this width based on your needs
        borderWidth: 1,
        flexWrap: 'wrap', // This is not directly applicable here, see gridLayout for wrapping
    },
    gridLayout: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        flexWrap: 'wrap', // Enable wrapping
        width: '100%', // Ensure the container takes the full width of its parent
    },
    Home: {
        position: "absolute",
        width: 50,
        top: 50,
        left: 10,
        position: "absolute",
        margin: 10,
    },
    soundButton: {
        backgroundColor: "lightblue",
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        padding: 10,
        margin : 10,    
    },
    SBP: {
        ...baseButtonStyle,
        backgroundColor: "green",
        
    },
    SBP: {
        ...baseButtonStyle,
        backgroundColor: "blue",
        
    },
    SBStyles: {
        textAlign: "center",
        justifyContent: "center",
        alignContent: "center",
        fontSize: 20,
    },
    homeText: {
        fontSize: 16,
        textAlign: "center",
        
        color: "white",
    }, 

});
export default soundBoardStyles;