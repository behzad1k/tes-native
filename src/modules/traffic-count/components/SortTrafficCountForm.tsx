import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import TextView from "@/src/components/ui/TextView";
import { spacing } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { X } from "phosphor-react-native";
import { FontWeights } from "@/src/styles/theme/fonts";

export type SortOption =
  | "newest"
  | "oldest"
  | "nearer_due"
  | "later_due"
  | null;

interface SortTrafficCountFormProps {
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
}

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Newest Works", value: "newest" },
  { label: "Oldest Works", value: "oldest" },
  { label: "Nearer due date", value: "nearer_due" },
  { label: "Later due date", value: "later_due" },
];

const SortTrafficCountForm = ({
  sortBy,
  setSortBy,
}: SortTrafficCountFormProps) => {
  const styles = useThemedStyles(createStyles);
  const { closeDrawer } = useDrawer();

  const handleSortSelect = (value: SortOption) => {
    if (sortBy === value) {
      setSortBy(null);
    } else {
      setSortBy(value);
    }
    closeDrawer();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextView variant="h3" style={styles.title}>
          Sort by
        </TextView>
        <TouchableOpacity onPress={() => closeDrawer()}>
          <X size={24} color={colors.lightGreen} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.optionsGrid}>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => handleSortSelect(option.value)}
              style={styles.optionWrapper}
            >
              <View
                style={[
                  styles.option,
                  sortBy === option.value && styles.optionActive,
                ]}
              >
                <TextView
                  style={[
                    styles.optionText,
                    sortBy === option.value && styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </TextView>
              </View>
            </TouchableOpacity>
          ))}
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
      fontWeight: FontWeights.bold,
    },
    content: {
      padding: spacing.md,
    },
    optionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    optionWrapper: {},
    option: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: theme.secondary,
      backgroundColor: theme.background,
    },
    optionActive: {
      borderColor: colors.lightGreen,
      backgroundColor: colors.lightGreen,
    },
    optionText: {
      color: theme.secondary,
      fontWeight: FontWeights.medium,
      textAlign: "center",
    },
    optionTextActive: {
      color: colors.white,
    },
  });

export default SortTrafficCountForm;
