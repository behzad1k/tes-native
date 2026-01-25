import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { Header } from "@/src/components/layouts/Header";
import { useRouter } from "expo-router/build/hooks";
import { useTranslation } from "react-i18next";
import DetailsStep from "./components/DetailsStep";
import ButtonView from "@/src/components/ui/ButtonView";
import LocationStep from "./components/LocationStep";
import { ROUTES } from "@/src/constants/navigation";
import ImageStep from "./components/ImageStep";
import { SignFormData } from "../../types";
import { useForm } from "react-hook-form";
import StepHeader from "./components/StepHeader";

export default function CreateSignScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState<number>(0);
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setError,
    reset,
  } = useForm<SignFormData>({
    defaultValues: {},
  });

  const handleValidation = (stepIndex: number) => {
    return true;
  };

  const handleChangeStep = (newStepIndex: number) => {
    if (newStepIndex > step) {
      if (handleValidation(newStepIndex)) {
        if (newStepIndex > 2) return handleSubmit(onSubmit)();
      } else {
        // Toast Validation Error
      }
    } else {
      if (newStepIndex == -1) return handleCancel();
    }
    setStep(newStepIndex);
  };

  const handleCancel = () => {
    router.navigate(ROUTES.SIGNS_LIST);
  };

  const onSubmit = (form: SignFormData) => {
    console.log(form);
    // createSign(data, {
    //   onSuccess: () => {
    //     router.back();
    //   },
    // });
  };

  const renderContent = () => {
    switch (step) {
      case 0:
        return <DetailsStep signFormControl={control} />;
      case 1:
        return <LocationStep signFormControl={control} />;
      case 2:
        return <ImageStep signFormControl={control} />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title={t("signs.addNewSign")} />
      <StepHeader step={step} />
      {renderContent()}
      <View style={styles.buttonContainer}>
        <ButtonView
          style={styles.button}
          variant="outline"
          onPress={() => handleChangeStep(step - 1)}
        >
          {step > 1 ? t("back") : t("cancel")}
        </ButtonView>
        <ButtonView
          style={styles.button}
          onPress={() => handleChangeStep(step + 1)}
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
      paddingBottom: 100,
      backgroundColor: theme.background,
    },
    buttonContainer: {
      backgroundColor: theme.background,
      position: "absolute",
      bottom: 0,
      left: 0,
      paddingBottom: 40,
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
