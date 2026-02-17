import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from "react-native";
import { useForm } from "react-hook-form";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import TextView from "@/src/components/ui/TextView";
import ButtonView from "@/src/components/ui/ButtonView";
import { Header } from "@/src/components/layouts/Header";
import {
  CollisionFormData,
  collisionToFormData,
  formDataToCollision,
  isCollisionValid,
  getValidationErrors,
} from "../../types";
import { Collision } from "@/src/types/models";
import { SYNC_STATUS } from "@/src/constants/global";
import {
  useCollisionOperations,
  useCollisionDraft,
} from "../../hooks/useCollisionOperations";
import { useAppSelector } from "@/src/store/hooks";
import { colors } from "@/src/styles/theme/colors";
import {
  CaretLeft,
  CaretRight,
  FloppyDisk,
  Trash,
} from "phosphor-react-native";
import { v4 as uuidv4 } from "uuid";

// Step Components
import StepHeader from "./components/StepHeader";
import GeneralStep from "./components/GeneralStep";
import RoadsStep from "./components/RoadsStep";
import VehiclesStep from "./components/VehiclesStep";
import PeopleStep from "./components/PeopleStep";
import PicturesStep from "./components/PicturesStep";
import RemarksStep from "./components/RemarksStep";
import ReviewStep from "./components/ReviewStep";
import { ROUTES } from "@/src/constants/navigation";
import { useRouter } from "expo-router";

// Step names for the header
const STEPS = [
  "general",
  "roads",
  "vehicles",
  "people",
  "pictures",
  "remarks",
  "review",
];

interface RouteParams {
  collisionId?: string;
  mode?: "create" | "edit" | "view";
}

