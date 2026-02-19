import FilterForm from "@/src/components/layouts/FilterForm";
import React, { useState, useCallback, useMemo } from "react";
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
import TextView from "@/src/components/ui/TextView";
import { spacing } from "@/src/styles/theme/spacing";
import { router } from "expo-router";
import {
  House,
  MagnifyingGlass,
  Repeat,
  Plus,
  Warning,
  Wrench,
  ArrowsClockwise,
} from "phosphor-react-native";
import { colors } from "@/src/styles/theme/colors";
import Tabs from "@/src/components/layouts/Tabs";
import { ActiveFilter, TabsType } from "@/src/types/layouts";
import { useTranslation } from "react-i18next";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { useAppSelector, useAppDispatch } from "@/src/store/hooks";
import { ROUTES } from "@/src/constants/navigation";
import { Sign, Support } from "@/src/types/models";
import { Toast } from "toastify-react-native";
import { useTheme } from "@/src/contexts/ThemeContext";
import SyncStatusSummary from "@/src/components/ui/SyncStatusSummary";
import SortForm from "@/src/components/layouts/SortForm";
import CustomMapView, {
  MapPinData,
  MapLegendItem,
} from "@/src/components/layouts/MapView";
import { syncSignSupportData } from "@/src/store/thunks";
import NewSignType from "../components/NewSignType";
import SignSupportList from "../components/SignList";
import ButtonView from "@/src/components/ui/ButtonView";

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
  const { openDrawer, closeDrawer } = useDrawer();
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [sort, setSort] = useState<{ key: string; dir: "ASC" | "DESC" }>({
    key: "id",
    dir: "DESC",
  });

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

  // Filter fields configuration
  const filterFields = useMemo(
    () => [
      {
        key: "type",
        label: t("type"),
        operator: "EQUAL",
        options: [
          { label: t("sign"), value: "sign" },
          { label: t("support"), value: "support" },
        ],
      },
      {
        key: "isSynced",
        label: t("syncStatus"),
        operator: "EQUAL",
        options: [
          { label: t("synced"), value: "true" },
          { label: t("unsynced"), value: "false" },
        ],
      },
    ],
    [t],
  );

  // Transform and filter data
  const listItems: ListItem[] = useMemo(() => {
    const items: ListItem[] = [];

    // Get type filter if exists
    const typeFilter = activeFilters.find((f) => f.key === "type");
    const shouldShowSigns = !typeFilter || typeFilter.value === "sign";
    const shouldShowSupports = !typeFilter || typeFilter.value === "support";

    // Add signs
    if (shouldShowSigns) {
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
    if (shouldShowSupports) {
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
    activeFilters,
    searchQuery,
    t,
  ]);

  // Apply additional filters and sorting
  const filteredSigns = useMemo(() => {
    let result = [...listItems];

    // Apply filters from activeFilters
    activeFilters.forEach((filter) => {
      if (filter.key === "type") {
        // Type filter is already handled in listItems
        return;
      }

      if (filter.key === "isSynced") {
        const syncValue = filter.value === "true";
        result = result.filter((item) => item.isSynced === syncValue);
        return;
      }

      // Handle other dynamic filters on the data object
      result = result.filter((item) => {
        const value = item.data[filter.key as keyof (Sign | Support)];
        return String(value) === filter.value;
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
  }, [listItems, activeFilters, sort]);

  // Transform filtered items to map pins for CustomMapView
  const mapPins: MapPinData[] = useMemo(() => {
    return filteredSigns
      .filter(
        (item) =>
          item.latitude &&
          item.longitude &&
          item.latitude !== 0 &&
          item.longitude !== 0,
      )
      .map((item) => {
        // Determine pin color based on sync status and type
        let pinColor: string;
        if (!item.isSynced) {
          pinColor = colors.warning;
        } else {
          pinColor = item.type === "sign" ? colors.primary : colors.success;
        }

        return {
          id: item.id,
          coordinate: {
            latitude: item.latitude!,
            longitude: item.longitude!,
          },
          title: item.title,
          description: item.subtitle,
          color: pinColor,
          icon:
            item.type === "sign" ? (
              <Warning size={20} color={colors.white} weight="fill" />
            ) : (
              <Wrench size={20} color={colors.white} weight="fill" />
            ),
          onPress: () => handleItemPress(item),
        };
      });
  }, [filteredSigns]);

  // Legend items for the map
  const mapLegend: MapLegendItem[] = useMemo(() => {
    const legendItems: MapLegendItem[] = [];
    const typeFilter = activeFilters.find((f) => f.key === "type");

    if (!typeFilter || typeFilter.value === "sign") {
      legendItems.push({
        label: t("signs.signs"),
        color: colors.primary,
        icon: <Warning size={12} color={colors.white} weight="fill" />,
      });
    }

    if (!typeFilter || typeFilter.value === "support") {
      legendItems.push({
        label: t("supports"),
        color: colors.success,
        icon: <Wrench size={12} color={colors.white} weight="fill" />,
      });
    }

    legendItems.push({
      label: t("unsynced"),
      color: colors.warning,
    });

    return legendItems;
  }, [activeFilters, t]);

  // Count stats
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

  // Pending operations for badge
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

  const handleSync = useCallback(async () => {
    if (totalPending === 0) {
      Toast.info("No changes to sync");
      return;
    }

    try {
      await dispatch(syncSignSupportData()).unwrap();
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

  const handleSortPress = () => {
    openDrawer(
      "sort-sign",
      <SortForm
        sort={sort}
        setSort={setSort}
        params={{ status: t("status") }}
      />,
      {
        drawerHeight: "auto",
      },
    );
  };

  const handleApplyFilters = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
  }, []);

  const handleFilterPress = () => {
    openDrawer(
      "filter-sign",
      <FilterForm
        fields={filterFields}
        activeFilters={activeFilters}
        onApply={handleApplyFilters}
        onCancel={closeDrawer}
      />,
      { drawerHeight: "auto" },
    );
  };

  const handleCreateSign = () => {
    openDrawer("new-sign-type", <NewSignType />, { drawerHeight: "auto" });
  };

  // Adapter for SignSupportList
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
          <ButtonView
            key="sync"
            onPress={handleSync}
            disabled={isSyncing || totalPending === 0}
            loading={isSyncing}
            style={styles.syncButton}
          >
            <ArrowsClockwise
              size={24}
              color={totalPending > 0 ? colors.lightGreen : theme.secondary}
              weight={isSyncing ? "bold" : "regular"}
            />
            {totalPending > 0 && (
              <View style={styles.badge}>
                <TextView style={styles.badgeText}>
                  {totalPending > 99 ? "99+" : totalPending}
                </TextView>
              </View>
            )}
          </ButtonView>,
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

      {tab === "LIST" ? (
        <>
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
                <TextView
                  style={[
                    styles.listActionText,
                    activeFilters.length > 0 && styles.activeFilterText,
                  ]}
                >
                  {t("filter")}
                  {activeFilters.length > 0 && ` (${activeFilters.length})`}
                </TextView>
              </TouchableOpacity>
            </View>
          </View>
          <SignSupportList
            list={listData}
            onItemPress={handleListItemPress}
            loading={isLoading}
          />
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateSign}
          >
            <Plus size={60} color={colors.white} weight="bold" />
          </TouchableOpacity>
        </>
      ) : (
        <CustomMapView
          pins={mapPins}
          legend={mapLegend}
          mode="view"
          showUserLocation={true}
          controls={{
            showSearch: true,
            showZoomControls: true,
            showCompass: true,
            showStyleToggle: true,
            showMyLocation: true,
            showLegend: true,
          }}
        />
      )}
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
      backgroundColor: theme.background,
      paddingHorizontal: 0,
      paddingVertical: 0,
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
    activeFilterText: {
      fontWeight: "600",
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
