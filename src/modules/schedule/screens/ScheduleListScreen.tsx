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
import Tabs from "@/src/components/layouts/Tabs";
import FilterForm from "@/src/components/layouts/FilterForm";
import SortForm from "@/src/components/layouts/SortForm";
import TextView from "@/src/components/ui/TextView";
import { spacing } from "@/src/styles/theme/spacing";
import { router } from "expo-router";
import { House, MagnifyingGlass, ArrowsClockwise } from "phosphor-react-native";
import { colors } from "@/src/styles/theme/colors";
import { useTranslation } from "react-i18next";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { Toast } from "toastify-react-native";
import { ROUTES } from "@/src/constants/navigation";
import { ActiveFilter, FilterField, Sort, TabsType } from "@/src/types/layouts";

import { Task, InspectionTask, TaskStatus, StudyType } from "../types";
import { TASK_STATUS, STUDY_TYPES } from "@/src/constants/schedule";
import CalendarDayDetailDrawer from "../components/CalendarDayDetailDrawer";
import InspectionTaskDetailDrawer from "../components/InspectionTaskDetailDrawer";
import ScheduleCalendarView from "../components/ScheduleCalendarView";
import ScheduleCard from "../components/ScheduleCard";
import ScheduleMapView from "../components/ScheduleMapView";
import TaskDetailDrawer from "../components/TaskDetailDrawer";
import { useScheduleOperations } from "../hooks/useScheduleOperations";

