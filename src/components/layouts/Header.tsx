import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft } from "phosphor-react-native";
import TextView from "@/src/components/ui/TextView";
import ThemeSwitchButton from "@/src/components/ui/DarkModeButton";
import LanguageSwitchButton from "@/src/components/ui/LanguageSwitchButton";

interface HeaderProps {
  title?: string;
  onBackPress?: (() => void) | true;
  showThemeSwitch?: boolean;
  showLanguageSwitch?: boolean;
  rightComponent?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onBackPress,
  showThemeSwitch = false,
  showLanguageSwitch = false,
  rightComponent,
}) => {
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);

  const handleBackPress = () => {
    if (typeof onBackPress === "function") {
      onBackPress();
    } else if (onBackPress === true) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {onBackPress && (
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <ArrowLeft size={24} color={styles.icon.color} />
          </TouchableOpacity>
        )}
        {title && (
          <TextView variant="h4" style={styles.title}>
            {title}
          </TextView>
        )}
      </View>

      <View style={styles.right}>
        {showLanguageSwitch && <LanguageSwitchButton />}
        {showThemeSwitch && <ThemeSwitchButton />}
        {rightComponent}
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      height: 56,
      backgroundColor: theme.primary,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flex: 1,
    },
    backButton: {
      padding: spacing.xs,
    },
    title: {
      color: theme.text,
      flex: 1,
    },
    right: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    icon: {
      color: theme.text,
    },
  });
