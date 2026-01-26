import React, { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { scale, spacing } from "@/src/styles/theme/spacing";
import TextView from "@/src/components/ui/TextView";
import { colors } from "@/src/styles/theme/colors";
import { FontSizes, FontWeights } from "@/src/styles/theme/fonts";

interface HeaderProps {
  title?: string;
  rightIcons?: ReactElement[];
  leftIcons?: ReactElement[];
}

export const Header: React.FC<HeaderProps> = ({
  title = "TES",
  leftIcons = [],
  rightIcons = [],
}) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <View style={styles.left}>{leftIcons}</View>
      <TextView variant="h4" style={styles.titleText}>
        {title}
      </TextView>
      <View style={styles.right}>{rightIcons}</View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      height: scale(50),
      backgroundColor: theme.background,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomColor: theme.border,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.6,
      zIndex: 2,
      shadowColor: colors.lightGrey,
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      width: "30%",
    },
    titleText: {
      color: theme.text,
      fontWeight: FontWeights.semiBold,
      fontSize: FontSizes.lg,
      width: "40%",
      textAlign: "center",
    },
    right: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: spacing.sm,
      width: "30%",
    },
  });
