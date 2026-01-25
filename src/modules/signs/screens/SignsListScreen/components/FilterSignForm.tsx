import { StyleSheet, TouchableOpacity, View } from "react-native";
import { FilterSign, FilterSingOperator } from "../../../types";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import { colors } from "@/src/styles/theme/colors";
import ButtonView from "@/src/components/ui/ButtonView";
import { useState } from "react";
import { useDrawer } from "@/src/contexts/DrawerContext";

interface FilterSignFormProps {
  filters?: FilterSign[];
  setFilters?: React.Dispatch<React.SetStateAction<FilterSign[]>>;
}
const FilterSignForm = ({ filters, setFilters }: FilterSignFormProps) => {
  const [selectedFilters, setSelectedFilters] = useState(filters);
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { closeDrawer } = useDrawer();

  const isFilterActive = (key: string, value: string) => {
    return (
      selectedFilters.find((e) => e.key == key) &&
      selectedFilters.find((e) => e.key == key)?.value == value
    );
  };

  const onChangeFilter = (filter: FilterSign) => {
    setSelectedFilters((prev) => {
      const cp = [...prev];
      const index = cp.findIndex((e) => e.key == filter.key);
      if (index > -1) {
        cp[index] = filter;
      } else {
        cp.push(filter);
      }
      return cp;
    });
  };

  const handleClearFilters = () => {
    setSelectedFilters([]);
  };

  const handleCloseDrawer = () => {
    closeDrawer();
  };

  const handleSubmitDrawer = () => {
    setFilters(selectedFilters);
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
        <TextView style={styles.filterTitleText}>{t("status")}</TextView>
        <View style={styles.filterButtons}>
          <ButtonView
            variant={isFilterActive("status", "sign") ? "primary" : "outline"}
            size="small"
            style={styles.filterButton}
            textStyle={[
              styles.filterButtonText,
              isFilterActive("status", "sign") &&
                styles.selectedFilterButtonText,
            ]}
            onPress={() =>
              onChangeFilter({
                key: "status",
                operator: FilterSingOperator.EQUAL,
                value: "sign",
              })
            }
          >
            {t("sign")}
          </ButtonView>
          <ButtonView
            variant={
              isFilterActive("status", "support") ? "primary" : "outline"
            }
            size="small"
            style={styles.filterButton}
            textStyle={[
              styles.filterButtonText,
              isFilterActive("status", "support") &&
                styles.selectedFilterButtonText,
            ]}
            onPress={() =>
              onChangeFilter({
                key: "status",
                operator: FilterSingOperator.EQUAL,
                value: "support",
              })
            }
          >
            {t("support")}
          </ButtonView>
        </View>
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
    filterTitleText: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    filterButtons: {
      borderRadius: 20,
      flexDirection: "row",
      gap: 8,
    },
    filterButton: {
      borderColor: theme.primary,
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
export default FilterSignForm;
