import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing, scale } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import { useTheme } from "@/src/contexts/ThemeContext";
import { TrafficCountWorkOrder } from "../types";
import { FontSizes, FontWeights } from "@/src/styles/theme/fonts";

interface WorkOrderCardProps {
  item: TrafficCountWorkOrder;
  onPress?: () => void;
}

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

export default function WorkOrderCard({ item, onPress }: WorkOrderCardProps) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();

  const getSyncStatusStyle = () => {
    if (item.syncStatus === "Synced") {
      return styles.syncBadgeSynced;
    }
    return styles.syncBadgeNotSynced;
  };

  const getSyncStatusTextStyle = () => {
    if (item.syncStatus === "Synced") {
      return styles.syncTextSynced;
    }
    return styles.syncTextNotSynced;
  };

  const getStatusColor = () => {
    switch (item.status) {
      case "To Do":
        return theme.secondary;
      case "In Progress":
        return colors.lightGreen;
      case "Done":
        return colors.lightGreen;
      default:
        return theme.secondary;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.woInfo}>
            <TextView style={styles.woNumber}>Work NO : {item.no}</TextView>
            <View style={[styles.syncBadge, getSyncStatusStyle()]}>
              {item.syncStatus === "Synced" && (
                <TextView style={[styles.syncIcon]}>↻</TextView>
              )}
              {item.syncStatus !== "Synced" && (
                <TextView style={styles.warningIcon}>⚠</TextView>
              )}
              <TextView style={[styles.syncText, getSyncStatusTextStyle()]}>
                {item.syncStatus === "Synced" ? "Synced" : "Not Synced"}
              </TextView>
            </View>
          </View>
          <TextView style={[styles.statusText, { color: getStatusColor() }]}>
            {item.status}
          </TextView>
        </View>

        <TextView style={styles.siteName}>
          Site Name : {item.locationName}
        </TextView>

        <TextView style={styles.dateRange}>
          {formatDateTime(item.startDT)} / {formatDateTime(item.endDT)}
        </TextView>

        <TextView style={styles.daysLeft}>{item.daysLeft} Days Left</TextView>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    content: {
      gap: 4,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    woInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    woNumber: {
      fontSize: FontSizes.lg,
      fontWeight: FontWeights.bold,
      color: theme.text,
    },
    syncBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      gap: 3,
    },
    syncBadgeSynced: {
      backgroundColor: "#e8f5e9",
    },
    syncBadgeNotSynced: {
      backgroundColor: "#ffebee",
    },
    syncText: {
      fontSize: FontSizes.xxs,
      fontWeight: FontWeights.semiBold,
    },
    syncTextSynced: {
      color: "#4caf50",
    },
    syncTextNotSynced: {
      color: "#f44336",
    },
    syncIcon: {
      fontSize: 10,
      color: "#4caf50",
    },
    warningIcon: {
      fontSize: 9,
      color: "#f44336",
    },
    statusText: {
      fontSize: FontSizes.sm,
      fontWeight: FontWeights.medium,
    },
    siteName: {
      fontSize: FontSizes.xs,
      color: theme.secondary,
      marginTop: 2,
    },
    dateRange: {
      fontSize: FontSizes.xs,
      color: theme.secondary,
    },
    daysLeft: {
      fontSize: FontSizes.xs,
      color: theme.secondary,
      marginTop: 2,
    },
  });
