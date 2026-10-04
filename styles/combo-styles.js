import { StyleSheet } from "react-native";

// Combos panel + editor modal. Matches styles/soundPrefs-styles.js's
// palette/conventions (dark control-room feel, no light borders on dark).
export const comboStyles = StyleSheet.create({
  panel: {
    width: "100%",
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 10,
    marginBottom: 4,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4EC5F1",
  },
  chip: {
    minWidth: 72,
    borderWidth: 1,
    borderColor: "#4EC5F1",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginHorizontal: 4,
    backgroundColor: "rgba(78, 197, 241, 0.08)",
    alignItems: "center",
  },
  chipActive: {
    backgroundColor: "#4EC5F1",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4EC5F1",
    textAlign: "center",
  },
  summaryText: {
    fontSize: 10,
    color: "#9fd8ef",
    textAlign: "center",
    marginTop: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "88%",
    maxHeight: "80%",
    backgroundColor: "#121824",
    borderRadius: 14,
    padding: 16,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: "#4EC5F1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: "#FFFFFF",
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(78, 197, 241, 0.2)",
  },
  stepText: {
    fontSize: 12,
    color: "#FFFFFF",
    marginRight: 6,
  },
  smallButton: {
    minWidth: 28,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: "rgba(78, 197, 241, 0.15)",
    marginLeft: 4,
    alignItems: "center",
  },
  smallButtonText: {
    fontSize: 12,
    color: "#4EC5F1",
    fontWeight: "bold",
  },
  pickerChip: {
    borderWidth: 1,
    borderColor: "#4EC5F1",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 6,
    marginVertical: 8,
    backgroundColor: "transparent",
  },
  saveButton: {
    backgroundColor: "rgba(78, 197, 241, 0.2)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 10,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#4EC5F1",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 10,
    marginRight: 8,
    alignItems: "center",
  },
});

export default comboStyles;
