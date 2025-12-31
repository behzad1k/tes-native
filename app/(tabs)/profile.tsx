import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { Header } from "@/src/components/layouts/Header";
import TextView from "@/src/components/ui/TextView";
import { useAuth } from "@/src/contexts/AuthContext";
import { useUser } from "@/src/features/user/hooks/useUser";
import { spacing } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import { User, SignOut } from "phosphor-react-native";
import { router } from "expo-router";
import { useSyncStore } from "@/src/store/sync";
import { useAuthStore } from "@/src/store/auth";

export default function ProfileScreen() {
  const styles = useThemedStyles(createStyles);
  const { logout } = useAuth();
  const { data: userData, isLoading } = useUser();
  const user = useAuthStore((state) => state.user);
  const { lastSyncTime, pendingCount } = useSyncStore();

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header title="Profile" />
        <View style={styles.loadingContainer}>
          <TextView variant="body">Loading profile...</TextView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Profile" />
      <ScrollView style={styles.content}>
        {/* User Info Card */}
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={48} color={colors.pink} weight="fill" />
            </View>
          </View>

          <View style={styles.userInfo}>
            <TextView variant="h3" style={styles.name}>
              {user?.name || "User"} {user?.lastName || ""}
            </TextView>
            <TextView variant="body" style={styles.phone}>
              {user?.phoneNumber}
            </TextView>
            {user?.role && (
              <View style={styles.roleBadge}>
                <TextView variant="caption" style={styles.roleText}>
                  {user.role}
                </TextView>
              </View>
            )}
          </View>
        </View>

        {/* Sync Status Card */}
        <View style={styles.card}>
          <TextView variant="h4" style={styles.cardTitle}>
            Sync Status
          </TextView>

          <View style={styles.syncRow}>
            <TextView variant="body" style={styles.syncLabel}>
              Pending Items:
            </TextView>
            <TextView variant="bodyMedium" style={styles.syncValue}>
              {pendingCount}
            </TextView>
          </View>

          {lastSyncTime && (
            <View style={styles.syncRow}>
              <TextView variant="body" style={styles.syncLabel}>
                Last Sync:
              </TextView>
              <TextView variant="bodySmall" style={styles.syncValue}>
                {new Date(lastSyncTime).toLocaleString()}
              </TextView>
            </View>
          )}
        </View>

        {/* Account Details Card */}
        <View style={styles.card}>
          <TextView variant="h4" style={styles.cardTitle}>
            Account Details
          </TextView>

          <View style={styles.detailRow}>
            <TextView variant="body" style={styles.detailLabel}>
              Phone Number:
            </TextView>
            <TextView variant="body" style={styles.detailValue}>
              {user?.phoneNumber}
            </TextView>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
            <TextView variant="button" style={styles.actionButtonText}>
              Edit Profile
            </TextView>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <SignOut size={20} color={colors.white} />
            <TextView variant="button" style={styles.logoutButtonText}>
              Logout
            </TextView>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    card: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    avatarContainer: {
      alignItems: "center",
      marginBottom: spacing.md,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.background,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.pink,
    },
    userInfo: {
      alignItems: "center",
      gap: spacing.xs,
    },
    name: {
      color: theme.text,
    },
    phone: {
      color: theme.secondary,
    },
    roleBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.pink,
      marginTop: spacing.xs,
    },
    roleText: {
      color: colors.white,
      fontWeight: "600",
    },
    cardTitle: {
      color: theme.text,
      marginBottom: spacing.sm,
    },
    syncRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.xs,
    },
    syncLabel: {
      color: theme.secondary,
    },
    syncValue: {
      color: theme.text,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    detailLabel: {
      color: theme.secondary,
    },
    detailValue: {
      color: theme.text,
      flex: 1,
      textAlign: "right",
    },
    actions: {
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.md,
      borderRadius: 8,
      backgroundColor: colors.pink,
      gap: spacing.xs,
    },
    actionButtonText: {
      color: colors.white,
    },
    logoutButton: {
      backgroundColor: colors.error,
    },
    logoutButtonText: {
      color: colors.white,
    },
  });
