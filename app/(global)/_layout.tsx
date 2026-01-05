import { Stack } from "expo-router";
import React from "react";
import { useTheme } from "@/src/contexts/ThemeContext";

export default function GlobalLayout() {
  const { isThemeReady } = useTheme();

  if (!isThemeReady) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name={"login"} />
      <Stack.Screen name={"index"} />
    </Stack>
  );
}
