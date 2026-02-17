import FilterForm from "@/src/components/layouts/FilterForm";
import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
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
  CarBattery,
} from "phosphor-react-native";
import { colors } from "@/src/styles/theme/colors";
import Tabs from "@/src/components/layouts/Tabs";
import { ActiveFilter, Sort, TabsType } from "@/src/types/layouts";
import { useTranslation } from "react-i18next";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { useAppSelector, useAppDispatch } from "@/src/store/hooks";
import { ROUTES } from "@/src/constants/navigation";
import { Collision } from "@/src/types/models";
import { Toast } from "toastify-react-native";
import { useTheme } from "@/src/contexts/ThemeContext";
import SyncStatusSummary from "@/src/components/ui/SyncStatusSummary";
import SortForm from "@/src/components/layouts/SortForm";
import CustomMapView, {
  MapPinData,
  MapLegendItem,
} from "@/src/components/layouts/MapView";
import { SYNC_STATUS } from "@/src/constants/global";
import CollisionCard from "./components/CollisionCard";
import {
  useCollisionOperations,
  useCollisionList,
} from "../../hooks/useCollisionOperations";

// ─── Collision List Screen ─────────────────────────────────────────

export default function CollisionListScreen() {
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

  const [sort, setSort] = useState<Sort>({
    key: "submissionDT",
    dir: "DESC",
  });

  // Hooks
  const {
    collisions,
    divisions,
    isLoading,
    isSyncing,
    unsyncedCount,
    getDivisionName,
  } = useCollisionList();
  const { syncCollisions } = useCollisionOperations();

  // Filter fields configuration
  const filterFields = useMemo(
    () => [
      {
        key: "divisionId",
        label: t("division"),
        operator: "EQUAL",
        options: divisions.map((d) => ({ label: d.name, value: d.id })),
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
    [divisions, t],
  );

  // Filter and sort collisions
  const filteredCollisions = useMemo(() => {
    let result = [...collisions];

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (collision) =>
          collision.id.toLowerCase().includes(query) ||
          getDivisionName(collision.divisionId).toLowerCase().includes(query) ||
          collision.general?.collisionNumber?.toLowerCase().includes(query),
      );
    }

    // Apply filters
    activeFilters.forEach((filter) => {
      if (filter.key === "divisionId") {
        result = result.filter((c) => c.divisionId === filter.value);
      }
      if (filter.key === "isSynced") {
        const syncValue = filter.value === "true";
        result = result.filter((c) => c.isSynced === syncValue);
      }
    });

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort.key) {
        case "submissionDT":
          aValue = new Date(a.submissionDT).getTime();
          bValue = new Date(b.submissionDT).getTime();
          break;
        case "divisionId":
          aValue = getDivisionName(a.divisionId);
          bValue = getDivisionName(b.divisionId);
          break;
        default:
          aValue = a[sort.key as keyof Collision];
          bValue = b[sort.key as keyof Collision];
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sort.dir === "ASC"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sort.dir === "ASC" ? aValue - bValue : bValue - aValue;
    });

    return result;
  }, [collisions, activeFilters, searchQuery, sort, getDivisionName]);

  // Map pins
  const mapPins: MapPinData[] = useMemo(() => {
    return filteredCollisions
      .filter(
        (collision) =>
          collision.mapLocation?.latitude &&
          collision.mapLocation?.longitude &&
          collision.mapLocation.latitude !== 0 &&
          collision.mapLocation.longitude !== 0,
      )
      .map((collision) => {
        const pinColor = collision.isSynced ? colors.primary : colors.warning;

        return {
          id: collision.id,
          coordinate: {
            latitude: collision.mapLocation.latitude,
            longitude: collision.mapLocation.longitude,
          },
          title: collision.general?.collisionNumber || collision.id,
          description: getDivisionName(collision.divisionId),
          color: pinColor,
          icon: <CarBattery size={20} color={colors.white} weight="fill" />,
          onPress: () => handleItemPress(collision),
        };
      });
  }, [filteredCollisions, getDivisionName]);

  // Map legend
  const mapLegend: MapLegendItem[] = useMemo(
    () => [
      {
        label: t("collision.synced"),
        color: colors.primary,
        icon: <CarBattery size={12} color={colors.white} weight="fill" />,
      },
      {
        label: t("unsynced"),
        color: colors.warning,
      },
    ],
    [t],
  );

  // Pending operations for badge
  const pendingOperations = useMemo(
    () => ({
      creates: collisions.filter((c) => c.isNew && !c.isSynced).length,
      updates: collisions.filter((c) => !c.isNew && !c.isSynced).length,
      deletes: 0,
      images: collisions.reduce(
        (count, c) =>
          count + c.images.filter((img) => img.isNew && !img.isSynced).length,
        0,
      ),
    }),
    [collisions],
  );

  // Handlers
  const handleSync = useCallback(async () => {
    if (unsyncedCount === 0) {
      Toast.info("No changes to sync");
      return;
    }

    try {
      const result = await syncCollisions();
      if (result.success) {
        Toast.success(`Successfully synced ${result.syncedCount} items`);
      } else {
        Toast.error(result.error || "Sync failed");
      }
    } catch (error: any) {
      Toast.error(error?.message || "Sync failed. Please try again.");
    }
  }, [syncCollisions, unsyncedCount]);

  const handleItemPress = useCallback((collision: Collision) => {
    router.push(
      `${ROUTES.COLLISION_MANAGE.replace("[id]", collision.id)}` as any,
    );
  }, []);

  const handleSortPress = () => {
    openDrawer(
      "sort-collision",
      <SortForm
        sort={sort}
        setSort={setSort}
        params={{
          submissionDT: t("date"),
          divisionId: t("division"),
        }}
      />,
      { drawerHeight: "auto" },
    );
  };

  const handleApplyFilters = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
  }, []);

  const handleFilterPress = () => {
    openDrawer(
      "filter-collision",
      <FilterForm
        fields={filterFields}
        activeFilters={activeFilters}
        onApply={handleApplyFilters}
        onCancel={closeDrawer}
      />,
      { drawerHeight: "auto" },
    );
  };

  const handleCreateCollision = () => {
    router.push(ROUTES.COLLISION_MANAGE);
  };

  // Render collision card
  const renderCollisionItem = useCallback(
    ({ item }: { item: Collision }) => (
      <CollisionCard
        collision={item}
        divisionName={getDivisionName(item.divisionId)}
        onPress={() => handleItemPress(item)}
      />
    ),
    [getDivisionName, handleItemPress],
  );

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <CarBattery size={64} color={theme.secondary} weight="thin" />
      <TextView variant="body" style={styles.emptyText}>
        {t("collision.noCollisions")}
      </TextView>
      <TextView variant="bodySmall" style={styles.emptySubtext}>
        {t("collision.createFirstCollision")}
      </TextView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title={t("collision.title")}
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
            disabled={isSyncing || unsyncedCount === 0}
          >
            <View style={styles.syncButton}>
              {isSyncing ? (
                <ActivityIndicator size="small" color={colors.lightGreen} />
              ) : (
                <>
                  <Repeat
                    size={24}
                    color={
                      unsyncedCount === 0 ? colors.placeholder : theme.secondary
                    }
                    weight="regular"
                  />
                  {unsyncedCount > 0 && (
                    <View style={styles.badge}>
                      <TextView style={styles.badgeText}>
                        {unsyncedCount}
                      </TextView>
                    </View>
                  )}
                </>
              )}
            </View>
          </TouchableOpacity>,
        ]}
      />

      <Tabs setTab={setTab} tab={tab} tabs={TABS} />

      {tab === "LIST" ? (
        <>
          <View style={styles.listHeader}>
            <View style={styles.listHeaderLeft}>
              <TextView style={styles.itemsLengthText}>
                {filteredCollisions.length} {t("items")}
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

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.lightGreen} />
            </View>
          ) : (
            <FlatList
              data={filteredCollisions}
              renderItem={renderCollisionItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyState}
            />
          )}

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateCollision}
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

// ─── Styles ────────────────────────────────────────────────────────

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
    itemsLengthText: {
      fontSize: 16,
      color: theme.secondary,
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
    listContent: {
      paddingBottom: 100,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
      marginTop: 100,
    },
    emptyText: {
      color: theme.secondary,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    emptySubtext: {
      color: theme.secondary,
      textAlign: "center",
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
  });
