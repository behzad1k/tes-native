import React, { useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { Header } from "@/src/components/layouts/Header";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import DetailsStep from "./components/DetailsStep";
import ButtonView from "@/src/components/ui/ButtonView";
import LocationStep from "./components/LocationStep";
import { ROUTES } from "@/src/constants/navigation";
import ImageStep from "./components/ImageStep";
import { SignFormData } from "../../types";
import { useForm } from "react-hook-form";
import StepHeader from "./components/StepHeader";
import { useSignOperations } from "../../hooks/useSignOperations";
import { Toast } from "toastify-react-native";
import { SignImage } from "@/src/types/models";
import { scale } from "@/src/styles/theme/spacing";
import { useAppSelector } from "@/src/store/hooks";

export default function EditSignScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [step, setStep] = useState<number>(0);
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { editSign } = useSignOperations();

  // Read sign from Redux (persisted store)
  const sign = useAppSelector((state) =>
    state.signs.signs.find((s) => s.id === id),
  );

  // Local images state — seeded from Redux, only saved on submit
  const [images, setImages] = useState<SignImage[]>(sign?.images || []);

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
  } = useForm<SignFormData>({
    defaultValues: {
      customerId: sign?.customerId || "",
      locationTypeId: sign?.locationTypeId || "",
      latitude: sign?.latitude,
      longitude: sign?.longitude,
      address: sign?.address || "",
      signId: sign?.signId || "",
      supportId: sign?.supportId || "",
      codeId: sign?.codeId || "",
      height: sign?.height || "",
      facingDirectionId: sign?.facingDirectionId || "",
      faceMaterialId: sign?.faceMaterialId || "",
      reflectiveCoatingId: sign?.reflectiveCoatingId || "",
      reflectiveRatingId: sign?.reflectiveRatingId || "",
      dimensionId: sign?.dimensionId || "",
      dateInstalled: sign?.dateInstalled || new Date().toISOString(),
      conditionId: sign?.conditionId || "",
      note: sign?.note || "",
    },
    mode: "onChange",
  });

  if (!sign) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header title={t("signs.editSign")} />
        <View style={styles.notFound}>
          <ButtonView onPress={() => router.back()}>
            {t("buttons.goBack")}
          </ButtonView>
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
          "conditionId",
        ];
        break;
      case 1:
        fieldsToValidate = ["supportId", "locationTypeId"];
        break;
      case 2:
        return true;
    }

    return trigger(fieldsToValidate);
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
    Alert.alert(t("cancel"), "Are you sure you want to discard changes?", [
      { text: t("buttons.cancel"), style: "cancel" },
      { text: "Yes", onPress: () => router.back() },
    ]);
  };

  const onSubmit = async (formData: SignFormData) => {
    try {
      // Both form fields AND images are saved together on submit
      const result = await editSign(id!, {
        customerId: formData.customerId || "",
        locationTypeId: formData.locationTypeId || "",
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address || "",
        signId: formData.signId,
        supportId: formData.supportId || "",
        codeId: formData.codeId,
        height: formData.height || "",
        facingDirectionId: formData.facingDirectionId || "",
        faceMaterialId: formData.faceMaterialId || "",
        reflectiveCoatingId: formData.reflectiveCoatingId || "",
        reflectiveRatingId: formData.reflectiveRatingId || "",
        dimensionId: formData.dimensionId,
        dateInstalled: formData.dateInstalled || new Date().toISOString(),
        conditionId: formData.conditionId,
        note: formData.note || "",
        images, // ← local state, dispatched to Redux only now
      });

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
      <Header title={t("signs.editSign")} />
      <StepHeader step={step} />
      <View style={styles.content}>
        {step === 0 && <DetailsStep signFormControl={control} />}
        {step === 1 && (
          <LocationStep
            control={control}
            errors={errors}
            trigger={trigger}
            getValues={getValues}
          />
        )}
        {step === 2 && (
          <ImageStep signId={id!} images={images} onImagesChange={setImages} />
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
      paddingBottom: scale(100),
    },
    notFound: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
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
