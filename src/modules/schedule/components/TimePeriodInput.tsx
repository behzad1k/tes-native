import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { colors } from "@/src/styles/theme/colors";
import { spacing, scale } from "@/src/styles/theme/spacing";
import { TimePeriod } from "../types";
import { Plus, Minus } from "phosphor-react-native";

interface TimePeriodInputProps {
  timePeriods: TimePeriod[];
  onChange: (timePeriods: TimePeriod[]) => void;
  editable?: boolean;
  maxPeriods?: number;
}

const TimePeriodInput: React.FC<TimePeriodInputProps> = ({
  timePeriods,
  onChange,
  editable = true,
  maxPeriods = 4,
}) => {
  const styles = useThemedStyles(createStyles);

  const handleTimeChange = (
    index: number,
    field: "from" | "to",
    value: string
  ) => {
    const updated = [...timePeriods];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addTimePeriod = () => {
    if (timePeriods.length < maxPeriods) {
      onChange([
        ...timePeriods,
        { id: Date.now().toString(), from: "06:00", to: "06:00" },
      ]);
    }
  };

  const removeTimePeriod = (index: number) => {
    if (timePeriods.length > 1) {
      const updated = timePeriods.filter((_, i) => i !== index);
      onChange(updated);
    }
  };

  return (
    <View style={styles.container}>
      {timePeriods.map((period, index) => (
        <View key={period.id} style={styles.periodRow}>
          <View style={styles.timeGroup}>
            <TextView style={styles.label}>From</TextView>
            <View style={styles.timeInput}>
              <TextView style={styles.timeText}>{period.from}</TextView>
            </View>
          </View>

          <View style={styles.timeGroup}>
            <TextView style={styles.label}>To</TextView>
            <View style={styles.timeInput}>
              <TextView style={styles.timeText}>{period.to}</TextView>
            </View>
          </View>

          {editable && timePeriods.length > 1 && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeTimePeriod(index)}
            >
              <Minus size={16} color={colors.error} weight="bold" />
            </TouchableOpacity>
          )}
        </View>
      ))}

      {editable && timePeriods.length < maxPeriods && (
        <TouchableOpacity style={styles.addButton} onPress={addTimePeriod}>
          <Plus size={16} color={colors.lightGreen} weight="bold" />
          <TextView style={styles.addButtonText}>Add Time Period</TextView>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    periodRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    timeGroup: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    label: {
      fontSize: 14,
      color: colors.lightGreen,
      fontWeight: "500",
      minWidth: 40,
    },
    timeInput: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      height: scale(36),
      justifyContent: "center",
    },
    timeText: {
      fontSize: 14,
      color: theme.text,
      textAlign: "center",
    },
    removeButton: {
      width: scale(32),
      height: scale(32),
      borderRadius: scale(16),
      backgroundColor: `${colors.error}20`,
      alignItems: "center",
      justifyContent: "center",
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.lightGreen,
      borderRadius: 4,
    },
    addButtonText: {
      fontSize: 14,
      color: colors.lightGreen,
      fontWeight: "500",
    },
  });

export default TimePeriodInput;
