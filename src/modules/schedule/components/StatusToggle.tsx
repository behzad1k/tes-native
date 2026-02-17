import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { colors } from "@/src/styles/theme/colors";
import { spacing } from "@/src/styles/theme/spacing";
import { TaskStatus } from "../types";

interface StatusToggleProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  options?: { value: TaskStatus; label: string }[];
}

const StatusToggle: React.FC<StatusToggleProps> = ({
  value,
  onChange,
  options = [
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "DONE", label: "Done" },
  ],
}) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.button,
            value === option.value && styles.buttonActive,
          ]}
          onPress={() => onChange(option.value)}
          activeOpacity={0.7}
        >
          <TextView
            style={[
              styles.buttonText,
              value === option.value && styles.buttonTextActive,
            ]}
          >
            {option.label}
          </TextView>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      gap: spacing.xs,
    },
    button: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: 100,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
    buttonActive: {
      backgroundColor: colors.lightGreen,
      borderColor: colors.lightGreen,
    },
    buttonText: {
      fontSize: 14,
      color: theme.secondary,
      fontWeight: "500",
    },
    buttonTextActive: {
      color: colors.white,
      fontWeight: "600",
    },
  });

export default StatusToggle;
