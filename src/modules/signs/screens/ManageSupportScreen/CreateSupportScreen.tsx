import React, { useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
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
import { SupportFormData } from "../../types";
import { useForm } from "react-hook-form";
import StepHeader from "./components/StepHeader";
import { useSupportOperations } from "../../hooks/useSupportOperations";
import { Toast } from "toastify-react-native";
import { Support, SupportImage } from "@/src/types/models";

export default function CreateSupportScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState<number>(0);
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { createSupport } = useSupportOperations();

  // Store images temporarily before support is created
  const [tempImages, setTempImages] = useState<SupportImage[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    trigger,
    getValues,
  } = useForm<SupportFormData>({
    defaultValues: {
      id: "",
      customerId: "",
      supportLocationTypeId: "",
      locationId: "",
      latitude: 0,
      longitude: 0,
      supportId: "",
      codeId: "",
      positionId: "",
      conditionId: "",
      note: "",
      dateInstalled: "",
      images: [],
      isNew: true,
      isSynced: false,
    },
    mode: "onChange",
  });

  const validateStep = async (stepIndex: number): Promise<boolean> => {
    let fieldsToValidate: (keyof SupportFormData)[] = [];

    switch (stepIndex) {
      case 0: // Details step
        fieldsToValidate = ["supportId", "conditionId"];
        break;
      case 1: // Location step
        fieldsToValidate = ["supportId"];
        break;
      case 2: // Image step - no validation needed
        return true;
    }

    const result = await trigger(fieldsToValidate);
    return result;
  };

  const handleChangeStep = async (newStepIndex: number) => {
    if (newStepIndex > step) {
      // Validate current step before proceeding
      const isValid = await validateStep(step);
      if (!isValid) {
        Toast.error(t("validation.required"));
        return;
      }

      if (newStepIndex > 2) {
        // Submit the form
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
          onPress: () => router.navigate(ROUTES.SIGNS_LIST),
        },
      ],
    );
  };

  const onSubmit = async (formData: SupportFormData) => {
    try {
      const supportData = {
        customerId: formData.customerId,
        supportId: formData.supportId,
        dateInstalled: formData.dateInstalled,
        conditionId: formData.conditionId,
        note: formData.note,
        images: formData.images,
        id: formData.id,
        supportLocationTypeId: formData.supportLocationTypeId,
        locationId: formData.locationId,
        latitude: formData.latitude,
        longitude: formData.longitude,
        codeId: formData.codeId,
        positionId: formData.positionId,
        supports: [],
        isNew: false,
        isSynced: false,
        signs: [],
      };

      const result = await createSupport(supportData);

      if (result.success) {
        Toast.success("Support created successfully!");
        router.back();
      } else {
        Toast.error("Failed to create support");
      }
    } catch (error) {
      console.error("Error creating support:", error);
      Toast.error("An error occurred while creating the support");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title={t("signs.addNewSupport")} />
      <StepHeader step={step} />
      <View style={styles.content}>
        {step === 0 && <DetailsStep supportFormControl={control} />}
        {step === 1 && <LocationStep supportFormControl={control} />}
        {step === 2 && (
          <ImageStep
            supportFormControl={control}
            tempImages={tempImages}
            setTempImages={setTempImages}
            isCreateMode={true}
          />
        )}
        {step === 3 && (
          <ImageStep
            supportFormControl={control}
            tempImages={tempImages}
            setTempImages={setTempImages}
            isCreateMode={true}
          />
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
