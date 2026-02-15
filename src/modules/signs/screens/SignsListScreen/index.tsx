import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { Header } from "@/src/components/layouts/Header";
import TextView from "@/src/components/ui/TextView";
import { spacing } from "@/src/styles/theme/spacing";
import { router } from "expo-router";
import { House, MagnifyingGlass, Repeat, Plus } from "phosphor-react-native";
import { colors } from "@/src/styles/theme/colors";
import Tabs from "@/src/components/layouts/Tabs";
import { TabsType } from "@/src/types/layouts";
import { useTranslation } from "react-i18next";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { useAppSelector, useAppDispatch } from "@/src/store/hooks";
import { ROUTES } from "@/src/constants/navigation";
import { Sign, Support } from "@/src/types/models";
import { Toast } from "toastify-react-native";
import { useTheme } from "@/src/contexts/ThemeContext";
import SyncStatusSummary from "@/src/components/ui/SyncStatusSummary";
import SortForm from "@/src/components/layouts/SortForm";
import SignSupportMapView from "../../components/SignSupportMapView";
import { syncSignSupportData, fetchSignSupportData } from "@/src/store/thunks";
import { Ionicons } from "@expo/vector-icons";
import FilterSignForm from "./components/FilterSignForm";
import NewSignType from "./components/NewSignType";
import SignSupportList from "./components/SignList";

type FilterType = "all" | "signs" | "supports";

