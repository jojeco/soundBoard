import { StyleSheet } from "react-native";

export const soundPrefsStyles = StyleSheet.create({
  sortBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    width: "100%",
    marginTop: 6,
    marginBottom: 6,
  },
  sortChip: {
    borderWidth: 1,
    borderColor: "#4EC5F1",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    margin: 4,
    backgroundColor: "transparent",
  },
  sortChipActive: {
    backgroundColor: "#4EC5F1",
  },
  sortChipText: {
    fontSize: 12,
    color: "#4EC5F1",
    fontWeight: "bold",
  },
  sortChipTextActive: {
    color: "#FFFFFF",
  },
  starBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    fontSize: 14,
    color: "gold",
  },
  playCountBadge: {
    position: "absolute",
    bottom: -6,
    right: -6,
    fontSize: 10,
    color: "#333333",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 4,
    overflow: "hidden",
  },
  stopButton: {
    backgroundColor: "#FF6347",
    borderRadius: 10,
    padding: 10,
    margin: 10,
    alignItems: "center",
  },
  stopButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  emptyStateText: {
    textAlign: "center",
    color: "#666666",
    fontStyle: "italic",
    margin: 20,
  },
});

export default soundPrefsStyles;
