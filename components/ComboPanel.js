import React, { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import comboStyles from "../styles/combo-styles";
import combosLib from "../lib/combos";

const { addStep, removeStep, moveStep, nudgeStepDelay, comboSummary, DELAY_STEP_MS, MAX_STEPS } = combosLib;

// Ad-hoc id used for "Preview" in the editor — never saved, just handed to
// onPlay so app/soundBoard.js can run the draft steps through the same combo
// runner a saved combo uses.
const PREVIEW_COMBO_ID = "__preview__";

// Presentational + local editor state only — no storage access. Everything
// (combos, sounds, play/stop, create/update/delete) comes in via props.
export default function ComboPanel({
  combos,
  sounds,
  playingComboId,
  onPlay,
  onStop,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [draftSteps, setDraftSteps] = useState([]);

  const openNewEditor = () => {
    setEditingId(null);
    setDraftName("");
    setDraftSteps([]);
    setEditorOpen(true);
  };

  const openEditEditor = (combo) => {
    setEditingId(combo.id);
    setDraftName(combo.name);
    setDraftSteps(combo.steps);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
  };

  const handleChipPress = (combo) => {
    if (playingComboId === combo.id) {
      onStop();
    } else {
      onPlay(combo);
    }
  };

  const handleChipLongPress = (combo) => {
    Alert.alert(combo.name, "Edit or delete this combo?", [
      { text: "Edit", onPress: () => openEditEditor(combo) },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          Alert.alert("Delete combo?", 'Delete "' + combo.name + '"? This cannot be undone.', [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => onDelete(combo.id) },
          ]),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleAddSound = (soundId) => {
    setDraftSteps((current) => addStep(current, soundId));
  };

  const handleRemoveStep = (index) => {
    setDraftSteps((current) => removeStep(current, index));
  };

  const handleMoveStep = (index, direction) => {
    setDraftSteps((current) => moveStep(current, index, direction));
  };

  const handleNudgeDelay = (index, deltaMs) => {
    setDraftSteps((current) => nudgeStepDelay(current, index, deltaMs));
  };

  const handleSave = () => {
    if (editingId) {
      onUpdate(editingId, { name: draftName, steps: draftSteps });
    } else {
      onCreate(draftName, draftSteps);
    }
    closeEditor();
  };

  const handlePreview = () => {
    onPlay({ id: PREVIEW_COMBO_ID, name: draftName || "Combo", steps: draftSteps, createdAt: 0 });
  };

  const soundName = (soundId) => {
    const found = sounds.find((s) => s.id === soundId);
    return found ? found.name : soundId;
  };

  return (
    <View style={comboStyles.panel}>
      <View style={comboStyles.headerRow}>
        <Text style={comboStyles.headerText}>Combos</Text>
        <Pressable onPress={openNewEditor}>
          <Text style={comboStyles.headerText}>+ New</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: "center", paddingHorizontal: 6 }}
      >
        {combos.map((combo) => (
          <Pressable
            key={combo.id}
            onPress={() => handleChipPress(combo)}
            onLongPress={() => handleChipLongPress(combo)}
            style={[comboStyles.chip, playingComboId === combo.id ? comboStyles.chipActive : {}]}
          >
            <Text style={comboStyles.chipText}>
              {playingComboId === combo.id ? "■ " : ""}
              {combo.name}
            </Text>
            <Text style={comboStyles.summaryText}>{comboSummary(combo, sounds)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Modal visible={editorOpen} transparent animationType="fade" onRequestClose={closeEditor}>
        <View style={comboStyles.backdrop}>
          <View style={comboStyles.card}>
            <TextInput
              style={comboStyles.nameInput}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Combo name"
              placeholderTextColor="#888888"
            />

            <ScrollView style={{ maxHeight: 220 }}>
              {draftSteps.map((step, index) => (
                <View key={index} style={comboStyles.stepRow}>
                  <Text style={comboStyles.stepText}>{soundName(step.soundId)}</Text>
                  <Text style={comboStyles.stepText}>+{step.delayMs}ms</Text>
                  <Pressable
                    style={comboStyles.smallButton}
                    onPress={() => handleNudgeDelay(index, -DELAY_STEP_MS)}
                  >
                    <Text style={comboStyles.smallButtonText}>-</Text>
                  </Pressable>
                  <Pressable
                    style={comboStyles.smallButton}
                    onPress={() => handleNudgeDelay(index, DELAY_STEP_MS)}
                  >
                    <Text style={comboStyles.smallButtonText}>+</Text>
                  </Pressable>
                  <Pressable style={comboStyles.smallButton} onPress={() => handleMoveStep(index, -1)}>
                    <Text style={comboStyles.smallButtonText}>{"↑"}</Text>
                  </Pressable>
                  <Pressable style={comboStyles.smallButton} onPress={() => handleMoveStep(index, 1)}>
                    <Text style={comboStyles.smallButtonText}>{"↓"}</Text>
                  </Pressable>
                  <Pressable style={comboStyles.smallButton} onPress={() => handleRemoveStep(index)}>
                    <Text style={comboStyles.smallButtonText}>{"✕"}</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>

            <Text style={comboStyles.stepText}>
              {draftSteps.length}/{MAX_STEPS}
            </Text>

            <Text style={comboStyles.headerText}>Tap to add</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {sounds.map((sound) => (
                <Pressable
                  key={sound.id}
                  disabled={draftSteps.length >= MAX_STEPS}
                  style={[comboStyles.pickerChip, draftSteps.length >= MAX_STEPS ? { opacity: 0.4 } : {}]}
                  onPress={() => handleAddSound(sound.id)}
                >
                  <Text style={comboStyles.chipText}>{sound.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={comboStyles.headerRow}>
              <Pressable style={comboStyles.saveButton} onPress={handleSave}>
                <Text style={comboStyles.chipText}>Save</Text>
              </Pressable>
              <Pressable style={comboStyles.cancelButton} onPress={closeEditor}>
                <Text style={comboStyles.chipText}>Cancel</Text>
              </Pressable>
              <Pressable style={comboStyles.saveButton} onPress={handlePreview}>
                <Text style={comboStyles.chipText}>Preview</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
