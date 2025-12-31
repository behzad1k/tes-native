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
import { Clipboard, PlusCircle, User } from "phosphor-react-native";
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
        name="cart"
        options={{
          title: t("general.orders"),
          tabBarLabelStyle: {
            ...Typography.variants.large,
          },
          tabBarIcon: ({ color }) => <Clipboard color={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t("general.newOrder"),
          tabBarLabelStyle: {
            ...Typography.variants.large,
          },
          tabBarIcon: ({ color }) => (
            <PlusCircle
              // weight={isActive('NewOrder') ? 'fill' : 'regular'}
              color={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isAuthenticated ? t("general.profile") : t("general.login"),
          tabBarLabelStyle: {
            ...Typography.variants.large,
          },
          tabBarIcon: ({ color }) => <User color={color} size={26} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();

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
      position: "fixed",
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
    tabText: {
      color: colors.white,
      marginTop: spacing.xs,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fff",
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: "#666",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fff",
      padding: 20,
    },
    errorText: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#ff0000",
      marginBottom: 10,
    },
    errorDetail: {
      fontSize: 14,
      color: "#666",
      textAlign: "center",
    },
  });
