import { StyleSheet } from "react-native";

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
        width: 370,
        borderWidth: 1,
    },
    
    gridLayout: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "Space-Around",
        borderColor: "black",
        marginBottom: 10,
        flex: 'wrap',
    
      
    },
    Home: {
        backgroundColor: "lightgreen",
        alignContent: "center",
        justifyContent: "center",
        width: 40,
        top: 10,
        left: 10,
        position: "absolute",
        height: 40,
        borderRadius: 100,
        margin: 10,
    },
    homeText: {
        fontSize: 16,
        textAlign: "center",
    }, 
    soundButton: {
        backgroundColor: "lightblue",
        textAlign: "center",
        justifyContent: "center",
        alignContent: "center",
        flex: 1,
        height: '50%',
        borderRadius: 10,
        margin: 20,
    },
    SBStyles: {
        textAlign: "center",
        justifyContent: "center",
        alignContent: "center",
        fontSize: 20,
    },

});
export default soundBoardStyles;