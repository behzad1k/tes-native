import { useAuth } from "@/src/contexts/AuthContext";
import { useDrawer } from "@/src/contexts/DrawerContext";
import LoginDrawer from "@/src/features/auth/views/LoginDrawer";
import { useLanguage } from "@/src/hooks/useLanguage";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { colors } from "@/src/styles/theme/colors";
import { spacing } from "@/src/styles/theme/spacing";
import Typography from "@/src/styles/theme/typography";
import { router, Tabs } from "expo-router";
import { ListChecks, PlusCircle, User } from "phosphor-react-native";
import React from "react";
import { Dimensions, StyleSheet } from "react-native";
import { useTheme } from "@/src/contexts/ThemeContext";

export default function TabLayout() {
  const { t } = useLanguage();
  const styles = useThemedStyles(createStyles);
  const { theme, isThemeReady } = useTheme();
  const { openDrawer } = useDrawer();
  const { isAuthenticated } = useAuth();

  if (!isThemeReady) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.pink,
        tabBarInactiveTintColor: theme.text,
        headerShown: false,
        tabBarStyle: [styles.container],
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="signs"
        options={{
          title: "Signs",
          tabBarLabelStyle: {
            ...Typography.variants.label,
          },
          tabBarIcon: ({ color }) => <ListChecks color={color} size={26} />,
        }}
        listeners={{
          tabPress: (e) => {
            if (!isAuthenticated) {
              openDrawer("login", <LoginDrawer />, {
                position: "bottom",
                drawerHeight: "auto",
                drawerWidth: width,
              });
            }
          },
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t("general.newOrder"),
          tabBarLabelStyle: {
            ...Typography.variants.label,
          },
          tabBarIcon: ({ color }) => <PlusCircle color={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isAuthenticated ? t("general.profile") : t("general.login"),
          tabBarLabelStyle: {
            ...Typography.variants.label,
          },
          tabBarIcon: ({ color }) => <User color={color} size={26} />,
        }}
        listeners={{
          tabPress: (e) => {
            if (isAuthenticated) {
              router.push("/profile");
            } else {
              openDrawer("login", <LoginDrawer />, {
                position: "bottom",
                drawerHeight: "auto",
                drawerWidth: width,
              });
            }
          },
        }}
      />
    </Tabs>
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
