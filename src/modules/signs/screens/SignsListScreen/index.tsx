import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { Header } from "@/src/components/layouts/Header";
import { SignList } from "./components/SignList";
import TextView from "@/src/components/ui/TextView";
import { spacing } from "@/src/styles/theme/spacing";
import { router } from "expo-router";
import { House, MagnifyingGlass, Repeat, Plus } from "phosphor-react-native";
import { colors } from "@/src/styles/theme/colors";
import Tabs from "@/src/components/layouts/Tabs";
import { TabsType } from "@/src/types/layouts";
import { useTranslation } from "react-i18next";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { useSigns } from "../../hooks/useSigns";
import FilterSignForm from "./components/FilterSignForm";
import NewSignType from "./components/NewSignType";
import SortSignForm from "./components/SignSortForm";

export function SignsListScreen() {
  const { t } = useTranslation();
  const TABS: TabsType = {
    LIST: { value: t("list") },
    MAP: { value: t("map") },
  } as const;
  const styles = useThemedStyles(createStyles);
  const [tab, setTab] = useState(Object.keys(TABS)[0]);
  const { signs, sort, setSort, filters, setFilters } = useSigns();
  const { openDrawer } = useDrawer();

  const handleSortPress = () => {
    openDrawer("sort-sign", <SortSignForm sort={sort} setSort={setSort} />, {
      drawerHeight: "auto",
    });
  };

  const handleFilterPress = () => {
    openDrawer(
      "filter-sign",
      <FilterSignForm filters={filters} setFilters={setFilters} />,
      { drawerHeight: "auto" },
    );
  };
  const handleCreateSign = () => {
    openDrawer("new-sign-type", <NewSignType />, { drawerHeight: "auto" });
  };

  const handleSignPress = (sign: any) => {
    router.push(`/signs/${sign.id}` as any);
  };

  const handleSync = () => {};

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title={t("signs.title")}
        leftIcons={[
          <TouchableOpacity key="home">
            <House />
          </TouchableOpacity>,
        ]}
        rightIcons={[
          <TouchableOpacity key="search">
            <MagnifyingGlass />
          </TouchableOpacity>,
          <TouchableOpacity key="sync">
            <Repeat />
          </TouchableOpacity>,
        ]}
      />
      <Tabs setTab={setTab} tab={tab} tabs={TABS} />
      <View style={styles.listHeader}>
        <TextView
          style={styles.itemsLengthText}
        >{`${signs.length} ${t("items")}`}</TextView>
        <View style={styles.listActions}>
          <TouchableOpacity onPress={handleSortPress}>
            <TextView style={styles.listActionText}>{t("sort")}</TextView>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleFilterPress}>
            <TextView style={styles.listActionText}>{t("filter")}</TextView>
          </TouchableOpacity>
        </View>
      </View>
      {/*<View style={styles.header}>
        <View style={styles.statusRow}>
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
        </View>
      </View>*/}

      <SignList signs={signs} onSignPress={handleSignPress} />
      <TouchableOpacity style={styles.createButton} onPress={handleCreateSign}>
        <Plus size={60} color={colors.white} weight="bold" />
      </TouchableOpacity>
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
    listHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 16,
      borderBottomWidth: 2,
      borderColor: theme.primary,
    },
    itemsLengthText: {
      fontSize: 16,
      color: theme.secondary,
    },
    listActions: {
      flexDirection: "row",
      gap: 16,
    },
    listActionText: {
      fontSize: 18,
      color: colors.lightBlue,
    },
    createButton: {
      position: "absolute",
      bottom: 64,
      right: 36,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xxs,
      borderRadius: 100,
      backgroundColor: colors.lightGreen,
    },
    createButtonText: {
      color: colors.white,
    },
  });
