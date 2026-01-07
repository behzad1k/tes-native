import React, { useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { Header } from "@/src/components/layouts/Header";
import { SignList } from "../components/SignList";
import { useSigns, usePendingSigns } from "../hooks/useSigns";
import { useSyncSigns } from "../hooks/useSyncSigns";
import { useSyncStore } from "@/src/store/sync";
import TextView from "@/src/components/ui/TextView";
import { spacing } from "@/src/styles/theme/spacing";
import { router } from "expo-router";
import { PlusCircle, ArrowsClockwise } from "phosphor-react-native";
import { colors } from "@/src/styles/theme/colors";
import { withObservables } from "@nozbe/watermelondb/react";

export function SignsListScreen() {
  const styles = useThemedStyles(createStyles);
  const { mutate: syncSigns, isPending: isSyncing } = useSyncSigns();
  const { isOnline, isSyncing: globalSyncing } = useSyncStore();
  const signs = useSigns();
  const pendingSigns = usePendingSigns();

  const handleCreateSign = () => {
    router.push("/signs/create" as any);
  };

  const handleSignPress = (sign: any) => {
    router.push(`/signs/${sign.id}` as any);
  };

  const handleSync = () => {
    if (isOnline) {
      syncSigns();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Sign Inventory" />

      <View style={styles.header}>
        <View style={styles.statusRow}>
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? colors.success : colors.error },
              ]}
            />
            <TextView variant="bodySmall">
              {isOnline ? "Online" : "Offline"}
            </TextView>
          </View>

          {pendingSigns.length > 0 && (
            <View style={styles.pendingBadge}>
              <TextView variant="bodySmall" style={styles.pendingText}>
                {pendingSigns.length} pending sync
              </TextView>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          {pendingSigns.length > 0 && isOnline && (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={handleSync}
              disabled={isSyncing || globalSyncing}
            >
              <ArrowsClockwise
                size={20}
                color={colors.green}
                weight={isSyncing ? "bold" : "regular"}
              />
              <TextView variant="bodySmall" style={styles.syncText}>
                {isSyncing ? "Syncing..." : "Sync Now"}
              </TextView>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateSign}
          >
            <PlusCircle size={24} color={colors.white} weight="fill" />
            <TextView variant="button" style={styles.createButtonText}>
              New Sign
            </TextView>
          </TouchableOpacity>
        </View>
      </View>

      <SignList signs={signs} onSignPress={handleSignPress} />
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      padding: spacing.md,
      gap: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 16,
      backgroundColor: theme.primary,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    pendingBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 16,
      backgroundColor: colors.warning,
    },
    pendingText: {
      color: colors.white,
      fontWeight: "600",
    },
    actions: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    syncButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.green,
      backgroundColor: theme.background,
    },
    syncText: {
      color: colors.green,
    },
    createButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      backgroundColor: colors.green,
    },
    createButtonText: {
      color: colors.white,
    },
  });
