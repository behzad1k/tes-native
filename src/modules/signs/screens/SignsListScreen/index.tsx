import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { Header } from "@/src/components/layouts/Header";
import SignSupportList from "./components/SignList";
import TextView from "@/src/components/ui/TextView";
import { spacing } from "@/src/styles/theme/spacing";
import { router } from "expo-router";
import { House, MagnifyingGlass, Repeat, Plus } from "phosphor-react-native";
import { colors } from "@/src/styles/theme/colors";
import Tabs from "@/src/components/layouts/Tabs";
import { TabsType } from "@/src/types/layouts";
import { useTranslation } from "react-i18next";
import { useDrawer } from "@/src/contexts/DrawerContext";
import FilterSignForm from "./components/FilterSignForm";
import NewSignType from "./components/NewSignType";
import SortSignForm from "./components/SignSortForm";
import { useAppSelector, useAppDispatch } from "@/src/store/hooks";
import {
  startSync,
  calculatePendingOperations,
} from "@/src/store/slices/syncSlice";
import { ROUTES } from "@/src/constants/navigation";
import { Sign, Support } from "@/src/types/models";
import { Toast } from "toastify-react-native";
import { useTheme } from "@/src/contexts/ThemeContext";
import NetInfo from "@react-native-community/netinfo";
import SyncStatusSummary from "@/src/components/ui/SyncStatusSummary";
import { isSupport } from "./components/SignCard";

