import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  fetchWorkOrders,
  syncTrafficCountData,
  updateWorkOrderStatus,
  updateWorkOrderLocally,
  addCountToWorkOrder,
  markWorkOrderSynced,
} from "@/src/store/slices/trafficCountSlice";
import {
  TrafficCountWorkOrder,
  TrafficCount,
  WorkOrderStatus,
  SyncStatusType,
} from "../types";

export const useTrafficCountOperations = () => {
  const dispatch = useAppDispatch();
  const workOrders = useAppSelector(
    (state) => state.trafficCount.workOrders,
  );
  const classifications = useAppSelector(
    (state) => state.trafficCount.classifications,
  );
  const isLoading = useAppSelector(
    (state) => state.trafficCount.isLoading,
  );
  const lastFetched = useAppSelector(
    (state) => state.trafficCount.lastFetched,
  );

  const refreshWorkOrders = useCallback(async () => {
    try {
      await dispatch(fetchWorkOrders()).unwrap();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [dispatch]);

  const syncData = useCallback(async () => {
    try {
      await dispatch(syncTrafficCountData()).unwrap();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [dispatch]);

  const changeWorkOrderStatus = useCallback(
    (id: string, status: WorkOrderStatus) => {
      dispatch(updateWorkOrderStatus({ id, status }));
    },
    [dispatch],
  );

  const updateWorkOrder = useCallback(
    (workOrder: TrafficCountWorkOrder) => {
      dispatch(updateWorkOrderLocally(workOrder));
    },
    [dispatch],
  );

  const addCount = useCallback(
    (workOrderId: string, count: TrafficCount) => {
      dispatch(addCountToWorkOrder({ workOrderId, count }));
    },
    [dispatch],
  );

  const getWorkOrderById = useCallback(
    (id: string) => {
      return workOrders.find((wo) => wo.id === id);
    },
    [workOrders],
  );

  const getUnsyncedWorkOrders = useCallback(() => {
    return workOrders.filter((wo) => !wo.isSynced || wo.isEdited);
  }, [workOrders]);

  const getWorkOrdersByStatus = useCallback(
    (status: WorkOrderStatus) => {
      return workOrders.filter((wo) => wo.status === status);
    },
    [workOrders],
  );

  const unsyncedCount = useMemo(
    () => workOrders.filter((wo) => !wo.isSynced || wo.isEdited).length,
    [workOrders],
  );

  const filterAndSortWorkOrders = useCallback(
    (
      filterByStatus: WorkOrderStatus[] = [],
      filterBySyncStatus: SyncStatusType[] = [],
      sortBy: "newest" | "oldest" | "nearer_due" | "later_due" | null = null,
    ) => {
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
            (a, b) =>
              new Date(a.endDT).getTime() - new Date(b.endDT).getTime(),
          );
          break;
        case "later_due":
          result.sort(
            (a, b) =>
              new Date(b.endDT).getTime() - new Date(a.endDT).getTime(),
          );
          break;
      }

      return result;
    },
    [workOrders],
  );

  return {
    workOrders,
    classifications,
    isLoading,
    lastFetched,
    unsyncedCount,

    refreshWorkOrders,
    syncData,
    changeWorkOrderStatus,
    updateWorkOrder,
    addCount,
    getWorkOrderById,
    getUnsyncedWorkOrders,
    getWorkOrdersByStatus,
    filterAndSortWorkOrders,
  };
};
