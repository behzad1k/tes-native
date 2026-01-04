import { useDrawer } from "@/src/contexts/DrawerContext";
import LoginDrawer from "@/src/features/auth/views/LoginDrawer";
import { useLanguage } from "@/src/hooks/useLanguage";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { colors } from "@/src/styles/theme/colors";
import { spacing } from "@/src/styles/theme/spacing";
import Typography from "@/src/styles/theme/typography";
import { router, Stack, Tabs } from "expo-router";
import { ListChecks, PlusCircle, User } from "phosphor-react-native";
import React from "react";
import { Dimensions, StyleSheet } from "react-native";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useAuthStore } from "@/src/store/auth";

export default function TabLayout() {
  const { t } = useLanguage();
  const styles = useThemedStyles(createStyles);
  const { theme, isThemeReady } = useTheme();
  const { openDrawer } = useDrawer();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isThemeReady) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name={"home"} />
    </Stack>
  );
}

const { width } = Dimensions.get("window");

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      backgroundColor: theme.background,
      height: 80,
      width: width,
      position: "absolute" as any,
      bottom: 0,
      borderTopWidth: 0.5,
      borderTopColor: theme.border,
    },
    tabItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xs,
    },
  });
