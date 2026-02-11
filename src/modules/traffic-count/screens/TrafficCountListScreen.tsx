import React, { useState, useMemo, useEffect } from "react";
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
import {
  fetchWorkOrders,
  syncTrafficCountData,
} from "@/src/store/slices/trafficCountSlice";
import { ROUTES } from "@/src/constants/navigation";
import { Toast } from "toastify-react-native";
import { useTheme } from "@/src/contexts/ThemeContext";
import {
  TrafficCountWorkOrder,
  WorkOrderStatus,
  SyncStatusType,
} from "../types";
import WorkOrderCard from "../components/WorkOrderCard";
import WorkOrderDetail from "../components/WorkOrderDetail";
import FilterTrafficCountForm from "../components/FilterTrafficCountForm";
import SortTrafficCountForm, {
  SortOption,
} from "../components/SortTrafficCountForm";

export default function TrafficCountListScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { openDrawer } = useDrawer();

  const [refreshing, setRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [filterByStatus, setFilterByStatus] = useState<WorkOrderStatus[]>([]);
  const [filterBySyncStatus, setFilterBySyncStatus] = useState<
    SyncStatusType[]
  >([]);
  const [sortBy, setSortBy] = useState<SortOption>(null);

  const workOrders = useAppSelector((state) => state.trafficCount.workOrders);
  const isLoading = useAppSelector((state) => state.trafficCount.isLoading);

  useEffect(() => {
    handleRefresh();
  }, []);

  const filteredWorkOrders = useMemo(() => {
    let result = [...workOrders];

    if (filterByStatus.length > 0) {
      result = result.filter((wo) => filterByStatus.includes(wo.status));
    }

    if (filterBySyncStatus.length > 0) {
      result = result.filter((wo) =>
        filterBySyncStatus.includes(wo.syncStatus),
      );
    }

    switch (sortBy) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.startDT).getTime() - new Date(a.startDT).getTime(),
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.startDT).getTime() - new Date(b.startDT).getTime(),
        );
        break;
      case "nearer_due":
        result.sort(
          (a, b) => new Date(a.endDT).getTime() - new Date(b.endDT).getTime(),
        );
        break;
      case "later_due":
        result.sort(
          (a, b) => new Date(b.endDT).getTime() - new Date(a.endDT).getTime(),
        );
        break;
    }

    return result;
  }, [workOrders, filterByStatus, filterBySyncStatus, sortBy]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchWorkOrders()).unwrap();
    } catch (error) {
      Toast.error("Failed to fetch work orders");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await dispatch(syncTrafficCountData()).unwrap();
      Toast.success("Sync completed successfully");
    } catch (error) {
      Toast.error("Sync failed. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleWorkOrderPress = (workOrder: TrafficCountWorkOrder) => {
    openDrawer(
      `wo-detail-${workOrder.id}`,
      <WorkOrderDetail workOrder={workOrder} onClaim={(wo) => {}} />,
      {
        drawerHeight: "auto",
        position: "bottom",
      },
    );
  };

  const handleSortPress = () => {
    openDrawer(
      "sort-traffic-count",
      <SortTrafficCountForm sortBy={sortBy} setSortBy={setSortBy} />,
      { drawerHeight: "auto" },
    );
  };

  const handleFilterPress = () => {
    openDrawer(
      "filter-traffic-count",
      <FilterTrafficCountForm
        filterByStatus={filterByStatus}
        setFilterByStatus={setFilterByStatus}
        filterBySyncStatus={filterBySyncStatus}
        setFilterBySyncStatus={setFilterBySyncStatus}
      />,
      { drawerHeight: "auto" },
    );
  };

  const renderWorkOrderItem = ({ item }: { item: TrafficCountWorkOrder }) => (
    <WorkOrderCard item={item} onPress={() => handleWorkOrderPress(item)} />
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
          {filteredWorkOrders.length === 0 && workOrders.length > 0
            ? "No matches found"
            : "No work orders available"}
        </TextView>
        <TextView variant="bodySmall" style={styles.emptySubText}>
          Pull down to refresh or sync to get latest data
        </TextView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="Traffic Counter"
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
            disabled={isSyncing}
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

      <View style={styles.listHeader}>
        <TextView style={styles.itemsLengthText}>
          {filteredWorkOrders.length} Items
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
        data={filteredWorkOrders}
        renderItem={renderWorkOrderItem}
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
          filteredWorkOrders.length === 0 ? styles.emptyList : undefined
        }
        showsVerticalScrollIndicator={false}
      />
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
    listHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
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
    emptyList: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
      gap: spacing.xs,
    },
    emptyText: {
      color: theme.secondary,
      textAlign: "center",
    },
    emptySubText: {
      color: theme.secondary,
      textAlign: "center",
    },
  });
