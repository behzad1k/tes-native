import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/src/contexts/ThemeContext";
import { Moon, Sun } from "phosphor-react-native";
import { colors } from "@/src/styles/theme/colors";

export default function ThemeSwitchButton() {
  const { isDark, setThemeMode } = useTheme();

  const toggleTheme = () => {
    setThemeMode(isDark ? "light" : "dark");
  };

  return (
    <TouchableOpacity style={styles.button} onPress={toggleTheme}>
      {isDark ? (
        <Sun size={24} color={colors.green} weight="fill" />
      ) : (
        <Moon size={24} color={colors.green} weight="fill" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
