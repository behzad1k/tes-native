import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import TextView from "./TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { colors } from "@/src/styles/theme/colors";
import { spacing } from "@/src/styles/theme/spacing";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";
type ButtonSize = "small" | "medium" | "large";

interface ButtonViewProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function ButtonView({
  children,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonViewProps) {
  const styles = useThemedStyles(createStyles);

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return styles.primary;
      case "secondary":
        return styles.secondary;
      case "outline":
        return styles.outline;
      case "danger":
        return styles.danger;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return styles.small;
      case "medium":
        return styles.medium;
      case "large":
        return styles.large;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.placeholder;
    switch (variant) {
      case "primary":
      case "danger":
        return colors.white;
      case "secondary":
        return colors.white;
      case "outline":
        return colors.lightGreen;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyles(),
        getSizeStyles(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <TextView
          variant="button"
          style={[{ color: getTextColor() }, textStyle]}
        >
          {children}
        </TextView>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
    },
    primary: {
      backgroundColor: colors.lightGreen,
    },
    secondary: {
      backgroundColor: theme.secondary,
    },
    outline: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.lightGreen,
    },
    danger: {
      backgroundColor: colors.error,
    },
    small: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    medium: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    large: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    disabled: {
      opacity: 0.5,
    },
  });
