import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import TextView from "@/src/components/ui/TextView";
import ButtonView from "@/src/components/ui/ButtonView";
import { spacing } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { FontWeights } from "@/src/styles/theme/fonts";
import { WorkOrderStatus, SyncStatusType } from "../types";

const STATUS_OPTIONS: WorkOrderStatus[] = ["To Do", "In Progress", "Done"];
const SYNC_OPTIONS: SyncStatusType[] = ["Synced", "Not Synced"];

interface FilterTrafficCountFormProps {
  filterByStatus: WorkOrderStatus[];
  setFilterByStatus: (filters: WorkOrderStatus[]) => void;
  filterBySyncStatus: SyncStatusType[];
  setFilterBySyncStatus: (filters: SyncStatusType[]) => void;
}

const FilterTrafficCountForm = ({
  filterByStatus,
  setFilterByStatus,
  filterBySyncStatus,
  setFilterBySyncStatus,
}: FilterTrafficCountFormProps) => {
  const styles = useThemedStyles(createStyles);
  const { closeDrawer } = useDrawer();

  const toggleStatus = (status: WorkOrderStatus) => {
    if (filterByStatus.includes(status)) {
      setFilterByStatus(filterByStatus.filter((s) => s !== status));
    } else {
      setFilterByStatus([...filterByStatus, status]);
    }
  };

  const toggleSyncStatus = (syncStatus: SyncStatusType) => {
    if (filterBySyncStatus.includes(syncStatus)) {
      setFilterBySyncStatus(filterBySyncStatus.filter((s) => s !== syncStatus));
    } else {
      setFilterBySyncStatus([...filterBySyncStatus, syncStatus]);
    }
  };

  const handleApply = () => {
    closeDrawer();
  };

  const handleClear = () => {
    setFilterByStatus([]);
    setFilterBySyncStatus([]);
  };

  const handleBack = () => {
    closeDrawer();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextView variant="h3" style={styles.title}>
          Filter by
        </TextView>
        <TouchableOpacity onPress={handleClear}>
          <TextView style={styles.clearText}>Clear</TextView>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <TextView style={styles.sectionTitle}>Status</TextView>
          <View style={styles.filterGrid}>
            {STATUS_OPTIONS.map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => toggleStatus(status)}
                style={styles.filterButtonWrapper}
              >
                <View
                  style={[
                    styles.filterButton,
                    filterByStatus.includes(status) &&
                      styles.filterButtonActive,
                  ]}
                >
                  <TextView
                    style={[
                      styles.filterText,
                      filterByStatus.includes(status) &&
                        styles.filterTextActive,
                    ]}
                  >
                    {status}
                  </TextView>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <TextView style={styles.sectionTitle}>Sync Status</TextView>
          <View style={styles.filterGrid}>
            {SYNC_OPTIONS.map((syncStatus) => (
              <TouchableOpacity
                key={syncStatus}
                onPress={() => toggleSyncStatus(syncStatus)}
                style={styles.filterButtonWrapper}
              >
                <View
                  style={[
                    styles.filterButton,
                    filterBySyncStatus.includes(syncStatus) &&
                      styles.filterButtonActive,
                  ]}
                >
                  <TextView
                    style={[
                      styles.filterText,
                      filterBySyncStatus.includes(syncStatus) &&
                        styles.filterTextActive,
                    ]}
                  >
                    {syncStatus}
                  </TextView>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <ButtonView
          variant="outline"
          onPress={handleBack}
          style={styles.actionButton}
        >
          Back
        </ButtonView>
        <ButtonView
          variant="primary"
          onPress={handleApply}
          style={styles.actionButton}
        >
          Apply
        </ButtonView>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: {
      color: theme.text,
      fontWeight: FontWeights.bold,
    },
    clearText: {
      color: colors.error,
      fontWeight: FontWeights.medium,
    },
    content: {
      maxHeight: 400,
    },
    section: {
      padding: spacing.md,
    },
    sectionTitle: {
      color: theme.text,
      fontWeight: FontWeights.semiBold,
      marginBottom: spacing.sm,
    },
    filterGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    filterButtonWrapper: {},
    filterButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: theme.secondary,
      backgroundColor: theme.background,
    },
    filterButtonActive: {
      borderColor: colors.lightGreen,
      backgroundColor: colors.lightGreen,
    },
    filterText: {
      color: theme.secondary,
      fontWeight: FontWeights.medium,
    },
    filterTextActive: {
      color: colors.white,
    },
    actions: {
      flexDirection: "row",
      gap: spacing.sm,
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    actionButton: {
      flex: 1,
      borderRadius: 8,
    },
  });

export default FilterTrafficCountForm;
