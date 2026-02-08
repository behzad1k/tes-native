import React from "react";
import { View, StyleSheet } from "react-native";
import TextView from "./TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { colors } from "@/src/styles/theme/colors";
import { spacing } from "@/src/styles/theme/spacing";
import { CloudArrowUp, CheckCircle, Clock } from "phosphor-react-native";

interface SyncStatusSummaryProps {
  pendingCreates: number;
  pendingUpdates: number;
  pendingImages: number;
}

export default function SyncStatusSummary({
  pendingCreates,
  pendingUpdates,
  pendingImages,
}: SyncStatusSummaryProps) {
  const styles = useThemedStyles(createStyles);
  const total = pendingCreates + pendingUpdates + pendingImages;

  if (total === 0) {
    return (
      <View style={styles.container}>
        <CheckCircle size={16} color={colors.success} weight="fill" />
        <TextView style={styles.syncedText}>All changes synced</TextView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CloudArrowUp size={16} color={colors.warning} weight="fill" />
      <TextView style={styles.pendingText}>
        {pendingCreates > 0 && `${pendingCreates} new`}
        {pendingCreates > 0 && pendingUpdates > 0 && ", "}
        {pendingUpdates > 0 && `${pendingUpdates} updated`}
        {(pendingCreates > 0 || pendingUpdates > 0) &&
          pendingImages > 0 &&
          ", "}
        {pendingImages > 0 && `${pendingImages} images`}
      </TextView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.primary,
      borderRadius: 12,
    },
    syncedText: {
      fontSize: 12,
      color: colors.success,
      fontWeight: "600",
    },
    pendingText: {
      fontSize: 12,
      color: colors.warning,
      fontWeight: "600",
    },
  });
