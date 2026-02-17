import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import TextView from "@/src/components/ui/TextView";
import ButtonView from "@/src/components/ui/ButtonView";
import { colors } from "@/src/styles/theme/colors";
import {
  SortAscending,
  SortDescending,
  Calendar,
  Hash,
  Buildings,
  CheckCircle,
} from "phosphor-react-native";

export type SortField = "date" | "collisionNumber" | "division";
export type SortOrder = "asc" | "desc";

export interface CollisionSort {
  field: SortField;
  order: SortOrder;
}

interface SortFormProps {
  sort: CollisionSort;
  onApply: (sort: CollisionSort) => void;
  onClose: () => void;
}

const SORT_OPTIONS: {
  field: SortField;
  labelKey: string;
  icon: React.ReactNode;
}[] = [
  {
    field: "date",
    labelKey: "collision.sortByDate",
    icon: <Calendar size={20} />,
  },
  {
    field: "collisionNumber",
    labelKey: "collision.sortByNumber",
    icon: <Hash size={20} />,
  },
  {
    field: "division",
    labelKey: "collision.sortByDivision",
    icon: <Buildings size={20} />,
  },
];

const SortForm = ({ sort, onApply, onClose }: SortFormProps) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  const [localSort, setLocalSort] = useState<CollisionSort>(sort);

  const handleFieldSelect = (field: SortField) => {
    setLocalSort((prev) => ({
      ...prev,
      field,
    }));
  };

  const handleOrderToggle = () => {
    setLocalSort((prev) => ({
      ...prev,
      order: prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const handleApply = () => {
    onApply(localSort);
    onClose();
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextView style={styles.title}>{t("collision.sortTitle")}</TextView>
      </View>

      <View style={styles.content}>
        {/* Sort Field Selection */}
        <View style={styles.section}>
          <TextView style={styles.sectionLabel}>{t("common.sortBy")}</TextView>
          <View style={styles.optionsContainer}>
            {SORT_OPTIONS.map((option) => {
              const isSelected = localSort.field === option.field;
              return (
                <TouchableOpacity
                  key={option.field}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleFieldSelect(option.field)}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      isSelected && styles.optionIconSelected,
                    ]}
                  >
                    {React.cloneElement(option.icon as React.ReactElement, {
                      // color: isSelected ? colors.white : colors.lightGrey,
                    })}
                  </View>
                  <TextView
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {t(option.labelKey)}
                  </TextView>
                  {isSelected && (
                    <CheckCircle
                      size={20}
                      color={colors.lightGreen}
                      weight="fill"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sort Order Selection */}
        <View style={styles.section}>
          <TextView style={styles.sectionLabel}>{t("common.order")}</TextView>
          <TouchableOpacity
            style={styles.orderToggle}
            onPress={handleOrderToggle}
          >
            <View style={styles.orderOption}>
              {localSort.order === "asc" ? (
                <SortAscending size={24} color={colors.lightGreen} />
              ) : (
                <SortDescending size={24} color={colors.lightGreen} />
              )}
              <View style={styles.orderTextContainer}>
                <TextView style={styles.orderLabel}>
                  {localSort.order === "asc"
                    ? t("collision.ascending")
                    : t("collision.descending")}
                </TextView>
                <TextView style={styles.orderHint}>
                  {t("common.tapToToggle")}
                </TextView>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actions}>
        <ButtonView variant="outline" onPress={onClose} style={styles.button}>
          {t("cancel")}
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
    section: {
      marginBottom: spacing.lg,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.textSecondary,
      marginBottom: spacing.sm,
    },
    optionsContainer: {
      gap: spacing.xs,
    },
    optionButton: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.md,
      backgroundColor: theme.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    optionButtonSelected: {
      borderColor: colors.lightGreen,
      backgroundColor: `${colors.lightGreen}10`,
    },
    optionIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.background,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.sm,
    },
    optionIconSelected: {
      backgroundColor: colors.lightGreen,
    },
    optionLabel: {
      flex: 1,
      fontSize: 15,
      color: theme.text,
    },
    optionLabelSelected: {
      fontWeight: "600",
      color: colors.lightGreen,
    },
    orderToggle: {
      backgroundColor: theme.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      padding: spacing.md,
    },
    orderOption: {
      flexDirection: "row",
      alignItems: "center",
    },
    orderTextContainer: {
      marginLeft: spacing.sm,
    },
    orderLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    },
    orderHint: {
      fontSize: 12,
      color: theme.textSecondary,
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

export default SortForm;
