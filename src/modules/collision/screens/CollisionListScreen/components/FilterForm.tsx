import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import TextView from "@/src/components/ui/TextView";
import ButtonView from "@/src/components/ui/ButtonView";
import FormSelectBox from "@/src/components/ui/FormSelectBox";
import DateTimePicker from "react-native-modal-datetime-picker";
import { useAppSelector } from "@/src/store/hooks";
import { colors } from "@/src/styles/theme/colors";
import { SyncStatus } from "@/src/types/models";
import { SYNC_STATUS } from "@/src/constants/global";
import SelectBoxView from "@/src/components/ui/SelectBoxView";

export interface CollisionFilters {
  divisionId?: string;
  dateFrom?: string;
  dateTo?: string;
  syncStatus?: SyncStatus | "all";
}

interface FilterFormProps {
  filters: CollisionFilters;
  onApply: (filters: CollisionFilters) => void;
  onReset: () => void;
  onClose: () => void;
}

const FilterForm = ({
  filters,
  onApply,
  onReset,
  onClose,
}: FilterFormProps) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const divisions = useAppSelector((state) => state.collision.divisions);

  const [localFilters, setLocalFilters] = useState<CollisionFilters>(filters);

  // Division options
  const divisionOptions = useMemo(
    () => [
      { label: t("collision.allDivisions"), value: "" },
      ...divisions.map((d) => ({
        label: d.name,
        value: d.id,
      })),
    ],
    [divisions, t],
  );

  // Sync status options
  const syncStatusOptions = [
    { label: t("common.all"), value: "all" },
    { label: t("collision.synced"), value: SYNC_STATUS.SYNCED },
    { label: t("collision.notSynced"), value: SYNC_STATUS.NOT_SYNCED },
  ];

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: CollisionFilters = {
      divisionId: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      syncStatus: "all",
    };
    setLocalFilters(resetFilters);
    onReset();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextView style={styles.title}>{t("collision.filterTitle")}</TextView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Division Filter */}
        <View style={styles.fieldContainer}>
          <TextView style={styles.label}>
            {t("collision.filterByDivision")}
          </TextView>
          <SelectBoxView
            options={divisionOptions}
            value={localFilters.divisionId || ""}
            onChange={(value) =>
              setLocalFilters((prev) => ({
                ...prev,
                divisionId: value.toString() || undefined,
              }))
            }
            placeholder={t("collision.allDivisions")}
          />
        </View>

        {/* Date From */}
        <View style={styles.fieldContainer}>
          <TextView style={styles.label}>
            {t("collision.filterByDate")}
          </TextView>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <TextView style={styles.dateLabel}>{t("common.from")}</TextView>
              <DateTimePicker
                mode="date"
                date={
                  localFilters.dateFrom
                    ? new Date(localFilters.dateFrom)
                    : undefined
                }
                onConfirm={(date) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    dateFrom: date?.toISOString(),
                  }))
                }
                onCancel={() => {}}
                // placeholder={t("common.selectDate")}
              />
            </View>
            <View style={styles.dateField}>
              <TextView style={styles.dateLabel}>{t("common.to")}</TextView>
              <DateTimePicker
                mode="date"
                date={
                  localFilters.dateTo
                    ? new Date(localFilters.dateTo)
                    : undefined
                }
                onCancel={() => {}}
                onConfirm={(date) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    dateTo: date?.toISOString(),
                  }))
                }
                // placeholder={t("common.selectDate")}
              />
            </View>
          </View>
        </View>

        {/* Sync Status Filter */}
        <View style={styles.fieldContainer}>
          <TextView style={styles.label}>
            {t("collision.filterBySyncStatus")}
          </TextView>
          <SelectBoxView
            options={syncStatusOptions}
            value={localFilters.syncStatus || "all"}
            onChange={(value) =>
              setLocalFilters((prev) => ({
                ...prev,
                syncStatus: value as SyncStatus | "all",
              }))
            }
          />
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <ButtonView
          variant="outline"
          onPress={handleReset}
          style={styles.button}
        >
          {t("reset")}
        </ButtonView>
        <ButtonView
          variant="primary"
          onPress={handleApply}
          style={styles.button}
        >
          {t("apply")}
        </ButtonView>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      maxHeight: "80%",
    },
    header: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      textAlign: "center",
    },
    content: {
      padding: spacing.md,
    },
    fieldContainer: {
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.text,
      marginBottom: spacing.sm,
    },
    dateRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    dateField: {
      flex: 1,
    },
    dateLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: spacing.xs,
    },
    actions: {
      flexDirection: "row",
      padding: spacing.md,
      gap: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    button: {
      flex: 1,
    },
  });

export default FilterForm;
