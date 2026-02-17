import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { colors } from "@/src/styles/theme/colors";
import { spacing } from "@/src/styles/theme/spacing";
import { Theme } from "@/src/types/theme";
import { Check } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

interface StepHeaderProps {
  step: number;
  totalSteps?: number;
}

const STEP_KEYS = [
  "general",
  "roads",
  "vehicles",
  "people",
  "pictures",
  "remarks",
  "review",
];

const StepHeader = ({ step, totalSteps = 7 }: StepHeaderProps) => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  const STEP_TITLES = [
    t("collision.general"),
    t("collision.roads"),
    t("collision.vehicles"),
    t("collision.people"),
    t("collision.pictures"),
    t("collision.remarks"),
    t("collision.review"),
  ];

  return (
    <View style={styles.stepsContainer}>
      {STEP_TITLES.map((st, index: number) => {
        const isSelected = index <= step;
        const isCompleted = index < step;
        const showLine = index > 0;

        return (
          <View style={styles.stepContainer} key={STEP_KEYS[index]}>
            {showLine && (
              <View
                style={[styles.stepLine, isSelected && styles.selectedStepLine]}
              />
            )}
            <View style={styles.step}>
              {isCompleted ? (
                <View style={styles.checkedStep}>
                  <Check color={colors.white} size={14} weight="bold" />
                </View>
              ) : (
                <View
                  style={[
                    styles.stepCircle,
                    isSelected && styles.selectedStepCircle,
                  ]}
                >
                  <TextView
                    style={[
                      styles.stepText,
                      isSelected && styles.selectedStepText,
                    ]}
                  >
                    {index + 1}
                  </TextView>
                </View>
              )}
              <TextView
                style={[
                  styles.stepSubText,
                  isSelected && styles.selectedStepSubText,
                ]}
                numberOfLines={1}
              >
                {st}
              </TextView>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    stepsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "flex-start",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    stepContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      flex: 1,
    },
    step: {
      alignItems: "center",
      gap: 4,
      flex: 1,
    },
    stepLine: {
      borderTopWidth: 2,
      borderColor: theme.textSecondary,
      marginTop: 12,
      flex: 1,
      minWidth: 10,
      maxWidth: 30,
    },
    selectedStepLine: {
      borderColor: colors.lightGreen,
    },
    stepCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.textSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    selectedStepCircle: {
      borderColor: colors.lightGreen,
      borderWidth: 3,
    },
    stepText: {
      fontSize: 10,
      color: theme.textSecondary,
      fontWeight: "600",
    },
    selectedStepText: {
      color: colors.lightGreen,
    },
    stepSubText: {
      fontSize: 9,
      color: theme.textSecondary,
      textAlign: "center",
    },
    selectedStepSubText: {
      color: colors.lightGreen,
      fontWeight: "600",
    },
    checkedStep: {
      width: 24,
      height: 24,
      backgroundColor: colors.lightGreen,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
  });

export default StepHeader;
