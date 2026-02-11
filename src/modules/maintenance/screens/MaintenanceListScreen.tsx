import React, { useState, useMemo } from "react";
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
import { House, MagnifyingGlass, Repeat } from "phosphor-react-native";
import { colors } from "@/src/styles/theme/colors";
import { useTranslation } from "react-i18next";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { useAppSelector, useAppDispatch } from "@/src/store/hooks";
import { fetchJobs } from "@/src/store/slices/maintenanceSlice";
import { ROUTES } from "@/src/constants/navigation";
import { Toast } from "toastify-react-native";
import { useTheme } from "@/src/contexts/ThemeContext";
import { MaintenanceJob } from "@/src/types/models";
import JobDetailForm from "../components/JobDetailForm";
import TaskMapView from "../components/TaskMapView";
import FilterMaintenanceForm from "../components/FilterMaintenanceForm";
import Tabs from "@/src/components/layouts/Tabs";
import { Sort, TabsType } from "@/src/types/layouts";
import { startSync } from "@/src/store/slices/syncSlice";
import MaintenanceCard from "../components/MaintenanceCard";
import SortForm from "@/src/components/layouts/SortForm";

export default function MaintenanceListScreen() {
  const { t } = useTranslation();

  const TABS: TabsType = {
    LIST: { id: "LIST", value: t("list") },
    MAP: { id: "MAP", value: t("map") },
  } as const;

  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { openDrawer } = useDrawer();

  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState(Object.values(TABS)[0].id);
  const isSyncing = useAppSelector((state) => state.sync.isSyncing);
  const pendingOperations = useAppSelector(
    (state) => state.sync.pendingOperations,
  );

  const [filterByStatus, setFilterByStatus] = useState<string[]>([]);
  const [filterByType, setFilterByType] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>({ key: "duration", dir: "ASC" });
  const jobs = useAppSelector((state) => state.maintenance.jobs);
  const jobStatuses = useAppSelector((state) => state.maintenance.jobStatuses);
  const jobTypes = useAppSelector((state) => state.maintenance.jobTypes);
  const supports = useAppSelector((state) => state.supports.supports);
  const isLoading = useAppSelector((state) => state.maintenance.isLoading);
  // useEffect(() => {
  //   handleRefresh();
  // }, []);

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    if (filterByStatus.length > 0) {
      result = result.filter((job) => filterByStatus.includes(job.statusName));
    }

    if (filterByType.length > 0) {
      result = result.filter((job) => filterByType.includes(job.typeName));
    }

    result.sort((a, b) =>
      sort.dir == "DESC"
        ? b[sort.key] - a[sort.key]
        : a[sort.key] - b[sort.key],
    );

    return result;
  }, [jobs, filterByStatus, filterByType, sort]);

  const handleSync = async () => {
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
      } else {
        Toast.info(result.message || "Nothing to sync");
      }
    } catch (error) {
      Toast.error("Sync failed. Please try again.");
    }
  };

  const totalPending =
    pendingOperations.creates +
    pendingOperations.updates +
    pendingOperations.deletes +
    pendingOperations.images;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchJobs()).unwrap();
      Toast.success("Jobs refreshed");
    } catch (error) {
      Toast.error("Failed to fetch jobs");
    } finally {
      setRefreshing(false);
    }
  };

  const handleJobPress = (job: MaintenanceJob) => {
    openDrawer(`job-detail-${job.id}`, <JobDetailForm job={job} />, {
      drawerHeight: "auto",
    });
  };

  const handleFilterPress = () => {
    openDrawer(
      "filter-jobs",
      <FilterMaintenanceForm
        filterByStatus={filterByStatus}
        setFilterByStatus={setFilterByStatus}
        filterByType={filterByType}
        setFilterByType={setFilterByType}
        jobStatuses={jobStatuses}
        jobTypes={jobTypes}
      />,
      { drawerHeight: "auto" },
    );
  };

  const handleSortPress = () => {
    openDrawer(
      "sort-jobs",
      <SortForm
        sort={sort}
        setSort={setSort}
        params={{ id: "ID", duration: "Duration" }}
      />,
      {
        drawerHeight: "auto",
      },
    );
  };

  const unsyncedCount = jobs.filter((j) => !j.isSynced).length;

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

  const renderEmptyList = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.lightGreen} />
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
            disabled={isSyncing || totalPending === 0}
          >
            <View style={styles.syncButton}>
              <Repeat
                size={24}
                color={theme.secondary}
                weight={isSyncing ? "bold" : "regular"}
              />
            </View>
          </TouchableOpacity>,
        ]}
      />
      <Tabs setTab={setTab} tab={tab} tabs={TABS} />
      {tab === TABS.LIST.id && (
        <>
          <View style={styles.listHeader}>
            <TextView style={styles.itemsLengthText}>
              {filteredJobs.length} {t("items")}
            </TextView>
            <View style={styles.listActions}>
              <TouchableOpacity onPress={handleSortPress}>
                <TextView style={styles.listActionText}>{t("sort")}</TextView>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFilterPress}>
                <TextView style={styles.listActionText}>{t("filter")}</TextView>
              </TouchableOpacity>
            </View>
          </View>
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
      fontSize: 12,
      fontWeight: "bold",
    },
    topBar: {
      flexDirection: "row",
      backgroundColor: colors.white,
      paddingVertical: spacing.sm,
      borderBottomWidth: 2,
      borderBottomColor: theme.border,
    },
    topBarButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRightWidth: 1,
      borderRightColor: theme.border,
    },
    topBarText: {
      fontSize: 15,
      color: theme.text,
      marginLeft: spacing.sm,
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
    listActions: {
      flexDirection: "row",
      gap: 20,
    },
    listActionText: {
      fontSize: 15,
      fontWeight: 400,
      color: colors.lightBlue,
    },
    jobItem: {
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 2,
      borderBottomColor: theme.border,
      paddingVertical: spacing.sm,
    },
    jobIndex: {
      width: "10%",
      alignItems: "center",
    },
    jobContent: {
      width: "90%",
      paddingHorizontal: spacing.sm,
    },
    emptyList: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
    },
    emptyText: {
      color: theme.secondary,
      textAlign: "center",
    },
  });
