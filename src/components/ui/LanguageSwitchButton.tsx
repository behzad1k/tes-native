import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { useLanguage } from "@/src/hooks/useLanguage";
import TextView from "./TextView";
import { colors } from "@/src/styles/theme/colors";
import { spacing } from "@/src/styles/theme/spacing";

export default function LanguageSwitchButton() {
  const { currentLanguage, changeLanguage } = useLanguage();

  const toggleLanguage = () => {
    const newLang = currentLanguage === "en" ? "fa" : "en";
    changeLanguage(newLang);
  };

  return (
    <TouchableOpacity style={styles.button} onPress={toggleLanguage}>
      <TextView variant="button" style={styles.text}>
        {currentLanguage.toUpperCase()}
      </TextView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    backgroundColor: colors.pink,
  },
  text: {
    color: colors.white,
    fontSize: 12,
  },
});
