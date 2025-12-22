import { useTheme } from "@/src/components/contexts/ThemeContext";
import TextView from "@/src/components/ui/TextView";
import { colors } from "@/src/styles/theme/colors";
import React from "react";
import { View, StyleSheet } from "react-native";

export default function Splash({ textValue }: { textValue: string }) {
  const { isDark, theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TextView style={[styles.appName]}>TES</TextView>

      <TextView
        style={[styles.loadingText, { color: isDark ? "#ccc" : "#666" }]}
      >
        {textValue}
      </TextView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
    resizeMode: "contain",
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 40,
    color: colors.pink,
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
  },
});