interface ListItem {
  id: string;
  type: "sign" | "support";
  title: string;
  subtitle: string;
  imageUrl?: string;
  isSynced: boolean;
  latitude?: number;
  longitude?: number;
  data: Sign | Support;
}

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

  // State from SignsListScreen2
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Local state for filtering and sorting (from Screen1)
  const [filters, setFilters] = useState<any[]>([]);
  const [sort, setSort] = useState<{ key: string; dir: "ASC" | "DESC" }>({
    key: "id",
    dir: "DESC",
  });

  // Get data from Redux store (from Screen2)
  const signs = useAppSelector((state) => state.signs.signs);
  const supports = useAppSelector((state) => state.supports.supports);
  const signCodes = useAppSelector((state) => state.signs.codes);
  const supportCodes = useAppSelector((state) => state.supports.codes);
  const signBackendImages = useAppSelector(
    (state) => state.signs.backendImages,
  );
  const supportBackendImages = useAppSelector(
    (state) => state.supports.backendImages,
  );
  const isLoading = useAppSelector((state) => state.signs.isLoading);
  const isSyncing = useAppSelector((state) => state.sync.isSyncing);
  const syncProgress = useAppSelector((state) => state.sync.syncProgress);

  // Transform and filter data (from Screen2)
  const listItems: ListItem[] = useMemo(() => {
    const items: ListItem[] = [];

    // Add signs
    if (filterType === "all" || filterType === "signs") {
      signs.forEach((sign) => {
        const signCode = signCodes.find((c) => c.id === sign.signCodeId);
        const imageUrl =
          sign.images?.[0]?.localPath || signBackendImages[sign.id];

        const matchesSearch =
          !searchQuery ||
          sign.signId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          signCode?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        if (matchesSearch) {
          items.push({
            id: sign.id,
            type: "sign",
            title: sign.signId || t("signs.newSign"),
            subtitle: signCode?.name || "",
            imageUrl,
            isSynced: sign.isSynced,
            latitude: sign.latitude,
            longitude: sign.longitude,
            data: sign,
          });
        }
      });
    }

    // Add supports
    if (filterType === "all" || filterType === "supports") {
      supports.forEach((support) => {
        const supportCode = supportCodes.find(
          (c) => c.id === support.supportCodeId,
        );
        const imageUrl =
          support.images?.[0]?.localPath || supportBackendImages[support.id];

        const matchesSearch =
          !searchQuery ||
          support.supportId
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          supportCode?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        if (matchesSearch) {
          items.push({
            id: support.id,
            type: "support",
            title: support.supportId || t("supports.newSupport"),
            subtitle: supportCode?.name || "",
            imageUrl,
            isSynced: support.isSynced,
            latitude: support.latitude,
            longitude: support.longitude,
            data: support,
          });
        }
      });
    }

    // Sort by type and title
    return items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "sign" ? -1 : 1;
      }
      return 1;
    });
  }, [
    signs,
    supports,
    signCodes,
    supportCodes,
    signBackendImages,
    supportBackendImages,
    filterType,
    searchQuery,
    t,
  ]);

  // Apply additional filters and sorting from Screen1
  const filteredSigns = useMemo(() => {
    let result = [...listItems];

    // Apply filters
    filters.forEach((filter) => {
      result = result.filter((item) => {
        const value = item.data[filter.key as keyof (Sign | Support)];
        return value === filter.value;
      });
    });

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a.data[sort.key as keyof (Sign | Support)];
      const bValue = b.data[sort.key as keyof (Sign | Support)];

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
  }, [listItems, filters, sort]);

  // Count stats (from Screen2)
  const stats = useMemo(() => {
    const unsyncedSigns = signs.filter((s) => !s.isSynced).length;
    const unsyncedSupports = supports.filter((s) => !s.isSynced).length;

    return {
      signs: signs.length,
      supports: supports.length,
      unsynced: unsyncedSigns + unsyncedSupports,
      total: signs.length + supports.length,
    };
  }, [signs, supports]);

  // Pending operations for badge (derived from stats)
  const pendingOperations = useMemo(
    () => ({
      creates: 0,
      updates: stats.unsynced,
      deletes: 0,
      images: 0,
    }),
    [stats.unsynced],
  );

  const totalPending = stats.unsynced;

  // Handlers from Screen2
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchSignSupportData()).unwrap();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);

  const handleSync = useCallback(async () => {
    if (totalPending === 0) {
      Toast.info("No changes to sync");
      return;
    }

    try {
      const result = await dispatch(syncSignSupportData()).unwrap();
      Toast.success(`Successfully synced items`);
    } catch (error: any) {
      Toast.error(error?.message || "Sync failed. Please try again.");
    }
  }, [dispatch, totalPending]);

  const handleItemPress = useCallback((item: ListItem) => {
    router.push(
      `${(item.type === "support" ? ROUTES.SUPPORT_EDIT : ROUTES.SIGN_EDIT).replace("[id]", item.id)}` as any,
    );
  }, []);

  // Handlers from Screen1
  const handleSortPress = () => {
    openDrawer(
      "sort-sign",
      <SortForm sort={sort} setSort={setSort} params={undefined} />,
      {
        drawerHeight: "auto",
      },
    );
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

  // Adapter to convert ListItem to Sign | Support for SignSupportList
  const listData = useMemo(() => {
    return filteredSigns.map((item) => item.data);
  }, [filteredSigns]);

  const handleListItemPress = useCallback(
    (item: Sign | Support) => {
      const listItem = filteredSigns.find((li) => li.data.id === item.id);
      if (listItem) {
        handleItemPress(listItem);
      }
    },
    [filteredSigns, handleItemPress],
  );

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
            disabled={isSyncing || totalPending === 0}
          >
            <View style={styles.syncButton}>
              {isSyncing ? (
                <ActivityIndicator size="small" color={colors.lightGreen} />
              ) : (
                <>
                  <Repeat
                    size={24}
                    color={
                      totalPending === 0 ? colors.placeholder : theme.secondary
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

      {tab === "LIST" ? (
        <SignSupportList
          list={listData}
          onItemPress={handleListItemPress}
          loading={isLoading}
          // refreshControl={
          //   <RefreshControl
          //     refreshing={isRefreshing}
          //     onRefresh={handleRefresh}
          //     colors={[colors.primary]}
          //   />
          // }
        />
      ) : (
        <SignSupportMapView
          showSigns={filterType !== "supports"}
          showSupports={filterType !== "signs"}
        />
      )}

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
      fontWeight: "400",
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
