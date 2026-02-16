import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { Header } from "@/src/components/layouts/Header";
import TextView from "@/src/components/ui/TextView";
import { spacing } from "@/src/styles/theme/spacing";
import { router } from "expo-router";
import { House, MagnifyingGlass, ArrowsClockwise } from "phosphor-react-native";
import { colors } from "@/src/styles/theme/colors";
import { useTranslation } from "react-i18next";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { useAppSelector } from "@/src/store/hooks";
import { ROUTES } from "@/src/constants/navigation";
import { Toast } from "toastify-react-native";
import { useTheme } from "@/src/contexts/ThemeContext";
import { MaintenanceJob } from "@/src/types/models";
import JobDetailForm from "../components/JobDetailForm";
import TaskMapView from "../components/TaskMapView";
import FilterForm from "@/src/components/layouts/FilterForm";
import Tabs from "@/src/components/layouts/Tabs";
import { ActiveFilter, FilterField, Sort, TabsType } from '@/src/types/layouts';
import MaintenanceCard from "../components/MaintenanceCard";
import SortForm from "@/src/components/layouts/SortForm";
import { useMaintenanceOperations } from "../hooks/useMaintenanceOperations";

export default function MaintenanceListScreen() {
  const { t } = useTranslation();

  const TABS: TabsType = {
    LIST: { id: "LIST", value: t("list") },
    MAP: { id: "MAP", value: t("map") },
  } as const;

  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const { openDrawer, closeDrawer } = useDrawer();

  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState(Object.values(TABS)[0].id);

  // Use maintenance operations hook
  const {
    jobs,
    jobStatuses,
    jobTypes,
    isLoading,
    isSyncing,
    syncData,
    hasPendingChanges,
    getUnsyncedJobsCount,
    getUnsyncedImagesCount,
  } = useMaintenanceOperations();

  // Get supports from store
  const supports = useAppSelector((state) => state.supports.supports);

  // Filter and sort state
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sort, setSort] = useState<Sort>({ key: "assignDate", dir: "DESC" });

  // Calculate pending count
  const pendingCount = getUnsyncedJobsCount() + getUnsyncedImagesCount();

  // Build filter fields from jobStatuses and jobTypes
  const filterFields: FilterField[] = useMemo(() => {
    const fields: FilterField[] = [];

    if (jobStatuses.length > 0) {
      fields.push({
        key: "statusName",
        label: t("status"),
        operator: "EQUAL",
        options: jobStatuses.map((status) => ({
          label: status.name,
          value: status.name,
        })),
      });
    }

    if (jobTypes.length > 0) {
      fields.push({
        key: "typeName",
        label: t("type"),
        operator: "EQUAL",
        options: jobTypes.map((type) => ({
          label: type.name,
          value: type.name,
        })),
      });
    }

    return fields;
  }, [jobStatuses, jobTypes, t]);

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // Apply filters from activeFilters
    activeFilters.forEach((filter) => {
      result = result.filter((job) => {
        const value = job[filter.key as keyof MaintenanceJob];
        return String(value) === filter.value;
      });
    });

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sort.key as keyof MaintenanceJob];
      const bValue = b[sort.key as keyof MaintenanceJob];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sort.dir === "DESC"
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sort.dir === "DESC" ? bValue - aValue : aValue - bValue;
      }

      return 0;
    });

    return result;
  }, [jobs, activeFilters, sort]);

  // Handle sync
  const handleSync = async () => {
    if (!hasPendingChanges()) {
      Toast.info("No changes to sync");
      return;
    }

    try {
      const result = await syncData();
      if (result.success) {
        Toast.success(`Successfully synced ${result.syncedCount} items`);
      } else {
        Toast.error(result.error || "Sync failed");
      }
    } catch (error) {
      Toast.error("Sync failed. Please try again.");
    }
  };

  // Handle refresh (just shows toast - data is fetched on app start)
  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Toast.info("Data is refreshed on app start");
    }, 500);
  };

  // Handle job press
  const handleJobPress = (job: MaintenanceJob) => {
    openDrawer(`job-detail-${job.id}`, <JobDetailForm job={job} />, {
      drawerHeight: "auto",
    });
  };

  // Handle apply filters
  const handleApplyFilters = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
  }, []);

  // Handle filter press
  const handleFilterPress = () => {
    openDrawer(
      "filter-jobs",
      <FilterForm
        fields={filterFields}
        activeFilters={activeFilters}
        onApply={handleApplyFilters}
        onCancel={closeDrawer}
      />,
      { drawerHeight: "auto" },
    );
  };

  // Handle sort press
  const handleSortPress = () => {
    openDrawer(
      "sort-jobs",
      <SortForm
        sort={sort}
        setSort={setSort}
        params={{
          assignDate: "Assign Date",
          duration: "Duration",
          name: "Name",
        }}
      />,
      { drawerHeight: "auto" },
    );
  };

  // Render job item
  const renderJobItem = ({
                           item,
                           index,
                         }: {
    item: MaintenanceJob;
    index: number;
  }) => (
    <MaintenanceCard
      item={item}
      key={item.id}
      index={index}
      onPress={() => handleJobPress(item)}
    />
  );

  // Render empty list
  const renderEmptyList = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.lightGreen} />
          <TextView style={styles.emptyText}>Loading jobs...</TextView>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <TextView variant="h3" style={styles.emptyText}>
          {filteredJobs.length === 0 && jobs.length > 0
            ? "No matches found!"
            : "There are no jobs yet!"}
        </TextView>
        <TextView style={styles.emptySubtext}>
          {jobs.length === 0
            ? "Jobs will appear here when assigned to you"
            : "Try adjusting your filters"}
        </TextView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title={t("maintenance.title")}
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
            disabled={isSyncing || pendingCount === 0}
            style={styles.syncButton}
          >
            <ArrowsClockwise
              size={24}
              color={pendingCount > 0 ? colors.lightGreen : theme.secondary}
              weight={isSyncing ? "bold" : "regular"}
            />
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <TextView style={styles.badgeText}>
                  {pendingCount > 99 ? "99+" : pendingCount}
                </TextView>
              </View>
            )}
          </TouchableOpacity>,
        ]}
      />

      {/* Tabs */}
      <Tabs setTab={setTab} tab={tab} tabs={TABS} />

      {/* List View */}
      {tab === TABS.LIST.id && (
        <>
          {/* List Header */}
          <View style={styles.listHeader}>
            <TextView style={styles.itemsLengthText}>
              {filteredJobs.length} {t("items")}
              {pendingCount > 0 && (
                <TextView style={styles.pendingText}>
                  {" "}
                  ({pendingCount} pending)
                </TextView>
              )}
            </TextView>
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

          {/* Jobs List */}
          <FlatList
            data={filteredJobs}
            renderItem={renderJobItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={renderEmptyList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.lightGreen}
              />
            }
            contentContainerStyle={
              filteredJobs.length === 0 ? styles.emptyList : undefined
            }
          />
        </>
      )}

      {/* Map View */}
      {tab === TABS.MAP.id && (
        <TaskMapView jobs={filteredJobs} supports={supports} />
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
      fontSize: 10,
      fontWeight: "bold",
    },
    listHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 12,
      borderBottomWidth: 2,
      borderColor: theme.primary,
    },
    itemsLengthText: {
      fontSize: 16,
      color: theme.secondary,
    },
    pendingText: {
      fontSize: 14,
      color: colors.warning,
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
    emptyList: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
      gap: spacing.sm,
    },
    emptyText: {
      color: theme.secondary,
      textAlign: "center",
    },
    emptySubtext: {
      color: theme.secondary,
      textAlign: "center",
      fontSize: 14,
    },
  });