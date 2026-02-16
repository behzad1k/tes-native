import { ActiveFilter, FilterField } from '@/src/types/layouts';
import { StyleSheet, TouchableOpacity, View } from "react-native";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import { colors } from "@/src/styles/theme/colors";
import ButtonView from "@/src/components/ui/ButtonView";
import { useState } from "react";
import { useDrawer } from "@/src/contexts/DrawerContext";

interface FilterFormProps {
  fields: FilterField[];
  activeFilters?: ActiveFilter[];
  onApply?: (filters: ActiveFilter[]) => void;
  onCancel?: () => void;
}

const FilterForm = ({
                      fields,
                      activeFilters = [],
                      onApply,
                      onCancel,
                    }: FilterFormProps) => {
  const [selectedFilters, setSelectedFilters] = useState<ActiveFilter[]>(activeFilters);
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { closeDrawer } = useDrawer();

  const isFilterActive = (key: string, value: string) => {
    const filter = selectedFilters.find((f) => f.key === key);
    return filter?.value === value;
  };

  const onChangeFilter = (field: FilterField, value: string) => {
    setSelectedFilters((prev) => {
      const updated = [...prev];
      const index = updated.findIndex((f) => f.key === field.key);
      const newFilter: ActiveFilter = {
        key: field.key,
        operator: field.operator,
        value,
      };

      if (index > -1) {
        // If clicking the same value, toggle it off
        if (updated[index].value === value) {
          updated.splice(index, 1);
        } else {
          updated[index] = newFilter;
        }
      } else {
        updated.push(newFilter);
      }

      return updated;
    });
  };

  const handleClearFilters = () => {
    setSelectedFilters([]);
  };

  const handleCloseDrawer = () => {
    onCancel?.();
    closeDrawer();
  };

  const handleSubmitDrawer = () => {
    onApply?.(selectedFilters);
    closeDrawer();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextView variant="h4">{t("filterBy")}</TextView>
        <TouchableOpacity onPress={handleClearFilters}>
          <TextView style={styles.clearButtonText}>{t("clear")}</TextView>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {fields.map((field) => (
          <View key={field.key} style={styles.fieldContainer}>
            <TextView style={styles.filterTitleText}>{field.label}</TextView>
            <View style={styles.filterButtons}>
              {field.options.map((option) => (
                <ButtonView
                  key={`${field.key}-${option.value}`}
                  variant={
                    isFilterActive(field.key, option.value)
                      ? "primary"
                      : "outline"
                  }
                  size="small"
                  style={styles.filterButton}
                  textStyle={[
                    styles.filterButtonText,
                    isFilterActive(field.key, option.value) &&
                    styles.selectedFilterButtonText,
                  ]}
                  onPress={() => onChangeFilter(field, option.value)}
                >
                  {option.label}
                </ButtonView>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <ButtonView
          variant="outline"
          onPress={handleCloseDrawer}
          style={styles.footerButton}
        >
          {t("cancel")}
        </ButtonView>
        <ButtonView
          variant="primary"
          onPress={handleSubmitDrawer}
          style={styles.footerButton}
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
      width: "100%",
      backgroundColor: theme.background,
      borderRadius: 20,
      paddingBottom: spacing.xxl,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.primary,
    },
    clearButtonText: {
      color: colors.red,
    },
    content: {
      gap: 20,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    fieldContainer: {
      gap: 12,
    },
    filterTitleText: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    filterButtons: {
      borderRadius: 20,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    filterButton: {
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 100,
    },
    filterButtonText: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    selectedFilterButtonText: {
      color: colors.white,
    },
    footer: {
      marginTop: spacing.sm,
      paddingHorizontal: spacing.sm,
      width: "100%",
      flexDirection: "row",
      gap: 8,
    },
    footerButton: {
      flex: 1,
      paddingVertical: spacing.xs,
    },
  });

export default FilterForm;