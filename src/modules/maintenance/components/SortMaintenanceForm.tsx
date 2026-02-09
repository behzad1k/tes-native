import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import TextView from "@/src/components/ui/TextView";
import { spacing } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { X } from "phosphor-react-native";

interface SortMaintenanceFormProps {
  sortByDate: number; // 1 = ASC, 2 = DESC, 3 = none
  setSortByDate: (sort: number) => void;
}

const SortMaintenanceForm = ({
  sortByDate,
  setSortByDate,
}: SortMaintenanceFormProps) => {
  const styles = useThemedStyles(createStyles);
  const { closeDrawer } = useDrawer();

  const handleSortSelect = (value: number) => {
    // Toggle: if same value, reset to 3 (none)
    if (sortByDate === value) {
      setSortByDate(3);
    } else {
      setSortByDate(value);
    }
    closeDrawer();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextView variant="h3" style={styles.title}>
          Sort By:
        </TextView>
        <TouchableOpacity onPress={() => closeDrawer()}>
          <X size={24} color={colors.lightGreen} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.optionsRow}>
          <TouchableOpacity
            onPress={() => handleSortSelect(1)}
            style={styles.optionWrapper}
          >
            <View
              style={[styles.option, sortByDate === 1 && styles.optionActive]}
            >
              <TextView
                style={[
                  styles.optionText,
                  sortByDate === 1 && styles.optionTextActive,
                ]}
              >
                Nearer due date
              </TextView>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSortSelect(2)}
            style={styles.optionWrapper}
          >
            <View
              style={[styles.option, sortByDate === 2 && styles.optionActive]}
            >
              <TextView
                style={[
                  styles.optionText,
                  sortByDate === 2 && styles.optionTextActive,
                ]}
              >
                Later due date
              </TextView>
            </View>
          </TouchableOpacity>
        </View>
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
      padding: spacing.md,
    },
    optionsRow: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    optionWrapper: {
      flex: 1,
    },
    option: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.lightGreen,
      backgroundColor: theme.background,
      alignItems: "center",
    },
    optionActive: {
      borderColor: colors.lightGreen,
      backgroundColor: colors.lightGreen,
    },
    optionText: {
      color: colors.lightGreen,
      fontWeight: "bold",
      textAlign: "center",
    },
    optionTextActive: {
      color: colors.white,
    },
  });

export default SortMaintenanceForm;
