import React, { useState, useEffect } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { Header } from "@/src/components/layouts/Header";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import DetailsStep from "./components/DetailsStep";
import ButtonView from "@/src/components/ui/ButtonView";
import LocationStep from "./components/LocationStep";
import ImageStep from "./components/ImageStep";
import { SignFormData } from "../../types";
import { useForm } from "react-hook-form";
import StepHeader from "./components/StepHeader";
import { useSignOperations, useSignForm } from "../../hooks/useSignOperations";
import { Toast } from "toastify-react-native";
import TextView from "@/src/components/ui/TextView";

export default function EditSignScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const [step, setStep] = useState<number>(0);
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { editSign } = useSignOperations();
  const { sign, initialValues, isEditMode } = useSignForm(id as string);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    trigger,
    reset,
  } = useForm<SignFormData>({
    defaultValues: initialValues,
    mode: "onChange",
  });

  // useEffect(() => {
  //   if (sign) {
  //     reset(initialValues);
  //   }
  // }, [sign, initialValues, reset]);

  if (!sign) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header title={t("signs.edit")} />
        <View style={styles.errorContainer}>
          <TextView variant="body">Sign not found</TextView>
        </View>
      </SafeAreaView>
    );
  }

  const validateStep = async (stepIndex: number): Promise<boolean> => {
    let fieldsToValidate: (keyof SignFormData)[] = [];

    switch (stepIndex) {
      case 0:
        fieldsToValidate = [
          "signId",
          "dimensionId",
          "height",
          "facingDirectionId",
          "faceMaterialId",
          "reflectiveCoatingId",
          "reflectiveRatingId",
          "signConditionId",
        ];
        break;
      case 1:
        fieldsToValidate = ["supportId", "locationTypeId"];
        break;
      case 2:
        return true;
    }

    const result = await trigger(fieldsToValidate);
    return result;
  };

  const handleChangeStep = async (newStepIndex: number) => {
    if (newStepIndex > step) {
      const isValid = await validateStep(step);
      if (!isValid) {
        Toast.error(t("validation.required"));
        return;
      }

      if (newStepIndex > 2) {
        handleSubmit(onSubmit)();
        return;
      }
    } else if (newStepIndex === -1) {
      handleCancel();
      return;
    }

    setStep(newStepIndex);
  };

  const handleCancel = () => {
    Alert.alert(
      t("cancel"),
      "Are you sure you want to cancel? All changes will be lost.",
      [
        {
          text: t("buttons.cancel"),
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => router.back(),
        },
      ],
    );
  };

  const onSubmit = async (formData: SignFormData) => {
    try {
      const updates = {
        customerId: formData.customerId,
        locationTypeId: formData.locationTypeId,
        signId: formData.signId,
        supportId: formData.supportId,
        codeId: formData.codeId,
        height: formData.height,
        facingDirectionId: formData.facingDirectionId,
        faceMaterialId: formData.faceMaterialId,
        reflectiveCoatingId: formData.reflectiveCoatingId,
        reflectiveRatingId: formData.reflectiveRatingId,
        dimensionId: formData.dimensionId,
        // Convert Date to ISO string
        dateInstalled:
          formData.dateInstalled instanceof Date
            ? formData.dateInstalled.toISOString()
            : formData.dateInstalled,
        signConditionId: formData.signConditionId,
        note: formData.note,
      };

      const result = await editSign(id as string, updates);

      if (result.success) {
        Toast.success("Sign updated successfully!");
        router.back();
      } else {
        Toast.error("Failed to update sign");
      }
    } catch (error) {
      console.error("Error updating sign:", error);
      Toast.error("An error occurred while updating the sign");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title={t("signs.edit")} />
      <StepHeader step={step} />
      <View style={styles.content}>
        {step === 0 && <DetailsStep signFormControl={control} />}
        {step === 1 && <LocationStep signFormControl={control} />}
        {step === 2 && (
          <ImageStep signFormControl={control} signId={id as string} />
        )}
      </View>
      <View style={styles.buttonContainer}>
        <ButtonView
          style={styles.button}
          variant="outline"
          onPress={() => handleChangeStep(step - 1)}
        >
          {step > 0 ? t("back") : t("cancel")}
        </ButtonView>
        <ButtonView
          style={styles.button}
          onPress={() => handleChangeStep(step + 1)}
        >
          {step === 2 ? t("buttons.save") : t("next")}
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
    content: {
      flex: 1,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    buttonContainer: {
      backgroundColor: theme.background,
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingBottom: 40,
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    button: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 4,
    },
  });
