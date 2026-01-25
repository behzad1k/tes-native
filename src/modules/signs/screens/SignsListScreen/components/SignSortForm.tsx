import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SortSign } from "../../../types";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import { colors } from "@/src/styles/theme/colors";
import ButtonView from "@/src/components/ui/ButtonView";
import { useEffect, useState } from "react";
import { useDrawer } from "@/src/contexts/DrawerContext";

interface SortSignFormProps {
  sort: SortSign;
  setSort: React.Dispatch<React.SetStateAction<SortSign>>;
}
const SortSignForm = ({ sort, setSort }: SortSignFormProps) => {
  const [selectedSort, setSelectedSort] = useState(sort);
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { closeDrawer } = useDrawer();

  const isSortActive = (key: string, dir: string) => {
    return selectedSort.key == key && selectedSort.dir == dir;
  };

  const onChangeSort = (sort: SortSign) => {
    setSelectedSort({ key: sort.key, dir: sort.dir });
  };

  useEffect(() => {
    setSort(selectedSort);
  }, [selectedSort]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextView variant="h4">{t("sortBy")}</TextView>
      </View>
      <View style={styles.content}>
        <TextView style={styles.SortTitleText}>{t("status")}</TextView>
        <View style={styles.SortButtons}>
          <ButtonView
            variant={isSortActive("status", "ASC") ? "primary" : "outline"}
            size="small"
            style={styles.SortButton}
            textStyle={[
              styles.SortButtonText,
              isSortActive("status", "ASC") && styles.selectedSortButtonText,
            ]}
            onPress={() =>
              onChangeSort({
                key: "status",
                dir: "ASC",
              })
            }
          >
            {t("ascending")}
          </ButtonView>
          <ButtonView
            variant={isSortActive("status", "DESC") ? "primary" : "outline"}
            size="small"
            style={styles.SortButton}
            textStyle={[
              styles.SortButtonText,
              isSortActive("status", "DESC") && styles.selectedSortButtonText,
            ]}
            onPress={() =>
              onChangeSort({
                key: "status",
                dir: "DESC",
              })
            }
          >
            {t("descending")}
          </ButtonView>
        </View>
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
    SortTitleText: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    SortButtons: {
      borderRadius: 20,
      flexDirection: "row",
      gap: 8,
    },
    SortButton: {
      borderColor: theme.primary,
      borderWidth: 1,
      borderRadius: 100,
    },
    SortButtonText: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    selectedSortButtonText: {
      color: colors.white,
    },
  });
export default SortSignForm;
