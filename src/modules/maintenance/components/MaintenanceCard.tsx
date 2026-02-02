import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { SYNC_STATUS } from "@/src/constants/global";
import { useTheme } from "@/src/contexts/ThemeContext";
import { MaintenanceJob } from "@/src/types/models";

interface MaintenanceCardProps {
  item: MaintenanceJob;
  index: number;
  onPress?: () => void;
}

export default function MaintenanceCard({
  item,
  onPress,
  index,
}: MaintenanceCardProps) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();

  const getStatusText = () => {
    switch (item.statusName) {
      case SYNC_STATUS.SYNCED:
        return "Synced";
      case SYNC_STATUS.NOT_SYNCED:
        return "Pending Failed";
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.icon}>
        <TextView style={styles.iconText}>{index + 1}</TextView>
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <TextView style={styles.maintenanceTitle}>{`${item.name}`}</TextView>
        </View>
        <TextView style={styles.maintenanceDescription}>
          {item.assignDate}
        </TextView>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderColor: theme.border,
      gap: 10,
    },
    icon: {
      margin: "auto",
      borderRadius: 200,
      backgroundColor: theme.primary,
      padding: spacing.xxs,
      minWidth: 30,
      minHeight: 30,
    },
    iconText: {
      textAlign: "center",
      fontWeight: "semibold",
      fontSize: 16,
    },
    header: {
      flex: 1,
    },
    titleRow: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    maintenanceTitle: {
      fontWeight: 600,
      fontSize: 14,
      lineHeight: 22,
    },
    maintenanceDescription: {
      fontWeight: 400,
      fontSize: 10,
      lineHeight: 18,
      color: theme.secondary,
    },
    content: {
      flex: 1,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    label: {
      color: theme.secondary,
      fontWeight: "500",
    },
    value: {
      color: theme.text,
      flex: 1,
      textAlign: "right",
    },
    notesContainer: {
      marginTop: spacing.xs,
      gap: 4,
    },
    notes: {
      color: theme.text,
      fontStyle: "italic",
    },
    footer: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    timestamp: {
      color: theme.secondary,
    },
  });