export default function SignsListScreen() {
  const { t } = useTranslation();
  const TABS: TabsType = {
    LIST: { id: "LIST", value: t("list") },
    MAP: { id: "MAP", value: t("map") },
  } as const;

  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState(Object.keys(TABS)[0]);
  const { openDrawer } = useDrawer();
  const [isOnline, setIsOnline] = useState(true);

  // Get signs from Redux store
  const signs = useAppSelector((state) => state.signs.signs);
  const supports = useAppSelector((state) => state.supports.supports);
  const fullList: Array<Sign | Support> = [...supports, ...signs];
  const isLoading = useAppSelector((state) => state.signs.isLoading);
  const isSyncing = useAppSelector((state) => state.sync.isSyncing);
  const syncProgress = useAppSelector((state) => state.sync.syncProgress);
  const pendingOperations = useAppSelector(
    (state) => state.sync.pendingOperations,
  );

  // Local state for filtering and sorting
  const [filters, setFilters] = useState<any[]>([]);
  const [sort, setSort] = useState<{ key: string; dir: "ASC" | "DESC" }>({
    key: "id",
    dir: "DESC",
  });

  // Check network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // Calculate pending operations on mount and when data changes
  useEffect(() => {
    dispatch(calculatePendingOperations());
  }, [signs, supports, dispatch]);

  // Apply filters and sorting
  const filteredSigns = React.useMemo(() => {
    let result = [...fullList];

    // Apply filters
    filters.forEach((filter) => {
      result = result.filter((sign) => {
        const value = sign[filter.key as keyof Sign];
        return value === filter.value;
      });
    });

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sort.key as keyof Sign];
      const bValue = b[sort.key as keyof Sign];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sort.dir === "ASC"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sort.dir === "ASC"
        ? (aValue as any) - (bValue as any)
        : (bValue as any) - (aValue as any);
    });

    return result;
  }, [fullList, filters, sort]);

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

  const handleItemPress = (item: Sign | Support) => {
    router.push(
      `${(isSupport(item) ? ROUTES.SUPPORT_EDIT : ROUTES.SIGN_EDIT).replace("[id]", item.id)}` as any,
    );
  };

  const handleSync = async () => {
    // Check if online
    if (!isOnline) {
      Toast.error("No internet connection. Please connect to sync.");
      return;
    }

    const totalPending =
      pendingOperations.creates +
      pendingOperations.updates +
      pendingOperations.deletes +
      pendingOperations.images;

    if (totalPending === 0) {
      Toast.info("No changes to sync");
      return;
    }

    try {
      const result = await dispatch(startSync()).unwrap();
      if (result.synced) {
        Toast.success(`Successfully synced ${result.syncedCount} items`);
        // Recalculate pending operations
        dispatch(calculatePendingOperations());
      } else {
        Toast.info(result.message || "Nothing to sync");
      }
    } catch (error: any) {
      Toast.error(error || "Sync failed. Please try again.");
    }
  };

  const totalPending =
    pendingOperations.creates +
    pendingOperations.updates +
    pendingOperations.deletes +
    pendingOperations.images;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title={t("signs.title")}
        leftIcons={[
          <TouchableOpacity key="home" onPress={() => router.push(ROUTES.HOME)}>
            <House size={24} color={theme.secondary} />
          </TouchableOpacity>,
        ]}
        rightIcons={[
          <TouchableOpacity key="search">
            <MagnifyingGlass size={24} color={theme.secondary} />
          </TouchableOpacity>,
          <TouchableOpacity
            key="sync"
            onPress={handleSync}
            disabled={isSyncing || totalPending === 0 || !isOnline}
          >
            <View style={styles.syncButton}>
              {isSyncing ? (
                <ActivityIndicator size="small" color={colors.lightGreen} />
              ) : (
                <>
                  <Repeat
                    size={24}
                    color={
                      !isOnline || totalPending === 0
                        ? colors.placeholder
                        : theme.secondary
                    }
                    weight="regular"
                  />
                  {totalPending > 0 && (
                    <View style={styles.badge}>
                      <TextView style={styles.badgeText}>
                        {totalPending}
                      </TextView>
                    </View>
                  )}
                </>
              )}
            </View>
          </TouchableOpacity>,
        ]}
      />
      {/* Network Status Indicator */}
      {!isOnline && (
        <View style={styles.offlineBar}>
          <TextView style={styles.offlineText}>
            Working Offline - Changes will sync when online
          </TextView>
        </View>
      )}
      {/* Sync Progress */}
      {isSyncing && (
        <View style={styles.syncProgressBar}>
          <View
            style={[styles.syncProgressFill, { width: `${syncProgress}%` }]}
          />
          <TextView style={styles.syncProgressText}>
            Syncing... {Math.round(syncProgress)}%
          </TextView>
        </View>
      )}
      <Tabs setTab={setTab} tab={tab} tabs={TABS} />
      <View style={styles.listHeader}>
        <View style={styles.listHeaderLeft}>
          <TextView style={styles.itemsLengthText}>
            {filteredSigns.length} {t("items")}
          </TextView>
          <SyncStatusSummary
            pendingCreates={pendingOperations.creates}
            pendingUpdates={pendingOperations.updates}
            pendingImages={pendingOperations.images}
          />
        </View>
        <View style={styles.listActions}>
          <TouchableOpacity onPress={handleSortPress}>
            <TextView style={styles.listActionText}>{t("sort")}</TextView>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleFilterPress}>
            <TextView style={styles.listActionText}>{t("filter")}</TextView>
          </TouchableOpacity>
        </View>
      </View>
      <SignSupportList
        list={filteredSigns}
        onItemPress={handleItemPress}
        loading={isLoading}
      />
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
    syncButton: {
      position: "relative",
    },
    badge: {
      position: "absolute",
      top: -8,
      right: -8,
      backgroundColor: colors.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    badgeText: {
      color: colors.white,
      fontSize: 12,
      fontWeight: "bold",
    },
    offlineBar: {
      backgroundColor: colors.warning,
      paddingVertical: 8,
      paddingHorizontal: 16,
      alignItems: "center",
    },
    offlineText: {
      color: colors.white,
      fontSize: 14,
      fontWeight: "600",
    },
    syncProgressBar: {
      height: 4,
      backgroundColor: theme.border,
      position: "relative",
    },
    syncProgressFill: {
      height: "100%",
      backgroundColor: colors.lightGreen,
    },
    syncProgressText: {
      position: "absolute",
      right: 16,
      top: 8,
      fontSize: 12,
      color: theme.secondary,
    },
    // listHeader: {
    //   flexDirection: "row",
    //   justifyContent: "space-between",
    //   padding: 12,
    //   borderBottomWidth: 2,
    //   borderColor: theme.primary,
    // },
    itemsLengthText: {
      fontSize: 16,
      color: theme.secondary,
    },
    pendingText: {
      color: colors.warning,
      fontWeight: "600",
    },
    listActions: {
      flexDirection: "row",
      gap: 20,
    },
    listActionText: {
      fontSize: 15,
      fontWeight: 400,
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
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    listHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 12,
      borderBottomWidth: 2,
      borderColor: theme.primary,
    },
    listHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
  });
