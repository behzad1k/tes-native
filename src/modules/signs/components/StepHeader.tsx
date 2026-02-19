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
  steps: string[];
}
const StepHeader = ({ step, steps }: StepHeaderProps) => {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.stepsContainer}>
      {steps.map((st, index: number) => {
        const isSelected = index <= step;
        return (
          <View style={styles.stepContainer} key={st}>
            {index > 0 && (
              <View
                style={[
                  styles.stepLine,
                  { width: 100 - steps.length * 12 },
                  isSelected && styles.selectedStepLine,
                ]}
              ></View>
            )}
            <View style={styles.step}>
              {index < step ? (
                <View style={styles.checkedStep}>
                  <Check color={colors.white} size={20} weight="bold" />
                </View>
              ) : (
                <TextView
                  style={[
                    styles.stepText,
                    isSelected && styles.selectedStepText,
                  ]}
                >
                  {index + 1}
                </TextView>
              )}
              <TextView
                style={[
                  styles.stepSubText,
                  isSelected && styles.selectedStepSubText,
                ]}
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
    stepContainer: { flexDirection: "row", alignItems: "center" },
    stepsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      padding: spacing.xxxl,
    },
    step: {
      marginHorizontal: 2,
      alignItems: "center",
      gap: 4,
    },
    stepLine: {
      borderTopWidth: 2,
      borderColor: theme.textSecondary,
      marginBottom: 20,
      height: 2,
    },
    stepSubText: {
      fontSize: 12,
    },
    stepText: {
      color: theme.textSecondary,
      borderWidth: 1,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xxs,
      borderRadius: 100,
      minWidth: 28,
      borderColor: theme.textSecondary,
    },
    selectedStepText: {
      color: colors.lightGreen,
      borderColor: colors.lightGreen,
      borderWidth: 3,
    },
    selectedStepSubText: {
      color: colors.lightGreen,
    },
    selectedStepLine: {
      borderColor: colors.lightGreen,
    },
    checkedStep: {
      backgroundColor: colors.lightGreen,
      borderRadius: 100,
      paddingHorizontal: spacing.xxs,
      paddingVertical: spacing.xxs,
    },
  });
export default StepHeader;
