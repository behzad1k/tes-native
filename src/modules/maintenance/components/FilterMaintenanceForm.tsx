import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import TextView from "@/src/components/ui/TextView";
import ButtonView from "@/src/components/ui/ButtonView";
import { spacing } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { JobStatus, JobType } from "@/src/types/models";
import { X } from "phosphor-react-native";
import { Dimensions } from "react-native";

const { width } = Dimensions.get("screen");

interface FilterMaintenanceFormProps {
  filterByStatus: string[];
  setFilterByStatus: (filters: string[]) => void;
  filterByType: string[];
  setFilterByType: (filters: string[]) => void;
  jobStatuses: JobStatus[];
  jobTypes: JobType[];
}

const FilterMaintenanceForm = ({
  filterByStatus,
  setFilterByStatus,
  filterByType,
  setFilterByType,
  jobStatuses,
  jobTypes,
}: FilterMaintenanceFormProps) => {
  const styles = useThemedStyles(createStyles);
  const { closeDrawer } = useDrawer();

  const toggleStatus = (statusName: string) => {
    if (filterByStatus.includes(statusName)) {
      setFilterByStatus(filterByStatus.filter((s) => s !== statusName));
    } else {
      setFilterByStatus([...filterByStatus, statusName]);
    }
  };

  const toggleType = (typeName: string) => {
    if (filterByType.includes(typeName)) {
      setFilterByType(filterByType.filter((t) => t !== typeName));
    } else {
      setFilterByType([...filterByType, typeName]);
    }
  };

  const handleShow = () => {
    closeDrawer();
  };

  const handleReset = () => {
    setFilterByStatus([]);
    setFilterByType([]);
    closeDrawer();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextView variant="h3" style={styles.title}>
          Filter By:
        </TextView>
        <TouchableOpacity onPress={() => closeDrawer()}>
          <X size={24} color={colors.lightGreen} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Filters */}
        {jobStatuses.length > 0 && (
          <View style={styles.section}>
            <TextView variant="h4" style={styles.sectionTitle}>
              Job Status
            </TextView>
            <View style={styles.filterGrid}>
              {jobStatuses.map((status) => (
                <TouchableOpacity
                  key={status.id}
                  onPress={() => toggleStatus(status.name)}
                  style={styles.filterButtonWrapper}
                >
                  <View
                    style={[
                      styles.filterButton,
                      filterByStatus.includes(status.name) &&
                        styles.filterButtonActive,
                    ]}
                  >
                    <TextView
                      style={[
                        styles.filterText,
                        filterByStatus.includes(status.name) &&
                          styles.filterTextActive,
                      ]}
                    >
                      {status.name}
                    </TextView>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Type Filters */}
        {jobTypes.length > 0 && (
          <View style={styles.section}>
            <TextView variant="h4" style={styles.sectionTitle}>
              Job Type
            </TextView>
            <View style={styles.filterGrid}>
              {jobTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => toggleType(type.name)}
                  style={styles.filterButtonWrapper}
                >
                  <View
                    style={[
                      styles.filterButton,
                      filterByType.includes(type.name) &&
                        styles.filterButtonActive,
                    ]}
                  >
                    <TextView
                      style={[
                        styles.filterText,
                        filterByType.includes(type.name) &&
                          styles.filterTextActive,
                      ]}
                    >
                      {type.name}
                    </TextView>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <ButtonView
          variant="primary"
          onPress={handleShow}
          style={styles.actionButton}
        >
          Show
        </ButtonView>
        <ButtonView
          variant="outline"
          onPress={handleReset}
          // style={[styles.actionButton, styles.resetButton]}
        >
          Reset
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
      fontWeight: "bold",
    },
    content: {
      maxHeight: 400,
    },
    section: {
      padding: spacing.md,
    },
    sectionTitle: {
      color: theme.text,
      marginBottom: spacing.sm,
    },
    filterGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xxs,
    },
    filterButtonWrapper: {
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
    },
    filterButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.lightGreen,
      backgroundColor: theme.background,
    },
    filterButtonActive: {
      borderColor: colors.lightGreen,
      backgroundColor: colors.lightGreen,
    },
    filterText: {
      color: colors.lightGreen,
      fontWeight: "bold",
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
    },
    resetButton: {
      backgroundColor: colors.error,
      borderColor: colors.error,
    },
  });

export default FilterMaintenanceForm;
