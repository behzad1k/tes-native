import React, { useState, useCallback, useEffect, useMemo } from "react";
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
import SignSelectionStep from "./components/SignSelectionStep";
import ImageStep from "./components/ImageStep";
import { ROUTES } from "@/src/constants/navigation";
import {
  SupportFormData,
  getDefaultSupportFormData,
  supportToFormData,
} from "../../types";
import { useForm } from "react-hook-form";
import StepHeader from "./components/StepHeader";
import { useSupportOperations } from "../../hooks/useSupportOperations";
import { Toast } from "toastify-react-native";
import { Support, SupportImage } from "@/src/types/models";
import { useAppSelector } from "@/src/store/hooks";
import TextView from "@/src/components/ui/TextView";

const STEPS = ["details", "location", "signs", "images"] as const;
type StepType = (typeof STEPS)[number];

interface ManageSupportScreenParams {
  id?: string;
  mode?: "create" | "edit";
}

export default function ManageSupportScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<ManageSupportScreenParams>();
  const [step, setStep] = useState<number>(0);
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { createSupport, editSupport } = useSupportOperations();

  const isEditMode = !!id;

  // Get existing support data if editing
  const existingSupport = useAppSelector((state) =>
    state.supports.supports.find((s) => s.id === id),
  );
  // Get customer ID for new supports
  const customerId = useAppSelector(
    (state) => state.auth.user.defaultCustomerId,
  );

  // Local images state — seeded from Redux if editing, only saved on submit
  const [images, setImages] = useState<SupportImage[]>([]);

  // Selected signs for this support (third step)
  const [selectedSignIds, setSelectedSignIds] = useState<string[]>([]);

  // Step labels for indicator
  const stepLabels = useMemo(
    () => [t("details"), t("location"), t("signs.signs"), t("images")],
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
  } = useForm<SupportFormData>({
    defaultValues: isEditMode
      ? supportToFormData(existingSupport)
      : getDefaultSupportFormData(),
    mode: "onChange",
  });
  // Load existing data when editing, or set defaults for creation
  useEffect(() => {
    if (isEditMode && existingSupport) {
      const formData = supportToFormData(existingSupport);
      reset(formData);
      setImages(existingSupport.images || []);

      // Get signs associated with this support
      const supportSignIds = existingSupport.signs?.map((s) => s.id) || [];
      setSelectedSignIds(supportSignIds);
    } else {
      // Creating new support
      reset({
        ...getDefaultSupportFormData(),
        customerId: customerId || "",
        dateInstalled: new Date().toISOString(),
      });
    }
  }, [isEditMode, existingSupport, customerId, reset]);

  // Validate current step before proceeding
  const validateStep = useCallback(
    async (stepIndex: number): Promise<boolean> => {
      const currentStepName = STEPS[stepIndex];

      switch (currentStepName) {
        case "details":
          return await trigger(["id", "conditionId"]);
        case "location":
          return await trigger(["id"]);
        case "signs":
          // Signs are optional
          return true;
        case "images":
          return true;
        default:
          return true;
      }
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

        // Last step (images is step 3, index 3)
        if (newStepIndex > 3) {
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
      ? "Are you sure you want to cancel? All changes will be lost."
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
    async (formData: SupportFormData) => {
      try {
        const supportData: Support = {
          customerId: formData.customerId || customerId || "",
          // locationTypeId: formData.locationTypeId || "",
          locationId: formData.locationId || "",
          latitude: formData.latitude,
          longitude: formData.longitude,
          address: formData.address || "",
          id: formData.id,
          supportCodeId: formData.codeId,
          supportPositionId: formData.positionId || "",
          dateInstalled: formData.dateInstalled || new Date().toISOString(),
          supportConditionId: formData.conditionId,
          note: formData.note || "",
          images,
          signs: selectedSignIds as any,
          isSynced: false,
          supportId: "",
          supportMaterialId: formData.materialId,
          supportTypeId: formData.typeId,
          isNew: false,
          status: "SYNCED",
        };

        let result;

        if (isEditMode && id) {
          result = await editSupport(id, {
            ...supportData,
            id: formData.id,
            supportCodeId: formData.codeId,
            supportPositionId: formData.positionId,
            supportConditionId: formData.conditionId,
            signs: [],
          });
          if (result.success) {
            Toast.success("Support updated successfully!");
            router.back();
          } else {
            Toast.error("Failed to update support");
          }
        } else {
          result = await createSupport(supportData);
          if (result.success) {
            Toast.success("Support created successfully!");
            router.back();
          } else {
            Toast.error("Failed to create support");
          }
        }
      } catch (error) {
        console.error("Error saving support:", error);
        Toast.error(
          isEditMode
            ? "An error occurred while updating the support"
            : "An error occurred while creating the support",
        );
      }
    },
    [
      isEditMode,
      id,
      images,
      selectedSignIds,
      customerId,
      createSupport,
      editSupport,
      router,
    ],
  );

  // Handle not found state for edit mode
  if (isEditMode && !existingSupport) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header title={t("supports.edit")} />
        <View style={styles.errorContainer}>
          <TextView variant="body">Support not found</TextView>
          <ButtonView onPress={() => router.back()}>
            {t("buttons.goBack")}
          </ButtonView>
        </View>
      </SafeAreaView>
    );
  }

  // Determine button labels based on current step
  const isLastStep = step === 3; // images step
  const backButtonLabel = step > 0 ? t("back") : t("cancel");
  const nextButtonLabel = isLastStep ? t("buttons.save") : t("next");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title={isEditMode ? t("signs.editSupport") : t("signs.addNewSupport")}
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
          <SignSelectionStep
            selectedSignIds={selectedSignIds}
            onSignsChange={setSelectedSignIds}
            supportId={isEditMode ? id : undefined}
          />
        )}
        {step === 3 && (
          <ImageStep
            supportId={getValues().id}
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
          {backButtonLabel}
        </ButtonView>
        <ButtonView
          style={styles.button}
          onPress={() => handleChangeStep(step + 1)}
        >
          {nextButtonLabel}
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
      gap: 16,
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