export default function ScheduleListScreen() {
  const { t } = useTranslation();

  const TABS: TabsType = {
    LIST: { id: "LIST", value: t("list") },
    MAP: { id: "MAP", value: t("map") },
    CALENDAR: { id: "CALENDAR", value: t("calendar") },
  } as const;

  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const { openDrawer, closeDrawer } = useDrawer();

  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState(Object.values(TABS)[0].id);

  // Use schedule operations hook
  const {
    tasks,
    isLoading,
    isSyncing,
    syncTasks,
    getUnsyncedCount,
    getFilteredTasks,
    updateTask,
    updateInspectionTask,
    claimTask,
  } = useScheduleOperations();

  // Filter and sort state
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sort, setSort] = useState<Sort>({ key: "startDate", dir: "DESC" });

  // Build filter fields
  const filterFields: FilterField[] = useMemo(() => {
    return [
      {
        key: "status",
        label: "Status",
        operator: "EQUAL",
        options: Object.entries(TASK_STATUS).map(([key, value]) => ({
          label: value.label,
          value: key,
        })),
      },
      {
        key: "studyType",
        label: "Study Type",
        operator: "EQUAL",
        options: STUDY_TYPES.map((type) => ({
          label: type,
          value: type,
        })),
      },
      {
        key: "syncStatus",
        label: "Sync Status",
        operator: "EQUAL",
        options: [
          { label: "Synced", value: "SYNCED" },
          { label: "Not Synced", value: "NOT_SYNCED" },
        ],
      },
    ];
  }, []);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Apply filters from activeFilters
    activeFilters.forEach((filter) => {
      result = result.filter((task) => {
        const value = task[filter.key as keyof Task];
        return String(value) === filter.value;
      });
    });

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sort.key as keyof Task];
      const bValue = b[sort.key as keyof Task];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sort.dir === "DESC"
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      }

      return 0;
    });

    return result;
  }, [tasks, activeFilters, sort]);

  // Handle sync
  const handleSync = async () => {
    if (getUnsyncedCount === 0) {
      Toast.info("No changes to sync");
      return;
    }

    try {
      const result = await syncTasks();
      if (result.success) {
        Toast.success(`Successfully synced ${result.syncedCount} items`);
      } else {
        Toast.error(result.error || "Sync failed");
      }
    } catch (error) {
      Toast.error("Sync failed. Please try again.");
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Toast.info("Data refreshed");
    }, 500);
  };

  // Handle task press
  const handleTaskPress = (task: Task) => {
    openDrawer(
      `task-detail-${task.id}`,
      <TaskDetailDrawer
        task={task}
        onSave={async (updatedTask) => {
          await updateTask(task.id, updatedTask);
          Toast.success("Task updated");
        }}
        onResume={(t) => {
          console.log("Resume task:", t.taskNumber);
        }}
      />,
      { drawerHeight: "auto" },
    );
  };

  // Handle inspection task press
  const handleInspectionTaskPress = (
    inspectionTask: InspectionTask,
    parentTask: Task,
  ) => {
    openDrawer(
      `inspection-task-${inspectionTask.id}`,
      <InspectionTaskDetailDrawer
        inspectionTask={inspectionTask}
        onSave={async (updatedTask) => {
          await updateInspectionTask(
            parentTask.id,
            inspectionTask.id,
            updatedTask,
          );
          Toast.success("Inspection task updated");
        }}
        onResume={(t) => {
          console.log("Resume inspection task:", t.inspectionTaskNumber);
        }}
      />,
      { drawerHeight: "auto" },
    );
  };

  // Handle calendar day press
  const handleCalendarDayPress = (date: Date, dayTasks: Task[]) => {
    openDrawer(
      `calendar-day-${date.toISOString()}`,
      <CalendarDayDetailDrawer
        date={date}
        tasks={dayTasks}
        onTaskPress={handleTaskPress}
        onInspectionTaskPress={handleInspectionTaskPress}
      />,
      { drawerHeight: "auto" },
    );
  };

  // Handle apply filters
  const handleApplyFilters = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
  }, []);

  // Handle filter press
  const handleFilterPress = () => {
    openDrawer(
      "filter-tasks",
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
      "sort-tasks",
      <SortForm
        sort={sort}
        setSort={setSort}
        params={{
          startDate: "Start Date",
          taskNumber: "Task Number",
          status: "Status",
          studyType: "Study Type",
        }}
      />,
      { drawerHeight: "auto" },
    );
  };

  // Render task item
  const renderTaskItem = ({ item, index }: { item: Task; index: number }) => (
    <ScheduleCard
      task={item}
      index={index}
      onPress={() => handleTaskPress(item)}
    />
  );

  // Render empty list
  const renderEmptyList = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.lightGreen} />
          <TextView style={styles.emptyText}>Loading tasks...</TextView>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <TextView variant="h3" style={styles.emptyText}>
          {filteredTasks.length === 0 && tasks.length > 0
            ? "No matches found!"
            : "There are no tasks yet!"}
        </TextView>
        <TextView style={styles.emptySubtext}>
          {tasks.length === 0
            ? "Tasks will appear here when scheduled"
            : "Try adjusting your filters"}
        </TextView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="Schedule"
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
            disabled={isSyncing || getUnsyncedCount === 0}
            style={styles.syncButton}
          >
            <ArrowsClockwise
              size={24}
              color={getUnsyncedCount > 0 ? colors.lightGreen : theme.secondary}
              weight={isSyncing ? "bold" : "regular"}
            />
            {getUnsyncedCount > 0 && (
              <View style={styles.badge}>
                <TextView style={styles.badgeText}>
                  {getUnsyncedCount > 99 ? "99+" : getUnsyncedCount}
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
              {filteredTasks.length} {t("items")}
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

          {/* Tasks List */}
          <FlatList
            data={filteredTasks}
            renderItem={renderTaskItem}
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
              filteredTasks.length === 0 ? styles.emptyList : undefined
            }
          />
        </>
      )}

      {/* Map View */}
      {tab === TABS.MAP.id && (
        <ScheduleMapView tasks={filteredTasks} onTaskPress={handleTaskPress} />
      )}

      {/* Calendar View */}
      {tab === TABS.CALENDAR.id && (
        <ScheduleCalendarView
          tasks={filteredTasks}
          onDayPress={handleCalendarDayPress}
          onTaskPress={handleTaskPress}
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
