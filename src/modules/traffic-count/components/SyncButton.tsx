import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { ArrowsClockwise, CloudArrowUp, Check } from "phosphor-react-native";
import { useTrafficCountOperations } from "../hooks/useTrafficCountOperations";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import TextView from "@/src/components/ui/TextView";
import { colors } from "@/src/styles/theme/colors";
import { spacing } from "@/src/styles/theme/spacing";
import { FontSizes, FontWeights } from "@/src/styles/theme/fonts";

/**
 * SyncButton Component
 *
 * Shows sync status and allows user to sync traffic count data with backend.
 * Based on old app's sync functionality in TrafficCountHome.js
 *
 * Features:
 * - Shows count of unsynced items
 * - Displays sync progress
 * - Shows success/error states
 * - Preserves local unsynced data during sync
 */
export const SyncButton: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const { isSyncing, unsyncedCount, syncError, syncData, dismissSyncError } =
    useTrafficCountOperations();

  const [lastSyncResult, setLastSyncResult] = useState<{
    success: boolean;
    count?: number;
  } | null>(null);

  const handleSync = async () => {
    setLastSyncResult(null);

    const result = await syncData();

    if (result.success) {
      setLastSyncResult({ success: true, count: result.syncedCount });
      // Clear success message after 3 seconds
      setTimeout(() => setLastSyncResult(null), 3000);
    } else {
      Alert.alert(
        "Sync Failed",
        result.error || "Failed to sync data. Please try again.",
        [{ text: "OK", onPress: dismissSyncError }],
      );
    }
  };

  // Determine button state
  const isDisabled = isSyncing || unsyncedCount === 0;
  const showSuccess = lastSyncResult?.success;

  return (
    <View style={styles.container}>
      {/* Sync status indicator */}
      {unsyncedCount > 0 && !isSyncing && (
        <View style={styles.badge}>
          <TextView style={styles.badgeText}>{unsyncedCount}</TextView>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          isDisabled && styles.buttonDisabled,
          showSuccess && styles.buttonSuccess,
        ]}
        onPress={handleSync}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        {isSyncing ? (
          <>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <TextView style={styles.buttonText}>Syncing...</TextView>
          </>
        ) : showSuccess ? (
          <>
            <Check size={20} color="#FFFFFF" weight="bold" />
            <TextView style={styles.buttonText}>
              Synced {lastSyncResult.count} items
            </TextView>
          </>
        ) : unsyncedCount > 0 ? (
          <>
            <CloudArrowUp size={20} color="#FFFFFF" weight="bold" />
            <TextView style={styles.buttonText}>
              Sync ({unsyncedCount})
            </TextView>
          </>
        ) : (
          <>
            <ArrowsClockwise size={20} color="rgba(255,255,255,0.5)" />
            <TextView style={[styles.buttonText, styles.buttonTextDisabled]}>
              All Synced
            </TextView>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

/**
 * Inline sync status for headers/toolbars
 * Shows just the icon with badge
 */
export const SyncStatusIndicator: React.FC<{ onPress?: () => void }> = ({
  onPress,
}) => {
  const styles = useThemedStyles(createStyles);
  const { isSyncing, unsyncedCount } = useTrafficCountOperations();

  return (
    <TouchableOpacity
      style={styles.indicator}
      onPress={onPress}
      disabled={isSyncing}
    >
      {isSyncing ? (
        <ActivityIndicator size="small" color={colors.lightGreen} />
      ) : (
        <>
          <ArrowsClockwise
            size={24}
            color={
              unsyncedCount > 0 ? colors.lightGreen : "rgba(109,119,122,0.5)"
            }
            weight={unsyncedCount > 0 ? "bold" : "regular"}
          />
          {unsyncedCount > 0 && (
            <View style={styles.indicatorBadge}>
              <TextView style={styles.indicatorBadgeText}>
                {unsyncedCount > 99 ? "99+" : unsyncedCount}
              </TextView>
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      position: "relative",
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.lightGreen,
      borderRadius: 8,
      minWidth: 140,
    },
    buttonDisabled: {
      backgroundColor: "rgba(109,119,122,0.3)",
    },
    buttonSuccess: {
      backgroundColor: "#4CAF50",
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: FontSizes.sm,
      fontWeight: FontWeights.semiBold,
    },
    buttonTextDisabled: {
      color: "rgba(255,255,255,0.5)",
    },
    badge: {
      position: "absolute",
      top: -8,
      right: -8,
      backgroundColor: "#FF5252",
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 6,
      zIndex: 1,
    },
    badgeText: {
      color: "#FFFFFF",
      fontSize: FontSizes.xxs,
      fontWeight: FontWeights.bold,
    },
    // Indicator styles (for header)
    indicator: {
      position: "relative",
      padding: spacing.xs,
    },
    indicatorBadge: {
      position: "absolute",
      top: 0,
      right: 0,
      backgroundColor: "#FF5252",
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    indicatorBadgeText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: FontWeights.bold,
    },
  });

export default SyncButton;