const ManageCollisionScreen = () => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const router = useRouter();
  const params = (route.params as RouteParams) || {};

  const { collisionId, mode = "create" } = params;
  const isEditing = mode === "edit" && !!collisionId;
  const isViewing = mode === "view";

  // Redux state and operations
  const { createCollision, editCollision, deleteCollision } =
    useCollisionOperations();
  const { draft, saveDraft, clearDraft } = useCollisionDraft();
  const divisions = useAppSelector((state) => state.collision.divisions);

  // Get existing collision if editing
  const existingCollision = useAppSelector((state) =>
    collisionId
      ? state.collision.collisions.find((c) => c.id === collisionId)
      : undefined,
  );

  // Current step state
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form setup
  const defaultValues = useMemo(() => {
    if (isEditing && existingCollision) {
      return collisionToFormData(existingCollision);
    }
    if (draft && !isEditing) {
      return draft;
    }
    return {
      general: {},
      roads: [],
      vehicles: [],
      persons: [],
      images: [],
      remark: {},
      mapLocation: undefined,
      divisionId: divisions[0]?.id,
    };
  }, [isEditing, existingCollision, draft, divisions]);

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    watch,
    reset,
    trigger,
    formState: { errors, isDirty },
  } = useForm<CollisionFormData>({
    defaultValues,
    mode: "onChange",
  });

  // Watch for changes to save draft
  const formValues = watch();

  // Save draft on changes (debounced)
  useEffect(() => {
    if (!isEditing && !isViewing && isDirty) {
      const timer = setTimeout(() => {
        saveDraft({
          ...formValues,
          isDraft: true,
          isSynced: false,
          status: 0,
          syncStatus: "SYNCED",
          isNew: false,
          submissionDT: "",
          mapLocation: undefined,
        });
        setHasUnsavedChanges(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formValues, isEditing, isViewing, isDirty, saveDraft]);

  // Handle back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (hasUnsavedChanges && !isViewing) {
          Alert.alert(t("warning"), t("collision.unsavedChangesWarning"), [
            { text: t("cancel"), style: "cancel" },
            {
              text: t("discard"),
              style: "destructive",
              onPress: () => {
                if (!isEditing) {
                  clearDraft();
                }
                navigation.goBack();
              },
            },
            {
              text: t("save"),
              onPress: () => {
                saveDraft({
                  ...getValues(),
                  isDraft: true,
                  isSynced: false,
                  status: 0,
                  syncStatus: "SYNCED",
                  isNew: false,
                  submissionDT: "",
                  mapLocation: undefined,
                });
                navigation.goBack();
              },
            },
          ]);
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, [
      hasUnsavedChanges,
      isViewing,
      isEditing,
      navigation,
      t,
      clearDraft,
      saveDraft,
      getValues,
    ]),
  );

  // Navigate between steps
  const goToStep = (step: number) => {
    if (step >= 0 && step < STEPS.length) {
      setCurrentStep(step);
    }
  };

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push(ROUTES.COLLISION_LIST);
    }
  };

  // Handle form submission
  const onSubmit = async (data: CollisionFormData) => {
    setIsSubmitting(true);

    try {
      // Validate form
      if (!isCollisionValid(data)) {
        const validationErrors = getValidationErrors(data);
        Alert.alert(t("error"), Object.values(validationErrors).join("\n"));
        setIsSubmitting(false);
        return;
      }

      // Transform form data to collision object
      const collisionData = formDataToCollision(data, existingCollision);

      if (isEditing && existingCollision) {
        // Update existing collision
        const updatedCollision: Collision = {
          ...existingCollision,
          ...collisionData,
          syncStatus: SYNC_STATUS.NOT_SYNCED,
          // updatedAt: new Date().toISOString(),
        };
        await editCollision(existingCollision.id, {
          ...updatedCollision,
          latitude: updatedCollision.mapLocation.latitude,
          longitude: updatedCollision.mapLocation.longitude,
        });
        Alert.alert(t("success"), t("collision.updateSuccess"), [
          { text: t("ok"), onPress: () => navigation.goBack() },
        ]);
      } else {
        // Create new collision
        const newCollision: Collision = {
          id: uuidv4(),
          ...collisionData,
          syncStatus: SYNC_STATUS.NOT_SYNCED,
          isNew: false,
          isSynced: false,
        };
        await createCollision({
          ...newCollision,
          latitude: newCollision.mapLocation.latitude,
          longitude: newCollision.mapLocation.longitude,
        });
        clearDraft();
        Alert.alert(t("success"), t("collision.createSuccess"), [
          { text: t("ok"), onPress: () => navigation.goBack() },
        ]);
      }

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Submit error:", error);
      Alert.alert(t("error"), t("collision.submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (!existingCollision) return;

    Alert.alert(t("warning"), t("collision.confirmDelete"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCollision(existingCollision.id);
            navigation.goBack();
          } catch (error) {
            console.error("Delete error:", error);
            Alert.alert(t("error"), t("collision.deleteError"));
          }
        },
      },
    ]);
  };

  // Render current step
  const renderStep = () => {
    const stepProps = {
      control,
      errors,
      getValues,
      setValue,
    };

    switch (currentStep) {
      case 0:
        return <GeneralStep trigger={trigger} {...stepProps} />;
      case 1:
        return <RoadsStep {...stepProps} />;
      case 2:
        return <VehiclesStep {...stepProps} />;
      case 3:
        return <PeopleStep {...stepProps} />;
      case 4:
        return (
          <PicturesStep
            {...stepProps}
            collisionId={collisionId}
            isEditing={isEditing}
          />
        );
      case 5:
        return <RemarksStep {...stepProps} />;
      case 6:
        return (
          <ReviewStep
            getValues={getValues}
            onEditStep={goToStep}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  // Get step title
  const getStepTitle = () => {
    if (isViewing) return t("collision.viewCollision");
    if (isEditing) return t("collision.editCollision");
    return t("collision.newCollision");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title={getStepTitle()}
        // onBackPress={() => {
        //   if (hasUnsavedChanges && !isViewing) {
        //     Alert.alert(t("warning"), t("collision.unsavedChangesWarning"), [
        //       { text: t("cancel"), style: "cancel" },
        //       {
        //         text: t("discard"),
        //         style: "destructive",
        //         onPress: () => {
        //           if (!isEditing) clearDraft();
        //           navigation.goBack();
        //         },
        //       },
        //     ]);
        //   } else {
        //     navigation.goBack();
        //   }
        // }}
        // rightIcons={
        //   isEditing && !isViewing
        //     ? [
        //         {
        //           icon: <Trash size={20} color={colors.error} />,
        //           onPress: handleDelete,
        //         },
        //       ]
        //     : undefined
        // }
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Step Header */}
        <StepHeader step={currentStep} />

        {/* Step Content */}
        <View style={styles.stepContent}>{renderStep()}</View>

        {/* Navigation Buttons */}
        {!isViewing && (
          <View style={styles.navigationContainer}>
            <View style={styles.navigationButtons}>
              {currentStep > 0 ? (
                <ButtonView
                  variant="outline"
                  onPress={goPrevious}
                  style={styles.navButton}
                >
                  <CaretLeft size={20} color={colors.lightGreen} />
                  <TextView style={styles.navButtonText}>
                    {t("previous")}
                  </TextView>
                </ButtonView>
              ) : (
                <ButtonView
                  variant="outline"
                  onPress={goPrevious}
                  style={styles.navButton}
                >
                  <CaretLeft size={20} color={colors.lightGreen} />
                  <TextView style={styles.navButtonText}>
                    {t("cancel")}
                  </TextView>
                </ButtonView>
              )}

              <View style={styles.navSpacer} />

              {currentStep < STEPS.length - 1 ? (
                <ButtonView
                  variant="primary"
                  onPress={goNext}
                  style={styles.navButton}
                >
                  <TextView style={styles.navButtonTextWhite}>
                    {t("next")}
                  </TextView>
                  <CaretRight size={20} color={colors.white} />
                </ButtonView>
              ) : (
                <ButtonView
                  variant="primary"
                  onPress={handleSubmit(onSubmit)}
                  style={styles.submitButton}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  <FloppyDisk size={20} color={colors.white} />
                  <TextView style={styles.submitButtonText}>
                    {isEditing ? t("update") : t("submit")}
                  </TextView>
                </ButtonView>
              )}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      flex: 1,
    },
    stepContent: {
      flex: 1,
    },
    navigationContainer: {
      backgroundColor: theme.background,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      paddingBottom: Platform.OS === "ios" ? spacing.lg : spacing.sm,
    },
    navigationButtons: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xxs,
    },
    navButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      flex: 1,
    },
    navButtonText: {
      color: colors.lightGreen,
      fontWeight: "600",
    },
    navButtonTextWhite: {
      color: colors.white,
      fontWeight: "600",
    },
    navSpacer: {
      flex: 1,
    },
    submitButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
    },
    submitButtonText: {
      color: colors.white,
      fontWeight: "600",
    },
  });

export default ManageCollisionScreen;
