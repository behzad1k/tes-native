import React, { useState, useCallback, useEffect, useMemo } from "react";
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
import {
  SignFormData,
  getDefaultSignFormData,
  signToFormData,
} from "../../types";
import { useForm } from "react-hook-form";
import StepHeader from "./components/StepHeader";
import { useSignOperations } from "../../hooks/useSignOperations";
import { Toast } from "toastify-react-native";
import { SignImage } from "@/src/types/models";
import { scale } from "@/src/styles/theme/spacing";
import { useAppSelector } from "@/src/store/hooks";
import { v4 as uuidv4 } from "uuid";
import { useRouteInfo } from "expo-router/build/hooks";

const STEPS = ["details", "location", "images"] as const;
type StepType = (typeof STEPS)[number];

interface ManageSignScreenParams {
  id?: string;
  mode?: "create" | "edit";
  preselectedSupportId?: string;
}

export default function ManageSignScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<ManageSignScreenParams>();
  const { params } = useRouteInfo();
  const [step, setStep] = useState<number>(0);
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { createSign, editSign } = useSignOperations();
  const isEditMode = !!id;
  const preselectedSupportId = params?.preselectedSupportId?.toString();
  // Get existing sign data if editing
  const existingSign = useAppSelector((state) =>
    state.signs.signs.find((s) => s.id === id),
  );
  // Get customer ID for new signs
  const customerId = useAppSelector(
    (state) => state.auth.user.defaultCustomerId,
  );

  // Local images state — seeded from Redux if editing, only saved on submit
  const [images, setImages] = useState<SignImage[]>([]);

  // Step labels for indicator
  const stepLabels = useMemo(
    () => [t("signs.details"), t("signs.location"), t("signs.images")],
    [t],
  );

  // Form setup with default values
  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
    reset,
    setValue,
  } = useForm<SignFormData>({
    defaultValues: isEditMode
      ? signToFormData(existingSign)
      : getDefaultSignFormData(),
    mode: "onChange",
  });
  // Load existing data when editing, or set defaults for creation
  useEffect(() => {
    if (isEditMode && existingSign) {
      const formData = signToFormData(existingSign);
      reset(formData);
      setImages(existingSign.images || []);
    } else {
      // Creating new sign
      reset({
        ...getDefaultSignFormData(),
        signId: uuidv4(),
        customerId: customerId || "",
        dateInstalled: new Date().toISOString(),
      });
    }

    // Pre-select support if provided
    if (preselectedSupportId) {
      setValue("supportId", preselectedSupportId);
    }
  }, [
    isEditMode,
    existingSign,
    preselectedSupportId,
    customerId,
    reset,
    setValue,
  ]);

  // Validate current step before proceeding
  const validateStep = useCallback(
    async (stepIndex: number): Promise<boolean> => {
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
    },
    [trigger],
  );
  const handleChangeStep = useCallback(
    async (newStepIndex: number) => {
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
    },
    [step, validateStep, t, handleSubmit],
  );

  const handleCancel = useCallback(() => {
    const message = isEditMode
      ? "Are you sure you want to discard changes?"
      : "Are you sure you want to cancel? All changes will be lost.";

    Alert.alert(t("cancel"), message, [
      { text: t("buttons.cancel"), style: "cancel" },
      {
        text: "Yes",
        onPress: () => {
          if (isEditMode) {
            router.back();
          } else {
            router.navigate(ROUTES.SIGNS_LIST);
          }
        },
      },
    ]);
  }, [isEditMode, router, t]);

  const onSubmit = useCallback(
    async (formData: SignFormData) => {
      try {
        const signData = {
          customerId: formData.customerId || customerId || "",
          locationTypeId: formData.locationTypeId || "",
          latitude: formData.latitude,
          longitude: formData.longitude,
          address: formData.address || "",
          signId: formData.signId,
          supportId: formData.supportId || "",
          height: formData.height || "",
          facingDirectionId: formData.facingDirectionId || "",
          faceMaterialId: formData.faceMaterialId || "",
          reflectiveCoatingId: formData.reflectiveCoatingId || "",
          reflectiveRatingId: formData.reflectiveRatingId || "",
          dimensionId: formData.dimensionId,
          dateInstalled: formData.dateInstalled || new Date().toISOString(),
          conditionId: formData.conditionId,
          note: formData.note || "",
          images,
          isSynced: false,
          signCodeId: formData.signCodeId || "",
        };

        let result;

        if (isEditMode && id) {
          result = await editSign(id, signData);
          if (result.success) {
            Toast.success("Sign updated successfully!");
            router.back();
          } else {
            Toast.error("Failed to update sign");
          }
        } else {
          result = await createSign(signData);
          if (result.success) {
            Toast.success("Sign created successfully!");
            router.back();
          } else {
            Toast.error("Failed to create sign");
          }
        }
      } catch (error) {
        console.error("Error saving sign:", error);
        Toast.error(
          isEditMode
            ? "An error occurred while updating the sign"
            : "An error occurred while creating the sign",
        );
      }
    },
    [isEditMode, id, images, customerId, createSign, editSign, router],
  );

  // Handle not found state for edit mode
  if (isEditMode && !existingSign) {
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title={isEditMode ? t("signs.editSign") : t("signs.addNewSign")}
      />
      <StepHeader step={step} />
      <View style={styles.content}>
        {step === 0 && (
          <DetailsStep
            control={control}
            errors={errors}
            trigger={trigger}
            getValues={getValues}
          />
        )}
        {step === 1 && (
          <LocationStep
            control={control}
            errors={errors}
            trigger={trigger}
            getValues={getValues}
          />
        )}
        {step === 2 && (
          <ImageStep
            signId={isEditMode ? id! : getValues().signId}
            images={images}
            onImagesChange={setImages}
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
