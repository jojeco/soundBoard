import React from "react";
import { Pressable, Text, View } from "react-native";
import soundPrefsStyles from "../styles/soundPrefs-styles";

// Presentational only — no data access. Renders a star indicator when
// favorited and a small play-count badge when count > 0. Text-only
// indicators: no image assets, no icon library.
export default function SoundButton({
  label,
  labelStyle,
  favorite,
  playCount,
  onPress,
  onLongPress,
  style,
  pressedStyle,
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [style, pressed ? pressedStyle : {}]}
    >
      <View>
        <Text style={labelStyle}>{label}</Text>
        {favorite ? (
          <Text style={soundPrefsStyles.starBadge}>★</Text>
        ) : null}
        {playCount > 0 ? (
          <Text style={soundPrefsStyles.playCountBadge}>{playCount}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
