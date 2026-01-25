import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { Header } from "@/src/components/layouts/Header";
import { useLocalSearchParams, useRouter } from "expo-router/build/hooks";
import { useTranslation } from "react-i18next";
import TextView from "@/src/components/ui/TextView";
import { spacing } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import DetailsStep from "./components/DetailsStep";
import { Check } from "phosphor-react-native";
import ButtonView from "@/src/components/ui/ButtonView";
import LocationStep from "./components/LocationStep";
import { ROUTES } from "@/src/constants/navigation";
import ImageStep from "./components/ImageStep";

export function EditSignScreen() {
  const { t } = useTranslation();
  const STEPS = {
    FIRST: {
      index: 1,
      subtitle: t("details"),
    },
    SECOND: {
      index: 2,
      subtitle: t("location"),
    },
    THIRD: {
      index: 3,
      subtitle: t("image"),
    },
  };
  const [step, setStep] = useState(STEPS.FIRST);
  const [signForm, setSignForm] = useState({});
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const handleValidation = (stepIndex: number) => {
    return true;
  };

  const handleChangeStep = (newStepIndex: number) => {
    if (newStepIndex > step.index) {
      if (handleValidation(newStepIndex)) {
        if (newStepIndex > Object.keys(STEPS).length) return handleSubmit();
      } else {
        // Toast Validation Error
      }
    } else {
      if (newStepIndex == 0) return handleCancel();
    }
    setStep(Object.values(STEPS).find((e) => e.index == newStepIndex));
  };

  const handleCancel = () => {
    router.navigate(ROUTES.SIGNS_LIST);
  };

  const handleSubmit = () => {
    // createSign(data, {
    //   onSuccess: () => {
    //     router.back();
    //   },
    // });
  };
  const stepHeader = () => {
    return (
      <View style={styles.stepsContainer}>
        {Object.values(STEPS).map((st) => {
          const isSelected = st.index <= step.index;
          return (
            <View style={styles.stepContainer} key={st.subtitle}>
              {st.index > 1 && (
                <View
                  style={[
                    styles.stepLine,
                    isSelected && styles.selectedStepLine,
                  ]}
                ></View>
              )}
              <View style={styles.step}>
                {st.index < step.index ? (
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
                    {st.index}
                  </TextView>
                )}
                <TextView
                  style={[
                    styles.stepSubText,
                    isSelected && styles.selectedStepSubText,
                  ]}
                >
                  {st.subtitle}
                </TextView>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderContent = () => {
    // switch (step.index) {
    //   case 1:
    //     return <DetailsStep signForm={signForm} setSignForm={setSignForm} />;
    //   case 2:
    //     return <LocationStep signForm={signForm} setSignForm={setSignForm} />;
    //   case 3:
    //     return <ImageStep signForm={signForm} setSignForm={setSignForm} />;
    // }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title={t("signs.addNewSign")} />
      {stepHeader()}
      {/*{renderContent()}*/}
      <View style={styles.buttonContainer}>
        <ButtonView
          style={styles.button}
          variant="outline"
          onPress={() => handleChangeStep(step.index - 1)}
        >
          {step.index > 1 ? t("back") : t("cancel")}
        </ButtonView>
        <ButtonView
          style={styles.button}
          onPress={() => handleChangeStep(step.index + 1)}
        >
          {t("next")}
        </ButtonView>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    stepContainer: { flexDirection: "row", alignItems: "center" },
    stepsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      padding: spacing.xxxl,
    },
    step: {
      alignItems: "center",
      gap: 4,
    },
    stepLine: {
      borderTopWidth: 2,
      borderColor: theme.textSecondary,
      marginBottom: 20,
      width: 100,
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
    buttonContainer: {
      position: "absolute",
      bottom: 40,
      left: 0,

      flexDirection: "row",
      flex: 1,
      justifyContent: "space-between",
      gap: 8,
      padding: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 4,
    },
  });
